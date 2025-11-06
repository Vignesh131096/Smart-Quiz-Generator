import os
import json
import tempfile
import requests
import yt_dlp
import google.generativeai as genai
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PyPDF2 import PdfReader
from docx import Document
from bs4 import BeautifulSoup

# -------------------------------------------
# 🔹 Initialize FastAPI
# -------------------------------------------
app = FastAPI(title="AI Quiz Generator", version="2.0")

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
genai.configure(api_key="AIzaSyCM78kUE7vNfGRQKWL_zgeXLbP1bDI3e8Q")  # 🔑 Replace with your Gemini API key 
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


def summarize_large_text(text):
    """Break large text into smaller summarized sections."""
    model = genai.GenerativeModel(MODEL_NAME)
    chunks = [text[i:i + 4000] for i in range(0, len(text), 4000)]
    summarized = []

    for i, chunk in enumerate(chunks, 1):
        try:
            prompt = f"Summarize this section ({i}/{len(chunks)}):\n{chunk}"
            res = model.generate_content(prompt)
            summarized.append(res.text.strip())
        except Exception as e:
            print(f"⚠️ Skipped chunk {i}: {e}")

    return " ".join(summarized)


def extract_text_from_webpage(url):
    """Extract clean text content from a webpage (handles Wikipedia too)."""
    try:
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0 Safari/537.36"
            )
        }
        response = requests.get(url, headers=headers, timeout=20)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        # Remove scripts, navbars, and irrelevant tags
        for tag in soup(["script", "style", "header", "footer", "nav", "sup", "table", "figure"]):
            tag.decompose()

        paragraphs = [p.get_text(strip=True) for p in soup.find_all("p") if len(p.get_text(strip=True)) > 50]
        text = " ".join(paragraphs)

        # If text is huge, summarize
        if len(text) > 15000:
            print("🧠 Summarizing long webpage content...")
            text = summarize_large_text(text)

        return text.strip()

    except Exception as e:
        print(f"❌ Error extracting webpage: {e}")
        return ""


def extract_text_from_youtube(url):
    """Extract subtitles from YouTube using yt-dlp."""
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
    """Generate quiz questions using Gemini."""
    print("🎯 Generating quiz...")
    prompt = f"""
You are a helpful AI tutor.
From the text below, generate {num_questions} multiple-choice questions.

Each question should include:
- 4 options (A, B, C, D)
- The correct answer letter (A/B/C/D)
Return valid JSON only in this format:
[
  {{
    "question": "...",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "answer": "A"
  }}
]

TEXT:
{text[:100000]}
"""

    model = genai.GenerativeModel(MODEL_NAME)
    response = model.generate_content(prompt)
    cleaned = response.text.strip("```json").strip("```").strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        print("⚠️ Gemini returned invalid JSON — attempting to fix...")
        return []


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

        # --- File Upload ---
        if file:
            with tempfile.NamedTemporaryFile(delete=False) as tmp:
                tmp.write(await file.read())
                tmp_path = tmp.name

            if file.filename.endswith(".pdf"):
                text_input = extract_text_from_pdf(tmp_path)
            elif file.filename.endswith(".docx"):
                text_input = extract_text_from_docx(tmp_path)
            elif file.filename.endswith(".txt"):  # ✅ Added TXT support safely
                with open(tmp_path, "r", encoding="utf-8") as f:
                    text_input = f.read()
            else:
                return {"error": "❌ Unsupported file format. Please upload PDF, DOCX, or TXT."}

        # --- Link ---
        elif link:
            if "youtube.com" in link or "youtu.be" in link:
                text_input = extract_text_from_youtube(link)
            else:
                text_input = extract_text_from_webpage(link)

        if not text_input:
            return {"error": "❌ Could not extract content from file or link."}

        # --- Generate Quiz ---
        quiz = generate_quiz_from_text(text_input, num_questions)
        if not quiz:
            return {"error": "⚠️ Quiz generation failed. Try again or shorten content."}

        print("✅ Quiz generated successfully.")
        return quiz

    except Exception as e:
        print(f"❌ Error generating quiz: {e}")
        return {"error": str(e)}


# -------------------------------------------
# 🔹 Run Server
# -------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
