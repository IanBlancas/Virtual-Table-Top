function initBoardTour() {
  const tourHtml = `
<div id="tourOverlay" class="tour-overlay" style="display: none;">
  <div class="tour-tooltip">
    <div class="tour-header">
      <h3 id="tourTitle">Welcome to FlatTop!</h3>
      <button id="tourSkip" class="tour-skip">Skip Tour</button>
    </div>
    <div id="tourContent" class="tour-content">This is a virtual tabletop for online gaming. Let's take a quick tour!</div>
    <div class="tour-navigation">
      <button id="tourPrev" class="tour-btn tour-prev" style="display: none;">Previous</button>
      <div class="tour-progress"><span id="tourStep">1</span> of <span id="tourTotal">7</span></div>
      <button id="tourNext" class="tour-btn tour-next">Next</button>
    </div>
  </div>
  <div class="tour-highlight"></div>
</div>`;

  const styles = `
.tour-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 10000; pointer-events: none; }
.tour-tooltip { position: absolute; background: white; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); padding: 20px; max-width: 300px; pointer-events: all; z-index: 10001; }
.tour-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.tour-header h3 { margin: 0; color: #333; }
.tour-skip { background: none; border: none; color: #666; cursor: pointer; font-size: 14px; }
.tour-content { color: #555; line-height: 1.5; margin-bottom: 20px; }
.tour-navigation { display: flex; justify-content: space-between; align-items: center; }
.tour-btn { background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px; }
.tour-btn:hover { background: #0056b3; }
.tour-prev { background: #6c757d; }
.tour-prev:hover { background: #545b62; }
.tour-progress { font-size: 14px; color: #666; }
.tour-highlight { position: absolute; background: rgba(0,123,255,0.3); border: 2px solid #007bff; border-radius: 4px; pointer-events: none; z-index: 10000; transition: all 0.3s ease; }`;

  document.body.insertAdjacentHTML('beforeend', tourHtml);
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  let currentTourStep = 0;
  const tourSteps = [
    { element: 'body', title: 'Welcome to FlatTop!', content: 'This is a virtual tabletop for online gaming. Let\'s take a quick tour of the main features!', position: 'center' },
    { element: '#fileMenuBtn', title: 'File Menu', content: 'Use the File menu to save your board state as JSON or load previous sessions.', position: 'bottom' },
    { element: '#lobbyMenuBtn', title: 'Lobby Menu', content: 'Use the Lobby menu to manage your game session and players.', position: 'bottom' },
    { element: '#lasso_Button', title: 'Toolbar Tools', content: 'Select tools like Lasso for multi-selection, Draw for freehand drawing, or Ruler for measurements.', position: 'right' },
    { element: '.widget-list', title: 'Widgets Sidebar', content: 'Add interactive elements like dice, cards, tokens, and counters to your game.', position: 'right' },
    { element: '#private-panel', title: 'Private Board', content: 'Use this private board for your own hidden notes and tokens. Anything placed here is only visible to you, not the shared game board.', position: 'right' },
    { element: '#wrap', title: 'The Game Board', content: 'This is your main play area. Zoom with mouse wheel, pan with middle-click or space+click.', position: 'center' },
    { element: '.sharebtn', title: 'Share Button', content: 'Click here to copy the lobby link to your clipboard for sharing with other players.', position: 'left' }
  ];

  const tourOverlay = document.getElementById('tourOverlay');
  const tourTitle = document.getElementById('tourTitle');
  const tourContent = document.getElementById('tourContent');
  const tourStep = document.getElementById('tourStep');
  const tourTotal = document.getElementById('tourTotal');
  const tourPrev = document.getElementById('tourPrev');
  const tourNext = document.getElementById('tourNext');
  const tourSkip = document.getElementById('tourSkip');
  const tourHighlight = document.querySelector('.tour-highlight');
  const tourTooltip = document.querySelector('.tour-tooltip');

  function showTourStep(step) {
    const stepData = tourSteps[step];
    const element = document.querySelector(stepData.element);
    if (!element) return;

    tourTitle.textContent = stepData.title;
    tourContent.textContent = stepData.content;
    tourStep.textContent = step + 1;
    tourTotal.textContent = tourSteps.length;

    const rect = element.getBoundingClientRect();
    tourHighlight.style.left = `${rect.left}px`;
    tourHighlight.style.top = `${rect.top}px`;
    tourHighlight.style.width = `${rect.width}px`;
    tourHighlight.style.height = `${rect.height}px`;

    const tooltipWidth = 300;
    const tooltipHeight = 200;
    let tooltipLeft, tooltipTop;

    switch (stepData.position) {
      case 'top':
        tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
        tooltipTop = rect.top - tooltipHeight - 10;
        break;
      case 'bottom':
        tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
        tooltipTop = rect.bottom + 10;
        break;
      case 'left':
        tooltipLeft = rect.left - tooltipWidth - 10;
        tooltipTop = rect.top + rect.height / 2 - tooltipHeight / 2;
        break;
      case 'right':
        tooltipLeft = rect.right + 10;
        tooltipTop = rect.top + rect.height / 2 - tooltipHeight / 2;
        break;
      case 'center':
      default:
        tooltipLeft = window.innerWidth / 2 - tooltipWidth / 2;
        tooltipTop = window.innerHeight / 2 - tooltipHeight / 2;
        break;
    }

    tooltipLeft = Math.max(10, Math.min(window.innerWidth - tooltipWidth - 10, tooltipLeft));
    tooltipTop = Math.max(10, Math.min(window.innerHeight - tooltipHeight - 10, tooltipTop));

    tourTooltip.style.left = `${tooltipLeft}px`;
    tourTooltip.style.top = `${tooltipTop}px`;

    tourPrev.style.display = step === 0 ? 'none' : 'inline-block';
    tourNext.textContent = step === tourSteps.length - 1 ? 'Finish' : 'Next';
  }

  function startTour() {
    currentTourStep = 0;
    tourOverlay.style.display = 'block';
    showTourStep(0);
  }

  function endTour() {
    tourOverlay.style.display = 'none';
    currentTourStep = 0;
  }

  tourNext.addEventListener('click', () => {
    if (currentTourStep < tourSteps.length - 1) {
      currentTourStep++;
      showTourStep(currentTourStep);
    } else {
      endTour();
    }
  });

  tourPrev.addEventListener('click', () => {
    if (currentTourStep > 0) {
      currentTourStep--;
      showTourStep(currentTourStep);
    }
  });

  tourSkip.addEventListener('click', endTour);

  document.getElementById('tutorialBtn')?.addEventListener('click', startTour);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && tourOverlay.style.display === 'block') {
      endTour();
    }
  });
}

document.addEventListener('DOMContentLoaded', initBoardTour);
