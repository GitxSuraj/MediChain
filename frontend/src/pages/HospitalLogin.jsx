import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { staffLogin } from '../services/api.js';
import './HospitalLogin.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function HospitalLogin() {
  const navigate = useNavigate();

  // Step 1 — hospital selection
  const [step, setStep]               = useState(1);
  const [hospitals, setHospitals]     = useState([]);
  const [loadingHosp, setLoadingHosp] = useState(true);
  const [hospError, setHospError]     = useState('');
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [search, setSearch]           = useState('');

  // Step 2 — credentials
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  // Load hospitals on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/hospitals`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Failed to load hospitals');
        setHospitals(data);
      } catch (err) {
        setHospError(err.message);
      } finally {
        setLoadingHosp(false);
      }
    })();
  }, []);

  const filtered = hospitals.filter(h =>
    !search || h.name.toLowerCase().includes(search.toLowerCase()) || (h.city || '').toLowerCase().includes(search.toLowerCase())
  );

  function selectHospital(h) {
    setSelectedHospital(h);
    setError('');
    setStep(2);
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body = await staffLogin(email, password);

      // Verify the staff belongs to the selected hospital
      if (body.user.hospital_id !== selectedHospital.id) {
        throw new Error(`These credentials belong to a different hospital, not ${selectedHospital.name}.`);
      }

      localStorage.setItem('medichain_hospital_token', body.token);
      localStorage.setItem('medichain_staff', JSON.stringify(body.user));
      // Store full hospital info (not hardcoded "Hospital" anymore)
      localStorage.setItem('medichain_hospital', JSON.stringify({
        id:   selectedHospital.id,
        name: selectedHospital.name,
        city: selectedHospital.city || '',
      }));

      if (body.user.role === 'super_admin') {
        navigate('/super-admin');
      } else {
        navigate('/admin');
      }
    } catch (err) {
      setError(err.message || 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="hl-root">
      {/* Ambient blobs */}
      <div className="hl-blob hl-blob--1" />
      <div className="hl-blob hl-blob--2" />

      <div className="hl-card fade-in-up">

        {/* Brand */}
        <div className="hl-brand">
          <div className="hl-brand__mark">M</div>
          <div>
            <h1 className="hl-brand__name">MediChain</h1>
            <p className="hl-brand__tag">STAFF PORTAL</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="hl-steps">
          <div className={`hl-step ${step >= 1 ? 'hl-step--done' : ''}`}>
            <span className="hl-step__dot">{step > 1 ? '✓' : '1'}</span>
            <span className="hl-step__label">Select Hospital</span>
          </div>
          <div className="hl-step__line" />
          <div className={`hl-step ${step >= 2 ? 'hl-step--active' : ''}`}>
            <span className="hl-step__dot">2</span>
            <span className="hl-step__label">Sign In</span>
          </div>
        </div>

        {/* ── STEP 1: Hospital Selection ── */}
        {step === 1 && (
          <div className="hl-hosp-step">
            <h2 className="hl-heading">Select your hospital</h2>
            <p className="hl-sub">Choose the hospital you manage to continue.</p>

            <div className="hl-search-wrap">
              <svg className="hl-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                className="hl-search"
                placeholder="Search hospital or city…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
            </div>

            {hospError && <div className="hl-error">{hospError}</div>}

            {loadingHosp ? (
              <div className="hl-loading">
                {[1, 2, 3].map(i => <div key={i} className="hl-skeleton" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="hl-empty">No hospitals found for "{search}"</div>
            ) : (
              <div className="hl-hosp-list">
                {filtered.map(h => (
                  <button key={h.id} className="hl-hosp-card" onClick={() => selectHospital(h)}>
                    <div className="hl-hosp-card__icon">
                      {(h.name || 'H')[0].toUpperCase()}
                    </div>
                    <div className="hl-hosp-card__info">
                      <span className="hl-hosp-card__name">{h.name}</span>
                      <span className="hl-hosp-card__city">
                        📍 {h.city || 'Location not set'}
                      </span>
                    </div>
                    <svg className="hl-hosp-card__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: Sign In ── */}
        {step === 2 && selectedHospital && (
          <div className="hl-login-step">
            {/* Selected hospital pill */}
            <button className="hl-selected-hospital" onClick={() => { setStep(1); setError(''); }}>
              <div className="hl-selected-hospital__icon">
                {selectedHospital.name[0].toUpperCase()}
              </div>
              <div>
                <p className="hl-selected-hospital__name">{selectedHospital.name}</p>
                <p className="hl-selected-hospital__city">{selectedHospital.city || ''}</p>
              </div>
              <span className="hl-selected-hospital__change">Change ↗</span>
            </button>

            <h2 className="hl-heading">Admin sign in</h2>
            <p className="hl-sub">Enter your staff credentials for this hospital.</p>

            <form className="hl-form" onSubmit={submit}>
              <label className="hl-field">
                <span className="hl-label">Email</span>
                <input
                  type="email"
                  placeholder="admin@hospital.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </label>

              <label className="hl-field">
                <span className="hl-label">Password</span>
                <div className="hl-pw-wrap">
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button type="button" className="hl-pw-toggle" onClick={() => setShowPw(v => !v)}>
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </div>
              </label>

              {error && (
                <div className="hl-error">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              <button className="hl-submit" type="submit" disabled={loading}>
                {loading ? (
                  <><span className="hl-spinner" /> Signing in…</>
                ) : (
                  <>Sign in to {selectedHospital.name}</>
                )}
              </button>
            </form>

            <p className="hl-hint">
              Each hospital has its own staff accounts.<br />
              Contact your hospital admin if you don't have access.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
