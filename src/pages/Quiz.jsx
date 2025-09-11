import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import quizzes from "../data/quizzes.json";
import { loadLocalProgress, saveLocalProgress, enqueueSync } from "../stores/localProgress";

export default function Quiz() {
  const { id } = useParams();
  const quiz = quizzes[id] || [];
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);

  const profile = JSON.parse(localStorage.getItem("gamify_profile") || "{}");

  const handleAnswer = (opt) => {
    const correct = opt === quiz[index].a;
    if (correct) setScore((s) => s + 1);

    if (index + 1 < quiz.length) setIndex((i) => i + 1);
    else finishQuiz(score + (correct ? 1 : 0));
  };

  const finishQuiz = (finalScore) => {
    alert(`Quiz finished — score: ${finalScore}/${quiz.length}`);

    // Save local progress
    const pid = profile.id || "local_demo";
    const local = loadLocalProgress();
    const existing = local[pid] || { name: profile.name || "Demo", results: [] };

    existing.results.push({
      topic: id,
      score: finalScore,
      total: quiz.length,
      timestamp: new Date().toISOString(),
    });

    local[pid] = existing;
    saveLocalProgress(pid, existing);

    // Enqueue for remote sync
    enqueueSync({
      student_id: pid,
      topic: id,
      score: finalScore,
      timestamp: new Date().toISOString(),
    });
  };

  if (quiz.length === 0) return <p>No quiz for {id}</p>;

  return (
    <div>
      <h2>Quiz: {id}</h2>

      <div className="card">
        {index < quiz.length ? (
          <div>
            <p>
              <strong>{quiz[index].q}</strong>
            </p>
            <div style={{ display: "grid", gap: 8 }}>
              {quiz[index].options.map((o, i) => (
                <button
                  key={i}
                  className="btn"
                  style={{ background: "#4b5563" }}
                  onClick={() => handleAnswer(o)}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <p>Completed</p>
            <Link className="btn" to="/rewards">
              Claim Reward
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
