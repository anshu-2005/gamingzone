import fs from 'fs';
import readline from 'readline';

const fileStream = fs.createReadStream('C:/Users/Vikas/.gemini/antigravity/brain/9bf2b036-36eb-4b77-ba7f-6e936e2b6ed9/.system_generated/logs/transcript_full.jsonl');
const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

rl.on('line', (line) => {
  if (line.includes('"step_index":5731') || line.includes('"step_index": 5731')) {
    try {
      const data = JSON.parse(line);
      fs.writeFileSync('gist_content.txt', data.content);
      console.log('Saved gist_content.txt! Length:', data.content.length);
    } catch (e) {
      console.error(e);
    }
  }
});
