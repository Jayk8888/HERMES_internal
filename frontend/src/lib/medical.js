export const VITAL_FIELDS = [
  { key: 'blood_pressure', label: 'Blood Pressure', placeholder: 'e.g. 120/80 mmHg' },
  { key: 'heart_rate', label: 'Heart Rate', placeholder: 'e.g. 72 bpm' },
  { key: 'temperature', label: 'Temperature', placeholder: 'e.g. 98.6 F' },
  { key: 'oxygen_saturation', label: 'Oxygen Saturation', placeholder: 'e.g. 98%' },
  { key: 'weight', label: 'Weight', placeholder: 'e.g. 70 kg' },
  { key: 'height', label: 'Height', placeholder: 'e.g. 175 cm' },
  { key: 'respiratory_rate', label: 'Respiratory Rate', placeholder: 'e.g. 16 breaths/min' },
]

export const VITAL_LABELS = Object.fromEntries(
  VITAL_FIELDS.map(field => [field.key, field.label])
)

export function summariseVitals(vitals, limit = 3) {
  if (!vitals || typeof vitals !== 'object') return 'No vitals recorded'

  const entries = Object.entries(vitals).slice(0, limit)
  if (!entries.length) return 'No vitals recorded'

  return entries
    .map(([key, value]) => `${VITAL_LABELS[key] ?? key}: ${value}`)
    .join(' | ')
}

