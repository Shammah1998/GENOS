# GENOS - AI Chat Interface

GENOS is a modern AI chat interface built with HTML, CSS, and JavaScript. It features a sleek, responsive design with a dark theme inspired by Cursor's interface, and connects to an n8n workflow API for real-time AI responses.

## Features

- 💬 Real-time chat with AI powered by n8n workflow
- 📱 Responsive design for desktop and mobile
- 🌙 Dark theme with elegant purple accents
- 💾 Chat history with multiple conversations
- 🎨 Sleek, modern UI with smooth animations
- 📎 Simulated attachment and voice input functionality

## How to Use

1. Clone this repository to your local machine
2. Open `index.html` in your browser
3. Start chatting with GENOS!

## Project Structure

- `index.html` - Main HTML structure
- `styles.css` - CSS styling
- `script.js` - JavaScript functionality

## API Connection

GENOS connects to an n8n workflow API endpoint for AI responses. The webhook endpoint is:
```
https://my-automations.app.n8n.cloud/webhook-test/my-workflow
```

The interface sends user messages to this endpoint as JSON payloads and displays the responses in real-time in the chat interface. The API is expected to return responses in the format:
```json
{
    "text": "AI response text here"
}
```

## Credits

Created by [Your Name]

## License

MIT License 