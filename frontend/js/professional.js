// ===== THREE.JS 3D PROFESSIONAL ROBOT SETUP =====
let scene,
  camera,
  renderer,
  robot,
  tie,
  glasses,
  briefcase,
  head,
  leftArm,
  rightArm,
  leftHand,
  rightHand,
  smile,
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
  camera.position.z = 9;

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setSize(width, height);
  renderer.setClearColor(0x000000, 0);

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const pointLight1 = new THREE.PointLight(0x2d3748, 1, 100);
  pointLight1.position.set(5, 5, 5);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0x718096, 0.6, 100);
  pointLight2.position.set(-5, -5, 5);
  scene.add(pointLight2);

  // Create Professional Robot
  robot = new THREE.Group();

  // Head - Dark gray/charcoal
  const headGeometry = new THREE.BoxGeometry(2, 2, 2);
  const headMaterial = new THREE.MeshPhongMaterial({
    color: 0x2d3748,
    shininess: 100,
  });
  head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.y = 2.8;
  robot.add(head);

  // Glasses
  glasses = new THREE.Group();

  // Left lens
  const lensGeometry = new THREE.BoxGeometry(0.6, 0.45, 0.1);
  const lensMaterial = new THREE.MeshPhongMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.3,
    shininess: 200,
  });
  const leftLens = new THREE.Mesh(lensGeometry, lensMaterial);
  leftLens.position.set(-0.45, 2.9, 1.1);
  glasses.add(leftLens);

  // Right lens
  const rightLens = new THREE.Mesh(lensGeometry, lensMaterial);
  rightLens.position.set(0.45, 2.9, 1.1);
  glasses.add(rightLens);

  // Bridge
  const bridgeGeometry = new THREE.BoxGeometry(0.2, 0.05, 0.05);
  const bridgeMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
  const bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
  bridge.position.set(0, 2.9, 1.05);
  glasses.add(bridge);

  robot.add(glasses);

  // Eyes
  const eyeGeometry = new THREE.SphereGeometry(0.25, 16, 16);
  const eyeMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    emissive: 0x666666,
  });

  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(-0.45, 2.85, 1.15);
  robot.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(0.45, 2.85, 1.15);
  robot.add(rightEye);

  // Pupils
  const pupilGeometry = new THREE.SphereGeometry(0.12, 16, 16);
  const pupilMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });

  const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
  leftPupil.position.set(-0.45, 2.85, 1.3);
  robot.add(leftPupil);

  const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
  rightPupil.position.set(0.45, 2.85, 1.3);
  robot.add(rightPupil);

  // Mouth - Professional smile
  const smileCurve = new THREE.EllipseCurve(
    0,
    0,
    0.5,
    0.25,
    0,
    Math.PI,
    false,
    0
  );
  const smilePoints = smileCurve.getPoints(50);
  const smileGeometry = new THREE.BufferGeometry().setFromPoints(smilePoints);
  const smileMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    linewidth: 2,
  });
  smile = new THREE.Line(smileGeometry, smileMaterial);
  smile.position.set(0, 2.4, 1.1);
  smile.rotation.x = Math.PI;
  robot.add(smile);

  // Mouth for speaking animation
  const mouthGeometry = new THREE.BoxGeometry(0.7, 0.12, 0.1);
  const mouthMaterial = new THREE.MeshPhongMaterial({
    color: 0x4299e1,
    shininess: 50,
  });
  mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
  mouth.position.set(0, 2.35, 1.15);
  robot.add(mouth);

  // Body - Suit jacket (dark)
  const bodyGeometry = new THREE.BoxGeometry(2.8, 2.2, 1.6);
  const bodyMaterial = new THREE.MeshPhongMaterial({
    color: 0x1a202c,
    shininess: 60,
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.6;
  robot.add(body);

  // White shirt (visible in center)
  const shirtGeometry = new THREE.BoxGeometry(1.2, 2, 0.1);
  const shirtMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    shininess: 20,
  });
  const shirt = new THREE.Mesh(shirtGeometry, shirtMaterial);
  shirt.position.set(0, 0.7, 0.85);
  robot.add(shirt);

  // Red Tie
  tie = new THREE.Group();

  // Tie knot
  const knotGeometry = new THREE.ConeGeometry(0.15, 0.2, 4);
  const tieMaterial = new THREE.MeshPhongMaterial({
    color: 0xc41e3a,
    shininess: 80,
  });
  const knot = new THREE.Mesh(knotGeometry, tieMaterial);
  knot.position.set(0, 1.5, 0.9);
  knot.rotation.y = Math.PI / 4;
  tie.add(knot);

  // Tie body
  const tieBodyGeometry = new THREE.BoxGeometry(0.25, 1.2, 0.08);
  const tieBody = new THREE.Mesh(tieBodyGeometry, tieMaterial);
  tieBody.position.set(0, 0.7, 0.9);
  tie.add(tieBody);

  robot.add(tie);

  // Pocket square (white handkerchief)
  const squareGeometry = new THREE.PlaneGeometry(0.25, 0.15);
  const squareMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
  });
  const square = new THREE.Mesh(squareGeometry, squareMaterial);
  square.position.set(-1, 1.2, 0.85);
  robot.add(square);

  // Arms in suit sleeves
  const armGeometry = new THREE.CylinderGeometry(0.35, 0.35, 2, 16);
  const armMaterial = new THREE.MeshPhongMaterial({
    color: 0x1a202c,
    shininess: 60,
  });

  leftArm = new THREE.Mesh(armGeometry, armMaterial);
  leftArm.position.set(-1.6, 0.5, 0);
  leftArm.rotation.z = 0.2;
  robot.add(leftArm);

  rightArm = new THREE.Mesh(armGeometry, armMaterial);
  rightArm.position.set(1.6, 0.5, 0);
  rightArm.rotation.z = -0.2;
  robot.add(rightArm);

  // Hands
  const handGeometry = new THREE.SphereGeometry(0.4, 16, 16);
  const handMaterial = new THREE.MeshPhongMaterial({
    color: 0x4a5568,
    shininess: 40,
  });

  leftHand = new THREE.Mesh(handGeometry, handMaterial);
  leftHand.position.set(-1.7, -0.6, 0);
  robot.add(leftHand);

  rightHand = new THREE.Mesh(handGeometry, handMaterial);
  rightHand.position.set(1.7, -0.6, 0);
  robot.add(rightHand);

  // Briefcase (3D box with handle)
  briefcase = new THREE.Group();

  const caseGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.2);
  const caseMaterial = new THREE.MeshPhongMaterial({
    color: 0x4a5568,
    shininess: 100,
  });
  const caseBody = new THREE.Mesh(caseGeometry, caseMaterial);
  briefcase.add(caseBody);

  // Handle
  const handleGeometry = new THREE.TorusGeometry(0.25, 0.04, 8, 16, Math.PI);
  const handleMaterial = new THREE.MeshPhongMaterial({ color: 0x2d3748 });
  const handle = new THREE.Mesh(handleGeometry, handleMaterial);
  handle.rotation.x = Math.PI / 2;
  handle.position.y = 0.5;
  briefcase.add(handle);

  briefcase.position.set(-1.7, -1.2, 0);
  briefcase.rotation.z = -0.3;
  robot.add(briefcase);

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

  // Smooth rotation based on mouse (professional, subtle movement)
  targetRotationY = mouseX * 0.3;
  targetRotationX = mouseY * 0.2;

  robot.rotation.y += (targetRotationY - robot.rotation.y) * 0.05;
  robot.rotation.x += (targetRotationX - robot.rotation.x) * 0.05;

  // Gentle professional floating
  robot.position.y = Math.sin(Date.now() * 0.0008) * 0.15;

  // Subtle breathing
  const breathe = Math.sin(Date.now() * 0.0015) * 0.015 + 1;
  robot.scale.set(breathe, breathe, breathe);

  // Professional head nod
  if (head) {
    head.rotation.x = Math.sin(Date.now() * 0.001) * 0.05;
  }

  // Subtle professional gestures - arms slightly move
  if (leftArm && rightArm) {
    leftArm.rotation.z = 0.2 + Math.sin(Date.now() * 0.0012) * 0.08;
    rightArm.rotation.z = -0.2 - Math.sin(Date.now() * 0.0012) * 0.08;
  }

  // Briefcase subtle sway
  if (briefcase) {
    briefcase.rotation.z = -0.3 + Math.sin(Date.now() * 0.001) * 0.05;
  }

  // Glasses shine effect
  if (glasses) {
    glasses.children.forEach((lens) => {
      if (lens.material.opacity !== undefined) {
        lens.material.opacity = 0.2 + Math.sin(Date.now() * 0.002) * 0.1;
      }
    });
  }

  renderer.render(scene, camera);
}

// Robot emotion animations
function setRobotThinking() {
  if (robot) {
    const currentScale = robot.scale.x;
    animateScale(currentScale, 0.96, 300);

    // Professional thinking pose - hand to chin
    if (rightArm && rightHand) {
      animateArmRotation(rightArm, "z", -0.8, 400);
      animateArmRotation(rightArm, "x", -0.5, 400);
    }

    // Head tilts slightly in thought
    if (head) {
      animateHeadRotation(head, "z", 0.1, 400);
    }
  }
}

function setRobotAdjustingTie() {
  if (tie && rightArm && rightHand) {
    let startTime = null;
    const duration = 600;

    const adjustAnimation = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Tie adjusts up
      if (progress < 0.5) {
        tie.position.y = progress * 0.2;
        tie.scale.set(1 + progress * 0.2, 1 + progress * 0.2, 1);

        // Right arm moves to tie
        rightArm.rotation.z = -0.2 - progress * 1.2;
        rightArm.rotation.x = -progress * 0.8;

        // Confident smile widens
        if (smile) {
          smile.scale.set(1 + progress * 0.2, 1 + progress * 0.2, 1);
        }
      } else {
        const reverseProgress = 1 - progress;
        tie.position.y = reverseProgress * 0.2;
        tie.scale.set(1 + reverseProgress * 0.2, 1 + reverseProgress * 0.2, 1);

        rightArm.rotation.z = -0.2 - reverseProgress * 1.2;
        rightArm.rotation.x = -reverseProgress * 0.8;

        if (smile) {
          smile.scale.set(
            1 + reverseProgress * 0.2,
            1 + reverseProgress * 0.2,
            1
          );
        }
      }

      if (progress < 1) {
        requestAnimationFrame(adjustAnimation);
      } else {
        tie.position.y = 0;
        tie.scale.set(1, 1, 1);
        rightArm.rotation.z = -0.2;
        rightArm.rotation.x = 0;
        if (smile) {
          smile.scale.set(1, 1, 1);
        }
      }
    };

    requestAnimationFrame(adjustAnimation);
  }
}

function setRobotHappy() {
  if (robot) {
    let startTime = null;
    const duration = 600;

    const happyAnimation = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (progress < 0.5) {
        robot.scale.set(
          1 + progress * 0.15,
          1 + progress * 0.15,
          1 + progress * 0.15
        );

        // Professional victory pose - arms slightly raised
        if (leftArm && rightArm) {
          leftArm.rotation.z = 0.2 - progress * 0.6;
          rightArm.rotation.z = -0.2 + progress * 0.6;
          leftArm.rotation.y = progress * 0.3;
          rightArm.rotation.y = -progress * 0.3;
        }

        // Briefcase lifts with enthusiasm
        if (briefcase) {
          briefcase.position.y = -1.2 + progress * 0.4;
        }

        // Confident nod
        if (head) {
          head.rotation.x = progress * 0.2;
        }
      } else {
        const reverseProgress = 1 - progress;
        robot.scale.set(
          1 + reverseProgress * 0.15,
          1 + reverseProgress * 0.15,
          1 + reverseProgress * 0.15
        );

        if (leftArm && rightArm) {
          leftArm.rotation.z = 0.2 - reverseProgress * 0.6;
          rightArm.rotation.z = -0.2 + reverseProgress * 0.6;
          leftArm.rotation.y = reverseProgress * 0.3;
          rightArm.rotation.y = -reverseProgress * 0.3;
        }

        if (briefcase) {
          briefcase.position.y = -1.2 + reverseProgress * 0.4;
        }

        if (head) {
          head.rotation.x = reverseProgress * 0.2;
        }
      }

      if (progress < 1) {
        requestAnimationFrame(happyAnimation);
      } else {
        robot.scale.set(1, 1, 1);
        if (leftArm && rightArm) {
          leftArm.rotation.z = 0.2;
          rightArm.rotation.z = -0.2;
          leftArm.rotation.y = 0;
          rightArm.rotation.y = 0;
        }
        if (briefcase) {
          briefcase.position.y = -1.2;
        }
        if (head) {
          head.rotation.x = 0;
        }
      }
    };

    requestAnimationFrame(happyAnimation);
  }
}

function setRobotSad() {
  if (robot) {
    let startTime = null;
    const duration = 500;

    const sadAnimation = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      robot.scale.set(
        1 - progress * 0.08,
        1 - progress * 0.08,
        1 - progress * 0.08
      );

      // Head drops down
      if (head) {
        head.rotation.x = progress * 0.4;
      }

      // Arms droop
      if (leftArm && rightArm) {
        leftArm.rotation.z = 0.2 + progress * 0.5;
        rightArm.rotation.z = -0.2 - progress * 0.5;
      }

      // Briefcase drops
      if (briefcase) {
        briefcase.position.y = -1.2 - progress * 0.3;
        briefcase.rotation.z = -0.3 - progress * 0.2;
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

    // Reset arms
    if (leftArm && rightArm) {
      animateArmRotation(leftArm, "z", 0.2, 300);
      animateArmRotation(rightArm, "z", -0.2, 300);
      animateArmRotation(leftArm, "x", 0, 300);
      animateArmRotation(rightArm, "x", 0, 300);
      animateArmRotation(leftArm, "y", 0, 300);
      animateArmRotation(rightArm, "y", 0, 300);
    }

    // Reset head
    if (head) {
      animateHeadRotation(head, "x", 0, 300);
      animateHeadRotation(head, "z", 0, 300);
    }

    // Reset briefcase
    if (briefcase) {
      let startTime = null;
      const duration = 300;
      const startY = briefcase.position.y;
      const startZ = briefcase.rotation.z;

      const reset = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);

        briefcase.position.y = startY + (-1.2 - startY) * progress;
        briefcase.rotation.z = startZ + (-0.3 - startZ) * progress;

        if (progress < 1) {
          requestAnimationFrame(reset);
        }
      };

      requestAnimationFrame(reset);
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

function animateHeadRotation(head, axis, targetValue, duration) {
  let startTime = null;
  const startValue = head.rotation[axis];

  const animate = (timestamp) => {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);

    head.rotation[axis] = startValue + (targetValue - startValue) * progress;

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

// ===== VOICE FEATURES (PROFESSIONAL TONE) =====
function animateMouthSpeaking() {
  if (!isSpeaking || !mouth) return;

  const time = Date.now() * 0.008; // Slower, controlled movements
  mouth.scale.y = 1 + Math.sin(time) * 0.4;
  mouth.position.y = 2.35 + Math.sin(time) * 0.04;

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
    mouth.position.y = 2.35;
  }
}

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
    console.log("🎤 Luna heard:", transcript);

    addMessage(transcript, true);
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

// Professional Text-to-Speech
function speakResponse(text) {
  synthesis.cancel();

  const cleanText = text
    .replace(/[*_`#]/g, "")
    .replace(/\\n+/g, ". ")
    .replace(/[💼🔥⚖️📊]/g, "")
    .replace(/\\s+/g, " ")
    .trim();

  const utterance = new SpeechSynthesisUtterance(cleanText);

  // LUNA'S PROFESSIONAL VOICE CONFIGURATION
  utterance.rate = 0.92; // Slower, deliberate pace
  utterance.pitch = 0.95; // Slightly lower for authority
  utterance.volume = 1.0;

  // Prefer professional, mature voices
  const professionalVoices = voices.filter(
    (voice) =>
      voice.name.includes("Google UK English Male") ||
      voice.name.includes("Microsoft David") ||
      voice.name.includes("Alex") ||
      voice.name.includes("Daniel") ||
      (voice.lang.startsWith("en") && voice.name.toLowerCase().includes("male"))
  );

  if (professionalVoices.length > 0) {
    utterance.voice = professionalVoices[0];
  } else if (voices.length > 0) {
    const englishVoice = voices.find((v) => v.lang.startsWith("en"));
    if (englishVoice) utterance.voice = englishVoice;
  }

  utterance.onstart = () => {
    startMouthAnimation();
    setRobotAdjustingTie();
  };

  utterance.onend = () => {
    stopMouthAnimation();
    setRobotNeutral();
  };

  utterance.onerror = (event) => {
    console.error("Speech error:", event);
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
      `${API_BASE_URL}/api/professional/workplace-support`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Professional" }),
      }
    );

    const data = await response.json();
    if (data.success && data.message) {
      conversationStarted = true;
      console.log("✅ Connected to Luna (Professional AI) backend");
      // Show welcome message
      addMessage(data.message);
    }
  } catch (error) {
    console.error("⚠️ Backend not available, using offline mode:", error);
    addMessage(
      "Good day! I'm Luna, your professional wellness advisor. 💼 (Note: Backend AI not connected - please start the server)"
    );
  }
}

// Bot responses - NOW USES BACKEND AI (Ollama/Gemini)
async function getBotResponse(userMessage) {
  showTyping();
  setRobotAdjustingTie(); // Signature professional gesture

  try {
    // Call backend API for AI response
    const response = await fetch(`${API_BASE_URL}/api/professional/respond`, {
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
      setRobotNeutral();
      console.log(
        "🤖 Luna AI Response:",
        data.response.substring(0, 50) + "..."
      );
      return data.response;
    } else {
      throw new Error("Invalid response from backend");
    }
  } catch (error) {
    hideTyping();
    console.error("❌ Backend error:", error);
    setRobotSad();

    // Fallback response if backend is down
    return "I'm experiencing connectivity issues at the moment. 💼\n\nPlease ensure the backend server is operational:\n\n```bash\ncd backend\npython main.py\n```\n\nOnce connected, I can provide professional guidance on:\n• Workplace stress management\n• Burnout prevention strategies\n• Work-life balance frameworks\n• Performance anxiety solutions\n• Career wellness optimization\n\nHow may I assist your professional wellbeing today?";
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

// Initial professional gesture
setTimeout(() => {
  setRobotAdjustingTie();
}, 1500);
