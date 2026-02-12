# Cortex - The AI Secondary Mind

<img width="400" height="300" alt="cortexlogo" src="https://github.com/user-attachments/assets/87e39423-1c99-41fb-a3b9-57fa685aa5ad" />


Cortex is a powerful, AI-driven cognitive assistant designed to help you capture, organize, and retrieve your thoughts effortlessly. It acts as a "secondary mind" that listens, understands, and categorizes your ideas, tasks, and memories in real-time.

## Key Features

- **Voice-First Interaction**: Speak naturally to Cortex. It transcribes your voice and intelligently processes your intent using Google's Gemini Multimodal Live API.
- **Smart Memory System**:
  - **Create**: Automatically creates Notes, Checklists, Tasks, or Reminders based on what you say.
  - **Append**: smartly adds items to existing lists (e.g., "Add milk to my grocery list") without creating duplicates.
- **Rich Text Editor**: A beautiful, distraction-free editor for manual note-taking with support for formatting, images, and tagging.
- **Real-time Organization**: 
  - Auto-tagging of memories.
  - Smart filtering (Work, Home, Ideas).
  - Instant search across all notes.
- **Notifications**: Built-in reminder system with visual and audio alerts.

## Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Lucide Icons.
- **Backend / Database**: Convex (Real-time database and serverless functions).
- **AI Engine**: Google Gemini Multimodal Live API (WebSockets).
- **Authentication**: Clerk / Convex Auth.

## Getting Started

### Prerequisites
- Node.js (v18+)
- A Google Gemini API Key
- A Convex account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/cortex-ai.git
   cd cortex-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Environment Variables:
   Create a `.env.local` file and add your keys:
   ```env
   VITE_CONVEX_URL=your_convex_url
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. Run the development server:
   ```bash
   npx convex dev
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

- `/components`: core UI components (Dashboard, Editor, MemoryCard).
- `/convex`: Backend schema and API functions.
- `/lib`: Helper utilities.
