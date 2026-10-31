/* ====================================================
   GAMINGZONE — PREVIEW VIDEO ASSET MANIFEST
   Catalog of gameplay video previews, cover posters,
   availability status, and licensing sources.
   ==================================================== */

export const PREVIEW_MANIFEST = {
  // 1. Featured Spotlight Games (Verified Working Video Previews)
  'game_cricket_premier_league': {
    gameId: 'game_cricket_premier_league',
    slug: 'cricket-premier-league-3d',
    title: 'Cricket Premier League 3D',
    hasPreview: true,
    previewVideo: '/uploads/previews/cricket-premier-league.webm',
    previewPoster: null,
    source: 'GAMINGZONE Original Gameplay Recording',
    format: 'video/webm'
  },
  'game_cyber_car_drift': {
    gameId: 'game_cyber_car_drift',
    slug: 'cyber-car-drift-circuit',
    title: 'Cyber Car Drift',
    hasPreview: true,
    previewVideo: '/uploads/previews/cyber-car-drift.webm',
    previewPoster: null,
    source: 'GAMINGZONE Original Gameplay Recording',
    format: 'video/webm'
  },
  'game_subway_skater_rush': {
    gameId: 'game_subway_skater_rush',
    slug: 'subway-skater-rush-3d',
    title: 'Subway Skater Rush 3D',
    hasPreview: true,
    previewVideo: '/uploads/previews/subway-skater-rush.webm',
    previewPoster: null,
    source: 'GAMINGZONE Original Gameplay Recording',
    format: 'video/webm'
  }
};

/**
 * Returns preview metadata for a given game ID or slug.
 * If no video preview exists, returns hasPreview: false with clean fallback.
 */
export function getGamePreviewMeta(game) {
  if (!game) return { hasPreview: false, previewVideo: null };

  const id = game.id;
  const slug = game.slug;

  if (PREVIEW_MANIFEST[id]) {
    return PREVIEW_MANIFEST[id];
  }

  // Check by slug
  for (const key in PREVIEW_MANIFEST) {
    if (PREVIEW_MANIFEST[key].slug === slug) {
      return PREVIEW_MANIFEST[key];
    }
  }

  // Check if explicit preview_video or previewVideo is on game object
  const explicitVideo = game.previewVideo || game.preview_video;
  if (explicitVideo) {
    return {
      gameId: id,
      slug: slug,
      title: game.title,
      hasPreview: true,
      previewVideo: explicitVideo,
      previewPoster: game.previewPoster || game.preview_poster || null,
      source: 'Custom Game Upload',
      format: explicitVideo.endsWith('.mp4') ? 'video/mp4' : 'video/webm'
    };
  }

  // Default: marked as missing (do not fabricate)
  return {
    gameId: id,
    slug: slug,
    title: game.title,
    hasPreview: false,
    previewVideo: null,
    previewPoster: null,
    source: 'Asset Pending Capture',
    format: null
  };
}

