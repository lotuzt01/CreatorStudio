async function postJson<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Permintaan gagal (${res.status})`);
  }
  return data as T;
}

export interface CompileLockResponse {
  identityLockPrompt: string;
  turnaroundPrompts: { label: string; prompt: string }[];
  consistencyRules: string[];
}

export interface CharacterSceneResponse {
  imagePrompt: string;
  videoMotionPrompt: string;
  negativePrompt: string;
  continuityChecklist: string[];
}

export interface VideoFlowResponse {
  flowMasterPrompt: string;
  startFramePrompt: string;
  motionTimeline: { window: string; direction: string }[];
  audioAmbience: string;
  negativeConstraints: string;
}

export interface UgcResponse {
  hooks: string[];
  script: string;
  scenes: {
    timecode: string;
    visualAction: string;
    dialogue: string;
    imagePrompt: string;
    videoPrompt: string;
  }[];
  caption: string;
  hashtags: string[];
  callToAction: string;
}

export interface DramaResponse {
  episodeTitle: string;
  logline: string;
  continuityGuide: string;
  scenes: {
    sceneNumber: number;
    heading: string;
    location: string;
    actionSummary: string;
    dialogue: string;
    cameraDirection: string;
    imagePrompt: string;
    videoPrompt: string;
  }[];
}

export interface PodcastResponse {
  episodeTitle: string;
  showNotes: string;
  turns: { speaker: string; style: string; line: string }[];
  visualStudioPrompt: string;
}

export interface VoiceResponse {
  audioDataUrl: string;
  mimeType: string;
  model: string;
}

export interface PromptEnhanceResponse {
  title: string;
  masterPrompt: string;
  variationPrompt: string;
  negativePrompt: string;
  notes: string;
}

export const studioApi = {
  compileCharacterLock: (character: Record<string, unknown>) =>
    postJson<CompileLockResponse>('/api/ai/character-engine', {
      mode: 'compile_lock',
      character,
    }),

  generateCharacterScene: (payload: Record<string, unknown>) =>
    postJson<CharacterSceneResponse>('/api/ai/character-engine', {
      mode: 'scene_pack',
      ...payload,
    }),

  generateVideoFlow: (payload: Record<string, unknown>) =>
    postJson<VideoFlowResponse>('/api/ai/video-flow', payload),

  generateUgc: (payload: Record<string, unknown>) =>
    postJson<UgcResponse>('/api/ai/ugc', payload),

  generateDrama: (payload: Record<string, unknown>) =>
    postJson<DramaResponse>('/api/ai/drama', payload),

  generatePodcast: (payload: Record<string, unknown>) =>
    postJson<PodcastResponse>('/api/ai/podcast', payload),

  generateVoice: (payload: Record<string, unknown>) =>
    postJson<VoiceResponse>('/api/ai/voice', payload),

  enhancePrompt: (payload: Record<string, unknown>) =>
    postJson<PromptEnhanceResponse>('/api/ai/prompt-enhance', payload),
};
