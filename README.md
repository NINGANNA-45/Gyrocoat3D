# GyroCoat 3D — Step-and-Puff Multi-Axis Powder Coating

An interactive browser-based 3D simulation prototype demonstrating how curved metallic components can be uniformly coated using calculated powder bursts and controlled multi-axis rotation.

---

## 🛠 Technology Stack

- **React 19** + **Vite 8**
- **Three.js** (WebGL 3D Engine with OrbitControls, directional studio lighting, and particle emission)
- **Lucide React** (Industrial engineering instrumentation iconography)
- **Vanilla CSS** with dark industrial engineering aesthetics, glassmorphism, and responsive layout

---

## 🚀 Quick Start (Windows & VS Code)

### 1. Open Terminal in VS Code
Open the project directory in VS Code:
```powershell
cd c:\Users\Ningu\Desktop\GyroCoat3d
```

### 2. Install Dependencies
Run in PowerShell:
```powershell
npm.cmd install
```

### 3. Start the Development Server
```powershell
npm.cmd run dev
```

### 4. Open in Your Browser
Open your browser and navigate to:
```
http://localhost:5173/
```

---

## ⚙️ Key Simulation Features

### 1. 3D Machine Architecture
- **Transparent Enclosure:** Dark navy tinted glass with aluminum extrusion frame, base exhaust grate, and an Andon status light tower.
- **Curved Metal Workpiece:** S-contoured aerodynamic panel divided into 4 visually distinct coating regions:
  1. *Region 1: Leading Flange*
  2. *Region 2: Convex Crown*
  3. *Region 3: Concave Flank*
  4. *Region 4: Trailing Lip*
- **Dual-Axis Kinematics:** Primary roll axis ($\theta_1$) and secondary tilt axis ($\theta_2$) mounted on cyan calibrated gimbals with opposite end clamps.
- **3 Electrostatic Spray Guns:**
  - *Nozzle 1 (Overhead):* Vertical conical pattern for convex crests.
  - *Nozzle 2 (Lateral Right):* Mid-plane fan jet for flanges and side profiles.
  - *Nozzle 3 (Underbelly):* Low-elevation inclined spray designed to penetrate concave cavities.

### 2. Step-and-Puff Automation (9-Step Sequence)
- **Step 1 — Position:** Orient workpiece to the initial planned angle ($\theta_1, \theta_2$).
- **Step 2 — Settle:** Stabilization dwell (airflow settles, zero vibration).
- **Step 3 — Puff:** Active nozzle emits an orange particle cloud directed toward the target region. Targeted region gradually shifts from raw machined metal to electrostatic powder coat finish.
- **Step 4 — Stop:** Powder emission cuts off completely.
- **Step 5 — Rotate:** Component rotates and tilts to the next planned orientation.
- **Step 6 — Settle:** Brief stabilization dwell.
- **Step 7 — Second Puff:** Different nozzle fires at the newly exposed region.
- **Step 8 — Repeat:** Repeats across all 4 sectors.
- **Step 9 — Complete:** Returns fixture to neutral `[0°, 0°]` and displays surface coverage metrology.

*Strict Rules Enforced:*
- Powder **only** appears during a puff.
- The component **does not rotate** while powder is being emitted.
- Rotation stops completely before the next puff begins.

### 3. Recipe Modes
- **Fixed Recipe:** Standard static sequence with fixed 1.8s pulse durations and predetermined orientations.
- **Geometry-Aware Recipe:** Curvature-compensated sequence. Modulates dwell durations (1.4s on low curvature up to 2.4s on the convex crown) and aligns nozzle normal vectors to overcome Faraday cage shielding on concave geometry.

### 4. Live Controls & Telemetry
- **State Badges:** `POSITIONING`, `SETTLING`, `PUFFING`, `ROTATING`, `COMPLETE`.
- **Kinematics Gauges:** Live primary roll and secondary tilt angle readouts with visual arc dials.
- **Active Nozzle Array:** Real-time armed/firing status, voltage, and flow rate.
- **Pulse Timer:** Countdown timer for active burst duration.
- **Controls:** Start Simulation, Pause / Resume, Restart, Speed (0.5x, 1x, 1.5x, 2x), and Camera View presets (Isometric, Close-Up, Gun View, Top-Down).
