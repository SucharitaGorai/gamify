 import React, { useState, useEffect } from "react";
import { loadLocalProgress, saveLocalProgress, enqueueSync } from "../stores/localProgress";
import CaromCoinGame from "../components/CaromCoinGame";
import BalancedUnbalanced from "../components/BalancedUnbalanced";
import PushBallChallenge from "../components/PushBallChallenge";
import TwoBallsNewton from "../components/TwoBallsNewton";
import CatchGame from "../components/CatchGame";
import LawsOfMotionGame from "../components/LawsOfMotionGame";
import MomentumSimulator from "../components/MomentumSimulator";
import SpaceshipGame from "../components/SpaceshipGame";
import SnakeLadderQuiz from "../components/SnakeLadderQuiz";
// ----------------------
// Quiz component
// ----------------------
function Quiz({ questions, conceptKey, onComplete }) {
  const [responses, setResponses] = useState(Array(questions.length).fill(null));
  const [showScore, setShowScore] = useState(false);
  const [quizAttempted, setQuizAttempted] = useState(false);
  const profile = JSON.parse(localStorage.getItem("gamify_profile") || "{}");
  const studentId = profile.id || "local_demo";

  useEffect(() => {
    const local = loadLocalProgress();
    const existing = local[studentId] || { results: [] };
    const hasAttempted = existing.results.some(
      (r) => r.topic === `ch8_quiz_${conceptKey}`
    );
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
    const existing =
      local[studentId] || { name: profile.name || "Demo", results: [], points: 0 };

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
    <div
      style={{
        background: "#eaffea",
        padding: "16px",
        margin: "20px 0",
        borderRadius: "10px",
      }}
    >
      <h3>Quiz (Playable Once)</h3>
      {questions.map((q, i) => (
        <div style={{ padding: "6px 0" }} key={i}>
          <div style={{ marginBottom: "6px" }}>{q.q}</div>
          {q.options.map((opt, j) => (
            <label
              key={j}
              style={{ marginRight: 16, opacity: quizAttempted ? 0.7 : 1 }}
            >
              <input
                type="radio"
                name={`quiz${conceptKey}${i}`}
                checked={responses[i] === j}
                onChange={() => {
                  if (quizAttempted) return;
                  let temp = responses.slice();
                  temp[i] = j;
                  setResponses(temp);
                }}
                disabled={quizAttempted}
              />
              {opt}
            </label>
          ))}
        </div>
      ))}
      <button
        onClick={handleSubmit}
        disabled={quizAttempted}
        style={{
          marginTop: "12px",
          padding: "8px 16px",
          borderRadius: "6px",
          background: quizAttempted ? "#bdc3c7" : "#27ae60",
          color: "white",
          border: "none",
          cursor: quizAttempted ? "not-allowed" : "pointer",
          fontWeight: "bold",
        }}
      >
        {quizAttempted ? "Quiz Completed" : "Show Score"}
      </button>
      {showScore && (
        <div
          style={{
            margin: "12px 0",
            fontWeight: "bold",
            fontSize: "1.1em",
            color: score === questions.length ? "green" : "red",
          }}
        >
          Score: {score} / {questions.length}
        </div>
      )}
    </div>
  );
}

// ----------------------
// Game component
// ----------------------
function Game({ description, checkPrompt, correctAnswers }) {
  const [show, setShow] = useState(false);
  const [entry, setEntry] = useState("");
  const [msg, setMsg] = useState("");

  return (
    <div
      style={{
        background: "#f4f8ff",
        padding: "16px",
        margin: "20px 0",
        borderRadius: "10px",
      }}
    >
      <h3>Activity/Game (Playable Multiple Times)</h3>
      <p>{description}</p>
      <button
        onClick={() => setShow(!show)}
        style={{
          marginTop: "10px",
          padding: "8px 14px",
          borderRadius: "6px",
          background: "#3498db",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        {show ? "Hide Game" : "Play Game"}
      </button>
      {show && (
        <div style={{ marginTop: "12px" }}>
          <div>{checkPrompt}</div>
          <input
            type="text"
            placeholder="Type your answer"
            value={entry}
            style={{
              marginRight: "8px",
              marginTop: "8px",
              padding: "6px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
            onChange={(e) => setEntry(e.target.value)}
          />
          <button
            onClick={() =>
              setMsg(
                correctAnswers.includes(entry.toLowerCase().trim())
                  ? "✅ Correct!"
                  : "❌ Try Again!"
              )
            }
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              background: "#2ecc71",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Check
          </button>
          <div style={{ margin: "10px 0", fontWeight: "bold" }}>{msg}</div>
        </div>
      )}
    </div>
  );
}

// ----------------------
// Concepts data
// ----------------------
const concepts = [
  {
    key: "intro",
    title: "Introduction to Force and Motion",
    notes: [
      "Force is an interaction (push or pull) that causes change in the state of rest or motion or shape of an object.",
      "Motion requires a cause—a force. Forces can change velocity and can also deform objects.",
      "The effect of force is only observed through its action."
    ],
    game: {
      description: "Think of objects you can push, pull, or hit to change their motion/shape.",
      checkPrompt: "Name any one real-life example of pushing, pulling, or hitting.",
      correctAnswers: ["drawer", "trolley", "hockey ball", "spring", "rubber ball"]
    },
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
    notes: [
      "Balanced forces are equal and opposite, resulting in no change in motion.",
      "Unbalanced forces are unequal and cause an object to move.",
      "If all forces are balanced, motion remains unchanged."
    ],
    game: {
      description: "Tug-of-War demo! Imagine two teams of equal strength playing tug-of-war.",
      checkPrompt: "Does the rope move or stay still?",
      correctAnswers: ["stays still", "does not move"]
    },
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
    notes: [
      "An object remains at rest or in uniform motion unless acted upon by an unbalanced force.",
      "This is called inertia—the natural tendency to resist change.",
      "Mass is a measure of inertia. Heavier objects have greater inertia."
    ],
    game: {
      description: "Try the coin-on-card trick.",
      checkPrompt: "Type 'falls in' or 'flies away'",
      correctAnswers: ["falls in", "falls into the glass"]
    },
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
    notes: [
      "The rate of change of momentum is proportional to the applied force.",
      "Formula: F = ma. SI unit is Newton (N).",
      "Applications: Catching a ball, seat belts in cars."
    ],
    game: {
      description: "Quick Calculation: A 3 kg object is accelerated at 4 m/s². What is the force?",
      checkPrompt: "Force (N):",
      correctAnswers: ["12"]
    },
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
    notes: [
      "For every action, there is an equal and opposite reaction, on different objects.",
      "Examples: Walking, gun recoil, jumping from a boat."
    ],
    game: {
      description: "Balloon Rocket: Inflate and release a balloon.",
      checkPrompt: "Does it move in the same or opposite direction?",
      correctAnswers: ["opposite"]
    },
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
    notes: [
      "Momentum = mass × velocity. It is a vector quantity.",
      "Force acting for a time changes momentum.",
      "Examples: Bullet vs truck momentum."
    ],
    game: {
      description: "Footballer passes → teammate kicks → goalkeeper catches. How many velocity changes?",
      checkPrompt: "Type the number:",
      correctAnswers: ["3"]
    },
    quiz: {
      questions: [
        { q: "What is the formula for momentum?", options: ["mv²", "m/v", "mv", "v/m"], answer: 2 },
        { q: "Which has greater momentum: 0.1 kg ball at 10 m/s or 10 kg stone at rest?", options: ["Ball", "Stone", "Both same", "Can't say"], answer: 0 }
      ]
    }
  }
];

  

// ----------------------
// Wrapper with paging
// ----------------------
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

  const totalPossiblePoints = concepts.reduce(
    (acc, c) => acc + c.quiz.questions.length * 5,
    0
  );
  const progressPercent =
    totalPossiblePoints > 0 ? (totalPoints / totalPossiblePoints) * 100 : 0;

  if (loading) return <div>Loading Progress...</div>;
// Snake & Ladder Page
if (pageIndex === concepts.length) {
  return (
    <div
      style={{
        fontFamily: "Arial,sans-serif",
        background: "#f7fafc",
        padding: "28px 0",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          background: "#fff",
          margin: "auto",
          padding: "40px",
          borderRadius: "10px",
          boxShadow: "0 2px 12px #e2e6ea",
          textAlign: "center",
        }}
      >
        <h1 style={{ color: "#154360", marginBottom: "20px" }}>
          🎲 Snake & Ladder Quiz Challenge
        </h1>
        <SnakeLadderQuiz onComplete={() => setSnakeCompleted(true)} />
        <button
          onClick={() => setPageIndex(pageIndex + 1)}
          style={{
            marginTop: "25px",
            padding: "12px 24px",
            background: "#27ae60",
            color: "white",
            borderRadius: "8px",
            fontWeight: "bold",
            border: "none",
            cursor: "pointer",
          }}
        >
          Finish ➡️
        </button>
      </div>
    </div>
  );
}

// Congratulations Page
if (pageIndex > concepts.length) {
  return (
    <div
      style={{
        fontFamily: "Arial,sans-serif",
        background: "#f7fafc",
        padding: "28px 0",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          background: "#fff",
          margin: "auto",
          padding: "40px",
          borderRadius: "10px",
          boxShadow: "0 2px 12px #e2e6ea",
          textAlign: "center",
        }}
      >
        <h1 style={{ color: "#27ae60", fontSize: "2em" }}>🎉 Congratulations!</h1>
        <p>
          You have successfully completed{" "}
          <strong>Chapter 8: Force & Laws of Motion</strong>.
        </p>

        {snakeCompleted ? (
          <p>
            You earned the{" "}
            <span style={{ color: "gold", fontWeight: "bold" }}>Gold Badge 🏆</span>!
          </p>
        ) : (
          <p>
            You earned a{" "}
            <span style={{ color: "#2980b9", fontWeight: "bold" }}>Science Badge 🏅</span>!
          </p>
        )}

        <p>
          Complete all 12 chapters to unlock more{" "}
          <span style={{ color: "gold", fontWeight: "bold" }}>rewards</span>.
        </p>

        <a
          href="/"
          style={{
            display: "inline-block",
            marginTop: "25px",
            padding: "12px 24px",
            background: "#3498db",
            color: "white",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          ⬅️ Return to Home
        </a>
      </div>
    </div>
  );
}

  
  const c = concepts[pageIndex];

  return (
    <div
      style={{
        fontFamily: "Arial,sans-serif",
        background: "#f7fafc",
        padding: "28px 12px",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          maxWidth: "960px",
          background: "#fff",
          margin: "auto",
          padding: "24px",
          borderRadius: "12px",
          boxShadow: "0 2px 12px #e2e6ea",
        }}
      >
        <h1
          style={{
            color: "#154360",
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: "20px",
          }}
        >
          Chapter 8: Force & Laws of Motion
        </h1>

        {/* Progress Bar */}
        <div
          style={{
            margin: "20px 0",
            border: "1px solid #ddd",
            padding: "15px",
            borderRadius: "8px",
          }}
        >
          <h3>My Progress</h3>
          <p>
            Total Points Earned:{" "}
            <strong>
              {totalPoints} / {totalPossiblePoints}
            </strong>
          </p>
          <div
            style={{
              height: "20px",
              background: "#ecf0f1",
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: "100%",
                background: "#3498db",
                transition: "width 0.5s",
                textAlign: "right",
                paddingRight: "5px",
                color: "white",
                fontWeight: "bold",
                lineHeight: "20px",
              }}
            >
              {Math.round(progressPercent)}%
            </div>
          </div>
        </div>

        {/* Current Concept */}
        <section style={{ marginBottom: "2em", padding: "20px" }}>
          <h2 style={{ color: "#2874a6", fontWeight: "bold" }}>
            {c.title} {completedConcepts[c.key] ? "✅" : "⏳"}
          </h2>
          <ul style={{ paddingLeft: "22px", color: "#333" }}>
            {c.notes.map((n, i) => (
              <li key={i} style={{ marginBottom: "9px" }}>
                {n}
              </li>
            ))}
          </ul>

          {/* Games */}
          <Game {...c.game} />
          {c.key === "intro" && <LawsOfMotionGame />}
          {c.key === "firstlaw" && <CaromCoinGame />}
          {c.key === "balanced" && <BalancedUnbalanced />}
          {c.key === "firstlaw" && <PushBallChallenge />}
          {c.key === "secondlaw" && <TwoBallsNewton />}
          {c.key === "secondlaw" && <CatchGame />}
          {c.key === "momentum" && <MomentumSimulator />}
          {c.key === "thirdlaw" && <SpaceshipGame />}
          
          

          {/* Quiz */}
          <Quiz {...c.quiz} conceptKey={c.key} onComplete={handleQuizCompletion} />

          {/* Navigation Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "20px",
            }}
          >
            <button
              onClick={() => setPageIndex(pageIndex - 1)}
              disabled={pageIndex === 0}
              style={{
                padding: "10px 20px",
                background: pageIndex === 0 ? "#bdc3c7" : "#8e44ad",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: pageIndex === 0 ? "not-allowed" : "pointer",
                fontWeight: "bold",
              }}
            >
              ⬅️ Back
            </button>

            <button
              onClick={() => setPageIndex(pageIndex + 1)}
              disabled={!completedConcepts[c.key]}
              style={{
                padding: "10px 20px",
                background: completedConcepts[c.key] ? "#27ae60" : "#bdc3c7",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: completedConcepts[c.key] ? "pointer" : "not-allowed",
                fontWeight: "bold",
              }}
            >
              {pageIndex === concepts.length - 1 ? "Finish Chapter" : "Next ➡️"}
            </button>





            
          </div>
        </section>
      </div>
    </div>


  );
}