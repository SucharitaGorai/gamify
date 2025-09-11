import React, { useRef, useEffect, useState } from "react";

const MomentumSimulator = () => {
  const canvasRef = useRef(null);

  const [mass1, setMass1] = useState(2);
  const [vel1, setVel1] = useState(5);
  const [mass2, setMass2] = useState(3);
  const [vel2, setVel2] = useState(0);
  const [collisionType, setCollisionType] = useState("elastic");

  const [beforeText, setBeforeText] = useState("");
  const [afterText, setAfterText] = useState("");
  const [totalText, setTotalText] = useState("");

  const cart1Ref = useRef({ x: 50, y: 200, width: 80, height: 50, color: "red", m: 2, v: 5 });
  const cart2Ref = useRef({ x: 600, y: 200, width: 80, height: 50, color: "blue", m: 3, v: 0 });
  const runningRef = useRef(false);

  const slowMotionFactor = 0.3;
  const arrowScale = 10;

  const baseWidth = 800;
  const baseHeight = 300;

  const drawCart = (ctx, cart, scale) => {
    ctx.fillStyle = cart.color;
    ctx.fillRect(cart.x * scale, cart.y * scale, cart.width * scale, cart.height * scale);

    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc((cart.x + 15) * scale, (cart.y + cart.height) * scale, 10 * scale, 0, Math.PI * 2);
    ctx.arc((cart.x + cart.width - 15) * scale, (cart.y + cart.height) * scale, 10 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.font = `${14 * scale}px Arial`;
    ctx.fillText(`${cart.m}kg`, (cart.x + cart.width / 2 - 15) * scale, (cart.y + cart.height / 2 + 5) * scale);
  };

  const drawArrow = (ctx, cart, scale) => {
    const length = cart.v * arrowScale * scale;
    const startX = (cart.x + cart.width / 2) * scale;
    const startY = (cart.y - 15) * scale;

    ctx.strokeStyle = "green";
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX + length, startY);
    ctx.stroke();

    ctx.beginPath();
    if (length >= 0) {
      ctx.moveTo(startX + length, startY);
      ctx.lineTo(startX + length - 5 * scale, startY - 5 * scale);
      ctx.lineTo(startX + length - 5 * scale, startY + 5 * scale);
    } else {
      ctx.moveTo(startX + length, startY);
      ctx.lineTo(startX + length + 5 * scale, startY - 5 * scale);
      ctx.lineTo(startX + length + 5 * scale, startY + 5 * scale);
    }
    ctx.closePath();
    ctx.fillStyle = "green";
    ctx.fill();
  };

  const handleCollision = () => {
    const cart1 = cart1Ref.current;
    const cart2 = cart2Ref.current;

    const p1Before = cart1.m * cart1.v;
    const p2Before = cart2.m * cart2.v;
    setBeforeText(`Before collision: Cart1 p = ${p1Before.toFixed(2)}, Cart2 p = ${p2Before.toFixed(2)}`);

    if (collisionType === "elastic") {
      const u1 = cart1.v, u2 = cart2.v;
      const m1 = cart1.m, m2 = cart2.m;
      cart1.v = ((m1 - m2) / (m1 + m2)) * u1 + ((2 * m2) / (m1 + m2)) * u2;
      cart2.v = ((2 * m1) / (m1 + m2)) * u1 + ((m2 - m1) / (m1 + m2)) * u2;
    } else {
      const totalMomentum = cart1.m * cart1.v + cart2.m * cart2.v;
      const totalMass = cart1.m + cart2.m;
      const finalV = totalMomentum / totalMass;
      cart1.v = finalV;
      cart2.v = finalV;
    }

    const p1After = cart1.m * cart1.v;
    const p2After = cart2.m * cart2.v;
    setAfterText(`After collision: Cart1 p = ${p1After.toFixed(2)}, Cart2 p = ${p2After.toFixed(2)}`);
    setTotalText(
      `Total momentum: Before = ${(p1Before + p2Before).toFixed(2)}, After = ${(p1After + p2After).toFixed(2)}`
    );

    runningRef.current = true;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const update = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const scale = canvas.width / baseWidth;

      if (runningRef.current) {
        const cart1 = cart1Ref.current;
        const cart2 = cart2Ref.current;

        cart1.x += cart1.v * slowMotionFactor;
        cart2.x += cart2.v * slowMotionFactor;

        if (cart1.x + cart1.width >= cart2.x && Math.abs(cart1.v - cart2.v) > 0) {
          runningRef.current = false;
          handleCollision();
        }
      }

      drawCart(ctx, cart1Ref.current, scale);
      drawCart(ctx, cart2Ref.current, scale);
      drawArrow(ctx, cart1Ref.current, scale);
      drawArrow(ctx, cart2Ref.current, scale);

      requestAnimationFrame(update);
    };

    update();
  }, [collisionType]);

  const launch = () => {
    cart1Ref.current = { ...cart1Ref.current, m: parseFloat(mass1), v: parseFloat(vel1), x: 50 };
    cart2Ref.current = { ...cart2Ref.current, m: parseFloat(mass2), v: parseFloat(vel2), x: 600 };
    runningRef.current = true;
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h1>Momentum Collision Simulator</h1>
      <div style={{ marginBottom: "10px" }}>
        <label>
          Cart 1 Mass: {mass1}kg
          <input type="range" min="1" max="10" step="1" value={mass1} onChange={(e) => setMass1(e.target.value)} />
        </label>
        &nbsp;
        <label>
          Cart 1 Velocity: {vel1} m/s
          <input type="range" min="-10" max="10" step="0.1" value={vel1} onChange={(e) => setVel1(e.target.value)} />
        </label>
        &nbsp;
        <label>
          Cart 2 Mass: {mass2}kg
          <input type="range" min="1" max="10" step="1" value={mass2} onChange={(e) => setMass2(e.target.value)} />
        </label>
        &nbsp;
        <label>
          Cart 2 Velocity: {vel2} m/s
          <input type="range" min="-10" max="10" step="0.1" value={vel2} onChange={(e) => setVel2(e.target.value)} />
        </label>
        &nbsp;
        <label>
          Collision Type:
          <select value={collisionType} onChange={(e) => setCollisionType(e.target.value)}>
            <option value="elastic">Elastic</option>
            <option value="inelastic">Inelastic</option>
          </select>
        </label>
        &nbsp;
        <button onClick={launch}>Launch</button>
      </div>

      {/* ✅ Responsive Canvas Wrapper */}
      <div style={{ width: "100%", maxWidth: "800px", margin: "0 auto" }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={300}
          style={{ width: "100%", height: "auto", border: "2px solid black" }}
        ></canvas>
      </div>

      <div style={{ marginTop: "10px", fontWeight: "bold" }}>
        <div>{beforeText}</div>
        <div>{afterText}</div>
        <div style={{ color: "orange" }}>{totalText}</div>
      </div>
    </div>
  );
};

export default MomentumSimulator;
