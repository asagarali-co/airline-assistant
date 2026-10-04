price_function = {

    "name": "get_ticket_price",

    "description": (
        "Get the price of a return ticket "
        "to the destination city."
    ),

    "parameters": {

        "type": "object",

        "properties": {

            "destination_city": {

                "type": "string",

                "description": (
                    "The city that the customer "
                    "wants to travel to"
                )
            }
        },

        "required": [
            "destination_city"
        ],

        "additionalProperties": False
    }
}


weather_function = {
    "name": "get_destination_weather",
    "description": "Get a live 1 to 7 day weather forecast for a destination city or place.",
    "parameters": {
        "type": "object",
        "properties": {
            "place": {
                "type": "string",
                "description": "The destination city or place, such as Tokyo or Paris.",
            },
            "days": {
                "type": "integer",
                "description": "How many forecast days to return, from 1 to 7.",
                "minimum": 1,
                "maximum": 7,
            },
        },
        "required": ["place"],
        "additionalProperties": False,
    },
}


profile_function = {
    "name": "get_destination_profile",
    "description": "Get live destination facts such as country, currency, languages, time zones, and basic local context.",
    "parameters": {
        "type": "object",
        "properties": {
            "place": {
                "type": "string",
                "description": "The destination city or place, such as Bali, London, or Sydney.",
            }
        },
        "required": ["place"],
        "additionalProperties": False,
    },
}


tools = [

    {
        "type": "function",

        "function": price_function
    },
    {
        "type": "function",
        "function": weather_function,
    },
    {
        "type": "function",
        "function": profile_function,
    },

]
