import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { Menu, LogIn, LogOut } from 'lucide-react';
import { auth, googleProvider } from './lib/firebase';
import {
  createCharacterDoc,
  createProjectDoc,
  createPromptDoc,
  deleteCharacterDoc,
  deleteProjectDoc,
  deletePromptDoc,
  generateSafeId,
  subscribeCharacters,
  subscribeProjects,
  subscribePrompts,
  syncUserProfile,
  updateCharacterDoc,
  updateProjectDoc,
} from './lib/firestoreStore';
import {
  DEFAULT_LOCAL_PROJECTS,
  STARTER_CHARACTER_TEMPLATES,
} from './data/starterTemplates';
import { StudioSidebar } from './components/StudioSidebar';
import { DashboardView } from './components/DashboardView';
import { ProjectsView } from './components/ProjectsView';
import { CharacterIntelligenceView } from './components/CharacterIntelligenceView';
import { VideoFlowView } from './components/VideoFlowView';
import { ContentStudiosView } from './components/ContentStudiosView';
import { VoiceStudioView } from './components/VoiceStudioView';
import { PromptLibraryView } from './components/PromptLibraryView';
import { OfflineIndicator } from './components/OfflineIndicator';
import type {
  ActiveView,
  AspectRatio,
  PendingVoiceTransfer,
  ProjectCategory,
  ProjectStatus,
  PromptModule,
  StudioCharacter,
  StudioProject,
  StudioPromptRecord,
  VoiceRenderItem,
} from './types/studio';

const VIEW_TITLES: Record<ActiveView, string> = {
  dashboard: 'Dashboard',
  projects: 'Manajemen Proyek',
  character_engine: 'Character Intelligence',
  video_flow: 'Video Flow Studio',
  ugc_studio: 'UGC & Ads Studio',
  drama_studio: 'AI Drama Studio',
  podcast_studio: 'AI Podcast Studio',
  voice_studio: 'AI Voice Studio',
  prompt_library: 'Prompt Library',
};

function buildPreviewCharacters(): StudioCharacter[] {
  const now = Date.now();
  return STARTER_CHARACTER_TEMPLATES.map((tpl, idx) => ({
    id: `preview_${tpl.templateId}`,
    ownerId: 'local_preview',
    projectId: idx === 0 ? 'demo_proj_influencer' : idx === 1 ? 'demo_proj_ugc' : '',
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
    createdAtMs: now - (3 - idx) * 3600000,
    updatedAtMs: now - (3 - idx) * 1800000,
  }));
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);

  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [autoOpenProjectModal, setAutoOpenProjectModal] = useState(false);

  // Cloud state when signed in
  const [cloudProjects, setCloudProjects] = useState<StudioProject[]>([]);
  const [cloudCharacters, setCloudCharacters] = useState<StudioCharacter[]>([]);
  const [cloudPrompts, setCloudPrompts] = useState<StudioPromptRecord[]>([]);

  // Local workspace state when browsing before sign-in
  const [localProjects, setLocalProjects] = useState<StudioProject[]>(DEFAULT_LOCAL_PROJECTS);
  const [localCharacters, setLocalCharacters] = useState<StudioCharacter[]>(buildPreviewCharacters);
  const [localPrompts, setLocalPrompts] = useState<StudioPromptRecord[]>([]);

  const [activeProjectId, setActiveProjectId] = useState<string>('demo_proj_influencer');
  const [voiceRenders, setVoiceRenders] = useState<VoiceRenderItem[]>([]);
  const [pendingVoice, setPendingVoice] = useState<PendingVoiceTransfer | null>(null);
  const [toast, setToast] = useState<string>('');
  const [syncError, setSyncError] = useState<string>('');

  const notify = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((curr) => (curr === msg ? '' : curr));
    }, 3200);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      setSyncError('');
      if (nextUser) {
        void syncUserProfile(nextUser).catch((err) => {
          console.error('Sync profile warning:', err);
        });
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!authReady || !user) {
      setCloudProjects([]);
      setCloudCharacters([]);
      setCloudPrompts([]);
      return;
    }

    const handleErr = (err: Error) => {
      setSyncError(err.message);
    };

    const unsubProj = subscribeProjects(
      user.uid,
      (rows) => {
        setCloudProjects(rows);
        setActiveProjectId((curr) => {
          if (rows.some((r) => r.id === curr)) return curr;
          return rows[0]?.id || '';
        });
      },
      handleErr
    );
    const unsubChar = subscribeCharacters(user.uid, setCloudCharacters, handleErr);
    const unsubPrm = subscribePrompts(user.uid, setCloudPrompts, handleErr);

    return () => {
      unsubProj();
      unsubChar();
      unsubPrm();
    };
  }, [authReady, user]);

  const projects = user ? cloudProjects : localProjects;
  const characters = user ? cloudCharacters : localCharacters;
  const prompts = user ? cloudPrompts : localPrompts;

  const handleGoogleSignIn = async () => {
    setAuthBusy(true);
    try {
      await signInWithPopup(auth, googleProvider);
      notify('Berhasil masuk. Data workspace disinkronkan ke cloud.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login dibatalkan.';
      notify(msg);
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setActiveProjectId(localProjects[0]?.id || '');
    notify('Anda telah keluar dari sesi akun.');
  };

  // CRUD Handlers (Cloud Firestore if signed in, instant local workspace otherwise)
  const handleCreateProject = async (input: {
    title: string;
    category: ProjectCategory;
    description: string;
    aspectRatio: AspectRatio;
    targetPlatform: string;
    status: ProjectStatus;
  }) => {
    if (user) {
      const id = await createProjectDoc(user.uid, input);
      setActiveProjectId(id);
      notify(`Proyek "${input.title}" tersimpan di cloud.`);
      return;
    }
    const now = Date.now();
    const id = generateSafeId('proj');
    const created: StudioProject = {
      id,
      ownerId: 'local_preview',
      ...input,
      createdAtMs: now,
      updatedAtMs: now,
    };
    setLocalProjects((prev) => [created, ...prev]);
    setActiveProjectId(id);
    notify(`Proyek "${input.title}" dibuat di sesi lokal.`);
  };

  const handleUpdateProject = async (
    id: string,
    input: {
      title: string;
      category: ProjectCategory;
      description: string;
      aspectRatio: AspectRatio;
      targetPlatform: string;
      status: ProjectStatus;
    }
  ) => {
    if (user) {
      await updateProjectDoc(id, input);
      notify('Perubahan proyek tersimpan.');
      return;
    }
    setLocalProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...input, updatedAtMs: Date.now() } : p))
    );
    notify('Perubahan proyek tersimpan.');
  };

  const handleDeleteProject = async (id: string) => {
    if (user) {
      await deleteProjectDoc(id);
      notify('Proyek dihapus.');
      return;
    }
    setLocalProjects((prev) => prev.filter((p) => p.id !== id));
    if (activeProjectId === id) setActiveProjectId('');
    notify('Proyek dihapus.');
  };

  const handleCreateCharacter = async (
    input: Omit<StudioCharacter, 'id' | 'ownerId' | 'createdAtMs' | 'updatedAtMs'>
  ): Promise<string> => {
    if (user) {
      const safeProjectId = projects.some((p) => p.id === input.projectId)
        ? input.projectId
        : '';
      return await createCharacterDoc(user.uid, { ...input, projectId: safeProjectId });
    }
    const now = Date.now();
    const id = generateSafeId('char');
    const created: StudioCharacter = {
      id,
      ownerId: 'local_preview',
      ...input,
      createdAtMs: now,
      updatedAtMs: now,
    };
    setLocalCharacters((prev) => [created, ...prev]);
    return id;
  };

  const handleUpdateCharacter = async (
    id: string,
    input: Partial<Omit<StudioCharacter, 'id' | 'ownerId' | 'createdAtMs' | 'updatedAtMs'>>
  ) => {
    if (user) {
      const patched = { ...input };
      if (patched.projectId !== undefined) {
        patched.projectId = projects.some((p) => p.id === patched.projectId)
          ? patched.projectId
          : '';
      }
      await updateCharacterDoc(id, patched);
      return;
    }
    setLocalCharacters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...input, updatedAtMs: Date.now() } : c))
    );
  };

  const handleDeleteCharacter = async (id: string) => {
    if (user) {
      await deleteCharacterDoc(id);
      notify('Karakter dihapus.');
      return;
    }
    setLocalCharacters((prev) => prev.filter((c) => c.id !== id));
    notify('Karakter dihapus.');
  };

  const handleSavePrompt = async (input: {
    projectId?: string;
    characterId?: string;
    module: PromptModule;
    title: string;
    promptText: string;
    secondaryOutput?: string;
    tags?: string[];
  }) => {
    const validProjectId =
      input.projectId && projects.some((p) => p.id === input.projectId)
        ? input.projectId
        : '';
    const validCharacterId =
      input.characterId && characters.some((c) => c.id === input.characterId)
        ? input.characterId
        : '';

    if (user) {
      await createPromptDoc(user.uid, {
        ...input,
        projectId: validProjectId,
        characterId: validCharacterId,
      });
      return;
    }

    const now = Date.now();
    const record: StudioPromptRecord = {
      id: generateSafeId('prm'),
      ownerId: 'local_preview',
      projectId: validProjectId,
      characterId: validCharacterId,
      module: input.module,
      title: input.title,
      promptText: input.promptText,
      secondaryOutput: input.secondaryOutput || '',
      tags: input.tags || [],
      createdAtMs: now,
      updatedAtMs: now,
    };
    setLocalPrompts((prev) => [record, ...prev]);
  };

  const handleDeletePrompt = async (id: string) => {
    if (user) {
      await deletePromptDoc(id);
      notify('Prompt dihapus dari arsip.');
      return;
    }
    setLocalPrompts((prev) => prev.filter((p) => p.id !== id));
    notify('Prompt dihapus dari arsip.');
  };

  const handleSendToVoice = (transfer: PendingVoiceTransfer) => {
    setPendingVoice(transfer);
    setActiveView('voice_studio');
    notify('Naskah dikirim ke AI Voice Studio. Siap dirender ke WAV.');
  };

  return (
    <div className="min-h-screen bg-[#0B0D12] text-[#F1F4F9] flex">
      <StudioSidebar
        activeView={activeView}
        onSelectView={setActiveView}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        counts={{
          projects: projects.length,
          characters: characters.length,
          prompts: prompts.length,
          voices: voiceRenders.length,
        }}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar Contract: Breadcrumb Left — Active Project Selector — Account Action */}
        <header className="h-16 sticky top-0 z-30 bg-[#0B0D12]/90 backdrop-blur-md border-b border-[#1F2433] px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Buka navigasi"
              className="lg:hidden p-2 -ml-2 text-[#94A0B8] hover:text-white rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-[#647087] hidden sm:inline whitespace-nowrap">
                Lotuzt Studio
              </span>
              <span className="text-[#333B52] hidden sm:inline">/</span>
              <span className="font-display font-semibold text-[#F1F4F9] truncate">
                {VIEW_TITLES[activeView]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {projects.length > 0 && (
              <select
                aria-label="Pilih proyek aktif"
                value={activeProjectId}
                onChange={(e) => setActiveProjectId(e.target.value)}
                className="hidden md:block max-w-[220px] truncate px-3 py-1.5 text-xs bg-[#12151E] border border-[#232838] rounded-lg text-[#CBD5E1] focus:outline-none focus:border-sky-500"
              >
                <option value="">Tanpa proyek aktif</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            )}

            {user ? (
              <div className="flex items-center gap-2.5">
                <span className="hidden sm:inline text-xs text-[#94A0B8] max-w-[140px] truncate">
                  {user.displayName || user.email}
                </span>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#12151E] border border-[#232838] text-[#CBD5E1] rounded-lg hover:text-white hover:border-[#34405B] whitespace-nowrap shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Keluar
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={authBusy}
                onClick={() => void handleGoogleSignIn()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-sky-500 text-slate-950 rounded-lg hover:bg-sky-400 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                {authBusy ? 'Memproses...' : 'Masuk Google'}
              </button>
            )}
          </div>
        </header>

        {/* Quiet Cloud Sync Banner when browsing in preview mode */}
        {!user && authReady && (
          <div className="bg-[#111520] border-b border-[#1F2433] px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-[#94A0B8]">
            <span>
              Mode Pratinjau Lokal · Seluruh generator Gemini &amp; Audio aktif. Masuk dengan
              Google untuk menyimpan proyek, karakter, dan prompt ke database cloud pribadi
              Anda.
            </span>
            <button
              type="button"
              onClick={() => void handleGoogleSignIn()}
              className="font-medium text-sky-400 hover:text-sky-300 whitespace-nowrap"
            >
              Aktifkan Sinkronisasi Cloud
            </button>
          </div>
        )}

        {syncError && (
          <div className="mx-4 sm:mx-8 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
            Sinkronisasi database terganggu: {syncError}
          </div>
        )}

        <main className="flex-1 w-full max-w-[1320px] mx-auto px-4 sm:px-8 py-6 sm:py-8">
          {activeView === 'dashboard' && (
            <DashboardView
              projects={projects}
              characters={characters}
              prompts={prompts}
              voiceCount={voiceRenders.length}
              activeProjectId={activeProjectId}
              onSelectProject={setActiveProjectId}
              onNavigate={setActiveView}
              onOpenNewProject={() => {
                setAutoOpenProjectModal(true);
                setActiveView('projects');
              }}
            />
          )}

          {activeView === 'projects' && (
            <ProjectsView
              projects={projects}
              activeProjectId={activeProjectId}
              onSelectProject={(id) => {
                setActiveProjectId(id);
                notify('Proyek aktif diperbarui.');
              }}
              onCreateProject={handleCreateProject}
              onUpdateProject={handleUpdateProject}
              onDeleteProject={handleDeleteProject}
              autoOpenCreate={autoOpenProjectModal}
              onConsumeAutoOpen={() => setAutoOpenProjectModal(false)}
            />
          )}

          {activeView === 'character_engine' && (
            <CharacterIntelligenceView
              characters={characters}
              projects={projects}
              activeProjectId={activeProjectId}
              onCreateCharacter={handleCreateCharacter}
              onUpdateCharacter={handleUpdateCharacter}
              onDeleteCharacter={handleDeleteCharacter}
              onSavePrompt={handleSavePrompt}
              onNotify={notify}
            />
          )}

          {activeView === 'video_flow' && (
            <VideoFlowView
              characters={characters}
              activeProjectId={activeProjectId}
              onSavePrompt={handleSavePrompt}
              onNotify={notify}
            />
          )}

          {(activeView === 'ugc_studio' ||
            activeView === 'drama_studio' ||
            activeView === 'podcast_studio') && (
            <ContentStudiosView
              mode={activeView}
              characters={characters}
              activeProjectId={activeProjectId}
              onSavePrompt={handleSavePrompt}
              onSendToVoice={handleSendToVoice}
              onNotify={notify}
            />
          )}

          {activeView === 'voice_studio' && (
            <VoiceStudioView
              renders={voiceRenders}
              onAddRender={(item) => setVoiceRenders((prev) => [item, ...prev])}
              pendingTransfer={pendingVoice}
              onConsumeTransfer={() => setPendingVoice(null)}
              onNotify={notify}
            />
          )}

          {activeView === 'prompt_library' && (
            <PromptLibraryView
              prompts={prompts}
              characters={characters}
              activeProjectId={activeProjectId}
              onSavePrompt={handleSavePrompt}
              onDeletePrompt={handleDeletePrompt}
              onNotify={notify}
            />
          )}
        </main>
      </div>

      <OfflineIndicator />

      {/* Subtle Toast Notification */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 max-w-sm bg-[#181E2C] border border-[#2F3A54] text-[#F1F4F9] text-xs font-medium px-4 py-3 rounded-xl shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
