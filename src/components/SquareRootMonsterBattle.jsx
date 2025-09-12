import React, { useEffect, useMemo, useRef, useState } from 'react';

// Square Root Monster Battle — pixel-styled, pinkish‑violet theme
// Students fight a monster by solving square root questions.
// - Correct answer deals damage to monster HP.
// - Levels: higher level -> harder questions (1) easy perfect squares 1..12, (2) 13..20, (3) approximation, (4) simple word problems.
// - Rewards: coins/xp to upgrade avatar (damage + coin bonus). Stored per student in localStorage.

const THEME = {
  bg: '#120515',
  cardBg: '#1e1230',
  accent: '#ec4899',
  text: '#fde2f4',
  barBg: '#3b1747',
  good: '#22c55e',
  warn: '#f59e0b',
  bad: '#ef4444'
};

function getStudentId() {
  try {
    const profile = JSON.parse(localStorage.getItem('gamify_profile') || '{}');
    return profile.id || 'local_demo';
  } catch { return 'local_demo'; }
}

function loadMBState() {
  const id = getStudentId();
  try { return JSON.parse(localStorage.getItem(`mb_state_${id}`) || '{}'); } catch { return {}; }
}
function saveMBState(state) {
  const id = getStudentId();
  try { localStorage.setItem(`mb_state_${id}`, JSON.stringify(state)); } catch {}
}

// Question generators
function randInt(a,b){ return a + Math.floor(Math.random()*(b-a+1)); }
function shuffle(arr){ return arr.sort(()=>Math.random()-0.5); }

function genQuestion(level){
  // Returns { prompt, answer, options?:[], type:'mc'|'input' }
  if (level === 1) {
    const b = randInt(1,12); const n = b*b;
    const answer = String(b);
    const opts = new Set([answer]);
    while (opts.size < 4) opts.add(String(randInt(1,12)));
    return { prompt: `What is √${n}?`, answer, options: shuffle(Array.from(opts)), type: 'mc' };
  }
  if (level === 2) {
    const b = randInt(13,20); const n = b*b;
    const answer = String(b);
    const opts = new Set([answer]);
    while (opts.size < 4) opts.add(String(randInt(10,22)));
    return { prompt: `Compute √${n}`, answer, options: shuffle(Array.from(opts)), type: 'mc' };
  }
  if (level === 3) {
    // Approximate non-perfect square to nearest integer
    const base = randInt(50, 400);
    const sqrti = Math.round(Math.sqrt(base));
    const answer = String(sqrti);
    const opts = new Set([answer]);
    while (opts.size < 4) opts.add(String(Math.max(1, sqrti + randInt(-3,3))));
    return { prompt: `Approximate √${base} to nearest integer`, answer, options: shuffle(Array.from(opts)), type: 'mc' };
  }
  // level 4: simple word problem
  const side = randInt(5, 25);
  const area = side*side;
  const variants = [
    { prompt: `A square field has area ${area} m². What is the side length?`, answer: String(side) },
    { prompt: `Square tile area is ${area} cm². What is its side?`, answer: String(side) }
  ];
  const q = variants[randInt(0, variants.length-1)];
  const opts = new Set([q.answer]);
  while (opts.size < 4) opts.add(String(Math.max(1, side + randInt(-3,3))));
  return { prompt: q.prompt, answer: q.answer, options: shuffle(Array.from(opts)), type: 'mc' };
}

export default function SquareRootMonsterBattle(){
  const [level, setLevel] = useState(1);
  const [monsterHp, setMonsterHp] = useState(30);
  const [monsterMax, setMonsterMax] = useState(30);
  const [playerHp, setPlayerHp] = useState(30);
  const [playerMax, setPlayerMax] = useState(30);
  const [gamePhase, setGamePhase] = useState('start'); // 'start' | 'playing' | 'won' | 'lost'
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem('srmb_muted') === '1'; } catch { return false; }
  });
  const mutedRef = useRef(muted);
  useEffect(() => { mutedRef.current = muted; try { localStorage.setItem('srmb_muted', muted ? '1' : '0'); } catch {} }, [muted]);
  // Removed coins/xp/upgrades for a simpler battle loop
  const [question, setQuestion] = useState(() => genQuestion(1));
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [battleOver, setBattleOver] = useState(false);
  const audioCtxRef = useRef(null);
  const animRef = useRef({ type: null, start: 0, screenShake: 0 }); // 'player' | 'monster' | null
  const effectsRef = useRef([]); // transient fx: projectiles, slashes, hit flashes, numbers
  const lastPromptsRef = useRef([]); // recent question prompts to avoid repeats
  const [transitioning, setTransitioning] = useState(false); // block input during KO/level transitions
  const hpDispRef = useRef({ m: 30, p: 30 }); // smoothed HP for bars
  // Build a small dynamic hint for the current question
  const getHint = (q) => {
    if (!q) return '';
    // Try to extract number after √ for quick nearest-squares hint
    const m = /√\s*(\d+)/.exec(q.prompt || '');
    if (m && m[1]) {
      const N = parseInt(m[1], 10);
      if (!isNaN(N)) {
        const k = Math.floor(Math.sqrt(N));
        return `Tip: ${k}²=${k*k} and ${(k+1)}²=${(k+1)*(k+1)}. So √${N} is between ${k} and ${k+1}.`;
      }
    }
    // Word problem hint: recall area of square = side²
    if ((q.prompt||'').toLowerCase().includes('area')) return 'Remember: For a square, Area = side², so side = √Area.';
    // Approximation hint
    if ((q.prompt||'').toLowerCase().includes('approximate')) return 'Find the two nearest perfect squares around the number and pick the nearest root.';
    return 'Recall: A perfect square has an integer square root. Otherwise, estimate between nearest squares.';
  };

  // Load saved state
  // No persistent economy state
  useEffect(()=>{},[]);

  const damagePerHit = useMemo(()=> 12, []);
  const monsterDamagePerHit = useMemo(()=> 6 + level*2, [level]);

  // Initialize WebAudio context lazily (on first user interaction)
  const ensureAudio = () => {
    if (!audioCtxRef.current) {
      try { audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
    }
  };
  // Lightweight background music
  const musicRef = useRef({ playing: false, id: null, gain: null, osc: null });
  const startMusic = () => {
    if (mutedRef.current) return;
    ensureAudio(); const ctx = audioCtxRef.current; if (!ctx) return;
    if (musicRef.current.playing) return;
    try { if (ctx.state === 'suspended') ctx.resume(); } catch {}
    const gain = ctx.createGain(); gain.gain.value = 0.02; gain.connect(ctx.destination);
    const osc = ctx.createOscillator(); osc.type = 'triangle'; osc.connect(gain);
    // Calm pentatonic-ish loop
    const notes = [261.63, 293.66, 329.63, 392.0, 329.63, 293.66];
    let i = 0;
    const step = () => { const t = ctx.currentTime; try { osc.frequency.setValueAtTime(notes[i%notes.length], t); } catch{} i++; };
    step(); const id = setInterval(step, 360);
    osc.start();
    musicRef.current = { playing: true, id, gain, osc };
  };
  const stopMusic = () => {
    const { id, gain, osc } = musicRef.current || {};
    if (id) clearInterval(id);
    try { if (osc) osc.stop(); } catch {}
    try { if (osc) osc.disconnect(); } catch {}
    try { if (gain) gain.disconnect(); } catch {}
    musicRef.current = { playing: false, id: null, gain: null, osc: null };
  };

  const beep = (freq = 440, duration = 0.12, type = 'square', gain = 0.08) => {
    if (mutedRef.current) return;
    const ctx = audioCtxRef.current; if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, now);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(gain, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(g).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  };

  const playPlayerAttackSound = () => {
    ensureAudio();
    // Retro rising triad
    beep(380, 0.1, 'square', 0.06);
    setTimeout(()=> beep(520, 0.11, 'square', 0.06), 60);
    setTimeout(()=> beep(640, 0.12, 'square', 0.06), 120);
  };
  const playMonsterAttackSound = () => {
    ensureAudio();
    // Gritty bass fall
    beep(180, 0.14, 'sawtooth', 0.08);
    setTimeout(()=> beep(150, 0.12, 'sawtooth', 0.07), 70);
    setTimeout(()=> beep(120, 0.10, 'sawtooth', 0.06), 120);
  };
  const playMonsterHurtSound = (lvl) => {
    ensureAudio();
    if (lvl === 1) {
      beep(520, 0.09, 'triangle', 0.07);
      setTimeout(()=> beep(440, 0.08, 'triangle', 0.06), 70);
    } else if (lvl === 2) {
      beep(420, 0.08, 'square', 0.06);
      setTimeout(()=> beep(360, 0.08, 'square', 0.06), 60);
      setTimeout(()=> beep(300, 0.07, 'square', 0.05), 120);
    } else if (lvl === 3) {
      beep(600, 0.08, 'sawtooth', 0.06);
      setTimeout(()=> beep(500, 0.08, 'sawtooth', 0.05), 60);
    } else {
      beep(260, 0.12, 'square', 0.07);
      setTimeout(()=> beep(200, 0.10, 'square', 0.06), 90);
    }
  };
  const playPlayerHurtSound = () => {
    ensureAudio();
    beep(300, 0.10, 'triangle', 0.06);
    setTimeout(()=> beep(240, 0.10, 'triangle', 0.06), 80);
  };
  const playDeathSound = (who) => {
    ensureAudio();
    if (who === 'player') {
      // descending minor 3rd
      beep(280, 0.16, 'square', 0.08);
      setTimeout(()=> beep(210, 0.18, 'square', 0.07), 140);
      setTimeout(()=> beep(160, 0.22, 'square', 0.07), 300);
    } else {
      // short dissonant blip
      beep(520, 0.08, 'triangle', 0.07);
      setTimeout(()=> beep(390, 0.10, 'sawtooth', 0.06), 90);
    }
  };

  const nextQuestion = (lvl = level) => {
    // Avoid repeating last 20 prompts
    let q; let attempts = 0;
    do { q = genQuestion(lvl); attempts++; } while (attempts < 20 && lastPromptsRef.current.includes(q.prompt));
    lastPromptsRef.current.push(q.prompt); if (lastPromptsRef.current.length > 20) lastPromptsRef.current.shift();
    setQuestion(q);
    setSelected(null);
    setFeedback('');
  };

  const onAnswer = (opt) => {
    if (battleOver || gamePhase !== 'playing' || transitioning) return;
    ensureAudio();
    setSelected(opt);
    const correct = String(opt) === String(question.answer);
    if (correct) {
      playPlayerAttackSound();
      animRef.current = { type: 'player', start: performance.now(), screenShake: 8 };
      const dmg = damagePerHit;
      let nextMonsterHp;
      setMonsterHp(hp => {
        nextMonsterHp = Math.max(0, hp - dmg);
        return nextMonsterHp;
      });
      // physical attack: dash + slash + impact
      const now = performance.now();
      effectsRef.current.push({ kind: 'dash', target: 'player', start: now, duration: 220 });
      effectsRef.current.push({ kind: 'slash', start: now+120, duration: 200 });
      effectsRef.current.push({ kind: 'impact', target: 'monster', start: now+150, duration: 220 });
      // hit sparks for extra juice
      effectsRef.current.push({ kind: 'hit_sparks', start: now+140, duration: 260 });
      effectsRef.current.push({ kind: 'hitflash', x: 0, y: 0, r: 26, start: now, duration: 180, target: 'monster' });
      effectsRef.current.push({ kind: 'dmgnum', target: 'monster', value: -dmg, start: now, yOff: 0, duration: 700 });
      playMonsterHurtSound(level);
      setFeedback('Correct!');
      setTimeout(() => {
        // Level cleared?
        if (nextMonsterHp <= 0) {
          setTransitioning(true);
          // KO animation for monster (shape-specific)
          const t0 = performance.now();
          playDeathSound('monster');
          const koKind = level === 2 ? 'ko_square' : (level === 4 ? 'ko_triangle' : 'ko_circle');
          effectsRef.current.push({ kind: koKind, start: t0, duration: 1000 });
          setTimeout(() => {
            if (level >= 4) {
              animRef.current.screenShake = 0;
              stopMusic(); setGamePhase('won'); setFeedback('You won the tournament!'); setBattleOver(true);
            } else {
              const nl = Math.min(4, level+1);
              const baseHp = nl === 1 ? 30 : (nl === 2 ? 45 : (nl === 3 ? 60 : 80));
              setLevel(nl);
              setMonsterMax(baseHp);
              setMonsterHp(baseHp);
              setPlayerHp(ph => Math.min(playerMax, ph + 10));
              setFeedback(`Level Up! Level ${nl}`);
              setTimeout(()=> setFeedback(''), 800);
              // clear lingering FX and advance
              effectsRef.current = [];
              nextQuestion(nl);
              if (nl === 4) {
                // Boss entrance rise
                const t1 = performance.now();
                effectsRef.current.push({ kind: 'boss_rise', start: t1, duration: 1000 });
                animRef.current.screenShake = 10;
              } else {
                // Ensure no residual shake influences next scene
                animRef.current.screenShake = 0;
              }
            }
            setTransitioning(false);
          }, 1050);
        } else {
          nextQuestion();
        }
      }, 400);
    } else {
      setFeedback('Wrong! The monster attacks!');
      playMonsterAttackSound();
      animRef.current = { type: 'monster', start: performance.now(), screenShake: 8 };
      let nextPlayerHp;
      setPlayerHp(hp => {
        nextPlayerHp = Math.max(0, hp - monsterDamagePerHit);
        return nextPlayerHp;
      });
      const now = performance.now();
      // Monster physical attack: shape-specific
      if (level === 2) {
        // Square stomp
        effectsRef.current.push({ kind: 'stomp', start: now, duration: 260 });
      } else if (level === 4) {
        // Triangle pierce
        effectsRef.current.push({ kind: 'pierce', start: now, duration: 240 });
      } else {
        // Circle roll-bite
        effectsRef.current.push({ kind: 'roll_bite', start: now, duration: 260 });
      }
      effectsRef.current.push({ kind: 'impact', target: 'player', start: now+180, duration: 240 });
      // dust burst on enemy attack landing
      effectsRef.current.push({ kind: 'dust', start: now+180, duration: 300, who: 'monster' });
      effectsRef.current.push({ kind: 'dmgnum', target: 'player', value: -monsterDamagePerHit, start: now, yOff: 0, duration: 700 });
      playPlayerHurtSound();
      setTimeout(() => {
        if (nextPlayerHp <= 0) {
          setTransitioning(true);
          playDeathSound('player');
          effectsRef.current.push({ kind: 'ko_player', start: performance.now(), duration: 900 });
          setTimeout(() => { animRef.current.screenShake = 0; stopMusic(); setGamePhase('lost'); setBattleOver(true); effectsRef.current = []; setTransitioning(false); }, 950);
        } else {
          nextQuestion();
        }
      }, 400);
    }
  };

  // Canvas: simple monster & HP bar
  const canvasRef = useRef(null);
  useEffect(()=>{
    const cvs = canvasRef.current; if (!cvs) return; const ctx = cvs.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const w = cvs.width, h = cvs.height;

    const drawPlayer = (x, y, shake = 0, t = 0) => {
      const s = 3;
      const bob = Math.sin(t*0.006) * 2;
      ctx.save();
      ctx.translate(x + (Math.random()-0.5)*shake, y + (Math.random()-0.5)*shake + bob);
      // Square Root King — stylized √ shape with a crown
      // Base radical body
      ctx.fillStyle = '#8b5cf6';
      // diagonal leg of √
      ctx.fillRect(-18*s, -8*s, 6*s, 6*s);
      ctx.fillRect(-14*s, -4*s, 6*s, 6*s);
      ctx.fillRect(-10*s, -10*s, 6*s, 6*s);
      ctx.fillRect(-6*s, -16*s, 6*s, 6*s);
      // top bar of √
      for (let i=0;i<9;i++) ctx.fillRect((-2+i*4)*s, -18*s, 4*s, 6*s);
      // ankle and foot
      ctx.fillRect(-22*s, -12*s, 6*s, 6*s);
      // outline accent
      ctx.fillStyle = '#6d28d9';
      ctx.fillRect(-6*s, -12*s, 4*s, 4*s); ctx.fillRect(10*s, -14*s, 4*s, 4*s);
      // eyes on the bar
      ctx.fillStyle = '#fde2f4';
      ctx.fillRect(2*s, -20*s, 3*s, 3*s); ctx.fillRect(8*s, -20*s, 3*s, 3*s);
      // crown
      ctx.fillStyle = '#facc15';
      ctx.fillRect(0*s, -24*s, 8*s, 3*s);
      ctx.beginPath(); ctx.moveTo(0*s, -24*s); ctx.lineTo(4*s, -28*s); ctx.lineTo(8*s, -24*s); ctx.closePath(); ctx.fill();
      // melee: chalk baton near the bar
      ctx.fillStyle = '#fde2f4'; ctx.fillRect(14*s, -16*s, 3*s, 18*s);
      ctx.restore();
    };

    const drawMonster = (x, y, scale = 1, shake = 0, t = 0) => {
      const bob = Math.sin(t*0.005 + 1) * 2;
      ctx.save();
      ctx.translate(x + (Math.random()-0.5)*shake, y + (Math.random()-0.5)*shake + bob);
      const r = 56*scale; // bigger base size
      // Scary shape monsters
      const drawCircleHorror = () => {
        // body
        ctx.fillStyle = '#2a1635'; ctx.beginPath(); ctx.arc(0, 0, r*0.9, 0, Math.PI*2); ctx.fill();
        // spikes around
        ctx.fillStyle = '#7e2553'; const rot = (t*0.002) % (Math.PI*2);
        for (let i=0;i<10;i++){
          const ang = rot + i*(Math.PI*2/10);
          ctx.beginPath(); ctx.moveTo(Math.cos(ang)*r*0.9, Math.sin(ang)*r*0.9);
          ctx.lineTo(Math.cos(ang)*(r*1.05), Math.sin(ang)*(r*1.05));
          ctx.lineTo(Math.cos(ang+0.2)*r*0.85, Math.sin(ang+0.2)*r*0.85); ctx.closePath(); ctx.fill();
        }
        // eyes and teeth
        // blink
        const blinking = (Math.floor(t/1800)%4===0) && (t%1800<110);
        ctx.fillStyle = '#fde2f4';
        if (blinking) { ctx.fillRect(-r*0.25, -r*0.20, r*0.18, r*0.04); ctx.fillRect(r*0.07, -r*0.20, r*0.18, r*0.04); }
        else { ctx.fillRect(-r*0.25, -r*0.25, r*0.18, r*0.14); ctx.fillRect(r*0.07, -r*0.25, r*0.18, r*0.14); }
        ctx.fillStyle = '#ec4899'; for (let i=-3;i<=3;i++){ ctx.fillRect(i*6, r*0.15, 4, 10); }
      };
      const drawSquareFiend = () => {
        // body
        ctx.fillStyle = '#1f1330'; ctx.fillRect(-r*0.9, -r*0.9, r*1.8, r*1.8);
        // cracks
        ctx.strokeStyle = '#3b1747'; ctx.lineWidth = 2; ctx.beginPath();
        ctx.moveTo(-r*0.7, -r*0.3); ctx.lineTo(-r*0.3, 0); ctx.lineTo(-r*0.5, r*0.4);
        ctx.moveTo(r*0.5, -r*0.6); ctx.lineTo(r*0.2, -r*0.2); ctx.lineTo(r*0.6, r*0.2);
        ctx.stroke();
        // eyes blink
        const blinking = (Math.floor(t/1700)%4===0) && (t%1700<110);
        ctx.fillStyle = '#fde2f4';
        if (blinking) { ctx.fillRect(-r*0.4, -r*0.35, r*0.24, r*0.05); ctx.fillRect(r*0.16, -r*0.35, r*0.24, r*0.05); }
        else { ctx.fillRect(-r*0.4, -r*0.4, r*0.24, r*0.2); ctx.fillRect(r*0.16, -r*0.4, r*0.24, r*0.2); }
        ctx.fillStyle = '#ec4899'; ctx.fillRect(-r*0.3, r*0.3, r*0.6, r*0.12);
        // corner spikes
        ctx.fillStyle = '#7e2553';
        const sp = r*0.2; ctx.fillRect(-r*0.9, -r*0.9, sp, sp); ctx.fillRect(r*0.7, -r*0.9, sp, sp); ctx.fillRect(-r*0.9, r*0.7, sp, sp); ctx.fillRect(r*0.7, r*0.7, sp, sp);
      };
      const drawTriangleOverlord = () => {
        // body triangle
        ctx.fillStyle = '#2b0f2f'; ctx.beginPath(); ctx.moveTo(0, -r*1.0); ctx.lineTo(r*1.0, r*0.8); ctx.lineTo(-r*1.0, r*0.8); ctx.closePath(); ctx.fill();
        // inner aura
        ctx.fillStyle = '#3b1747'; ctx.beginPath(); ctx.moveTo(0, -r*0.8); ctx.lineTo(r*0.75, r*0.55); ctx.lineTo(-r*0.75, r*0.55); ctx.closePath(); ctx.fill();
        // central eye
        const pulse = 1 + 0.1*Math.sin(t*0.006);
        ctx.fillStyle = '#fde2f4'; ctx.beginPath(); ctx.arc(0, -r*0.2, r*0.22*pulse, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#ec4899'; ctx.beginPath(); ctx.arc(0, -r*0.2, r*0.10*pulse, 0, Math.PI*2); ctx.fill();
        // teeth along bottom
        ctx.fillStyle = '#ef4444'; for (let i=-6;i<=6;i++){ const bx = i*(r*0.12); ctx.fillRect(bx-4, r*0.6, 8, 12); }
      };

      if (level === 1) drawCircleHorror();
      else if (level === 2) drawSquareFiend();
      else if (level === 3) drawCircleHorror();
      else drawTriangleOverlord();

      ctx.restore();
    };

    const drawBackground = (t) => {
      // pixel floor + soft vignette + math grid + floating formulas
      const tile = 16;
      ctx.save();
      // vignette
      const grd = ctx.createRadialGradient(w/2, h/2, Math.min(w,h)/6, w/2, h/2, Math.max(w,h)/1.08);
      grd.addColorStop(0,'rgba(236,72,153,0.12)'); grd.addColorStop(1,'rgba(0,0,0,0.50)');
      ctx.fillStyle = grd; ctx.fillRect(0,0,w,h);
      ctx.globalAlpha = 0.22;
      for (let y = Math.floor(h*0.72); y < h; y += tile) {
        for (let x = 0; x < w; x += tile) {
          ctx.fillStyle = (Math.floor(x/tile)+Math.floor(y/tile)) % 2 === 0 ? '#2a1635' : '#23112d';
          ctx.fillRect(x, y, tile, tile);
        }
      }
      // math grid
      ctx.globalAlpha = 0.12; ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let gx=0; gx<w; gx+=24){ ctx.moveTo(gx, 0); ctx.lineTo(gx, h); }
      for (let gy=0; gy<h; gy+=24){ ctx.moveTo(0, gy); ctx.lineTo(w, gy); }
      ctx.stroke();
      // floating formulas
      ctx.globalAlpha = 0.25; ctx.fillStyle = '#a78bfa'; ctx.font = 'bold 12px monospace';
      const t2 = (t*0.02)%w;
      const formulas = ['√x', 'x²', '√(a²+b²)', '√100=10', '√64=8'];
      for (let i=0;i<formulas.length;i++){
        const fx = (i*140 + w - t2) % w; const fy = 40 + i*24;
        ctx.fillText(formulas[i], fx, fy);
      }
      ctx.restore();
    };

    const drawEffects = (t, px, py, mx, my) => {
      // Iterate and render FX, remove finished
      const keep = [];
      for (const fx of effectsRef.current) {
        const elapsed = t - fx.start;
        if (elapsed > fx.duration) continue;
        if (fx.kind === 'slash') {
          const k = 1 - (elapsed / fx.duration);
          ctx.save();
          ctx.translate(px + 24, py - 26);
          ctx.rotate(-0.6 + (1-k)*0.8);
          ctx.fillStyle = 'rgba(236,72,153,' + (0.6*k) + ')';
          ctx.fillRect(0, -2, 40, 4);
          ctx.restore();
        } else if (fx.kind === 'hitflash') {
          const k = 1 - (elapsed / fx.duration);
          const p = fx.target === 'monster' ? {x: mx, y: my} : {x: px, y: py};
          ctx.fillStyle = 'rgba(255,255,255,'+(0.35*k)+')';
          ctx.beginPath(); ctx.arc(p.x, p.y, 30, 0, Math.PI*2); ctx.fill();
        } else if (fx.kind === 'impact') {
          const k = 1 - (elapsed / fx.duration);
          const p = fx.target === 'monster' ? {x: mx, y: my-10} : {x: px, y: py-10};
          ctx.strokeStyle = 'rgba(253, 224, 71,'+(0.7*k)+')';
          ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, 16 + (1-k)*18, 0, Math.PI*2); ctx.stroke();
        } else if (fx.kind === 'dash') {
          const k = elapsed / fx.duration;
          const from = fx.target === 'monster' ? {x: mx, y: my} : {x: px, y: py};
          // afterimage trail
          for (let i=0;i<4;i++){
            const tk = Math.max(0, k - i*0.08);
            const wTrail = 56*(1-tk), alpha = 0.18*(1-i/4);
            ctx.fillStyle = 'rgba(253,224,71,'+alpha+')';
            ctx.fillRect(from.x - wTrail/2, from.y-5, wTrail, 10);
          }
        } else if (['claw','slam','poke','spike'].includes(fx.kind)) {
          const k = 1 - (elapsed / fx.duration);
          ctx.save();
          ctx.translate(px - 16, py - 28);
          ctx.rotate(-0.3 + (1-k)*0.6);
          ctx.fillStyle = 'rgba(236,72,153,'+(0.6*k)+')';
          ctx.fillRect(0, -3, 48, 6);
          ctx.restore();
        } else if (fx.kind === 'ko_circle') {
          const k = elapsed / fx.duration;
          ctx.save(); ctx.translate(mx, my);
          if (level === 1) {
            // Enhanced KO for first circle: shockwave, flying spikes, eye pop, goo splat
            // 1) Shockwave ring
            ctx.strokeStyle = 'rgba(253,224,71,' + (0.8*(1-k)) + ')';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(0, 0, 12 + 60*k, 0, Math.PI*2); ctx.stroke();
            // 2) Flying spikes ejecting
            ctx.fillStyle = '#7e2553';
            const baseAng = k*6.0; // rotation
            for (let i=0;i<10;i++){
              const ang = baseAng + i*(Math.PI*2/10);
              const dist = 8 + 60*k;
              const x = Math.cos(ang)*dist, y = Math.sin(ang)*dist;
              ctx.beginPath(); ctx.moveTo(x, y);
              ctx.lineTo(x + Math.cos(ang+0.4)*10, y + Math.sin(ang+0.4)*10);
              ctx.lineTo(x + Math.cos(ang-0.4)*10, y + Math.sin(ang-0.4)*10);
              ctx.closePath(); ctx.fill();
            }
            // 3) Eye pop (two small white squares shooting out)
            ctx.fillStyle = '#fde2f4';
            const eyeDist = 10 + 50*k;
            ctx.fillRect(-eyeDist, -10, 4, 3);
            ctx.fillRect(eyeDist, -10, 4, 3);
            // 4) Goo splat forming under
            const gooA = Math.min(0.6, k);
            ctx.fillStyle = 'rgba(236,72,153,'+gooA+')';
            ctx.beginPath(); ctx.ellipse(0, 22, 24 + 30*k, 8 + 10*k, 0, 0, Math.PI*2); ctx.fill();
            // 5) Fading body remnant
            ctx.globalAlpha = 1 - k;
            ctx.fillStyle = '#2a1635'; ctx.beginPath(); ctx.arc(0, 0, 30*(1-k*0.7), 0, Math.PI*2); ctx.fill();
          } else {
            // Simple implode for other circle variant
            ctx.globalAlpha = 1 - k;
            ctx.scale(1 - 0.9*k, 1 - 0.9*k);
            drawCircleHorror();
          }
          ctx.restore();
        } else if (fx.kind === 'ko_square') {
          const k = elapsed / fx.duration;
          // crumble into 4 blocks falling
          const parts = [
            {x:-12,y:-12, vx:-20, vy:30}, {x:12,y:-12, vx:20, vy:30},
            {x:-12,y:12, vx:-10, vy:40}, {x:12,y:12, vx:10, vy:40}
          ];
          ctx.save(); ctx.translate(mx, my);
          parts.forEach(p=>{ const px = p.x + p.vx*(k); const py = p.y + p.vy*(k);
            ctx.fillStyle = '#1f1330'; ctx.fillRect(px, py, 16, 16);
          }); ctx.restore();
        } else if (fx.kind === 'ko_triangle') {
          const k = elapsed / fx.duration;
          // shatter into three shards
          ctx.save(); ctx.translate(mx, my);
          const rad = 30; const shards=[0,1,2];
          shards.forEach(i=>{
            const ang = i*(Math.PI*2/3);
            const dx = Math.cos(ang)*rad*k*1.6; const dy = Math.sin(ang)*rad*k*1.6;
            ctx.fillStyle = '#2b0f2f'; ctx.beginPath(); ctx.moveTo(dx, dy-10); ctx.lineTo(dx+12, dy+10); ctx.lineTo(dx-12, dy+10); ctx.closePath(); ctx.fill();
          }); ctx.restore();
        } else if (fx.kind === 'ko_player') {
          const k = elapsed / fx.duration;
          ctx.save(); ctx.translate(px, py); ctx.rotate(-0.2*k);
          ctx.globalAlpha = 1 - k;
          ctx.scale(1 - 0.6*k, 1 - 0.6*k);
          drawPlayer(0, 0, 0, t);
          ctx.restore();
        } else if (fx.kind === 'boss_rise') {
          const k = elapsed / fx.duration;
          // triangle rises from below with dust
          ctx.save(); ctx.translate(0, (1-k)*40);
          drawMonster(mx, my, 1, 0, t);
          ctx.restore();
          // rumble decay
          animRef.current.screenShake = Math.max(animRef.current.screenShake, 8*(1-k));
          // simple dust puffs
          ctx.fillStyle = 'rgba(255,255,255,'+(0.4*(1-k))+')';
          ctx.fillRect(mx-20-(1-k)*20, my+24, 8, 4); ctx.fillRect(mx+20+(1-k)*20, my+24, 8, 4);
        } else if (fx.kind === 'roll_bite') {
          const k = elapsed / fx.duration;
          // rolling circle toward player
          const cx = mx + (px - mx)*k; const cy = my + (py - my)*k;
          ctx.save(); ctx.translate(cx, cy); ctx.rotate(k*6.28);
          ctx.fillStyle = '#2a1635'; ctx.beginPath(); ctx.arc(0,0,18,0,Math.PI*2); ctx.fill();
          ctx.restore();
        } else if (fx.kind === 'stomp') {
          const k = elapsed / fx.duration;
          const sy = my - 10 + Math.sin(k*Math.PI)*22;
          ctx.fillStyle = '#1f1330'; ctx.fillRect(mx-20, sy, 40, 40);
        } else if (fx.kind === 'pierce') {
          const k = elapsed / fx.duration;
          ctx.strokeStyle = '#ec4899'; ctx.lineWidth = 3; ctx.beginPath();
          ctx.moveTo(mx, my-30); ctx.lineTo(mx + (px-mx)*k, my-30 + (py-my)*k);
          ctx.stroke();
        } else if (fx.kind === 'hit_sparks') {
          const k = elapsed / fx.duration;
          const parts = 10;
          for (let i=0;i<parts;i++){
            const ang = i*(Math.PI*2/parts) + k*3;
            const dist = 8 + 40*k;
            ctx.strokeStyle = 'rgba(253,224,71,'+(1-k)+')';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(mx + Math.cos(ang)*(dist-6), my + Math.sin(ang)*(dist-6));
            ctx.lineTo(mx + Math.cos(ang)*dist, my + Math.sin(ang)*dist);
            ctx.stroke();
          }
        } else if (fx.kind === 'dust') {
          const k = elapsed / fx.duration;
          const baseX = fx.who === 'monster' ? mx : px;
          const baseY = fx.who === 'monster' ? my+20 : py+20;
          ctx.fillStyle = 'rgba(255,255,255,'+(0.5*(1-k))+')';
          for (let i=0;i<5;i++){
            const ang = i*(Math.PI*2/5);
            const dx = Math.cos(ang)*10*k, dy = Math.sin(ang)*6*k;
            ctx.fillRect(baseX + dx, baseY + dy, 6*(1-k), 3*(1-k));
          }
        } else if (fx.kind === 'dmgnum') {
          const k = elapsed / fx.duration;
          const yOff = -k*24;
          const p = fx.target === 'monster' ? {x: mx, y: my-40} : {x: px, y: py-40};
          ctx.fillStyle = '#000000aa'; ctx.font = 'bold 16px monospace'; ctx.textAlign='center';
          ctx.fillText(String(fx.value), p.x+1, p.y + yOff + 1);
          ctx.fillStyle = fx.value < 0 ? THEME.bad : THEME.good;
          ctx.fillText(String(fx.value), p.x, p.y + yOff);
        }
        keep.push(fx);
      }
      effectsRef.current = keep;
    };

    const draw = () => {
      // Hard reset any previous transform to avoid drift
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = THEME.bg; ctx.fillRect(0,0,w,h);
      // vignette
      const grd = ctx.createRadialGradient(w/2, h/2, Math.min(w,h)/6, w/2, h/2, Math.max(w,h)/1.08);
      grd.addColorStop(0,'rgba(236,72,153,0.20)'); grd.addColorStop(1,'rgba(0,0,0,0.60)');
      ctx.fillStyle = grd; ctx.fillRect(0,0,w,h);

      // Time and screen shake
      const t = performance.now();
      let shakeX = 0, shakeY = 0;
      if (animRef.current.screenShake && animRef.current.screenShake > 0) {
        shakeX = (Math.random()-0.5) * animRef.current.screenShake;
        shakeY = (Math.random()-0.5) * animRef.current.screenShake;
        animRef.current.screenShake *= 0.9;
        if (animRef.current.screenShake < 0.5) animRef.current.screenShake = 0;
      }

      ctx.save();
      ctx.translate(shakeX, shakeY);

      // Background
      drawBackground(t);

      // Positions
      const scale = 1 + (level-1)*0.25;
      const px = w*0.22, py = h*0.72;
      const mx = w*0.78, my = h*0.66;

      // Attack animation (brief shake)
      let shakeP = 0, shakeM = 0;
      if (animRef.current.type) {
        const t = performance.now() - animRef.current.start;
        const k = Math.max(0, 1 - t/260);
        if (animRef.current.type === 'player') { shakeM = 6*k; }
        if (animRef.current.type === 'monster') { shakeP = 6*k; }
        if (t > 260) animRef.current.type = null;
      }

      // Shadows
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.ellipse(px, py-6, 36, 8, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(mx, my-10, 42, 10, 0, 0, Math.PI*2); ctx.fill();

      // Attack lunge offsets for melee feel
      let offPx = 0, offPy = 0, offMx = 0, offMy = 0;
      if (animRef.current.type) {
        const et = performance.now() - animRef.current.start;
        const k = Math.min(1, et/200);
        const dirX = mx - px, dirY = my - py;
        const len = Math.max(1, Math.hypot(dirX, dirY));
        if (animRef.current.type === 'player') {
          offPx = (dirX/len) * 40 * (1 - Math.cos(k*Math.PI));
          offPy = (dirY/len) * 26 * (1 - Math.cos(k*Math.PI));
        } else if (animRef.current.type === 'monster') {
          offMx = (-dirX/len) * 32 * (1 - Math.cos(k*Math.PI));
          offMy = (-dirY/len) * 22 * (1 - Math.cos(k*Math.PI));
        }
      }

      // Draw sprites with idle bobbing
      drawPlayer(px + offPx, py + offPy, shakeP, t);
      drawMonster(mx + offMx, my + offMy, scale, shakeM, t);

      // Effects on top
      drawEffects(t, px, py, mx, my);

      // Overlay screens — draw centered on identity transform and early-return
      if (gamePhase !== 'playing') {
        // remove shake transform
        ctx.restore();
        // ensure clean transform
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0,0,w,h);
        ctx.fillStyle = THEME.text; ctx.textAlign='center'; ctx.textBaseline='middle';
        if (gamePhase === 'start') {
          ctx.font = 'bold 24px monospace'; ctx.fillText('Square Root Kings', w/2, h/2 - 20);
          ctx.font = '16px monospace'; ctx.fillText('Press Start to begin', w/2, h/2 + 10);
        } else if (gamePhase === 'won') {
          ctx.font = 'bold 24px monospace'; ctx.fillText('You Won! √ Victory!', w/2, h/2 - 20);
          ctx.font = '16px monospace'; ctx.fillText('Press Reset to play again', w/2, h/2 + 10);
        } else if (gamePhase === 'lost') {
          ctx.font = 'bold 24px monospace'; ctx.fillText('Game Over', w/2, h/2 - 20);
          ctx.font = '16px monospace'; ctx.fillText('Press Reset to try again', w/2, h/2 + 10);
        }
        return;
      }

      // Smooth HP display
      hpDispRef.current.m += (monsterHp - hpDispRef.current.m) * 0.2;
      hpDispRef.current.p += (playerHp - hpDispRef.current.p) * 0.2;
      if (Math.abs(hpDispRef.current.m - monsterHp) < 0.2) hpDispRef.current.m = monsterHp;
      if (Math.abs(hpDispRef.current.p - playerHp) < 0.2) hpDispRef.current.p = playerHp;

      // Monster HP bar (top)
      ctx.fillStyle = THEME.barBg; ctx.fillRect(48, 24, w-96, 14);
      const mHpPct = Math.max(0, Math.min(1, hpDispRef.current.m/monsterMax));
      ctx.fillStyle = THEME.good; ctx.fillRect(48, 24, (w-96)*mHpPct, 14);
      // tick marks
      ctx.strokeStyle = '#00000055'; ctx.lineWidth = 1; ctx.beginPath();
      const ticks = 10; for (let i=1;i<ticks;i++){ const tx = 48 + (w-96)*(i/ticks); ctx.moveTo(tx, 24); ctx.lineTo(tx, 38); }
      ctx.stroke();
      // Player HP bar (bottom)
      ctx.fillStyle = THEME.barBg; ctx.fillRect(48, h-42, w-96, 14);
      const pHpPct = Math.max(0, Math.min(1, hpDispRef.current.p/playerMax));
      ctx.fillStyle = pHpPct > 0.4 ? THEME.good : (pHpPct > 0.2 ? THEME.warn : THEME.bad); ctx.fillRect(48, h-42, (w-96)*pHpPct, 14);
      // labels
      const monsterName = level === 1 ? 'Circle Horror' : level === 2 ? 'Square Fiend' : level === 3 ? 'Circle Abomination' : 'Triangle Overlord';
      ctx.fillStyle = THEME.text; ctx.font = 'bold 18px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(`Level ${level}  ${monsterName}  HP ${monsterHp}/${monsterMax}`, w/2, 50);
      ctx.fillText(`YOU HP ${playerHp}/${playerMax}`, w/2, h-58);

      ctx.restore();
    };

    let raf; const loop=()=>{ draw(); raf = requestAnimationFrame(loop); }; loop();
    return ()=> cancelAnimationFrame(raf);
  }, [level, monsterHp, monsterMax, playerHp, playerMax, gamePhase]);

  const w = 756, h = 532; // match PacSquaresGame scale (27x19 * 28px)

  return (
    <div style={{ background: THEME.cardBg, border: 'none', color: THEME.text, padding: 12, borderRadius: 8, boxShadow: 'none', overflow: 'hidden', boxSizing: 'border-box', maxWidth: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h3 style={{ marginTop: 0, marginBottom: 6, fontFamily: 'monospace' }}>Square Root Monster Battle</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" style={{ background: muted ? '#475569' : '#0ea5e9', padding: '6px 10px', fontSize: 12, borderRadius: 0, boxShadow: '0 0 0 3px #3b1747 inset' }} onClick={() => {
            const currentlyMuted = mutedRef.current;
            setMuted(m => !m);
            if (!currentlyMuted) stopMusic();
          }}>{muted ? 'Unmute' : 'Mute'}</button>
          <button className="btn" style={{ background: '#64748b', padding: '6px 10px', fontSize: 12, borderRadius: 0, boxShadow: '0 0 0 3px #3b1747 inset' }} onClick={() => {
            setLevel(1); setMonsterMax(30); setMonsterHp(30); setPlayerMax(30); setPlayerHp(30); setBattleOver(false); nextQuestion(1); setFeedback(''); setGamePhase('start'); stopMusic();
          }}>Reset</button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start', maxWidth: '100%' }}>
        <div style={{ maxWidth: '100%', position: 'relative' }}>
          <canvas ref={canvasRef} width={w} height={h} style={{ imageRendering:'pixelated', width: '100%', height: 'auto', maxWidth: w, display: 'block' }} />
          {/* In-game overlay for Start screen with rules */}
          {gamePhase === 'start' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ background: 'rgba(0,0,0,0.78)', border: `4px solid ${THEME.accent}`, color: THEME.text, padding: 18, borderRadius: 6, width: '82%', maxWidth: 560, fontFamily: 'monospace', textAlign: 'left', pointerEvents: 'auto', boxShadow: '0 0 0 4px #3b1747 inset' }}>
                <div style={{ fontWeight: 'bold', fontSize: 22, textAlign: 'center', marginBottom: 10, letterSpacing: 1, textShadow: '0 0 0 #000, 1px 1px 0 #000, -1px 1px 0 #000, 1px -1px 0 #000, -1px -1px 0 #000' }}>SQUARE ROOT KINGS</div>
                <div style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>
                  Rules:
                  <ul style={{ margin: '6px 0 8px 18px', padding: 0 }}>
                    <li>Answer square root questions to attack the enemy.</li>
                    <li>Correct = the enemy takes damage. Wrong = you take damage.</li>
                    <li>Beat 4 levels: Circle, Square, Circle+, Triangle Boss.</li>
                    <li>Mute audio with the Mute button. Reset to restart anytime.</li>
                  </ul>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                  <button className="btn" style={{ background: '#22c55e', padding: '10px 14px', fontSize: 14, borderRadius: 0, boxShadow: '0 0 0 3px #3b1747 inset', textShadow: '1px 1px 0 #000' }} onClick={()=>{
                    setLevel(1); setMonsterMax(30); setMonsterHp(30); setPlayerMax(30); setPlayerHp(30); setBattleOver(false); nextQuestion(1); setFeedback(''); setGamePhase('playing'); startMusic();
                  }}>Start Game</button>
                </div>
              </div>
            </div>
          )}
          {/* In-game overlay for Game Over reset button */}
          {gamePhase === 'lost' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ background: 'rgba(0,0,0,0.7)', border: `4px solid ${THEME.accent}`, color: THEME.text, padding: 16, borderRadius: 6, width: '70%', maxWidth: 420, fontFamily: 'monospace', textAlign: 'center', pointerEvents: 'auto', boxShadow: '0 0 0 4px #3b1747 inset' }}>
                <div style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 10, letterSpacing: 1, textShadow: '0 0 0 #000, 1px 1px 0 #000, -1px 1px 0 #000, 1px -1px 0 #000, -1px -1px 0 #000' }}>GAME OVER</div>
                <div style={{ fontSize: 14, marginBottom: 12 }}>Press Reset to try again.</div>
                <button className="btn" style={{ background: '#64748b', padding: '10px 14px', fontSize: 14, borderRadius: 0, boxShadow: '0 0 0 3px #3b1747 inset' }} onClick={() => {
                  setLevel(1); setMonsterMax(30); setMonsterHp(30); setPlayerMax(30); setPlayerHp(30); setBattleOver(false); nextQuestion(1); setFeedback(''); setGamePhase('start'); stopMusic();
                }}>Reset Battle</button>
              </div>
            </div>
          )}
          <div style={{ marginTop: 10, fontFamily: 'monospace', fontSize: 16 }}>{feedback || 'Answer to attack!'}</div>
        </div>
        <div style={{ flex: 1, minWidth: 360 }}>
          <div style={{ marginBottom: 10, fontFamily: 'monospace', fontSize: 18 }}>{question.prompt}</div>
          {question.type === 'mc' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }}>
              {question.options.map((opt,i)=>(
                <button key={i} className="btn" disabled={battleOver || gamePhase!=='playing'} style={{ background: THEME.accent, borderRadius: 0, padding: '10px 12px', fontSize: 16, fontFamily: 'monospace', boxShadow: '0 0 0 3px #3b1747 inset', opacity: (battleOver || gamePhase!=='playing') ? 0.6 : 1 }} onClick={()=> onAnswer(opt)}>{opt}</button>
              ))}
            </div>
          ) : (
            <div>
              <input type="text" placeholder="Answer" style={{ padding: 10, fontFamily: 'monospace', marginRight: 8, fontSize: 16 }} />
              <button className="btn" style={{ background: THEME.accent, borderRadius: 0, padding: '10px 12px', fontSize: 16, boxShadow: '0 0 0 3px #3b1747 inset' }}>Submit</button>
            </div>
          )}
          {/* Right-side helper content */}
          <div style={{ marginTop: 12, background: '#21103d', border: `2px solid ${THEME.accent}`, borderRadius: 6, padding: 10, boxShadow: '0 0 0 4px #3b1747 inset' }}>
            <div style={{ fontWeight: 700, marginBottom: 6, fontFamily: 'monospace' }}>Hint</div>
            <div style={{ color: '#e9d5ff', fontFamily: 'monospace', fontSize: 14 }}>{getHint(question)}</div>
            <div style={{ marginTop: 10, fontWeight: 700, fontFamily: 'monospace' }}>Perfect squares</div>
            <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 6, fontFamily: 'monospace', fontSize: 13 }}>
              {Array.from({length: 16}, (_,i)=> i+1).map(k => (
                <div key={k} style={{ background:'#2a1744', padding: '4px 6px', borderRadius: 4, border: '1px solid #3b1747' }}>{k}² = {k*k}</div>
              ))}
            </div>
            <div style={{ marginTop: 12, fontWeight: 700, fontFamily: 'monospace' }}>Strategy Tips</div>
            <ul style={{ marginTop: 6, marginBottom: 0, paddingLeft: 18, color: '#e9d5ff', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6 }}>
              <li>Bracket: Find k where k² ≤ N &lt; (k+1)². Then √N is between k and k+1.</li>
              <li>Anchor: Compare to 10²=100, 15²=225, 20²=400 for quick estimates.</li>
              <li>End digits: Perfect squares end with 0,1,4,5,6,9 only (filter options fast).</li>
              <li>Parity: If N is even and a perfect square, √N is even (similarly for odd).</li>
              <li>Pythagoras: For √(a²+b²), estimate using nearby triples like (3,4,5), (5,12,13), (8,15,17).</li>
              <li>Area → side: side = √Area for squares. Reverse when needed.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
