import React, { useState } from "react";
import "./SnakeLadderQuiz.css";

const quizQuestions = {
  easy: [
    { q: "A force of 20 N acts on a 5 kg body. Find acceleration.", ans: 4 },
    { q: "Force = 12 N and mass = 6 kg. Find acceleration.", ans: 2 },
    { q: "A 3 kg object accelerates at 5 m/s². Find force.", ans: 15 },
    { q: "Find force: mass = 2 kg, acceleration = 10 m/s².", ans: 20 },
    { q: "A 10 kg object accelerates at 1 m/s². Find force.", ans: 10 },
    { q: "If mass = 8 kg and F = 24 N, find acceleration.", ans: 3 }
  ],
  medium: [
    { q: "Force = 25 N, mass = 10 kg. Find acceleration.", ans: 2.5 },
    { q: "A 1000 kg car accelerates at 2 m/s². Find force.", ans: 2000 },
    { q: "Mass = 50 kg, acceleration = 0.5 m/s². Force?", ans: 25 },
    { q: "A 200 N force acts on a 100 kg object. Find acceleration.", ans: 2 },
    { q: "A bike (150 kg) accelerates at 1.5 m/s². Find force.", ans: 225 },
    { q: "Force = 45 N, mass = 15 kg. Find acceleration.", ans: 3 }
  ],
  hard: [
    { q: "Bullet of mass 0.005 kg at velocity 500 m/s. Momentum?", ans: 2.5 },
    { q: "Truck mass = 2000 kg, force = 4000 N. Acceleration?", ans: 2 },
    { q: "Force = 100 N on 20 kg body. Time to reach 50 m/s from rest?", ans: 10 },
    { q: "1000 kg body. If momentum change = 2000 kg m/s in 4s, find force.", ans: 500 },
    { q: "A rocket ejects gases of 2 kg/s with velocity 500 m/s. Find thrust.", ans: 1000 },
    { q: "Force of 300 N acts for 5s. Momentum change?", ans: 1500 }
  ]
};

const hurdles = [8, 15, 22]; // Positions for hard questions
const easySpots = [5, 12, 20, 27]; // Positions for easy questions

const SnakeLadderQuiz = () => {
  const [position, setPosition] = useState(1);
  const [dice, setDice] = useState(null);
  const [question, setQuestion] = useState(null);
  const [inputAns, setInputAns] = useState("");
  const [message, setMessage] = useState("");
  const [gameWon, setGameWon] = useState(false);
  const [usedQuestions, setUsedQuestions] = useState({
    easy: [],
    medium: [],
    hard: []
  });

  const rollDice = () => {
    if (gameWon) return;
    const roll = Math.floor(Math.random() * 6) + 1;
    setDice(roll);
    let newPos = position + roll;
    if (newPos > 30) newPos = 30;
    setTimeout(() => askQuestion(newPos), 500);
  };

  const askQuestion = (spot) => {
    let difficulty = "medium";
    if (hurdles.includes(spot)) difficulty = "hard";
    else if (easySpots.includes(spot)) difficulty = "easy";

    let availableQs = quizQuestions[difficulty].filter(
      (qs, i) => !usedQuestions[difficulty].includes(i)
    );

    if (availableQs.length === 0) {
      // reset if all used
      setUsedQuestions((prev) => ({ ...prev, [difficulty]: [] }));
      availableQs = [...quizQuestions[difficulty]];
    }

    const randomIndex = Math.floor(Math.random() * availableQs.length);
    const selected = availableQs[randomIndex];
    const qsIndex = quizQuestions[difficulty].indexOf(selected);

    setUsedQuestions((prev) => ({
      ...prev,
      [difficulty]: [...prev[difficulty], qsIndex]
    }));

    setQuestion({ ...selected, spot });
    setMessage(
      `Answer the ${difficulty.toUpperCase()} question to move!`
    );
  };

  const checkAnswer = () => {
    if (!question) return;
    if (parseFloat(inputAns) === question.ans) {
      setMessage("Correct! Moving ahead...");
      setPosition(question.spot);
      if (question.spot >= 30) {
        setGameWon(true);
        setMessage("🎉 You won the quiz game!");
        if (onComplete) onComplete();
      }
    } else {
      let back = Math.max(1, position - 3);
      setMessage("Wrong! Moving 3 steps back!");
      setPosition(back);
    }
    setQuestion(null);
    setInputAns("");
    setDice(null);
  };

  const resetGame = () => {
    setPosition(1);
    setDice(null);
    setQuestion(null);
    setInputAns("");
    setMessage("");
    setGameWon(false);
    setUsedQuestions({ easy: [], medium: [], hard: [] });
  };

  return (
    <div className="game-container">
      <h1>🎲 Snake & Ladder Quiz - Force & Motion 🎲</h1>
      <div className="board">
        {[...Array(30)].map((_, i) => {
          const num = 30 - i;
          let cellClass = "cell";
          if (position === num) cellClass += " active";
          if (hurdles.includes(num)) cellClass += " hurdle";
          if (easySpots.includes(num)) cellClass += " easy";
          return (
            <div key={num} className={cellClass}>
              {num}
            </div>
          );
        })}
      </div>

      <div className="controls">
        {!gameWon && (
          <button onClick={rollDice} className="dice-btn">
            Roll Dice 🎲
          </button>
        )}
        {dice !== null && <p>Dice Rolled: {dice}</p>}
        <button onClick={resetGame} className="reset-btn">
          Reset Game 🔄
        </button>
      </div>

      {question && (
        <div className="quiz-box">
          <p>{question.q}</p>
          <input
            type="number"
            value={inputAns}
            onChange={(e) => setInputAns(e.target.value)}
          />
          <button onClick={checkAnswer}>Submit Answer</button>
        </div>
      )}

      <p className="message">{message}</p>
    </div>
  );
};

export default SnakeLadderQuiz;
