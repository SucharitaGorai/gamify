import React, { useEffect, useRef, useState } from "react";

export default function SpaceshipGame() {
  const canvasRef = useRef(null);
  const [started, setStarted] = useState(false);
  const spaceship = useRef({
    x: 0,
    y: 0,
    width: 50,
    height: 100,
    velocityY: 0,
  });
  const particles = useRef([]);
  const thrusting = useRef(false);
  const gravity = 0.05; // slower gravity
  const clouds = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // FIX: canvas set to container size, not full screen
    const GAME_WIDTH = 600;
    const GAME_HEIGHT = 400;
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;

    spaceship.current.x = GAME_WIDTH / 2 - 25;
    spaceship.current.y = GAME_HEIGHT - 200;

    // smaller clouds
    for (let i = 0; i < 6; i++) {
      clouds.current.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * (GAME_HEIGHT / 2),
        radius: 20 + Math.random() * 15, // 20–35 px
      });
    }

    const handleKeyDown = (e) => {
      if (e.code === "Space") {
        e.preventDefault(); // prevent page scroll
        thrusting.current = true;
        setStarted(true);
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        thrusting.current = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    function createParticle() {
      particles.current.push({
        x: spaceship.current.x + spaceship.current.width / 2,
        y: spaceship.current.y + spaceship.current.height,
        size: Math.random() * 3 + 2, // 2–5 px
        speedX: (Math.random() - 0.5) * 0.2,
        speedY: Math.random() * 0.8 + 0.3,
        alpha: 1,
        color: `rgb(${255}, ${Math.floor(Math.random() * 200)}, 0)`,
      });
    }

    function drawClouds() {
      ctx.fillStyle = "#87ceeb";
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      ctx.fillStyle = "white";
      clouds.current.forEach((cloud) => {
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.radius, cloud.y, cloud.radius * 0.8, 0, Math.PI * 2);
        ctx.arc(cloud.x - cloud.radius, cloud.y, cloud.radius * 0.8, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    function drawSpaceship() {
      ctx.save();
      ctx.translate(spaceship.current.x + spaceship.current.width / 2, spaceship.current.y);

      let bodyGradient = ctx.createLinearGradient(
        0,
        -spaceship.current.height / 2,
        0,
        spaceship.current.height / 2
      );
      bodyGradient.addColorStop(0, "#e0e0e0");
      bodyGradient.addColorStop(1, "#9e9e9e");

      ctx.fillStyle = bodyGradient;
      ctx.beginPath();
      ctx.moveTo(0, -spaceship.current.height / 2);
      ctx.lineTo(-spaceship.current.width / 2, spaceship.current.height / 2);
      ctx.lineTo(spaceship.current.width / 2, spaceship.current.height / 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#00bcd4";
      ctx.beginPath();
      ctx.arc(0, -spaceship.current.height / 4, spaceship.current.width / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#004d40";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#616161";
      ctx.beginPath();
      ctx.moveTo(-spaceship.current.width / 2, spaceship.current.height / 3);
      ctx.lineTo(-spaceship.current.width / 2 - 15, spaceship.current.height / 2);
      ctx.lineTo(-spaceship.current.width / 2, spaceship.current.height / 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(spaceship.current.width / 2, spaceship.current.height / 3);
      ctx.lineTo(spaceship.current.width / 2 + 15, spaceship.current.height / 2);
      ctx.lineTo(spaceship.current.width / 2, spaceship.current.height / 2);
      ctx.fill();

      ctx.restore();
    }

    function drawFlames() {
      if (!thrusting.current) return;

      ctx.save();
      ctx.translate(
        spaceship.current.x + spaceship.current.width / 2,
        spaceship.current.y + spaceship.current.height / 2
      );

      let flameGradient = ctx.createLinearGradient(
        0,
        spaceship.current.height / 2,
        0,
        spaceship.current.height / 2 + 30
      );
      flameGradient.addColorStop(0, "yellow");
      flameGradient.addColorStop(0.5, "orange");
      flameGradient.addColorStop(1, "red");

      ctx.fillStyle = flameGradient;
      ctx.beginPath();
      ctx.moveTo(-8, spaceship.current.height / 2);
      ctx.lineTo(0, spaceship.current.height / 2 + Math.random() * 10 + 5);
      ctx.lineTo(8, spaceship.current.height / 2);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    function drawArrows() {
      if (!thrusting.current) return;

      ctx.save();
      ctx.font = "14px Arial";

      ctx.fillStyle = "lime";
      let upX = spaceship.current.x + spaceship.current.width + 20;
      let upY = spaceship.current.y + spaceship.current.height / 3;
      ctx.beginPath();
      ctx.moveTo(upX, upY - 15);
      ctx.lineTo(upX - 10, upY);
      ctx.lineTo(upX - 4, upY);
      ctx.lineTo(upX - 4, upY + 15);
      ctx.lineTo(upX + 4, upY + 15);
      ctx.lineTo(upX + 4, upY);
      ctx.lineTo(upX + 10, upY);
      ctx.closePath();
      ctx.fill();
      ctx.fillText("Upward Movement", upX + 20, upY);

      ctx.fillStyle = "red";
      let downX = spaceship.current.x - 30;
      let downY = spaceship.current.y + spaceship.current.height / 1.5;
      ctx.beginPath();
      ctx.moveTo(downX, downY + 15);
      ctx.lineTo(downX - 10, downY);
      ctx.lineTo(downX - 4, downY);
      ctx.lineTo(downX - 4, downY - 15);
      ctx.lineTo(downX + 4, downY - 15);
      ctx.lineTo(downX + 4, downY);
      ctx.lineTo(downX + 10, downY);
      ctx.closePath();
      ctx.fill();
      ctx.fillText("Downward Force", downX - 90, downY);

      ctx.restore();
    }

    function update() {
      drawClouds();

      if (thrusting.current) {
        createParticle();
        spaceship.current.velocityY -= 0.08;
      }
      spaceship.current.velocityY += gravity;
      spaceship.current.y += spaceship.current.velocityY * 0.5;

      if (spaceship.current.y > GAME_HEIGHT - spaceship.current.height) {
        spaceship.current.y = GAME_HEIGHT - spaceship.current.height;
        spaceship.current.velocityY = 0;
      }
      if (spaceship.current.y < 0) {
        spaceship.current.y = 0;
        spaceship.current.velocityY = 0;
      }

      // particles
      for (let i = particles.current.length - 1; i >= 0; i--) {
        let p = particles.current[i];
        ctx.fillStyle = `rgba(${p.color.match(/\d+/g).join(",")}, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        p.x += p.speedX;
        p.y += p.speedY;
        p.alpha -= 0.008;

        if (p.alpha <= 0) particles.current.splice(i, 1);
      }

      drawFlames();
      drawSpaceship();
      drawArrows();

      requestAnimationFrame(update);
    }

    update();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        marginTop: "20px",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "600px",
          height: "400px",
          border: "2px solid #333",
          borderRadius: "12px",
          overflow: "hidden",
          background: "#f4f4f4",
        }}
      >
        {!started && (
          <div
            style={{
              position: "absolute",
              top: 10,
              left: "50%",
              transform: "translateX(-50%)",
              fontFamily: "Arial, sans-serif",
              fontSize: "20px",
              fontWeight: "bold",
              color: "black",
              pointerEvents: "none",
              whiteSpace: "nowrap",
              zIndex: 1,
            }}
          >
            Press SPACEBAR to Start
          </div>
        )}
        <canvas ref={canvasRef}></canvas>
      </div>
    </div>
  );
}
