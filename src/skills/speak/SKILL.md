---
name: speak
description: 'Text-to-speech using edge-tts neural voices with macOS say fallback. Use when user says "speak", "say this", "read aloud", "tts", or wants text spoken aloud.'
argument-hint: '"<text>" [--thai] [--voice <name>]'
zombie: true
origin: arra-symbiosis-skills
---

# /speak — Text-to-Speech

Speak text using edge-tts (high-quality neural voices) with fallback to macOS `say`.

## Usage

```
/speak "Hello world"                    # Default English voice
/speak --thai "สวัสดีครับ"                # Thai voice
/speak --voice "en-GB-RyanNeural" "Hi"  # Specific voice
/speak --mac "Hello"                    # Force macOS say
/speak --list                           # List available voices
```

## Options

| Option | Description |
|--------|-------------|
| `--thai` | Use Thai voice (th-TH-NiwatNeural) |
| `--female` | Use female voice |
| `--voice NAME` | Specific edge-tts voice |
| `--mac` | Force macOS say command |
| `--rate RATE` | Speech rate (edge-tts: +/-50%, mac: 100-300) |
| `--list` | List available voices |

## Default Voices

| Language | Voice |
|----------|-------|
| English | en-US-GuyNeural (male) / en-US-JennyNeural (female) |
| Thai | th-TH-NiwatNeural (male) / th-TH-PremwadeeNeural (female) |

## Requirements

- **edge-tts**: `pip install edge-tts` (optional, for high-quality voices)
- **macOS say**: Built-in (fallback)

ARGUMENTS: $ARGUMENTS
