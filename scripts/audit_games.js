import fs from 'fs';
import path from 'path';

const files = fs.readdirSync('js/games').filter(f => f.endsWith('.js'));
const report = [];

for (const f of files) {
  const content = fs.readFileSync(path.join('js/games', f), 'utf-8');
  const lines = content.split('\n').length;
  const isSubclass = content.includes('extends ') && lines < 30;
  const hasCanvas = content.includes('<canvas') || content.includes('createElement("canvas")') || content.includes("createElement('canvas')");
  const hasTouch = content.includes('touchstart') || content.includes('touchmove') || content.includes('pointerdown');
  const hasKeyboard = content.includes('keydown') || content.includes('keyup');
  const hasOnGameOver = content.includes('onGameOver');

  report.push({
    file: f,
    lines,
    isSubclass: isSubclass ? content.match(/extends\s+(\w+)/)?.[1] : false,
    hasCanvas,
    hasTouch,
    hasKeyboard,
    hasOnGameOver
  });
}

console.log('Short wrapper files:');
console.log(report.filter(r => r.isSubclass));

console.log('\nSmallest 15 files by line count:');
console.log(report.sort((a,b) => a.lines - b.lines).slice(0, 15));

console.log('\nFiles missing touch support:');
console.log(report.filter(r => !r.hasTouch).map(r => r.file));

console.log('\nFiles missing keyboard support:');
console.log(report.filter(r => !r.hasKeyboard).map(r => r.file));

