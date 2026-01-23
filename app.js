const heartWords = [
  { word: "the", quarter: 1 },
  { word: "of", quarter: 1 },
  { word: "and", quarter: 1 },
  { word: "a", quarter: 1 },
  { word: "to", quarter: 1 },
  { word: "in", quarter: 1 },
  { word: "is", quarter: 1 },
  { word: "you", quarter: 1 },
  { word: "that", quarter: 1 },
  { word: "it", quarter: 1 },
  { word: "he", quarter: 1 },
  { word: "was", quarter: 1 },
  { word: "for", quarter: 1 },
  { word: "on", quarter: 1 },
  { word: "are", quarter: 1 },
  { word: "as", quarter: 1 },
  { word: "with", quarter: 1 },
  { word: "his", quarter: 1 },
  { word: "they", quarter: 1 },
  { word: "I", quarter: 1 },
  { word: "at", quarter: 1 },
  { word: "be", quarter: 1 },
  { word: "this", quarter: 1 },
  { word: "have", quarter: 1 },
  { word: "from", quarter: 1 },
  { word: "or", quarter: 2 },
  { word: "one", quarter: 2 },
  { word: "had", quarter: 2 },
  { word: "by", quarter: 2 },
  { word: "words", quarter: 2 },
  { word: "but", quarter: 2 },
  { word: "not", quarter: 2 },
  { word: "what", quarter: 2 },
  { word: "all", quarter: 2 },
  { word: "were", quarter: 2 },
  { word: "we", quarter: 2 },
  { word: "when", quarter: 2 },
  { word: "your", quarter: 2 },
  { word: "can", quarter: 2 },
  { word: "said", quarter: 2 },
  { word: "there", quarter: 2 },
  { word: "use", quarter: 2 },
  { word: "an", quarter: 2 },
  { word: "each", quarter: 2 },
  { word: "which", quarter: 2 },
  { word: "she", quarter: 2 },
  { word: "do", quarter: 2 },
  { word: "how", quarter: 2 },
  { word: "their", quarter: 2 },
  { word: "if", quarter: 2 },
  { word: "will", quarter: 3 },
  { word: "up", quarter: 3 },
  { word: "other", quarter: 3 },
  { word: "about", quarter: 3 },
  { word: "out", quarter: 3 },
  { word: "many", quarter: 3 },
  { word: "then", quarter: 3 },
  { word: "them", quarter: 3 },
  { word: "these", quarter: 3 },
  { word: "so", quarter: 3 },
  { word: "some", quarter: 3 },
  { word: "her", quarter: 3 },
  { word: "would", quarter: 3 },
  { word: "make", quarter: 3 },
  { word: "like", quarter: 3 },
  { word: "him", quarter: 3 },
  { word: "into", quarter: 3 },
  { word: "time", quarter: 3 },
  { word: "has", quarter: 3 },
  { word: "look", quarter: 3 },
  { word: "two", quarter: 3 },
  { word: "more", quarter: 3 },
  { word: "write", quarter: 3 },
  { word: "go", quarter: 3 },
  { word: "see", quarter: 3 },
  { word: "number", quarter: 4 },
  { word: "no", quarter: 4 },
  { word: "way", quarter: 4 },
  { word: "could", quarter: 4 },
  { word: "people", quarter: 4 },
  { word: "my", quarter: 4 },
  { word: "than", quarter: 4 },
  { word: "first", quarter: 4 },
  { word: "water", quarter: 4 },
  { word: "been", quarter: 4 },
  { word: "called", quarter: 4 },
  { word: "who", quarter: 4 },
  { word: "am", quarter: 4 },
  { word: "its", quarter: 4 },
  { word: "now", quarter: 4 },
  { word: "find", quarter: 4 },
  { word: "long", quarter: 4 },
  { word: "down", quarter: 4 },
  { word: "day", quarter: 4 },
  { word: "did", quarter: 4 },
  { word: "get", quarter: 4 },
  { word: "come", quarter: 4 },
  { word: "made", quarter: 4 },
  { word: "may", quarter: 4 },
  { word: "part", quarter: 4 },
];

const wordDisplay = document.getElementById("wordDisplay");
const wordMeta = document.getElementById("wordMeta");
const passButton = document.getElementById("passButton");
const practiceButton = document.getElementById("practiceButton");
const nextButton = document.getElementById("nextButton");
const passedCount = document.getElementById("passedCount");
const practiceCount = document.getElementById("practiceCount");
const passedList = document.getElementById("passedList");
const practiceList = document.getElementById("practiceList");
const toggleListButton = document.getElementById("toggleListButton");
const mixModeToggle = document.getElementById("mixMode");
const timerDisplay = document.getElementById("timerDisplay");
const practiceTimer = document.getElementById("practiceTimer");
const quarterListsSection = document.getElementById("quarterLists");
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
let timerIntervalId = null;
let timerStartTime = null;
let nextBurstTime = null;

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

const startTimer = () => {
  if (timerStarted) {
    return;
  }
  timerStarted = true;
  timerStartTime = Date.now();
  nextBurstTime = timerStartTime + 5 * 60 * 1000;
  timerIntervalId = setInterval(() => {
    const elapsed = Date.now() - timerStartTime;
    const minutes = Math.floor(elapsed / 60000)
      .toString()
      .padStart(2, "0");
    const seconds = Math.floor((elapsed % 60000) / 1000)
      .toString()
      .padStart(2, "0");
    timerDisplay.textContent = `${minutes}:${seconds}`;

    while (Date.now() >= nextBurstTime) {
      practiceTimer.classList.remove("burst");
      void practiceTimer.offsetWidth;
      practiceTimer.classList.add("burst");
      nextBurstTime += 5 * 60 * 1000;
    }
  }, 1000);
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

loadSessionStatus();
updateStatus();
updateQuarterLists();
