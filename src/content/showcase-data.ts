// Frozen export of the (now deleted) Anima Machines Supabase project, taken
// before shutdown. This is the only copy of the data that still exists; the
// generator script and the database it read from are both gone.

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

export const GALLERY: GalleryItem[] = [
  {
    "id": "17a977d9-7fc6-4da8-8517-a60abc26a78a",
    "kind": "studio-avatar",
    "label": "praveen@ahlab.org",
    "thumbnailPath": "/showcase/studio/17a977d9-7fc6-4da8-8517-a60abc26a78a/thumb.png",
    "glbPath": "/showcase/studio/17a977d9-7fc6-4da8-8517-a60abc26a78a/model.glb",
    "createdAt": "2026-03-10 09:35:52.309+00"
  },
  {
    "id": "a31d7c26-b5a0-46f6-a524-b62464dd1d6c",
    "kind": "studio-avatar",
    "label": "prasanth@ahlab.org",
    "thumbnailPath": "/showcase/studio/a31d7c26-b5a0-46f6-a524-b62464dd1d6c/thumb.png",
    "glbPath": "/showcase/studio/a31d7c26-b5a0-46f6-a524-b62464dd1d6c/model.glb",
    "talkGlbPath": "/showcase/studio/a31d7c26-b5a0-46f6-a524-b62464dd1d6c/talk.glb",
    "createdAt": "2026-03-11 01:43:28.019+00"
  },
  {
    "id": "62586b21-d490-42a9-9737-5b53876d646a",
    "kind": "studio-avatar",
    "label": "prasanth@ahlab.org",
    "thumbnailPath": "/showcase/studio/62586b21-d490-42a9-9737-5b53876d646a/thumb.png",
    "glbPath": "/showcase/studio/62586b21-d490-42a9-9737-5b53876d646a/model.glb",
    "createdAt": "2026-03-10 11:28:57.149+00"
  },
  {
    "id": "9ccd9cd9-328a-4e40-a91b-94e8499fcaca",
    "kind": "studio-avatar",
    "label": "prasanth@ahlab.org",
    "thumbnailPath": "/showcase/studio/9ccd9cd9-328a-4e40-a91b-94e8499fcaca/thumb.png",
    "glbPath": "/showcase/studio/9ccd9cd9-328a-4e40-a91b-94e8499fcaca/model.glb",
    "createdAt": "2026-03-10 12:03:54.188+00"
  },
  {
    "id": "4ecf22ec-4cd3-448f-b829-549aad7aa48a",
    "kind": "booth-session",
    "label": "kshaveensilva2021@gmail.com",
    "thumbnailPath": "/showcase/booth/4ecf22ec-4cd3-448f-b829-549aad7aa48a/thumb.png",
    "glbPath": "/showcase/booth/4ecf22ec-4cd3-448f-b829-549aad7aa48a/model.glb",
    "createdAt": "2026-03-11 03:58:12.494+00",
    "sleepScore": 8,
    "arousal": 7,
    "valence": 7,
    "gender": "male",
    "ageBracket": "18-24",
    "device": "Mac",
    "timezone": "Asia/Singapore"
  },
  {
    "id": "ba80e98a-31ba-495b-b1fe-c49bc8c98d06",
    "kind": "booth-session",
    "label": "prasanth@ahlab.org",
    "thumbnailPath": "/showcase/booth/ba80e98a-31ba-495b-b1fe-c49bc8c98d06/thumb.png",
    "glbPath": "/showcase/booth/ba80e98a-31ba-495b-b1fe-c49bc8c98d06/model.glb",
    "createdAt": "2026-03-11 02:35:20.932+00",
    "sleepScore": 5,
    "arousal": 5,
    "valence": 5,
    "gender": null,
    "ageBracket": null,
    "device": "iPhone",
    "timezone": "Asia/Singapore"
  },
  {
    "id": "8b5d8ea8-8de7-4011-913c-5ed5b9052ebe",
    "kind": "booth-session",
    "label": "prasanth@ahlab.org",
    "thumbnailPath": "/showcase/booth/8b5d8ea8-8de7-4011-913c-5ed5b9052ebe/thumb.png",
    "glbPath": "/showcase/booth/8b5d8ea8-8de7-4011-913c-5ed5b9052ebe/model.glb",
    "createdAt": "2026-03-13 02:43:38.254+00",
    "sleepScore": 6,
    "arousal": 6,
    "valence": 5,
    "gender": "female",
    "ageBracket": "35-44",
    "device": "Mac",
    "timezone": "Asia/Tokyo"
  },
  {
    "id": "a2b2f9a1-3f39-44b9-be6c-66408f0054f0",
    "kind": "booth-session",
    "label": "prasanth@ahlab.org",
    "thumbnailPath": "/showcase/booth/a2b2f9a1-3f39-44b9-be6c-66408f0054f0/thumb.png",
    "glbPath": "/showcase/booth/a2b2f9a1-3f39-44b9-be6c-66408f0054f0/model.glb",
    "createdAt": "2026-03-11 03:42:53.699+00",
    "sleepScore": 7,
    "arousal": 6,
    "valence": 6,
    "gender": "male",
    "ageBracket": "35-44",
    "device": "Windows",
    "timezone": "Asia/Singapore"
  },
  {
    "id": "332ec0db-3b92-48e1-9d9f-d4f2a45733c8",
    "kind": "booth-session",
    "label": "dmdinithipurna@gmail.com",
    "thumbnailPath": "/showcase/booth/332ec0db-3b92-48e1-9d9f-d4f2a45733c8/thumb.png",
    "glbPath": "/showcase/booth/332ec0db-3b92-48e1-9d9f-d4f2a45733c8/model.glb",
    "createdAt": "2026-03-11 11:24:56.947+00",
    "sleepScore": 7,
    "arousal": 6,
    "valence": 6,
    "gender": "male",
    "ageBracket": "25-34",
    "device": "iPad",
    "timezone": "Asia/Singapore"
  }
];

export const STATS = {
  totals: {
  "signups": 11,
  "withDownload": 4,
  "withoutDownload": 7
},
  funnel: {
  "started": 21,
  "photoUploaded": 14,
  "bodyGenerated": 8,
  "completed": 4
},
  commandCounts: {
  "mic_on": 27,
  "start": 74,
  "mode": 195,
  "stop": 2,
  "reset": 5,
  "load_character": 2,
  "mic_off": 4,
  "say": 104
},
  modeDistribution: {
  "1": 80,
  "2": 68,
  "3": 47
},
  sayFrequency: [
  {
    "text": "Konichiwa!",
    "count": 22,
    "kind": "english"
  },
  {
    "text": "would_do_you_like_a_recommendation?",
    "count": 17,
    "kind": "english"
  },
  {
    "text": "do_you_agree_with_this_choice?",
    "count": 16,
    "kind": "english"
  },
  {
    "text": "thank_you_see_you_later",
    "count": 10,
    "kind": "preset"
  },
  {
    "text": "greeting",
    "count": 7,
    "kind": "preset"
  },
  {
    "text": "How_was_your_sleep?",
    "count": 5,
    "kind": "english"
  },
  {
    "text": "do_you_agree",
    "count": 4,
    "kind": "preset"
  },
  {
    "text": "ask_about_sleep",
    "count": 3,
    "kind": "preset"
  },
  {
    "text": "what_do_you_think",
    "count": 3,
    "kind": "preset"
  },
  {
    "text": "what_would_your_choice_be",
    "count": 3,
    "kind": "preset"
  },
  {
    "text": "The_recommendations_stay_the_same, only_the_visualizations_change",
    "count": 3,
    "kind": "english"
  },
  {
    "text": "こんにちは、はじめまして！",
    "count": 2,
    "kind": "japanese"
  },
  {
    "text": "デモを試していただきありがとうございます。またお会いしましょう",
    "count": 2,
    "kind": "japanese"
  },
  {
    "text": "okay_noted",
    "count": 2,
    "kind": "preset"
  },
  {
    "text": "do you agree with the suggestion?",
    "count": 1,
    "kind": "english"
  },
  {
    "text": "あなたならどれを選びますか？",
    "count": 1,
    "kind": "japanese"
  },
  {
    "text": "おすすめを提案するために、昨夜はよく眠れましたか？",
    "count": 1,
    "kind": "japanese"
  },
  {
    "text": "what would your choice be?",
    "count": 1,
    "kind": "english"
  },
  {
    "text": "Coffee",
    "count": 1,
    "kind": "english"
  }
],
  demographics: {
  "gender": {
    "male": 3,
    "female": 1
  },
  "ageBracket": {
    "18-24": 1,
    "35-44": 2,
    "25-34": 1
  },
  "device": {
    "Mac": 2,
    "iPhone": 1,
    "Windows": 1,
    "iPad": 1
  },
  "timezone": {
    "Asia/Singapore": 4,
    "Asia/Tokyo": 1
  }
},
  sessionAverages: {
  "sleep": 6.6,
  "arousal": 6,
  "valence": 5.8
},
};
