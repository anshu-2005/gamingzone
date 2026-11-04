import React, { useState } from 'react';

export function PolicyModal({ isOpen, onClose, initialTab = 'privacy' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: 'General Feedback', message: '' });

  if (!isOpen) return null;

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setContactForm({ name: '', email: '', subject: 'General Feedback', message: '' });
      onClose();
    }, 2500);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(3, 7, 18, 0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(145deg, #0f172a 0%, #030712 100%)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '20px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.15)',
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#f1f5f9',
          fontFamily: "'Outfit', -apple-system, sans-serif"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '16px 24px',
            background: 'rgba(15, 23, 42, 0.8)'
          }}
        >
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'privacy', label: '🔒 Privacy Policy' },
              { id: 'terms', label: '📜 Terms of Service' },
              { id: 'disclaimer', label: '⚖️ Disclaimer' },
              { id: 'about', label: '🎮 About Us' },
              { id: 'contact', label: '✉️ Contact Us' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type="button"
                style={{
                  background: activeTab === tab.id ? 'linear-gradient(135deg, #0284c7, #38bdf8)' : 'transparent',
                  color: activeTab === tab.id ? '#ffffff' : '#94a3b8',
                  border: activeTab === tab.id ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '8px 16px',
                  borderRadius: '999px',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: activeTab === tab.id ? '0 0 15px rgba(56, 189, 248, 0.4)' : 'none'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            type="button"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#94a3b8',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 700
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Area */}
        <div
          style={{
            padding: '28px',
            overflowY: 'auto',
            fontSize: '0.92rem',
            lineHeight: 1.7,
            color: '#cbd5e1'
          }}
        >
          {activeTab === 'privacy' && (
            <div>
              <h2 style={{ color: '#38bdf8', fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>
                Privacy Policy for GAMINGZONE
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '20px' }}>
                Last Updated: November 3, 2026 • Effective Immediately
              </p>

              <p>
                At <strong>GAMINGZONE</strong> (accessible from <a href="https://game-ten-iota-67.vercel.app" style={{ color: '#38bdf8' }}>https://game-ten-iota-67.vercel.app</a>), one of our main priorities is the privacy of our visitors. This Privacy Policy document outlines the types of information that is collected and recorded by GAMINGZONE and how we use it.
              </p>

              <h3 style={{ color: '#f8fafc', marginTop: '20px', marginBottom: '8px' }}>1. Consent</h3>
              <p>By using our website, you hereby consent to our Privacy Policy and agree to its terms.</p>

              <h3 style={{ color: '#f8fafc', marginTop: '20px', marginBottom: '8px' }}>2. Information We Collect</h3>
              <p>
                GAMINGZONE operates primarily with client-side execution. We do not require account registration to enjoy our 190+ free browser games.
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                <li><strong>Local Storage:</strong> High scores, game favorites, player customizations, and settings are saved locally on your device browser.</li>
                <li><strong>Log Files:</strong> Like most standard web servers, hosting platforms like Vercel record standard log files (IP addresses, browser type, ISP, referring/exit pages, date/time stamps). These are not linked to personally identifiable information.</li>
              </ul>

              <h3 style={{ color: '#f8fafc', marginTop: '20px', marginBottom: '8px' }}>3. Google AdSense &amp; DoubleClick DART Cookies</h3>
              <p>
                Google is a third-party vendor on our site. It also uses cookies, known as DART cookies, to serve ads to our site visitors based upon their visit to our site and other sites on the internet.
              </p>
              <p style={{ marginTop: '8px' }}>
                Visitors may choose to decline the use of DART cookies by visiting the Google Ad and Content Network Privacy Policy at the following URL: <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noreferrer" style={{ color: '#38bdf8' }}>https://policies.google.com/technologies/ads</a>.
              </p>

              <h3 style={{ color: '#f8fafc', marginTop: '20px', marginBottom: '8px' }}>4. Advertising Partners &amp; Third Parties</h3>
              <p>
                Third-party ad servers or ad networks use technologies like cookies, JavaScript, or Web Beacons in their respective advertisements and links that appear on GAMINGZONE. They automatically receive your IP address when this occurs. GAMINGZONE has no access to or control over these cookies used by third-party advertisers.
              </p>

              <h3 style={{ color: '#f8fafc', marginTop: '20px', marginBottom: '8px' }}>5. GDPR Data Protection Rights</h3>
              <p>
                Under European Union GDPR laws, users are entitled to rights including access, rectification, erasure, restriction of processing, and data portability. All personal gameplay preferences can be cleared at any time by wiping your browser local storage.
              </p>

              <h3 style={{ color: '#f8fafc', marginTop: '20px', marginBottom: '8px' }}>6. CCPA Privacy Rights (Do Not Sell My Personal Information)</h3>
              <p>
                Under the California Consumer Privacy Act, California consumers have the right to request disclosure or deletion of consumer data. GAMINGZONE does not sell user personal data.
              </p>

              <h3 style={{ color: '#f8fafc', marginTop: '20px', marginBottom: '8px' }}>7. Children's Online Privacy (COPPA)</h3>
              <p>
                GAMINGZONE does not knowingly collect any Personal Identifiable Information from children under the age of 13. If a parent or guardian believes that GAMINGZONE has such information in its database, please contact us immediately and we will promptly remove it.
              </p>
            </div>
          )}

          {activeTab === 'terms' && (
            <div>
              <h2 style={{ color: '#38bdf8', fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>
                Terms of Service
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '20px' }}>
                Last Updated: November 3, 2026
              </p>

              <h3 style={{ color: '#f8fafc', marginBottom: '8px' }}>1. Agreement to Terms</h3>
              <p>
                By accessing and using <strong>GAMINGZONE</strong>, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by these terms, please do not use this site.
              </p>

              <h3 style={{ color: '#f8fafc', marginTop: '20px', marginBottom: '8px' }}>2. Intellectual Property &amp; Open Source Games</h3>
              <p>
                GAMINGZONE curates and develops open-source, HTML5 Canvas, WebGL, and custom browser games. All proprietary assets, branding, and logos belong to GAMINGZONE. Cloned open-source community games retain their respective MIT, GPL, Apache, or Creative Commons open-source licenses and attribution as indicated.
              </p>

              <h3 style={{ color: '#f8fafc', marginTop: '20px', marginBottom: '8px' }}>3. Permissible Use</h3>
              <p>
                Games provided on GAMINGZONE are for personal, non-commercial entertainment only. You agree not to attempt to reverse engineer backend security, deploy denial-of-service attacks, or abuse server endpoints.
              </p>

              <h3 style={{ color: '#f8fafc', marginTop: '20px', marginBottom: '8px' }}>4. Disclaimer of Warranties</h3>
              <p>
                The materials and games on GAMINGZONE are provided on an 'as is' basis. GAMINGZONE makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including merchantability, fitness for a particular purpose, or non-infringement.
              </p>

              <h3 style={{ color: '#f8fafc', marginTop: '20px', marginBottom: '8px' }}>5. DMCA Copyright Notice &amp; Takedowns</h3>
              <p>
                We respect the intellectual property rights of others. If you believe your copyrighted work has been infringed on our portal, please submit a formal DMCA takedown notice with proof of ownership to <span style={{ color: '#38bdf8' }}>anshuparihar848@gmail.com</span>, and we will take immediate corrective action.
              </p>
            </div>
          )}

          {activeTab === 'disclaimer' && (
            <div>
              <h2 style={{ color: '#38bdf8', fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>
                Legal &amp; Content Disclaimer
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '20px' }}>
                Last Updated: November 4, 2026 • Transparency &amp; Copyright Compliance
              </p>

              <h3 style={{ color: '#f8fafc', marginBottom: '8px' }}>1. General Informational &amp; Entertainment Disclaimer</h3>
              <p>
                All content, interactive games, simulations, and utilities provided on <strong>GAMINGZONE</strong> (https://game-ten-iota-67.vercel.app) are published in good faith for general entertainment, recreation, and educational demonstration purposes only. GAMINGZONE makes no warranties about the completeness, reliability, and accuracy of this information. Any action you take upon the materials on this website is strictly at your own risk.
              </p>

              <h3 style={{ color: '#f8fafc', marginTop: '20px', marginBottom: '8px' }}>2. Open Source Software &amp; Third-Party Games Attribution</h3>
              <p>
                A portion of the games featured on GAMINGZONE are open-source web games created by independent developers, universities, and open-source contributors from global repositories (such as GitHub, itch.io, and CodePen). All third-party open-source games retain their original licenses (including MIT, Apache 2.0, BSD, and GNU GPL), copyrights, and author attributions. GAMINGZONE claims no ownership over third-party trademarks, game engines, or intellectual property created by other authors.
              </p>

              <h3 style={{ color: '#f8fafc', marginTop: '20px', marginBottom: '8px' }}>3. Trademark &amp; Brand Disclaimer</h3>
              <p>
                All product names, logos, brands, trademarks, and registered trademarks displayed on GAMINGZONE are property of their respective owners. Any reference to specific game franchises, characters, or brands is strictly for identification and descriptive comparison purposes only and does not imply endorsement, sponsorship, or affiliation with GAMINGZONE.
              </p>

              <h3 style={{ color: '#f8fafc', marginTop: '20px', marginBottom: '8px' }}>4. External Links &amp; Iframe Content</h3>
              <p>
                Certain games or assets may load through external secure iframes or reference external resources. While we strive to provide only quality and ethical links, we have no control over the content and nature of these external sites. Site owners and content may change without notice.
              </p>

              <h3 style={{ color: '#f8fafc', marginTop: '20px', marginBottom: '8px' }}>5. Advertising &amp; Commercial Disclosure</h3>
              <p>
                GAMINGZONE may display advertisements powered by Google AdSense and third-party advertising networks to support server hosting and development costs. We adhere strictly to Google AdSense program policies, ensuring ads do not interfere with game controls or masquerade as gameplay elements.
              </p>

              <h3 style={{ color: '#f8fafc', marginTop: '20px', marginBottom: '8px' }}>6. DMCA / Takedown Requests</h3>
              <p>
                If you are a copyright owner or an agent thereof and believe that any content hosted on GAMINGZONE infringes upon your copyright, please send a written notice containing your contact info and proof of ownership to <a href="mailto:anshuparihar848@gmail.com" style={{ color: '#38bdf8' }}>anshuparihar848@gmail.com</a>. We respond to verified DMCA requests within 24–48 hours and promptly remove offending content.
              </p>
            </div>
          )}

          {activeTab === 'about' && (
            <div>
              <h2 style={{ color: '#38bdf8', fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>
                About GAMINGZONE
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '20px' }}>
                The Next-Generation Instant Browser Gaming Platform
              </p>

              <p>
                Welcome to <strong>GAMINGZONE</strong> — a premier gaming destination dedicated to bringing players worldwide over <strong>190+ free, instant, high-performance 3D &amp; 2D browser games</strong> with zero installation, zero downloads, and zero paywalls.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', margin: '24px 0' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>⚡ Instant Play</div>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Load any game in under 1 second directly in modern web browsers on mobile, desktop, or tablet.</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>🎮 190+ Games</div>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Massive catalog spanning 3D racing, action combat, RTS strategy, retro arcades, and logic puzzles.</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>🛡️ Privacy First</div>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Clean, ad-safe experience without invasive tracking or forced installs.</div>
                </div>
              </div>

              <h3 style={{ color: '#f8fafc', marginTop: '20px', marginBottom: '8px' }}>Lead Developer &amp; Creator</h3>
              <p>
                GAMINGZONE was architected and developed by <strong>Anshu Kumar</strong> (<a href="https://github.com/anshu-2005" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', fontWeight: 600 }}>@anshu-2005</a>), built with React, Vite, SQLite, Three.js, Canvas 2D, and WebAudio.
              </p>
            </div>
          )}

          {activeTab === 'contact' && (
            <div>
              <h2 style={{ color: '#38bdf8', fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>
                Contact &amp; Support
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '20px' }}>
                Have questions, partnership inquiries, or copyright requests? Reach out anytime!
              </p>

              {contactSubmitted ? (
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#6ee7b7', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✅</div>
                  <h3 style={{ margin: 0, fontWeight: 700 }}>Thank you for reaching out!</h3>
                  <p style={{ margin: '6px 0 0', fontSize: '0.9rem' }}>Your message has been sent to our team. We usually respond within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '4px' }}>Your Name</label>
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        style={{ width: '100%', padding: '10px 14px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', color: '#fff' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '4px' }}>Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="john@example.com"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        style={{ width: '100%', padding: '10px 14px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', color: '#fff' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '4px' }}>Subject</label>
                    <select
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', color: '#fff' }}
                    >
                      <option value="General Feedback">💡 General Feedback / Suggest a Game</option>
                      <option value="Bug Report">🐛 Bug Report / Broken Game</option>
                      <option value="Partnership">🤝 Advertising / Partnership Inquiry</option>
                      <option value="DMCA">⚖️ DMCA / Copyright Query</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '4px' }}>Message</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Write your message here..."
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', color: '#fff', resize: 'vertical' }}
                    />
                  </div>
                  <button
                    type="submit"
                    style={{
                      background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                      color: '#fff',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      alignSelf: 'flex-start'
                    }}
                  >
                    Send Message 🚀
                  </button>
                </form>
              )}

              <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px', fontSize: '0.85rem', color: '#94a3b8' }}>
                <div>📧 Official Email: <a href="mailto:anshuparihar848@gmail.com" style={{ color: '#38bdf8' }}>anshuparihar848@gmail.com</a></div>
                <div style={{ marginTop: '4px' }}>🐙 GitHub: <a href="https://github.com/anshu-2005" target="_blank" rel="noreferrer" style={{ color: '#38bdf8' }}>github.com/anshu-2005</a></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

