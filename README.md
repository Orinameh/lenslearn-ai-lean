# 👁️ LensLearn

### _Turn any image into an interactive classroom._

LensLearn is an AI-powered visual learning platform that transforms static images and complex scenarios into interactive, guided educational experiences. Whether you're exploring a work of art, a biological diagram, or a city street, LensLearn provides the context and conversation to help you master the subject.

---

## ✨ Key Features

### 📸 AI Visual Scene Analysis

Upload any image to generate an interactive "learning world." LensLearn identifies 3-5 key hotspots, provides detailed educational context for each, and sets learning goals based on your profile.

### 🎓 Guided AI Educator

Chat with a world-class AI guide that adapts its tone, depth, and examples to your age group:

- **Kid**: Fun, curious, and simple language.
- **Teen**: Engaging, relatable, and moderately technical.
- **Adult**: Professional, detailed, and high-depth explanations.

### 🛡️ Safety & Responsibility First

Built for learners of all ages:

- **Strict Safety Filters**: Automated blocking of dangerous, harmful, or inappropriate content.
- **Responsible Educator Persona**: Declines medical, legal, or financial advice while encouraging a growth mindset.
- **Safe Auditing**: All safety incidents are logged and audited to ensure a healthy learning environment.

### ⏳ Learning Persistence

Never lose your progress. Sessions are saved automatically to your profile, allowing you to resume complex conversations and revisit explored scenes anytime.

---

## 🛠️ Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) — The full-stack React framework with incredible performance and type safety.
- **Frontend**:
  - **React 19**: Leveraging the latest React features and concurrent rendering.
  - **Tailwind CSS 4**: Modern, efficient styling with a custom serif-typography theme.
  - **Framer Motion**: Smooth micro-interactions and transitions.
  - **React Markdown**: Full support for GFM, Math (LaTeX/KaTeX), and structured educational content.
- **Backend / Services**:
  - **Supabase**: Handles Authentication, PostgreSQL database, and high-performance Storage.
  - **Google Gemini**: Powered by Gemini 1.5/2.0+ models for low-latency, multimodal analysis.
  - **TanStack Store / Zustand**: Robust client-side state management.

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed.
- A Supabase project.
- A Google AI (Gemini) API Key.

### Installation

1.  Clone the repository and install dependencies:

    ```bash
    bun install
    ```

2.  Configure your environment:
    Create a `.env` file in the root directory:

    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    GEMINI_API_KEY=your_gemini_api_key
    GEMINI_MAIN_MODEL=gemini-3-flash-preview
    GEMINI_FALLBACK_MODEL=gemini-2.5-flash
    GEMINI_REDZONE_MODEL=gemini-2.5-flash
    ```

3.  Start the development server:
    ```bash
    bun run dev
    ```

---

## 🏗️ Project Structure

- `src/routes/`: File-based routing for the dashboard, learning scenes, and user profiles.
- `src/services/`: Core business logic:
  - `gemini.ts`: AI prompt engineering and safety configuration.
  - `ai-governance.ts`: Cost auditing, request routing, and model selection.
  - `learning-funcs.ts`: Persistence and session management logic.
- `utils/`: Custom hooks like `useLearn` for managing real-time AI streams.

---

## 📄 License

LensLearn is a private project. All rights reserved.
