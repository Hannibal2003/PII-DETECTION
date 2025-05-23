# Privacy Sentinel Detect

A web application for detecting Personally Identifiable Information (PII) in text documents using the Gemini API.

## Features

*   Upload text files (e.g., `.txt`, `.md`).
*   Scan uploaded text for various types of PII.
*   Highlight detected PII within the text.
*   Provide a summary table of detected PII types and counts.
*   Utilize the Gemini API for advanced PII detection capabilities.

## Technologies Used

*   React
*   TypeScript
*   Vite
*   Tailwind CSS
*   Shadcn UI
*   Bun (Package Manager)
*   Google Gemini API

## Setup and Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository_url>
    cd privacy-sentinel-detect
    ```

2.  **Install dependencies:**

    ```bash
    bun install
    ```

3.  **Set up environment variables:**

    Create a `.env` file in the root directory of the project. Obtain your Gemini API key from the Google AI Studio or Google Cloud Platform and add it to the file:

    ```env
    VITE_GEMINI_API_KEY=YOUR_GEMINI_API_KEY
    ```

    Replace `YOUR_GEMINI_API_KEY` with your actual API key.

## How to Run

1.  **Start the development server:**

    ```bash
    bun dev
    ```

2.  Open your browser and navigate to the address shown in the terminal (usually `http://localhost:5173`).

## Project Structure

```
privacy-sentinel-detect/
├── public/
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── ui/          # Shadcn UI components
│   │   ├── FileUploader.tsx
│   │   ├── Header.tsx
│   │   ├── HighlightedResults.tsx
│   │   └── PiiSummaryTable.tsx
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── lib/
│   │   └── utils.ts     # Utility functions (e.g., shadcn utils)
│   ├── pages/
│   │   ├── Index.tsx      # Main application page
│   │   └── NotFound.tsx   # 404 page
│   ├── utils/
│   │   ├── exportUtils.ts
│   │   ├── geminiHelper.ts  # Gemini API interaction helper
│   │   ├── genai-client.ts  # Generative AI client setup
│   │   └── piiDetection.ts  # PII detection logic
│   ├── App.css
│   ├── App.tsx          # Main App component
│   ├── index.css        # Global styles
│   ├── main.tsx         # Entry point
│   └── vite-env.d.ts    # Vite environment types
├── .env                 # Environment variables
├── .gitignore           # Git ignore file
├── bun.lockb            # Bun lock file
├── components.json      # Shadcn UI components config
├── eslint.config.js     # ESLint configuration
├── index.html           # Main HTML file
├── package-lock.json    # npm lock file (if used)
├── package.json         # Project dependencies and scripts
├── postcss.config.js    # PostCSS configuration
├── README.md            # Project README
├── tailwind.config.ts   # Tailwind CSS configuration
├── tsconfig.app.json    # TypeScript config for app
├── tsconfig.json        # Base TypeScript config
├── tsconfig.node.json   # TypeScript config for Node environment
└── vite.config.ts       # Vite configuration
```



## License

[Specify your project's license here, e.g., MIT, Apache 2.0]
