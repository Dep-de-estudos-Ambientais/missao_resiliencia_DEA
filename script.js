const TOTAL_CELLS = 35;
const API_URL = ""; // Na próxima etapa entra aqui a URL /exec do Google Apps Script.

const missions = {
  completa: "🌎 Missão Completa",
  chuvas: "🌧️ Chuvas e Alagamentos",
  queimadas: "🔥 Queimadas",
  calor: "☀️ Calor e Seca",
  deslizamentos: "⛰️ Deslizamentos"
};

const specialCells = {
  4:  { type: "advance", icon: "🌱", amount: 2, text: "A comunidade plantou árvores e melhorou a drenagem. Avance 2 casas!" },
  7:  { type: "shield", icon: "🛡️", text: "Você se preparou com antecedência. Ganhou 1 Escudo de Resiliência!" },
  10: { type: "back", icon: "⚠️", amount: 2, text: "Uma área de risco bloqueou o caminho. Volte 2 casas." },
  13: { type: "info", icon: "💡", text: "Curiosidade: áreas verdes ajudam a reduzir o calor nas cidades e melhoram a infiltração da água da chuva." },
  16: { type: "challenge", icon: "❓", text: "Desafio extra! Responda uma pergunta bônus e ganhe 150 pontos." },
  19: { type: "advance", icon: "🌱", amount: 3, text: "Boa prevenção! A comunidade criou rotas seguras. Avance 3 casas." },
  22: { type: "back", icon: "⚠️", amount: 3, text: "Você encontrou uma rua alagada e precisou mudar de rota. Volte 3 casas." },
  25: { type: "shield", icon: "🛡️", text: "Sistema de alerta funcionando! Você ganhou 1 Escudo de Resiliência." },
  28: { type: "info", icon: "💡", text: "Curiosidade: nunca é seguro atravessar uma correnteza sem saber a profundidade e a força da água." },
  31: { type: "challenge", icon: "❓", text: "Último desafio bônus antes da chegada!" }
};

const questions = [
  {
    category: "🌧️ Chuvas e Alagamentos",
    mission: "chuvas",
    text: "Durante uma chuva forte, uma rua começa a alagar. Qual é a atitude mais segura?",
    answers: [
      "Atravessar rapidamente antes que a água suba mais",
      "Procurar uma rota segura e evitar a área alagada",
      "Brincar na água enquanto a chuva diminui",
      "Ficar perto de postes para se orientar"
    ],
    correct: 1,
    explanation: "Correto! Águas de alagamentos podem esconder buracos, correntezas, objetos e riscos elétricos."
  },
  {
    category: "🔥 Queimadas",
    mission: "queimadas",
    text: "Qual atitude ajuda a diminuir o risco de incêndios em áreas com vegetação seca?",
    answers: [
      "Queimar folhas e lixo no quintal",
      "Descartar cigarros no chão",
      "Evitar o uso do fogo e comunicar focos de incêndio",
      "Acender fogueiras perto de capim seco"
    ],
    correct: 2,
    explanation: "Isso mesmo! Evitar o uso do fogo e informar rapidamente um foco ajuda a reduzir a propagação."
  },
  {
    category: "☀️ Calor e Seca",
    mission: "calor",
    text: "Em um dia de calor intenso, qual atitude é mais adequada?",
    answers: [
      "Ficar muito tempo no sol sem proteção",
      "Beber água e procurar sombra em horários mais quentes",
      "Evitar água para não suar",
      "Praticar exercício ao meio-dia no sol forte"
    ],
    correct: 1,
    explanation: "Certo! Hidratação, sombra e proteção são medidas simples e importantes em dias muito quentes."
  },
  {
    category: "⛰️ Deslizamentos",
    mission: "deslizamentos",
    text: "Depois de vários dias de chuva, surgem rachaduras no solo de uma encosta. O que fazer?",
    answers: [
      "Ignorar, porque rachaduras são sempre normais",
      "Permanecer no local observando a encosta",
      "Avisar um adulto ou autoridade responsável e procurar um local seguro",
      "Jogar água nas rachaduras"
    ],
    correct: 2,
    explanation: "Muito bem! Rachaduras podem ser sinais de instabilidade. O mais seguro é comunicar e se afastar da área de risco."
  },
  {
    category: "🌳 Prevenção",
    mission: "completa",
    text: "Por que preservar vegetação próxima aos rios pode ajudar uma comunidade?",
    answers: [
      "Porque aumenta o lixo levado pela água",
      "Porque pode proteger as margens e reduzir erosão",
      "Porque impede toda e qualquer chuva",
      "Porque faz o rio desaparecer"
    ],
    correct: 1,
    explanation: "Exatamente! A vegetação nas margens ajuda a proteger o solo e pode reduzir processos erosivos."
  },
  {
    category: "⚡ Tempestades",
    mission: "completa",
    text: "Durante uma tempestade com muitos raios, qual local deve ser evitado?",
    answers: [
      "Um prédio fechado",
      "Um local protegido indicado por adultos",
      "Debaixo de uma árvore isolada",
      "Um ambiente interno seguro"
    ],
    correct: 2,
    explanation: "Correto! Árvores isoladas são locais perigosos durante tempestades com raios."
  },
  {
    category: "🏙️ Cidade Resiliente",
    mission: "completa",
    text: "Qual medida ajuda uma cidade a enfrentar melhor chuvas intensas?",
    answers: [
      "Tampar bueiros com lixo",
      "Aumentar áreas verdes e manter a drenagem limpa",
      "Construir sempre sobre cursos d'água",
      "Retirar toda a vegetação das margens"
    ],
    correct: 1,
    explanation: "Muito bem! Áreas verdes e drenagem bem cuidada ajudam a reduzir problemas causados pelas chuvas."
  },
  {
    category: "🔥 Queimadas",
    mission: "queimadas",
    text: "Ao perceber fumaça e fogo se espalhando em uma área de vegetação, a criança deve:",
    answers: [
      "Tentar apagar sozinha",
      "Se aproximar para observar",
      "Avisar um adulto responsável e manter distância",
      "Correr na direção do fogo"
    ],
    correct: 2,
    explanation: "Certo! Crianças e jovens não devem enfrentar incêndios. O correto é se afastar e avisar um adulto responsável."
  },
  {
    category: "💧 Uso da Água",
    mission: "calor",
    text: "Durante um período de seca, qual comportamento ajuda a economizar água?",
    answers: [
      "Deixar a torneira aberta sem necessidade",
      "Usar somente a água necessária e evitar desperdícios",
      "Lavar calçadas todos os dias",
      "Ignorar vazamentos"
    ],
    correct: 1,
    explanation: "Isso mesmo! Reduzir desperdícios é importante para o uso responsável da água."
  },
  {
    category: "🌎 Mudanças Climáticas",
    mission: "completa",
    text: "Qual atitude cotidiana contribui para uma relação mais sustentável com o ambiente?",
    answers: [
      "Desperdiçar água e energia",
      "Descartar resíduos em rios",
      "Reduzir desperdícios e cuidar das áreas verdes",
      "Queimar lixo"
    ],
    correct: 2,
    explanation: "Muito bem! Pequenas ações coletivas e individuais ajudam a construir comunidades mais sustentáveis."
  },
  {
    category: "🌧️ Chuvas e Alagamentos",
    mission: "chuvas",
    text: "Por que não devemos jogar lixo em ruas, canais e bueiros?",
    answers: [
      "Porque o lixo pode dificultar o escoamento da água",
      "Porque o lixo faz a chuva parar",
      "Porque o lixo aumenta a sombra",
      "Porque os bueiros não têm relação com a chuva"
    ],
    correct: 0,
    explanation: "Correto! O descarte inadequado pode obstruir a drenagem e agravar alagamentos."
  },
  {
    category: "⛰️ Deslizamentos",
    mission: "deslizamentos",
    text: "Qual situação merece atenção em uma encosta durante períodos chuvosos?",
    answers: [
      "Solo firme e sem alterações",
      "Rachaduras novas no terreno ou muros",
      "Árvores saudáveis em área plana",
      "Tempo ensolarado após vários dias secos"
    ],
    correct: 1,
    explanation: "Certo! Rachaduras novas podem indicar movimentação do terreno e devem ser comunicadas a responsáveis."
  }
];

let state = {};

const $ = (id) => document.getElementById(id);

const startForm = $("start-form");
const playerNameInput = $("player-name");
const missionSelect = $("mission-select");
const boardEl = $("board");
const rollBtn = $("roll-btn");
const restartBtn = $("restart-btn");
const diceEl = $("dice");
const modal = $("question-modal");
const answersEl = $("answers");
const feedbackEl = $("feedback");
const continueBtn = $("continue-btn");

function freshState(name = "", mission = "completa") {
  return {
    name,
    mission,
    position: 1,
    score: 0,
    hits: 0,
    errors: 0,
    rounds: 0,
    shields: 0,
    pendingDice: 0,
    answered: 0,
    usedQuestionIndexes: [],
    currentQuestion: null,
    pendingSpecial: null,
    startedAt: Date.now()
  };
}

function sanitizeName(value) {
  return value
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 24);
}

function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach(el => el.classList.remove("active"));
  $(screenId).classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function buildBoard() {
  boardEl.innerHTML = "";

  const cellNumbers = Array.from({ length: TOTAL_CELLS }, (_, i) => i + 1);

  // Organiza visualmente em "cobra", como tabuleiro tradicional.
  const rows = [];
  for (let i = 0; i < cellNumbers.length; i += 7) {
    const row = cellNumbers.slice(i, i + 7);
    if ((i / 7) % 2 === 1) row.reverse();
    rows.push(row);
  }

  rows.flat().forEach(n => {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.cell = n;

    if (specialCells[n]) cell.classList.add("special");
    if (n === TOTAL_CELLS) cell.classList.add("finish");

    const icon = n === TOTAL_CELLS
      ? "🏡"
      : specialCells[n]?.icon || "";

    cell.innerHTML = `
      <span class="cell-number">${n}</span>
      <span class="cell-icon">${icon}</span>
    `;

    boardEl.appendChild(cell);
  });

  renderPlayer();
}

function renderPlayer() {
  document.querySelectorAll(".cell").forEach(cell => {
    cell.classList.remove("player");
    cell.querySelector(".player-token")?.remove();
  });

  const cell = document.querySelector(`[data-cell="${state.position}"]`);
  if (cell) {
    cell.classList.add("player");
    const token = document.createElement("span");
    token.className = "player-token";
    token.textContent = "🧭";
    cell.appendChild(token);
  }

  $("position-label").textContent = `Casa ${state.position} de ${TOTAL_CELLS}`;
  $("progress-bar").style.width = `${((state.position - 1) / (TOTAL_CELLS - 1)) * 100}%`;
}

function updateHud() {
  $("hud-player").textContent = state.name;
  $("hud-score").textContent = state.score.toLocaleString("pt-BR");
  $("hud-hits").textContent = state.hits;
  $("hud-shields").textContent = `${state.shields} 🛡️`;
  $("mission-label").textContent = missions[state.mission];
}

function setTurnMessage(title, message) {
  $("turn-title").textContent = title;
  $("turn-message").textContent = message;
}

function getEligibleQuestions() {
  let eligible = questions
    .map((q, index) => ({ ...q, index }))
    .filter(q => state.mission === "completa" || q.mission === state.mission || q.mission === "completa");

  const unused = eligible.filter(q => !state.usedQuestionIndexes.includes(q.index));
  if (unused.length) return unused;

  state.usedQuestionIndexes = [];
  return eligible;
}

function pickQuestion() {
  const eligible = getEligibleQuestions();
  const q = eligible[Math.floor(Math.random() * eligible.length)];
  state.usedQuestionIndexes.push(q.index);
  return q;
}

function openQuestion({ bonus = false } = {}) {
  state.currentQuestion = pickQuestion();
  state.currentQuestion.bonus = bonus;

  $("question-category").textContent = state.currentQuestion.category;
  $("question-text").textContent = state.currentQuestion.text;
  answersEl.innerHTML = "";
  feedbackEl.classList.add("hidden");
  continueBtn.classList.add("hidden");

  state.currentQuestion.answers.forEach((answer, index) => {
    const btn = document.createElement("button");
    btn.className = "answer";
    btn.textContent = answer;
    btn.addEventListener("click", () => answerQuestion(index, btn));
    answersEl.appendChild(btn);
  });

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

function answerQuestion(index, clickedBtn) {
  const q = state.currentQuestion;
  const buttons = [...answersEl.querySelectorAll(".answer")];
  buttons.forEach(b => b.disabled = true);

  state.answered += 1;

  const correct = index === q.correct;
  if (correct) {
    clickedBtn.classList.add("correct");
    state.hits += 1;
    const points = q.bonus ? 150 : 100;
    state.score += points;
    feedbackEl.innerHTML = `✅ <strong>Resposta correta!</strong> ${q.explanation} <br><strong>+${points} pontos</strong>`;

    if (!q.bonus) {
      state.position = Math.min(TOTAL_CELLS, state.position + state.pendingDice);
      setTurnMessage("Boa resposta!", `Você avançou ${state.pendingDice} casa(s).`);
    }
  } else {
    clickedBtn.classList.add("wrong");
    buttons[q.correct]?.classList.add("correct");
    state.errors += 1;
    feedbackEl.innerHTML = `💡 <strong>Quase!</strong> ${q.explanation}`;

    if (!q.bonus) {
      setTurnMessage("Continue tentando!", "Você permanece na mesma casa nesta rodada.");
    }
  }

  updateHud();
  renderPlayer();
  feedbackEl.classList.remove("hidden");
  continueBtn.classList.remove("hidden");

  if (!q.bonus && state.position >= TOTAL_CELLS) {
    continueBtn.textContent = "Ver resultado";
  } else {
    continueBtn.textContent = "Continuar";
  }
}

function applySpecialCell() {
  const special = specialCells[state.position];

  if (!special) {
    rollBtn.disabled = false;
    return;
  }

  if (special.type === "advance") {
    state.position = Math.min(TOTAL_CELLS, state.position + special.amount);
    state.score += 50;
    setTurnMessage("🌱 Ação preventiva!", `${special.text} +50 pontos.`);
    renderPlayer();
    updateHud();
    if (state.position >= TOTAL_CELLS) return finishGame();
    rollBtn.disabled = false;
    return;
  }

  if (special.type === "back") {
    if (state.shields > 0) {
      state.shields -= 1;
      setTurnMessage("🛡️ Escudo usado!", "Sua preparação evitou o recuo. Você permanece nesta casa.");
    } else {
      state.position = Math.max(1, state.position - special.amount);
      setTurnMessage("⚠️ Atenção ao risco!", special.text);
      renderPlayer();
    }
    updateHud();
    rollBtn.disabled = false;
    return;
  }

  if (special.type === "shield") {
    state.shields += 1;
    state.score += 50;
    updateHud();
    setTurnMessage("🛡️ Preparação é proteção!", `${special.text} +50 pontos.`);
    rollBtn.disabled = false;
    return;
  }

  if (special.type === "info") {
    setTurnMessage("💡 Você sabia?", special.text);
    rollBtn.disabled = false;
    return;
  }

  if (special.type === "challenge") {
    setTurnMessage("❓ Desafio bônus!", special.text);
    setTimeout(() => openQuestion({ bonus: true }), 350);
  }
}

function rollDice() {
  rollBtn.disabled = true;
  state.rounds += 1;

  diceEl.classList.remove("rolling");
  void diceEl.offsetWidth;
  diceEl.classList.add("rolling");

  let flickers = 0;
  const anim = setInterval(() => {
    diceEl.textContent = ["⚀","⚁","⚂","⚃","⚄","⚅"][Math.floor(Math.random() * 6)];
    flickers++;
    if (flickers >= 7) {
      clearInterval(anim);
      const roll = Math.floor(Math.random() * 6) + 1;
      state.pendingDice = roll;
      diceEl.textContent = ["⚀","⚁","⚂","⚃","⚄","⚅"][roll - 1];
      setTurnMessage(`Você tirou ${roll}!`, "Agora responda à pergunta para poder avançar.");
      setTimeout(() => openQuestion(), 250);
    }
  }, 70);
}

function closeQuestionAndContinue() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  continueBtn.classList.add("hidden");

  const wasBonus = state.currentQuestion?.bonus;
  state.currentQuestion = null;

  if (state.position >= TOTAL_CELLS) {
    finishGame();
    return;
  }

  if (wasBonus) {
    rollBtn.disabled = false;
    setTurnMessage("Desafio concluído!", "Continue a missão jogando o dado.");
    return;
  }

  setTimeout(applySpecialCell, 220);
}

function getAchievement(rate) {
  if (rate >= 90) return ["🌎", "Mestre da Prevenção"];
  if (rate >= 75) return ["🛡️", "Guardião da Resiliência"];
  if (rate >= 55) return ["🌿", "Defensor da Comunidade"];
  return ["🌱", "Aprendiz da Resiliência"];
}

function saveLocalRanking(entry) {
  const key = "missao_resiliencia_ranking";
  const current = JSON.parse(localStorage.getItem(key) || "[]");
  current.push(entry);
  current.sort((a, b) => b.score - a.score || b.rate - a.rate || a.timeSeconds - b.timeSeconds);
  localStorage.setItem(key, JSON.stringify(current.slice(0, 100)));
  return current;
}

function renderRanking(allEntries, currentId) {
  const sorted = [...allEntries].sort((a, b) =>
    b.score - a.score || b.rate - a.rate || a.timeSeconds - b.timeSeconds
  );

  const position = sorted.findIndex(item => item.id === currentId) + 1;
  $("rank-position").textContent = position ? `${position}º lugar` : "—";

  $("ranking-list").innerHTML = "";
  sorted.slice(0, 10).forEach((item, index) => {
    const li = document.createElement("li");
    if (item.id === currentId) li.classList.add("me");

    const medal = ["🥇", "🥈", "🥉"][index] || `${index + 1}º`;
    li.innerHTML = `
      <span>${medal} ${escapeHtml(item.name)}</span>
      <strong>${item.score.toLocaleString("pt-BR")} pts</strong>
    `;
    $("ranking-list").appendChild(li);
  });
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[c]));
}

async function sendToGoogleSheets(entry) {
  if (!API_URL) return null;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(entry)
    });
    return await response.json();
  } catch (error) {
    console.warn("Não foi possível enviar ao Google Sheets:", error);
    return null;
  }
}

async function finishGame() {
  rollBtn.disabled = true;
  state.position = TOTAL_CELLS;
  renderPlayer();

  // Bônus de conclusão.
  state.score += 500;

  const rate = state.answered ? Math.round((state.hits / state.answered) * 100) : 0;
  const timeSeconds = Math.max(1, Math.round((Date.now() - state.startedAt) / 1000));
  const [achievementIcon, achievementTitle] = getAchievement(rate);

  const entry = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    date: new Date().toISOString(),
    name: state.name,
    mission: state.mission,
    missionLabel: missions[state.mission],
    score: state.score,
    hits: state.hits,
    errors: state.errors,
    answered: state.answered,
    rate,
    rounds: state.rounds,
    timeSeconds
  };

  const ranking = saveLocalRanking(entry);

  $("finish-title").textContent = `Parabéns, ${state.name}!`;
  $("finish-subtitle").textContent = "Você concluiu a Missão Resiliência e ajudou sua comunidade a chegar mais preparada ao final da jornada.";
  $("result-score").textContent = state.score.toLocaleString("pt-BR");
  $("result-hits").textContent = `${state.hits}/${state.answered}`;
  $("result-rate").textContent = `${rate}%`;
  $("result-rounds").textContent = state.rounds;
  $("achievement-icon").textContent = achievementIcon;
  $("achievement-title").textContent = achievementTitle;

  renderRanking(ranking, entry.id);
  showScreen("screen-finish");

  // Já deixamos a função pronta para a integração da próxima etapa.
  sendToGoogleSheets(entry);
}

function startGame(name, mission) {
  state = freshState(name, mission);
  buildBoard();
  updateHud();
  diceEl.textContent = "🎲";
  rollBtn.disabled = false;
  setTurnMessage("Sua vez!", "Clique no botão para jogar o dado.");
  showScreen("screen-game");
}

function resetToHome() {
  state = freshState();
  playerNameInput.value = "";
  missionSelect.value = "completa";
  showScreen("screen-start");
}

startForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = sanitizeName(playerNameInput.value);

  if (name.length < 2) {
    alert("Digite um nome ou apelido com pelo menos 2 caracteres.");
    return;
  }

  startGame(name, missionSelect.value);
});

rollBtn.addEventListener("click", rollDice);
continueBtn.addEventListener("click", closeQuestionAndContinue);

restartBtn.addEventListener("click", () => {
  if (confirm("Deseja recomeçar a missão atual?")) {
    startGame(state.name, state.mission);
  }
});

$("play-again-btn").addEventListener("click", () => {
  startGame(state.name, state.mission);
});

$("back-home-btn").addEventListener("click", resetToHome);

buildBoard();
