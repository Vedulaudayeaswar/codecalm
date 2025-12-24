/**
 * CodeCalm Authentication Utility
 * Manages user authentication state across the platform
 */

const AUTH_API_BASE = "http://localhost:5000/api/auth";
const CHAT_API_BASE = "http://localhost:5000/api/chat";

// =============================================================================
// AUTHENTICATION HELPERS
// =============================================================================

/**
 * Check if user is logged in
 */
function isLoggedIn() {
  const token = localStorage.getItem("codecalm_session_token");
  const user = localStorage.getItem("codecalm_user");
  return !!(token && user);
}

/**
 * Get current user data
 */
function getCurrentUser() {
  const userStr = localStorage.getItem("codecalm_user");
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }
  return null;
}

/**
 * Get session token
 */
function getSessionToken() {
  return localStorage.getItem("codecalm_session_token");
}

/**
 * Logout user
 */
async function logout() {
  const token = getSessionToken();

  if (token) {
    try {
      // Call backend logout API
      await fetch(`${AUTH_API_BASE}/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  // Clear local storage
  localStorage.removeItem("codecalm_session_token");
  localStorage.removeItem("codecalm_user");

  // Redirect to login
  window.location.href = "/frontend/html/login.html";
}

/**
 * Validate session with backend
 */
async function validateSession() {
  const token = getSessionToken();

  if (!token) {
    return false;
  }

  try {
    const response = await fetch(`${AUTH_API_BASE}/validate`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (data.success && data.valid) {
      // Update user data
      localStorage.setItem("codecalm_user", JSON.stringify(data.user));
      return true;
    } else {
      // Session invalid, logout
      logout();
      return false;
    }
  } catch (error) {
    console.error("Session validation error:", error);
    return false;
  }
}

/**
 * Require authentication (use in protected pages)
 */
async function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = "/frontend/html/login.html";
    return false;
  }

  // Validate session
  const valid = await validateSession();
  if (!valid) {
    return false;
  }

  return true;
}

// =============================================================================
// CHAT HISTORY HELPERS
// =============================================================================

/**
 * Create a new conversation
 */
async function createConversation(assistantType, title) {
  const token = getSessionToken();

  if (!token) {
    throw new Error("Not authenticated");
  }

  try {
    const response = await fetch(`${CHAT_API_BASE}/conversations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ assistant_type: assistantType, title }),
    });

    const data = await response.json();

    if (data.success) {
      return data.conversation;
    } else {
      throw new Error(data.message || "Failed to create conversation");
    }
  } catch (error) {
    console.error("Create conversation error:", error);
    throw error;
  }
}

/**
 * Get all conversations for current user
 */
async function getConversations(assistantType = null, limit = 10) {
  const token = getSessionToken();

  if (!token) {
    throw new Error("Not authenticated");
  }

  try {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (assistantType) {
      params.append("assistant_type", assistantType);
    }

    const response = await fetch(`${CHAT_API_BASE}/conversations?${params}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (data.success) {
      return data.conversations;
    } else {
      throw new Error(data.message || "Failed to get conversations");
    }
  } catch (error) {
    console.error("Get conversations error:", error);
    throw error;
  }
}

/**
 * Get conversation with messages
 */
async function getConversation(conversationId) {
  const token = getSessionToken();

  if (!token) {
    throw new Error("Not authenticated");
  }

  try {
    const response = await fetch(
      `${CHAT_API_BASE}/conversations/${conversationId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (data.success) {
      return data.conversation;
    } else {
      throw new Error(data.message || "Failed to get conversation");
    }
  } catch (error) {
    console.error("Get conversation error:", error);
    throw error;
  }
}

/**
 * Add message to conversation
 */
async function addMessage(
  conversationId,
  sender,
  content,
  modelUsed = null,
  tokens = 0
) {
  const token = getSessionToken();

  if (!token) {
    throw new Error("Not authenticated");
  }

  try {
    const response = await fetch(
      `${CHAT_API_BASE}/conversations/${conversationId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender,
          content,
          model_used: modelUsed,
          tokens,
        }),
      }
    );

    const data = await response.json();

    if (data.success) {
      return data.message;
    } else {
      throw new Error(data.message || "Failed to add message");
    }
  } catch (error) {
    console.error("Add message error:", error);
    throw error;
  }
}

/**
 * Delete conversation
 */
async function deleteConversation(conversationId) {
  const token = getSessionToken();

  if (!token) {
    throw new Error("Not authenticated");
  }

  try {
    const response = await fetch(
      `${CHAT_API_BASE}/conversations/${conversationId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (data.success) {
      return true;
    } else {
      throw new Error(data.message || "Failed to delete conversation");
    }
  } catch (error) {
    console.error("Delete conversation error:", error);
    throw error;
  }
}

// =============================================================================
// UI HELPERS
// =============================================================================

/**
 * Update header with user info
 */
function updateHeaderUI() {
  if (isLoggedIn()) {
    const user = getCurrentUser();
    const loginBtn = document.getElementById("loginBtn");

    if (loginBtn && user) {
      loginBtn.textContent = `👤 ${user.full_name}`;
      loginBtn.onclick = () => {
        if (confirm("Do you want to logout?")) {
          logout();
        }
      };
    }
  }
}

/**
 * Show user greeting
 */
function showUserGreeting() {
  if (isLoggedIn()) {
    const user = getCurrentUser();
    if (user) {
      console.log(`✅ Welcome back, ${user.full_name}! (${user.role})`);
      return `Welcome back, ${user.full_name}!`;
    }
  }
  return null;
}

// Auto-update UI on page load
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    updateHeaderUI();
  });
}
