---
name: gemini
description: 'Control Gemini browser tab via MQTT WebSocket — chat, transcribe, research, create tabs. Use when user says "gemini", "ask gemini", "gemini transcribe".'
argument-hint: "<command> [args]"
zombie: true
origin: arra-symbiosis-skills
---

# /gemini — Gemini MQTT Control

Direct control of Gemini browser tab via MQTT WebSocket with tab-specific precision.

## Technical Requirements

1. Gemini Proxy Extension (v2.8.8+)
2. Mosquitto broker with dual listeners on ports 1883 (TCP) and 9001 (WebSocket)
3. Extension sidebar kept open for connection

## Usage

```
/gemini chat "What is quantum computing?"
/gemini research "compare React vs Svelte"
/gemini transcribe <youtube-url>
/gemini tabs                          # List open tabs
/gemini status                        # Check connection
```

## Communication

Uses MQTT topics (`claude/browser/command` and `claude/browser/response`) to handle operations like tab creation, chat messaging, and data retrieval. Unique IDs match requests with responses asynchronously.

## Rules

- Topic names must use `claude/browser/*` format
- Extension requires minimum version for chat functionality
- Requires MQTT infrastructure — not a standalone skill

ARGUMENTS: $ARGUMENTS
