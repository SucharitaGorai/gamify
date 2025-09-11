import React, { useState } from "react";

const CaromCoinGame = () => {
  const INITIAL_COINS = [0, 1, 2, 3, 4];
  const MEDIUM_FORCE = 5;
  const HIGH_FORCE = 8;

  const COIN_HEIGHT = 20; // height of one coin
  const COIN_OFFSET = -5; // negative offset for stacking
  const STACK_TOP = 60; // top position of stack container

  const [coins, setCoins] = useState(INITIAL_COINS);
  const [scatteredCoins, setScatteredCoins] = useState([]);
  const [strikerTop, setStrikerTop] = useState(260); // striker starts near bottom
  const [force, setForce] = useState(0);
  const [striking, setStriking] = useState(false);

  const handleHit = () => {
    if (striking) return;
    if (force < MEDIUM_FORCE) {
      alert("Not enough force! Increase the slider.");
      return;
    }

    setStriking(true);

    // Calculate dynamic position of the bottom coin
    const bottomCoinIndex = coins.length - 1;
    const bottomCoinTop = STACK_TOP + bottomCoinIndex * COIN_OFFSET;

    // Striker moves to touch the bottom coin
    const strikerTarget = bottomCoinTop + COIN_HEIGHT;
    setStrikerTop(strikerTarget);

    setTimeout(() => {
      if (force >= HIGH_FORCE) {
        // Scatter all coins randomly
        setScatteredCoins(
          coins.map(() => ({
            top: Math.random() * 200,
            left: Math.random() * 220,
            rotate: Math.random() * 360,
          }))
        );
        setCoins([]);
      } else {
        // Remove bottom coin only
        setCoins((prev) => prev.slice(1));
      }

      // Reset striker back to bottom
      setTimeout(() => {
        setStrikerTop(260);
        setScatteredCoins([]);
        setStriking(false);
      }, 600);
    }, 400);
  };

  const handleReset = () => {
    setCoins(INITIAL_COINS);
    setScatteredCoins([]);
    setStrikerTop(260);
    setForce(0);
    setStriking(false);
  };

  const styles = {
    container: { textAlign: "center", margin: "20px 0", fontFamily: "Arial,sans-serif" },
    board: {
      position: "relative",
      width: "300px",
      height: "300px",
      margin: "0 auto",
      background: "#f5deb3",
      border: "4px solid #8b4513",
      borderRadius: "10px",
      overflow: "hidden",
      boxShadow: "inset 0 0 15px rgba(0,0,0,0.3)",
    },
    stack: {
      position: "absolute",
      top: `${STACK_TOP}px`,
      left: "110px",
      width: "80px",
      height: "120px",
    },
    coin: (index) => ({
      position: "absolute",
      width: "80px",
      height: `${COIN_HEIGHT}px`,
      borderRadius: "50%",
      background: "gold",
      border: "2px solid #c49a00",
      top: `${index * COIN_OFFSET}px`,
      transition: "all 0.5s ease",
      zIndex: 100 - index,
    }),
    scatteredCoin: (coin) => ({
      position: "absolute",
      width: "80px",
      height: `${COIN_HEIGHT}px`,
      borderRadius: "50%",
      background: "gold",
      border: "2px solid #c49a00",
      top: `${coin.top}px`,
      left: `${coin.left}px`,
      transform: `rotate(${coin.rotate}deg)`,
      transition: "all 0.5s ease",
      zIndex: 1,
    }),
    striker: {
      position: "absolute",
      width: "60px",
      height: "15px",
      borderRadius: "50%",
      background: "silver",
      border: "2px solid #888",
      left: "120px",
      top: `${strikerTop}px`,
      transition: "top 0.4s ease",
      zIndex: 200,
    },
    controls: {
      marginTop: "15px",
      display: "flex",
      justifyContent: "center",
      gap: "10px",
      flexWrap: "wrap",
    },
  };

  return (
    <div style={styles.container}>
      <h3>Carrom Coin Strike Demo</h3>
      <div style={styles.board}>
        <div style={styles.stack}>
          {coins.map((_, i) => (
            <div key={i} style={styles.coin(i)} />
          ))}
        </div>
        {scatteredCoins.map((c, i) => (
          <div key={i} style={styles.scatteredCoin(c)} />
        ))}
        <div style={styles.striker} />
      </div>

      <div style={styles.controls}>
        <label>Force:</label>
        <input
          type="range"
          min="0"
          max="10"
          value={force}
          onChange={(e) => setForce(Number(e.target.value))}
          style={{ width: "120px", marginLeft: "8px" }}
        />
        <button onClick={handleHit} disabled={striking} style={{ marginLeft: "10px" }}>
          Hit
        </button>
        <button onClick={handleReset} disabled={striking} style={{ marginLeft: "10px" }}>
          Reset
        </button>
      </div>
    </div>
  );
};

export default CaromCoinGame;
