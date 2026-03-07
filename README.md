# Anima Machines

> **Give Your AI a Soul - and a Face.**

Anima Machines is a platform for creating expressive, cartoon-style or 3D avatars with real-time emotional animations, voice synthesis, and a powerful behavior engine - connectable to any LLM.

## Tech stack

- **Next.js 16** (App Router)
- **Tailwind CSS** + Inter / Space Grotesk
- **Supabase** (Auth + Postgres)
- **Three.js** (3D mascot viewer)
- **Resend** (newsletter emails)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy `.env.example` to `.env.local` and add:

- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (required)
- Optional: `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `CRON_SECRET`, Stripe keys

## Project structure

```
├── src/
│   ├── app/          # Routes, pages, API
│   ├── components/   # React components
│   └── lib/          # Supabase clients, utilities
├── public/           # Static assets (mascot, images)
├── supabase/
│   └── migrations/   # DB schema
└── docs/             # Setup guides (SMTP, auth)
```

## Deploy (Vercel)

Deploy from the repo root. No Root Directory config needed.

## License

[MIT](LICENSE) © 2026 Anima Machines
