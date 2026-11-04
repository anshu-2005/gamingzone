/**
 * GamingZone Global Configuration & Integration Points
 * Environment variables:
 * - VITE_SITE_URL: Custom domain (e.g. https://mygamingzone.com)
 * - VITE_GA_MEASUREMENT_ID: Google Analytics 4 ID (e.g. G-XXXXXXXXXX)
 * - VITE_ADSENSE_CLIENT_ID: Google AdSense Publisher ID (e.g. ca-pub-XXXXXXXXXXXXXXXX)
 */
export const SITE_CONFIG = {
  name: 'GamingZone',
  title: 'GamingZone — Play 190+ Free Online Browser & 3D Games',
  tagline: 'Instant Play Free Browser Games • No Downloads • Safe & Fast',
  defaultDomain: 'https://game-ten-iota-67.vercel.app',
  get domain() {
    return (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SITE_URL) || this.defaultDomain;
  },
  get gaMeasurementId() {
    return (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GA_MEASUREMENT_ID) || '';
  },
  get adsenseClientId() {
    return (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ADSENSE_CLIENT_ID) || '';
  },
  contactEmail: 'anshuparihar848@gmail.com',
  dmcaEmail: 'anshuparihar848@gmail.com',
  author: 'Anshu Kumar (GamingZone)',
  github: 'https://github.com/anshu-2005'
};
