import { useNavigate } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { 
  ShieldAlert, 
  Users, 
  Activity, 
  Calendar, 
  ArrowRight, 
  ShieldCheck, 
  HeartPulse, 
  Truck, 
  Clock 
} from 'lucide-react';
import './Cover.css';

export default function Cover() {
  const navigate = useNavigate();

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: 'easeOut' }
    }
  };

  return (
    <div className="cover-container">
      {/* Glow elements */}
      <div className="ambient-glow-1"></div>
      <div className="ambient-glow-2"></div>

      {/* Header */}
      <header className="cover-header">
        <div className="header-brand">
          <div className="brand-icon-wrapper">
            <HeartPulse size={22} />
          </div>
          <span className="brand-title">
            MediChain <span className="brand-badge">v1.0</span>
          </span>
        </div>
        <div className="header-nav">
          <div className="status-indicator">
            <span className="status-dot"></span>
            <span>Live Network Active</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="cover-hero">
        <motion.div 
          className="hero-content"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div className="hero-pill" variants={itemVariants}>
            <span>✦ Smart Hospital & Patient Network</span>
          </motion.div>
          
          <motion.h1 className="hero-title" variants={itemVariants}>
            Unified Platform for <span>Real-Time</span> Healthcare
          </motion.h1>
          
          <motion.p className="hero-description" variants={itemVariants}>
            MediChain bridges the gap between patients and hospital operations. Track live ICU/General bed availability, manage emergency transfer requests, and book appointments instantly on a secure, WebSocket-powered platform.
          </motion.p>
          
          <motion.div className="hero-ctas" variants={itemVariants}>
            <button 
              className="cta-button cta-button-patient" 
              onClick={() => navigate('/login')}
            >
              <Users size={20} />
              Access Patient Portal
              <ArrowRight size={16} />
            </button>
            <button 
              className="cta-button cta-button-hospital" 
              onClick={() => navigate('/hospital-login')}
            >
              <ShieldAlert size={20} />
              Hospital Workspace
            </button>
            <button
              className="cta-button cta-button-superadmin"
              onClick={() => navigate('/hospital-login')}
            >
              <ShieldCheck size={20} />
              Super Admin
            </button>
          </motion.div>
        </motion.div>

        {/* Hero Visual Mockup */}
        <motion.div 
          className="hero-visual"
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.3 }}
        >
          <div className="mockup-container">
            <div className="mockup-header">
              <div className="mockup-dot-group">
                <span className="mockup-dot"></span>
                <span className="mockup-dot"></span>
                <span className="mockup-dot"></span>
              </div>
              <span className="mockup-title">MEDICHAIN_CORE_SERVICE</span>
            </div>

            {/* Widget 1: Live Bed Tracking */}
            <div className="mockup-widget">
              <div className="mockup-widget-title">
                <span>City General Hospital</span>
                <span className="mockup-widget-tag">Live Bed Feed</span>
              </div>
              <div className="mockup-beds-grid">
                <div className="mockup-bed-item">
                  <span className="bed-label">ICU Beds</span>
                  <span className="bed-value">
                    <span className="bed-pulse"></span>
                    04 <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.8rem', fontWeight: 500 }}>/ 10</span>
                  </span>
                </div>
                <div className="mockup-bed-item">
                  <span className="bed-label">Oxygen Beds</span>
                  <span className="bed-value">
                    <span className="bed-pulse"></span>
                    12 <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.8rem', fontWeight: 500 }}>/ 15</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Widget 2: Live Transfer Handshake */}
            <div className="mockup-transfer-card">
              <div className="transfer-header">
                <span>EMERGENCY_TRANSFER_REQUEST</span>
                <Clock size={12} />
              </div>
              <div className="transfer-route">
                <div className="route-point">
                  <span className="point-name">Metro Hospital</span>
                  <span className="point-city">Source</span>
                </div>
                <ArrowRight className="route-arrow" size={16} />
                <div className="route-point" style={{ textAlign: 'right' }}>
                  <span className="point-name">City General</span>
                  <span className="point-city">Target</span>
                </div>
              </div>
              <div className="transfer-status">
                <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Patient: John Doe (Cardiology)</span>
                <span className="transfer-badge">Pending Approval</span>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Highlights / Features Grid */}
      <section className="cover-features">
        <div className="section-intro">
          <span className="intro-tag">Platform Capabilities</span>
          <h2 className="intro-title">Engineered for Rapid Response & Clinical Efficiency</h2>
          <p className="intro-description">Our suite of interconnected modules ensures that patients receive the care they need, when they need it, with absolute transparency.</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Activity size={24} />
            </div>
            <h3 className="feature-card-title">Live Bed Management</h3>
            <p className="feature-card-desc">Hospitals can dynamically update ICU, general, oxygen, and emergency bed counts. Patients see real-time bed numbers instantly.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Truck size={24} />
            </div>
            <h3 className="feature-card-title">Emergency Transfers</h3>
            <p className="feature-card-desc">Enables seamless hospital-to-hospital emergency patient transfers with instant real-time responses powered by secure WebSockets.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Calendar size={24} />
            </div>
            <h3 className="feature-card-title">Instant Appointments</h3>
            <p className="feature-card-desc">Patients can search nearby hospitals, check real-time doctor rosters, book appointments, and track confirmation status instantly.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <ShieldCheck size={24} />
            </div>
            <h3 className="feature-card-title">Unified Patient Records</h3>
            <p className="feature-card-desc">A centralized, high-fidelity profile with a chronologically ordered medical history, medication reminders, and secure allergy logs.</p>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="cover-stats-banner">
        <div className="stats-banner-container">
          <div className="stat-item">
            <span className="stat-number">100%</span>
            <span className="stat-label">Real-time Connection</span>
            <span className="stat-desc">Native WebSockets feed bed changes and transfers without delays.</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">Zero</span>
            <span className="stat-label">Data Congestion</span>
            <span className="stat-desc">Optimized FastAPI & MongoDB queries ensure instant response.</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">Secure</span>
            <span className="stat-label">Data Vault</span>
            <span className="stat-desc">Role-based data layers protecting medical histories.</span>
          </div>
        </div>
      </section>

      {/* How it Works / Flow */}
      <section className="cover-flow">
        <div className="section-intro">
          <span className="intro-tag">How It Works</span>
          <h2 className="intro-title">Unified Flow, Seamless Connection</h2>
        </div>

        <div className="flow-timeline">
          <div className="flow-step">
            <div className="flow-step-num">1</div>
            <div className="flow-step-content">
              <h3 className="flow-step-title">Patient Check & Booking</h3>
              <p className="flow-step-desc">Patients register securely, view near-by hospitals with verified live bed availability, and book general/specialty appointments.</p>
            </div>
          </div>

          <div className="flow-step">
            <div className="flow-step-num">2</div>
            <div className="flow-step-content">
              <h3 className="flow-step-title">Hospital Intake & Operations</h3>
              <p className="flow-step-desc">Hospital administrators manage their incoming appointments, live patient rosters, and bed counts from a private hospital dashboard.</p>
            </div>
          </div>

          <div className="flow-step">
            <div className="flow-step-num">3</div>
            <div className="flow-step-content">
              <h3 className="flow-step-title">Automated Emergency Transfers</h3>
              <p className="flow-step-desc">If an emergency escalates, hospitals use the native transfer system to send secure, immediate requests to nearby facilities, which instantly alerts target staff via sound and toast alerts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="cover-footer">
        <div className="footer-content">
          <div className="footer-top">
            <div className="footer-logo">
              <div className="footer-logo-icon">
                <HeartPulse size={12} />
              </div>
              <span>MediChain Platform</span>
            </div>
            
            <div className="footer-credits">
              <div className="credit-member">
                <span className="member-name">Suraj Sharma</span>
                <span className="member-role">Bed & Shared Backend</span>
              </div>
              <div className="credit-member">
                <span className="member-name">Satyam Jaiswal</span>
                <span className="member-role">Transfer System & Hospital UI</span>
              </div>
              <div className="credit-member">
                <span className="member-name">Sajal Vaish</span>
                <span className="member-role">Patient Portal & Directory</span>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <span>&copy; {new Date().getFullYear()} MediChain. All rights reserved.</span>
            <span className="footer-tech-pill">FastAPI • React • MongoDB • WebSockets</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
