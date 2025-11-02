# 🧠 Smart AI Quiz Generator

An intelligent quiz generator powered by **Gemini AI** that transforms any study material — PDF, DOCX, website, or YouTube video — into interactive quizzes with explanations.

---

## 🎯 Phase 1 – Smarter Quiz Generation *(Completed)*

| Feature | Description |
|----------|-------------|
| 📄 **Upload Any File** | Upload PDF, DOCX, or paste text — instantly generate a quiz. |
| 🔗 **From YouTube / Webpage** | Paste a link → app fetches transcript or article → creates quiz. |
| 🧠 **AI Summarized Topic** | *(Planned for Phase 2)* Show a short summary before quiz generation. |
| ⚙ **Difficulty Control** | Choose **Easy**, **Medium**, or **Hard** → AI adjusts complexity. |

---

## 🧩 Phase 2–3 (Upcoming)

| Feature Group | Planned Additions |
|---------------|------------------|
| 🧩 **Interactive Quiz Experience** | Timed quiz mode ⏱️, AI explanations 💬, regenerate questions 🔁, color themes 🎨, and text-to-speech support 🔊. |
| 📊 **Results & Analytics** | Score tracking 📈, performance history 🧾, weak-topic detection 🧠, and leveling system 🏆. |
| 🌟 **Fun Add-ons** | Daily challenge 🔥, “Play vs AI” 🧍, shareable quiz links 👥, “Learn from Mistakes” 💡, and mini certificates 🏅. |
| ⚙ **Technical Integration** | Local AI (Ollama / LLaMA3) + Gemini Hybrid Mode, SQLite / Firebase storage for user history. |

---

## 🧩 Current Features (Phase 1 Demo)

✅ Upload or paste text to auto-generate 5 AI-based MCQs  
✅ Choose difficulty (Easy / Medium / Hard)  
✅ View quiz in sleek Bootstrap UI  
✅ Get **answer explanations** after submission  
✅ Works with YouTube captions + PDF + DOCX + TXT + Web articles  
✅ FastAPI backend + Gemini API integration  

---

## ⚙️ Tech Stack

| Layer | Tools Used |
|-------|------------|
| **Frontend** | HTML 5, CSS 3, Bootstrap 5, JavaScript (ES6) |
| **Backend** | FastAPI (Python 3.11+) + Gemini API |
| **AI Model** | `models/gemini-2.5-flash` |
| **Extras** | yt-dlp, PyPDF2, python-docx, BeautifulSoup for text parsing |

---


