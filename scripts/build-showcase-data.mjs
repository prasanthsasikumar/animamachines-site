#!/usr/bin/env node
// One-off data-prep script for the /showcase page.
//
// Anima Machines is sunsetting. This reads the frozen Supabase table/storage
// export (a point-in-time snapshot, not a live DB) and produces:
//   1. Copied media under public/showcase/ (git-tracked, so the showcase
//      keeps working after the Supabase project is decommissioned).
//   2. src/content/showcase-data.ts — a typed, static module the /showcase
//      page imports directly (no runtime DB calls).
//
// This is NOT meant to be re-run on a schedule: the product's data is frozen.
// Run manually if the export changes: `node scripts/build-showcase-data.mjs`.

import { parse } from "csv-parse/sync";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_DIR = path.resolve(__dirname, "..");
const EXPORT_DIR =
  process.env.SHOWCASE_EXPORT_DIR ??
  "/Users/prasanthsasikumar/Documents/animamachines-export";

const TABLES_DIR = path.join(EXPORT_DIR, "tables");
const STORAGE_DIR = path.join(EXPORT_DIR, "storage", "characters");
const PUBLIC_SHOWCASE_DIR = path.join(REPO_DIR, "public", "showcase");
const OUTPUT_FILE = path.join(REPO_DIR, "src", "content", "showcase-data.ts");

// Excluded because this is a built-in seed/demo asset ("Sample character"),
// not a real user creation: file sits directly at characters/<uid>/<id>.glb,
// outside the normal per-avatar pipeline subfolder structure.
const SEED_AVATAR_ID = "6044b199-e7d7-4382-a14f-a8c9e0ac9d24";

function readCsv(name) {
  const raw = fs.readFileSync(path.join(TABLES_DIR, name), "utf-8");
  return parse(raw, { columns: true, skip_empty_lines: true });
}

function deviceFromUserAgent(ua) {
  if (!ua) return "Unknown";
  if (ua.includes("iPhone")) return "iPhone";
  if (ua.includes("iPad")) return "iPad";
  if (ua.includes("Macintosh")) return "Mac";
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Android")) return "Android";
  return "Other";
}

function isJapanese(text) {
  return /[぀-ヿ㐀-鿿]/.test(text);
}

function isPresetKey(text) {
  return /^[a-z_]+$/.test(text);
}

function copyFile(relPathInExport, destAbsPath) {
  const src = path.join(STORAGE_DIR, relPathInExport);
  if (!fs.existsSync(src)) {
    console.warn(`  ! missing source file, skipping: ${relPathInExport}`);
    return false;
  }
  fs.mkdirSync(path.dirname(destAbsPath), { recursive: true });
  fs.copyFileSync(src, destAbsPath);
  return true;
}

// ---------------------------------------------------------------------------
// 1. Load raw tables
// ---------------------------------------------------------------------------

const profileRows = readCsv("profiles.csv");
const avatarRows = readCsv("avatars.csv");
const sessionRows = readCsv("augmented_human_sessions.csv");
const commandRows = readCsv("augmented_human_commands.csv");

const emailByUserId = new Map(profileRows.map((p) => [p.id, p.email]));

// ---------------------------------------------------------------------------
// 2. Studio avatars (character-creation pipeline) — funnel + gallery
// ---------------------------------------------------------------------------

const funnel = {
  started: 0, // any avatar record created
  photoUploaded: 0, // reached at least an input photo
  bodyGenerated: 0, // reached at least a full-body render or texture pass
  completed: 0, // fully rigged + textured
};

const studioGallery = [];

// Each pipeline stage (input photo, full-body render, rig, texture) can land
// on its own avatar row rather than accumulating on one row — so the row
// that finally has rigged_glb+textured_glb doesn't necessarily carry its own
// thumbnail. Fall back to the best thumbnail seen anywhere in that user's
// other avatar rows (most recent fullbody_photo, else most recent
// input_photo).
const bestThumbByUser = new Map(); // user_id -> { path, priority, updatedAt }
for (const row of avatarRows) {
  if (row.id === SEED_AVATAR_ID) continue;
  let config = {};
  try {
    config = row.config ? JSON.parse(row.config) : {};
  } catch {
    config = {};
  }
  const candidate = config.fullbody_photo
    ? { path: config.fullbody_photo, priority: 2 }
    : config.input_photo
      ? { path: config.input_photo, priority: 1 }
      : null;
  if (!candidate) continue;
  const existing = bestThumbByUser.get(row.user_id);
  if (!existing || candidate.priority > existing.priority) {
    bestThumbByUser.set(row.user_id, candidate);
  }
}

for (const row of avatarRows) {
  if (row.id === SEED_AVATAR_ID) continue; // exclude seed/demo asset
  funnel.started += 1;

  let config = {};
  try {
    config = row.config ? JSON.parse(row.config) : {};
  } catch {
    config = {};
  }
  const keys = new Set(Object.keys(config));

  const hasInputPhoto = keys.has("input_photo");
  const hasBodyOrTexture =
    keys.has("fullbody_photo") || keys.has("textured_glb") || keys.has("rigged_glb");
  const isCompleted = keys.has("rigged_glb") && keys.has("textured_glb");

  if (hasInputPhoto || hasBodyOrTexture) funnel.photoUploaded += 1;
  if (hasBodyOrTexture) funnel.bodyGenerated += 1;
  if (isCompleted) funnel.completed += 1;

  if (!isCompleted) continue;

  const glbRel = config.rigged_glb; // already includes skin + texture + base animation
  const talkGlbRel = config.animated_talk_glb;
  const thumbRel =
    config.fullbody_photo ?? config.input_photo ?? bestThumbByUser.get(row.user_id)?.path;
  if (!glbRel || !thumbRel) {
    console.warn(`  ! completed avatar ${row.id} missing expected paths, skipping`);
    continue;
  }

  const destGlb = path.join(PUBLIC_SHOWCASE_DIR, "studio", row.id, "model.glb");
  const destThumb = path.join(PUBLIC_SHOWCASE_DIR, "studio", row.id, "thumb.png");
  const okGlb = copyFile(glbRel, destGlb);
  const okThumb = copyFile(thumbRel, destThumb);
  if (!okGlb || !okThumb) continue;

  let talkGlbPath;
  if (talkGlbRel) {
    const destTalk = path.join(PUBLIC_SHOWCASE_DIR, "studio", row.id, "talk.glb");
    if (copyFile(talkGlbRel, destTalk)) {
      talkGlbPath = `/showcase/studio/${row.id}/talk.glb`;
    }
  }

  studioGallery.push({
    id: row.id,
    kind: "studio-avatar",
    label: emailByUserId.get(row.user_id) ?? "Unknown creator",
    thumbnailPath: `/showcase/studio/${row.id}/thumb.png`,
    glbPath: `/showcase/studio/${row.id}/model.glb`,
    talkGlbPath,
    createdAt: row.updated_at || row.created_at,
  });
}

// One user's only attempt (511936ca) stalls at fullbody_photo with no rig —
// counted correctly above via funnel.bodyGenerated, intentionally excluded
// from studioGallery since there is no GLB to show or download.

// ---------------------------------------------------------------------------
// 3. Augmented Humans 2026 booth sessions — gallery + demographics
// ---------------------------------------------------------------------------

const boothGallery = [];
const demographics = {
  gender: {},
  ageBracket: {},
  device: {},
  timezone: {},
};
let sleepTotal = 0;
let arousalTotal = 0;
let valenceTotal = 0;

for (const row of sessionRows) {
  const glbRel = row.animated_glb_path || row.model_glb_path;
  const thumbRel = row.fullbody_photo_path || row.capture_photo_path;
  if (!glbRel || !thumbRel) {
    console.warn(`  ! session ${row.id} missing expected paths, skipping`);
    continue;
  }

  const destGlb = path.join(PUBLIC_SHOWCASE_DIR, "booth", row.id, "model.glb");
  const destThumb = path.join(PUBLIC_SHOWCASE_DIR, "booth", row.id, "thumb.png");
  const okGlb = copyFile(glbRel, destGlb);
  const okThumb = copyFile(thumbRel, destThumb);
  if (!okGlb || !okThumb) continue;

  const gender = row.gender || null;
  const ageBracket = row.age_bracket || null;
  const device = deviceFromUserAgent(row.user_agent);
  const timezone = row.client_timezone || "Unknown";

  if (gender) demographics.gender[gender] = (demographics.gender[gender] ?? 0) + 1;
  if (ageBracket) demographics.ageBracket[ageBracket] = (demographics.ageBracket[ageBracket] ?? 0) + 1;
  demographics.device[device] = (demographics.device[device] ?? 0) + 1;
  demographics.timezone[timezone] = (demographics.timezone[timezone] ?? 0) + 1;

  sleepTotal += Number(row.sleep_score);
  arousalTotal += Number(row.arousal);
  valenceTotal += Number(row.valence);

  boothGallery.push({
    id: row.id,
    kind: "booth-session",
    label: emailByUserId.get(row.user_id) ?? "Unknown creator",
    thumbnailPath: `/showcase/booth/${row.id}/thumb.png`,
    glbPath: `/showcase/booth/${row.id}/model.glb`,
    createdAt: row.created_at,
    sleepScore: Number(row.sleep_score),
    arousal: Number(row.arousal),
    valence: Number(row.valence),
    gender,
    ageBracket,
    device,
    timezone,
  });
}

const sessionAverages = {
  sleep: Number((sleepTotal / boothGallery.length).toFixed(1)),
  arousal: Number((arousalTotal / boothGallery.length).toFixed(1)),
  valence: Number((valenceTotal / boothGallery.length).toFixed(1)),
};

// ---------------------------------------------------------------------------
// 4. Voice/UI command analysis (word cloud + mode usage)
// ---------------------------------------------------------------------------

const commandCounts = {};
const modeDistribution = {};
const sayFrequencyMap = new Map(); // text -> { count, kind }

for (const row of commandRows) {
  commandCounts[row.command] = (commandCounts[row.command] ?? 0) + 1;

  let payload = {};
  try {
    payload = row.payload ? JSON.parse(row.payload) : {};
  } catch {
    payload = {};
  }

  if (row.command === "mode" && typeof payload.mode !== "undefined") {
    const mode = String(payload.mode);
    modeDistribution[mode] = (modeDistribution[mode] ?? 0) + 1;
  }

  if (row.command === "say" && payload.text) {
    const text = payload.text;
    const kind = isJapanese(text) ? "japanese" : isPresetKey(text) ? "preset" : "english";
    const entry = sayFrequencyMap.get(text) ?? { count: 0, kind };
    entry.count += 1;
    sayFrequencyMap.set(text, entry);
  }
}

const sayFrequency = [...sayFrequencyMap.entries()]
  .map(([text, { count, kind }]) => ({ text, count, kind }))
  .sort((a, b) => b.count - a.count);

// ---------------------------------------------------------------------------
// 5. Signup / download-eligibility totals
// ---------------------------------------------------------------------------

const usersWithDownload = new Set([
  ...studioGallery.map((g) => avatarRows.find((r) => r.id === g.id)?.user_id),
  ...boothGallery.map((g) => sessionRows.find((r) => r.id === g.id)?.user_id),
]);

const totals = {
  signups: profileRows.length,
  withDownload: usersWithDownload.size,
  withoutDownload: profileRows.length - usersWithDownload.size,
};

// ---------------------------------------------------------------------------
// 6. Emit src/content/showcase-data.ts
// ---------------------------------------------------------------------------

const GALLERY = [...studioGallery, ...boothGallery];

const fileContents = `// AUTO-GENERATED by scripts/build-showcase-data.mjs — do not edit by hand.
// Source: a frozen export of the Supabase project (data will not change again).
// Regenerate with: node scripts/build-showcase-data.mjs

export type GalleryItem = {
  id: string;
  kind: "studio-avatar" | "booth-session";
  label: string;
  thumbnailPath: string;
  glbPath: string;
  talkGlbPath?: string;
  createdAt: string;
  sleepScore?: number;
  arousal?: number;
  valence?: number;
  gender?: string | null;
  ageBracket?: string | null;
  device?: string;
  timezone?: string;
};

export const GALLERY: GalleryItem[] = ${JSON.stringify(GALLERY, null, 2)};

export const STATS = {
  totals: ${JSON.stringify(totals, null, 2)},
  funnel: ${JSON.stringify(funnel, null, 2)},
  commandCounts: ${JSON.stringify(commandCounts, null, 2)},
  modeDistribution: ${JSON.stringify(modeDistribution, null, 2)},
  sayFrequency: ${JSON.stringify(sayFrequency, null, 2)},
  demographics: ${JSON.stringify(demographics, null, 2)},
  sessionAverages: ${JSON.stringify(sessionAverages, null, 2)},
};
`;

fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
fs.writeFileSync(OUTPUT_FILE, fileContents);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log("\nShowcase data build complete.");
console.log(`  Studio avatars in gallery: ${studioGallery.length}`);
console.log(`  Booth sessions in gallery: ${boothGallery.length}`);
console.log(`  Funnel:`, funnel);
console.log(`  Totals:`, totals);
console.log(`  Command counts:`, commandCounts);
console.log(`  Mode distribution:`, modeDistribution);
console.log(`  Top say phrases:`, sayFrequency.slice(0, 5));
console.log(`  Demographics:`, demographics);
console.log(`  Session averages:`, sessionAverages);
console.log(`\nWrote ${path.relative(REPO_DIR, OUTPUT_FILE)}`);
console.log(`Copied media into ${path.relative(REPO_DIR, PUBLIC_SHOWCASE_DIR)}/`);
