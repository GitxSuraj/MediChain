import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import logoImg from '../assets/logo.jpg';
import './LandingPage.css';


const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

interface LeadForm {
  name: string;
  hospital_name: string;
  phone: string;
  email: string;
}

const EMPTY_LEAD: LeadForm = { name: '', hospital_name: '', phone: '', email: '' };

// Subtle, reusable scroll-reveal — a slight upward fade, once per section.
// Uses the framer-motion dependency already in package.json rather than
// adding a new animation library.
const revealProps = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5, ease: 'easeOut' },
} as const;

const PATIENT_CAPABILITIES = [
  'Find nearby hospitals',
  'View facilities, beds & ICU availability',
  'Book appointments',
  'Access medical history',
  'Set medicine reminders',
  'Receive real-time notifications',
  'Review hospitals',
];

const HOSPITAL_CAPABILITIES = [
  'Manage appointments',
  'Manage inventory',
  'Manage billing',
  'Manage patient records',
  'Manage staff permissions',
];

const TRUST_POINTS = [
  {
    title: 'Connected healthcare ecosystem',
    body: 'Patients and hospitals share one platform — bed availability, appointments, and updates stay in sync in real time.',
  },
  {
    title: 'Hospital discovery',
    body: 'Search and map hospitals by specialty, distance, and live facility data instead of relying on outdated directories.',
  },
  {
    title: 'Real-time appointment updates',
    body: 'Confirmations and status changes are pushed to patients the moment a hospital responds — no refreshing required.',
  },
  {
    title: 'Centralized medical records',
    body: "Diagnoses, prescriptions, and visit history are kept in one place so patients don't have to carry paper records between hospitals.",
  },
];

export default function LandingPage() {
  const [lead, setLead] = useState<LeadForm>(EMPTY_LEAD);
  const [submitting, setSubmitting] = useState(false);
  const [leadStatus, setLeadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [leadError, setLeadError] = useState('');

  async function handleLeadSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setLeadStatus('idle');
    try {
      const response = await fetch(`${API_URL}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail?.[0]?.msg || body.detail || 'Could not submit — please check your details.');
      }
      setLeadStatus('success');
      setLead(EMPTY_LEAD);
    } catch (err) {
      setLeadStatus('error');
      setLeadError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="landing">
      {/* ---------- Header ---------- */}
      <header className="landing-nav">
        <div className="landing-nav__inner">
          <div className="landing-brand">
            <img src={logoImg} alt="MediChain" style={{ height: 44, width: 'auto', objectFit: 'contain' }} />
          </div>

          <nav className="landing-nav__links">
            <a href="#how-it-works">How It Works</a>
            <a href="#value">For Patients &amp; Hospitals</a>
            <a href="#for-hospitals">For Hospitals</a>
          </nav>
          <div className="landing-nav__actions">
            <Link to="/login" className="btn btn-ghost">Patient Login</Link>
            <Link to="/hospital-login" className="btn btn-secondary">Hospital Login</Link>
          </div>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="landing-hero">
        <div className="landing-hero__grid">
          <motion.div
            className="landing-hero__content"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <span className="landing-hero__eyebrow">Hospital Network Platform</span>
            <h1 className="landing-hero__title">Connected Healthcare. Better Care.</h1>
            <p className="landing-hero__subtitle">
              MediChain links patients to real-time hospital bed availability, appointment booking,
              medical records, and medicine reminders — connecting patients with hospitals so care
              starts faster, when it matters most.
            </p>
            <div className="landing-hero__actions">
              <Link to="/hospital-map" className="btn btn-primary landing-hero__cta">Find a Hospital</Link>
              <Link to="/book-appointment" className="btn btn-secondary">Book an Appointment</Link>
            </div>
            <div className="landing-hero__login-hint">
              <Link to="/login">I&rsquo;m a Patient →</Link>
              <Link to="/hospital-login">I&rsquo;m a Hospital / Clinic →</Link>
            </div>
          </motion.div>

          <motion.div
            className="landing-hero__visual"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          >
            <div className="landing-hero__logo-card">
              <div className="landing-hero__logo-glow" />
              <img src={logoImg} alt="MediChain" className="landing-hero__logo-img" />
              <div className="landing-hero__badge landing-hero__badge--top">
                <span className="landing-hero__badge-dot" />
                <span>Unified Hospital Network</span>
              </div>
              <div className="landing-hero__badge landing-hero__badge--bottom">
                <span>⚡ Real-Time Bed &amp; ICU Tracking</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---------- How It Works ---------- */}
      <motion.section id="how-it-works" className="landing-steps" {...revealProps}>
        <h2 className="landing-section-title">How MediChain Works</h2>
        <div className="landing-steps__grid">
          <div className="landing-step">
            <span className="landing-step__number">01</span>
            <h3>Find</h3>
            <p>Discover hospitals, clinics, and available facilities — with real bed, ICU, and ventilator availability, or the nearest one on the map.</p>
          </div>
          <div className="landing-step__connector" aria-hidden="true" />
          <div className="landing-step">
            <span className="landing-step__number">02</span>
            <h3>Book</h3>
            <p>Find available appointments and book your visit. Get confirmation the moment the hospital accepts your request.</p>
          </div>
          <div className="landing-step__connector" aria-hidden="true" />
          <div className="landing-step">
            <span className="landing-step__number">03</span>
            <h3>Get Care</h3>
            <p>Manage appointments, medical history, medicine reminders, and follow-ups — all in one place.</p>
          </div>
        </div>
      </motion.section>

      {/* ---------- Patient + Hospital Value ---------- */}
      <section id="value" className="landing-value">
        <motion.h2 className="landing-section-title" {...revealProps}>Built for Patients and Hospitals</motion.h2>
        <div className="landing-value__grid">
          <motion.div className="landing-value__card card-surface" {...revealProps}>
            <span className="landing-value__tag">For Patients</span>
            <ul className="landing-value__list">
              {PATIENT_CAPABILITIES.map((item) => (
                <li key={item}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M20 6L9 17l-5-5" /></svg>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            className="landing-value__card card-surface"
            {...revealProps}
            transition={{ ...revealProps.transition, delay: 0.08 }}
          >
            <span className="landing-value__tag landing-value__tag--secondary">For Hospitals / Clinics</span>
            <ul className="landing-value__list">
              {HOSPITAL_CAPABILITIES.map((item) => (
                <li key={item}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M20 6L9 17l-5-5" /></svg>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* ---------- Trust / Healthcare Section ---------- */}
      <section className="landing-trust">
        <motion.h2 className="landing-section-title" {...revealProps}>Why Hospitals and Patients Choose MediChain</motion.h2>
        <div className="landing-trust__grid">
          {TRUST_POINTS.map((point, i) => (
            <motion.div
              key={point.title}
              className="landing-trust__card card-surface"
              {...revealProps}
              transition={{ ...revealProps.transition, delay: i * 0.06 }}
            >
              <h4>{point.title}</h4>
              <p>{point.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------- Login Options ---------- */}
      <motion.section className="landing-audience" {...revealProps}>
        <div className="landing-audience__card card-surface">
          <span className="landing-audience__badge">Patient</span>
          <h3>I&rsquo;m a Patient</h3>
          <p>Book appointments, track your medical history, and get reminders for your medication.</p>
          <Link to="/login" className="btn btn-primary">Patient Sign In</Link>
        </div>
        <div className="landing-audience__card card-surface">
          <span className="landing-audience__badge landing-audience__badge--secondary">Hospital</span>
          <h3>I&rsquo;m a Hospital / Clinic</h3>
          <p>Manage bed availability, respond to transfer requests, and coordinate with your care network in real time.</p>
          <Link to="/hospital-login" className="btn btn-secondary">Hospital Sign In</Link>
        </div>
      </motion.section>

      {/* ---------- Hospital Onboarding ---------- */}
      <motion.section id="for-hospitals" className="landing-onboarding" {...revealProps}>
        <div className="landing-onboarding__copy">
          <h2 className="landing-section-title">Want to list your hospital on MediChain?</h2>
          <p>
            Join the network to reach more patients, coordinate bed transfers with nearby facilities,
            and manage appointments in one dashboard. Our team will follow up to get you set up.
          </p>
        </div>

        <form className="landing-onboarding__form card-surface" onSubmit={handleLeadSubmit}>
          <label className="landing-field">
            <span>Your Name</span>
            <input
              required
              value={lead.name}
              onChange={(e) => setLead((p) => ({ ...p, name: e.target.value }))}
              placeholder="Dr. Ananya Sharma"
            />
          </label>
          <label className="landing-field">
            <span>Hospital Name</span>
            <input
              required
              value={lead.hospital_name}
              onChange={(e) => setLead((p) => ({ ...p, hospital_name: e.target.value }))}
              placeholder="City Care General Hospital"
            />
          </label>
          <div className="landing-field-row">
            <label className="landing-field">
              <span>Phone</span>
              <input
                required
                type="tel"
                value={lead.phone}
                onChange={(e) => setLead((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+91 98765 43210"
              />
            </label>
            <label className="landing-field">
              <span>Email</span>
              <input
                required
                type="email"
                value={lead.email}
                onChange={(e) => setLead((p) => ({ ...p, email: e.target.value }))}
                placeholder="you@hospital.com"
              />
            </label>
          </div>

          {leadStatus === 'success' && (
            <div className="landing-field__status landing-field__status--success">
              Thanks — our team will reach out shortly.
            </div>
          )}
          {leadStatus === 'error' && (
            <div className="landing-field__status landing-field__status--error">{leadError}</div>
          )}

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? <span className="spinner" /> : 'Request Onboarding'}
          </button>
        </form>
      </motion.section>

      {/* ---------- Footer ---------- */}
      <footer className="landing-footer">
        <div className="landing-footer__inner">
          <div className="landing-brand">
            <span className="landing-brand__mark">M</span>
            <span className="landing-brand__name">MediChain</span>
          </div>
          <nav className="landing-footer__links">
            <a href="#how-it-works">How It Works</a>
            <a href="#value">For Patients &amp; Hospitals</a>
            <a href="#for-hospitals">For Hospitals</a>
            <Link to="/login">Patient Login</Link>
            <Link to="/hospital-login">Hospital Login</Link>
          </nav>
          <p className="landing-footer__copyright mono">© {new Date().getFullYear()} MediChain. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
