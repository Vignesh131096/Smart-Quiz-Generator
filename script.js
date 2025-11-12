// Existing script unchanged (Quiz logic)
const form = document.getElementById("quizForm");
const fileInput = document.getElementById("file");
const linkInput = document.getElementById("link");
const numQuestions = document.getElementById("numQuestions");
const level = document.getElementById("level");
const pageContainer = document.getElementById("pageContainer");
const quizContainer = document.getElementById("quizContainer");
const homeBtn = document.getElementById("homeBtn");
const resultSummary = document.getElementById("resultSummary");
const loadingOverlay = document.getElementById("loadingOverlay");

let quizData = [];

// Loader controls
function showLoader() { loadingOverlay.classList.add("show"); }
function hideLoader() { loadingOverlay.classList.remove("show"); }

// 🧩 Generate Quiz
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!fileInput.files.length && !linkInput.value.trim()) {
    alert("⚠️ Please upload a file or paste a link before generating.");
    return;
  }

  const fd = new FormData();
  if (fileInput.files.length) fd.append("file", fileInput.files[0]);
  if (linkInput.value.trim()) fd.append("link", linkInput.value.trim());
  fd.append("num_questions", numQuestions.value || 5);
  fd.append("level", level.value || "Medium");

  showLoader();
  try {
    const resp = await fetch("http://127.0.0.1:8000/generate_quiz/", { method: "POST", body: fd });
    const data = await resp.json();

    if (data.error) {
      hideLoader();
      quizContainer.innerHTML = `<p class="text-danger">${data.error}</p>`;
      return;
    }

    quizData = data;
    hideLoader();
    renderQuiz(quizData);
    pageContainer.classList.replace("slide-home", "slide-quiz");
  } catch (err) {
    hideLoader();
    quizContainer.innerHTML = "<p class='text-danger'>❌ Backend not responding.</p>";
  }
});

// Render quiz
function renderQuiz(data) {
  quizContainer.innerHTML = "";
  resultSummary.classList.add("hidden");

  data.forEach((q, i) => {
    const opts = q.options || [];
    const optionsHTML = opts.map((opt, idx) => `
      <label class="option">
        <input type="radio" name="q${i}" value="${String.fromCharCode(65 + idx)}" class="form-check-input mt-1" />
        <span>${opt}</span>
      </label>`).join("");

    quizContainer.innerHTML += `
      <div class="question-block">
        <p><strong>Q${i + 1}:</strong> ${q.question}</p>
        ${optionsHTML}
      </div>`;
  });

  // Add only the Submit button at the bottom
  quizContainer.innerHTML += `
    <div class="text-center mt-4">
      <button id="submitQuizBtn" class="btn btn-danger btn-lg">Submit Quiz</button>
    </div>
  `;

  // Add event listener to the new submit button
  document.getElementById("submitQuizBtn").addEventListener("click", showResults);
}

// ✅ Results with correct answers
function showResults() {
  let score = 0;
  const blocks = document.querySelectorAll(".question-block");
  let unansweredCount = 0;

  quizData.forEach((q, i) => {
    const selected = document.querySelector(`input[name="q${i}"]:checked`);
    const userAns = selected ? selected.value : "";
    const correctAns = (q.answer || "").trim().toUpperCase();
    const block = blocks[i];

    if (!userAns) {
      unansweredCount++;
      block.classList.add("border-warning");
      block.insertAdjacentHTML("beforeend",
        `<p class="text-warning mt-2">⚠️ Unattended — Correct Answer: <strong>${correctAns}</strong></p>`
      );
    } else if (userAns === correctAns) {
      score++;
      block.classList.add("border-success");
      block.insertAdjacentHTML("beforeend", `<p class="text-success mt-2">✅ Correct!</p>`);
    } else {
      block.classList.add("border-danger");
      block.insertAdjacentHTML("beforeend",
        `<p class="text-danger mt-2">❌ Wrong — Correct Answer: <strong>${correctAns}</strong></p>`
      );
    }
  });

  if (unansweredCount > 0) {
    const confirmSubmit = confirm(`⚠️ You left ${unansweredCount} question(s) unattended.\nSubmit anyway?`);
    if (!confirmSubmit) return;
  }

  resultSummary.innerHTML = `<h5 class="text-center mt-3">✅ You got ${score} / ${quizData.length} correct!</h5>`;
  resultSummary.classList.remove("hidden");

  setTimeout(showSummaryPage, 1200);
}

// 🧠 Show Explanation Summary (Layout 3)
function showSummaryPage() {
  const summaryContainer = document.getElementById("summaryContainer");
  summaryContainer.innerHTML = "";

  quizData.forEach((q, i) => {
    const selected = document.querySelector(`input[name="q${i}"]:checked`);
    const userAns = selected ? selected.value : "Unattended";
    const correctAns = (q.answer || "").trim().toUpperCase();
    const isCorrect = userAns === correctAns;
    
    // Get the actual option texts
    const userAnswerText = userAns !== "Unattended" 
      ? q.options[userAns.charCodeAt(0) - 65] 
      : "Unattended";
    const correctAnswerText = q.options[correctAns.charCodeAt(0) - 65];

    const explanationText = isCorrect
      ? `✅ ${correctAns} (${correctAnswerText}) is correct because it matches the key concept in your notes.`
      : `❌ You selected ${userAns} (${userAnswerText}), but ${correctAns} (${correctAnswerText}) is correct based on the provided content.`;

    const card = document.createElement("div");
    card.className = "summary-card";
    card.innerHTML = `
      <div class="summary-question">Q${i + 1}. ${q.question}</div>
      <div class="summary-user ${isCorrect ? 'text-success' : 'text-danger'}">
        Your Answer: ${userAns} - ${userAnswerText}
      </div>
      <div class="summary-correct">Correct Answer: ${correctAns} - ${correctAnswerText}</div>
      <div class="summary-explanation">💬 ${explanationText}</div>
    `;
    summaryContainer.appendChild(card);
  });

  pageContainer.classList.remove("slide-home", "slide-quiz");
  pageContainer.classList.add("slide-summary");
}

// 🔁 Retry & Home
document.getElementById("retryQuiz").addEventListener("click", () => {
  pageContainer.classList.remove("slide-summary");
  pageContainer.classList.add("slide-quiz");
});

document.getElementById("goHome").addEventListener("click", () => {
  pageContainer.classList.remove("slide-summary");
  pageContainer.classList.add("slide-home");
  quizContainer.innerHTML = "";
  resultSummary.innerHTML = "";
  resultSummary.classList.add("hidden");
  form.reset();
});


// 🔁 Regenerate Quiz (After Results)
const regenAfterResult = document.getElementById("regenerateBtn");

if (regenAfterResult) {
  regenAfterResult.addEventListener("click", async () => {
    if (!fileInput.files.length && !linkInput.value.trim()) {
      alert("⚠️ Please upload a file or paste a link first.");
      return;
    }

    const confirmRegen = confirm("Do you want to regenerate a new quiz from the same source?");
    if (!confirmRegen) return;

    showLoader();
    const fd = new FormData();
    if (fileInput.files.length) fd.append("file", fileInput.files[0]);
    if (linkInput.value.trim()) fd.append("link", linkInput.value.trim());
    fd.append("num_questions", numQuestions.value || 5);
    fd.append("level", level.value || "Medium");

    try {
      const resp = await fetch("http://127.0.0.1:8000/generate_quiz/", { method: "POST", body: fd });
      const data = await resp.json();

      if (data.error) {
        hideLoader();
        alert(data.error);
        return;
      }

      quizData = data;
      hideLoader();
      renderQuiz(quizData);
      pageContainer.classList.remove("slide-summary");
      pageContainer.classList.add("slide-quiz");
      resultSummary.classList.add("hidden");
    } catch (err) {
      hideLoader();
      alert("❌ Failed to regenerate quiz. Check backend connection.");
    }
  });
}


// 🧩 Auto-resize main container height on layout change
const mainContainer = document.querySelector("main");
const pageSections = document.querySelectorAll(".page-container > section");

function adjustMainHeight() {
  const activeClass = [...pageContainer.classList].find(c => c.startsWith("slide-"));
  let activeSection;
  if (activeClass === "slide-home") activeSection = pageSections[0];
  else if (activeClass === "slide-quiz") activeSection = pageSections[1];
  else if (activeClass === "slide-summary") activeSection = pageSections[2];
  if (activeSection) {
    const newHeight = activeSection.scrollHeight + 100;
    mainContainer.style.height = `${newHeight}px`;
    mainContainer.style.minHeight = `${newHeight}px`;
  }
}

// Observe layout changes
const observer = new MutationObserver(adjustMainHeight);
observer.observe(pageContainer, { attributes: true, attributeFilter: ["class"] });

// Initial adjustment
window.addEventListener("load", adjustMainHeight);


// 🌙 Theme Switcher
const themeToggle = document.getElementById("themeToggle");

// Load saved theme from localStorage
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  themeToggle.textContent = "🌞";
}

// Toggle theme on click
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  themeToggle.textContent = isDark ? "🌞" : "🌙";
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

document.getElementById("goToTimerQuizBtn").addEventListener("click", () => {
  window.location.href = "timer-quiz.html";
});
