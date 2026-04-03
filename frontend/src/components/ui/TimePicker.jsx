import { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/cn'
import { inputClassName } from './TextInput'

const RADIUS = 80
const CENTER = 100

function polarToXY(angle, radius) {
  const radians = (angle - 90) * (Math.PI / 180)

  return {
    x: CENTER + radius * Math.cos(radians),
    y: CENTER + radius * Math.sin(radians),
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
    ? Array.from({ length: 12 }, (_, index) => index + 1)
    : Array.from({ length: 12 }, (_, index) => index * 5)

  function angleFromValue(rawValue) {
    if (mode === 'hour') return ((rawValue % 12) / 12) * 360
    return (rawValue / 60) * 360
  }

  function valueFromAngle(angle) {
    if (mode === 'hour') {
      let hour = Math.round(angle / 30) % 12
      if (hour === 0) hour = 12
      return hour
    }

    return Math.round(angle / 6) % 60
  }

  function getPoint(event) {
    const svg = svgRef.current
    if (!svg) return null

    const rect = svg.getBoundingClientRect()
    const clientX = event.touches ? event.touches[0].clientX : event.clientX
    const clientY = event.touches ? event.touches[0].clientY : event.clientY

    return {
      x: ((clientX - rect.left) / rect.width) * 200,
      y: ((clientY - rect.top) / rect.height) * 200,
    }
  }

  function handlePointer(event) {
    const point = getPoint(event)
    if (!point) return
    onChange(valueFromAngle(xyToAngle(point.x, point.y)))
  }

  const handAngle = angleFromValue(value)
  const handPosition = polarToXY(handAngle, RADIUS * 0.75)

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 200 200"
      style={{ width: 220, height: 220, cursor: 'grab', userSelect: 'none' }}
      onMouseDown={event => { isDragging.current = true; handlePointer(event) }}
      onMouseMove={event => { if (isDragging.current) handlePointer(event) }}
      onMouseUp={() => { isDragging.current = false }}
      onMouseLeave={() => { isDragging.current = false }}
      onTouchStart={event => { isDragging.current = true; handlePointer(event) }}
      onTouchMove={event => { if (isDragging.current) handlePointer(event) }}
      onTouchEnd={() => { isDragging.current = false }}
    >
      <circle cx={CENTER} cy={CENTER} r={CENTER - 2} fill="#eef8f8" stroke="#d8eeee" strokeWidth="1.5" />

      {labels.map((label, index) => {
        const angle = mode === 'hour' ? ((index + 1) / 12) * 360 : (index / 12) * 360
        const point = polarToXY(angle, RADIUS * 0.82)
        const isActive = mode === 'hour'
          ? label === (value % 12 === 0 ? 12 : value % 12)
          : label === value

        return (
          <g key={label}>
            <circle cx={point.x} cy={point.y} r={14} fill={isActive ? '#206f6d' : 'transparent'} />
            <text
              x={point.x}
              y={point.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={12}
              fontFamily="Source Sans 3, sans-serif"
              fill={isActive ? 'white' : '#0e2323'}
              fontWeight={isActive ? '700' : '500'}
            >
              {mode === 'minute' ? String(label).padStart(2, '0') : label}
            </text>
          </g>
        )
      })}

      <line
        x1={CENTER}
        y1={CENTER}
        x2={handPosition.x}
        y2={handPosition.y}
        stroke="#206f6d"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx={CENTER} cy={CENTER} r={4} fill="#206f6d" />
      <circle cx={handPosition.x} cy={handPosition.y} r={6} fill="#206f6d" />
    </svg>
  )
}

function parseTimeValue(value) {
  if (!value) {
    return { hour: 9, minute: 0, ampm: 'AM' }
  }

  const [hours, minutes] = value.split(':').map(Number)

  return {
    hour: hours % 12 === 0 ? 12 : hours % 12,
    minute: minutes,
    ampm: hours >= 12 ? 'PM' : 'AM',
  }
}

export default function TimePicker({ value, onChange, label }) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('hour')
  const [hour, setHour] = useState(9)
  const [minute, setMinute] = useState(0)
  const [ampm, setAmpm] = useState('AM')
  const ref = useRef(null)

  useEffect(() => {
    function handleDocumentClick(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleDocumentClick)
    return () => document.removeEventListener('mousedown', handleDocumentClick)
  }, [])

  function syncFromValue() {
    const parsed = parseTimeValue(value)
    setHour(parsed.hour)
    setMinute(parsed.minute)
    setAmpm(parsed.ampm)
  }

  function commit(nextHour, nextMinute, nextAmpm) {
    let hour24 = nextHour % 12
    if (nextAmpm === 'PM') hour24 += 12
    onChange(`${String(hour24).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}`)
  }

  function handleHourChange(nextHour) {
    setHour(nextHour)
    commit(nextHour, minute, ampm)
  }

  function handleMinuteChange(nextMinute) {
    setMinute(nextMinute)
    commit(hour, nextMinute, ampm)
  }

  function handleAmpm(nextAmpm) {
    setAmpm(nextAmpm)
    commit(hour, minute, nextAmpm)
  }

  const display = value
    ? (() => {
        const [hours, minutes] = value.split(':').map(Number)
        const suffix = hours >= 12 ? 'PM' : 'AM'
        const hour12 = hours % 12 === 0 ? 12 : hours % 12
        return `${hour12}:${String(minutes).padStart(2, '0')} ${suffix}`
      })()
    : ''

  return (
    <div ref={ref} className="relative">
      {label ? <p className="mb-1.5 text-sm font-medium text-slate-700">{label}</p> : null}
      <button
        type="button"
        onClick={() => {
          syncFromValue()
          setOpen(current => !current)
          setMode('hour')
        }}
        className={cn(inputClassName, 'justify-between text-left', display ? 'text-slate-900' : 'text-slate-400')}
      >
        {display || 'Select time'}
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-30 min-w-[280px] rounded-3xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-200/80">
          <div className="mb-3 flex items-center justify-center gap-1">
            {['hour', 'minute'].map(currentMode => {
              const isActive = mode === currentMode
              const currentValue = currentMode === 'hour'
                ? String(hour).padStart(2, '0')
                : String(minute).padStart(2, '0')

              return (
                <button
                  key={currentMode}
                  type="button"
                  onClick={() => setMode(currentMode)}
                  className={cn(
                    'rounded-2xl px-4 py-2 text-2xl font-semibold tracking-tight transition-colors',
                    isActive ? 'bg-primary-600 text-white' : 'bg-primary-50 text-primary-800'
                  )}
                >
                  {currentValue}
                </button>
              )
            })}

            <span className="px-1 text-2xl font-semibold text-slate-900">:</span>

            <div className="ml-2 overflow-hidden rounded-2xl border border-slate-200">
              {['AM', 'PM'].map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleAmpm(option)}
                  className={cn(
                    'block w-full px-3 py-1.5 text-xs font-semibold transition-colors',
                    ampm === option ? 'bg-primary-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <p className="mb-3 text-center text-xs text-slate-400">
            {mode === 'hour' ? 'Drag or tap to select hour' : 'Drag or tap to select minute'}
          </p>

          <div className="flex justify-center">
            <ClockFace
              mode={mode}
              value={mode === 'hour' ? hour : minute}
              onChange={mode === 'hour' ? handleHourChange : handleMinuteChange}
            />
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-3 w-full rounded-2xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
          >
            Done
          </button>
        </div>
      ) : null}
    </div>
  )
}
