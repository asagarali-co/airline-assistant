from fastapi import FastAPI

from fastapi.middleware.cors import (
    CORSMiddleware
)

from .api import router

from .database import init_db

from .tools.prices import seed_prices


app = FastAPI(
    title="FlightAI API",
    version="1.0.0"
)


app.add_middleware(

    CORSMiddleware,

    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]
)


init_db()

seed_prices()


app.include_router(router)