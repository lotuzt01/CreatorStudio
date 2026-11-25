import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

function getGeminiClient(apiVersion?: 'v1beta'): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY belum dikonfigurasi pada server.');
  }
  return new GoogleGenAI({
    apiKey,
    ...(apiVersion ? { apiVersion } : {}),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function sanitizeText(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

function parseJsonResponse<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    return { ...fallback, ...(JSON.parse(cleaned) as Partial<T>) };
  } catch {
    return fallback;
  }
}

async function withGeminiRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isTransient =
        msg.includes('503') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('high demand') ||
        msg.includes('ECONNRESET') ||
        msg.includes('fetch failed');
      if (!isTransient || attempt === maxRetries) {
        throw err;
      }
      const delayMs = 700 * Math.pow(2, attempt) + Math.floor(Math.random() * 250);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

function formatReadableError(rawMessage: string, fallbackMessage: string): string {
  try {
    const parsed = JSON.parse(rawMessage);
    const inner = parsed?.error;
    if (inner?.code === 503 || inner?.status === 'UNAVAILABLE') {
      return 'Server Gemini sedang sibuk sementara (503). Silakan klik ulang beberapa detik lagi.';
    }
    if (inner?.code === 429 || inner?.status === 'RESOURCE_EXHAUSTED') {
      return 'Batas kuota permintaan Gemini tercapai sementara. Coba lagi sebentar lagi.';
    }
    if (inner?.message) return String(inner.message);
  } catch {
    // Raw message is plain text
  }
  if (rawMessage.includes('503') || rawMessage.includes('UNAVAILABLE')) {
    return 'Server Gemini sedang sibuk sementara (503). Silakan klik ulang beberapa detik lagi.';
  }
  return rawMessage || fallbackMessage;
}

function handleApiError(res: express.Response, err: unknown, fallbackMessage: string) {
  console.error('[JAJA AI Studio API Error]', err);
  const rawMessage = err instanceof Error ? err.message : fallbackMessage;
  const status =
    rawMessage.includes('API_KEY_INVALID') || rawMessage.includes('401')
      ? 401
      : rawMessage.includes('RESOURCE_EXHAUSTED') || rawMessage.includes('429')
        ? 429
        : rawMessage.includes('PERMISSION_DENIED') || rawMessage.includes('403')
          ? 403
          : rawMessage.includes('503') || rawMessage.includes('UNAVAILABLE')
            ? 503
            : 500;
  res.status(status).json({ error: formatReadableError(rawMessage, fallbackMessage) });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '4mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'jaja-ai-creator-studio' });
  });

  // 1. Character Intelligence Engine — Identity Lock Compilation + Pose/Expression/Scene Generator
  app.post('/api/ai/character-engine', async (req, res) => {
    try {
      const ai = getGeminiClient();
      const mode = sanitizeText(req.body?.mode, 40) || 'scene_pack';
      const character = req.body?.character || {};
      const name = sanitizeText(character.name, 100);
      const archetype = sanitizeText(character.archetype, 100);
      const visualStyle = sanitizeText(character.visualStyle, 60) || 'Photorealistic';
      const faceDescription = sanitizeText(character.faceDescription, 800);
      const hairAndWardrobe = sanitizeText(character.hairAndWardrobe, 800);
      const bodyAndTraits = sanitizeText(character.bodyAndTraits, 800);
      const signatureOutfit = sanitizeText(character.signatureOutfit, 500);
      const consistencyCode = sanitizeText(character.consistencyCode, 64);
      const existingLockPrompt = sanitizeText(character.identityLockPrompt, 3000);

      if (!name) {
        return res.status(400).json({ error: 'Nama karakter wajib diisi.' });
      }

      if (mode === 'compile_lock') {
        const prompt = `Susun Character Identity Lock Master Specification untuk menjaga konsistensi wajah, rambut, tubuh, dan gaya visual karakter AI lintas gambar dan video.
Data Karakter:
- Nama: ${name}
- Archetype / Peran: ${archetype}
- Visual Style: ${visualStyle}
- Deskripsi Wajah: ${faceDescription}
- Rambut & Detail Gaya: ${hairAndWardrobe}
- Bentuk Tubuh & Ciri Khas: ${bodyAndTraits}
- Pakaian Signature: ${signatureOutfit}
- Consistency Code: ${consistencyCode}

Kembalikan JSON dengan SEMUA field terisi lengkap:
1. identityLockPrompt: paragraf bahasa Inggris teknis yang sangat presisi (120-200 kata) siap dipakai sebagai anchor identitas di generator gambar & video AI.
2. turnaroundPrompts: tepat 3 prompt singkat (Front Studio Portrait, 3/4 Side Profile, Full Body Reference Sheet) dalam bahasa Inggris dengan identitas terkunci.
3. consistencyRules: tepat 4 poin aturan kontinuitas visual dalam Bahasa Indonesia.`;

        const response = await withGeminiRetry(() =>
          ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: prompt,
            config: {
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                required: ['identityLockPrompt', 'turnaroundPrompts', 'consistencyRules'],
                properties: {
                  identityLockPrompt: { type: Type.STRING },
                  turnaroundPrompts: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      required: ['label', 'prompt'],
                      properties: {
                        label: { type: Type.STRING },
                        prompt: { type: Type.STRING },
                      },
                    },
                  },
                  consistencyRules: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
              },
            },
          })
        );

        const parsed = parseJsonResponse(response.text, {
          identityLockPrompt: '',
          turnaroundPrompts: [],
          consistencyRules: [],
        });
        return res.json(parsed);
      }

      // Default mode: Pose, Expression, Outfit & Scene Generator
      const pose = sanitizeText(req.body?.pose, 200) || 'Medium shot berbicara ke kamera';
      const expression = sanitizeText(req.body?.expression, 200) || 'Tenang dan percaya diri';
      const outfitOverride = sanitizeText(req.body?.outfitOverride, 300) || signatureOutfit;
      const sceneLocation =
        sanitizeText(req.body?.sceneLocation, 300) ||
        'Studio editorial modern dengan pencahayaan sinematik';
      const cameraLighting =
        sanitizeText(req.body?.cameraLighting, 250) ||
        '85mm lens, soft key light, subtle rim lighting';
      const aspectRatio = sanitizeText(req.body?.aspectRatio, 20) || '9:16';

      const scenePrompt = `Anda adalah Lead Character Continuity Director di JAJA AI Creator Studio.
Gunakan Character Identity Lock berikut agar wajah, struktur tulang pipi, gaya rambut, warna kulit, dan ciri fisik karakter tetap 100% konsisten pada adegan baru.

IDENTITAS KARAKTER TERKUNCI:
- Nama: ${name} (${consistencyCode})
- Archetype: ${archetype}
- Gaya Visual: ${visualStyle}
- Identity Lock Anchor: ${existingLockPrompt || `${faceDescription}. ${hairAndWardrobe}. ${bodyAndTraits}.`}

PARAMETER ADEGAN BARU:
- Pose: ${pose}
- Ekspresi: ${expression}
- Variasi Pakaian: ${outfitOverride}
- Lokasi & Latar: ${sceneLocation}
- Kamera & Pencahayaan: ${cameraLighting}
- Aspect Ratio: ${aspectRatio}

Kembalikan JSON dengan SEMUA field terisi lengkap:
- imagePrompt: prompt bahasa Inggris siap pakai untuk generator gambar (Midjourney / Imagen / Nano Banana), menyertakan identity lock anchor, pose, ekspresi, pakaian, lokasi, lensa, pencahayaan, dan rasio aspek.
- videoMotionPrompt: prompt bahasa Inggris khusus Google Flow / Video AI lengkap dengan pergerakan kamera, micro-expression, gerakan tubuh natural, dan instruksi menjaga konsistensi wajah.
- negativePrompt: daftar elemen yang harus dihindari agar identitas tidak bergeser.
- continuityChecklist: 4 poin verifikasi kontinuitas dalam Bahasa Indonesia.`;

      const response = await withGeminiRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: scenePrompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              required: ['imagePrompt', 'videoMotionPrompt', 'negativePrompt', 'continuityChecklist'],
              properties: {
                imagePrompt: { type: Type.STRING },
                videoMotionPrompt: { type: Type.STRING },
                negativePrompt: { type: Type.STRING },
                continuityChecklist: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
            },
          },
        })
      );

      const parsed = parseJsonResponse(response.text, {
        imagePrompt: '',
        videoMotionPrompt: '',
        negativePrompt: '',
        continuityChecklist: [],
      });
      return res.json(parsed);
    } catch (err) {
      handleApiError(res, err, 'Gagal memproses Character Intelligence Engine.');
    }
  });

  // 2. AI Video & Google Flow Prompt Studio
  app.post('/api/ai/video-flow', async (req, res) => {
    try {
      const ai = getGeminiClient();
      const characterName = sanitizeText(req.body?.characterName, 120) || 'Presenter Utama';
      const characterLock = sanitizeText(req.body?.characterLock, 2500);
      const location = sanitizeText(req.body?.location, 300);
      const activity = sanitizeText(req.body?.activity, 500);
      const shotType = sanitizeText(req.body?.shotType, 100) || 'Medium shot';
      const cameraMotion = sanitizeText(req.body?.cameraMotion, 120) || 'Slow dolly in';
      const expression = sanitizeText(req.body?.expression, 150) || 'Tenang dan percaya diri';
      const lighting = sanitizeText(req.body?.lighting, 150) || 'Cinematic';
      const duration = sanitizeText(req.body?.duration, 30) || '8s';
      const aspectRatio = sanitizeText(req.body?.aspectRatio, 20) || '9:16';

      if (!location && !activity) {
        return res.status(400).json({ error: 'Isi lokasi atau aktivitas adegan terlebih dahulu.' });
      }

      const prompt = `Anda adalah Director of Photography & AI Video Prompt Architect untuk Google Flow dan generator video sinematik.
Susun paket produksi prompt video yang presisi dari parameter berikut:
- Karakter: ${characterName}
- Character Identity Lock: ${characterLock || 'Tidak dikunci (gunakan deskripsi natural yang konsisten)'}
- Lokasi: ${location}
- Aktivitas / Aksi: ${activity}
- Jenis Shot Kamera: ${shotType}
- Gerakan Kamera: ${cameraMotion}
- Ekspresi: ${expression}
- Pencahayaan: ${lighting}
- Durasi Target: ${duration}
- Aspect Ratio: ${aspectRatio}

Kembalikan JSON dengan SEMUA field terisi lengkap:
- flowMasterPrompt: prompt utama bahasa Inggris yang terstruktur untuk Google Flow (subjek + identity lock + aksi + pergerakan kamera + lighting + atmosfer + durasi + aspect ratio).
- startFramePrompt: prompt gambar bahasa Inggris untuk frame awal (image-to-video anchor).
- motionTimeline: array 3 segmen waktu (mis. 0-3s, 3-6s, 6-8s) menjelaskan perubahan gerak & ekspresi dalam Bahasa Indonesia.
- audioAmbience: saran desain suara / ambience singkat dalam Bahasa Indonesia.
- negativeConstraints: daftar hal yang harus dihindari agar video bebas distorsi.`;

      const response = await withGeminiRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              required: [
                'flowMasterPrompt',
                'startFramePrompt',
                'motionTimeline',
                'audioAmbience',
                'negativeConstraints',
              ],
              properties: {
                flowMasterPrompt: { type: Type.STRING },
                startFramePrompt: { type: Type.STRING },
                motionTimeline: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    required: ['window', 'direction'],
                    properties: {
                      window: { type: Type.STRING },
                      direction: { type: Type.STRING },
                    },
                  },
                },
                audioAmbience: { type: Type.STRING },
                negativeConstraints: { type: Type.STRING },
              },
            },
          },
        })
      );

      const parsed = parseJsonResponse(response.text, {
        flowMasterPrompt: '',
        startFramePrompt: '',
        motionTimeline: [],
        audioAmbience: '',
        negativeConstraints: '',
      });
      return res.json(parsed);
    } catch (err) {
      handleApiError(res, err, 'Gagal menghasilkan prompt Video Flow.');
    }
  });

  // 3. AI UGC & Ads Studio
  app.post('/api/ai/ugc', async (req, res) => {
    try {
      const ai = getGeminiClient();
      const productName = sanitizeText(req.body?.productName, 160);
      const productDescription = sanitizeText(req.body?.productDescription, 1000);
      const targetAudience = sanitizeText(req.body?.targetAudience, 250);
      const presenterName = sanitizeText(req.body?.presenterName, 120) || 'Kreator UGC';
      const presenterLock = sanitizeText(req.body?.presenterLock, 2000);
      const promoType = sanitizeText(req.body?.promoType, 100) || 'Review Jujur';
      const language = sanitizeText(req.body?.language, 60) || 'Bahasa Indonesia';
      const duration = sanitizeText(req.body?.duration, 40) || '30 detik';
      const deliveryStyle =
        sanitizeText(req.body?.deliveryStyle, 120) || 'Natural, relatable, seperti rekomendasi teman';

      if (!productName) {
        return res.status(400).json({ error: 'Nama produk wajib diisi.' });
      }

      const prompt = `Anda adalah Creative Strategist UGC & Performance Ads untuk TikTok, Reels, dan Shorts.
Buat paket produksi UGC lengkap untuk:
- Nama Produk: ${productName}
- Deskripsi & Keunggulan Produk: ${productDescription}
- Target Audiens: ${targetAudience}
- Karakter Presenter: ${presenterName}
- Identity Lock Presenter: ${presenterLock || 'Kreator autentik di home studio'}
- Jenis Promosi: ${promoType}
- Bahasa Naskah: ${language}
- Durasi: ${duration}
- Gaya Penyampaian: ${deliveryStyle}

Kembalikan JSON dengan SEMUA field terisi lengkap:
- hooks: 3 opsi hook 3 detik pertama yang kuat.
- script: naskah lengkap presenter siap dibacakan (natural, tidak kaku).
- scenes: array 4 adegan berisi timecode, visualAction, dialogue, imagePrompt (bahasa Inggris dengan identity lock), dan videoPrompt (bahasa Inggris untuk Google Flow).
- caption: caption media sosial siap posting.
- hashtags: array 6 hashtag relevan.
- callToAction: kalimat CTA penutup yang persuasif.`;

      const response = await withGeminiRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              required: ['hooks', 'script', 'scenes', 'caption', 'hashtags', 'callToAction'],
              properties: {
                hooks: { type: Type.ARRAY, items: { type: Type.STRING } },
                script: { type: Type.STRING },
                scenes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    required: ['timecode', 'visualAction', 'dialogue', 'imagePrompt', 'videoPrompt'],
                    properties: {
                      timecode: { type: Type.STRING },
                      visualAction: { type: Type.STRING },
                      dialogue: { type: Type.STRING },
                      imagePrompt: { type: Type.STRING },
                      videoPrompt: { type: Type.STRING },
                    },
                  },
                },
                caption: { type: Type.STRING },
                hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                callToAction: { type: Type.STRING },
              },
            },
          },
        })
      );

      const parsed = parseJsonResponse(response.text, {
        hooks: [],
        script: '',
        scenes: [],
        caption: '',
        hashtags: [],
        callToAction: '',
      });
      return res.json(parsed);
    } catch (err) {
      handleApiError(res, err, 'Gagal menghasilkan paket konten UGC.');
    }
  });

  // 4. AI Drama & Storyboard Studio (with Character Continuity)
  app.post('/api/ai/drama', async (req, res) => {
    try {
      const ai = getGeminiClient();
      const storyIdea = sanitizeText(req.body?.storyIdea, 1200);
      const genre = sanitizeText(req.body?.genre, 80) || 'Drama Sinematik';
      const sceneCount = Math.min(Math.max(Number(req.body?.sceneCount) || 4, 2), 6);
      const castSummary = sanitizeText(req.body?.castSummary, 2500) || 'Tokoh utama tunggal';
      const visualTone =
        sanitizeText(req.body?.visualTone, 150) || '35mm anamorphic film, moody natural lighting';

      if (!storyIdea) {
        return res.status(400).json({ error: 'Ide cerita wajib diisi.' });
      }

      const prompt = `Anda adalah Showrunner & Storyboard Director untuk AI Drama Studio.
Rancang episode drama pendek dengan Character Continuity yang ketat di setiap adegan.
- Ide Cerita: ${storyIdea}
- Genre: ${genre}
- Jumlah Adegan: ${sceneCount}
- Daftar Cast & Identity Lock: ${castSummary}
- Tone Visual & Sinematografi: ${visualTone}

Kembalikan JSON dengan SEMUA field terisi lengkap:
- episodeTitle: judul episode yang kuat.
- logline: ringkasan 1-2 kalimat.
- continuityGuide: panduan singkat menjaga kontinuitas kostum, pencahayaan, dan ekspresi karakter lintas adegan.
- scenes: array tepat ${sceneCount} objek adegan berisi:
  - sceneNumber (integer)
  - heading (mis. INT. STUDIO MALAM)
  - location (deskripsi lokasi)
  - actionSummary (aksi dramatis)
  - dialogue (dialog singkat antar karakter atau monolog)
  - cameraDirection (shot size & pergerakan kamera)
  - imagePrompt (bahasa Inggris, menyertakan deskripsi karakter terkunci untuk storyboard frame)
  - videoPrompt (bahasa Inggris untuk Google Flow / Video AI)`;

      const response = await withGeminiRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              required: ['episodeTitle', 'logline', 'continuityGuide', 'scenes'],
              properties: {
                episodeTitle: { type: Type.STRING },
                logline: { type: Type.STRING },
                continuityGuide: { type: Type.STRING },
                scenes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    required: [
                      'sceneNumber',
                      'heading',
                      'location',
                      'actionSummary',
                      'dialogue',
                      'cameraDirection',
                      'imagePrompt',
                      'videoPrompt',
                    ],
                    properties: {
                      sceneNumber: { type: Type.INTEGER },
                      heading: { type: Type.STRING },
                      location: { type: Type.STRING },
                      actionSummary: { type: Type.STRING },
                      dialogue: { type: Type.STRING },
                      cameraDirection: { type: Type.STRING },
                      imagePrompt: { type: Type.STRING },
                      videoPrompt: { type: Type.STRING },
                    },
                  },
                },
              },
            },
          },
        })
      );

      const parsed = parseJsonResponse(response.text, {
        episodeTitle: '',
        logline: '',
        continuityGuide: '',
        scenes: [],
      });
      return res.json(parsed);
    } catch (err) {
      handleApiError(res, err, 'Gagal membuat naskah & storyboard AI Drama.');
    }
  });

  // 5. AI Podcast Studio
  app.post('/api/ai/podcast', async (req, res) => {
    try {
      const ai = getGeminiClient();
      const topic = sanitizeText(req.body?.topic, 600);
      const format = sanitizeText(req.body?.format, 40) === 'solo' ? 'solo' : 'dual';
      const hostName = sanitizeText(req.body?.hostName, 80) || 'Raka';
      const guestName = sanitizeText(req.body?.guestName, 80) || 'Nadia';
      const tone = sanitizeText(req.body?.tone, 150) || 'Santai, cerdas, dan mengalir';
      const language = sanitizeText(req.body?.language, 60) || 'Bahasa Indonesia';

      if (!topic) {
        return res.status(400).json({ error: 'Topik podcast wajib diisi.' });
      }

      const prompt = `Anda adalah Producer & Script Writer untuk AI Podcast Studio.
Tulis naskah podcast pendek siap rekam (durasi baca ~45-60 detik) dalam ${language}.
- Topik: ${topic}
- Format: ${format === 'dual' ? `Dialog 2 Pembicara (${hostName} & ${guestName})` : `Monolog Solo (${hostName})`}
- Gaya / Tone: ${tone}

Kembalikan JSON dengan SEMUA field terisi lengkap:
- episodeTitle: judul episode podcast.
- showNotes: ringkasan singkat episode (2-3 kalimat).
- turns: array 4-6 giliran bicara. Setiap item memiliki:
  - speaker: nama pembicara (${format === 'dual' ? `harus tepat "${hostName}" atau "${guestName}"` : `harus "${hostName}"`})
  - style: arahan gaya suara singkat dalam bahasa Inggris (mis. "Warm, enthusiastic podcast host")
  - line: kalimat yang diucapkan (untuk format dual boleh menyisipkan natural cues seperti <breath> atau |yeah| seperlunya).
- visualStudioPrompt: prompt bahasa Inggris untuk visual studio podcast (untuk thumbnail atau video podcast).`;

      const response = await withGeminiRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              required: ['episodeTitle', 'showNotes', 'turns', 'visualStudioPrompt'],
              properties: {
                episodeTitle: { type: Type.STRING },
                showNotes: { type: Type.STRING },
                turns: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    required: ['speaker', 'style', 'line'],
                    properties: {
                      speaker: { type: Type.STRING },
                      style: { type: Type.STRING },
                      line: { type: Type.STRING },
                    },
                  },
                },
                visualStudioPrompt: { type: Type.STRING },
              },
            },
          },
        })
      );

      const parsed = parseJsonResponse(response.text, {
        episodeTitle: '',
        showNotes: '',
        turns: [],
        visualStudioPrompt: '',
      });
      return res.json(parsed);
    } catch (err) {
      handleApiError(res, err, 'Gagal membuat naskah AI Podcast.');
    }
  });

  // 6. AI Voice Studio (Real Gemini 3.8 TTS Audio Synthesis via v1beta)
  app.post('/api/ai/voice', async (req, res) => {
    try {
      const ai = getGeminiClient('v1beta');
      const mode = sanitizeText(req.body?.mode, 30) === 'dual' ? 'dual' : 'single';
      const allowedVoices = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];

      if (mode === 'dual') {
        const speakerA = sanitizeText(req.body?.speakerA, 60) || 'Raka';
        const speakerB = sanitizeText(req.body?.speakerB, 60) || 'Nadia';
        const voiceA = allowedVoices.includes(req.body?.voiceA) ? req.body.voiceA : 'Puck';
        const voiceB = allowedVoices.includes(req.body?.voiceB) ? req.body.voiceB : 'Kore';
        const turns = Array.isArray(req.body?.turns) ? req.body.turns.slice(0, 10) : [];

        if (turns.length === 0) {
          return res.status(400).json({ error: 'Masukkan minimal satu baris dialog untuk dual-speaker.' });
        }

        const parts = turns.map((t: { speaker?: string; style?: string; line?: string }) => {
          const spk = sanitizeText(t.speaker, 60) === speakerB ? speakerB : speakerA;
          const line = sanitizeText(t.line, 800);
          const style = sanitizeText(t.style, 150) || 'Natural conversational podcast speaker';
          return {
            text: `${spk}: ${line}`,
            speechMetadata: {
              speaker: spk,
              style,
            },
          };
        });

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash-tts',
          contents: [{ role: 'user', parts }],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              multiSpeakerVoiceConfig: {
                speakerVoiceConfigs: [
                  {
                    speaker: speakerA,
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceA } },
                  },
                  {
                    speaker: speakerB,
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceB } },
                  },
                ],
              },
            },
          },
        });

        const audioPart = response.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
        const base64Audio = audioPart?.inlineData?.data;
        const mimeType = audioPart?.inlineData?.mimeType || 'audio/wav';
        if (!base64Audio) {
          return res.status(502).json({ error: 'Model TTS tidak mengembalikan data audio.' });
        }
        return res.json({
          audioDataUrl: `data:${mimeType};base64,${base64Audio}`,
          mimeType,
          model: 'gemini-3.8-flash-tts',
        });
      }

      // Single-speaker narration
      const text = sanitizeText(req.body?.text, 2500);
      const voiceName = allowedVoices.includes(req.body?.voiceName) ? req.body.voiceName : 'Kore';
      const style = sanitizeText(req.body?.style, 200) || 'Clear, warm, professional creator narrator';

      if (!text) {
        return res.status(400).json({ error: 'Teks narasi wajib diisi.' });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text,
                speechMetadata: { style },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const audioPart = response.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
      const base64Audio = audioPart?.inlineData?.data;
      const mimeType = audioPart?.inlineData?.mimeType || 'audio/wav';
      if (!base64Audio) {
        return res.status(502).json({ error: 'Model TTS tidak mengembalikan data audio.' });
      }

      return res.json({
        audioDataUrl: `data:${mimeType};base64,${base64Audio}`,
        mimeType,
        model: 'gemini-3.8-flash-lite-tts',
      });
    } catch (err) {
      handleApiError(res, err, 'Gagal menghasilkan audio suara AI.');
    }
  });

  // 7. Prompt Engineering & Script Assistant
  app.post('/api/ai/prompt-enhance', async (req, res) => {
    try {
      const ai = getGeminiClient();
      const rawIdea = sanitizeText(req.body?.rawIdea, 1500);
      const targetOutput = sanitizeText(req.body?.targetOutput, 80) || 'Image + Video Prompt';
      const characterLock = sanitizeText(req.body?.characterLock, 2000);
      const aspectRatio = sanitizeText(req.body?.aspectRatio, 20) || '9:16';

      if (!rawIdea) {
        return res.status(400).json({ error: 'Masukkan ide mentah terlebih dahulu.' });
      }

      const prompt = `Anda adalah Senior Prompt Engineer untuk JAJA AI Creator Studio.
Ubah ide mentah berikut menjadi prompt produksi siap pakai dengan presisi tinggi.
- Ide Mentah: ${rawIdea}
- Target Output: ${targetOutput}
- Character Identity Lock (opsional): ${characterLock || 'Tidak ada'}
- Aspect Ratio: ${aspectRatio}

Kembalikan JSON dengan SEMUA field terisi lengkap:
- title: judul pendek prompt (Bahasa Indonesia).
- masterPrompt: prompt utama bahasa Inggris yang terstruktur (subjek, komposisi, pencahayaan, lensa/kamera, mood, kualitas).
- variationPrompt: alternatif variasi sudut pandang atau mood dalam bahasa Inggris.
- negativePrompt: elemen yang harus dihindari.
- notes: 2-3 saran eksekusi produksi singkat dalam Bahasa Indonesia.`;

      const response = await withGeminiRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              required: ['title', 'masterPrompt', 'variationPrompt', 'negativePrompt', 'notes'],
              properties: {
                title: { type: Type.STRING },
                masterPrompt: { type: Type.STRING },
                variationPrompt: { type: Type.STRING },
                negativePrompt: { type: Type.STRING },
                notes: { type: Type.STRING },
              },
            },
          },
        })
      );

      const parsed = parseJsonResponse(response.text, {
        title: 'Prompt Produksi',
        masterPrompt: '',
        variationPrompt: '',
        negativePrompt: '',
        notes: '',
      });
      return res.json(parsed);
    } catch (err) {
      handleApiError(res, err, 'Gagal mengoptimalkan prompt.');
    }
  });

  const httpServer = http.createServer(app);

  if (isProduction) {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        ws: { server: httpServer },
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`JAJA AI Creator Studio server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start JAJA AI Creator Studio server:', err);
  process.exit(1);
});
