const form = document.getElementById("quizForm");
const fileInput = document.getElementById("file");
const linkInput = document.getElementById("link");
const numQuestions = document.getElementById("numQuestions");
const level = document.getElementById("level");
const pageContainer = document.getElementById("pageContainer");
const quizContainer = document.getElementById("quizContainer");
const showResultsBtn = document.getElementById("showResults");
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
}

// ✅ Results with correct answers and unattended handling
showResultsBtn.addEventListener("click", () => {
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
      block.insertAdjacentHTML("beforeend",
        `<p class="text-success mt-2">✅ Correct!</p>`
      );
    } else {
      block.classList.add("border-danger");
      block.insertAdjacentHTML("beforeend",
        `<p class="text-danger mt-2">❌ Wrong — Correct Answer: <strong>${correctAns}</strong></p>`
      );
    }
  });

  if (unansweredCount > 0) {
    const confirmSubmit = confirm(
      `⚠️ You left ${unansweredCount} question(s) unattended.\n\nDo you still want to submit? (Unattended will be marked wrong)`
    );
    if (!confirmSubmit) return;
  }

  resultSummary.innerHTML = `<h5 class="text-center mt-3">✅ You got ${score} / ${quizData.length} correct!</h5>`;
  resultSummary.classList.remove("hidden");
  resultSummary.scrollIntoView({ behavior: "smooth" });
});

// 🏠 Home
homeBtn.addEventListener("click", () => {
  pageContainer.classList.replace("slide-quiz", "slide-home");
  quizContainer.innerHTML = "";
  resultSummary.innerHTML = "";
  resultSummary.classList.add("hidden");
  form.reset();
});
