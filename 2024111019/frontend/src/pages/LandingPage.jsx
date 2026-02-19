import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import WaterBackground from '../components/WaterBackground';

/* ── Felicity 2026 data pulled from felicity.iiit.ac.in ── */

const FEST_DATE = new Date('2026-02-13T00:00:00+05:30');

const ARTISTS = [
  { name: 'Chaar Diwaari', genre: 'Indie Rock', img: 'https://felicity.iiit.ac.in/Artists/Chaar-Diwaari.jpg' },
  { name: 'Anuj Rehan', genre: 'Singer-Songwriter', img: 'https://felicity.iiit.ac.in/Artists/rehan.jpeg' },
  { name: 'Shreya Baruah', genre: 'Indie Pop', img: 'https://felicity.iiit.ac.in/Artists/baruah.jpg' },
  { name: 'Vivek Samtani', genre: 'Electronic', img: 'https://felicity.iiit.ac.in/Artists/samtani.webp' },
  { name: 'Pranav Sharma', genre: 'Acoustic', img: 'https://felicity.iiit.ac.in/Artists/sharma.jpg' },
];

const GIGS = [
  { club: 'Dance Club', event: 'Zest', date: 'Feb 13 · 2:00 PM', venue: 'Warehouse' },
  { club: 'Chess Club', event: 'Royal Rumble', date: 'Feb 13 · 9:00 AM', venue: 'Warehouse' },
  { club: 'Pentaprism', event: 'Photo Date', date: 'Feb 14 · 4:00 PM', venue: 'Warehouse' },
  { club: 'ASEC', event: 'Capture the Flag', date: 'Feb 15 · 11 AM', venue: 'Football Ground' },
  { club: 'TVRQC', event: 'Battle of Brains', date: 'Feb 15 · 2 PM', venue: 'KRB Auditorium' },
  { club: 'ArtSoc', event: 'Face Painting', date: 'Feb 15 · 3 PM', venue: 'Kadamba Road' },
  { club: 'Decore', event: 'Design Battles', date: 'Feb 15 · 3 PM', venue: 'H105' },
  { club: 'Rouge', event: 'Felicity Rampwalk', date: 'Feb 15 · 7:30 PM', venue: 'Main Stage' },
];

const GALLERY = [
  'https://felicity.iiit.ac.in/CapturedMoments/DSC02159.webp',
  'https://felicity.iiit.ac.in/CapturedMoments/DSC02170.webp',
  'https://felicity.iiit.ac.in/CapturedMoments/DSC02243.webp',
  'https://felicity.iiit.ac.in/CapturedMoments/DSC02357.webp',
  'https://felicity.iiit.ac.in/CapturedMoments/DSC02784.webp',
  'https://felicity.iiit.ac.in/CapturedMoments/DSC02799.webp',
  'https://felicity.iiit.ac.in/CapturedMoments/DSC02897.webp',
  'https://felicity.iiit.ac.in/CapturedMoments/VJS03410.webp',
  'https://felicity.iiit.ac.in/CapturedMoments/VJS03470.webp',
  'https://felicity.iiit.ac.in/CapturedMoments/VJS03578.webp',
  'https://felicity.iiit.ac.in/CapturedMoments/VJS03635.webp',
];

const MERCH = [
  { name: 'Discogorgon', img: 'https://felicity.iiit.ac.in/merch/discogorgon.webp' },
  { name: 'Penguin', img: 'https://felicity.iiit.ac.in/merch/penguin.webp' },
  { name: 'Fried Maggie', img: 'https://felicity.iiit.ac.in/merch/veg-friend.webp' },
];

/* ── Countdown hook ── */
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

/* ── Intersection Observer for scroll reveal ── */
const useReveal = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
};

const Section = ({ children, className = '' }) => {
  const [ref, visible] = useReveal();
  return (
    <section ref={ref} className={`landing-section ${visible ? 'revealed' : ''} ${className}`}>
      {children}
    </section>
  );
};

/* ── Main component ── */
const LandingPage = () => {
  const countdown = useCountdown(FEST_DATE.getTime());
  const [galleryIdx, setGalleryIdx] = useState(0);

  // Auto-advance gallery
  useEffect(() => {
    const id = setInterval(() => setGalleryIdx(i => (i + 1) % GALLERY.length), 3500);
    return () => clearInterval(id);
  }, []);

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div className="landing-page">
      <WaterBackground />

      {/* ─── HERO ─── */}
      <section className="landing-hero">
        {/* Animated disco rings behind content */}
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
            <div className="countdown-unit">
              <span className="countdown-num">{pad(countdown.days)}</span>
              <span className="countdown-label">Days</span>
            </div>
            <span className="countdown-sep">:</span>
            <div className="countdown-unit">
              <span className="countdown-num">{pad(countdown.hours)}</span>
              <span className="countdown-label">Hours</span>
            </div>
            <span className="countdown-sep">:</span>
            <div className="countdown-unit">
              <span className="countdown-num">{pad(countdown.minutes)}</span>
              <span className="countdown-label">Minutes</span>
            </div>
            <span className="countdown-sep">:</span>
            <div className="countdown-unit">
              <span className="countdown-num">{pad(countdown.seconds)}</span>
              <span className="countdown-label">Seconds</span>
            </div>
          </div>

          <div className="landing-hero-cta">
            <Link to="/register" className="btn btn-lg">Register Now</Link>
            <Link to="/events" className="btn btn-outline btn-lg">Browse Events</Link>
          </div>
        </div>
      </section>

      {/* ─── ABOUT ─── */}
      <Section className="landing-about">
        <div className="landing-about-grid">
          <div className="landing-about-text">
            <h2 className="section-title">
              Welcome to <span className="gradient-text">Felicity</span>
            </h2>
            <p>
              Felicity is IIIT Hyderabad's largest and most vibrant annual fest,
              bringing together students from across the country for a celebration
              of culture, creativity, and community.
            </p>
            <p>
              This year, Felicity embraces the <strong>Retro Disco</strong> theme —
              shimmering disco balls, vinyl aesthetics, and iconic melodies of the
              '70s and '80s set the mood for an unforgettable experience.
            </p>
          </div>
          <div className="landing-about-img">
            <img src="https://felicity.iiit.ac.in/tv2.png" alt="Retro TV" />
          </div>
        </div>
      </Section>

      {/* ─── FEATURED ARTISTS ─── */}
      <Section>
        <h2 className="section-title center-title">
          Featured <span className="gradient-text">Artists</span>
        </h2>
        <div className="artists-grid">
          {ARTISTS.map((a) => (
            <div key={a.name} className="artist-card">
              <div className="artist-img-wrap">
                <img src={a.img} alt={a.name} loading="lazy" />
                <div className="artist-overlay">
                  <span className="artist-genre">{a.genre}</span>
                </div>
              </div>
              <h3>{a.name}</h3>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── UPCOMING GIGS ─── */}
      <Section>
        <h2 className="section-title center-title">
          Upcoming <span className="gradient-text">Gigs</span>
        </h2>
        <p className="section-subtitle">DON'T MISS OUT!</p>
        <div className="gigs-grid">
          {GIGS.map((g, i) => (
            <Link key={i} to="/events" className="gig-card">
              <span className="gig-club">{g.club}</span>
              <h3 className="gig-name">{g.event}</h3>
              <span className="gig-detail">{g.date}</span>
              <span className="gig-venue">{g.venue}</span>
            </Link>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link to="/events" className="btn btn-outline">View Full Schedule →</Link>
        </div>
      </Section>

      {/* ─── GALLERY ─── */}
      <Section>
        <h2 className="section-title center-title">
          Captured <span className="gradient-text">Moments</span>
        </h2>
        <div className="gallery-showcase">
          <div className="gallery-main">
            <img
              src={GALLERY[galleryIdx]}
              alt="Felicity Moment"
              key={galleryIdx}
              className="gallery-hero-img"
            />
            <div className="gallery-film-badge">
              {galleryIdx < 6 ? 'KODAK 400' : 'FUJIFILM'}
            </div>
          </div>
          <div className="gallery-strip">
            {GALLERY.map((url, i) => (
              <button
                key={i}
                className={`gallery-thumb ${i === galleryIdx ? 'active' : ''}`}
                onClick={() => setGalleryIdx(i)}
              >
                <img src={url} alt={`Moment ${i + 1}`} loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* ─── OFFICIAL MERCH ─── */}
      <Section>
        <h2 className="section-title center-title">
          Official <span className="gradient-text">Merch</span>
        </h2>
        <div className="merch-grid">
          {MERCH.map(m => (
            <div key={m.name} className="merch-card">
              <img src={m.img} alt={m.name} loading="lazy" />
              <h3>{m.name}</h3>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <a
            href="https://thedopaminestore.in/collections/felicity-iiit-h"
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
          >
            Order Now →
          </a>
        </div>
      </Section>

      {/* ─── INFINIUM ─── */}
      <Section className="infinium-section">
        <div className="infinium-content">
          <h2 className="section-title">
            <span className="gradient-text">Infinium</span>
          </h2>
          <p className="infinium-tagline">IIIT Hyderabad's Premiere Tech Fest</p>
          <p>
            Born in 2025, Infinium is the ultimate convergence of code, culture,
            and creativity. From hackathons and algorithmic battles to robotics
            and AI showcases — 3 days of non-stop innovation.
          </p>
          <a
            href="https://felicity.iiit.ac.in/infinium/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
            style={{ marginTop: 20 }}
          >
            Visit Infinium →
          </a>
        </div>
      </Section>

      {/* ─── SPONSORS ─── */}
      <Section>
        <h2 className="section-title center-title">
          Our <span className="gradient-text">Sponsors</span>
        </h2>
        <div className="sponsors-row">
          <img src="https://felicity.iiit.ac.in/Sponsors/Qualcomm-Logo.webp" alt="Qualcomm" />
          <img src="https://felicity.iiit.ac.in/Sponsors/SBI-logo.webp" alt="SBI" />
        </div>
      </Section>

      {/* ─── FOOTER ─── */}
      <footer className="landing-footer">
        <div className="landing-footer-logos">
          <img src="https://felicity.iiit.ac.in/footer/logo1.png" alt="IIIT-H" />
          <img src="https://felicity.iiit.ac.in/footer/logo2.png" alt="SA" />
          <img src="https://felicity.iiit.ac.in/footer/logo3.png" alt="Cultural Council" />
          <img src="https://felicity.iiit.ac.in/footer/logo4.png" alt="Tech Council" />
        </div>
        <p>Made with ❤️ by Felicity Tech Team</p>
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
