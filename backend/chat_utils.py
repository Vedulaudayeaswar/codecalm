"""
Chat History Utilities for CodeCalm Platform

Handles:
- Creating conversations
- Saving messages
- Loading chat history
- Managing conversation metadata
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from models import db, User, Session, Conversation, Message, RoutingLog
from functools import wraps

chat_bp = Blueprint('chat', __name__, url_prefix='/api/chat')

# =============================================================================
# AUTHENTICATION DECORATOR
# =============================================================================

def require_auth(f):
    """
    Decorator to require valid session token
    Adds user_id to kwargs
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get session token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'message': 'No session token provided'
            }), 401
        
        session_token = auth_header.split(' ')[1]
        
        # Find and validate session
        session = Session.query.filter_by(session_token=session_token).first()
        
        if not session or not session.is_valid():
            return jsonify({
                'success': False,
                'message': 'Invalid or expired session'
            }), 401
        
        # Get user
        user = User.query.get(session.user_id)
        
        if not user or not user.is_active:
            return jsonify({
                'success': False,
                'message': 'User not found or inactive'
            }), 401
        
        # Add user_id to kwargs
        kwargs['user_id'] = user.id
        return f(*args, **kwargs)
    
    return decorated_function


# =============================================================================
# CREATE NEW CONVERSATION
# =============================================================================

@chat_bp.route('/conversations', methods=['POST'])
@require_auth
def create_conversation(user_id):
    """
    Create a new conversation for a specific AI assistant
    
    Request Headers:
    Authorization: Bearer <session_token>
    
    Request Body:
    {
        "assistant_type": "mental",  // mental, codegent, parent, professional, student, fitness
        "title": "My First Chat"  // optional
    }
    
    Response:
    {
        "success": true,
        "conversation": {...}
    }
    """
    try:
        data = request.get_json()
        
        # Validate assistant type
        valid_assistants = ['mental', 'codegent', 'parent', 'professional', 'student', 'fitness']
        assistant_type = data.get('assistant_type', '').lower()
        
        if assistant_type not in valid_assistants:
            return jsonify({
                'success': False,
                'message': f'Invalid assistant type. Must be one of: {", ".join(valid_assistants)}'
            }), 400
        
        # Create conversation
        title = data.get('title', f'New {assistant_type.title()} Chat')
        conversation = Conversation(
            user_id=user_id,
            assistant_type=assistant_type,
            title=title
        )
        
        db.session.add(conversation)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'conversation': conversation.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Failed to create conversation: {str(e)}'
        }), 500


# =============================================================================
# GET USER'S CONVERSATIONS
# =============================================================================

@chat_bp.route('/conversations', methods=['GET'])
@require_auth
def get_conversations(user_id):
    """
    Get all conversations for the current user
    
    Query Parameters:
    - assistant_type: Filter by assistant type (optional)
    - limit: Number of conversations to return (default: 10)
    - include_messages: Include messages in response (default: false)
    
    Request Headers:
    Authorization: Bearer <session_token>
    
    Response:
    {
        "success": true,
        "conversations": [...]
    }
    """
    try:
        # Get query parameters
        assistant_type = request.args.get('assistant_type', '').lower()
        limit = int(request.args.get('limit', 10))
        include_messages = request.args.get('include_messages', 'false').lower() == 'true'
        
        # Build query
        query = Conversation.query.filter_by(user_id=user_id).filter(Conversation.deleted_at.is_(None))
        
        # Filter by assistant type if provided
        if assistant_type:
            query = query.filter_by(assistant_type=assistant_type)
        
        # Order by most recent and limit
        conversations = query.order_by(Conversation.updated_at.desc()).limit(limit).all()
        
        return jsonify({
            'success': True,
            'conversations': [conv.to_dict(include_messages=include_messages) for conv in conversations]
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to get conversations: {str(e)}'
        }), 500


# =============================================================================
# GET SINGLE CONVERSATION WITH MESSAGES
# =============================================================================

@chat_bp.route('/conversations/<int:conversation_id>', methods=['GET'])
@require_auth
def get_conversation(user_id, conversation_id):
    """
    Get a specific conversation with full message history
    
    Request Headers:
    Authorization: Bearer <session_token>
    
    Response:
    {
        "success": true,
        "conversation": {...}
    }
    """
    try:
        # Find conversation
        conversation = Conversation.query.filter_by(
            id=conversation_id,
            user_id=user_id
        ).filter(Conversation.deleted_at.is_(None)).first()
        
        if not conversation:
            return jsonify({
                'success': False,
                'message': 'Conversation not found'
            }), 404
        
        return jsonify({
            'success': True,
            'conversation': conversation.to_dict(include_messages=True)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to get conversation: {str(e)}'
        }), 500


# =============================================================================
# ADD MESSAGE TO CONVERSATION
# =============================================================================

@chat_bp.route('/conversations/<int:conversation_id>/messages', methods=['POST'])
@require_auth
def add_message(user_id, conversation_id):
    """
    Add a message to a conversation
    
    Request Headers:
    Authorization: Bearer <session_token>
    
    Request Body:
    {
        "sender": "user",  // user, assistant, system
        "content": "Hello, how can you help me?",
        "model_used": "groq-llama-70b",  // optional
        "tokens": 150  // optional
    }
    
    Response:
    {
        "success": true,
        "message": {...}
    }
    """
    try:
        # Verify conversation belongs to user
        conversation = Conversation.query.filter_by(
            id=conversation_id,
            user_id=user_id
        ).filter(Conversation.deleted_at.is_(None)).first()
        
        if not conversation:
            return jsonify({
                'success': False,
                'message': 'Conversation not found'
            }), 404
        
        data = request.get_json()
        
        # Validate required fields
        if 'sender' not in data or 'content' not in data:
            return jsonify({
                'success': False,
                'message': 'Sender and content are required'
            }), 400
        
        # Validate sender
        valid_senders = ['user', 'assistant', 'system']
        sender = data['sender'].lower()
        if sender not in valid_senders:
            return jsonify({
                'success': False,
                'message': f'Invalid sender. Must be one of: {", ".join(valid_senders)}'
            }), 400
        
        # Create message
        message = Message(
            conversation_id=conversation_id,
            sender=sender,
            content=data['content'],
            model_used=data.get('model_used'),
            tokens=data.get('tokens', 0)
        )
        
        db.session.add(message)
        
        # Update conversation's updated_at timestamp
        conversation.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': message.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Failed to add message: {str(e)}'
        }), 500


# =============================================================================
# DELETE CONVERSATION (SOFT DELETE)
# =============================================================================

@chat_bp.route('/conversations/<int:conversation_id>', methods=['DELETE'])
@require_auth
def delete_conversation(user_id, conversation_id):
    """
    Soft delete a conversation
    
    Request Headers:
    Authorization: Bearer <session_token>
    
    Response:
    {
        "success": true,
        "message": "Conversation deleted successfully"
    }
    """
    try:
        # Find conversation
        conversation = Conversation.query.filter_by(
            id=conversation_id,
            user_id=user_id
        ).filter(Conversation.deleted_at.is_(None)).first()
        
        if not conversation:
            return jsonify({
                'success': False,
                'message': 'Conversation not found'
            }), 404
        
        # Soft delete
        conversation.soft_delete()
        
        return jsonify({
            'success': True,
            'message': 'Conversation deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Failed to delete conversation: {str(e)}'
        }), 500


# =============================================================================
# LOG ROUTING DECISION
# =============================================================================

@chat_bp.route('/routing-log', methods=['POST'])
@require_auth
def log_routing(user_id):
    """
    Log an LLM routing decision for analytics
    
    Request Headers:
    Authorization: Bearer <session_token>
    
    Request Body:
    {
        "conversation_id": 1,
        "message_id": 5,  // optional
        "selected_model": "groq-llama-70b",
        "query_type": "coding",
        "latency_ms": 234,
        "cost_estimate": 0.0015,
        "reasoning": "Selected Groq for fast inference"
    }
    
    Response:
    {
        "success": true,
        "log": {...}
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        if 'conversation_id' not in data or 'selected_model' not in data:
            return jsonify({
                'success': False,
                'message': 'conversation_id and selected_model are required'
            }), 400
        
        conversation_id = data['conversation_id']
        
        # Verify conversation belongs to user
        conversation = Conversation.query.filter_by(
            id=conversation_id,
            user_id=user_id
        ).first()
        
        if not conversation:
            return jsonify({
                'success': False,
                'message': 'Conversation not found'
            }), 404
        
        # Create routing log
        routing_log = RoutingLog(
            conversation_id=conversation_id,
            message_id=data.get('message_id'),
            selected_model=data['selected_model'],
            query_type=data.get('query_type'),
            latency_ms=data.get('latency_ms', 0),
            cost_estimate=data.get('cost_estimate', 0.0),
            reasoning=data.get('reasoning')
        )
        
        db.session.add(routing_log)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'log': routing_log.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Failed to log routing: {str(e)}'
        }), 500


# =============================================================================
# GET ROUTING ANALYTICS
# =============================================================================

@chat_bp.route('/analytics/routing', methods=['GET'])
@require_auth
def get_routing_analytics(user_id):
    """
    Get routing analytics for the user's conversations
    
    Query Parameters:
    - limit: Number of logs to return (default: 50)
    - conversation_id: Filter by conversation (optional)
    
    Request Headers:
    Authorization: Bearer <session_token>
    
    Response:
    {
        "success": true,
        "analytics": {
            "logs": [...],
            "summary": {
                "total_requests": 100,
                "model_distribution": {...},
                "avg_latency_ms": 245
            }
        }
    }
    """
    try:
        limit = int(request.args.get('limit', 50))
        conversation_id = request.args.get('conversation_id')
        
        # Build query
        query = db.session.query(RoutingLog).join(Conversation).filter(
            Conversation.user_id == user_id
        )
        
        if conversation_id:
            query = query.filter(RoutingLog.conversation_id == conversation_id)
        
        # Get logs
        logs = query.order_by(RoutingLog.created_at.desc()).limit(limit).all()
        
        # Calculate summary statistics
        all_logs = query.all()
        total = len(all_logs)
        
        model_distribution = {}
        total_latency = 0
        
        for log in all_logs:
            # Count model usage
            model = log.selected_model
            model_distribution[model] = model_distribution.get(model, 0) + 1
            total_latency += log.latency_ms
        
        avg_latency = total_latency / total if total > 0 else 0
        
        return jsonify({
            'success': True,
            'analytics': {
                'logs': [log.to_dict() for log in logs],
                'summary': {
                    'total_requests': total,
                    'model_distribution': model_distribution,
                    'avg_latency_ms': round(avg_latency, 2)
                }
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to get analytics: {str(e)}'
        }), 500
