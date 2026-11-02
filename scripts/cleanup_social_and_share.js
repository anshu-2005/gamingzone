import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Remove Google Analytics from Hextris index.html
const hextrisIndexPath = path.join(rootDir, 'public', 'hextris', 'index.html');
let hIndex = fs.readFileSync(hextrisIndexPath, 'utf8');
hIndex = hIndex.replace(/<script>\s*\(function\(i,s,o,g,r,a,m\)[\s\S]*?<\/script>/, '');
fs.writeFileSync(hextrisIndexPath, hIndex, 'utf8');
console.log('✅ Removed Google Analytics from Hextris');

// 2. Remove 'get the app' and customize share dialog in A Dark Room
const adrEnginePath = path.join(rootDir, 'public', 'adarkroom', 'script', 'engine.js');
let adrEngine = fs.readFileSync(adrEnginePath, 'utf8');

// Remove get the app menu button
adrEngine = adrEngine.replace(
  /\$\('<span>'\)\s*\.addClass\('appStore menuBtn'\)\s*\.text\(_\('get the app\.'\)\)\s*\.click\(Engine\.getApp\)\s*\.appendTo\(menu\);/,
  ''
);

// Replace share options with clean GAMINGZONE share dialog
const cleanShare = `share: function() {
      Events.startEvent({
        title: _('Share GAMINGZONE'),
        scenes: {
          start: {
            text: [_('Share this game with friends or check out developer portfolio.')],
            buttons: {
              'copy': {
                text: _('Copy Game Link'),
                nextScene: 'end',
                onChoose: function() {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.href);
                    Notifications.notify(Room, 'Link copied to clipboard!');
                  }
                }
              },
              'profile': {
                text: _('Developer GitHub'),
                nextScene: 'end',
                onChoose: function() {
                  window.open('https://github.com/anshu-2005', '_blank');
                }
              },
              'close': {
                text: _('close'),
                nextScene: 'end'
              }
            }
          }
        }
      },
      {
        width: '420px'
      });
    },`;

adrEngine = adrEngine.replace(/share:\s*function\(\)\s*\{[\s\S]*?width:\s*'400px'\s*\}\);/m, cleanShare);
fs.writeFileSync(adrEnginePath, adrEngine, 'utf8');
console.log('✅ Removed get the app & updated share in A Dark Room');
