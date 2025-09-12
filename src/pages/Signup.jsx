import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Signup.css';

const Signup = () => {
  const { signUp, isSupabaseConfigured } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [authError, setAuthError] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasMinLength = password.length >= 8;
    
    return {
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasMinLength,
      isValid: hasUpperCase && hasLowerCase && hasNumbers && hasMinLength
    };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Real-time validation
    const newErrors = { ...errors };
    if (name === 'fullName') {
      if (!value.trim()) {
        newErrors.fullName = 'Full name is required';
      } else if (value.trim().length < 2) {
        newErrors.fullName = 'Name must be at least 2 characters';
      } else {
        delete newErrors.fullName;
      }
    }
    if (name === 'email') {
      if (!value) {
        newErrors.email = 'Email is required';
      } else if (!validateEmail(value)) {
        newErrors.email = 'Please enter a valid email';
      } else {
        delete newErrors.email;
      }
    }
    if (name === 'password') {
      const passwordValidation = validatePassword(value);
      if (!value) {
        newErrors.password = 'Password is required';
      } else if (!passwordValidation.isValid) {
        newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, and number';
      } else {
        delete newErrors.password;
      }
    }
    if (name === 'confirmPassword') {
      if (!value) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (value !== formData.password) {
        newErrors.confirmPassword = 'Passwords do not match';
      } else {
        delete newErrors.confirmPassword;
      }
    }
    setErrors(newErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    // Validate all fields
    const newErrors = {};
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    const passwordValidation = validatePassword(formData.password);
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!passwordValidation.isValid) {
      newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, and number';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await signUp(formData.email, formData.password, formData.fullName);
      
      if (result.success) {
        setShowSuccess(true);
        console.log('Signup successful:', result);
        
        // Hide success animation and redirect after 3 seconds
        setTimeout(() => {
          setShowSuccess(false);
          navigate('/home');
        }, 3000);
      } else {
        setAuthError(result.error || 'Signup failed. Please try again.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Signup error:', error);
      setAuthError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const passwordValidation = validatePassword(formData.password);

  return (
    <div className="student-container">
      {/* Animated Background */}
      <div className="student-bg">
        <div className="floating-books">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="floating-book" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${10 + Math.random() * 5}s`
            }}>
              <div className="book-icon">📚</div>
            </div>
          ))}
        </div>
        <div className="floating-pencils">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="floating-pencil" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${7 + Math.random() * 4}s`
            }}>
              <div className="pencil-icon">✏️</div>
            </div>
          ))}
        </div>
        <div className="floating-graduation-caps">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="floating-cap" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 7}s`,
              animationDuration: `${12 + Math.random() * 6}s`
            }}>
              <div className="cap-icon">🎓</div>
            </div>
          ))}
        </div>
        <div className="floating-laptops">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="floating-laptop" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${9 + Math.random() * 4}s`
            }}>
              <div className="laptop-icon">💻</div>
            </div>
          ))}
        </div>
      </div>

      {/* Success Animation */}
      {showSuccess && (
        <div className="success-animation">
          <div className="success-checkmark">
            <div className="checkmark">✓</div>
            <div className="graduation-cap">🎓</div>
            <div className="celebration-text">Welcome to the Learning Journey!</div>
          </div>
          <div className="confetti">
            {[...Array(30)].map((_, i) => (
              <div key={i} className="confetti-piece" style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.8}s`,
                backgroundColor: ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0'][Math.floor(Math.random() * 5)]
              }}></div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="student-content">
        {/* Educational Logo */}
        <div className="education-logo">
          <div className="student-desk">
            <div className="desk-icon">🪑</div>
            <div className="laptop-on-desk">💻</div>
            <div className="books-on-desk">
              <div className="book book-1">📖</div>
              <div className="book book-2">📕</div>
            </div>
          </div>
          <div className="glow-effect"></div>
        </div>

        {/* Signup Form */}
        <div className="student-form-container">
          <div className="form-card">
            <form className="student-form" onSubmit={handleSubmit}>
              <h1 className="student-title">
                <span className="title-text">Create Your Student Account</span>
                <div className="title-glow"></div>
              </h1>

              {!isSupabaseConfigured && (
                <div className="demo-notice">
                  <p>🔧 Demo Mode: Supabase not configured. Using simulation.</p>
                </div>
              )}

              {authError && (
                <div className="auth-error">
                  <p>❌ {authError}</p>
                </div>
              )}

              <div className="input-group">
                <label className="student-label">Full Name</label>
                <div className="input-container">
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`student-input ${errors.fullName ? 'error' : ''}`}
                    placeholder="Enter your full name"
                    required
                  />
                  <div className="input-icon">👤</div>
                  {!errors.fullName && formData.fullName && formData.fullName.trim().length >= 2 && (
                    <div className="validation-icon success">✅</div>
                  )}
                </div>
                {errors.fullName && <div className="error-message">{errors.fullName}</div>}
              </div>

              <div className="input-group">
                <label className="student-label">Email Address</label>
                <div className="input-container">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`student-input ${errors.email ? 'error' : ''}`}
                    placeholder="Enter your email address"
                    required
                  />
                  <div className="input-icon">📧</div>
                  {!errors.email && formData.email && validateEmail(formData.email) && (
                    <div className="validation-icon success">✅</div>
                  )}
                </div>
                {errors.email && <div className="error-message">{errors.email}</div>}
              </div>

              <div className="input-group">
                <label className="student-label">Password</label>
                <div className="input-container">
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`student-input ${errors.password ? 'error' : ''}`}
                    placeholder="Create a secure password"
                    required
                  />
                  <div className="input-icon">🔒</div>
                  {!errors.password && formData.password && passwordValidation.isValid && (
                    <div className="validation-icon success">✅</div>
                  )}
                </div>
                {errors.password && <div className="error-message">{errors.password}</div>}
                
                {/* Password Requirements */}
                {formData.password && (
                  <div className="password-requirements">
                    <div className={`requirement ${passwordValidation.hasMinLength ? 'valid' : 'invalid'}`}>
                      <span className="requirement-icon">{passwordValidation.hasMinLength ? '✅' : '❌'}</span>
                      At least 8 characters
                    </div>
                    <div className={`requirement ${passwordValidation.hasUpperCase ? 'valid' : 'invalid'}`}>
                      <span className="requirement-icon">{passwordValidation.hasUpperCase ? '✅' : '❌'}</span>
                      One uppercase letter
                    </div>
                    <div className={`requirement ${passwordValidation.hasLowerCase ? 'valid' : 'invalid'}`}>
                      <span className="requirement-icon">{passwordValidation.hasLowerCase ? '✅' : '❌'}</span>
                      One lowercase letter
                    </div>
                    <div className={`requirement ${passwordValidation.hasNumbers ? 'valid' : 'invalid'}`}>
                      <span className="requirement-icon">{passwordValidation.hasNumbers ? '✅' : '❌'}</span>
                      One number
                    </div>
                  </div>
                )}
              </div>

              <div className="input-group">
                <label className="student-label">Confirm Password</label>
                <div className="input-container">
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`student-input ${errors.confirmPassword ? 'error' : ''}`}
                    placeholder="Confirm your password"
                    required
                  />
                  <div className="input-icon">🔐</div>
                  {!errors.confirmPassword && formData.confirmPassword && formData.confirmPassword === formData.password && (
                    <div className="validation-icon success">✅</div>
                  )}
                </div>
                {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
              </div>

              <button 
                type="submit" 
                className={`student-button signup-button ${isLoading ? 'loading' : ''}`}
                disabled={isLoading}
              >
                <span className="button-text">
                  {isLoading ? 'Creating Account...' : 'Sign Up'}
                </span>
                <div className="button-glow"></div>
                <div className="button-shine"></div>
                <div className="button-progress">
                  <div className="progress-bar"></div>
                </div>
              </button>

              <div className="form-footer">
                <Link to="/login" className="student-link">
                  <span className="link-text">Already registered? Login</span>
                  <div className="link-underline"></div>
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
