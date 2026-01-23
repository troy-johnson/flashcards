const heartWords = [
  { word: "the", quarter: 1 },
  { word: "and", quarter: 1 },
  { word: "can", quarter: 1 },
  { word: "see", quarter: 1 },
  { word: "go", quarter: 1 },
  { word: "like", quarter: 2 },
  { word: "said", quarter: 2 },
  { word: "come", quarter: 2 },
  { word: "here", quarter: 2 },
  { word: "with", quarter: 2 },
  { word: "because", quarter: 3 },
  { word: "around", quarter: 3 },
  { word: "before", quarter: 3 },
  { word: "place", quarter: 3 },
  { word: "there", quarter: 3 },
  { word: "another", quarter: 4 },
  { word: "something", quarter: 4 },
  { word: "little", quarter: 4 },
  { word: "after", quarter: 4 },
  { word: "again", quarter: 4 },
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
const quarterCheckboxes = Array.from(
  document.querySelectorAll('.quarter-options input[type="checkbox"]')
);

const storageKey = "heartWordsStatus";
const passedWords = new Set();
const practiceWords = new Set();
let currentWord = null;

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

const updateList = (listEl, items) => {
  listEl.innerHTML = "";
  [...items]
    .sort((a, b) => a.localeCompare(b))
    .forEach((word) => {
      const li = document.createElement("li");
      li.textContent = word;
      listEl.appendChild(li);
    });
};

const updateStatus = () => {
  passedCount.textContent = passedWords.size;
  practiceCount.textContent = practiceWords.size;
  updateList(passedList, passedWords);
  updateList(practiceList, practiceWords);
  saveSessionStatus();
};

const getWordPool = () => {
  const selectedQuarters = getSelectedQuarters();
  return heartWords.filter(
    (entry) => selectedQuarters.includes(entry.quarter)
  );
};

const getNextWord = () => {
  const pool = getWordPool();
  if (!pool.length) {
    return null;
  }

  const remaining = pool.filter((entry) => !passedWords.has(entry.word));
  const choices = remaining.length ? remaining : pool;
  return choices[Math.floor(Math.random() * choices.length)];
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

const handlePass = () => {
  if (!currentWord) {
    return;
  }
  passedWords.add(currentWord.word);
  practiceWords.delete(currentWord.word);
  updateStatus();
  showWord(getNextWord());
};

const handlePractice = () => {
  if (!currentWord) {
    return;
  }
  practiceWords.add(currentWord.word);
  passedWords.delete(currentWord.word);
  updateStatus();
  showWord(getNextWord());
};

const handleNext = () => {
  showWord(getNextWord());
};

quarterCheckboxes.forEach((checkbox) => {
  checkbox.addEventListener("change", () => {
    showWord(getNextWord());
  });
});

passButton.addEventListener("click", handlePass);
practiceButton.addEventListener("click", handlePractice);
nextButton.addEventListener("click", handleNext);

loadSessionStatus();
updateStatus();
