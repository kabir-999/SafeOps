// ════════════════════════════════════════════════════════════
//  SAFEGUARD AI — MOCK DATA & API LAYER
//  Replace ML_API_ENDPOINT with your actual model endpoint
// ════════════════════════════════════════════════════════════

export const ML_API_ENDPOINT = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000/api/detect'

// ── Live detection fetch (replace hardcoded data when ready) ──
export async function fetchDetections() {
  try {
    const res = await fetch(ML_API_ENDPOINT, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) throw new Error('API not available')
    return await res.json()
  } catch {
    // Return hardcoded mock data while ML model is not connected
    return MOCK_DETECTIONS
  }
}

// ── MOCK DATA — mirrors ML model output format ──────────────
// Format: { persons: [...], timestamp, frame_id, fps }
export const MOCK_DETECTIONS = {
  timestamp: new Date().toISOString(),
  frame_id: 4821,
  fps: 28.4,
  model_version: 'SafeGuard-YOLOv8-v2.4',
  persons: [
    {
      id: 'P1',
      x: 142,
      y: 315,
      bbox: { x1: 120, y1: 260, x2: 185, y2: 380 },
      area: 'Zone A',
      confidence: 0.971,
      violations: [],
      ppe_status: {
        helmet: true,
        vest: true,
        gloves: true,
      },
      time_detected: '2025-01-15T14:02:11Z',
      risk_score: 2,
    },
    {
      id: 'P2',
      x: 380,
      y: 290,
      bbox: { x1: 355, y1: 230, x2: 420, y2: 360 },
      area: 'Zone A',
      confidence: 0.941,
      violations: ['Missing Helmet'],
      ppe_status: {
        helmet: false,
        vest: true,
        gloves: true,
      },
      time_detected: '2025-01-15T14:32:11Z',
      risk_score: 8,
    },
    {
      id: 'P3',
      x: 620,
      y: 340,
      bbox: { x1: 595, y1: 275, x2: 665, y2: 415 },
      area: 'Hazard Zone',
      confidence: 0.988,
      violations: ['Missing Helmet', 'No Safety Vest'],
      ppe_status: {
        helmet: false,
        vest: false,
        gloves: true,
      },
      time_detected: '2025-01-15T14:28:44Z',
      risk_score: 9,
    },
    {
      id: 'P4',
      x: 820,
      y: 410,
      bbox: { x1: 795, y1: 345, x2: 860, y2: 490 },
      area: 'Zone B',
      confidence: 0.962,
      violations: [],
      ppe_status: {
        helmet: true,
        vest: true,
        gloves: false,
      },
      time_detected: '2025-01-15T14:15:30Z',
      risk_score: 3,
    },
    {
      id: 'P5',
      x: 560,
      y: 180,
      bbox: { x1: 535, y1: 120, x2: 600, y2: 255 },
      area: 'Eating Area',
      confidence: 0.934,
      violations: [],
      ppe_status: {
        helmet: true,
        vest: true,
        gloves: true,
      },
      time_detected: '2025-01-15T14:08:17Z',
      risk_score: 0,
    },
    {
      id: 'P6',
      x: 220,
      y: 460,
      bbox: { x1: 195, y1: 395, x2: 260, y2: 540 },
      area: 'Zone B',
      confidence: 0.957,
      violations: ['No Gloves'],
      ppe_status: {
        helmet: true,
        vest: true,
        gloves: false,
      },
      time_detected: '2025-01-15T14:21:05Z',
      risk_score: 5,
    },
    {
      id: 'P7',
      x: 710,
      y: 270,
      bbox: { x1: 685, y1: 205, x2: 750, y2: 345 },
      area: 'Hazard Zone',
      confidence: 0.979,
      violations: ['Missing Helmet'],
      ppe_status: {
        helmet: false,
        vest: true,
        gloves: true,
      },
      time_detected: '2025-01-15T14:35:02Z',
      risk_score: 8,
    },
    {
      id: 'P8',
      x: 480,
      y: 500,
      bbox: { x1: 455, y1: 435, x2: 520, y2: 575 },
      area: 'Zone A',
      confidence: 0.966,
      violations: [],
      ppe_status: {
        helmet: true,
        vest: true,
        gloves: true,
      },
      time_detected: '2025-01-15T14:38:19Z',
      risk_score: 1,
    },
  ],
}

// ── Historical trend data ────────────────────────────────────
export const COMPLIANCE_TREND = [
  { month: 'Jan', rate: 82, violations: 34, workers: 38 },
  { month: 'Feb', rate: 88, violations: 28, workers: 41 },
  { month: 'Mar', rate: 76, violations: 52, workers: 44 },
  { month: 'Apr', rate: 91, violations: 21, workers: 46 },
  { month: 'May', rate: 87, violations: 29, workers: 42 },
  { month: 'Jun', rate: 94, violations: 14, workers: 48 },
  { month: 'Jul', rate: 89, violations: 23, workers: 45 },
  { month: 'Aug', rate: 96, violations: 10, workers: 50 },
  { month: 'Sep', rate: 92, violations: 18, workers: 47 },
  { month: 'Oct', rate: 97, violations: 7, workers: 52 },
  { month: 'Nov', rate: 93, violations: 16, workers: 49 },
  { month: 'Dec', rate: 98, violations: 5, workers: 53 },
]

// ── Zone definitions (physical layout) ──────────────────────
export const ZONE_LAYOUT = {
  'Zone A':     { x: 0.04, y: 0.28, w: 0.36, h: 0.52, color: '#1A56FF', desc: 'Primary Work Area' },
  'Zone B':     { x: 0.44, y: 0.52, w: 0.24, h: 0.36, color: '#FFB800', desc: 'Secondary Work Area' },
  'Hazard Zone':{ x: 0.70, y: 0.26, w: 0.26, h: 0.54, color: '#FF2D55', desc: 'High Risk — Full PPE Required' },
  'Eating Area':{ x: 0.44, y: 0.18, w: 0.24, h: 0.30, color: '#00C48C', desc: 'Rest & Break Area' },
}

// ── Alert history ─────────────────────────────────────────── 
export const ALERT_HISTORY = [
  { id: 'ALT-001', person: 'P3', area: 'Hazard Zone', type: 'Missing Helmet + No Vest', severity: 'CRITICAL', time: '14:35:02', resolved: false },
  { id: 'ALT-002', person: 'P7', area: 'Hazard Zone', type: 'Missing Helmet', severity: 'HIGH', time: '14:32:11', resolved: false },
  { id: 'ALT-003', person: 'P2', area: 'Zone A', type: 'Missing Helmet', severity: 'HIGH', time: '14:28:44', resolved: true },
  { id: 'ALT-004', person: 'P6', area: 'Zone B', type: 'No Gloves', severity: 'MED', time: '14:21:05', resolved: true },
  { id: 'ALT-005', person: 'P11', area: 'Zone A', type: 'Missing Helmet', severity: 'HIGH', time: '14:15:30', resolved: true },
  { id: 'ALT-006', person: 'P9', area: 'Hazard Zone', type: 'No Safety Vest', severity: 'CRITICAL', time: '14:08:17', resolved: true },
]