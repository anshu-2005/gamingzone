/* ====================================================
   GAMINGZONE CRICKET WIZARD
   Step-by-step match configuration flow
   ==================================================== */

import { sounds } from '../core/soundFX.js';
import { IPL_TEAMS, WORLD_CUP_TEAMS } from '../data/cricketTeams.js';
import { icons } from '../utils/icons.js';

export class CricketModeSelectUI {
  constructor(onSelectMode) {
    this.onSelectMode = onSelectMode;
    this.currentStep = 1; // 1: Your Team, 2: Opponent, 3: Format/Overs, 4: Preview
    this.currentTournament = 'ipl'; // 'ipl' or 'worldcup'
    this.selectedPlayerTeam = IPL_TEAMS[0]; // CSK
    this.selectedOpponentTeam = IPL_TEAMS[1]; // MI
    this.selectedOvers = '5overs';
  }

  render(container, game) {
    this.container = container;
    this.game = game;
    container.innerHTML = '';

    const hub = document.createElement('div');
    hub.className = 'cricket-wizard-modal';
    
    hub.innerHTML = `
      <!-- Header & Step Navigation -->
      <div class="wizard-header">
        <div class="wizard-identity">
          <span class="genre-badge cricket">CRICKET CHAMPIONSHIP</span>
          <h2 class="wizard-title">${game.title}</h2>
        </div>

        <!-- Step Progress Tracker -->
        <div class="wizard-steps-tracker">
          <div class="step-dot ${this.currentStep >= 1 ? 'active' : ''}">
            <span class="step-num">1</span>
            <span class="step-label">Your Team</span>
          </div>
          <div class="step-line ${this.currentStep >= 2 ? 'active' : ''}"></div>
          <div class="step-dot ${this.currentStep >= 2 ? 'active' : ''}">
            <span class="step-num">2</span>
            <span class="step-label">Opponent</span>
          </div>
          <div class="step-line ${this.currentStep >= 3 ? 'active' : ''}"></div>
          <div class="step-dot ${this.currentStep >= 3 ? 'active' : ''}">
            <span class="step-num">3</span>
            <span class="step-label">Format</span>
          </div>
          <div class="step-line ${this.currentStep >= 4 ? 'active' : ''}"></div>
          <div class="step-dot ${this.currentStep >= 4 ? 'active' : ''}">
            <span class="step-num">4</span>
            <span class="step-label">Preview</span>
          </div>
        </div>
      </div>

      <!-- Step Content Area -->
      <div class="wizard-content-body" id="wizard-step-body">
        <!-- Rendered based on this.currentStep -->
      </div>

      <!-- Wizard Navigation Footer -->
      <div class="wizard-footer">
        <button class="btn btn-secondary" id="btn-wiz-back" ${this.currentStep === 1 ? 'disabled style="opacity: 0.5;"' : ''}>
          ${icons.back} Back
        </button>
        <button class="btn btn-primary" id="btn-wiz-next">
          ${this.currentStep === 4 ? '🏏 PLAY MATCH →' : 'Next Step ➔'}
        </button>
      </div>
    `;

    container.appendChild(hub);
    this.renderCurrentStep(hub);

    // Navigation buttons
    hub.querySelector('#btn-wiz-back')?.addEventListener('click', () => {
      if (this.currentStep > 1) {
        sounds.playClick();
        this.currentStep--;
        this.render(this.container, this.game);
      }
    });

    hub.querySelector('#btn-wiz-next')?.addEventListener('click', () => {
      sounds.playClick();
      if (this.currentStep < 4) {
        this.currentStep++;
        this.render(this.container, this.game);
      } else {
        // Launch match
        sounds.playWin();
        this.onSelectMode({
          mode: this.selectedOvers,
          playerTeam: this.selectedPlayerTeam,
          opponentTeam: this.selectedOpponentTeam,
          tournament: this.currentTournament,
          stadium: this.selectedOpponentTeam.stadium || this.selectedPlayerTeam.stadium,
          title: `${this.selectedPlayerTeam.shortName} vs ${this.selectedOpponentTeam.shortName} (${this.getOversLabel()})`
        });
      }
    });
  }

  renderCurrentStep(hub) {
    const body = hub.querySelector('#wizard-step-body');
    if (!body) return;

    if (this.currentStep === 1) {
      // Step 1: Select Your Team
      body.innerHTML = `
        <div class="step-pane">
          <div class="pane-headline">
            <h3>SELECT YOUR TEAM (BATSMAN)</h3>
            <div class="tournament-switch-pills">
              <button class="tab-pill ${this.currentTournament === 'ipl' ? 'active' : ''}" id="tab-ipl">IPL TEAMS</button>
              <button class="tab-pill ${this.currentTournament === 'worldcup' ? 'active' : ''}" id="tab-wc">WORLD CUP</button>
            </div>
          </div>
          <div class="teams-grid-selector" id="grid-player-teams"></div>
        </div>
      `;

      body.querySelector('#tab-ipl')?.addEventListener('click', () => {
        sounds.playClick();
        this.currentTournament = 'ipl';
        this.selectedPlayerTeam = IPL_TEAMS[0];
        this.selectedOpponentTeam = IPL_TEAMS[1];
        this.renderCurrentStep(hub);
      });

      body.querySelector('#tab-wc')?.addEventListener('click', () => {
        sounds.playClick();
        this.currentTournament = 'worldcup';
        this.selectedPlayerTeam = WORLD_CUP_TEAMS[0];
        this.selectedOpponentTeam = WORLD_CUP_TEAMS[1];
        this.renderCurrentStep(hub);
      });

      const grid = body.querySelector('#grid-player-teams');
      const teams = this.currentTournament === 'ipl' ? IPL_TEAMS : WORLD_CUP_TEAMS;
      teams.forEach(t => {
        const card = document.createElement('div');
        const isSelected = this.selectedPlayerTeam.id === t.id;
        card.className = `team-card-pick ${isSelected ? 'selected' : ''}`;
        card.style.borderLeftColor = t.primaryColor;
        card.innerHTML = `
          <span class="team-icon-lg">${t.icon}</span>
          <div class="team-meta">
            <b style="color: ${t.primaryColor};">${t.shortName}</b>
            <small>${t.name}</small>
          </div>
        `;
        card.addEventListener('click', () => {
          sounds.playClick();
          this.selectedPlayerTeam = t;
          if (this.selectedOpponentTeam.id === t.id) {
            this.selectedOpponentTeam = teams.find(item => item.id !== t.id) || t;
          }
          this.renderCurrentStep(hub);
        });
        grid.appendChild(card);
      });

    } else if (this.currentStep === 2) {
      // Step 2: Choose Opponent
      body.innerHTML = `
        <div class="step-pane">
          <div class="pane-headline">
            <h3>CHOOSE OPPONENT (BOWLING TEAM)</h3>
            <span style="color: var(--text-muted); font-size: 0.85rem;">Opponent will bowl at their home stadium</span>
          </div>
          <div class="teams-grid-selector" id="grid-opp-teams"></div>
        </div>
      `;

      const grid = body.querySelector('#grid-opp-teams');
      const teams = this.currentTournament === 'ipl' ? IPL_TEAMS : WORLD_CUP_TEAMS;
      teams.forEach(t => {
        const card = document.createElement('div');
        const isSelected = this.selectedOpponentTeam.id === t.id;
        card.className = `team-card-pick ${isSelected ? 'selected' : ''}`;
        card.style.borderLeftColor = t.primaryColor;
        card.innerHTML = `
          <span class="team-icon-lg">${t.icon}</span>
          <div class="team-meta">
            <b style="color: ${t.primaryColor};">${t.shortName}</b>
            <small>${t.stadium || t.name}</small>
          </div>
        `;
        card.addEventListener('click', () => {
          sounds.playClick();
          this.selectedOpponentTeam = t;
          this.renderCurrentStep(hub);
        });
        grid.appendChild(card);
      });

    } else if (this.currentStep === 3) {
      // Step 3: Match Format & Overs
      const formats = [
        { id: '1over', badge: '1 OVER', title: '1-Over Blitz', desc: '6 Balls Thriller • Max Runs' },
        { id: 'super_over', badge: 'SUPER OVER', title: 'Chase 24 Runs', desc: '6 Balls • Chase Target • 2 Wkts' },
        { id: '5overs', badge: '5 OVERS', title: 'Mini T20 Cup', desc: '30 Balls • Chase 62 Runs' },
        { id: '10overs', badge: '10 OVERS', title: 'Pro Championship', desc: '60 Balls • Chase 118 Runs' },
        { id: '50overs', badge: '50 OVERS', title: 'World Cup ODI Final', desc: '120 Balls • Target 285 Runs' }
      ];

      body.innerHTML = `
        <div class="step-pane">
          <div class="pane-headline">
            <h3>SELECT MATCH FORMAT & OVERS</h3>
            <span style="color: var(--text-muted); font-size: 0.85rem;">Pick balls limit and target rules</span>
          </div>
          <div class="formats-grid-selector">
            ${formats.map(f => `
              <div class="format-card-pick ${this.selectedOvers === f.id ? 'selected' : ''}" data-fid="${f.id}">
                <span class="genre-badge cricket">${f.badge}</span>
                <h4 style="margin: 8px 0 4px; font-family: var(--font-heading); color: #fff;">${f.title}</h4>
                <p style="font-size: 0.8rem; color: var(--text-muted);">${f.desc}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      body.querySelectorAll('.format-card-pick').forEach(card => {
        card.addEventListener('click', () => {
          sounds.playClick();
          this.selectedOvers = card.getAttribute('data-fid');
          this.renderCurrentStep(hub);
        });
      });

    } else if (this.currentStep === 4) {
      // Step 4: Match Preview
      body.innerHTML = `
        <div class="step-pane">
          <div class="pane-headline">
            <h3>MATCH PREVIEW & FIXTURE</h3>
            <span style="color: var(--text-muted); font-size: 0.85rem;">Get ready to enter the stadium!</span>
          </div>

          <div class="fixture-preview-card">
            <div class="preview-team-side">
              <span class="preview-icon">${this.selectedPlayerTeam.icon}</span>
              <h3 style="color: ${this.selectedPlayerTeam.primaryColor};">${this.selectedPlayerTeam.name}</h3>
              <span class="role-pill">BATSMAN</span>
            </div>

            <div class="preview-center-vs">
              <span class="vs-circle">VS</span>
              <div class="fixture-meta-info">
                <b>${this.getOversLabel()}</b>
                <span>🏟️ ${this.selectedOpponentTeam.stadium || 'Wankhede Stadium'}</span>
              </div>
            </div>

            <div class="preview-team-side">
              <span class="preview-icon">${this.selectedOpponentTeam.icon}</span>
              <h3 style="color: ${this.selectedOpponentTeam.primaryColor};">${this.selectedOpponentTeam.name}</h3>
              <span class="role-pill">BOWLING</span>
            </div>
          </div>
        </div>
      `;
    }
  }

  getOversLabel() {
    if (this.selectedOvers === '1over') return '1 Over Blitz';
    if (this.selectedOvers === 'super_over') return 'Super Over';
    if (this.selectedOvers === '5overs') return '5 Overs Mini T20';
    if (this.selectedOvers === '10overs') return '10 Overs Pro Cup';
    if (this.selectedOvers === '50overs') return '50 Overs World Cup ODI';
    return '5 Overs';
  }
}
