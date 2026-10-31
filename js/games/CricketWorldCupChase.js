/* ====================================================
   CRICKET WORLD CUP TARGET CHASE (ICC ODI FINAL)
   High-Pressure 50-Over Target Chase, Required Run Rate,
   World Cup Rivals (India vs Australia) & Championship Trophy
   ==================================================== */

import { CricketPremierLeagueGame } from './CricketPremierLeague.js';
import { WORLD_CUP_TEAMS } from '../data/cricketTeams.js';

export class CricketWorldCupChaseGame extends CricketPremierLeagueGame {
  constructor(container, onGameOver, config = null) {
    const indiaTeam = WORLD_CUP_TEAMS.find(t => t.id === 'ind') || WORLD_CUP_TEAMS[0];
    const ausTeam = WORLD_CUP_TEAMS.find(t => t.id === 'aus') || WORLD_CUP_TEAMS[1];

    super(container, onGameOver, {
      playerTeam: indiaTeam,
      opponentTeam: ausTeam,
      tournament: 'worldcup',
      mode: config?.mode || '5overs', // 5-over thrilling death-overs chase
      targetScore: config?.targetScore || 54, // 54 runs needed in 30 balls
      stadium: 'Narendra Modi Stadium, Ahmedabad (132,000 Fans)',
      title: '👑 ICC World Cup Final: The Chase'
    });
  }
}
