import React from 'react';
import { ShieldCheck, CheckCircle2, Clock, Sparkles, AlertCircle } from 'lucide-react';
import { REGIONS, MACHINE_STATES } from '../constants/simulationConfig';

export default function CoveragePanel({
  coverageState, // { 'region-1': 0..100, ... }
  currentStepData,
  machineState,
  burstCount,
  totalSteps,
}) {
  // Compute summary stats
  const processedCount = Object.values(coverageState).filter((v) => v >= 95).length;
  const remainingCount = REGIONS.length - processedCount;
  const totalCoveragePercent = Math.round(
    Object.values(coverageState).reduce((acc, curr) => acc + curr, 0) / REGIONS.length
  );

  return (
    <div className="w-80 md:w-84 xl:w-88 flex flex-col gap-3 p-4 bg-slate-950/80 backdrop-blur-md border-l border-slate-800/80 overflow-y-auto select-none font-sans shrink-0">
      {/* 1. OVERALL COVERAGE SUMMARY CARD */}
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Surface Coverage Metrology</span>
          </div>
          <span className="text-[10px] font-mono text-cyan-400">
            {totalCoveragePercent}%
          </span>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-orange-500 transition-all duration-300 ease-out"
            style={{ width: `${totalCoveragePercent}%` }}
          />
        </div>

        {/* 3 Metrics: Processed, Remaining, Bursts */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/70">
            <div className="text-[10px] font-mono text-slate-400">PROCESSED</div>
            <div className="text-lg font-mono font-bold text-emerald-400 mt-0.5">
              {processedCount} <span className="text-xs text-slate-500">/ {REGIONS.length}</span>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/70">
            <div className="text-[10px] font-mono text-slate-400">REMAINING</div>
            <div className="text-lg font-mono font-bold text-orange-400 mt-0.5">
              {remainingCount}
            </div>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/70">
            <div className="text-[10px] font-mono text-slate-400">BURSTS</div>
            <div className="text-lg font-mono font-bold text-cyan-400 mt-0.5">
              {burstCount}
            </div>
          </div>
        </div>
      </div>

      {/* 2. REGION BREAKDOWN LIST */}
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Workpiece Surface Regions
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            4-SECTOR AERODYNAMIC PANEL
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {REGIONS.map((region) => {
            const pct = coverageState[region.id] || 0;
            const isTargeted = currentStepData?.targetRegionId === region.id;
            const isCoatingNow = isTargeted && machineState === MACHINE_STATES.PUFFING;
            const isDone = pct >= 95;

            // Estimated film thickness calculation (illustrative)
            const estThickness = Math.round((pct / 100) * region.targetThicknessUm);

            return (
              <div
                key={region.id}
                className={`p-3 rounded-xl border transition-all ${
                  isCoatingNow
                    ? 'bg-orange-950/40 border-orange-500/80 shadow-[0_0_12px_rgba(255,107,0,0.25)]'
                    : isTargeted
                    ? 'bg-slate-900 border-cyan-500/60 shadow-sm'
                    : isDone
                    ? 'bg-slate-900/80 border-slate-800'
                    : 'bg-slate-950/60 border-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : isCoatingNow ? (
                      <span className="w-3.5 h-3.5 rounded-full bg-orange-500 animate-ping shrink-0" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-slate-200">
                      {region.shortName}
                    </span>
                  </div>

                  {/* Coverage Percentage */}
                  <span
                    className={`text-xs font-mono font-bold ${
                      isDone
                        ? 'text-emerald-400'
                        : isCoatingNow
                        ? 'text-orange-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {Math.round(pct)}%
                  </span>
                </div>

                {/* Progress bar per region */}
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mb-2">
                  <div
                    className={`h-full transition-all duration-150 ${
                      isDone
                        ? 'bg-emerald-500'
                        : isCoatingNow
                        ? 'bg-orange-500'
                        : 'bg-cyan-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Technical region details */}
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="truncate max-w-[140px]" title={region.geometryDescription}>
                    {region.curvature}
                  </span>
                  <span>
                    Est. {estThickness} µm{' '}
                    <span className="text-slate-600">/ {region.targetThicknessUm} µm</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. SIMULATION DISCLAIMER / FOOTER */}
      <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/60 text-[10.5px] text-slate-400 flex items-start gap-2">
        <AlertCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
        <p className="leading-tight">
          Illustrative ideathon indicators. Color shift denotes electrostatic powder accumulation.
        </p>
      </div>
    </div>
  );
}
