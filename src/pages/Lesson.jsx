// src/pages/Lesson.jsx
import React from "react";
import { useParams, Link } from "react-router-dom";

// Import chapter thumbnails (images can stay in src/assets)
import chapter1Thumb from "../assets/Chp-1.png";
import chapter2Thumb from "../assets/Chp-2.png";
import chapter3Thumb from "../assets/Chp-3.png";
import chapter4Thumb from "../assets/Chp-4.png";
import chapter5Thumb from "../assets/Chp-5.png";
import chapter6Thumb from "../assets/Chp-6.png";
import chapter7Thumb from "../assets/Chp-7.png";
import chapter8Thumb from "../assets/Chp-8.png";
import chapter9Thumb from "../assets/Chp-9.png";
import chapter10Thumb from "../assets/Chp-10.png";
import chapter11Thumb from "../assets/Chp-11.png";
import chapter12Thumb from "../assets/Chp-12.png";
import chapter13Thumb from "../assets/Chp-13.png";

export default function Lesson() {
  const { id } = useParams();

  if (id === "science") {
    const chapters = [
      { title: "Chapter 1", thumb: chapter1Thumb, linkTo: "/pdfs/chapter1.pdf" },
      { title: "Chapter 2", thumb: chapter2Thumb, linkTo: "/pdfs/chapter2.pdf" },
      { title: "Chapter 3", thumb: chapter3Thumb, linkTo: "/pdfs/chapter3.pdf" },
      { title: "Chapter 4", thumb: chapter4Thumb, linkTo: "/pdfs/chapter4.pdf" },
      { title: "Chapter 5", thumb: chapter5Thumb, linkTo: "/pdfs/chapter5.pdf" },
      { title: "Chapter 6", thumb: chapter6Thumb, linkTo: "/pdfs/chapter6.pdf" },
      { title: "Chapter 7", thumb: chapter7Thumb, linkTo: "/pdfs/chapter7.pdf" },
      { title: "Chapter 8", thumb: chapter8Thumb, linkTo: "/chapter8" }, // special route
      { title: "Chapter 9", thumb: chapter7Thumb, linkTo: "/pdfs/chapter9.pdf" },
      { title: "Chapter 10", thumb: chapter7Thumb, linkTo: "/pdfs/chapter10.pdf" },
      { title: "Chapter 11", thumb: chapter7Thumb, linkTo: "/pdfs/chapter11.pdf" },
      { title: "Chapter 12", thumb: chapter7Thumb, linkTo: "/pdfs/chapter12.pdf" },
      { title: "Chapter 13", thumb: chapter7Thumb, linkTo: "/pdfs/chapter13.pdf" },
      
    ];

    return (
      <div style={{ padding: "20px" }}>
        <h2>Science</h2>

        <h3>Chapters</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: "16px",
          }}
        >
          {chapters.map((ch, idx) =>
            ch.linkTo.startsWith("/") && !ch.linkTo.endsWith(".pdf") ? (
              <Link
                key={idx}
                to={ch.linkTo}
                style={{ textDecoration: "none", textAlign: "center" }}
              >
                <img
                  src={ch.thumb}
                  alt={ch.title}
                  style={{
                    width: "100%",
                    borderRadius: "8px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                  }}
                />
                <p style={{ marginTop: 8 }}>{ch.title}</p>
              </Link>
            ) : (
              <a
                key={idx}
                href={ch.linkTo}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none", textAlign: "center" }}
              >
                <img
                  src={ch.thumb}
                  alt={ch.title}
                  style={{
                    width: "100%",
                    borderRadius: "8px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                  }}
                />
                <p style={{ marginTop: 8 }}>{ch.title}</p>
              </a>
            )
          )}
        </div>

        {/* Game & Quiz buttons */}
        <div style={{ marginTop: 20 }}>
          <Link className="btn" to={`/game/${id}`}>
            Play Game
          </Link>
          <Link style={{ marginLeft: 8 }} className="btn" to={`/quiz/${id}`}>
            Take Quiz
          </Link>
        </div>
      </div>
    );
  }

  // fallback for other subjects
  return (
    <div style={{ padding: "20px" }}>
      <h2>{id.toUpperCase()} Lesson</h2>
      <div style={{ marginTop: 8 }}>
        <Link className="btn" to={`/game/${id}`}>
          Play Game
        </Link>
        <Link style={{ marginLeft: 8 }} className="btn" to={`/quiz/${id}`}>
          Take Quiz
        </Link>
      </div>
    </div>
  );
}
