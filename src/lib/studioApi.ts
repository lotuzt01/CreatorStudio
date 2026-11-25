import {
  compileCharacterLockLocal,
  enhancePromptLocal,
  generateCharacterSceneLocal,
  generateDramaLocal,
  generatePodcastLocal,
  generateUgcLocal,
  generateVideoFlowLocal,
} from './staticStudioEngine';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export class StaticHostVoiceUnavailableError extends Error {
  readonly isStaticHostVoiceUnavailable = true;
  constructor() {
    super(
      'Backend Gemini 3.8 TTS belum terhubung pada hosting statis GitHub Pages. Menggunakan pembaca suara bawaan perangkat.'
    );
  }
}

function isStaticFallbackTrigger(status: number | null): boolean {
  if (status === 404 || status === 405) return true;
  if (status === null && !API_BASE_URL && typeof window !== 'undefined') {
    const host = window.location.hostname;
    return host.endsWith('.github.io') || host === '';
  }
  return false;
}

async function postJson<T>(
  url: string,
  body: Record<string, unknown>,
  staticFallback?: (payload: Record<string, unknown>) => T
): Promise<T> {
  const endpoint = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return (await res.json()) as T;
      }
      if (staticFallback) {
        return staticFallback(body);
      }
      throw new StaticHostVoiceUnavailableError();
    }

    if (isStaticFallbackTrigger(res.status)) {
      if (staticFallback) {
        return staticFallback(body);
      }
      if (url === '/api/ai/voice') {
        throw new StaticHostVoiceUnavailableError();
      }
    }

    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Permintaan gagal (${res.status})`);
  } catch (err) {
    if (err instanceof StaticHostVoiceUnavailableError) {
      throw err;
    }
    if (err instanceof TypeError && isStaticFallbackTrigger(null)) {
      if (staticFallback) {
        return staticFallback(body);
      }
      if (url === '/api/ai/voice') {
        throw new StaticHostVoiceUnavailableError();
      }
    }
    throw err;
  }
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
    postJson<CompileLockResponse>(
      '/api/ai/character-engine',
      { mode: 'compile_lock', character },
      compileCharacterLockLocal
    ),

  generateCharacterScene: (payload: Record<string, unknown>) =>
    postJson<CharacterSceneResponse>(
      '/api/ai/character-engine',
      { mode: 'scene_pack', ...payload },
      generateCharacterSceneLocal
    ),

  generateVideoFlow: (payload: Record<string, unknown>) =>
    postJson<VideoFlowResponse>('/api/ai/video-flow', payload, generateVideoFlowLocal),

  generateUgc: (payload: Record<string, unknown>) =>
    postJson<UgcResponse>('/api/ai/ugc', payload, generateUgcLocal),

  generateDrama: (payload: Record<string, unknown>) =>
    postJson<DramaResponse>('/api/ai/drama', payload, generateDramaLocal),

  generatePodcast: (payload: Record<string, unknown>) =>
    postJson<PodcastResponse>('/api/ai/podcast', payload, generatePodcastLocal),

  generateVoice: (payload: Record<string, unknown>) =>
    postJson<VoiceResponse>('/api/ai/voice', payload),

  enhancePrompt: (payload: Record<string, unknown>) =>
    postJson<PromptEnhanceResponse>('/api/ai/prompt-enhance', payload, enhancePromptLocal),
};
