import React, { useState, useEffect } from "react";
import { loadLocalProgress, saveLocalProgress, enqueueSync } from '../stores/localProgress';
import { Link } from 'react-router-dom';

// Utility for generic MCQ quiz component
function Quiz({ questions, conceptKey, onComplete }) {
  const [responses, setResponses] = useState(Array(questions.length).fill(null));
  const [showScore, setShowScore] = useState(false);
  const [quizAttempted, setQuizAttempted] = useState(false);
  const profile = JSON.parse(localStorage.getItem('gamify_profile') || '{}');
  const studentId = profile.id || 'local_demo';

  // Check if quiz has already been attempted locally
  useEffect(() => {
    const local = loadLocalProgress();
    const existing = local[studentId] || { results: [] };
    const hasAttempted = existing.results.some(r => r.topic === `ch8_quiz_${conceptKey}`);
    setQuizAttempted(hasAttempted);
  }, [conceptKey, studentId]);

  const score = responses.filter((r, i) => r === questions[i].answer).length;

  const handleSubmit = () => {
    if (quizAttempted) return;

    setShowScore(true);
    const finalScore = responses.filter((r, i) => r === questions[i].answer).length;
    const totalQuestions = questions.length;
    const pointsEarned = finalScore * 5; // Example points logic

    // Save local progress for this specific quiz concept
    const local = loadLocalProgress();
    const existing = local[studentId] || { name: profile.name || 'Demo', results: [], points: 0 };
    
    // Check again to prevent double-save on re-render/re-submit
    if (!existing.results.some(r => r.topic === `ch8_quiz_${conceptKey}`)) {
      existing.results.push({ 
        topic: `ch8_quiz_${conceptKey}`, 
        score: finalScore, 
        total: totalQuestions, 
        timestamp: new Date().toISOString() 
      });
      existing.points = (existing.points || 0) + pointsEarned;
      saveLocalProgress(studentId, existing);
      enqueueSync({ student_id: studentId, topic: `ch8_quiz_${conceptKey}`, score: finalScore, timestamp: new Date().toISOString(), total: totalQuestions });
      onComplete(conceptKey, pointsEarned); // Notify parent of completion and points
      setQuizAttempted(true); // Mark as attempted
    }
  };

  return (
    <div style={{ background: "#eaffea", padding: "10px", margin: "14px 0", borderRadius: "8px" }}>
      <h3>Quiz (Playable Once)</h3>
      {questions.map((q, i) => (
        <div style={{ padding: "5px 0" }} key={i}>
          <div>{q.q}</div>
          {q.options.map((opt, j) => (
            <label key={j} style={{ marginRight: 12, opacity: quizAttempted ? 0.7 : 1 }}>
              <input type="radio"
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
      <button onClick={handleSubmit} disabled={quizAttempted} style={{ marginTop: "10px", opacity: quizAttempted ? 0.5 : 1 }}>
        {quizAttempted ? "Quiz Completed" : "Show Score"}
      </button>
      {showScore && (
        <div style={{
          margin: "10px 0",
          fontWeight: "bold",
          color: score === questions.length ? "green" : "red"
        }}>
          Score: {score} / {questions.length}
        </div>
      )}
    </div>
  );
}

// Utility for interactive game/activity component
function Game({ description, checkPrompt, correctAnswers }) {
  const [show, setShow] = useState(false);
  const [entry, setEntry] = useState("");
  const [msg, setMsg] = useState("");
  
  // Game is always playable multiple times
  return (
    <div style={{ background: "#f4f8ff", padding: "10px", margin: "14px 0", borderRadius: "8px" }}>
      <h3>Activity/Game (Playable Multiple Times)</h3>
      <div>{description}</div>
      <button onClick={() => setShow(!show)} style={{ marginTop: "10px" }}>
        {show ? "Hide Game" : "Play Game"}
      </button>
      {show && (
        <div>
          <div style={{ margin: "10px 0" }}>{checkPrompt}</div>
          <input
            type="text"
            placeholder="Type your answer"
            value={entry}
            style={{ marginRight: "8px" }}
            onChange={e => setEntry(e.target.value)}
          />
          <button onClick={() => setMsg(correctAnswers.includes(entry.toLowerCase().trim()) ? "✅ Correct!" : "❌ Try Again!")}>
            Check
          </button>
          <div style={{ margin: "8px 0", fontWeight: "bold" }}>{msg}</div>
        </div>
      )}
    </div>
  );
}

// Concept Data (as provided by user)
const concepts = [
  {
    key: "intro",
    title: "Introduction to Force and Motion",
    notes: [
      "Force is an interaction (push or pull) that causes change in the state of rest or motion or shape of an object. Examples include pushing a trolley, pulling a drawer, or hitting a hockey ball.[1][3][4]",
      "Motion requires a cause—a force. Forces can change velocity (speed or direction) and can also deform objects (e.g., compress springs, make rubber balls oblong).[1][8]",
      "The effect of force is only observed through its action; force itself is not visible but its impact is evident in the change it produces.[1][2]"
    ],
    game: {
      description: "Think of objects you can push, pull, or hit to change their motion/shape.",
      checkPrompt: "Name any one real-life example of pushing, pulling, or hitting.",
      correctAnswers: ["drawer", "trolley", "hockey ball", "spring", "rubber ball"]
    },
    quiz: {
      questions: [
        {
          q: "Which action is NOT caused by a force?",
          options: ["Changing direction", "Changing shape", "Changing color", "Changing speed"],
          answer: 2
        },
        {
          q: "What is a force?",
          options: [
            "An object",
            "A push or pull",
            "A source of energy",
            "A shape"
          ],
          answer: 1
        }
      ]
    }
  },
  {
    key: "balanced",
    title: "Balanced and Unbalanced Forces",
    notes: [
      "Balanced forces are equal and opposite, resulting in no change in the state of motion. Unbalanced forces are unequal and cause an object to move or change velocity. For example: If two people pull a block with equal force in opposite directions, it does not move. If one pulls harder, the block moves toward the stronger pull.[1][5][2]",
      "Friction is a force that opposes motion. When the force applied exceeds friction, objects start moving. Motion continues as long as unbalanced force is applied.[1]",
      "If all forces acting on an object are balanced, it stays at rest or in uniform motion. Only when unbalanced force acts, acceleration (change in speed/direction) occurs.[1][15]"
    ],
    game: {
      description: "Tug-of-War demo! Imagine two teams of equal strength playing tug-of-war.",
      checkPrompt: "Does the rope move or stay still? (Type 'moves' or 'stays still')",
      correctAnswers: ["stays still", "does not move"]
    },
    quiz: {
      questions: [
        {
          q: "What does a balanced force do?",
          options: [
            "Starts motion",
            "Stops motion",
            "Changes direction",
            "Does not change motion"
          ],
          answer: 3
        },
        {
          q: "What causes an object to accelerate?",
          options: [
            "Balanced forces",
            "Unbalanced force",
            "Friction only",
            "Gravity only"
          ],
          answer: 1
        }
      ]
    }
  },
  {
    key: "firstlaw",
    title: "Newton's First Law of Motion (Law of Inertia)",
    notes: [
      "Newton's First Law states: An object remains at rest or in uniform motion unless acted upon by an unbalanced force. This is called inertia—the natural tendency to resist change in its state.[1][3][5]",
      "Examples: When sitting in a car and brakes are applied, the body tends to keep moving due to inertia. When a bus starts, passengers tend to fall backward.[1]",
      "Mass is a measure of inertia. Heavier objects have greater inertia. Safety belts in cars prevent injuries by increasing the stopping time and thus reducing force.[1][4]"
    ],
    game: {
      description: "Try the coin-on-card trick: Place card on a glass with a coin on top. Flick the card—does the coin fall into the glass or fly away?",
      checkPrompt: "Type 'falls in' or 'flies away'",
      correctAnswers: ["falls in", "falls into the glass"]
    },
    quiz: {
      questions: [
        {
          q: "What is inertia?",
          options: [
            "Ability to move fast",
            "Tendency to resist change in motion",
            "Ability to change shape",
            "Force experienced by object"
          ],
          answer: 1
        },
        {
          q: "A passenger falls forward in a bus when suddenly stopped. Why?",
          options: [
            "Gravity pulls him forward",
            "Inertia keeps moving him forward",
            "Bus accelerates forward",
            "Force acts backwards"
          ],
          answer: 1
        }
      ]
    }
  },
  {
    key: "secondlaw",
    title: "Newton's Second Law of Motion",
    notes: [
      "The Second Law: The rate of change of momentum is proportional to the applied force and occurs in the direction of force.[1][2][5]",
      "Formula: $ F = ma $ — Force equals mass times acceleration. SI unit is Newton (N) = 1 kg × 1 m/s².[1][4]",
      "Applications: Cricket player pulls hands back while catching the ball to increase stopping time and reduce force. Seat belts stretch to reduce impact by increasing time of deceleration.[1][4]"
    ],
    game: {
      description: "Quick Calculation: A 3 kg object is accelerated at 4 m/s². What is the force? (Type the value)",
      checkPrompt: "Force (N):",
      correctAnswers: ["12"] // F = 3*4
    },
    quiz: {
      questions: [
        {
          q: "Which formula expresses Newton's second law?",
          options: [
            "F = m + a",
            "F = ma",
            "F = m/a",
            "F = m - a"
          ],
          answer: 1
        },
        {
          q: "A player pulls hands back while catching a fast ball because:",
          options: [
            "It increases momentum",
            "It reduces time of contact",
            "It reduces force on hands",
            "It increases stopping force"
          ],
          answer: 2
        }
      ]
    }
  },
  {
    key: "thirdlaw",
    title: "Newton's Third Law of Motion",
    notes: [
      "For every action, there is an equal and opposite reaction, but these forces act on different objects and do not cancel out.[1][2][5][4]",
      "Examples: When walking, feet push backward on the ground and the ground pushes forward; when firing a gun, the bullet moves forward and the gun recoils backward.[1]",
      "Action-reaction may produce different accelerations if objects have different masses (ex: bullet and gun). Boats move backward when sailor jumps forward.[1][4]"
    ],
    game: {
      description: "Balloon Rocket: Inflate a balloon, hold it, release it—does it move the same direction as air or the opposite?",
      checkPrompt: "Type 'same' or 'opposite'",
      correctAnswers: ["opposite"]
    },
    quiz: {
      questions: [
        {
          q: "Newton's Third Law means:",
          options: [
            "Forces act in same direction",
            "Action and reaction forces cancel each other",
            "Forces equal and opposite, on different objects",
            "None of the above"
          ],
          answer: 2
        },
        {
          q: "A person jumps from a boat onto land. What happens?",
          options: [
            "Only person moves forward",
            "Boat moves backward",
            "Both move forward",
            "Nothing happens"
          ],
          answer: 1
        }
      ]
    }
  },
  {
    key: "momentum",
    title: "Momentum: Definition & Application",
    notes: [
      "Momentum is the product of mass and velocity: $ p = mv $. It is a vector quantity (has direction). SI unit is kg·m/s.[1][2][4]",
      "Force acting for a time changes an object's momentum. Larger mass or speed = larger momentum. Newton's laws explain why momentum changes only if external force acts.[1]",
      "Examples: A bullet has little mass but high speed, creating large momentum; a parked truck has larger mass but no speed, so zero momentum. [1][2]"
    ],
    game: {
      description: "Suppose a football player passes a ball to a teammate, who kicks it toward the goal. The goalkeeper catches it. How many times does the ball's velocity change?",
      checkPrompt: "Type the number:",
      correctAnswers: ["3"]
    },
    quiz: {
      questions: [
        {
          q: "What is the formula for momentum?",
          options: [
            "mv²",
            "m/v",
            "mv",
            "v/m"
          ],
          answer: 2
        },
        {
          q: "Which has greater momentum: 0.1 kg ball going at 10 m/s or 10 kg stone at rest?",
          options: [
            "Ball",
            "Stone",
            "Both same",
            "Can't say"
          ],
          answer: 0
        }
      ]
    }
  }
];

// Page structure wrapper
export default function ForceLawsOfMotionNotes() {
  const [totalPoints, setTotalPoints] = useState(0);
  const [completedConcepts, setCompletedConcepts] = useState({}); // {conceptKey: true}
  const [loading, setLoading] = useState(true);
  const profile = JSON.parse(localStorage.getItem('gamify_profile') || '{}');
  const studentId = profile.id || 'local_demo';

  // Load initial progress and points
  useEffect(() => {
    const local = loadLocalProgress();
    const existing = local[studentId] || { points: 0, results: [] };
    setTotalPoints(existing.points || 0);

    const completed = {};
    // Mark concepts as completed if the quiz for that concept has been recorded
    existing.results.forEach(r => {
      if (r.topic.startsWith('ch8_quiz_')) {
        const conceptKey = r.topic.replace('ch8_quiz_', '');
        completed[conceptKey] = true;
      }
    });
    setCompletedConcepts(completed);
    setLoading(false);
  }, [studentId]);

  const handleQuizCompletion = (conceptKey, points) => {
    setTotalPoints(prevPoints => prevPoints + points);
    setCompletedConcepts(prev => ({ ...prev, [conceptKey]: true }));
  };

  const totalPossiblePoints = concepts.reduce((acc, concept) => acc + (concept.quiz.questions.length * 5), 0);
  const progressPercent = totalPossiblePoints > 0 ? (totalPoints / totalPossiblePoints) * 100 : 0;

  if (loading) {
    return <div>Loading Progress...</div>;
  }

  return (
    <div style={{ fontFamily: "Arial,sans-serif", background: "#f7fafc", padding: "28px 0" }}>
      <div style={{ maxWidth: "900px", background: "#fff", margin: "auto", padding: "24px", borderRadius: "10px", boxShadow: "0 2px 12px #e2e6ea"}}>
        <h1 style={{ color: "#154360", fontWeight: "bold", textAlign: "center" }}>
          Force and Laws of Motion – Full Guide, Games & Quiz
        </h1>
        <p style={{ textAlign: "center", color: "#154360" }}>
          Interactive revision for Chapter 8.
        </p>

        {/* PDF Link */}
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <a 
                href="/assets/pdfs/chapter8.pdf" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn"
                style={{ 
                    padding: '10px 20px', 
                    fontSize: '1.2em', 
                    textDecoration: 'none', 
                    background: '#2ecc71', 
                    color: 'white', 
                    borderRadius: '6px'
                }}
            >
                Click to Open the PDF (Chapter 8)
            </a>
        </div>

        {/* Progress Bar */}
        <div style={{ margin: "20px 0", border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
          <h3>My Progress</h3>
          <p>Total Points Earned: <strong>{totalPoints} / {totalPossiblePoints}</strong></p>
          <div style={{ height: '20px', background: '#ecf0f1', borderRadius: '10px', overflow: 'hidden' }}>
            <div 
              style={{ 
                width: `${progressPercent}%`, 
                height: '100%', 
                background: '#3498db', 
                transition: 'width 0.5s',
                textAlign: 'right',
                paddingRight: '5px',
                color: 'white',
                fontWeight: 'bold',
                lineHeight: '20px'
              }}
            >
              {Math.round(progressPercent)}%
            </div>
          </div>
          <p style={{ fontSize: '0.9em', marginTop: '10px' }}>
              Complete the quiz for each concept to earn points and update progress.
          </p>
        </div>

        {concepts.map(c => (
          <section key={c.key} style={{ marginBottom: "2em", padding: "20px", borderBottom: `2px solid ${completedConcepts[c.key] ? '#3498db' : '#ecf0f1'}` }}>
            <h2 style={{ color: "#2874a6", fontWeight: "bold" }}>
                {c.title} {completedConcepts[c.key] ? '✅' : '⏳'}
            </h2>
            <ul style={{ paddingLeft: "22px", color: "#333" }}>
              {c.notes.map((n, i) => <li key={i} style={{ marginBottom: "9px" }}>{n}</li>)}
            </ul>
            <Game {...c.game} />
            <Quiz {...c.quiz} conceptKey={c.key} onComplete={handleQuizCompletion} />
          </section>
        ))}

        <footer style={{ textAlign: "center", marginTop: "36px", color: "#888" }}>
          Made for students of Physics – play, learn, and quiz!
        </footer>
      </div>
    </div>
  );
}