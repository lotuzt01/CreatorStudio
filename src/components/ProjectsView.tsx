import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Check, Search } from 'lucide-react';
import type {
  AspectRatio,
  ProjectCategory,
  ProjectStatus,
  StudioProject,
} from '../types/studio';

const CATEGORIES: ProjectCategory[] = [
  'UGC',
  'AI Drama',
  'Influencer',
  'Podcast',
  'Social Media',
  'Ads',
];

const RATIOS: AspectRatio[] = ['9:16', '16:9', '1:1', '3:4'];

const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'Draft',
  in_progress: 'Produksi',
  completed: 'Selesai (Terkunci)',
};

interface ProjectsViewProps {
  projects: StudioProject[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onCreateProject: (input: {
    title: string;
    category: ProjectCategory;
    description: string;
    aspectRatio: AspectRatio;
    targetPlatform: string;
    status: ProjectStatus;
  }) => Promise<void>;
  onUpdateProject: (
    id: string,
    input: {
      title: string;
      category: ProjectCategory;
      description: string;
      aspectRatio: AspectRatio;
      targetPlatform: string;
      status: ProjectStatus;
    }
  ) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  autoOpenCreate?: boolean;
  onConsumeAutoOpen?: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  autoOpenCreate,
  onConsumeAutoOpen,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | ProjectCategory>('ALL');
  const [showForm, setShowForm] = useState(Boolean(autoOpenCreate));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('UGC');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [targetPlatform, setTargetPlatform] = useState('TikTok & Reels');
  const [status, setStatus] = useState<ProjectStatus>('draft');
  const [description, setDescription] = useState('');

  React.useEffect(() => {
    if (autoOpenCreate) {
      setEditingId(null);
      setTitle('');
      setDescription('');
      setStatus('draft');
      setShowForm(true);
      onConsumeAutoOpen?.();
    }
  }, [autoOpenCreate, onConsumeAutoOpen]);

  const filtered = projects.filter((p) => {
    const matchCat = categoryFilter === 'ALL' || p.category === categoryFilter;
    const q = search.trim().toLowerCase();
    const matchQ =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.targetPlatform.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  const startCreate = () => {
    setEditingId(null);
    setTitle('');
    setCategory('UGC');
    setAspectRatio('9:16');
    setTargetPlatform('TikTok & Reels');
    setStatus('draft');
    setDescription('');
    setShowForm(true);
  };

  const startEdit = (p: StudioProject) => {
    if (p.status === 'completed') return;
    setEditingId(p.id);
    setTitle(p.title);
    setCategory(p.category);
    setAspectRatio(p.aspectRatio);
    setTargetPlatform(p.targetPlatform);
    setStatus(p.status);
    setDescription(p.description);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setFormError('');
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        category,
        description: description.trim(),
        aspectRatio,
        targetPlatform: targetPlatform.trim() || 'Multi-platform',
        status,
      };
      if (editingId) {
        await onUpdateProject(editingId, payload);
      } else {
        await onCreateProject(payload);
      }
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan proyek.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#F1F4F9]">Manajemen Proyek</h1>
          <p className="text-sm text-[#94A0B8] mt-1">
            Atur proyek produksi aktif untuk menautkan karakter, prompt video, dan naskah.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-sky-500 text-slate-950 rounded-lg hover:bg-sky-400 transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Buat Proyek
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-[#12151E] border border-[#232838] rounded-xl p-6 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-[#1F2433] pb-3">
            <h2 className="text-sm font-semibold text-[#F1F4F9]">
              {editingId ? 'Edit Detail Proyek' : 'Proyek Produksi Baru'}
            </h2>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs text-[#94A0B8] hover:text-[#F1F4F9]"
            >
              Batal
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#94A0B8]">Judul Proyek</label>
              <input
                type="text"
                required
                maxLength={140}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Serial Edukasi Tech Nomigosi Eps 1-5"
                className="w-full px-3.5 py-2.5 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9] placeholder-[#647087] focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#94A0B8]">Target Platform</label>
              <input
                type="text"
                maxLength={80}
                value={targetPlatform}
                onChange={(e) => setTargetPlatform(e.target.value)}
                placeholder="TikTok, YouTube Shorts, Instagram Reels"
                className="w-full px-3.5 py-2.5 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9] placeholder-[#647087] focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#94A0B8]">Kategori Studio</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9] focus:outline-none focus:border-sky-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#94A0B8]">Aspect Ratio</label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9] focus:outline-none focus:border-sky-500"
                >
                  {RATIOS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#94A0B8]">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9] focus:outline-none focus:border-sky-500"
                >
                  <option value="draft">Draft</option>
                  <option value="in_progress">Produksi</option>
                  <option value="completed">Selesai (Kunci Final)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#94A0B8]">Ringkasan Brief</label>
            <textarea
              rows={3}
              maxLength={1200}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tujuan kampanye, gaya visual, dan catatan produksi..."
              className="w-full px-3.5 py-2.5 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9] placeholder-[#647087] focus:outline-none focus:border-sky-500"
            />
          </div>

          {formError && (
            <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg p-3">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-[#94A0B8] hover:text-[#F1F4F9]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold bg-sky-500 text-slate-950 rounded-lg hover:bg-sky-400 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Simpan Proyek'}
            </button>
          </div>
        </form>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#647087] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari proyek..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-[#12151E] border border-[#232838] rounded-lg text-[#F1F4F9] placeholder-[#647087] focus:outline-none focus:border-sky-500"
          />
        </div>
        <div className="flex items-center gap-1 p-1 bg-[#12151E] border border-[#232838] rounded-lg overflow-x-auto">
          <button
            type="button"
            onClick={() => setCategoryFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              categoryFilter === 'ALL'
                ? 'bg-[#1F2637] text-[#F1F4F9]'
                : 'text-[#94A0B8] hover:text-[#F1F4F9]'
            }`}
          >
            Semua
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategoryFilter(c)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                categoryFilter === c
                  ? 'bg-[#1F2637] text-[#F1F4F9]'
                  : 'text-[#94A0B8] hover:text-[#F1F4F9]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Table */}
      <div className="border border-[#232838] rounded-xl bg-[#12151E] overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm text-[#94A0B8]">
              Tidak ada proyek yang cocok dengan filter saat ini.
            </p>
            <button
              type="button"
              onClick={startCreate}
              className="px-4 py-2 text-xs font-semibold bg-sky-500 text-slate-950 rounded-lg hover:bg-sky-400"
            >
              Buat Proyek Pertama
            </button>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#232838] text-xs text-[#647087]">
                <th className="py-3 px-4 font-medium">Proyek</th>
                <th className="py-3 px-4 font-medium">Kategori &amp; Rasio</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Diperbarui</th>
                <th className="py-3 px-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2433] text-sm">
              {filtered.map((proj) => {
                const isActive = proj.id === activeProjectId;
                return (
                  <tr
                    key={proj.id}
                    className="hover:bg-[#161A26] transition-colors"
                  >
                    <td className="py-3.5 px-4 max-w-md">
                      <p className="font-medium text-[#F1F4F9]">{proj.title}</p>
                      {proj.description && (
                        <p className="text-xs text-[#94A0B8] mt-0.5 line-clamp-1">
                          {proj.description}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#94A0B8] whitespace-nowrap">
                      {proj.category} · <span className="font-mono">{proj.aspectRatio}</span> ·{' '}
                      {proj.targetPlatform}
                    </td>
                    <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                      <span
                        className={
                          proj.status === 'completed'
                            ? 'text-emerald-400'
                            : proj.status === 'in_progress'
                              ? 'text-sky-400'
                              : 'text-[#94A0B8]'
                        }
                      >
                        {STATUS_LABELS[proj.status]}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono tabular-nums text-[#647087] text-right whitespace-nowrap">
                      {new Date(proj.updatedAtMs).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectProject(proj.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            isActive
                              ? 'bg-sky-500/15 text-sky-300'
                              : 'text-[#94A0B8] hover:text-[#F1F4F9] hover:bg-[#1F2637]'
                          }`}
                        >
                          {isActive && <Check className="w-3.5 h-3.5" />}
                          {isActive ? 'Aktif' : 'Gunakan'}
                        </button>
                        {proj.status !== 'completed' && (
                          <button
                            type="button"
                            onClick={() => startEdit(proj)}
                            aria-label="Edit proyek"
                            className="p-1.5 text-[#94A0B8] hover:text-[#F1F4F9] rounded-md hover:bg-[#1F2637]"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => void onDeleteProject(proj.id)}
                          aria-label="Hapus proyek"
                          className="p-1.5 text-[#94A0B8] hover:text-rose-400 rounded-md hover:bg-[#1F2637]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
