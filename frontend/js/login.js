// ===== THREE.JS 3D LOCK SETUP =====
let scene,
  camera,
  renderer,
  lock,
  isLocked = true;

function init3DLock() {
  const canvas = document.getElementById("lockCanvas");
  const container = document.querySelector(".lock-side");
  const width = container.offsetWidth;
  const height = container.offsetHeight;

  // Scene
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0a0a0a, 5, 15);

  // Camera
  camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
  camera.position.z = 8;

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setSize(width, height);
  renderer.setClearColor(0x0a0a0a, 1);

  // Lights for Black Radiant Effect
  const ambientLight = new THREE.AmbientLight(0x333333, 0.5);
  scene.add(ambientLight);

  const pointLight1 = new THREE.PointLight(0x1a1a1a, 2, 100);
  pointLight1.position.set(5, 5, 5);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0x2a2a2a, 1.5, 100);
  pointLight2.position.set(-5, -5, 5);
  scene.add(pointLight2);

  const spotLight = new THREE.SpotLight(0x4a4a4a, 1);
  spotLight.position.set(0, 10, 10);
  spotLight.angle = Math.PI / 6;
  scene.add(spotLight);

  // Create Lock with Black Radiant Material
  lock = new THREE.Group();

  // Lock Body - Black with metallic sheen
  const bodyGeometry = new THREE.BoxGeometry(3, 4, 1.5);
  const bodyMaterial = new THREE.MeshPhongMaterial({
    color: 0x1a1a1a,
    shininess: 100,
    emissive: 0x0a0a0a,
    emissiveIntensity: 0.5,
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = -1;
  lock.add(body);

  // Keyhole
  const keyholeGeometry = new THREE.CircleGeometry(0.4, 32);
  const keyholeMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
  });
  const keyhole = new THREE.Mesh(keyholeGeometry, keyholeMaterial);
  keyhole.position.set(0, -1, 0.76);
  lock.add(keyhole);

  // Keyhole slot
  const slotGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.1);
  const slot = new THREE.Mesh(slotGeometry, keyholeMaterial);
  slot.position.set(0, -1.5, 0.76);
  lock.add(slot);

  // Shackle - Dark metallic
  const shackleMaterial = new THREE.MeshPhongMaterial({
    color: 0x2a2a2a,
    shininess: 120,
    emissive: 0x1a1a1a,
    emissiveIntensity: 0.4,
  });

  // Shackle left
  const shackleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 32);
  const shackleLeft = new THREE.Mesh(shackleGeometry, shackleMaterial);
  shackleLeft.position.set(-1.2, 1.5, 0);
  lock.add(shackleLeft);

  // Shackle right
  const shackleRight = new THREE.Mesh(shackleGeometry, shackleMaterial);
  shackleRight.position.set(1.2, 1.5, 0);
  lock.add(shackleRight);

  // Shackle top
  const shackleTopGeometry = new THREE.TorusGeometry(
    1.5,
    0.3,
    16,
    100,
    Math.PI
  );
  const shackleTop = new THREE.Mesh(shackleTopGeometry, shackleMaterial);
  shackleTop.position.set(0, 3, 0);
  shackleTop.rotation.x = Math.PI / 2;
  lock.add(shackleTop);

  // Store shackle parts for animation
  lock.shackle = {
    left: shackleLeft,
    right: shackleRight,
    top: shackleTop,
  };

  scene.add(lock);

  // Animate
  animate();
}

function animate() {
  requestAnimationFrame(animate);

  // Gentle rotation
  lock.rotation.y += 0.005;

  // Floating animation
  lock.position.y = Math.sin(Date.now() * 0.001) * 0.3;

  renderer.render(scene, camera);
}

// Lock animations
function closeLock() {
  isLocked = true;
  gsap.to(lock.shackle.top.position, {
    y: 3,
    duration: 1,
    ease: "elastic.out(1, 0.5)",
  });
  gsap.to(lock.shackle.left.position, {
    y: 1.5,
    duration: 1,
    ease: "elastic.out(1, 0.5)",
  });
  gsap.to(lock.shackle.right.position, {
    y: 1.5,
    duration: 1,
    ease: "elastic.out(1, 0.5)",
  });
  gsap.to(lock.rotation, { z: 0, duration: 0.5 });
}

function openLock() {
  isLocked = false;
  gsap.to(lock.shackle.top.position, {
    y: 4.5,
    duration: 0.8,
    ease: "back.out(1.7)",
  });
  gsap.to(lock.shackle.left.position, {
    y: 3,
    duration: 0.8,
    ease: "back.out(1.7)",
  });
  gsap.to(lock.shackle.right.position, {
    y: 3,
    duration: 0.8,
    ease: "back.out(1.7)",
  });
  gsap.to(lock.rotation, { z: 0.2, duration: 0.5 });
}

// Initialize on load
window.addEventListener("load", init3DLock);

// Handle resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ===== AUTH FUNCTIONALITY =====

// Switch between forms
function switchToLogin(e) {
  e.preventDefault();
  document.getElementById("registerForm").classList.add("hidden");
  document.getElementById("forgotForm").classList.add("hidden");
  document.getElementById("loginForm").classList.remove("hidden");
  closeLock();
}

function switchToRegister(e) {
  e.preventDefault();
  document.getElementById("loginForm").classList.add("hidden");
  document.getElementById("forgotForm").classList.add("hidden");
  document.getElementById("registerForm").classList.remove("hidden");
  openLock();
}

function showForgotPassword(e) {
  e.preventDefault();
  document.getElementById("loginForm").classList.add("hidden");
  document.getElementById("registerForm").classList.add("hidden");
  document.getElementById("forgotForm").classList.remove("hidden");
}

// Handle Login
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  // Show loading state
  const btn = e.target.querySelector(".submit-btn");
  const originalContent = btn.innerHTML;
  btn.innerHTML = "<span>Signing in...</span>";
  btn.disabled = true;
  btn.classList.add("loading");

  try {
    // Call backend login API
    const response = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.success) {
      // Store session token in localStorage
      localStorage.setItem("codecalm_session_token", data.session.token);
      localStorage.setItem("codecalm_user", JSON.stringify(data.user));

      console.log("✅ Login successful:", data.user);

      // Animate lock closing
      closeLock();

      // Show success message
      btn.innerHTML = "<span>✓ Success!</span>";

      // Redirect to home page
      setTimeout(() => {
        window.location.href = "../../index.html";
      }, 800);
    } else {
      // Show error
      alert(data.message || "Login failed. Please check your credentials.");
      btn.innerHTML = originalContent;
      btn.disabled = false;
      btn.classList.remove("loading");
    }
  } catch (error) {
    console.error("Login error:", error);
    alert(
      "Unable to connect to server. Make sure the backend is running on localhost:5000"
    );
    btn.innerHTML = originalContent;
    btn.disabled = false;
    btn.classList.remove("loading");
  }
}

// Handle Register
async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById("registerName").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const role = document.getElementById("registerRole")?.value || "student";

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  if (password.length < 8) {
    alert("Password must be at least 8 characters long!");
    return;
  }

  const btn = e.target.querySelector(".submit-btn");
  const originalContent = btn.innerHTML;
  btn.innerHTML = "<span>Creating account...</span>";
  btn.disabled = true;
  btn.classList.add("loading");

  try {
    // Call backend register API
    const response = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        full_name: name,
        role: role,
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log("✅ Registration successful:", data.user);

      // Animate lock closing
      closeLock();

      // Show success message
      btn.innerHTML = "<span>✓ Account created!</span>";

      // Switch to login after animation
      setTimeout(() => {
        alert("Account created successfully! Please sign in.");
        document.getElementById("registerForm").classList.add("hidden");
        document.getElementById("loginForm").classList.remove("hidden");

        // Pre-fill email
        document.getElementById("loginEmail").value = email;

        // Reset button
        btn.innerHTML = originalContent;
        btn.disabled = false;
        btn.classList.remove("loading");

        // Clear form
        document.getElementById("registerName").value = "";
        document.getElementById("registerEmail").value = "";
        document.getElementById("registerPassword").value = "";
        document.getElementById("confirmPassword").value = "";
      }, 1500);
    } else {
      // Show error
      alert(data.message || "Registration failed. Please try again.");
      btn.innerHTML = originalContent;
      btn.disabled = false;
      btn.classList.remove("loading");
    }
  } catch (error) {
    console.error("Registration error:", error);
    alert(
      "Unable to connect to server. Make sure the backend is running on localhost:5000"
    );
    btn.innerHTML = originalContent;
    btn.disabled = false;
    btn.classList.remove("loading");
  }
}

// Handle Forgot Password
function handleForgotPassword(e) {
  e.preventDefault();
  const email = document.getElementById("forgotEmail").value;

  const btn = e.target.querySelector(".submit-btn");
  const originalContent = btn.innerHTML;
  btn.innerHTML = "<span>Sending...</span>";
  btn.disabled = true;
  btn.classList.add("loading");

  setTimeout(() => {
    alert("Password reset link sent to " + email);
    document.getElementById("forgotForm").classList.add("hidden");
    document.getElementById("loginForm").classList.remove("hidden");

    // Reset button
    btn.innerHTML = originalContent;
    btn.disabled = false;
    btn.classList.remove("loading");

    // Clear form
    document.getElementById("forgotEmail").value = "";
  }, 1000);
}

// Social Login
function loginWithGoogle() {
  console.log("Login with Google");
  // Implement Google OAuth
  alert("Google login coming soon!");
}

function loginWithLinkedIn() {
  console.log("Login with LinkedIn");
  // Implement LinkedIn OAuth
  alert("LinkedIn login coming soon!");
}

// Add smooth form transitions
document.addEventListener("DOMContentLoaded", () => {
  // Add entrance animation
  setTimeout(() => {
    document.querySelector(".auth-form:not(.hidden)").style.opacity = "1";
  }, 100);
});
