import React from 'react';
import {
  Compass,
  Gauge,
  Wind,
  Timer,
  Zap,
  Target,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import {
  MACHINE_STATES,
  STATE_LABELS,
  NOZZLES,
} from '../constants/simulationConfig';

export default function TelemetryPanel({
  machineState,
  currentStepIndex,
  totalSteps,
  currentStepData,
  activeNozzleId,
  currentPrimaryAngle,
  currentSecondaryTilt,
  targetPrimaryAngle,
  targetSecondaryTilt,
  pulseRemainingSeconds,
  currentPulseDuration,
  isPuffing,
  stepProgress, // 0 to 1 overall
}) {
  const stateMeta = STATE_LABELS[machineState] || STATE_LABELS[MACHINE_STATES.IDLE];
  const activeNozzle = NOZZLES.find((n) => n.id === activeNozzleId);

  // Angle normalization for visual dials
  const primaryNormalized = ((currentPrimaryAngle % 360) + 360) % 360;
  const secondaryNormalized = THREE_NORM_TILT(currentSecondaryTilt);

  return (
    <div className="w-80 md:w-88 xl:w-96 flex flex-col gap-3 p-4 bg-slate-950/80 backdrop-blur-md border-r border-slate-800/80 overflow-y-auto select-none font-sans shrink-0">
      {/* 1. STATE & STEP HEADER CARD */}
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            System State
          </span>
          <span className="text-xs font-mono text-cyan-400 font-semibold">
            STEP {currentStepIndex + 1} OF {totalSteps}
          </span>
        </div>

        {/* State Badge */}
        <div
          className="flex items-center justify-between px-3 py-2 rounded-lg border transition-all"
          style={{
            backgroundColor: stateMeta.bg,
            borderColor: stateMeta.border,
            color: stateMeta.color,
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full animate-ping"
              style={{ backgroundColor: stateMeta.color }}
            />
            <span className="font-mono text-sm font-bold tracking-wide">
              {stateMeta.label}
            </span>
          </div>
          {isPuffing && (
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-orange-400 bg-orange-950/80 px-2 py-0.5 rounded border border-orange-500/40 animate-pulse">
              FIRING
            </span>
          )}
        </div>

        {/* Overall Cycle Progress Bar */}
        <div className="mt-3">
          <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
            <span>Cycle Sequence Progress</span>
            <span className="text-slate-300 font-semibold">
              {Math.round(stepProgress * 100)}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-orange-500 transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, stepProgress * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. DUAL ROTATION AXES TELEMETRY */}
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-slate-400">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>Kinematics & Multi-Axis Position</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40">
            DUAL-GIMBAL
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Primary Rotation Axis */}
          <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>PRIMARY (ROLL)</span>
              <span className="text-cyan-400">θ1</span>
            </div>
            <div className="my-2 flex items-baseline justify-between">
              <span className="text-2xl font-mono font-bold text-slate-100 tracking-tight">
                {currentPrimaryAngle.toFixed(1)}°
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                tgt {targetPrimaryAngle}°
              </span>
            </div>
            {/* Visual Arc / Compass indicator */}
            <div className="relative w-full h-2 rounded bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-cyan-400 transition-all duration-75"
                style={{
                  width: `${(primaryNormalized / 360) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Secondary Tilt Axis */}
          <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>SECONDARY (TILT)</span>
              <span className="text-cyan-400">θ2</span>
            </div>
            <div className="my-2 flex items-baseline justify-between">
              <span className="text-2xl font-mono font-bold text-slate-100 tracking-tight">
                {currentSecondaryTilt.toFixed(1)}°
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                tgt {targetSecondaryTilt}°
              </span>
            </div>
            {/* Visual Pitch meter */}
            <div className="relative w-full h-2 rounded bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-cyan-400 transition-all duration-75"
                style={{
                  width: `${Math.max(5, Math.min(100, ((currentSecondaryTilt + 90) / 180) * 100))}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Dynamic Rotation Lock Warning */}
        <div className="mt-2 text-[10px] font-mono flex items-center justify-between text-slate-400 px-1">
          <span>MOTION LOCK:</span>
          {isPuffing ? (
            <span className="text-orange-400 font-semibold">
              RIGID LOCK (ZERO MOTION IN PUFF)
            </span>
          ) : (
            <span className="text-emerald-400 font-semibold">COORDINATED AXES UNLOCKED</span>
          )}
        </div>
      </div>

      {/* 3. ACTIVE NOZZLE & POWDER PULSE TIMER */}
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-slate-400">
            <Wind className="w-3.5 h-3.5 text-orange-400" />
            <span>Active Powder Injector Gun</span>
          </div>
          <span className="text-[10px] font-mono text-orange-400">
            3-NOZZLE ARRAY
          </span>
        </div>

        {/* 3 Nozzle Status Cards */}
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          {NOZZLES.map((nz) => {
            const isActive = nz.id === activeNozzleId;
            return (
              <div
                key={nz.id}
                className={`p-2 rounded-lg border text-center transition-all ${
                  isActive && isPuffing
                    ? 'bg-orange-950/80 border-orange-500 shadow-[0_0_12px_rgba(255,107,0,0.35)]'
                    : isActive
                    ? 'bg-slate-800 border-cyan-500/60'
                    : 'bg-slate-950/60 border-slate-800 opacity-60'
                }`}
              >
                <div className="text-[10px] font-mono text-slate-400">{nz.shortCode}</div>
                <div
                  className={`text-xs font-bold font-mono my-0.5 ${
                    isActive ? (isPuffing ? 'text-orange-300' : 'text-cyan-300') : 'text-slate-400'
                  }`}
                >
                  {nz.id === 1 ? 'OVERHEAD' : nz.id === 2 ? 'LATERAL' : 'UNDER'}
                </div>
                <div className="text-[9px] font-mono text-slate-500">
                  {nz.electrostaticVoltage}
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Nozzle Specs & Pulse Countdown */}
        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-slate-400">PULSE DURATION</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-mono font-bold text-orange-400">
                {pulseRemainingSeconds.toFixed(2)}s
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                / {currentPulseDuration.toFixed(1)}s
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-mono text-slate-400">FLOW RATE</div>
            <div className="text-sm font-mono font-semibold text-slate-200 mt-0.5">
              {activeNozzle ? activeNozzle.flowRate : '190 g/min'}
            </div>
          </div>
        </div>

        {/* Target Region Tag */}
        {currentStepData && (
          <div className="mt-2.5 px-2 py-1.5 rounded bg-slate-950 border border-slate-800/80 flex items-center gap-2 text-[11px] font-mono">
            <Target className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-slate-400 truncate">
              Lock:{' '}
              <span className="text-cyan-300 font-semibold">
                {currentStepData.targetRegionId.toUpperCase()}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* 4. STEP RATIONALE / ANNOTATION CARD */}
      {currentStepData && (
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/70 text-xs">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
            <Zap className="w-3 h-3 text-cyan-400" />
            <span>Process Intelligence</span>
          </div>
          <p className="text-slate-300 font-sans leading-relaxed text-[11.5px]">
            {currentStepData.rationale}
          </p>
        </div>
      )}
    </div>
  );
}

function THREE_NORM_TILT(angle) {
  return THREE_CLAMP((angle + 90) / 180, 0, 1) * 100;
}

function THREE_CLAMP(val, min, max) {
  return Math.max(min, Math.min(max, val));
}
