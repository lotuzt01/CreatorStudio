import React, { useState, useEffect } from 'react';
import { Search, Copy, Check, Trash2, Wand2, Save } from 'lucide-react';
import { copyTextToClipboard } from '../lib/clipboard';
import { studioApi, type PromptEnhanceResponse } from '../lib/studioApi';
import type {
  AspectRatio,
  PromptModule,
  StudioCharacter,
  StudioPromptRecord,
} from '../types/studio';

const MODULE_LABELS: Record<PromptModule, string> = {
  character_engine: 'Character Engine',
  video_flow: 'Video Flow',
  ugc_studio: 'UGC Studio',
  drama_studio: 'AI Drama',
  podcast_studio: 'AI Podcast',
  prompt_lab: 'Prompt Lab',
};

interface PromptLibraryViewProps {
  prompts: StudioPromptRecord[];
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
  onDeletePrompt: (id: string) => Promise<void>;
  onNotify: (msg: string) => void;
}

export const PromptLibraryView: React.FC<PromptLibraryViewProps> = ({
  prompts,
  characters,
  activeProjectId,
  onSavePrompt,
  onDeletePrompt,
  onNotify,
}) => {
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState<'ALL' | PromptModule>('ALL');
  const [copiedId, setCopiedId] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(prompts[0]?.id || null);

  // Prompt Engineering Lab
  const [rawIdea, setRawIdea] = useState('');
  const [targetOutput, setTargetOutput] = useState('Image + Video Prompt');
  const [characterId, setCharacterId] = useState(characters[0]?.id || '');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [enhancing, setEnhancing] = useState(false);
  const [enhanceResult, setEnhanceResult] = useState<PromptEnhanceResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (characterId && !characters.some((c) => c.id === characterId)) {
      setCharacterId(characters[0]?.id || '');
    }
  }, [characters, characterId]);

  const filtered = prompts.filter((p) => {
    const matchMod = moduleFilter === 'ALL' || p.module === moduleFilter;
    const q = search.trim().toLowerCase();
    const matchQ =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.promptText.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q));
    return matchMod && matchQ;
  });

  const handleCopy = async (id: string, text: string) => {
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(''), 1800);
    }
  };

  const handleEnhance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawIdea.trim()) return;
    setError('');
    setEnhancing(true);
    try {
      const char = characters.find((c) => c.id === characterId);
      const data = await studioApi.enhancePrompt({
        rawIdea,
        targetOutput,
        characterLock: char?.identityLockPrompt || '',
        aspectRatio,
      });
      setEnhanceResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyusun prompt.');
    } finally {
      setEnhancing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#F1F4F9]">
          Prompt Engineering &amp; Library
        </h1>
        <p className="text-sm text-[#94A0B8] mt-1">
          Ubah ide mentah menjadi prompt siap produksi dan kelola seluruh arsip prompt serta
          naskah yang tersimpan di proyek Anda.
        </p>
      </div>

      {/* Prompt Engineering Assistant */}
      <section className="bg-[#12151E] border border-[#232838] rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#F1F4F9]">
          Prompt Engineering Assistant
        </h2>
        <form onSubmit={handleEnhance} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={targetOutput}
              onChange={(e) => setTargetOutput(e.target.value)}
              className="px-3 py-2 text-xs bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9]"
            >
              <option value="Image + Video Prompt">Image + Video Prompt</option>
              <option value="Editorial Portrait Photography">Editorial Portrait Photography</option>
              <option value="Commercial Product Shot">Commercial Product Shot</option>
              <option value="Cinematic B-Roll">Cinematic B-Roll</option>
            </select>

            <select
              value={characterId}
              onChange={(e) => setCharacterId(e.target.value)}
              className="px-3 py-2 text-xs bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9]"
            >
              <option value="">Tanpa Character Lock</option>
              {characters.map((c) => (
                <option key={c.id} value={c.id}>
                  Lock: {c.name} ({c.consistencyCode})
                </option>
              ))}
            </select>

            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
              className="px-3 py-2 text-xs bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9]"
            >
              <option value="9:16">Aspect Ratio 9:16</option>
              <option value="16:9">Aspect Ratio 16:9</option>
              <option value="3:4">Aspect Ratio 3:4</option>
              <option value="1:1">Aspect Ratio 1:1</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              required
              value={rawIdea}
              onChange={(e) => setRawIdea(e.target.value)}
              placeholder="Tulis ide mentah, misal: Presenter teknologi membuka laptop di rooftop Jakarta saat senja..."
              className="flex-1 px-3.5 py-2.5 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9] placeholder-[#647087] focus:outline-none focus:border-sky-500"
            />
            <button
              type="submit"
              disabled={enhancing}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-sky-500 text-slate-950 rounded-lg hover:bg-sky-400 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <Wand2 className="w-4 h-4" />
              {enhancing ? 'Menyusun...' : 'Optimalkan Prompt'}
            </button>
          </div>

          {error && (
            <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg p-3">
              {error}
            </p>
          )}
        </form>

        {enhanceResult && (
          <div className="pt-4 border-t border-[#1F2433] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[#F1F4F9]">{enhanceResult.title}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleCopy('enh_master', enhanceResult.masterPrompt)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-[#94A0B8] hover:text-[#F1F4F9]"
                >
                  {copiedId === 'enh_master' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  Salin
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await onSavePrompt({
                      projectId: activeProjectId,
                      characterId,
                      module: 'prompt_lab',
                      title: enhanceResult.title,
                      promptText: enhanceResult.masterPrompt,
                      secondaryOutput: `VARIATION:\n${enhanceResult.variationPrompt}\n\nNEGATIVE:\n${enhanceResult.negativePrompt}\n\nNOTES:\n${enhanceResult.notes}`,
                      tags: ['prompt-lab', aspectRatio],
                    });
                    onNotify('Prompt disimpan ke arsip Library.');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#181D2A] border border-[#2A3145] text-[#F1F4F9] rounded-lg hover:border-sky-500/60"
                >
                  <Save className="w-3.5 h-3.5 text-sky-400" />
                  Simpan ke Library
                </button>
              </div>
            </div>
            <p className="p-3.5 bg-[#0B0D12] border border-[#232838] rounded-lg text-xs font-mono text-[#E2E8F0] leading-relaxed whitespace-pre-wrap">
              {enhanceResult.masterPrompt || enhanceResult.variationPrompt}
            </p>
            {enhanceResult.variationPrompt && enhanceResult.masterPrompt && (
              <div className="p-3.5 bg-[#0B0D12] border border-[#232838] rounded-lg space-y-1">
                <p className="text-[11px] font-medium text-[#647087]">Variasi Alternatif</p>
                <p className="text-xs font-mono text-[#CBD5E1] leading-relaxed whitespace-pre-wrap">
                  {enhanceResult.variationPrompt}
                </p>
              </div>
            )}
            {enhanceResult.notes && (
              <p className="text-xs text-[#94A0B8]">{enhanceResult.notes}</p>
            )}
          </div>
        )}
      </section>

      {/* Archive Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#647087] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul, teks prompt, atau tag..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-[#12151E] border border-[#232838] rounded-lg text-[#F1F4F9] placeholder-[#647087]"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#12151E] border border-[#232838] rounded-lg overflow-x-auto">
          <button
            type="button"
            onClick={() => setModuleFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
              moduleFilter === 'ALL'
                ? 'bg-[#1F2637] text-[#F1F4F9]'
                : 'text-[#94A0B8]'
            }`}
          >
            Semua ({prompts.length})
          </button>
          {(Object.keys(MODULE_LABELS) as PromptModule[]).map((mod) => (
            <button
              key={mod}
              type="button"
              onClick={() => setModuleFilter(mod)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
                moduleFilter === mod
                  ? 'bg-[#1F2637] text-[#F1F4F9]'
                  : 'text-[#94A0B8]'
              }`}
            >
              {MODULE_LABELS[mod]}
            </button>
          ))}
        </div>
      </div>

      {/* Saved Prompts List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-10 bg-[#12151E] border border-[#232838] rounded-xl text-center text-sm text-[#94A0B8]">
            Belum ada prompt tersimpan untuk filter ini. Hasilkan prompt dari modul mana pun
            lalu klik Simpan.
          </div>
        ) : (
          filtered.map((item) => {
            const isOpen = expandedId === item.id;
            return (
              <div
                key={item.id}
                className="bg-[#12151E] border border-[#232838] rounded-xl overflow-hidden"
              >
                <div className="p-4 flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isOpen ? null : item.id)}
                    className="text-left min-w-0 flex-1 space-y-1"
                  >
                    <p className="text-sm font-semibold text-[#F1F4F9] truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-[#94A0B8]">
                      {MODULE_LABELS[item.module]} ·{' '}
                      <span className="font-mono tabular-nums">
                        {new Date(item.updatedAtMs).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      {item.tags.length > 0 && ` · ${item.tags.join(' / ')}`}
                    </p>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => void handleCopy(item.id, item.promptText)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-[#181D2A] border border-[#2A3145] text-[#F1F4F9] rounded-md hover:border-sky-500/60"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      {copiedId === item.id ? 'Tersalin' : 'Salin'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void onDeletePrompt(item.id)}
                      aria-label="Hapus prompt"
                      className="p-1.5 text-[#94A0B8] hover:text-rose-400 rounded-md hover:bg-[#1B2130]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="px-4 pb-4 pt-2 border-t border-[#1F2433] space-y-3">
                    <pre className="p-3.5 bg-[#0B0D12] border border-[#232838] rounded-lg text-xs font-mono text-[#E2E8F0] whitespace-pre-wrap leading-relaxed overflow-x-auto">
                      {item.promptText}
                    </pre>
                    {item.secondaryOutput && (
                      <pre className="p-3.5 bg-[#0B0D12] border border-[#232838] rounded-lg text-xs font-mono text-[#94A0B8] whitespace-pre-wrap leading-relaxed overflow-x-auto">
                        {item.secondaryOutput}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
