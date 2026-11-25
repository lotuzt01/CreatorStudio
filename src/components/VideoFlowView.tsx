import React, { useState, useEffect } from 'react';
import { Clapperboard, Copy, Check, Save } from 'lucide-react';
import { copyTextToClipboard } from '../lib/clipboard';
import { studioApi, type VideoFlowResponse } from '../lib/studioApi';
import type { AspectRatio, PromptModule, StudioCharacter } from '../types/studio';

const SHOTS = ['Close-up', 'Medium shot', 'Medium wide', 'Wide establishing', 'Tracking over-shoulder'];
const MOTIONS = [
  'Slow dolly in',
  'Static tripod editorial',
  'Smooth tracking pan left',
  'Subtle handheld natural',
  'Slow orbital arc',
  'Pull back reveal',
];
const LIGHTINGS = [
  'Cinematic key & rim light',
  'Soft studio softbox',
  'Natural window shadows',
  'Golden hour outdoor',
  'Moody architectural tungsten',
];

interface VideoFlowViewProps {
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
  onNotify: (msg: string) => void;
}

export const VideoFlowView: React.FC<VideoFlowViewProps> = ({
  characters,
  activeProjectId,
  onSavePrompt,
  onNotify,
}) => {
  const [characterId, setCharacterId] = useState(characters[0]?.id || '');
  const [location, setLocation] = useState('Studio teknologi modern dengan aksen kaca dan kayu gelap');
  const [activity, setActivity] = useState(
    'Menjelaskan terobosan AI kreatif dengan gestur tangan tenang dan artikulatif'
  );
  const [shotType, setShotType] = useState(SHOTS[1]);
  const [cameraMotion, setCameraMotion] = useState(MOTIONS[0]);
  const [expression, setExpression] = useState('Tenang dan percaya diri');
  const [lighting, setLighting] = useState(LIGHTINGS[0]);
  const [duration, setDuration] = useState('8s');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<VideoFlowResponse | null>(null);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (characterId && !characters.some((c) => c.id === characterId)) {
      setCharacterId(characters[0]?.id || '');
    } else if (!characterId && characters.length > 0) {
      setCharacterId(characters[0].id);
    }
  }, [characters, characterId]);

  const selectedChar = characters.find((c) => c.id === characterId);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await studioApi.generateVideoFlow({
        characterName: selectedChar?.name || 'Presenter Utama',
        characterLock: selectedChar?.identityLockPrompt || '',
        location,
        activity,
        shotType,
        cameraMotion,
        expression,
        lighting,
        duration,
        aspectRatio,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat prompt Video Flow.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (key: string, text: string) => {
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopied(key);
      setTimeout(() => setCopied(''), 1800);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    try {
      await onSavePrompt({
        projectId: activeProjectId,
        characterId: selectedChar?.id || '',
        module: 'video_flow',
        title: `Video Flow · ${selectedChar?.name || 'Scene'} (${cameraMotion})`,
        promptText: result.flowMasterPrompt,
        secondaryOutput: `START FRAME PROMPT:\n${result.startFramePrompt}\n\nAUDIO AMBIENCE:\n${result.audioAmbience}\n\nNEGATIVE:\n${result.negativeConstraints}`,
        tags: ['google-flow', aspectRatio, duration],
      });
      onNotify('Paket prompt Video Flow disimpan ke Prompt Library.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan prompt Video Flow.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#F1F4F9]">
          AI Video &amp; Google Flow Studio
        </h1>
        <p className="text-sm text-[#94A0B8] mt-1">
          Rancang prompt video sinematik dengan kontrol kamera, timeline gerak, dan anchor
          karakter terkunci untuk Google Flow maupun model video lainnya.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleGenerate}
          className="lg:col-span-5 bg-[#12151E] border border-[#232838] rounded-xl p-6 space-y-4"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#94A0B8]">
              Karakter Terkunci (Identity Lock)
            </label>
            <select
              value={characterId}
              onChange={(e) => setCharacterId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9] focus:outline-none focus:border-sky-500"
            >
              <option value="">Tanpa karakter terkunci</option>
              {characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.consistencyCode})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#94A0B8]">Lokasi Adegan</label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9] focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#94A0B8]">Aktivitas &amp; Aksi</label>
            <textarea
              rows={3}
              required
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9] focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#94A0B8]">Shot Kamera</label>
              <select
                value={shotType}
                onChange={(e) => setShotType(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9]"
              >
                {SHOTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#94A0B8]">Motion Control</label>
              <select
                value={cameraMotion}
                onChange={(e) => setCameraMotion(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9]"
              >
                {MOTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#94A0B8]">Pencahayaan</label>
              <select
                value={lighting}
                onChange={(e) => setLighting(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9]"
              >
                {LIGHTINGS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#94A0B8]">Ekspresi</label>
              <input
                type="text"
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#94A0B8]">Durasi</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9]"
              >
                <option value="5s">5 detik</option>
                <option value="8s">8 detik</option>
                <option value="12s">12 detik</option>
                <option value="15s">15 detik</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#94A0B8]">Aspect Ratio</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                className="w-full px-3 py-2 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9]"
              >
                <option value="9:16">9:16</option>
                <option value="16:9">16:9</option>
                <option value="1:1">1:1</option>
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
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-sky-500 text-slate-950 rounded-lg hover:bg-sky-400 disabled:opacity-50 transition-colors"
          >
            <Clapperboard className="w-4 h-4" />
            {loading ? 'Menyusun Paket Video Flow...' : 'Generate Video Flow Prompt'}
          </button>
        </form>

        <div className="lg:col-span-7 bg-[#12151E] border border-[#232838] rounded-xl p-6 space-y-5">
          {!result ? (
            <div className="py-16 text-center space-y-2">
              <p className="text-sm font-medium text-[#F1F4F9]">
                Output Video Flow Siap Disusun
              </p>
              <p className="text-xs text-[#94A0B8] max-w-md mx-auto">
                Pilih karakter terkunci dan arah kamera di sisi kiri. Gemini akan menghasilkan
                prompt utama Google Flow, start-frame anchor, serta timeline pergerakan.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 border-b border-[#1F2433] pb-3">
                <h2 className="text-sm font-semibold text-[#F1F4F9]">
                  Spesifikasi Produksi Video Flow
                </h2>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#181D2A] border border-[#2A3145] text-[#F1F4F9] rounded-lg hover:border-sky-500/60"
                >
                  <Save className="w-3.5 h-3.5 text-sky-400" />
                  Simpan ke Library
                </button>
              </div>

              <div className="p-4 bg-[#0B0D12] border border-[#232838] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-sky-400">
                    Google Flow Master Prompt
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleCopy('master', result.flowMasterPrompt)}
                    className="inline-flex items-center gap-1 text-xs text-[#94A0B8] hover:text-[#F1F4F9]"
                  >
                    {copied === 'master' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    Salin
                  </button>
                </div>
                <p className="text-xs font-mono text-[#E2E8F0] leading-relaxed whitespace-pre-wrap">
                  {result.flowMasterPrompt}
                </p>
              </div>

              <div className="p-4 bg-[#0B0D12] border border-[#232838] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#CBD5E1]">
                    Image-to-Video Start Frame Anchor
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleCopy('frame', result.startFramePrompt)}
                    className="inline-flex items-center gap-1 text-xs text-[#94A0B8] hover:text-[#F1F4F9]"
                  >
                    {copied === 'frame' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    Salin
                  </button>
                </div>
                <p className="text-xs font-mono text-[#CBD5E1] leading-relaxed">
                  {result.startFramePrompt}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#94A0B8]">Timeline Pergerakan</p>
                <div className="divide-y divide-[#1F2433] border border-[#232838] rounded-xl bg-[#0B0D12]">
                  {result.motionTimeline?.map((seg, i) => (
                    <div key={i} className="p-3 flex items-start gap-4 text-xs">
                      <span className="font-mono text-sky-400 shrink-0 w-16 tabular-nums">
                        {seg.window}
                      </span>
                      <span className="text-[#CBD5E1] leading-relaxed">{seg.direction}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-[#0B0D12] border border-[#232838] rounded-xl space-y-1">
                  <p className="font-semibold text-[#94A0B8]">Desain Audio &amp; Ambience</p>
                  <p className="text-[#CBD5E1] leading-relaxed">{result.audioAmbience}</p>
                </div>
                <div className="p-3.5 bg-[#0B0D12] border border-[#232838] rounded-xl space-y-1">
                  <p className="font-semibold text-[#94A0B8]">Batasan Negatif</p>
                  <p className="font-mono text-[#94A0B8] leading-relaxed">
                    {result.negativeConstraints}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
