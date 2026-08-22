
const TOTAL_CELLS = 35;
const API_URL = ""; // Cole aqui, depois, a URL /exec do Google Apps Script.
const questions = Array.isArray(window.QUESTION_BANK) ? window.QUESTION_BANK : [];

const missions = {
  completa: "🌎 Missão Completa",
  chuvas: "🌧️ Chuvas e Alagamentos",
  queimadas: "🔥 Queimadas",
  calor: "☀️ Calor e Seca",
  deslizamentos: "⛰️ Deslizamentos"
};


const questionThemes = {
  chuvas:         { icon: "🌧️", label: "Chuvas e Alagamentos", short: "Chuvas", color: "#5d9fd6", bg: "#e8f5ff" },
  queimadas:      { icon: "🔥", label: "Queimadas", short: "Queimadas", color: "#ea6d3a", bg: "#fff0e7" },
  calor:          { icon: "☀️", label: "Calor e Seca", short: "Calor e seca", color: "#d6a019", bg: "#fff8dd" },
  deslizamentos:  { icon: "⛰️", label: "Deslizamentos", short: "Deslizamentos", color: "#5468b4", bg: "#eef0ff" },
  completa:       { icon: "🌎", label: "Resiliência Geral", short: "Geral", color: "#4b9d68", bg: "#eaf8ee" }
};

const boardTopicSequence = ["chuvas", "queimadas", "calor", "deslizamentos", "completa"];

const avatars = [
  { id: "agua",     name: "Água",     icon: "💧", color: "#4aa9d8" },
  { id: "floresta", name: "Floresta", icon: "🍃", color: "#48a868" },
  { id: "sol",      name: "Sol",      icon: "☀️", color: "#e9ad32" },
  { id: "terra",    name: "Terra",    icon: "🌎", color: "#9a7659" },
  { id: "vento",    name: "Vento",    icon: "🌬️", color: "#7e9eb2" },
  { id: "chuva",    name: "Chuva",    icon: "🌦️", color: "#657fbe" }
];

const specialCells = {
  4:  { type: "advance", icon: "🌱", amount: 2, text: "A comunidade plantou árvores e melhorou a drenagem. Avance 2 casas!", points: 50 },
  7:  { type: "shield",  icon: "🛡️", text: "Você se preparou com antecedência e ganhou 1 Escudo de Resiliência!", points: 50 },
  10: { type: "back",    icon: "⚠️", amount: 2, text: "Uma área de risco bloqueou o caminho. Volte 2 casas." },
  13: { type: "info",    icon: "💡", text: "Áreas verdes ajudam a reduzir o calor e favorecem a infiltração da água da chuva." },
  16: { type: "challenge", icon: "❓", text: "Desafio bônus! Uma pergunta inédita vale 150 pontos." },
  19: { type: "advance", icon: "🌱", amount: 3, text: "A comunidade criou rotas seguras. Avance 3 casas!", points: 50 },
  22: { type: "back",    icon: "⚠️", amount: 3, text: "A rua à frente está alagada. Você precisou mudar a rota. Volte 3 casas." },
  25: { type: "shield",  icon: "🛡️", text: "O sistema de alerta funcionou! Você ganhou 1 Escudo de Resiliência.", points: 50 },
  28: { type: "info",    icon: "💡", text: "Mesmo uma correnteza aparentemente baixa pode ser perigosa. Evite atravessar áreas alagadas." },
  31: { type: "challenge", icon: "❓", text: "Último desafio bônus antes da Comunidade Resiliente!" }
};

const zoneMeta = {
  water:  { scenery: "🌊" },
  forest: { scenery: "🌳" },
  city:   { scenery: "🏙️" },
  hill:   { scenery: "⛰️" },
  safe:   { scenery: "🏡" }
};

const ecoDiceThemes = {
  1: { icon: "🍃", label: "Flora e preservação" },
  2: { icon: "💧", label: "Água e cuidado com os rios" },
  3: { icon: "☀️", label: "Sol e energia limpa" },
  4: { icon: "♻️", label: "Reciclagem e consumo consciente" },
  5: { icon: "🌳", label: "Árvores e reflorestamento" },
  6: { icon: "🌍", label: "Consciência planetária" }
};

// Estas rotações correspondem EXATAMENTE às seis faces definidas no CSS.
// Isso evita o bug em que apenas a face 1 aparecia corretamente.
const ecoDiceFaceRotations = {
  1: { x: 0,   y: 0 },
  2: { x: 0,   y: -90 },
  3: { x: 0,   y: -180 },
  4: { x: 0,   y: 90 },
  5: { x: -90, y: 0 },
  6: { x: 90,  y: 0 }
};

let ecoDiceTurnBaseX = 0;
let ecoDiceTurnBaseY = 0;

const $ = id => document.getElementById(id);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

let setupMode = "solo";
let setupPlayers = [{ name: "", avatarId: "agua" }];
let state = null;
let toastTimer = null;

function avatarById(id) {
  return avatars.find(a => a.id === id) || avatars[0];
}

function sanitizeName(value) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 24);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(el => el.classList.remove("active"));
  $(id).classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showToast(message, ms = 2100) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), ms);
}

function ensureSetupPlayers(count) {
  const defaults = avatars.map(a => a.id);

  if (setupPlayers.length < count) {
    while (setupPlayers.length < count) {
      const index = setupPlayers.length;
      setupPlayers.push({ name: "", avatarId: defaults[index % defaults.length] });
    }
  } else if (setupPlayers.length > count) {
    setupPlayers = setupPlayers.slice(0, count);
  }

  // Corrige eventuais avatares repetidos automaticamente.
  const used = new Set();
  setupPlayers.forEach((player, index) => {
    if (used.has(player.avatarId)) {
      const replacement = avatars.find(a => !used.has(a.id));
      player.avatarId = replacement ? replacement.id : defaults[index % defaults.length];
    }
    used.add(player.avatarId);
  });
}

function renderSetupPlayers() {
  const count = setupMode === "solo" ? 1 : Number($("friends-count").value || 2);
  ensureSetupPlayers(count);

  const usedIds = setupPlayers.map(p => p.avatarId);
  const container = $("players-setup");
  container.innerHTML = "";

  setupPlayers.forEach((player, index) => {
    const card = document.createElement("div");
    card.className = "setup-player";

    const avatarButtons = avatars.map(avatar => {
      const selected = player.avatarId === avatar.id;
      const usedByOther = usedIds.some((id, idx) => idx !== index && id === avatar.id);

      return `
        <button
          type="button"
          class="avatar-option ${selected ? "selected" : ""}"
          style="--avatar-color:${avatar.color}"
          data-player-index="${index}"
          data-avatar-id="${avatar.id}"
          ${usedByOther ? "disabled" : ""}
          title="${avatar.name}"
        >
          <span class="avatar-icon">${avatar.icon}</span>
          <small>${avatar.name}</small>
        </button>
      `;
    }).join("");

    card.innerHTML = `
      <div class="setup-player-head">
        <strong>${setupMode === "solo" ? "Seu jogador" : `Jogador ${index + 1}`}</strong>
        <span>${avatarById(player.avatarId).icon} ${avatarById(player.avatarId).name}</span>
      </div>
      <input
        class="player-name-input"
        data-name-index="${index}"
        maxlength="24"
        autocomplete="off"
        placeholder="${setupMode === "solo" ? "Digite seu nome ou apelido" : `Nome do jogador ${index + 1}`}"
        value="${escapeHtml(player.name)}"
      />
      <div class="avatar-grid">${avatarButtons}</div>
    `;

    container.appendChild(card);
  });
}

function setMode(mode) {
  setupMode = mode;
  document.querySelectorAll(".mode-card").forEach(btn => {
    btn.classList.toggle("selected", btn.dataset.mode === mode);
  });

  $("friends-count-wrap").classList.toggle("hidden", mode !== "friends");
  ensureSetupPlayers(mode === "solo" ? 1 : Number($("friends-count").value));
  renderSetupPlayers();
}

function getZone(cell) {
  if (cell <= 7) return "water";
  if (cell <= 14) return "forest";
  if (cell <= 21) return "city";
  if (cell <= 28) return "hill";
  return "safe";
}


function getCellTopic(cell) {
  if (cell === TOTAL_CELLS) return "completa";
  return boardTopicSequence[(cell - 1) % boardTopicSequence.length];
}

function getThemeForQuestion(question) {
  return questionThemes[question?.mission] || questionThemes.completa;
}

function setQuestionThemeVisual(question) {
  const meta = getThemeForQuestion(question);
  const tag = $("question-category");
  if (!tag) return;

  tag.style.background = meta.bg;
  tag.style.color = meta.color;
  tag.style.borderColor = `${meta.color}44`;

  const modalCard = document.querySelector(".modal-card");
  if (modalCard) modalCard.style.setProperty("--question-theme-color", meta.color);
}

function takeQuestionFromQueue(preferredMission = null) {
  const matchesPreferred = q => {
    if (!preferredMission) return true;
    if (preferredMission === "completa") return q.mission === "completa";
    return q.mission === preferredMission;
  };

  let queuePos = state.questionQueue.findIndex(index => {
    if (state.usedQuestionIndexes.has(index)) return false;
    return matchesPreferred(questions[index]);
  });

  if (queuePos === -1) {
    queuePos = state.questionQueue.findIndex(index => !state.usedQuestionIndexes.has(index));
  }

  if (queuePos === -1) return null;

  const [index] = state.questionQueue.splice(queuePos, 1);
  state.usedQuestionIndexes.add(index);
  state.usedQuestions = state.usedQuestionIndexes.size;

  return { index, question: questions[index] };
}

function buildBoard() {
  const board = $("board");
  board.innerHTML = "";

  const numbers = Array.from({ length: TOTAL_CELLS }, (_, i) => i + 1);
  const rows = [];

  for (let i = 0; i < numbers.length; i += 7) {
    const row = numbers.slice(i, i + 7);
    if ((i / 7) % 2 === 1) row.reverse();
    rows.push(row);
  }

  rows.flat().forEach(n => {
    const zone = getZone(n);
    const special = specialCells[n];
    const topic = getCellTopic(n);
    const theme = questionThemes[topic];

    const cell = document.createElement("div");
    cell.className = `cell ${special ? "special" : ""} ${n === TOTAL_CELLS ? "finish" : ""}`;
    cell.dataset.cell = n;
    cell.dataset.zone = zone;
    cell.dataset.topic = topic;

    cell.innerHTML = `
      <span class="cell-number">${n === 1 ? "Start" : n}</span>
      <span class="cell-icon">${n === TOTAL_CELLS ? "🏆" : (special?.icon || "")}</span>
      <span class="cell-scenery">${zoneMeta[zone].scenery}</span>
      <span class="cell-topic-mark" title="${theme.label}">${theme.icon}</span>
      <span class="cell-core"></span>
      <div class="tokens"></div>
    `;
    board.appendChild(cell);
  });
}

function createQuestionQueue(mission) {
  const indexed = questions.map((q, index) => ({ index, q }));

  if (mission === "completa") {
    return shuffle(indexed.map(item => item.index));
  }

  const preferred = indexed
    .filter(item => item.q.mission === mission || item.q.mission === "completa")
    .map(item => item.index);

  const fallback = indexed
    .filter(item => item.q.mission !== mission && item.q.mission !== "completa")
    .map(item => item.index);

  // Primeiro aparecem perguntas da missão escolhida e gerais; se a partida for muito longa,
  // outras temáticas entram sem repetir nenhuma pergunta.
  return [...shuffle(preferred), ...shuffle(fallback)];
}

function createPlayer(config, index) {
  return {
    id: `p${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
    name: sanitizeName(config.name),
    avatarId: config.avatarId,
    position: 1,
    score: 0,
    hits: 0,
    errors: 0,
    answered: 0,
    rounds: 0,
    shields: 0
  };
}

function startMatch(configPlayers, mode, mission) {
  state = {
    mode,
    mission,
    players: configPlayers.map(createPlayer),
    activeIndex: 0,
    pendingDice: 0,
    pendingQuestionTheme: mission === "completa" ? "completa" : mission,
    diceContinueResolver: null,
    questionQueue: createQuestionQueue(mission),
    usedQuestionIndexes: new Set(),
    usedQuestions: 0,
    currentQuestion: null,
    currentQuestionIndex: null,
    questionIsBonus: false,
    lastAnswerCorrect: false,
    gameOver: false,
    winnerId: null,
    startedAt: Date.now()
  };

  buildBoard();
  renderAll();
  $("mission-label").textContent = missions[mission];
  $("dice-result").textContent = "Pronto para jogar?";
  $("roll-btn").disabled = false;
  setTurnMessage("Sua vez!", "Jogue o dado e responda corretamente para avançar.");
  showScreen("screen-game");
}

function currentPlayer() {
  return state.players[state.activeIndex];
}

function renderPlayersHud() {
  const hud = $("players-hud");
  hud.style.setProperty("--player-count", state.players.length);
  hud.innerHTML = "";

  state.players.forEach((player, index) => {
    const avatar = avatarById(player.avatarId);
    const card = document.createElement("div");
    card.className = `hud-card ${index === state.activeIndex && !state.gameOver ? "active" : ""}`;
    card.style.setProperty("--avatar-color", avatar.color);

    card.innerHTML = `
      <div class="hud-avatar">${avatar.icon}</div>
      <div class="hud-main">
        <strong>${escapeHtml(player.name)}</strong>
        <small>Casa ${player.position} • ${player.shields} 🛡️ • ${player.hits} acerto${player.hits === 1 ? "" : "s"}</small>
      </div>
      <div class="hud-score">
        <b>${player.score.toLocaleString("pt-BR")}</b>
        <small>pontos</small>
      </div>
    `;
    hud.appendChild(card);
  });
}

function renderBoardTokens() {
  document.querySelectorAll(".tokens").forEach(el => el.innerHTML = "");

  state.players.forEach((player, index) => {
    const avatar = avatarById(player.avatarId);
    const token = document.createElement("span");
    token.className = `game-token ${index === state.activeIndex && !state.gameOver ? "active" : ""}`;
    token.style.setProperty("--avatar-color", avatar.color);
    token.textContent = avatar.icon;
    token.title = `${player.name} — casa ${player.position}`;
    token.setAttribute("aria-label", `${player.name}, casa ${player.position}`);

    const target = document.querySelector(`[data-cell="${player.position}"] .tokens`);
    if (target) target.appendChild(token);
  });
}

function renderBoardStatus() {
  const leader = Math.max(...state.players.map(p => p.position));
  const percentage = ((leader - 1) / (TOTAL_CELLS - 1)) * 100;
  $("leader-progress").style.width = `${percentage}%`;

  const left = state.questionQueue.length;
  $("questions-left").textContent = `${left} pergunta${left === 1 ? "" : "s"} inédita${left === 1 ? "" : "s"}`;
}

function updateTurnPanel() {
  if (!state || state.gameOver) return;
  const player = currentPlayer();
  const avatar = avatarById(player.avatarId);

  $("turn-avatar").textContent = avatar.icon;
  $("turn-avatar").style.background = `${avatar.color}22`;
  $("turn-player").textContent = player.name;
}

function renderAll() {
  renderPlayersHud();
  renderBoardTokens();
  renderBoardStatus();
  updateTurnPanel();
}

function setTurnMessage(title, message) {
  $("turn-title").textContent = title;
  $("turn-message").textContent = message;
}

function pulseCell(position) {
  const cell = document.querySelector(`[data-cell="${position}"]`);
  if (!cell) return;
  cell.classList.remove("current-target");
  void cell.offsetWidth;
  cell.classList.add("current-target");
}

async function movePlayerBy(player, delta) {
  const direction = delta >= 0 ? 1 : -1;
  const steps = Math.abs(delta);

  for (let i = 0; i < steps; i++) {
    const next = player.position + direction;
    if (next < 1 || next > TOTAL_CELLS) break;

    player.position = next;
    renderAll();
    pulseCell(player.position);
    await delay(215);
  }
}


function setDiceOverlay(open) {
  const overlay = $("dice-overlay");
  if (!overlay) return;

  overlay.classList.toggle("open", open);
  overlay.setAttribute("aria-hidden", open ? "false" : "true");

  if (!open) {
    overlay.classList.remove("result-ready");
    $("dice-continue-btn")?.classList.add("hidden");
    $("dice-close-icon")?.classList.add("hidden");
  }
}

function resolveDiceOverlay() {
  if (!state?.diceContinueResolver) return;
  const resolver = state.diceContinueResolver;
  state.diceContinueResolver = null;
  setDiceOverlay(false);
  resolver();
}

function waitForDiceOverlayClose() {
  return new Promise(resolve => {
    state.diceContinueResolver = resolve;
  });
}

async function animateDice(roll) {
  const cube = $("eco-dice-cube");
  const resultValue = $("eco-dice-result");
  const resultDesc = $("eco-dice-desc");
  const subtitle = $("eco-dice-subtitle");
  const continueBtn = $("dice-continue-btn");
  const closeIcon = $("dice-close-icon");
  const theme = ecoDiceThemes[roll];
  const face = ecoDiceFaceRotations[roll];

  if (!cube || !resultValue || !resultDesc || !subtitle || !continueBtn || !closeIcon) {
    $("dice-result").textContent = `Saiu ${roll}!`;
    await delay(250);
    return;
  }

  continueBtn.classList.add("hidden");
  closeIcon.classList.add("hidden");
  continueBtn.disabled = true;
  closeIcon.disabled = true;

  setDiceOverlay(true);
  resultValue.textContent = "Girando o dado...";
  resultDesc.textContent = "A natureza está definindo seu movimento.";
  subtitle.textContent = "Veja em qual face o dado vai parar.";
  $("dice-result").textContent = "O dado está rolando...";

  const extraX = (Math.floor(Math.random() * 3) + 3) * 360;
  const extraY = (Math.floor(Math.random() * 3) + 3) * 360;
  ecoDiceTurnBaseX += extraX;
  ecoDiceTurnBaseY += extraY;

  const targetX = ecoDiceTurnBaseX + face.x;
  const targetY = ecoDiceTurnBaseY + face.y;

  await delay(100);
  cube.style.transform = `rotateX(${targetX}deg) rotateY(${targetY}deg)`;

  await delay(1550);

  resultValue.innerHTML = `Movimento: <strong>${roll}</strong> <span class="eco-result-icon">${theme.icon}</span>`;
  resultDesc.textContent = theme.label;
  subtitle.textContent = "Agora você pode fechar esta janela para responder a pergunta.";
  $("dice-result").textContent = `Saiu ${roll} ${theme.icon}!`;

  $("dice-overlay").classList.add("result-ready");
  continueBtn.disabled = false;
  closeIcon.disabled = false;
  continueBtn.classList.remove("hidden");
  closeIcon.classList.remove("hidden");

  await waitForDiceOverlayClose();
}

async function rollDice() {
  if (!state || state.gameOver) return;

  const player = currentPlayer();
  $("roll-btn").disabled = true;
  player.rounds += 1;

  const roll = Math.floor(Math.random() * 6) + 1;
  state.pendingDice = roll;

  const targetCell = Math.min(TOTAL_CELLS, player.position + roll);
  state.pendingQuestionTheme = state.mission === "completa" ? getCellTopic(targetCell) : state.mission;

  const themeLabel = questionThemes[state.pendingQuestionTheme]?.short || "tema";
  setTurnMessage("🎲 Dado em movimento...", `O desafio desta rodada vai explorar o tema: ${themeLabel}.`);
  await animateDice(roll);

  setTurnMessage(`Você tirou ${roll}!`, "Agora responda corretamente para usar esse movimento.");
  openQuestion(false, state.pendingQuestionTheme);
}

function nextQuestion(preferredTheme = null) {
  return takeQuestionFromQueue(preferredTheme);
}

function openQuestion(isBonus, preferredTheme = null) {
  const next = nextQuestion(preferredTheme);

  // Garantia de não repetição: a fila nunca é recriada durante a partida.
  if (!next) {
    endGame("questions");
    return;
  }

  state.currentQuestionIndex = next.index;
  state.currentQuestion = next.question;
  state.questionIsBonus = isBonus;
  state.lastAnswerCorrect = false;

  const player = currentPlayer();
  const avatar = avatarById(player.avatarId);

  $("question-player-avatar").textContent = avatar.icon;
  $("question-player-avatar").style.background = `${avatar.color}22`;
  $("question-player-name").textContent = player.name;
  $("question-category").textContent = next.question.category;
  setQuestionThemeVisual(next.question);
  $("question-kind").textContent = isBonus ? "⭐ Desafio bônus" : "Pergunta da rodada";
  $("question-number").textContent = `#${state.usedQuestions}`;
  $("question-text").textContent = next.question.text;

  const answers = $("answers");
  answers.innerHTML = "";

  next.question.answers.forEach((answer, index) => {
    const btn = document.createElement("button");
    btn.className = "answer";
    btn.type = "button";
    btn.textContent = answer;
    btn.addEventListener("click", () => answerQuestion(index, btn));
    answers.appendChild(btn);
  });

  $("feedback").classList.add("hidden");
  $("continue-btn").classList.add("hidden");
  $("question-modal").classList.add("open");
  $("question-modal").setAttribute("aria-hidden", "false");

  renderBoardStatus();
}

function answerQuestion(index, clickedButton) {
  const player = currentPlayer();
  const q = state.currentQuestion;
  const buttons = [...document.querySelectorAll(".answer")];

  buttons.forEach(btn => btn.disabled = true);
  player.answered += 1;

  const correct = index === q.correct;
  state.lastAnswerCorrect = correct;

  if (correct) {
    clickedButton.classList.add("correct");
    player.hits += 1;
    const points = state.questionIsBonus ? 150 : 100;
    player.score += points;

    $("feedback").innerHTML = `✅ <strong>Resposta correta!</strong> ${escapeHtml(q.explanation)}<br><strong>+${points} pontos</strong>`;
  } else {
    clickedButton.classList.add("wrong");
    if (buttons[q.correct]) buttons[q.correct].classList.add("correct");
    player.errors += 1;
    $("feedback").innerHTML = `💡 <strong>Boa tentativa!</strong> ${escapeHtml(q.explanation)}`;
  }

  renderAll();
  $("feedback").classList.remove("hidden");
  $("continue-btn").classList.remove("hidden");
  $("continue-btn").textContent = state.questionIsBonus
    ? "Continuar a partida"
    : (correct ? `Avançar ${state.pendingDice} casa${state.pendingDice === 1 ? "" : "s"}` : "Passar a vez");
}

function closeQuestionModal() {
  $("question-modal").classList.remove("open");
  $("question-modal").setAttribute("aria-hidden", "true");
}

async function continueAfterQuestion() {
  const player = currentPlayer();
  const wasBonus = state.questionIsBonus;
  const correct = state.lastAnswerCorrect;

  $("continue-btn").disabled = true;
  closeQuestionModal();
  await delay(160);

  if (wasBonus) {
    $("continue-btn").disabled = false;
    advanceTurn();
    return;
  }

  if (!correct) {
    setTurnMessage("❌ Não avançou desta vez", `${player.name} permanece na casa ${player.position}.`);
    await delay(450);
    $("continue-btn").disabled = false;
    advanceTurn();
    return;
  }

  setTurnMessage("🧭 Avançando!", `${player.name} está percorrendo a trilha...`);
  await movePlayerBy(player, state.pendingDice);

  if (player.position >= TOTAL_CELLS) {
    awardWinner(player);
    $("continue-btn").disabled = false;
    return;
  }

  const specialResult = await applySpecialCell(player);
  $("continue-btn").disabled = false;

  if (state.gameOver || specialResult === "bonus") return;

  if (player.position >= TOTAL_CELLS) {
    awardWinner(player);
    return;
  }

  advanceTurn();
}

async function applySpecialCell(player) {
  const special = specialCells[player.position];
  if (!special) return "none";

  if (special.type === "advance") {
    player.score += special.points || 0;
    showToast(`🌱 ${special.text} +${special.points || 0} pontos`);
    setTurnMessage("🌱 Ação preventiva!", special.text);
    await delay(450);
    await movePlayerBy(player, special.amount);
    if (player.position >= TOTAL_CELLS) awardWinner(player);
    return "done";
  }

  if (special.type === "back") {
    if (player.shields > 0) {
      player.shields -= 1;
      renderAll();
      showToast("🛡️ Escudo usado! Sua preparação evitou o recuo.");
      setTurnMessage("🛡️ Preparação funcionou!", "O Escudo de Resiliência protegeu você desta vez.");
      await delay(700);
    } else {
      showToast(`⚠️ ${special.text}`);
      setTurnMessage("⚠️ Atenção ao risco!", special.text);
      await delay(500);
      await movePlayerBy(player, -special.amount);
    }
    return "done";
  }

  if (special.type === "shield") {
    player.shields += 1;
    player.score += special.points || 0;
    renderAll();
    showToast(`🛡️ ${special.text} +${special.points || 0} pontos`);
    setTurnMessage("🛡️ Mais proteção!", special.text);
    await delay(650);
    return "done";
  }

  if (special.type === "info") {
    showToast(`💡 ${special.text}`, 2800);
    setTurnMessage("💡 Você sabia?", special.text);
    await delay(750);
    return "done";
  }

  if (special.type === "challenge") {
    setTurnMessage("❓ Desafio bônus!", special.text);
    showToast("⭐ Pergunta bônus: vale 150 pontos!");
    await delay(400);
    openQuestion(true);
    return "bonus";
  }

  return "none";
}

function advanceTurn() {
  if (state.gameOver) return;

  state.activeIndex = (state.activeIndex + 1) % state.players.length;
  renderAll();

  const player = currentPlayer();
  const avatar = avatarById(player.avatarId);

  $("dice-result").textContent = `${avatar.icon} vez de ${player.name}`;
  setTurnMessage(`Vez de ${player.name}!`, "Jogue o dado e tente avançar pela Trilha da Resiliência.");
  $("roll-btn").disabled = false;
}

function awardWinner(player) {
  if (state.gameOver || state.winnerId) return;
  player.position = TOTAL_CELLS;
  player.score += 500;
  state.winnerId = player.id;
  renderAll();
  showToast(`🏆 ${player.name} chegou à Comunidade Resiliente! +500 pontos`, 2500);
  setTimeout(() => endGame("winner"), 850);
}

function getRate(player) {
  return player.answered ? Math.round((player.hits / player.answered) * 100) : 0;
}

function getAchievement(rate) {
  if (rate >= 90) return ["🌎", "Mestre da Prevenção"];
  if (rate >= 75) return ["🛡️", "Guardião da Resiliência"];
  if (rate >= 55) return ["🌿", "Defensor da Comunidade"];
  return ["🌱", "Aprendiz da Resiliência"];
}

function getStandings() {
  return [...state.players].sort((a, b) =>
    b.position - a.position ||
    b.score - a.score ||
    getRate(b) - getRate(a) ||
    a.rounds - b.rounds
  );
}

function makeRankingEntry(player) {
  return {
    id: `${Date.now()}-${player.id}-${Math.random().toString(16).slice(2)}`,
    date: new Date().toISOString(),
    name: player.name,
    avatarId: player.avatarId,
    mode: state.mode,
    mission: state.mission,
    missionLabel: missions[state.mission],
    score: player.score,
    hits: player.hits,
    errors: player.errors,
    answered: player.answered,
    rate: getRate(player),
    rounds: player.rounds,
    position: player.position,
    timeSeconds: Math.max(1, Math.round((Date.now() - state.startedAt) / 1000)),
    matchWinner: player.id === state.winnerId
  };
}

function saveLocalRanking(entries) {
  const key = "missao_resiliencia_ranking_v2";
  const current = JSON.parse(localStorage.getItem(key) || "[]");
  const merged = [...current, ...entries];

  merged.sort((a, b) =>
    b.score - a.score ||
    b.rate - a.rate ||
    a.timeSeconds - b.timeSeconds
  );

  const top = merged.slice(0, 150);
  localStorage.setItem(key, JSON.stringify(top));
  return top;
}

function renderLocalRanking(entries) {
  const list = $("ranking-list");
  list.innerHTML = "";

  entries.slice(0, 10).forEach((entry, index) => {
    const avatar = avatarById(entry.avatarId);
    const li = document.createElement("li");
    li.style.setProperty("--avatar-color", avatar.color);
    const place = index < 3 ? ["🥇","🥈","🥉"][index] : `${index + 1}º`;

    li.innerHTML = `
      <div class="ranking-avatar">${avatar.icon}</div>
      <div>
        <strong>${place} ${escapeHtml(entry.name)}</strong><br>
        <small>${escapeHtml(entry.missionLabel || missions[entry.mission] || "Missão")}</small>
      </div>
      <strong>${Number(entry.score).toLocaleString("pt-BR")} pts</strong>
    `;
    list.appendChild(li);
  });
}

function renderMatchResults(standings) {
  const winner = standings[0];
  const avatar = avatarById(winner.avatarId);
  const rate = getRate(winner);
  const [achievementIcon, achievementTitle] = getAchievement(rate);

  $("winner-highlight").innerHTML = `
    <div class="winner-card" style="--avatar-color:${avatar.color}">
      <div class="winner-avatar">${avatar.icon}</div>
      <div>
        <small>${state.mode === "friends" ? "Vencedor da partida" : "Sua conquista"}</small>
        <strong>${escapeHtml(winner.name)}</strong>
        <span>${achievementIcon} ${achievementTitle} • ${rate}% de aproveitamento</span>
      </div>
      <div class="winner-score">${winner.score.toLocaleString("pt-BR")} pts</div>
    </div>
  `;

  const box = $("match-ranking");
  box.innerHTML = "";

  standings.forEach((player, index) => {
    const av = avatarById(player.avatarId);
    const row = document.createElement("div");
    row.className = "match-row";
    row.style.setProperty("--avatar-color", av.color);

    const place = index < 3 ? ["🥇","🥈","🥉"][index] : `${index + 1}º`;
    row.innerHTML = `
      <div class="match-place">${place}</div>
      <div class="match-avatar">${av.icon}</div>
      <div class="match-main">
        <strong>${escapeHtml(player.name)}</strong>
        <small>Casa ${player.position} • ${player.hits}/${player.answered} acertos • ${getRate(player)}%</small>
      </div>
      <div class="match-points">${player.score.toLocaleString("pt-BR")} pts</div>
    `;
    box.appendChild(row);
  });
}

function launchConfetti() {
  const container = $("confetti");
  container.innerHTML = "";
  const colors = ["#2d9a65","#f0b83f","#4aa9d8","#e27b65","#7e80bd","#79b66a"];

  for (let i = 0; i < 54; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.setProperty("--x", `${Math.random() * 100}%`);
    piece.style.setProperty("--c", colors[Math.floor(Math.random() * colors.length)]);
    piece.style.setProperty("--d", `${2.6 + Math.random() * 2.3}s`);
    piece.style.setProperty("--delay", `${Math.random() * .8}s`);
    piece.style.setProperty("--r", `${Math.random() * 360}deg`);
    container.appendChild(piece);
  }
}

async function sendToGoogleSheets(entries) {
  if (!API_URL) return;

  try {
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "saveMatch", entries })
    });
  } catch (error) {
    console.warn("Não foi possível enviar o ranking ao Google Sheets:", error);
  }
}

function endGame(reason = "winner") {
  if (!state || state.gameOver) return;
  state.gameOver = true;
  $("roll-btn").disabled = true;
  closeQuestionModal();
  setDiceOverlay(false);

  const standings = getStandings();
  if (!state.winnerId) state.winnerId = standings[0].id;

  const winner = standings[0];

  if (reason === "questions") {
    $("finish-title").textContent = "Banco de perguntas concluído!";
    $("finish-subtitle").textContent = "Nenhuma pergunta foi repetida. O resultado foi definido pelo avanço e pela pontuação.";
  } else if (state.mode === "friends") {
    $("finish-title").textContent = `Vitória de ${winner.name}!`;
    $("finish-subtitle").textContent = "A competição terminou e todos ajudaram a construir uma comunidade mais resiliente.";
  } else {
    $("finish-title").textContent = `Parabéns, ${winner.name}!`;
    $("finish-subtitle").textContent = "Você chegou à Comunidade Resiliente e concluiu a missão.";
  }

  renderMatchResults(standings);

  const entries = state.players.map(makeRankingEntry);
  const ranking = saveLocalRanking(entries);
  renderLocalRanking(ranking);
  launchConfetti();

  showScreen("screen-finish");
  sendToGoogleSheets(entries);
}

function restartCurrentMatch() {
  const configs = state.players.map(p => ({ name: p.name, avatarId: p.avatarId }));
  startMatch(configs, state.mode, state.mission);
}

/* Eventos da tela inicial */
document.querySelectorAll(".mode-card").forEach(btn => {
  btn.addEventListener("click", () => setMode(btn.dataset.mode));
});

$("friends-count").addEventListener("change", () => {
  ensureSetupPlayers(Number($("friends-count").value));
  renderSetupPlayers();
});

$("players-setup").addEventListener("input", event => {
  const input = event.target.closest("[data-name-index]");
  if (!input) return;
  const index = Number(input.dataset.nameIndex);
  setupPlayers[index].name = input.value;
});

$("players-setup").addEventListener("click", event => {
  const btn = event.target.closest(".avatar-option");
  if (!btn || btn.disabled) return;

  const index = Number(btn.dataset.playerIndex);
  const avatarId = btn.dataset.avatarId;
  setupPlayers[index].avatarId = avatarId;
  renderSetupPlayers();
});

$("start-form").addEventListener("submit", event => {
  event.preventDefault();

  const count = setupMode === "solo" ? 1 : Number($("friends-count").value);
  ensureSetupPlayers(count);

  const configs = setupPlayers.map(p => ({
    name: sanitizeName(p.name),
    avatarId: p.avatarId
  }));

  const invalid = configs.find(p => p.name.length < 2);
  if (invalid) {
    alert("Digite um nome ou apelido com pelo menos 2 caracteres para cada jogador.");
    return;
  }

  const avatarsUsed = configs.map(p => p.avatarId);
  if (new Set(avatarsUsed).size !== avatarsUsed.length) {
    alert("Cada jogador deve escolher um avatar diferente.");
    return;
  }

  startMatch(configs, setupMode, $("mission-select").value);
});

/* Eventos do jogo */
$("roll-btn").addEventListener("click", rollDice);
$("continue-btn").addEventListener("click", continueAfterQuestion);
$("dice-continue-btn").addEventListener("click", resolveDiceOverlay);
$("dice-close-icon").addEventListener("click", resolveDiceOverlay);

$("restart-btn").addEventListener("click", () => {
  if (confirm("Deseja recomeçar esta partida desde a primeira casa?")) restartCurrentMatch();
});

$("play-again-btn").addEventListener("click", restartCurrentMatch);

$("back-home-btn").addEventListener("click", () => {
  setupMode = state?.mode || setupMode;
  setupPlayers = state
    ? state.players.map(p => ({ name: p.name, avatarId: p.avatarId }))
    : setupPlayers;

  $("friends-count").value = String(Math.min(4, Math.max(2, setupPlayers.length)));
  setMode(setupMode);
  showScreen("screen-start");
});

/* Inicialização */
setMode("solo");
