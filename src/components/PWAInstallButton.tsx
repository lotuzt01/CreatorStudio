import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    setShowGuide(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void handleClick()}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-[#161C29] border border-[#2A334A] text-[#F1F4F9] hover:border-sky-500/60 hover:bg-[#1B2233] transition-colors whitespace-nowrap"
      >
        {isIOS ? (
          <Smartphone className="w-3.5 h-3.5 text-sky-400 shrink-0" />
        ) : (
          <Download className="w-3.5 h-3.5 text-sky-400 shrink-0" />
        )}
        <span>{isIOS ? 'Install di iOS' : 'Install Aplikasi (PWA)'}</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-title"
        >
          <div className="w-full max-w-md rounded-xl bg-[#12151E] border border-[#232838] p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 id="pwa-install-title" className="text-base font-semibold text-[#F1F4F9]">
                {isIOS ? 'Install JAJA Studio di iPhone / iPad' : 'Install JAJA Studio sebagai PWA'}
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Tutup panduan"
                className="p-1 text-[#94A0B8] hover:text-white rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="text-sm text-[#CBD5E1] space-y-2 list-decimal pl-5 leading-relaxed">
                <li>
                  Buka aplikasi ini di browser <strong>Safari</strong> (bukan di dalam iframe).
                </li>
                <li>
                  Ketuk tombol <strong>Bagikan (Share)</strong> di bilah bawah Safari.
                </li>
                <li>
                  Gulir ke bawah lalu pilih <strong>Tambahkan ke Layar Utama</strong>.
                </li>
              </ol>
            ) : (
              <ol className="text-sm text-[#CBD5E1] space-y-2 list-decimal pl-5 leading-relaxed">
                <li>
                  Buka URL aplikasi langsung di tab browser Chrome, Edge, atau Brave (di luar
                  panel pratinjau iframe).
                </li>
                <li>
                  Klik ikon <strong>Install</strong> di ujung kanan kolom alamat browser, atau
                  buka menu browser lalu pilih <strong>Install JAJA AI Creator Studio</strong>.
                </li>
              </ol>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full py-2 text-sm font-semibold bg-sky-500 text-slate-950 rounded-lg hover:bg-sky-400 transition-colors"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};
