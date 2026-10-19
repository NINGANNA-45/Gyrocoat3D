import React from 'react';
import {
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Zap,
  X,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { REGIONS } from '../constants/simulationConfig';

export default function CompletionModal({
  isOpen,
  onClose,
  onReplay,
  activeRecipe,
  burstCount,
  elapsedTotalSeconds,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-emerald-500/40 shadow-[0_0_50px_rgba(34,197,94,0.2)] overflow-hidden font-sans">
        {/* Glow Header */}
        <div className="p-6 bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-900 border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                  Step 9 Complete
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Fixture Neutral [0°, 0°]
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-100 mt-1">
                Multi-Axis Coating Cycle Finished
              </h2>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Metrology Summary Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase">
                Regions Processed
              </span>
              <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
                {REGIONS.length} / {REGIONS.length}
              </div>
              <span className="text-[10px] font-mono text-emerald-500/80">
                100% Coverage
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase">
                Powder Bursts
              </span>
              <div className="text-2xl font-mono font-bold text-orange-400 mt-1">
                {burstCount}
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Discrete Pulses
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase">
                Target Thickness
              </span>
              <div className="text-2xl font-mono font-bold text-cyan-400 mt-1">
                75 µm
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                ± 3.2 µm Uniformity
              </span>
            </div>
          </div>

          {/* Recipe Performance Note */}
          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Layers className="w-3.5 h-3.5" />
                <span>RECIPE: {activeRecipe.name.toUpperCase()}</span>
              </span>
              <span className="text-slate-400">
                Duration: {elapsedTotalSeconds.toFixed(1)}s
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {activeRecipe.description}
            </p>
          </div>

          {/* Ideathon Key Pitch Takeaway */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 to-orange-950/40 border border-cyan-500/30 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300">
              <strong className="text-slate-100 font-semibold block mb-0.5">
                Why Step-and-Puff Works:
              </strong>
              By separating rotational translation from powder expulsion, we prevent centrifugal air turbulence and eliminate the Faraday cage shadow on deep concave curves.
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            Inspect 3D Part
          </button>

          <button
            onClick={onReplay}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold font-mono text-slate-950 bg-gradient-to-r from-cyan-400 to-orange-400 hover:from-cyan-300 hover:to-orange-300 shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>REPLAY SIMULATION</span>
          </button>
        </div>
      </div>
    </div>
  );
}
