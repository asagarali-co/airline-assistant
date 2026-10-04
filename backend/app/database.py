import sqlite3
from .config import BACKEND_DIR

DB = str(BACKEND_DIR / "prices.db")

def init_db():
    with sqlite3.connect(DB) as conn:
        cursor = conn.cursor()

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS prices (
                city TEXT PRIMARY KEY,
                price REAL
            )
            """
        )

        conn.commit()