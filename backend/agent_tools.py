"""
Agent Tools for LangGraph Deep Agents
Provides additional capabilities like memory retrieval, context building, etc.
"""

from langchain_core.messages import HumanMessage, AIMessage
from datetime import datetime
from models import Conversation, Message
import logging

logger = logging.getLogger(__name__)

# =============================================================================
# CONVERSATION HISTORY TOOLS
# =============================================================================

def get_conversation_history(conversation_id: str, limit: int = 10) -> list:
    """
    Retrieve conversation history from database
    
    Args:
        conversation_id: Database conversation ID
        limit: Maximum number of messages to retrieve
    
    Returns:
        List of LangChain message objects
    """
    try:
        messages = Message.query.filter_by(
            conversation_id=conversation_id
        ).order_by(
            Message.timestamp.desc()
        ).limit(limit).all()
        
        # Convert to LangChain messages (reverse to chronological order)
        langchain_messages = []
        for msg in reversed(messages):
            if msg.role == 'user':
                langchain_messages.append(HumanMessage(content=msg.content))
            elif msg.role == 'assistant':
                langchain_messages.append(AIMessage(content=msg.content))
        
        logger.info(f"📚 Retrieved {len(langchain_messages)} messages from conversation {conversation_id}")
        return langchain_messages
        
    except Exception as e:
        logger.error(f"❌ Error retrieving conversation history: {e}")
        return []


def build_context_from_conversation(conversation_id: str) -> dict:
    """
    Build context dictionary from conversation metadata
    
    Args:
        conversation_id: Database conversation ID
    
    Returns:
        Dictionary with context information
    """
    try:
        conversation = Conversation.query.get(conversation_id)
        
        if not conversation:
            return {}
        
        context = {
            "agent_type": conversation.agent_type,
            "started_at": conversation.started_at.isoformat() if conversation.started_at else None,
            "message_count": len(conversation.messages),
            "last_activity": conversation.last_activity.isoformat() if conversation.last_activity else None
        }
        
        return context
        
    except Exception as e:
        logger.error(f"❌ Error building context: {e}")
        return {}


# =============================================================================
# MOOD & SENTIMENT ANALYSIS
# =============================================================================

def detect_mood_from_text(text: str) -> str:
    """
    Simple keyword-based mood detection
    Can be enhanced with sentiment analysis models
    
    Args:
        text: User input text
    
    Returns:
        Detected mood (stressed, happy, sad, neutral)
    """
    text_lower = text.lower()
    
    # Stress indicators
    stress_keywords = ['stressed', 'anxious', 'worried', 'overwhelmed', 'panic', 'pressure']
    if any(keyword in text_lower for keyword in stress_keywords):
        return 'stressed'
    
    # Happy indicators
    happy_keywords = ['happy', 'excited', 'great', 'awesome', 'wonderful', 'fantastic']
    if any(keyword in text_lower for keyword in happy_keywords):
        return 'happy'
    
    # Sad indicators
    sad_keywords = ['sad', 'depressed', 'down', 'upset', 'crying', 'lonely']
    if any(keyword in text_lower for keyword in sad_keywords):
        return 'sad'
    
    return 'neutral'


# =============================================================================
# RESPONSE ENHANCEMENT
# =============================================================================

def add_empathy_markers(response: str, mood: str) -> str:
    """
    Add appropriate empathy markers based on detected mood
    
    Args:
        response: Generated agent response
        mood: Detected user mood
    
    Returns:
        Enhanced response with empathy markers
    """
    
    empathy_prefixes = {
        'stressed': "I can sense you're feeling overwhelmed. ",
        'sad': "I'm here for you during this tough time. ",
        'happy': "I'm so glad to hear you're doing well! ",
        'neutral': ""
    }
    
    prefix = empathy_prefixes.get(mood, "")
    
    # Only add if response doesn't already have emotional acknowledgment
    if prefix and not any(word in response.lower() for word in ['understand', 'sense', 'hear', 'glad']):
        return prefix + response
    
    return response


def format_response_with_emoji(response: str, agent_type: str) -> str:
    """
    Add appropriate emojis based on agent type
    
    Args:
        response: Generated response
        agent_type: Type of agent
    
    Returns:
        Response with contextual emoji
    """
    
    emoji_map = {
        'student': '📚',
        'parent': '💙',
        'professional': '💼',
        'fitness': '💪',
        'weather_food': '🍽️',
        'zen': '🧘'
    }
    
    emoji = emoji_map.get(agent_type, '💙')
    
    # Add emoji if not already present
    if emoji not in response:
        # Add at end if response ends with punctuation, otherwise add space
        if response and response[-1] in '.!?':
            return f"{response} {emoji}"
        else:
            return f"{response} {emoji}"
    
    return response


# =============================================================================
# CONTEXT BUILDERS
# =============================================================================

def build_student_context(user_input: str) -> dict:
    """Build context specific to student interactions"""
    
    context = {
        "domain": "student",
        "focus_areas": []
    }
    
    text_lower = user_input.lower()
    
    if any(word in text_lower for word in ['exam', 'test', 'quiz']):
        context["focus_areas"].append("exam_prep")
    
    if any(word in text_lower for word in ['study', 'homework', 'assignment']):
        context["focus_areas"].append("study_help")
    
    if any(word in text_lower for word in ['motivation', 'procrastination', 'focus']):
        context["focus_areas"].append("motivation")
    
    return context


def build_professional_context(user_input: str) -> dict:
    """Build context specific to professional interactions"""
    
    context = {
        "domain": "professional",
        "focus_areas": []
    }
    
    text_lower = user_input.lower()
    
    if any(word in text_lower for word in ['deadline', 'project', 'meeting']):
        context["focus_areas"].append("work_tasks")
    
    if any(word in text_lower for word in ['stress', 'burnout', 'overwhelmed']):
        context["focus_areas"].append("stress_management")
    
    if any(word in text_lower for word in ['balance', 'time', 'productivity']):
        context["focus_areas"].append("work_life_balance")
    
    return context


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def truncate_history(messages: list, max_messages: int = 10) -> list:
    """
    Truncate conversation history to prevent token overflow
    
    Args:
        messages: List of messages
        max_messages: Maximum number of messages to keep
    
    Returns:
        Truncated message list
    """
    if len(messages) <= max_messages:
        return messages
    
    # Keep the most recent messages
    return messages[-max_messages:]


def get_timestamp() -> str:
    """Get current timestamp in ISO format"""
    return datetime.utcnow().isoformat()
