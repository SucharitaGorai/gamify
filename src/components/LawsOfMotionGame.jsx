import React, { useState, useEffect } from "react";

export default function ForceEffectsGame() {
  return (
    <div style={{ fontFamily: "Segoe UI, sans-serif", padding: "20px" }}>
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
        🎮 Effects of Force Demo
      </h1>

      {/* 1. Start/Stop Motion */}
      <StartStopDemo />

      {/* 2. Change Speed / Direction */}
      <SpeedDirectionDemo />

      {/* 3. Change Shape / Size */}
      <ShapeChangeDemo />
    </div>
  );
}

// --------------- DEMO 1: START / STOP -----------------
// --------------- DEMO 1: START / STOP -----------------
function StartStopDemo() {
  const [pos, setPos] = useState(30);
  const [moving, setMoving] = useState(false);
  const [angle, setAngle] = useState(0); // rotation for rolling effect
  const [groundOffset, setGroundOffset] = useState(0); // ground scroll

  useEffect(() => {
    let frame;
    const animate = () => {
      setPos((p) => {
        if (moving) {
          setAngle((a) => a + 10); // spin ball
          setGroundOffset((g) => (g - 5) % 40); // scroll ground
          return (p + 3) % 340; // loop back after crossing box width
        }
        return p;
      });
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [moving]);

  const handleReset = () => {
    setMoving(false);
    setPos(30);
    setAngle(0);
    setGroundOffset(0);
  };

  return (
    <div style={cardStyle}>
      <h2>1️⃣ Force Starts or Stops Motion</h2>
      <p>Click push to roll the ball, stop to halt it, reset to start again.</p>

      <div
        style={{
          ...boxStyle,
          background: "linear-gradient(#87ceeb, #87ceeb 60%, green 60%)",
          overflow: "hidden",
        }}
      >
        {/* Scrolling Ground */}
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: `${groundOffset}px`,
            width: "200%",
            height: "40%",
            backgroundImage:
              "linear-gradient(to right, #228B22 20px, #006400 20px)", // striped ground
            backgroundSize: "40px 100%",
          }}
        />

        {/* Ball */}
        <img
          src="/ball.png"
          alt="ball"
          style={{
            position: "absolute",
            left: `${pos}px`,
            top: "40px",
            width: "50px",
            transform: `rotate(${angle}deg)`,
            transition: moving ? "none" : "transform 0.3s ease",
          }}
        />
      </div>

      <button onClick={() => setMoving(true)} style={btnStyle}>
        Push (Start)
      </button>
      <button onClick={() => setMoving(false)} style={btnStyle}>
        Stop
      </button>
      <button onClick={handleReset} style={{ ...btnStyle, background: "orange" }}>
        Reset
      </button>
    </div>
  );
}


// --------------- DEMO 2: SPEED / DIRECTION -----------------
function SpeedDirectionDemo() {
  const [pos, setPos] = React.useState({ x: 100, y: 40 });
  const [velocity, setVelocity] = React.useState({ x: 0, y: 0 });
  const [rotation, setRotation] = React.useState(0);
  const [groundOffset, setGroundOffset] = React.useState(0);

  const boxStyle = {
    position: "relative",
    width: "320px",
    height: "150px",
    overflow: "hidden",
    border: "2px solid #333",
    margin: "20px auto",
    borderRadius: "10px",
    background: "linear-gradient(#87ceeb, #87ceeb 60%, green 60%)",
  };

  const btnStyle = {
    margin: "5px",
    padding: "8px 12px",
    fontSize: "14px",
    cursor: "pointer",
  };

  const cardStyle = {
    fontFamily: "Segoe UI, sans-serif",
    padding: "20px",
    maxWidth: "400px",
    margin: "auto",
    textAlign: "center",
  };

  React.useEffect(() => {
    let frame;
    const animate = () => {
      setPos((p) => {
        const newX = Math.max(0, Math.min(270, p.x + velocity.x));
        const newY = Math.max(0, Math.min(100, p.y + velocity.y));

        // Ball rotation based on speed
        const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
        setRotation((r) => r + speed * 10);

        // Ground scrolling
        setGroundOffset((offset) => offset - velocity.x);

        return { x: newX, y: newY };
      });

      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [velocity]);

  const handleKick = (dir) => {
    setVelocity((v) => ({ x: v.x + dir.x, y: v.y + dir.y }));
  };

  const handleReset = () => {
    setPos({ x: 100, y: 40 });
    setVelocity({ x: 0, y: 0 });
    setRotation(0);
    setGroundOffset(0);
  };

  return (
    <div style={cardStyle}>
      <h2>⚽ Force Changes Speed and Direction</h2>
      <p>Kick the ball using buttons, reset to restart.</p>

      <div style={boxStyle}>
        {/* Ground */}
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: `${groundOffset}px`,
            width: "1000px",
            height: "60px",
            background: "green",
          }}
        />

        {/* Ball */}
        <div
          style={{
            position: "absolute",
            left: `${pos.x}px`,
            top: `${pos.y}px`,
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            background: "orange",
            transform: `rotate(${rotation}deg)`,
            transition: "transform 0.05s linear",
          }}
        />
      </div>

      <div>
        <button onClick={() => handleKick({ x: 2, y: 0 })} style={btnStyle}>
          Kick →
        </button>
        <button onClick={() => handleKick({ x: -2, y: 0 })} style={btnStyle}>
          Kick ←
        </button>
        <button onClick={() => handleKick({ x: 0, y: -2 })} style={btnStyle}>
          Kick ↑
        </button>
        <button onClick={() => handleKick({ x: 0, y: 2 })} style={btnStyle}>
          Kick ↓
        </button>
        <button onClick={handleReset} style={{ ...btnStyle, background: "orange" }}>
          Reset
        </button>
      </div>
    </div>
  );
}


// --------------- DEMO 3: SHAPE CHANGE -----------------
function ShapeChangeDemo() {
  const [stretched, setStretched] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <div style={cardStyle}>
      <h2>🌀 3️⃣ Force Changes Shape or Size</h2>
      <p>Stretch the spring or press the ball to see deformation.</p>

      {/* Spring */}
      <div style={{ marginBottom: "20px" }}>
        <img
          src={stretched ? "/spring-stretched.png" : "/spring.png"}
          alt="spring"
          style={{ width: "200px", transition: "all 0.3s ease" }}
        />
        <br />
        <button onClick={() => setStretched((s) => !s)} style={btnStyle}>
          {stretched ? "Release Spring" : "Stretch Spring"}
        </button>
      </div>

      {/* Ball deformation */}
      <div>
        <div
          style={{
            width: pressed ? "100px" : "80px",
            height: pressed ? "50px" : "80px",
            background: "lightgreen",
            borderRadius: "50%",
            margin: "auto",
            transition: "all 0.3s ease",
            border: "2px solid darkgreen",
          }}
        />
        <button onClick={() => setPressed((p) => !p)} style={btnStyle}>
          {pressed ? "Release Ball" : "Press Ball"}
        </button>
      </div>
    </div>
  );
}

// --------------- STYLES -----------------
const cardStyle = {
  border: "2px solid #ccc",
  borderRadius: "12px",
  padding: "16px",
  marginBottom: "24px",
  boxShadow: "2px 2px 8px rgba(0,0,0,0.1)",
  textAlign: "center",
};

const boxStyle = {
  position: "relative",
  height: "140px",
  border: "2px solid black",
  margin: "20px auto",
  width: "340px",
  borderRadius: "8px",
  background: "#fafafa",
  overflow: "hidden",
};

const btnStyle = {
  margin: "6px",
  padding: "8px 14px",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
  background: "#0077ff",
  color: "white",
  fontWeight: "bold",
};
