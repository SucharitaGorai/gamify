import React from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <div style={{ background: "#111827", color: "white", padding: 12 }}>
      <div
        style={{ display: "flex", gap: 12, alignItems: "center" }}
        className="container"
      >
        <div style={{ fontWeight: 700 }}>Gamify Learning</div>
        <nav style={{ marginLeft: 12 }}>
          <Link to="/" style={{ color: "white", marginRight: 8 }}>
            Home
          </Link>
          <Link to="/dashboard" style={{ color: "white", marginRight: 8 }}>
            Teacher
          </Link>
        </nav>
      </div>
    </div>
  );
}
