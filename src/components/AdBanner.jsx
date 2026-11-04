import React, { useEffect, useRef } from 'react';
import { SITE_CONFIG } from '../config/site.js';

/**
 * Standard IAB & AdSense Compliant Ad Container
 * - Does not show fake or misleading ads.
 * - Non-intrusive placement: never overlaps or interferes with game controls.
 * - Activates automatically when VITE_ADSENSE_CLIENT_ID is configured.
 */
export function AdBanner({
  slot = 'default',
  format = 'horizontal', // 'horizontal' (728x90 / responsive), 'rectangle' (300x250)
  className = '',
  style = {}
}) {
  const adRef = useRef(null);
  const adsenseClientId = SITE_CONFIG.adsenseClientId;

  useEffect(() => {
    // If real AdSense client ID is configured and script is available, push ad request
    if (adsenseClientId && window.adsbygoogle && adRef.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.warn('AdSense slot load skipped:', err);
      }
    }
  }, [adsenseClientId, slot]);

  const isRectangle = format === 'rectangle';

  return (
    <aside
      className={`gz-ad-placement ${className}`}
      aria-label="Advertisement Space"
      style={{
        margin: '20px auto',
        width: '100%',
        maxWidth: isRectangle ? '300px' : '970px',
        minHeight: isRectangle ? '250px' : '90px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
    >
      <div
        style={{
          fontSize: '10px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#64748b',
          marginBottom: '6px',
          fontWeight: 600,
          userSelect: 'none'
        }}
      >
        Advertisement
      </div>

      <div
        ref={adRef}
        style={{
          width: '100%',
          minHeight: isRectangle ? '250px' : '90px',
          background: 'rgba(15, 23, 42, 0.45)',
          border: '1px dashed rgba(255, 255, 255, 0.12)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '12px',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}
      >
        {adsenseClientId ? (
          <ins
            className="adsbygoogle"
            style={{ display: 'block', width: '100%', height: '100%' }}
            data-ad-client={adsenseClientId}
            data-ad-slot={slot}
            data-ad-format={isRectangle ? 'rectangle' : 'auto'}
            data-full-width-responsive="true"
          />
        ) : (
          <div style={{ color: '#475569', fontSize: '0.8rem', userSelect: 'none' }}>
            <span style={{ display: 'block', fontWeight: 600, color: '#64748b', marginBottom: '2px' }}>
              Reserved Ad Placement
            </span>
            <span style={{ fontSize: '0.72rem', color: '#475569' }}>
              Google AdSense monetization slot (Safe, non-intrusive placement)
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
