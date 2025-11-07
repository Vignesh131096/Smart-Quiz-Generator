# Phase_2

✅ Dark/ Light Theme
The Ui will be automatically changed inbetween light / dark theme by clicking simple button (🌙/🌞)

# Smart Quiz Generator - Timer Quiz Update

## Overview

This update adds a dedicated **Timed Quiz** mode (Phase 2) to the existing Smart Quiz Generator application. It enhances the app with a fully functional timer-based quiz experience that works independently from the normal quiz mode (Phase 1).

## Features

- **Separate Timed Quiz Page:**  
  Users click a simple button on the main page (Phase 1) to navigate to the new timed quiz page (Phase 2).
  
- **Upload or Link Input:**  
  Users upload notes files (.pdf, .docx, .txt) or paste a content URL on the timer quiz page before starting.

- **Difficulty Levels with Adaptive Timer:**  
  Timer per question adjusts based on difficulty:  
  - Easy: 45 seconds/question  
  - Medium: 30 seconds/question  
  - Hard: 25 seconds/question

- **Auto-Submit on Timeout:**  
  Quiz automatically submits and scores when timer expires.

- **Detailed Score and Explanation Summary**

- **Theme Toggle with Persistence:**  
  Light/Dark mode support synced across phases.

- **Clear Navigation:**  
  Go back and forth between normal quiz and timed quiz easily.

## How to Run

1. Launch the backend API server to serve quiz generation endpoints.  
2. Serve the frontend files on a local or web server.  
3. Open main page (`index.html`), click **Go to Timed Quiz** button.  
4. On timed quiz page (`timer-quiz.html`), upload notes or paste a link, choose options, and start quiz.  
5. Complete the quiz before timer ends for best score.

## Notes

- The timer quiz mode does not auto-start on page load; user input is required to begin.  
- File upload on timed quiz is required or valid link pasted to generate questions successfully.  
- Phase 1 and Phase 2 are modular: Phase 1 handles normal quizzes; Phase 2 is a standalone timed quiz with its own input form.

## Development

- Frontend: HTML, CSS, JavaScript with Bootstrap for styling.  
- Backend: Python + Gemini API (same as Phase 1) for quiz generation.  
- Communication: Fetch API POST requests with FormData (file/link, difficulty, question count).

## Future Improvements

- Add per-question timers with auto-advance.  
- Save quiz progress locally to resume after accidental close.  
- More diverse question
