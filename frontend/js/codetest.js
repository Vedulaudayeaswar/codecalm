const state = {
  tps: [],
  leaderboard: [],
};

const apiBase = window.location.hostname === "localhost" ? "http://localhost:8081" : window.location.origin;
const botBase = window.location.hostname === "localhost" ? "http://localhost:8082" : window.location.origin;
const wsUrl = window.location.hostname === "localhost" ? "ws://localhost:8084/ws/metrics" : `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws/metrics`;

const chart = document.getElementById("tps-chart");
const ctx = chart.getContext("2d");

function connectMetrics() {
  const status = document.getElementById("connection-status");
  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    status.textContent = "Live";
    status.classList.add("online");
  };

  ws.onmessage = (event) => {
    renderMetrics(JSON.parse(event.data));
  };

  ws.onclose = () => {
    status.textContent = "Reconnecting";
    status.classList.remove("online");
    setTimeout(connectMetrics, 1200);
  };

  ws.onerror = () => {
    status.textContent = "Offline";
    status.classList.remove("online");
  };
}

function renderMetrics(metrics) {
  document.getElementById("metric-tps").textContent = Math.round(metrics.tps || 0).toLocaleString();
  document.getElementById("metric-p50").textContent = Number(metrics.p50 || 0).toFixed(1);
  document.getElementById("metric-p99").textContent = Number(metrics.p99 || 0).toFixed(1);
  document.getElementById("metric-bots").textContent = metrics.activeBots || 0;
  document.getElementById("metric-failures").textContent = metrics.failures || 0;
  document.getElementById("last-update").textContent = metrics.updatedAt ? new Date(metrics.updatedAt).toLocaleTimeString() : "Live";

  state.tps.push(metrics.tps || 0);
  if (state.tps.length > 48) state.tps.shift();
  drawChart();
}

function drawChart() {
  const width = chart.width;
  const height = chart.height;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(0, 0, 0, 0.76)";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 5; i++) {
    const y = (height / 5) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const max = Math.max(...state.tps, 10);
  const bars = state.tps.length ? state.tps : [0];
  const gap = 8;
  const barWidth = Math.max(8, (width - gap * (bars.length + 1)) / bars.length);
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#00f5a0");
  gradient.addColorStop(1, "#00d7ff");

  bars.forEach((value, index) => {
    const barHeight = Math.max(4, (value / max) * (height - 34));
    const x = gap + index * (barWidth + gap);
    const y = height - barHeight - 14;
    ctx.fillStyle = gradient;
    ctx.shadowColor = "rgba(0, 245, 160, 0.45)";
    ctx.shadowBlur = 16;
    ctx.fillRect(x, y, barWidth, barHeight);
    ctx.shadowBlur = 0;
  });
}

document.getElementById("upload-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = document.getElementById("code-file").files[0];
  const logOutput = document.getElementById("log-output");
  if (!file) {
    logOutput.textContent = "Choose a .py, .cpp, or .go file first.";
    return;
  }

  const form = new FormData();
  form.append("file", file);
  logOutput.textContent = "Uploading and building container...";

  try {
    const response = await fetch(`${apiBase}/upload`, { method: "POST", body: form });
    const data = await response.json();
    document.getElementById("submission-id").textContent = data.id ? `Submission ${data.id}` : "Upload failed";
    logOutput.textContent = data.logs || data.error || "No logs returned";
    if (data.id) addLeaderboard(data.id, data.language, data.logs);
  } catch (error) {
    logOutput.textContent = `Upload service unavailable: ${error.message}`;
  }
});

document.getElementById("benchmark-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const bots = Number(document.getElementById("bot-count").value || 100);
  const logOutput = document.getElementById("log-output");
  logOutput.textContent = `Starting benchmark with ${bots} bots...`;

  try {
    const response = await fetch(`${botBase}/benchmark/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ botCount: bots, duration: "30s" }),
    });
    const data = await response.json();
    logOutput.textContent = data.started
      ? `Benchmark started: ${data.botCount} bots targeting ${data.target} for ${data.duration}.`
      : data.error || "Benchmark request failed.";
  } catch (error) {
    logOutput.textContent = `Botload service unavailable: ${error.message}`;
  }
});

function addLeaderboard(id, language, logs) {
  state.leaderboard.unshift({ id, language, score: `${Math.max(1, 100 - (logs || "").length % 80)} pts` });
  state.leaderboard = state.leaderboard.slice(0, 5);
  document.getElementById("leaderboard-list").innerHTML = state.leaderboard
    .map((row) => `<div class="leaderboard-row"><span>${row.id} (${row.language})</span><strong>${row.score}</strong></div>`)
    .join("");
}

drawChart();
connectMetrics();
