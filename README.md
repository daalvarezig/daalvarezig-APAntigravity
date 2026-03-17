# Personal Telegram AI Assistant

A complete and functional personal AI assistant living in Telegram. It can receive text and voice messages, transcribe audio, remember you and past conversations persistently. 

Built with Node.js, TypeScript, OpenAI API, and SQLite.

## Features
- **Voice & Text Processing**: Whisper-1 for transcription, GPT-5 Mini (configurable) for text.
- **Smart Memory**: Remembers context from the last 10 messages automatically.
- **Persistent Summarization**: After 20 messages, older ones are summarized intelligently to save OpenAI API costs without losing context.
- **Extracted Memories**: The bot pulls out important permanent facts you state and remembers them forever.
- **Secure**: Restricted to whitelisted Telegram User IDs.

## Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill the variables:
   - `TELEGRAM_BOT_TOKEN`: Get this from [@BotFather](https://t.me/BotFather).
   - `TELEGRAM_ALLOWED_USER_IDS`: Your Telegram numeric User ID.
   - `OPENAI_API_KEY`: Your OpenAI API key.
3. Build and Run:
   ```bash
   npm run build
   npm start
   ```
   *(Or for development: `npm run dev`)*

## Deploying on a VPS (Docker / Dokploy)

This application is ready to be deployed on any Docker-compatible hosting setup, such as Dokploy. 

The SQLite database is configured to be saved inside the `data/` folder. This folder is mounted as a Docker Volume. **This is critical so your conversation history and memories persist across redeploys and container restarts.**

1. In Dokploy, point your application to this repository.
2. Ensure you specify the environment variables.
3. The included `Dockerfile` will automatically build the bot and expose the `data` volume correctly.
