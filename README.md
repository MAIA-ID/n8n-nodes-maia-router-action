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

## Need AI Agent Support?

For LangChain AI Agent support (self-hosted only), install:
```bash
@maia-id/n8n-nodes-maia-router-chat-model
```

## Resources

- [MAIA Router Documentation](https://maiarouter.ai)
- [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)
- [GitHub Repository](https://github.com/maia-id/n8n-nodes-maia-router)

## Support

For issues and feature requests, please visit the [GitHub Issues](https://github.com/maia-id/n8n-nodes-maia-router/issues).

## License

MIT
