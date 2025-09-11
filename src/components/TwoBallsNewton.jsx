import React, { useState, useEffect, useRef } from "react";

export default function PushBallNewton() {
  const stageRef = useRef(null);
  const ball1Ref = useRef(null);
  const ball2Ref = useRef(null);

  const [force1, setForce1] = useState(20);
  const [force2, setForce2] = useState(20);
  const [mass1, setMass1] = useState(5);
  const [mass2, setMass2] = useState(8);
  const [pos1, setPos1] = useState(100);
  const [pos2, setPos2] = useState(100);
  const [vel1, setVel1] = useState(0);
  const [vel2, setVel2] = useState(0);
  const [infoText, setInfoText] = useState("");

  const stageWidth = stageRef.current?.clientWidth || 800;

  useEffect(() => {
    setPos1(100);
    setPos2(100);
    setVel1(0);
    setVel2(0);
  }, []);

  useEffect(() => {
    let animationFrame;

    const update = () => {
      const a1 = force1 / mass1;
      const a2 = force2 / mass2;

      let newVel1 = vel1 + a1 * 0.02;
      let newVel2 = vel2 + a2 * 0.02;

      let newPos1 = pos1 + newVel1;
      let newPos2 = pos2 + newVel2;

      const maxPos = stageWidth - 40;

      if (newPos1 > maxPos) {
        newPos1 = maxPos;
        newVel1 = 0;
      }
      if (newPos2 > maxPos) {
        newPos2 = maxPos;
        newVel2 = 0;
      }

      setPos1(newPos1);
      setPos2(newPos2);
      setVel1(newVel1);
      setVel2(newVel2);

      setInfoText(
        `Ball1 Accel: ${a1.toFixed(2)} m/s² | Ball2 Accel: ${a2.toFixed(2)} m/s²`
      );

      animationFrame = requestAnimationFrame(update);
    };

    animationFrame = requestAnimationFrame(update);

    return () => cancelAnimationFrame(animationFrame);
  }, [force1, force2, mass1, mass2, pos1, pos2, vel1, vel2, stageWidth]);

  const handleReset = () => {
    setPos1(100);
    setPos2(100);
    setVel1(0);
    setVel2(0);
    setForce1(20);
    setForce2(20);
    setMass1(5);
    setMass2(8);
  };

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        background: "#f4f4f4",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "20px",
      }}
    >
      <div style={{ maxWidth: "900px", width: "100%" }}>
        {/* Sliders ABOVE */}
        <div
          style={{
            background: "#fff",
            padding: "16px",
            borderRadius: "12px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-around",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          <div>
            <label>
              P1 Force: <b>{force1}</b> N
            </label>
            <input
              type="range"
              min="0"
              max="50"
              value={force1}
              onChange={(e) => setForce1(Number(e.target.value))}
            />
            <br />
            <label>
              P1 Mass: <b>{mass1}</b> kg
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={mass1}
              onChange={(e) => setMass1(Number(e.target.value))}
            />
          </div>

          <div>
            <label>
              P2 Force: <b>{force2}</b> N
            </label>
            <input
              type="range"
              min="0"
              max="50"
              value={force2}
              onChange={(e) => setForce2(Number(e.target.value))}
            />
            <br />
            <label>
              P2 Mass: <b>{mass2}</b> kg
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={mass2}
              onChange={(e) => setMass2(Number(e.target.value))}
            />
          </div>

          <button
            onClick={handleReset}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              background: "#007acc",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              height: "40px",
              alignSelf: "center",
            }}
          >
            Reset
          </button>
        </div>

        {/* Stage in the middle */}
        <div
          ref={stageRef}
          style={{
            background: "#e0f7ff",
            borderRadius: "12px",
            position: "relative",
            overflow: "hidden",
            minHeight: "300px",
            border: "3px solid #007acc",
          }}
        >
          {/* Info */}
         
{/* Info */}
<div
  style={{
    position: "absolute",
    top: "10px",
    left: "50%",
    transform: "translateX(-50%)",
    fontWeight: "bold",
    fontSize: "16px",
    whiteSpace: "nowrap", // Prevent line break
    textAlign: "center",
  }}
>
  {infoText}
</div>

          {/* Player emojis */}
          {/* Player emojis (rotated vertically) */}
{/* Player emojis */}
{/* Player emojis (mirrored) */}
<div style={{ position: "absolute", top: "50px", left: "30px" }}>
  <span
    style={{
      fontSize: "40px",
      display: "inline-block",
      transform: "scaleX(-1)", // Mirror P1
    }}
  >
    🏃‍♂
  </span>
  <div style={{ fontSize: "12px", fontWeight: "bold" }}>P1</div>
</div>

<div style={{ position: "absolute", bottom: "50px", left: "30px" }}>
  <span
    style={{
      fontSize: "40px",
      display: "inline-block",
      transform: "scaleX(-1)", // Mirror P2
    }}
  >
    🏃‍♀
  </span>
  <div style={{ fontSize: "12px", fontWeight: "bold" }}>P2</div>
</div>

          {/* Balls */}
          <div
            ref={ball1Ref}
            style={{
              position: "absolute",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              background: "#ff6347",
              top: "70px",
              left: `${pos1}px`,
            }}
          >
            ⚽
          </div>
          <div
            ref={ball2Ref}
            style={{
              position: "absolute",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              background: "#32cd32",
              bottom: "70px",
              left: `${pos2}px`,
            }}
          >
            ⚽
          </div>
        </div>

        {/* Description BELOW */}
        <div
          style={{
            marginTop: "20px",
            padding: "14px",
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: "8px",
            fontSize: "14px",
            lineHeight: "1.5",
          }}
        >
          <b>Newton’s Second Law of Motion:</b>
          <br />
          The acceleration (<i>a</i>) of an object is directly proportional to the
          net force (<i>F</i>) applied and inversely proportional to its mass (<i>m</i>):  
          <br />
          <code>F = m × a → a = F / m</code>
          <br />
          <br />
          🔹 If you increase the <b>force</b>, acceleration increases.
          <br />
          🔹 If you increase the <b>mass</b>, acceleration decreases.
          <br />
          <br />
          👉 Try changing the sliders above to see how the balls move differently!
        </div>
      </div>
    </div>
  );
}
