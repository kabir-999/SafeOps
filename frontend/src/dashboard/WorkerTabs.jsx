import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ComposedChart, Area
} from 'recharts'
import { ALERT_HISTORY, COMPLIANCE_TREND } from '../lib/mockData'

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(8,8,8,0.95)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 6,
      padding: '10px 14px',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
    }}>
      <div style={{ color: 'rgba(240,237,232,0.5)', marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color || '#F0EDE8' }}>
          {p.name}: <strong>{p.value}{p.name === 'rate' ? '%' : ''}</strong>
        </div>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════
//  VIOLATIONS TAB
// ══════════════════════════════════════════════
export function ViolationsTab({ detections }) {
  const persons = detections?.persons || []
  const violations = persons.filter(p => p.violations.length > 0)
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all'
    ? ALERT_HISTORY
    : filter === 'open'
    ? ALERT_HISTORY.filter(a => !a.resolved)
    : ALERT_HISTORY.filter(a => a.severity === filter.toUpperCase())

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Active violation cards */}
      {violations.length > 0 && (
        <div>
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#FF2D55', marginBottom: 12 }}>
            ● {violations.length} Active Violation{violations.length > 1 ? 's' : ''} — Requires Immediate Attention
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {violations.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                style={{
                  background: 'rgba(255,45,85,0.06)',
                  border: '1px solid rgba(255,45,85,0.25)',
                  borderRadius: 4,
                  padding: 20,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Pulsing indicator */}
                <div style={{
                  position: 'absolute', top: 14, right: 14,
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#FF2D55',
                  animation: 'vPulse 1.2s infinite',
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: '0.04em', color: '#FF2D55', lineHeight: 1 }}>{p.id}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(240,237,232,0.3)', marginTop: 2 }}>{p.area} · ({p.x}, {p.y})</div>
                  </div>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    color: '#FF2D55',
                    padding: '4px 10px',
                    background: 'rgba(255,45,85,0.12)',
                    border: '1px solid rgba(255,45,85,0.25)',
                    borderRadius: 4,
                  }}>
                    RISK {p.risk_score}/10
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {p.violations.map(v => (
                    <span key={v} style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9,
                      padding: '4px 10px',
                      background: 'rgba(255,45,85,0.12)',
                      border: '1px solid rgba(255,45,85,0.3)',
                      borderRadius: 3,
                      color: '#FF2D55',
                    }}>⚠ {v}</span>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    { key: 'helmet', label: 'Helmet', status: p.ppe_status?.helmet },
                    { key: 'vest', label: 'Vest', status: p.ppe_status?.vest },
                    { key: 'gloves', label: 'Gloves', status: p.ppe_status?.gloves },
                  ].map(item => (
                    <div key={item.key} style={{
                      flex: 1, padding: '6px 8px',
                      background: item.status ? 'rgba(0,196,140,0.08)' : 'rgba(255,45,85,0.12)',
                      border: `1px solid ${item.status ? 'rgba(0,196,140,0.2)' : 'rgba(255,45,85,0.25)'}`,
                      borderRadius: 3,
                      textAlign: 'center',
                    }}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: item.status ? '#00C48C' : '#FF2D55' }}>
                        {item.status ? '✓' : '✗'}
                      </div>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, color: 'rgba(240,237,232,0.35)', marginTop: 2 }}>{item.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{
                  marginTop: 12,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  color: 'rgba(240,237,232,0.2)',
                }}>
                  Detected: {new Date(p.time_detected).toLocaleTimeString()} · Conf: {(p.confidence * 100).toFixed(1)}%
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Violation log */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 4,
      }}>
        {/* Filter tabs */}
        <div style={{
          display: 'flex',
          gap: 0,
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          padding: '0 20px',
        }}>
          {[
            { key: 'all', label: 'All' },
            { key: 'open', label: 'Open' },
            { key: 'critical', label: 'Critical' },
            { key: 'high', label: 'High' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom: filter === f.key ? '2px solid #FF6B1A' : '2px solid transparent',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: filter === f.key ? '#F0EDE8' : 'rgba(240,237,232,0.3)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: -1,
              }}
            >
              {f.label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(240,237,232,0.2)' }}>
            {filtered.length} records
          </div>
        </div>

        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '80px 50px 60px 1fr 100px 80px 70px',
          gap: 8,
          padding: '10px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'rgba(240,237,232,0.25)',
        }}>
          <span>Alert ID</span>
          <span>Person</span>
          <span>Time</span>
          <span>Violation</span>
          <span>Zone</span>
          <span>Severity</span>
          <span>Status</span>
        </div>

        {filtered.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.04 }}
            style={{
              display: 'grid',
              gridTemplateColumns: '80px 50px 60px 1fr 100px 80px 70px',
              gap: 8,
              padding: '12px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              alignItems: 'center',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(240,237,232,0.4)' }}>{a.id}</span>
            <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 14, fontWeight: 500, color: '#1A56FF' }}>{a.person}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(240,237,232,0.3)' }}>{a.time}</span>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 400, color: '#F0EDE8' }}>{a.type}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(240,237,232,0.4)' }}>{a.area}</span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 8,
              padding: '3px 8px',
              borderRadius: 3,
              background: a.severity === 'CRITICAL' ? 'rgba(255,45,85,0.12)' : a.severity === 'HIGH' ? 'rgba(255,107,26,0.12)' : 'rgba(255,184,0,0.1)',
              color: a.severity === 'CRITICAL' ? '#FF2D55' : a.severity === 'HIGH' ? '#FF6B1A' : '#FFB800',
              textAlign: 'center',
            }}>{a.severity}</span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 8,
              padding: '3px 8px',
              borderRadius: 3,
              background: a.resolved ? 'rgba(0,196,140,0.1)' : 'rgba(255,45,85,0.1)',
              color: a.resolved ? '#00C48C' : '#FF2D55',
              textAlign: 'center',
            }}>
              {a.resolved ? 'RESOLVED' : 'OPEN'}
            </span>
          </motion.div>
        ))}
      </div>

      <style>{`@keyframes vPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }`}</style>
    </div>
  )
}

// ══════════════════════════════════════════════
//  WORKERS TAB
// ══════════════════════════════════════════════
export function WorkersTab({ detections }) {
  const persons = detections?.persons || []
  const [sort, setSort] = useState('risk')

  const sorted = [...persons].sort((a, b) => {
    if (sort === 'risk') return b.risk_score - a.risk_score
    if (sort === 'id') return a.id.localeCompare(b.id)
    if (sort === 'zone') return a.area.localeCompare(b.area)
    return 0
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(240,237,232,0.3)', letterSpacing: '0.1em' }}>SORT BY</span>
        {['risk', 'id', 'zone'].map(s => (
          <button
            key={s}
            onClick={() => setSort(s)}
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '6px 14px',
              background: sort === s ? 'rgba(255,107,26,0.12)' : 'transparent',
              border: `1px solid ${sort === s ? 'rgba(255,107,26,0.3)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 4,
              color: sort === s ? '#FF6B1A' : 'rgba(240,237,232,0.4)',
              cursor: 'pointer',
            }}
          >
            {s}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(240,237,232,0.25)' }}>
          {persons.length} workers · {persons.filter(p => p.violations.length > 0).length} violations
        </span>
      </div>

      {/* Worker cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {sorted.map((p, i) => {
          const isViolation = p.violations.length > 0
          const riskColor = p.risk_score >= 7 ? '#FF2D55' : p.risk_score >= 4 ? '#FFB800' : '#00C48C'
          const zoneColor = { 'Zone A': '#1A56FF', 'Zone B': '#FFB800', 'Hazard Zone': '#FF2D55', 'Eating Area': '#00C48C' }[p.area] || '#888'

          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${isViolation ? 'rgba(255,45,85,0.2)' : 'rgba(255,255,255,0.07)'}`,
                borderTop: `2px solid ${riskColor}`,
                borderRadius: 4,
                padding: 18,
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, letterSpacing: '0.04em', color: '#F0EDE8', lineHeight: 1 }}>{p.id}</div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4,
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
                    padding: '2px 8px', borderRadius: 3,
                    background: `${zoneColor}15`,
                    border: `1px solid ${zoneColor}40`,
                    color: zoneColor,
                  }}>
                    {p.area}
                  </div>
                </div>
                {/* Risk gauge */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: '0.02em', color: riskColor, lineHeight: 1 }}>
                    {p.risk_score}
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(240,237,232,0.3)' }}>/10</span>
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: 'rgba(240,237,232,0.25)', marginTop: 2 }}>RISK</div>
                </div>
              </div>

              {/* Risk bar */}
              <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 14, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${p.risk_score * 10}%` }}
                  transition={{ duration: 1, delay: i * 0.06 + 0.3 }}
                  style={{ height: '100%', background: riskColor, borderRadius: 2 }}
                />
              </div>

              {/* PPE status */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
                {[
                  { key: 'helmet', label: '⛑ Helmet' },
                  { key: 'vest', label: '🦺 Vest' },
                  { key: 'gloves', label: '🧤 Gloves' },
                ].map(item => (
                  <div key={item.key} style={{
                    padding: '6px 4px',
                    background: p.ppe_status?.[item.key] ? 'rgba(0,196,140,0.08)' : 'rgba(255,45,85,0.08)',
                    border: `1px solid ${p.ppe_status?.[item.key] ? 'rgba(0,196,140,0.2)' : 'rgba(255,45,85,0.2)'}`,
                    borderRadius: 3,
                    textAlign: 'center',
                  }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: p.ppe_status?.[item.key] ? '#00C48C' : '#FF2D55' }}>
                      {p.ppe_status?.[item.key] ? '✓' : '✗'}
                    </div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, color: 'rgba(240,237,232,0.35)', marginTop: 1 }}>
                      {item.label.split(' ')[1]}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: 'rgba(240,237,232,0.2)' }}>
                  ({p.x}, {p.y})
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: 'rgba(240,237,232,0.2)' }}>
                  {(p.confidence * 100).toFixed(1)}% conf
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════
//  ANALYTICS TAB
// ══════════════════════════════════════════════
export function AnalyticsTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.3em', color: '#FF6B1A', marginBottom: 8 }}>ANALYTICS & TRENDS</div>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 52, letterSpacing: '0.04em', color: '#F0EDE8', lineHeight: 1 }}>
          FULL YEAR REPORT
        </h2>
      </div>

      {/* Main charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Compliance + violations combined */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 4, padding: 24 }}>
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,237,232,0.5)', marginBottom: 20 }}>
            Compliance vs Violations
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={COMPLIANCE_TREND} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fill: 'rgba(240,237,232,0.3)' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fill: 'rgba(240,237,232,0.3)' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fill: 'rgba(240,237,232,0.3)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area yAxisId="left" type="monotone" dataKey="rate" name="rate" stroke="#1A56FF" strokeWidth={2} fill="rgba(26,86,255,0.08)" dot={false} />
              <Bar yAxisId="right" dataKey="violations" name="violations" fill="#FF2D55" fillOpacity={0.6} radius={[2, 2, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Worker count trend */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 4, padding: 24 }}>
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,237,232,0.5)', marginBottom: 20 }}>
            Monthly Worker Count
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={COMPLIANCE_TREND} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fill: 'rgba(240,237,232,0.3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fill: 'rgba(240,237,232,0.3)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="workers" name="workers" stroke="#FF6B1A" strokeWidth={2} dot={{ fill: '#FF6B1A', r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Avg Compliance', value: '90.3%', note: 'Full year 2025', color: '#1A56FF' },
          { label: 'Total Violations', value: '257', note: '-18% vs 2024', color: '#FF2D55' },
          { label: 'Peak Workers', value: '53', note: 'December 2025', color: '#FF6B1A' },
          { label: 'Best Month', value: 'Dec', note: '98% compliance', color: '#00C48C' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 + 0.3 }}
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderTop: `2px solid ${s.color}`,
              padding: '20px',
              borderRadius: 4,
            }}
          >
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, letterSpacing: '0.02em', color: '#F0EDE8', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,237,232,0.4)', marginTop: 6 }}>{s.label}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: s.color, marginTop: 6 }}>{s.note}</div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}