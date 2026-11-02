import fs from 'fs';
import readline from 'readline';

const fileStream = fs.createReadStream('C:/Users/Vikas/.gemini/antigravity/brain/9bf2b036-36eb-4b77-ba7f-6e936e2b6ed9/.system_generated/logs/transcript_full.jsonl');
const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

rl.on('line', (line) => {
  if (line.includes('"step_index":5730') || line.includes('"step_index": 5730')) {
    const data = JSON.parse(line);
    console.log(JSON.stringify(data.tool_calls, null, 2));
  }
});

