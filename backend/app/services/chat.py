from ..llm import get_client
from ..config import MODEL
from ..prompts import system_message
from ..tools.definitions import tools
from .tool_handler import handle_tool_calls


def chat(message, history):
    client = get_client()
    messages = [{"role": "system", "content": system_message}]
    messages.extend({"role": h.role, "content": h.content} for h in history)
    messages.append({"role": "user", "content": message})

    # Limit tool rounds so a repeated provider tool call cannot hang a request.
    for round_number in range(3):
        response = client.chat.completions.create(
            model=MODEL, messages=messages, tools=tools,
            tool_choice="none" if round_number == 2 else "auto",
        )
        if not response.choices:
            raise ValueError("The assistant returned no answer.")
        reply = response.choices[0].message
        if reply.tool_calls:
            messages.append(reply.model_dump(exclude_none=True))
            messages.extend(handle_tool_calls(reply))
            continue
        if reply.content and reply.content.strip():
            return reply.content
        raise ValueError("The assistant returned an empty answer.")
    raise ValueError("The assistant could not complete the request.")
