// FitnessBot - AI-Powered Fitness Companion
// Three.js Robot Animation + Chat Interface

const API_BASE = "http://localhost:5000/api";

// Global state
let userProfile = {};
let conversationHistory = [];
let scene, camera, renderer, robot;
let currentAnimation = "idle";

// =============================================================================
// THREE.JS ROBOT SETUP
// =============================================================================

class FitnessRobot {
  constructor(container) {
    this.container = container;
    this.init();
    this.createRobot();
    this.animate();
  }

  init() {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf5f7fa);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      50,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: document.getElementById("robot-canvas"),
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);

    // Handle resize
    window.addEventListener("resize", () => this.onWindowResize());
  }

  createRobot() {
    this.robotGroup = new THREE.Group();

    // Materials
    const primaryMaterial = new THREE.MeshPhongMaterial({
      color: 0x4a90e2,
      shininess: 30,
    });
    const accentMaterial = new THREE.MeshPhongMaterial({
      color: 0x64b5f6,
      shininess: 50,
    });
    const whiteMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      shininess: 80,
    });

    // Head (circular)
    const headGeometry = new THREE.SphereGeometry(0.6, 32, 32);
    this.head = new THREE.Mesh(headGeometry, primaryMaterial);
    this.head.position.y = 1.5;
    this.robotGroup.add(this.head);

    // Eyes (two circles)
    const eyeGeometry = new THREE.CircleGeometry(0.15, 32);
    this.leftEye = new THREE.Mesh(eyeGeometry, whiteMaterial);
    this.leftEye.position.set(-0.2, 1.6, 0.5);
    this.robotGroup.add(this.leftEye);

    this.rightEye = new THREE.Mesh(eyeGeometry, whiteMaterial);
    this.rightEye.position.set(0.2, 1.6, 0.5);
    this.robotGroup.add(this.rightEye);

    // Pupils
    const pupilGeometry = new THREE.CircleGeometry(0.07, 32);
    const pupilMaterial = new THREE.MeshPhongMaterial({ color: 0x212121 });
    this.leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    this.leftPupil.position.set(-0.2, 1.6, 0.51);
    this.robotGroup.add(this.leftPupil);

    this.rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    this.rightPupil.position.set(0.2, 1.6, 0.51);
    this.robotGroup.add(this.rightPupil);

    // Mouth (rectangle)
    const mouthGeometry = new THREE.BoxGeometry(0.4, 0.1, 0.1);
    this.mouth = new THREE.Mesh(mouthGeometry, whiteMaterial);
    this.mouth.position.set(0, 1.3, 0.5);
    this.robotGroup.add(this.mouth);

    // Antenna
    const antennaGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8);
    this.antenna = new THREE.Mesh(antennaGeometry, accentMaterial);
    this.antenna.position.set(0, 2.1, 0);
    this.robotGroup.add(this.antenna);

    // Antenna sphere (glowing tip)
    const sphereGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const sphereMaterial = new THREE.MeshPhongMaterial({
      color: 0x64b5f6,
      emissive: 0x64b5f6,
      emissiveIntensity: 0.5,
    });
    this.antennaSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    this.antennaSphere.position.set(0, 2.35, 0);
    this.robotGroup.add(this.antennaSphere);

    // Body
    const bodyGeometry = new THREE.BoxGeometry(1, 1.2, 0.6);
    this.body = new THREE.Mesh(bodyGeometry, primaryMaterial);
    this.body.position.y = 0.4;
    this.robotGroup.add(this.body);

    // Arms (brackets)
    const armGeometry = new THREE.TorusGeometry(0.3, 0.08, 8, 16, Math.PI);
    this.leftArm = new THREE.Mesh(armGeometry, accentMaterial);
    this.leftArm.position.set(-0.7, 0.5, 0);
    this.leftArm.rotation.z = Math.PI / 2;
    this.robotGroup.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeometry, accentMaterial);
    this.rightArm.position.set(0.7, 0.5, 0);
    this.rightArm.rotation.z = -Math.PI / 2;
    this.robotGroup.add(this.rightArm);

    // Legs
    const legGeometry = new THREE.BoxGeometry(0.25, 0.8, 0.25);
    this.leftLeg = new THREE.Mesh(legGeometry, primaryMaterial);
    this.leftLeg.position.set(-0.25, -0.6, 0);
    this.robotGroup.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeometry, primaryMaterial);
    this.rightLeg.position.set(0.25, -0.6, 0);
    this.robotGroup.add(this.rightLeg);

    this.scene.add(this.robotGroup);

    // Start idle animation
    this.startIdleAnimation();
  }

  startIdleAnimation() {
    // Gentle breathing effect
    gsap.to(this.robotGroup.scale, {
      x: 1.02,
      y: 1.02,
      z: 1.02,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    // Antenna sphere glow pulse
    gsap.to(this.antennaSphere.material, {
      emissiveIntensity: 0.8,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  }

  setListening() {
    this.stopAllAnimations();

    // Eyes pulse brighter
    gsap.to([this.leftEye.material, this.rightEye.material], {
      emissiveIntensity: 0.5,
      duration: 0.5,
      repeat: -1,
      yoyo: true,
    });

    // Antenna glows more
    gsap.to(this.antennaSphere.material, {
      emissiveIntensity: 1,
      duration: 0.3,
      repeat: -1,
      yoyo: true,
    });

    updateStatus("Listening...", "listening");
  }

  setThinking() {
    this.stopAllAnimations();

    // Rotate antenna
    gsap.to(this.antenna.rotation, {
      y: Math.PI * 2,
      duration: 2,
      repeat: -1,
      ease: "linear",
    });

    gsap.to(this.antennaSphere.rotation, {
      y: Math.PI * 2,
      duration: 2,
      repeat: -1,
      ease: "linear",
    });

    // Eyes blink
    gsap.to(this.leftEye.scale, {
      y: 0.1,
      duration: 0.2,
      repeat: -1,
      repeatDelay: 1.5,
      yoyo: true,
    });

    gsap.to(this.rightEye.scale, {
      y: 0.1,
      duration: 0.2,
      repeat: -1,
      repeatDelay: 1.5,
      yoyo: true,
    });

    updateStatus("Thinking...", "thinking");
  }

  setResponding() {
    this.stopAllAnimations();

    // Mouth animates like speaking
    gsap.to(this.mouth.scale, {
      x: 1.2,
      y: 1.5,
      duration: 0.3,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    // Body slight bounce
    gsap.to(this.body.position, {
      y: 0.5,
      duration: 0.4,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    updateStatus("Responding...", "thinking");
  }

  celebrate() {
    this.stopAllAnimations();

    // Jump animation
    gsap.to(this.robotGroup.position, {
      y: 0.5,
      duration: 0.3,
      repeat: 3,
      yoyo: true,
      ease: "power2.out",
      onComplete: () => {
        this.startIdleAnimation();
        updateStatus("Ready to help", "ready");
      },
    });

    // Color burst
    gsap.to(this.body.material.color, {
      r: 0.3,
      g: 0.8,
      b: 0.3,
      duration: 0.5,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        this.body.material.color.setHex(0x4a90e2);
      },
    });
  }

  demonstrateExercise(exerciseName) {
    this.stopAllAnimations();

    if (exerciseName === "squat") {
      // Squat animation
      const timeline = gsap.timeline({ repeat: 2 });
      timeline.to(this.robotGroup.position, {
        y: -0.5,
        duration: 1,
        ease: "power2.inOut",
      });
      timeline.to(this.robotGroup.position, {
        y: 0,
        duration: 1,
        ease: "power2.inOut",
      });
    } else if (exerciseName === "push_up") {
      // Push-up animation
      const timeline = gsap.timeline({ repeat: 2 });
      timeline.to(this.robotGroup.rotation, {
        z: Math.PI / 2,
        duration: 0.5,
      });
      timeline.to(this.body.position, {
        y: 0.2,
        duration: 0.8,
        yoyo: true,
        repeat: 1,
      });
      timeline.to(this.robotGroup.rotation, {
        z: 0,
        duration: 0.5,
      });
    }

    updateStatus("Demonstrating exercise", "thinking");
  }

  stopAllAnimations() {
    gsap.killTweensOf([
      this.robotGroup,
      this.robotGroup.scale,
      this.head,
      this.leftEye,
      this.rightEye,
      this.mouth,
      this.body,
      this.antenna,
      this.antennaSphere,
      this.leftArm,
      this.rightArm,
      this.leftEye.material,
      this.rightEye.material,
      this.antennaSphere.material,
      this.body.material.color,
    ]);

    // Reset to defaults
    this.robotGroup.position.set(0, 0, 0);
    this.robotGroup.scale.set(1, 1, 1);
    this.robotGroup.rotation.set(0, 0, 0);
    this.leftEye.scale.set(1, 1, 1);
    this.rightEye.scale.set(1, 1, 1);
    this.mouth.scale.set(1, 1, 1);
    this.body.position.y = 0.4;
  }

  resetToIdle() {
    this.stopAllAnimations();
    this.startIdleAnimation();
    updateStatus("Ready to help", "ready");
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Gentle rotation
    this.robotGroup.rotation.y += 0.002;

    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    this.camera.aspect =
      this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
  }
}

// =============================================================================
// UI HELPERS
// =============================================================================

function updateStatus(text, state = "ready") {
  const statusText = document.getElementById("status-text");
  const statusDot = document.querySelector(".status-dot");

  statusText.textContent = text;
  statusDot.className = "status-dot " + state;
}

function showUserStats(analysis) {
  const statsDiv = document.getElementById("user-stats");
  statsDiv.style.display = "grid";

  document.getElementById("stat-bmi").textContent = analysis.bmi;
  document.getElementById("stat-calories").textContent =
    analysis.calorie_target + " cal";
  document.getElementById("stat-protein").textContent =
    analysis.macros.protein + "g";
}

function calculateBMI() {
  const height = parseFloat(document.getElementById("height").value);
  const weight = parseFloat(document.getElementById("weight").value);

  if (height && weight) {
    const heightM = height / 100;
    const bmi = (weight / (heightM * heightM)).toFixed(1);

    let category = "";
    if (bmi < 18.5) category = "Underweight";
    else if (bmi < 25) category = "Normal weight";
    else if (bmi < 30) category = "Overweight";
    else category = "Obese";

    document.getElementById("bmi-value").textContent = bmi;
    document.getElementById("bmi-category").textContent = category;
  }
}

function addMessage(content, isUser = false, sources = []) {
  const messagesContainer = document.getElementById("chat-messages");

  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${isUser ? "user" : "bot"}`;

  const contentDiv = document.createElement("div");
  contentDiv.className = "message-content";

  // Format message with markdown-like features
  const formattedContent = content
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");

  contentDiv.innerHTML = formattedContent;
  messageDiv.appendChild(contentDiv);

  // Add sources if available
  if (!isUser && sources && sources.length > 0) {
    const sourcesDiv = document.createElement("div");
    sourcesDiv.className = "message-sources";

    sources.forEach((source, index) => {
      const sourceLink = document.createElement("a");
      sourceLink.href = source.url;
      sourceLink.target = "_blank";
      sourceLink.className = "source-pill";
      sourceLink.innerHTML = `🔗 ${source.title.substring(0, 30)}... [${
        index + 1
      }]`;
      sourcesDiv.appendChild(sourceLink);
    });

    messageDiv.appendChild(sourcesDiv);
  }

  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showTypingIndicator() {
  document.getElementById("typing-indicator").style.display = "flex";
  const messagesContainer = document.getElementById("chat-messages");
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideTypingIndicator() {
  document.getElementById("typing-indicator").style.display = "none";
}

// =============================================================================
// API CALLS
// =============================================================================

async function analyzeProfile(profileData) {
  try {
    const response = await fetch(`${API_BASE}/fitness/analyze-profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileData),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Profile analysis error:", error);
    return null;
  }
}

async function sendChatMessage(message) {
  try {
    const response = await fetch(`${API_BASE}/fitness/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Chat error:", error);
    return null;
  }
}

// =============================================================================
// EVENT HANDLERS
// =============================================================================

document.addEventListener("DOMContentLoaded", () => {
  // Slider synchronization
  const heightSlider = document.getElementById("height-slider");
  const heightInput = document.getElementById("height");
  const weightSlider = document.getElementById("weight-slider");
  const weightInput = document.getElementById("weight");

  heightSlider.addEventListener("input", (e) => {
    heightInput.value = e.target.value;
    calculateBMI();
  });

  heightInput.addEventListener("input", (e) => {
    heightSlider.value = e.target.value;
    calculateBMI();
  });

  weightSlider.addEventListener("input", (e) => {
    weightInput.value = e.target.value;
    calculateBMI();
  });

  weightInput.addEventListener("input", (e) => {
    weightSlider.value = e.target.value;
    calculateBMI();
  });

  // Initial BMI calculation
  calculateBMI();

  // Start button
  document
    .getElementById("start-button")
    .addEventListener("click", async () => {
      // Collect profile data
      const equipment = Array.from(
        document.querySelectorAll(".checkbox-group input:checked")
      ).map((cb) => cb.value);

      userProfile = {
        height: parseFloat(document.getElementById("height").value),
        weight: parseFloat(document.getElementById("weight").value),
        age: parseInt(document.getElementById("age").value),
        gender: document.getElementById("gender").value,
        goal: document.getElementById("goal").value,
        fitness_level: document.getElementById("fitness-level").value,
        equipment: equipment,
        limitations: document.getElementById("limitations").value,
      };

      // Analyze profile
      const analysis = await analyzeProfile(userProfile);

      if (analysis && analysis.success) {
        // Hide welcome screen
        document.getElementById("welcome-screen").style.display = "none";
        document.getElementById("main-interface").style.display = "grid";

        // Initialize robot
        const robotContainer = document.getElementById(
          "robot-canvas-container"
        );
        robot = new FitnessRobot(robotContainer);

        // Celebrate start
        setTimeout(() => {
          robot.celebrate();
        }, 500);

        // Show stats
        showUserStats(analysis.analysis);

        // Add welcome message to chat
        addMessage(analysis.welcome_message, false);
      }
    });

  // Chat input handling
  const chatInput = document.getElementById("chat-input");
  const sendButton = document.getElementById("send-button");

  async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Add user message
    addMessage(message, true);
    chatInput.value = "";

    // Set robot to listening then thinking
    robot.setListening();
    setTimeout(() => {
      robot.setThinking();
    }, 500);

    // Show typing indicator
    showTypingIndicator();

    // Send to API
    const response = await sendChatMessage(message);

    hideTypingIndicator();

    if (response && response.success) {
      robot.setResponding();

      // Add bot response
      addMessage(response.response, false, response.research_sources || []);

      // Check if animation demo is needed
      if (response.animation_demo) {
        setTimeout(() => {
          robot.demonstrateExercise(response.animation_demo);
        }, 1000);

        setTimeout(() => {
          robot.resetToIdle();
        }, 5000);
      } else {
        setTimeout(() => {
          robot.resetToIdle();
        }, 2000);
      }
    } else {
      robot.resetToIdle();
      addMessage(
        "Sorry, I'm having trouble processing that. Could you try again?",
        false
      );
    }
  }

  sendButton.addEventListener("click", sendMessage);

  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Auto-resize textarea
  chatInput.addEventListener("input", () => {
    chatInput.style.height = "auto";
    chatInput.style.height = chatInput.scrollHeight + "px";
  });

  // New chat button
  document.getElementById("new-chat").addEventListener("click", () => {
    if (
      confirm("Start a new session? This will clear your current conversation.")
    ) {
      conversationHistory = [];
      document.getElementById("chat-messages").innerHTML = "";
      robot.celebrate();
      addMessage(
        "New session started! How can I help you with your fitness journey today?",
        false
      );
    }
  });
});
