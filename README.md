# AI Job Post Extractor

A small AI workflow tool that turns unstructured job descriptions into structured hiring signals.

It extracts:

- role title
- company
- location
- required skills
- nice-to-have skills
- tools
- seniority
- language requirements
- fit assessment
- application positioning

Built with Next.js, TypeScript, Tailwind, and the Groq API.

The goal of this project was to practice a practical AI product workflow:

messy input -> structured extraction -> usable interface -> decision support

## Getting Started

Create a local environment file:

```bash
cp .env.example .env.local
```

Add your Groq API key to `.env.local`, then run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
