export default function Readout({ data }) {
  const { r = 0, v = 0, omega = 0, T = 0, ac = 0, Fc = 0 } = data || {}

  const items = [
    { label: 'Radio', value: (r || 0).toFixed(2), unit: 'm' },
    { label: 'Velocidad', value: (v || 0).toFixed(2), unit: 'm/s' },
    { label: 'ω (omega)', value: (omega || 0).toFixed(2), unit: 'rad/s' },
    { label: 'Período T', value: (T || 0).toFixed(2), unit: 's' },
    { label: 'Acel. centrípeta', value: (ac || 0).toFixed(2), unit: 'm/s²' },
    { label: 'Fuerza Fc', value: (Fc || 0).toFixed(2), unit: 'N' },
  ]

  return (
    <div className="readout">
      {items.map((item) => (
        <div className="readout-item" key={item.label}>
          <span className="readout-label">{item.label}</span>
          <span className="readout-value">{item.value}</span>
          <span className="readout-unit">{item.unit}</span>
        </div>
      ))}
    </div>
  )
}
