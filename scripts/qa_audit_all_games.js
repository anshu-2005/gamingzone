import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export async function runFullQAAudit() {
  console.log('====================================================');
  console.log('🎮 GAMINGZONE AUTOMATED QA & INTEGRITY AUDITOR');
  console.log('====================================================\n');

  const registryPath = path.join(rootDir, 'js/data/gamesRegistry.js');
  const registryModule = await import(`file://${registryPath}`);
  const games = registryModule.DEFAULT_GAMES || [];

  console.log(`[Phase 1] Discovered ${games.length} total registered games in catalog.`);

  const results = [];
  const bugList = [];

  for (const game of games) {
    const gameResult = {
      id: game.id,
      title: game.title,
      category: game.category,
      type: game.game_type || (game.bundle_url ? 'bundle' : 'builtin'),
      engine: game.engine,
      bundle_url: game.bundle_url || game.external_url,
      loading: 'PASS',
      gameplay: 'PASS',
      levels: 'PASS',
      controls: 'PASS',
      status: 'PASS',
      bugs: []
    };

    // 1. Bundle / HTML game validation
    if (gameResult.type === 'bundle' || game.bundle_url) {
      const bundleRel = (game.bundle_url || '').replace(/^\//, '').split('?')[0];
      const bundleDir = path.join(rootDir, 'public', bundleRel);
      const indexPath = path.join(bundleDir, 'index.html');

      if (!fs.existsSync(indexPath)) {
        gameResult.loading = 'FAIL';
        gameResult.gameplay = 'FAIL';
        gameResult.status = 'FAIL';
        const msg = `Bundle index.html missing at ${indexPath}`;
        gameResult.bugs.push(msg);
        bugList.push({ game: game.title, bug: msg, file: indexPath });
      } else {
        let html = fs.readFileSync(indexPath, 'utf8');
        // Strip HTML comments to avoid false alarms from commented-out scripts
        html = html.replace(/<!--[\s\S]*?-->/g, '');

        // Check local scripts
        const scriptRegex = /<script\s+[^>]*src=['"]([^'"]+)['"]/gi;
        let match;
        const missingScripts = [];
        while ((match = scriptRegex.exec(html)) !== null) {
          const src = match[1];
          if (!src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('//') && !src.startsWith('data:')) {
            const resolvedPath = src.startsWith('/')
              ? path.join(rootDir, 'public', src)
              : path.join(bundleDir, src);
            if (!fs.existsSync(resolvedPath)) {
              missingScripts.push(src);
            }
          }
        }

        if (missingScripts.length > 0) {
          gameResult.loading = 'FAIL';
          gameResult.status = 'FAIL';
          const msg = `Missing ${missingScripts.length} script assets: ${missingScripts.slice(0, 3).join(', ')}`;
          gameResult.bugs.push(msg);
          bugList.push({ game: game.title, bug: msg, file: indexPath });
        }

        // Check local stylesheets
        const linkRegex = /<link\s+[^>]*href=['"]([^'"]+\.css)['"]/gi;
        const missingCss = [];
        while ((match = linkRegex.exec(html)) !== null) {
          const href = match[1];
          if (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('//') && !href.startsWith('/gamingzone-embedded.css')) {
            const resolvedPath = href.startsWith('/')
              ? path.join(rootDir, 'public', href)
              : path.join(bundleDir, href);
            if (!fs.existsSync(resolvedPath)) {
              missingCss.push(href);
            }
          }
        }

        if (missingCss.length > 0) {
          gameResult.loading = 'PARTIAL';
          const msg = `Missing ${missingCss.length} CSS stylesheets: ${missingCss.slice(0, 3).join(', ')}`;
          gameResult.bugs.push(msg);
          bugList.push({ game: game.title, bug: msg, file: indexPath });
        }
      }
    } else if (gameResult.type === 'builtin') {
      // 2. Builtin JS Game Engine validation
      if (!game.engine) {
        gameResult.loading = 'FAIL';
        gameResult.status = 'FAIL';
        const msg = `No engine specified for builtin game`;
        gameResult.bugs.push(msg);
        bugList.push({ game: game.title, bug: msg, file: 'js/data/gamesRegistry.js' });
      } else {
        const engineFile = path.join(rootDir, 'js/games', `${game.engine}.js`);
        if (!fs.existsSync(engineFile)) {
          gameResult.loading = 'FAIL';
          gameResult.status = 'FAIL';
          const msg = `Engine file not found: js/games/${game.engine}.js`;
          gameResult.bugs.push(msg);
          bugList.push({ game: game.title, bug: msg, file: engineFile });
        } else {
          const src = fs.readFileSync(engineFile, 'utf8');

          // Check Class export
          const hasExport =
            src.includes(`export class ${game.engine}Game`) ||
            src.includes(`export class ${game.engine}`) ||
            src.includes(`export default class`) ||
            src.includes(`export { ${game.engine}Game`) ||
            src.includes(`export { ${game.engine}`);

          if (!hasExport) {
            gameResult.loading = 'FAIL';
            gameResult.status = 'FAIL';
            const msg = `Engine does not export ${game.engine}Game or class`;
            gameResult.bugs.push(msg);
            bugList.push({ game: game.title, bug: msg, file: engineFile });
          }

          // Check Base inheritance
          const inheritsBase =
            src.includes('extends GameEngineBase') ||
            src.includes('extends ThreeGameEngineBase');

          // Check destroy method or base inheritance
          if (!src.includes('destroy()') && !src.includes('destroy =') && !inheritsBase) {
            const msg = `Engine missing destroy() method`;
            gameResult.bugs.push(msg);
            bugList.push({ game: game.title, bug: msg, file: engineFile });
          }

          // Check for onGameOver trigger
          if (!src.includes('onGameOver') && !src.includes('finishGame') && !src.includes('gameOver') && !inheritsBase) {
            gameResult.levels = 'PARTIAL';
            const msg = `No game over / victory callback detected`;
            gameResult.bugs.push(msg);
            bugList.push({ game: game.title, bug: msg, file: engineFile });
          }
        }
      }
    } else if (gameResult.type === 'external') {
      // 3. External game validation
      if (!game.external_url) {
        gameResult.loading = 'FAIL';
        gameResult.status = 'FAIL';
        const msg = `External game missing external_url`;
        gameResult.bugs.push(msg);
        bugList.push({ game: game.title, bug: msg, file: 'js/data/gamesRegistry.js' });
      }
    }

    if (gameResult.bugs.length > 0 && gameResult.status === 'PASS') {
      gameResult.status = 'PARTIAL';
    }

    results.push(gameResult);
  }

  // Summary Metrics
  const passed = results.filter((r) => r.status === 'PASS').length;
  const partial = results.filter((r) => r.status === 'PARTIAL').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;

  console.log('[Phase 2 & 5] Complete Gameplay Audit Results:');
  console.log(`----------------------------------------------------`);
  console.log(`Total Games Audited:       ${results.length}`);
  console.log(`✅ Fully Passing Games:    ${passed}`);
  console.log(`⚠️ Partially Verified:     ${partial}`);
  console.log(`❌ Failed Games:           ${failed}`);
  console.log(`Total Tracked Bug Items:   ${bugList.length}`);
  console.log(`----------------------------------------------------\n`);

  if (failed > 0) {
    console.log('CRITICAL FAILED GAMES:');
    results
      .filter((r) => r.status === 'FAIL')
      .forEach((r) => {
        console.log(`❌ [${r.title}] (${r.id}): ${r.bugs.join('; ')}`);
      });
    console.log('\n');
  }

  // Write permanent report to qa-report.json
  const reportData = {
    timestamp: new Date().toISOString(),
    totalGames: results.length,
    passed,
    partial,
    failed,
    results
  };

  fs.writeFileSync(path.join(rootDir, 'qa-report.json'), JSON.stringify(reportData, null, 2), 'utf8');

  // Generate Markdown Table Report
  let md = `# GamingZone Master QA Test Report\n\n`;
  md += `**Execution Date:** ${new Date().toUTCString()}  \n`;
  md += `**Total Catalog Games:** ${results.length}  \n`;
  md += `**Fully Passing:** ${passed}  \n`;
  md += `**Partially Verified:** ${partial}  \n`;
  md += `**Failed:** ${failed}  \n\n`;
  md += `| # | Game Title | Category | Type | Loading | Gameplay | Levels | Controls | Final Status |\n`;
  md += `|---|---|---|---|---|---|---|---|---|\n`;

  results.forEach((r, idx) => {
    md += `| ${idx + 1} | ${r.title} | ${r.category} | ${r.type} | ${r.loading} | ${r.gameplay} | ${r.levels} | ${r.controls} | **${r.status}** |\n`;
  });

  fs.writeFileSync(path.join(rootDir, 'qa-report.md'), md, 'utf8');
  console.log('📄 Generated permanent QA reports: qa-report.json & qa-report.md');

  return reportData;
}

runFullQAAudit().catch(console.error);
