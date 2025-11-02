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
        <button class="toggle-btn btn btn-sm btn-outline-primary mt-2" data-index="${i}">Show Reason ▾</button>
        <div class="explanation-slide hidden mt-2">
          💡 ${q.explanation || "No explanation provided."}
        </div>
      </div>`;
  });

  // Attach toggle events
  document.querySelectorAll(".toggle-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const index = btn.dataset.index;
      const exp = document.querySelectorAll(".explanation-slide")[index];
      const isHidden = exp.classList.toggle("hidden");

      // Smooth slide animation
      if (!isHidden) {
        exp.style.maxHeight = exp.scrollHeight + "px";
        btn.textContent = "Hide Reason ▴";
      } else {
        exp.style.maxHeight = 0;
        btn.textContent = "Show Reason ▾";
      }
    });
  });
}

// ✅ Results with explanations
showResultsBtn.addEventListener("click", () => {
  let score = 0;
  const blocks = document.querySelectorAll(".question-block");

  quizData.forEach((q, i) => {
    const selected = document.querySelector(`input[name="q${i}"]:checked`);
    const userAns = selected ? selected.value : "";
    const correctAns = (q.answer || "").trim().toUpperCase();
    const block = blocks[i];

    if (userAns === correctAns) {
      score++;
      block.classList.add("border-success");
    } else {
      block.classList.add("border-danger");
    }
  });

  resultSummary.innerHTML = `<h5 class="text-center">✅ You got ${score} / ${quizData.length} correct!</h5>`;
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