# 🧘 CodeCalm - AI-Powered Mental Wellness Platform

<div align="center">

![CodeCalm Logo](https://img.shields.io/badge/CodeCalm-AI%20Wellness-00d4ff?style=for-the-badge&logo=brain&logoColor=white)
[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0.0-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![LangChain](https://img.shields.io/badge/LangChain-0.3.7-00C853?style=for-the-badge)](https://langchain.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

**An intelligent mental wellness platform with 7 specialized AI assistants powered by LangGraph and multi-LLM architecture**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [Usage](#-usage) • [API](#-api-documentation) • [Contributing](#-contributing)

</div>

---

## 📋 Overview

**CodeCalm** is a comprehensive mental wellness platform that leverages cutting-edge AI technology to provide personalized support across multiple life domains. Built with LangGraph for advanced agent orchestration and powered by state-of-the-art language models (Llama 3.3 70B, Claude, GPT-4), it offers empathetic, context-aware conversations tailored to your specific needs.

### 🎯 Why CodeCalm?

- **🧠 Multi-Agent Intelligence**: 7 specialized AI assistants, each expert in their domain
- **💬 Context-Aware**: Remembers your conversations and adapts to your emotional state
- **🔒 Privacy-First**: Secure authentication with encrypted data storage
- **🚀 Production-Ready**: Built with enterprise-grade architecture and database
- **⚡ Real-time**: Instant responses with intelligent LLM routing

---

## ✨ Features

### 🤖 **7 Specialized AI Assistants**

| Assistant                     | Purpose                           | Key Features                                                          |
| ----------------------------- | --------------------------------- | --------------------------------------------------------------------- |
| **👨‍🎓 StudentBot (Maya)**      | Academic support & study planning | Exam stress management, study techniques, motivation                  |
| **👨‍👩‍👧 ParentBot**              | Parenting guidance                | Child development advice, emotional support, work-life balance        |
| **💼 ProfessionalBot (Luna)** | Career & workplace wellness       | Work stress management, productivity tips, career guidance            |
| **🤖 CodeGent**               | Advanced coding assistant         | Multi-LLM routing (Claude/GPT-4/Gemini), code generation, debugging   |
| **💪 FitnessBot**             | Health & fitness coaching         | Research-backed workouts & nutrition (Tavily API for academic papers) |
| **🍽️ WeatherFood**            | Meal planning                     | Weather-based meal suggestions, recipe ideas                          |
| **🧘 ZenMode**                | Mindfulness & meditation          | Breathing exercises, guided meditation, stress relief                 |

### 🎨 **Core Capabilities**

- ✅ **LangGraph Deep Agents** - Advanced multi-agent workflows with state management
- ✅ **Mood Detection** - Analyzes sentiment and adapts empathy levels
- ✅ **Conversation History** - Full context retention across sessions
- ✅ **Multi-LLM Routing** - Intelligent model selection for optimal responses
- ✅ **User Authentication** - Secure JWT-based session management
- ✅ **Database Persistence** - PostgreSQL for production-grade data storage
- ✅ **Research Integration** - Tavily API for fetching academic papers & evidence-based fitness information
- ✅ **3D Visualizations** - Three.js powered interactive graphics, animations & immersive user experiences
- ✅ **Responsive Design** - Modern, mobile-friendly interface
- ✅ **Real-time Chat** - Instant messaging with typing indicators

---

## 🛠️ Tech Stack

### **Backend**

```
🐍 Python 3.9+
🌶️ Flask 3.0.0                 - Web framework
🗄️ PostgreSQL                  - Production database
🔗 SQLAlchemy 2.0+             - ORM
🔐 Werkzeug 3.0.1              - Security utilities
🤖 LangGraph 0.2.45            - Agent orchestration
🦜 LangChain 0.3.7             - Agent framework
⚡ Groq API                    - Llama 3.3 70B (Primary LLM)
🌐 OpenRouter                  - Multi-model access (Claude, GPT-4, Gemini)
🔍 Tavily API                  - Research paper search & academic information retrieval
🦙 Ollama (Optional)           - Local DeepSeek-R1 1.5B
```

### **Frontend**

```
📄 HTML5 / CSS3 / JavaScript (Vanilla)
🎨 Three.js                    - 3D graphics, interactive visualizations & immersive designs
🎨 Glassmorphism Design        - Modern UI aesthetics
📱 Responsive Layout           - Mobile-first approach
✨ Smooth Animations           - Enhanced user experience
```

### **DevOps**

```
🦄 Gunicorn 21.2.0            - WSGI server
🔧 Python Dotenv              - Environment management
📦 pip                        - Package management
```

---

## 📦 Installation

### **Prerequisites**

- Python 3.9 or higher
- PostgreSQL 14+ (or SQLite for development)
- pip package manager
- **Groq API key** ([Get one here](https://console.groq.com))
- **Tavily API key** ([Get one here](https://tavily.com)) - For research-backed fitness information
- (Optional) OpenRouter API key for multi-model access

### **Step 1: Clone Repository**

```bash
git clone https://github.com/yourusername/CodeCalm.git
cd CodeCalm
```

### **Step 2: Create Virtual Environment**

```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# Linux/Mac
python3 -m venv .venv
source .venv/bin/activate
```

### **Step 3: Install Dependencies**

```bash
cd backend
pip install -r requirements.txt
```

### **Step 4: Configure Environment**

Create a `.env` file in the root directory:

```env
# API Keys
GROQ_API_KEY=your_groq_api_key_here
OPENROUTER_API_KEY=your_openrouter_key_here  # Optional for multi-model access
TAVILY_API_KEY=your_tavily_api_key_here  # For research paper search in FitnessBot

# Database (PostgreSQL for production)
DATABASE_URL=postgresql://user:password@localhost:5432/codecalm

# Or use SQLite for development
# DATABASE_URL=sqlite:///codecalm.db

# Flask Configuration
FLASK_SECRET_KEY=your-secret-key-here
FLASK_ENV=development
```

### **Step 5: Initialize Database**

```bash
python setup_database.py
```

### **Step 6: Run Application**

```bash
# Development
python main.py

# Production
gunicorn -w 4 -b 0.0.0.0:5000 main:app
```

Visit: `http://localhost:5000`

---

## 🚀 Usage

### **1. Registration & Login**

1. Navigate to `http://localhost:5000`
2. Click **"+ LOGIN"** button
3. Create an account (Student/Parent/Professional)
4. Login with your credentials

### **2. Choose Your Assistant**

Access specialized assistants from the menu:

- **StudentBot** - Study help and motivation
- **ParentBot** - Parenting advice
- **ProfessionalBot** - Work-life balance
- **CodeGent** - Advanced coding help
- **FitnessBot** - Health & fitness
- **WeatherFood** - Meal planning
- **ZenMode** - Meditation & mindfulness

### **3. Start Chatting**

Simply type your message and get instant, empathetic responses. The AI remembers your conversation history and adapts to your emotional state.

---

## 🔌 API Documentation

### **Authentication Endpoints**

#### **Sign Up**

```http
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "John Doe",
  "role": "student"
}
```

#### **Login**

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**

```json
{
  "success": true,
  "session_token": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "student"
  }
}
```

### **Chat Endpoints**

#### **LangGraph Unified Agent (Recommended)**

```http
POST /api/agent/chat
Authorization: Bearer <session_token>
Content-Type: application/json

{
  "message": "I'm stressed about my exams",
  "agent_type": "student",
  "conversation_id": "optional-id"
}
```

**Response:**

```json
{
  "success": true,
  "response": "I understand exam stress can be overwhelming...",
  "agent_type": "student",
  "conversation_id": "123",
  "metadata": {
    "model": "llama-3.3-70b-versatile",
    "framework": "langgraph"
  }
}
```

#### **Agent Types**

- `student` - StudentBot (Maya)
- `parent` - ParentBot
- `professional` - ProfessionalBot (Luna)
- `fitness` - FitnessBot
- `weather_food` - WeatherFood
- `zen` - ZenMode

#### **Legacy Endpoints** (Still supported)

- `POST /api/codegent/chat` - CodeGent coding assistant
- `POST /api/fitness/chat` - FitnessBot

---

## 📊 Database Schema

```sql
-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'student',
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Sessions Table
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Conversations Table
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    assistant_type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    started_at TIMESTAMP DEFAULT NOW(),
    last_activity TIMESTAMP DEFAULT NOW()
);

-- Messages Table
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id),
    role VARCHAR(20) NOT NULL,  -- 'user' or 'assistant'
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

---

## 🧪 Testing

Run the comprehensive test suite:

```bash
cd backend
python test_langgraph_agents.py
```

**Test Coverage:**

- ✅ Agent graph creation
- ✅ Mood detection accuracy
- ✅ Student agent responses
- ✅ Professional agent responses
- ✅ Fitness agent responses
- ✅ Conversation context handling

---

## 🏗️ Architecture

### **LangGraph Multi-Agent Workflow**

```
┌─────────────┐
│ User Input  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│Router Node  │ ◄── Determines agent type
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│Specialized Agent │ ◄── Student/Parent/Professional/etc.
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  LLM (Groq)      │ ◄── Llama 3.3 70B / Claude / GPT-4
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│Response Enhance  │ ◄── Mood detection + Empathy
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│Save to Database  │ ◄── PostgreSQL persistence
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│Return to User    │
└──────────────────┘
```

---

## 📁 Project Structure

```
CodeCalm/
├── backend/
│   ├── main.py                    # Flask app & API endpoints
│   ├── agent_graph.py             # LangGraph deep agents
│   ├── agent_tools.py             # AI helper utilities
│   ├── models.py                  # Database models
│   ├── auth.py                    # Authentication routes
│   ├── chat_utils.py              # Chat history management
│   ├── database_config.py         # Database configuration
│   ├── requirements.txt           # Python dependencies
│   ├── setup_database.py          # Database initialization
│   └── test_langgraph_agents.py   # Test suite
│
├── frontend/
│   ├── html/
│   │   ├── login.html             # Login/signup page
│   │   ├── student.html           # StudentBot interface
│   │   ├── parent.html            # ParentBot interface
│   │   ├── professional.html      # ProfessionalBot interface
│   │   ├── codegent.html          # CodeGent interface
│   │   ├── fitness.html           # FitnessBot interface
│   │   ├── weatherfood.html       # WeatherFood interface
│   │   └── zenmode.html           # ZenMode interface
│   │
│   ├── css/                       # Modular stylesheets
│   └── js/                        # Agent-specific JavaScript
│
├── .env                           # Environment variables (not in repo)
├── .gitignore                     # Git ignore rules
├── index.html                     # Landing page
├── style.css                      # Main stylesheet
├── README.md                      # This file
└── LANGGRAPH_IMPLEMENTATION.md    # LangGraph integration docs
```

---

## 🔐 Security Features

- 🔒 **Password Hashing**: PBKDF2-SHA256 encryption
- 🎫 **JWT Sessions**: Secure token-based authentication (7-day expiry)
- 🛡️ **CORS Protection**: Configurable cross-origin policies
- 🔐 **SQL Injection Prevention**: SQLAlchemy ORM parameterization
- 🌐 **Environment Variables**: Sensitive data kept out of codebase
- ✅ **Input Validation**: Server-side validation for all endpoints

---

## 🌐 Deployment

### **Deploy to Render**

1. Create account at [render.com](https://render.com)
2. Connect your GitHub repository
3. Configure environment variables
4. Deploy!

See [DEPLOY_TO_RENDER.md](DEPLOY_TO_RENDER.md) for detailed instructions.

### **Environment Variables for Production**

```env
GROQ_API_KEY=your_production_key
DATABASE_URL=postgresql://user:pass@host:5432/db
FLASK_SECRET_KEY=your_secure_secret
FLASK_ENV=production
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### **Development Guidelines**

- Follow PEP 8 for Python code
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before PR

---

## 📝 License

This project is private and proprietary. All rights reserved.

---

## 👨‍💻 Author

**Uday Easwar**

- Email: udayeaswar24@gmail.com
- GitHub: [@Vedulaudayeaswar](https://github.com/vedulaudayeaswar)

---

## 🙏 Acknowledgments

- **LangChain Team** - For the amazing LangGraph framework
- **Groq** - For ultra-fast Llama 3.3 inference
- **OpenRouter** - For multi-model access
- **Flask Community** - For the excellent web framework

---

## 📮 Support

For issues, questions, or suggestions:

- 📧 Email: udayeaswar24@gmail.com
---

<div align="center">

**Made with 💙 for mental wellness**

⭐ Star this repo if you find it helpful!

</div>
