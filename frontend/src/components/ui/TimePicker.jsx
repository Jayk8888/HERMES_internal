import { useState, useEffect, useRef } from 'react'

const RADIUS = 80
const CENTER = 100

function polarToXY(angle, r) {
  const rad = (angle - 90) * (Math.PI / 180)
  return {
    x: CENTER + r * Math.cos(rad),
    y: CENTER + r * Math.sin(rad)
  }
}

function xyToAngle(x, y) {
  const dx = x - CENTER
  const dy = y - CENTER
  let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90
  if (angle < 0) angle += 360
  return angle
}

function ClockFace({ mode, value, onChange }) {
  const svgRef = useRef(null)
  const isDragging = useRef(false)

  const labels = mode === 'hour'
    ? Array.from({ length: 12 }, (_, i) => i + 1)
    : Array.from({ length: 12 }, (_, i) => i * 5)

  function angleFromValue(val) {
    if (mode === 'hour') return ((val % 12) / 12) * 360
    return (val / 60) * 360
  }

  function valueFromAngle(angle) {
    if (mode === 'hour') {
      let h = Math.round(angle / 30) % 12
      if (h === 0) h = 12
      return h
    }
    return Math.round(angle / 6) % 60
  }

  function getXY(e) {
    const svg = svgRef.current
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: ((clientX - rect.left) / rect.width) * 200,
      y: ((clientY - rect.top) / rect.height) * 200
    }
  }

  function handlePointer(e) {
    const pos = getXY(e)
    if (!pos) return
    onChange(valueFromAngle(xyToAngle(pos.x, pos.y)))
  }

  const handAngle = angleFromValue(value)
  const handPos = polarToXY(handAngle, RADIUS * 0.75)

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 200 200"
      style={{ width: 220, height: 220, cursor: 'grab', userSelect: 'none' }}
      onMouseDown={e => { isDragging.current = true; handlePointer(e) }}
      onMouseMove={e => { if (isDragging.current) handlePointer(e) }}
      onMouseUp={() => { isDragging.current = false }}
      onMouseLeave={() => { isDragging.current = false }}
      onTouchStart={e => { isDragging.current = true; handlePointer(e) }}
      onTouchMove={e => { if (isDragging.current) handlePointer(e) }}
      onTouchEnd={() => { isDragging.current = false }}
    >
      <circle cx={CENTER} cy={CENTER} r={CENTER - 2} fill="#f0f6fa" stroke="#d4e8f0" strokeWidth="1.5" />

      {labels.map((label, i) => {
        const angle = mode === 'hour' ? ((i + 1) / 12) * 360 : (i / 12) * 360
        const pos = polarToXY(angle, RADIUS * 0.82)
        const isActive = mode === 'hour'
          ? label === (value % 12 === 0 ? 12 : value % 12)
          : label === value
        return (
          <g key={label}>
            <circle cx={pos.x} cy={pos.y} r={14} fill={isActive ? '#0e7fa8' : 'transparent'} />
            <text
              x={pos.x} y={pos.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={12}
              fontFamily="DM Sans, sans-serif"
              fill={isActive ? 'white' : '#0b2d3e'}
              fontWeight={isActive ? '600' : '400'}
            >
              {mode === 'minute' ? String(label).padStart(2, '0') : label}
            </text>
          </g>
        )
      })}

      <line
        x1={CENTER} y1={CENTER}
        x2={handPos.x} y2={handPos.y}
        stroke="#0e7fa8" strokeWidth="2.5" strokeLinecap="round"
      />
      <circle cx={CENTER} cy={CENTER} r={4} fill="#0e7fa8" />
      <circle cx={handPos.x} cy={handPos.y} r={6} fill="#0e7fa8" />
    </svg>
  )
}

export default function TimePicker({ value, onChange, label }) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('hour')
  const [hour, setHour] = useState(9)
  const [minute, setMinute] = useState(0)
  const [ampm, setAmpm] = useState('AM')
  const ref = useRef(null)

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':').map(Number)
      setAmpm(h >= 12 ? 'PM' : 'AM')
      setHour(h % 12 === 0 ? 12 : h % 12)
      setMinute(m)
    }
  }, [value])

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function commit(h, m, ap) {
    let h24 = h % 12
    if (ap === 'PM') h24 += 12
    onChange(`${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }

  function handleHourChange(h) {
    setHour(h)
    commit(h, minute, ampm)
  }

  function handleMinuteChange(m) {
    setMinute(m)
    commit(hour, m, ampm)
  }

  function handleAmpm(ap) {
    setAmpm(ap)
    commit(hour, minute, ap)
  }

  const display = value
    ? (() => {
        const [h, m] = value.split(':').map(Number)
        const ap = h >= 12 ? 'PM' : 'AM'
        const h12 = h % 12 === 0 ? 12 : h % 12
        return `${h12}:${String(m).padStart(2, '0')} ${ap}`
      })()
    : ''

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {label && (
        <label style={{ fontSize: 13, color: 'gray', display: 'block', marginBottom: 4 }}>
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setMode('hour') }}
        style={{
          width: '100%',
          padding: '0.6rem 0.75rem',
          borderRadius: 8,
          border: '1px solid #e5e7eb',
          fontSize: 14,
          background: 'white',
          textAlign: 'left',
          cursor: 'pointer',
          color: display ? '#0b2d3e' : '#9ca3af'
        }}
      >
        {display || 'Select time'}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          zIndex: 100,
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: '1rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          minWidth: 260
        }}>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.25rem', marginBottom: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setMode('hour')}
              style={{
                padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 22, fontWeight: 600,
                background: mode === 'hour' ? '#0e7fa8' : '#f0f6fa',
                color: mode === 'hour' ? 'white' : '#3d6272'
              }}
            >
              {String(hour).padStart(2, '0')}
            </button>
            <span style={{ fontSize: 22, fontWeight: 600, color: '#0b2d3e' }}>:</span>
            <button
              type="button"
              onClick={() => setMode('minute')}
              style={{
                padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 22, fontWeight: 600,
                background: mode === 'minute' ? '#0e7fa8' : '#f0f6fa',
                color: mode === 'minute' ? 'white' : '#3d6272'
              }}
            >
              {String(minute).padStart(2, '0')}
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', borderRadius: 6, overflow: 'hidden', border: '1px solid #e5e7eb', marginLeft: 6 }}>
              {['AM', 'PM'].map(ap => (
                <button
                  key={ap}
                  type="button"
                  onClick={() => handleAmpm(ap)}
                  style={{
                    padding: '4px 10px', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500,
                    background: ampm === ap ? '#0e7fa8' : 'white',
                    color: ampm === ap ? 'white' : '#3d6272'
                  }}
                >
                  {ap}
                </button>
              ))}
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: 'gray', marginBottom: '0.5rem' }}>
            {mode === 'hour' ? 'Drag or tap to select hour' : 'Drag or tap to select minute'}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <ClockFace
              mode={mode}
              value={mode === 'hour' ? hour : minute}
              onChange={mode === 'hour' ? handleHourChange : handleMinuteChange}
            />
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            style={{
              width: '100%', marginTop: '0.75rem', padding: '0.6rem',
              background: '#0e7fa8', color: 'white', border: 'none',
              borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500
            }}
          >
            Done
          </button>
        </div>
      )}
    </div>
  )
}
