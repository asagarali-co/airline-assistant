# FlightAI frontend

A responsive Next.js travel assistant with an ivory and forest green interface, destination prompts, saved conversations, and a working FastAPI chat connection.

## Run locally

Start the backend on port 8000, then in this folder:

```sh
npm install
npm run dev
```

Open http://localhost:3000. The server-side `/api/chat` route forwards messages and conversation history to the backend, avoiding browser CORS configuration. To change the backend address, copy `.env.example` to `.env.local` and edit `BACKEND_URL`.

Conversations are saved in this browser's local storage. Destination photos are loaded from Unsplash and require an internet connection. The interface uses system fonts and has no font download requirement.

## Checks

```sh
npm run lint
npx tsc --noEmit
npm run build
```

If Turbopack is unavailable in your environment, use `npm run build -- --webpack`.
