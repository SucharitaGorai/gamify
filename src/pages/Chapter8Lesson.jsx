// src/pages/Chapter8Lesson.jsx
import React, { useState, useEffect } from "react";
import { loadLocalProgress, saveLocalProgress, enqueueSync } from "../stores/localProgress";
import CaromCoinGame from "../components/CaromCoinGame";
import BalancedUnbalanced from "../components/BalancedUnbalanced";
import PushBallChallenge from "../components/PushBallChallenge";
import TwoBallsNewton from "../components/TwoBallsNewton";
//import CatchGame from "../components/CatchGame";
import LawsOfMotionGame from "../components/LawsOfMotionGame";
import MomentumSimulator from "../components/MomentumSimulator";
import SpaceshipGame from "../components/SpaceshipGame";
import SnakeLadderQuiz from "../components/SnakeLadderQuiz";
import Shooter from "../components/Shooter";
import MotionSimulatorGame from "../components/MotionSimulatorGame";
import SpaceshipQuizGame from "../components/SpaceshipQuizGame";
import "./ForceLawsOfMotionNotes.css";

// Inline quiz used inside each concept section
function ConceptQuiz({ questions, conceptKey, onComplete }) {
  const [responses, setResponses] = useState(Array(questions.length).fill(null));
  const [showScore, setShowScore] = useState(false);
  const [quizAttempted, setQuizAttempted] = useState(false);
  const profile = JSON.parse(localStorage.getItem("gamify_profile") || "{}");
  const studentId = profile.id || "local_demo";

  useEffect(() => {
    const local = loadLocalProgress();
    const existing = local[studentId] || { results: [] };
    const hasAttempted = existing.results.some((r) => r.topic === `ch8_quiz_${conceptKey}`);
    setQuizAttempted(hasAttempted);
  }, [conceptKey, studentId]);

  const score = responses.filter((r, i) => r === questions[i].answer).length;

  const handleSubmit = () => {
    if (quizAttempted) return;
    setShowScore(true);

    const finalScore = score;
    const totalQuestions = questions.length;
    const pointsEarned = finalScore * 5;

    const local = loadLocalProgress();
    const existing = local[studentId] || { name: profile.name || "Demo", results: [], points: 0 };

    if (!existing.results.some((r) => r.topic === `ch8_quiz_${conceptKey}`)) {
      existing.results.push({
        topic: `ch8_quiz_${conceptKey}`,
        score: finalScore,
        total: totalQuestions,
        timestamp: new Date().toISOString(),
      });
      existing.points = (existing.points || 0) + pointsEarned;
      saveLocalProgress(studentId, existing);
      enqueueSync({
        student_id: studentId,
        topic: `ch8_quiz_${conceptKey}`,
        score: finalScore,
        timestamp: new Date().toISOString(),
        total: totalQuestions,
      });
      onComplete(conceptKey, pointsEarned);
      setQuizAttempted(true);
    }
  };

  return (
    <div className="quiz" style={{ position: "relative", overflow: "hidden", animation: "glow 3s ease-in-out infinite" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "-100%",
          width: "100%",
          height: "100%",
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,.1), transparent)",
          animation: "shimmer 3s infinite"
        }}
      />
      <h3 className="quiz__title">⚗️ Quiz Challenge</h3>

      {questions.map((q, i) => (
        <div key={i} className="gl-section" style={{ padding: 20, marginBottom: 16 }}>
          <div className="quiz__q">{q.q}</div>
          <div className="quiz__grid">
            {q.options.map((opt, j) => (
              <label key={j} className={`quiz__option ${quizAttempted ? "quiz__option--disabled" : ""}`}>
                <input
                  type="radio"
                  name={`quiz${conceptKey}${i}`}
                  checked={responses[i] === j}
                  onChange={() => {
                    if (quizAttempted) return;
                    const tmp = responses.slice();
                    tmp[i] = j;
                    setResponses(tmp);
                  }}
                  disabled={quizAttempted}
                  style={{ accentColor: "#ffde59", transform: "scale(1.2)" }}
                />
                {opt}
              </label>
            ))}
          </div>
        </div>
      ))}

      <div style={{ textAlign: "center", marginTop: 18 }}>
        <button
          onClick={handleSubmit}
          disabled={quizAttempted}
          className={`gl-btn ${quizAttempted ? "gl-btn--disabled" : "gl-btn--primary"}`}
        >
          {quizAttempted ? "✅ Quiz Completed" : "🚀 Submit Quiz"}
        </button>
      </div>

      {showScore && (
        <div className="quiz__score">
          <div
            style={{
              fontWeight: 900,
              fontSize: "1.6rem",
              color: score === questions.length ? "#00ffcc" : "#ff6ec7",
              textShadow: "0 0 20px rgba(255,110,199,.8)"
            }}
          >
            🎉 Score: {score} / {questions.length}{score === questions.length ? " 🏆 Perfect!" : ""}
          </div>
        </div>
      )}
    </div>
  );
}

const concepts = [
  {
    key: "intro",
    title: "Introduction to Force and Motion",
    icon: "⚡",
    notes: [
      "Force is an interaction (push or pull) that causes change in the state of rest or motion or shape of an object.",
      "Motion requires a cause—a force. Forces can change velocity and can also deform objects.",
      "The effect of force is only observed through its action."
    ],
    quiz: {
      questions: [
        { q: "Which action is NOT caused by a force?", options: ["Changing direction", "Changing shape", "Changing color", "Changing speed"], answer: 2 },
        { q: "What is a force?", options: ["An object", "A push or pull", "A source of energy", "A shape"], answer: 1 }
      ]
    }
  },
  {
    key: "balanced",
    title: "Balanced and Unbalanced Forces",
    icon: "⚖️",
    notes: [
      "Balanced forces are equal and opposite, resulting in no change in motion.",
      "Unbalanced forces are unequal and cause an object to move.",
      "If all forces are balanced, motion remains unchanged."
    ],
    quiz: {
      questions: [
        { q: "What does a balanced force do?", options: ["Starts motion", "Stops motion", "Changes direction", "Does not change motion"], answer: 3 },
        { q: "What causes an object to accelerate?", options: ["Balanced forces", "Unbalanced force", "Friction only", "Gravity only"], answer: 1 }
      ]
    }
  },
  {
    key: "firstlaw",
    title: "Newton's First Law of Motion",
    icon: "🎯",
    notes: [
      "An object remains at rest or in uniform motion unless acted upon by an unbalanced force.",
      "This is called inertia—the natural tendency to resist change.",
      "Mass is a measure of inertia. Heavier objects have greater inertia."
    ],
    quiz: {
      questions: [
        { q: "What is inertia?", options: ["Ability to move fast", "Tendency to resist change in motion", "Ability to change shape", "Force experienced by object"], answer: 1 },
        { q: "Why does a passenger fall forward when a bus stops suddenly?", options: ["Gravity pulls him forward", "Inertia keeps him moving", "Bus accelerates forward", "Force acts backwards"], answer: 1 }
      ]
    }
  },
  {
    key: "secondlaw",
    title: "Newton's Second Law of Motion",
    icon: "🚀",
    notes: [
      "The rate of change of momentum is proportional to the applied force.",
      "Formula: F = ma. SI unit is Newton (N).",
      "Applications: Catching a ball, seat belts in cars."
    ],
    quiz: {
      questions: [
        { q: "Which formula expresses Newton's second law?", options: ["F = m + a", "F = ma", "F = m/a", "F = m - a"], answer: 1 },
        { q: "Why does a player pull hands back while catching a fast ball?", options: ["It increases momentum", "It reduces time of contact", "It reduces force on hands", "It increases stopping force"], answer: 2 }
      ]
    }
  },
  {
    key: "thirdlaw",
    title: "Newton's Third Law of Motion",
    icon: "🔄",
    notes: [
      "For every action, there is an equal and opposite reaction, on different objects.",
      "Examples: Walking, gun recoil, jumping from a boat."
    ],
    quiz: {
      questions: [
        { q: "Newton's Third Law means:", options: ["Forces act in same direction", "Action and reaction cancel", "Equal & opposite forces on different objects", "None"], answer: 2 },
        { q: "What happens if a person jumps from a boat?", options: ["Only person moves forward", "Boat moves backward", "Both move forward", "Nothing"], answer: 1 }
      ]
    }
  },
  {
    key: "momentum",
    title: "Momentum: Definition & Application",
    icon: "💥",
    notes: [
      "Momentum = mass × velocity. It is a vector quantity.",
      "Force acting for a time changes momentum.",
      "Examples: Bullet vs truck momentum."
    ],
    quiz: {
      questions: [
        { q: "What is the formula for momentum?", options: ["mv²", "m/v", "mv", "v/m"], answer: 2 },
        { q: "Which has greater momentum: 0.1 kg ball at 10 m/s or 10 kg stone at rest?", options: ["Ball", "Stone", "Both same", "Can't say"], answer: 0 }
      ]
    }
  }
];

function Particle({ delay, duration }) {
  return (
    <div
      style={{
        position: "fixed",
        width: "4px",
        height: "4px",
        background: "linear-gradient(45deg, #ffde59, #ff6ec7)",
        borderRadius: "50%",
        animation: `particleFloat ${duration}s linear infinite`,
        animationDelay: `${delay}s`,
        zIndex: -1,
        left: `${Math.random() * 100}%`
      }}
    />
  );
}

export default function ForceLawsOfMotionNotes() {
  const [snakeCompleted, setSnakeCompleted] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const [completedConcepts, setCompletedConcepts] = useState({});
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const profile = JSON.parse(localStorage.getItem("gamify_profile") || "{}");
  const studentId = profile.id || "local_demo";

  useEffect(() => {
    const local = loadLocalProgress();
    const existing = local[studentId] || { points: 0, results: [] };
    setTotalPoints(existing.points || 0);

    const completed = {};
    existing.results.forEach((r) => {
      if (r.topic.startsWith("ch8_quiz_")) {
        const conceptKey = r.topic.replace("ch8_quiz_", "");
        completed[conceptKey] = true;
      }
    });
    setCompletedConcepts(completed);
    setLoading(false);
  }, [studentId]);

  const handleQuizCompletion = (conceptKey, points) => {
    setTotalPoints((prev) => prev + points);
    setCompletedConcepts((prev) => ({ ...prev, [conceptKey]: true }));
  };

  const totalPossiblePoints = concepts.reduce((acc, c) => acc + c.quiz.questions.length * 5, 0);
  const progressPercent = totalPossiblePoints > 0 ? (totalPoints / totalPossiblePoints) * 100 : 0;

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes particleFloat { 0% { transform: translateY(100vh) rotate(0deg); opacity: 0;} 10%{opacity:1;} 90%{opacity:1;} 100% { transform: translateY(-100px) rotate(360deg); opacity: 0;} }
      @keyframes shimmer { 0% { left: -100%; } 100% { left: 100%; } }
      @keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  if (loading) {
    return (
      <div style={{
        display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh",
        color: "#ffde59", fontSize: "1.5rem", background: "linear-gradient(135deg, #0f0f23, #1a1a3e, #2d1b69, #4a148c)",
        fontFamily: "'Orbitron', 'Comic Sans MS', Arial, sans-serif"
      }}>
        <div style={{
          width: "50px", height: "50px", border: "4px solid rgba(255,222,89,.3)", borderTop: "4px solid #ffde59",
          borderRadius: "50%", animation: "spin 1s linear infinite", marginRight: "20px"
        }} />
        Loading Progress...
      </div>
    );
  }

  if (pageIndex === concepts.length) {
    return (
      <div style={{
        fontFamily: "'Orbitron', 'Comic Sans MS', Arial, sans-serif",
        background: "linear-gradient(135deg, #0f0f23, #1a1a3e, #2d1b69, #4a148c)",
        padding: "40px 0", minHeight: "100vh", color: "white", textAlign: "center", position: "relative", overflow: "hidden"
      }}>
        {[...Array(20)].map((_, i) => (
          <Particle key={i} delay={i * 0.5} duration={15 + Math.random() * 10} />
        ))}
        <div className="gl-card">
          <h1 className="gl-title" style={{ fontSize: "3rem" }}>🎲 Snake & Ladder Quiz Challenge</h1>
          <SnakeLadderQuiz onComplete={() => setSnakeCompleted(true)} />
          <button onClick={() => setPageIndex(pageIndex + 1)} className="gl-btn gl-btn--primary" style={{ marginTop: 30 }}>
            🚀 Finish Chapter
          </button>
        </div>
      </div>
    );
  }

  if (pageIndex > concepts.length) {
    return (
      <div style={{
        fontFamily: "'Orbitron', 'Comic Sans MS', Arial, sans-serif",
        background: "linear-gradient(135deg, #0f0f23, #1a1a3e, #2d1b69, #4a148c)",
        padding: "40px 0", minHeight: "100vh", color: "white", textAlign: "center", position: "relative", overflow: "hidden"
      }}>
        {[...Array(25)].map((_, i) => (
          <Particle key={i} delay={i * 0.3} duration={12 + Math.random() * 8} />
        ))}
        <div className="gl-card">
          <h1 style={{ color: "#27ae60", fontSize: "3.5rem", marginBottom: 30, textShadow: "0 0 30px rgba(39,174,96,.8)", fontWeight: 900 }}>
            🎉 Congratulations!
          </h1>
          <p style={{ fontSize: "1.3rem", marginBottom: 20 }}>
            You have successfully completed <strong>Chapter 8: Force & Laws of Motion</strong>.
          </p>
          {snakeCompleted ? (
            <div style={{ margin: "30px 0" }}>
              <p style={{ fontSize: "1.5rem", marginBottom: 15 }}>
                You earned the <span style={{ color: "#ffd700", fontWeight: "bold", textShadow: "0 0 20px rgba(255,215,0,.8)" }}>Gold Badge 🏆</span>!
              </p>
            </div>
          ) : (
            <div style={{ margin: "30px 0" }}>
              <p style={{ fontSize: "1.5rem", marginBottom: 15 }}>
                You earned a <span style={{ color: "#2980b9", fontWeight: "bold", textShadow: "0 0 20px rgba(41,128,185,.8)" }}>Science Badge 🏅</span>!
              </p>
            </div>
          )}
          <p style={{ fontSize: "1.2rem", marginBottom: 30 }}>
            Complete all 12 chapters to unlock more <span style={{ color: "#ffd700", fontWeight: "bold" }}>rewards</span>.
          </p>
          <a href="/" className="gl-btn gl-btn--secondary">⬅️ Return to Home</a>
        </div>
      </div>
    );
  }

  const c = concepts[pageIndex];

  return (
    <div className="gl-page full-bleed">
      {[...Array(15)].map((_, i) => (
        <Particle key={i} delay={i * 0.7} duration={18 + Math.random() * 12} />
      ))}

      <div className="gl-card">
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 className="gl-title">⚡ Chapter 8: Force & Laws of Motion</h1>
        </div>

        <div className="gl-panel">
          <h3>🌟 My Progress</h3>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 20 }}>
            <div style={{ fontSize: "1.4rem", color: "#00ffe7", fontWeight: "bold", textShadow: "0 0 15px rgba(0,255,231,.8)" }}>
              Points Earned: <strong>{totalPoints} / {totalPossiblePoints}</strong>
            </div>
          </div>
          <div className="gl-progress">
            <div className="gl-progress__bar" style={{ width: `${progressPercent}%` }} />
            <div className="gl-progress__label">{Math.round(progressPercent)}%</div>
          </div>
        </div>

        <div className="gl-section">
          <h2 className="gl-section__title">
            <span className="icon">{c.icon}</span>
            {c.title}
            <span className="status">{completedConcepts[c.key] ? "✅" : "⏳"}</span>
          </h2>

          <ul className="gl-notes">
            {c.notes.map((note, i) => (
              <li key={i} className="gl-note">{note}</li>
            ))}
          </ul>

          {c.key === "intro" && <LawsOfMotionGame />}
          {c.key === "firstlaw" && <CaromCoinGame />}
          {c.key === "balanced" && <BalancedUnbalanced />}
          {c.key === "firstlaw" && <PushBallChallenge />}
          {c.key === "secondlaw" && <TwoBallsNewton />}
          
          {c.key === "momentum" && <MomentumSimulator />}
          {c.key === "thirdlaw" && <SpaceshipGame />}
          {c.key === "secondlaw" && <MotionSimulatorGame />}
          {c.key === "balanced" && <SpaceshipQuizGame />}
          {c.key === "thirdlaw" && <Shooter />}

          <ConceptQuiz {...c.quiz} conceptKey={c.key} onComplete={handleQuizCompletion} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, gap: 20 }}>
            <button
              onClick={() => setPageIndex(pageIndex - 1)}
              disabled={pageIndex === 0}
              className={`gl-btn ${pageIndex === 0 ? "gl-btn--disabled" : "gl-btn--primary"}`}
            >
              ⬅️ Back
            </button>

            <button
              onClick={() => setPageIndex(pageIndex + 1)}
              disabled={!completedConcepts[c.key]}
              className={`gl-btn ${completedConcepts[c.key] ? "gl-btn--secondary" : "gl-btn--disabled"}`}
            >
              {pageIndex === concepts.length - 1 ? "🏁 Finish Chapter" : "Next ➡️"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}