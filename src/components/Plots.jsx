import { useEffect } from 'react'
import { Chart, LineController, LineElement, PointElement, LinearScale, TimeScale, Filler, Legend, Tooltip, CategoryScale } from 'chart.js'

Chart.register(LineController, LineElement, PointElement, LinearScale, TimeScale, Filler, Legend, Tooltip, CategoryScale)

const LIGHT_THEME = {
  gridColor: '#dde1f0',
  tickColor: '#5a6280',
  borderColor: '#dde1f0',
}

function makeChartOptions(yLabel) {
  return {
    animation: false,
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        labels: {
          color: '#5a6280',
          boxWidth: 12,
          font: { family: 'Inter, sans-serif', size: 11 },
        },
      },
      tooltip: {
        backgroundColor: '#ffffff',
        borderColor: '#dde1f0',
        borderWidth: 1,
        titleColor: '#5a6280',
        bodyColor: '#1a1c2e',
        titleFont: { family: 'Inter, sans-serif', size: 11 },
        bodyFont: { family: 'JetBrains Mono, monospace', size: 11 },
        boxShadow: '0 4px 6px rgba(26,28,46,0.08)',
      },
    },
    scales: {
      x: {
        ticks: { color: LIGHT_THEME.tickColor, font: { family: 'Inter, sans-serif', size: 10 }, maxTicksLimit: 6 },
        grid: { color: LIGHT_THEME.gridColor },
        border: { color: LIGHT_THEME.borderColor },
        title: { display: true, text: 't (s)', color: LIGHT_THEME.tickColor, font: { size: 10 } },
      },
      y: {
        ticks: { color: LIGHT_THEME.tickColor, font: { family: 'JetBrains Mono, monospace', size: 10 }, maxTicksLimit: 5 },
        grid: { color: LIGHT_THEME.gridColor },
        border: { color: LIGHT_THEME.borderColor },
        title: { display: true, text: yLabel, color: LIGHT_THEME.tickColor, font: { size: 10 } },
      },
    },
  }
}

export default function Plots({ open, onToggle, plotsRef }) {
  useEffect(() => {
    if (!open) {
      // Destroy charts when closing
      if (plotsRef.current) {
        plotsRef.current.xyChart?.destroy()
        plotsRef.current.vChart?.destroy()
        plotsRef.current = null
      }
      return
    }

    // Small delay to allow DOM to render
    const timer = setTimeout(() => {
      const xyCanvas = document.getElementById('chart-xy')
      const vCanvas = document.getElementById('chart-v')
      if (!xyCanvas || !vCanvas) return

      // Destroy any existing instances first
      if (plotsRef.current) {
        plotsRef.current.xyChart?.destroy()
        plotsRef.current.vChart?.destroy()
      }

      const xyChart = new Chart(xyCanvas, {
        type: 'line',
        data: {
          labels: [],
          datasets: [
            {
              label: 'x(t)',
              data: [],
              borderColor: '#2563eb',
              backgroundColor: 'rgba(37,99,235,0.08)',
              borderWidth: 1.5,
              pointRadius: 0,
              tension: 0.3,
              fill: false,
            },
            {
              label: 'y(t)',
              data: [],
              borderColor: '#16a34a',
              backgroundColor: 'rgba(22,163,74,0.08)',
              borderWidth: 1.5,
              pointRadius: 0,
              tension: 0.3,
              fill: false,
            },
          ],
        },
        options: makeChartOptions('posición (m)'),
      })

      const vChart = new Chart(vCanvas, {
        type: 'line',
        data: {
          labels: [],
          datasets: [
            {
              label: '|v|(t)',
              data: [],
              borderColor: '#d97706',
              backgroundColor: 'rgba(217,119,6,0.08)',
              borderWidth: 1.5,
              pointRadius: 0,
              tension: 0.3,
              fill: true,
            },
          ],
        },
        options: makeChartOptions('rapidez (m/s)'),
      })

      plotsRef.current = { xyChart, vChart }
    }, 50)

    return () => clearTimeout(timer)
  }, [open])

  return (
    <div className="plots-section">
      <button className="plots-toggle" onClick={onToggle}>
        <span>Gráficas</span>
        <span
          style={{
            display: 'inline-block',
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 0.2s',
          }}
        >
          ▼
        </span>
      </button>

      {open && (
        <div className="plots-body">
          <div>
            <div className="chart-title">Posición x(t) e y(t)</div>
            <div className="chart-wrap">
              <canvas id="chart-xy" />
            </div>
          </div>
          <div>
            <div className="chart-title">Rapidez |v|(t)</div>
            <div className="chart-wrap">
              <canvas id="chart-v" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
