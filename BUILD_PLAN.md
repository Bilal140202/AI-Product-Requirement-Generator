# Comprehensive Build Plan: AI Product Requirement Generator

## 1. Executive Summary
This document serves as the master blueprint for building the **AI Product Requirement Generator** from scratch. It is designed to be fed into any AI coding assistant (e.g., Gemini 3.1) to autonomously scaffold, construct, and finalize the complete application.

**Core Objective:** Build a web application that takes a simple product idea from a user and uses the NYOK model and Pollinations endpoint to generate a fully structured, professional Product Requirement Document (PRD).

---

## 2. Technical Stack
To ensure a modern, robust, and maintainable architecture, the following stack must be used:
*   **Frontend Framework:** Next.js (App Router) with React 18+.
*   **Styling:** Tailwind CSS (with a dark-mode first premium aesthetic), using glassmorphism and modern UI elements.
*   **Icons & Components:** Lucide-React for icons, Radix UI or shadcn/ui for accessible primitive components.
*   **State Management:** Zustand (for lightweight global state) or React Context.
*   **Markdown Parsing:** \eact-markdown\ with \emark-gfm\ to render the generated PRD securely.
*   **PDF Export:** \jspdf\ and \html2canvas\ (or \eact-to-pdf\) to allow users to download the PRD.
*   **AI Integration:** 
    *   Primary Text Generation: **NYOK Model API** (using pre-inserted limit messages to ensure output adheres to strict PRD formatting).
    *   Supplementary Generation: **Pollinations Endpoint** (for generating placeholder UI mockups or flowchart diagrams if requested).

---

## 3. Architecture & Plotting

### 3.1. User Flow
1.  **Landing Page:** A sleek, animated hero section explaining the value proposition.
2.  **Input Form (The Generator):** 
    *   A large, expanding text area asking: *"What are you trying to build?"*
    *   Advanced options accordion: Target Audience, Technical Constraints, Competitors.
3.  **Loading State:** A skeleton loader or dynamic progress indicator showing steps: *"Analyzing prompt...", "Structuring features...", "Drafting User Stories..."*
4.  **Results Dashboard:** A split-pane view. Left side shows the raw Markdown or formatted PRD; right side shows quick actions (Regenerate, Copy, Export to PDF).

### 3.2. Data Flow & API Plotting
1.  **Client Request:** The user submits the form.
2.  **Next.js API Route (\/api/generate-prd\):**
    *   *Pre-Insert Limit Message:* The server intercepts the prompt and prepends the strict NYOK system prompt: *"You are a senior Product Manager. You must output a PRD strictly following this markdown structure: 1. Objective, 2. Target Audience, 3. User Stories, 4. Non-functional Requirements. Adhere strictly to token limits."*
    *   *External Call:* The server calls the NYOK model and streams the response back to the client.
3.  **Pollinations Route (\/api/generate-assets\):**
    *   Called asynchronously to generate a cover image or visual flowchart based on the PRD title using the Pollinations endpoint.

---

## 4. Minute Implementation Details & File Structure

An AI assistant must create the following structure:

\\\	ext
/
├── app/
│   ├── layout.tsx         # Global layout with premium dark theme wrapper
│   ├── page.tsx           # Landing page & Input form
│   ├── api/
│   │   ├── generate-prd/
│   │   │   └── route.ts   # NYOK Model integration & Pre-insert limit logic
│   │   └── assets/
│   │       └── route.ts   # Pollinations endpoint integration
├── components/
│   ├── PRDForm.tsx        # The main input component
│   ├── MarkdownViewer.tsx # Renders the AI output
│   └── ExportButtons.tsx  # PDF / Copy to clipboard logic
├── lib/
│   ├── nyok-client.ts     # Wrapper for the NYOK model API calls
│   └── utils.ts           # Tailwind merge & utility functions
└── tailwind.config.js     # Custom animations & color palettes
\\\

---

## 5. Step-by-Step Prompting Guide for the AI Coder

When you are ready to build this, feed the following prompts to your AI assistant sequentially:

*   **Prompt 1 (Scaffolding):** "Initialize a Next.js project with Tailwind CSS. Create the folder structure outlined in the BUILD_PLAN.md. Set up a premium dark mode theme in tailwind.config.js with custom glowing gradients."
*   **Prompt 2 (Frontend UI):** "Build the \PRDForm.tsx\ component. It needs a massive, beautiful textarea and a submit button with a loading spinner. Build the \MarkdownViewer.tsx\ component to safely render markdown."
*   **Prompt 3 (Backend Integration):** "Implement the \/api/generate-prd\ route. Connect it to the NYOK model API. Ensure you prepend the 'pre-insert limit message' to enforce strict PRD structure. Stream the response back to the frontend."
*   **Prompt 4 (Pollinations Integration):** "Implement the \/api/assets\ route using the Pollinations endpoint to generate a header image for the PRD based on its title."
*   **Prompt 5 (Export Logic):** "Implement the \ExportButtons.tsx\ component using jspdf to allow the user to download the rendered PRD as a styled PDF."

---

## 6. Edge Cases & Constraints
*   **Rate Limiting:** Implement basic Upstash Redis rate-limiting on the API routes to prevent abuse of the NYOK and Pollinations endpoints.
*   **Streaming Failures:** Ensure the frontend gracefully handles dropped streams from the NYOK model by displaying an error toast and retaining the user's input.
