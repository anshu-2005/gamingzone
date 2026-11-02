import fs from 'fs';

const text = `
[Flixel](https://github.com/AdamAtomic/flixel) - an open source game-making library written entirely in ActionScript 3.
[GenesisEngine](https://github.com/SaintGimp/GenesisEngine) - GenesisEngine allows you to create and explore procedurally-generated planetary systems, from ground level all the way out into space. Experiments with procedurally-generated worlds, XNA, and design patterns.
[Gladiator 3D](https://github.com/krotik/gladiator_3d) - Canvas based JavaScript ray casting engine for pseudo 3D games.
[MonoGame](https://github.com/mono/MonoGame) - XNA Implementation for Mono based platforms (supports iOS, Android, Linux, and started work on PS Suite and NaCli ).
[pixi.js](https://github.com/GoodBoyDigital/pixi.js) - Super fast HTML 5 2D rendering engine that uses webGL with canvas fallback.
[Plasma](https://github.com/H-uru/Plasma) - Cyan Worlds's Plasma game engine.
[Quasi-Engine](https://github.com/INdT/Quasi-Engine) - a QtQuick framework that intends to be a complete toolset to ease 2d game development
[Babylon.js](https://github.com/BabylonJS/Babylon.js) - a complete JavaScript framework for building 3D games with HTML 5 and WebGL.
[Chipmunk Physics](https://github.com/slembcke/Chipmunk-Physics) - a simple, lightweight, fast and portable 2D rigid body physics library written in C.
[cocos2d for iphone](https://github.com/cocos2d/cocos2d-iphone) - a framework for building 2D games, demos, and other graphical/interactive applications for iPod Touch, iPhone, iPad and Mac. It is based on the cocos2d design but instead of using python it, uses objective-c.
[cocos2d-x](https://github.com/cocos2d/cocos2d-x) - a multi-platform framework for building 2d games, interactive books, demos and other graphical applications. It is based on cocos2d-iphone, but instead of using Objective-C, it uses C++. It works on iOS, Android, Windows Phone, OS X, Windows and Linux.
[Dash](https://github.com/Circular-Studios/Dash) - A free and open 3D game engine written in D.
[Duality](https://github.com/AdamsLair/duality) - a 2D Game Development Framework.
[EaselJS](https://github.com/gskinner/EaselJS) - a library to make working with the Canvas element easier.
[EntityJS](https://github.com/bendangelo/entityjs) - an HTML5 javascript game engine utlizing the entity-component design.
[Flashpunk](https://github.com/Draknek/FlashPunk) - a free ActionScript 3 library designed for developing 2D Flash games.
[melonJS](http://melonjs.org/) - An open-source HTML5 game framework for 2D games.
[Spring](https://github.com/spring/spring) - an Open Source Real Time Strategy game engine.
[Tesseract](https://github.com/lsalzman/tesseract) - make mapping more fun by using modern dynamic rendering techniques, sothat you can get instant feedback on lighting changes, not just geometry.
[Torque 3D](https://github.com/GarageGames/Torque3D) - MIT Licensed Open Source version of Torque 3D from GarageGames.
[Turbulenz Engine](https://github.com/turbulenz/turbulenz_engine) - an HTML5 game engine and server-side APIs available in JavaScript and TypeScript for building and distributing 2D and 3D games.
[Akihabara](https://github.com/Akihabara/akihabara) - a set of libraries, tools and presets to create pixelated indie-style 8/16-bit era games in Javascript.
[ammo.js](https://github.com/kripken/ammo.js) - direct port of the Bullet physics engine to JavaScript using Emscripten.
[Aquaria](https://github.com/islocated/Aquaria) - a breath-taking underwater fantasy game. Winner of the Grand Prize at the 2007 Independent Games Festival.
[Doom 3](https://github.com/TTimo/doom3.gpl) - pew pew pew.
[ID Software](https://github.com/id-Software) - includes Doom, Quake, Wolfenstein and more!
[MaNGOS](https://github.com/mangos/mangos) - a full featured World of Warcraft server!
[Miner Wars 2081](https://github.com/KeenSoftwareHouse/Miner-Wars-2081) - for modders of Miner Wars 2081, a 6DOF action-survival space-shooter simulation-game set in the year 2081.
[Prince of Persia](https://github.com/jmechner/Prince-of-Persia-Apple-II) - Prince of Persia!
[Bridges](https://github.com/zgrossbart/bridges) - a puzzle game with bridges, houses, tolls, and subways for iOS.
[Canabalt](https://github.com/ericjohnson/canabalt-ios) - open source release of Canabalt for iOS.
[Doom](https://github.com/id-Software/DOOM-iOS) - Doom Classic for iOS.
[DrugsNRock](https://github.com/biou/DrugsNRock) - a simple multiplayer rhythm game designed during the Global Game Jam'13.
[Frogatto](https://github.com/frogatto/frogatto) - an action-adventure game, starring a certain quixotic frog.
[Gorillas](https://github.com/Lyndir/Gorillas) - an iPhone (or iPod touch) port of the popular old QBasic game.
[Light Jockey](https://github.com/jmfieldman/Light-Jockey) - an iOS Auditorium-like game.
[Lumio](https://github.com/joannecdyer/lumio) - a puzzle game for iOS developed using Cocos2D. Available free on the App Store.
[Wolfenstein 3D](https://github.com/id-Software/Wolf3D-iOS) - Wolfenstein 3D for iOS Source Release.
[Green Mahjong](https://github.com/danbeck/green-mahjong) - solitaire mahjong game done in HTML/CSS/JS.
[ChaseWhisplyProject](https://github.com/tvbarthel/ChaseWhisplyProject) - Chase Whisply is a FPS. You have to seek, find and kill the ghosts living around you.
[Caesaria](https://github.com/dalerank/caesaria-game) - an open-source remake of the popular citybuilder and economic sim Caesar III.
[CorsixTH](https://github.com/CorsixTH/CorsixTH) - open source clone of Theme Hospital
[Unknown Horizons](https://github.com/unknown-horizons/) - 2D isometric RTS economic strategy game written in C++ & Python, built on the Flexible Isometric Free Engine.
[openage](https://github.com/SFTtech/openage) - Open source clone of the Age of Empires II engine.
[OpenRA](https://github.com/OpenRA/OpenRA) - an open-source implementation of the Red Alert engine using .NET/mono and OpenGL. Runs on Windows, Linux and OSX.
[OpenXcom](https://github.com/SupSuper/OpenXcom) - Open-source clone of the original X-Com
[PCOTM (Phone Case of the Monster)](https://github.com/jwoertink/pcotm) - A Ruby game, where you play as a phone-collecting monster.
[Pioneer](https://github.com/pioneerspacesim/pioneer) - A game of lonely space adventure.
[Polly-B-Gone](https://github.com/mbostock/polly-b-gone) - a physics platform game about a plucky wheeled robot named Polly.
[Source of Tales](https://github.com/tales/sourceoftales) - an entry in the Liberated Pixel Cup 2012.
[Spring RTS](https://github.com/spring/spring) - a powerful free cross-platform RTS engine.
[Voxeliq](https://github.com/raistlinthewiz/voxeliq) - an open source block-based game engine implementation developed with C#.
[Wizznic](https://github.com/DusteDdk/Wizznic) - most awesome puzzle game.
[Craft](https://github.com/fogleman/Craft) - A simple Minecraft clone written in C using modern OpenGL.
[Minetest](https://github.com/minetest/minetest) - An open source infinite-world block sandbox game with survival and crafting.
[Freeminer](https://github.com/freeminer/freeminer) - An open source sandbox game inspired by Minecraft.
[Dominion](https://github.com/paulbatum/Dominion) - a C# implementation of Dominion, a board/card game.
[IRMINGARD](https://github.com/gamebytes/irmingard-backbone) - patience card game written in Ruby.
[PuzzleDash](https://github.com/zeDoctor/PuzzleDash) - A match-3 puzzle game built in the [Dash engine](https://github.com/Circular-Studios/Dash).
[Wizznic](https://github.com/DusteDdk/Wizznic) - most awesome puzzle game.
[Alien Invasion](https://github.com/cykod/AlienInvasion) - space invaders++. [Play it now!](http://cykod.github.io/AlienInvasion/)
[Asteroids](http://github.com/dmcinnes/HTML5-Asteroids) - pure JavaScript asteroids. [Play it now!](http://dougmcinnes.com/html-5-asteroids/)
[Digger](https://github.com/lutzroeder/digger) - HTML5 version of a Boulderdash game. [Play it now!](http://www.lutzroeder.com/html5/digger/)
[Coffee Snake](https://github.com/dommmel/coffee-snake) - an HTML5 snake game written in coffee script. [Play it now!](http://dommmel.github.com/coffee-snake/)
[Draconas](https://github.com/Casmo/Drakonas) - a classic shoot 'em up game build with the Three.js library. [Play it now!](http://www.fellicht.nl/games/drakonas/)
[hurry!](https://github.com/hughsk/ludum-dare-27) - a small but speedy arcade shooter. [Play it now!](http://hughsk.io/ludum-dare-27/)
[Snake](https://github.com/jrgdiz/snake) - a clone of the snake game. [Play it now!](http://diz.es/snake/)
[Survivor](https://github.com/scottschiller/SURVIVOR) - a playable HTML + CSS + JavaScript remake of a space-based "shoot-'em-up" arcade game for Atari / Commodore 64 from 1982, including a level editor and design tool. [Play now!](http://www.schillmania.com/survivor/)
[Duck Hunt JS](https://github.com/MattSurabian/DuckHunt-JS) - DuckHunt ported to JS and HTML5 with a level creator. [Play now!](http://mattsurabian.com/duckhunt/)
[Mario 5 HTML](https://github.com/robertkleffner/mariohtml5) - infinite Mario in HTML5 JavaScript - using Canvas and Audio elements. [Play now!](http://rawrbitrary.com/arcade/infinite-mario-bros-in-html5/)
[Cell Mates](https://github.com/gamebytes/cellmates) - a GGJ 13 game.
[Codename Lumberjack](http://projects.iarke.us/codenamelumberjack/) - a simple flash game written using Actionscript 3.0 and Flixel. [Play it now!](http://projects.iarke.us/codenamelumberjack/)
[Coil](https://github.com/leereilly/Coil) - HTML5 canvas game where you defeat enemies by wrapping enemies in your trail. [Play now!](http://hakim.se/experiments/html5/coil/)
[FlxTeroids](https://github.com/AdamAtomic/FlxTeroids) - a very simple flixel game inspired by the classic arcade shooter. [Play now!](http://www.flixel.org/flxteroids/)
[EKG Runner](https://github.com/Myztiq/ekgrunner) - a GGJ 13 game.
[Emberwind](https://github.com/operasoftware/Emberwind) - HTML5 port of the indie platform game Emberwind. [Play now!](http://operasoftware.github.com/Emberwind/)
[Fluid Table Tennis](https://github.com/anirudhjoshi/fluid_table_tennis) - renders a table tennis game interacting with a full-color real-time fluid simulation at 60 FPS. [Play now!](http://anirudhjoshi.github.com/fluid_table_tennis)
[FlxInvaders](https://github.com/AdamAtomic/Flx-Invaders) - a very simple flixel game inspired by the Taito classic. [Play now!](http://flixel.org/flxinvaders/)
[Grave Robbers](https://github.com/AdamAtomic/GraveRobbers) - a sort of GIRP-inspired tower defense. [Play now!](http://adamatomic.com/graverobbers)
[HotFix](https://github.com/sdrdis/hotfix) - help Hotfix collect stargazers and avoid enemies. Collect commits to upgrade hotfix and add new features. [Play now!](http://sdrdis.github.com/hotfix/)
[Marble Soccer](https://github.com/jeromeetienne/marbleSoccer) - a marble game for learning three.js.
[Mode](https://github.com/AdamAtomic/Mode) - a small (but sadly not that simple) demo game built on the flixel framework. [Play now!](http://www.adamatomic.com/mode/)
[Onslaught Arena](https://github.com/lostdecade/onslaught_arena) - fight off hordes of classic medieval monsters in this fast paced arcade shooter! [Play now!](http://arcade.lostdecadegames.com/onslaught_arena/)
[Pappu Pakia](https://github.com/mindd-it/pappu-pakia) - an addictive game where you guide little Pappu around obstacles while collecting coins, stars, and berries and avoiding enemies known as Pakias. [Play now!](http://khele.in/pappu-pakia/)
[PixelPlatformer](https://github.com/bendangelo/PixelPlatformer) - simple platformer game that demostrates the power of the Entity game engine.
[Polybranch](https://github.com/gbatha/PolyBranch) - a minimalist 3D game. Dodging branches may seem easy at first, but how long can you hold up as you approach terminal velocity? [Play now!](http://gregbatha.com/branches/)
[Release Cycles](https://github.com/RothschildGames/release-cycles) - n abstract racing game where you fight against the clock and the computer to get as far as you can in a product's life-cycle. [Play now!](http://www.release-cycles.com/)
[Ski Free](https://github.com/basicallydan/skifree.js) - a JavaScript port of the classic PC Game, Skifree. [Play the Demo now!](http://basicallydan.github.com/skifree.js)
[SORADES 13K](https://github.com/maettig/starship-sorades-13k) - a scrolling shooter in the vein of "Raptor: Call of the Shadows" and "Warning Forever". [Play now!](http://maettig.com/code/canvas/starship-sorades-13k/)
[zedinvaders](https://github.com/salvatorecapolupo/zedinvaders) -a game is based on our original comic ZED, seen inside "zero-episode" called "Game Over". [Play now!](http://zedfumetto.it/zedinvaders/game.html)
[Crappy Bird](https://github.com/varunpant/CrappyBird) - Flappy bird clone in JavaScript and Canvas2D Api [Play now!](http://www.varunpant.com/static/resources/CrappyBird/index.html)
[Clumsy Bird](https://github.com/ellisonleao/clumsy-bird) - Flappy bird clone in JavaScript using MelonJS [Play now!](http://www.varunpant.com/static/resources/CrappyBird/index.html)
`;

const lines = text.split('\n').filter(l => l.trim().startsWith('['));
const regex = /\[(.*?)\]\((https?:\/\/github\.com\/[^\/)]+\/[^\/)]+)\)\s*(?:-\s*(.*))?/;

const repos = [];
for (const line of lines) {
  const m = line.match(regex);
  if (m) {
    repos.push({
      title: m[1].trim(),
      url: m[2].trim(),
      desc: (m[3] || '').trim()
    });
  }
}

const publicDirs = fs.existsSync('public') ? fs.readdirSync('public') : [];

// Check duplicates in list
const seen = new Set();
const unique = [];
for (const r of repos) {
  if (!seen.has(r.url)) {
    seen.add(r.url);
    unique.push(r);
  }
}

console.log(`Unique repos: ${unique.length}`);

const analysis = unique.map(r => {
  const slug = r.url.split('/').pop().replace(/\.git$/, '').toLowerCase();
  const alreadyInPublic = publicDirs.some(d => {
    const dl = d.toLowerCase();
    return dl === slug || slug.includes(dl) || dl.includes(slug);
  });
  return { ...r, slug, alreadyInPublic };
});

const notYetAdded = analysis.filter(a => !a.alreadyInPublic);
console.log(`\nNot yet in public: ${notYetAdded.length}`);
for (const n of notYetAdded) {
  console.log(`- ${n.title.padEnd(25)} | ${n.url} | ${n.desc.slice(0, 60)}`);
}

fs.writeFileSync('not_yet_added.json', JSON.stringify(notYetAdded, null, 2));
