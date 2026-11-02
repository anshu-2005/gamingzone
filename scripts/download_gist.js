const fs = await import('fs');
try {
  const res = await fetch('https://gist.githubusercontent.com/roachhd/d579b58148d7e36a6b72/raw');
  const text = await res.text();
  fs.writeFileSync('gist_full.md', text, 'utf8');
  console.log('Successfully saved gist_full.md! Length:', text.length);
} catch (err) {
  console.error('Fetch error:', err);
}
