import { useState } from 'react';
import './FloatingAIButton.css';

export default function FloatingAIButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="ai-float">
      {open && (
        <div className="ai-float__panel fade-in-up">
          <div className="ai-float__header">
            <span className="ai-float__header-dot" />
            <span>MediChain Assistant</span>
            <button className="ai-float__close" onClick={() => setOpen(false)} aria-label="Close assistant">✕</button>
          </div>
          <div className="ai-float__body">
            <p className="ai-float__message">
              Hi Ananya 👋 I can help you find a doctor, check appointment status, or answer
              general health queries. This assistant is a placeholder — wire it up to a real
              endpoint whenever it's ready.
            </p>
          </div>
          <div className="ai-float__input-row">
            <input type="text" placeholder="Ask something..." disabled />
            <button className="btn btn-primary ai-float__send" disabled>Send</button>
          </div>
        </div>
      )}

      <button className="ai-float__trigger" onClick={() => setOpen((v) => !v)} aria-label="Open AI assistant">
        {open ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 2a7 7 0 0 0-7 7v3a7 7 0 0 0 14 0V9a7 7 0 0 0-7-7z" />
            <circle cx="9" cy="10" r="1" fill="currentColor" /><circle cx="15" cy="10" r="1" fill="currentColor" />
            <path d="M9 21h6" />
          </svg>
        )}
      </button>
    </div>
  );
}