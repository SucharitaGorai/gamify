 
import React, { useEffect, useMemo, useRef, useState } from "react";
import { loadLocalProgress, saveLocalProgress, enqueueSync } from '../stores/localProgress';
import PacSquaresGame from '../components/PacSquaresGame';
import SquareRootMonsterBattle from '../components/SquareRootMonsterBattle';

// Reusable Quiz component (single-attempt per concept)
function Quiz({ questions, conceptKey, onComplete }) {
  const [responses, setResponses] = useState(Array(questions.length).fill(null));
  const [showScore, setShowScore] = useState(false);
  const [quizAttempted, setQuizAttempted] = useState(false);
  const [sparks, setSparks] = useState([]); // pixel confetti
  const profile = JSON.parse(localStorage.getItem('gamify_profile') || '{}');
  const studentId = profile.id || 'local_demo';

  // simple WebAudio beep
  const audioRef = useRef(null);
  const ensureAudio = () => { if (!audioRef.current) { try { audioRef.current = new (window.AudioContext||window.webkitAudioContext)(); } catch{} } };
  const beep = (f=440, d=0.1, type='square', g=0.08) => { const ctx=audioRef.current; if(!ctx) return; const now=ctx.currentTime; const osc=ctx.createOscillator(); const ga=ctx.createGain(); osc.type=type; osc.frequency.value=f; ga.gain.value=g; osc.connect(ga); ga.connect(ctx.destination); osc.start(now); osc.stop(now+d); };
  const sfxCorrect = ()=>{ ensureAudio(); beep(520,0.08,'square',0.06); setTimeout(()=>beep(660,0.08,'square',0.06),80); };
  const sfxWrong = ()=>{ ensureAudio(); beep(200,0.10,'sawtooth',0.06); };
  const sfxSubmit = ()=>{ ensureAudio(); beep(360,0.08,'triangle',0.05); };

  const THEME = useMemo(()=>({ card:'#0f0a1f', ink:'#e9d5ff', accent:'#7c3aed', panel:'#1b1233', good:'#22c55e', bad:'#f43f5e' }),[]);

  useEffect(() => {
    const local = loadLocalProgress();
    const existing = local[studentId] || { results: [] };
    const hasAttempted = existing.results.some(r => r.topic === `math_ch6_${conceptKey}`);
    setQuizAttempted(hasAttempted);
  }, [conceptKey, studentId]);

  const score = responses.filter((r, i) => r === questions[i].answer).length;

  const handleSubmit = () => {
    if (quizAttempted) return;
    sfxSubmit();
    setShowScore(true);
    const finalScore = responses.filter((r, i) => r === questions[i].answer).length;
    const totalQ = questions.length;
    const pointsEarned = finalScore * 5;

    const profile = JSON.parse(localStorage.getItem('gamify_profile') || '{}');
    const pid = profile.id || 'local_demo';
    const local = loadLocalProgress();
    const existing = local[pid] || { name: profile.name || 'Demo', results: [], points: 0 };

    if (!existing.results.some(r => r.topic === `math_ch6_${conceptKey}`)) {
      existing.results.push({ topic: `math_ch6_${conceptKey}`, score: finalScore, total: totalQ, timestamp: new Date().toISOString() });
      existing.points = (existing.points || 0) + pointsEarned;
      saveLocalProgress(pid, existing);
      enqueueSync({ student_id: pid, topic: `math_ch6_${conceptKey}`, score: finalScore, timestamp: new Date().toISOString(), total: totalQ });
      onComplete(conceptKey, pointsEarned);
      setQuizAttempted(true);
      // burst pixel confetti
      const now = Date.now();
      const burst = Array.from({length: 14}).map((_,i)=>({ id: now+i, x: 50, y: 0, ang: (Math.PI*2)*i/14, t: 0 }));
      setSparks(burst);
      setTimeout(()=> setSparks([]), 800);
    }
  };

  return (
    <div style={{ background: THEME.panel, padding: 12, margin: "14px 0", borderRadius: 8, border:`3px solid ${THEME.accent}`, boxShadow:'0 0 0 4px #3b1747 inset', color: THEME.ink, position:'relative' }}>
      <h3 style={{ marginTop:0, marginBottom:8, fontFamily:'monospace', letterSpacing:1, textShadow:'1px 1px 0 #000' }}>Quiz (One Try)</h3>
      {questions.map((q, i) => (
        <div key={i} style={{ padding: "6px 0" }}>
          <div style={{ marginBottom:6 }}>{q.q}</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {q.options.map((opt, j) => (
              <button key={j}
                onClick={() => {
                  if (quizAttempted) return;
                  const next = responses.slice(); next[i] = j; setResponses(next);
                  if (j === q.answer) sfxCorrect(); else sfxWrong();
                }}
                disabled={quizAttempted}
                className="btn"
                style={{ background: responses[i]===j ? THEME.accent : '#2a1744', color: THEME.ink, borderRadius:0, boxShadow:'0 0 0 3px #3b1747 inset', opacity: quizAttempted?0.6:1 }}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button onClick={handleSubmit} disabled={quizAttempted} className="btn" style={{ marginTop: 10, opacity: quizAttempted ? 0.6 : 1, background: THEME.accent, borderRadius:0, boxShadow:'0 0 0 3px #3b1747 inset' }}>
        {quizAttempted ? 'Quiz Completed' : 'Submit'}
      </button>
      {showScore && (
        <div style={{ marginTop: 10, fontWeight: 'bold', color: score === questions.length ? THEME.good : THEME.bad }}>
          Score: {score} / {questions.length}
        </div>
      )}
      {/* pixel confetti */}
      {sparks.length>0 && (
        <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
          {sparks.map(s=>{
            const k = (Date.now()-s.id)/800; const t = Math.max(0, Math.min(1,k));
            const x = 50 + Math.cos(s.ang)*(t*40);
            const y = 40 + Math.sin(s.ang)*(t*24) + t*10;
            const a = 1-t;
            return <div key={s.id+"-sp"} style={{ position:'absolute', left:`${x}%`, top:`${y}%`, width:6, height:6, background:'#facc15', opacity:a }} />
          })}
        </div>
      )}
    </div>
  );
}

// Observe and reveal elements on scroll
useEffectRevealSections();

function useEffectRevealSections(){
  // Hook outside component scope to avoid re-creating per render: uses document-level observer
  const hasWindow = typeof window !== 'undefined';
  if (!hasWindow) return;
  const already = window.__msRevealObserver;
  if (already) {
    // attach to any new nodes if present
    queueMicrotask(() => {
      document.querySelectorAll('[data-reveal].reveal:not(.show)').forEach(el=> already.observe(el));
    });
    return;
  }
  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if (e.isIntersecting) { e.target.classList.add('show'); obs.unobserve(e.target); } });
  }, { threshold: 0.12 });
  window.__msRevealObserver = obs;
  queueMicrotask(() => {
    document.querySelectorAll('[data-reveal].reveal').forEach(el=> obs.observe(el));
  });
}

// Simple activity component (retryable)
function Activity({ description, prompt, check }) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState('');
  const [msg, setMsg] = useState('');
  return (
    <div style={{ background: '#1b1233', padding: 12, margin: '14px 0', borderRadius: 8, border:'3px solid #7c3aed', boxShadow:'0 0 0 4px #3b1747 inset', color:'#e9d5ff' }}>
      <h3 style={{ marginTop:0, marginBottom:6, fontFamily:'monospace', letterSpacing:1, textShadow:'1px 1px 0 #000' }}>Activity (Practice)</h3>
      <div>{description}</div>
      <button className="btn" style={{ marginTop: 8, background:'#7c3aed', borderRadius:0, boxShadow:'0 0 0 3px #3b1747 inset' }} onClick={() => setOpen(!open)}>{open ? 'Hide' : 'Try'}</button>
      {open && (
        <div style={{ marginTop: 8 }}>
          <div style={{ marginBottom:6 }}>{prompt}</div>
          <input value={val} onChange={e => setVal(e.target.value)} style={{ marginRight: 8, padding:6, border:'2px solid #3b1747', background:'#0f0a1f', color:'#e9d5ff' }} />
          <button className="btn" style={{ background:'#22c55e', borderRadius:0, boxShadow:'0 0 0 3px #3b1747 inset' }} onClick={() => setMsg(check(val))}>Check</button>
          <div style={{ marginTop: 8, fontWeight: 600 }}>{msg}</div>
        </div>
      )}
    </div>
  );
}

// Fun interactive intro module placed at the top
function IntroModule({ THEME, studentId, onAwardPoints }) {
  const [step, setStep] = useState(0);
  const [n, setN] = useState(5);
  const [choice1, setChoice1] = useState(null);
  const [choice2, setChoice2] = useState(null);
  const [done, setDone] = useState(false);
  const [sparks, setSparks] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);
  // Animation states
  const [scene, setScene] = useState('square'); // 'square' | 'sqrt'
  const [animPlaying, setAnimPlaying] = useState(true);
  const [animT, setAnimT] = useState(0); // 0..1 timeline
  const [xVal, setXVal] = useState(50); // for sqrt scene
  const animRef = useRef({ rid:0, last:0, scrubbing:false });
  const animCanvasRef = useRef(null);
  // WebAudio SFX (lightweight, no deps)
  const audioRef = useRef(null);
  const [muted, setMuted] = useState(() => { try { return localStorage.getItem('squares_muted') === '1'; } catch { return false; } });
  useEffect(() => { try { localStorage.setItem('squares_muted', muted ? '1' : '0'); } catch {} }, [muted]);
  const ensureAudio = () => { if (!audioRef.current) { try { audioRef.current = new (window.AudioContext||window.webkitAudioContext)(); } catch{} } return audioRef.current; };
  const beep = (f=440, d=0.1, type='square', vol=0.07) => { const ctx = audioRef.current; if(!ctx) return; const now = ctx.currentTime; const o = ctx.createOscillator(); const g = ctx.createGain(); o.type=type; try{ o.frequency.setValueAtTime(f, now);}catch{} g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(vol, now+0.01); g.gain.exponentialRampToValueAtTime(0.0001, now+d); o.connect(g).connect(ctx.destination); o.start(now); o.stop(now+d+0.02); };
  const sfxClick = ()=>{ if (muted) return; ensureAudio(); beep(360,0.08,'triangle',0.05); };
  const sfxCorrect = ()=>{ if (muted) return; ensureAudio(); beep(560,0.08,'square',0.06); setTimeout(()=>beep(720,0.08,'square',0.06),90); };
  const sfxWrong = ()=>{ if (muted) return; ensureAudio(); beep(200,0.12,'sawtooth',0.07); };
  const sfxBonus = ()=>{ if (muted) return; ensureAudio(); beep(660,0.09,'square',0.07); setTimeout(()=>beep(990,0.12,'square',0.07),110); };
  const sfxTick = ()=>{ if (muted) return; ensureAudio(); beep(420,0.05,'triangle',0.045); };
  const lastTickRef = useRef(0);
  const playTickThrottled = () => { const now = Date.now(); if (now - lastTickRef.current > 90) { lastTickRef.current = now; sfxTick(); } };
  // Typing tick (separate throttle to allow both slider + typing without conflict)
  const lastTypeRef = useRef(0);
  const playTypeTickThrottled = () => { const now = Date.now(); if (now - lastTypeRef.current > 75) { lastTypeRef.current = now; sfxTick(); } };
  const burstConfetti = (count=18) => {
    const now = Date.now();
    const burst = Array.from({length: count}).map((_,i)=>({ id: now+i, x: 50, y: 0, ang: (Math.PI*2)*i/count }));
    setSparks(burst);
    setTimeout(()=> setSparks([]), 900);
  };
  // Proactively unlock audio context on first user gesture
  useEffect(() => {
    const onFirst = () => { try { ensureAudio(); if (audioRef.current && audioRef.current.state === 'suspended') audioRef.current.resume(); } catch {} window.removeEventListener('pointerdown', onFirst); };
    window.addEventListener('pointerdown', onFirst, { once: true });
    return () => window.removeEventListener('pointerdown', onFirst);
  }, []);
  // Extra fun + tricks
  const [kOdd, setKOdd] = useState(4);
  const [factIdx, setFactIdx] = useState(0);
  const facts = [
    'Sum of first n odd numbers = n² (1+3+5+... = n²)',
    'Perfect squares end with 0,1,4,5,6,9 only',
    '(n+1)² = n² + 2n + 1 (use to go from 20² to 21²)',
    '(a+b)² = a² + 2ab + b² (mental math trick)',
    'If a number has 2,3,7 or 8 at the end, it cannot be a perfect square'
  ];
  // Section 1: Squares mini-game (1..15)
  const [sqAnswers, setSqAnswers] = useState(Array(15).fill(''));
  const [sqStart, setSqStart] = useState(0);
  const [sqEnd, setSqEnd] = useState(0);
  const [sqShowRes, setSqShowRes] = useState(false);
  const startSquaresRace = () => { sfxClick(); setSqStart(Date.now()); setSqEnd(0); setSqShowRes(false); setSqAnswers(Array(15).fill('')); };
  const endSquaresRace = () => { sfxClick(); setSqEnd(Date.now()); setSqShowRes(true); };
  const sqCorrect = sqAnswers.reduce((acc, v, i) => acc + ((v.trim() === String((i+1)*(i+1))) ? 1 : 0), 0);

  // Load current total points for display
  useEffect(() => {
    const local = loadLocalProgress();
    const existing = local[studentId] || { points: 0 };
    setTotalPoints(existing.points || 0);
  }, [studentId]);

  // Section 2: Properties classifier
  const [propNum, setPropNum] = useState(16);
  const [propMsg, setPropMsg] = useState('');
  const newPropNum = () => { sfxClick(); const n = Math.floor(Math.random()*160)+1; setPropNum(n); setPropMsg(''); };
  const isPerfectSquare = (x) => { const r = Math.floor(Math.sqrt(x)); return r*r === x; };
  const classify = (ans) => { const truth = isPerfectSquare(propNum); if (ans===truth) sfxCorrect(); else sfxWrong(); setPropMsg(ans===truth ? '✅ Correct!' : `❌ Not quite. ${propNum} ${truth? 'is' : 'is not'} a perfect square.`); };

  // Section 3: Square Root Treasure Hunt
  // Fix: Precompute and store stable options per card so they don't reshuffle on every render
  const shuffleArr = (arr) => arr.map(v => ({ v, r: Math.random() }))
    .sort((a,b) => a.r - b.r).map(o => o.v);
  const [cards, setCards] = useState(() => {
    const base = [36, 64, 100];
    return base.map(n => ({
      n,
      solved: false,
      opts: shuffleArr([Math.sqrt(n), Math.sqrt(n)+1, Math.sqrt(n)-1])
    }));
  });
  const solveCard = (n, pick) => {
    const ok = Math.sqrt(n)===pick;
    setCards(cs => cs.map(c => c.n===n ? { ...c, solved: ok? true : c.solved } : c));
  };

  // Section 4: Special property (diff of consecutive squares)
  const [consecN, setConsecN] = useState(5);
  const [raceN, setRaceN] = useState(7);
  const [raceAns, setRaceAns] = useState('');
  const [raceMsg, setRaceMsg] = useState('');
  const shuffleRace = () => { const k = Math.floor(Math.random()*15)+2; setRaceN(k); setRaceAns(''); setRaceMsg(''); };
  const checkRace = () => { const left = raceN*raceN - (raceN-1)*(raceN-1); const right = raceN + (raceN-1); setRaceMsg(left===right && String(left)===raceAns.trim() ? '✅ Correct!' : `❌ Answer: ${left} (also equals ${right})`); };

  // Section 5: Pythagorean triplets
  const [mVal, setMVal] = useState(2);
  const [triplets, setTriplets] = useState([]);
  const tripletFor = (m)=> [m*m-1, 2*m, m*m+1];
  const addTriplet = ()=> setTriplets(ts => [...ts, tripletFor(mVal)]);

  // Section 6: Real-life calculators
  const [parkArea, setParkArea] = useState(10000);
  const [roomTiles, setRoomTiles] = useState(225);
  const [triA, setTriA] = useState(3);
  const [triB, setTriB] = useState(4);

  // Section 7: Challenge zone
  const [ch1, setCh1] = useState('');
  const [ch2, setCh2] = useState('');
  const [ch3, setCh3] = useState('');
  const [ch4, setCh4] = useState('');
  const [ch5, setCh5] = useState('');
  const [speedVal, setSpeedVal] = useState('');
  const [speedQ, setSpeedQ] = useState({ q:'What is 25²?', a:'625' });
  const speedBank = [
    { q:'What is 25²?', a:'625' },
    { q:'What is √196?', a:'14' },
    { q:'Between which integers does √50 lie? (type 7-8)', a:'7-8' },
    { q:'What is 12²?', a:'144' },
    { q:'What is √121?', a:'11' }
  ];

  // Award only once (persisted in local progress)
  useEffect(() => {
    const local = loadLocalProgress();
    const existing = local[studentId] || { results: [] };
    const has = (existing.results || []).some(r => r.topic === 'math_ch6_intro');
    setDone(has);
  }, [studentId]);

  const completeIntro = () => {
    if (done) return;
    const local = loadLocalProgress();
    const existing = local[studentId] || { name: 'Demo', results: [], points: 0 };
    if (!(existing.results || []).some(r => r.topic === 'math_ch6_intro')) {
      const award = 10; // intro bonus
      existing.results = [...(existing.results || []), { topic: 'math_ch6_intro', score: 1, total: 1, timestamp: new Date().toISOString() }];
      existing.points = (existing.points || 0) + award;
      saveLocalProgress(studentId, existing);
      enqueueSync({ student_id: studentId, topic: 'math_ch6_intro', score: 1, total: 1, timestamp: new Date().toISOString() });
      onAwardPoints(award);
      sfxBonus();
      setDone(true);
      setTotalPoints(existing.points || 0);
      const now = Date.now();
      const burst = Array.from({length: 16}).map((_,i)=>({ id: now+i, x: 50, y: 0, ang: (Math.PI*2)*i/16 }));
      setSparks(burst);
      setTimeout(()=> setSparks([]), 900);
    }
  };

  // Small grid renderer for n^2 visualization
  const gridRef = useRef(null);
  // Two canvases for side-by-side interactive animations
  const squareCanvasRef = useRef(null);
  const sqrtCanvasRef = useRef(null);
  useEffect(() => {
    const cvs = gridRef.current; if (!cvs) return;
    const size = 160;
    cvs.width = size; cvs.height = size;
    const ctx = cvs.getContext('2d');
    ctx.fillStyle = THEME.card; ctx.fillRect(0,0,size,size);
    const cells = n;
    const cell = Math.floor(size / cells);
    for (let y=0; y<cells; y++) {
      for (let x=0; x<cells; x++) {
        ctx.fillStyle = (x+y)%2===0 ? '#2a1744' : '#24123e';
        ctx.fillRect(x*cell, y*cell, cell-1, cell-1);
      }
    }
    // outline
    ctx.strokeStyle = THEME.accent; ctx.lineWidth = 2; ctx.strokeRect(1,1,size-2,size-2);
  }, [n, THEME.card, THEME.accent]);

  // Interactive animation renderer
  useEffect(() => {
    const cvsSquare = squareCanvasRef.current;
    const cvsSqrt = sqrtCanvasRef.current;
    if (!cvsSquare || !cvsSqrt) return;
    const ctxSquare = cvsSquare.getContext('2d');
    const ctxSqrt = cvsSqrt.getContext('2d');
    let rid;
    const W = 360, H = 200;
    cvsSquare.width = W; cvsSquare.height = H;
    cvsSqrt.width = W; cvsSqrt.height = H;

    const drawSquareScene = (t) => {
      // background
      const ctx = ctxSquare; if (!ctx) return;
      const W = cvsSquare.width || Math.max(1, Math.floor(cvsSquare.clientWidth * (window.devicePixelRatio||1)));
      const H = cvsSquare.height || Math.max(1, Math.floor(cvsSquare.clientHeight * (window.devicePixelRatio||1)));
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle = '#0b0720'; ctx.fillRect(0,0,W,H);
      // title
      ctx.fillStyle = THEME.ink; ctx.font = 'bold 14px monospace'; ctx.fillText('Square Growth (n×n)', 12, 18);
      // compute grid area
      const size = Math.min(W*0.6, H*0.7);
      const cell = Math.max(6, Math.floor(size / n));
      const gridSize = cell * n;
      const gx = 16; const gy = 28;
      // grid lines (high contrast)
      ctx.strokeStyle = '#f0abfc'; ctx.lineWidth = 1;
      for (let i=0;i<=n;i++) {
        ctx.beginPath(); ctx.moveTo(gx, gy + i*cell); ctx.lineTo(gx + gridSize, gy + i*cell); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(gx + i*cell, gy); ctx.lineTo(gx + i*cell, gy + gridSize); ctx.stroke();
      }
      // outer outline for visibility even when t=0
      ctx.strokeStyle = THEME.accent; ctx.lineWidth = 2; ctx.strokeRect(gx-1, gy-1, gridSize+2, gridSize+2);
      // progressive fill cells with contrasting palette
      const cellsToFill = Math.floor(t * n * n);
      for (let k=0;k<cellsToFill;k++) {
        const r = Math.floor(k / n);
        const c = k % n;
        // alternating bright pink/violet for contrast
        ctx.fillStyle = (r+c)%2===0 ? '#ff5cdf' : '#a78bfa';
        ctx.fillRect(gx + c*cell + 1, gy + r*cell + 1, cell-2, cell-2);
      }
      // legend
      ctx.fillStyle = THEME.ink; ctx.font = '12px monospace';
      ctx.fillText(`n = ${n}`, gx + gridSize + 18, gy + 14);
      ctx.fillText(`n² = ${n*n}`, gx + gridSize + 18, gy + 32);
      ctx.fillText(`filled ~ ${Math.round(t*100)}%`, gx + gridSize + 18, gy + 50);
    };

    const drawSqrtScene = () => {
      const ctx = ctxSqrt; if (!ctx) return;
      const W = cvsSqrt.width || Math.max(1, Math.floor(cvsSqrt.clientWidth * (window.devicePixelRatio||1)));
      const H = cvsSqrt.height || Math.max(1, Math.floor(cvsSqrt.clientHeight * (window.devicePixelRatio||1)));
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle = '#0f0a1f'; ctx.fillRect(0,0,W,H);
      ctx.fillStyle = THEME.ink; ctx.font = 'bold 14px monospace'; ctx.fillText('Locate √x on the number line', 12, 18);
      // find k such that k^2 <= x < (k+1)^2
      const x = xVal; const k = Math.floor(Math.sqrt(x)); const a = k*k; const b = (k+1)*(k+1);
      // number line
      const L = 300; const ox = 30; const oy = 120;
      ctx.strokeStyle = THEME.accent; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox+L, oy); ctx.stroke();
      // tick marks for k and k+1
      const tx1 = ox + (L*0.2); const tx2 = ox + (L*0.8);
      ctx.strokeStyle = '#a78bfa';
      ctx.beginPath(); ctx.moveTo(tx1, oy-8); ctx.lineTo(tx1, oy+8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(tx2, oy-8); ctx.lineTo(tx2, oy+8); ctx.stroke();
      ctx.fillStyle = THEME.sub; ctx.font = '12px monospace';
      ctx.fillText(`${k}²=${a}`, tx1-18, oy+24);
      ctx.fillText(`${k+1}²=${b}`, tx2-24, oy+24);
      // place √x between ticks
      const t = (x - a) / (b - a);
      const px = tx1 + (tx2 - tx1) * Math.max(0, Math.min(1, t));
      ctx.fillStyle = '#22c55e'; ctx.beginPath(); ctx.arc(px, oy, 6, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = THEME.ink; ctx.fillText(`√${x} ≈ ${Math.sqrt(x).toFixed(2)}`, px-28, oy-12);
    };

    const loop = (now) => {
      if (!animRef.current.last) animRef.current.last = now;
      const dt = Math.min(33, now - animRef.current.last);
      animRef.current.last = now;
      let t = animT;
      if (animPlaying) {
        t += dt/3000; // 3s loop
        if (t>1) t = 0;
        setAnimT(t);
      }
      drawSquareScene(t);
      drawSqrtScene();
      rid = requestAnimationFrame(loop);
      animRef.current.rid = rid;
    };
    rid = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rid);
  }, [animPlaying, animT, xVal, n, THEME.ink, THEME.sub, THEME.accent]);

  // Fit both canvases to CSS box
  useEffect(() => {
    const doFit = (cvs) => {
      if (!cvs) return;
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.floor(cvs.clientWidth * dpr));
      const h = Math.max(1, Math.floor(cvs.clientHeight * dpr));
      if (cvs.width !== w) cvs.width = w;
      if (cvs.height !== h) cvs.height = h;
    };
    const sq = squareCanvasRef.current;
    const sr = sqrtCanvasRef.current;
    doFit(sq); doFit(sr);
    const ro = new ResizeObserver(() => { doFit(squareCanvasRef.current); doFit(sqrtCanvasRef.current); });
    try { if (sq) ro.observe(sq); if (sr) ro.observe(sr); } catch {}
    const onRes = () => { doFit(squareCanvasRef.current); doFit(sqrtCanvasRef.current); };
    window.addEventListener('resize', onRes);
    return () => { try { ro.disconnect(); } catch {}; window.removeEventListener('resize', onRes); };
  }, []);

  // Rotate fun facts
  useEffect(() => {
    const id = setInterval(()=> setFactIdx(i => (i+1)%facts.length), 4000);
    return () => clearInterval(id);
  }, [facts.length]);

  // Fix: add resetAnim to reset animation state
  const resetAnim = () => {
    try {
      setAnimPlaying(false);
      setAnimT(0);
    } catch {}
  };

  return (
    <div style={{ background: 'transparent', padding:0, borderRadius:0, border:'none', position:'relative', overflow:'hidden', boxShadow:'none', width:'100%', margin:0, boxSizing:'border-box' }}>
      {/* Local styles for subtle animations + scroll reveal */}
      <style>{`
        @keyframes msGlow { 0%{ box-shadow: 0 0 0 3px rgba(0,0,0,0.25) inset, 0 0 10px rgba(236,72,153,0.4);} 50%{ box-shadow: 0 0 0 3px rgba(0,0,0,0.25) inset, 0 0 18px rgba(236,72,153,0.8);} 100%{ box-shadow: 0 0 0 3px rgba(0,0,0,0.25) inset, 0 0 10px rgba(236,72,153,0.4);} }
        @keyframes msFloat { 0%{ transform: translateY(0px);} 50%{ transform: translateY(-2px);} 100%{ transform: translateY(0px);} }
        @keyframes msPopIn { 0%{ transform: scale(0.98); opacity: 0; } 100%{ transform: scale(1); opacity: 1; } }
        .ms-hero { animation: msGlow 2.8s ease-in-out infinite, msPopIn 480ms ease-out 1; }
        .reveal { opacity: 0; transform: translateY(12px); transition: opacity 500ms ease, transform 500ms ease; }
        .reveal.show { opacity: 1; transform: translateY(0px); }
        @media (prefers-reduced-motion: reduce) { .ms-hero { animation: none; } .reveal { transition: none; opacity: 1 !important; transform: none !important; } }
      `}</style>
      {/* Hero Header */}
      <div className="ms-hero" style={{ width:'100%', background: 'linear-gradient(90deg, #a21caf, #d946ef)', color:'#fff', padding:'14px 16px', borderRadius:8, boxShadow:'0 0 0 3px rgba(0,0,0,0.25) inset', marginBottom:12 }}>
        <div style={{ fontWeight:800, letterSpacing:1, fontSize:18 }}>■ Squares & Square Roots – Interactive + Explanatory Worksheet ■</div>
        <div style={{ opacity:0.95, marginTop:4 }}>Master squares, square roots, and tricks with visuals, quick races, and embedded games.</div>
        <div style={{ marginTop:8, display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ background:'rgba(0,0,0,0.25)', padding:'4px 8px', borderRadius:6 }}>n² visual</div>
          <div style={{ background:'rgba(0,0,0,0.25)', padding:'4px 8px', borderRadius:6 }}>√ on number line</div>
          <div style={{ background:'rgba(0,0,0,0.25)', padding:'4px 8px', borderRadius:6 }}>Speed checks</div>
          <div style={{ background:'rgba(0,0,0,0.25)', padding:'4px 8px', borderRadius:6 }}>Mini‑games</div>
          {/* Removed top sound controls per request */}
        </div>
      </div>
      {/* (Top Square Growth visual removed per request) */}

      {/* Stepper mini-quests */}
      <div style={{ marginTop:12, display:'grid', gridTemplateColumns:'1fr', gap:12, width:'100%', padding:0 }}>
        {/* Quick Tricks Tiles */}
        <div data-reveal className="reveal" style={{ background: THEME.card, padding:10, borderRadius:6, border:`2px solid ${THEME.frame}`, width:'100%', boxSizing:'border-box' }}>
        <div style={{ fontWeight:700, marginBottom:6 }}>Quick Tricks</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:8 }}>
          <div style={{ background:'#28104a', padding:8, borderRadius:6, border:`1px solid ${THEME.frame}` }}>
            <div style={{ fontWeight:600 }}>Last Digit Rule</div>
            <div style={{ color: THEME.sub }}>Perfect squares end with 0,1,4,5,6,9 only.</div>
            </div>
            <div style={{ background:'#28104a', padding:8, borderRadius:6, border:`1px solid ${THEME.frame}` }}>
              <div style={{ fontWeight:600 }}>Odd Sums</div>
              <div style={{ color: THEME.sub }}>1+3+5+... up to n terms = n².</div>
            </div>
            <div style={{ background:'#28104a', padding:8, borderRadius:6, border:`1px solid ${THEME.frame}` }}>
              <div style={{ fontWeight:600 }}>(n+1)² Trick</div>
              <div style={{ color: THEME.sub }}>n² → add 2n+1 to jump to (n+1)².</div>
            </div>
            <div style={{ background:'#28104a', padding:8, borderRadius:6, border:`1px solid ${THEME.frame}` }}>
              <div style={{ fontWeight:600 }}>(a+b)² Mental Math</div>
              <div style={{ color: THEME.sub }}>a² + 2ab + b²; choose a easy base and small b.</div>
            </div>
          </div>
        </div>

        {/* Odd + Speed side-by-side */}
        <div data-reveal className="reveal" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:12, width:'100%' }}>
          {/* Odd Numbers Sum to n² Interactive */}
          <div data-reveal className="reveal" style={{ background: THEME.card, padding:10, borderRadius:6, border:`2px solid ${THEME.frame}`, width:'100%', boxSizing:'border-box' }}>
          <div style={{ fontWeight:700, marginBottom:6 }}>Odd Numbers → Square</div>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <label style={{ color: THEME.ink }}>n terms:</label>
            <input type="range" min={1} max={10} value={kOdd} onChange={e=> { playTickThrottled(); setKOdd(parseInt(e.target.value||'1')); }} />
            <div style={{ background:'#1b1233', padding:'4px 8px', border:`1px solid rgba(124,58,237,0.35)`, borderRadius:6 }}>n = <b>{kOdd}</b></div>
            <div style={{ background:'#1b1233', padding:'4px 8px', border:`1px solid rgba(124,58,237,0.35)`, borderRadius:6 }}>sum = <b>{Array.from({length:kOdd},(_,i)=>2*i+1).reduce((a,b)=>a+b,0)}</b></div>
            <div style={{ background:'#1b1233', padding:'4px 8px', border:`1px solid rgba(124,58,237,0.35)`, borderRadius:6 }}>n² = <b>{kOdd*kOdd}</b></div>
          </div>
          <div style={{ color: THEME.sub, marginTop:6 }}>Observe: 1 + 3 + ... + {2*kOdd-1} = {kOdd}².</div>
          </div>

          {/* Speed Check Mini Challenge */}
          <div style={{ background: THEME.card, padding:10, borderRadius:6, border:`2px solid ${THEME.frame}`, width:'100%', boxSizing:'border-box' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontWeight:700 }}>Speed Check</div>
            <button className="btn" style={{ background:'#2a1744', borderRadius:0, boxShadow:'0 0 0 3px #3b1747 inset' }} onClick={()=> setSpeedQ(speedBank[Math.floor(Math.random()*speedBank.length)])}>Shuffle</button>
          </div>
          <div style={{ marginTop:6 }}>{speedQ.q}</div>
          <div style={{ marginTop:6 }}>
            <input value={speedVal} onChange={e=> { playTypeTickThrottled(); setSpeedVal(e.target.value); }} placeholder="Type answer" style={{ padding:6, border:'2px solid #3b1747', background:'#0f0a1f', color:THEME.ink }} />
            <button className="btn" style={{ marginLeft:8, background:'#22c55e', borderRadius:0, boxShadow:'0 0 0 3px #3b1747 inset' }} onClick={()=> { const ok = speedVal.trim()===speedQ.a; if (ok) { sfxCorrect(); burstConfetti(20); } else { sfxWrong(); } alert(ok ? '✅ Correct!' : `❌ Not quite. Answer: ${speedQ.a}`); }}>Check</button>
          </div>
          </div>
        </div>
        {/* Interactive Animations Panel (side-by-side) */}
        <div style={{ background: THEME.card, padding:10, borderRadius:6, border:`2px solid ${THEME.frame}`, width:'100%', boxSizing:'border-box' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
            <div style={{ fontWeight:700 }}>Interactive Animations</div>
            <div style={{ display:'flex', gap:6 }}>
              <button className="btn" style={{ background:'#2a1744', borderRadius:0, boxShadow:'0 0 0 3px #3b1747 inset' }} onClick={()=> setAnimPlaying(p=>!p)}>{animPlaying?'Pause':'Play'}</button>
              <button className="btn" style={{ background:'#2a1744', borderRadius:0, boxShadow:'0 0 0 3px #3b1747 inset' }} onClick={()=> { setAnimT(0); setAnimPlaying(false); }}>Reset</button>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:12, alignItems:'start' }}>
            {/* Square Growth */}
            <div>
              <div style={{ fontWeight:600, marginBottom:6 }}>Square Growth (n×n)</div>
              <div style={{ width:'100%', aspectRatio:'16/9', background:'#0f0a1f', borderRadius:6, overflow:'hidden', border:`2px solid ${THEME.frame}` }}>
                <canvas ref={squareCanvasRef} style={{ width:'100%', height:'100%', imageRendering:'pixelated' }} />
              </div>
              <div style={{ marginTop:6, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                <label style={{ color: THEME.sub }}>n:</label>
                <input type="range" min={1} max={14} value={n} onChange={e=> { playTickThrottled(); setN(parseInt(e.target.value||'1')); }} />
                <div style={{ background:'#0f0a1f', border:`2px solid ${THEME.frame}`, padding:'2px 6px', borderRadius:6 }}>n = <b>{n}</b> | n² = <b>{n*n}</b></div>
              </div>
            </div>
            {/* Sqrt Number Line */}
            <div>
              <div style={{ fontWeight:600, marginBottom:6 }}>√x on Number Line</div>
              <div style={{ width:'100%', aspectRatio:'16/9', background:'#0f0a1f', borderRadius:6, overflow:'hidden', border:`2px solid ${THEME.frame}` }}>
                <canvas ref={sqrtCanvasRef} style={{ width:'100%', height:'100%', imageRendering:'pixelated' }} />
              </div>
              <div style={{ marginTop:6, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                <label style={{ color: THEME.sub }}>x:</label>
                <input type="range" min={2} max={196} value={xVal} onChange={e=> { playTickThrottled(); setXVal(parseInt(e.target.value||'2')); }} />
                <div style={{ background:'#0f0a1f', border:`2px solid ${THEME.frame}`, padding:'2px 6px', borderRadius:6 }}>x = <b>{xVal}</b> → √x ≈ <b>{Math.sqrt(xVal).toFixed(2)}</b></div>
              </div>
            </div>
          </div>
          <div style={{ marginTop:6, color: THEME.sub, fontSize:12 }}>Tip: Press Play to animate; sliders adjust each visual instantly.</div>
        </div>

        {/* Steps 1–3 grouped in one section */}
        <div style={{ background: THEME.card, padding:10, borderRadius:6, border:`2px solid ${THEME.frame}`, width:'100%', boxSizing:'border-box' }}>
          <div style={{ fontWeight:700, marginBottom:10 }}>Mini‑Quest: Steps 1–3</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:12 }}>
            {/* Step 1 */}
            <div style={{ background:'#21103d', padding:10, borderRadius:6, border:`1px solid ${THEME.frame}` }}>
              <div style={{ fontWeight:700, marginBottom:6 }}>Step 1: Pick the perfect square</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {[18,25,32,50].map((v,idx)=> (
                  <button key={idx} className="btn" disabled={choice1!==null}
                    style={{ background: choice1===v ? (v===25? '#22c55e':'#f43f5e') : '#2a1744', color: THEME.ink, borderRadius:0, boxShadow:'0 0 0 3px #3b1747 inset' }}
                    onClick={()=> { if (!audioRef.current) ensureAudio(); setChoice1(v); (v===25 ? sfxCorrect : sfxWrong)(); }}>
                    {v}
                  </button>
                ))}
              </div>
              {choice1!==null && (
                <div style={{ marginTop:6 }}>{choice1===25? '✅ Correct! 25 = 5²' : '❌ Not a perfect square'}</div>
              )}
            </div>

            {/* Step 2 */}
            <div style={{ background:'#21103d', padding:10, borderRadius:6, border:`1px solid ${THEME.frame}` }}>
              <div style={{ fontWeight:700, marginBottom:6 }}>Step 2: Where does √50 lie?</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {['(6,7)','(7,8)','(8,9)'].map((opt,idx)=> {
                  const isCorrect = opt === '(7,8)';
                  const isPicked = choice2 === opt;
                  const bg = isPicked ? (isCorrect ? '#22c55e' : '#f43f5e') : '#2a1744';
                  return (
                    <button key={idx} className="btn" disabled={choice2!==null}
                      style={{ background: bg, color: THEME.ink, borderRadius:0, boxShadow:'0 0 0 3px #3b1747 inset' }}
                      onClick={()=> { if (!audioRef.current) ensureAudio(); setChoice2(opt); (isCorrect ? sfxCorrect : sfxWrong)(); }}>
                      {opt}
                    </button>
                  );
                })}
              </div>
              {choice2!==null && (
                <div style={{ marginTop:6 }}>{choice2==='(7,8)' ? '✅ Yes! 7²=49 and 8²=64, so √50 is between 7 and 8.' : '❌ Think of 7² and 8².'}</div>
              )}
            </div>

            {/* Step 3 */}
            <div style={{ background:'#21103d', padding:10, borderRadius:6, border:`1px solid ${THEME.frame}` }}>
              <div style={{ fontWeight:700, marginBottom:6 }}>Step 3: Finish & Claim Bonus</div>
              <p style={{ marginTop:0, color: THEME.sub }}>Complete steps 1 & 2 to unlock your intro bonus.</p>
              <button className="btn" disabled={!(choice1===25 && choice2==='(7,8)') || done}
                style={{ background: done? '#44403c' : '#7c3aed', color: THEME.ink, borderRadius:0, boxShadow:'0 0 0 3px #3b1747 inset', opacity: (choice1===25 && choice2===true)?1:0.7 }}
                onClick={()=> { sfxBonus(); completeIntro(); }}>
                {done ? 'Bonus Claimed ✓' : 'Claim 10 pts'}
              </button>
              {done && (
                <div style={{ marginTop:8, background:'#072b1b', color:'#86efac', border:`1px solid #14532d`, padding:'6px 8px', borderRadius:6, boxShadow:'0 0 0 3px rgba(0,0,0,0.25) inset' }}>
                  Intro Bonus added: <b>+10 pts</b> • Your total: <b>{totalPoints}</b>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Worksheet Sections 1..7 with embedded games */}
        <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:12 }}>
          {/* 1. What is a Square? + Pac‑Squares */}
          <div data-reveal className="reveal" style={{ background: THEME.card, padding:12, borderRadius:6, border:`2px solid ${THEME.frame}` }}>
            <div style={{ fontWeight:800, marginBottom:6 }}>1) What is a Square?</div>
            <div style={{ color: THEME.sub, marginBottom:8 }}>A square number is obtained when a number is multiplied by itself. Example: 3×3 = 9 → 9 is a square number. Square = number raised to the power 2 (n²).</div>
            <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:8 }}>
              <button className="btn" style={{ background:THEME.accent, borderRadius:0, boxShadow:'0 0 0 3px rgba(0,0,0,0.35) inset' }} onClick={startSquaresRace}>Start Timer</button>
              <button className="btn" style={{ background:'#3a1764', borderRadius:0, boxShadow:'0 0 0 3px rgba(0,0,0,0.35) inset' }} onClick={endSquaresRace}>Finish</button>
              {sqShowRes && (
                <div style={{ background:'#28104a', padding:'4px 8px', border:`1px solid ${THEME.frame}`, borderRadius:6 }}>
                  Time: <b>{((sqEnd - sqStart)/1000).toFixed(1)}s</b> | Correct: <b>{sqCorrect}/15</b>
                </div>
              )}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5, minmax(80px, 1fr))', gap:8 }}>
              {Array.from({length:15}, (_,i)=> i+1).map((k)=> (
                <div key={k} style={{ background:'#28104a', padding:8, borderRadius:6, border:`1px solid ${THEME.frame}` }}>
                  <div style={{ fontSize:12, color: THEME.sub }}>Square of {k}</div>
                  <input value={sqAnswers[k-1]} onChange={e=> setSqAnswers(a=> { const b=a.slice(); b[k-1]=e.target.value; return b; })} placeholder={`${k*k}`}
                    style={{ marginTop:4, width:'100%', padding:6, border:`2px solid ${THEME.frame}`, background:THEME.card, color:THEME.ink }} />
                </div>
              ))}
            </div>
            {/* Pac‑Squares Game inline */}
            <div style={{ marginTop:10, background:'#28104a', border:`1px solid ${THEME.frame}`, borderRadius:6, padding:10 }}>
              <div style={{ fontWeight:700, marginBottom:6 }}>Mini‑Game: Pac‑Squares</div>
              <div style={{ color: THEME.sub, marginBottom:6 }}>Eat only perfect squares (1, 4, 9, …, 100). Wrong picks reduce score and speed up ghosts!</div>
              <PacSquaresGame />
            </div>
          </div>

          {/* 2. Properties of Square Numbers */}
          <div style={{ background: THEME.card, padding:12, borderRadius:6, border:`2px solid ${THEME.frame}` }}>
            <div style={{ fontWeight:800, marginBottom:6 }}>2) Properties of Square Numbers</div>
            <ul style={{ marginTop:0 }}>
              <li>Every square number ends with 0, 1, 4, 5, 6, or 9.</li>
              <li>No square number ends with 2, 3, 7, or 8.</li>
              <li>Square of an even number is even; square of an odd number is odd.</li>
              <li>A number with odd number of zeros at the end cannot be a perfect square (Ex: 1000).</li>
            </ul>
            <div style={{ marginTop:6, display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
              <div>Is <b>{propNum}</b> a perfect square?</div>
              <button className="btn" style={{ background:'#22c55e', borderRadius:0, boxShadow:'0 0 0 3px rgba(0,0,0,0.35) inset' }} onClick={()=> classify(true)}>Square ■</button>
              <button className="btn" style={{ background:'#f43f5e', borderRadius:0, boxShadow:'0 0 0 3px rgba(0,0,0,0.35) inset' }} onClick={()=> classify(false)}>Not a square ■</button>
              <button className="btn" style={{ background:'#3a1764', borderRadius:0, boxShadow:'0 0 0 3px rgba(0,0,0,0.35) inset' }} onClick={newPropNum}>Next</button>
              {propMsg && <div style={{ marginLeft:6, fontWeight:600 }}>{propMsg}</div>}
            </div>
          </div>

          {/* 3. What is a Square Root? + Monster Battle */}
          <div style={{ background: THEME.card, padding:12, borderRadius:6, border:`2px solid ${THEME.frame}` }}>
            <div style={{ fontWeight:800, marginBottom:6 }}>3) What is a Square Root?</div>
            <div style={{ color: THEME.sub, marginBottom:8 }}>The square root of a number is the value which, when multiplied by itself, gives the original number. Example: √49 = 7. Tip: A perfect square has two roots (±); we use the positive root in school.</div>
            <div style={{ fontWeight:600, marginBottom:6 }}>Game: Square Root Treasure Hunt</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {cards.map(c => (
              <div key={c.n} style={{ background:'#28104a', padding:8, borderRadius:6, border:`1px solid ${THEME.frame}` }}>
                <div>Card: <b>{c.n}</b></div>
                <div style={{ display:'flex', gap:6, marginTop:6 }}>
                    {c.opts.map((opt,idx)=> (
                      <button key={idx} className="btn" disabled={c.solved}
                        style={{ background: c.solved && opt===Math.sqrt(c.n)? '#22c55e':'#3a1764', borderRadius:0, boxShadow:'0 0 0 3px rgba(0,0,0,0.35) inset', color:THEME.ink }}
                        onClick={()=> solveCard(c.n, opt)}>{Number.isInteger(opt)? opt: opt.toFixed(1)}</button>
                    ))}
                </div>
                {c.solved && <div style={{ marginTop:6, color:'#22c55e' }}>Unlocked ✓</div>}
              </div>
            ))}
            </div>
            {/* Monster Battle inline */}
            <div style={{ marginTop:10, background:'#28104a', border:`1px solid ${THEME.frame}`, borderRadius:6, padding:10 }}>
              <div style={{ fontWeight:700, marginBottom:6 }}>Battle: Square Root Monster</div>
              <div style={{ color: THEME.sub, marginBottom:6 }}>Defeat scary shapes with square root answers. Correct attacks hurt the enemy; wrong answers hurt you.</div>
              <SquareRootMonsterBattle />
            </div>
          </div>

          {/* 4. Special Properties of Square Roots */}
          <div style={{ background: THEME.card, padding:12, borderRadius:6, border:`2px solid ${THEME.frame}` }}>
            <div style={{ fontWeight:800, marginBottom:6 }}>4) Special Properties</div>
            <div style={{ color: THEME.sub }}>If a number ends with 2, 3, 7, or 8 → it cannot be a perfect square. Also, the difference between squares of two consecutive numbers equals their sum.</div>
            <div style={{ marginTop:6, display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
              <label>n:</label>
              <input type="range" min={2} max={20} value={consecN} onChange={e=> { playTickThrottled(); setConsecN(parseInt(e.target.value||'2')); }} />
              <div style={{ background:'#28104a', padding:'4px 8px', border:`1px solid ${THEME.frame}`, borderRadius:6 }}>n² − (n−1)² = <b>{consecN*consecN - (consecN-1)*(consecN-1)}</b></div>
              <div style={{ background:'#28104a', padding:'4px 8px', border:`1px solid ${THEME.frame}`, borderRadius:6 }}>n + (n−1) = <b>{consecN + (consecN-1)}</b></div>
            </div>
          </div>

          {/* 5. Pythagorean Triplets */}
          <div style={{ background: THEME.card, padding:12, borderRadius:6, border:`2px solid ${THEME.frame}` }}>
            <div style={{ fontWeight:800, marginBottom:6 }}>5) Pythagorean Triplets</div>
            <div style={{ color: THEME.sub }}>For m &gt; 1, numbers (m² − 1), 2m, (m² + 1) form a Pythagorean triplet.</div>
            <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginTop:6 }}>
              <label>m:</label>
              <input type="range" min={2} max={20} value={mVal} onChange={e=> { playTickThrottled(); setMVal(parseInt(e.target.value||'2')); }} />
              <div style={{ background:'#28104a', padding:'4px 8px', border:`1px solid ${THEME.frame}`, borderRadius:6 }}>Triplet: <b>{tripletFor(mVal).join(', ')}</b></div>
              <button className="btn" style={{ background:THEME.accent, borderRadius:0, boxShadow:'0 0 0 3px rgba(0,0,0,0.35) inset' }} onClick={addTriplet}>Add</button>
            </div>
            {triplets.length>0 && (
              <div style={{ marginTop:6 }}>
                <div style={{ color: THEME.sub, marginBottom:4 }}>Generated:</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {triplets.map((t,idx)=>(<div key={idx} style={{ background:'#28104a', padding:'4px 8px', borderRadius:6, border:`1px solid ${THEME.frame}` }}>{t.join(', ')}</div>))}
                </div>
              </div>
            )}
          </div>

          {/* 6. Real-Life Connections */}
          <div style={{ background: THEME.card, padding:12, borderRadius:6, border:`2px solid ${THEME.frame}` }}>
            <div style={{ fontWeight:800, marginBottom:6 }}>6) Real-Life Connections</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:8 }}>
              <div style={{ background:'#28104a', padding:8, borderRadius:6, border:`1px solid ${THEME.frame}` }}>
                <div style={{ fontWeight:600 }}>Square park area → side</div>
                <div className="row" style={{ marginTop:6 }}>
                  <label>Area (m²): </label>
                  <input type="number" value={parkArea} onChange={e=> setParkArea(parseInt(e.target.value||'0'))} style={{ marginLeft:6, padding:6, border:`2px solid ${THEME.frame}`, background:THEME.card, color:THEME.ink, width:120 }} />
                </div>
                <div style={{ marginTop:6 }}>Side = <b>{Math.sqrt(Math.max(0,parkArea)) || 0}</b> m</div>
              </div>
              <div style={{ background:'#28104a', padding:8, borderRadius:6, border:`1px solid ${THEME.frame}` }}>
                <div style={{ fontWeight:600 }}>Tiles in a square → side count</div>
                <div className="row" style={{ marginTop:6 }}>
                  <label>Tiles: </label>
                  <input type="number" value={roomTiles} onChange={e=> setRoomTiles(parseInt(e.target.value||'0'))} style={{ marginLeft:6, padding:6, border:`2px solid ${THEME.frame}`, background:THEME.card, color:THEME.ink, width:120 }} />
                </div>
                <div style={{ marginTop:6 }}>Side = <b>{Math.sqrt(Math.max(0,roomTiles)) || 0}</b></div>
              </div>
              <div style={{ background:'#28104a', padding:8, borderRadius:6, border:`1px solid ${THEME.frame}` }}>
                <div style={{ fontWeight:600 }}>Right triangle diagonal</div>
                <div className="row" style={{ marginTop:6, display:'flex', gap:6, alignItems:'center' }}>
                  <label>a:</label>
                  <input type="number" value={triA} onChange={e=> setTriA(parseInt(e.target.value||'0'))} style={{ padding:6, border:`2px solid ${THEME.frame}`, background:THEME.card, color:THEME.ink, width:80 }} />
                  <label>b:</label>
                  <input type="number" value={triB} onChange={e=> setTriB(parseInt(e.target.value||'0'))} style={{ padding:6, border:`2px solid ${THEME.frame}`, background:THEME.card, color:THEME.ink, width:80 }} />
                </div>
                <div style={{ marginTop:6 }}>Diagonal = <b>{Math.sqrt(triA*triA + triB*triB).toFixed(2)}</b></div>
              </div>
            </div>
          </div>

          {/* 7. Challenge Zone */}
          <div style={{ background: THEME.card, padding:12, borderRadius:6, border:`2px solid ${THEME.frame}` }}>
            <div style={{ fontWeight:800, marginBottom:6 }}>7) Challenge Zone</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:8 }}>
              <div style={{ background:'#28104a', padding:8, borderRadius:6, border:`1px solid ${THEME.frame}` }}>
                <div>Find √1521</div>
                <input value={ch1} onChange={e=> { const v=e.target.value; playTypeTickThrottled(); const wasCorrect = ch1.trim()==='39'; setCh1(v); const nowOk = v.trim()==='39'; if (nowOk && !wasCorrect) { sfxCorrect(); burstConfetti(18); } }} style={{ marginTop:6, width:'100%', padding:6, border:`2px solid ${THEME.frame}`, background:THEME.card, color:THEME.ink }} />
                <div style={{ marginTop:6 }}>{ch1.trim()==='39' ? '✅ Correct' : ch1? '❌ Try 39' : ''}</div>
              </div>
              <div style={{ background:'#28104a', padding:8, borderRadius:6, border:`1px solid ${THEME.frame}` }}>
                <div>Show √50 lies between 7 and 8</div>
                <div style={{ marginTop:6, color: THEME.sub }}>Hint: 7²=49 and 8²=64</div>
              </div>
              <div style={{ background:'#28104a', padding:8, borderRadius:6, border:`1px solid ${THEME.frame}` }}>
                <div>If √x = 12, find x</div>
                <input value={ch3} onChange={e=> { const v=e.target.value; playTypeTickThrottled(); const wasCorrect = ch3.trim()==='144'; setCh3(v); const nowOk = v.trim()==='144'; if (nowOk && !wasCorrect) { sfxCorrect(); burstConfetti(18); } }} style={{ marginTop:6, width:'100%', padding:6, border:`2px solid ${THEME.frame}`, background:THEME.card, color:THEME.ink }} />
                <div style={{ marginTop:6 }}>{ch3.trim()==='144' ? '✅ Correct' : ch3? '❌ Try 144' : ''}</div>
              </div>
              <div style={{ background:'#28104a', padding:8, borderRadius:6, border:`1px solid ${THEME.frame}` }}>
                <div>Area of a square = 484 m² → side?</div>
                <input value={ch4} onChange={e=> { const v=e.target.value; playTypeTickThrottled(); const wasCorrect = ch4.trim()==='22'; setCh4(v); const nowOk = v.trim()==='22'; if (nowOk && !wasCorrect) { sfxCorrect(); burstConfetti(18); } }} style={{ marginTop:6, width:'100%', padding:6, border:`2px solid ${THEME.frame}`, background:THEME.card, color:THEME.ink }} />
                <div style={{ marginTop:6 }}>{ch4.trim()==='22' ? '✅ Correct' : ch4? '❌ Try 22' : ''}</div>
              </div>
              <div style={{ background:'#28104a', padding:8, borderRadius:6, border:`1px solid ${THEME.frame}` }}>
                <div>Prove: Squares never end with 2, 3, 7, or 8</div>
                <div style={{ marginTop:6, color: THEME.sub }}>Challenge: Consider last digit cases and parity. Try examples.</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* pixel confetti */}
      {sparks.length>0 && (
        <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
          {sparks.map(s=>{
            const t = Math.min(1, (Date.now()-s.id)/900);
            const x = 50 + Math.cos(s.ang)*(t*45);
            const y = 40 + Math.sin(s.ang)*(t*26) + t*10;
            const a = 1-t;
            return <div key={s.id+"-intro-sp"} style={{ position:'absolute', left:`${x}%`, top:`${y}%`, width:6, height:6, background:'#facc15', opacity:a }} />
          })}
        </div>
      )}
    </div>
  );
}

// Content for Squares and Square Roots (Class 8 - Chapter 6)
const concepts = [
  {
    key: 'squares_basics',
    title: 'Understanding Squares',
    notes: [
      'Square of a number n is n × n. Example: 7² = 49.',
      'A perfect square is a number that can be expressed as the square of an integer (e.g., 1, 4, 9, 16, 25...).',
      'The number of factors of a perfect square is odd (because one factor repeats).'
    ],
    activity: {
      description: 'Compute a simple square mentally.',
      prompt: 'What is 12²? Enter the value:',
      check: (v) => (v.trim() === '144' ? '✅ Correct!' : '❌ Try again')
    },
    quiz: {
      questions: [
        { q: 'Which of the following is a perfect square?', options: ['24', '36', '40', '44'], answer: 1 },
        { q: 'Square of 15 is:', options: ['215', '225', '235', '245'], answer: 1 }
      ]
    }
  },
  {
    key: 'square_roots',
    title: 'Square Roots',
    notes: [
      'Square root of a number x is a number y such that y² = x. It is written as √x.',
      'Perfect squares have integer square roots. Example: √81 = 9.',
      'Non-perfect squares have irrational or non-integer square roots.'
    ],
    activity: {
      description: 'Identify the square root.',
      prompt: 'Enter √196:',
      check: (v) => (v.trim() === '14' ? '✅ Correct!' : '❌ Try again')
    },
    quiz: {
      questions: [
        { q: '√64 equals:', options: ['6', '7', '8', '9'], answer: 2 },
        { q: 'Which number is NOT a perfect square?', options: ['49', '121', '169', '96'], answer: 3 }
      ]
    }
  },
  {
    key: 'properties_tricks',
    title: 'Properties & Tricks',
    notes: [
      'Square of an even number is even; square of an odd number is odd.',
      'The ending digits of perfect squares can only be 0,1,4,5,6,9.',
      'To check if a number is a perfect square, prime factorise: exponents must be even.'
    ],
    activity: {
      description: 'Quick check for a perfect square by last digit.',
      prompt: 'Can 54 be a perfect square? Type yes/no',
      check: (v) => {
        const t = v.trim().toLowerCase();
        return t === 'no' ? '✅ Correct (ending digit 4 is okay, but 54 overall is not a perfect square)' : 'ℹ️ Not quite. Try no';
      }
    },
    quiz: {
      questions: [
        { q: 'Which could be the unit digit of a perfect square?', options: ['2', '3', '7', '6'], answer: 3 },
        { q: 'In prime factorisation of a perfect square, the powers of primes are:', options: ['All odd', 'All even', 'Mixed', 'All prime'], answer: 1 }
      ]
    }
  }
];

export default function MathSquares() {
  const [totalPoints, setTotalPoints] = useState(0);
  const [completed, setCompleted] = useState({});
  const [loading, setLoading] = useState(true);
  const profile = JSON.parse(localStorage.getItem('gamify_profile') || '{}');
  const studentId = profile.id || 'local_demo';
  const THEME = useMemo(()=>({
    bg:'#1a0b2e',                 // deep violet
    card:'#1a0b2e',               // match bg to avoid side gutters
    ink:'#ffffff',                // white text
    accent:'#d946ef',             // pink accent
    frame:'#a21caf',              // strong violet border
    sub:'#f5d0fe'                 // soft pink text
  }),[]);
  const bgCanvasRef = useRef(null);

  useEffect(() => {
    const local = loadLocalProgress();
    const existing = local[studentId] || { points: 0, results: [] };
    setTotalPoints(existing.points || 0);

    const done = {};
    (existing.results || []).forEach(r => {
      if (r.topic.startsWith('math_ch6_')) {
        const key = r.topic.replace('math_ch6_', '');
        done[key] = true;
      }
    });
    setCompleted(done);
    setLoading(false);
  }, [studentId]);

  // Force full-bleed background (remove white gutters from host styles)
  useEffect(() => {
    const prevHtmlBg = document.documentElement.style.background;
    const prevBodyBg = document.body.style.background;
    const prevBodyMargin = document.body.style.margin;
    const prevOverflowX = document.body.style.overflowX;
    const prevScrollbarGutter = document.documentElement.style.scrollbarGutter;
    const rootEl = document.getElementById('root');
    const prevRootBg = rootEl ? rootEl.style.background : '';
    const prevRootMargin = rootEl ? rootEl.style.margin : '';
    const prevRootPadding = rootEl ? rootEl.style.padding : '';
    const appEl = rootEl && rootEl.parentElement ? rootEl.parentElement : null;
    const prevAppBg = appEl ? appEl.style.background : '';
    const prevAppMargin = appEl ? appEl.style.margin : '';
    const prevAppPadding = appEl ? appEl.style.padding : '';
    document.documentElement.style.background = THEME.bg;
    document.body.style.background = THEME.bg;
    document.body.style.margin = '0';
    document.body.style.overflowX = 'hidden';
    // Prevent layout width jitter when vertical scrollbar appears/disappears
    document.documentElement.style.scrollbarGutter = 'stable both-edges';
    if (rootEl) {
      rootEl.style.background = THEME.bg;
      rootEl.style.margin = '0';
      rootEl.style.padding = '0';
      rootEl.style.width = '100%';
    }
    if (appEl) {
      appEl.style.background = THEME.bg;
      appEl.style.margin = '0';
      appEl.style.padding = '0';
      appEl.style.width = '100%';
    }
    return () => {
      document.documentElement.style.background = prevHtmlBg;
      document.body.style.background = prevBodyBg;
      document.body.style.margin = prevBodyMargin;
      document.body.style.overflowX = prevOverflowX;
      document.documentElement.style.scrollbarGutter = prevScrollbarGutter;
      if (rootEl) {
        rootEl.style.background = prevRootBg;
        rootEl.style.margin = prevRootMargin;
        rootEl.style.padding = prevRootPadding;
      }
      if (appEl) {
        appEl.style.background = prevAppBg;
        appEl.style.margin = prevAppMargin;
        appEl.style.padding = prevAppPadding;
      }
    };
  }, [THEME.bg]);

  // Reduce Motion / Performance mode
  const [reduceMotion, setReduceMotion] = useState(() => {
    try { return localStorage.getItem('squares_reduce_motion') === '1'; } catch { return false; }
  });
  useEffect(()=>{ try { localStorage.setItem('squares_reduce_motion', reduceMotion ? '1' : '0'); } catch {} }, [reduceMotion]);

  // Background drift canvas: if reduceMotion, render once instead of animating
  useEffect(() => {
    const cvs = bgCanvasRef?.current; if (!cvs) return;
    const ctx = cvs.getContext('2d'); if (!ctx) return;
    let rid;
    const drawOnce = () => {
      ctx.fillStyle = THEME.bg; ctx.fillRect(0,0,cvs.width,cvs.height);
      ctx.strokeStyle = 'rgba(124,58,237,0.08)';
      ctx.lineWidth = 1; const step = 28;
      for (let x=0; x<cvs.width; x+=step) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,cvs.height); ctx.stroke(); }
      for (let y=0; y<cvs.height; y+=step) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(cvs.width,y); ctx.stroke(); }
    };
    if (reduceMotion) { drawOnce(); return () => { if (rid) cancelAnimationFrame(rid); }; }
    return () => {};
  }, [reduceMotion, THEME.bg]);

  // Pixelated math-themed animated background (lightweight)
  useEffect(() => {
    const cvs = bgCanvasRef.current; if (!cvs) return;
    const ctx = cvs.getContext('2d');
    let rid;
    const resize = () => { cvs.width = window.innerWidth; cvs.height = window.innerHeight; };
    resize();
    const symbols = ['√x','x²','π','Σ','∞','∫','√(a²+b²)','∆','α','β','γ'];
    // spawn a few drifting symbols
    const pool = Array.from({length: 22}).map((_,i)=>({
      x: Math.random()*cvs.width,
      y: Math.random()*cvs.height,
      vx: (Math.random()*0.2)+0.05,
      glyph: symbols[i % symbols.length],
      size: 10 + Math.floor(Math.random()*8)
    }));
    const draw = () => {
      // soft grid background
      ctx.fillStyle = THEME.bg; ctx.fillRect(0,0,cvs.width,cvs.height);
      ctx.strokeStyle = 'rgba(124,58,237,0.08)'; // accent grid
      ctx.lineWidth = 1;
      const step = 28;
      for (let x=0; x<cvs.width; x+=step) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,cvs.height); ctx.stroke(); }
      for (let y=0; y<cvs.height; y+=step) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(cvs.width,y); ctx.stroke(); }
      // drifting math glyphs
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      pool.forEach(p=>{
        p.x += p.vx; if (p.x > cvs.width + 40) { p.x = -40; p.y = Math.random()*cvs.height; }
        ctx.fillStyle = 'rgba(233,213,255,0.12)';
        ctx.font = `bold ${p.size}px monospace`;
        ctx.fillText(p.glyph, Math.floor(p.x), Math.floor(p.y));
      });
      rid = requestAnimationFrame(draw);
    };
    rid = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(rid); window.removeEventListener('resize', resize); };
  }, [THEME.bg]);

  // Track quiz-earned points separately for accurate progress bar
  const [totalQuizPoints, setTotalQuizPoints] = useState(0);
  const handleQuizDone = (conceptKey, points) => {
    setCompleted(prev => ({ ...prev, [conceptKey]: true }));
    // overall points (may include bonuses)
    setTotalPoints(p => p + points);
    // quiz-only points for progress bar
    setTotalQuizPoints(p => p + points);
  };

  const totalPossiblePoints = concepts.reduce((acc, c) => acc + c.quiz.questions.length * 5, 0);
  // Use only quiz-earned points for progress to avoid exceeding 100% when bonuses are included
  const progressPercent = totalPossiblePoints ? (totalQuizPoints / totalPossiblePoints) * 100 : 0;

  if (loading) return <div>Loading Progress...</div>;

  return (
    <div style={{ fontFamily: 'monospace', minHeight: '100vh', width:'100%', margin:0, overflowX:'hidden', position:'relative', background: 'transparent' }}>
      <style>{`
        html, body, #root {
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          background: ${THEME.bg} !important;
          overflow-x: hidden !important;
          color: ${THEME.ink} !important;
        }
        #root > * {
          max-width: none !important;
        }
        .container, .App, main, [class*='container'], [class*='Container'], nav {
          max-width: none !important;
          width: 100% !important;
          margin: 0 !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
          background: ${THEME.bg} !important;
          color: ${THEME.ink} !important;
        }
        p, h1, h2, h3, h4, h5, h6, span, label, li, div { color: ${THEME.ink}; }
        input, select, textarea, button { color: ${THEME.ink}; }
        img, canvas, video {
          max-width: 100%;
        }
      `}</style>
      {/* Content - full width */}
      <div style={{ position:'relative', zIndex:1, width:'100%', padding: '0 12px', boxSizing:'border-box', overflowX:'hidden', color: THEME.ink }}>
        <p style={{ marginTop:8, color: THEME.sub }}>
          Beat activities and quizzes to earn points. Everything is pixelated, and interactive!
        </p>

        {/* Intro Learning Module */}
        <IntroModule THEME={THEME} studentId={studentId} onAwardPoints={(pts)=> setTotalPoints(p=>p+pts)} />

        {/* Progress */}
        <div style={{ margin: '14px 0', background:'transparent', padding:12, borderRadius:0, width:'100%', boxSizing:'border-box' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
            <div style={{ fontWeight: 600, marginBottom: 6, textShadow:'1px 1px 0 #000' }}>Progress</div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <button className="btn" style={{ background:'#3a1764', borderRadius:0, boxShadow:'0 0 0 3px #3b1747 inset' }} onClick={()=> setReduceMotion(m=>!m)}>{reduceMotion? 'Enable Animations' : 'Reduce Motion'}</button>
              <button className="btn" style={{ background:'#7c3aed', borderRadius:0, boxShadow:'0 0 0 3px #3b1747 inset' }} onClick={()=>{
                if (!window.confirm('Reset all Squares one-try quizzes for this device? This is for testing only.')) return;
                const profile = JSON.parse(localStorage.getItem('gamify_profile') || '{}');
                const pid = profile.id || 'local_demo';
                const all = loadLocalProgress();
                const existing = all[pid] || { results: [], points: 0 };
                const kept = (existing.results||[]).filter(r => !String(r.topic||'').startsWith('math_ch6_'));
                const updated = { ...existing, results: kept };
                saveLocalProgress(pid, updated);
                // Reset in-memory quiz completion and progress
                setCompleted({});
                setTotalQuizPoints(0);
                alert('Squares quizzes reset. You can reattempt them now.');
              }}>Reset Squares Quizzes (Dev)</button>
            </div>
          </div>
          <div style={{ height: 14, background: '#0f0a1f', borderRadius: 4 }}>
            <div style={{ width: `${Math.min(progressPercent, 100)}%`, height: '100%', background: 'linear-gradient(90deg, #a78bfa, #7c3aed)' }} />
          </div>
          <div style={{ fontSize: 12, color: THEME.sub, marginTop: 4 }}>{Math.round(progressPercent)}% of quiz points</div>
        </div>

        {/* Concepts */}
        {concepts.map((c) => (
          <div key={c.key} style={{ margin: '16px 0', border: 'none', borderRadius: 8, background:'#0f0a1f' }}>
            <div style={{ padding: 12, background: '#1b1233', borderBottom: 'none', borderTopLeftRadius:8, borderTopRightRadius:8 }}>
              <h2 style={{ margin: 0, color: THEME.ink, textShadow:'1px 1px 0 #000' }}>{c.title}</h2>
            </div>
            <div style={{ padding: 12 }}>
              <ul>
                {c.notes.map((n, i) => (
                  <li key={i} style={{ margin: '6px 0' }}>{n}</li>
                ))}
              </ul>

              <Activity description={c.activity.description} prompt={c.activity.prompt} check={c.activity.check} />
              <Quiz questions={c.quiz.questions} conceptKey={c.key} onComplete={handleQuizDone} />

              {completed[c.key] && (
                <div style={{ color: '#22c55e', fontWeight: 600 }}>Completed ✓</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
