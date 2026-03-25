# CircleAI 
## File Structure

```
src/
  lib/
    supabaseClient.js     ← Supabase init (just works)
  pages/
    HomePage.jsx          ← Landing page
    LoginPage.jsx         ← Google OAuth login
    DashboardPage.jsx     ← Dashboard shell (customize per PS)
  App.jsx                 ← Routes: / → /login → /dashboard
```

## Per Problem Statement – What to Swap in DashboardPage.jsx

### ML PS 1 – Traceability Management
- NAV_ITEMS: Overview, Material Flow, Processing, Dispatch, Reports
- Main viz: Material lifecycle Sankey / flow chart
- Stats: Total kg processed, Batches today, Dispatch pending, Quality score
- Right panel: Recent material entries

### ML PS 2 – Restaurant Oracle
- NAV_ITEMS: Overview, Social Feed, SWOT, Competitors, Alerts
- Main viz: Sentiment timeline chart (recharts LineChart)
- Stats: Mentions today, Avg rating, Negative alerts, Confidence score
- Right panel: Live alert feed from model

### AI PS 1 – Plastic Identification
- NAV_ITEMS: Overview, Upload Image, Classifications, History, Reports
- Main viz: Image upload + classified result display
- Stats: Items scanned, Accuracy %, Misclassified, PET / HDPE breakdown
- Right panel: Classification confidence scores

### AI PS 2 – PPE Compliance
- NAV_ITEMS: Overview, Live Feed, Violations, Workers, Reports
- Main viz: Video feed with bounding boxes (img tag / canvas)
- Stats: Workers detected, Compliant, Violations, Compliance %
- Right panel: Violation alerts with timestamps


<!-- solution -->

# SafeGuardAI — Cinematic PPE Compliance Homepage

A premium, immersive React homepage for an AI-powered industrial safety platform.

## ✨ Features

- **Cinematic loading screen** — Yellow construction sign, animated progress bar, hazard stripes
- **Full 3D hero canvas** — Hand-drawn 3D helmet (left), cement truck (right), workers scene (center), warning sign — all with parallax depth
- **Perspective grid floor** — Industrial site feel with cinematic lighting shafts
- **Scroll-parallax 3D elements** — Objects zoom and drift with scroll
- **Animated detection canvas** — Bounding boxes appear in real-time, red/green coded
- **Live digital twin** — Top-down map with moving workers, zone overlays, minimap
- **Cinematic typography mix** — Bebas Neue (display) + Instrument Serif (italic accent) + Oswald (headings) + Barlow Condensed (body) + JetBrains Mono (UI/HUD)
- **Custom cursor** — Orange dot + lagged ring
- **Film grain + scanlines** — Atmospheric texture overlay
- **Black background** — Industrial dark theme throughout

## 📁 Folder Structure

```
safeguard-ai/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx              # Entry point
    ├── App.jsx               # Root with loading gate
    ├── index.css             # All global styles + CSS variables
    └── components/
        ├── LoadingScreen.jsx   # Construction sign + progress
        ├── CustomCursor.jsx    # Orange dot cursor with ring
        ├── Navbar.jsx          # Fixed nav with scroll effect
        ├── HeroSection.jsx     # Full-viewport hero
        ├── HeroCanvas.jsx      # 3D canvas: helmet, truck, workers, sign
        ├── ProblemSection.jsx  # Problem + unmonitored worker feed
        ├── SolutionSection.jsx # Detection canvas with bounding boxes
        ├── DigitalTwinSection.jsx # Full-width live map
        └── Sections.jsx        # Features, Analytics, CTA, Footer
```

## 🚀 Setup & Run

```bash
# 1. Install dependencies
npm install

# 2. Run dev server
npm run dev

# 3. Open http://localhost:5173
```

## 🔗 Dashboard Integration

The "Enter Dashboard" and "Go to Dashboard" buttons route to `/dashboard`.
Make sure your router has this route registered, or update the onClick handlers in:
- `src/components/Navbar.jsx`
- `src/components/HeroSection.jsx`
- `src/components/Sections.jsx` (CTASection)

## 🔌 Backend Integration Points

| Location | What to replace |
|---|---|
| `HeroCanvas.jsx` — workers array | WebSocket live worker positions |
| `SolutionSection.jsx` — workers array | Real-time detection API response |
| `DigitalTwinSection.jsx` — workers array | Live tracking data stream |
| `Sections.jsx` — complianceData | `GET /api/analytics/monthly` |
| `Sections.jsx` — violations array | `GET /api/violations/recent` |
| `Sections.jsx` — KPI values | `GET /api/stats/daily` |

## 🎨 Typography System

| Font | Use |
|---|---|
| Bebas Neue | Display / Hero titles |
| Instrument Serif (italic) | Accent words in headings |
| Oswald | Section headings / card titles |
| Barlow Condensed | Body text / descriptions |
| JetBrains Mono | HUD data / labels / UI chrome |

## 🎬 Design Philosophy

Black background. Cinematic depth via perspective grids and layered Z-ordering.
3D objects rendered purely in Canvas 2D with projection math — no Three.js dependency needed.
Typography is intentionally mixed: industrial rigidity (Bebas/Oswald) broken by italic humanity (Instrument Serif).