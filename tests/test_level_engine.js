import { LevelTestRunner } from '../js/core/levelEngine/index.js';

console.log('====================================================');
console.log('🧪 GAMINGZONE LEVEL ENGINE AUTOMATED QA GATE');
console.log('====================================================');

const runner = new LevelTestRunner();
const summary = runner.runAll();

let hasFailures = false;

for (const [key, report] of Object.entries(summary.results)) {
  const icon = report.status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} [${report.status}] ${key}:`);
  console.log(`   • Total Levels Tested: ${report.totalLevelsTested} (${report.levelsPerSeed} per seed x ${report.seedsTested} seeds)`);
  console.log(`   • Consecutive Duplicates: ${report.consecutiveDuplicates}`);
  console.log(`   • Rolling History Collisions: ${report.historyDuplicates}`);
  console.log(`   • Physical Validation Failures: ${report.validationFailures}`);
  console.log(`   • Difficulty Regressions: ${report.difficultyRegressions}`);

  if (report.status !== 'PASS') {
    hasFailures = true;
    console.log(`   • Errors:`);
    report.errors.slice(0, 5).forEach(e => console.log(`     - ${e}`));
  }
}

console.log('====================================================');
if (summary.allPassed && !hasFailures) {
  console.log('🏆 LEVEL ENGINE QA SUMMARY: ALL ADAPTERS PASSED');
  console.log('====================================================');
  process.exit(0);
} else {
  console.error('❌ LEVEL ENGINE QA SUMMARY: ONE OR MORE ADAPTERS FAILED');
  console.log('====================================================');
  process.exit(1);
}

