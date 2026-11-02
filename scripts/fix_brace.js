import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const adrEnginePath = path.join(rootDir, 'public', 'adarkroom', 'script', 'engine.js');
let adrEngine = fs.readFileSync(adrEnginePath, 'utf8');

adrEngine = adrEngine.replace(
  /width:\s*'420px'\s*\}\);\s*\},[\r\n\s]*\},/m,
  "width: '420px'\n      });\n    },"
);

fs.writeFileSync(adrEnginePath, adrEngine, 'utf8');
console.log('✅ Cleaned up brace');

