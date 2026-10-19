import React from 'react';
import { X, HelpCircle, Check, AlertTriangle, Cpu, Layers, Disc3 } from 'lucide-react';

export default function IdeathonInfoModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden font-sans flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40">
              <Cpu className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                GyroCoat 3D — Ideathon Engineering Brief
              </h2>
              <p className="text-xs text-slate-400">
                Step-and-Puff Multi-Axis Powder Coating System
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-300 text-xs leading-relaxed">
          {/* 1. Problem Statement */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-mono font-semibold text-xs">
              <AlertTriangle className="w-4 h-4" />
              <span>THE CHALLENGE IN CONVENTIONAL POWDER COATING</span>
            </div>
            <p>
              Coating curved, complex metallic components using standard continuous-spray lines results in two major failure modes:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
              <li>
                <strong>The Faraday Cage Effect:</strong> Electrostatic field lines concentrate on outer sharp edges, causing powder to bypass deep concave valleys and reentrant pockets.
              </li>
              <li>
                <strong>Centrifugal Air Disturbance:</strong> Continuous spraying while rotating stirs boundary-layer turbulence, leading to blow-off, sagging, and uneven film thickness (orange peel).
              </li>
            </ul>
          </div>

          {/* 2. GyroCoat Solution */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-mono font-semibold text-xs">
              <Disc3 className="w-4 h-4" />
              <span>THE GYROCOAT 3D SOLUTION: STEP-AND-PUFF KINEMATICS</span>
            </div>
            <p>
              Instead of continuous spraying during motion, GyroCoat 3D employs a synchronized <strong>Step-and-Puff</strong> sequence:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 pl-1">
              <li>
                <strong>Multi-Axis Reorientation:</strong> Primary roll and secondary tilt axes orient the workpiece so the target surface normal aligns with the optimal injector gun.
              </li>
              <li>
                <strong>Settling Stabilization:</strong> Rotation stops completely. A brief settling dwell allows airflow to stabilize, eliminating turbulence.
              </li>
              <li>
                <strong>Calculated Powder Burst:</strong> The targeted electrostatic nozzle emits a metered micro-cloud directly onto the stationary curved surface with maximal wrap-around.
              </li>
              <li>
                <strong>Step Repeat:</strong> Fixture advances to the next sector orientation, repeating until all 4 regions achieve uniform target thickness.
              </li>
            </ol>
          </div>

          {/* 3. Adaptive Geometry-Aware Planning */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-orange-400 font-mono font-semibold text-xs">
              <Layers className="w-4 h-4" />
              <span>FIXED VS. GEOMETRY-AWARE RECIPES</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="font-mono text-[11px] font-bold text-slate-300 block mb-1">
                  Fixed Recipe:
                </span>
                <p className="text-[11px] text-slate-400">
                  Predefined uniform steps (constant 1.8s pulse duration) regardless of curvature radius.
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-orange-500/30">
                <span className="font-mono text-[11px] font-bold text-orange-300 block mb-1">
                  Geometry-Aware Recipe:
                </span>
                <p className="text-[11px] text-slate-400">
                  Curvature-compensated dwell times (1.4s on flanges, up to 2.4s on high-curvature crowns) and normal-aligned nozzle selection.
                </p>
              </div>
            </div>
          </div>

          <p className="text-[11px] font-mono text-slate-500 text-center">
            * Note: This interactive web application is a conceptual simulation prototype for ideathon presentation.
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-mono font-semibold bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/30 transition-colors"
          >
            GOT IT &bull; RETURN TO SIMULATION
          </button>
        </div>
      </div>
    </div>
  );
}
