export type ProjectCategory =
  | 'UGC'
  | 'AI Drama'
  | 'Influencer'
  | 'Podcast'
  | 'Social Media'
  | 'Ads';

export type AspectRatio = '9:16' | '16:9' | '1:1' | '3:4';

export type ProjectStatus = 'draft' | 'in_progress' | 'completed';

export type VisualStyle = 'Photorealistic' | 'Cinematic' | 'Editorial' | 'Stylized';

export type PromptModule =
  | 'character_engine'
  | 'video_flow'
  | 'ugc_studio'
  | 'drama_studio'
  | 'podcast_studio'
  | 'prompt_lab';

export interface StudioProject {
  id: string;
  ownerId: string;
  title: string;
  category: ProjectCategory;
  description: string;
  aspectRatio: AspectRatio;
  targetPlatform: string;
  status: ProjectStatus;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface StudioCharacter {
  id: string;
  ownerId: string;
  projectId: string;
  name: string;
  archetype: string;
  visualStyle: VisualStyle;
  faceDescription: string;
  hairAndWardrobe: string;
  bodyAndTraits: string;
  signatureOutfit: string;
  consistencyCode: string;
  identityLocked: boolean;
  identityLockPrompt: string;
  referenceImageUrl: string;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface StudioPromptRecord {
  id: string;
  ownerId: string;
  projectId: string;
  characterId: string;
  module: PromptModule;
  title: string;
  promptText: string;
  secondaryOutput: string;
  tags: string[];
  createdAtMs: number;
  updatedAtMs: number;
}

export interface VoiceRenderItem {
  id: string;
  title: string;
  mode: 'single' | 'dual';
  model: string;
  audioDataUrl: string;
  createdAtMs: number;
}

export type ActiveView =
  | 'dashboard'
  | 'projects'
  | 'character_engine'
  | 'video_flow'
  | 'ugc_studio'
  | 'drama_studio'
  | 'podcast_studio'
  | 'voice_studio'
  | 'prompt_library';

export interface PodcastTurn {
  speaker: string;
  style: string;
  line: string;
}

export interface PendingVoiceTransfer {
  mode: 'single' | 'dual';
  title: string;
  text?: string;
  style?: string;
  speakerA?: string;
  speakerB?: string;
  turns?: PodcastTurn[];
}
