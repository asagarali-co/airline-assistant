import json
from datetime import date, timedelta
from urllib.parse import urlencode, quote
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError


USER_AGENT = "FlightAI travel companion/1.0"
TIMEOUT_SECONDS = 12


WEATHER_CODES = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}


def _fetch_json(url):
    request = Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        return {"error": f"Provider returned HTTP {exc.code}."}
    except (URLError, TimeoutError, ValueError):
        return {"error": "Live travel data is unavailable right now."}


def _place_from_query(place):
    params = urlencode({"name": place, "count": 1, "language": "en", "format": "json"})
    data = _fetch_json(f"https://geocoding-api.open-meteo.com/v1/search?{params}")
    if data.get("error"):
        return data
    results = data.get("results") or []
    if not results:
        return {"error": f"No live location match found for {place}."}
    match = results[0]
    return {
        "name": match.get("name"),
        "country": match.get("country"),
        "country_code": match.get("country_code"),
        "admin1": match.get("admin1"),
        "latitude": match.get("latitude"),
        "longitude": match.get("longitude"),
        "timezone": match.get("timezone"),
        "population": match.get("population"),
        "source": "Open-Meteo Geocoding",
    }


def get_destination_weather(place, days=5):
    location = _place_from_query(place)
    if location.get("error"):
        return json.dumps(location)

    safe_days = max(1, min(int(days or 5), 7))
    start = date.today()
    end = start + timedelta(days=safe_days - 1)
    params = urlencode(
        {
            "latitude": location["latitude"],
            "longitude": location["longitude"],
            "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
            "timezone": "auto",
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
        }
    )
    forecast = _fetch_json(f"https://api.open-meteo.com/v1/forecast?{params}")
    if forecast.get("error"):
        return json.dumps(forecast)

    daily = forecast.get("daily") or {}
    rows = []
    for index, day in enumerate(daily.get("time") or []):
        code = (daily.get("weather_code") or [None])[index]
        rows.append(
            {
                "date": day,
                "condition": WEATHER_CODES.get(code, f"Weather code {code}"),
                "high_c": (daily.get("temperature_2m_max") or [None])[index],
                "low_c": (daily.get("temperature_2m_min") or [None])[index],
                "precipitation_probability_percent": (daily.get("precipitation_probability_max") or [None])[index],
            }
        )

    return json.dumps(
        {
            "location": location,
            "forecast": rows,
            "source": "Open-Meteo Forecast",
            "retrieved_date": start.isoformat(),
        }
    )


def get_destination_profile(place):
    location = _place_from_query(place)
    if location.get("error"):
        return json.dumps(location)

    country_code = location.get("country_code")
    country = {}
    if country_code:
        item = _fetch_json(f"https://countries.dev/alpha/{quote(country_code)}")
        if isinstance(item, dict) and not item.get("error"):
            country = {
                "official_name": item.get("name"),
                "capital": item.get("capital"),
                "region": item.get("region"),
                "subregion": item.get("subregion"),
                "population": item.get("population"),
                "currencies": item.get("currencies") or [],
                "languages": [language.get("name") for language in item.get("languages") or [] if language.get("name")],
                "timezones": item.get("timezones") or [],
                "flag": item.get("flag"),
            }

    return json.dumps(
        {
            "location": location,
            "country": country,
            "sources": ["Open-Meteo Geocoding", "countries.dev"],
        }
    )
