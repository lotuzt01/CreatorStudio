import React from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  UserCheck,
  Clapperboard,
  Megaphone,
  Film,
  Mic,
  Volume2,
  BookMarked,
  X,
} from 'lucide-react';
import type { ActiveView } from '../types/studio';
import { PWAInstallButton } from './PWAInstallButton';

interface NavGroup {
  label: string;
  items: {
    id: ActiveView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'projects', label: 'Proyek', icon: FolderKanban },
    ],
  },
  {
    label: 'Character Intelligence',
    items: [
      { id: 'character_engine', label: 'Character Lock', icon: UserCheck },
      { id: 'video_flow', label: 'Video Flow Studio', icon: Clapperboard },
    ],
  },
  {
    label: 'Content Automation',
    items: [
      { id: 'ugc_studio', label: 'UGC & Ads Studio', icon: Megaphone },
      { id: 'drama_studio', label: 'AI Drama Studio', icon: Film },
      { id: 'podcast_studio', label: 'AI Podcast Studio', icon: Mic },
      { id: 'voice_studio', label: 'AI Voice Studio', icon: Volume2 },
    ],
  },
  {
    label: 'Arsip',
    items: [{ id: 'prompt_library', label: 'Prompt Library', icon: BookMarked }],
  },
];

interface StudioSidebarProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  counts: {
    projects: number;
    characters: number;
    prompts: number;
    voices: number;
  };
}

export const StudioSidebar: React.FC<StudioSidebarProps> = ({
  activeView,
  onSelectView,
  mobileOpen,
  onCloseMobile,
  counts,
}) => {
  const getCount = (id: ActiveView): number | null => {
    if (id === 'projects') return counts.projects;
    if (id === 'character_engine') return counts.characters;
    if (id === 'prompt_library') return counts.prompts;
    if (id === 'voice_studio') return counts.voices;
    return null;
  };

  const navContent = (
    <div className="flex flex-col h-full bg-[#0E1118] border-r border-[#1F2433]">
      <div className="h-16 px-5 flex items-center justify-between border-b border-[#1F2433]">
        <button
          type="button"
          onClick={() => {
            onSelectView('dashboard');
            onCloseMobile();
          }}
          className="text-left font-display text-base font-bold tracking-tight text-[#F1F4F9] whitespace-nowrap shrink-0"
        >
          Lotuzt AI Studio
        </button>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Tutup menu"
          className="lg:hidden p-1.5 text-[#94A0B8] hover:text-white rounded-md"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1">
            <div className="px-3 pb-1.5 text-xs font-medium text-[#647087]">
              {group.label}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              const count = getCount(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectView(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-[#181E2C] text-[#F1F4F9]'
                      : 'text-[#94A0B8] hover:text-[#F1F4F9] hover:bg-[#141824]'
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-sky-400' : 'text-[#647087]'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {count !== null && count > 0 && (
                    <span className="text-xs font-mono tabular-nums text-[#647087]">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-[#1F2433] space-y-3">
        <PWAInstallButton />
        <div className="px-1 text-xs text-[#647087]">
          <p className="font-medium text-[#94A0B8]">Creator Suite Ultimate</p>
          <p className="mt-0.5">Gemini · Character Lock · Audio TTS</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        {navContent}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10">{navContent}</div>
        </div>
      )}
    </>
  );
};
