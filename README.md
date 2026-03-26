# UCM Simulator

Interactive uniform circular motion simulator for university physics.

**Live:** [mcu.paulcontre.com](https://mcu.paulcontre.com) <!-- update with real URL -->

## What it does

Simulates a particle in uniform circular motion with real-time vector visualization:

- **r** (green) — radius / position vector
- **v** (blue) — tangential velocity
- **aᶜ** (red) — centripetal acceleration

Adjust radius, speed, and mass via sliders. Release the constraint to watch the particle fly off tangentially (Newton's 1st law).

## Physics

- RK4 integrator with centripetal constraint applied each tick
- Fixed 1/60 s physics step, decoupled from render
- Derived quantities: ω = v/r, T = 2π/ω, aᶜ = v²/r, Fᶜ = m·aᶜ

## Stack

React · Canvas 2D · Chart.js · Vite

## Run locally

```bash
npm install
npm run dev
```

---

Created by [paulcontreras](https://github.com/pol-cova) · [@paulcontr_](https://instagram.com/paulcontr_)
