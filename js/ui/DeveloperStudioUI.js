import { portalState } from '../core/portalState.js';
import { sounds } from '../core/soundFX.js';
import { formatNumber } from '../utils/helpers.js';

export class DeveloperStudioUI {
  constructor(onUpdatePortal) {
    this.onUpdatePortal = onUpdatePortal;
    this.currentStep = 1;
    this.previewEngineInstance = null;
    this.init();
  }

  init() {
    // Open Developer Studio button in header / footer
    document.getElementById('btn-portal-dev')?.addEventListener('click', () => {
      sounds.playClick();
      this.open();
    });

    // Close button
    document.querySelectorAll('.btn-close-dev-studio').forEach(btn => {
      btn.addEventListener('click', () => {
        sounds.playClick();
        this.close();
      });
    });

    // Studio Navigation Tabs
    document.querySelectorAll('.dev-tab-btn').forEach(tab => {
      tab.addEventListener('click', (e) => {
        sounds.playClick();
        const tabTarget = e.currentTarget.getAttribute('data-tab');
        this.switchTab(tabTarget);
      });
    });

    // Step 3: Run Quality Scanner button
    document.getElementById('btn-dev-run-scanner')?.addEventListener('click', () => {
      this.handleRunQualityScanner();
    });

    // Step 4: Launch Sandbox Preview
    document.getElementById('btn-dev-preview-sandbox')?.addEventListener('click', () => {
      this.handleLaunchSandbox();
    });

    // Step 5: Submit Game Form
    document.getElementById('form-dev-studio-publish')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmitGame();
    });
  }

  open() {
    const modal = document.getElementById('screen-developer-studio');
    if (modal) {
      modal.classList.remove('hidden');
      this.switchTab('publish');
      this.renderAnalytics();
      this.renderSubmissionsList();
    }
  }

  close() {
    const modal = document.getElementById('screen-developer-studio');
    if (modal) modal.classList.add('hidden');
    if (this.previewEngineInstance && typeof this.previewEngineInstance.destroy === 'function') {
      this.previewEngineInstance.destroy();
      this.previewEngineInstance = null;
    }
  }

  switchTab(tabName) {
    document.querySelectorAll('.dev-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });

    document.querySelectorAll('.dev-tab-content').forEach(pane => {
      pane.classList.toggle('hidden', pane.getAttribute('id') !== `dev-pane-${tabName}`);
    });

    if (tabName === 'analytics') {
      this.renderAnalytics();
    } else if (tabName === 'submissions') {
      this.renderSubmissionsList();
    }
  }

  handleRunQualityScanner() {
    sounds.playClick();
    const title = document.getElementById('dev-game-title')?.value.trim();
    const description = document.getElementById('dev-game-desc')?.value.trim();
    const engineType = document.getElementById('dev-game-engine')?.value;
    const embedUrl = document.getElementById('dev-game-embed-url')?.value.trim();

    const report = portalState.runQualityScanner({
      title,
      description,
      engineType,
      embedUrl
    });

    const resultsDiv = document.getElementById('dev-scanner-results');
    if (!resultsDiv) return;

    resultsDiv.classList.remove('hidden');
    resultsDiv.innerHTML = `
      <div class="scanner-gauge-card">
        <div class="scanner-score-circle ${report.score >= 80 ? 'good' : 'warning'}">
          <span>${report.score}</span>
          <small>/ 100</small>
        </div>
        <div class="scanner-summary">
          <h4>${report.score >= 80 ? '🎉 Quality Scan Passed (Production Ready)' : '⚠️ Warning: Improvements Needed'}</h4>
          <p>Automated verification completed across package integrity, screen responsiveness, and runtime FPS performance.</p>
        </div>
      </div>
      <div class="scanner-checklist">
        ${report.checks.map(c => `
          <div class="scan-check-row ${c.passed ? 'check-pass' : 'check-fail'}">
            <span>${c.passed ? '✅' : '❌'} <b>${c.name}</b></span>
            <small>${c.detail}</small>
          </div>
        `).join('')}
      </div>
    `;

    sounds.playPowerup();
  }

  handleLaunchSandbox() {
    sounds.playPowerup();
    const stage = document.getElementById('dev-sandbox-stage');
    if (!stage) return;
    stage.innerHTML = '';

    const engineType = document.getElementById('dev-game-engine')?.value || 'ArcheryMaster';
    const embedUrl = document.getElementById('dev-game-embed-url')?.value.trim();

    if (engineType === 'custom_url' && embedUrl) {
      stage.innerHTML = `<iframe src="${embedUrl}" class="sandbox-iframe" allowfullscreen></iframe>`;
      return;
    }

    // Dynamic import engine
    import(`../games/${engineType}.js`).then(module => {
      const EngineClass = module[`${engineType}Game`] || Object.values(module)[0];
      if (EngineClass) {
        this.previewEngineInstance = new EngineClass(stage, (score) => {
          alert(`Sandbox Test Complete! High Score: ${score}`);
        });
      }
    }).catch(err => {
      stage.innerHTML = `<div style="color: #ff4d6d; padding: 20px;">Engine simulation active: ${engineType}</div>`;
    });
  }

  handleSubmitGame() {
    const title = document.getElementById('dev-game-title')?.value.trim();
    const developer = document.getElementById('dev-game-developer')?.value.trim() || 'Indie Game Studio';
    const category = document.getElementById('dev-game-category')?.value || 'action';
    const icon = document.getElementById('dev-game-icon')?.value.trim() || '🎮';
    const version = document.getElementById('dev-game-version')?.value.trim() || '1.0.0';
    const description = document.getElementById('dev-game-desc')?.value.trim();
    const controls = document.getElementById('dev-game-controls')?.value.trim();
    const engine = document.getElementById('dev-game-engine')?.value;
    const embedUrl = document.getElementById('dev-game-embed-url')?.value.trim();
    const bannerColor = document.getElementById('dev-game-banner-color')?.value;

    if (!title || !description) {
      alert('Please fill out required title and description.');
      return;
    }

    const submission = portalState.submitDeveloperGame({
      title,
      developer,
      category,
      icon,
      version,
      description,
      controls,
      engine,
      embedUrl,
      bannerColor
    });

    sounds.playWin();
    alert(`🚀 "${title}" has been packaged & submitted for Super Admin review! Quality Score: ${submission.qualityScore}/100.`);
    document.getElementById('form-dev-studio-publish')?.reset();
    document.getElementById('dev-scanner-results')?.classList.add('hidden');
    this.switchTab('submissions');
  }

  renderAnalytics() {
    const games = portalState.getGames();
    const totalPlays = games.reduce((acc, g) => acc + (g.plays || 0), 0);
    const uniquePlayers = Math.round(totalPlays * 0.72);
    const estimatedRev = (totalPlays * 0.0035).toFixed(2);

    document.getElementById('dev-stat-plays').textContent = formatNumber(totalPlays);
    document.getElementById('dev-stat-players').textContent = formatNumber(uniquePlayers);
    document.getElementById('dev-stat-revenue').textContent = `$${estimatedRev}`;
  }

  renderSubmissionsList() {
    const tbody = document.getElementById('dev-submissions-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const submissions = portalState.getPendingSubmissions();
    if (submissions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #94a3b8; padding: 20px;">No developer submissions yet. Build and submit your first game!</td></tr>`;
      return;
    }

    submissions.forEach(sub => {
      const tr = document.createElement('tr');
      const statusBadge = sub.status === 'approved' 
        ? '<span class="status-badge status-approved">✅ Approved & Live</span>'
        : (sub.status === 'rejected' 
          ? `<span class="status-badge status-rejected" title="${sub.rejectionReason || ''}">❌ Rejected</span>`
          : '<span class="status-badge status-pending">⏳ In Review</span>');

      tr.innerHTML = `
        <td><span style="font-size: 1.3rem;">${sub.icon}</span> <b>${sub.title}</b></td>
        <td>v${sub.version || '1.0'}</td>
        <td>${sub.category.toUpperCase()}</td>
        <td><span class="quality-badge">${sub.qualityScore}/100</span></td>
        <td>${statusBadge}</td>
        <td>${sub.submittedAt}</td>
      `;
      tbody.appendChild(tr);
    });
  }
}
