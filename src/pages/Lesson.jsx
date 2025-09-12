import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

export default function ScienceAdventureLab() {
  const [showCards, setShowCards] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [sparkles, setSparkles] = useState([]);

  useEffect(() => {
    const generateSparkles = () => {
      const newSparkles = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 20 + 10,
        delay: Math.random() * 5,
        duration: Math.random() * 3 + 2,
      }));
      setSparkles(newSparkles);
    };

    generateSparkles();
    const interval = setInterval(generateSparkles, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setShowCards(true), 300);
    return () => clearTimeout(t);
  }, []);

  const chapters = useMemo(() => [
    { title: 'Crop Production and Management', category: 'Biology', icon: '🌱', status: 'locked', link: '/chapter1', pdfLink: '/pdfs/chapter1.pdf' },
    { title: 'Plant Life', category: 'Biology', icon: '🌱', status: 'locked', link: '/chapter2', pdfLink: '/pdfs/chapter2.pdf' },
    { title: 'Animal Kingdom', category: 'Biology', icon: '🦁', status: 'locked', link: '/chapter3', pdfLink: '/pdfs/chapter3.pdf' },
    { title: 'Water Cycle', category: 'Earth', icon: '💧', status: 'locked', link: '/chapter4', pdfLink: '/pdfs/chapter4.pdf' },
    { title: 'Human Body', category: 'Biology', icon: '🫀', status: 'locked', link: '/chapter5', pdfLink: '/pdfs/chapter5.pdf' },
    { title: 'Electricity', category: 'Physics', icon: '⚡', status: 'locked', link: '/chapter6', pdfLink: '/pdfs/chapter6.pdf' },
    { title: 'Chemistry', category: 'Chemistry', icon: '🧪', status: 'locked', link: '/chapter7', pdfLink: '/pdfs/chapter7.pdf' },
    { title: 'Forces & Motion', category: 'Physics', icon: '⚙', status: 'available', link: '/chapter8', pdfLink: '/pdfs/chapter8.pdf' },
    { title: 'Light & Sound', category: 'Physics', icon: '📣', status: 'locked', link: '/chapter9', pdfLink: '/pdfs/chapter9.pdf' },
    { title: 'Earth Science', category: 'Earth', icon: '🪨', status: 'locked', link: '/chapter10', pdfLink: '/pdfs/chapter10.pdf' },
    { title: 'Space Exploration', category: 'Physics', icon: '🚀', status: 'locked', link: '/chapter11', pdfLink: '/pdfs/chapter11.pdf' },
    { title: 'Environmental Science', category: 'Earth', icon: '🍃', status: 'locked', link: '/chapter12', pdfLink: '/pdfs/chapter12.pdf' },
  ], []);

  const filteredChapters = activeTab === 'All'
    ? chapters
    : chapters.filter(ch => ch.category === activeTab);

  const handleCardHover = (index) => {
    setHoveredCard(index);
  };

  return (
    <div className="sal-root">
      <div className="background-container">
        <div className="floating-shapes">
          {sparkles.map((sparkle) => (
            <div
              key={sparkle.id}
              className="sparkle"
              style={{
                left: `${sparkle.x}%`,
                top: `${sparkle.y}%`,
                width: `${sparkle.size}px`,
                height: `${sparkle.size}px`,
                animationDelay: `${sparkle.delay}s`,
                animationDuration: `${sparkle.duration}s`,
              }}
            />
          ))}
          <div className="shape shape-1">🌟</div>
          <div className="shape shape-2">⭐</div>
          <div className="shape shape-3">✨</div>
          <div className="shape shape-4">🌈</div>
          <div className="shape shape-5">☁</div>
          <div className="shape shape-6">🎈</div>
          <div className="shape shape-7">🦋</div>
          <div className="shape shape-8">🌸</div>
        </div>
      </div>

      <header className="header">
        <div className="title-container">
          <h1 className="main-title">
            <span className="title-emoji">🌟</span>
            <span className="title-text">Super Science Explorers</span>
            <span className="title-emoji">🚀</span>
          </h1>
          <div className="title-decoration">
            <span className="deco-item">🔬</span>
            <span className="deco-item">⚗</span>
            <span className="deco-item">🧪</span>
          </div>
        </div>
        <p className="subtitle">Discover, Learn, and Have Fun with Science!</p>
        <div className="interactive-badges">
          <span className="badge pulse">🎮 Play & Learn</span>
          <span className="badge pulse" style={{ animationDelay: '1s' }}>🏆 Earn Badges</span>
          <span className="badge pulse" style={{ animationDelay: '2s' }}>🌍 Explore Worlds</span>
        </div>
      </header>

      <div className="tab-bar">
        {['All', 'Physics', 'Biology', 'Earth', 'Chemistry'].map((tab, index) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <span className="tab-text">{tab}</span>
            {activeTab === tab && <div className="tab-glow"></div>}
          </button>
        ))}
      </div>

      <div className="chapters-grid">
        {filteredChapters.map((chapter, index) => {
          const isAvailable = chapter.status === 'available';
          return (
            <div
              key={chapter.title}
              className={`chapter-card ${showCards ? 'visible' : ''} ${hoveredCard === index ? 'hovered' : ''}`}
              style={{ animationDelay: `${index * 100}ms` }}
              onMouseEnter={() => handleCardHover(index)}
              onMouseLeave={() => handleCardHover(null)}
            >
              <div className="card-gradient">
                <div className="card-content">
                  <div className="chapter-icon-container">
                    <div className="chapter-icon">{chapter.icon}</div>
                    {isAvailable ? <div className="available-badge">✅</div> : <div className="locked-badge">🔒</div>}
                  </div>
                  <h3 className="chapter-title">{chapter.title}</h3>
                  <div className="category-badge">{chapter.category}</div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: isAvailable ? '100%' : '0%' }}></div>
                  </div>
                  <div className="chapter-actions">
                    {isAvailable ? (
                      <>
                        <Link to={chapter.link} className="action-btn btn-primary">
                          🚀 Start Adventure
                        </Link>
                        <a
                          href={chapter.pdfLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="action-btn btn-secondary"
                        >
                          👁 Peek Inside
                        </a>
                      </>
                    ) : (
                      <>
                        <button className="action-btn btn-locked" disabled>
                          🔒 Coming Soon
                        </button>
                        <a
                          href={chapter.pdfLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="action-btn btn-secondary"
                        >
                          👁 Peek Inside
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {hoveredCard === index && (
                <div className="card-particles">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="particle" style={{ animationDelay: `${i * 0.1}s` }}></div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="fun-footer">
        <div className="footer-content">
          <span className="footer-text">
            <span className="bounce-icon">🎯</span>
            <span className="bounce-icon" style={{ animationDelay: '0.2s' }}>🚀</span>
            Ready to become a Science Superstar? You are in the correct Place..
            <span className="bounce-icon" style={{ animationDelay: '0.4s' }}>🌟</span>
            <span className="bounce-icon" style={{ animationDelay: '0.6s' }}>🔬</span>
          </span>
        </div>
      </div>

      <style>{`
        .sal-root {
          min-height: 100vh;
          height: 100vh;
          width: 100vw;
          position: fixed;
          top: 0;
          left: 0;
          overflow-y: auto;
          overflow-x: hidden;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
          font-family: 'Fredoka One', 'Comic Sans MS', cursive, sans-serif;
          box-sizing: border-box;
        }
        .sparkle { position: absolute; background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%); border-radius: 50%; animation: sparkle 3s ease-in-out infinite; pointer-events: none; }
        @keyframes sparkle { 0%, 100% { opacity: 0; transform: scale(0); } 50% { opacity: 1; transform: scale(1); } }
        .background-container { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; }
        .floating-shapes { position: absolute; width: 100%; height: 100%; }
        .shape { position: absolute; font-size: 2rem; animation: float 6s ease-in-out infinite; opacity: 0.7; }
        .shape-1 { top: 10%; left: 10%; animation-delay: 0s; } .shape-2 { top: 20%; right: 15%; animation-delay: 1s; } .shape-3 { top: 60%; left: 5%; animation-delay: 2s; } .shape-4 { top: 70%; right: 10%; animation-delay: 3s; } .shape-5 { top: 30%; left: 80%; animation-delay: 4s; } .shape-6 { top: 80%; left: 70%; animation-delay: 5s; } .shape-7 { top: 40%; right: 40%; animation-delay: 2.5s; } .shape-8 { top: 90%; left: 40%; animation-delay: 1.5s; }
        @keyframes float { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-20px) rotate(180deg); } }
        .header { text-align: center; margin-bottom: 25px; position: relative; z-index: 1; }
        .title-container { position: relative; display: inline-block; }
        .main-title { font-size: 3rem; font-weight: 900; color: white; text-shadow: 4px 4px 8px rgba(0,0,0,0.3); margin-bottom: 8px; display: flex; align-items: center; justify-content: center; gap: 15px; }
        .title-emoji { font-size: 2.5rem; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3)); animation: bounce 2s infinite; }
        .title-emoji:first-child { animation-delay: 0s; } .title-emoji:last-child { animation-delay: 0.5s; }
        .title-text { background: linear-gradient(45deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3); background-size: 400% 400%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: gradientShift 3s ease infinite; position: relative; z-index: 2; }
        .title-decoration { display: flex; justify-content: center; gap: 15px; margin-top: -10px; }
        .deco-item { font-size: 1.5rem; animation: bounce 2s infinite; }
        .deco-item:nth-child(2) { animation-delay: 0.3s; } .deco-item:nth-child(3) { animation-delay: 0.6s; }
        .subtitle { font-size: 1.2rem; color: #f0f8ff; font-weight: 600; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); margin-bottom: 15px; }
        .interactive-badges { display: flex; justify-content: center; gap: 15px; flex-wrap: wrap; }
        .badge { background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); padding: 8px 16px; border-radius: 20px; color: white; font-weight: 700; font-size: 0.9rem; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 2px solid rgba(255,255,255,0.3); }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes gradientShift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        .tab-bar { display: flex; justify-content: center; gap: 15px; margin-bottom: 20px; position: relative; z-index: 1; flex-wrap: wrap; }
        .tab { padding: 12px 20px; border-radius: 25px; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); font-weight: 700; cursor: pointer; border: none; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(0,0,0,0.1); position: relative; overflow: hidden; animation: slideIn 0.5s ease forwards; opacity: 0; }
        @keyframes slideIn { to { opacity: 1; transform: translateY(0); } from { opacity: 0; transform: translateY(-20px); } }
        .tab:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(0,0,0,0.2); }
        .tab.active { background: linear-gradient(45deg, #ff6b6b, #feca57); color: white; transform: scale(1.05); }
        .tab-glow { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%); animation: glow 2s ease-in-out infinite; }
        @keyframes glow { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        .tab-text { position: relative; z-index: 2; }
        .chapters-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; position: relative; z-index: 1; max-width: 100%; margin: 0 auto; padding: 0 10px; }
        .chapter-card { opacity: 0; transform: translateY(50px) scale(0.9); transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275); position: relative; }
        .chapter-card.visible { opacity: 1; transform: translateY(0) scale(1); }
        .chapter-card.hovered { transform: translateY(-10px) scale(1.02); z-index: 10; }
        .card-gradient { border-radius: 20px; padding: 3px; background-image: linear-gradient(135deg, #ffffff55, #ffffffaa); background-size: 200% 200%; animation: gradientMove 4s ease infinite; transition: all 0.3s ease; display: block; }
        .card-gradient:hover { transform: translateY(-8px) rotate(2deg); box-shadow: 0 15px 35px rgba(0,0,0,0.2); }
        @keyframes gradientMove { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        .card-content { background: rgba(255, 255, 255, 0.95); border-radius: 17px; padding: 20px 15px; text-align: center; position: relative; backdrop-filter: blur(10px); height: 100%; display: flex; flex-direction: column; justify-content: space-between; }
        .chapter-icon-container { position: relative; display: inline-block; margin-bottom: 15px; }
        .chapter-icon { font-size: 2.5rem; display: block; animation: bounce 2s infinite; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1)); }
        @keyframes bounce { 0%, 20%, 50%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-10px); } 60% { transform: translateY(-5px); } }
        .available-badge, .locked-badge { position: absolute; top: -5px; right: -5px; font-size: 1.2rem; background: white; border-radius: 50%; padding: 2px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); animation: wiggle 2s infinite; }
        @keyframes wiggle { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-10deg); } 75% { transform: rotate(10deg); } }
        .chapter-title { font-size: 1.1rem; font-weight: 800; margin-bottom: 8px; color: #2d3748; text-shadow: 1px 1px 2px rgba(0,0,0,0.1); line-height: 1.2; }
        .category-badge { display: inline-block; background: linear-gradient(45deg, #667eea, #764ba2); color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.7rem; font-weight: 600; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.5px; }
        .progress-bar { width: 100%; height: 6px; background: #e2e8f0; border-radius: 3px; margin-bottom: 15px; overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #48dbfb, #0abde3); border-radius: 3px; transition: width 0.5s ease; }
        .chapter-actions { display: flex; flex-direction: column; gap: 10px; }
        .action-btn { padding: 10px 16px; border-radius: 20px; font-weight: 700; cursor: pointer; border: none; transition: all 0.3s ease; font-size: 0.85rem; position: relative; overflow: hidden; text-align: center; text-decoration: none; }
        .action-btn:hover { transform: scale(1.05); }
        .btn-primary { background: linear-gradient(45deg, #ff6b6b, #feca57); color: white; box-shadow: 0 4px 15px rgba(255,107,107,0.4); }
        .btn-primary:hover { box-shadow: 0 8px 25px rgba(255,107,107,0.6); }
        .btn-locked { background: linear-gradient(45deg, #a0aec0, #cbd5e0); color: #4a5568; cursor: not-allowed; opacity: 0.7; }
        .btn-secondary { background: linear-gradient(45deg, #4ecdc4, #44a08d); color: white; box-shadow: 0 4px 15px rgba(78,205,196,0.3); }
        .btn-secondary:hover { box-shadow: 0 8px 25px rgba(78,205,196,0.5); }
        .card-particles { position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; border-radius: 20px; overflow: hidden; }
        .particle { position: absolute; width: 4px; height: 4px; background: white; border-radius: 50%; animation: particle-float 1s ease-out forwards; }
        @keyframes particle-float { 0% { transform: translate(0, 0) scale(0); opacity: 1; } 100% { transform: translate(var(--x, 10px), var(--y, -10px)) scale(1); opacity: 0; } }
        .fun-footer { text-align: center; margin-top: 30px; padding: 20px; position: relative; z-index: 1; }
        .footer-content { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 20px; padding: 15px; display: inline-block; border: 2px solid rgba(255,255,255,0.2); }
        .footer-text { color: white; font-weight: 700; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; gap: 10px; flex-wrap: wrap; }
        .bounce-icon { font-size: 1.5rem; animation: bounce 2s infinite; display: inline-block; }
        @media (max-width: 1200px) { .chapters-grid { grid-template-columns: repeat(3, 1fr); gap: 18px; } }
        @media (max-width: 900px) {
          .chapters-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
          .main-title { font-size: 2.5rem; }
          .title-emoji { font-size: 2rem; }
        }
        @media (max-width: 768px) {
          .main-title { font-size: 2rem; flex-direction: column; gap: 10px; }
          .title-emoji { font-size: 1.8rem; }
          .chapters-grid { grid-template-columns: 1fr; gap: 15px; }
          .tab-bar { gap: 10px; }
          .tab { padding: 8px 12px; font-size: 0.85rem; }
          .sal-root { padding: 15px; }
          .interactive-badges { flex-direction: column; align-items: center; }
          .footer-text { flex-direction: column; gap: 5px; font-size: 1rem; }
        }
      `}</style>
    </div>
  );
}