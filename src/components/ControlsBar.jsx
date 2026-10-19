import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Camera,
  Eye,
  Maximize2,
  Video,
} from 'lucide-react';
import { MACHINE_STATES } from '../constants/simulationConfig';

export default function ControlsBar({
  machineState,
  isRunning,
  isPaused,
  playbackSpeed,
  onStart,
  onPauseResume,
  onRestart,
  onChangeSpeed,
  onSetCameraPreset,
}) {
  const isComplete = machineState === MACHINE_STATES.COMPLETE;
  const isIdle = machineState === MACHINE_STATES.IDLE;

  return (
    <div className="h-16 px-6 border-t border-slate-800 bg-slate-950/95 backdrop-blur-md flex items-center justify-between shrink-0 z-20 font-sans">
      {/* Left: Camera Angles / View Presets */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-mono text-slate-400 mr-1 hidden sm:inline flex items-center gap-1">
          <Camera className="w-3.5 h-3.5 text-cyan-400" />
          <span>CAM:</span>
        </span>

        <button
          onClick={() => onSetCameraPreset('iso')}
          className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-xs font-mono text-slate-300 transition-colors"
          title="Isometric Global View"
        >
          Isometric
        </button>

        <button
          onClick={() => onSetCameraPreset('closeup')}
          className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-xs font-mono text-slate-300 transition-colors"
          title="Target Region Close-Up"
        >
          Close-Up
        </button>

        <button
          onClick={() => onSetCameraPreset('nozzle')}
          className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-xs font-mono text-slate-300 transition-colors"
          title="Active Nozzle Perspective"
        >
          Gun View
        </button>

        <button
          onClick={() => onSetCameraPreset('top')}
          className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-xs font-mono text-slate-300 transition-colors"
          title="Chamber Overhead View"
        >
          Top Down
        </button>
      </div>

      {/* Center: Main Execution Controls (Start, Pause/Resume, Restart) */}
      <div className="flex items-center gap-3">
        {/* Large Primary START SIMULATION Button */}
        {(!isRunning || isComplete) ? (
          <button
            onClick={onStart}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold font-sans text-sm text-slate-950 bg-gradient-to-r from-cyan-400 via-sky-300 to-orange-400 hover:from-cyan-300 hover:to-orange-300 shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-[0_0_28px_rgba(255,107,0,0.5)] transition-all transform active:scale-95"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>{isComplete ? 'START NEW RUN' : 'START SIMULATION'}</span>
          </button>
        ) : (
          <button
            onClick={onPauseResume}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold font-mono text-xs transition-all border ${
              isPaused
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600'
            }`}
          >
            {isPaused ? (
              <>
                <Play className="w-4 h-4 fill-amber-300 text-amber-300" />
                <span>RESUME</span>
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 text-slate-300" />
                <span>PAUSE</span>
              </>
            )}
          </button>
        )}

        {/* RESTART BUTTON */}
        <button
          onClick={onRestart}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-mono text-xs text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-colors"
          title="Reset fixture and restart sequence"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>RESTART</span>
        </button>
      </div>

      {/* Right: Playback Speed Selector */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono text-slate-400 hidden sm:inline flex items-center gap-1">
          <FastForward className="w-3.5 h-3.5 text-cyan-400" />
          <span>SPEED:</span>
        </span>

        <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
          {[0.5, 1.0, 1.5, 2.0].map((speed) => (
            <button
              key={speed}
              onClick={() => onChangeSpeed(speed)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
                playbackSpeed === speed
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
