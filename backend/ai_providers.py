import os
import logging
import requests
from typing import List, Dict, Optional

XAI_API_KEY = os.getenv("XAI_API_KEY") or os.getenv("XAI_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY") or os.getenv("CLAUDE_API_KEY")

XAI_MODEL = os.getenv("XAI_MODEL", "grok-2-latest")
CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-3-5-sonnet-20241022")

# Provider order: xAI -> Claude
PROVIDER_ORDER = (os.getenv("AI_PROVIDER_ORDER") or "xai,claude").split(",")


def _format_openai_style_messages_for_xai(messages: List[Dict]) -> List[Dict]:
    # xAI supports OpenAI Chat Completions style directly
    return messages


def _format_openai_style_messages_for_claude(messages: List[Dict]) -> Dict:
    # Convert OpenAI-style to Anthropic messages format
    # Anthropic expects: {system: str, messages: [{role:"user"|"assistant", content:[{type:"text", text:"..."}]}]}
    system_msg = ""
    claude_messages = []
    for m in messages:
        role = m.get("role")
        content = m.get("content", "")
        if role == "system":
            system_msg = f"{system_msg}\n{content}".strip()
            continue
        if role not in ("user", "assistant"):
            # Map unknown roles to user
            role = "user"
        claude_messages.append({
            "role": role,
            "content": [{"type": "text", "text": content}],
        })
    return {"system": system_msg, "messages": claude_messages}


def call_xai(messages: List[Dict], max_tokens: int = 1200, temperature: float = 0.8) -> Optional[str]:
    if not XAI_API_KEY:
        return None
    try:
        payload = {
            "model": XAI_MODEL,
            "messages": _format_openai_style_messages_for_xai(messages),
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        resp = requests.post(
            "https://api.x.ai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {XAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=60,
        )
        if resp.status_code != 200:
            logging.warning(f"xAI error {resp.status_code}: {resp.text[:200]}")
            return None
        data = resp.json()
        # OpenAI-style response
        content = data.get("choices", [{}])[0].get("message", {}).get("content")
        return content
    except Exception as e:
        logging.exception(f"xAI request failed: {e}")
        return None


def call_claude(messages: List[Dict], max_tokens: int = 1200, temperature: float = 0.8) -> Optional[str]:
    if not ANTHROPIC_API_KEY:
        return None
    try:
        converted = _format_openai_style_messages_for_claude(messages)
        payload = {
            "model": CLAUDE_MODEL,
            "max_tokens": max_tokens,
            "temperature": temperature,
            **converted,
        }
        resp = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json=payload,
            timeout=60,
        )
        if resp.status_code != 200:
            logging.warning(f"Claude error {resp.status_code}: {resp.text[:200]}")
            return None
        data = resp.json()
        # Anthropic messages API returns content as list blocks
        blocks = data.get("content", [])
        text_parts = []
        for b in blocks:
            if isinstance(b, dict) and b.get("type") == "text":
                text_parts.append(b.get("text", ""))
        return "\n".join(t for t in text_parts if t)
    except Exception as e:
        logging.exception(f"Claude request failed: {e}")
        return None


def ai_complete(messages: List[Dict], max_tokens: int = 1200, temperature: float = 0.8) -> Optional[str]:
    for provider in [p.strip() for p in PROVIDER_ORDER]:
        if provider == "xai":
            out = call_xai(messages, max_tokens=max_tokens, temperature=temperature)
            if out:
                return out
        elif provider == "claude":
            out = call_claude(messages, max_tokens=max_tokens, temperature=temperature)
            if out:
                return out
    return None
