import React from "react";
import { useParams, Link } from "react-router-dom";

export default function Game() {
  const { id } = useParams();

  return (
    <div>
      <h2>Game: {id}</h2>

      <div className="card">
        <p>
          Placeholder HTML5 mini-game area. Replace with Phaser or other game.
          For demo, use a simple interactive question.
        </p>
        <p>Imagine a drag/drop or physics sim here.</p>

        <div style={{ marginTop: 8 }}>
          <Link className="btn" to={`/quiz/${id}`}>
            Go to Quiz
          </Link>
        </div>
      </div>
    </div>
  );
}
