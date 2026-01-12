# 👁️ LensLearn

### _Turn any image into an interactive classroom._

LensLearn is an AI-powered visual learning platform that transforms static images and complex scenarios into interactive, guided educational experiences. It features a **Guided AI Educator** that helps you master any subject through conversation and context. This version is a **Stateless Proof of Concept (POC)** designed for rapid demonstration and testing without backend persistence.

---

## ✨ Key Features

### 📸 AI Visual Scene Analysis

Upload any image to generate an interactive "learning world." LensLearn identifies key hotspots and provides contexts.
_Note: In this POC, images are analyzed on-the-fly and results are stored temporarily in browser memory._

### 🎓 Guided AI Educator

Chat with a world-class AI guide that adapts its tone to your preferences.
_Note: The app simulates a "Pro" user experience by default._

### 🚀 Instant Access (No Login)

Authentication and paywalls have been bypassed for this demo. You are automatically logged in as a demo user with unlimited access to premium AI models.

---

## 🛠️ Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) — The full-stack React framework.
- **Frontend**:
  - **React 19**: Leveraging concurrent rendering.
  - **Tailwind CSS 4**: Modern styling.
  - **Framer Motion**: Smooth interactions.
  - **React Markdown**: Rendering rich educational content.
- **AI Services**:
  - **Google Gemini**: Powered by Gemini 1.5 Pro Models for multimodal analysis.
- **State Management**:
  - **Transient Store**: Custom in-memory store for passing image data between routes (`src/store.ts`).

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) or [Node.js](https://nodejs.org/) installed.
- A Google AI (Gemini) API Key.

### Installation

1.  Clone the repository and install dependencies:

    ```bash
    npm install
    # or
    bun install
    ```

2.  Configure your environment:
    Create a `.env` file in the root directory:

    ```env
    GEMINI_API_KEY=your_gemini_api_key
    GEMINI_MAIN_MODEL=gemini-1.5-pro
    ```

3.  Start the development server:
    ```bash
    npm run dev
    # or
    bun run dev
    ```

---

## 🏗️ Project Structure

- `src/routes/`: File-based routing.
  - `index.tsx`: Main upload hub. Handles image processing and stores result in memory.
  - `learn.$id.tsx`: Learning interface. Reads from memory to display scene without DB fetching.
- `src/services/`:
  - `server-funcs.ts`: Server-side functions for AI interaction (Auth/DB logic removed).
  - `gemini.ts`: AI interaction logic.
- `src/utils/store.ts`: **[New]** Simple ephemeral store for passing analysis data between pages.

---

## ⚠️ Limitations

- **No Persistence**: Refreshing the page during an image session will reset the scene (mock fallback provided).
- **No User Profiles**: Preferences are not saved between sessions.
- **No History**: Chat history is not saved to a database.

---

## 📄 License

LensLearn is a private project. All rights reserved.
