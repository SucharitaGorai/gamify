import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';

// Helpers
const PERFECT_SQUARES = new Set([1,4,9,16,25,36,49,64,81,100]);
const isSquare = (n) => PERFECT_SQUARES.has(n);

// A larger maze (0 empty, 1 wall)
// 27 x 19 grid for more exploration
const MAZE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,0,1,0,1,0,1,1,1,0,1,0,1,0,1,0,1,1,1,0,1],
  [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,1],
  [1,1,1,0,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1],
  [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,0,1],
  [1,0,0,0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,1],
  [1,0,1,0,1,1,1,1,0,1,1,1,1,1,0,1,0,1,1,0,1,1,1,1,1,0,1],
  [1,0,1,0,0,0,0,1,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,1,0,1],
  [1,0,1,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,1,0,1,1,1,0,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,0,1],
  [1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,1],
  [1,0,1,1,1,0,1,0,1,0,1,0,1,1,1,0,1,0,1,0,1,0,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

const CELL = 28; // pixel size of a cell
const MAX_GHOSTS = 4;
const GHOST_SPAWN_MS = 36000; // slower: spawn a new ghost roughly every 36s
const POWER_DURATION_MS = 10000;

function randomChoice(arr) { return arr[Math.floor(Math.random()*arr.length)]; }

export default function PacSquaresGame() {
  const canvasRef = useRef(null);
  const [running, setRunning] = useState(false); // don't auto-start
  const [score, setScore] = useState(0);
  const [collected, setCollected] = useState([]); // numbers collected
  const [collectedSquares, setCollectedSquares] = useState([]);
  const [message, setMessage] = useState('Collect all perfect squares!');
  const [ghostSpeedMs, setGhostSpeedMs] = useState(340); // slower initial ghosts
  const playerStepMsRef = useRef(220);
  const [ended, setEnded] = useState(false);
  const [win, setWin] = useState(false);
  const chompRef = useRef(false); // request to eat current tile
  const powerUntilRef = useRef(0); // timestamp until power mode active
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizQ, setQuizQ] = useState(null); // {text, options: number[], answer: number}
  const [quizTimeLeft, setQuizTimeLeft] = useState(0);
  const quizTimerRef = useRef(null);
  const quizTickSoundRef = useRef(null);
  const [quizWrong, setQuizWrong] = useState(false);
  const lastSpawnAtRef = useRef(0);
  const [hintOn, setHintOn] = useState(false);
  const hintOnRef = useRef(false);
  const hintTimerRef = useRef(null);
  const [showRules, setShowRules] = useState(true);
  const [powerTick, setPowerTick] = useState(0); // forces re-render for power bar
  // Background music state
  const musicRef = useRef({ playing: false, intervalId: null, gain: null, osc: null, mode: 'normal' });
  const postModeUntilRef = useRef(0); // timestamp until post-power music is active
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem('pac_squares_muted') === '1'; } catch { return false; }
  });
  const mutedRef = useRef(muted);
  useEffect(() => { mutedRef.current = muted; try { localStorage.setItem('pac_squares_muted', muted ? '1' : '0'); } catch {} }, [muted]);

  // Sounds (WebAudio)
  const audioCtxRef = useRef(null);
  const ensureAudio = () => {
    if (!audioCtxRef.current) {
      try { audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
    }
    return audioCtxRef.current;
  };
  const playBeep = (freq=600, dur=0.07, type='sine', vol=0.06) => {
    if (mutedRef.current) return;
    const ctx = ensureAudio(); if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + dur);
  };
  const sfx = {
    eatGood: () => playBeep(880, 0.06, 'triangle', 0.08),
    eatBad:  () => playBeep(220, 0.12, 'square', 0.08),
    win:     () => { playBeep(660,0.08); setTimeout(()=>playBeep(990,0.1),100); },
    lose:    () => playBeep(120, 0.35, 'sawtooth', 0.08),
    kill:    () => { playBeep(520,0.08,'square',0.09); setTimeout(()=>playBeep(780,0.08,'square',0.09),80); },
    spawn:   () => playBeep(500, 0.09, 'square', 0.06),
    quizTick: () => { if (!mutedRef.current) playBeep(760, 0.05, 'triangle', 0.05); },
    quizOpen: () => { if (!mutedRef.current) { playBeep(520, 0.08, 'sine', 0.06); setTimeout(()=>playBeep(780,0.08,'sine',0.06),120); } },
    quizWrong: () => { if (!mutedRef.current) { playBeep(180,0.12,'sawtooth',0.07); setTimeout(()=>playBeep(140,0.12,'sawtooth',0.07),120); } }
  };

  const startQuizTick = () => {
    sfx.quizOpen();
    if (quizTickSoundRef.current) clearInterval(quizTickSoundRef.current);
    quizTickSoundRef.current = setInterval(() => sfx.quizTick(), 1000);
  };
  const stopQuizTick = () => {
    if (quizTickSoundRef.current) { clearInterval(quizTickSoundRef.current); quizTickSoundRef.current = null; }
  };

  // Chiptune-style background music (very lightweight)
  const startMusic = (mode = 'normal') => {
    if (mutedRef.current) { stopMusic(); return; }
    const ctx = ensureAudio();
    if (!ctx) return;
    if (musicRef.current.playing && musicRef.current.mode === mode) return;
    try { if (ctx.state === 'suspended') ctx.resume(); } catch {}
    const gain = ctx.createGain();
    gain.gain.value = 0.04; // subtle background volume
    gain.connect(ctx.destination);
    const osc = ctx.createOscillator();
    osc.type = mode === 'power' ? 'sawtooth' : (mode === 'post' ? 'triangle' : 'square');
    osc.connect(gain);
    // Patterns
    const notes = mode === 'power'
      // edgy minor-ish/diminished loop for tension
      ? [329.63, 392.0, 466.16, 523.25, 466.16, 392.0, 349.23, 392.0]
      : (mode === 'post'
        // calming pentatonic-style cooldown
        ? [392.0, 349.23, 329.63, 293.66, 261.63, 293.66, 329.63, 349.23]
        // cheerful C major arpeggio
        : [261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 293.66, 349.23]
      );
    let i = 0;
    const stepMs = mode === 'power' ? 150 : (mode === 'post' ? 260 : 220);
    const step = () => {
      const f = notes[i % notes.length];
      // quick envelope for a bit of punch
      const t = ctx.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(0.0, t);
      const peak = mode === 'power' ? 0.07 : (mode === 'post' ? 0.045 : 0.05);
      const sustain = mode === 'power' ? 0.04 : (mode === 'post' ? 0.03 : 0.035);
      gain.gain.linearRampToValueAtTime(peak, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(sustain, t + 0.1);
      try { osc.frequency.setValueAtTime(f, t); } catch {}
      i++;
    };
    step();
    const id = setInterval(step, stepMs);
    osc.start();
    // stop any old loop cleanly (if switching mode)
    try {
      const prev = musicRef.current;
      if (prev && prev.intervalId) clearInterval(prev.intervalId);
      if (prev && prev.osc) prev.osc.stop();
      if (prev && prev.osc) prev.osc.disconnect();
      if (prev && prev.gain) prev.gain.disconnect();
    } catch {}
    musicRef.current = { playing: true, intervalId: id, gain, osc, mode };
  };

  const stopMusic = () => {
    const { intervalId, gain, osc } = musicRef.current || {};
    if (intervalId) clearInterval(intervalId);
    try { if (osc) osc.stop(); } catch {}
    try { if (osc) osc.disconnect(); } catch {}
    try { if (gain) gain.disconnect(); } catch {}
    musicRef.current = { playing: false, intervalId: null, gain: null, osc: null, mode: 'normal' };
  };

  // Build list of pellet positions (empty cells) and place numbers
  const { pellets, playerStart, ghostStarts, totalSquaresPlaced } = useMemo(() => {
    const empties = [];
    for (let y=0; y<MAZE.length; y++) {
      for (let x=0; x<MAZE[0].length; x++) {
        if (MAZE[y][x] === 0) empties.push({x,y});
      }
    }
    // Keep some start positions clear
    const playerStart = { x: 1, y: 1 };
    const ghostStarts = [{ x: MAZE[0].length-2, y: 1 }, { x: MAZE[0].length-2, y: MAZE.length-3 }];

    // Helper: degree (number of open neighbors)
    const degree = (c) => [
      {x:c.x+1,y:c.y},{x:c.x-1,y:c.y},{x:c.x,y:c.y+1},{x:c.x,y:c.y-1}
    ].filter(n => MAZE[n.y] && MAZE[n.y][n.x] === 0).length;

    // Choose fewer pellets at avoidable spots (dead-ends first), then corridors
    const candidates = empties
      .filter(e => !(e.x===playerStart.x && e.y===playerStart.y) && !ghostStarts.some(g=>g.x===e.x && g.y===e.y))
      .map(e => ({...e, deg: degree(e)}));
    const deadEnds = candidates.filter(c => c.deg === 1);
    const corridors = candidates.filter(c => c.deg === 2);
    const intersections = candidates.filter(c => c.deg >= 3);
    const ordered = [...deadEnds, ...corridors, ...intersections];
    ordered.sort(() => Math.random() - 0.5);
    const cells = ordered.slice(0, Math.min(20, ordered.length)); // about 20 pellets

    // Ensure all perfect squares 1..100 are included at least once
    const squaresList = [1,4,9,16,25,36,49,64]; // ~8 perfect squares
    const numbersPool = new Set();
    // Place squares first
    const pellets = cells.map((c, i) => {
      let n;
      if (i < squaresList.length) n = squaresList[i];
      else {
        // fill with random 1..100
        let t;
        do { t = 1 + Math.floor(Math.random()*100); } while (numbersPool.has(t));
        n = t;
      }
      numbersPool.add(n);
      return { ...c, n, collected: false };
    });

    return { pellets, playerStart, ghostStarts, totalSquaresPlaced: squaresList.length };
  }, []);

  // Entities
  const playerRef = useRef({ x: playerStart.x, y: playerStart.y, dir: {x:1,y:0}, nextDir: {x:1,y:0} });
  const ghostsRef = useRef(ghostStarts.map(g => ({ x: g.x, y: g.y, dir: randomChoice([{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}]) })));
  const pelletsRef = useRef(pellets);
  const playerPrevRef = useRef({ x: playerStart.x, y: playerStart.y });
  const ghostsPrevRef = useRef(ghostStarts.map(g => ({ x: g.x, y: g.y })));
  const deathBurstsRef = useRef([]); // {x,y,until}
  const spawnRipplesRef = useRef([]); // {x,y,until}

  // Keyboard (Arrow keys + WASD + Space/Enter to eat, prevent page scroll)
  useEffect(() => {
    const onKey = (e) => {
      const p = playerRef.current;
      const k = e.key.toLowerCase();
      if (k === 'arrowup' || k === 'w') { p.nextDir = {x:0,y:-1}; e.preventDefault(); }
      if (k === 'arrowdown' || k === 's') { p.nextDir = {x:0,y:1}; e.preventDefault(); }
      if (k === 'arrowleft' || k === 'a') { p.nextDir = {x:-1,y:0}; e.preventDefault(); }
      if (k === 'arrowright' || k === 'd') { p.nextDir = {x:1,y:0}; e.preventDefault(); }
      if (k === ' ' || k === 'enter') { chompRef.current = true; e.preventDefault(); } // request eat
      if (k === 'p') { setRunning(r => !r); e.preventDefault(); } // pause/resume
      if (k === 'h') {
        if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
        setHintOn(true);
        hintTimerRef.current = setTimeout(() => setHintOn(false), 3500);
        e.preventDefault();
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    };
    window.addEventListener('keydown', onKey, { passive: false });
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const canMove = (x,y) => MAZE[y] && MAZE[y][x] === 0;

  // Player step loop (uses adjustable playerStepMsRef)
  useEffect(() => {
    if (!running) return;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      if (ended) return;
      if (quizOpen) return; // freeze during quiz
      const p = playerRef.current;
      // try turning
      const nx = p.x + p.nextDir.x;
      const ny = p.y + p.nextDir.y;
      if (canMove(nx,ny)) p.dir = p.nextDir;
      // move forward
      const tx = p.x + p.dir.x;
      const ty = p.y + p.dir.y;
      if (canMove(tx,ty)) { p.x = tx; p.y = ty; }
      playerPrevRef.current = { x: p.x - p.dir.x, y: p.y - p.dir.y }; // previous tile
      // pellet collection (auto-collect when stepping on it)
      const idx = pelletsRef.current.findIndex(pe => !pe.collected && pe.x === p.x && pe.y === p.y);
      if (idx !== -1) {
        const pe = pelletsRef.current[idx];
        pe.collected = true;
        setCollected(prev => [...prev, pe.n]);
        const inPower = Date.now() < powerUntilRef.current;
        if (isSquare(pe.n)) {
          setScore(s => s + 10);
          setCollectedSquares(prev => [...prev, pe.n]);
          setMessage('Nice! Perfect square +10');
          sfx.eatGood();
        } else {
          if (!inPower) {
            setScore(s => Math.max(0, s - 5));
            setMessage('Oops! Not a perfect square -5');
            setGhostSpeedMs(ms => Math.max(200, ms - 15));
            sfx.eatBad();
          } else {
            setMessage('Power active — no penalty');
          }
        }
        chompRef.current = false; // reset any pending
      }
      // win condition: all squares collected
      const squaresLeft = pelletsRef.current.filter(pe => !pe.collected && isSquare(pe.n)).length;
      if (squaresLeft === 0) {
        setWin(true); setEnded(true); setRunning(false);
        sfx.win();
      }
      setTimeout(tick, playerStepMsRef.current);
    };
    tick();
    return () => { cancelled = true; };
  }, [running, ended, quizOpen]);

  // Ghost loop
  useEffect(() => {
    if (!running) return;
    const step = () => {
      if (ended) return;
      if (quizOpen) return;
      const ps = playerRef.current;
      // filter out removed ghosts occasionally
      ghostsRef.current = ghostsRef.current.filter(g => !g.removed);
      ghostsRef.current.forEach((g, gi) => {
        // more random pathing: higher chance to re-roll direction, avoid immediate reversal sometimes
        if (Math.random() < 0.6) {
          const all = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
          const dirs = all.filter(d => canMove(g.x+d.x, g.y+d.y));
          // avoid reversing 70% of the time
          const noReverse = dirs.filter(d => !(d.x === -g.dir.x && d.y === -g.dir.y));
          const pool = noReverse.length && Math.random() < 0.7 ? noReverse : dirs;
          if (pool.length) g.dir = randomChoice(pool);
        }
        const prev = { x: g.x, y: g.y };
        // if on cooldown (killed recently), skip move until cooldown ends
        const nowTime = Date.now();
        if (g.cooldownUntil && nowTime < g.cooldownUntil) {
          ghostsPrevRef.current[gi] = prev;
          return;
        }
        if (g.cooldownUntil && nowTime >= g.cooldownUntil && g.x < 0) {
          // respawn at a start after cooldown
          const start = gi % 2 === 0 ? { x: MAZE[0].length-2, y: 1 } : { x: MAZE[0].length-2, y: MAZE.length-3 };
          g.x = start.x; g.y = start.y; g.dir = randomChoice([{x:-1,y:0},{x:0,y:1},{x:0,y:-1}]);
          g.cooldownUntil = undefined;
        }
        const gx = g.x + g.dir.x;
        const gy = g.y + g.dir.y;
        if (canMove(gx,gy)) { g.x=gx; g.y=gy; } else {
          const dirs = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}].filter(d => canMove(g.x+d.x, g.y+d.y));
          if (dirs.length) g.dir = randomChoice(dirs);
        }
        ghostsPrevRef.current[gi] = prev;
        // collision with player
        const passThrough = (g.x === playerPrevRef.current.x && g.y === playerPrevRef.current.y && prev.x === ps.x && prev.y === ps.y);
        const sameTile = (g.x === ps.x && g.y === ps.y);
        if (sameTile || passThrough) {
          const tNow = Date.now();
          const POWER_GRACE_MS = 200;
          const inPower = tNow <= (powerUntilRef.current + POWER_GRACE_MS);
          if (inPower) {
            // Eat ghost
            setScore(s => s + 50);
            sfx.kill();
            deathBurstsRef.current.push({ x: g.x, y: g.y, until: tNow + 600 });
            // mark ghost removed; timed spawner will add new ones based on interval
            g.removed = true;
          } else {
            setEnded(true); setRunning(false); setWin(false);
            sfx.lose();
          }
        }
      });
    };
    const id = setInterval(step, ghostSpeedMs);
    return () => clearInterval(id);
  }, [running, ghostSpeedMs, ended, quizOpen]);

  // Timed ghost spawning up to MAX_GHOSTS (counts only active ghosts)
  useEffect(() => {
    if (!running) return;
    const spawn = () => {
      if (ended || quizOpen) return;
      const now = Date.now();
      ghostsRef.current = ghostsRef.current.filter(g => !g.removed);
      const activeCount = ghostsRef.current.filter(gh => gh.x >= 0 && gh.y >= 0).length;
      if (activeCount >= MAX_GHOSTS) { lastSpawnAtRef.current = now; return; }
      const startPositions = [
        { x: MAZE[0].length-2, y: 1 },
        { x: MAZE[0].length-2, y: MAZE.length-3 },
        { x: 1, y: MAZE.length-3 },
        { x: 1, y: 1 },
      ];
      // pick a start not heavily occupied
      const occupied = new Set(ghostsRef.current.filter(gh => gh.x>=0 && gh.y>=0).map(g => `${g.x},${g.y}`));
      const choices = startPositions.filter(p => !occupied.has(`${p.x},${p.y}`));
      const pos = (choices.length ? randomChoice(choices) : randomChoice(startPositions));
      const dir = randomChoice([{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}]);
      ghostsRef.current.push({ x: pos.x, y: pos.y, dir });
      setMessage('A new ghost appeared!');
      sfx.spawn();
      spawnRipplesRef.current.push({ x: pos.x, y: pos.y, until: now + 600 });
      lastSpawnAtRef.current = now;
    };
    const id = setInterval(spawn, GHOST_SPAWN_MS);
    return () => clearInterval(id);
  }, [running, ended, quizOpen]);

  // Safety: also attempt spawn during ghost loop if overdue (ensures periodic spawn regardless of other pauses)
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      if (ended || quizOpen) return;
      const now = Date.now();
      ghostsRef.current = ghostsRef.current.filter(g => !g.removed);
      if (now - lastSpawnAtRef.current > GHOST_SPAWN_MS) {
        // trigger spawn once
        lastSpawnAtRef.current = now;
        const startPositions = [
          { x: MAZE[0].length-2, y: 1 },
          { x: MAZE[0].length-2, y: MAZE.length-3 },
          { x: 1, y: MAZE.length-3 },
          { x: 1, y: 1 },
        ];
        const activeCount = ghostsRef.current.filter(gh => gh.x >= 0 && gh.y >= 0).length;
        if (activeCount < MAX_GHOSTS) {
          const occupied = new Set(ghostsRef.current.filter(gh => gh.x>=0 && gh.y>=0).map(g => `${g.x},${g.y}`));
          const choices = startPositions.filter(p => !occupied.has(`${p.x},${p.y}`));
          const pos = (choices.length ? randomChoice(choices) : randomChoice(startPositions));
          const dir = randomChoice([{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}]);
          ghostsRef.current.push({ x: pos.x, y: pos.y, dir });
          setMessage('A new ghost appeared!');
          sfx.spawn();
          spawnRipplesRef.current.push({ x: pos.x, y: pos.y, until: now + 600 });
        }
      }
    }, 1000);
    return () => clearInterval(id);
  }, [running, ended, quizOpen]);

  // Power bar ticker to update width smoothly while active
  useEffect(() => {
    if (!running) return;
    let id;
    const tick = () => {
      if (Date.now() < powerUntilRef.current) {
        setPowerTick(t => (t + 1) % 1000);
        id = setTimeout(tick, 100);
      }
    };
    tick();
    return () => clearTimeout(id);
  }, [running]);

  // Keep hint ref in sync so canvas loop reads current value
  useEffect(() => {
    hintOnRef.current = hintOn;
  }, [hintOn]);

  // Mid-round quiz: periodically show a question; correct answer enables power mode
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      if (ended || quizOpen) return;
      // Moderate difficulty: squares and square roots for bases 1..20
      const makeModerateQuestion = () => {
        const mode = Math.random() < 0.5 ? 'square' : 'sqrt';
        if (mode === 'square') {
          const b = 1 + Math.floor(Math.random()*20); // 1..20
          const answer = b*b;
          const options = new Set([answer]);
          // Add two other squares from 1..20 and one near-miss
          while (options.size < 3) {
            const ob = 1 + Math.floor(Math.random()*20);
            options.add(ob*ob);
          }
          const nearMiss = answer + (Math.random()<0.5 ? -1 : 1) * (1 + Math.floor(Math.random()*4));
          options.add(nearMiss);
          return { text: `What is ${b}²?`, answer, options: Array.from(options).sort(()=>Math.random()-0.5) };
        } else {
          const b = 1 + Math.floor(Math.random()*20); // 1..20
          const n = b*b;
          const answer = b;
          const options = new Set([answer]);
          while (options.size < 4) {
            const cand = 1 + Math.floor(Math.random()*20);
            options.add(cand);
          }
          return { text: `√${n} = ?`, answer, options: Array.from(options).sort(()=>Math.random()-0.5) };
        }
      };
      const q = makeModerateQuestion();
      setQuizQ(q);
      setQuizWrong(false);
      setQuizOpen(true);
      setRunning(false);
      // start countdown 10s and ticking sound
      setQuizTimeLeft(10);
      if (quizTimerRef.current) clearInterval(quizTimerRef.current);
      quizTimerRef.current = setInterval(() => {
        setQuizTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(quizTimerRef.current); quizTimerRef.current = null; stopQuizTick();
            setMessage('Time up! No power this round');
            setQuizOpen(false);
            setRunning(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      startQuizTick();
    }, 22000);
    return () => clearInterval(timer);
  }, [running, ended, quizOpen]);

  // Cleanup quiz tick/timer when quiz closes
  useEffect(() => {
    if (!quizOpen) {
      if (quizTimerRef.current) { clearInterval(quizTimerRef.current); quizTimerRef.current = null; }
      stopQuizTick();
      setQuizWrong(false);
    }
  }, [quizOpen]);

  // Render
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    // Pixelated rendering
    ctx.imageSmoothingEnabled = false;

    const draw = () => {
      const now = Date.now();
      // Modern dark pinkish‑violet neon theme
      ctx.fillStyle = '#120515';
      ctx.fillRect(0,0,cvs.width,cvs.height);
      // neon vignette
      const grd = ctx.createRadialGradient(cvs.width/2, cvs.height/2, Math.min(cvs.width,cvs.height)/6, cvs.width/2, cvs.height/2, Math.max(cvs.width,cvs.height)/1.08);
      grd.addColorStop(0, 'rgba(236,72,153,0.20)'); // pink glow
      grd.addColorStop(1, 'rgba(0,0,0,0.60)');
      ctx.fillStyle = grd; ctx.fillRect(0,0,cvs.width,cvs.height);
      // Pixel-art maze rendering (chunky bricks + dithered floor)
      const SUB = 4; // subpixel size for chunky blocks (CELL should be multiple of SUB)
      const blocks = Math.floor(CELL / SUB);
      for (let y=0; y<MAZE.length; y++) {
        for (let x=0; x<MAZE[0].length; x++) {
          const px = x*CELL, py = y*CELL;
          if (MAZE[y][x] === 1) {
            // Wall tile: chunky bricks (pinkish‑violet shades)
            for (let by=0; by<blocks; by++) {
              for (let bx=0; bx<blocks; bx++) {
                // Brick pattern: offset every other row
                const oddRow = (by % 2) === 1;
                const shift = oddRow ? Math.floor(blocks/6) : 0;
                const colIdx = (bx + shift) % 3;
                const col = colIdx === 0 ? '#3b1747' : (colIdx === 1 ? '#451a57' : '#5a1e6d');
                ctx.fillStyle = col;
                ctx.fillRect(px + bx*SUB, py + by*SUB, SUB, SUB);
              }
            }
            // Inner highlight frame for depth (pinkish)
            ctx.fillStyle = 'rgba(244,114,182,0.20)';
            ctx.fillRect(px+SUB, py+SUB, CELL-2*SUB, SUB); // top
            ctx.fillRect(px+SUB, py+CELL-2*SUB, CELL-2*SUB, SUB); // bottom
            ctx.fillRect(px+SUB, py+SUB, SUB, CELL-2*SUB); // left
            ctx.fillRect(px+CELL-2*SUB, py+SUB, SUB, CELL-2*SUB); // right
          } else {
            // Floor tile: dark dither/checker for texture (pinkish‑violet)
            ctx.fillStyle = '#140414';
            ctx.fillRect(px, py, CELL, CELL);
            for (let by=0; by<blocks; by++) {
              for (let bx=0; bx<blocks; bx++) {
                if (((bx + by) % 2) === 0) continue; // sparse pattern
                ctx.fillStyle = (bx % 3 === 0) ? '#1a061e' : '#22082b';
                ctx.fillRect(px + bx*SUB, py + by*SUB, SUB, SUB);
              }
            }
            // Soft neon edge highlight where floor meets wall neighbors
            const up = MAZE[y-1] && MAZE[y-1][x] === 1;
            const dn = MAZE[y+1] && MAZE[y+1][x] === 1;
            const lf = MAZE[y] && MAZE[y][x-1] === 1;
            const rt = MAZE[y] && MAZE[y][x+1] === 1;
            ctx.fillStyle = 'rgba(236,72,153,0.25)';
            if (up) ctx.fillRect(px, py, CELL, SUB);
            if (dn) ctx.fillRect(px, py+CELL-SUB, CELL, SUB);
            if (lf) ctx.fillRect(px, py, SUB, CELL);
            if (rt) ctx.fillRect(px+CELL-SUB, py, SUB, CELL);
          }
        }
      }
      // pellets: identical styling, but Hint highlights perfect squares briefly
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      pelletsRef.current.forEach(pe => {
        if (pe.collected) return;
        const cx = pe.x*CELL + CELL/2;
        const cy = pe.y*CELL + CELL/2;
        const isSq = isSquare(pe.n);
        const highlight = hintOnRef.current && isSq;
        if (highlight) {
          // soft glow backdrop
          ctx.fillStyle = 'rgba(244,114,182,0.18)';
          const rad = Math.floor(CELL * 0.46);
          ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI*2); ctx.fill();
          ctx.shadowColor = '#f472b6';
          ctx.shadowBlur = 22;
        }
        ctx.fillStyle = '#f9a8d4';
        ctx.font = `bold ${Math.max(10, Math.floor(CELL*0.42))}px monospace`;
        ctx.fillText(String(pe.n), cx, cy+1);
        if (highlight) { ctx.shadowBlur = 0; }
      });
      // player (animated mouth)
      const p = playerRef.current;
      const cx = p.x*CELL + CELL/2, cy = p.y*CELL + CELL/2;
      const phase = (now % 700) / 700; // 0..1
      const mouth = 0.15 + 0.27 * (0.5 + 0.5 * Math.sin(phase * Math.PI * 2)); // animate
      let start = 0, end = Math.PI * 2;
      if (p.dir.x === 1) { start = mouth; end = Math.PI*2 - mouth; }
      if (p.dir.x === -1) { start = Math.PI + mouth; end = Math.PI - mouth; }
      if (p.dir.y === 1) { start = Math.PI/2 + mouth; end = Math.PI/2 - mouth; }
      if (p.dir.y === -1) { start = -Math.PI/2 + mouth; end = -Math.PI/2 - mouth; }
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, CELL*0.35, start, end, false);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#eab308';
      ctx.stroke();
      // ghosts (bobbing + leg wobble + pupils follow dir)
      ghostsRef.current.forEach(g => {
        const bob = Math.sin((now/220) + (g.x*0.7 + g.y*0.9)) * 2;
        const x = g.x*CELL + CELL/2; const y = g.y*CELL + CELL/2 + bob;
        const frightened = now < powerUntilRef.current;
        ctx.fillStyle = frightened ? '#3b82f6' : '#ef4444';
        // ghost body top
        ctx.beginPath();
        ctx.arc(x, y-4, CELL*0.30, Math.PI, 0);
        ctx.lineTo(x+CELL*0.30, y+CELL*0.24);
        // leg wobble pattern
        const legs = 4;
        const legW = (CELL*0.60)/legs;
        const t = (Math.floor(now/180) % 2);
        for (let i=legs-1; i>=0; i--) {
          const offset = ((i + t) % 2) ? 4 : 0;
          const lx = x - CELL*0.30 + i*legW;
          ctx.lineTo(lx + legW*0.5, y+CELL*0.24 + offset);
        }
        ctx.lineTo(x-CELL*0.30, y+CELL*0.24);
        ctx.closePath();
        ctx.fill();
        // eyes and pupils
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(x-6, y-6, 4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(x+6, y-6, 4, 0, Math.PI*2); ctx.fill();
        const dir = g.dir || {x:1,y:0};
        const pxOff = Math.max(-2, Math.min(2, dir.x*2));
        const pyOff = Math.max(-2, Math.min(2, dir.y*2));
        ctx.fillStyle = frightened ? '#1e3a8a' : '#0f172a';
        ctx.beginPath(); ctx.arc(x-6+pxOff, y-6+pyOff, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(x+6+pxOff, y-6+pyOff, 2, 0, Math.PI*2); ctx.fill();
        // mouth
        ctx.fillStyle = frightened ? '#1e3a8a' : '#111827';
        ctx.fillRect(x-8, y+6, 16, 4);
      });

      // spawn ripples
      spawnRipplesRef.current = spawnRipplesRef.current.filter(r => r.until > now);
      spawnRipplesRef.current.forEach(r => {
        const t = 1 - (r.until - now) / 600;
        const rad = CELL * (0.4 + t * 0.8);
        ctx.strokeStyle = `rgba(124,58,237,${0.8 - t})`;
        ctx.beginPath();
        ctx.arc(r.x*CELL + CELL/2, r.y*CELL + CELL/2, rad, 0, Math.PI*2);
        ctx.stroke();
      });

      // death bursts
      deathBurstsRef.current = deathBurstsRef.current.filter(b => b.until > now);
      deathBurstsRef.current.forEach(b => {
        const t = 1 - (b.until - now) / 600;
        for (let i=0;i<6;i++) {
          const ang = (Math.PI*2/6)*i;
          const ex = b.x*CELL + CELL/2 + Math.cos(ang)*t*CELL*0.6;
          const ey = b.y*CELL + CELL/2 + Math.sin(ang)*t*CELL*0.6;
          ctx.fillStyle = `rgba(250,204,21,${1-t})`;
          ctx.beginPath(); ctx.arc(ex, ey, 3*(1-t), 0, Math.PI*2); ctx.fill();
        }
      });
    };

    const raf = () => {
      draw();
      if (!ended) requestAnimationFrame(raf);
      else draw();
    };
    requestAnimationFrame(raf);
  }, [ended]);

  // Music reacts to game state
  useEffect(() => {
    const now = Date.now();
    const powerActive = now < powerUntilRef.current;
    if (ended || quizOpen) {
      stopMusic();
      return;
    }
    if (!running) {
      stopMusic();
      return;
    }
    // Start or switch mode based on power state
    const desiredMode = powerActive ? 'power' : (now < postModeUntilRef.current ? 'post' : 'normal');
    startMusic(desiredMode);
  }, [running, ended, quizOpen, powerTick, muted]);

  // Save leaderboard on end (optional) — only if Supabase is configured
  useEffect(() => {
    const canSubmitLeaderboard = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
    if (!ended || !supabase || !canSubmitLeaderboard) return;
    const profile = JSON.parse(localStorage.getItem('gamify_profile') || '{}');
    const name = profile.name || 'Player';
    (async () => {
      try {
        await supabase.from('leaderboard_squares').insert({ name, score, created_at: new Date().toISOString() });
      } catch (e) {
        // ignore silently if table missing or credentials invalid
      }
    })();
  }, [ended, score]);

  const reset = () => window.location.reload();

  const neededSquaresCollected = useMemo(() => collectedSquares.sort((a,b)=>a-b), [collectedSquares]);

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
        <div style={{ color: '#6b21a8', fontWeight: 600 }}>Controls: Arrow Keys or W A S D · Hint: H</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontWeight: 800, color: '#3b0764' }}>Score: {score}</div>
          <button
            className="btn"
            onClick={() => {
              setMuted(m => {
                const next = !m;
                if (next) { stopMusic(); } else { setPowerTick(t => (t + 1) % 1000); }
                return next;
              });
            }}
            style={{ background: muted ? '#64748b' : '#0ea5e9', padding: '6px 10px' }}
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? 'Unmute 🔊' : 'Mute 🔇'}
          </button>
        </div>
        <div style={{ color: '#6b21a8' }}>{message}</div>
      </div>
      <div style={{ background: '#1f1640', padding: 8, borderRadius: 12, boxShadow: '0 10px 30px rgba(124,58,237,0.25)', display: 'inline-block', position: 'relative' }}>
        {/* Power-mode timer bar */}
        {Date.now() < powerUntilRef.current && (
          <div style={{ position: 'absolute', top: 4, left: 8, right: 8, height: 8, background: '#3f3f46', borderRadius: 999 }}>
            <div style={{
              width: `${Math.max(0, Math.min(100, ((powerUntilRef.current - Date.now())/POWER_DURATION_MS)*100))}%`,
              height: '100%',
              background: 'linear-gradient(90deg,#60a5fa,#a78bfa)',
              borderRadius: 999,
              transition: 'width 100ms linear'
            }} />
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={MAZE[0].length*CELL}
          height={MAZE.length*CELL}
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Hint button overlay (top-right) */}
        {!quizOpen && !ended && running && (
          <button
            onClick={() => {
              if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
              setHintOn(true);
              hintTimerRef.current = setTimeout(() => setHintOn(false), 3500);
            }}
            className="btn"
            style={{ position: 'absolute', top: 12, right: 12, background: hintOn ? '#22c55e' : '#7c3aed', padding: '8px 10px' }}
            title="Show Hint (H)"
          >
            {hintOn ? 'Hint ✓' : 'Hint'}
          </button>
        )}

        {quizOpen && quizQ && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)' }}>
            <div className="card" style={{ background: '#1e1230', maxWidth: 520, border: `3px solid ${quizWrong ? '#ef4444' : '#ec4899'}`, borderRadius: 8, boxShadow: '0 0 0 4px #3b1747 inset' }}>
              <h3 style={{ marginTop: 0, color: '#f9a8d4', fontFamily: 'monospace', letterSpacing: 1.5, textTransform: 'uppercase' }}>Power Round</h3>
              <p style={{ color: '#fde2f4', fontFamily: 'monospace' }}>{quizQ.text}</p>
              <div style={{ color: '#f9a8d4', fontFamily: 'monospace', marginBottom: 6 }}>Time: {quizTimeLeft}s</div>
              <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(2,minmax(0,1fr))' }}>
                {quizQ.options.map((opt, i) => (
                  <button key={i} className="btn" style={{ background: '#ec4899', borderRadius: 0, boxShadow: '0 0 0 3px #3b1747 inset' }} onClick={() => {
                    if (opt === quizQ.answer) {
                      const start = Date.now();
                      const until = start + POWER_DURATION_MS;
                      powerUntilRef.current = until;
                      setMessage('Power! Eat ghosts for a while');
                      // Switch to power music immediately
                      setPowerTick(t => (t + 1) % 1000);
                      // After power ends, enable a short post-power music window
                      setTimeout(() => {
                        postModeUntilRef.current = Date.now() + 5000; // 5s cooldown tune
                        setPowerTick(t => (t + 1) % 1000); // trigger mode update
                      }, POWER_DURATION_MS + 20);
                    } else {
                      setQuizWrong(true);
                      sfx.quizWrong();
                      setMessage('Not quite. Keep going!');
                    }
                    // stop tick + timer
                    if (quizTimerRef.current) { clearInterval(quizTimerRef.current); quizTimerRef.current = null; }
                    stopQuizTick();
                    // Close immediately if correct; brief feedback if wrong
                    if (opt === quizQ.answer) {
                      setQuizOpen(false);
                      setRunning(true);
                    } else {
                      setTimeout(() => { setQuizOpen(false); setRunning(true); }, 800);
                    }
                  }}>{opt}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Rules overlay before start */}
        {!running && !ended && !quizOpen && showRules && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,0,25,0.6)' }}>
            <div className="card" style={{ background: '#1b0d24', border: '3px solid #ec4899', color: '#fde2f4', maxWidth: 600, borderRadius: 8, boxShadow: '0 0 0 4px #3b1747 inset' }}>
              <h2 style={{ marginTop: 0, fontFamily: 'monospace', letterSpacing: 2, textTransform: 'uppercase' }}>Pac‑Squares</h2>
              <ul style={{ lineHeight: 1.6, fontFamily: 'monospace' }}>
                <li>Eat only perfect squares (1, 4, 9, 16, …, 100) to score big.</li>
                <li>Avoid non-squares (penalty) — unless you have Power!</li>
                <li>Answer pop‑quiz correctly to gain Power (chomp ghosts!).</li>
                <li>Ghosts roam randomly — stay sharp and plan paths.</li>
                <li>Controls: Arrow Keys / W A S D · Hint: H · Pause: P</li>
              </ul>
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button className="btn" style={{ background: '#ec4899', borderRadius: 0, boxShadow: '0 0 0 3px #3b1747 inset' }} onClick={() => { setShowRules(false); setRunning(true); try { ensureAudio(); } catch {}; }}>Start Game</button>
                <button className="btn" style={{ background: '#f472b6', borderRadius: 0, boxShadow: '0 0 0 3px #3b1747 inset' }} onClick={() => { if (hintTimerRef.current) clearTimeout(hintTimerRef.current); setHintOn(true); hintTimerRef.current = setTimeout(() => setHintOn(false), 3500); }}>Hint</button>
              </div>
            </div>
          </div>
        )}

        {/* Win/Lose overlay */}
        {ended && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)' }}>
            <div className="card" style={{ background: '#1e1230', color: '#fde2f4', maxWidth: 600, border: '3px solid #ec4899', borderRadius: 8, boxShadow: '0 0 0 4px #3b1747 inset' }}>
              <h2 style={{ marginTop: 0, fontFamily: 'monospace', letterSpacing: 2, textTransform: 'uppercase' }}>{win ? 'You Win!' : 'Game Over'}</h2>
              <p style={{ marginTop: -6, opacity: 0.95, fontFamily: 'monospace' }}>{win ? 'Squares mastered! Ghosts tamed. Math power unlocked!' : 'Ghosts got you — the grid awaits your comeback.'}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                <span style={{ background: '#3b1747', padding: '6px 10px', borderRadius: 0, boxShadow: '0 0 0 3px #ec4899 inset' }}>Final Score: <b>{score}</b></span>
                <span style={{ background: '#3b1747', padding: '6px 10px', borderRadius: 0, boxShadow: '0 0 0 3px #ec4899 inset' }}>Squares Collected: <b>{collectedSquares.length}</b></span>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button className="btn" style={{ background: '#ec4899', borderRadius: 0, boxShadow: '0 0 0 3px #3b1747 inset' }} onClick={() => window.location.reload()}>Play Again</button>
                <a className="btn" style={{ background: '#f472b6', borderRadius: 0, boxShadow: '0 0 0 3px #3b1747 inset' }} href="/lesson/math">Back to Maths</a>
              </div>
            </div>
          </div>
        )}
      </div>

      {!running && !ended && !quizOpen && (
        <div className="card" style={{ marginTop: 12, textAlign:'center', background:'#1b1233', color:'#fde2f4', border:'none', boxShadow:'none', borderRadius:8, padding:12 }}>
          <h3 style={{ marginTop: 0 }}>Ready?</h3>
          <p>Move with Arrow Keys / W A S D. Numbers auto-collect; avoid non-squares. Press P to pause.</p>
          <button className="btn" style={{ background: '#7c3aed', color:'#ffffff', border:'none', borderRadius:6, boxShadow:'0 0 0 3px #3b1747 inset', padding:'8px 12px' }} onClick={() => setRunning(true)}>Start Game</button>
        </div>
      )}

      {ended && (
        <div className="card" style={{ marginTop: 12, textAlign: 'left', background:'#1b1233', color:'#fde2f4', border:'none', boxShadow:'none', borderRadius:8, padding:12 }}>
          <h3 style={{ marginTop: 0, marginBottom: 6, fontFamily:'monospace', letterSpacing:1, textShadow:'1px 1px 0 #000' }}>{win ? 'Report Card · You Win!' : 'Report Card · Game Over'}</h3>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <span style={{ background:'#3b1747', padding:'6px 10px', borderRadius:6 }}>Final Score: <b>{score}</b></span>
            <span style={{ background:'#3b1747', padding:'6px 10px', borderRadius:6 }}>Squares Collected: <b>{collectedSquares.length}</b></span>
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ fontWeight:600, marginBottom:6 }}>Perfect Squares</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {neededSquaresCollected.length ? neededSquaresCollected.map((n,i)=> (
                <span key={i} style={{ display:'inline-block', padding:'4px 8px', borderRadius:6, background:'#2a1835', color:'#e9d5ff' }}>{n} ✓</span>
              )) : <span style={{ opacity:0.8 }}>None</span>}
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <button className="btn" style={{ background:'#7c3aed', borderRadius:0, boxShadow:'0 0 0 3px #3b1747 inset' }} onClick={reset}>Play Again</button>
          </div>
        </div>
      )}
    </div>
  );
}
