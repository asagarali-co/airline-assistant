import sqlite3

from ..database import DB


def get_ticket_price(city):

    print(
        f"DATABASE TOOL CALLED: Getting price for {city}",
        flush=True
    )

    with sqlite3.connect(DB) as conn:

        cursor = conn.cursor()

        cursor.execute(
            "SELECT price FROM prices WHERE city = ?",
            (city.lower(),)
        )

        result = cursor.fetchone()

        if result:

            return (
                f"Ticket price to {city} is ${result[0]}"
            )

        else:

            return "No price data available for this city"


def set_ticket_price(city, price):

    with sqlite3.connect(DB) as conn:

        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO prices (city, price)
            VALUES (?, ?)
            ON CONFLICT(city)
            DO UPDATE SET price = ?
            """,
            (
                city.lower(),
                price,
                price
            )
        )

        conn.commit()


def seed_prices():

    ticket_prices = {
        "london": 799,
        "paris": 899,
        "tokyo": 1420,
        "sydney": 2999
    }

    with sqlite3.connect(DB) as conn:
        conn.executemany(
            "INSERT OR IGNORE INTO prices (city, price) VALUES (?, ?)",
            ticket_prices.items(),
        )
