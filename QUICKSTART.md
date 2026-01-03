# 🚀 Quick Start Guide

## Local Development

### Prerequisites

- Python 3.9 or higher
- Git

### Setup Steps

1. **Clone the repository** (if you haven't already)

   ```bash
   cd CodeCalm
   ```

2. **Create virtual environment**

   ```bash
   python -m venv venv

   # On Windows
   venv\Scripts\activate

   # On Mac/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**

   ```bash
   pip install -r backend/requirements.txt
   ```

4. **Set up environment variables**

   ```bash
   # Copy the example file
   cp .env.example backend/.env

   # Edit backend/.env and add your API keys
   ```

5. **Initialize database**

   ```bash
   cd backend
   python setup_database.py
   cd ..
   ```

6. **Run the application**

   ```bash
   cd backend
   python main.py
   ```

7. **Open in browser**
   - The app will automatically open at `http://localhost:5000`
   - Or manually visit: `http://localhost:5000`

## Deploy to Render

See [DEPLOY_TO_RENDER.md](DEPLOY_TO_RENDER.md) for complete deployment instructions.

**Quick Deploy:**

1. Push code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New +" → "Blueprint"
4. Connect your repository
5. Add your API keys as environment variables
6. Deploy!

## API Keys Required

Get your free API keys:

- **Groq:** https://console.groq.com (for Student/Parent/Professional bots)
- **OpenRouter:** https://openrouter.ai (for CodeGent)
- **Tavily:** https://tavily.com (for FitnessBot - optional)
- **OpenWeather:** https://openweathermap.org (for WeatherFood - optional)

## Troubleshooting

**Database errors?**

```bash
cd backend
python setup_database.py
```

**Import errors?**

```bash
pip install -r backend/requirements.txt
```

**API not working?**

- Check your API keys in `backend/.env`
- Verify keys are valid at the provider's website
- Check for typos (no extra spaces)

## Project Structure

```
CodeCalm/
├── backend/              # Flask backend
│   ├── main.py          # Main application
│   ├── models.py        # Database models
│   ├── agent_graph.py   # LangGraph agents
│   └── requirements.txt # Python dependencies
├── frontend/            # HTML/CSS/JS frontend
│   ├── html/           # All pages
│   ├── css/            # Stylesheets
│   └── js/             # JavaScript files
├── render.yaml         # Render deployment config
├── build.sh           # Build script for Render
└── Procfile           # Process file for deployment
```

## Features

✅ 7 specialized AI assistants
✅ LangGraph-powered conversations
✅ User authentication & sessions
✅ PostgreSQL database
✅ Production-ready deployment
✅ Health monitoring
✅ Auto-scaling support

---

For detailed documentation, see:

- [DEPLOY_TO_RENDER.md](DEPLOY_TO_RENDER.md) - Deployment guide
- [README.md](README.md) - Full project documentation
