import React from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import './LandingPage.css';

function LandingPage() {
  const { user, signOut, isAuthenticated } = useAuth();
  const { t, currentLanguage, changeLanguage, languages } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const result = await signOut();
    if (result.success) {
      window.location.reload();
    }
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      // User is already logged in, redirect to home
      navigate('/home');
    } else {
      // User is not logged in, redirect to signup
      navigate('/signup');
    }
  };

  return (
    <div className="landing-page">
      {/* Background Video with Overlay */}
      <div className="video-background">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="background-video"
        >
          <source src="/Neon Sci Fi Gaming YouTube Video Intro (1).mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="video-overlay"></div>
      </div>

      {/* Navbar */}
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="navbar"
      >
        <h1 className="navbar-brand"><img src="logo.png" alt="logo" /></h1>
        <div className="navbar-links">
          <a href="#features" className="navbar-link">
            {t('navbar.features')}
          </a>
          <a href="#about" className="navbar-link">
            {t('navbar.about')}
          </a>
          <a href="#contact" className="navbar-link">
            {t('navbar.contact')}
          </a>

          {/* Language Switcher */}
          <div className="language-switcher">
            <select 
              value={currentLanguage} 
              onChange={(e) => changeLanguage(e.target.value)}
              className="language-select"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>
 
          {isAuthenticated ? (
            <div className="user-section">
              <span className="user-welcome">
                {t('navbar.welcome')}, {user?.user_metadata?.full_name || user?.email || 'Student'}!
              </span>
              <button
                onClick={handleLogout}
                className="navbar-btn navbar-btn-secondary logout-btn"
              >
                {t('navbar.logout')}
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="navbar-btn navbar-btn-primary"
              >
                {t('navbar.login')}
              </Link>
              <Link
                to="/signup"
                className="navbar-btn navbar-btn-secondary"
              >
                {t('navbar.signup')}
              </Link>
            </>
          )}
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="hero-content"
          >
            <h2>
              {t('hero.title')}
            </h2>
            <p>
              {t('hero.description')}
            </p>
            <div className="hero-buttons">
              <a
                href="#features"
                className="hero-btn hero-btn-primary"
              >
                {t('hero.exploreFeatures')}
              </a>
              <button
                onClick={handleGetStarted}
                className="hero-btn hero-btn-secondary"
              >
                {t('hero.getStarted')}
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ x: 50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <img
              // src="Best-Of-Game-For-Rural-Students.jpg"
              className="hero-image"
            />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="features-container"
        >
          <div className="features-header">
            <h3>{t('features.title')}</h3>
            <p>
              {t('features.subtitle')}
            </p>
          </div>
        </motion.div>

        <div className="features-grid">
          {[
            {
              title: t('features.interactiveGames.title'),
              desc: t('features.interactiveGames.description'),
            },
            {
              title: t('features.multilingual.title'),
              desc: t('features.multilingual.description'),
            },
            {
              title: t('features.offlineAccess.title'),
              desc: t('features.offlineAccess.description'),
            },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: idx * 0.2 }}
              viewport={{ once: true }}
              className="feature-card"
            >
              <h4>{item.title}</h4>
              <p>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
        <div className="about-container">
          <motion.img
            initial={{ x: -50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            // src="https://images.unsplash.com/photo-1603575448284-dfef7e8c3d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&q=60"
            // alt="Study materials"
            className="about-image"
          />
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="about-content"
          >
            <h3>{t('about.title')}</h3>
            <p>
              {t('about.description')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="cta-section">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="cta-container"
        >
          <h3>{t('cta.title')}</h3>
          <p>
            {t('cta.description')}
          </p>
          <button
            onClick={handleGetStarted}
            className="cta-btn"
          >
            {t('cta.getStartedNow')}
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        id="contact"
        className="footer"
      >
        <div className="footer-container">
          <p>{t('footer.copyright')}</p>
          <div className="footer-links">
            <a href="#" className="footer-link">
              {t('footer.privacy')}
            </a>
            <a href="#" className="footer-link">
              {t('footer.terms')}
            </a>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}

export default LandingPage;
