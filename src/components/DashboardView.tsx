import React from 'react';
import { ArrowRight, Lock, Plus, FolderKanban, UserCheck, Clapperboard, Volume2 } from 'lucide-react';
import { STUDIO_COVER_IMAGE } from '../data/starterTemplates';
import type {
  ActiveView,
  StudioCharacter,
  StudioProject,
  StudioPromptRecord,
} from '../types/studio';

interface DashboardViewProps {
  projects: StudioProject[];
  characters: StudioCharacter[];
  prompts: StudioPromptRecord[];
  voiceCount: number;
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  onNavigate: (view: ActiveView) => void;
  onOpenNewProject: () => void;
}

const MODULE_LABELS: Record<string, string> = {
  character_engine: 'Character Engine',
  video_flow: 'Video Flow',
  ugc_studio: 'UGC Studio',
  drama_studio: 'AI Drama',
  podcast_studio: 'AI Podcast',
  prompt_lab: 'Prompt Lab',
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  characters,
  prompts,
  voiceCount,
  activeProjectId,
  onSelectProject,
  onNavigate,
  onOpenNewProject,
}) => {
  const lockedCount = characters.filter((c) => c.identityLocked).length;

  return (
    <div className="space-y-8">
      {/* Studio Focal Anchor */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-[#12151E] border border-[#232838] rounded-xl p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-3">
            <p className="text-xs font-medium text-[#94A0B8]">
              JAJA AI Creator Studio · Workspace Produksi
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F1F4F9]">
              Satu Identitas Karakter untuk Seluruh Produksi Konten Anda
            </h1>
            <p className="text-sm sm:text-base text-[#94A0B8] leading-relaxed max-w-2xl">
              Kunci DNA visual karakter, bangun prompt Video Flow yang konsisten, susun
              naskah UGC dan drama episodik, serta sintesis narasi suara studio langsung
              dalam satu ruang kerja.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('character_engine')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-sky-500 text-slate-950 rounded-lg hover:bg-sky-400 transition-colors whitespace-nowrap shrink-0"
            >
              <UserCheck className="w-4 h-4" />
              Buka Character Intelligence
            </button>
            <button
              type="button"
              onClick={onOpenNewProject}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-[#181D2A] text-[#F1F4F9] border border-[#2A3145] rounded-lg hover:bg-[#1E2434] transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              Proyek Baru
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 relative rounded-xl overflow-hidden border border-[#232838] bg-[#12151E] min-h-[220px]">
          <img
            src={STUDIO_COVER_IMAGE}
            alt="Ruang pascaproduksi JAJA AI Creator Studio"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D12]/90 via-[#0B0D12]/35 to-transparent flex flex-col justify-end p-6">
            <p className="text-sm font-semibold text-[#F1F4F9]">
              Tahap 3 Aktif: Character Intelligence Engine
            </p>
            <p className="text-xs text-[#CBD5E1] mt-1">
              Identity Lock · Pose &amp; Expression · Video Flow · Gemini 3.8 TTS
            </p>
          </div>
        </div>
      </section>

      {/* 4-Column Hairline Metric Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 border border-[#232838] rounded-xl bg-[#12151E] divide-y lg:divide-y-0 lg:divide-x divide-[#232838]">
        <div className="p-5 space-y-1">
          <p className="text-xs text-[#94A0B8]">Total Proyek</p>
          <p className="text-2xl font-display font-semibold tabular-nums text-[#F1F4F9]">
            {projects.length}
          </p>
          <p className="text-xs text-[#647087]">UGC, Drama, Influencer, Podcast</p>
        </div>
        <div className="p-5 space-y-1">
          <p className="text-xs text-[#94A0B8]">Karakter Terkunci</p>
          <p className="text-2xl font-display font-semibold tabular-nums text-[#F1F4F9]">
            {lockedCount} / {characters.length}
          </p>
          <p className="text-xs text-[#647087]">Siap lintas gambar &amp; video</p>
        </div>
        <div className="p-5 space-y-1">
          <p className="text-xs text-[#94A0B8]">Prompt &amp; Naskah</p>
          <p className="text-2xl font-display font-semibold tabular-nums text-[#F1F4F9]">
            {prompts.length}
          </p>
          <p className="text-xs text-[#647087]">Tersimpan di arsip produksi</p>
        </div>
        <div className="p-5 space-y-1">
          <p className="text-xs text-[#94A0B8]">Render Audio Sesi</p>
          <p className="text-2xl font-display font-semibold tabular-nums text-[#F1F4F9]">
            {voiceCount}
          </p>
          <p className="text-xs text-[#647087]">Gemini 3.8 TTS WAV 24kHz</p>
        </div>
      </section>

      {/* Character Reference Strip + Recent Projects */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#F1F4F9]">
              Character Identity Lock
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('character_engine')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-400 hover:text-sky-300 whitespace-nowrap"
            >
              Kelola semua
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {characters.length === 0 ? (
            <div className="border border-[#232838] rounded-xl bg-[#12151E] p-6 text-sm text-[#94A0B8]">
              Belum ada karakter di workspace Anda. Buka Character Intelligence untuk
              membuat atau memuat template studio.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {characters.slice(0, 3).map((char) => (
                <button
                  key={char.id}
                  type="button"
                  onClick={() => onNavigate('character_engine')}
                  className="group text-left bg-[#12151E] border border-[#232838] hover:border-[#34405B] rounded-xl overflow-hidden transition-colors"
                >
                  <div className="aspect-[4/5] bg-[#181C27] overflow-hidden relative">
                    {char.referenceImageUrl ? (
                      <img
                        src={char.referenceImageUrl}
                        alt={char.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-medium text-[#647087]">
                        {char.name}
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0B0D12]/90 via-[#0B0D12]/50 to-transparent p-3.5">
                      <p className="text-sm font-semibold text-[#F1F4F9] truncate">
                        {char.name}
                      </p>
                      <p className="text-xs text-[#CBD5E1] truncate">
                        {char.archetype}
                      </p>
                    </div>
                  </div>
                  <div className="px-3.5 py-2.5 flex items-center justify-between text-xs text-[#94A0B8]">
                    <span className="font-mono truncate">{char.consistencyCode}</span>
                    {char.identityLocked && (
                      <span className="inline-flex items-center gap-1 text-sky-400 shrink-0">
                        <Lock className="w-3 h-3" />
                        Terkunci
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#F1F4F9]">Proyek Terbaru</h2>
            <button
              type="button"
              onClick={() => onNavigate('projects')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-400 hover:text-sky-300 whitespace-nowrap"
            >
              Semua proyek
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="border border-[#232838] rounded-xl bg-[#12151E] divide-y divide-[#1F2433]">
            {projects.length === 0 ? (
              <div className="p-6 text-sm text-[#94A0B8] space-y-3">
                <p>Belum ada proyek produksi.</p>
                <button
                  type="button"
                  onClick={onOpenNewProject}
                  className="text-xs font-medium text-sky-400 hover:text-sky-300"
                >
                  Buat proyek pertama
                </button>
              </div>
            ) : (
              projects.slice(0, 4).map((proj) => {
                const isSelected = proj.id === activeProjectId;
                return (
                  <div
                    key={proj.id}
                    className="p-4 flex items-start justify-between gap-3 hover:bg-[#161A26] transition-colors"
                  >
                    <div className="min-w-0 space-y-1">
                      <button
                        type="button"
                        onClick={() => onSelectProject(proj.id)}
                        className="text-left text-sm font-medium text-[#F1F4F9] hover:text-sky-300 truncate block w-full"
                      >
                        {proj.title}
                      </button>
                      <p className="text-xs text-[#94A0B8]">
                        {proj.category} · {proj.aspectRatio} ·{' '}
                        {proj.targetPlatform || 'Multi-platform'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectProject(proj.id)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-md shrink-0 whitespace-nowrap transition-colors ${
                        isSelected
                          ? 'bg-sky-500/15 text-sky-300'
                          : 'text-[#94A0B8] hover:text-[#F1F4F9]'
                      }`}
                    >
                      {isSelected ? 'Aktif' : 'Pilih'}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Studio Shortcuts */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            <button
              type="button"
              onClick={() => onNavigate('video_flow')}
              className="p-3.5 text-left bg-[#12151E] border border-[#232838] hover:border-[#34405B] rounded-xl transition-colors"
            >
              <Clapperboard className="w-4 h-4 text-sky-400 mb-2" />
              <p className="text-xs font-medium text-[#F1F4F9]">Video Flow</p>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('ugc_studio')}
              className="p-3.5 text-left bg-[#12151E] border border-[#232838] hover:border-[#34405B] rounded-xl transition-colors"
            >
              <FolderKanban className="w-4 h-4 text-sky-400 mb-2" />
              <p className="text-xs font-medium text-[#F1F4F9]">UGC Studio</p>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('voice_studio')}
              className="p-3.5 text-left bg-[#12151E] border border-[#232838] hover:border-[#34405B] rounded-xl transition-colors"
            >
              <Volume2 className="w-4 h-4 text-sky-400 mb-2" />
              <p className="text-xs font-medium text-[#F1F4F9]">AI Voice</p>
            </button>
          </div>
        </div>
      </section>

      {/* Recent Prompts Table */}
      {prompts.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#F1F4F9]">
              Hasil Produksi Terbaru
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('prompt_library')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-400 hover:text-sky-300 whitespace-nowrap"
            >
              Buka Prompt Library
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="border border-[#232838] rounded-xl bg-[#12151E] overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#232838] text-xs text-[#647087]">
                  <th className="py-3 px-4 font-medium">Judul</th>
                  <th className="py-3 px-4 font-medium">Modul</th>
                  <th className="py-3 px-4 font-medium">Ringkasan Output</th>
                  <th className="py-3 px-4 font-medium text-right">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2433] text-sm">
                {prompts.slice(0, 5).map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onNavigate('prompt_library')}
                    className="hover:bg-[#161A26] cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-[#F1F4F9] whitespace-nowrap max-w-[220px] truncate">
                      {item.title}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#94A0B8] whitespace-nowrap">
                      {MODULE_LABELS[item.module] || item.module}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#94A0B8] max-w-[360px] truncate">
                      {item.promptText}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono tabular-nums text-[#647087] text-right whitespace-nowrap">
                      {new Date(item.updatedAtMs).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
