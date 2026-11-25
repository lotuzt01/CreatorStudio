import type {
  CharacterSceneResponse,
  CompileLockResponse,
  DramaResponse,
  PodcastResponse,
  PromptEnhanceResponse,
  UgcResponse,
  VideoFlowResponse,
} from './studioApi';

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export function compileCharacterLockLocal(
  payload: Record<string, unknown>
): CompileLockResponse {
  const ch = (payload.character as Record<string, unknown>) || {};
  const name = str(ch.name, 'Studio Talent');
  const archetype = str(ch.archetype, 'Virtual Presenter');
  const visualStyle = str(ch.visualStyle, 'Photorealistic');
  const face = str(ch.faceDescription, 'expressive eyes, balanced facial proportions, natural skin texture');
  const hair = str(ch.hairAndWardrobe, 'neatly styled dark hair, clean modern grooming');
  const body = str(ch.bodyAndTraits, 'confident upright posture, natural hand gestures');
  const outfit = str(ch.signatureOutfit, 'modern dark minimalist studio outfit');
  const code = str(ch.consistencyCode, `LOTUZT_${name.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`);

  const identityLockPrompt = `Consistent identity ${code}: ${visualStyle} ${archetype} named ${name}. Facial traits: ${face}. Hair & grooming: ${hair}. Posture & traits: ${body}. Signature wardrobe: ${outfit}. Maintain exact facial geometry, skin tone, eyebrow shape, hairstyle, and signature outfit details across every frame.`;

  return {
    identityLockPrompt,
    turnaroundPrompts: [
      {
        label: 'Front Portrait',
        prompt: `${identityLockPrompt} Straight-on symmetrical front portrait, direct eye contact, neutral soft studio backdrop, 85mm lens, f/2.0, even softbox key lighting, ultra-detailed character reference sheet.`,
      },
      {
        label: '3/4 Angle',
        prompt: `${identityLockPrompt} Three-quarter angle medium close-up, subtle confident smile, soft directional key light with subtle cyan rim accent, 85mm portrait lens, crisp micro-detail, clean studio background.`,
      },
      {
        label: 'Side Profile',
        prompt: `${identityLockPrompt} Clean 90-degree side profile silhouette showing nose bridge, jawline, ear, and hairstyle contour accurately, controlled studio lighting, 85mm lens, neutral background.`,
      },
      {
        label: 'Full Body',
        prompt: `${identityLockPrompt} Full-body standing reference shot in natural relaxed stance, clear visibility of complete outfit proportions and footwear, 50mm studio lens, balanced soft lighting, minimal studio floor.`,
      },
    ],
    consistencyRules: [
      `Selalu sertakan token identitas "${code}" di awal setiap prompt gambar dan video.`,
      `Pertahankan struktur wajah, alis, warna kulit, dan gaya rambut (${hair.slice(0, 70)}) tanpa perubahan lintas adegan.`,
      `Gunakan outfit ikonik (${outfit.slice(0, 70)}) atau deskripsikan penggantian outfit secara eksplisit sambil mengunci detail wajah.`,
      `Jaga gaya visual tetap "${visualStyle}" dengan rasio lensa 50mm–85mm agar proporsi wajah tidak terdistorsi.`,
    ],
  };
}

export function generateCharacterSceneLocal(
  payload: Record<string, unknown>
): CharacterSceneResponse {
  const ch = (payload.character as Record<string, unknown>) || {};
  const name = str(ch.name, 'Studio Talent');
  const visualStyle = str(ch.visualStyle, 'Photorealistic');
  const code = str(ch.consistencyCode, 'LOTUZT_CHAR_01');
  const lockBase =
    str(ch.identityLockPrompt) ||
    `${visualStyle} character ${name} (${code}), ${str(ch.faceDescription)}, ${str(ch.hairAndWardrobe)}`;

  const pose = str(payload.pose, 'Medium shot speaking directly to camera');
  const expression = str(payload.expression, 'Confident warm smile');
  const outfit = str(payload.outfitOverride) || str(ch.signatureOutfit, 'signature studio outfit');
  const sceneSetting = str(payload.sceneSetting, 'Modern minimalist creator studio');
  const lighting = str(payload.lighting, 'Soft key light with subtle rim light, 85mm lens');
  const aspectRatio = str(payload.aspectRatio, '9:16');

  return {
    imagePrompt: `${lockBase}. Pose: ${pose}. Expression: ${expression}. Wearing: ${outfit}. Environment: ${sceneSetting}. Lighting & optics: ${lighting}. Composition framed for ${aspectRatio} aspect ratio, sharp focus on eyes, natural depth of field, high production quality.`,
    videoMotionPrompt: `Start from locked character ${code} (${name}) in ${sceneSetting}. Pose: ${pose}, expression: ${expression}, wearing ${outfit}. Camera executes a smooth subtle push-in with steady framing (${aspectRatio}). Subject speaks naturally with subtle head nods, authentic blinking, and fluid hand gestures while keeping facial identity 100% locked. ${lighting}, 24fps cinematic motion, zero face morphing.`,
    negativePrompt:
      'face morphing, altered facial structure, inconsistent hairstyle, extra fingers, deformed hands, blurry eyes, plastic wax skin, watermark, text overlay, low resolution, jittery flicker',
    continuityChecklist: [
      `Kode konsistensi ${code} dan deskripsi DNA wajah tetap utuh di awal prompt.`,
      `Outfit adegan (${outfit.slice(0, 60)}) tidak mengubah proporsi tubuh atau gaya visual ${visualStyle}.`,
      `Gunakan gambar hasil Image Prompt sebagai start-frame sebelum menjalankan Video Motion Prompt.`,
    ],
  };
}

export function generateVideoFlowLocal(payload: Record<string, unknown>): VideoFlowResponse {
  const concept = str(payload.concept, 'Cinematic creator studio scene');
  const characterLock = str(payload.characterLock);
  const cameraShot = str(payload.cameraShot, 'Medium Close-Up (MCU)');
  const motionControl = str(payload.motionControl, 'Slow Dolly In');
  const startFrame = str(payload.startFrame, 'Subject centered cleanly looking toward camera');
  const duration = str(payload.duration, '8 detik');
  const aspectRatio = str(payload.aspectRatio, '9:16');
  const mood = str(payload.mood, 'Modern Editorial');

  const charPrefix = characterLock ? `${characterLock} ` : '';
  const startFramePrompt = `${charPrefix}${startFrame}. Concept: ${concept}. Framing: ${cameraShot}, ${mood} aesthetic, crisp studio lighting, natural depth of field, vertical/frame ratio ${aspectRatio}, ultra-clean opening keyframe.`;
  const flowMasterPrompt = `${charPrefix}${concept}. Opening frame: ${startFrame}. Camera shot: ${cameraShot} executing ${motionControl} smoothly across ${duration}. Mood & grading: ${mood}, rich shadow detail, controlled highlights, fluid 24fps motion, stable subject identity, framed for ${aspectRatio}.`;

  return {
    flowMasterPrompt,
    startFramePrompt,
    motionTimeline: [
      {
        window: '0s - 2s',
        direction: `Establish opening frame (${startFrame}) in ${cameraShot}; settle exposure and lock facial focus.`,
      },
      {
        window: '2s - 5s',
        direction: `Execute ${motionControl} smoothly while subject performs core action of "${concept.slice(0, 90)}" with natural expression and micro-gestures.`,
      },
      {
        window: '5s - akhir',
        direction: `Hold clean landing composition in ${mood} mood with steady framing ready for cut or CTA overlay (${duration}).`,
      },
    ],
    audioAmbience: `Clean modern room tone, subtle ${mood.toLowerCase()} low-frequency underscore bed, soft crisp foley matching movement, clear vocal headroom.`,
    negativeConstraints:
      'camera shake, warped geometry, flickering lights, face drift, extra limbs, distorted text, abrupt jump cuts, oversaturated colors',
  };
}

export function generateUgcLocal(payload: Record<string, unknown>): UgcResponse {
  const productName = str(payload.productName, 'Produk Unggulan');
  const targetAudience = str(payload.targetAudience, 'Kreator dan pengguna harian');
  const keyBenefit = str(payload.keyBenefit, 'hasil cepat, praktis, dan langsung terasa');
  const tone = str(payload.tone, 'Autentik & Relatable');
  const duration = str(payload.duration, '30 detik');
  const characterLock = str(payload.characterLock, 'Modern creator presenter in bright studio');

  const hooks = [
    `Jujur, awalnya aku ragu sama ${productName} — sampai lihat sendiri efek ${keyBenefit}!`,
    `Buat ${targetAudience} yang capek ribet tiap hari, coba lihat cara kerja ${productName} ini.`,
    `Baru 1 kali coba ${productName}, langsung paham kenapa banyak yang pindah ke sini.`,
  ];

  const script = `${hooks[0]} Khusus untuk ${targetAudience}, ${productName} dirancang supaya ${keyBenefit} tanpa langkah berbelit. Cara pakainya simpel banget dan hasilnya langsung kelihatan rapi sejak pemakaian pertama. Kalau kamu mau coba juga, langsung cek keranjang atau link di bio sekarang!`;

  const scenes = [
    {
      timecode: '00:00 - 00:04',
      visualAction: `Hook dekat kamera: kreator memegang ${productName} dengan ekspresi antusias dan kontak mata langsung.`,
      dialogue: hooks[0],
      imagePrompt: `${characterLock}. Close-up vertical 9:16 UGC frame holding ${productName} near cheek, authentic enthusiastic expression, soft window light, crisp product focus, ${tone} vibe.`,
      videoPrompt: `Vertical 9:16 UGC shot starting from locked creator holding ${productName}, quick subtle handheld lean-in, natural eye contact and expressive eyebrows, 24fps realistic skin texture.`,
    },
    {
      timecode: '00:04 - 00:12',
      visualAction: `Masalah & solusi: tunjukkan konteks keseharian ${targetAudience} lalu perlihatkan detail tekstur/fitur ${productName}.`,
      dialogue: `Khusus untuk ${targetAudience}, masalah paling sering itu buang waktu — nah ${productName} langsung bantu kasih ${keyBenefit}.`,
      imagePrompt: `${characterLock}. Medium shot demonstrating ${productName} on clean desk/studio setup, clear hand gesture pointing to key detail, natural daylight, 9:16 editorial UGC look.`,
      videoPrompt: `Smooth handheld tilt from creator's smiling face down to ${productName} being demonstrated in hands, crisp autofocus transition, authentic creator motion.`,
    },
    {
      timecode: '00:12 - 00:22',
      visualAction: `Bukti nyata / demo langsung menggunakan ${productName} dengan ekspresi puas.`,
      dialogue: `Lihat sendiri bedanya: pemakaian super simpel, hasilnya langsung rapi dan nyaman dipakai harian.`,
      imagePrompt: `${characterLock}. Tight macro-to-medium shot showcasing ${productName} in active use, clean highlights, realistic result, bright modern backdrop, 9:16.`,
      videoPrompt: `Slow subtle push-in as creator uses ${productName} smoothly and smiles with genuine satisfaction, steady lighting, zero distortion.`,
    },
    {
      timecode: '00:22 - selesai',
      visualAction: `Closing & CTA (${duration}): kreator mengangkat ${productName} ke kamera sambil menunjuk area bawah layar.`,
      dialogue: `Jangan tunggu kehabisan — langsung cek link di bio atau klik keranjang sekarang buat coba ${productName}!`,
      imagePrompt: `${characterLock}. Confident vertical 9:16 closing portrait holding ${productName} clearly at chest level, warm inviting smile, space at bottom for CTA text overlay.`,
      videoPrompt: `Creator lifts ${productName} slightly toward lens with warm nod and friendly hand gesture toward bottom CTA area, smooth settle, clean ending.`,
    },
  ];

  const tagSlug = productName.replace(/[^a-zA-Z0-9]+/g, '');
  return {
    hooks,
    script,
    scenes,
    caption: `Akhirnya nemu solusi praktis buat ${targetAudience}! ${productName} beneran ngasih ${keyBenefit}. Kamu udah coba belum?`,
    hashtags: [
      `#${tagSlug || 'ReviewProduk'}`,
      '#UGCIndonesia',
      '#RekomendasiKreator',
      '#KontenViral',
      '#LotuztStudio',
    ],
    callToAction: `Klik link di bio / keranjang kuning sekarang untuk dapetin ${productName} hari ini!`,
  };
}

export function generateDramaLocal(payload: Record<string, unknown>): DramaResponse {
  const theme = str(payload.theme, 'Keputusan di Malam Hujan');
  const genre = str(payload.genre, 'Emotional Drama');
  const characterA = str(payload.characterA, 'Protagonis A');
  const characterB = str(payload.characterB, 'Karakter B');
  const conflict = str(payload.conflict, 'rahasia lama yang akhirnya terungkap');
  const sceneCount = Math.min(6, Math.max(2, Number(payload.sceneCount) || 4));
  const characterLock = str(payload.characterLock, 'Cinematic dramatic character');

  const beats = [
    {
      heading: 'INT. RUANG KERJA / KAFE SENJA - MALAM',
      location: 'Ruang remang dengan pantulan lampu kota di jendela hujan',
      actionSummary: `${characterA} menatap pesan terakhir di layar sambil menahan gelisah sebelum ${characterB} tiba.`,
      dialogue: `${characterA}: "Aku kira waktu bisa menyembunyikan semuanya, tapi malam ini kita harus selesai."`,
      cameraDirection: 'Slow 35mm anamorphic dolly-in dari jendela hujan menuju close-up mata karakter.',
    },
    {
      heading: 'INT. KORIDOR / MEJA SUDUT - MALAM',
      location: 'Sudut ruangan dengan pencahayaan kontras hangat dan biru dingin',
      actionSummary: `${characterB} datang membawa bukti terkait ${conflict}; suasana langsung menegang.`,
      dialogue: `${characterB}: "Kenapa kamu baru bicara sekarang, setelah semua ini terjadi?"`,
      cameraDirection: 'Over-the-shoulder shot bergantian dengan shallow depth of field f/1.8.',
    },
    {
      heading: 'INT. RUANG UTAMA - KONFRONTASI - MALAM',
      location: 'Tengah ruangan di bawah cahaya lampu gantung tunggal',
      actionSummary: `Konflik memuncak antara ${characterA} dan ${characterB} saat kebenaran tentang ${conflict} terbuka.`,
      dialogue: `${characterA}: "Karena aku mencoba melindungimu, meski caraku salah sejak awal."`,
      cameraDirection: 'Tight handheld close-up mengikuti emosi wajah, sedikit pergerakan napas kamera.',
    },
    {
      heading: 'EXT. TERAS / JALAN BASAH - LARUT MALAM',
      location: 'Teras luar berkabut tipis dengan pantulan lampu neon di aspal basah',
      actionSummary: `${characterA} mengambil keputusan tegas untuk melangkah maju sambil meninggalkan masa lalu.`,
      dialogue: `${characterA}: "Mulai besok, tidak ada lagi yang kita tutupi."`,
      cameraDirection: 'Wide pull-back shot perlahan menampakkan siluet karakter di tengah malam.',
    },
    {
      heading: 'INT. STUDIO / KAMAR - DINI HARI',
      location: 'Ruangan sunyi dengan cahaya pagi pertama menembus tirai',
      actionSummary: `${characterB} membaca catatan yang ditinggalkan ${characterA} dan mulai memahami semuanya.`,
      dialogue: `${characterB}: "Mungkin belum terlambat untuk memperbaiki ini."`,
      cameraDirection: 'Static poetic medium shot dengan cahaya pagi lembut masuk dari samping.',
    },
    {
      heading: 'EXT. ATAP GEDUNG / STASIUN - PAGI',
      location: 'Ruang terbuka luas dengan langit fajar keemasan',
      actionSummary: `Pertemuan penutup penuh harapan antara ${characterA} dan ${characterB} membuka babak baru.`,
      dialogue: `${characterA}: "Kalau kita mulai ulang dari nol, kamu masih mau ikut?"`,
      cameraDirection: 'Sweeping crane-up shot ke arah cakrawala pagi, 24fps film grain.',
    },
  ];

  const scenes = beats.slice(0, sceneCount).map((beat, idx) => ({
    sceneNumber: idx + 1,
    ...beat,
    imagePrompt: `${characterLock}. ${genre} film still, Scene ${idx + 1}: ${beat.actionSummary} Setting: ${beat.location}. ${beat.cameraDirection}, moody cinematic lighting, 35mm anamorphic film aesthetic, 9:16 vertical cinema frame.`,
    videoPrompt: `${genre} cinematic motion shot based on locked character (${characterLock}). ${beat.actionSummary} ${beat.cameraDirection} Subtle natural facial micro-expressions, rain/ambient light flicker, 24fps film motion, zero identity drift.`,
  }));

  return {
    episodeTitle: `${theme} — Episode 1`,
    logline: `Dalam drama bergenre ${genre}, ${characterA} dan ${characterB} harus menghadapi ${conflict} yang mengubah arah hubungan mereka selamanya.`,
    continuityGuide: `Kunci warna grading teal-amber konsisten di seluruh ${sceneCount} adegan, pertahankan kostum utama ${characterA}, dan selalu gunakan keyframe dari Image Prompt sebagai start-frame video.`,
    scenes,
  };
}

export function generatePodcastLocal(payload: Record<string, unknown>): PodcastResponse {
  const topic = str(payload.topic, 'Strategi Konten AI & Konsistensi Karakter');
  const speakerA = str(payload.speakerA, 'Raka');
  const speakerB = str(payload.speakerB, 'Aria');
  const tone = str(payload.tone, 'Santai, cerdas, dan praktis');
  const turnCount = Math.min(12, Math.max(4, Number(payload.turnCount) || 6));

  const templateTurns = [
    {
      speaker: speakerA,
      style: 'Warm energetic podcast host',
      line: `Halo semuanya, balik lagi bareng aku ${speakerA} dan ${speakerB}! Hari ini kita bakal bedah topik seru: ${topic}.`,
    },
    {
      speaker: speakerB,
      style: 'Friendly curious co-host',
      line: `Seru banget sih ini! Banyak kreator nanya langsung soal ${topic}, karena sekarang persaingan konten makin ketat.`,
    },
    {
      speaker: speakerA,
      style: 'Clear practical storyteller',
      line: `Betul. Kesalahan paling sering itu orang langsung bikin konten tanpa blueprint yang konsisten—padahal penonton ingat karakter dan ritme kita.`,
    },
    {
      speaker: speakerB,
      style: 'Thoughtful conversational tone',
      line: `Nah, kalau menurut kamu langkah pertama paling gampang buat mulai menerapkan ${topic} hari ini apa nih?`,
    },
    {
      speaker: speakerA,
      style: 'Confident guiding voice',
      line: `Pertama, kunci dulu identitas visual dan gaya bicara kita. Kedua, pecah jadi format pendek 30 detik supaya bisa rutin tayang tiap minggu.`,
    },
    {
      speaker: speakerB,
      style: 'Upbeat summarizing voice',
      line: `Setuju banget! Jadi intinya bukan sekadar ikut tren, tapi bikin sistem produksi yang rapi dan bisa diulang terus. Makasih udah dengerin episode kali ini!`,
    },
    {
      speaker: speakerA,
      style: 'Relaxed insightful tone',
      line: `Tambahan kecil juga: selalu simpan prompt dan skrip terbaikmu di library biar produksi episode berikutnya cuma butuh separuh waktu.`,
    },
    {
      speaker: speakerB,
      style: 'Enthusiastic co-host',
      line: `Bener banget, itu bikin kreator solo pun bisa kerja serapi tim studio besar.`,
    },
    {
      speaker: speakerA,
      style: 'Warm conversational tone',
      line: `Kalau teman-teman punya pertanyaan lain soal ${topic}, tulis aja di kolom komentar ya.`,
    },
    {
      speaker: speakerB,
      style: 'Cheerful closing tone',
      line: `Sampai ketemu di episode berikutnya bareng ${speakerA} dan ${speakerB}—tetap konsisten berkarya!`,
    },
    {
      speaker: speakerA,
      style: 'Friendly sign-off',
      line: `Jangan lupa simpan episode ini biar gampang dipraktikkan kapan saja.`,
    },
    {
      speaker: speakerB,
      style: 'Warm closing',
      line: `See you di episode selanjutnya!`,
    },
  ];

  return {
    episodeTitle: `Podcast: ${topic}`,
    showNotes: `Obrolan ${tone.toLowerCase()} antara ${speakerA} dan ${speakerB} membahas langkah praktis menerapkan "${topic}" untuk kreator modern.`,
    turns: templateTurns.slice(0, turnCount),
    visualStudioPrompt: `Cinematic two-host modern podcast studio featuring ${speakerA} and ${speakerB} seated across a dark walnut desk with broadcast condenser microphones, acoustic wall panels, subtle warm key lighting and soft cyan rim accents, 50mm lens, shallow depth of field, 16:9 broadcast look.`,
  };
}

export function enhancePromptLocal(payload: Record<string, unknown>): PromptEnhanceResponse {
  const rawIdea = str(payload.rawIdea, 'Visual kreator modern di studio');
  const targetOutput = str(payload.targetOutput, 'Image + Video Prompt');
  const characterLock = str(payload.characterLock);
  const aspectRatio = str(payload.aspectRatio, '9:16');

  const charPrefix = characterLock ? `${characterLock} ` : '';
  return {
    title: rawIdea.length > 52 ? `${rawIdea.slice(0, 52).trim()}...` : rawIdea,
    masterPrompt: `${charPrefix}${rawIdea}. Crafted for ${targetOutput} in ${aspectRatio} aspect ratio. Composition: clean focal hierarchy with sharp subject separation, 85mm cinema lens, soft diffused key light with subtle rim separation, authentic textures, natural color grading, ultra-detailed 8K production quality.`,
    variationPrompt: `${charPrefix}Alternative dynamic low-angle editorial perspective of "${rawIdea}", expressive candid movement, atmospheric volumetric light, 35mm cinematic lens, rich contrast and depth, framed for ${aspectRatio}.`,
    negativePrompt:
      'blurry focus, distorted anatomy, extra fingers, plastic over-smoothed skin, cluttered messy background, harsh blown-out highlights, watermark, random text artifacts, low resolution',
    notes: `Prompt disusun otomatis untuk target ${targetOutput} (${aspectRatio}). Gunakan Master Prompt untuk hasil utama yang stabil, dan Variation Prompt untuk sudut kamera alternatif atau B-roll.`,
  };
}
