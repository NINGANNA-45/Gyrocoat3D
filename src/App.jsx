import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import TelemetryPanel from './components/TelemetryPanel';
import CoveragePanel from './components/CoveragePanel';
import ControlsBar from './components/ControlsBar';
import Viewport3D from './components/Viewport3D';
import CompletionModal from './components/CompletionModal';
import IdeathonInfoModal from './components/IdeathonInfoModal';

import {
  MACHINE_STATES,
  REGIONS,
  NOZZLES,
  RECIPES,
} from './constants/simulationConfig';

export default function App() {
  // RECIPE STATE
  const [activeRecipeId, setActiveRecipeId] = useState(RECIPES.fixed.id);
  const activeRecipe = RECIPES[activeRecipeId] || RECIPES.fixed;
  const steps = activeRecipe.steps;
  const totalSteps = steps.length;

  // SIMULATION EXECUTION STATE
  const [machineState, setMachineState] = useState(MACHINE_STATES.IDLE);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  // STEP & KINEMATICS TRACKING
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentPrimaryAngle, setCurrentPrimaryAngle] = useState(0);
  const [currentSecondaryTilt, setCurrentSecondaryTilt] = useState(0);
  const [targetPrimaryAngle, setTargetPrimaryAngle] = useState(0);
  const [targetSecondaryTilt, setTargetSecondaryTilt] = useState(0);

  // NOZZLE & POWDER BURST
  const [activeNozzleId, setActiveNozzleId] = useState(steps[0].nozzleId);
  const [isPuffing, setIsPuffing] = useState(false);
  const [pulseRemainingSeconds, setPulseRemainingSeconds] = useState(steps[0].pulseDuration);
  const [currentPulseDuration, setCurrentPulseDuration] = useState(steps[0].pulseDuration);
  const [burstCount, setBurstCount] = useState(0);

  // SURFACE COVERAGE PER REGION
  const initialCoverage = REGIONS.reduce((acc, r) => ({ ...acc, [r.id]: 0 }), {});
  const [coverageState, setCoverageState] = useState(initialCoverage);

  // MODALS & CAMERA
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [cameraPreset, setCameraPreset] = useState(null);
  const [elapsedTotalSeconds, setElapsedTotalSeconds] = useState(0);

  // THEME MANAGEMENT (LIGHT / DARK)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('gyrocoat_theme') || 'dark';
  });

  const handleToggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('gyrocoat_theme', next);
      return next;
    });
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // REFS FOR SIMULATION STATE MACHINE
  const stateTimerRef = useRef(null);
  const puffIntervalRef = useRef(null);
  const isPausedRef = useRef(isPaused);
  const playbackSpeedRef = useRef(playbackSpeed);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    playbackSpeedRef.current = playbackSpeed;
  }, [playbackSpeed]);

  const currentStepData = steps[currentStepIndex] || steps[0];

  // RESET / RESTART SIMULATION
  const handleRestart = useCallback(() => {
    clearTimeout(stateTimerRef.current);
    clearInterval(puffIntervalRef.current);

    setIsRunning(false);
    setIsPaused(false);
    setMachineState(MACHINE_STATES.IDLE);
    setCurrentStepIndex(0);
    setCurrentPrimaryAngle(0);
    setCurrentSecondaryTilt(0);
    setTargetPrimaryAngle(0);
    setTargetSecondaryTilt(0);
    setActiveNozzleId(steps[0].nozzleId);
    setIsPuffing(false);
    setPulseRemainingSeconds(steps[0].pulseDuration);
    setCurrentPulseDuration(steps[0].pulseDuration);
    setBurstCount(0);
    setCoverageState(initialCoverage);
    setIsCompletionModalOpen(false);
    setElapsedTotalSeconds(0);
  }, [steps, initialCoverage]);

  // SWITCH RECIPE
  const handleSelectRecipe = (recipeId) => {
    if (recipeId === activeRecipeId) return;
    setActiveRecipeId(recipeId);
    // When switching recipe, reset simulation to use the new planned orientations and pulse durations
    clearTimeout(stateTimerRef.current);
    clearInterval(puffIntervalRef.current);

    const newRecipe = RECIPES[recipeId];
    setIsRunning(false);
    setIsPaused(false);
    setMachineState(MACHINE_STATES.IDLE);
    setCurrentStepIndex(0);
    setCurrentPrimaryAngle(0);
    setCurrentSecondaryTilt(0);
    setTargetPrimaryAngle(0);
    setTargetSecondaryTilt(0);
    setActiveNozzleId(newRecipe.steps[0].nozzleId);
    setIsPuffing(false);
    setPulseRemainingSeconds(newRecipe.steps[0].pulseDuration);
    setCurrentPulseDuration(newRecipe.steps[0].pulseDuration);
    setBurstCount(0);
    setCoverageState(initialCoverage);
    setIsCompletionModalOpen(false);
  };

  // EXECUTE A SPECIFIC STEP IN SEQUENCE
  const runStep = useCallback(
    (stepIdx) => {
      if (stepIdx >= totalSteps) {
        // STEP 9 — COMPLETE
        setMachineState(MACHINE_STATES.COMPLETE);
        setIsPuffing(false);
        setTargetPrimaryAngle(0);
        setTargetSecondaryTilt(0);
        setIsRunning(false);
        setTimeout(() => {
          setIsCompletionModalOpen(true);
        }, 800);
        return;
      }

      const step = steps[stepIdx];
      setCurrentStepIndex(stepIdx);
      setActiveNozzleId(step.nozzleId);
      setCurrentPulseDuration(step.pulseDuration);
      setPulseRemainingSeconds(step.pulseDuration);

      // STEP 1 or STEP 5: POSITION / ROTATE
      const transitionState = stepIdx === 0 ? MACHINE_STATES.POSITIONING : MACHINE_STATES.ROTATING;
      setMachineState(transitionState);
      setIsPuffing(false);
      setTargetPrimaryAngle(step.primaryAngle);
      setTargetSecondaryTilt(step.secondaryTilt);

      // Duration to rotate: 1.4s / speed
      const rotateDurationMs = (1400 / playbackSpeedRef.current);

      stateTimerRef.current = setTimeout(() => {
        if (!isPausedRef.current) {
          // STEP 2 or STEP 6: SETTLE
          setMachineState(MACHINE_STATES.SETTLING);
          setCurrentPrimaryAngle(step.primaryAngle);
          setCurrentSecondaryTilt(step.secondaryTilt);

          // Settle duration (e.g. 0.8s)
          const settleDurationMs = (step.settleDuration * 1000) / playbackSpeedRef.current;

          stateTimerRef.current = setTimeout(() => {
            if (!isPausedRef.current) {
              // STEP 3 or STEP 7: PUFF
              setMachineState(MACHINE_STATES.PUFFING);
              setIsPuffing(true);
              setBurstCount((prev) => prev + 1);

              const totalPulseTimeMs = (step.pulseDuration * 1000) / playbackSpeedRef.current;
              const intervalTickMs = 50;
              let elapsedPuffMs = 0;

              puffIntervalRef.current = setInterval(() => {
                if (isPausedRef.current) return;

                elapsedPuffMs += intervalTickMs * playbackSpeedRef.current;
                const remainingSec = Math.max(
                  0,
                  step.pulseDuration - elapsedPuffMs / 1000
                );
                setPulseRemainingSeconds(remainingSec);

                // Increment region coverage gradually from current to 100%
                const puffProgressRatio = Math.min(1, elapsedPuffMs / (step.pulseDuration * 1000));
                setCoverageState((prev) => ({
                  ...prev,
                  [step.targetRegionId]: Math.min(100, Math.round(puffProgressRatio * 100)),
                }));

                if (elapsedPuffMs >= step.pulseDuration * 1000) {
                  clearInterval(puffIntervalRef.current);

                  // STEP 4: STOP POWDER EMISSION
                  setMachineState(MACHINE_STATES.STOP);
                  setIsPuffing(false);
                  setPulseRemainingSeconds(0);
                  setCoverageState((prev) => ({
                    ...prev,
                    [step.targetRegionId]: 100,
                  }));

                  // Brief pause after stop (0.4s) before advancing to next orientation
                  const stopDwellMs = 400 / playbackSpeedRef.current;
                  stateTimerRef.current = setTimeout(() => {
                    if (!isPausedRef.current) {
                      // STEP 8: REPEAT FOR NEXT REGION
                      runStep(stepIdx + 1);
                    }
                  }, stopDwellMs);
                }
              }, intervalTickMs);
            }
          }, settleDurationMs);
        }
      }, rotateDurationMs);
    },
    [steps, totalSteps]
  );

  // START SIMULATION
  const handleStart = () => {
    handleRestart();
    setIsRunning(true);
    setIsPaused(false);
    runStep(0);
  };

  // PAUSE / RESUME
  const handlePauseResume = () => {
    setIsPaused((prev) => !prev);
  };

  // PLAYBACK SPEED
  const handleChangeSpeed = (speed) => {
    setPlaybackSpeed(speed);
  };

  // OVERALL STEP PROGRESS (0 to 1)
  const stepProgress =
    machineState === MACHINE_STATES.COMPLETE
      ? 1
      : ((currentStepIndex + (machineState === MACHINE_STATES.PUFFING ? 0.7 : 0.2)) / totalSteps);

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* TOP HEADER */}
      <Header
        activeRecipeId={activeRecipeId}
        onSelectRecipe={handleSelectRecipe}
        machineState={machineState}
        isRunning={isRunning}
        onOpenInfo={() => setIsInfoModalOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* MAIN VIEWPORT & TELEMETRY CLUSTER */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT: TELEMETRY & KINEMATICS */}
        <TelemetryPanel
          machineState={machineState}
          currentStepIndex={currentStepIndex}
          totalSteps={totalSteps}
          currentStepData={currentStepData}
          activeNozzleId={activeNozzleId}
          currentPrimaryAngle={currentPrimaryAngle}
          currentSecondaryTilt={currentSecondaryTilt}
          targetPrimaryAngle={targetPrimaryAngle}
          targetSecondaryTilt={targetSecondaryTilt}
          pulseRemainingSeconds={pulseRemainingSeconds}
          currentPulseDuration={currentPulseDuration}
          isPuffing={isPuffing}
          stepProgress={stepProgress}
        />

        {/* CENTER: 3D THREE.JS SIMULATION VIEWPORT */}
        <div className="flex-1 h-full relative overflow-hidden bg-slate-950">
          <Viewport3D
            machineState={machineState}
            currentStepData={currentStepData}
            currentPrimaryAngle={currentPrimaryAngle}
            currentSecondaryTilt={currentSecondaryTilt}
            targetPrimaryAngle={targetPrimaryAngle}
            targetSecondaryTilt={targetSecondaryTilt}
            activeNozzleId={activeNozzleId}
            isPuffing={isPuffing}
            puffProgress={1 - pulseRemainingSeconds / (currentPulseDuration || 1)}
            coverageState={coverageState}
            cameraPreset={cameraPreset}
            onCameraPresetHandled={() => setCameraPreset(null)}
            theme={theme}
          />
        </div>

        {/* RIGHT: SURFACE COVERAGE METROLOGY */}
        <CoveragePanel
          coverageState={coverageState}
          currentStepData={currentStepData}
          machineState={machineState}
          burstCount={burstCount}
          totalSteps={totalSteps}
        />
      </div>

      {/* BOTTOM CONTROLS BAR */}
      <ControlsBar
        machineState={machineState}
        isRunning={isRunning}
        isPaused={isPaused}
        playbackSpeed={playbackSpeed}
        onStart={handleStart}
        onPauseResume={handlePauseResume}
        onRestart={handleRestart}
        onChangeSpeed={handleChangeSpeed}
        onSetCameraPreset={setCameraPreset}
      />

      {/* COMPLETION MODAL */}
      <CompletionModal
        isOpen={isCompletionModalOpen}
        onClose={() => setIsCompletionModalOpen(false)}
        onReplay={handleStart}
        activeRecipe={activeRecipe}
        burstCount={burstCount}
        elapsedTotalSeconds={
          steps.reduce((sum, s) => sum + s.pulseDuration + s.settleDuration + 1.8, 0)
        }
      />

      {/* IDEATHON INFORMATION MODAL */}
      <IdeathonInfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
      />
    </div>
  );
}
