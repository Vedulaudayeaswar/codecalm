from flask import Flask, render_template, request, jsonify, redirect, url_for, send_from_directory
from flask_cors import CORS
import os
import threading
import json
import base64
import re
from datetime import datetime, timedelta
import logging
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__, static_folder='..', template_folder='..')
CORS(app, origins=["*"])

# Load environment variables
from dotenv import load_dotenv
load_dotenv(override=True)  # Reload to get latest API key

# =================================================================================
# DATABASE SETUP
# =================================================================================

from database_config import DatabaseConfig
from models import db, init_db, User, Session, Conversation, Message, RoutingLog
from auth import auth_bp
from chat_utils import chat_bp

# =================================================================================
# LANGGRAPH DEEP AGENTS
# =================================================================================

from agent_graph import run_agent, create_agent_graph
from agent_tools import (
    get_conversation_history,
    detect_mood_from_text,
    add_empathy_markers,
    format_response_with_emoji
)

# Initialize agent graph globally
try:
    AGENT_GRAPH = create_agent_graph()
    logger.info("✅ LangGraph Deep Agents initialized successfully")
    USE_LANGGRAPH = True
except Exception as e:
    logger.warning(f"⚠️  LangGraph initialization failed: {e}")
    AGENT_GRAPH = None
    USE_LANGGRAPH = False

# Configure database
DatabaseConfig.init_app(app)

# Initialize database with app
init_db(app)

# Register blueprints for API routes
app.register_blueprint(auth_bp)  # /api/auth/*
app.register_blueprint(chat_bp)  # /api/chat/*

logger.info("✅ Database initialized with PostgreSQL")
logger.info("✅ Authentication routes registered at /api/auth")
logger.info("✅ Chat routes registered at /api/chat")

# =================================================================================
# DUAL AI SETUP: GROQ (CLOUD) + OLLAMA (LOCAL)
# =================================================================================

import requests

# Groq API Setup
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
groq_available = False
GROQ_MODEL = "llama-3.3-70b-versatile"  # Groq's Llama 70b model
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

if GROQ_API_KEY:
    try:
        # Test Groq API connection
        test_response = requests.post(
            GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": GROQ_MODEL,
                "messages": [{"role": "user", "content": "test"}],
                "max_tokens": 10
            },
            timeout=10
        )
        
        if test_response.status_code == 200:
            groq_available = True
            logger.info(f"✅ Groq API configured with model: {GROQ_MODEL}")
        else:
            logger.warning(f"⚠️  Groq API test failed: {test_response.status_code}")
            groq_available = False
            
    except Exception as e:
        logger.warning(f"⚠️  Groq API setup failed: {e}")
        groq_available = False
else:
    logger.warning("⚠️  GROQ_API_KEY not found in .env file")

# Ollama Setup (Local)
OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_MODEL = "deepseek-r1:1.5b"  # Ultra-lightweight model (1.5B params, ~1.1GB RAM)
ollama_available = False

def check_ollama_connection():
    """Check if Ollama is running locally"""
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=2)
        return response.status_code == 200
    except:
        return False

def generate_with_ollama(prompt, temperature=0.7, max_tokens=500):
    """Generate response using local Ollama LLM"""
    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "num_predict": max_tokens
                }
            },
            timeout=60  # Increased timeout for slower models like DeepSeek
        )
        
        if response.status_code == 200:
            result = response.json()
            raw_response = result.get('response', '').strip()
            
            # Remove ALL thinking patterns from DeepSeek responses
            # Remove <think>...</think> tags
            cleaned_response = re.sub(r'<think>.*?</think>', '', raw_response, flags=re.DOTALL)
            # Remove any remaining XML-like tags
            cleaned_response = re.sub(r'<[^>]+>', '', cleaned_response, flags=re.DOTALL)
            # Remove lines that start with thinking indicators
            cleaned_response = re.sub(r'^(Okay|Alright|So|Hmm|Let me think).*?[.!?]\s*', '', cleaned_response, flags=re.MULTILINE | re.IGNORECASE)
            cleaned_response = cleaned_response.strip()
            
            return cleaned_response if cleaned_response else "Hey there 💙 I'm here for you! Tell me what's on your mind?"
        else:
            return None
            
    except Exception as e:
        return None

def generate_with_groq(prompt, temperature=0.7, max_tokens=500):
    """Generate response using Groq Llama 70b API"""
    try:
        if not GROQ_API_KEY:
            return None
            
        response = requests.post(
            GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": GROQ_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": temperature,
                "max_tokens": max_tokens
            },
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            return result['choices'][0]['message']['content'].strip()
        else:
            logger.error(f"Groq API error: {response.status_code} - {response.text}")
            return None
        
    except Exception as e:
        logger.error(f"Groq generation error: {e}")
        return None

def generate_ai_response(prompt, temperature=0.7, max_tokens=500):
    """
    Generate AI response using Groq Llama 70b API for Student, Parent, and Professional bots
    """
    # Use Groq API directly (no Ollama)
    if groq_available:
        logger.info("☁️  Using Groq Llama 70b (Cloud API)")
        response = generate_with_groq(prompt, temperature, max_tokens)
        if response:
            return response
    
    # No AI available
    logger.error("❌ Groq API not available - check GROQ_API_KEY in .env")
    return None

# Check which AI services are available
ollama_available = check_ollama_connection()

# Student/Parent/Professional bots now use ONLY Groq API
if groq_available:
    logger.info("✅ Groq Llama 70b API configured for Student/Parent/Professional bots")
else:
    logger.warning("⚠️  Groq API not available - check GROQ_API_KEY in .env")

# Set model flag for health checks
model = groq_available

if not model:
    logger.error("❌ GROQ API NOT AVAILABLE! Add GROQ_API_KEY to .env")

# Initialize speech services (Browser-based for cloud compatibility)
recognizer = None
microphone = None
tts_engine = None
speech_available = False

# Speech features disabled for cloud deployment - will use browser APIs
logger.info("ℹ️  Using browser-based speech recognition and TTS")

# =================================================================================
# STUDENT ASSISTANT (MAYA) CLASS
# =================================================================================

class VoiceAssistant:
    def __init__(self):
        self.conversation_history = []
        self.student_context = {
            'mood': 'sad',
            'problems': [],
            'session_start': datetime.now().isoformat()
        }
        
    def get_motivational_prompt(self, user_message, context):
        """Generate a context-aware prompt for Maya"""
        mood = context.get('mood', 'neutral')
        problems = context.get('problems', [])
        
        base_prompt = f"""You are Maya 💙, an empathetic AI study companion for students who provides ACTIONABLE help.

YOUR ROLE:
- Help students with exam preparation, study plans, time management
- Break down complex topics into manageable steps
- Provide specific study strategies and resources
- Create study schedules and todo lists
- Offer emotional support during stress
- Motivate with practical advice, not just cheerleading

CRITICAL RULES:
1. NEVER just say "You got this!" - give SPECIFIC actions
2. For study requests: Create actual study plans with timelines
3. For subject help: Break topics into chapters/concepts to focus on
4. For stress: Provide breathing exercises, break schedules, etc.
5. Be warm but PRACTICAL - always end with next steps
6. NO thinking out loud ("Okay, so", "Let me think")

Current student mood: {mood}
Known issues: {', '.join(problems) if problems else 'None yet'}

Student message: "{user_message}"

Provide actionable help as Maya (2-3 sentences max, with specific steps):"""
        return base_prompt
    
    def get_conversation_summary(self):
        """Get a summary of recent conversation"""
        if not self.conversation_history:
            return "This is the start of our conversation."
        
        recent_messages = self.conversation_history[-4:]
        summary = ""
        for msg in recent_messages:
            summary += f"Student: {msg.get('user', '')}\nMaya: {msg.get('assistant', '')}\n"
        return summary
    
    def generate_ai_response(self, user_message):
        """Generate AI response using available LLM (Ollama or Groq)"""
        if not model:
            return "Hey there 💙 I'm Maya, and I'm here for you. Sometimes things feel overwhelming, but you're not alone in this. Want to share what's been on your mind?"
        
        try:
            self.update_context(user_message)
            prompt = self.get_motivational_prompt(user_message, self.student_context)
            ai_message = generate_ai_response(prompt, temperature=0.8, max_tokens=300)
            
            if not ai_message:
                return "I hear you 💕 It sounds like you're going through something tough. I'm here to listen - want to tell me more about how you're feeling?"
            
            self.conversation_history.append({
                'user': user_message,
                'assistant': ai_message,
                'timestamp': datetime.now().isoformat()
            })
            
            logger.info(f"Maya response: {ai_message[:100]}...")
            return ai_message
            
        except Exception as e:
            logger.error(f"AI generation error: {e}")
            return "Hey, I'm having a little technical hiccup, but I'm still here for you 💙 Whatever you're dealing with, you're not alone. Tell me what's going on?"
    
    def update_context(self, user_message):
        """Update student context based on their message"""
        message_lower = user_message.lower()
        
        problem_keywords = {
            'stress': 'academic stress',
            'exam': 'exam anxiety', 
            'lonely': 'loneliness',
            'friend': 'friendship issues',
            'family': 'family problems',
            'money': 'financial concerns',
            'job': 'career worries',
            'relationship': 'relationship issues',
            'health': 'health concerns',
            'anxiety': 'anxiety',
            'depression': 'depression',
            'overwhelmed': 'feeling overwhelmed'
        }
        
        for keyword, problem in problem_keywords.items():
            if keyword in message_lower and problem not in self.student_context['problems']:
                self.student_context['problems'].append(problem)
        
        positive_words = ['better', 'good', 'happy', 'okay', 'fine', 'thanks']
        if any(word in message_lower for word in positive_words):
            self.student_context['mood'] = 'improving'

# =================================================================================
# PARENT ASSISTANT (PARENTBOT) CLASS  
# =================================================================================

class ParentAssistant:
    def __init__(self):
        self.conversation_history = []
        self.parent_context = {
            'current_task': None,
            'todo_list': [],
            'meal_preferences': [],
            'kids_ages': [],
            'session_start': datetime.now().isoformat()
        }
        self.task_categories = {
            'meal_planner': 'meal planning and cooking assistance',
            'todo_list': 'personalized todo list creation',
            'parenting_tips': 'parenting guidance from expert books',
            'bedtime_stories': 'creative bedtime stories for kids',
            'money_management': 'financial planning and money psychology'
        }
    
    def get_specialized_prompt(self, user_message, context):
        """Generate specialized prompts based on task type"""
        task_type = self.detect_task_type(user_message)
        
        base_info = f"""You are ParentBot, a helpful AI assistant specifically designed for busy parents in India. 
You have expertise in meal planning, parenting, child psychology, financial management, and family organization.

Parent Context:
- Current task focus: {context.get('current_task', 'general assistance')}
- Todo items: {len(context.get('todo_list', []))} items
- Session started: {context.get('session_start')}

Guidelines:
1. Be warm, supportive, and understanding of parenting challenges
2. Provide practical, actionable advice suitable for Indian families
3. Use Indian Standard Time (IST) for all time-related suggestions
4. Consider Indian dietary preferences and available ingredients
5. Be concise but comprehensive in your responses
6. Ask follow-up questions when needed for better assistance"""
        
        if task_type == 'meal_planner':
            return base_info + f"""

MEAL PLANNING EXPERT MODE:
- Provide detailed ingredient lists with quantities
- Include prep time, cooking time, and total time
- Suggest Indian breakfast, lunch, dinner options
- Consider vegetarian/non-vegetarian preferences
- Include nutritional benefits when relevant
- Suggest seasonal and locally available ingredients

User query: "{user_message}"

Provide detailed meal planning assistance:"""
            
        elif task_type == 'todo_list':
            return base_info + f"""

TODO LIST EXPERT MODE:
You MUST create an actual checklist-style todo list, not explanations or questions.

ALWAYS format your response as a proper checklist using this exact format:
☐ Task 1 (Time: X:XX AM/PM IST)
☐ Task 2 (Time: X:XX AM/PM IST)
☐ Task 3 (Time: X:XX AM/PM IST)

Rules:
- Use ☐ symbol for unchecked items
- Include specific IST times for each task
- Make tasks actionable and specific
- Keep tasks realistic for a parent
- Don't ask questions - just create the list
- If request is vague, create a general daily routine checklist

User request: "{user_message}"

Create a checklist-format todo list NOW:"""
            
        elif task_type == 'parenting_tips':
            return base_info + f"""

PARENTING EXPERT MODE:
Draw insights from renowned parenting books like:
- "The 7 Habits of Highly Effective People" by Stephen Covey
- "How to Win Friends and Influence People" by Dale Carnegie
- "Parenting with Love and Logic" by Foster Cline
- "The Power of Positive Parenting" by Glenn Latham
- Indian parenting wisdom and cultural values

User question: "{user_message}"

Provide evidence-based parenting guidance:"""
            
        elif task_type == 'bedtime_stories':
            return base_info + f"""

STORYTELLER MODE:
- Create engaging, age-appropriate bedtime stories
- Include moral lessons and positive values
- Make stories interactive and imaginative
- Consider Indian cultural elements when appropriate
- Keep stories calming and suitable for bedtime

Story request: "{user_message}"

Create a wonderful bedtime story:"""
            
        elif task_type == 'money_management':
            return base_info + f"""

FINANCIAL ADVISOR MODE:
Draw insights from financial wisdom books like:
- "The Psychology of Money" by Morgan Housel
- "Rich Dad Poor Dad" by Robert Kiyosaki
- "The Intelligent Investor" by Benjamin Graham
- Indian financial planning and investment strategies
- Family budgeting and expense management

Financial query: "{user_message}"

Provide practical financial guidance for families:"""
        
        else:
            return base_info + f"""

Parent just said: "{user_message}"

Provide helpful parenting assistance:"""
    
    def detect_task_type(self, message):
        """Detect what type of assistance the parent needs"""
        message_lower = message.lower()
        
        todo_keywords = ['todo', 'to do', 'task', 'schedule', 'plan my', 'organize', 'checklist', 'do today', 'practice', 'study', 'learn', 'algorithm', 'data structure']
        meal_keywords = ['cook', 'recipe', 'meal plan', 'food', 'breakfast', 'lunch', 'dinner', 'ingredients', 'prepare food', 'cooking']
        
        if any(word in message_lower for word in ['story', 'bedtime', 'tale', 'sleep', 'night', 'tell me a story', 'bedtime story']):
            return 'bedtime_stories'
        elif any(word in message_lower for word in todo_keywords) and not any(word in message_lower for word in ['meal plan', 'cooking', 'recipe']):
            return 'todo_list'
        elif any(word in message_lower for word in meal_keywords):
            return 'meal_planner'
        elif any(word in message_lower for word in ['parent', 'child', 'kid', 'behavior', 'discipline', 'development']):
            return 'parenting_tips'
        elif any(word in message_lower for word in ['money', 'budget', 'save', 'invest', 'financial', 'expense']):
            return 'money_management'
        else:
            return 'general'
    
    def generate_ai_response(self, user_message):
        """Generate AI response using available LLM (Ollama or Groq)"""
        if not model:
            return "I'm having some technical difficulties, but I'm here to help you with parenting tasks. What do you need assistance with?"
        
        try:
            self.update_context(user_message)
            prompt = self.get_specialized_prompt(user_message, self.parent_context)
            ai_message = generate_ai_response(prompt, temperature=0.7, max_tokens=400)
            
            if not ai_message:
                return "I'm having trouble processing that right now. Could you please try asking again? I'm here to help with meal planning, todo lists, parenting tips, bedtime stories, or money management."
            
            self.conversation_history.append({
                'user': user_message,
                'assistant': ai_message,
                'timestamp': datetime.now().isoformat(),
                'task_type': self.detect_task_type(user_message)
            })
            
            logger.info(f"ParentBot response generated: {ai_message[:100]}...")
            return ai_message
            
        except Exception as e:
            logger.error(f"AI generation error: {e}")
            return "I'm having trouble processing that right now. Could you please try asking again? I'm here to help with meal planning, todo lists, parenting tips, bedtime stories, or money management."
    
    def update_context(self, user_message):
        """Update parent context based on their message"""
        task_type = self.detect_task_type(user_message)
        self.parent_context['current_task'] = task_type
        
        if task_type == 'meal_planner':
            if any(word in user_message.lower() for word in ['veg', 'vegetarian']):
                if 'vegetarian' not in self.parent_context['meal_preferences']:
                    self.parent_context['meal_preferences'].append('vegetarian')
            elif any(word in user_message.lower() for word in ['non-veg', 'chicken', 'mutton', 'fish']):
                if 'non-vegetarian' not in self.parent_context['meal_preferences']:
                    self.parent_context['meal_preferences'].append('non-vegetarian')

# =================================================================================
# WORKING PROFESSIONAL ASSISTANT (LUNA) CLASS
# =================================================================================

class LunaProfessionalAssistant:
    def __init__(self):
        self.conversation_history = []
        self.professional_context = {
            'mood': 'stressed',
            'work_problems': [],
            'stress_level': 'high',
            'work_environment': 'office',
            'role_level': 'mid_level',
            'session_start': datetime.now().isoformat(),
            'professional_name': 'Professional'
        }
        self.is_listening = False
        
    def get_professional_prompt(self, user_message, context):
        """Generate a context-aware prompt for Luna"""
        stress_level = context.get('stress_level', 'moderate')
        work_issues = context.get('work_issues', [])
        
        base_prompt = f"""You are Luna 💼, an AI workplace wellness coach who provides PRACTICAL solutions.

YOUR EXPERTISE:
- Work-life balance strategies and time management
- Stress reduction techniques (breathing, breaks, boundaries)
- Communication scripts for difficult conversations
- Productivity tips and focus techniques
- Burnout prevention and recovery plans
- Career growth and professional development

CRITICAL RULES:
1. Provide ACTIONABLE advice with specific steps
2. For stress: Give immediate coping techniques + long-term strategies
3. For conflicts: Suggest communication templates/scripts
4. For burnout: Create recovery action plans with timelines
5. For productivity: Share proven techniques (Pomodoro, time-blocking, etc.)
6. Be professional yet empathetic - focus on solutions
7. NO vague advice - always include concrete next steps

Current stress level: {stress_level}
Known issues: {', '.join(work_issues) if work_issues else 'General workplace wellness'}

Professional's message: "{user_message}"

Provide practical workplace wellness advice (2-3 sentences with actionable steps):"""
        return base_prompt
    
    def get_conversation_summary(self):
        """Get a summary of recent conversation"""
        if not self.conversation_history:
            return "This is the beginning of our professional wellness session."
        
        recent_messages = self.conversation_history[-3:]
        summary = ""
        for msg in recent_messages:
            summary += f"Professional: {msg.get('user', '')}\nLuna: {msg.get('assistant', '')}\n"
        return summary
    
    def generate_ai_response(self, user_message):
        """Generate AI response using available LLM (Ollama or Groq)"""
        if not model:
            return "I'm experiencing some technical difficulties with my AI processing, but I'm still here to support you. What specific workplace challenge are you facing today?"
        
        try:
            self.update_professional_context(user_message)
            prompt = self.get_professional_prompt(user_message, self.professional_context)
            
            ai_message = generate_ai_response(prompt, temperature=0.75, max_tokens=350)
            
            if not ai_message:
                return "I'm having some technical difficulties, but I want you to know I'm here to support your professional wellness journey. Could you tell me more about what's challenging you at work today?"
            
            self.conversation_history.append({
                'user': user_message,
                'assistant': ai_message,
                'timestamp': datetime.now().isoformat()
            })
            
            logger.info(f"Luna response generated: {ai_message[:100]}...")
            return ai_message
            
        except Exception as e:
            logger.error(f"AI generation error: {e}")
            return f"I'm having some technical difficulties, but I want you to know I'm here to support your professional wellness journey. Could you tell me more about what's challenging you at work today?"
    
    def update_professional_context(self, user_message):
        """Update professional context based on message analysis"""
        message_lower = user_message.lower()
        
        high_stress_indicators = ["overwhelmed", "burned out", "exhausted", "can't cope", "breaking point"]
        moderate_stress_indicators = ["stressed", "pressure", "busy", "tired", "difficult"]
        low_stress_indicators = ["better", "manageable", "okay", "good", "fine", "relaxed"]
        
        if any(indicator in message_lower for indicator in high_stress_indicators):
            self.professional_context['stress_level'] = 'very high'
        elif any(indicator in message_lower for indicator in moderate_stress_indicators):
            self.professional_context['stress_level'] = 'high'
        elif any(indicator in message_lower for indicator in low_stress_indicators):
            self.professional_context['stress_level'] = 'moderate'
        
        problem_keywords = {
            'deadline': 'tight deadlines',
            'overtime': 'excessive work hours', 
            'workload': 'heavy workload',
            'boss': 'management issues',
            'manager': 'management issues',
            'meeting': 'meeting overload',
            'burnout': 'burnout symptoms',
            'promotion': 'career advancement pressure',
            'colleague': 'workplace relationships',
            'team': 'team dynamics',
            'project': 'project pressure',
            'performance': 'performance anxiety',
            'layoff': 'job security concerns',
            'remote': 'remote work challenges',
            'commute': 'work-life balance issues',
            'client': 'client relationship stress',
            'presentation': 'presentation anxiety'
        }
        
        for keyword, problem in problem_keywords.items():
            if keyword in message_lower and problem not in self.professional_context['work_problems']:
                self.professional_context['work_problems'].append(problem)
        
        positive_words = ['better', 'improved', 'relaxed', 'confident', 'motivated', 'accomplished']
        negative_words = ['frustrated', 'angry', 'sad', 'worried', 'anxious', 'depressed']
        
        if any(word in message_lower for word in positive_words):
            self.professional_context['mood'] = 'improving'
        elif any(word in message_lower for word in negative_words):
            self.professional_context['mood'] = 'struggling'

# Global assistant instances
voice_assistant = VoiceAssistant()
parent_assistant = ParentAssistant()
luna_assistant = LunaProfessionalAssistant()

# =================================================================================
# MAIN ROUTES (WEBSITE FLOW)
# =================================================================================

@app.route('/')
def index():
    """Landing page"""
    return send_from_directory('..', 'index.html')

@app.route('/index.html')
def serve_index_html():
    """Serve index.html explicitly"""
    return send_from_directory('..', 'index.html')

@app.route('/style.css')
def serve_main_css():
    """Serve main CSS file"""
    return send_from_directory('..', 'style.css')

@app.route('/index.js')
def serve_main_js():
    """Serve main JS file"""
    return send_from_directory('..', 'index.js')

@app.route('/test_session.html')
def serve_test_session():
    """Serve session testing page"""
    return send_from_directory('..', 'test_session.html')

# Root directory images - explicit routes
@app.route('/heroimage.png')
def serve_heroimage():
    root_dir = os.path.join(os.path.dirname(__file__), '..')
    return send_from_directory(root_dir, 'heroimage.png')

@app.route('/mentalwellness.png')
def serve_mentalwellness():
    root_dir = os.path.join(os.path.dirname(__file__), '..')
    return send_from_directory(root_dir, 'mentalwellness.png')

@app.route('/uday.jpeg')
def serve_uday():
    root_dir = os.path.join(os.path.dirname(__file__), '..')
    return send_from_directory(root_dir, 'uday.jpeg')

@app.route('/coding.png')
def serve_coding():
    root_dir = os.path.join(os.path.dirname(__file__), '..')
    return send_from_directory(root_dir, 'coding.png')

@app.route('/parent.png')
def serve_parent():
    root_dir = os.path.join(os.path.dirname(__file__), '..')
    return send_from_directory(root_dir, 'parent.png')

@app.route('/student.png')
def serve_student():
    root_dir = os.path.join(os.path.dirname(__file__), '..')
    return send_from_directory(root_dir, 'student.png')

@app.route('/workplace.png')
def serve_workplace():
    root_dir = os.path.join(os.path.dirname(__file__), '..')
    return send_from_directory(root_dir, 'workplace.png')

@app.route('/fitness.png')
def serve_fitness():
    root_dir = os.path.join(os.path.dirname(__file__), '..')
    return send_from_directory(root_dir, 'fitness.png')

@app.route('/frontend/html/<path:filename>')
def serve_html(filename):
    """Serve HTML files"""
    return send_from_directory('../frontend/html', filename)

@app.route('/frontend/css/<path:filename>')
def serve_css(filename):
    """Serve CSS files"""
    return send_from_directory('../frontend/css', filename)

@app.route('/frontend/js/<path:filename>')
def serve_js(filename):
    """Serve JS files"""
    return send_from_directory('../frontend/js', filename)

@app.route('/images/<path:filename>')
def serve_images(filename):
    """Serve image files from images folder"""
    return send_from_directory('../images', filename)

@app.route('/audio/<path:filename>')
def serve_audio(filename):
    """Serve audio files from audio folder"""
    return send_from_directory('../audio', filename)

# =================================================================================
# STUDENT API ROUTES
# =================================================================================

@app.route('/api/student/start-conversation', methods=['POST'])
def start_student_conversation():
    """Initialize student conversation"""
    global voice_assistant
    voice_assistant = VoiceAssistant()
    
    data = request.get_json() or {}
    happiness_score = data.get('happiness', 0)
    student_name = data.get('name', 'friend')
    
    voice_assistant.student_context.update({
        'happiness_score': happiness_score,
        'student_name': student_name,
        'mood': 'sad' if happiness_score < 80 else 'happy'
    })
    
    # Use static welcome message to save API quota
    welcome_message = f"Hey {student_name}! 💙 I'm Maya. I'm here to support you through whatever you're dealing with. If you're feeling stressed, overwhelmed, or just need someone to talk to - I've got you! What's been going on?"
    
    return jsonify({
        'success': True,
        'message': welcome_message,
        'session_id': voice_assistant.student_context['session_start']
    })

@app.route('/api/student/listen', methods=['POST'])
def listen_to_student():
    """Capture student's voice input - Browser-based"""
    return jsonify({
        'success': False,
        'error': 'Server-side speech recognition not available',
        'message': "Please use the microphone button in your browser to speak.",
        'use_browser_speech': True
    })

@app.route('/api/student/respond', methods=['POST'])
def respond_to_student():
    """Generate AI response to student message"""
    try:
        data = request.get_json()
        user_message = data.get('message', '')
        enable_voice = data.get('enable_voice', True)
        
        if not user_message:
            return jsonify({
                'success': False,
                'error': 'No message provided'
            })
        
        ai_response = voice_assistant.generate_ai_response(user_message)
        
        voice_response = "use_browser_tts" if enable_voice else None
        
        return jsonify({
            'success': True,
            'response': ai_response,
            'voice_response': voice_response,
            'has_voice': voice_response is not None,
            'use_browser_tts': True,
            'conversation_count': len(voice_assistant.conversation_history),
            'student_context': voice_assistant.student_context
        })
        
    except Exception as e:
        logger.error(f"Response generation error: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to generate response',
            'response': "I'm here for you! What's on your mind?"
        })

# =================================================================================
# PARENT API ROUTES
# =================================================================================

@app.route('/api/parent/start-conversation', methods=['POST'])
def start_parent_conversation():
    """Initialize parent conversation"""
    global parent_assistant
    parent_assistant = ParentAssistant()
    
    data = request.get_json() or {}
    parent_name = data.get('name', 'Parent')
    
    parent_assistant.parent_context.update({
        'parent_name': parent_name
    })
    
    # Use static welcome message to save API quota
    welcome_message = f"Hello {parent_name}! 🏠 I'm ParentBot, your AI parenting assistant. I'm here to help you with meal planning, creating todo lists, parenting guidance, bedtime stories for your kids, and money management. What can I help you with today?"
    
    return jsonify({
        'success': True,
        'message': welcome_message,
        'session_id': parent_assistant.parent_context['session_start']
    })

@app.route('/api/parent/listen', methods=['POST'])
def listen_to_parent():
    """Capture parent's voice input - Browser-based"""
    return jsonify({
        'success': False,
        'error': 'Server-side speech recognition not available',
        'message': "Please use the microphone button in your browser to speak.",
        'use_browser_speech': True
    })

@app.route('/api/parent/respond', methods=['POST'])
def respond_to_parent():
    """Generate AI response to parent message"""
    try:
        data = request.get_json()
        user_message = data.get('message', '')
        enable_voice = data.get('enable_voice', True)
        
        if not user_message:
            return jsonify({
                'success': False,
                'error': 'No message provided'
            })
        
        ai_response = parent_assistant.generate_ai_response(user_message)
        
        voice_response = "use_browser_tts" if enable_voice else None
        
        return jsonify({
            'success': True,
            'response': ai_response,
            'voice_response': voice_response,
            'has_voice': voice_response is not None,
            'use_browser_tts': True,
            'task_type': parent_assistant.detect_task_type(user_message),
            'conversation_count': len(parent_assistant.conversation_history),
            'parent_context': parent_assistant.parent_context
        })
        
    except Exception as e:
        logger.error(f"Parent response generation error: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to generate response',
            'response': "I'm here to help you with parenting tasks!"
        })

# =================================================================================
# PROFESSIONAL API ROUTES
# =================================================================================

@app.route('/api/professional/workplace-support', methods=['POST'])
def start_workplace_session():
    """Initialize professional wellness session"""
    global luna_assistant
    luna_assistant = LunaProfessionalAssistant()
    
    data = request.get_json() or {}
    stress_level = data.get('stress_level', 'high')
    professional_name = data.get('name', 'Professional')
    work_environment = data.get('work_environment', 'office')
    
    luna_assistant.professional_context.update({
        'stress_level': stress_level,
        'professional_name': professional_name,
        'work_environment': work_environment,
        'mood': 'stressed' if stress_level in ['high', 'very high'] else 'manageable'
    })
    
    # Use static welcome message to save API quota
    welcome_message = f"Hey {professional_name}! 💼 I'm Luna, your AI workplace wellness companion. I'm here to help you navigate work stress and professional challenges. What's going on at work?"
    
    return jsonify({
        'success': True,
        'message': welcome_message,
        'session_id': luna_assistant.professional_context['session_start'],
        'professional_context': luna_assistant.professional_context
    })

@app.route('/api/professional/respond', methods=['POST'])
def respond_to_professional():
    """Generate response to professional's message"""
    try:
        data = request.get_json() or {}
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return jsonify({
                'success': False,
                'error': 'No message provided'
            })
        
        ai_response = luna_assistant.generate_ai_response(user_message)
        
        return jsonify({
            'success': True,
            'response': ai_response,
            'professional_context': luna_assistant.professional_context
        })
        
    except Exception as e:
        logger.error(f"Professional response error: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to generate response'
        })

# REMOVED THE DUPLICATE WELCOME PROMPT CODE BELOW THIS LINE
# =================================================================================
# CODEGENT API ROUTES - Intelligent Coding Tutor
# =================================================================================

@app.route('/api/professional/listen', methods=['POST'])
def listen_to_professional():
    """Capture professional's voice input - Browser-based"""
    return jsonify({
        'success': False,
        'error': 'Server-side speech recognition not available',
        'message': "Please use the microphone button in your browser to speak.",
        'use_browser_speech': True
    })

# =================================================================================
# HEALTH CHECK AND UTILITY ROUTES
# =================================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'service': 'CodeCalm AI Mental Wellness Platform',
        'status': 'healthy',
        'ai_backend': {
            'ollama_local': ollama_available,
            'ollama_model': OLLAMA_MODEL if ollama_available else 'not available',
            'groq_cloud': groq_available,
            'groq_model': GROQ_MODEL if groq_available else 'not available',
            'active_mode': 'Ollama (Local)' if ollama_available else f'Groq {GROQ_MODEL} (Cloud)' if groq_available else 'None'
        },
        'components': {
            'ai_model': model is not None,
            'speech_recognition': 'browser-based',
            'text_to_speech': 'browser-based'
        },
        'services': ['student', 'parent', 'professional'],
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/conversation-history/<service>', methods=['GET'])
def get_conversation_history(service):
    """Get conversation history for a service"""
    if service == 'student':
        return jsonify({
            'success': True,
            'history': voice_assistant.conversation_history,
            'context': voice_assistant.student_context,
            'total_messages': len(voice_assistant.conversation_history)
        })
    elif service == 'parent':
        return jsonify({
            'success': True,
            'history': parent_assistant.conversation_history,
            'context': parent_assistant.parent_context,
            'total_messages': len(parent_assistant.conversation_history)
        })
    elif service == 'professional':
        return jsonify({
            'success': True,
            'history': luna_assistant.conversation_history,
            'context': luna_assistant.professional_context,
            'total_messages': len(luna_assistant.conversation_history)
        })
    else:
        return jsonify({
            'success': False,
            'error': 'Invalid service specified'
        })

# =================================================================================
# CODEGENT - SOCRATIC CODING TUTOR WITH MULTI-LLM ROUTING
# =================================================================================

OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')

# Token tracking for analytics
token_usage = {
    'claude': {'total_tokens': 0, 'queries': 0, 'reasons': []},
    'gpt': {'total_tokens': 0, 'queries': 0, 'reasons': []},
    'gemini': {'total_tokens': 0, 'queries': 0, 'reasons': []}
}

# Motivational facts
MOTIVATIONAL_FACTS = [
    "💡 Did you know? Solving just 2 problems per day means 60+ problems per month!",
    "🎯 Fun fact: Understanding the 'why' behind code is more valuable than memorizing syntax.",
    "🚀 Remember: Every expert programmer was once a beginner asking questions.",
    "📚 Tip: Teaching concepts back to the AI helps solidify your understanding!",
    "⚡ Insight: Breaking problems into smaller steps is how professionals code too.",
    "🧠 Pro tip: The best way to learn coding is by doing, not just reading!",
    "✨ Each bug you fix makes you a better developer!",
    "🔥 Consistency beats intensity - code a little every day!"
]

def classify_query(user_message):
    """
    Classify query type to select appropriate LLM.
    Returns: tuple (model_name, reason)
    """
    message_lower = user_message.lower()
    
    # Coding/debugging keywords - use Claude (best for code)
    coding_keywords = ['code', 'function', 'loop', 'print', 'algorithm', 'debug', 
                      'program', 'syntax', 'variable', 'array', 'list', 'error',
                      'fix', 'implement', 'write', 'class', 'method', 'bug']
    
    # Research/explanation keywords - use GPT (best for teaching)
    research_keywords = ['explain', 'why', 'how does', 'difference between', 
                        'compare', 'what is', 'teach me', 'help me understand',
                        'concept', 'theory', 'meaning', 'define']
    
    # Coding task - use Claude
    if any(keyword in message_lower for keyword in coding_keywords):
        reason = "Coding/debugging task detected - Claude excels at code generation and problem-solving"
        return 'claude', reason
    
    # Research/explanation - use GPT
    elif any(keyword in message_lower for keyword in research_keywords):
        reason = "Explanation/teaching query - GPT-4 provides excellent conceptual understanding"
        return 'gpt', reason
    
    # General conversation - use Gemini (cost-effective)
    else:
        reason = "General conversation - Gemini offers efficient responses for casual queries"
        return 'gemini', reason

def get_llm_response_openrouter(model_name, messages, conversation_state):
    """
    Route to appropriate LLM via OpenRouter and get response.
    Returns: tuple (response_text, tokens_used, reasoning)
    """
    
    # Determine teaching mode based on conversation progress
    teaching_mode = "guiding" if conversation_state.get('step', 0) < 3 else "solution-ready"
    
    system_prompt = f"""You are CodeGent, a Socratic coding tutor. Your mission is to help users LEARN, not just solve problems.

TEACHING PHILOSOPHY:
1. **Never give direct answers initially** - Guide with questions
2. **Build understanding step-by-step** - Break complex problems into smaller parts
3. **Encourage thinking** - Ask "What do you think happens?" before explaining
4. **Progressive disclosure** - Hints → Approach → Pseudocode → Code
5. **Positive reinforcement** - Celebrate correct thinking patterns

EXAMPLE TEACHING FLOW (for "print first N numbers"):
Step 1: "Great question! Before we code, let's think: How would you print just ONE number?"
Step 2: "Excellent! Now, what if you wanted to print multiple numbers? What pattern do you see?"
Step 3: "That's right! Which programming construct lets us repeat actions multiple times?"
Step 4: "Perfect! Let's build the code together. What should be our starting point?"
Step 5: [Only after understanding] "Here's the complete solution with explanations..."

CURRENT STATE:
- Teaching mode: {teaching_mode}
- Conversation step: {conversation_state.get('step', 0)}
- User understanding level: {conversation_state.get('understanding', 'exploring')}

RESPONSE RULES:
- If step < 3: Ask guiding questions, give hints
- If step >= 3 and user understands: Provide code with detailed explanations
- Always explain WHY, not just HOW
- Use emojis for engagement 🎯
- After providing solution, ask "Would you like to optimize this?" or "Want to understand the complexity?"
"""

    try:
        # Model mapping for OpenRouter (Updated with valid model IDs)
        model_map = {
            'claude': 'anthropic/claude-3.5-sonnet',
            'gpt': 'openai/gpt-4-turbo',
            'gemini': 'google/gemini-2.0-flash-exp'  # Updated to valid Gemini model
        }
        
        openrouter_model = model_map.get(model_name, 'google/gemini-2.0-flash-exp')
        
        # Prepare messages for OpenRouter
        formatted_messages = [{"role": "system", "content": system_prompt}]
        for msg in messages:
            formatted_messages.append({
                "role": msg['role'],
                "content": msg['content']
            })
        
        # Call OpenRouter API
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5000",
            "X-Title": "CodeCalm CodeGent"
        }
        
        payload = {
            "model": openrouter_model,
            "messages": formatted_messages,
            "max_tokens": 1500,
            "temperature": 0.7
        }
        
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            content = data['choices'][0]['message']['content']
            tokens = data.get('usage', {}).get('total_tokens', 0)
            
            return content, tokens, f"Successfully used {model_name.upper()}"
        else:
            logger.error(f"OpenRouter API error: {response.status_code} - {response.text}")
            # Fallback to Gemini
            return fallback_to_gemini(formatted_messages)
            
    except Exception as e:
        logger.error(f"Error with {model_name}: {str(e)}")
        return fallback_to_gemini(formatted_messages)

def fallback_to_gemini(messages):
    """Fallback to Groq if OpenRouter fails"""
    try:
        if groq_available:
            # Convert messages to a single prompt for Groq
            prompt = "\n".join([f"{m['role']}: {m['content']}" for m in messages])
            response_text = generate_with_groq(prompt, temperature=0.7, max_tokens=1500)
            if response_text:
                tokens = len(prompt.split()) * 1.3
                return response_text, int(tokens), "Fallback to Groq due to API error"
        
        return ("I apologize, but I'm having trouble connecting to the AI services. "
               "Please check your API keys in the .env file."), 0, "API Error"
    except Exception as e:
        return f"Error: {str(e)}", 0, "Fallback Error"

@app.route('/api/codegent/chat', methods=['POST'])
def codegent_chat():
    """Main endpoint for CodeGent chat with intelligent LLM routing"""
    try:
        data = request.json
        user_message = data.get('message', '')
        conversation_history = data.get('history', [])
        conversation_state = data.get('state', {'step': 0, 'understanding': 'exploring'})
        conversation_id = data.get('conversation_id', None)  # Get existing conversation ID if provided
        
        if not user_message:
            return jsonify({'error': 'No message provided'}), 400
        
        # Get user session (if authenticated)
        user_id = None
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            session_token = auth_header.split(' ')[1]
            session = Session.query.filter_by(session_token=session_token).first()
            if session and session.is_valid():
                user_id = session.user_id
        
        # Create or get conversation if user is authenticated
        conversation = None
        if user_id:
            if conversation_id:
                # Get existing conversation
                conversation = Conversation.query.filter_by(
                    id=conversation_id, 
                    user_id=user_id,
                    assistant_type='codegent'
                ).first()
            
            if not conversation:
                # Create new conversation
                conversation_title = user_message[:50] + "..." if len(user_message) > 50 else user_message
                conversation = Conversation(
                    user_id=user_id,
                    assistant_type='codegent',
                    title=conversation_title
                )
                db.session.add(conversation)
                db.session.commit()
        
        # Classify and route
        selected_model, routing_reason = classify_query(user_message)
        
        # Prepare messages (last 10 for context)
        messages = []
        for msg in conversation_history[-10:]:
            messages.append({
                'role': 'user' if msg['sender'] == 'user' else 'assistant',
                'content': msg['text']
            })
        messages.append({'role': 'user', 'content': user_message})
        
        # Get response from selected LLM
        response_text, tokens_used, execution_info = get_llm_response_openrouter(
            selected_model, messages, conversation_state
        )
        
        # Save messages to database if user is authenticated
        if user_id and conversation:
            try:
                # Save user message
                user_msg = Message(
                    conversation_id=conversation.id,
                    sender='user',
                    content=user_message
                )
                db.session.add(user_msg)
                
                # Save assistant response
                assistant_msg = Message(
                    conversation_id=conversation.id,
                    sender='assistant',
                    content=response_text,
                    model_used=selected_model,
                    tokens=tokens_used
                )
                db.session.add(assistant_msg)
                
                # Save routing log
                routing_log = RoutingLog(
                    conversation_id=conversation.id,
                    message_id=None,  # Will be set after commit
                    selected_model=selected_model,
                    query_type=routing_reason,
                    reasoning=routing_reason
                )
                db.session.add(routing_log)
                
                # Update conversation timestamp
                conversation.updated_at = datetime.utcnow()
                
                db.session.commit()
                
                # Update message_id in routing log
                routing_log.message_id = assistant_msg.id
                db.session.commit()
                
            except Exception as db_error:
                logger.error(f"Database save error: {str(db_error)}")
                db.session.rollback()
        
        # Update token tracking
        token_usage[selected_model]['total_tokens'] += tokens_used
        token_usage[selected_model]['queries'] += 1
        token_usage[selected_model]['reasons'].append({
            'query': user_message[:50] + '...' if len(user_message) > 50 else user_message,
            'reason': routing_reason,
            'tokens': tokens_used,
            'timestamp': datetime.now().isoformat()
        })
        
        # Keep only last 20 reasons per model
        if len(token_usage[selected_model]['reasons']) > 20:
            token_usage[selected_model]['reasons'] = token_usage[selected_model]['reasons'][-20:]
        
        # Update conversation state
        conversation_state['step'] = conversation_state.get('step', 0) + 1
        
        # Add motivational fact occasionally (30% chance)
        import random
        motivational_fact = random.choice(MOTIVATIONAL_FACTS) if random.random() < 0.3 else None
        
        return jsonify({
            'success': True,
            'response': response_text,
            'model_used': selected_model,
            'routing_reason': routing_reason,
            'tokens_used': tokens_used,
            'motivational_fact': motivational_fact,
            'state': conversation_state,
            'conversation_id': conversation.id if conversation else None,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"CodeGent chat error: {str(e)}\n{traceback.format_exc()}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/codegent/stats', methods=['GET'])
def codegent_stats():
    """Get detailed token usage statistics and routing analytics"""
    try:
        # Calculate total tokens across all models
        total_tokens = sum(model['total_tokens'] for model in token_usage.values())
        total_queries = sum(model['queries'] for model in token_usage.values())
        
        # Calculate model distribution percentages
        model_distribution = {}
        for model_name, data in token_usage.items():
            percentage = (data['queries'] / total_queries * 100) if total_queries > 0 else 0
            model_distribution[model_name] = {
                'percentage': round(percentage, 2),
                'queries': data['queries'],
                'tokens': data['total_tokens'],
                'avg_tokens_per_query': round(data['total_tokens'] / data['queries'], 2) if data['queries'] > 0 else 0
            }
        
        return jsonify({
            'success': True,
            'token_usage': token_usage,
            'summary': {
                'total_tokens': total_tokens,
                'total_queries': total_queries,
                'model_distribution': model_distribution
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"CodeGent stats error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# =================================================================================
# FITNESSBOT - AI-POWERED FITNESS COMPANION WITH RESEARCH
# =================================================================================

# Tavily API Setup for Research
TAVILY_API_KEY = os.getenv('TAVILY_api_key')
tavily_available = TAVILY_API_KEY is not None

class FitnessBot:
    def __init__(self):
        self.user_profile = {}
        self.conversation_history = []
        self.workout_history = []
        
    def calculate_bmi(self, weight_kg, height_cm):
        """Calculate Body Mass Index"""
        height_m = height_cm / 100
        bmi = weight_kg / (height_m ** 2)
        
        if bmi < 18.5:
            category = "Underweight"
        elif 18.5 <= bmi < 25:
            category = "Normal weight"
        elif 25 <= bmi < 30:
            category = "Overweight"
        else:
            category = "Obese"
            
        return round(bmi, 1), category
    
    def calculate_bmr(self, weight_kg, height_cm, age, gender):
        """Calculate Basal Metabolic Rate using Mifflin-St Jeor"""
        if gender.lower() in ['male', 'm']:
            bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
        else:
            bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161
        return round(bmr, 0)
    
    def calculate_tdee(self, bmr, fitness_level):
        """Calculate Total Daily Energy Expenditure"""
        activity_factors = {
            'beginner': 1.2,      # Sedentary
            'intermediate': 1.55,  # Moderately active
            'advanced': 1.725      # Very active
        }
        factor = activity_factors.get(fitness_level.lower(), 1.2)
        return round(bmr * factor, 0)
    
    def get_calorie_target(self, tdee, goal):
        """Calculate target calories based on goal"""
        targets = {
            'weight loss': tdee - 500,
            'muscle gain': tdee + 350,
            'endurance': tdee + 200,
            'flexibility': tdee,
            'general fitness': tdee,
            'athletic performance': tdee + 300
        }
        return round(targets.get(goal.lower(), tdee), 0)
    
    def get_macro_split(self, calories, goal, weight_kg):
        """Calculate macro split (protein, carbs, fats)"""
        if goal.lower() in ['muscle gain', 'athletic performance']:
            protein_g = weight_kg * 2.0
            protein_cal = protein_g * 4
            fat_cal = calories * 0.25
            carb_cal = calories - protein_cal - fat_cal
        elif goal.lower() == 'weight loss':
            protein_g = weight_kg * 1.8
            protein_cal = protein_g * 4
            fat_cal = calories * 0.30
            carb_cal = calories - protein_cal - fat_cal
        else:
            protein_g = weight_kg * 1.6
            protein_cal = protein_g * 4
            fat_cal = calories * 0.25
            carb_cal = calories - protein_cal - fat_cal
        
        return {
            'protein': round(protein_g, 0),
            'carbs': round(carb_cal / 4, 0),
            'fats': round(fat_cal / 9, 0)
        }

fitness_bot = FitnessBot()

def search_fitness_research(query):
    """Search for fitness research using Tavily API"""
    if not tavily_available:
        return []
    
    try:
        response = requests.post(
            "https://api.tavily.com/search",
            json={
                "api_key": TAVILY_API_KEY,
                "query": query + " site:pubmed.gov OR site:nih.gov OR site:strongerbyscience.com OR site:examine.com",
                "search_depth": "advanced",
                "max_results": 3,
                "include_domains": ["pubmed.gov", "nih.gov", "strongerbyscience.com", "examine.com", "ncbi.nlm.nih.gov"]
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            results = data.get('results', [])
            return [{
                'title': r.get('title', ''),
                'url': r.get('url', ''),
                'snippet': r.get('content', '')[:200]
            } for r in results[:3]]
        return []
    except Exception as e:
        logger.error(f"Tavily search error: {e}")
        return []

def generate_workout_plan(user_profile):
    """Generate personalized workout plan using Groq"""
    try:
        fitness_level = user_profile.get('fitness_level', 'beginner').lower()
        goal = user_profile.get('goal', 'general fitness')
        equipment = user_profile.get('equipment', [])
        limitations = user_profile.get('limitations', 'none')
        
        # Search for research
        research_query = f"{goal} training protocol evidence-based 2025"
        research_results = search_fitness_research(research_query)
        
        research_context = "\n".join([
            f"- {r['title']}: {r['snippet']} [Source: {r['url']}]"
            for r in research_results
        ]) if research_results else "Use general evidence-based fitness principles."
        
        prompt = f"""You are FitnessBot, an expert AI fitness coach. Create a detailed workout plan.

User Profile:
- Fitness Level: {fitness_level}
- Goal: {goal}
- Equipment Available: {', '.join(equipment) if equipment else 'None (bodyweight only)'}
- Limitations/Injuries: {limitations}

Research Context:
{research_context}

Create a complete workout plan with:
1. Warm-up (5-10 min)
2. Main Workout (3-5 exercises with sets × reps, rest periods)
3. Cool-down (5 min stretching)
4. Form tips for each exercise
5. Estimated duration and calories burned

Format as clear sections. Be specific with numbers."""

        response = generate_with_groq(prompt, temperature=0.7, max_tokens=1200)
        
        return {
            'workout_plan': response,
            'research_sources': research_results
        }
        
    except Exception as e:
        logger.error(f"Workout generation error: {e}")
        return {
            'workout_plan': "Unable to generate workout at this time.",
            'research_sources': []
        }

@app.route('/api/fitness/analyze-profile', methods=['POST'])
def analyze_fitness_profile():
    """Analyze user fitness profile and provide recommendations"""
    try:
        data = request.get_json()
        
        height = float(data.get('height', 170))
        weight = float(data.get('weight', 70))
        age = int(data.get('age', 25))
        gender = data.get('gender', 'male')
        goal = data.get('goal', 'general fitness')
        fitness_level = data.get('fitness_level', 'beginner')
        equipment = data.get('equipment', [])
        limitations = data.get('limitations', '')
        
        # Store profile
        fitness_bot.user_profile = {
            'height': height,
            'weight': weight,
            'age': age,
            'gender': gender,
            'goal': goal,
            'fitness_level': fitness_level,
            'equipment': equipment,
            'limitations': limitations
        }
        
        # Calculate metrics
        bmi, bmi_category = fitness_bot.calculate_bmi(weight, height)
        bmr = fitness_bot.calculate_bmr(weight, height, age, gender)
        tdee = fitness_bot.calculate_tdee(bmr, fitness_level)
        calorie_target = fitness_bot.get_calorie_target(tdee, goal)
        macros = fitness_bot.get_macro_split(calorie_target, goal, weight)
        
        # Generate welcome message
        welcome = f"""Welcome to FitnessBot! 💪 I've analyzed your profile:

📊 Your Stats:
- BMI: {bmi} ({bmi_category})
- Daily Calorie Needs: {int(tdee)} calories
- Target for {goal}: {int(calorie_target)} calories

🎯 Macro Targets:
- Protein: {int(macros['protein'])}g
- Carbs: {int(macros['carbs'])}g  
- Fats: {int(macros['fats'])}g

Based on your {fitness_level} level and available equipment, I'll create personalized workout plans backed by scientific research. What would you like to work on today?"""
        
        return jsonify({
            'success': True,
            'analysis': {
                'bmi': bmi,
                'bmi_category': bmi_category,
                'bmr': int(bmr),
                'tdee': int(tdee),
                'calorie_target': int(calorie_target),
                'macros': macros
            },
            'welcome_message': welcome
        })
        
    except Exception as e:
        logger.error(f"Profile analysis error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/fitness/chat', methods=['POST'])
def fitness_chat():
    """Chat endpoint for fitness conversations"""
    try:
        data = request.get_json()
        user_message = data.get('message', '')
        
        if not user_message:
            return jsonify({'success': False, 'error': 'No message provided'}), 400
        
        # Detect intent
        message_lower = user_message.lower()
        
        # Check if asking for workout
        workout_keywords = ['workout', 'exercise', 'training', 'routine', 'plan']
        research_keywords = ['research', 'study', 'evidence', 'science', 'best']
        exercise_keywords = ['form', 'how to', 'demonstrate', 'show me', 'technique']
        
        research_results = []
        animation_demo = None
        
        # Generate context-aware response
        profile_context = f"""User Profile:
- Goal: {fitness_bot.user_profile.get('goal', 'general fitness')}
- Level: {fitness_bot.user_profile.get('fitness_level', 'beginner')}
- Equipment: {', '.join(fitness_bot.user_profile.get('equipment', [])) or 'None'}
- BMI: {fitness_bot.calculate_bmi(fitness_bot.user_profile.get('weight', 70), fitness_bot.user_profile.get('height', 170))[0]}"""
        
        if any(kw in message_lower for kw in workout_keywords):
            # Generate full workout plan
            workout_data = generate_workout_plan(fitness_bot.user_profile)
            bot_response = workout_data['workout_plan']
            research_results = workout_data['research_sources']
            
        elif any(kw in message_lower for kw in research_keywords):
            # Research-focused query
            research_results = search_fitness_research(user_message)
            
            research_context = "\n".join([
                f"- {r['title']}: {r['snippet']}"
                for r in research_results
            ]) if research_results else "No specific research found."
            
            prompt = f"""You are FitnessBot, an expert fitness coach. Answer this question with research-backed information.

{profile_context}

Research Found:
{research_context}

User Question: "{user_message}"

Provide a helpful, science-based answer in 2-3 paragraphs. Cite research when relevant."""

            bot_response = generate_with_groq(prompt, temperature=0.7, max_tokens=600)
            
        elif any(kw in message_lower for kw in exercise_keywords):
            # Exercise demonstration request
            prompt = f"""You are FitnessBot. Explain proper form for this exercise with step-by-step instructions.

User Request: "{user_message}"

Provide:
1. Setup position
2. Movement steps (numbered)
3. Key form points (✓ checkmarks)
4. Common mistakes to avoid
5. Breathing pattern

Be concise but thorough."""

            bot_response = generate_with_groq(prompt, temperature=0.7, max_tokens=500)
            
            # Detect exercise for animation
            exercises = ['squat', 'push-up', 'pushup', 'lunge', 'plank', 'deadlift', 'bicep curl', 'bench press']
            for ex in exercises:
                if ex in message_lower:
                    animation_demo = ex.replace(' ', '_')
                    break
        else:
            # General conversation
            prompt = f"""You are FitnessBot, a supportive AI fitness coach.

{profile_context}

User: "{user_message}"

Respond helpfully and encouragingly. If they ask about nutrition, workouts, or fitness topics, provide evidence-based advice. Keep it conversational and motivating."""

            bot_response = generate_with_groq(prompt, temperature=0.75, max_tokens=400)
        
        # Store in history
        fitness_bot.conversation_history.append({
            'user': user_message,
            'bot': bot_response,
            'timestamp': datetime.now().isoformat()
        })
        
        return jsonify({
            'success': True,
            'response': bot_response,
            'research_sources': research_results,
            'animation_demo': animation_demo,
            'conversation_count': len(fitness_bot.conversation_history)
        })
        
    except Exception as e:
        logger.error(f"Fitness chat error: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'response': "I'm having trouble processing that. Could you rephrase?"
        }), 500

@app.route('/api/fitness/generate-workout', methods=['POST'])
def generate_workout():
    """Generate specific workout plan"""
    try:
        data = request.get_json()
        workout_type = data.get('type', 'strength')
        duration = data.get('duration', 45)
        
        workout_data = generate_workout_plan(fitness_bot.user_profile)
        
        return jsonify({
            'success': True,
            'workout': workout_data['workout_plan'],
            'sources': workout_data['research_sources'],
            'duration': duration
        })
        
    except Exception as e:
        logger.error(f"Workout generation error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/fitness/demonstrate-exercise', methods=['POST'])
def demonstrate_exercise():
    """Get exercise demonstration instructions"""
    try:
        data = request.get_json()
        exercise_name = data.get('exercise', '').lower()
        
        # Return animation keyframes for common exercises
        exercise_animations = {
            'squat': {
                'name': 'Squat',
                'keyframes': [
                    {'time': 0, 'position': 'standing', 'description': 'Stand with feet shoulder-width'},
                    {'time': 1, 'position': 'descent', 'description': 'Lower hips back and down'},
                    {'time': 2, 'position': 'bottom', 'description': 'Thighs parallel to ground'},
                    {'time': 3, 'position': 'ascent', 'description': 'Drive through heels to stand'},
                    {'time': 4, 'position': 'standing', 'description': 'Return to start'}
                ],
                'loop': 3,
                'form_tips': [
                    '✓ Keep chest up and core tight',
                    '✓ Knees track over toes',
                    '✓ Weight on heels',
                    '✗ Don\'t let knees cave inward'
                ]
            },
            'push_up': {
                'name': 'Push-Up',
                'keyframes': [
                    {'time': 0, 'position': 'plank', 'description': 'Start in plank position'},
                    {'time': 1, 'position': 'descent', 'description': 'Lower chest to ground'},
                    {'time': 2, 'position': 'bottom', 'description': 'Chest 1 inch from floor'},
                    {'time': 3, 'position': 'ascent', 'description': 'Push back to plank'},
                    {'time': 4, 'position': 'plank', 'description': 'Return to start'}
                ],
                'loop': 3,
                'form_tips': [
                    '✓ Hands shoulder-width apart',
                    '✓ Body in straight line',
                    '✓ Elbows at 45° angle',
                    '✗ Don\'t let hips sag'
                ]
            }
        }
        
        animation = exercise_animations.get(exercise_name.replace('-', '_').replace(' ', '_'), None)
        
        if animation:
            return jsonify({
                'success': True,
                'animation': animation
            })
        else:
            return jsonify({
                'success': False,
                'message': f'No animation available for {exercise_name}'
            })
            
    except Exception as e:
        logger.error(f"Exercise demo error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/fitness/research', methods=['GET'])
def research_fitness():
    """Search fitness research"""
    try:
        query = request.args.get('query', '')
        
        if not query:
            return jsonify({'success': False, 'error': 'No query provided'}), 400
        
        results = search_fitness_research(query)
        
        return jsonify({
            'success': True,
            'results': results,
            'count': len(results)
        })
        
    except Exception as e:
        logger.error(f"Research search error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# =================================================================================
# WEATHER + FOOD BOT - SMART NUTRITION ADVISOR
# =================================================================================

# OpenWeatherMap API Setup
OPENWEATHER_API_KEY = os.getenv('OPEN_WEATHER_API_KEY')
weather_available = OPENWEATHER_API_KEY is not None

class WeatherFoodBot:
    def __init__(self):
        self.user_preferences = {}
        self.conversation_history = []
        
    def get_weather_condition_category(self, temp, humidity, condition):
        """Categorize weather for food recommendations"""
        if temp > 28 and humidity > 60:
            return "hot_humid"
        elif temp < 18:
            return "cold"
        elif condition.lower() in ['rain', 'drizzle', 'thunderstorm']:
            return "rainy"
        else:
            return "moderate"
    
    def get_weather_based_foods(self, weather_category, diet_type, goal):
        """Get food recommendations based on weather"""
        foods = {
            "hot_humid": {
                "veg": [
                    {"name": "Cucumber", "benefit": "92% water, hydrating", "timing": "Snack"},
                    {"name": "Watermelon", "benefit": "Cooling, rich in vitamins", "timing": "Breakfast"},
                    {"name": "Coconut Water", "benefit": "Natural electrolytes", "timing": "Anytime"},
                    {"name": "Mint Chutney", "benefit": "Cooling herb", "timing": "With meals"},
                    {"name": "Buttermilk", "benefit": "Probiotic, cooling", "timing": "After lunch"},
                ],
                "non-veg": [
                    {"name": "Grilled Fish", "benefit": "Light protein, omega-3", "timing": "Lunch"},
                    {"name": "Boiled Eggs", "benefit": "Complete protein", "timing": "Breakfast"},
                    {"name": "Chicken Salad", "benefit": "Lean protein", "timing": "Dinner"},
                ]
            },
            "cold": {
                "veg": [
                    {"name": "Ginger Tea", "benefit": "Warming, immunity boost", "timing": "Morning"},
                    {"name": "Sweet Potato", "benefit": "Energy-dense, warming", "timing": "Lunch"},
                    {"name": "Dal with Ghee", "benefit": "Protein + healthy fats", "timing": "Dinner"},
                    {"name": "Nuts & Seeds", "benefit": "Calorie-dense warmth", "timing": "Snack"},
                ],
                "non-veg": [
                    {"name": "Chicken Soup", "benefit": "Warming, protein-rich", "timing": "Dinner"},
                    {"name": "Mutton Curry", "benefit": "High calories, warming", "timing": "Lunch"},
                    {"name": "Fish with Turmeric", "benefit": "Omega-3 + anti-inflammatory", "timing": "Lunch"},
                ]
            },
            "rainy": {
                "veg": [
                    {"name": "Moong Dal Khichdi", "benefit": "Easy digestion, comfort food", "timing": "Dinner"},
                    {"name": "Vegetable Soup", "benefit": "Hot, immunity boosting", "timing": "Lunch"},
                    {"name": "Turmeric Milk", "benefit": "Anti-inflammatory", "timing": "Before bed"},
                    {"name": "Steamed Vegetables", "benefit": "Safe, nutritious", "timing": "Dinner"},
                ],
                "non-veg": [
                    {"name": "Chicken Soup", "benefit": "Immunity, warmth", "timing": "Dinner"},
                    {"name": "Egg Curry", "benefit": "Protein + spices", "timing": "Lunch"},
                ]
            },
            "moderate": {
                "veg": [
                    {"name": "Paneer", "benefit": "High protein (18g/100g)", "timing": "Lunch"},
                    {"name": "Chickpeas", "benefit": "Protein + fiber", "timing": "Lunch"},
                    {"name": "Spinach", "benefit": "Iron, vitamins", "timing": "Dinner"},
                    {"name": "Quinoa", "benefit": "Complete protein", "timing": "Lunch"},
                ],
                "non-veg": [
                    {"name": "Chicken Breast", "benefit": "Lean protein (31g/100g)", "timing": "Lunch"},
                    {"name": "Fish", "benefit": "Omega-3, protein", "timing": "Dinner"},
                    {"name": "Eggs", "benefit": "Complete protein", "timing": "Breakfast"},
                ]
            }
        }
        
        diet_key = "veg" if diet_type.lower() in ["vegetarian", "veg"] else "non-veg"
        return foods.get(weather_category, {}).get(diet_key, [])

weather_food_bot = WeatherFoodBot()

def get_weather_data(city="Rayagada"):
    """Fetch current weather from OpenWeatherMap"""
    if not weather_available:
        return None
    
    try:
        url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={OPENWEATHER_API_KEY}&units=metric"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            return {
                "city": city,
                "temp": round(data["main"]["temp"], 1),
                "feels_like": round(data["main"]["feels_like"], 1),
                "humidity": data["main"]["humidity"],
                "condition": data["weather"][0]["main"],
                "description": data["weather"][0]["description"],
                "icon": data["weather"][0]["icon"]
            }
        return None
    except Exception as e:
        logger.error(f"Weather API error: {e}")
        return None

def generate_food_recommendations(user_prefs, weather_data):
    """Generate intelligent food recommendations using Groq + research"""
    try:
        diet_type = user_prefs.get('diet_type', 'vegetarian')
        goal = user_prefs.get('goal', 'general health')
        restrictions = user_prefs.get('restrictions', 'none')
        
        # Get weather category
        weather_category = weather_food_bot.get_weather_condition_category(
            weather_data['temp'],
            weather_data['humidity'],
            weather_data['condition']
        )
        
        # Get base recommendations
        base_foods = weather_food_bot.get_weather_based_foods(weather_category, diet_type, goal)
        
        # Research for scientific backing
        research_query = f"best {diet_type} foods for {weather_data['condition']} weather {goal} nutrition 2025"
        research_results = search_fitness_research(research_query)
        
        research_context = "\n".join([
            f"- {r['title']}: {r['snippet']}"
            for r in research_results
        ]) if research_results else "Use evidence-based nutrition principles."
        
        # Generate enhanced recommendations with Groq
        prompt = f"""You are a nutrition expert. Provide detailed food recommendations.

User Profile:
- Diet Type: {diet_type}
- Fitness Goal: {goal}
- Restrictions: {restrictions}

Weather Conditions:
- Temperature: {weather_data['temp']}°C
- Feels Like: {weather_data['feels_like']}°C
- Humidity: {weather_data['humidity']}%
- Condition: {weather_data['condition']} ({weather_data['description']})

Research Context:
{research_context}

Base Food Suggestions: {[f['name'] for f in base_foods]}

Provide 8-10 detailed food recommendations with:
1. Food name
2. Nutritional benefits (specific nutrients, calories, protein)
3. Why it's optimal for current weather conditions
4. Best meal timing
5. Brief scientific reasoning

Format as clear sections. Be specific with nutritional values."""

        response = generate_with_groq(prompt, temperature=0.7, max_tokens=1500)
        
        return {
            'recommendations': response,
            'base_foods': base_foods,
            'research_sources': research_results,
            'weather_category': weather_category
        }
        
    except Exception as e:
        logger.error(f"Food recommendation error: {e}")
        return {
            'recommendations': "Unable to generate recommendations at this time.",
            'base_foods': base_foods,
            'research_sources': [],
            'weather_category': weather_category
        }

@app.route('/api/weather', methods=['GET'])
def get_weather():
    """Get current weather data"""
    try:
        city = request.args.get('city', 'Rayagada')
        
        weather_data = get_weather_data(city)
        
        if weather_data:
            return jsonify({
                'success': True,
                'weather': weather_data
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Unable to fetch weather data'
            }), 500
            
    except Exception as e:
        logger.error(f"Weather endpoint error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/weather-food/recommend', methods=['POST'])
def recommend_weather_foods():
    """Recommend foods based on weather and user preferences"""
    try:
        data = request.get_json()
        
        diet_type = data.get('diet_type', 'vegetarian')
        goal = data.get('goal', 'general health')
        restrictions = data.get('restrictions', 'none')
        city = data.get('city', 'Rayagada')
        
        # Store preferences
        weather_food_bot.user_preferences = {
            'diet_type': diet_type,
            'goal': goal,
            'restrictions': restrictions
        }
        
        # Get weather
        weather_data = get_weather_data(city)
        
        if not weather_data:
            return jsonify({
                'success': False,
                'error': 'Unable to fetch weather data'
            }), 500
        
        # Generate recommendations
        recommendations = generate_food_recommendations(
            weather_food_bot.user_preferences,
            weather_data
        )
        
        return jsonify({
            'success': True,
            'weather': weather_data,
            'recommendations': recommendations['recommendations'],
            'base_foods': recommendations['base_foods'],
            'research_sources': recommendations['research_sources'],
            'weather_category': recommendations['weather_category']
        })
        
    except Exception as e:
        logger.error(f"Food recommendation endpoint error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/weather-food/meal-plan', methods=['POST'])
def generate_meal_plan():
    """Generate complete day meal plan based on weather"""
    try:
        data = request.get_json()
        
        diet_type = data.get('diet_type', 'vegetarian')
        goal = data.get('goal', 'general health')
        city = data.get('city', 'Rayagada')
        calorie_target = data.get('calorie_target', 2000)
        
        # Get weather
        weather_data = get_weather_data(city)
        
        if not weather_data:
            return jsonify({
                'success': False,
                'error': 'Unable to fetch weather data'
            }), 500
        
        # Generate meal plan with Groq
        prompt = f"""Create a complete day meal plan for:

Diet: {diet_type}
Goal: {goal}
Calorie Target: {calorie_target} calories
Weather: {weather_data['temp']}°C, {weather_data['condition']}, {weather_data['humidity']}% humidity

Provide:
1. Breakfast (with recipe and macros)
2. Mid-morning snack
3. Lunch (with recipe and macros)
4. Evening snack
5. Dinner (with recipe and macros)

Adjust meals for current weather conditions. Include total calories and macros."""

        meal_plan = generate_with_groq(prompt, temperature=0.7, max_tokens=1500)
        
        return jsonify({
            'success': True,
            'weather': weather_data,
            'meal_plan': meal_plan
        })
        
    except Exception as e:
        logger.error(f"Meal plan error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# =================================================================================
# LANGGRAPH UNIFIED AGENT ENDPOINT
# =================================================================================

@app.route('/api/agent/chat', methods=['POST'])
def langgraph_agent_chat():
    """
    Unified chat endpoint using LangGraph deep agents
    Handles all agent types: student, parent, professional, fitness, weather_food, zen
    """
    try:
        data = request.get_json()
        user_message = data.get('message', '')
        agent_type = data.get('agent_type', 'student')  # Default to student
        conversation_id = data.get('conversation_id', None)
        
        if not user_message:
            return jsonify({
                'success': False,
                'error': 'No message provided'
            }), 400
        
        # Validate agent type
        valid_agents = ['student', 'parent', 'professional', 'fitness', 'weather_food', 'zen']
        if agent_type not in valid_agents:
            agent_type = 'student'
        
        # Get user session (if authenticated)
        user_id = None
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            session_token = auth_header.split(' ')[1]
            session = Session.query.filter_by(session_token=session_token).first()
            if session and session.is_valid():
                user_id = session.user_id
        
        # Get or create conversation
        conversation = None
        conversation_history = []
        
        if user_id:
            if conversation_id:
                # Get existing conversation
                conversation = Conversation.query.filter_by(
                    id=conversation_id,
                    user_id=user_id
                ).first()
                
                if conversation:
                    # Get conversation history for context
                    conversation_history = get_conversation_history(conversation_id, limit=10)
            
            if not conversation:
                # Create new conversation
                conversation_title = user_message[:50] + "..." if len(user_message) > 50 else user_message
                conversation = Conversation(
                    user_id=user_id,
                    assistant_type=agent_type,
                    title=conversation_title,
                    agent_type=agent_type
                )
                db.session.add(conversation)
                db.session.commit()
                conversation_id = conversation.id
        
        # Detect mood for enhanced empathy
        mood = detect_mood_from_text(user_message)
        
        # Build context
        context = {
            'mood': mood,
            'conversation_id': conversation_id or 'anonymous'
        }
        
        # Check if LangGraph is available
        if USE_LANGGRAPH and GROQ_API_KEY:
            logger.info(f"🚀 Using LangGraph for {agent_type} agent")
            
            # Run LangGraph agent
            result = run_agent(
                user_input=user_message,
                user_type=agent_type,
                conversation_history=conversation_history,
                context=context
            )
            
            if result.get('success'):
                bot_response = result['response']
                
                # Enhance response with empathy markers
                bot_response = add_empathy_markers(bot_response, mood)
                bot_response = format_response_with_emoji(bot_response, agent_type)
                
                # Save message to database if user is authenticated
                if conversation:
                    # Save user message
                    user_msg = Message(
                        conversation_id=conversation.id,
                        role='user',
                        content=user_message
                    )
                    db.session.add(user_msg)
                    
                    # Save assistant message
                    assistant_msg = Message(
                        conversation_id=conversation.id,
                        role='assistant',
                        content=bot_response
                    )
                    db.session.add(assistant_msg)
                    
                    # Update conversation timestamp
                    conversation.last_activity = datetime.utcnow()
                    
                    db.session.commit()
                
                return jsonify({
                    'success': True,
                    'response': bot_response,
                    'agent_type': agent_type,
                    'conversation_id': conversation_id,
                    'metadata': result.get('metadata', {})
                })
            else:
                # LangGraph failed, use fallback
                logger.warning(f"⚠️  LangGraph failed: {result.get('error')}")
                bot_response = result.get('response', "I'm here for you! Tell me more. 💙")
        else:
            # Fallback to direct Groq call
            logger.info(f"ℹ️  Using fallback Groq for {agent_type} agent")
            
            # Simple system prompt based on agent type
            system_prompts = {
                'student': "You are Maya, an empathetic study companion. Be supportive and encouraging.",
                'parent': "You are a caring parenting assistant. Provide helpful, non-judgmental advice.",
                'professional': "You are a professional wellness coach. Offer practical work-life balance tips.",
                'fitness': "You are an enthusiastic fitness coach. Motivate and guide users.",
                'weather_food': "You are a cheerful food assistant. Suggest meals and recipes.",
                'zen': "You are a calming mindfulness guide. Provide peaceful meditation guidance."
            }
            
            prompt = f"{system_prompts.get(agent_type, system_prompts['student'])}\n\nUser: {user_message}\n\nRespond warmly in 2-3 sentences."
            bot_response = generate_with_groq(prompt, temperature=0.7, max_tokens=300)
            
            if not bot_response:
                bot_response = "I'm here for you! Could you tell me more? 💙"
        
        return jsonify({
            'success': True,
            'response': bot_response,
            'agent_type': agent_type,
            'conversation_id': conversation_id,
            'framework': 'langgraph' if USE_LANGGRAPH else 'fallback'
        })
        
    except Exception as e:
        logger.error(f"❌ Agent chat error: {e}")
        logger.error(traceback.format_exc())
        
        return jsonify({
            'success': False,
            'error': str(e),
            'response': "I'm here for you! Let's try that again. 💙"
        }), 500


# =================================================================================
# CORS AND SERVER ROUTES
# =================================================================================

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# =================================================================================
# MAIN STARTUP
# =================================================================================

if __name__ == '__main__':
    import webbrowser
    import time
    
    port = 5000
    
    # Display startup banner
    logger.info("=" * 60)
    logger.info("🚀 CodeCalm AI Mental Wellness Platform Starting...")
    logger.info("=" * 60)
    
    if groq_available:
        logger.info(f"☁️  Student/Parent/Professional Bots: Groq {GROQ_MODEL}")
        logger.info("🤖 CodeGent: OpenRouter (Claude/GPT-4/Gemini)")
    else:
        logger.error("❌ NO AI BACKEND AVAILABLE!")
        
    logger.info("=" * 60)
    logger.info(f"💙 Maya (Student Support) - Using Groq {GROQ_MODEL}")
    logger.info(f"🏠 ParentBot (Parent Assistant) - Using Groq {GROQ_MODEL}")
    logger.info(f"💼 Luna (Professional Wellness) - Using Groq {GROQ_MODEL}")
    logger.info("🤖 CodeGent (Coding Tutor) - Using OpenRouter API")
    logger.info("=" * 60)
    logger.info(f"🌐 Server running on http://localhost:{port}")
    logger.info("✅ Ready for connections!")
    logger.info("=" * 60)
    
    # Auto-open website in browser after short delay
    def open_browser():
        time.sleep(1.5)  # Wait for server to start
        webbrowser.open(f'http://localhost:{port}')
        logger.info("🌐 Opening CodeCalm website in browser...")
    
    # Start browser opening in background thread
    threading.Thread(target=open_browser, daemon=True).start()
    
    # Start Flask server
    app.run(debug=True, host='0.0.0.0', port=port, use_reloader=False)
