---
name: deep-research
description: 'Deep Research via Gemini — opens new tab, selects Deep Research mode, sends prompt. Use when user says "deep research", "research this", "gemini research".'
argument-hint: "<topic>"
zombie: true
origin: arra-symbiosis-skills
---

# /deep-research — Deep Research via Gemini

An alias for `/gemini research`. Opens new tab, selects Deep Research mode, sends prompt, and starts research.

## Technical Requirements

- Active MQTT broker (mosquitto)
- Claude Browser Proxy extension (v2.9.39+)
- Access to Gemini tabs

## Usage

```
/deep-research "compare yeast S-33 vs T-58"
/deep-research "best practices for tmux pane management"
```

## How It Works

The automation script manages communication through MQTT:
- `create_tab` — establishes new browser tab
- `select_mode` — navigates to Deep Research functionality
- `chat` — transmits the research query
- `clickText` — activates the research initiation

## Rules

- Requires Gemini MQTT infrastructure to be active
- Falls back gracefully if MQTT broker unavailable

ARGUMENTS: $ARGUMENTS
