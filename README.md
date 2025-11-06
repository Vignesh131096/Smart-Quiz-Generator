# Phase_1

⿡ Multi-Source Input → Quiz Generation
Users can upload a PDF/DOCX, paste a YouTube link, or enter a webpage URL.
The backend extracts text and summarizes long content before sending it to Gemini AI.

⿢ AI-Powered Question Creation
Gemini 2.5 Flash generates MCQs with four options and correct answers based on the extracted text.

⿣ Interactive Frontend & Validation
Users attend questions in a clean Bootstrap UI.
If they miss any, the system asks whether to attend all or submit early (unanswered = wrong).

⿤ Instant Results & Feedback
After submission, answers are highlighted — ✅ correct in green, ❌ wrong/unattended in red — with smooth transitions and an easy navigation back to home.
