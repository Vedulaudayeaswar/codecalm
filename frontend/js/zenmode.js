// ZenMode Meditation JavaScript - FitCalm

// ========================
// Meditation Exercises Data
// ========================

const meditationExercises = {
  breathing: [
    {
      id: "box-breathing",
      name: "Box Breathing",
      description: "Equal breath technique for instant calm",
      difficulty: "easy",
      icon: "🎯",
      category: "breathing",
      steps: [
        "Breathe in slowly through your nose for 4 counts",
        "Hold your breath gently for 4 counts",
        "Exhale slowly through your mouth for 4 counts",
        "Hold empty for 4 counts before repeating",
      ],
      breathingPattern: { in: 4, hold: 4, out: 4, holdOut: 4 },
      defaultDuration: 5,
    },
    {
      id: "calm-breathing",
      name: "4-7-8 Technique",
      description: "Dr. Weil's relaxation breathing",
      difficulty: "easy",
      icon: "🌊",
      category: "breathing",
      steps: [
        "Breathe in quietly through your nose for 4 counts",
        "Hold your breath for 7 counts",
        "Exhale completely through your mouth for 8 counts",
        "Repeat the cycle with focus on the breath",
      ],
      breathingPattern: { in: 4, hold: 7, out: 8, holdOut: 0 },
      defaultDuration: 5,
    },
    {
      id: "energizing-breath",
      name: "Energizing Breath",
      description: "Boost energy and alertness",
      difficulty: "medium",
      icon: "⚡",
      category: "breathing",
      steps: [
        "Take a quick, deep breath in through your nose (2 counts)",
        "Hold briefly for 1 count",
        "Exhale forcefully through your mouth (3 counts)",
        "Feel the energy flowing through your body",
      ],
      breathingPattern: { in: 2, hold: 1, out: 3, holdOut: 0 },
      defaultDuration: 3,
    },
  ],
  mindfulness: [
    {
      id: "body-scan",
      name: "Body Scan",
      description: "Progressive relaxation meditation",
      difficulty: "easy",
      icon: "🧘",
      category: "mindfulness",
      steps: [
        "Start by noticing sensations in your toes and feet",
        "Slowly move your attention up through your legs",
        "Continue scanning through your torso, arms, and hands",
        "Finish at the crown of your head, observing without judgment",
      ],
      breathingPattern: { in: 4, hold: 2, out: 6, holdOut: 0 },
      defaultDuration: 10,
    },
    {
      id: "present-moment",
      name: "Present Moment",
      description: "Anchor awareness in the now",
      difficulty: "easy",
      icon: "⏰",
      category: "mindfulness",
      steps: [
        "Notice 5 things you can see around you",
        "Acknowledge 4 things you can touch or feel",
        "Listen for 3 sounds in your environment",
        "Notice 2 scents and 1 taste, returning to the present",
      ],
      breathingPattern: { in: 4, hold: 4, out: 4, holdOut: 0 },
      defaultDuration: 5,
    },
    {
      id: "loving-kindness",
      name: "Loving Kindness",
      description: "Cultivate compassion and warmth",
      difficulty: "medium",
      icon: "💚",
      category: "mindfulness",
      steps: [
        "Think of someone you love and wish them happiness",
        "Extend the same wishes to yourself with kindness",
        "Send these feelings to someone you know casually",
        "Finally, extend loving kindness to all beings",
      ],
      breathingPattern: { in: 4, hold: 3, out: 5, holdOut: 0 },
      defaultDuration: 10,
    },
  ],
  relaxation: [
    {
      id: "progressive-muscle",
      name: "Progressive Muscle Relaxation",
      description: "Release physical tension",
      difficulty: "easy",
      icon: "💪",
      category: "relaxation",
      steps: [
        "Tense the muscles in your feet for 5 seconds",
        "Release and feel the relaxation spreading",
        "Move up through each muscle group (legs, core, arms)",
        "End with facial muscles, feeling complete relaxation",
      ],
      breathingPattern: { in: 3, hold: 5, out: 4, holdOut: 0 },
      defaultDuration: 15,
    },
    {
      id: "deep-rest",
      name: "Deep Rest",
      description: "Yoga Nidra inspired relaxation",
      difficulty: "medium",
      icon: "😌",
      category: "relaxation",
      steps: [
        "Lie down comfortably and close your eyes",
        "Take awareness to your breath, letting it flow naturally",
        "Visualize a warm, healing light moving through your body",
        "Rest in complete stillness and deep peace",
      ],
      breathingPattern: { in: 4, hold: 2, out: 6, holdOut: 2 },
      defaultDuration: 20,
    },
    {
      id: "gentle-unwind",
      name: "Gentle Unwind",
      description: "Evening relaxation practice",
      difficulty: "easy",
      icon: "🌙",
      category: "relaxation",
      steps: [
        "Let go of the day's activities and concerns",
        "Breathe deeply and release tension with each exhale",
        "Allow your body to sink into comfort and support",
        "Rest in a state of peaceful relaxation",
      ],
      breathingPattern: { in: 3, hold: 2, out: 6, holdOut: 0 },
      defaultDuration: 10,
    },
  ],
  visualization: [
    {
      id: "peaceful-place",
      name: "Peaceful Place",
      description: "Mental sanctuary visualization",
      difficulty: "easy",
      icon: "🏝️",
      category: "visualization",
      steps: [
        "Imagine a peaceful, safe place in vivid detail",
        "Notice the colors, sounds, and sensations there",
        "Feel yourself fully present in this sanctuary",
        "Know you can return to this place anytime",
      ],
      breathingPattern: { in: 4, hold: 3, out: 5, holdOut: 0 },
      defaultDuration: 10,
    },
    {
      id: "healing-light",
      name: "Healing Light",
      description: "Restorative energy visualization",
      difficulty: "medium",
      icon: "✨",
      category: "visualization",
      steps: [
        "Visualize a warm, golden light above your head",
        "See it slowly descending, filling your entire body",
        "Feel it healing and energizing every cell",
        "Watch it expand beyond you, sharing healing energy",
      ],
      breathingPattern: { in: 4, hold: 4, out: 4, holdOut: 0 },
      defaultDuration: 10,
    },
    {
      id: "mountain-meditation",
      name: "Mountain Meditation",
      description: "Strength and stability practice",
      difficulty: "medium",
      icon: "⛰️",
      category: "visualization",
      steps: [
        "Visualize yourself as a strong, unshakeable mountain",
        "Feel your base rooted deeply in the earth",
        "Notice weather and seasons passing but you remain stable",
        "Embody the mountain's strength and stillness",
      ],
      breathingPattern: { in: 5, hold: 3, out: 5, holdOut: 2 },
      defaultDuration: 15,
    },
  ],
  quick: [
    {
      id: "1-minute-calm",
      name: "1-Minute Calm",
      description: "Quick reset for busy moments",
      difficulty: "easy",
      icon: "⏱️",
      category: "quick",
      steps: [
        "Close your eyes and take a deep breath",
        "Notice your breath flowing in and out",
        "Release tension from your shoulders",
        "Return to your day feeling refreshed",
      ],
      breathingPattern: { in: 4, hold: 2, out: 4, holdOut: 0 },
      defaultDuration: 1,
    },
    {
      id: "3-minute-reset",
      name: "3-Minute Reset",
      description: "Mid-day recharge",
      difficulty: "easy",
      icon: "🔄",
      category: "quick",
      steps: [
        "Sit comfortably and close your eyes",
        "Take 3 deep breaths, releasing tension",
        "Scan your body for any tightness",
        "Open your eyes feeling renewed",
      ],
      breathingPattern: { in: 4, hold: 3, out: 6, holdOut: 0 },
      defaultDuration: 3,
    },
  ],
};

// ========================
// State Management
// ========================

let currentExercise = null;
let currentStep = 0;
let timerInterval = null;
let breathCycleInterval = null;
let timeRemaining = 0;
let totalTime = 0;
let isPaused = false;
let breathCount = 0;
let currentBreathPhase = "in";

// Audio Elements
let meditationAudio;
let backgroundAudio;
let bellSound;

// ========================
// DOM Elements
// ========================

// Will be initialized after DOM loads
let timerDisplay;
let timerLabel;
let breathCountDisplay;
let progressFill;
let timerCircle;

let playPauseBtn;
let resetBtn;
let prevStepBtn;
let nextStepBtn;

let durationSelect;
let breathRatioSelect;
let backgroundSoundSelect;

let completionModal;
let newSessionBtn;
let closeModalBtn;

let closeZenBtn;
let audioSettingsToggle;
let audioSettingsPanel;

// ========================
// Initialization
// ========================

function init() {
  // Initialize DOM elements
  meditationAudio = document.getElementById("meditationAudio");
  backgroundAudio = document.getElementById("backgroundAudio");
  bellSound = document.getElementById("bellSound");

  timerDisplay = document.getElementById("timerDisplay");
  timerLabel = document.getElementById("timerLabel");
  breathCountDisplay = document.getElementById("breathCount");
  progressFill = document.getElementById("progressFill");
  timerCircle = document.querySelector(".timer-circle");

  playPauseBtn = document.getElementById("playPauseBtn");
  resetBtn = document.getElementById("resetBtn");
  prevStepBtn = document.getElementById("prevStepBtn");
  nextStepBtn = document.getElementById("nextStepBtn");

  durationSelect = document.getElementById("durationSelect");
  breathRatioSelect = document.getElementById("breathRatioSelect");
  backgroundSoundSelect = document.getElementById("backgroundSoundSelect");

  completionModal = document.getElementById("completionModal");
  newSessionBtn = document.getElementById("newSessionBtn");
  closeModalBtn = document.getElementById("closeModalBtn");

  closeZenBtn = document.querySelector(".close-zen");
  audioSettingsToggle = document.getElementById("audioSettingsToggle");
  audioSettingsPanel = document.getElementById("audioSettingsPanel");

  setupExerciseCards();
  setupEventListeners();
  selectFirstExercise();
}

function setupExerciseCards() {
  // Map HTML exercise cards to our exercise data
  const exerciseMapping = {
    "breathing-478": meditationExercises.breathing[1], // 4-7-8 Technique
    "box-breathing": meditationExercises.breathing[0], // Box Breathing
    "triangle-breathing": meditationExercises.breathing[2], // Triangle (using energizing)
    "mindful-awareness": meditationExercises.mindfulness[1], // Present Moment
    "loving-kindness": meditationExercises.mindfulness[2], // Loving Kindness
    "walking-meditation": meditationExercises.mindfulness[0], // Body Scan (closest match)
    "body-scan": meditationExercises.relaxation[0], // Progressive Muscle
    "muscle-relaxation": meditationExercises.relaxation[0], // Progressive Muscle
    "yoga-nidra": meditationExercises.relaxation[1], // Deep Rest
    "peaceful-place": meditationExercises.visualization[0], // Peaceful Place
    "light-meditation": meditationExercises.visualization[1], // Healing Light
    "chakra-visualization": meditationExercises.visualization[2], // Mountain Meditation
    "quick-calm": meditationExercises.quick[0], // 1-Minute Calm
    "stress-release": meditationExercises.quick[1], // 3-Minute Reset
  };

  // Add click handlers to all exercise cards
  document.querySelectorAll(".exercise-card").forEach((card) => {
    const exerciseId = card.dataset.exercise;
    const exercise = exerciseMapping[exerciseId];

    if (exercise) {
      card.addEventListener("click", () => selectExercise(exercise));
    }
  });
}

function selectFirstExercise() {
  const firstExercise = meditationExercises.breathing[1]; // 4-7-8 as default
  selectExercise(firstExercise);
}

function selectExercise(exercise) {
  currentExercise = exercise;
  currentStep = 0;
  breathCount = 0;

  // Update active card
  document.querySelectorAll(".exercise-card").forEach((card) => {
    card.classList.remove("active");
  });

  // Find and activate the clicked card (use event.currentTarget if available)
  const activeCards = document.querySelectorAll(".exercise-card");
  activeCards.forEach((card) => {
    // Check multiple possible ways to match
    const cardExercise = card.dataset.exercise;
    if (
      cardExercise &&
      (cardExercise.includes(exercise.id) ||
        exercise.id.includes(cardExercise) ||
        exercise.name.toLowerCase().includes(cardExercise.replace(/-/g, " ")))
    ) {
      card.classList.add("active");
    }
  });

  // Update duration based on exercise default
  durationSelect.value = exercise.defaultDuration;

  renderInstructions();
  resetTimer();
}

function renderInstructions() {
  const instructionSteps = document.getElementById("instructionSteps");
  if (!instructionSteps || !currentExercise) return;

  instructionSteps.innerHTML = "";
  currentExercise.steps.forEach((step, index) => {
    const stepElement = document.createElement("div");
    stepElement.className = `step ${index === 0 ? "active" : ""}`;
    stepElement.dataset.stepIndex = index;
    stepElement.innerHTML = `
      <div class="step-number">${index + 1}</div>
      <p>${step}</p>
    `;
    instructionSteps.appendChild(stepElement);
  });

  // Update exercise title
  const exerciseTitle = document.getElementById("exerciseTitle");
  if (exerciseTitle) {
    exerciseTitle.textContent = currentExercise.name;
  }
}

// ========================
// Timer Functions
// ========================

function startTimer() {
  if (!currentExercise) return;

  if (timeRemaining === 0) {
    const duration = parseInt(durationSelect.value);
    timeRemaining = duration * 60;
    totalTime = timeRemaining;
  }

  isPaused = false;
  playPauseBtn.innerHTML = "<span>⏸</span> Pause";

  // Play bell sound at start
  playBellSound();

  // Start background audio if selected
  const bgSound = backgroundSoundSelect.value;
  if (bgSound && bgSound !== "none") {
    playBackgroundSound(bgSound);
  }

  timerInterval = setInterval(updateTimer, 1000);
  startBreathingCycle();
}

function pauseTimer() {
  isPaused = true;
  clearInterval(timerInterval);
  clearInterval(breathCycleInterval);
  playPauseBtn.innerHTML = "<span>▶</span> Resume";

  // Pause background audio
  backgroundAudio.pause();
}

function resetTimer() {
  clearInterval(timerInterval);
  clearInterval(breathCycleInterval);

  const duration = parseInt(durationSelect.value);
  timeRemaining = duration * 60;
  totalTime = timeRemaining;
  currentStep = 0;
  breathCount = 0;
  isPaused = false;

  updateTimerDisplay();
  updateProgressCircle();
  updateActiveStep(0);

  playPauseBtn.innerHTML = "<span>▶</span> Start";
  timerCircle.className = "timer-circle";

  // Stop background audio
  backgroundAudio.pause();
  backgroundAudio.currentTime = 0;
}

function updateTimer() {
  if (timeRemaining > 0) {
    timeRemaining--;
    updateTimerDisplay();
    updateProgressCircle();
  } else {
    completeSession();
  }
}

function updateTimerDisplay() {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  timerDisplay.textContent = `${minutes}:${seconds
    .toString()
    .padStart(2, "0")}`;
  breathCountDisplay.textContent = `Breaths: ${breathCount}`;
}

function updateProgressCircle() {
  const progress = 1 - timeRemaining / totalTime;
  const circumference = 2 * Math.PI * 90; // radius = 90
  const offset = circumference - progress * circumference;
  progressFill.style.strokeDashoffset = offset;
}

// ========================
// Breathing Cycle
// ========================

function startBreathingCycle() {
  const pattern = currentExercise.breathingPattern;
  let phase = 0; // 0: in, 1: hold, 2: out, 3: holdOut
  const phases = [
    {
      name: "in",
      duration: pattern.in,
      label: "Breathe In",
      class: "breathe-in",
    },
    {
      name: "hold",
      duration: pattern.hold,
      label: "Hold",
      class: "breathe-hold",
    },
    {
      name: "out",
      duration: pattern.out,
      label: "Breathe Out",
      class: "breathe-out",
    },
    {
      name: "holdOut",
      duration: pattern.holdOut,
      label: "Hold",
      class: "breathe-hold",
    },
  ];

  function nextPhase() {
    const currentPhase = phases[phase];

    if (currentPhase.duration > 0) {
      timerLabel.textContent = currentPhase.label;
      timerCircle.className = `timer-circle ${currentPhase.class}`;

      setTimeout(() => {
        phase = (phase + 1) % phases.length;
        if (phase === 0) breathCount++;
        nextPhase();
      }, currentPhase.duration * 1000);
    } else {
      phase = (phase + 1) % phases.length;
      nextPhase();
    }
  }

  nextPhase();
}

// ========================
// Step Navigation
// ========================

function nextStep() {
  if (currentStep < currentExercise.steps.length - 1) {
    currentStep++;
    updateActiveStep(currentStep);
  }
}

function prevStep() {
  if (currentStep > 0) {
    currentStep--;
    updateActiveStep(currentStep);
  }
}

function updateActiveStep(stepIndex) {
  const instructionSteps = document.getElementById("instructionSteps");
  if (!instructionSteps) return;

  const steps = instructionSteps.querySelectorAll(".step");
  steps.forEach((step, index) => {
    step.classList.toggle("active", index === stepIndex);
  });
}

// ========================
// Audio Functions
// ========================

function playBackgroundSound(soundType) {
  const soundPaths = {
    nature: "../../audio/nature.m4a",
    rain: "../../audio/rain.m4a",
    ocean: "../../audio/ocean.m4a",
    forest: "../../audio/forest.m4a",
  };

  if (soundPaths[soundType]) {
    backgroundAudio.src = soundPaths[soundType];
    backgroundAudio.loop = true;
    backgroundAudio.volume = 0.3;
    backgroundAudio
      .play()
      .catch((err) => console.log("Audio play failed:", err));
  }
}

function playBellSound() {
  bellSound.currentTime = 0;
  bellSound.volume = 0.5;
  bellSound.play().catch((err) => console.log("Bell sound failed:", err));
}

function testAudioPath(audioType) {
  const pathInput = document.getElementById(`${audioType}AudioPath`);
  const path = pathInput.value;

  const testAudio = new Audio(path);
  testAudio.volume = 0.3;

  testAudio
    .play()
    .then(() => {
      showNotification(`✓ ${audioType} audio working!`);
      setTimeout(() => testAudio.pause(), 2000);
    })
    .catch((err) => {
      showNotification(`✗ Failed to load ${audioType} audio`);
      console.error(err);
    });
}

function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "audio-notification";
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

function loadPresetSound(soundType) {
  backgroundSoundSelect.value = soundType;

  if (soundType !== "none") {
    playBackgroundSound(soundType);
    showNotification(`Playing ${soundType} sounds`);
  } else {
    backgroundAudio.pause();
    showNotification("Background sounds stopped");
  }
}

// ========================
// Session Completion
// ========================

function completeSession() {
  clearInterval(timerInterval);
  clearInterval(breathCycleInterval);

  // Play completion bell
  playBellSound();

  // Stop background audio
  backgroundAudio.pause();

  // Update modal stats
  document.getElementById("sessionDuration").textContent = durationSelect.value;
  document.getElementById("breathsTaken").textContent = breathCount;

  // Show completion modal
  completionModal.classList.add("active");
}

function closeCompletionModal() {
  completionModal.classList.remove("active");
  resetTimer();
}

// ========================
// Event Listeners
// ========================

function setupEventListeners() {
  // Timer controls
  playPauseBtn.addEventListener("click", () => {
    if (isPaused || timeRemaining === totalTime) {
      startTimer();
    } else {
      pauseTimer();
    }
  });

  resetBtn.addEventListener("click", resetTimer);
  prevStepBtn.addEventListener("click", prevStep);
  nextStepBtn.addEventListener("click", nextStep);

  // Settings
  durationSelect.addEventListener("change", () => {
    if (timeRemaining === totalTime) {
      resetTimer();
    }
  });

  backgroundSoundSelect.addEventListener("change", (e) => {
    const soundType = e.target.value;
    if (soundType !== "none" && !isPaused) {
      playBackgroundSound(soundType);
    } else {
      backgroundAudio.pause();
    }
  });

  // Modal
  newSessionBtn.addEventListener("click", closeCompletionModal);
  closeModalBtn.addEventListener("click", closeCompletionModal);

  // Close button
  closeZenBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to exit ZenMode?")) {
      window.location.href = "../html/fitness.html";
    }
  });

  // Audio settings panel
  audioSettingsToggle.addEventListener("click", () => {
    audioSettingsPanel.classList.toggle("active");
  });

  // Audio preset buttons
  document.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const soundType = btn.dataset.sound;
      loadPresetSound(soundType);
    });
  });

  // Test audio buttons
  document.querySelectorAll(".test-audio-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const audioType = btn.dataset.audioType;
      testAudioPath(audioType);
    });
  });

  // Volume control
  const volumeSlider = document.getElementById("volumeSlider");
  const volumeValue = document.getElementById("volumeValue");

  volumeSlider.addEventListener("input", (e) => {
    const volume = e.target.value / 100;
    backgroundAudio.volume = volume;
    volumeValue.textContent = `${e.target.value}%`;
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      playPauseBtn.click();
    } else if (e.code === "Escape") {
      if (completionModal.classList.contains("active")) {
        closeCompletionModal();
      }
    } else if (e.code === "ArrowRight") {
      nextStep();
    } else if (e.code === "ArrowLeft") {
      prevStep();
    } else if (e.code === "KeyR") {
      resetTimer();
    }
  });
}

// ========================
// Initialize on Load
// ========================

document.addEventListener("DOMContentLoaded", init);
