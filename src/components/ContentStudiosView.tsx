import React, { useState, useEffect } from 'react';
import { Copy, Check, Save, Volume2, Sparkles } from 'lucide-react';
import { copyTextToClipboard } from '../lib/clipboard';
import {
  studioApi,
  type DramaResponse,
  type PodcastResponse,
  type UgcResponse,
} from '../lib/studioApi';
import type {
  PendingVoiceTransfer,
  PromptModule,
  StudioCharacter,
} from '../types/studio';

interface ContentStudiosViewProps {
  mode: 'ugc_studio' | 'drama_studio' | 'podcast_studio';
  characters: StudioCharacter[];
  activeProjectId: string;
  onSavePrompt: (input: {
    projectId?: string;
    characterId?: string;
    module: PromptModule;
    title: string;
    promptText: string;
    secondaryOutput?: string;
    tags?: string[];
  }) => Promise<void>;
  onSendToVoice: (transfer: PendingVoiceTransfer) => void;
  onNotify: (msg: string) => void;
}

export const ContentStudiosView: React.FC<ContentStudiosViewProps> = ({
  mode,
  characters,
  activeProjectId,
  onSavePrompt,
  onSendToVoice,
  onNotify,
}) => {
  const [copiedKey, setCopiedKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // UGC state
  const [productName, setProductName] = useState('Luminex Barrier Repair Serum');
  const [productDescription, setProductDescription] = useState(
    'Serum ceramide ringan cepat meresap untuk kulit sensitif, hasil lembap instan tanpa lengket.'
  );
  const [targetAudience, setTargetAudience] = useState(
    'Profesional muda usia 22-35 yang sering terpapar AC dan butuh skincare praktis'
  );
  const [ugcCharId, setUgcCharId] = useState(characters[1]?.id || characters[0]?.id || '');
  const [promoType, setPromoType] = useState('Review Jujur');
  const [ugcLang, setUgcLang] = useState('Bahasa Indonesia');
  const [ugcDuration, setUgcDuration] = useState('30 detik');
  const [ugcResult, setUgcResult] = useState<UgcResponse | null>(null);

  // Drama state
  const [storyIdea, setStoryIdea] = useState(
    'Seorang arsitek AI menemukan pesan misterius di dalam sistem arsip memori kota yang mengarah ke masa lalunya sendiri.'
  );
  const [genre, setGenre] = useState('Thriller Sci-Fi Drama');
  const [sceneCount, setSceneCount] = useState(4);
  const [visualTone, setVisualTone] = useState('35mm anamorphic cinema, moody rain & window shadows');
  const [selectedCastIds, setSelectedCastIds] = useState<string[]>(
    characters.slice(0, 2).map((c) => c.id)
  );
  const [dramaResult, setDramaResult] = useState<DramaResponse | null>(null);

  // Podcast state
  const [podcastTopic, setPodcastTopic] = useState(
    'Bagaimana kreator tunggal membangun studio produksi konten dengan Character Identity Lock'
  );
  const [podcastFormat, setPodcastFormat] = useState<'dual' | 'solo'>('dual');
  const [hostName, setHostName] = useState('Raka');
  const [guestName, setGuestName] = useState('Aria');
  const [podcastTone, setPodcastTone] = useState('Cerdas, hangat, mengalir seperti obrolan studio');
  const [podcastResult, setPodcastResult] = useState<PodcastResponse | null>(null);

  useEffect(() => {
    setError('');
  }, [mode]);

  useEffect(() => {
    if (ugcCharId && !characters.some((c) => c.id === ugcCharId)) {
      setUgcCharId(characters[0]?.id || '');
    } else if (!ugcCharId && characters.length > 0) {
      setUgcCharId(characters[1]?.id || characters[0].id);
    }
    setSelectedCastIds((prev) => {
      const valid = prev.filter((id) => characters.some((c) => c.id === id));
      return valid.length > 0 ? valid : characters.slice(0, 2).map((c) => c.id);
    });
  }, [characters, ugcCharId]);

  const handleCopy = async (key: string, text: string) => {
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(''), 1800);
    }
  };

  const toggleCast = (id: string) => {
    setSelectedCastIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const runUgc = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const char = characters.find((c) => c.id === ugcCharId);
      const data = await studioApi.generateUgc({
        productName,
        productDescription,
        targetAudience,
        presenterName: char?.name || 'Kreator UGC',
        presenterLock: char?.identityLockPrompt || '',
        promoType,
        language: ugcLang,
        duration: ugcDuration,
      });
      setUgcResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat konten UGC.');
    } finally {
      setLoading(false);
    }
  };

  const runDrama = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const castList = characters.filter((c) => selectedCastIds.includes(c.id));
      const castSummary = castList
        .map(
          (c) =>
            `${c.name} (${c.consistencyCode}, ${c.archetype}): ${c.identityLockPrompt || c.faceDescription}`
        )
        .join('\n');
      const data = await studioApi.generateDrama({
        storyIdea,
        genre,
        sceneCount,
        castSummary,
        visualTone,
      });
      setDramaResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyusun storyboard drama.');
    } finally {
      setLoading(false);
    }
  };

  const runPodcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await studioApi.generatePodcast({
        topic: podcastTopic,
        format: podcastFormat,
        hostName,
        guestName,
        tone: podcastTone,
        language: 'Bahasa Indonesia',
      });
      setPodcastResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat naskah podcast.');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'ugc_studio') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-[#F1F4F9]">AI UGC &amp; Ads Studio</h1>
          <p className="text-sm text-[#94A0B8] mt-1">
            Hasilkan hook 3 detik, dialog presenter natural, prompt visual per adegan, caption,
            dan CTA siap produksi.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={runUgc}
            className="lg:col-span-5 bg-[#12151E] border border-[#232838] rounded-xl p-6 space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#94A0B8]">Nama Produk</label>
              <input
                type="text"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#94A0B8]">
                Deskripsi &amp; Keunggulan Produk
              </label>
              <textarea
                rows={3}
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#94A0B8]">Target Audiens</label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#94A0B8]">
                Karakter Presenter (Identity Lock)
              </label>
              <select
                value={ugcCharId}
                onChange={(e) => setUgcCharId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9]"
              >
                <option value="">Kreator umum</option>
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.archetype}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#94A0B8]">Jenis</label>
                <select
                  value={promoType}
                  onChange={(e) => setPromoType(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9]"
                >
                  <option value="Review Jujur">Review Jujur</option>
                  <option value="Problem-Solution">Problem-Solution</option>
                  <option value="Unboxing">Unboxing</option>
                  <option value="Hard Sell Ads">Hard Sell Ads</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#94A0B8]">Bahasa</label>
                <select
                  value={ugcLang}
                  onChange={(e) => setUgcLang(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9]"
                >
                  <option value="Bahasa Indonesia">Indonesia</option>
                  <option value="English">English</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#94A0B8]">Durasi</label>
                <select
                  value={ugcDuration}
                  onChange={(e) => setUgcDuration(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9]"
                >
                  <option value="15 detik">15 detik</option>
                  <option value="30 detik">30 detik</option>
                  <option value="45 detik">45 detik</option>
                  <option value="60 detik">60 detik</option>
                </select>
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg p-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-sky-500 text-slate-950 rounded-lg hover:bg-sky-400 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? 'Menyusun Paket UGC...' : 'Generate Paket UGC Lengkap'}
            </button>
          </form>

          <div className="lg:col-span-7 bg-[#12151E] border border-[#232838] rounded-xl p-6 space-y-5">
            {!ugcResult ? (
              <div className="py-16 text-center space-y-2">
                <p className="text-sm font-medium text-[#F1F4F9]">
                  Siap Membuat Konten Promosi UGC
                </p>
                <p className="text-xs text-[#94A0B8] max-w-md mx-auto">
                  Isi detail produk dan pilih karakter presenter. Output akan mencakup 3 opsi
                  hook, naskah penuh, storyboard 4 adegan, dan prompt visual terkunci.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1F2433] pb-3">
                  <h2 className="text-sm font-semibold text-[#F1F4F9]">
                    Paket Produksi UGC · {productName}
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onSendToVoice({
                          mode: 'single',
                          title: `Voiceover UGC · ${productName}`,
                          text: ugcResult.script,
                          style: 'Authentic, friendly Indonesian UGC creator reviewing a product',
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#181D2A] border border-[#2A3145] text-[#F1F4F9] rounded-lg hover:border-sky-500/60"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                      Buat Voiceover
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await onSavePrompt({
                          projectId: activeProjectId,
                          characterId: ugcCharId,
                          module: 'ugc_studio',
                          title: `UGC · ${productName} (${promoType})`,
                          promptText: ugcResult.script,
                          secondaryOutput: ugcResult.scenes
                            .map((s) => `[${s.timecode}] ${s.videoPrompt}`)
                            .join('\n\n'),
                          tags: ['ugc', promoType.toLowerCase()],
                        });
                        onNotify('Paket UGC disimpan ke Prompt Library.');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#181D2A] border border-[#2A3145] text-[#F1F4F9] rounded-lg hover:border-sky-500/60"
                    >
                      <Save className="w-3.5 h-3.5 text-sky-400" />
                      Simpan
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-sky-400">Opsi Hook Pembuka (0–3s)</p>
                  <div className="space-y-2">
                    {ugcResult.hooks?.map((h, i) => (
                      <div
                        key={i}
                        className="p-3 bg-[#0B0D12] border border-[#232838] rounded-lg text-xs text-[#F1F4F9]"
                      >
                        <span className="font-mono text-[#647087] mr-2">0{i + 1}.</span>
                        {h}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-[#0B0D12] border border-[#232838] rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#94A0B8]">Naskah Presenter</span>
                    <button
                      type="button"
                      onClick={() => void handleCopy('ugc_script', ugcResult.script)}
                      className="inline-flex items-center gap-1 text-xs text-[#94A0B8] hover:text-[#F1F4F9]"
                    >
                      {copiedKey === 'ugc_script' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      Salin
                    </button>
                  </div>
                  <p className="text-sm text-[#E2E8F0] leading-relaxed whitespace-pre-wrap">
                    {ugcResult.script}
                  </p>
                </div>

                <div className="space-y-2.5">
                  <p className="text-xs font-semibold text-[#94A0B8]">
                    Breakdown Adegan &amp; Prompt Video
                  </p>
                  {ugcResult.scenes?.map((sc, i) => (
                    <div
                      key={i}
                      className="p-4 bg-[#0B0D12] border border-[#232838] rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sky-400">{sc.timecode}</span>
                        <button
                          type="button"
                          onClick={() => void handleCopy(`ugc_sc_${i}`, sc.videoPrompt)}
                          className="text-[#94A0B8] hover:text-[#F1F4F9]"
                        >
                          {copiedKey === `ugc_sc_${i}` ? 'Tersalin' : 'Salin Prompt Video'}
                        </button>
                      </div>
                      <p className="text-[#F1F4F9] font-medium">{sc.visualAction}</p>
                      <p className="text-[#94A0B8] italic">"{sc.dialogue}"</p>
                      <p className="font-mono text-[#CBD5E1] pt-1 border-t border-[#1F2433]">
                        {sc.videoPrompt}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-[#0B0D12] border border-[#232838] rounded-xl space-y-2 text-xs">
                  <p className="font-semibold text-[#94A0B8]">Caption, CTA &amp; Hashtags</p>
                  <p className="text-[#E2E8F0]">{ugcResult.caption}</p>
                  <p className="text-sky-300 font-medium">CTA: {ugcResult.callToAction}</p>
                  <p className="text-[#647087] font-mono">
                    {ugcResult.hashtags?.join(' ')}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'drama_studio') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-[#F1F4F9]">
            AI Drama &amp; Storyboard Studio
          </h1>
          <p className="text-sm text-[#94A0B8] mt-1">
            Bangun skenario episodik dan storyboard adegan demi adegan dengan fitur Character
            Continuity lintas shot.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={runDrama}
            className="lg:col-span-5 bg-[#12151E] border border-[#232838] rounded-xl p-6 space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#94A0B8]">Ide Cerita / Premis</label>
              <textarea
                rows={4}
                required
                value={storyIdea}
                onChange={(e) => setStoryIdea(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#94A0B8]">Genre</label>
                <input
                  type="text"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#94A0B8]">Jumlah Adegan</label>
                <select
                  value={sceneCount}
                  onChange={(e) => setSceneCount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9]"
                >
                  {[3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n} Adegan
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#94A0B8]">
                Tone Sinematografi
              </label>
              <input
                type="text"
                value={visualTone}
                onChange={(e) => setVisualTone(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-[#94A0B8]">
                Cast dengan Character Continuity
              </label>
              <div className="space-y-1.5">
                {characters.map((c) => {
                  const active = selectedCastIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCast(c.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                        active
                          ? 'bg-sky-500/10 border-sky-500/50 text-[#F1F4F9]'
                          : 'bg-[#0B0D12] border-[#232838] text-[#94A0B8]'
                      }`}
                    >
                      <span>
                        {c.name} · {c.archetype}
                      </span>
                      <span className="font-mono text-[11px]">{c.consistencyCode}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg p-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-sky-500 text-slate-950 rounded-lg hover:bg-sky-400 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? 'Menyusun Storyboard Drama...' : 'Generate Naskah & Storyboard'}
            </button>
          </form>

          <div className="lg:col-span-7 bg-[#12151E] border border-[#232838] rounded-xl p-6 space-y-5">
            {!dramaResult ? (
              <div className="py-16 text-center space-y-2">
                <p className="text-sm font-medium text-[#F1F4F9]">
                  Storyboard AI Drama Siap Diproduksi
                </p>
                <p className="text-xs text-[#94A0B8] max-w-md mx-auto">
                  Pilih cast dari perpustakaan karakter Anda untuk mengunci kesinambungan
                  wajah dan kostum di setiap adegan.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3 border-b border-[#1F2433] pb-4">
                  <div className="space-y-1">
                    <h2 className="text-base font-bold text-[#F1F4F9]">
                      {dramaResult.episodeTitle}
                    </h2>
                    <p className="text-xs text-[#94A0B8] leading-relaxed">
                      {dramaResult.logline}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await onSavePrompt({
                        projectId: activeProjectId,
                        characterId: selectedCastIds[0] || '',
                        module: 'drama_studio',
                        title: `Drama · ${dramaResult.episodeTitle}`,
                        promptText: dramaResult.scenes
                          .map(
                            (s) =>
                              `SCENE ${s.sceneNumber} — ${s.heading}\n${s.actionSummary}\nDialog: ${s.dialogue}\nVideo Prompt: ${s.videoPrompt}`
                          )
                          .join('\n\n'),
                        secondaryOutput: dramaResult.continuityGuide,
                        tags: ['drama', 'storyboard', genre.toLowerCase().slice(0, 20)],
                      });
                      onNotify('Storyboard drama disimpan ke Prompt Library.');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#181D2A] border border-[#2A3145] text-[#F1F4F9] rounded-lg hover:border-sky-500/60 shrink-0"
                  >
                    <Save className="w-3.5 h-3.5 text-sky-400" />
                    Simpan
                  </button>
                </div>

                <div className="p-3.5 bg-[#0B0D12] border border-[#232838] rounded-xl text-xs space-y-1">
                  <p className="font-semibold text-sky-400">Panduan Character Continuity</p>
                  <p className="text-[#CBD5E1] leading-relaxed">{dramaResult.continuityGuide}</p>
                </div>

                <div className="space-y-3">
                  {dramaResult.scenes?.map((sc) => (
                    <div
                      key={sc.sceneNumber}
                      className="p-4 bg-[#0B0D12] border border-[#232838] rounded-xl space-y-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-semibold text-sky-400">
                          SCENE 0{sc.sceneNumber} · {sc.heading}
                        </span>
                        <span className="text-[#647087]">{sc.cameraDirection}</span>
                      </div>
                      <p className="text-[#E2E8F0] leading-relaxed">{sc.actionSummary}</p>
                      <p className="text-[#94A0B8] italic">Dialog: {sc.dialogue}</p>
                      <div className="pt-2 border-t border-[#1F2433] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[#647087]">Storyboard Image Prompt</span>
                          <button
                            type="button"
                            onClick={() => void handleCopy(`dr_img_${sc.sceneNumber}`, sc.imagePrompt)}
                            className="text-sky-400 hover:text-sky-300"
                          >
                            {copiedKey === `dr_img_${sc.sceneNumber}` ? 'Tersalin' : 'Salin'}
                          </button>
                        </div>
                        <p className="font-mono text-[#CBD5E1]">{sc.imagePrompt}</p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[#647087]">Video Motion Prompt</span>
                          <button
                            type="button"
                            onClick={() => void handleCopy(`dr_vid_${sc.sceneNumber}`, sc.videoPrompt)}
                            className="text-sky-400 hover:text-sky-300"
                          >
                            {copiedKey === `dr_vid_${sc.sceneNumber}` ? 'Tersalin' : 'Salin'}
                          </button>
                        </div>
                        <p className="font-mono text-[#CBD5E1]">{sc.videoPrompt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // AI Podcast Studio
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#F1F4F9]">AI Podcast Studio</h1>
        <p className="text-sm text-[#94A0B8] mt-1">
          Buat naskah podcast solo maupun dialog dua pembicara lengkap dengan arahan intonasi,
          lalu kirim langsung ke AI Voice Studio untuk sintesis audio WAV.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={runPodcast}
          className="lg:col-span-5 bg-[#12151E] border border-[#232838] rounded-xl p-6 space-y-4"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#94A0B8]">Format Episode</label>
            <div className="grid grid-cols-2 gap-1 p-1 bg-[#0B0D12] border border-[#232838] rounded-lg">
              <button
                type="button"
                onClick={() => setPodcastFormat('dual')}
                className={`py-2 text-xs font-medium rounded-md transition-colors ${
                  podcastFormat === 'dual'
                    ? 'bg-[#1F2637] text-[#F1F4F9]'
                    : 'text-[#94A0B8]'
                }`}
              >
                Dual-Host Dialogue
              </button>
              <button
                type="button"
                onClick={() => setPodcastFormat('solo')}
                className={`py-2 text-xs font-medium rounded-md transition-colors ${
                  podcastFormat === 'solo'
                    ? 'bg-[#1F2637] text-[#F1F4F9]'
                    : 'text-[#94A0B8]'
                }`}
              >
                Solo Monolog
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#94A0B8]">Topik Pembahasan</label>
            <textarea
              rows={3}
              required
              value={podcastTopic}
              onChange={(e) => setPodcastTopic(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#94A0B8]">Nama Host</label>
              <input
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9]"
              />
            </div>
            {podcastFormat === 'dual' && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#94A0B8]">Nama Co-Host / Tamu</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9]"
                />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#94A0B8]">Gaya Percakapan</label>
            <input
              type="text"
              value={podcastTone}
              onChange={(e) => setPodcastTone(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9]"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg p-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-sky-500 text-slate-950 rounded-lg hover:bg-sky-400 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? 'Menulis Naskah Podcast...' : 'Generate Naskah Podcast'}
          </button>
        </form>

        <div className="lg:col-span-7 bg-[#12151E] border border-[#232838] rounded-xl p-6 space-y-5">
          {!podcastResult ? (
            <div className="py-16 text-center space-y-2">
              <p className="text-sm font-medium text-[#F1F4F9]">
                Naskah Podcast Siap Disusun
              </p>
              <p className="text-xs text-[#94A0B8] max-w-md mx-auto">
                Setelah naskah selesai, klik "Sintesis di AI Voice Studio" untuk langsung
                menghasilkan rekaman suara asli menggunakan Gemini 3.8 TTS.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#1F2433] pb-4">
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-[#F1F4F9]">
                    {podcastResult.episodeTitle}
                  </h2>
                  <p className="text-xs text-[#94A0B8]">{podcastResult.showNotes}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (podcastFormat === 'dual') {
                        onSendToVoice({
                          mode: 'dual',
                          title: podcastResult.episodeTitle,
                          speakerA: hostName,
                          speakerB: guestName,
                          turns: podcastResult.turns,
                        });
                      } else {
                        onSendToVoice({
                          mode: 'single',
                          title: podcastResult.episodeTitle,
                          text: podcastResult.turns.map((t) => t.line).join(' '),
                          style: podcastResult.turns[0]?.style || 'Warm articulate podcast host',
                        });
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-sky-500 text-slate-950 rounded-lg hover:bg-sky-400 whitespace-nowrap"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    Sintesis di AI Voice Studio
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await onSavePrompt({
                        projectId: activeProjectId,
                        module: 'podcast_studio',
                        title: `Podcast · ${podcastResult.episodeTitle}`,
                        promptText: podcastResult.turns
                          .map((t) => `${t.speaker}: ${t.line}`)
                          .join('\n\n'),
                        secondaryOutput: podcastResult.visualStudioPrompt,
                        tags: ['podcast', podcastFormat],
                      });
                      onNotify('Naskah podcast disimpan ke Prompt Library.');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#181D2A] border border-[#2A3145] text-[#F1F4F9] rounded-lg"
                  >
                    <Save className="w-3.5 h-3.5 text-sky-400" />
                    Simpan
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {podcastResult.turns?.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-[#0B0D12] border border-[#232838] rounded-xl space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-sky-400">{t.speaker}</span>
                      <span className="text-[#647087]">{t.style}</span>
                    </div>
                    <p className="text-sm text-[#E2E8F0] leading-relaxed">{t.line}</p>
                  </div>
                ))}
              </div>

              <div className="p-3.5 bg-[#0B0D12] border border-[#232838] rounded-xl text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#94A0B8]">Prompt Visual Studio Podcast</span>
                  <button
                    type="button"
                    onClick={() => void handleCopy('pod_vis', podcastResult.visualStudioPrompt)}
                    className="text-sky-400 hover:text-sky-300"
                  >
                    {copiedKey === 'pod_vis' ? 'Tersalin' : 'Salin'}
                  </button>
                </div>
                <p className="font-mono text-[#CBD5E1]">{podcastResult.visualStudioPrompt}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
