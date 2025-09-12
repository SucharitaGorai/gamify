import React, { useState, useEffect, useRef, useCallback } from 'react';

const SpaceshipQuizGame = () => {
  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [gameLost, setGameLost] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [xp, setXp] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [spaceshipPosition, setSpaceshipPosition] = useState({ x: 400, y: 300 });
  const [asteroids, setAsteroids] = useState([]);
  const [keys, setKeys] = useState({});
  
  // Quiz state
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [quizResult, setQuizResult] = useState(null);
  
  const gameRef = useRef(null);
  const animationRef = useRef(null);
  const lastAsteroidSpawn = useRef(0);
  const lastXpGain = useRef(0);

  // Physics questions related to force and laws of motion
  const questions = [
    {
      question: "What is Newton's First Law of Motion?",
      options: [
        "F = ma",
        "An object at rest stays at rest, an object in motion stays in motion",
        "For every action, there is an equal and opposite reaction",
        "Energy cannot be created or destroyed"
      ],
      correct: 1
    },
    {
      question: "What is the formula for force?",
      options: [
        "F = mv",
        "F = ma",
        "F = mgh",
        "F = 1/2mv²"
      ],
      correct: 1
    },
    {
      question: "What is Newton's Second Law of Motion?",
      options: [
        "F = ma",
        "An object at rest stays at rest",
        "For every action, there is an equal and opposite reaction",
        "Energy is conserved"
      ],
      correct: 0
    },
    {
      question: "What is Newton's Third Law of Motion?",
      options: [
        "F = ma",
        "An object at rest stays at rest",
        "For every action, there is an equal and opposite reaction",
        "Energy cannot be created or destroyed"
      ],
      correct: 2
    },
    {
      question: "What is the unit of force?",
      options: [
        "Joule",
        "Newton",
        "Watt",
        "Pascal"
      ],
      correct: 1
    },
    {
      question: "What happens to acceleration when force increases?",
      options: [
        "Acceleration decreases",
        "Acceleration increases",
        "Acceleration stays the same",
        "Acceleration becomes zero"
      ],
      correct: 1
    },
    {
      question: "What is inertia?",
      options: [
        "The tendency of objects to resist changes in motion",
        "The force of gravity",
        "The speed of light",
        "The energy of motion"
      ],
      correct: 0
    },
    {
      question: "What is momentum?",
      options: [
        "p = mv",
        "p = ma",
        "p = mgh",
        "p = 1/2mv²"
      ],
      correct: 0
    }
  ];

  // Handle keyboard input
  const handleKeyDown = useCallback((e) => {
    setKeys(prev => ({ ...prev, [e.key]: true }));
  }, []);

  const handleKeyUp = useCallback((e) => {
    setKeys(prev => ({ ...prev, [e.key]: false }));
  }, []);

  // Generate random asteroid
  const generateAsteroid = () => {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    
    switch (side) {
      case 0: // Top
        x = Math.random() * 800;
        y = -50;
        break;
      case 1: // Right
        x = 850;
        y = Math.random() * 600;
        break;
      case 2: // Bottom
        x = Math.random() * 800;
        y = 650;
        break;
      case 3: // Left
        x = -50;
        y = Math.random() * 600;
        break;
    }
    
    return {
      id: Date.now() + Math.random(),
      x,
      y,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3,
      size: Math.random() * 40 + 25,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.1
    };
  };

  // Check collision between spaceship and asteroid
  const checkCollision = (spaceship, asteroid) => {
    const distance = Math.sqrt(
      Math.pow(spaceship.x - asteroid.x, 2) + 
      Math.pow(spaceship.y - asteroid.y, 2)
    );
    return distance < (20 + asteroid.size / 2);
  };

  // Start quiz when collision occurs
  const startQuiz = () => {
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    setCurrentQuestion(randomQuestion);
    setShowQuiz(true);
    setIsPaused(true);
    setSelectedAnswer('');
    setQuizResult(null);
  };

  // Handle quiz answer
  const handleQuizAnswer = (answerIndex) => {
    setSelectedAnswer(answerIndex);
    const isCorrect = answerIndex === currentQuestion.correct;
    setQuizResult(isCorrect);
    
    if (isCorrect) {
      setXp(prev => Math.max(0, prev + 40));
    } else {
      setXp(prev => Math.max(0, prev - 10));
    }
  };

  // Close quiz and resume game
  const closeQuiz = () => {
    setShowQuiz(false);
    setIsPaused(false);
    setCurrentQuestion(null);
    setSelectedAnswer('');
    setQuizResult(null);
  };

  // Game loop
  const gameLoop = useCallback(() => {
    if (!gameStarted || isPaused || gameWon || gameLost) {
      animationRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const now = Date.now();
    
    // Update spaceship position based on keys
    setSpaceshipPosition(prev => {
      let newX = prev.x;
      let newY = prev.y;
      
      if (keys['ArrowLeft'] || keys['a'] || keys['A']) newX -= 5;
      if (keys['ArrowRight'] || keys['d'] || keys['D']) newX += 5;
      if (keys['ArrowUp'] || keys['w'] || keys['W']) newY -= 5;
      if (keys['ArrowDown'] || keys['s'] || keys['S']) newY += 5;
      
      // Keep spaceship within bounds
      newX = Math.max(20, Math.min(780, newX));
      newY = Math.max(20, Math.min(580, newY));
      
      return { x: newX, y: newY };
    });

    // Spawn asteroids more frequently
    if (now - lastAsteroidSpawn.current > 800) {
      setAsteroids(prev => [...prev, generateAsteroid()]);
      lastAsteroidSpawn.current = now;
    }

    // Update asteroids
    setAsteroids(prev => 
      prev.map(asteroid => ({
        ...asteroid,
        x: asteroid.x + asteroid.vx,
        y: asteroid.y + asteroid.vy,
        rotation: asteroid.rotation + asteroid.rotationSpeed
      })).filter(asteroid => 
        asteroid.x > -100 && asteroid.x < 900 && 
        asteroid.y > -100 && asteroid.y < 700
      )
    );

    // Check collisions
    setAsteroids(prev => {
      const newAsteroids = [...prev];
      const spaceship = spaceshipPosition;
      
      for (let i = newAsteroids.length - 1; i >= 0; i--) {
        if (checkCollision(spaceship, newAsteroids[i])) {
          newAsteroids.splice(i, 1);
          setXp(prevXp => Math.max(0, prevXp - 5));
          startQuiz();
          break;
        }
      }
      
      return newAsteroids;
    });

    // Gain XP every second
    if (now - lastXpGain.current > 1000) {
      setXp(prev => prev + 2);
      lastXpGain.current = now;
    }

    // Update timer
    setTimeLeft(prev => {
      const newTime = prev - 0.016; // ~60fps
      if (newTime <= 0) {
        setGameLost(true);
        return 0;
      }
      return newTime;
    });

    // Check win condition
    if (xp >= 100) {
      setGameWon(true);
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [gameStarted, isPaused, gameWon, gameLost, keys, spaceshipPosition, xp]);

  // Start game
  const startGame = () => {
    setGameStarted(true);
    setGameWon(false);
    setGameLost(false);
    setXp(0);
    setTimeLeft(60);
    setSpaceshipPosition({ x: 400, y: 300 });
    setAsteroids([]);
    setIsPaused(false);
    lastAsteroidSpawn.current = Date.now();
    lastXpGain.current = Date.now();
  };

  // Effects
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  useEffect(() => {
    if (gameStarted) {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameStarted, gameLoop]);

  return (
    <div className="spaceship-quiz-game" style={{ 
      width: '800px', 
      height: '600px', 
      margin: '0 auto',
      position: 'relative',
      backgroundColor: '#000011',
      border: '2px solid #333',
      overflow: 'hidden'
    }}>
      {/* Game UI */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        right: '10px',
        zIndex: 10,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* XP Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: '#00ff00', fontSize: '16px', fontWeight: 'bold' }}>XP:</span>
          <div style={{
            width: '200px',
            height: '20px',
            backgroundColor: '#333',
            border: '2px solid #00ff00',
            borderRadius: '10px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.min(100, (xp / 100) * 100)}%`,
              height: '100%',
              backgroundColor: '#00ff00',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <span style={{ color: '#00ff00', fontSize: '14px' }}>{xp}/100</span>
        </div>

        {/* Time Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: '#ff6600', fontSize: '16px', fontWeight: 'bold' }}>Time:</span>
          <div style={{
            width: '200px',
            height: '20px',
            backgroundColor: '#333',
            border: '2px solid #ff6600',
            borderRadius: '10px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(timeLeft / 60) * 100}%`,
              height: '100%',
              backgroundColor: '#ff6600',
              transition: 'width 0.1s ease'
            }} />
          </div>
          <span style={{ color: '#ff6600', fontSize: '14px' }}>{Math.ceil(timeLeft)}s</span>
        </div>
      </div>

      {/* Spaceship */}
      {gameStarted && (
        <div style={{
          position: 'absolute',
          left: spaceshipPosition.x - 20,
          top: spaceshipPosition.y - 20,
          width: '40px',
          height: '40px',
          zIndex: 5,
          transform: 'rotate(0deg)'
        }}>
          {/* Spaceship body */}
          <div style={{
            position: 'absolute',
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #4a90e2, #2c5aa0)',
            clipPath: 'polygon(50% 0%, 20% 80%, 80% 80%)',
            boxShadow: '0 0 15px rgba(74, 144, 226, 0.6), inset 0 0 10px rgba(255, 255, 255, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }} />
          {/* Cockpit */}
          <div style={{
            position: 'absolute',
            left: '15px',
            top: '8px',
            width: '10px',
            height: '8px',
            background: 'linear-gradient(135deg, #87ceeb, #4682b4)',
            borderRadius: '50%',
            boxShadow: '0 0 8px rgba(135, 206, 235, 0.8)'
          }} />
          {/* Engine glow */}
          <div style={{
            position: 'absolute',
            left: '12px',
            top: '25px',
            width: '16px',
            height: '12px',
            background: 'radial-gradient(ellipse, #ff6b35, #ff4500, transparent)',
            borderRadius: '50%',
            opacity: 0.8
          }} />
        </div>
      )}

      {/* Asteroids */}
      {asteroids.map(asteroid => (
        <div
          key={asteroid.id}
          style={{
            position: 'absolute',
            left: asteroid.x - asteroid.size / 2,
            top: asteroid.y - asteroid.size / 2,
            width: asteroid.size,
            height: asteroid.size,
            zIndex: 3,
            transform: `rotate(${asteroid.rotation}rad)`
          }}
        >
          {/* Main asteroid body */}
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            background: 'radial-gradient(circle at 30% 30%, #8b7355, #5d4e37, #3d2f1f)',
            borderRadius: '50%',
            boxShadow: 'inset -5px -5px 10px rgba(0,0,0,0.5), inset 5px 5px 10px rgba(255,255,255,0.1)',
            border: '1px solid rgba(139, 115, 85, 0.3)'
          }} />
          {/* Craters and surface details */}
          <div style={{
            position: 'absolute',
            left: '20%',
            top: '25%',
            width: '15%',
            height: '15%',
            background: 'radial-gradient(circle, rgba(0,0,0,0.4), transparent)',
            borderRadius: '50%'
          }} />
          <div style={{
            position: 'absolute',
            left: '60%',
            top: '60%',
            width: '12%',
            height: '12%',
            background: 'radial-gradient(circle, rgba(0,0,0,0.3), transparent)',
            borderRadius: '50%'
          }} />
          <div style={{
            position: 'absolute',
            left: '70%',
            top: '20%',
            width: '10%',
            height: '10%',
            background: 'radial-gradient(circle, rgba(0,0,0,0.2), transparent)',
            borderRadius: '50%'
          }} />
          {/* Highlight */}
          <div style={{
            position: 'absolute',
            left: '25%',
            top: '20%',
            width: '20%',
            height: '20%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.2), transparent)',
            borderRadius: '50%'
          }} />
        </div>
      ))}

      {/* Stars background */}
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: Math.random() * 800,
            top: Math.random() * 600,
            width: '2px',
            height: '2px',
            backgroundColor: '#fff',
            borderRadius: '50%',
            zIndex: 1
          }}
        />
      ))}

      {/* Start Screen */}
      {!gameStarted && !gameWon && !gameLost && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 20,
          color: '#fff'
        }}>
          <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>Spaceship Quiz Game</h1>
          <p style={{ fontSize: '18px', marginBottom: '30px', textAlign: 'center' }}>
            Fly your spaceship and collect 100 XP in 60 seconds!<br/>
            Gain 2 XP per second, avoid asteroids or answer physics questions to continue.
          </p>
          <p style={{ fontSize: '14px', marginBottom: '20px', color: '#ccc' }}>
            Controls: Arrow Keys or WASD
          </p>
          <button
            onClick={startGame}
            style={{
              padding: '15px 30px',
              fontSize: '18px',
              backgroundColor: '#00aaff',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Start Game
          </button>
        </div>
      )}

      {/* Win Screen */}
      {gameWon && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 20,
          color: '#00ff00'
        }}>
          <h1 style={{ fontSize: '36px', marginBottom: '20px' }}>�� Congratulations! ��</h1>
          <p style={{ fontSize: '24px', marginBottom: '30px' }}>You discovered a new planet!</p>
          <p style={{ fontSize: '18px', marginBottom: '30px', color: '#ccc' }}>
            You successfully gained 100 XP in {Math.ceil(60 - timeLeft)} seconds!
          </p>
          <button
            onClick={startGame}
            style={{
              padding: '15px 30px',
              fontSize: '18px',
              backgroundColor: '#00ff00',
              color: '#000',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Play Again
          </button>
        </div>
      )}

      {/* Lose Screen */}
      {gameLost && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 20,
          color: '#ff4444'
        }}>
          <h1 style={{ fontSize: '36px', marginBottom: '20px' }}>💥 Game Over! ��</h1>
          <p style={{ fontSize: '24px', marginBottom: '30px' }}>You lose the game!</p>
          <p style={{ fontSize: '18px', marginBottom: '30px', color: '#ccc' }}>
            You only gained {xp} XP. You need 100 XP to win!
          </p>
          <button
            onClick={startGame}
            style={{
              padding: '15px 30px',
              fontSize: '18px',
              backgroundColor: '#ff4444',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Quiz Modal */}
      {showQuiz && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 30
        }}>
          <div style={{
            backgroundColor: '#222',
            padding: '30px',
            borderRadius: '10px',
            maxWidth: '500px',
            width: '90%',
            color: '#fff'
          }}>
            <h2 style={{ marginBottom: '20px', color: '#00aaff' }}>
              Physics Question - Force & Motion
            </h2>
            <p style={{ fontSize: '18px', marginBottom: '20px' }}>
              {currentQuestion?.question}
            </p>
            
            <div style={{ marginBottom: '20px' }}>
              {currentQuestion?.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleQuizAnswer(index)}
                  disabled={selectedAnswer !== ''}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '10px',
                    margin: '5px 0',
                    backgroundColor: selectedAnswer === index 
                      ? (quizResult ? '#00ff00' : '#ff4444')
                      : '#444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: selectedAnswer === '' ? 'pointer' : 'default',
                    fontSize: '16px'
                  }}
                >
                  {String.fromCharCode(65 + index)}. {option}
                </button>
              ))}
            </div>

            {quizResult !== null && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ 
                  color: quizResult ? '#00ff00' : '#ff4444',
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}>
                  {quizResult ? 'Correct! +40 XP' : 'Wrong! -10 XP'}
                </p>
              </div>
            )}

            <button
              onClick={closeQuiz}
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                backgroundColor: '#00aaff',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Continue Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpaceshipQuizGame;