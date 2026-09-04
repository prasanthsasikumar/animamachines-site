<p align="center">
  <img src="public/animamachinesMascot.png" alt="Anima Machines mascot" width="160" height="160" />
</p>

# Anima Machines

Turn a photo into an expressive, rigged 3D avatar — with real-time emotion, voice,
and an LLM behaviour engine. This is the site that remains after Anima Machines shut
down: a farewell letter and a gallery of every avatar and Augmented Humans 2026
booth session people created with the platform.

The original product (photo to rigged 3D avatar, real-time emotion, voice, LLM
behaviour engine) lived on a Supabase backend, which has been deleted. Everything
shown on the page comes from a frozen export in `src/content/showcase-data.ts` and
the static models under `public/showcase/`.

## Tech stack

- **Next.js 16** (App Router)
- **Tailwind CSS** + Inter / Space Grotesk
- **Three.js** (3D model viewer)

No environment variables are needed.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy (Vercel)

Deploy from the repo root. No Root Directory config needed.

## License

[MIT](LICENSE) © 2026 Anima Machines
