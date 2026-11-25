import React, { useState, useEffect } from 'react';
import { Volume2, Download, Plus, Trash2 } from 'lucide-react';
import { studioApi } from '../lib/studioApi';
import type {
  PendingVoiceTransfer,
  PodcastTurn,
  VoiceRenderItem,
} from '../types/studio';

const VOICES = [
  { id: 'Kore', label: 'Kore · Hangat & Jernih' },
  { id: 'Puck', label: 'Puck · Dinamis & Antusias' },
  { id: 'Charon', label: 'Charon · Dalam & Berwibawa' },
  { id: 'Fenrir', label: 'Fenrir · Tegas & Sinematik' },
  { id: 'Zephyr', label: 'Zephyr · Ringan & Conversational' },
];

interface VoiceStudioViewProps {
  renders: VoiceRenderItem[];
  onAddRender: (item: VoiceRenderItem) => void;
  pendingTransfer: PendingVoiceTransfer | null;
  onConsumeTransfer: () => void;
  onNotify: (msg: string) => void;
}

export const VoiceStudioView: React.FC<VoiceStudioViewProps> = ({
  renders,
  onAddRender,
  pendingTransfer,
  onConsumeTransfer,
  onNotify,
}) => {
  const [mode, setMode] = useState<'single' | 'dual'>('single');
  const [title, setTitle] = useState('Narasi Pembuka Lotuzt Studio');
  const [text, setText] = useState(
    'Selamat datang di Lotuzt AI Creator Studio. Dengan Character Identity Lock, satu identitas visual dapat digunakan secara konsisten di seluruh video, drama, dan kampanye konten Anda.'
  );
  const [voiceName, setVoiceName] = useState('Kore');
  const [style, setStyle] = useState('Clear, calm, modern technology presenter');

  // Dual speaker state
  const [speakerA, setSpeakerA] = useState('Raka');
  const [speakerB, setSpeakerB] = useState('Aria');
  const [voiceA, setVoiceA] = useState('Puck');
  const [voiceB, setVoiceB] = useState('Kore');
  const [turns, setTurns] = useState<PodcastTurn[]>([
    {
      speaker: 'Raka',
      style: 'Enthusiastic studio podcast host',
      line: 'Halo semuanya! <breath> Hari ini kita bahas gimana kreator solo bisa bikin produksi sekelas studio.',
    },
    {
      speaker: 'Aria',
      style: 'Warm, articulate co-host',
      line: 'Betul banget, |yeah| kuncinya sekarang ada di konsistensi karakter dari awal sampai akhir.',
    },
  ]);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!pendingTransfer) return;
    setMode(pendingTransfer.mode);
    setTitle(pendingTransfer.title);
    if (pendingTransfer.mode === 'single' && pendingTransfer.text) {
      setText(pendingTransfer.text);
      if (pendingTransfer.style) setStyle(pendingTransfer.style);
    } else if (pendingTransfer.mode === 'dual' && pendingTransfer.turns?.length) {
      setSpeakerA(pendingTransfer.speakerA || 'Raka');
      setSpeakerB(pendingTransfer.speakerB || 'Aria');
      setTurns(pendingTransfer.turns);
    }
    onConsumeTransfer();
  }, [pendingTransfer, onConsumeTransfer]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setGenerating(true);
    try {
      const res =
        mode === 'single'
          ? await studioApi.generateVoice({
              mode: 'single',
              text,
              voiceName,
              style,
            })
          : await studioApi.generateVoice({
              mode: 'dual',
              speakerA,
              speakerB,
              voiceA,
              voiceB,
              turns,
            });

      onAddRender({
        id: `aud_${Date.now().toString(36)}`,
        title: title.trim() || 'Render Audio Studio',
        mode,
        model: res.model,
        audioDataUrl: res.audioDataUrl,
        createdAtMs: Date.now(),
      });
      onNotify('Audio WAV berhasil disintesis oleh Gemini 3.8 TTS.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghasilkan audio.');
    } finally {
      setGenerating(false);
    }
  };

  const updateTurn = (idx: number, patch: Partial<PodcastTurn>) => {
    setTurns((prev) => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  };

  const addTurn = () => {
    const nextSpeaker = turns.length % 2 === 0 ? speakerA : speakerB;
    setTurns((prev) => [
      ...prev,
      { speaker: nextSpeaker, style: 'Natural conversational voice', line: '' },
    ]);
  };

  const removeTurn = (idx: number) => {
    setTurns((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#F1F4F9]">AI Voice Studio</h1>
        <p className="text-sm text-[#94A0B8] mt-1">
          Sintesis voiceover tunggal dan dialog podcast dua pembicara dalam kualitas WAV
          24kHz menggunakan Gemini 3.8 TTS.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleGenerate}
          className="lg:col-span-7 bg-[#12151E] border border-[#232838] rounded-xl p-6 space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 bg-[#0B0D12] border border-[#232838] rounded-lg self-start">
              <button
                type="button"
                onClick={() => setMode('single')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  mode === 'single'
                    ? 'bg-[#1F2637] text-[#F1F4F9]'
                    : 'text-[#94A0B8]'
                }`}
              >
                Single Narrator
              </button>
              <button
                type="button"
                onClick={() => setMode('dual')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  mode === 'dual'
                    ? 'bg-[#1F2637] text-[#F1F4F9]'
                    : 'text-[#94A0B8]'
                }`}
              >
                Dual-Speaker Podcast
              </button>
            </div>
            <span className="text-xs font-mono text-[#647087]">
              {mode === 'single' ? 'gemini-3.8-flash-lite-tts' : 'gemini-3.8-flash-tts'}
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#94A0B8]">Judul Track Audio</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9]"
            />
          </div>

          {mode === 'single' ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#94A0B8]">Profil Suara</label>
                  <select
                    value={voiceName}
                    onChange={(e) => setVoiceName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9]"
                  >
                    {VOICES.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#94A0B8]">
                    Arahan Gaya &amp; Intonasi
                  </label>
                  <input
                    type="text"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#94A0B8]">Naskah Narasi</label>
                <textarea
                  rows={6}
                  required
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9] leading-relaxed"
                />
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#0B0D12] border border-[#232838] rounded-lg space-y-2">
                  <input
                    type="text"
                    value={speakerA}
                    onChange={(e) => setSpeakerA(e.target.value)}
                    placeholder="Pembicara 1"
                    className="w-full px-2.5 py-1.5 text-xs font-medium bg-[#12151E] border border-[#232838] rounded text-[#F1F4F9]"
                  />
                  <select
                    value={voiceA}
                    onChange={(e) => setVoiceA(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#12151E] border border-[#232838] rounded text-[#CBD5E1]"
                  >
                    {VOICES.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="p-3 bg-[#0B0D12] border border-[#232838] rounded-lg space-y-2">
                  <input
                    type="text"
                    value={speakerB}
                    onChange={(e) => setSpeakerB(e.target.value)}
                    placeholder="Pembicara 2"
                    className="w-full px-2.5 py-1.5 text-xs font-medium bg-[#12151E] border border-[#232838] rounded text-[#F1F4F9]"
                  />
                  <select
                    value={voiceB}
                    onChange={(e) => setVoiceB(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#12151E] border border-[#232838] rounded text-[#CBD5E1]"
                  >
                    {VOICES.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#94A0B8]">
                    Baris Dialog (mendukung &lt;breath&gt;, &lt;laugh&gt;, |yeah|)
                  </span>
                  <button
                    type="button"
                    onClick={addTurn}
                    className="inline-flex items-center gap-1 text-xs font-medium text-sky-400 hover:text-sky-300"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Baris
                  </button>
                </div>

                {turns.map((turn, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#0B0D12] border border-[#232838] rounded-lg space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <select
                        value={turn.speaker === speakerB ? speakerB : speakerA}
                        onChange={(e) => updateTurn(idx, { speaker: e.target.value })}
                        className="px-2.5 py-1 text-xs font-medium bg-[#12151E] border border-[#232838] rounded text-sky-300"
                      >
                        <option value={speakerA}>{speakerA}</option>
                        <option value={speakerB}>{speakerB}</option>
                      </select>
                      <input
                        type="text"
                        value={turn.style}
                        onChange={(e) => updateTurn(idx, { style: e.target.value })}
                        placeholder="Gaya suara"
                        className="flex-1 px-2.5 py-1 text-xs bg-[#12151E] border border-[#232838] rounded text-[#94A0B8]"
                      />
                      {turns.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTurn(idx)}
                          aria-label="Hapus baris"
                          className="p-1 text-[#647087] hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={2}
                      required
                      value={turn.line}
                      onChange={(e) => updateTurn(idx, { line: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-[#12151E] border border-[#232838] rounded text-[#F1F4F9]"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg p-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={generating}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-sky-500 text-slate-950 rounded-lg hover:bg-sky-400 disabled:opacity-50"
          >
            <Volume2 className="w-4 h-4" />
            {generating ? 'Mensintesis Audio WAV...' : 'Generate Audio Studio'}
          </button>
        </form>

        <div className="lg:col-span-5 bg-[#12151E] border border-[#232838] rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-[#F1F4F9]">
            Hasil Render Sesi ({renders.length})
          </h2>

          {renders.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#94A0B8]">
              Belum ada audio yang dirender pada sesi ini. Audio WAV 24kHz akan muncul di
              sini dan dapat langsung diputar atau diunduh.
            </div>
          ) : (
            <div className="space-y-3">
              {renders.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-[#0B0D12] border border-[#232838] rounded-xl space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#F1F4F9] truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-[#647087] font-mono">
                        {item.mode === 'dual' ? 'Dual-Speaker' : 'Single'} · {item.model}
                      </p>
                    </div>
                    <a
                      href={item.audioDataUrl}
                      download={`${item.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.wav`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-[#181D2A] border border-[#2A3145] text-[#F1F4F9] rounded-md hover:border-sky-500/60 shrink-0"
                    >
                      <Download className="w-3.5 h-3.5 text-sky-400" />
                      WAV
                    </a>
                  </div>
                  <audio controls src={item.audioDataUrl} className="w-full h-9" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
