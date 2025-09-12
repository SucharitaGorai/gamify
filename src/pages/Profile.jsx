// src/pages/Profile.jsx
import React, { useEffect, useMemo, useState } from "react";
import { loadLocalProgress, saveLocalProgress } from "../stores/localProgress";
// Real avatar assets (first 5 are free)
import av1 from "../assets/avatars/1.png";
import av2 from "../assets/avatars/2.png";
import av3 from "../assets/avatars/3.png";
import av4 from "../assets/avatars/4.png";
import av5 from "../assets/avatars/5.png";
import av6 from "../assets/avatars/6.png";
import av7 from "../assets/avatars/7.png";
import av8 from "../assets/avatars/8.png";
import av9 from "../assets/avatars/9.png";
import av10 from "../assets/avatars/10.png";

function ensureProfile() {
  try {
    const existing = JSON.parse(localStorage.getItem("gamify_profile") || "null");
    if (existing && existing.id) return existing;
  } catch {}
  // Default: first 5 avatars free and unlocked
  const newProf = { id: `local_${Math.random().toString(36).slice(2,8)}`, name: "Student", selectedAvatar: "1", unlockedAvatars: ["1","2","3","4","5"] };
  localStorage.setItem("gamify_profile", JSON.stringify(newProf));
  return newProf;
}

function saveProfile(p) {
  localStorage.setItem("gamify_profile", JSON.stringify(p));
}

function useStudentProgress(studentId) {
  const [progress, setProgress] = useState({ points: 0, results: [] });
  useEffect(() => {
    const all = loadLocalProgress();
    const p = all[studentId] || { name: "Student", points: 0, results: [] };
    setProgress(p);
  }, [studentId]);
  const update = (updater) => {
    setProgress((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const all = loadLocalProgress();
      all[studentId] = next;
      saveLocalProgress(studentId, next);
      return next;
    });
  };
  return [progress, update];
}

function calcStreak(results) {
  // results: [{ timestamp: ISO string }]
  if (!results || results.length === 0) return 0;
  const days = new Set(results.map(r => new Date(r.timestamp).toDateString()));
  let streak = 0;
  let d = new Date();
  // count backwards including today if activity exists
  while (true) {
    const key = d.toDateString();
    if (days.has(key)) { streak++; d.setDate(d.getDate() - 1); } else break;
  }
  return streak;
}

// Avatar catalog built from assets (first 5 free)
const AVATARS = [
  { id: "1", name: "Pixel Knight", cost: 0, src: av1 },
  { id: "2", name: "Neon Wizard", cost: 0, src: av2 },
  { id: "3", name: "Cyber Bot", cost: 0, src: av3 },
  { id: "4", name: "Shadow Ninja", cost: 0, src: av4 },
  { id: "5", name: "Star Unicorn", cost: 0, src: av5 },
  { id: "6", name: "Cosmo Ranger", cost: 50, src: av6 },
  { id: "7", name: "Volt Samurai", cost: 60, src: av7 },
  { id: "8", name: "Aero Falcon", cost: 70, src: av8 },
  { id: "9", name: "Lava Titan", cost: 80, src: av9 },
  { id: "10", name: "Frost Dragon", cost: 90, src: av10 },
];

export default function Profile() {
  const [profile, setProfile] = useState(() => ensureProfile());
  const [progress, updateProgress] = useStudentProgress(profile.id);

  useEffect(() => {
    // Ensure progress has a name synced with profile
    updateProgress((prev) => ({ ...prev, name: prev.name || profile.name || "Student", points: prev.points || 0, results: prev.results || [] }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const streak = useMemo(() => calcStreak(progress.results || []), [progress.results]);
  const totalActivities = (progress.results || []).length;

  const unlocked = new Set([...(profile.unlockedAvatars||[]), ...AVATARS.filter(a=>a.cost===0).map(a=>a.id)]);
  const canAfford = (cost) => (progress.points || 0) >= cost;

  const unlock = (avatarId, cost) => {
    if (unlocked.has(avatarId)) return;
    if (cost === 0) return; // free ones are implicitly unlocked
    if (!canAfford(cost)) return;
    // Deduct XP and add to unlocked
    updateProgress((prev) => ({ ...prev, points: (prev.points || 0) - cost }));
    const next = { ...profile, unlockedAvatars: Array.from(new Set([...(profile.unlockedAvatars||[]), avatarId])) };
    setProfile(next); saveProfile(next);
  };

  const selectAvatar = (avatarId) => {
    if (!unlocked.has(avatarId)) return;
    const next = { ...profile, selectedAvatar: avatarId };
    setProfile(next); saveProfile(next);
  };

  const selected = AVATARS.find(a => a.id === (profile.selectedAvatar || "1")) || AVATARS[0];

  // Derived stats
  const xp = progress.points || 0;
  const level = 1 + Math.floor(xp / 100);
  const rank = xp >= 500 ? 'Legend' : xp >= 300 ? 'Pro' : xp >= 150 ? 'Skilled' : 'Rookie';
  const locked = AVATARS.filter(a=>a.cost>0 && !unlocked.has(a.id)).sort((a,b)=>a.cost-b.cost);
  const nextUnlock = locked[0];

  return (
    <div className="pixel-theme pixel-bg profile-page" style={{ width: '100%' }}>
      <h2 style={{ display:'flex', alignItems:'center', gap:10, marginTop: 0 }}>
        Profile <span style={{ fontSize: 14, color:'#c4b5fd' }}>(XP wallet & avatars)</span>
      </h2>
      <div style={{ display:'grid', gridTemplateColumns:'192px 1fr 1fr', gap:16, alignItems:'center', background:'#1b1233', color:'#e9d5ff', border:'3px solid #7c3aed', boxShadow:'0 0 0 4px #3b1747 inset', padding:12, borderRadius:10 }}>
        <div style={{ width:192, height:192, border:'3px solid #7c3aed', boxShadow:'0 0 0 4px #3b1747 inset', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:10, background:'#1b1233' }}>
          <img src={selected.src} alt={selected.name} style={{ width:'100%', height:'100%', objectFit:'cover', imageRendering:'pixelated' }} />
        </div>
        <div>
          <div style={{ fontSize:16, fontWeight:700, color:'#e9d5ff' }}>{profile.name || 'Student'}</div>
          <div style={{ color:'#c4b5fd', fontSize:10 }}>ID: {profile.id}</div>
          <div style={{ marginTop:8, display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <span title="XP" style={{ background:'#7c3aed', color:'#fff', padding:'4px 8px', borderRadius:0, boxShadow:'0 0 0 3px #3b1747 inset' }}>XP: {xp}</span>
            <span title="Streak" style={{ background:'#0f0a1f', color:'#e9d5ff', padding:'4px 8px', borderRadius:0, border:'1px solid #3b1747' }}>🔥 Streak: {streak} days</span>
            <span title="Activities" style={{ background:'#0f0a1f', color:'#e9d5ff', padding:'4px 8px', borderRadius:0, border:'1px solid #3b1747' }}>✅ Activities: {totalActivities}</span>
            <span title="Level" style={{ background:'#0f0a1f', color:'#e9d5ff', padding:'4px 8px', borderRadius:0, border:'1px solid #3b1747' }}>⬆️ Level: {level}</span>
            <span title="Rank" style={{ background:'#0f0a1f', color:'#e9d5ff', padding:'4px 8px', borderRadius:0, border:'1px solid #3b1747' }}>🏅 Rank: {rank}</span>
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          {/* Future: name edit or upload avatar UI */}
          <button className="btn" style={{ background:'#7c3aed', boxShadow:'0 0 0 3px #3b1747 inset', borderRadius:0 }} onClick={() => {
            const name = prompt('Update display name', profile.name || 'Student');
            if (name && name.trim()) { const next = { ...profile, name: name.trim() }; setProfile(next); saveProfile(next); updateProgress(p => ({...p, name: name.trim()})); }
          }}>Edit Name</button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:12, marginTop:12 }}>
        <div style={{ background:'#1b1233', color:'#e9d5ff', boxShadow:'0 0 0 4px #3b1747 inset', border:'3px solid #7c3aed', padding:12, borderRadius:8 }}>
          <div style={{ color:'#c4b5fd', fontSize:12, marginBottom:4 }}>Next Unlock</div>
          {nextUnlock ? (
            <div>
              <div style={{ fontWeight:700 }}>{nextUnlock.name}</div>
              <div style={{ fontSize:12, color:'#c4b5fd' }}>{Math.max(0, nextUnlock.cost - xp)} XP to go</div>
            </div>
          ) : (
            <div style={{ fontSize:12, color:'#c4b5fd' }}>All avatars unlocked!</div>
          )}
        </div>
        <div style={{ background:'#1b1233', color:'#e9d5ff', boxShadow:'0 0 0 4px #3b1747 inset', border:'3px solid #7c3aed', padding:12, borderRadius:8 }}>
          <div style={{ color:'#c4b5fd', fontSize:12, marginBottom:4 }}>Milestones</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            <span className="btn" style={{ background: xp>=100?'#22c55e':'#3b1747' }}>100 XP</span>
            <span className="btn" style={{ background: xp>=250?'#22c55e':'#3b1747' }}>250 XP</span>
            <span className="btn" style={{ background: xp>=500?'#22c55e':'#3b1747' }}>500 XP</span>
          </div>
        </div>
        <div style={{ background:'#1b1233', color:'#e9d5ff', boxShadow:'0 0 0 4px #3b1747 inset', border:'3px solid #7c3aed', padding:12, borderRadius:8 }}>
          <div style={{ color:'#c4b5fd', fontSize:12, marginBottom:4 }}>Badges</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            <span title="3-day streak" className="btn" style={{ background: streak>=3?'#7c3aed':'#3b1747' }}>🔥3</span>
            <span title="7-day streak" className="btn" style={{ background: streak>=7?'#7c3aed':'#3b1747' }}>🔥7</span>
            <span title="10 activities" className="btn" style={{ background: totalActivities>=10?'#7c3aed':'#3b1747' }}>✅10</span>
            <span title="25 activities" className="btn" style={{ background: totalActivities>=25?'#7c3aed':'#3b1747' }}>✅25</span>
          </div>
        </div>
      </div>

      <div style={{ background:'#1b1233', color:'#e9d5ff', boxShadow:'0 0 0 4px #3b1747 inset', border:'3px solid #7c3aed', marginTop:12, padding:12, borderRadius:8 }}>
        <h3 style={{ marginTop:0 }}>Avatar Gallery</h3>
        <p style={{ marginTop:0, color:'#c4b5fd' }}>Unlock new avatars by trading XP. You can upload custom avatars soon; this gallery uses placeholders for now.</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(192px, 1fr))', gap:14 }}>
          {AVATARS.map(av => {
            const isUnlocked = unlocked.has(av.id) || av.cost === 0;
            const isSelected = (profile.selectedAvatar || 'starter') === av.id;
            return (
              <div key={av.id} style={{ border:'2px solid #7c3aed', background:'#0f0a1f', padding:12, borderRadius:8, textAlign:'center' }}>
                <div style={{ width:168, height:168, margin:'0 auto 10px', border:'2px solid #3b1747', boxShadow:'0 0 0 3px #3b1747 inset', background:'#1b1233', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <img src={av.src} alt={av.name} style={{ width:'100%', height:'100%', objectFit:'cover', imageRendering:'pixelated' }} />
                </div>
                <div style={{ fontWeight:700 }}>{av.name}</div>
                <div style={{ fontSize:12, color:'#c4b5fd' }}>{av.cost === 0 ? 'Free' : `${av.cost} XP`}</div>
                <div style={{ marginTop:8 }}>
                  {!isUnlocked ? (
                    <button className="btn" style={{ background: canAfford(av.cost) ? '#22c55e' : '#6b7280' }} disabled={!canAfford(av.cost)} onClick={() => unlock(av.id, av.cost)}>
                      Unlock
                    </button>
                  ) : isSelected ? (
                    <span className="btn" style={{ background:'#7c3aed' }}>Selected</span>
                  ) : (
                    <button className="btn" style={{ background:'#2563eb' }} onClick={() => selectAvatar(av.id)}>Select</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:12, marginTop:12 }}>
        <div style={{ background:'#1b1233', color:'#e9d5ff', boxShadow:'0 0 0 4px #3b1747 inset', border:'3px solid #7c3aed', padding:12, borderRadius:8 }}>
          <h3 style={{ marginTop:0 }}>Recent Activity</h3>
          {(progress.results || []).slice(-5).reverse().map((r,idx)=>{
            const d = new Date(r.timestamp);
            const when = isNaN(d.getTime()) ? '' : d.toLocaleDateString();
            return (
              <div key={idx} style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap:8, padding:'6px 0', borderBottom:'1px solid #3b1747' }}>
                <div style={{ color:'#c4b5fd' }}>{r.topic}</div>
                <div>Score: {r.score}/{r.total || '?'}</div>
                <div style={{ color:'#a78bfa' }}>{when}</div>
              </div>
            );
          })}
          {(progress.results || []).length === 0 && (
            <div style={{ color:'#c4b5fd' }}>No activity yet. Play a game or take a quiz to get started!</div>
          )}
        </div>
        <div style={{ background:'#1b1233', color:'#e9d5ff', boxShadow:'0 0 0 4px #3b1747 inset', border:'3b1747', padding:12, borderRadius:8, border:'3px solid #7c3aed' }}>
          <h3 style={{ marginTop:0 }}>Streak Tips</h3>
          <ul style={{ marginTop:6, paddingLeft:18 }}>
            <li>Complete at least one activity each day to keep your streak alive.</li>
            <li>Quizzes and mini-games that record progress count towards your streak.</li>
            <li>Unlock avatars to show off your achievements!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
