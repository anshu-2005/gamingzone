async function verify() {
  const [gamesRes, hextrisStatus, clumsyStatus, adrStatus] = await Promise.all([
    fetch('https://game-ten-iota-67.vercel.app/api/games').then(r => r.json()),
    fetch('https://game-ten-iota-67.vercel.app/hextris/index.html').then(r => r.status),
    fetch('https://game-ten-iota-67.vercel.app/clumsy-bird/index.html').then(r => r.status),
    fetch('https://game-ten-iota-67.vercel.app/adarkroom/index.html').then(r => r.status)
  ]);

  console.log('Hextris HTTP Status:', hextrisStatus);
  console.log('Clumsy Bird HTTP Status:', clumsyStatus);
  console.log('A Dark Room HTTP Status:', adrStatus);

  const games = gamesRes.games || gamesRes.data || gamesRes;
  console.log('Total games on live portal:', games.length);
  console.log('Top 5 games on live website:');
  games.slice(0, 5).forEach((g, i) => {
    console.log(`  #${i + 1}: ${g.title} (slug: ${g.slug}) [${g.bundle_url || g.external_url}]`);
  });
}

verify().catch(console.error);

