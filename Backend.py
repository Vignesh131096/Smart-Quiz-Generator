import os
import json
import tempfile
import requests
import yt_dlp
import google.generativeai as genai
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PyPDF2 import PdfReader
from docx import Document
from bs4 import BeautifulSoup

# -------------------------------------------
# 🔹 Initialize FastAPI
# -------------------------------------------
app = FastAPI(title="AI Quiz Generator", version="1.0")

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------
# 🔹 Configure Gemini API
# -------------------------------------------
genai.configure(api_key="AIzaSyCM78kUE7vNfGRQKWL_zgeXLbP1bDI3e8Q")
MODEL_NAME = "models/gemini-2.5-flash"

# -------------------------------------------
# 🔹 Helper Functions
# -------------------------------------------

def extract_text_from_pdf(file_path):
    text = ""
    reader = PdfReader(file_path)
    for page in reader.pages:
        text += page.extract_text() + "\n"
    return text.strip()

def extract_text_from_docx(file_path):
    text = ""
    doc = Document(file_path)
    for para in doc.paragraphs:
        text += para.text + "\n"
    return text.strip()

def extract_text_from_webpage(url):
    response = requests.get(url, timeout=15)
    soup = BeautifulSoup(response.text, "html.parser")
    return " ".join(p.text for p in soup.find_all("p")).strip()

def extract_text_from_youtube(url):
    try:
        print(f"🎥 Fetching captions via yt-dlp for: {url}")
        ydl_opts = {
            "skip_download": True,
            "writesubtitles": True,
            "writeautomaticsub": True,
            "subtitleslangs": ["en"],
            "quiet": True,
        }
        with tempfile.TemporaryDirectory() as tmpdirname:
            ydl_opts["outtmpl"] = os.path.join(tmpdirname, "%(id)s.%(ext)s")
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                subtitles = info.get("subtitles", {}) or info.get("automatic_captions", {})
                if not subtitles:
                    return None
                lang, entries = list(subtitles.items())[0]
                if not entries or "url" not in entries[0]:
                    return None
                caption_url = entries[0]["url"]
                caption_text = requests.get(caption_url).text
                return caption_text.strip()
    except Exception as e:
        print(f"❌ YouTube extract failed: {e}")
        return None

def generate_quiz_from_text(text, num_questions=5):
    """Generate quiz with explanations using Gemini."""
    prompt = f"""
You are a helpful tutor creating a learning quiz.
From the text below, generate {num_questions} multiple-choice questions.

Each question must include:
- 4 options labeled A, B, C, D
- The correct answer letter (A/B/C/D)
- A 1–2 sentence explanation describing *why* that answer is correct.

Return valid JSON list only, in this format:
[
  {{
    "question": "...",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "answer": "B",
    "explanation": "Reason why this is correct."
  }}
]

TEXT:
{text[:100000]}
"""
    model = genai.GenerativeModel(MODEL_NAME)
    response = model.generate_content(prompt)
    cleaned = response.text.strip("```json").strip("```").strip()
    return json.loads(cleaned)

# -------------------------------------------
# 🔹 API Endpoint
# -------------------------------------------

@app.post("/generate_quiz/")
async def generate_quiz(
    file: UploadFile | None = File(None),
    link: str | None = Form(None),
    num_questions: int = Form(5),
    level: str = Form("Medium")
):
    try:
        text_input = ""

        # --- Handle File Upload ---
        if file:
            with tempfile.NamedTemporaryFile(delete=False) as tmp:
                tmp.write(await file.read())
                tmp_path = tmp.name
            if file.filename.endswith(".pdf"):
                text_input = extract_text_from_pdf(tmp_path)
            elif file.filename.endswith(".docx"):
                text_input = extract_text_from_docx(tmp_path)
            else:
                text_input = open(tmp_path, "r", encoding="utf-8").read()

        # --- Handle Link ---
        elif link:
            if "youtube.com" in link or "youtu.be" in link:
                text_input = extract_text_from_youtube(link)
            else:
                text_input = extract_text_from_webpage(link)

        if not text_input:
            return {"error": "❌ No valid text extracted."}

        # --- Generate Quiz ---
        quiz = generate_quiz_from_text(text_input, num_questions)
        return quiz

    except Exception as e:
        print(f"❌ Error generating quiz: {e}")
        return {"error": str(e)}

# -------------------------------------------
# 🔹 Run (if executed directly)
# -------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
