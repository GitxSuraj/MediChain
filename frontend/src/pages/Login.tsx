import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
  const { login, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    clearError();
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch {
      // error already surfaced via context
    }
  }

  return (
    <div className="login">
      <div className="login__ambient login__ambient--1" />
      <div className="login__ambient login__ambient--2" />

      <div className="login__panel glass-panel fade-in-up">
        <div className="login__brand">
          <div className="login__brand-mark">M</div>
          <div>
            <h1 className="login__brand-name">MediChain</h1>
            <p className="login__brand-tag mono">PATIENT PORTAL</p>
          </div>
        </div>

        <h2 className="login__heading">Welcome back</h2>
        <p className="login__subheading">Sign in to manage your appointments and health records.</p>

        <form className="login__form" onSubmit={handleSubmit}>
          <label className="login__field">
            <span className="login__label">Email address</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </label>

          <label className="login__field">
            <span className="login__label">Password</span>
            <div className="login__password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login__toggle-visibility"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          {error && <div className="login__error fade-in-up">{error}</div>}

          <button type="submit" className="btn btn-primary login__submit" disabled={isLoading}>
            {isLoading ? <span className="spinner" /> : 'Sign In'}
          </button>

          <p className="login__hint">
            Demo credentials — any email, password of 4+ characters.
          </p>
        </form>
      </div>
    </div>
  );
}