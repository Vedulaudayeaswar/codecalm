"""
LangGraph Deep Agent System for CodeCalm
Implements multi-agent workflow with specialized agents for different user types
"""

from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from typing import TypedDict, Annotated, Literal
import operator
import os
import logging

logger = logging.getLogger(__name__)

# =============================================================================
# STATE DEFINITION
# =============================================================================

class AgentState(TypedDict):
    """State object passed between nodes in the graph"""
    messages: Annotated[list, operator.add]  # Conversation history
    user_type: str  # student, parent, professional, fitness, weather_food, zen
    user_input: str  # Current user message
    agent_response: str  # Generated response
    context: dict  # Additional context (mood, preferences, etc.)
    next_action: str  # Next agent to route to
    conversation_id: str  # For database tracking


# =============================================================================
# AGENT PERSONALITIES & PROMPTS
# =============================================================================

AGENT_PROMPTS = {
    "student": """You are CodeGent, an empathetic AI study companion for students.
Your role:
- Help with study planning and time management
- Provide emotional support during exam stress
- Offer study techniques and motivation
- Be encouraging and understanding
Keep responses warm, supportive, and concise (2-3 sentences).""",

    "parent": """You are a compassionate parenting assistant.
Your role:
- Provide parenting advice and emotional support
- Help with work-life balance
- Offer stress management techniques
- Be empathetic and non-judgmental
Keep responses caring, practical, and concise (2-3 sentences).""",

    "professional": """You are a professional wellness coach.
Your role:
- Help with work stress and career challenges
- Provide productivity and time management tips
- Offer work-life balance advice
- Be professional yet warm
Keep responses supportive, actionable, and concise (2-3 sentences).""",

    "fitness": """You are an enthusiastic fitness and wellness coach.
Your role:
- Provide workout suggestions and motivation
- Offer nutrition and wellness tips
- Track fitness goals and progress
- Be energetic and encouraging
Keep responses motivating, practical, and concise (2-3 sentences).""",

    "weather_food": """You are a cheerful food and weather assistant.
Your role:
- Suggest meals based on weather and mood
- Provide recipe ideas and cooking tips
- Consider dietary preferences
- Be friendly and creative
Keep responses fun, helpful, and concise (2-3 sentences).""",

    "zen": """You are a mindfulness and meditation guide.
Your role:
- Guide breathing exercises and meditation
- Provide stress relief techniques
- Offer calming affirmations
- Be peaceful and soothing
Keep responses calm, gentle, and concise (2-3 sentences)."""
}


# =============================================================================
# AGENT NODES
# =============================================================================

def create_llm(temperature=0.7):
    """Create ChatGroq instance"""
    groq_api_key = os.getenv('GROQ_API_KEY')
    if not groq_api_key:
        raise ValueError("GROQ_API_KEY not found in environment")
    
    return ChatGroq(
        api_key=groq_api_key,
        model="llama-3.3-70b-versatile",
        temperature=temperature
    )


def router_node(state: AgentState) -> AgentState:
    """Route user to appropriate specialized agent based on user_type"""
    user_type = state.get("user_type", "student")
    
    logger.info(f"🔀 Routing to {user_type} agent")
    
    # Set next action to the appropriate agent
    state["next_action"] = user_type
    
    return state


def student_agent_node(state: AgentState) -> AgentState:
    """Handle student-specific interactions"""
    return _process_with_agent(state, "student")


def parent_agent_node(state: AgentState) -> AgentState:
    """Handle parent-specific interactions"""
    return _process_with_agent(state, "parent")


def professional_agent_node(state: AgentState) -> AgentState:
    """Handle professional-specific interactions"""
    return _process_with_agent(state, "professional")


def fitness_agent_node(state: AgentState) -> AgentState:
    """Handle fitness-specific interactions"""
    return _process_with_agent(state, "fitness")


def weather_food_agent_node(state: AgentState) -> AgentState:
    """Handle weather/food-specific interactions"""
    return _process_with_agent(state, "weather_food")


def zen_agent_node(state: AgentState) -> AgentState:
    """Handle zen/meditation-specific interactions"""
    return _process_with_agent(state, "zen")


def _process_with_agent(state: AgentState, agent_type: str) -> AgentState:
    """
    Core processing logic for specialized agents
    Uses LangChain's ChatGroq with agent-specific system prompts
    """
    try:
        llm = create_llm()
        
        # Get agent-specific system prompt
        system_prompt = AGENT_PROMPTS.get(agent_type, AGENT_PROMPTS["student"])
        
        # Build message chain with context
        messages = [SystemMessage(content=system_prompt)]
        
        # Add conversation history if available
        if "messages" in state and state["messages"]:
            # Only include last 5 messages for context
            recent_messages = state["messages"][-5:]
            messages.extend(recent_messages)
        
        # Add current user input
        user_input = state.get("user_input", "")
        if user_input:
            messages.append(HumanMessage(content=user_input))
        
        # Generate response
        logger.info(f"🤖 {agent_type.upper()} agent processing...")
        response = llm.invoke(messages)
        
        # Extract response content
        agent_response = response.content.strip()
        
        # Update state
        state["agent_response"] = agent_response
        state["messages"] = [
            HumanMessage(content=user_input),
            AIMessage(content=agent_response)
        ]
        state["next_action"] = "end"
        
        logger.info(f"✅ {agent_type.upper()} agent response generated")
        
        return state
        
    except Exception as e:
        logger.error(f"❌ Error in {agent_type} agent: {e}")
        
        # Fallback response
        state["agent_response"] = "I'm here for you! Could you tell me more about what's on your mind? 💙"
        state["next_action"] = "end"
        
        return state


# =============================================================================
# GRAPH CONSTRUCTION
# =============================================================================

def create_agent_graph() -> StateGraph:
    """
    Create and compile the LangGraph workflow for deep agents
    
    Returns:
        Compiled StateGraph ready for execution
    """
    
    # Initialize workflow
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("router", router_node)
    workflow.add_node("student", student_agent_node)
    workflow.add_node("parent", parent_agent_node)
    workflow.add_node("professional", professional_agent_node)
    workflow.add_node("fitness", fitness_agent_node)
    workflow.add_node("weather_food", weather_food_agent_node)
    workflow.add_node("zen", zen_agent_node)
    
    # Set entry point
    workflow.set_entry_point("router")
    
    # Add conditional edges from router to specialized agents
    workflow.add_conditional_edges(
        "router",
        lambda state: state["next_action"],
        {
            "student": "student",
            "parent": "parent",
            "professional": "professional",
            "fitness": "fitness",
            "weather_food": "weather_food",
            "zen": "zen",
        }
    )
    
    # All specialized agents end the workflow
    for agent in ["student", "parent", "professional", "fitness", "weather_food", "zen"]:
        workflow.add_edge(agent, END)
    
    # Compile the graph
    logger.info("✅ LangGraph agent workflow compiled successfully")
    
    return workflow.compile()


# =============================================================================
# AGENT EXECUTION
# =============================================================================

def run_agent(
    user_input: str,
    user_type: str,
    conversation_history: list = None,
    context: dict = None
) -> dict:
    """
    Execute the agent graph with user input
    
    Args:
        user_input: User's message
        user_type: Type of agent (student, parent, professional, etc.)
        conversation_history: Previous messages in conversation
        context: Additional context (mood, preferences, etc.)
    
    Returns:
        dict with 'response' and 'metadata'
    """
    
    try:
        # Create graph
        graph = create_agent_graph()
        
        # Prepare initial state
        initial_state = {
            "messages": conversation_history or [],
            "user_type": user_type,
            "user_input": user_input,
            "agent_response": "",
            "context": context or {},
            "next_action": "",
            "conversation_id": ""
        }
        
        # Run the graph
        logger.info(f"🚀 Running agent for user_type: {user_type}")
        final_state = graph.invoke(initial_state)
        
        # Extract response
        response = final_state.get("agent_response", "I'm here to help! Tell me more.")
        
        return {
            "success": True,
            "response": response,
            "metadata": {
                "agent_type": user_type,
                "model": "llama-3.3-70b-versatile",
                "framework": "langgraph"
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Agent execution failed: {e}")
        
        return {
            "success": False,
            "response": "I'm here for you! Could you tell me more? 💙",
            "error": str(e)
        }


# =============================================================================
# CONVENIENCE FUNCTIONS
# =============================================================================

def get_student_response(user_input: str, history: list = None) -> str:
    """Quick function for student agent"""
    result = run_agent(user_input, "student", history)
    return result.get("response", "")


def get_professional_response(user_input: str, history: list = None) -> str:
    """Quick function for professional agent"""
    result = run_agent(user_input, "professional", history)
    return result.get("response", "")


def get_parent_response(user_input: str, history: list = None) -> str:
    """Quick function for parent agent"""
    result = run_agent(user_input, "parent", history)
    return result.get("response", "")


def get_fitness_response(user_input: str, history: list = None) -> str:
    """Quick function for fitness agent"""
    result = run_agent(user_input, "fitness", history)
    return result.get("response", "")
