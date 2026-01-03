// ===================================
// CODEGENT - SOCRATIC CODING TUTOR
// Multi-LLM Routing with Real-time Analytics
// ===================================

let conversationHistory = [];
let conversationState = { step: 0, understanding: "exploring" };
let conversationId = null; // Track current conversation ID
let tokenChart = null;
let totalTokens = { claude: 0, gpt: 0, gemini: 0 };

// DOM Elements
const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const analyzingDiv = document.getElementById("analyzing");
const analyzingText = document.getElementById("analyzing-text");

// Analyzing text rotation
const analyzingTexts = [
  "🔍 Analyzing your query...",
  "🤖 Selecting optimal AI model...",
  "🧠 Processing with intelligent routing...",
  "⚡ Preparing personalized response...",
  "🎯 Optimizing teaching approach...",
];

let analyzingInterval = null;

// Initialize Chart.js
function initChart() {
  const ctx = document.getElementById("token-chart").getContext("2d");
  tokenChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Claude (Coding)", "GPT-4 (Teaching)", "Gemini (General)"],
      datasets: [
        {
          data: [0, 0, 0],
          backgroundColor: [
            "rgba(96, 165, 250, 0.8)",
            "rgba(52, 211, 153, 0.8)",
            "rgba(251, 191, 36, 0.8)",
          ],
          borderColor: [
            "rgba(96, 165, 250, 1)",
            "rgba(52, 211, 153, 1)",
            "rgba(251, 191, 36, 1)",
          ],
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            color: "#9ca3af",
            font: {
              size: 11,
            },
            padding: 15,
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: "#1a1a1a",
          titleColor: "#ffffff",
          bodyColor: "#e5e7eb",
          borderColor: "#262626",
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage =
                total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${label}: ${value} tokens (${percentage}%)`;
            },
          },
        },
      },
    },
  });
}

// Update statistics display
function updateStats(tokenUsage) {
  const summary = tokenUsage.summary || {};
  const distribution = summary.model_distribution || {};

  // Update Claude stats
  const claudeData = distribution.claude || {
    queries: 0,
    tokens: 0,
    percentage: 0,
  };
  document.getElementById("claude-queries").textContent = claudeData.queries;
  document.getElementById("claude-tokens").textContent =
    claudeData.tokens.toLocaleString();
  document.getElementById(
    "claude-bar"
  ).style.width = `${claudeData.percentage}%`;

  // Update GPT stats
  const gptData = distribution.gpt || { queries: 0, tokens: 0, percentage: 0 };
  document.getElementById("gpt-queries").textContent = gptData.queries;
  document.getElementById("gpt-tokens").textContent =
    gptData.tokens.toLocaleString();
  document.getElementById("gpt-bar").style.width = `${gptData.percentage}%`;

  // Update Gemini stats
  const geminiData = distribution.gemini || {
    queries: 0,
    tokens: 0,
    percentage: 0,
  };
  document.getElementById("gemini-queries").textContent = geminiData.queries;
  document.getElementById("gemini-tokens").textContent =
    geminiData.tokens.toLocaleString();
  document.getElementById(
    "gemini-bar"
  ).style.width = `${geminiData.percentage}%`;

  // Update chart
  if (tokenChart) {
    tokenChart.data.datasets[0].data = [
      claudeData.tokens,
      gptData.tokens,
      geminiData.tokens,
    ];
    tokenChart.update();
  }

  // Update routing decisions
  updateRoutingDecisions(tokenUsage.token_usage);
}

// Update routing decisions display
function updateRoutingDecisions(tokenUsageData) {
  const decisionsList = document.getElementById("decisions-list");

  // Collect all recent decisions
  let allDecisions = [];

  for (const [modelName, data] of Object.entries(tokenUsageData)) {
    if (data.reasons && Array.isArray(data.reasons)) {
      data.reasons.forEach((reason) => {
        allDecisions.push({
          model: modelName,
          ...reason,
        });
      });
    }
  }

  // Sort by timestamp (most recent first)
  allDecisions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Take last 5 decisions
  allDecisions = allDecisions.slice(0, 5);

  if (allDecisions.length === 0) {
    decisionsList.innerHTML =
      '<p class="no-decisions">No queries yet. Start chatting!</p>';
    return;
  }

  // Build HTML
  let html = "";
  allDecisions.forEach((decision) => {
    const time = new Date(decision.timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    html += `
            <div class="decision-item ${decision.model}">
                <div class="decision-query">"${decision.query}"</div>
                <div class="decision-reason">${decision.reason}</div>
                <div class="decision-meta">
                    <span>🤖 ${decision.model.toUpperCase()}</span>
                    <span>⏱️ ${time}</span>
                    <span>📊 ${decision.tokens} tokens</span>
                </div>
            </div>
        `;
  });

  decisionsList.innerHTML = html;
}

// Add message to chat
function addMessage(
  text,
  sender,
  modelUsed = null,
  routingReason = null,
  motivationalFact = null
) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${sender}`;

  const contentDiv = document.createElement("div");
  contentDiv.className = "message-content";

  // Format code blocks properly
  let formattedText = text
    .replace(/```(\w+)?\n([\s\S]*?)```/g, "<pre><code>$2</code></pre>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br>");

  contentDiv.innerHTML = formattedText;
  messageDiv.appendChild(contentDiv);

  // Add model badge for assistant messages
  if (sender === "assistant" && modelUsed) {
    const metaDiv = document.createElement("div");
    metaDiv.style.marginTop = "8px";
    metaDiv.style.display = "flex";
    metaDiv.style.flexWrap = "wrap";
    metaDiv.style.gap = "8px";

    const badge = document.createElement("span");
    badge.className = `model-badge ${modelUsed}`;

    const modelIcons = {
      claude: "🧠",
      gpt: "🎓",
      gemini: "💬",
    };

    badge.innerHTML = `${
      modelIcons[modelUsed] || "🤖"
    } Powered by ${modelUsed.toUpperCase()}`;
    metaDiv.appendChild(badge);

    messageDiv.appendChild(metaDiv);

    // Add routing reason tooltip
    if (routingReason) {
      const reasonDiv = document.createElement("div");
      reasonDiv.style.fontSize = "11px";
      reasonDiv.style.color = "#6b7280";
      reasonDiv.style.marginTop = "6px";
      reasonDiv.style.fontStyle = "italic";
      reasonDiv.textContent = `💡 ${routingReason}`;
      messageDiv.appendChild(reasonDiv);
    }
  }

  chatMessages.appendChild(messageDiv);

  // Add motivational fact if present
  if (motivationalFact) {
    const factDiv = document.createElement("div");
    factDiv.className = "motivational-fact";
    factDiv.textContent = motivationalFact;
    chatMessages.appendChild(factDiv);
  }

  // Smooth scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show analyzing state
function showAnalyzing() {
  analyzingDiv.classList.remove("hidden");
  let index = 0;

  analyzingInterval = setInterval(() => {
    analyzingText.textContent = analyzingTexts[index % analyzingTexts.length];
    index++;
  }, 1500);
}

// Hide analyzing state
function hideAnalyzing() {
  analyzingDiv.classList.add("hidden");
  if (analyzingInterval) {
    clearInterval(analyzingInterval);
    analyzingInterval = null;
  }
}

// Send message to backend
async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  // Add user message to UI
  addMessage(message, "user");
  conversationHistory.push({ sender: "user", text: message });

  // Clear input and disable button
  userInput.value = "";
  userInput.style.height = "auto";
  sendBtn.disabled = true;

  // Show analyzing state
  showAnalyzing();

  try {
    // Get session token from localStorage (check both possible keys)
    const sessionToken =
      localStorage.getItem("codecalm_session_token") ||
      localStorage.getItem("session_token");

    const headers = {
      "Content-Type": "application/json",
    };

    // Add Authorization header if user is logged in
    if (sessionToken) {
      headers["Authorization"] = `Bearer ${sessionToken}`;
      console.log("✅ Sending request with auth token");
    } else {
      console.log("⚠️ No session token found - conversations won't be saved");
    }

    const API_BASE =
      window.location.hostname === "localhost"
        ? "http://localhost:5000"
        : window.location.origin;
    const response = await fetch(`${API_BASE}/api/codegent/chat`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        message: message,
        history: conversationHistory,
        state: conversationState,
        conversation_id: conversationId, // Send existing conversation ID
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      // Hide analyzing
      hideAnalyzing();

      // Add assistant response
      addMessage(
        data.response,
        "assistant",
        data.model_used,
        data.routing_reason,
        data.motivational_fact
      );

      conversationHistory.push({
        sender: "assistant",
        text: data.response,
      });

      // Update conversation state
      conversationState = data.state;

      // Store conversation ID for continuity
      if (data.conversation_id) {
        conversationId = data.conversation_id;
        console.log("Conversation saved with ID:", conversationId);
      }

      // Fetch and update stats
      await fetchStats();
    } else {
      hideAnalyzing();
      addMessage(
        `Error: ${data.error || "Unknown error occurred"}`,
        "assistant"
      );
    }
  } catch (error) {
    hideAnalyzing();
    console.error("Error:", error);
    addMessage(
      "❌ Sorry, I encountered an error connecting to the server. Please make sure the backend is running and try again.",
      "assistant"
    );
  } finally {
    sendBtn.disabled = false;
    userInput.focus();
  }
}

// Fetch statistics from backend
async function fetchStats() {
  try {
    const API_BASE =
      window.location.hostname === "localhost"
        ? "http://localhost:5000"
        : window.location.origin;
    const response = await fetch(`${API_BASE}/api/codegent/stats`);
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        updateStats(data);
      }
    }
  } catch (error) {
    console.error("Error fetching stats:", error);
  }
}

// Auto-resize textarea
function autoResize(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
}

// Event Listeners
sendBtn.addEventListener("click", sendMessage);

userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

userInput.addEventListener("input", (e) => {
  autoResize(e.target);
});

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  initChart();

  // Add welcome message
  addMessage(
    `👋 **Welcome to CodeGent!**

I'm your Socratic coding tutor. Unlike typical AI assistants that give you direct answers, I'll help you **learn** by:

🎯 **Asking guiding questions** to build your understanding
🧩 **Breaking problems into smaller steps**
💡 **Encouraging you to think through solutions**
📚 **Explaining concepts, not just code**

**Try asking me:**
- "How do I print the first 10 numbers in Python?"
- "Explain what recursion is"
- "Help me debug this code: [paste code]"
- "What's the difference between a list and a tuple?"

Let's start learning! What would you like to explore today? 🚀`,
    "assistant",
    null,
    null,
    null
  );

  userInput.focus();

  // Fetch initial stats
  fetchStats();

  // Periodically update stats (every 30 seconds)
  setInterval(fetchStats, 30000);
});

// Handle page visibility (pause stats updates when tab is hidden)
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    fetchStats();
  }
});
