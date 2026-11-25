import React from 'react';

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'Terjadi kesalahan pada aplikasi.',
    };
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error);
  }

  render() {
    if (this.state.hasError) {
      let displayDetail = this.state.errorMessage;
      try {
        const parsed = JSON.parse(this.state.errorMessage);
        if (parsed.error && parsed.operationType) {
          displayDetail = `Akses database (${parsed.operationType} · ${parsed.path || 'root'}): ${parsed.error}`;
        }
      } catch {
        // Keep raw error message
      }

      return (
        <div className="min-h-screen bg-[#0B0D12] text-[#F1F4F9] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-[#12151E] border border-[#232838] rounded-xl p-6 space-y-4">
            <h1 className="text-lg font-semibold text-[#F1F4F9]">
              Gangguan Sementara pada Workspace
            </h1>
            <p className="text-sm text-[#94A0B8] leading-relaxed">
              {displayDetail}
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, errorMessage: '' })}
              className="px-4 py-2 text-sm font-medium bg-sky-500 text-slate-950 rounded-lg hover:bg-sky-400 transition-colors"
            >
              Muat Ulang Tampilan
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
