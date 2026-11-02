import fs from 'fs';
import { execSync } from 'child_process';

const repos = JSON.parse(fs.readFileSync('arcade_repos.json', 'utf8'));

if (!fs.existsSync('scratch_arcade')) {
  fs.mkdirSync('scratch_arcade');
}

const results = [];

for (const repo of repos) {
  const slug = repo.url.split('/').pop().replace(/\.git$/, '').toLowerCase();
  
  // Skip ones already in public
  if (fs.existsSync(`public/${slug}`) || 
      slug === 'alieninvasion' || 
      slug === 'coil' || 
      slug === 'skifree.js' || 
      slug === 'starship-sorades-13k' || 
      slug === 'clumsy-bird') {
    results.push({ ...repo, slug, status: 'already_added' });
    continue;
  }

  const dest = `scratch_arcade/${slug}`;
  console.log(`\nTesting clone: ${repo.title} (${repo.url})...`);
  try {
    if (!fs.existsSync(dest)) {
      execSync(`git clone --depth 1 ${repo.url} ${dest}`, { stdio: 'pipe', timeout: 30000 });
    }
    
    // Check if it has an index.html
    const hasIndex = fs.existsSync(`${dest}/index.html`);
    const files = fs.readdirSync(dest);
    
    // Check if flash or pure html
    const isFlash = files.some(f => f.endsWith('.as') || f.endsWith('.fla')) && !hasIndex;
    
    results.push({
      ...repo,
      slug,
      status: 'cloned',
      hasIndex,
      isFlash,
      filesCount: files.length
    });
    console.log(`  -> Cloned! hasIndex: ${hasIndex}, isFlash: ${isFlash}`);
  } catch (err) {
    console.log(`  -> Failed: ${err.message.split('\n')[0]}`);
    results.push({ ...repo, slug, status: 'failed', error: err.message.split('\n')[0] });
  }
}

fs.writeFileSync('arcade_clone_report.json', JSON.stringify(results, null, 2));
console.log('\nFinished testing all arcade repos!');
