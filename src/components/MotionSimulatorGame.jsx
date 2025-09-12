import React, { useEffect, useRef, useState } from "react";

function createSimulator({
  massKg = 10,
  frictionCoeff = 0.08,
  airDragCoeff = 0.02,
  gravity = 9.81,
  finishLineX = 50,
  crashBarrierX = 55,
  successSpeedThreshold = 0.5,
  stopSpeedEpsilon = 0.02,
  maxTimeSec = 60
} = {}) {
  const state = {
    time: 0,
    x: 0,
    v: 0,
    a: 0,
    appliedForce: 0,
    status: "running",
    message: null
  };

  const setForce = (f) => {
    if (state.status !== "running") return;
    state.appliedForce = Number.isFinite(f) ? f : 0;
  };

  const getTelemetry = () => ({
    time: state.time,
    x: state.x,
    v: state.v,
    a: state.a,
    appliedForce: state.appliedForce,
    finishLineX,
    status: state.status,
    message: state.message
  });

  const step = (dt) => {
    if (state.status !== "running") return getTelemetry();

    // forces
    const forceUser = state.appliedForce;
    const normal = massKg * gravity;
    const coulombMag = frictionCoeff * normal;

    let forceRolling = 0;
    if (state.v > stopSpeedEpsilon) forceRolling = -coulombMag;
    else if (state.v < -stopSpeedEpsilon) forceRolling = coulombMag;
    else {
      const desiredDir = Math.sign(forceUser);
      forceRolling = -desiredDir * Math.min(Math.abs(forceUser), coulombMag);
    }

    const forceAir = -airDragCoeff * state.v * Math.abs(state.v);
    const net = forceUser + forceRolling + forceAir;

    state.a = net / massKg;
    state.v += state.a * dt;
    state.x += state.v * dt;
    state.time += dt;

    // end states
    if (state.x >= finishLineX && Math.abs(state.v) <= successSpeedThreshold) {
      state.status = "success";
      state.message = "Perfect Run!";
    } else if (state.x >= crashBarrierX || (state.x >= finishLineX && Math.abs(state.v) > successSpeedThreshold)) {
      state.status = "crashed";
      state.message = "Crashed!";
    } else {
      const insufficient = Math.abs(state.appliedForce) < frictionCoeff * massKg * gravity * 0.99;
      if (insufficient && Math.abs(state.v) <= stopSpeedEpsilon && state.x < finishLineX - 0.5) {
        state.status = "stopped";
        state.message = "Too Slow!";
      }
    }
    if (state.time > maxTimeSec && state.status === "running") {
      state.status = "stopped";
      state.message = "Timed Out";
    }
    return getTelemetry();
  };

  const reset = () => {
    state.time = 0; state.x = 0; state.v = 0; state.a = 0; state.appliedForce = 0;
    state.status = "running"; state.message = null;
  };

  return { setForce, step, reset, getTelemetry };
}

export default function MotionSimulatorGame({
  width = 720,
  height = 220,
  metersToPx = 12,
  massKg = 12
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const simRef = useRef(null);
  const [force, setForce] = useState(25);
  const [telemetry, setTelemetry] = useState({
    time: 0, x: 0, v: 0, a: 0, status: "running", message: ""
  });

  // simple particles for confetti/crash
  const particlesRef = useRef([]);

  useEffect(() => {
    const sim = createSimulator({
      massKg,
      finishLineX: 52,
      crashBarrierX: 56,
      airDragCoeff: 0.03
    });
    simRef.current = sim;
    sim.reset();
    sim.setForce(force);
    start();
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // init once

  useEffect(() => {
    simRef.current?.setForce(force);
  }, [force]);

  const start = () => {
    let last = performance.now();
    const loop = (t) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      const state = simRef.current.step(dt);
      setTelemetry(state);
      draw(state);
      if (state.status !== "running" && particlesRef.current.length === 0) {
        spawnParticles(state);
      }
      updateParticles(dt);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  };

  const stop = () => {
    cancelAnimationFrame(rafRef.current);
  };

  const reset = () => {
    particlesRef.current = [];
    simRef.current.reset();
    simRef.current.setForce(force);
  };

  const spawnParticles = (state) => {
    const cx = 60 + state.x * metersToPx;
    const cy = height - 60;
    const color = state.status === "success" ? ["#ffde59","#00ffe7","#ff6ec7","#9a4dff"] : ["#999","#666","#bbb"];
    const n = state.status === "success" ? 60 : 30;
    for (let i = 0; i < n; i++) {
      particlesRef.current.push({
        x: cx, y: cy - 20, vx: (Math.random()-0.5)*200, vy: -Math.random()*220,
        r: state.status === "success" ? 3 : 2,
        g: 900, // gravity-like
        life: 1.2,
        color: color[i % color.length]
      });
    }
  };

  const updateParticles = (dt) => {
    particlesRef.current.forEach(p => {
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);
  };

  const draw = (state) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0,0,width,height);

    // background
    const grad = ctx.createLinearGradient(0,0,0,height);
    grad.addColorStop(0,"#1e1b4b");
    grad.addColorStop(1,"#0b1026");
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,width,height);

    // track
    const groundY = height - 40;
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(width, groundY);
    ctx.stroke();

    // start/finish
    const startX = 60;
    const finishX = startX + state.finishLineX * metersToPx;
    const barrierX = startX + (state.finishLineX + 4) * metersToPx;

    ctx.fillStyle = "#777";
    ctx.fillRect(startX-2, groundY-60, 4, 60);

    ctx.fillStyle = "#ffde59";
    ctx.fillRect(finishX-3, groundY-70, 6, 70);

    ctx.fillStyle = "#ff6ec7";
    ctx.fillRect(barrierX-2, groundY-60, 4, 60);

    // cart
    const cartX = startX + state.x * metersToPx;
    const cartY = groundY - 20;
    // speed lines when accelerating
    const accelMag = Math.min(1, Math.abs(state.a) / 5);
    if (accelMag > 0.1) {
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 6 * accelMag; i++) {
        const lx = cartX - 10 - Math.random()*30;
        const ly = cartY - 12 + Math.random()*24;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx - 10 - Math.random()*10, ly);
        ctx.stroke();
      }
    }

    // body
    ctx.fillStyle = "#00ffe7";
    ctx.fillRect(cartX-18, cartY-16, 48, 16);

    // wheels
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(cartX, groundY-4, 6, 0, Math.PI*2);
    ctx.arc(cartX+22, groundY-4, 6, 0, Math.PI*2);
    ctx.fill();

    // particles
    particlesRef.current.forEach(p => {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // HUD
    ctx.fillStyle = "#fff";
    ctx.font = "12px Arial";
    ctx.fillText(`Force: ${state.appliedForce.toFixed(1)} N`, 16, 20);
    ctx.fillText(`x: ${state.x.toFixed(2)} m`, 16, 36);
    ctx.fillText(`v: ${state.v.toFixed(2)} m/s`, 16, 52);
    ctx.fillText(`a: ${state.a.toFixed(2)} m/s²`, 16, 68);

    // status
    if (state.status !== "running") {
      ctx.fillStyle = state.status === "success" ? "#00ffe7" : (state.status === "crashed" ? "#ff6ec7" : "#ffde59");
      ctx.font = "bold 20px Arial";
      ctx.fillText(state.message || "", 16, 92);
    }
  };

  return (
    <div
      style={{
        background: "rgba(255 255 255 / 0.08)",
        border: "1.5px solid #ffde59",
        borderRadius: "12px",
        padding: "12px",
        boxShadow: "0 0 12px #ffde59",
        color: "white"
      }}
    >
      <h3 style={{ color: "#ffde59", margin: 0, marginBottom: 8 }}>Motion Simulator</h3>
      <canvas ref={canvasRef} width={width} height={height} style={{ width: "100%", maxWidth: width, borderRadius: 8 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>Force (N)</span>
          <input
            type="range"
            min="-80"
            max="120"
            step="1"
            value={force}
            onChange={(e) => setForce(Number(e.target.value))}
            style={{ width: 240 }}
          />
          <input
            type="number"
            value={force}
            onChange={(e) => setForce(Number(e.target.value))}
            style={{ width: 80, padding: 6, borderRadius: 8, border: "1px solid #555", background: "#111", color: "#fff" }}
          />
        </label>
        <button
          onClick={reset}
          style={{ padding: "8px 14px", borderRadius: 10, background: "linear-gradient(135deg,#ff6ec7,#ffde59)", border: "none", color: "#222", fontWeight: "bold", cursor: "pointer" }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}