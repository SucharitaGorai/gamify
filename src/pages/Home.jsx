import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Home() {
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [grade, setGrade] = useState("6");

  const navigate = useNavigate();

  const start = () => {
    // Save small profile in localStorage
    const profile = {
      name: studentName || "Student",
      id: studentId || "s_" + Math.random().toString(36).slice(2, 9),
      grade,
    };
    localStorage.setItem("gamify_profile", JSON.stringify(profile));
    navigate("/lesson/math");
  };

  return (
    <div>
      <h1 style={{ fontSize: 22 }}>Welcome to Gamify Learning</h1>
      <p>Quick sign-in (no password) — works offline.</p>

      <div className="card">
        <label>Name</label>
        <input
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          style={{ width: "100%", padding: 8, marginTop: 6 }}
        />

        <label style={{ marginTop: 8 }}>Student ID (optional)</label>
        <input
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          style={{ width: "100%", padding: 8, marginTop: 6 }}
        />

        <label style={{ marginTop: 8 }}>Grade</label>
        <select
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          style={{ width: "100%", padding: 8, marginTop: 6 }}
        >
          <option>6</option>
          <option>7</option>
          <option>8</option>
          <option>9</option>
          <option>10</option>
        </select>

        <div style={{ marginTop: 10 }}>
          <button className="btn" onClick={start}>
            Start Learning
          </button>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <h3>Subjects</h3>
        <div style={{ display: "flex", gap: 12 }}>
          <Link className="card" to="/lesson/math">
            📐 Math
          </Link>
          <Link className="card" to="/lesson/science">
            🔬 Science
          </Link>
        </div>
      </div>
    </div>
  );
}
