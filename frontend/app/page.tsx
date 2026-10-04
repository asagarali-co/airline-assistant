"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Message = { role: "user" | "assistant"; content: string };
type Conversation = { id: string; title: string; messages: Message[] };
const suggestions = [
  { icon: "↗", title: "Check the trip pulse", text: "Live weather and destination context", prompt: "Give me live travel context for Tokyo this week, including weather, currency, time zone, and anything practical to know." },
  { icon: "◇", title: "Plan around weather", text: "Pack smarter before you book", prompt: "What is the live weather outlook for Paris for the next 5 days, and how should I pack?" },
  { icon: "⌁", title: "Make travel feel effortless", text: "Check-in, connections, and everything between", prompt: "Help me prepare for an international flight, including check-in and connecting flights." },
];

function Plane({ small = false }: { small?: boolean }) {
  return <Image src="/brand/flightai-mark.svg" width={small ? 30 : 38} height={small ? 30 : 38} alt="" aria-hidden="true" />;
}

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [quota, setQuota] = useState<{ limit: number; remaining: number; resetsAt: string } | null>(null);
  const exhausted = quota?.remaining === 0;
  async function refreshQuota() {
    try {
      const response = await fetch("/api/chat", { cache: "no-store" });
      const data = await response.json();
      if (response.ok && typeof data.remaining === "number") setQuota(data);
    } catch { /* The server still enforces the daily quota. */ }
  }
  useEffect(() => {
    const initial = window.setTimeout(() => void refreshQuota(), 0);
    const timer = window.setInterval(() => void refreshQuota(), 60000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, []);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [deleted, setDeleted] = useState<{ conversation: Conversation; index: number } | null>(null);
  const [retry, setRetry] = useState<{ id: string; message: string; history: Message[] } | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const active = conversations.find(c => c.id === activeId);
  const messages = active?.messages ?? [];
  const filteredConversations = conversations.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const timer = window.setTimeout(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("flightai-conversations") || "[]");
      if (Array.isArray(saved)) setConversations(saved.filter(c => c && typeof c.id === "string" && typeof c.title === "string" && Array.isArray(c.messages) && c.messages.every((m: Message) => m && ["user", "assistant"].includes(m.role) && typeof m.content === "string")));
    } catch { /* A fresh workspace is safe when saved data is unavailable. */ }
    setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => { if (ready) { try { localStorage.setItem("flightai-conversations", JSON.stringify(conversations)); } catch { /* Chat still works without storage. */ } } }, [conversations, ready]);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length, loading, error]);

  function newChat() { if (loading) return; setActiveId(null); setError(""); setRetry(null); setInput(""); setMenuOpen(false); textarea.current?.focus(); }
  function renameConversation(id: string) {
    const title = draftTitle.trim();
    if (!title) return;
    setConversations(items => items.map(c => c.id === id ? { ...c, title: title.slice(0, 80) } : c));
    setEditingId(null);
  }
  function deleteConversation(id: string) {
    if (loading) return;
    const index = conversations.findIndex(c => c.id === id);
    if (index < 0) return;
    setDeleted({ conversation: conversations[index], index });
    setConversations(items => items.filter(c => c.id !== id));
    if (activeId === id) newChat();
    setEditingId(null);
  }
  function undoDelete() {
    if (!deleted) return;
    setConversations(items => {
      if (items.some(c => c.id === deleted.conversation.id)) return items;
      const restored = [...items]; restored.splice(deleted.index, 0, deleted.conversation); return restored;
    });
    setDeleted(null);
  }
  async function requestReply(id: string, message: string, history: Message[]) {
    setLoading(true); setError(""); setRetry(null);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, history }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      if (typeof data.response !== "string" || !data.response.trim()) throw new Error("The assistant returned an empty reply. Please try again.");
      setConversations(items => items.map(c => c.id === id ? { ...c, messages: [...c.messages, { role: "assistant", content: data.response }] } : c));
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to connect. Please try again."); setRetry({ id, message, history }); }
    finally { setLoading(false); void refreshQuota(); textarea.current?.focus(); }
  }
  function send(text = input) {
    const message = text.trim(); if (!message || loading || exhausted) return;
    const id = activeId || crypto.randomUUID();
    const history = messages.slice(-100).map(m => ({ ...m, content: m.content.slice(0, 16000) }));
    if (!activeId) { setConversations(items => [{ id, title: message.slice(0, 42), messages: [{ role: "user", content: message }] }, ...items]); setActiveId(id); }
    else setConversations(items => items.map(c => c.id === id ? { ...c, messages: [...c.messages, { role: "user", content: message }] } : c));
    setInput(""); void requestReply(id, message, history);
  }

  return <div className="app-shell">
    <button className="mobile-menu" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>☰</button>
    {menuOpen && <button className="menu-overlay" aria-label="Close navigation" onClick={() => setMenuOpen(false)}/>}
    <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
      <Link className="brand" href="/" aria-label="FlightAI home"><span className="brand-mark"><Plane/></span>Flight<span>AI</span><span className="brand-dot">.</span></Link>
      <div className="workspace-label">YOUR TRAVEL COMPANION</div>
      <button className="new-chat" onClick={newChat} disabled={loading}><span>＋</span> New conversation <span className="shortcut">↗</span></button>
      <div className="nav-title">WORKSPACE</div>
      <button className="nav-item selected" onClick={() => setMenuOpen(false)}><span>✧</span> Travel assistant <span className="active-dot"/></button>
      <div className="history-heading">RECENT CONVERSATIONS <span>{conversations.length.toString().padStart(2, "0")}</span></div>
      <label className="conversation-search"><span aria-hidden="true">⌕</span><input aria-label="Search conversations" placeholder="Search conversations" value={search} onChange={e => setSearch(e.target.value)}/><kbd>⌕</kbd></label>
      <div className="history-list">{conversations.length === 0 ? <p className="history-empty">Your next adventure starts with a conversation.</p> : filteredConversations.length === 0 ? <p className="history-empty">No conversations found.</p> : filteredConversations.map(c => <div className={`history-row ${c.id === activeId ? "current" : ""}`} key={c.id}>{editingId === c.id ? <form className="rename-form" onSubmit={e => { e.preventDefault(); renameConversation(c.id); }}><input autoFocus aria-label="Conversation title" value={draftTitle} maxLength={80} onChange={e => setDraftTitle(e.target.value)} onKeyDown={e => { if (e.key === "Escape") setEditingId(null); }}/><button type="submit" aria-label="Save title" disabled={!draftTitle.trim()}>✓</button><button type="button" aria-label="Cancel rename" onClick={() => setEditingId(null)}>×</button></form> : <><button disabled={loading} className="history-item" onClick={() => { setActiveId(c.id); setError(""); setRetry(null); setMenuOpen(false); }}><span>◌</span><span>{c.title}</span></button><div className="history-actions"><button disabled={loading} aria-label={`Rename ${c.title}`} title="Rename conversation" onClick={() => { setEditingId(c.id); setDraftTitle(c.title); }}>✎</button><button disabled={loading} aria-label={`Delete ${c.title}`} title="Delete conversation" onClick={() => deleteConversation(c.id)}>×</button></div></>}</div>)}</div>
      <div className="sidebar-bottom"><div className="little-note"><span>✦</span><p>A world of possibilities.<br/><strong>One conversation away.</strong></p></div><div className="profile"><div className="avatar">Y</div><div><strong>Your travel space</strong><span>Always ready for takeoff</span></div><span className="profile-spark">✧</span></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><div>Travel assistant <span>/</span> <span className="breadcrumb">{active ? "Your conversation" : "A fresh start"}</span></div><div className="topbar-badge"><span/> Live-data companion</div></header>
      <div className={`content ${messages.length ? "has-chat" : ""}`}>
      {messages.length === 0 ? <>
        <div className="welcome"><div className="eyebrow"><span className="tiny-line"/> THE WORLD, WITHIN REACH</div><h1>Your next chapter.<br/><em>Beautifully planned.</em></h1><p>Ask for weather, currencies, time zones, local basics,<br className="desktop-break"/> and practical planning help before you go.</p></div>
        <div className="suggestions">{suggestions.map(s => <button className="suggestion" key={s.title} onClick={() => send(s.prompt)} disabled={loading || exhausted}><span className="suggestion-icon">{s.icon}</span><strong>{s.title}</strong><p>{s.text}</p><span className="suggestion-arrow">↗</span></button>)}</div>
        <div className="explore-heading"><div><span className="eyebrow">A LITTLE WANDERLUST</span><h2>Somewhere new is calling.</h2></div><span className="explore-caption">Big cities. Beautiful detours.</span></div>
        <div className="destinations">{[
          { city: "Tokyo", country: "JAPAN", tag: "For the endlessly curious", image: "photo-1540959733332-eab4deabeeaf" },
          { city: "Bali", country: "INDONESIA", tag: "Find your slower pace", image: "photo-1537996194471-e657df975ab4" },
          { city: "Paris", country: "FRANCE", tag: "A classic for a reason", image: "photo-1502602898657-3e91760cbb34" },
        ].map(d => <button className={`destination destination-${d.city.toLowerCase()}`} disabled={loading || exhausted} key={d.city} onClick={() => send(`Use live data to help me plan a trip to ${d.city}, ${d.country}. Include weather, currency, time zone, and what I should know before booking.`)} style={{ backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.04) 15%, rgba(0,0,0,.65) 100%), url(https://images.unsplash.com/${d.image}?auto=format&fit=crop&w=800&q=85)` }}><span className="destination-country">{d.country}</span><span className="destination-bottom"><span><strong>{d.city}</strong><span>{d.tag}</span></span><span className="destination-arrow">↗</span></span></button>)}</div>
      </> : <div className="messages" role="log" aria-label="Conversation" aria-live="polite"><div className="conversation-label">YOUR JOURNEY STARTS HERE</div>{messages.map((m, i) => <article className={`message ${m.role}`} key={i}><div className="message-avatar">{m.role === "assistant" ? <Plane small/> : "Y"}</div><div className="message-body"><div className="message-name">{m.role === "assistant" ? "FlightAI" : "You"}{m.role === "assistant" && <span>TRAVEL COMPANION</span>}</div><div className="message-text">{m.content}</div></div></article>)}{loading && <div className="thinking" role="status"><span/><span/><span/> Thinking it through…</div>}<div ref={bottom}/></div>}
      {deleted && <div className="undo-toast" role="status"><span>Conversation deleted</span><button onClick={undoDelete}>Undo</button><button aria-label="Dismiss notification" onClick={() => setDeleted(null)}>×</button></div>}
      {error && <div className="error" role="alert">{error}<button onClick={() => retry && requestReply(retry.id, retry.message, retry.history)} disabled={loading || exhausted}>Try again ↗</button></div>}
      <div className="composer-wrap">{quota && <div className={`quota-status ${exhausted ? "exhausted" : ""}`} role="status">{exhausted ? "Daily chat limit reached. Come back after midnight UTC." : `${quota.remaining} messages remaining today`}<span>Resets at midnight UTC</span></div>}<form className="composer" onSubmit={e => { e.preventDefault(); send(); }}><span className="composer-spark">✧</span><textarea ref={textarea} aria-label="Your travel question" placeholder="Ask about live weather, local basics, packing, flights…" value={input} rows={1} maxLength={8000} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}/><button className="send" aria-label="Send message" disabled={!input.trim() || loading || exhausted} type="submit">{loading ? <span className="spinner"/> : "↑"}</button></form><div className="composer-footer"><span><span className="footer-spark">✦</span> Uses live public data when available.</span><span>Check airline, visa, and government rules before you travel.</span></div></div>
      </div>
      <footer className="page-footer"><span>MADE FOR THE JOURNEY</span><span>✧</span><span>NOT JUST THE DESTINATION</span></footer>
    </main>
  </div>;
}
