import json

from ..tools.prices import get_ticket_price
from ..tools.travel_data import get_destination_profile, get_destination_weather


def handle_tool_calls(message):
    responses = []
    for tool_call in message.tool_calls or []:
        content = "Unknown tool."
        name = tool_call.function.name
        if name == "get_ticket_price":
            try:
                arguments = json.loads(tool_call.function.arguments)
                city = arguments.get("destination_city") if isinstance(arguments, dict) else None
                content = get_ticket_price(city.strip()) if isinstance(city, str) and city.strip() else "Please provide a destination city."
            except (ValueError, TypeError):
                content = "Invalid tool arguments. Please provide a destination city."
        elif name == "get_destination_weather":
            try:
                arguments = json.loads(tool_call.function.arguments)
                place = arguments.get("place") if isinstance(arguments, dict) else None
                days = arguments.get("days", 5) if isinstance(arguments, dict) else 5
                content = get_destination_weather(place.strip(), days) if isinstance(place, str) and place.strip() else "Please provide a destination."
            except (ValueError, TypeError):
                content = "Invalid tool arguments. Please provide a destination."
        elif name == "get_destination_profile":
            try:
                arguments = json.loads(tool_call.function.arguments)
                place = arguments.get("place") if isinstance(arguments, dict) else None
                content = get_destination_profile(place.strip()) if isinstance(place, str) and place.strip() else "Please provide a destination."
            except (ValueError, TypeError):
                content = "Invalid tool arguments. Please provide a destination."
        responses.append({"role": "tool", "content": content, "tool_call_id": tool_call.id})
    return responses
