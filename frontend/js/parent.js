// ===== THREE.JS 3D ROBOT SETUP =====
let scene,
  camera,
  renderer,
  robot,
  leftArm,
  rightArm,
  leftHand,
  rightHand,
  heart,
  head,
  mouth;
let mouseX = 0,
  mouseY = 0;
let targetRotationX = 0,
  targetRotationY = 0;

// ===== VOICE FEATURES =====
let recognition;
let synthesis = window.speechSynthesis;
let isListening = false;
let isSpeaking = false;
let mouthAnimationFrame;
let voices = [];

// Initialize speech synthesis voices
function loadVoices() {
  voices = synthesis.getVoices();
  // Prefer female voices for warm, parental tone
  // Try to find natural-sounding voices (Google UK English Female, Microsoft Zira, etc.)
}

if (synthesis.onvoiceschanged !== undefined) {
  synthesis.onvoiceschanged = loadVoices;
}
loadVoices();

function init3DRobot() {
  const canvas = document.getElementById("robotCanvas");
  const width = canvas.offsetWidth;
  const height = canvas.offsetHeight;

  // Scene
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.z = 8;

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setSize(width, height);
  renderer.setClearColor(0x000000, 0);

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const pointLight1 = new THREE.PointLight(0xff6b9d, 1, 100);
  pointLight1.position.set(5, 5, 5);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0xffb6c1, 0.8, 100);
  pointLight2.position.set(-5, -5, 5);
  scene.add(pointLight2);

  // Create Robot
  robot = new THREE.Group();

  // Head
  const headGeometry = new THREE.BoxGeometry(2, 2, 2);
  const headMaterial = new THREE.MeshPhongMaterial({
    color: 0xffb6c1,
    shininess: 100,
  });
  head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.y = 2.5;
  robot.add(head);

  // Eyes
  const eyeGeometry = new THREE.SphereGeometry(0.3, 16, 16);
  const eyeMaterial = new THREE.MeshPhongMaterial({
    color: 0x000000,
    emissive: 0x333333,
  });

  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(-0.5, 2.7, 1.1);
  robot.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(0.5, 2.7, 1.1);
  robot.add(rightEye);

  // Smile
  const smileCurve = new THREE.EllipseCurve(
    0,
    0,
    0.6,
    0.3,
    0,
    Math.PI,
    false,
    0
  );
  const smilePoints = smileCurve.getPoints(50);
  const smileGeometry = new THREE.BufferGeometry().setFromPoints(smilePoints);
  const smileMaterial = new THREE.LineBasicMaterial({
    color: 0x000000,
    linewidth: 3,
  });
  const smile = new THREE.Line(smileGeometry, smileMaterial);
  smile.position.set(0, 2.2, 1.1);
  smile.rotation.x = Math.PI;
  robot.add(smile);

  // Mouth (for speaking animation)
  const mouthGeometry = new THREE.BoxGeometry(0.8, 0.15, 0.1);
  const mouthMaterial = new THREE.MeshPhongMaterial({
    color: 0xff1493,
    shininess: 50,
  });
  mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
  mouth.position.set(0, 2.1, 1.15);
  robot.add(mouth);

  // Heart on chest
  const heartShape = new THREE.Shape();
  heartShape.moveTo(0, 0);
  heartShape.bezierCurveTo(0, -0.3, -0.6, -0.3, -0.6, 0);
  heartShape.bezierCurveTo(-0.6, 0.3, 0, 0.6, 0, 1);
  heartShape.bezierCurveTo(0, 0.6, 0.6, 0.3, 0.6, 0);
  heartShape.bezierCurveTo(0.6, -0.3, 0, -0.3, 0, 0);

  const heartGeometry = new THREE.ExtrudeGeometry(heartShape, {
    depth: 0.2,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
  });
  const heartMaterial = new THREE.MeshPhongMaterial({
    color: 0xff6b9d,
    emissive: 0xff1744,
  });
  heart = new THREE.Mesh(heartGeometry, heartMaterial);
  heart.position.set(0, 0.5, 1.1);
  heart.scale.set(0.5, 0.5, 0.5);
  robot.add(heart);

  // Body
  const bodyGeometry = new THREE.BoxGeometry(2.5, 2, 1.5);
  const bodyMaterial = new THREE.MeshPhongMaterial({
    color: 0xffc0cb,
    shininess: 80,
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.5;
  robot.add(body);

  // Arms
  const armGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 16);
  const armMaterial = new THREE.MeshPhongMaterial({
    color: 0xffb6c1,
    shininess: 90,
  });

  leftArm = new THREE.Mesh(armGeometry, armMaterial);
  leftArm.position.set(-1.5, 0.5, 0);
  leftArm.rotation.z = 0.3;
  robot.add(leftArm);

  rightArm = new THREE.Mesh(armGeometry, armMaterial);
  rightArm.position.set(1.5, 0.5, 0);
  rightArm.rotation.z = -0.3;
  robot.add(rightArm);

  // Hands
  const handGeometry = new THREE.SphereGeometry(0.4, 16, 16);
  const handMaterial = new THREE.MeshPhongMaterial({
    color: 0xff69b4,
    shininess: 100,
  });

  leftHand = new THREE.Mesh(handGeometry, handMaterial);
  leftHand.position.set(-1.8, -0.5, 0);
  robot.add(leftHand);

  rightHand = new THREE.Mesh(handGeometry, handMaterial);
  rightHand.position.set(1.8, -0.5, 0);
  robot.add(rightHand);

  scene.add(robot);

  // Mouse interaction
  canvas.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("touchmove", onTouchMove);

  // Start animation
  animate();
}

function onMouseMove(event) {
  const rect = event.target.getBoundingClientRect();
  mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function onTouchMove(event) {
  if (event.touches.length > 0) {
    const rect = event.target.getBoundingClientRect();
    mouseX = ((event.touches[0].clientX - rect.left) / rect.width) * 2 - 1;
    mouseY = -((event.touches[0].clientY - rect.top) / rect.height) * 2 + 1;
  }
}

function animate() {
  requestAnimationFrame(animate);

  // Smooth rotation based on mouse
  targetRotationY = mouseX * 0.5;
  targetRotationX = mouseY * 0.3;

  robot.rotation.y += (targetRotationY - robot.rotation.y) * 0.05;
  robot.rotation.x += (targetRotationX - robot.rotation.x) * 0.05;

  // Gentle floating animation
  robot.position.y = Math.sin(Date.now() * 0.001) * 0.2;

  // Breathing effect
  const breathe = Math.sin(Date.now() * 0.002) * 0.02 + 1;
  robot.scale.set(breathe, breathe, breathe);

  // Continuous caring hand gestures
  if (leftArm && rightArm) {
    leftArm.rotation.z = 0.3 + Math.sin(Date.now() * 0.0015) * 0.15;
    rightArm.rotation.z = -0.3 - Math.sin(Date.now() * 0.0015) * 0.15;
  }

  // Head tilts with empathy
  if (head) {
    head.rotation.z = Math.sin(Date.now() * 0.001) * 0.08;
  }

  // Heart pulses with warmth
  if (heart) {
    const heartbeat = Math.sin(Date.now() * 0.003) * 0.05 + 1;
    heart.scale.set(0.5 * heartbeat, 0.5 * heartbeat, 0.5 * heartbeat);
  }

  renderer.render(scene, camera);
}

// Robot emotion animations
function setRobotThinking() {
  // Scale down slightly when thinking
  if (robot) {
    const currentScale = robot.scale.x;
    const targetScale = 0.95;
    animateScale(currentScale, targetScale, 300);

    // Hands come together (thoughtful pose)
    if (leftArm && rightArm) {
      animateArmRotation(leftArm, "z", 0.6, 400);
      animateArmRotation(rightArm, "z", -0.6, 400);
    }
  }
}

function setRobotHappy() {
  // Bounce when happy with enthusiastic arm waves
  if (robot) {
    const bounceAnimation = () => {
      let startTime = null;
      const duration = 600;

      const bounce = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);

        if (progress < 0.5) {
          robot.scale.set(
            1 + progress * 0.2,
            1 + progress * 0.2,
            1 + progress * 0.2
          );
          robot.rotation.z = progress * 0.4;

          // Happy arm waves
          if (leftArm && rightArm) {
            leftArm.rotation.z = 0.3 - progress * 0.8;
            rightArm.rotation.z = -0.3 + progress * 0.8;
            leftArm.rotation.x = progress * 0.3;
            rightArm.rotation.x = progress * 0.3;
          }

          // Heart grows with happiness
          if (heart) {
            heart.scale.set(
              0.5 * (1 + progress * 0.3),
              0.5 * (1 + progress * 0.3),
              0.5 * (1 + progress * 0.3)
            );
          }
        } else {
          const reverseProgress = 1 - progress;
          robot.scale.set(
            1 + reverseProgress * 0.2,
            1 + reverseProgress * 0.2,
            1 + reverseProgress * 0.2
          );
          robot.rotation.z = reverseProgress * 0.4;

          if (leftArm && rightArm) {
            leftArm.rotation.z = 0.3 - reverseProgress * 0.8;
            rightArm.rotation.z = -0.3 + reverseProgress * 0.8;
            leftArm.rotation.x = reverseProgress * 0.3;
            rightArm.rotation.x = reverseProgress * 0.3;
          }

          if (heart) {
            heart.scale.set(
              0.5 * (1 + reverseProgress * 0.3),
              0.5 * (1 + reverseProgress * 0.3),
              0.5 * (1 + reverseProgress * 0.3)
            );
          }
        }

        if (progress < 1) {
          requestAnimationFrame(bounce);
        } else {
          robot.scale.set(1, 1, 1);
          robot.rotation.z = 0;
          if (leftArm && rightArm) {
            leftArm.rotation.z = 0.3;
            rightArm.rotation.z = -0.3;
            leftArm.rotation.x = 0;
            rightArm.rotation.x = 0;
          }
          if (heart) {
            heart.scale.set(0.5, 0.5, 0.5);
          }
        }
      };

      requestAnimationFrame(bounce);
    };

    bounceAnimation();
  }
}

function setRobotSad() {
  // Slump down with arms dropping
  if (robot) {
    let startTime = null;
    const duration = 500;

    const sadAnimation = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      robot.scale.set(
        1 - progress * 0.1,
        1 - progress * 0.1,
        1 - progress * 0.1
      );
      robot.position.y -= progress * 0.05;

      // Arms droop down
      if (leftArm && rightArm) {
        leftArm.rotation.z = 0.3 + progress * 0.4;
        rightArm.rotation.z = -0.3 - progress * 0.4;
      }

      // Head tilts down
      if (head) {
        head.rotation.x = progress * 0.3;
      }

      if (progress < 1) {
        requestAnimationFrame(sadAnimation);
      }
    };

    requestAnimationFrame(sadAnimation);
  }
}

function setRobotNeutral() {
  if (robot) {
    const currentScale = robot.scale.x;
    animateScale(currentScale, 1, 300);
    robot.rotation.z = 0;

    // Reset arms to neutral
    if (leftArm && rightArm) {
      animateArmRotation(leftArm, "z", 0.3, 300);
      animateArmRotation(rightArm, "z", -0.3, 300);
      animateArmRotation(leftArm, "x", 0, 300);
      animateArmRotation(rightArm, "x", 0, 300);
    }

    // Reset head
    if (head) {
      let startTime = null;
      const duration = 300;
      const startRotation = head.rotation.x;

      const resetHead = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);

        head.rotation.x = startRotation * (1 - progress);

        if (progress < 1) {
          requestAnimationFrame(resetHead);
        }
      };

      requestAnimationFrame(resetHead);
    }
  }
}

function animateArmRotation(arm, axis, targetValue, duration) {
  let startTime = null;
  const startValue = arm.rotation[axis];

  const animate = (timestamp) => {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);

    arm.rotation[axis] = startValue + (targetValue - startValue) * progress;

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);
}

function animateScale(from, to, duration) {
  let startTime = null;

  const animate = (timestamp) => {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const scale = from + (to - from) * progress;
    if (robot) {
      robot.scale.set(scale, scale, scale);
    }

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);
}

// Initialize 3D robot when page loads
window.addEventListener("load", () => {
  init3DRobot();
  initConversation(); // Start AI conversation on page load
});

// Handle window resize
window.addEventListener("resize", () => {
  const canvas = document.getElementById("robotCanvas");
  if (canvas && camera && renderer) {
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
});

// ===== CHAT FUNCTIONALITY =====
const chatMessages = document.getElementById("chatMessages");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const typingIndicator = document.getElementById("typingIndicator");
const quickBtns = document.querySelectorAll(".quick-btn");

// Enhanced add message with smooth animations
function addMessage(text, isUser = false) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${isUser ? "user-message" : "bot-message"}`;

  const contentDiv = document.createElement("div");
  contentDiv.className = "message-content";
  contentDiv.innerHTML = `<p>${text}</p>`;

  messageDiv.appendChild(contentDiv);
  chatMessages.appendChild(messageDiv);

  // Trigger animation
  setTimeout(() => {
    messageDiv.classList.add("visible");
  }, 10);

  // Smooth scroll
  setTimeout(() => {
    chatMessages.scrollTo({
      top: chatMessages.scrollHeight,
      behavior: "smooth",
    });
  }, 100);
}

// Show/hide typing
function showTyping() {
  typingIndicator.classList.add("active");
  setRobotThinking();
}

function hideTyping() {
  typingIndicator.classList.remove("active");
  setRobotNeutral();
}

// ===== VOICE ANIMATION FUNCTIONS =====
function animateMouthSpeaking() {
  if (!isSpeaking || !mouth) return;

  // Open and close mouth while speaking
  const time = Date.now() * 0.01;
  mouth.scale.y = 1 + Math.sin(time) * 0.5;
  mouth.position.y = 2.1 + Math.sin(time) * 0.05;

  mouthAnimationFrame = requestAnimationFrame(animateMouthSpeaking);
}

function startMouthAnimation() {
  isSpeaking = true;
  animateMouthSpeaking();
}

function stopMouthAnimation() {
  isSpeaking = false;
  if (mouthAnimationFrame) {
    cancelAnimationFrame(mouthAnimationFrame);
  }
  if (mouth) {
    mouth.scale.y = 1;
    mouth.position.y = 2.1;
  }
}

// ===== VOICE RECOGNITION =====
function initVoiceRecognition() {
  if (
    !("webkitSpeechRecognition" in window) &&
    !("SpeechRecognition" in window)
  ) {
    console.error("Speech recognition not supported");
    return;
  }

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onstart = () => {
    isListening = true;
    document.getElementById("voiceBtn").classList.add("listening");
    document.getElementById("voiceBtn").innerHTML =
      '<i class="fas fa-microphone-slash"></i>';
    setRobotThinking();
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    console.log("🎤 Heard:", transcript);

    // Display user's spoken message in chat
    addMessage(transcript, true);

    // Get bot response
    handleVoiceInput(transcript);
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    isListening = false;
    document.getElementById("voiceBtn").classList.remove("listening");
    document.getElementById("voiceBtn").innerHTML =
      '<i class="fas fa-microphone"></i>';
    setRobotNeutral();
  };

  recognition.onend = () => {
    isListening = false;
    document.getElementById("voiceBtn").classList.remove("listening");
    document.getElementById("voiceBtn").innerHTML =
      '<i class="fas fa-microphone"></i>';
  };
}

function toggleVoiceRecognition() {
  if (!recognition) {
    initVoiceRecognition();
    if (!recognition) return;
  }

  if (isListening) {
    recognition.stop();
  } else {
    recognition.start();
  }
}

async function handleVoiceInput(message) {
  const response = await getBotResponse(message);
  addMessage(response);
  speakResponse(response);
}

// ===== TEXT-TO-SPEECH =====
function speakResponse(text) {
  // Stop any ongoing speech
  synthesis.cancel();

  // Clean text for speech (remove markdown, emojis, etc.)
  const cleanText = text
    .replace(/[*_`#]/g, "") // Remove markdown
    .replace(/\n+/g, ". ") // Replace newlines with pauses
    .replace(/[🤗💆⚖️👨‍👩‍👧💼📚🎯⏰💪🧠🚀]/g, "") // Remove emojis
    .replace(/\s+/g, " ") // Normalize spaces
    .trim();

  const utterance = new SpeechSynthesisUtterance(cleanText);

  // Configure warm, parental voice
  utterance.rate = 0.95; // Slightly slower for warmth
  utterance.pitch = 1.1; // Slightly higher for friendly tone
  utterance.volume = 1.0;

  // Try to find a natural female voice
  const preferredVoices = voices.filter(
    (voice) =>
      voice.name.includes("Google US English") ||
      voice.name.includes("Microsoft Zira") ||
      voice.name.includes("Samantha") ||
      (voice.lang.startsWith("en") && voice.name.includes("Female"))
  );

  if (preferredVoices.length > 0) {
    utterance.voice = preferredVoices[0];
  } else if (voices.length > 0) {
    // Fallback to first English voice
    const englishVoice = voices.find((v) => v.lang.startsWith("en"));
    if (englishVoice) utterance.voice = englishVoice;
  }

  utterance.onstart = () => {
    startMouthAnimation();
    setRobotHappy();
  };

  utterance.onend = () => {
    stopMouthAnimation();
    setRobotNeutral();
  };

  utterance.onerror = (event) => {
    console.error("Speech synthesis error:", event);
    stopMouthAnimation();
    setRobotNeutral();
  };

  synthesis.speak(utterance);
}

// ===== API CONFIGURATION =====
const API_BASE_URL = "http://localhost:5000";

let conversationStarted = false;

// Initialize conversation with backend
async function initConversation() {
  if (conversationStarted) return;

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/parent/start-conversation`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Parent" }),
      }
    );

    const data = await response.json();
    if (data.success && data.message) {
      // Replace initial message with AI-generated welcome
      const firstMessage = document.querySelector(".bot-message");
      if (firstMessage) {
        firstMessage.querySelector(
          ".message-content"
        ).innerHTML = `<p>${data.message}</p>`;
      }
      conversationStarted = true;
      console.log("✅ Connected to ParentBot AI backend");
    }
  } catch (error) {
    console.error("⚠️ Backend not available, using offline mode:", error);
  }
}

// Bot responses - NOW USES BACKEND AI (Ollama/Gemini)
async function getBotResponse(userMessage) {
  showTyping();

  try {
    // Call backend API for AI response
    const response = await fetch(`${API_BASE_URL}/api/parent/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userMessage,
        enable_voice: false,
      }),
    });

    const data = await response.json();
    hideTyping();

    if (data.success && data.response) {
      setRobotHappy();
      console.log("🤖 AI Response:", data.response.substring(0, 50) + "...");
      console.log("📊 Task Type:", data.task_type);
      return data.response;
    } else {
      throw new Error("Invalid response from backend");
    }
  } catch (error) {
    hideTyping();
    console.error("❌ Backend error:", error);

    // Fallback response if backend is down
    return "I'm having trouble connecting to my AI brain right now. 🤗\n\nPlease make sure the backend server is running:\n\n```bash\ncd backend\npython main.py\n```\n\nOr check if Ollama/Gemini is configured properly. What would you like help with?";
  }
}

// Send message
async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  userInput.classList.add("sending");
  setTimeout(() => userInput.classList.remove("sending"), 400);

  addMessage(message, true);
  userInput.value = "";

  const response = await getBotResponse(message);
  addMessage(response);
}

// Event listeners
sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

quickBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    userInput.value = btn.getAttribute("data-question");
    sendMessage();
  });
});
