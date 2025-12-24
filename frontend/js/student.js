// ===== THREE.JS 3D STUDENT ROBOT SETUP =====
let scene,
  camera,
  renderer,
  robot,
  head,
  leftArm,
  rightArm,
  leftHand,
  rightHand,
  backpack,
  pencil,
  notebook,
  glasses,
  mouth,
  upperLip,
  lowerLip;
let mouseX = 0,
  mouseY = 0;
let targetRotationX = 0,
  targetRotationY = 0;

// Voice system variables
let recognition;
let synthesis = window.speechSynthesis;
let isSpeaking = false;
let isListening = false;
let mouthAnimationInterval = null;

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
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const pointLight1 = new THREE.PointLight(0x667eea, 1.2, 100);
  pointLight1.position.set(5, 5, 5);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0x764ba2, 0.8, 100);
  pointLight2.position.set(-5, -5, 5);
  scene.add(pointLight2);

  const spotLight = new THREE.SpotLight(0x6496ff, 0.6);
  spotLight.position.set(0, 10, 5);
  scene.add(spotLight);

  // Create Student Robot
  robot = new THREE.Group();

  // Head
  const headGeometry = new THREE.BoxGeometry(2, 2, 2);
  const headMaterial = new THREE.MeshPhongMaterial({
    color: 0x667eea,
    shininess: 100,
  });
  head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.y = 2.5;
  robot.add(head);

  // Cap on head (student style)
  const capGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.3, 32);
  const capMaterial = new THREE.MeshPhongMaterial({
    color: 0x764ba2,
    shininess: 80,
  });
  const cap = new THREE.Mesh(capGeometry, capMaterial);
  cap.position.set(0, 3.6, 0);
  robot.add(cap);

  // Cap bill
  const billGeometry = new THREE.BoxGeometry(1.8, 0.1, 1);
  const billMaterial = new THREE.MeshPhongMaterial({ color: 0x764ba2 });
  const bill = new THREE.Mesh(billGeometry, billMaterial);
  bill.position.set(0, 3.5, 1.2);
  robot.add(bill);

  // Glasses (studious look)
  const glassesGroup = new THREE.Group();

  // Left lens
  const lensGeometry = new THREE.TorusGeometry(0.35, 0.05, 16, 32);
  const lensMaterial = new THREE.MeshPhongMaterial({
    color: 0x333333,
    transparent: true,
    opacity: 0.3,
  });
  const leftLens = new THREE.Mesh(lensGeometry, lensMaterial);
  leftLens.position.set(-0.5, 2.7, 1.1);
  glassesGroup.add(leftLens);

  const rightLens = new THREE.Mesh(lensGeometry, lensMaterial);
  rightLens.position.set(0.5, 2.7, 1.1);
  glassesGroup.add(rightLens);

  // Bridge
  const bridgeGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.6, 8);
  const bridgeMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
  const bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
  bridge.rotation.z = Math.PI / 2;
  bridge.position.set(0, 2.7, 1.1);
  glassesGroup.add(bridge);

  glasses = glassesGroup;
  robot.add(glassesGroup);

  // Eyes (curious student eyes)
  const eyeGeometry = new THREE.SphereGeometry(0.25, 16, 16);
  const eyeMaterial = new THREE.MeshPhongMaterial({
    color: 0x000000,
    emissive: 0x222222,
  });

  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(-0.5, 2.7, 1.15);
  robot.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(0.5, 2.7, 1.15);
  robot.add(rightEye);

  // Eye shine (attentive look)
  const shineGeometry = new THREE.SphereGeometry(0.08, 8, 8);
  const shineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

  const leftShine = new THREE.Mesh(shineGeometry, shineMaterial);
  leftShine.position.set(-0.42, 2.8, 1.3);
  robot.add(leftShine);

  const rightShine = new THREE.Mesh(shineGeometry, shineMaterial);
  rightShine.position.set(0.58, 2.8, 1.3);
  robot.add(rightShine);

  // Animated Mouth for speech (cute smile)
  mouth = new THREE.Group();

  // Upper lip (cheerful curve)
  const upperLipCurve = new THREE.EllipseCurve(
    0,
    0,
    0.6,
    0.2,
    0,
    Math.PI,
    false,
    0
  );
  const upperLipPoints = upperLipCurve.getPoints(30);
  const upperLipGeometry = new THREE.BufferGeometry().setFromPoints(
    upperLipPoints
  );
  const lipMaterial = new THREE.LineBasicMaterial({
    color: 0x764ba2,
    linewidth: 3,
  });
  upperLip = new THREE.Line(upperLipGeometry, lipMaterial);
  upperLip.position.set(0, 0.08, 0);
  upperLip.rotation.x = Math.PI;
  mouth.add(upperLip);

  // Lower lip
  const lowerLipCurve = new THREE.EllipseCurve(
    0,
    0,
    0.6,
    0.15,
    Math.PI,
    2 * Math.PI,
    false,
    0
  );
  const lowerLipPoints = lowerLipCurve.getPoints(30);
  const lowerLipGeometry = new THREE.BufferGeometry().setFromPoints(
    lowerLipPoints
  );
  lowerLip = new THREE.Line(lowerLipGeometry, lipMaterial);
  lowerLip.position.set(0, -0.08, 0);
  lowerLip.rotation.x = Math.PI;
  mouth.add(lowerLip);

  mouth.position.set(0, 2.1, 1.1);
  robot.add(mouth);

  // Body (with book logo)
  const bodyGeometry = new THREE.BoxGeometry(2.5, 2.5, 1.5);
  const bodyMaterial = new THREE.MeshPhongMaterial({
    color: 0x667eea,
    shininess: 80,
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.5;
  robot.add(body);

  // Book icon on chest
  const bookGeometry = new THREE.BoxGeometry(0.8, 1, 0.2);
  const bookMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
  const book = new THREE.Mesh(bookGeometry, bookMaterial);
  book.position.set(0, 0.5, 0.9);
  robot.add(book);

  // Book pages
  const pagesGeometry = new THREE.BoxGeometry(0.75, 0.95, 0.15);
  const pagesMaterial = new THREE.MeshPhongMaterial({ color: 0xf0f0f0 });
  const pages = new THREE.Mesh(pagesGeometry, pagesMaterial);
  pages.position.set(0, 0.5, 0.95);
  robot.add(pages);

  // Left Arm
  const armGeometry = new THREE.CylinderGeometry(0.25, 0.25, 2, 16);
  const armMaterial = new THREE.MeshPhongMaterial({
    color: 0x667eea,
    shininess: 80,
  });

  leftArm = new THREE.Mesh(armGeometry, armMaterial);
  leftArm.position.set(-1.5, 0.5, 0);
  leftArm.rotation.z = 0.3;
  robot.add(leftArm);

  // Left Hand
  const handGeometry = new THREE.SphereGeometry(0.35, 16, 16);
  const handMaterial = new THREE.MeshPhongMaterial({
    color: 0x667eea,
    shininess: 100,
  });

  leftHand = new THREE.Mesh(handGeometry, handMaterial);
  leftHand.position.set(-1.7, -0.5, 0);
  robot.add(leftHand);

  // Right Arm
  rightArm = new THREE.Mesh(armGeometry, armMaterial);
  rightArm.position.set(1.5, 0.5, 0);
  rightArm.rotation.z = -0.3;
  robot.add(rightArm);

  // Right Hand (holding pencil)
  rightHand = new THREE.Mesh(handGeometry, handMaterial);
  rightHand.position.set(1.7, -0.5, 0);
  robot.add(rightHand);

  // Pencil in hand
  const pencilBody = new THREE.CylinderGeometry(0.08, 0.08, 1.5, 8);
  const pencilMaterial = new THREE.MeshPhongMaterial({ color: 0xffeb3b });
  pencil = new THREE.Mesh(pencilBody, pencilMaterial);
  pencil.position.set(1.9, -0.8, 0.3);
  pencil.rotation.z = -0.5;
  robot.add(pencil);

  // Pencil tip
  const tipGeometry = new THREE.ConeGeometry(0.08, 0.3, 8);
  const tipMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
  const tip = new THREE.Mesh(tipGeometry, tipMaterial);
  tip.position.set(2.2, -1.3, 0.3);
  tip.rotation.z = -0.5;
  robot.add(tip);

  // Legs
  const legGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.8, 16);
  const legMaterial = new THREE.MeshPhongMaterial({
    color: 0x764ba2,
    shininess: 80,
  });

  const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
  leftLeg.position.set(-0.6, -1.4, 0);
  robot.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
  rightLeg.position.set(0.6, -1.4, 0);
  robot.add(rightLeg);

  // Feet (sneakers)
  const footGeometry = new THREE.BoxGeometry(0.6, 0.3, 0.9);
  const footMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });

  const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
  leftFoot.position.set(-0.6, -2.4, 0.2);
  robot.add(leftFoot);

  const rightFoot = new THREE.Mesh(footGeometry, footMaterial);
  rightFoot.position.set(0.6, -2.4, 0.2);
  robot.add(rightFoot);

  // Backpack
  const backpackGeometry = new THREE.BoxGeometry(1.5, 1.8, 0.6);
  const backpackMaterial = new THREE.MeshPhongMaterial({
    color: 0x4caf50,
    shininess: 60,
  });
  backpack = new THREE.Mesh(backpackGeometry, backpackMaterial);
  backpack.position.set(0, 0.6, -0.9);
  robot.add(backpack);

  // Backpack pocket
  const pocketGeometry = new THREE.BoxGeometry(1, 0.8, 0.2);
  const pocketMaterial = new THREE.MeshPhongMaterial({ color: 0x388e3c });
  const pocket = new THREE.Mesh(pocketGeometry, pocketMaterial);
  pocket.position.set(0, 0.6, -0.6);
  robot.add(pocket);

  // Backpack straps
  const strapGeometry = new THREE.BoxGeometry(0.2, 1.5, 0.1);
  const strapMaterial = new THREE.MeshPhongMaterial({ color: 0x2e7d32 });

  const leftStrap = new THREE.Mesh(strapGeometry, strapMaterial);
  leftStrap.position.set(-0.5, 1, 0.3);
  robot.add(leftStrap);

  const rightStrap = new THREE.Mesh(strapGeometry, strapMaterial);
  rightStrap.position.set(0.5, 1, 0.3);
  robot.add(rightStrap);

  // Add robot to scene
  scene.add(robot);

  // Mouse interaction
  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / width) * 2 - 1;
    mouseY = -((e.clientY - rect.top) / height) * 2 + 1;

    targetRotationY = mouseX * 0.3;
    targetRotationX = mouseY * 0.2;
  });

  // Start animation loop
  animate();
}

function animate() {
  requestAnimationFrame(animate);

  const time = Date.now() * 0.001;

  if (robot) {
    // Smooth mouse follow
    robot.rotation.y += (targetRotationY - robot.rotation.y) * 0.05;
    robot.rotation.x += (targetRotationX - robot.rotation.x) * 0.05;

    // Floating animation (energetic student)
    const floatHeight = Math.sin(time * 1.5) * 0.15;
    robot.position.y = floatHeight;

    // Breathing effect
    const breathe = 1 + Math.sin(time * 2) * 0.03;
    robot.scale.set(breathe, breathe, breathe);

    // Head nods (like listening attentively)
    if (head) {
      head.rotation.x = Math.sin(time * 1.2) * 0.08;
      head.rotation.z = Math.sin(time * 0.8) * 0.05;
    }

    // Arms move (like taking notes or gesturing)
    if (leftArm && rightArm) {
      // Left arm - subtle movement
      leftArm.rotation.z = 0.3 + Math.sin(time * 1.3) * 0.12;
      leftArm.rotation.x = Math.sin(time * 0.9) * 0.1;

      // Right arm with pencil - writing motion
      rightArm.rotation.z = -0.3 + Math.sin(time * 1.5) * 0.15;
      rightArm.rotation.x = Math.sin(time * 1.1) * 0.1;

      // Hands follow arms
      if (leftHand) {
        leftHand.rotation.z = Math.sin(time * 1.4) * 0.1;
      }
      if (rightHand) {
        rightHand.rotation.z = Math.sin(time * 1.6) * 0.1;
      }
    }

    // Pencil moves with writing motion
    if (pencil) {
      pencil.rotation.y = Math.sin(time * 2) * 0.08;
    }

    // Backpack subtle bounce
    if (backpack) {
      backpack.position.y = 0.6 + Math.sin(time * 1.5) * 0.05;
    }

    // Glasses glint
    if (glasses) {
      glasses.rotation.z = Math.sin(time * 0.7) * 0.02;
    }
  }

  renderer.render(scene, camera);
}

// Emotion animations
function setRobotThinking() {
  if (robot) {
    const currentScale = robot.scale.x;
    animateScale(currentScale, 0.95, 300);

    // Thinking pose - hand to chin
    if (leftArm && leftHand) {
      animateArmRotation(leftArm, "z", 0.8, 400);
      animateArmRotation(leftArm, "x", -0.5, 400);
    }

    // Head tilts in thought
    if (head) {
      animateHeadRotation(head, "z", 0.15, 400);
    }

    // Pencil taps (thinking gesture)
    if (pencil) {
      let startTime = null;
      const duration = 400;

      const tap = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);

        pencil.rotation.z = -0.5 + Math.sin(progress * Math.PI * 4) * 0.2;

        if (progress < 1) {
          requestAnimationFrame(tap);
        }
      };

      requestAnimationFrame(tap);
    }
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
          1 + progress * 0.2,
          1 + progress * 0.2,
          1 + progress * 0.2
        );

        // Excited arms up (like "I got it!")
        if (leftArm && rightArm) {
          leftArm.rotation.z = 0.3 - progress * 0.9;
          rightArm.rotation.z = -0.3 + progress * 0.9;
          leftArm.rotation.y = progress * 0.3;
          rightArm.rotation.y = -progress * 0.3;
        }

        // Backpack bounces with excitement
        if (backpack) {
          backpack.position.y = 0.6 + progress * 0.3;
        }

        // Head nods enthusiastically
        if (head) {
          head.rotation.x = Math.sin(progress * Math.PI * 4) * 0.3;
        }

        // Pencil waves
        if (pencil) {
          pencil.rotation.y = progress * 0.5;
        }
      } else {
        const reverseProgress = 1 - progress;
        robot.scale.set(
          1 + reverseProgress * 0.2,
          1 + reverseProgress * 0.2,
          1 + reverseProgress * 0.2
        );

        if (leftArm && rightArm) {
          leftArm.rotation.z = 0.3 - reverseProgress * 0.9;
          rightArm.rotation.z = -0.3 + reverseProgress * 0.9;
          leftArm.rotation.y = reverseProgress * 0.3;
          rightArm.rotation.y = -reverseProgress * 0.3;
        }

        if (backpack) {
          backpack.position.y = 0.6 + reverseProgress * 0.3;
        }

        if (head) {
          head.rotation.x = Math.sin(reverseProgress * Math.PI * 4) * 0.3;
        }

        if (pencil) {
          pencil.rotation.y = reverseProgress * 0.5;
        }
      }

      if (progress < 1) {
        requestAnimationFrame(happyAnimation);
      } else {
        robot.scale.set(1, 1, 1);
        if (leftArm && rightArm) {
          leftArm.rotation.z = 0.3;
          rightArm.rotation.z = -0.3;
          leftArm.rotation.y = 0;
          rightArm.rotation.y = 0;
        }
        if (backpack) {
          backpack.position.y = 0.6;
        }
        if (head) {
          head.rotation.x = 0;
        }
        if (pencil) {
          pencil.rotation.y = 0;
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
        1 - progress * 0.1,
        1 - progress * 0.1,
        1 - progress * 0.1
      );

      // Head drops (discouraged)
      if (head) {
        head.rotation.x = progress * 0.4;
      }

      // Arms droop
      if (leftArm && rightArm) {
        leftArm.rotation.z = 0.3 + progress * 0.5;
        rightArm.rotation.z = -0.3 - progress * 0.5;
      }

      // Pencil drops
      if (pencil) {
        pencil.position.y = -0.8 - progress * 0.3;
        pencil.rotation.z = -0.5 - progress * 0.4;
      }

      // Backpack sags
      if (backpack) {
        backpack.position.y = 0.6 - progress * 0.2;
      }

      if (progress < 1) {
        requestAnimationFrame(sadAnimation);
      }
    };

    requestAnimationFrame(sadAnimation);
  }
}

function setRobotConfused() {
  // Head scratching animation
  if (robot && head && leftArm) {
    let startTime = null;
    const duration = 800;

    const confusedAnimation = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Head tilts side to side
      head.rotation.z = Math.sin(progress * Math.PI * 3) * 0.3;

      // Left arm to head (scratching gesture)
      leftArm.rotation.z = 0.3 - progress * 1.2;
      leftArm.rotation.y = progress * 0.5;

      if (progress < 1) {
        requestAnimationFrame(confusedAnimation);
      } else {
        // Reset
        head.rotation.z = 0;
        leftArm.rotation.z = 0.3;
        leftArm.rotation.y = 0;
      }
    };

    requestAnimationFrame(confusedAnimation);
  }
}

function setRobotNeutral() {
  if (robot) {
    const currentScale = robot.scale.x;
    animateScale(currentScale, 1, 300);
    robot.rotation.z = 0;
    robot.position.y = 0;

    // Reset arms
    if (leftArm && rightArm) {
      animateArmRotation(leftArm, "z", 0.3, 300);
      animateArmRotation(rightArm, "z", -0.3, 300);
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

    // Reset pencil
    if (pencil) {
      let startTime = null;
      const duration = 300;
      const startY = pencil.position.y;
      const startZ = pencil.rotation.z;

      const reset = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);

        pencil.position.y = startY + (-0.8 - startY) * progress;
        pencil.rotation.z = startZ + (-0.5 - startZ) * progress;

        if (progress < 1) {
          requestAnimationFrame(reset);
        }
      };

      requestAnimationFrame(reset);
    }

    // Reset backpack
    if (backpack) {
      let startTime = null;
      const duration = 300;
      const startY = backpack.position.y;

      const reset = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);

        backpack.position.y = startY + (0.6 - startY) * progress;

        if (progress < 1) {
          requestAnimationFrame(reset);
        }
      };

      requestAnimationFrame(reset);
    }
  }
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

// Initialize 3D robot when page loads
window.addEventListener("load", () => {
  init3DRobot();
  initConversation(); // Start AI conversation on page load
  initVoiceSystem(); // Initialize speech recognition and synthesis
});

// ===== VOICE SYSTEM FOR MAYA (Cute Student Voice) =====
function initVoiceSystem() {
  // Check browser support
  if (
    !("webkitSpeechRecognition" in window) &&
    !("SpeechRecognition" in window)
  ) {
    console.warn("⚠️ Speech recognition not supported");
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
    setRobotExcited();
    console.log("🎤 Maya is listening...");
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    console.log("🗣️ You said:", transcript);
    addMessage(transcript, true);
    handleVoiceInput(transcript);
  };

  recognition.onerror = (event) => {
    console.error("❌ Speech error:", event.error);
    isListening = false;
    setRobotNeutral();

    // Show user-friendly error message
    if (event.error === "network") {
      addMessage(
        "🎤 Voice recognition needs internet connection. You can still type your message!",
        false
      );
    } else if (event.error === "not-allowed") {
      addMessage(
        "🎤 Please allow microphone access in your browser settings to use voice input.",
        false
      );
    } else if (event.error === "no-speech") {
      addMessage("🎤 I didn't hear anything. Try speaking again!", false);
    }
  };

  recognition.onend = () => {
    isListening = false;
    setRobotNeutral();
  };

  addVoiceControls();
}

function addVoiceControls() {
  const chatInput = document.querySelector(".chat-input");

  const voiceBtn = document.createElement("button");
  voiceBtn.className = "voice-btn";
  voiceBtn.innerHTML = "🎤";
  voiceBtn.title = "Click to speak to Maya";

  voiceBtn.addEventListener("click", toggleVoiceInput);
  chatInput.appendChild(voiceBtn);

  const style = document.createElement("style");
  style.textContent = `
    .voice-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      font-size: 24px;
      cursor: pointer;
      margin-left: 10px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }
    .voice-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
    }
    .voice-btn.listening {
      animation: pulse 1.5s infinite;
      background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.15); }
    }
  `;
  document.head.appendChild(style);
}

function toggleVoiceInput() {
  const voiceBtn = document.querySelector(".voice-btn");

  if (isListening) {
    recognition.stop();
    voiceBtn.classList.remove("listening");
    voiceBtn.innerHTML = "🎤";
  } else {
    recognition.start();
    voiceBtn.classList.add("listening");
    voiceBtn.innerHTML = "🔴";
  }
}

async function handleVoiceInput(transcript) {
  const response = await getBotResponse(transcript);
  addMessage(response);
  speakResponse(response);
}

function speakResponse(text) {
  if (isSpeaking) {
    synthesis.cancel();
  }

  const cleanText = text
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "")
    .replace(/#{1,6}\s/g, "")
    .replace(/\n+/g, ". ");

  const utterance = new SpeechSynthesisUtterance(cleanText);

  // Configure CUTE GIRL voice for Maya
  const voices = synthesis.getVoices();
  const preferredVoices = [
    "Google UK English Female",
    "Google US English Female",
    "Microsoft Zira",
    "Samantha",
    "Kyoko",
    "Amelie",
    "Fiona",
  ];

  for (let voiceName of preferredVoices) {
    const voice = voices.find((v) => v.name.includes(voiceName));
    if (voice) {
      utterance.voice = voice;
      break;
    }
  }

  // If no match, find youngest-sounding female voice
  if (!utterance.voice) {
    const femaleVoice = voices.find(
      (v) =>
        v.name.toLowerCase().includes("female") ||
        v.name.toLowerCase().includes("girl")
    );
    if (femaleVoice) utterance.voice = femaleVoice;
  }

  // Cute, energetic girl settings
  utterance.rate = 1.1; // Slightly faster (youthful energy)
  utterance.pitch = 1.3; // Higher pitch (cute, young)
  utterance.volume = 1.0;

  utterance.onstart = () => {
    isSpeaking = true;
    startMouthAnimation();
    setRobotHappy();
  };

  utterance.onend = () => {
    isSpeaking = false;
    stopMouthAnimation();
    setRobotNeutral();
  };

  utterance.onerror = (event) => {
    console.error("❌ Speech error:", event);
    isSpeaking = false;
    stopMouthAnimation();
  };

  synthesis.speak(utterance);
}

function startMouthAnimation() {
  if (mouthAnimationInterval) return;

  let openMouth = true;
  mouthAnimationInterval = setInterval(() => {
    if (openMouth) {
      upperLip.position.y = 0.15;
      lowerLip.position.y = -0.15;
    } else {
      upperLip.position.y = 0.08;
      lowerLip.position.y = -0.08;
    }
    openMouth = !openMouth;
  }, 180); // Faster for energetic speech
}

function stopMouthAnimation() {
  if (mouthAnimationInterval) {
    clearInterval(mouthAnimationInterval);
    mouthAnimationInterval = null;
  }
  upperLip.position.y = 0.08;
  lowerLip.position.y = -0.08;
}

function setRobotExcited() {
  if (head) {
    head.rotation.z = 0.1;
    head.position.y = 2.6;
  }
  if (backpack) {
    backpack.rotation.y = Math.PI * 1.05;
  }
}

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

// ===== VOICE FEATURES FOR MAYA (CUTE GIRL VOICE) =====
let voices = [];
let mouthAnimationFrame;

// Initialize speech synthesis voices
function loadVoices() {
  voices = synthesis.getVoices();
}

if (synthesis.onvoiceschanged !== undefined) {
  synthesis.onvoiceschanged = loadVoices;
}
loadVoices();

// Animate mouth while speaking
function animateMouthSpeaking() {
  if (!isSpeaking || !mouth) return;

  const time = Date.now() * 0.015; // Faster for energetic girl
  mouth.scale.y = 1 + Math.sin(time) * 0.6;
  mouth.position.y = 2.0 + Math.sin(time) * 0.06;

  mouthAnimationFrame = requestAnimationFrame(animateMouthSpeaking);
}

function startMouthAnimation() {
  isSpeaking = true;
  setRobotHappy();
  animateMouthSpeaking();
}

function stopMouthAnimation() {
  isSpeaking = false;
  if (mouthAnimationFrame) {
    cancelAnimationFrame(mouthAnimationFrame);
  }
  if (mouth) {
    mouth.scale.y = 1;
    mouth.position.y = 2.0;
  }
  setRobotNeutral();
}

// Initialize voice recognition
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
    setRobotConfused();
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    console.log("🎤 Maya heard:", transcript);

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

// Text-to-Speech with CUTE GIRL VOICE
function speakResponse(text) {
  synthesis.cancel();

  const cleanText = text
    .replace(/[*_`#]/g, "")
    .replace(/\\n+/g, ". ")
    .replace(/[📚🧘‍♂️⏰💪🎯🧠🚀]/g, "")
    .replace(/\\s+/g, " ")
    .trim();

  const utterance = new SpeechSynthesisUtterance(cleanText);

  // MAYA'S CUTE GIRL VOICE CONFIGURATION
  utterance.rate = 1.05; // Slightly faster for energetic youth
  utterance.pitch = 1.4; // Higher pitch for cute girl voice
  utterance.volume = 1.0;

  // Try to find young female voices (Google, Microsoft, Apple)
  const cuteVoices = voices.filter(
    (voice) =>
      voice.name.includes("Google US English Female") ||
      voice.name.includes("Microsoft Zira") ||
      voice.name.includes("Samantha") ||
      voice.name.includes("Karen") ||
      voice.name.includes("Victoria") ||
      (voice.lang.startsWith("en") &&
        voice.name.toLowerCase().includes("female"))
  );

  if (cuteVoices.length > 0) {
    utterance.voice = cuteVoices[0];
  } else if (voices.length > 0) {
    const englishVoice = voices.find((v) => v.lang.startsWith("en"));
    if (englishVoice) utterance.voice = englishVoice;
  }

  utterance.onstart = () => {
    startMouthAnimation();
  };

  utterance.onend = () => {
    stopMouthAnimation();
  };

  utterance.onerror = (event) => {
    console.error("Speech error:", event);
    stopMouthAnimation();
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
      `${API_BASE_URL}/api/student/start-conversation`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Student" }),
      }
    );

    const data = await response.json();
    if (data.success && data.message) {
      conversationStarted = true;
      console.log("✅ Connected to Maya (Student AI) backend");
      // Show welcome message
      addMessage(data.message);
    }
  } catch (error) {
    console.error("⚠️ Backend not available, using offline mode:", error);
    addMessage(
      "Hi! I'm Maya, your study companion! 📚 (Note: Backend AI not connected - please start the server)"
    );
  }
}

// Bot responses - NOW USES BACKEND AI (Ollama/Gemini)
async function getBotResponse(userMessage) {
  setRobotThinking();

  try {
    // Call backend API for AI response
    const response = await fetch(`${API_BASE_URL}/api/student/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userMessage,
        enable_voice: false,
      }),
    });

    const data = await response.json();

    if (data.success && data.response) {
      setRobotHappy();
      console.log(
        "🤖 Maya AI Response:",
        data.response.substring(0, 50) + "..."
      );
      return data.response;
    } else {
      throw new Error("Invalid response from backend");
    }
  } catch (error) {
    console.error("❌ Backend error:", error);
    setRobotSad();

    // Fallback response if backend is down
    return "I'm having trouble connecting to my AI brain right now! 🤖\n\nPlease make sure the backend server is running:\n\n```bash\ncd backend\npython main.py\n```\n\nOnce that's running, I'll be able to help you with:\n• Exam preparation strategies\n• Study techniques & time management\n• Stress relief & motivation\n• Memory techniques & focus tips\n\nWhat would you like help with?";
  }
}

// Send message
async function sendMessage() {
  const message = userInput.value.trim();
  if (message) {
    addMessage(message, true);
    userInput.value = "";

    showTyping();

    try {
      const response = await getBotResponse(message);
      hideTyping();
      addMessage(response);
    } catch (error) {
      hideTyping();
      addMessage("Sorry, I encountered an error. Please try again!");
    }
  }
}

// Event listeners
sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

// Quick action buttons
quickBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const question = btn.getAttribute("data-question");
    userInput.value = question;
    sendMessage();
  });
});

// Initial greeting animation
setTimeout(() => {
  setRobotHappy();
  setTimeout(() => setRobotNeutral(), 1000);
}, 500);
