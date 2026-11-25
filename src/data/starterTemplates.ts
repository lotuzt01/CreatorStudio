import type { StudioCharacter, StudioProject } from '../types/studio';

const BASE_URL = import.meta.env.BASE_URL || '/';

export const STUDIO_COVER_IMAGE = `${BASE_URL}src/assets/images/studio_storyboard_cover_1795596653557.jpg`;
export const NOMIGOSI_REFERENCE_IMAGE = `${BASE_URL}assets/aistudio/file_00000000aec48207806bc5c5d0c15bae_9bcbe279.png`;

export function resolveCharacterImageUrl(url: string): string {
  const trimmed = (url || '').trim();
  if (!trimmed) return '';
  if (trimmed.includes('char_ref_nomigosi_1795596652179.jpg')) {
    return NOMIGOSI_REFERENCE_IMAGE;
  }
  return trimmed;
}

export function isMultiPanelSheet(url: string): boolean {
  return url.includes('file_00000000aec48207806bc5c5d0c15bae_9bcbe279.png');
}

export interface CharacterTemplate {
  templateId: string;
  name: string;
  archetype: string;
  visualStyle: StudioCharacter['visualStyle'];
  faceDescription: string;
  hairAndWardrobe: string;
  bodyAndTraits: string;
  signatureOutfit: string;
  consistencyCode: string;
  identityLocked: boolean;
  identityLockPrompt: string;
  referenceImageUrl: string;
}

export const STARTER_CHARACTER_TEMPLATES: CharacterTemplate[] = [
  {
    templateId: 'tpl_nomigosi',
    name: 'Nomigosi',
    archetype: 'Tech Presenter & AI Influencer',
    visualStyle: 'Stylized',
    faceDescription:
      'Pria akhir 20-an ramah dan ekspresif, alis tegas terawat, mata cokelat hangat, senyum percaya diri, janggut tipis rapi, kulit halus bergaya 3D semi-realistis modern.',
    hairAndWardrobe:
      'Rambut hitam gelap tebal bervolume disisir rapi ke samping atas, gaya tech creator modern.',
    bodyAndTraits:
      'Postur tegap energik, gestur tangan ekspresif saat menjelaskan alur AI, automasi, dan data di depan kamera studio.',
    signatureOutfit:
      'Jaket bomber kulit navy gelap dengan grafis sirkuit dan logo N neon cyan menyala di dada kiri serta lengan, dipadukan kaus hitam polos.',
    consistencyCode: 'LOTUZT_NOMIGOSI_01',
    identityLocked: true,
    identityLockPrompt:
      'Consistent identity LOTUZT_NOMIGOSI_01: Modern stylized 3D semi-realistic male tech presenter in his late 20s, expressive warm brown eyes, neatly groomed thick dark eyebrows, voluminous dark swept-back hair, light trimmed stubble, confident welcoming smile, wearing a dark navy leather bomber jacket with glowing cyan neon "N" circuit node emblem on left chest and illuminated cyan analytics chart graphics on sleeves over a matte black crew-neck t-shirt, bright modern creator studio with workflow diagram monitor and warm wooden shelves.',
    referenceImageUrl: NOMIGOSI_REFERENCE_IMAGE,
  },
  {
    templateId: 'tpl_aria',
    name: 'Aria Kirana',
    archetype: 'UGC & Lifestyle Host',
    visualStyle: 'Editorial',
    faceDescription:
      'Perempuan Indonesia pertengahan 20-an, senyum ramah autentik, tulang pipi lembut, riasan natural dewy, kontak mata ekspresif.',
    hairAndWardrobe:
      'Rambut hitam bergelombang sebahu, anting hoop emas kecil, kalung rantai tipis berlapis.',
    bodyAndTraits:
      'Energi hangat, ekspresif, sangat natural saat mereview produk skincare dan gaya hidup di depan kamera vertikal.',
    signatureOutfit: 'Blazer linen ivory potongan clean di atas inner putih minimalis.',
    consistencyCode: 'LOTUZT_ARIA_02',
    identityLocked: true,
    identityLockPrompt:
      'Consistent identity LOTUZT_ARIA_02: Photorealistic Indonesian female UGC creator in her mid 20s, warm authentic smile, natural dewy skin texture, shoulder-length dark wavy hair, small gold hoop earrings, wearing a clean tailored ivory linen blazer over white minimalist top, soft diffused 50mm studio lighting.',
    referenceImageUrl: `${BASE_URL}src/assets/images/char_ref_aria_1795596652412.jpg`,
  },
  {
    templateId: 'tpl_kairo',
    name: 'Kairo',
    archetype: 'Protagonis AI Drama',
    visualStyle: 'Cinematic',
    faceDescription:
      'Pria Asia Tenggara awal 30-an, ekspresi kontemplatif intens, sorot mata tajam, garis wajah tegas dengan bayangan dramatis.',
    hairAndWardrobe:
      'Rambut hitam sedikit berantakan natural jatuh ke dahi, aura misterius film neo-noir.',
    bodyAndTraits:
      'Tinggi ramping, gerak tubuh tenang dan penuh ketegangan emosional untuk adegan film pendek.',
    signatureOutfit: 'Mantel wol arang gelap berlapis turtleneck hitam pekat.',
    consistencyCode: 'LOTUZT_KAIRO_03',
    identityLocked: true,
    identityLockPrompt:
      'Consistent identity LOTUZT_KAIRO_03: Cinematic Southeast Asian male drama protagonist in his early 30s, intense contemplative gaze, slightly tousled dark hair, subtle stubble, wearing a tailored dark charcoal wool overcoat over a black knit turtleneck, moody 35mm anamorphic film aesthetic with directional window light.',
    referenceImageUrl: `${BASE_URL}src/assets/images/char_ref_kairo_1795596653857.jpg`,
  },
];

export const DEFAULT_LOCAL_PROJECTS: StudioProject[] = [
  {
    id: 'demo_proj_influencer',
    ownerId: 'local_preview',
    title: 'Serial Konten Tech Presenter Nomigosi',
    category: 'Influencer',
    description:
      'Produksi video pendek edukasi AI & teknologi berformat vertikal dengan karakter terkunci Nomigosi.',
    aspectRatio: '9:16',
    targetPlatform: 'TikTok & Reels',
    status: 'in_progress',
    createdAtMs: Date.now() - 86400000 * 2,
    updatedAtMs: Date.now() - 3600000 * 4,
  },
  {
    id: 'demo_proj_ugc',
    ownerId: 'local_preview',
    title: 'Kampanye UGC Serum Kulit Q4',
    category: 'UGC',
    description:
      'Paket hook, naskah review jujur, dan storyboard visual menggunakan presenter virtual Aria Kirana.',
    aspectRatio: '9:16',
    targetPlatform: 'Instagram Reels',
    status: 'draft',
    createdAtMs: Date.now() - 86400000,
    updatedAtMs: Date.now() - 3600000 * 2,
  },
];
