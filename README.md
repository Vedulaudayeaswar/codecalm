# 🧘 CodeCalm - AI-Powered Mental Wellness Platform

<div align="center">

![CodeCalm Logo](https://img.shields.io/badge/CodeCalm-AI%20Wellness-00d4ff?style=for-the-badge&logo=brain&logoColor=white)
[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0.0-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![LangChain](https://img.shields.io/badge/LangChain-0.3.7-00C853?style=for-the-badge)](https://langchain.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Go](https://img.shields.io/badge/Go-1.21+-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://golang.org/)
[![Kafka](https://img.shields.io/badge/Kafka-Event%20Streaming-000000?style=for-the-badge&logo=apachekafka&logoColor=white)](https://kafka.apache.org/)
[![Redis](https://img.shields.io/badge/Redis-Caching-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Containers-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Orchestration-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white)](https://kubernetes.io/)

**An intelligent mental wellness platform with 7 specialized AI assistants powered by LangGraph and multi-LLM architecture**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [Usage](#-usage) • [API](#-api-documentation) • [Contributing](#-contributing)

</div>

---

## CodeTest Distributed Benchmarking Platform

CodeCalm now includes **CodeTest**, a distributed benchmarking dashboard connected from the CodeGent page. CodeGent remains the Socratic coding tutor, and CodeTest adds a separate load-testing workflow for uploaded code and simulated trading-bot stress tests.

Open it from:

```text
CodeGent -> CodeTest
```

Direct local URL after running the app:

```text
http://localhost:5000/frontend/html/codetest.html
```

### What CodeTest Does

| Feature              | Description                                                                       |
| -------------------- | --------------------------------------------------------------------------------- |
| Code upload          | Accepts `.py`, `.cpp`, and `.go` source files through `POST /upload`              |
| Language detection   | Detects Python, C++, or Go from file extension                                    |
| Docker execution     | Generates a Dockerfile, builds an image, and runs code with memory and CPU limits |
| Bot load generation  | Simulates high-concurrency trading bots with BUY, SELL, and CANCEL orders         |
| Kafka telemetry      | Bot workers publish benchmark events to Kafka                                     |
| Metrics aggregation  | Consumes Kafka events and calculates TPS, p50, p90, p99, failures, and error rate |
| Redis live state     | Stores live metrics and publishes real-time updates with Redis pub/sub            |
| WebSocket dashboard  | Broadcasts live JSON metrics to the frontend dashboard                            |
| Deployment artifacts | Includes Dockerfiles, Docker Compose, and Kubernetes manifests                    |

### CodeTest Tech Stack

| Layer                 | Technology                                |
| --------------------- | ----------------------------------------- |
| Existing app backend  | Python, Flask, SQLAlchemy                 |
| CodeTest services     | Go                                        |
| Upload API            | Gin                                       |
| WebSocket server      | Gorilla WebSocket                         |
| Event streaming       | Kafka                                     |
| Live metrics cache    | Redis / Render Key Value compatible Redis |
| Container execution   | Docker                                    |
| Local orchestration   | Docker Compose                            |
| Cluster orchestration | Kubernetes                                |
| Frontend dashboard    | HTML, CSS, JavaScript, Canvas charts      |

### CodeTest Architecture

```mermaid
flowchart LR
    A[CodeGent Page] --> B[CodeTest Dashboard]
    B --> C[Upload API - Gin]
    C --> D[Submission Folder]
    D --> E[Generated Dockerfile]
    E --> F[Docker Build]
    F --> G[Limited Container Run]
    G --> H[Execution Logs]
    H --> B

    B --> I[Botload API]
    I --> J[Trading Bot Worker Pool]
    J --> K[Kafka bot-events Topic]
    K --> L[Metrics Aggregator]
    L --> M[Redis Live Metrics]
    M --> N[Redis Pub/Sub]
    N --> O[WebSocket Server]
    O --> B
```

### Benchmark Data Flow

```mermaid
sequenceDiagram
    participant UI as CodeTest Dashboard
    participant Bot as Botload Service
    participant Kafka as Kafka
    participant Metrics as Metrics Aggregator
    participant Redis as Redis
    participant WS as WebSocket Server

    UI->>Bot: POST /benchmark/start
    Bot->>Bot: Start goroutine worker pool
    Bot->>Kafka: Publish BUY/SELL/CANCEL telemetry
    Kafka->>Metrics: Consume bot-events
    Metrics->>Metrics: Calculate TPS, p50, p90, p99, error rate
    Metrics->>Redis: Store latest metrics
    Metrics->>Redis: Publish metrics update
    Redis->>WS: Pub/Sub message
    WS->>UI: JSON metrics update
```

### One-Command Development Run

From the project root:

```bash
python main.py
```

This starts the normal Flask app and attempts to autostart CodeTest Go services:

| Service            | URL                                                 |
| ------------------ | --------------------------------------------------- |
| CodeCalm app       | `http://localhost:5000`                             |
| CodeTest dashboard | `http://localhost:5000/frontend/html/codetest.html` |
| CodeTest status    | `http://localhost:5000/api/codetest/status`         |
| Upload API         | `http://localhost:8081`                             |
| Botload API        | `http://localhost:8082`                             |
| Metrics WebSocket  | `ws://localhost:8084/ws/metrics`                    |

Check this endpoint after startup:

```text
http://localhost:5000/api/codetest/status
```

It reports whether Go, Docker, Redis, Kafka, and the CodeTest services are available.

### Full Local Benchmark Run

For the complete distributed benchmark stack, install Docker Desktop and run:

```bash
cd codetest
docker compose up --build redis kafka upload metrics ws
```

Then start the botload service:

```bash
docker compose --profile load up --build botload
```

The dashboard can then receive live metrics through Redis pub/sub and WebSocket updates.

---

## 🔗 CodeGent + CodeTest Integration

**CodeGent** is an advanced coding assistant with multi-LLM routing and intelligent code generation. **CodeTest** is a distributed benchmarking platform for stress-testing submitted code. Together, they provide a complete code-to-benchmark workflow.

### CodeGent → CodeTest Workflow

1. **CodeGent** - Write, debug, or optimize code with AI assistance
2. **Switch to CodeTest** - Navigate to the CodeTest dashboard from CodeGent
3. **Upload Code** - Submit Python, C++, or Go files
4. **Execute & Benchmark** - CodeTest runs your code in Docker with resource limits
5. **Load Test** - Simulate high-concurrency scenarios with trading bot workers
6. **Live Metrics** - Watch real-time performance (TPS, latency, p99, errors) on the dashboard
7. **Iterate** - Use results to optimize in CodeGent

### Key Features

- **Multi-LLM in CodeGent**: Switch between Llama 3.3, Claude, GPT-4, Gemini for different coding tasks
- **Isolated Execution**: Each submission runs in a Docker container with memory/CPU limits
- **Realistic Load**: Kafka-based bot workers simulate concurrent trading scenarios
- **Real-time Dashboard**: Canvas-based charts stream metrics via WebSocket
- **Production-Ready**: Full Docker/K8s deployment artifacts included

### API Endpoints for CodeTest

```http
# Code upload & execution
POST /upload - Submit code file (returns submission ID)
GET /submissions/{id}/logs - View execution logs

# Bot load testing
POST /benchmark/start - Start trading bot load test
POST /benchmark/stop - Stop active load test
WS ws://localhost:8084/ws/metrics - Live metrics WebSocket stream

# Metrics query
GET /metrics/latest - Latest aggregated metrics
GET /metrics/history - Historical metrics (if Redis persisted)
```

---

- Docker services: <https://render.com/docs/docker>
- Key Value / Redis-compatible service: <https://render.com/docs/key-value>
- Health checks: <https://render.com/docs/health-checks>

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

| Assistant                     | Purpose                           | Key Features                                                                          |
| ----------------------------- | --------------------------------- | ------------------------------------------------------------------------------------- |
| **👨‍🎓 StudentBot (Maya)**      | Academic support & study planning | Exam stress management, study techniques, motivation                                  |
| **👨‍👩‍👧 ParentBot**              | Parenting guidance                | Child development advice, emotional support, work-life balance                        |
| **💼 ProfessionalBot (Luna)** | Career & workplace wellness       | Work stress management, productivity tips, career guidance                            |
| **🤖 CodeGent**               | Advanced coding assistant         | Multi-LLM routing, code generation, debugging, distributed benchmarking with CodeTest |
| **💪 FitnessBot**             | Health & fitness coaching         | Research-backed workouts & nutrition (Tavily API for academic papers)                 |
| **🍽️ WeatherFood**            | Meal planning                     | Weather-based meal suggestions, recipe ideas                                          |
| **🧘 ZenMode**                | Mindfulness & meditation          | Breathing exercises, guided meditation, stress relief                                 |

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
- ✅ **CodeTest Benchmarking** - Distributed code execution with Docker isolation
- ✅ **Live Metrics Dashboard** - Real-time performance metrics via WebSocket & Redis pub/sub
- ✅ **Bot Load Generation** - Concurrent trading bot simulation with Kafka telemetry
- ✅ **Multi-Language Support** - Python, C++, Go code execution in CodeTest

---

## 🛠️ Tech Stack

### **CodeCalm Backend (Python/Flask)**

```
🐍 Python 3.9+
🌶️ Flask 3.0.0                 - Web framework
🗄️ PostgreSQL 14+              - Production database
🔗 SQLAlchemy 2.0+             - ORM
🔐 Werkzeug 3.0.1              - Security utilities
🤖 LangGraph 0.2.45            - Agent orchestration
🦜 LangChain 0.3.7             - Agent framework
⚡ Groq API                    - Llama 3.3 70B (Primary LLM)
🌐 OpenRouter                  - Multi-model access (Claude, GPT-4, Gemini)
🔍 Tavily API                  - Research paper search & academic information retrieval
🦙 Ollama (Optional)           - Local DeepSeek-R1 1.5B
🦄 Gunicorn 21.2.0            - WSGI server
🔧 Python Dotenv              - Environment management
📦 pip                        - Package management
```

### **CodeTest Distributed Benchmarking (Go/Kafka/Redis)**

```
🐹 Go 1.21+                    - High-performance services
🌐 Gin                         - REST API framework
🔌 Gorilla WebSocket           - Real-time metrics streaming
🚀 Kafka                       - Event streaming & telemetry
💾 Redis                       - Live metrics caching & pub/sub
🐳 Docker                      - Container execution & isolation
🐙 Docker Compose              - Local orchestration
☸️  Kubernetes                  - Production cluster orchestration
```

### **Frontend (CodeCalm + CodeTest Dashboard)**

```
📄 HTML5 / CSS3 / JavaScript (Vanilla)
🎨 Three.js                    - 3D graphics, interactive visualizations & immersive designs
📊 Canvas API                  - Real-time metrics charting (CodeTest)
🎨 Glassmorphism Design        - Modern UI aesthetics
📱 Responsive Layout           - Mobile-first approach
✨ Smooth Animations           - Enhanced user experience
```

### **Development & DevOps**

```
📦 git                         - Version control
🐳 Docker Desktop              - Local containerization
☸️  kubectl                     - Kubernetes management
🔧 Environment Management      - Python Dotenv
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

### **CodeCalm - LangGraph Multi-Agent Workflow**

```
┌─────────────┐
│ User Input  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│Router Node  │ ◄── Determines agent type (Student/Parent/Professional/CodeGent/Fitness/Weather/Zen)
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│Specialized Agent │ ◄── Agent-specific logic & Tavily research integration
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  LLM (Groq/OpenRouter)  │ ◄── Llama 3.3 70B / Claude / GPT-4 / Gemini
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│Response Enhance  │ ◄── Mood detection + Empathy scaling
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

### **CodeTest - Distributed Benchmarking Architecture**

```
┌──────────────────┐
│ CodeTest Dashboard │ (HTML/CSS/JS/Canvas)
└────────┬─────────┘
         │
    ┌────┴─────┬────────────┐
    │           │            │
    ▼           ▼            ▼
┌──────────┐ ┌────────┐ ┌──────────┐
│ Upload   │ │Botload │ │ Metrics  │
│  (Gin)   │ │(Worker)│ │Query     │
└────┬─────┘ └────┬───┘ └──────────┘
     │            │
     ▼            ▼
  ┌────────────────────┐
  │   Docker Engine    │
  │ (Container Exec)   │
  └────────────────────┘

     & Kafka Event Stream

  ┌────────────────────┐
  │  Metrics Aggregator│ (Go)
  │  (TPS, p50/p90/p99)│
  └────────┬───────────┘
           │
           ▼
  ┌────────────────────┐
  │  Redis Cache       │ (Live metrics + pub/sub)
  └────────┬───────────┘
           │
           ▼
  ┌────────────────────┐
  │ WebSocket Server   │ (Gorilla/Gin)
  │ (Broadcasts JSON)  │
  └────────────────────┘
           │
           └─► Dashboard Updates
```

---

## 📁 Project Structure

```
CodeCalm/
├── backend/                       # Python/Flask - Main app & LangGraph agents
│   ├── main.py                    # Flask app & API endpoints
│   ├── agent_graph.py             # LangGraph deep agents (7 assistants)
│   ├── agent_tools.py             # AI helper utilities
│   ├── models.py                  # Database models
│   ├── auth.py                    # Authentication routes
│   ├── chat_utils.py              # Chat history management
│   ├── database_config.py         # Database configuration
│   ├── requirements.txt           # Python dependencies
│   ├── setup_database.py          # Database initialization
│   └── test_langgraph_agents.py   # Test suite
│
├── frontend/                      # Web UI - CodeCalm + CodeTest Dashboard
│   ├── html/
│   │   ├── login.html             # Login/signup page
│   │   ├── student.html           # StudentBot (Maya) interface
│   │   ├── parent.html            # ParentBot interface
│   │   ├── professional.html      # ProfessionalBot (Luna) interface
│   │   ├── codegent.html          # CodeGent coding assistant
│   │   ├── codetest.html          # CodeTest distributed benchmarking dashboard
│   │   ├── fitness.html           # FitnessBot interface
│   │   ├── weatherfood.html       # WeatherFood interface
│   │   └── zenmode.html           # ZenMode meditation interface
│   │
│   ├── css/                       # Modular stylesheets
│   └── js/                        # Agent-specific JavaScript
│
├── codetest/                      # Go/Kafka/Redis - Distributed benchmarking
│   ├── cmd/
│   │   ├── botload/               # Trading bot load generator
│   │   ├── metrics/               # Metrics aggregator service
│   │   ├── upload/                # File upload & execution service
│   │   └── ws/                    # WebSocket metrics server
│   │
│   ├── internal/
│   │   ├── bot/                   # Bot worker logic & Kafka producer
│   │   ├── metrics/               # Aggregation & Redis sink
│   │   ├── telemetry/             # Event definitions
│   │   └── upload/                # Docker execution & container handling
│   │
│   ├── submissions/               # User code submissions (auto-organized by ID)
│   ├── deploy/
│   │   ├── docker/                # Dockerfiles for each service
│   │   └── k8s/                   # Kubernetes manifests
│   │
│   ├── go.mod & go.sum            # Go dependencies
│   ├── docker-compose.yml         # Local dev orchestration
│   └── ARCHITECTURE.md            # CodeTest architecture docs
│
├── images/                        # Application images & assets
├── .env                           # Environment variables (not in repo)
├── .gitignore                     # Git ignore rules
├── main.py                        # Entry point - starts Flask + CodeTest services
├── index.html                     # Landing page
├── style.css                      # Main stylesheet
├── README.md                      # This file
├── DEPLOY_TO_RENDER.md            # Render deployment guide
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
