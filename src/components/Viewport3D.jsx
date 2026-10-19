import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MACHINE_STATES, REGIONS, NOZZLES } from '../constants/simulationConfig';

export default function Viewport3D({
  machineState,
  currentStepData,
  currentPrimaryAngle,
  currentSecondaryTilt,
  targetPrimaryAngle,
  targetSecondaryTilt,
  activeNozzleId,
  isPuffing,
  puffProgress, // 0 to 1
  coverageState, // { 'region-1': number (0..100), ... }
  cameraPreset, // 'iso' | 'closeup' | 'nozzle' | 'top'
  onCameraPresetHandled,
  theme = 'dark',
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);

  // Dynamic Theme Effect for 3D Background & Fog
  useEffect(() => {
    if (!sceneRef.current) return;
    const isLight = theme === 'light';
    const bgColor = isLight ? 0xedf2f7 : 0x080c14;
    sceneRef.current.background = new THREE.Color(bgColor);
    if (sceneRef.current.fog) {
      sceneRef.current.fog.color = new THREE.Color(bgColor);
    }
  }, [theme]);

  // 3D Objects references
  const primaryPivotRef = useRef(null);
  const secondaryPivotRef = useRef(null);
  const regionMeshesRef = useRef({});
  const regionHighlightsRef = useRef({});
  const nozzlesMeshesRef = useRef({});
  const particleSystemRef = useRef(null);
  const andonLightRef = useRef(null);
  const laserGuideRef = useRef(null);

  // References for live animation interpolation
  const liveAnglesRef = useRef({ primary: 0, secondary: 0 });
  const liveStateRef = useRef(machineState);
  const liveTargetAnglesRef = useRef({ primary: 0, secondary: 0 });
  const liveIsPuffingRef = useRef(isPuffing);
  const liveActiveNozzleRef = useRef(activeNozzleId);
  const livePuffProgressRef = useRef(puffProgress);
  const liveCoverageRef = useRef(coverageState);

  // Sync props to refs for the RAF loop
  useEffect(() => {
    liveStateRef.current = machineState;
  }, [machineState]);

  useEffect(() => {
    liveTargetAnglesRef.current = {
      primary: targetPrimaryAngle,
      secondary: targetSecondaryTilt,
    };
  }, [targetPrimaryAngle, targetSecondaryTilt]);

  useEffect(() => {
    liveIsPuffingRef.current = isPuffing;
  }, [isPuffing]);

  useEffect(() => {
    liveActiveNozzleRef.current = activeNozzleId;
  }, [activeNozzleId]);

  useEffect(() => {
    livePuffProgressRef.current = puffProgress;
  }, [puffProgress]);

  useEffect(() => {
    liveCoverageRef.current = coverageState;
  }, [coverageState]);

  // Handle camera presets
  useEffect(() => {
    if (!cameraPreset || !cameraRef.current || !controlsRef.current) return;
    const controls = controlsRef.current;
    const camera = cameraRef.current;

    let targetCamPos = [4.8, 3.4, 5.2];
    let targetLookAt = [0, 0.4, 0];

    switch (cameraPreset) {
      case 'iso':
        targetCamPos = [4.6, 3.2, 5.0];
        targetLookAt = [0, 0.3, 0];
        break;
      case 'closeup':
        targetCamPos = [1.8, 1.2, 2.4];
        targetLookAt = [0, 0.2, 0];
        break;
      case 'nozzle': {
        const nz = NOZZLES.find((n) => n.id === activeNozzleId) || NOZZLES[0];
        targetCamPos = [nz.position[0] * 1.5, nz.position[1] * 1.3, nz.position[2] * 1.5];
        targetLookAt = [0, 0.2, 0];
        break;
      }
      case 'top':
        targetCamPos = [0, 6.2, 0.1];
        targetLookAt = [0, 0.2, 0];
        break;
      default:
        break;
    }

    // Smoothly animate camera
    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();
    const endPos = new THREE.Vector3(...targetCamPos);
    const endTarget = new THREE.Vector3(...targetLookAt);
    let camT = 0;

    const animCam = () => {
      camT += 0.05;
      if (camT <= 1) {
        camera.position.lerpVectors(startPos, endPos, easeOutCubic(camT));
        controls.target.lerpVectors(startTarget, endTarget, easeOutCubic(camT));
        controls.update();
        requestAnimationFrame(animCam);
      } else {
        camera.position.copy(endPos);
        controls.target.copy(endTarget);
        controls.update();
        if (onCameraPresetHandled) onCameraPresetHandled();
      }
    };
    animCam();
  }, [cameraPreset, activeNozzleId, onCameraPresetHandled]);

  // Main Scene Initialization
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 800;
    const height = mount.clientHeight || 600;

    // SCENE
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x080c14);
    scene.fog = new THREE.FogExp2(0x080c14, 0.04);

    // CAMERA
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(4.8, 3.4, 5.2);
    cameraRef.current = camera;

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // CONTROLS
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controls.minDistance = 2.0;
    controls.maxDistance = 12.0;
    controls.target.set(0, 0.3, 0);
    controls.update();
    controlsRef.current = controls;

    // LIGHTING SYSTEM
    setupLighting(scene);

    // INDUSTRIAL ENCLOSURE & ENVIRONMENT
    setupEnclosure(scene, andonLightRef);

    // KINEMATICS & WORKPIECE
    const { primaryPivot, secondaryPivot, regionMeshes, regionHighlights } = setupKinematicsAndWorkpiece(scene);
    primaryPivotRef.current = primaryPivot;
    secondaryPivotRef.current = secondaryPivot;
    regionMeshesRef.current = regionMeshes;
    regionHighlightsRef.current = regionHighlights;

    // 3 NOZZLES
    const { nozzleMeshes, laserGuide } = setupNozzles(scene);
    nozzlesMeshesRef.current = nozzleMeshes;
    laserGuideRef.current = laserGuide;

    // PARTICLES (POWDER PUFF SYSTEM)
    const particleSystem = setupParticleSystem(scene);
    particleSystemRef.current = particleSystem;

    // RESIZE OBSERVER
    const handleResize = () => {
      if (!mount || !renderer || !camera) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mount);

    // ANIMATION LOOP
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Update Controls
      controls.update();

      // Update Kinematics (Primary & Secondary Rotation)
      updateKinematics(delta, elapsed);

      // Update Powder Particles (Puff Engine)
      updateParticles(delta, elapsed);

      // Update Workpiece Coating Appearance
      updateWorkpieceCoating();

      // Update Lights & Andon status
      updateStatusVisuals(elapsed);

      // Render
      renderer.render(scene, camera);
    };

    animate();

    // CLEANUP
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update Kinematics angles smoothly
  const updateKinematics = (delta, elapsed) => {
    if (!primaryPivotRef.current || !secondaryPivotRef.current) return;

    const targetAngles = liveTargetAnglesRef.current;
    const currentState = liveStateRef.current;
    const liveAngles = liveAnglesRef.current;

    // In PUFFING state, rotation is STRICTLY frozen!
    if (currentState === MACHINE_STATES.PUFFING) {
      // Hold rigidly still
    } else if (currentState === MACHINE_STATES.SETTLING) {
      // Small simulated vibration damping settlement
      const dampingOscillation = Math.sin(elapsed * 25) * 0.08 * Math.exp(-elapsed % 1.5);
      primaryPivotRef.current.rotation.x = THREE.MathUtils.degToRad(targetAngles.primary + dampingOscillation);
      secondaryPivotRef.current.rotation.z = THREE.MathUtils.degToRad(targetAngles.secondary + dampingOscillation * 0.5);
      liveAngles.primary = targetAngles.primary;
      liveAngles.secondary = targetAngles.secondary;
      return;
    } else {
      // Smooth interpolation towards target angles
      const lerpSpeed = 4.5 * delta;
      liveAngles.primary += (targetAngles.primary - liveAngles.primary) * lerpSpeed;
      liveAngles.secondary += (targetAngles.secondary - liveAngles.secondary) * lerpSpeed;
    }

    primaryPivotRef.current.rotation.x = THREE.MathUtils.degToRad(liveAngles.primary);
    secondaryPivotRef.current.rotation.z = THREE.MathUtils.degToRad(liveAngles.secondary);
  };

  // Update Powder Particle Cloud
  const updateParticles = (delta, elapsed) => {
    const ps = particleSystemRef.current;
    if (!ps) return;

    const isPuffingNow = liveIsPuffingRef.current;
    const activeNzId = liveActiveNozzleRef.current;

    if (!isPuffingNow) {
      // INSTANTLY CUT OFF EMISSION when not puffing!
      ps.mesh.visible = false;
      // Reset particles
      for (let i = 0; i < ps.count; i++) {
        ps.lifetimes[i] = -1;
      }
      return;
    }

    // Powder is active!
    ps.mesh.visible = true;

    // Find active nozzle position and targeted region position in world coords
    const nzData = NOZZLES.find((n) => n.id === activeNzId) || NOZZLES[0];
    const nozzlePos = new THREE.Vector3(...nzData.position);

    // Compute target position on workpiece in world space
    const targetRegionMesh = regionMeshesRef.current[currentStepData?.targetRegionId || 'region-1'];
    let targetWorldPos = new THREE.Vector3(0, 0.4, 0);
    if (targetRegionMesh) {
      targetRegionMesh.getWorldPosition(targetWorldPos);
    }

    const positions = ps.geometry.attributes.position.array;
    const colors = ps.geometry.attributes.color.array;
    const sizes = ps.geometry.attributes.size.array;

    const dirToTarget = new THREE.Vector3().subVectors(targetWorldPos, nozzlePos).normalize();

    // Spawn and update particles
    for (let i = 0; i < ps.count; i++) {
      let life = ps.lifetimes[i];
      const maxLife = ps.maxLifetimes[i];

      if (life < 0) {
        // Spawn particle at nozzle tip with conical dispersion
        life = Math.random() * 0.1;
        ps.lifetimes[i] = life;

        const spread = 0.28;
        const randOffset = new THREE.Vector3(
          (Math.random() - 0.5) * spread,
          (Math.random() - 0.5) * spread,
          (Math.random() - 0.5) * spread
        );

        positions[i * 3] = nozzlePos.x + randOffset.x * 0.3;
        positions[i * 3 + 1] = nozzlePos.y + randOffset.y * 0.3;
        positions[i * 3 + 2] = nozzlePos.z + randOffset.z * 0.3;

        // Velocity along nozzle aim vector + dispersion
        const speed = 3.6 + Math.random() * 2.2;
        const vel = dirToTarget.clone().add(randOffset).normalize().multiplyScalar(speed);
        ps.velocities[i * 3] = vel.x;
        ps.velocities[i * 3 + 1] = vel.y;
        ps.velocities[i * 3 + 2] = vel.z;
      } else {
        life += delta;
        ps.lifetimes[i] = life;

        if (life >= maxLife) {
          // Recycle
          ps.lifetimes[i] = -1;
        } else {
          // Physics step: move particle + electrostatic attraction towards target
          const tNorm = life / maxLife;
          const currPos = new THREE.Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
          const pull = new THREE.Vector3().subVectors(targetWorldPos, currPos).normalize().multiplyScalar(1.8 * delta);

          ps.velocities[i * 3] += pull.x;
          ps.velocities[i * 3 + 1] += pull.y;
          ps.velocities[i * 3 + 2] += pull.z;

          positions[i * 3] += ps.velocities[i * 3] * delta;
          positions[i * 3 + 1] += ps.velocities[i * 3 + 1] * delta;
          positions[i * 3 + 2] += ps.velocities[i * 3 + 2] * delta;

          // Color gradient: fiery orange (#ff5500) to glowing warm amber (#ffb703)
          const r = 1.0;
          const g = 0.38 + tNorm * 0.42;
          const b = 0.02 + tNorm * 0.15;
          colors[i * 3] = r;
          colors[i * 3 + 1] = g;
          colors[i * 3 + 2] = b;

          // Size expands slightly as cloud disperses, then fades
          sizes[i] = (1 - tNorm * 0.6) * (14.0 + (i % 8));
        }
      }
    }

    ps.geometry.attributes.position.needsUpdate = true;
    ps.geometry.attributes.color.needsUpdate = true;
    ps.geometry.attributes.size.needsUpdate = true;
  };

  // Update Workpiece Coating Appearance per region
  const updateWorkpieceCoating = () => {
    const coverage = liveCoverageRef.current;
    const currentState = liveStateRef.current;
    const activeTargetId = currentStepData?.targetRegionId;

    REGIONS.forEach((region) => {
      const mesh = regionMeshesRef.current[region.id];
      const highlight = regionHighlightsRef.current[region.id];
      if (!mesh) return;

      const pct = (coverage[region.id] || 0) / 100; // 0 to 1

      // Interpolate material properties
      // Raw: Machined metallic grey (color: #8a99ad, metalness: 0.9, roughness: 0.28)
      // Coated: Electrostatic orange powder coat (color: #ff6b1a, metalness: 0.2, roughness: 0.55)
      const rawColor = new THREE.Color(0x8a99ad);
      const coatedColor = new THREE.Color(0xff6a14);
      const blendedColor = rawColor.clone().lerp(coatedColor, pct);

      mesh.material.color.copy(blendedColor);
      mesh.material.metalness = THREE.MathUtils.lerp(0.9, 0.18, pct);
      mesh.material.roughness = THREE.MathUtils.lerp(0.28, 0.58, pct);

      // Targeted Region Highlight Outline / Halo
      if (highlight) {
        const isTargeted =
          region.id === activeTargetId &&
          (currentState === MACHINE_STATES.POSITIONING ||
            currentState === MACHINE_STATES.SETTLING ||
            currentState === MACHINE_STATES.PUFFING);

        highlight.visible = isTargeted;
        if (isTargeted) {
          // Pulse the cyan outline
          const pulse = (Math.sin(Date.now() * 0.008) + 1) * 0.5;
          highlight.material.opacity = 0.45 + pulse * 0.45;
        }
      }
    });
  };

  // Update Machine Visuals: Nozzle lights, laser guide, Andon tower
  const updateStatusVisuals = (elapsed) => {
    const currentState = liveStateRef.current;
    const isPuffingNow = liveIsPuffingRef.current;
    const activeNzId = liveActiveNozzleRef.current;

    // Nozzles LED & Emissive glow
    NOZZLES.forEach((nz) => {
      const nzGroup = nozzlesMeshesRef.current[nz.id];
      if (!nzGroup) return;

      const tipMesh = nzGroup.userData.tipMesh;
      if (tipMesh) {
        if (nz.id === activeNzId && isPuffingNow) {
          // Blazing orange firing pulse
          const pulse = Math.sin(elapsed * 30) * 0.4 + 0.6;
          tipMesh.material.emissive.setHex(0xff5500);
          tipMesh.material.emissiveIntensity = 2.5 * pulse;
        } else if (nz.id === activeNzId) {
          // Armed / Ready cyan glow
          tipMesh.material.emissive.setHex(0x00f0ff);
          tipMesh.material.emissiveIntensity = 1.2;
        } else {
          // Idle standby soft glow
          tipMesh.material.emissive.setHex(0x334155);
          tipMesh.material.emissiveIntensity = 0.3;
        }
      }
    });

    // Laser alignment guide from active nozzle to workpiece
    if (laserGuideRef.current) {
      const showLaser =
        (currentState === MACHINE_STATES.POSITIONING || currentState === MACHINE_STATES.SETTLING) &&
        activeNzId;

      laserGuideRef.current.visible = !!showLaser;

      if (showLaser) {
        const nzData = NOZZLES.find((n) => n.id === activeNzId) || NOZZLES[0];
        const startPos = new THREE.Vector3(...nzData.position);
        let endPos = new THREE.Vector3(0, 0.4, 0);
        const targetMesh = regionMeshesRef.current[currentStepData?.targetRegionId || 'region-1'];
        if (targetMesh) targetMesh.getWorldPosition(endPos);

        const posArr = laserGuideRef.current.geometry.attributes.position.array;
        posArr[0] = startPos.x;
        posArr[1] = startPos.y;
        posArr[2] = startPos.z;
        posArr[3] = endPos.x;
        posArr[4] = endPos.y;
        posArr[5] = endPos.z;
        laserGuideRef.current.geometry.attributes.position.needsUpdate = true;
      }
    }

    // Andon Tower Light on enclosure
    if (andonLightRef.current) {
      const { redLight, amberLight, greenLight, cyanRing } = andonLightRef.current;
      if (currentState === MACHINE_STATES.COMPLETE) {
        greenLight.material.emissiveIntensity = 2.2;
        amberLight.material.emissiveIntensity = 0.1;
        redLight.material.emissiveIntensity = 0.1;
        cyanRing.material.emissiveIntensity = 0.8;
      } else if (isPuffingNow) {
        const flash = Math.sin(elapsed * 20) > 0 ? 2.5 : 0.4;
        amberLight.material.emissiveIntensity = flash;
        greenLight.material.emissiveIntensity = 0.1;
        redLight.material.emissiveIntensity = 0.1;
        cyanRing.material.emissiveIntensity = 1.5;
      } else if (currentState === MACHINE_STATES.ROTATING || currentState === MACHINE_STATES.POSITIONING) {
        amberLight.material.emissiveIntensity = 0.3;
        greenLight.material.emissiveIntensity = 0.1;
        redLight.material.emissiveIntensity = 0.1;
        cyanRing.material.emissiveIntensity = 2.0;
      } else {
        // Idle / Settling
        amberLight.material.emissiveIntensity = 0.8;
        greenLight.material.emissiveIntensity = 0.2;
        redLight.material.emissiveIntensity = 0.1;
        cyanRing.material.emissiveIntensity = 0.5;
      }
    }
  };

  return (
    <div className="relative w-full h-full select-none" ref={mountRef}>
      {/* 3D Viewport overlay indicators */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 text-xs font-mono text-cyan-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>MULTI-AXIS 3D CHAMBER</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">INTERACTIVE ORBIT & ZOOM</span>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 z-10 pointer-events-none text-[11px] font-mono text-slate-400 bg-slate-900/70 backdrop-blur px-3 py-1 rounded border border-slate-700/50">
        Primary Axis (Roll) &bull; Secondary Axis (Tilt) &bull; 3 Electrostatic Guns
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// THREE.JS SETUP HELPERS
// -------------------------------------------------------------

function easeOutCubic(x) {
  return 1 - Math.pow(1 - x, 3);
}

function setupLighting(scene) {
  // Ambient fill
  const ambient = new THREE.AmbientLight(0x1a2638, 1.2);
  scene.add(ambient);

  // Main Key Spotlight overhead
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
  keyLight.position.set(4, 7, 5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 25;
  keyLight.shadow.bias = -0.0005;
  scene.add(keyLight);

  // Cyan rim / accent light
  const cyanRim = new THREE.DirectionalLight(0x00e5ff, 1.8);
  cyanRim.position.set(-5, 4, -4);
  scene.add(cyanRim);

  // Warm amber under-bounce light for powder glow
  const amberBounce = new THREE.DirectionalLight(0xff7700, 1.0);
  amberBounce.position.set(0, -4, 2);
  scene.add(amberBounce);

  // Studio overhead fluorescent tube lights (visual geometry + soft emission)
  const tubeLightGroup = new THREE.Group();
  for (let x = -1.8; x <= 1.8; x += 3.6) {
    const tubeGeo = new THREE.CylinderGeometry(0.04, 0.04, 4.4, 16);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xd6e4ff,
      emissiveIntensity: 1.5,
      roughness: 0.1,
    });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    tube.rotation.x = Math.PI / 2;
    tube.position.set(x, 2.9, 0);
    tubeLightGroup.add(tube);
  }
  scene.add(tubeLightGroup);
}

function setupEnclosure(scene, andonRef) {
  const enclosureGroup = new THREE.Group();

  // Dark industrial floor plate
  const floorGeo = new THREE.BoxGeometry(6.6, 0.25, 5.6);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x0c121e,
    metalness: 0.7,
    roughness: 0.35,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.y = -1.6;
  floor.receiveShadow = true;
  enclosureGroup.add(floor);

  // Chamber Floor Grid
  const gridHelper = new THREE.GridHelper(6.0, 24, 0x00f0ff, 0x1e2d42);
  gridHelper.position.y = -1.46;
  enclosureGroup.add(gridHelper);

  // Engineering circular reticle in center of floor
  const ringGeo = new THREE.RingGeometry(1.6, 1.63, 64);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide, transparent: true, opacity: 0.3 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -1.45;
  enclosureGroup.add(ring);

  // Inner suction exhaust grate
  const grateGeo = new THREE.PlaneGeometry(1.8, 1.8);
  const grateMat = new THREE.MeshStandardMaterial({
    color: 0x070b12,
    metalness: 0.9,
    roughness: 0.8,
  });
  const grate = new THREE.Mesh(grateGeo, grateMat);
  grate.rotation.x = -Math.PI / 2;
  grate.position.y = -1.455;
  enclosureGroup.add(grate);

  // Enclosure extruded aluminum frame pillars & beams
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x151e2e,
    metalness: 0.8,
    roughness: 0.35,
  });

  const pillarGeo = new THREE.BoxGeometry(0.14, 4.6, 0.14);
  const xOffsets = [-3.2, 3.2];
  const zOffsets = [-2.6, 2.6];

  xOffsets.forEach((x) => {
    zOffsets.forEach((z) => {
      const pillar = new THREE.Mesh(pillarGeo, frameMat);
      pillar.position.set(x, 0.7, z);
      pillar.castShadow = true;
      enclosureGroup.add(pillar);
    });
  });

  // Top crossbeams
  const beamXGeo = new THREE.BoxGeometry(6.54, 0.14, 0.14);
  const beamZGeo = new THREE.BoxGeometry(0.14, 0.14, 5.34);

  [-2.6, 2.6].forEach((z) => {
    const beam = new THREE.Mesh(beamXGeo, frameMat);
    beam.position.set(0, 3.0, z);
    enclosureGroup.add(beam);
  });

  [-3.2, 3.2].forEach((x) => {
    const beam = new THREE.Mesh(beamZGeo, frameMat);
    beam.position.set(x, 3.0, 0);
    enclosureGroup.add(beam);
  });

  // Transparent Tempered Glass Panels
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x1e3a5f,
    metalness: 0.1,
    roughness: 0.08,
    transmission: 0.82,
    transparent: true,
    opacity: 0.22,
    reflectivity: 0.9,
    side: THREE.DoubleSide,
  });

  // Front glass
  const glassFrontGeo = new THREE.PlaneGeometry(6.26, 4.3);
  const glassFront = new THREE.Mesh(glassFrontGeo, glassMat);
  glassFront.position.set(0, 0.7, 2.58);
  enclosureGroup.add(glassFront);

  // Back glass
  const glassBack = new THREE.Mesh(glassFrontGeo, glassMat);
  glassBack.position.set(0, 0.7, -2.58);
  glassBack.rotation.y = Math.PI;
  enclosureGroup.add(glassBack);

  // Left & Right glass
  const glassSideGeo = new THREE.PlaneGeometry(5.06, 4.3);
  const glassLeft = new THREE.Mesh(glassSideGeo, glassMat);
  glassLeft.position.set(-3.18, 0.7, 0);
  glassLeft.rotation.y = Math.PI / 2;
  enclosureGroup.add(glassLeft);

  const glassRight = new THREE.Mesh(glassSideGeo, glassMat);
  glassRight.position.set(3.18, 0.7, 0);
  glassRight.rotation.y = -Math.PI / 2;
  enclosureGroup.add(glassRight);

  // Industrial Warning Hazard Chevrons on Front Sill
  const sillGeo = new THREE.BoxGeometry(6.4, 0.16, 0.3);
  const sillMat = new THREE.MeshStandardMaterial({
    color: 0x222a38,
    roughness: 0.4,
  });
  const sill = new THREE.Mesh(sillGeo, sillMat);
  sill.position.set(0, -1.4, 2.55);
  enclosureGroup.add(sill);

  // Andon Light Tower on top front-right pillar
  const andonGroup = new THREE.Group();
  andonGroup.position.set(3.05, 3.1, 2.45);

  const towerStemGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.35, 16);
  const towerStem = new THREE.Mesh(towerStemGeo, frameMat);
  towerStem.position.y = 0.175;
  andonGroup.add(towerStem);

  const lightSegGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.12, 16);

  const redMat = new THREE.MeshStandardMaterial({ color: 0xff1e1e, emissive: 0xff1e1e, emissiveIntensity: 0.1 });
  const redLight = new THREE.Mesh(lightSegGeo, redMat);
  redLight.position.y = 0.59;
  andonGroup.add(redLight);

  const amberMat = new THREE.MeshStandardMaterial({ color: 0xff9900, emissive: 0xff9900, emissiveIntensity: 0.8 });
  const amberLight = new THREE.Mesh(lightSegGeo, amberMat);
  amberLight.position.y = 0.47;
  andonGroup.add(amberLight);

  const greenMat = new THREE.MeshStandardMaterial({ color: 0x00ff66, emissive: 0x00ff66, emissiveIntensity: 0.2 });
  const greenLight = new THREE.Mesh(lightSegGeo, greenMat);
  greenLight.position.y = 0.35;
  andonGroup.add(greenLight);

  // Cyan status beacon ring
  const cyanRingGeo = new THREE.TorusGeometry(0.08, 0.02, 16, 32);
  const cyanRingMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 1.0 });
  const cyanRing = new THREE.Mesh(cyanRingGeo, cyanRingMat);
  cyanRing.rotation.x = Math.PI / 2;
  cyanRing.position.y = 0.7;
  andonGroup.add(cyanRing);

  enclosureGroup.add(andonGroup);
  andonRef.current = { redLight, amberLight, greenLight, cyanRing };

  scene.add(enclosureGroup);
}

function setupKinematicsAndWorkpiece(scene) {
  // BASE KINEMATIC SUPPORTS (fixed to ground)
  const supportGroup = new THREE.Group();
  const supportMat = new THREE.MeshStandardMaterial({ color: 0x1a2333, metalness: 0.85, roughness: 0.3 });

  // Left & right bearing pedestals holding primary horizontal axle
  const pedestalGeo = new THREE.BoxGeometry(0.4, 2.0, 0.5);
  const leftPedestal = new THREE.Mesh(pedestalGeo, supportMat);
  leftPedestal.position.set(-2.4, -0.4, 0);
  supportGroup.add(leftPedestal);

  const rightPedestal = new THREE.Mesh(pedestalGeo, supportMat);
  rightPedestal.position.set(2.4, -0.4, 0);
  supportGroup.add(rightPedestal);

  // Bearing collars & drive servo motor
  const collarGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.45, 24);
  const leftCollar = new THREE.Mesh(collarGeo, supportMat);
  leftCollar.rotation.z = Math.PI / 2;
  leftCollar.position.set(-2.2, 0.4, 0);
  supportGroup.add(leftCollar);

  const rightCollar = new THREE.Mesh(collarGeo, supportMat);
  rightCollar.rotation.z = Math.PI / 2;
  rightCollar.position.set(2.2, 0.4, 0);
  supportGroup.add(rightCollar);

  // Stepper motor housing on right side
  const motorGeo = new THREE.BoxGeometry(0.5, 0.5, 0.6);
  const motorMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
  const motor = new THREE.Mesh(motorGeo, motorMat);
  motor.position.set(2.7, 0.4, 0);
  supportGroup.add(motor);

  scene.add(supportGroup);

  // PRIMARY ROTATION PIVOT GROUP (Roll axis around X or Z)
  // Let primary rotation be around X-axis: pitch/roll rotation
  const primaryPivot = new THREE.Group();
  primaryPivot.position.set(0, 0.4, 0);
  scene.add(primaryPivot);

  // Outer Gimbal Ring / Cradle
  const outerRingMat = new THREE.MeshStandardMaterial({ color: 0x2d3748, metalness: 0.8, roughness: 0.3 });
  const outerRingGeo = new THREE.TorusGeometry(2.1, 0.08, 16, 64);
  const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
  outerRing.rotation.y = Math.PI / 2;
  primaryPivot.add(outerRing);

  // Cyan Primary Angle Scale & Reticle
  const cyanRingMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.7, wireframe: true });
  const cyanRingGeo = new THREE.TorusGeometry(2.18, 0.015, 8, 48);
  const cyanScaleRing = new THREE.Mesh(cyanRingGeo, cyanRingMat);
  cyanScaleRing.rotation.y = Math.PI / 2;
  primaryPivot.add(cyanScaleRing);

  // Horizontal support shafts connecting ring to bearing pedestals
  const shaftGeo = new THREE.CylinderGeometry(0.09, 0.09, 4.4, 24);
  const mainShaft = new THREE.Mesh(shaftGeo, supportMat);
  mainShaft.rotation.z = Math.PI / 2;
  primaryPivot.add(mainShaft);

  // SECONDARY TILT PIVOT GROUP (Mounted inside primary gimbal)
  // Rotates around secondary axis (Z-axis in local space)
  const secondaryPivot = new THREE.Group();
  primaryPivot.add(secondaryPivot);

  // Inner Gimbal Frame / Bracket
  const innerRingMat = new THREE.MeshStandardMaterial({ color: 0x3b4252, metalness: 0.75, roughness: 0.35 });
  const innerYokeGeo = new THREE.TorusGeometry(1.7, 0.06, 16, 64);
  const innerYoke = new THREE.Mesh(innerYokeGeo, innerRingMat);
  secondaryPivot.add(innerYoke);

  // Cyan Secondary Axis reticle arc
  const tiltArcGeo = new THREE.TorusGeometry(1.76, 0.012, 8, 36, Math.PI);
  const tiltArc = new THREE.Mesh(tiltArcGeo, cyanRingMat);
  tiltArc.rotation.z = -Math.PI / 2;
  secondaryPivot.add(tiltArc);

  // CLAMP FIXTURES AT OPPOSITE ENDS (-X and +X)
  const clampGroup = new THREE.Group();
  const clampMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.25 });
  const clampAccentMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.5, roughness: 0.3 });

  // Clamp 1 (Left end, -X)
  const clampLeft = createClampAssembly(clampMat, clampAccentMat);
  clampLeft.position.set(-1.65, 0, 0);
  clampLeft.rotation.y = Math.PI / 2;
  clampGroup.add(clampLeft);

  // Clamp 2 (Right end, +X)
  const clampRight = createClampAssembly(clampMat, clampAccentMat);
  clampRight.position.set(1.65, 0, 0);
  clampRight.rotation.y = -Math.PI / 2;
  clampGroup.add(clampRight);

  secondaryPivot.add(clampGroup);

  // WORKPIECE: CURVED METALLIC COMPONENT DIVIDED INTO 4 REGIONS
  const { workpieceGroup, regionMeshes, regionHighlights } = createCurvedWorkpieceWithRegions();
  secondaryPivot.add(workpieceGroup);

  return { primaryPivot, secondaryPivot, regionMeshes, regionHighlights };
}

function createClampAssembly(bodyMat, accentMat) {
  const clamp = new THREE.Group();

  // Clamp main mounting arm
  const armGeo = new THREE.BoxGeometry(0.12, 0.35, 0.3);
  const arm = new THREE.Mesh(armGeo, bodyMat);
  clamp.add(arm);

  // Dual gripper jaws holding the metal panel edge
  const jawUpperGeo = new THREE.BoxGeometry(0.15, 0.06, 0.35);
  const jawUpper = new THREE.Mesh(jawUpperGeo, bodyMat);
  jawUpper.position.set(0.08, 0.12, 0);
  clamp.add(jawUpper);

  const jawLowerGeo = new THREE.BoxGeometry(0.15, 0.06, 0.35);
  const jawLower = new THREE.Mesh(jawLowerGeo, bodyMat);
  jawLower.position.set(0.08, -0.12, 0);
  clamp.add(jawLower);

  // Knurled tightening screw
  const screwGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.16, 16);
  const screw = new THREE.Mesh(screwGeo, accentMat);
  screw.position.set(0.08, 0.22, 0);
  clamp.add(screw);

  return clamp;
}

function createCurvedWorkpieceWithRegions() {
  const workpieceGroup = new THREE.Group();
  const regionMeshes = {};
  const regionHighlights = {};

  // Define 4 distinct contiguous curved sections along an aerodynamic S-curve profile
  // The curve spans along X from -1.5 to +1.5, curved in Y and Z.
  // Profile points for the 4 regions:
  const sectionDefinitions = [
    {
      id: 'region-1', // Leading Flange
      tMin: 0.0,
      tMax: 0.25,
      name: 'Region 1: Leading Flange',
    },
    {
      id: 'region-2', // Convex Crown
      tMin: 0.25,
      tMax: 0.5,
      name: 'Region 2: Convex Crown',
    },
    {
      id: 'region-3', // Concave Flank
      tMin: 0.5,
      tMax: 0.75,
      name: 'Region 3: Concave Flank',
    },
    {
      id: 'region-4', // Trailing Lip
      tMin: 0.75,
      tMax: 1.0,
      name: 'Region 4: Trailing Lip',
    },
  ];

  // Mathematical curve function for our curved aluminium panel:
  // t goes from 0 to 1
  const getCurvePoint = (t) => {
    // Length along X: -1.55 to +1.55
    const x = THREE.MathUtils.lerp(-1.55, 1.55, t);
    // Curvature in Y: S-curve with convex crest and concave valley
    const y = Math.sin(t * Math.PI * 1.5 - 0.2) * 0.45;
    // Curvature in Z: aerodynamic camber
    const z = Math.cos(t * Math.PI) * 0.28;
    return new THREE.Vector3(x, y, z);
  };

  const panelWidth = 0.9; // panel depth in Z-direction
  const numStepsPerSection = 14;

  sectionDefinitions.forEach((sec) => {
    // Generate curved ribbon strip geometry with thickness
    const geom = new THREE.BufferGeometry();
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    const tStart = sec.tMin;
    const tEnd = sec.tMax;

    // Build 2D grid along t and v (width)
    for (let i = 0; i <= numStepsPerSection; i++) {
      const t = tStart + (tEnd - tStart) * (i / numStepsPerSection);
      const centerPt = getCurvePoint(t);

      // Estimate tangent and normal to curve
      const nextPt = getCurvePoint(Math.min(1, t + 0.01));
      const tangent = new THREE.Vector3().subVectors(nextPt, centerPt).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const binormal = new THREE.Vector3().crossVectors(tangent, up).normalize();
      const normal = new THREE.Vector3().crossVectors(binormal, tangent).normalize();

      for (let j = 0; j <= 2; j++) {
        const v = (j / 2 - 0.5) * panelWidth;
        const pt = centerPt.clone().add(binormal.clone().multiplyScalar(v));

        positions.push(pt.x, pt.y, pt.z);
        normals.push(normal.x, normal.y, normal.z);
        uvs.push(i / numStepsPerSection, j / 2);
      }
    }

    // Indices for quads
    for (let i = 0; i < numStepsPerSection; i++) {
      for (let j = 0; j < 2; j++) {
        const a = i * 3 + j;
        const b = (i + 1) * 3 + j;
        const c = (i + 1) * 3 + (j + 1);
        const d = i * 3 + (j + 1);
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);
    geom.computeVertexNormals();

    // Material for this region: raw machined aluminium initially
    const material = new THREE.MeshStandardMaterial({
      color: 0x8a99ad,
      metalness: 0.88,
      roughness: 0.28,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geom, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    workpieceGroup.add(mesh);
    regionMeshes[sec.id] = mesh;

    // Cyan holographic edge outline / wireframe for target highlighting
    const highlightMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
    });
    const highlightMesh = new THREE.Mesh(geom.clone(), highlightMat);
    highlightMesh.scale.multiplyScalar(1.02);
    highlightMesh.visible = false;
    workpieceGroup.add(highlightMesh);
    regionHighlights[sec.id] = highlightMesh;

    // Visible subtle seam line dividing the regions
    const edgeGeom = new THREE.EdgesGeometry(geom, 40);
    const edgeLine = new THREE.LineSegments(
      edgeGeom,
      new THREE.LineBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.4 })
    );
    workpieceGroup.add(edgeLine);
  });

  return { workpieceGroup, regionMeshes, regionHighlights };
}

function setupNozzles(scene) {
  const nozzleMeshes = {};

  // Setup alignment laser line
  const laserGeo = new THREE.BufferGeometry();
  laserGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3));
  const laserMat = new THREE.LineBasicMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0.75,
  });
  const laserGuide = new THREE.Line(laserGeo, laserMat);
  laserGuide.visible = false;
  scene.add(laserGuide);

  NOZZLES.forEach((nz) => {
    const nzGroup = new THREE.Group();
    nzGroup.position.set(...nz.position);

    // Aim the nozzle towards chamber center [0, 0.3, 0]
    nzGroup.lookAt(0, 0.3, 0);

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.3,
    });

    // Gun body barrel
    const barrelGeo = new THREE.CylinderGeometry(0.09, 0.11, 0.45, 16);
    const barrel = new THREE.Mesh(barrelGeo, bodyMat);
    barrel.rotation.x = Math.PI / 2;
    nzGroup.add(barrel);

    // Conical electrostatic spray nozzle tip
    const tipGeo = new THREE.ConeGeometry(0.12, 0.18, 16);
    const tipMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.4,
      metalness: 0.7,
      roughness: 0.25,
    });
    const tipMesh = new THREE.Mesh(tipGeo, tipMat);
    tipMesh.rotation.x = -Math.PI / 2;
    tipMesh.position.z = 0.31;
    nzGroup.add(tipMesh);
    nzGroup.userData.tipMesh = tipMesh;

    // Electrostatic electrode ring on tip
    const ringGeo = new THREE.TorusGeometry(0.07, 0.015, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.z = 0.38;
    nzGroup.add(ring);

    // Powder feed hose attached to rear
    const hoseGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.6, 12);
    const hoseMat = new THREE.MeshStandardMaterial({ color: 0xff7700, roughness: 0.6 });
    const hose = new THREE.Mesh(hoseGeo, hoseMat);
    hose.position.set(0, -0.15, -0.3);
    hose.rotation.x = 0.6;
    nzGroup.add(hose);

    // Mounting bracket to enclosure frame
    const bracketGeo = new THREE.BoxGeometry(0.06, 0.06, 0.4);
    const bracket = new THREE.Mesh(bracketGeo, bodyMat);
    bracket.position.set(0, 0.18, 0);
    nzGroup.add(bracket);

    scene.add(nzGroup);
    nozzleMeshes[nz.id] = nzGroup;
  });

  return { nozzleMeshes, laserGuide };
}

function setupParticleSystem(scene) {
  const count = 750;
  const geometry = new THREE.BufferGeometry();

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const lifetimes = new Float32Array(count);
  const maxLifetimes = new Float32Array(count);
  const velocities = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = 0;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = 0;

    colors[i * 3] = 1.0;
    colors[i * 3 + 1] = 0.45;
    colors[i * 3 + 2] = 0.05;

    sizes[i] = 16.0;
    lifetimes[i] = -1; // inactive
    maxLifetimes[i] = 0.45 + Math.random() * 0.35; // short fast burst
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  // Custom soft particle shader or points material
  // Using Three.js PointsMaterial with vertexColors
  const material = new THREE.PointsMaterial({
    size: 0.08,
    vertexColors: true,
    transparent: true,
    opacity: 0.88,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const mesh = new THREE.Points(geometry, material);
  mesh.visible = false;
  scene.add(mesh);

  return {
    mesh,
    geometry,
    material,
    count,
    lifetimes,
    maxLifetimes,
    velocities,
  };
}
