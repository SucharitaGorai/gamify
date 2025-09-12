import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useProgress } from '../contexts/ProgressContext';
import './SubjectDetail.css';

export default function SubjectDetail() {
  const { subjectKey } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { studentProgress, updateProgress } = useProgress();

  const [selectedClass, setSelectedClass] = useState(location.state?.class || "6");
  const [subject, setSubject] = useState(location.state?.subject || null);

  // Default subject data if not passed through navigation
  const defaultSubjects = {
    science: {
      name: "Science",
      key: "science",
      icon: "🔬",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      description: "Explore the wonders of physics, chemistry, and biology"
    },
    technology: {
      name: "Technology",
      key: "technology",
      icon: "💻",
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      description: "Learn coding, robotics, and digital innovation"
    },
    mathematics: {
      name: "Mathematics",
      key: "mathematics",
      icon: "📐",
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      description: "Master numbers, equations, and problem-solving"
    }
  };

  useEffect(() => {
    console.log('SubjectDetail mounted with subjectKey:', subjectKey);
    console.log('Location state:', location.state);
    if (!subject && subjectKey) {
      const foundSubject = defaultSubjects[subjectKey];
      console.log('Setting subject to:', foundSubject);
      setSubject(foundSubject);
    }
  }, [subjectKey, subject, location.state]);

  const handleActivityClick = (activityType) => {
    // Navigate to specific activity page
    if (activityType === 'games') {
      navigate(`/game/${subjectKey}`, { 
        state: { 
          class: selectedClass,
          subject: subject
        }
      });
    } else if (activityType === 'quizzes') {
      navigate(`/quiz/${subjectKey}`, { 
        state: { 
          class: selectedClass,
          subject: subject
        }
      });
    }
  };

  const goBack = () => {
    navigate('/home');
  };

  if (!subject) {
    return (
      <div className="subject-detail-loading">
        <motion.div
          className="loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          📚
        </motion.div>
        <p>Loading subject...</p>
      </div>
    );
  }

  const currentProgress = studentProgress && studentProgress[subjectKey] 
    ? studentProgress[subjectKey] 
    : { games: 0, quizzes: 0 };

  return (
    <div className="subject-detail-container">
      {/* Header Section */}
      <motion.header 
        className="subject-header"
        style={{ background: subject.gradient }}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <button className="back-button" onClick={goBack}>
          ← Back to Dashboard
        </button>
        
        <div className="subject-info">
          <div className="subject-icon-large">{subject.icon}</div>
          <h1 className="subject-title">{subject.name}</h1>
          <p className="subject-description">{subject.description}</p>
          <div className="class-info">Class {selectedClass}</div>
        </div>

        {/* User Welcome */}
        {user && (
          <div className="user-info">
            <span>Welcome, {user.user_metadata?.full_name || user.email || 'Student'}!</span>
          </div>
        )}
      </motion.header>

      {/* Progress Overview */}
      <motion.section 
        className="progress-overview"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <h2>Your Progress</h2>
        <div className="progress-cards">
          <div className="progress-card">
            <div className="progress-label">Games</div>
            <div className="progress-value">{currentProgress.games}%</div>
            <div className="progress-bar">
              <motion.div 
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${currentProgress.games}%` }}
                transition={{ delay: 0.5, duration: 1 }}
              />
            </div>
          </div>
          <div className="progress-card">
            <div className="progress-label">Quizzes</div>
            <div className="progress-value">{currentProgress.quizzes}%</div>
            <div className="progress-bar">
              <motion.div 
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${currentProgress.quizzes}%` }}
                transition={{ delay: 0.7, duration: 1 }}
              />
            </div>
          </div>
        </div>
      </motion.section>

      {/* Activity Cards */}
      <motion.section 
        className="activities-section"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <h2>Choose Your Activity</h2>
        <div className="activities-container">
          {/* Games Card */}
          <motion.div
            className="activity-card games-card"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            whileHover={{ 
              scale: 1.05, 
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
              transition: { duration: 0.3 }
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleActivityClick('games')}
          >
            <div className="activity-icon">🎮</div>
            <h3 className="activity-title">Interactive Games</h3>
            <p className="activity-description">
              Learn through fun, interactive games that make complex concepts easy to understand.
            </p>
            <div className="activity-stats">
              <div className="stat">
                <span className="stat-value">{currentProgress.games}%</span>
                <span className="stat-label">Completed</span>
              </div>
              <div className="stat">
                <span className="stat-value">12</span>
                <span className="stat-label">Available</span>
              </div>
            </div>
            <motion.button 
              className="activity-button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              Play Games 🚀
            </motion.button>
          </motion.div>

          {/* Quizzes Card */}
          <motion.div
            className="activity-card quizzes-card"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            whileHover={{ 
              scale: 1.05, 
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
              transition: { duration: 0.3 }
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleActivityClick('quizzes')}
          >
            <div className="activity-icon">📝</div>
            <h3 className="activity-title">Knowledge Quizzes</h3>
            <p className="activity-description">
              Test your understanding with engaging quizzes and track your learning progress.
            </p>
            <div className="activity-stats">
              <div className="stat">
                <span className="stat-value">{currentProgress.quizzes}%</span>
                <span className="stat-label">Completed</span>
              </div>
              <div className="stat">
                <span className="stat-value">8</span>
                <span className="stat-label">Available</span>
              </div>
            </div>
            <motion.button 
              className="activity-button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              Take Quiz 📊
            </motion.button>
          </motion.div>
        </div>
      </motion.section>

      {/* Achievement Section */}
      <motion.section 
        className="achievement-section"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        <h2>Recent Achievements</h2>
        <div className="achievements-container">
          <div className="achievement-item">
            <div className="achievement-icon">🏆</div>
            <div className="achievement-text">
              <h4>First Steps</h4>
              <p>Started learning {subject.name}</p>
            </div>
          </div>
          {currentProgress.games > 0 && (
            <div className="achievement-item">
              <div className="achievement-icon">🎮</div>
              <div className="achievement-text">
                <h4>Game Player</h4>
                <p>Completed your first game</p>
              </div>
            </div>
          )}
          {currentProgress.quizzes > 0 && (
            <div className="achievement-item">
              <div className="achievement-icon">📝</div>
              <div className="achievement-text">
                <h4>Quiz Master</h4>
                <p>Completed your first quiz</p>
              </div>
            </div>
          )}
        </div>
      </motion.section>
    </div>
  );
}
