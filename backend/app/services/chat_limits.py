"""Persistent, atomic daily quotas for anonymous chat requests."""
import os
import sqlite3
from datetime import datetime, timedelta, timezone

from ..database import DB


def _limit(name, default):
    try:
        return max(1, int(os.getenv(name, str(default))))
    except ValueError:
        return default


def usage(visitor, reserve=False):
    now = datetime.now(timezone.utc)
    day = now.date().isoformat()
    reset = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    daily_limit = _limit("CHAT_DAILY_LIMIT", 20)
    site_limit = _limit("CHAT_SITE_DAILY_LIMIT", 200)
    with sqlite3.connect(DB, timeout=10) as conn:
        conn.execute("CREATE TABLE IF NOT EXISTS chat_usage (day TEXT, visitor TEXT, count INTEGER NOT NULL, PRIMARY KEY(day, visitor))")
        conn.execute("BEGIN IMMEDIATE")
        conn.execute("DELETE FROM chat_usage WHERE day < ?", (day,))
        row = conn.execute("SELECT count FROM chat_usage WHERE day = ? AND visitor = ?", (day, visitor)).fetchone()
        used = row[0] if row else 0
        total = conn.execute("SELECT COALESCE(SUM(count), 0) FROM chat_usage WHERE day = ?", (day,)).fetchone()[0]
        allowed = used < daily_limit and total < site_limit
        if reserve and allowed:
            conn.execute("INSERT INTO chat_usage VALUES (?, ?, 1) ON CONFLICT(day, visitor) DO UPDATE SET count = count + 1", (day, visitor))
            used += 1
            total += 1
        return {"limit": daily_limit, "remaining": max(0, min(daily_limit - used, site_limit - total)), "resetsAt": reset, "allowed": allowed}
