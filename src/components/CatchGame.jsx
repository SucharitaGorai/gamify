import React, { useState } from "react";

const css = `
.catch-game-container {
  font-family: sans-serif;
  max-width: 360px;
  margin: 24px auto;
  padding: 24px;
  border-radius: 12px;
  background: #eef5ff;
  box-shadow: 0 4px 16px rgba(0,0,0,0.09);
  text-align: center;
  user-select: none;
}
.ball {
  width: 44px;
  height: 44px;
  margin: 0 auto 20px;
  border-radius: 50%;
  background: #59a5ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  box-shadow: 0 1px 7px #2065c9aa;
  animation: ball-move 1s linear;
}
@keyframes ball-move {
  0% { transform: translateY(-120px);}
  100% { transform: translateY(0);}
}
.options {
  margin: 20px 0;
}
button {
  font-size: 18px;
  margin: 8px 6px;
  padding: 8px 16px;
  border-radius: 7px;
  border: 1px solid #1976d2;
  background: #fff;
  cursor: pointer;
  transition: background 0.15s;
}
button:hover {
  background: #1976d2;
  color: #fff;
}
.result {
  margin: 18px 0 10px 0;
  padding: 10px;
  border-radius: 7px;
  font-size: 16px;
  max-width: 320px;
  margin-left: auto;
  margin-right: auto;
}
.safe {
  background: #e7ffe6;
  border: 1px solid #26b441;
  color: #147313;
}
.injury {
  background: #ffe6e6;
  border: 1px solid #d60606;
  color: #c20000;
}
.law-explanation {
  margin-top: 18px;
  padding: 12px 14px 12px 14px;
  background: #fffbe6;
  border-radius: 8px;
  font-size: 15px;
  border-left: 4px solid #ffe100;
  max-width: 320px;
  margin: 16px auto 0 auto;
  text-align: left;
}
.player {
  position: relative;
  width: 120px;
  height: 180px;
  margin: 0 auto 12px;
}
.head {
  width: 40px;
  height: 40px;
  background: #ffdaac;
  border-radius: 50%;
  margin: 0 auto;
  position: relative;
  z-index: 3;
  box-shadow: inset 0 3px 0 #c68b2f;
}
.body {
  width: 80px;
  height: 110px;
  background: #60a3ff;
  border-radius: 20px 20px 12px 12px;
  margin: 0 auto;
  position: relative;
  top: -10px;
  box-shadow: inset 0 3px 0 #2f64c7;
}
.arm-left, .arm-right {
  position: absolute;
  top: 40px;
  width: 22px;
  height: 80px;
  background: #ffdaac;
  border-radius: 12px;
  transform-origin: top center;
  box-shadow: inset 0 3px 0 #c68b2f;
  transition: transform 0.6s ease;
}
.arm-left {
  left: -26px;
  transform: rotate(0deg);
  z-index: 2;
}
.arm-right {
  right: -26px;
  transform: rotate(0deg);
}
.arm-left.pulled {
  transform: rotate(-70deg);
  transition-timing-function: cubic-bezier(0.4, 1.5, 0.8, 1);
}
.arm-right.pulled {
  transform: rotate(15deg);
  transition-timing-function: cubic-bezier(0.4, 1.5, 0.8, 1);
}
.injury-glow {
  position: absolute;
  width: 28px;
  height: 28px;
  background: rgba(255, 0, 0, 0.5);
  border-radius: 50%;
  box-shadow: 0 0 12px 6px rgba(255, 0, 0, 0.7);
  top: 130px;
  left: 8px;
  animation: pulseInjury 1.2s infinite ease-in-out;
  pointer-events: none;
}
@keyframes pulseInjury {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 0.3; }
}
`;

function CatchGame() {
  const [result, setResult] = useState(null);
  const [pulledBack, setPulledBack] = useState(null);

  function handleChoice(pullsHandBack) {
    setPulledBack(pullsHandBack);
    setResult(pullsHandBack ? "safe" : "injury");
  }

  return (
    <div className="catch-game-container" role="main" aria-label="Newton's Second Law demo game to catch a ball">
      <style>{css}</style>

      <h2>Newton's Second Law Demo: Catch the Ball!</h2>

      <div className="ball" aria-label="Ball approaching player">🏏</div>

      <div className="player" aria-live="polite" aria-atomic="true">
        <div className={`arm-left ${pulledBack ? "pulled" : ""}`} aria-hidden="true" />
        <div className={`arm-right ${pulledBack ? "pulled" : ""}`} aria-hidden="true" />
        <div className="head" />
        <div className="body" />
        {result === "injury" && <div className="injury-glow" aria-label="Injury on player's hand" />}
      </div>

      <p>
        A cricket player is about to catch a fast-moving ball.<br />
        What should the player do to <strong>avoid injury</strong>?
      </p>

      <div className="options" role="group" aria-label="Options for catching the ball">
        <button onClick={() => handleChoice(true)} aria-pressed={pulledBack === true}>
          Pull hands back while catching
        </button>
        <button onClick={() => handleChoice(false)} aria-pressed={pulledBack === false}>
          Keep hands steady (don’t pull back)
        </button>
      </div>

      {result === "safe" && (
        <div className="result safe" role="alert" tabIndex={0}>
          ✔️ The force on the hands is <b>less</b>, and the player is <b>not injured</b>.<br />
          (Increased time to stop ball ⇒ reduced force)
        </div>
      )}
      {result === "injury" && (
        <div className="result injury" role="alert" tabIndex={0}>
          ⚠️ The force on the hands is <b>very high</b>, and the player is <b>injured</b>!<br />
          (Stopped suddenly ⇒ greater force)
        </div>
      )}

      <div className="law-explanation">
        <b>Newton's Second Law:</b><br />
        <i>
          Force = Change in momentum / Time <br />
          F = Δp / Δt
        </i>
        <br />
        <br />
        Pulling hands back increases <b>Δt</b> (the time to stop the ball), so <b>force is less</b>, preventing injury.<br />
        If hands are kept steady, <b>Δt</b> is small, so force is large, causing pain or injury.<br />
        <span style={{ color: "#1976d2" }}>
          This is a real-life demonstration of Newton's Second Law of Motion.
        </span>
      </div>
    </div>
  );
}

export default CatchGame;
