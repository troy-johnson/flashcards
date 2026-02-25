const heartWords = [
  { word: "a", quarter: 1 },
  { word: "the", quarter: 1 },
  { word: "as", quarter: 1 },
  { word: "to", quarter: 1 },
  { word: "do", quarter: 1 },
  { word: "I", quarter: 1 },
  { word: "is", quarter: 1 },
  { word: "was", quarter: 1 },
  { word: "you", quarter: 1 },
  { word: "at", quarter: 1 },
  { word: "and", quarter: 1 },
  { word: "it", quarter: 1 },
  { word: "in", quarter: 1 },
  { word: "of", quarter: 2 },
  { word: "for", quarter: 2 },
  { word: "from", quarter: 2 },
  { word: "your", quarter: 2 },
  { word: "said", quarter: 2 },
  { word: "all", quarter: 2 },
  { word: "put", quarter: 2 },
  { word: "are", quarter: 2 },
  { word: "does", quarter: 2 },
  { word: "see", quarter: 2 },
  { word: "can", quarter: 2 },
  { word: "had", quarter: 2 },
  { word: "have", quarter: 3 },
  { word: "love", quarter: 3 },
  { word: "by", quarter: 3 },
  { word: "my", quarter: 3 },
  { word: "who", quarter: 3 },
  { word: "two", quarter: 3 },
  { word: "they", quarter: 3 },
  { word: "what", quarter: 3 },
  { word: "we", quarter: 3 },
  { word: "she", quarter: 3 },
  { word: "this", quarter: 3 },
  { word: "that", quarter: 3 },
  { word: "like", quarter: 3 },
  { word: "want", quarter: 4 },
  { word: "give", quarter: 4 },
  { word: "live", quarter: 4 },
  { word: "one", quarter: 4 },
  { word: "some", quarter: 4 },
  { word: "come", quarter: 4 },
  { word: "there", quarter: 4 },
  { word: "where", quarter: 4 },
  { word: "were", quarter: 4 },
  { word: "his", quarter: 4 },
  { word: "he", quarter: 4 },
  { word: "be", quarter: 4 },
];

const wordDisplay = document.getElementById("wordDisplay");
const wordMeta = document.getElementById("wordMeta");
const passButton = document.getElementById("passButton");
const practiceButton = document.getElementById("practiceButton");
const nextButton = document.getElementById("nextButton");
const practiceCard = document.getElementById("practiceCard");
const passedCount = document.getElementById("passedCount");
const practiceCount = document.getElementById("practiceCount");
const passedList = document.getElementById("passedList");
const practiceList = document.getElementById("practiceList");
const toggleListButton = document.getElementById("toggleListButton");
const mixModeToggle = document.getElementById("mixMode");
const timerDisplay = document.getElementById("timerDisplay");
const timerDisplayPanel = document.getElementById("timerDisplayPanel");
const practiceTimer = document.getElementById("practiceTimer");
const timerToggle = document.getElementById("timerToggle");
const timerPauseButton = document.getElementById("timerPauseButton");
const timerResetButton = document.getElementById("timerResetButton");
const clearPassedButton = document.getElementById("clearPassedButton");
const clearPracticeButton = document.getElementById("clearPracticeButton");
const quarterListsSection = document.getElementById("quarterLists");
const settingsToggle = document.getElementById("settingsToggle");
const controlsSection = document.querySelector(".controls");
const quarterListElements = {
  1: document.getElementById("quarter1List"),
  2: document.getElementById("quarter2List"),
  3: document.getElementById("quarter3List"),
  4: document.getElementById("quarter4List"),
};
const quarterCheckboxes = Array.from(
  document.querySelectorAll('.quarter-options input[type="checkbox"]')
);

const storageKey = "heartWordsStatus";
const passedWords = new Set();
const practiceWords = new Set();
let currentWord = null;
let timerStarted = false;
let timerRunning = false;
let timerIntervalId = null;
let timerStartTime = null;
let elapsedTime = 0;
let nextBurstMark = 5 * 60 * 1000;

const loadSessionStatus = () => {
  const saved = sessionStorage.getItem(storageKey);
  if (!saved) {
    return;
  }
  const data = JSON.parse(saved);
  if (Array.isArray(data.passed)) {
    data.passed.forEach((word) => passedWords.add(word));
  }
  if (Array.isArray(data.practice)) {
    data.practice.forEach((word) => practiceWords.add(word));
  }
};

const saveSessionStatus = () => {
  sessionStorage.setItem(
    storageKey,
    JSON.stringify({
      passed: [...passedWords],
      practice: [...practiceWords],
    })
  );
};

const getSelectedQuarters = () =>
  quarterCheckboxes
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => Number(checkbox.value));

const updateMeta = (message) => {
  wordMeta.textContent = message;
};

const formatElapsedTime = (timeMs) => {
  const minutes = Math.floor(timeMs / 60000)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor((timeMs % 60000) / 1000)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const updateTimerDisplay = () => {
  const formatted = formatElapsedTime(elapsedTime);
  timerDisplay.textContent = formatted;
  timerDisplayPanel.textContent = formatted;
};

const timerPositionRange = {
  top: 30,
  bottom: 50,
};
let timerPositionFrame = null;

const updateTimerPosition = () => {
  const scrollTop = window.scrollY;
  const maxScroll =
    document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? scrollTop / maxScroll : 0;
  const topValue =
    timerPositionRange.top +
    (timerPositionRange.bottom - timerPositionRange.top) * progress;
  practiceTimer.style.top = `${topValue}%`;
};

const scheduleTimerPositionUpdate = () => {
  if (timerPositionFrame) {
    return;
  }
  timerPositionFrame = window.requestAnimationFrame(() => {
    timerPositionFrame = null;
    updateTimerPosition();
  });
};

const updateList = (listEl, items, options = {}) => {
  const { onRemove, emptyMessage } = options;
  listEl.innerHTML = "";
  const sortedItems = [...items].sort((a, b) => a.localeCompare(b));
  if (!sortedItems.length) {
    if (emptyMessage) {
      const li = document.createElement("li");
      li.classList.add("empty");
      li.textContent = emptyMessage;
      listEl.appendChild(li);
    }
    return;
  }

  sortedItems.forEach((word) => {
    const li = document.createElement("li");
    const text = document.createElement("span");
    text.textContent = word;
    li.appendChild(text);

    if (onRemove) {
      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "remove-word";
      removeButton.textContent = "Remove";
      removeButton.setAttribute("aria-label", `Remove ${word}`);
      removeButton.addEventListener("click", () => onRemove(word));
      li.appendChild(removeButton);
    }

    listEl.appendChild(li);
  });
};

const updateQuarterLists = () => {
  Object.values(quarterListElements).forEach((listEl) => {
    listEl.innerHTML = "";
  });

  heartWords.forEach((entry) => {
    const listEl = quarterListElements[entry.quarter];
    if (!listEl) {
      return;
    }
    const li = document.createElement("li");
    li.textContent = entry.word;
    listEl.appendChild(li);
  });
};

const updateStatus = () => {
  passedCount.textContent = passedWords.size;
  practiceCount.textContent = practiceWords.size;
  updateList(passedList, passedWords, {
    emptyMessage: "No passed words yet.",
    onRemove: (word) => {
      passedWords.delete(word);
      updateStatus();
    },
  });
  updateList(practiceList, practiceWords, {
    emptyMessage: "No try again words yet.",
    onRemove: (word) => {
      practiceWords.delete(word);
      updateStatus();
    },
  });
  saveSessionStatus();
};

const getWordPool = () => {
  const selectedQuarters = getSelectedQuarters();
  return heartWords.filter(
    (entry) => selectedQuarters.includes(entry.quarter)
  );
};

const pickWeightedBucket = (buckets) => {
  const available = buckets.filter((bucket) => bucket.items.length);
  if (!available.length) {
    return null;
  }
  const totalWeight = available.reduce((sum, bucket) => sum + bucket.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const bucket of available) {
    roll -= bucket.weight;
    if (roll <= 0) {
      return bucket;
    }
  }
  return available[available.length - 1];
};

const getNextWord = () => {
  const pool = getWordPool();
  if (!pool.length) {
    return null;
  }

  if (!mixModeToggle.checked) {
    const remaining = pool.filter((entry) => !passedWords.has(entry.word));
    const choices = remaining.length ? remaining : pool;
    return choices[Math.floor(Math.random() * choices.length)];
  }

  const unseen = pool.filter(
    (entry) =>
      !passedWords.has(entry.word) && !practiceWords.has(entry.word)
  );
  const tryAgain = pool.filter((entry) => practiceWords.has(entry.word));
  const passed = pool.filter((entry) => passedWords.has(entry.word));
  const bucket = pickWeightedBucket([
    { label: "unseen", items: unseen, weight: 0.5 },
    { label: "tryAgain", items: tryAgain, weight: 0.35 },
    { label: "passed", items: passed, weight: 0.15 },
  ]);

  if (!bucket) {
    return null;
  }

  return bucket.items[Math.floor(Math.random() * bucket.items.length)];
};

const showWord = (entry) => {
  if (!entry) {
    wordDisplay.textContent = "No words in selected quarters";
    updateMeta("Select at least one quarter to continue.");
    currentWord = null;
    return;
  }

  wordDisplay.textContent = entry.word;
  updateMeta(`Quarter ${entry.quarter}`);
  currentWord = entry;
};

const ensureTimerInterval = () => {
  if (timerIntervalId) {
    return;
  }
  timerIntervalId = setInterval(() => {
    if (!timerRunning) {
      return;
    }
    elapsedTime = Date.now() - timerStartTime;
    updateTimerDisplay();

    while (elapsedTime >= nextBurstMark) {
      practiceTimer.classList.remove("burst");
      void practiceTimer.offsetWidth;
      practiceTimer.classList.add("burst");
      nextBurstMark += 5 * 60 * 1000;
    }
  }, 1000);
};

const startTimer = () => {
  if (timerRunning) {
    return;
  }
  timerStarted = true;
  timerRunning = true;
  timerStartTime = Date.now() - elapsedTime;
  const remainder = elapsedTime % (5 * 60 * 1000);
  nextBurstMark = elapsedTime - remainder + 5 * 60 * 1000;
  ensureTimerInterval();
  timerPauseButton.textContent = "Pause";
};

const pauseTimer = () => {
  if (!timerRunning) {
    return;
  }
  timerRunning = false;
  timerPauseButton.textContent = "Resume";
};

const resetTimer = () => {
  timerRunning = false;
  timerStarted = false;
  elapsedTime = 0;
  timerStartTime = null;
  nextBurstMark = 5 * 60 * 1000;
  updateTimerDisplay();
  timerPauseButton.textContent = "Start";
};

const handlePass = () => {
  startTimer();
  if (!currentWord) {
    return;
  }
  passedWords.add(currentWord.word);
  practiceWords.delete(currentWord.word);
  updateStatus();
  showWord(getNextWord());
};

const handlePractice = () => {
  startTimer();
  if (!currentWord) {
    return;
  }
  practiceWords.add(currentWord.word);
  passedWords.delete(currentWord.word);
  updateStatus();
  showWord(getNextWord());
};

const handleNext = () => {
  startTimer();
  showWord(getNextWord());
};

quarterCheckboxes.forEach((checkbox) => {
  checkbox.addEventListener("change", () => {
    showWord(getNextWord());
  });
});

mixModeToggle.addEventListener("change", () => {
  showWord(getNextWord());
});

passButton.addEventListener("click", handlePass);
practiceButton.addEventListener("click", handlePractice);
nextButton.addEventListener("click", handleNext);
practiceCard.addEventListener("click", () => {
  if (!currentWord) {
    handleNext();
  }
});
clearPassedButton.addEventListener("click", () => {
  passedWords.clear();
  updateStatus();
});
clearPracticeButton.addEventListener("click", () => {
  practiceWords.clear();
  updateStatus();
});
timerToggle.addEventListener("click", () => {
  const isOpen = practiceTimer.dataset.open === "true";
  practiceTimer.dataset.open = isOpen ? "false" : "true";
  timerToggle.setAttribute("aria-expanded", String(!isOpen));
});
timerPauseButton.addEventListener("click", () => {
  if (!timerStarted || !timerRunning) {
    startTimer();
    return;
  }
  pauseTimer();
});
timerResetButton.addEventListener("click", resetTimer);
toggleListButton.addEventListener("click", () => {
  const isHidden = quarterListsSection.hasAttribute("hidden");
  if (isHidden) {
    quarterListsSection.removeAttribute("hidden");
    toggleListButton.textContent = "Hide quarter word lists";
    toggleListButton.setAttribute("aria-expanded", "true");
  } else {
    quarterListsSection.setAttribute("hidden", "");
    toggleListButton.textContent = "Show quarter word lists";
    toggleListButton.setAttribute("aria-expanded", "false");
  }
});
settingsToggle.addEventListener("click", () => {
  const isCollapsed = controlsSection.classList.toggle("is-collapsed");
  settingsToggle.setAttribute("aria-expanded", String(!isCollapsed));
});
window.addEventListener("scroll", scheduleTimerPositionUpdate, {
  passive: true,
});
window.addEventListener("resize", scheduleTimerPositionUpdate);

loadSessionStatus();
updateStatus();
updateQuarterLists();
updateTimerDisplay();
updateTimerPosition();
