# MAIA Router Chat Action - n8n Node

[![npm version](https://badge.fury.io/js/%40maia-id%2Fn8n-nodes-maia-router-chat-action.svg)](https://www.npmjs.com/package/@maia-id/n8n-nodes-maia-router-chat-action)

**Cloud Compatible** ✅ | Works on both n8n Cloud and Self-hosted

This package provides action-based operations for [MAIA Router](https://maiarouter.ai) in n8n.

## Features

### MAIA Router Node

Direct API operations with full control:
- **Chat Completion** - Generate AI responses
- **Text to Speech** - Convert text to audio
- **Transcribe** - Convert audio to text
- **Generate Video** - Create videos from text prompts

## Installation

### n8n Cloud (Recommended)

1. Go to **Settings** > **Community Nodes**
2. Select **Install**
3. Enter `@maia-id/n8n-nodes-maia-router-chat-action`
4. Click Install

### Self-Hosted n8n

```bash
npm install @maia-id/n8n-nodes-maia-router-chat-action
```

## Configuration

### Credentials

1. Create a new credential of type **Maia Router API**
2. Enter your API key from [MAIA Router](https://maiarouter.ai)

## Example Usage

### Chat Completion

1. Add **MAIA Router** node
2. Select resource: **Chat**
3. Select operation: **Message a model**
4. Set model: `maia/gemini-2.5-flash`
5. Add messages with role (system/user/assistant) and content

### Text to Speech

1. Add **MAIA Router** node
2. Select resource: **Audio**
3. Select operation: **Text to Speech**
4. Set model: `openai/gpt-4o-mini-tts`
5. Enter text and select voice

### Transcribe

1. Add **MAIA Router** node
2. Select resource: **Audio**
3. Select operation: **Transcribe**
4. Set model: `openai/gpt-4o-mini-transcribe`
5. Choose audio source (binary data or URL)

### Generate Video

1. Add **MAIA Router** node
2. Select resource: **Video**
3. Select operation: **Generate Video**
4. Set model: `sora-2` or `sora-2-pro`
5. Enter your text prompt describing the video
6. Optionally configure:
   - Size (1280x720, 1920x1080, 720x1280, 1080x1920)
   - Duration in seconds

## Resources

- [MAIA Router Documentation](https://maiarouter.ai)
- [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)
- [NPM Package](https://www.npmjs.com/package/@maia-id/n8n-nodes-maia-router-chat-action)

## License

MIT
