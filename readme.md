# FlightAI

AI travel companion with a Next.js frontend and FastAPI backend.

## Deploy the backend on Render

With the repository root as the service root directory:

- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port $PORT`
- Health check path: `/health`

Alternatively, set the root directory to `backend`, use the same build command,
and start with `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.

Set `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`, `DEEPSEEK_MODEL`,
`CHAT_DAILY_LIMIT`, and `CHAT_SITE_DAILY_LIMIT` using `backend/.env.example`.

Set `BACKEND_URL` in the frontend to the deployed backend URL.
Set `NEXT_PUBLIC_SITE_URL` to the frontend's public URL.

## Local development

Backend, from the project root:

```sh
cd backend
../.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Frontend, in a separate terminal:

```sh
cd frontend
npm install
npm run dev
```

Copy the environment examples to `backend/.env` and `frontend/.env.local`,
and fill in your settings before starting.
