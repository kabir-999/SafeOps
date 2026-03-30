# SafeGuard AI — PPE Compliance Monitoring System

> Real-time PPE compliance monitoring for industrial environments using computer vision, 3D simulation, and automated emergency response.

Built at **HackNiche 2025** · Problem Statement PS2

---

## Overview

SafeGuard AI is a web-based safety management platform for factories, recycling plants, and industrial facilities. It uses a YOLOv11-based computer vision model to detect whether workers are wearing required Personal Protective Equipment (PPE) in real time and surfaces everything through a live supervisor dashboard, a 3D factory simulation, and an automated emergency alert system.

The system is designed with **privacy-first principles**, no facial recognition, no identity tracking. Workers are monitored purely by PPE presence or absence.

---

## Features

### Supervisor Dashboard
- Real-time PPE violation feed updated live as the detection model processes camera frames
- Zone-wise breakdown of compliance across the factory floor
- Violation counters per PPE type: helmet, safety vest, gloves

### 3D Factory Simulation (Three.js)
- Interactive 3D floor plan of the factory built using Three.js
- Workers represented as anonymous avatars on the floor, hence, **no identity or face data used**
- Privacy-preserving approach: spatial location tracking replaces identity tracking entirely

### Emergency Trigger System
- One-click emergency trigger button on the 3D simulation for fire or medical emergencies
- Triggers an **n8n automation workflow** that instantly dispatches emails to:
  - Nearest hospitals
  - Fire stations
  - Police stations
- Simultaneously pushes an alarm to the **SafeOps mobile app**, alerting all workers in the vicinity to evacuate immediately
- Alarm state managed via Supabase Realtime — zero latency between trigger and app alert

### AI Detection Model
- Transfer learning on **YOLOv11** architecture
- Trained on a dataset of **30,000+ images** from the Kaggle PPE_DATASET_Yolov8
- Achieved **mAP score of 0.724** on validation set
- Detects: Person, Safety Helmet, Safety Vest, Gloves, Mask/Face Shield
- Latency: 6 to 8 seconds

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| 3D Simulation | Three.js |
| Backend | Python (FastAPI) |
| Database | Supabase (PostgreSQL + Realtime) |
| CV Model | YOLOv11 (Ultralytics) via Transfer Learning |
| Automation | n8n (emergency workflow) |
| Auth | Supabase Auth |

---

## Project Structure

```
hackniche/
├── src/                    # React frontend source
│   ├── components/         # Dashboard components
│   ├── pages/              # Route pages
│   └── lib/                # Supabase client, helpers
├── frontend/               # Additional frontend assets
├── Backend/                # Python FastAPI + YOLO inference
│   ├── model/              # YOLOv11 weights & config
│   └── main.py             # API endpoints for detection feed
├── public/                 # Static assets
├── supabase/               # Supabase migrations & schema
├── warehouse.html          # Three.js 3D simulation (standalone)
├── index.html              # App entry point
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## Setup & Installation

### Prerequisites
- Node.js 18+
- Python 3.10+
- A Supabase project
- n8n instance (cloud or self-hosted)

### 1. Clone the repo
```bash
git clone https://github.com/kabir-999/hackniche.git
cd hackniche
```

### 2. Install frontend dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env` file in the root:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance/webhook/emergency
```

### 4. Set up Supabase

Run the following SQL in your Supabase SQL editor:

```sql
-- PPE violation logs
create table violations (
  id uuid default gen_random_uuid() primary key,
  zone text,
  violation_type text,
  timestamp timestamptz default now(),
  camera_id text
);

-- Emergency alarm trigger
create table alarms (
  id uuid default gen_random_uuid() primary key,
  is_fire boolean default false,
  is_fall boolean default false,
  location text,
  triggered_at timestamptz default now()
);

-- Insert default alarm row
insert into alarms (is_fire, is_fall, location) values (false, false, '');
```

Enable **Realtime** on the `alarms` table in your Supabase dashboard.

### 5. Run the backend (YOLO inference server)
```bash
cd Backend
pip install -r requirements.txt
python main.py
```

### 6. Run the frontend
```bash
npm run dev
```

App runs at `http://localhost:5173`

---

## 🤖 Model Details

| Property | Value |
|---|---|
| Base Architecture | YOLOv11 |
| Training Method | Transfer Learning |
| Dataset | HackNiche PS2 (Kaggle) — 30,000+ images |
| Validation mAP | **0.724** |
| Detected Classes | Person, Helmet, Safety Vest, Gloves, Mask |
| Inference Mode | Real-time (live CCTV / recorded video) |

Dataset: [PPE_DATASET_Yolov8](https://www.kaggle.com/datasets/shlokraval/ppe-dataset-yolov8)
SafeOps AI Mobile Application: [https://github.com/Aagnya-Mistry/Hackniche_app](https://github.com/Aagnya-Mistry/Hackniche_app)

---

## Privacy Design

SafeGuard AI was built with a strict **no-identity-tracking** constraint:

- No facial recognition at any layer of the stack
- No biometric data collected or stored
- Workers are represented as **anonymous spatial entities** in the 3D simulation
- Violations are logged by zone and PPE type 
- The 3D simulation approach allows location-aware alerting without surveillance

---

## Future Scope

**QR-Code Based Anonymous Worker Alerting**
Workers will wear a QR code on their uniform sleeve encoding a public key. The CCTV + YOLO pipeline scans the QR, retrieves the matching encrypted worker record, and delivers a personalized PPE violation alert directly to their mobile app — without the system ever knowing who the worker is. Full asymmetric-key privacy stack.

**AI Agent Emergency Calls**
During fire or medical emergencies, an AI voice agent will call hospitals, fire stations, and police stations with real-time details (number of workers affected, injury estimates) and automatically attach CCTV snapshots via email — replacing manual calls and eliminating false alarm risk.

**Edge Deployment**
Optimising the YOLO model for deployment on Jetson Nano / Raspberry Pi, allowing offline, cloud-free operation in remote or restricted facilities.

**Shift-Level Compliance Heatmaps**
Persistent spatial heatmaps showing which areas of the factory floor have the highest violation frequency over time, enabling management to restructure gear stations and zone protocols based on data.

---

## Team

Built at HackNiche 2026

- **Kabir Mathur** - CV Model, Backend, Three.js Setup · [@kabir-999](https://github.com/kabir-999)
- **Aagnya Mistry** - Flutter Mobile App, n8n Workflow · [@Aagnya-Mistry](https://github.com/Aagnya-Mistry)
- **Chhavi Rathod** - Frontend, Supabase Setup . [@chhavirathod](https://github.com/chhavirathod)
- **Aayush Chaudhari** - CV Model, Dashboard . [@aayushhh-operator](https://github.com/aayushhh-operator)
