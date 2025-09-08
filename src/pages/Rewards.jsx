import React from "react";
import { Link } from "react-router-dom";

export default function Rewards() {
  return (
    <div>
      <h2>Rewards</h2>

      <div className="card">
        <p>You've earned badges! (Demo)</p>
        <ul>
          <li>⭐ Newton Explorer</li>
          <li>🏅 Algebra Ace</li>
        </ul>

        <Link to="/" className="btn">
          Back Home
        </Link>
      </div>
    </div>
  );
}
