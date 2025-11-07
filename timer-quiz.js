const form = document.getElementById("timerQuizForm");
const fileInput = document.getElementById("fileInput");
const linkInput = document.getElementById("linkInput");
const numQuestionsInput = document.getElementById("numQuestions");
const levelSelect = document.getElementById("level");
const timerDisplay = document.getElementById("timerDisplay");
const timeSpan = document.getElementById("time");
const quizContainer = document.getElementById("quizContainer");
const resultSummary = document.getElementById("resultSummary");
const loadingOverlay = document.getElementById("loadingOverlay");
const homeBtn = document.getElementById("homeBtn");
const themeToggle = document.getElementById("themeToggle");

let quizData = [];
let currentIndex = 0;
let timer;
let timeLeft = 0;
let userAnswers = [];

// Theme management
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  themeToggle.textContent = "🌞";
} else {
  themeToggle.textContent = "🌙";
}
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  themeToggle.textContent = isDark ? "🌞" : "🌙";
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

homeBtn.addEventListener("click", () => {
  window.location.href = "index.html";
});

// Start quiz generation on form submit
form.addEventListener("submit", async e => {
  e.preventDefault();

  if (!fileInput.files.length && !linkInput.value.trim()) {
    alert("⚠️ Please upload a file or paste a link.");
    return;
  }

  const fd = new FormData();
  if (fileInput.files.length) fd.append("file", fileInput.files[0]);
  if (linkInput.value.trim()) fd.append("link", linkInput.value.trim());
  fd.append("num_questions", numQuestionsInput.value || 5);
  fd.append("level", levelSelect.value || "Medium");

  loadingOverlay.classList.remove("d-none");
  quizContainer.innerHTML = "";
  resultSummary.textContent = "";
  timerDisplay.style.display = "none";

  try {
    const response = await fetch("http://127.0.0.1:8000/generate_quiz/", {
      method: "POST",
      body: fd
    });
    const data = await response.json();
    loadingOverlay.classList.add("d-none");

    if (data.error) {
      alert(data.error);
      return;
    }

    quizData = data;
    userAnswers = new Array(quizData.length).fill(null);
    currentIndex = 0;

    showTimer();
    renderQuestion(currentIndex);
  } catch (err) {
    loadingOverlay.classList.add("d-none");
    alert("❌ Backend not responding or error occurred.");
  }
});

function showTimer() {
  let secondsPerQuestion = 30; // default for medium

  if (levelSelect.value.toLowerCase() === "easy") {
    secondsPerQuestion = 45;
  } else if (levelSelect.value.toLowerCase() === "hard") {
    secondsPerQuestion = 25;
  }

  timeLeft = quizData.length * secondsPerQuestion;
  timerDisplay.style.display = "block";
  timeSpan.textContent = timeLeft;
  clearInterval(timer);
  timer = setInterval(() => {
    timeLeft--;
    timeSpan.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timer);
      submitQuiz();
    }
  }, 1000);
}

function renderQuestion(index) {
  const q = quizData[index];
  const opts = q.options || [];

  let optionsHtml = opts
    .map(
      (opt, i) =>
        `<label class="option${userAnswers[index] === String.fromCharCode(65 + i) ? " selected" : ""}">
          <input type="radio" name="q${index}" value="${String.fromCharCode(65 + i)}" style="display:none" />
          ${opt}
        </label>`
    )
    .join("");

  quizContainer.innerHTML = `
    <div class="question-block">
      <p><strong>Q${index + 1}:</strong> ${q.question}</p>
      <form id="questionForm">${optionsHtml}</form>
      <div class="d-flex justify-content-between mt-3">
        <button id="prevBtn" class="btn btn-outline-danger" ${index === 0 ? "disabled" : ""}>Previous</button>
        <button id="nextBtn" class="btn btn-danger">${index === quizData.length - 1 ? "Submit" : "Next"}</button>
      </div>
    </div>
  `;

  const optionLabels = quizContainer.querySelectorAll(".option");
  optionLabels.forEach((label, i) => {
    label.addEventListener("click", () => {
      optionLabels.forEach(l => l.classList.remove("selected"));
      label.classList.add("selected");
      userAnswers[index] = String.fromCharCode(65 + i);
    });
  });

  document.getElementById("prevBtn").addEventListener("click", e => {
    e.preventDefault();
    if (currentIndex > 0) {
      currentIndex--;
      renderQuestion(currentIndex);
    }
  });

  document.getElementById("nextBtn").addEventListener("click", e => {
    e.preventDefault();
    if (currentIndex < quizData.length - 1) {
      currentIndex++;
      renderQuestion(currentIndex);
    } else {
      submitQuiz();
    }
  });
}

function submitQuiz() {
  clearInterval(timer);
  quizContainer.innerHTML = "";

  let score = 0;
  quizData.forEach((q, i) => {
    const userAns = userAnswers[i];
    const correctAns = (q.answer || "").trim().toUpperCase();
    if (userAns === correctAns) score++;
  });

  let resultHTML = `<h4>✅ You scored ${score} / ${quizData.length}</h4><hr />`;
  quizData.forEach((q, i) => {
    const userAns = userAnswers[i] || "Unattended";
    const correctAns = (q.answer || "").trim().toUpperCase();
    const isCorrect = userAns === correctAns;
    const explanation = isCorrect
      ? `✅ Correct because it matches the key concept.`
      : `❌ Your answer: ${userAns}, correct answer: ${correctAns}`;

    resultHTML += `
      <div class="question-block">
        <div><strong>Q${i + 1}:</strong> ${q.question}</div>
        <div>Your Answer: <span class="${isCorrect ? "text-success" : "text-danger"}">${userAns}</span></div>
        <div>Correct Answer: <span class="text-success">${correctAns}</span></div>
        <div class="mt-1"><em>${explanation}</em></div>
      </div>
    `;
  });

  resultSummary.innerHTML = resultHTML;
  timerDisplay.style.display = "none";
}
