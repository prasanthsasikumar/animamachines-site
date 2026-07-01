// Draft sunset email copy — NOT wired to any send endpoint or cron.
//
// This is intentionally not imported by /api/newsletter/send (that route
// targets the unrelated, empty newsletter_subscribers table) or by any other
// route. It exists purely as reviewed, ready-to-use copy for whenever a
// decision is made on how these actually get sent.
//
// Two variants, matching the split found in the data export:
//   - sunsetEmailWithDownload: the 4 users who have a real generated GLB
//     (studio avatar or Augmented Humans 2026 booth session).
//   - sunsetEmailNoDownload: the 7 users with nothing to download (includes
//     1 user whose character only reached a full-body photo, never rigged).
//
// No display_name exists anywhere in the data (profiles.display_name is
// empty for all 11 users) — greetings are intentionally generic rather than
// faking a name from an email's local part.

import { SUNSET_DOWNLOAD_DEADLINE_LABEL } from "./sunset";

type EmailContent = {
  subject: string;
  html: string;
  text: string;
};

export const sunsetEmailWithDownload: EmailContent = {
  subject: "Anima Machines is shutting down — download your avatar before it's gone",
  text: `Hi there,

Anima Machines is shutting down, and we wanted you to hear it from us directly.

You created an avatar with us, and we don't want you to lose it. Please log in and download your GLB file(s) before ${SUNSET_DOWNLOAD_DEADLINE_LABEL} — after that, we can no longer guarantee access.

Download your files:
- Studio avatars: https://animamachines.com/characters
- Augmented Humans 2026 booth session: https://animamachines.com/augmentedhumans/history

We've also put together a public showcase of what our users built together, including the live demo we ran at Augmented Humans 2026: https://animamachines.com/showcase

Thank you for building with us.

— The Anima Machines team`,
  html: `
    <p>Hi there,</p>
    <p>Anima Machines is shutting down, and we wanted you to hear it from us directly.</p>
    <p>You created an avatar with us, and we don't want you to lose it. Please log in and download your GLB file(s) before <strong>${SUNSET_DOWNLOAD_DEADLINE_LABEL}</strong> — after that, we can no longer guarantee access.</p>
    <p>
      <a href="https://animamachines.com/characters">Download your studio avatars</a><br/>
      <a href="https://animamachines.com/augmentedhumans/history">Download your Augmented Humans 2026 session</a>
    </p>
    <p>We've also put together a public <a href="https://animamachines.com/showcase">showcase</a> of what our users built together, including the live demo we ran at Augmented Humans 2026.</p>
    <p>Thank you for building with us.</p>
    <p>— The Anima Machines team</p>
  `,
};

export const sunsetEmailNoDownload: EmailContent = {
  subject: "Anima Machines is shutting down",
  text: `Hi there,

Anima Machines is shutting down, and we wanted you to hear it from us directly.

We've put together a public showcase of what our users built together — every generated avatar, plus the live demo we ran at Augmented Humans 2026: https://animamachines.com/showcase

Thank you for signing up and being part of this.

— The Anima Machines team`,
  html: `
    <p>Hi there,</p>
    <p>Anima Machines is shutting down, and we wanted you to hear it from us directly.</p>
    <p>We've put together a public <a href="https://animamachines.com/showcase">showcase</a> of what our users built together — every generated avatar, plus the live demo we ran at Augmented Humans 2026.</p>
    <p>Thank you for signing up and being part of this.</p>
    <p>— The Anima Machines team</p>
  `,
};
