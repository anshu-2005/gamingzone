import React, { useState, useEffect } from 'react';

export function CookieConsent({ onOpenPrivacy }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('gz_cookie_consent');
      if (!consent) {
        setShow(true);
      }
    } catch (e) {
      setShow(false);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem('gz_cookie_consent', 'accepted');
    } catch (e) {}
    setShow(false);
  };

  const handleDecline = () => {
    try {
      localStorage.setItem('gz_cookie_consent', 'necessary_only');
    } catch (e) {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99998,
        width: 'calc(100% - 32px)',
        maxWidth: '780px',
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        borderRadius: '16px',
        padding: '16px 22px',
        boxShadow: '0 20px 45px rgba(0, 0, 0, 0.8), 0 0 20px rgba(56, 189, 248, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        color: '#f8fafc',
        fontFamily: "'Outfit', -apple-system, sans-serif"
      }}
    >
      <div style={{ flex: '1 1 360px', fontSize: '0.86rem', lineHeight: 1.5, color: '#cbd5e1' }}>
        🍪 <strong>Cookie &amp; Privacy Notice:</strong> GAMINGZONE uses essential cookies, local storage, and partner cookies (including Google AdSense and Analytics) to optimize gameplay, personalize advertising, and analyze traffic in compliance with GDPR &amp; CCPA.{' '}
        <button
          type="button"
          onClick={onOpenPrivacy}
          style={{ background: 'none', border: 'none', color: '#38bdf8', textDecoration: 'underline', cursor: 'pointer', padding: 0, font: 'inherit' }}
        >
          Read Privacy Policy
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={handleDecline}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#94a3b8',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Essential Only
        </button>
        <button
          type="button"
          onClick={handleAccept}
          style={{
            background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
            border: 'none',
            color: '#ffffff',
            padding: '8px 20px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)'
          }}
        >
          Accept All Cookies
        </button>
      </div>
    </div>
  );
}
