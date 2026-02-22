import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const FEST_DATE = new Date('2026-02-13T00:00:00+05:30');

const useCountdown = (target) => {
  const [left, setLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      setLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return left;
};

const LandingPage = () => {
  const countdown = useCountdown(FEST_DATE.getTime());
  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div className="landing-page">
      {/* Hero */}
      <section className="landing-hero">
        <div className="hero-disco-rings">
          <div className="disco-ring disco-ring-1" />
          <div className="disco-ring disco-ring-2" />
          <div className="disco-ring disco-ring-3" />
        </div>

        <div className="landing-hero-content">
          <p className="landing-hero-date">13 — 15 FEB 2026</p>

          <img
            src="https://felicity.iiit.ac.in/_next/image?url=%2Flogo.png&w=640&q=75"
            alt="Felicity Logo"
            className="landing-hero-logo"
          />

          <h1 className="landing-hero-title">
            FELICITY <span className="gradient-text">2026</span>
          </h1>
          <p className="landing-hero-sub">DISCO EDITION</p>

          {/* Countdown */}
          <div className="countdown-row">
            {['days', 'hours', 'minutes', 'seconds'].map((unit, i) => (
              <div key={unit} style={{ display: 'contents' }}>
                {i > 0 && <span className="countdown-sep">:</span>}
                <div className="countdown-unit">
                  <span className="countdown-num">{pad(countdown[unit])}</span>
                  <span className="countdown-label">{unit}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="landing-hero-cta">
            <Link to="/register" className="btn btn-lg">Register Now</Link>
            <Link to="/events" className="btn btn-outline btn-lg">Browse Events</Link>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="landing-section revealed" style={{ maxWidth: 900, margin: '0 auto' }}>
        <h2 className="section-title" style={{ textAlign: 'center' }}>
          Welcome to <span className="gradient-text">Felicity</span>
        </h2>
        <p style={{ textAlign: 'center', fontSize: '1.05rem', lineHeight: 1.7, maxWidth: 640, margin: '0 auto' }}>
          IIIT Hyderabad's largest annual fest — a celebration of culture, creativity, and community.
          This year's Retro Disco edition brings together workshops, hackathons, merch drops, live performances,
          and more from the finest clubs on campus.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
          <Link to="/events" className="btn btn-outline">Explore Events</Link>
          <Link to="/clubs" className="btn btn-outline">View Clubs</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>Made with care by the Felicity Tech Team</p>
        <div className="landing-footer-links">
          <Link to="/events">Events</Link>
          <Link to="/clubs">Clubs</Link>
          <Link to="/login">Sign In</Link>
          <Link to="/register">Register</Link>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
