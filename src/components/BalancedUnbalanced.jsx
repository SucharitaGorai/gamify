import React, { useState, useEffect, useRef } from "react";

export default function BalancedUnbalanced() {
  const stageRef = useRef(null);
  const blockRef = useRef(null);

  const [fLeft, setFLeft] = useState(0);
  const [fRight, setFRight] = useState(0);
  const [pos, setPos] = useState(0);
  const [statusText, setStatusText] = useState("Net Force: 0 N — Block is still");

  useEffect(() => {
    // Initialize block in center
    if (stageRef.current && blockRef.current) {
      const centerPos = stageRef.current.clientWidth / 2 - blockRef.current.offsetWidth / 2;
      setPos(centerPos);
    }
  }, []);

  useEffect(() => {
    let animationFrame;

    const updateMovement = () => {
      if (!stageRef.current || !blockRef.current) return;

      let newPos = pos;
      if (fLeft === fRight) {
        setStatusText("Net Force: 0 N — Block is still");
      } else if (fLeft > fRight) {
        newPos -= 1;
        if (newPos < 0) newPos = 0;
        setStatusText(`Net Force: ${fLeft - fRight} N left — Block moves left`);
      } else {
        newPos += 1;
        const maxPos = stageRef.current.clientWidth - blockRef.current.offsetWidth;
        if (newPos > maxPos) newPos = maxPos;
        setStatusText(`Net Force: ${fRight - fLeft} N right — Block moves right`);
      }
      setPos(newPos);

      animationFrame = requestAnimationFrame(updateMovement);
    };

    animationFrame = requestAnimationFrame(updateMovement);

    return () => cancelAnimationFrame(animationFrame);
  }, [pos, fLeft, fRight]);

  const handleReset = () => {
    if (stageRef.current && blockRef.current) {
      const centerPos = stageRef.current.clientWidth / 2 - blockRef.current.offsetWidth / 2;
      setPos(centerPos);
      setFLeft(0);
      setFRight(0);
      setStatusText("Net Force: 0 N — Block is still");
    }
  };

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        background: "#f4f4f4",
        margin: 0,
        padding: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "20px", maxWidth: "900px", width: "100%" }}>
        <div
          ref={stageRef}
          style={{
            background: "#ddd",
            borderRadius: "12px",
            position: "relative",
            overflow: "hidden",
            minHeight: "300px",
            paddingTop: "40px",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "50%",
              transform: "translateX(-50%)",
              fontWeight: "bold",
              fontSize: "16px",
            }}
          >
            {statusText}
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: "68px", height: "10px", background: "#aaa" }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: "48px", height: "20px", background: "#8b5a2b", zIndex: 0 }} />
          <div style={{ position: "absolute", bottom: "92px", left: 0, right: 0, height: "4px", background: "#654321", zIndex: 1 }} />

          {/* Puppets */}
          <div style={{ width: "60px", height: "80px", display: "flex", flexDirection: "column", alignItems: "center", position: "absolute", bottom: "88px", left: "20px" }}>
            <div style={{ width: "30px", height: "30px", background: "#ffcc99", borderRadius: "50%" }} />
            <div style={{ width: "20px", height: "40px", background: "#333", marginTop: "4px" }} />
          </div>
          <div style={{ width: "60px", height: "80px", display: "flex", flexDirection: "column", alignItems: "center", position: "absolute", bottom: "88px", right: "20px" }}>
            <div style={{ width: "30px", height: "30px", background: "#ffcc99", borderRadius: "50%" }} />
            <div style={{ width: "20px", height: "40px", background: "#333", marginTop: "4px" }} />
          </div>

          {/* Block */}
          <div
            ref={blockRef}
            style={{
              width: "70px",
              height: "48px",
              background: "tomato",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              position: "absolute",
              bottom: "68px",
              zIndex: 2,
              left: pos + "px",
            }}
          >
            BOX
          </div>
        </div>

        <aside
          style={{
            background: "#fff",
            padding: "14px",
            borderRadius: "12px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          }}
        >
          <label>
            Left Force (N): <strong>{fLeft}</strong>
          </label>
          <input type="range" min="0" max="40" step="1" value={fLeft} onChange={(e) => setFLeft(Number(e.target.value))} />

          <label>
            Right Force (N): <strong>{fRight}</strong>
          </label>
          <input type="range" min="0" max="40" step="1" value={fRight} onChange={(e) => setFRight(Number(e.target.value))} />

          <button onClick={handleReset} style={{ marginTop: "10px" }}>
            Reset
          </button>
        </aside>
      </div>
    </div>
  );
}
