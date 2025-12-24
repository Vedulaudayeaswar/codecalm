/**
 * Example: How to use the new LangGraph Agent endpoint from frontend
 *
 * You can add this to any of your existing JS files:
 * - frontend/js/student.js
 * - frontend/js/professional.js
 * - frontend/js/parent.js
 * etc.
 */

// =============================================================================
// LANGGRAPH AGENT CLIENT
// =============================================================================

class LangGraphAgentClient {
  constructor(agentType, apiUrl = "http://localhost:5000") {
    this.agentType = agentType; // 'student', 'professional', 'fitness', etc.
    this.apiUrl = apiUrl;
    this.conversationId = null;
    this.sessionToken = localStorage.getItem("session_token");
  }

  /**
   * Send message to LangGraph agent
   * @param {string} message - User's message
   * @returns {Promise<object>} - Agent response
   */
  async chat(message) {
    try {
      const headers = {
        "Content-Type": "application/json",
      };

      // Add auth token if available
      if (this.sessionToken) {
        headers["Authorization"] = `Bearer ${this.sessionToken}`;
      }

      const response = await fetch(`${this.apiUrl}/api/agent/chat`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          message: message,
          agent_type: this.agentType,
          conversation_id: this.conversationId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Save conversation ID for future messages
        this.conversationId = data.conversation_id;

        return {
          success: true,
          message: data.response,
          metadata: data.metadata,
          conversationId: data.conversation_id,
        };
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (error) {
      console.error("LangGraph Agent Error:", error);
      return {
        success: false,
        message: "I'm here for you! Let's try that again. 💙",
        error: error.message,
      };
    }
  }

  /**
   * Start a new conversation
   */
  newConversation() {
    this.conversationId = null;
  }

  /**
   * Get current conversation ID
   */
  getConversationId() {
    return this.conversationId;
  }
}

// =============================================================================
// EXAMPLE USAGE 1: Simple Student Chat
// =============================================================================

async function exampleStudentChat() {
  // Initialize student agent
  const studentAgent = new LangGraphAgentClient("student");

  // Send message
  const response = await studentAgent.chat(
    "I'm stressed about my upcoming exams"
  );

  console.log("Agent Response:", response.message);
  // Output: "I understand exam stress can be overwhelming..."
}

// =============================================================================
// EXAMPLE USAGE 2: Professional Chat with UI Integration
// =============================================================================

async function initializeProfessionalBot() {
  const agent = new LangGraphAgentClient("professional");
  const chatMessages = document.getElementById("chat-messages");
  const userInput = document.getElementById("user-input");
  const sendButton = document.getElementById("send-button");

  sendButton.addEventListener("click", async () => {
    const message = userInput.value.trim();
    if (!message) return;

    // Display user message
    appendMessage("user", message);
    userInput.value = "";

    // Show typing indicator
    showTypingIndicator();

    // Get agent response
    const response = await agent.chat(message);

    // Hide typing indicator
    hideTypingIndicator();

    // Display agent response
    if (response.success) {
      appendMessage("agent", response.message);
    } else {
      appendMessage("agent", response.message, true); // Show as error
    }
  });

  function appendMessage(sender, text, isError = false) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}-message`;
    if (isError) messageDiv.classList.add("error");
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function showTypingIndicator() {
    const indicator = document.createElement("div");
    indicator.id = "typing-indicator";
    indicator.className = "typing-indicator";
    indicator.innerHTML = "<span></span><span></span><span></span>";
    chatMessages.appendChild(indicator);
  }

  function hideTypingIndicator() {
    const indicator = document.getElementById("typing-indicator");
    if (indicator) indicator.remove();
  }
}

// =============================================================================
// EXAMPLE USAGE 3: Multi-Agent System (Switch Between Agents)
// =============================================================================

class MultiAgentManager {
  constructor() {
    this.agents = {
      student: new LangGraphAgentClient("student"),
      professional: new LangGraphAgentClient("professional"),
      parent: new LangGraphAgentClient("parent"),
      fitness: new LangGraphAgentClient("fitness"),
      weather_food: new LangGraphAgentClient("weather_food"),
      zen: new LangGraphAgentClient("zen"),
    };
    this.currentAgent = "student";
  }

  switchAgent(agentType) {
    if (this.agents[agentType]) {
      this.currentAgent = agentType;
      console.log(`Switched to ${agentType} agent`);
    }
  }

  async chat(message) {
    return await this.agents[this.currentAgent].chat(message);
  }

  getCurrentAgent() {
    return this.currentAgent;
  }
}

// Usage:
const manager = new MultiAgentManager();
await manager.chat("I'm feeling stressed"); // Uses student agent
manager.switchAgent("professional");
await manager.chat("How do I manage work deadlines?"); // Uses professional agent

// =============================================================================
// EXAMPLE USAGE 4: Replacing Existing sendMessage Function
// =============================================================================

/**
 * Replace your existing sendMessage function with this
 * (Compatible with your current student.js, professional.js, etc.)
 */
async function sendMessage() {
  const userMessage = document.getElementById("user-input").value.trim();
  if (!userMessage) return;

  // Initialize agent if not already done
  if (!window.langGraphAgent) {
    // Detect agent type from current page
    const agentType = detectAgentType(); // 'student', 'professional', etc.
    window.langGraphAgent = new LangGraphAgentClient(agentType);
  }

  // Display user message in chat
  appendMessage("user", userMessage);
  document.getElementById("user-input").value = "";

  // Show typing indicator
  showTypingIndicator();

  // Get response from LangGraph agent
  const response = await window.langGraphAgent.chat(userMessage);

  // Hide typing indicator
  hideTypingIndicator();

  // Display response
  appendMessage("assistant", response.message);
}

function detectAgentType() {
  // Detect from URL or page element
  const path = window.location.pathname;
  if (path.includes("student")) return "student";
  if (path.includes("professional")) return "professional";
  if (path.includes("parent")) return "parent";
  if (path.includes("fitness")) return "fitness";
  if (path.includes("weatherfood")) return "weather_food";
  if (path.includes("zen")) return "zen";
  return "student"; // default
}

// =============================================================================
// EXAMPLE USAGE 5: With Conversation History Loading
// =============================================================================

async function loadAndContinueConversation(conversationId) {
  const agent = new LangGraphAgentClient("student");

  // Set existing conversation ID
  agent.conversationId = conversationId;

  // Continue chatting - context is automatically loaded from database
  const response = await agent.chat("Can we continue where we left off?");

  console.log(response.message);
  // Agent will have context from previous conversation!
}

// =============================================================================
// READY TO USE!
// =============================================================================

/**
 * Quick Start:
 *
 * 1. Add this file to your HTML:
 *    <script src="js/langgraph-client.js"></script>
 *
 * 2. Initialize in your page:
 *    const agent = new LangGraphAgentClient('student');
 *
 * 3. Use it:
 *    const response = await agent.chat("Hello!");
 *    console.log(response.message);
 *
 * That's it! 🎉
 */
