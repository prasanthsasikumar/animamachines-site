# Anima Machines

> **Give Your AI a Soul - and a Face.**

Anima Machines is a platform for creating expressive, cartoon-style or 3D avatars with real-time emotional animations, voice synthesis, and a powerful behavior engine - connectable to any LLM.

🔗 **Live site:** [animamachines.com](https://animamachines.com) &nbsp;·&nbsp; 🚀 [Early Access](#)

---

## What's in this repo

A fully responsive single-page marketing site built with plain HTML and Tailwind CSS (CDN). No build step required.

```
animamachines-site/
├── index.html               # Full landing page
├── animamachinesMascot.png  # Brand mascot asset
├── .gitignore
├── LICENSE
└── README.md
```

## Sections

| Section | Description |
|---|---|
| **Hero** | Headline, CTAs, animated 3D avatar placeholder |
| **Features** | Instant Personality, Multilingual, Behavior Engine, LLM Agnostic |
| **Pricing** | Hobbyist / Creator / Business plans (Credit + Subscription model) |
| **About / Investors** | Vision statement and investor contact |
| **Careers** | 3D Character Artist, LLM Integration Specialist, Unity/WebGL Engineer |
| **Early Access** | Email signup CTA |
| **Footer** | Docs, API, social links |

## Running locally

Because the page uses Google Fonts from a CDN, open it via a local server rather than directly from the filesystem:

```bash
# Python 3
python -m http.server 8765
# then open http://localhost:8765
```

Or with Node:

```bash
npx serve .
```

## Deploying

This is a static site  -  deploy anywhere in seconds:

- **GitHub Pages**  -  push to `main`, enable Pages from repo Settings → Pages → Deploy from branch
- **Vercel**  -  `vercel --prod`
- **Netlify**  -  drag-and-drop the folder onto the Netlify dashboard

## Tech stack

- [Tailwind CSS](https://tailwindcss.com) via CDN
- [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) + [Inter](https://fonts.google.com/specimen/Inter) (Google Fonts)
- Vanilla JS (scroll effects, mobile menu, IntersectionObserver reveal)
- No dependencies, no build step

## Contributing

Pull requests are welcome. For major changes please open an issue first.

## License

[MIT](LICENSE) © 2026 Anima Machines
