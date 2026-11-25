import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  Plus,
  Trash2,
  Copy,
  Check,
  Wand2,
  Save,
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import { STARTER_CHARACTER_TEMPLATES, type CharacterTemplate } from '../data/starterTemplates';
import { copyTextToClipboard } from '../lib/clipboard';
import { studioApi, type CharacterSceneResponse, type CompileLockResponse } from '../lib/studioApi';
import type {
  AspectRatio,
  PromptModule,
  StudioCharacter,
  StudioProject,
  VisualStyle,
} from '../types/studio';

const VISUAL_STYLES: VisualStyle[] = ['Photorealistic', 'Cinematic', 'Editorial', 'Stylized'];
const POSES = [
  'Medium shot berbicara langsung ke kamera',
  'Close-up interview dengan kontak mata natural',
  'Berjalan santai (candid tracking shot)',
  'Duduk di meja studio menjelaskan produk',
  'Full body studio turnaround reference',
  'Over-the-shoulder menghadap monitor kerja',
];
const EXPRESSIONS = [
  'Tenang dan percaya diri',
  'Ramah dan antusias',
  'Serius kontemplatif',
  'Tersenyum hangat natural',
  'Fokus analitis',
  'Dramatis penuh ketegangan',
];

interface CharacterIntelligenceViewProps {
  characters: StudioCharacter[];
  projects: StudioProject[];
  activeProjectId: string;
  onCreateCharacter: (
    input: Omit<StudioCharacter, 'id' | 'ownerId' | 'createdAtMs' | 'updatedAtMs'>
  ) => Promise<string | void>;
  onUpdateCharacter: (
    id: string,
    input: Partial<Omit<StudioCharacter, 'id' | 'ownerId' | 'createdAtMs' | 'updatedAtMs'>>
  ) => Promise<void>;
  onDeleteCharacter: (id: string) => Promise<void>;
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

export const CharacterIntelligenceView: React.FC<CharacterIntelligenceViewProps> = ({
  characters,
  projects,
  activeProjectId,
  onCreateCharacter,
  onUpdateCharacter,
  onDeleteCharacter,
  onSavePrompt,
  onNotify,
}) => {
  const [selectedId, setSelectedId] = useState<string>(characters[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'dna' | 'scene_gen'>('dna');
  const [creatingNew, setCreatingNew] = useState(false);

  // Character DNA Form state
  const [name, setName] = useState('');
  const [archetype, setArchetype] = useState('');
  const [visualStyle, setVisualStyle] = useState<VisualStyle>('Photorealistic');
  const [projectId, setProjectId] = useState(activeProjectId);
  const [faceDescription, setFaceDescription] = useState('');
  const [hairAndWardrobe, setHairAndWardrobe] = useState('');
  const [bodyAndTraits, setBodyAndTraits] = useState('');
  const [signatureOutfit, setSignatureOutfit] = useState('');
  const [consistencyCode, setConsistencyCode] = useState('');
  const [identityLocked, setIdentityLocked] = useState(true);
  const [identityLockPrompt, setIdentityLockPrompt] = useState('');
  const [referenceImageUrl, setReferenceImageUrl] = useState('');

  // AI states
  const [saving, setSaving] = useState(false);
  const [compilingLock, setCompilingLock] = useState(false);
  const [lockPack, setLockPack] = useState<CompileLockResponse | null>(null);

  // Pose / Expression / Scene Generator state
  const [pose, setPose] = useState(POSES[0]);
  const [expression, setExpression] = useState(EXPRESSIONS[0]);
  const [outfitOverride, setOutfitOverride] = useState('');
  const [sceneLocation, setSceneLocation] = useState(
    'Studio modern minimalis dengan latar gelap dan pencahayaan key-light lembut'
  );
  const [cameraLighting, setCameraLighting] = useState(
    '85mm lens, shallow depth of field, soft editorial key light & clean rim light'
  );
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [generatingScene, setGeneratingScene] = useState(false);
  const [sceneOutput, setSceneOutput] = useState<CharacterSceneResponse | null>(null);
  const [aiError, setAiError] = useState('');
  const [copiedKey, setCopiedKey] = useState('');

  const selectedChar = characters.find((c) => c.id === selectedId) || null;

  useEffect(() => {
    if (!creatingNew && !selectedChar) {
      if (characters.length > 0) {
        setSelectedId(characters[0].id);
      } else if (selectedId) {
        setSelectedId('');
        setName('');
        setArchetype('Virtual Presenter');
        setFaceDescription('');
        setHairAndWardrobe('');
        setBodyAndTraits('');
        setSignatureOutfit('');
        setConsistencyCode('JAJA_CHAR_01');
        setIdentityLockPrompt('');
        setReferenceImageUrl('');
        setLockPack(null);
        setSceneOutput(null);
      }
    }
  }, [characters, selectedChar, creatingNew, selectedId]);

  useEffect(() => {
    if (!creatingNew && selectedChar) {
      setName(selectedChar.name);
      setArchetype(selectedChar.archetype);
      setVisualStyle(selectedChar.visualStyle);
      setProjectId(selectedChar.projectId || '');
      setFaceDescription(selectedChar.faceDescription);
      setHairAndWardrobe(selectedChar.hairAndWardrobe);
      setBodyAndTraits(selectedChar.bodyAndTraits);
      setSignatureOutfit(selectedChar.signatureOutfit);
      setConsistencyCode(selectedChar.consistencyCode);
      setIdentityLocked(selectedChar.identityLocked);
      setIdentityLockPrompt(selectedChar.identityLockPrompt);
      setReferenceImageUrl(selectedChar.referenceImageUrl);
      setOutfitOverride(selectedChar.signatureOutfit);
      setLockPack(null);
      setSceneOutput(null);
      setAiError('');
    }
  }, [selectedChar, creatingNew]);

  const startNewCharacter = () => {
    setCreatingNew(true);
    setSelectedId('');
    setActiveTab('dna');
    setName('');
    setArchetype('Virtual Presenter');
    setVisualStyle('Photorealistic');
    setProjectId(activeProjectId);
    setFaceDescription('');
    setHairAndWardrobe('');
    setBodyAndTraits('');
    setSignatureOutfit('');
    setConsistencyCode(`JAJA_CHAR_${Math.floor(10 + Math.random() * 89)}`);
    setIdentityLocked(true);
    setIdentityLockPrompt('');
    setReferenceImageUrl('');
    setLockPack(null);
    setSceneOutput(null);
  };

  const applyTemplate = async (tpl: CharacterTemplate) => {
    setSaving(true);
    try {
      const newId = await onCreateCharacter({
        projectId: activeProjectId || '',
        name: tpl.name,
        archetype: tpl.archetype,
        visualStyle: tpl.visualStyle,
        faceDescription: tpl.faceDescription,
        hairAndWardrobe: tpl.hairAndWardrobe,
        bodyAndTraits: tpl.bodyAndTraits,
        signatureOutfit: tpl.signatureOutfit,
        consistencyCode: tpl.consistencyCode,
        identityLocked: tpl.identityLocked,
        identityLockPrompt: tpl.identityLockPrompt,
        referenceImageUrl: tpl.referenceImageUrl,
      });
      setCreatingNew(false);
      if (newId) setSelectedId(newId);
      onNotify(`Template karakter "${tpl.name}" ditambahkan ke perpustakaan.`);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Gagal memuat template karakter.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDna = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setAiError('');
    setSaving(true);
    try {
      const payload = {
        projectId,
        name: name.trim(),
        archetype: archetype.trim() || 'Virtual Creator',
        visualStyle,
        faceDescription: faceDescription.trim(),
        hairAndWardrobe: hairAndWardrobe.trim(),
        bodyAndTraits: bodyAndTraits.trim(),
        signatureOutfit: signatureOutfit.trim(),
        consistencyCode:
          consistencyCode.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'JAJA_CHAR_01',
        identityLocked,
        identityLockPrompt: identityLockPrompt.trim(),
        referenceImageUrl: referenceImageUrl.trim(),
      };
      if (creatingNew || !selectedChar) {
        const createdId = await onCreateCharacter(payload);
        setCreatingNew(false);
        if (createdId) setSelectedId(createdId);
        onNotify(`Karakter "${payload.name}" berhasil dibuat.`);
      } else {
        await onUpdateCharacter(selectedChar.id, payload);
        onNotify(`DNA karakter "${payload.name}" diperbarui.`);
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Gagal menyimpan DNA karakter.');
    } finally {
      setSaving(false);
    }
  };

  const handleCompileIdentityLock = async () => {
    if (!name.trim()) {
      setAiError('Isi nama karakter terlebih dahulu sebelum menyusun Identity Lock.');
      return;
    }
    setAiError('');
    setCompilingLock(true);
    try {
      const res = await studioApi.compileCharacterLock({
        name,
        archetype,
        visualStyle,
        faceDescription,
        hairAndWardrobe,
        bodyAndTraits,
        signatureOutfit,
        consistencyCode,
      });
      setIdentityLockPrompt(res.identityLockPrompt || '');
      setIdentityLocked(true);
      setLockPack(res);
      if (!creatingNew && selectedChar) {
        await onUpdateCharacter(selectedChar.id, {
          identityLocked: true,
          identityLockPrompt: res.identityLockPrompt || '',
        });
      }
      onNotify('Identity Lock Master Prompt berhasil disusun oleh Gemini.');
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Gagal menyusun Identity Lock.');
    } finally {
      setCompilingLock(false);
    }
  };

  const handleGenerateScene = async () => {
    const activeName = name.trim();
    if (!activeName) {
      setAiError('Pilih atau buat karakter terlebih dahulu.');
      return;
    }
    setAiError('');
    setGeneratingScene(true);
    try {
      const res = await studioApi.generateCharacterScene({
        character: {
          name: activeName,
          archetype,
          visualStyle,
          faceDescription,
          hairAndWardrobe,
          bodyAndTraits,
          signatureOutfit,
          consistencyCode,
          identityLockPrompt,
        },
        pose,
        expression,
        outfitOverride,
        sceneLocation,
        cameraLighting,
        aspectRatio,
      });
      setSceneOutput(res);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Gagal menghasilkan variasi adegan.');
    } finally {
      setGeneratingScene(false);
    }
  };

  const handleCopy = async (key: string, text: string) => {
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(''), 1800);
    }
  };

  const handleSaveSceneToLibrary = async () => {
    if (!sceneOutput) return;
    try {
      await onSavePrompt({
        projectId: projectId || activeProjectId || '',
        characterId: selectedChar?.id || '',
        module: 'character_engine',
        title: `${name} · ${pose.slice(0, 48)}`,
        promptText: sceneOutput.imagePrompt,
        secondaryOutput: `VIDEO MOTION PROMPT (GOOGLE FLOW):\n${sceneOutput.videoMotionPrompt}\n\nNEGATIVE CONSTRAINTS:\n${sceneOutput.negativePrompt}`,
        tags: [consistencyCode || name, aspectRatio, 'identity-lock'],
      });
      onNotify('Prompt karakter terkunci disimpan ke Prompt Library.');
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Gagal menyimpan prompt.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#F1F4F9]">
            Character Intelligence Engine
          </h1>
          <p className="text-sm text-[#94A0B8] mt-1">
            Kunci identitas visual karakter dan hasilkan variasi pose, ekspresi, outfit,
            serta prompt Video Flow yang konsisten.
          </p>
        </div>
        <button
          type="button"
          onClick={startNewCharacter}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-sky-500 text-slate-950 rounded-lg hover:bg-sky-400 transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Karakter Baru
        </button>
      </div>

      {/* Starter Templates Bar */}
      <div className="bg-[#12151E] border border-[#232838] rounded-xl p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#F1F4F9]">
              Template Referensi Studio Siap Pakai
            </p>
            <p className="text-xs text-[#94A0B8]">
              Muat preset karakter studio dengan potret referensi ke workspace Anda dalam satu klik.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {STARTER_CHARACTER_TEMPLATES.map((tpl) => (
              <button
                key={tpl.templateId}
                type="button"
                disabled={saving}
                onClick={() => void applyTemplate(tpl)}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-[#181D2A] border border-[#2A3145] text-[#F1F4F9] rounded-lg hover:border-sky-500/60 transition-colors whitespace-nowrap"
              >
                <UserPlus className="w-3.5 h-3.5 text-sky-400" />
                {tpl.name} · {tpl.visualStyle}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main 2-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Character Reference Library */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#F1F4F9]">
              Perpustakaan Karakter ({characters.length})
            </h2>
          </div>

          <div className="space-y-2.5">
            {characters.length === 0 ? (
              <div className="p-6 bg-[#12151E] border border-[#232838] rounded-xl text-sm text-[#94A0B8]">
                Belum ada karakter tersimpan. Pilih template di atas atau klik Karakter Baru.
              </div>
            ) : (
              characters.map((char) => {
                const isSelected = !creatingNew && char.id === selectedId;
                return (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => {
                      setCreatingNew(false);
                      setSelectedId(char.id);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-colors flex items-center gap-3.5 ${
                      isSelected
                        ? 'bg-[#171C29] border-sky-500/60'
                        : 'bg-[#12151E] border-[#232838] hover:border-[#34405B]'
                    }`}
                  >
                    <div className="w-14 h-16 rounded-lg overflow-hidden bg-[#1B2030] shrink-0">
                      {char.referenceImageUrl ? (
                        <img
                          src={char.referenceImageUrl}
                          alt={char.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-[#647087]">
                          {char.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[#F1F4F9] truncate">
                          {char.name}
                        </p>
                        {char.identityLocked ? (
                          <Lock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        ) : (
                          <Unlock className="w-3.5 h-3.5 text-[#647087] shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-[#94A0B8] truncate">{char.archetype}</p>
                      <p className="text-xs font-mono text-[#647087] truncate">
                        {char.consistencyCode} · {char.visualStyle}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: DNA Identity Lock & Scene Generator */}
        <div className="lg:col-span-8 bg-[#12151E] border border-[#232838] rounded-xl overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-[#1F2433] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 bg-[#0B0D12] border border-[#232838] rounded-lg self-start">
              <button
                type="button"
                onClick={() => setActiveTab('dna')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  activeTab === 'dna'
                    ? 'bg-[#1F2637] text-[#F1F4F9]'
                    : 'text-[#94A0B8] hover:text-[#F1F4F9]'
                }`}
              >
                DNA &amp; Identity Lock
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('scene_gen')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  activeTab === 'scene_gen'
                    ? 'bg-[#1F2637] text-[#F1F4F9]'
                    : 'text-[#94A0B8] hover:text-[#F1F4F9]'
                }`}
              >
                Pose, Ekspresi &amp; Scene Generator
              </button>
            </div>

            {!creatingNew && selectedChar && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const next = !identityLocked;
                    setIdentityLocked(next);
                    void onUpdateCharacter(selectedChar.id, {
                      identityLocked: next,
                      identityLockPrompt,
                    });
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                    identityLocked
                      ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                      : 'bg-[#0B0D12] border-[#232838] text-[#94A0B8]'
                  }`}
                >
                  {identityLocked ? (
                    <>
                      <Lock className="w-3.5 h-3.5" /> Identity Terkunci
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5" /> Identity Terbuka
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await onDeleteCharacter(selectedChar.id);
                    setSelectedId('');
                  }}
                  aria-label="Hapus karakter"
                  className="p-1.5 text-[#94A0B8] hover:text-rose-400 rounded-lg hover:bg-[#1B2130]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {aiError && (
            <div className="mx-6 mt-4 p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
              {aiError}
            </div>
          )}

          {activeTab === 'dna' ? (
            <form onSubmit={handleSaveDna} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {referenceImageUrl && (
                  <div className="md:col-span-4">
                    <div className="aspect-[3/4] rounded-xl overflow-hidden border border-[#232838] bg-[#0B0D12]">
                      <img
                        src={referenceImageUrl}
                        alt={name || 'Referensi karakter'}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                <div
                  className={`${
                    referenceImageUrl ? 'md:col-span-8' : 'md:col-span-12'
                  } grid grid-cols-1 sm:grid-cols-2 gap-4`}
                >
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#94A0B8]">Nama Karakter</label>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: Nomigosi"
                      className="w-full px-3.5 py-2 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9] focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#94A0B8]">
                      Archetype / Peran
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      value={archetype}
                      onChange={(e) => setArchetype(e.target.value)}
                      placeholder="Tech Presenter, UGC Host, Protagonis"
                      className="w-full px-3.5 py-2 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9] focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#94A0B8]">
                      Kode Konsistensi (ID)
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={64}
                      value={consistencyCode}
                      onChange={(e) => setConsistencyCode(e.target.value)}
                      placeholder="JAJA_NOMIGOSI_01"
                      className="w-full px-3.5 py-2 text-sm font-mono bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9] focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#94A0B8]">Gaya Visual</label>
                    <select
                      value={visualStyle}
                      onChange={(e) => setVisualStyle(e.target.value as VisualStyle)}
                      className="w-full px-3.5 py-2 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9] focus:outline-none focus:border-sky-500"
                    >
                      {VISUAL_STYLES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-medium text-[#94A0B8]">
                      Tautkan ke Proyek (Opsional)
                    </label>
                    <select
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9] focus:outline-none focus:border-sky-500"
                    >
                      <option value="">Global (Semua Proyek)</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#94A0B8]">
                    Struktur Wajah &amp; Usia
                  </label>
                  <textarea
                    rows={2}
                    maxLength={800}
                    value={faceDescription}
                    onChange={(e) => setFaceDescription(e.target.value)}
                    placeholder="Bentuk rahang, mata, rona kulit, janggut/riasan..."
                    className="w-full px-3.5 py-2 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9] focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#94A0B8]">
                    Rambut &amp; Detail Aksesori
                  </label>
                  <textarea
                    rows={2}
                    maxLength={800}
                    value={hairAndWardrobe}
                    onChange={(e) => setHairAndWardrobe(e.target.value)}
                    placeholder="Potongan rambut, warna, kacamata, anting, jam..."
                    className="w-full px-3.5 py-2 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9] focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#94A0B8]">
                    Postur &amp; Karakteristik Gestur
                  </label>
                  <textarea
                    rows={2}
                    maxLength={800}
                    value={bodyAndTraits}
                    onChange={(e) => setBodyAndTraits(e.target.value)}
                    placeholder="Postur tubuh, gaya bicara visual, bahasa tubuh..."
                    className="w-full px-3.5 py-2 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9] focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#94A0B8]">
                    Pakaian Signature
                  </label>
                  <textarea
                    rows={2}
                    maxLength={500}
                    value={signatureOutfit}
                    onChange={(e) => setSignatureOutfit(e.target.value)}
                    placeholder="Kostum utama untuk kontinuitas lintas episode..."
                    className="w-full px-3.5 py-2 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9] focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-medium text-[#94A0B8]">
                    Identity Lock Master Prompt (Otomatis Disisipkan Lintas Studio)
                  </label>
                  <button
                    type="button"
                    disabled={compilingLock}
                    onClick={() => void handleCompileIdentityLock()}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-400 hover:text-sky-300 disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${compilingLock ? 'animate-spin' : ''}`}
                    />
                    {compilingLock ? 'Menyusun...' : 'Kompilasi Lock dengan Gemini'}
                  </button>
                </div>
                <textarea
                  rows={4}
                  maxLength={3000}
                  value={identityLockPrompt}
                  onChange={(e) => setIdentityLockPrompt(e.target.value)}
                  placeholder="Klik 'Kompilasi Lock dengan Gemini' untuk menghasilkan anchor identitas visual presisi tinggi..."
                  className="w-full px-3.5 py-2.5 text-xs font-mono leading-relaxed bg-[#0B0D12] border border-[#232838] rounded-lg text-[#CBD5E1] focus:outline-none focus:border-sky-500"
                />
              </div>

              {lockPack && (
                <div className="pt-2 border-t border-[#1F2433] space-y-4">
                  <p className="text-xs font-semibold text-[#F1F4F9]">
                    Reference Sheet &amp; Turnaround Prompts (Siap Salin)
                  </p>
                  <div className="space-y-2.5">
                    {lockPack.turnaroundPrompts?.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-[#0B0D12] border border-[#232838] rounded-lg space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-sky-400">
                            {item.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => void handleCopy(`turn_${idx}`, item.prompt)}
                            className="inline-flex items-center gap-1 text-xs text-[#94A0B8] hover:text-[#F1F4F9]"
                          >
                            {copiedKey === `turn_${idx}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            Salin
                          </button>
                        </div>
                        <p className="text-xs font-mono text-[#CBD5E1] leading-relaxed">
                          {item.prompt}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-sky-500 text-slate-950 rounded-lg hover:bg-sky-400 disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Menyimpan...' : creatingNew ? 'Buat Karakter' : 'Simpan DNA Karakter'}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#94A0B8]">Pose &amp; Framing</label>
                  <select
                    value={pose}
                    onChange={(e) => setPose(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9] focus:outline-none focus:border-sky-500"
                  >
                    {POSES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#94A0B8]">Ekspresi Wajah</label>
                  <select
                    value={expression}
                    onChange={(e) => setExpression(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9] focus:outline-none focus:border-sky-500"
                  >
                    {EXPRESSIONS.map((ex) => (
                      <option key={ex} value={ex}>
                        {ex}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#94A0B8]">
                    Variasi Outfit (Kosongkan untuk Signature)
                  </label>
                  <input
                    type="text"
                    value={outfitOverride}
                    onChange={(e) => setOutfitOverride(e.target.value)}
                    placeholder={signatureOutfit || 'Pakaian adegan ini'}
                    className="w-full px-3.5 py-2 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9] focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#94A0B8]">Aspect Ratio</label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                    className="w-full px-3.5 py-2 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9] focus:outline-none focus:border-sky-500"
                  >
                    <option value="9:16">9:16 (Vertical Reels / TikTok)</option>
                    <option value="16:9">16:9 (Cinematic Widescreen)</option>
                    <option value="3:4">3:4 (Editorial Portrait)</option>
                    <option value="1:1">1:1 (Square Feed)</option>
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-[#94A0B8]">
                    Lokasi &amp; Suasana Adegan
                  </label>
                  <input
                    type="text"
                    value={sceneLocation}
                    onChange={(e) => setSceneLocation(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9] focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-[#94A0B8]">
                    Lensa Kamera &amp; Pencahayaan
                  </label>
                  <input
                    type="text"
                    value={cameraLighting}
                    onChange={(e) => setCameraLighting(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-[#0B0D12] border border-[#232838] rounded-lg text-[#F1F4F9] focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-[#94A0B8]">
                  Anchor aktif:{' '}
                  <span className="font-mono text-[#F1F4F9]">
                    {consistencyCode || name || 'Belum dipilih'}
                  </span>
                </p>
                <button
                  type="button"
                  disabled={generatingScene}
                  onClick={() => void handleGenerateScene()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-sky-500 text-slate-950 rounded-lg hover:bg-sky-400 disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  <Wand2 className="w-4 h-4" />
                  {generatingScene ? 'Menyusun Prompt...' : 'Generate Scene Terkunci'}
                </button>
              </div>

              {sceneOutput && (
                <div className="pt-4 border-t border-[#1F2433] space-y-4">
                  <div className="p-4 bg-[#0B0D12] border border-[#232838] rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-sky-400">
                        Master Image Prompt (Identity Locked)
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleCopy('img', sceneOutput.imagePrompt)}
                        className="inline-flex items-center gap-1 text-xs text-[#94A0B8] hover:text-[#F1F4F9]"
                      >
                        {copiedKey === 'img' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        Salin
                      </button>
                    </div>
                    <p className="text-xs font-mono text-[#E2E8F0] leading-relaxed whitespace-pre-wrap">
                      {sceneOutput.imagePrompt}
                    </p>
                  </div>

                  <div className="p-4 bg-[#0B0D12] border border-[#232838] rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-sky-400">
                        Google Flow / Video Motion Prompt
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleCopy('vid', sceneOutput.videoMotionPrompt)}
                        className="inline-flex items-center gap-1 text-xs text-[#94A0B8] hover:text-[#F1F4F9]"
                      >
                        {copiedKey === 'vid' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        Salin
                      </button>
                    </div>
                    <p className="text-xs font-mono text-[#E2E8F0] leading-relaxed whitespace-pre-wrap">
                      {sceneOutput.videoMotionPrompt}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-[#0B0D12] border border-[#232838] rounded-xl space-y-1.5">
                      <p className="text-xs font-semibold text-[#94A0B8]">Negative Prompt</p>
                      <p className="text-xs font-mono text-[#94A0B8] leading-relaxed">
                        {sceneOutput.negativePrompt}
                      </p>
                    </div>
                    <div className="p-4 bg-[#0B0D12] border border-[#232838] rounded-xl space-y-1.5">
                      <p className="text-xs font-semibold text-[#94A0B8]">
                        Checklist Kontinuitas
                      </p>
                      <ul className="space-y-1 text-xs text-[#CBD5E1] list-disc pl-4">
                        {sceneOutput.continuityChecklist?.map((c, idx) => (
                          <li key={idx}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => void handleSaveSceneToLibrary()}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[#181D2A] border border-[#2A3145] text-[#F1F4F9] rounded-lg hover:border-sky-500/60"
                    >
                      <Save className="w-3.5 h-3.5 text-sky-400" />
                      Simpan ke Prompt Library
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
