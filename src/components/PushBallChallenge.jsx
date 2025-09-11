import React, { useState } from "react";
import "./PushBallChallenge.css";

export default function PushBallChallenge() {
  const [position, setPosition] = useState(0);
  const [force, setForce] = useState(5);

  const pushLeft = () => {
    setPosition((prev) => Math.max(prev - force * 10, -200)); // limit left
  };

  const pushRight = () => {
    setPosition((prev) => Math.min(prev + force * 10, 200)); // limit right
  };

  const reset = () => {
    setPosition(0);
  };

  return (
    <div className="pushball-container">
      <h2 className="title">⚽ Push the Ball Challenge</h2>

      {/* Slider ABOVE */}
      <div className="controls">
        <label>
          Force: <strong>{force}</strong>
        </label>
        <input
          type="range"
          min="1"
          max="20"
          value={force}
          onChange={(e) => setForce(Number(e.target.value))}
        />
      </div>

      {/* Arena in the middle */}
      <div className="arena">
        <div
          className="ball"
          style={{ transform: `translateX(${position}px)` }}
        ></div>
      </div>

      {/* Buttons BELOW */}
      <div className="buttons">
        <button className="btn left" onClick={pushLeft}>
          ⬅ Push Left
        </button>
        <button className="btn right" onClick={pushRight}>
          Push Right ➡
        </button>
        <button className="btn reset" onClick={reset}>
          🔄 Reset
        </button>
      </div>
    </div>
  );
}
