import React from 'react';
import { Layers, HelpCircle, Activity, Sparkles, CheckCircle2, Sun, Moon } from 'lucide-react';
import { RECIPES, MACHINE_STATES } from '../constants/simulationConfig';

export default function Header({
  activeRecipeId,
  onSelectRecipe,
  machineState,
  isRunning,
  onOpenInfo,
  theme = 'dark',
  onToggleTheme,
}) {
  const isComplete = machineState === MACHINE_STATES.COMPLETE;
  const isPuffing = machineState === MACHINE_STATES.PUFFING;

  return (
    <header className="h-16 px-5 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md flex items-center justify-between shrink-0 z-20 transition-colors">
      {/* Brand & Project Info */}
      <div className="flex items-center gap-3.5">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-orange-500/20 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
          {/* Animated Gyro rings icon */}
          <div className="w-5 h-5 rounded-full border-2 border-cyan-400 border-t-transparent animate-[spin_4s_linear_infinite]" />
          <div className="absolute w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-wider text-slate-100 uppercase font-sans">
              GyroCoat <span className="text-cyan-400 font-mono">3D</span>
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold uppercase tracking-wide bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
              Ideathon Prototype
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Step-and-Puff Multi-Axis Powder Coating Simulation
          </p>
        </div>
      </div>

      {/* Center: Recipe Mode Switcher */}
      <div className="flex items-center gap-2 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1.5 px-2.5 text-xs font-mono text-slate-400">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">RECIPE:</span>
        </div>

        <button
          onClick={() => onSelectRecipe(RECIPES.fixed.id)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeRecipeId === RECIPES.fixed.id
              ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Fixed Recipe
        </button>

        <button
          onClick={() => onSelectRecipe(RECIPES.geometryAware.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeRecipeId === RECIPES.geometryAware.id
              ? 'bg-gradient-to-r from-cyan-950 to-orange-950 text-orange-300 border border-orange-500/50 shadow-[0_0_12px_rgba(255,107,0,0.25)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3 h-3 text-orange-400" />
          <span>Geometry-Aware</span>
          <span className="text-[9px] px-1 py-0.2 rounded bg-orange-500/20 text-orange-300 font-mono border border-orange-500/30">
            Adaptive
          </span>
        </button>
      </div>

      {/* Right: Status Pill, Light/Dark Theme Switcher & Pitch Info Button */}
      <div className="flex items-center gap-2.5">
        {/* Machine Status Pill */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
            isComplete
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : isPuffing
              ? 'bg-orange-950/60 border-orange-500/50 text-orange-300 shadow-[0_0_12px_rgba(255,107,0,0.3)] animate-pulse'
              : isRunning
              ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
              : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}
        >
          {isComplete ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <span
              className={`w-2 h-2 rounded-full ${
                isPuffing
                  ? 'bg-orange-400 animate-ping'
                  : isRunning
                  ? 'bg-cyan-400 animate-pulse'
                  : 'bg-slate-500'
              }`}
            />
          )}
          <span>{machineState}</span>
        </div>

        {/* LIGHT / DARK MODE TOGGLE BUTTON */}
        <button
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-400 transition-colors font-mono text-xs shadow-sm"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-cyan-600" />
              <span className="hidden sm:inline">Dark</span>
            </>
          )}
        </button>

        {/* Pitch Info Modal Button */}
        <button
          onClick={onOpenInfo}
          title="Project Concept & Ideathon Notes"
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
