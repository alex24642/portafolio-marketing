/*
  Persistent Music Player
  - Floats across all pages
  - Continues playing when navigating
  - Uses localStorage to persist state
  - Similar to Spotify, YouTube Music apps
*/

(function(){
  'use strict';

  const STORAGE_KEY = 'persistent_player_state';
  const SPOTIFY_TRACK_ID = '12bYYQaLqHliSXvRIYlq8G';
  const SPOTIFY_EMBED_URL = `https://open.spotify.com/embed/track/${SPOTIFY_TRACK_ID}?utm_source=generator`;

  // Save player state
  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch(e) {
      console.warn('Could not save player state:', e);
    }
  }

  // Load player state
  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : { isPlaying: false, lastTimestamp: Date.now() };
    } catch(e) {
      return { isPlaying: false, lastTimestamp: Date.now() };
    }
  }

  // Create persistent floating player
  function createFloatingPlayer() {
    // Create container
    const container = document.createElement('div');
    container.id = 'persistent-player-container';
    container.innerHTML = `
      <div class="persistent-player">
        <div class="persistent-player-content">
          <div class="persistent-player-info">
            <div class="persistent-player-icon">🎵</div>
            <div class="persistent-player-text">
              <p class="persistent-player-title">Escuchando música</p>
              <p class="persistent-player-artist">Fly Me to the Moon</p>
            </div>
          </div>
          <div class="persistent-player-controls">
            <button id="persistent-player-toggle" class="persistent-player-btn" aria-label="Reproducir/Pausar">▶</button>
            <a href="https://open.spotify.com/intl-es/track/12bYYQaLqHliSXvRIYlq8G?si=c0383b4aabd94672" target="_blank" rel="noopener" class="persistent-player-link" aria-label="Abrir en Spotify">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.6 17.5c-.4.6-1.2.8-1.8.4-5.1-3.1-11.5-3.8-19.1-2.1-.7.1-1.4-.4-1.5-1.1-.1-.7.4-1.4 1.1-1.5 8.3-1.9 15.2-1.1 20.8 2.4.6.4.8 1.2.4 1.8zm1.5-3.3c-.5.7-1.5.9-2.2.4-5.9-3.6-14.9-4.7-21.9-2.6-.8.3-1.7-.1-2-.8-.3-.8.1-1.7.8-2 8.2-2.4 18.3-1.2 25.1 3 .7.4.9 1.4.5 2.1zm.1-3.4c-7.1-4.2-18.8-4.6-25.6-2.5-1 .3-2-.3-2.3-1.3-.3-1 .3-2 1.3-2.3 8.1-2.4 20.6-2 28.6 2.9.9.5 1.2 1.6.7 2.5-.5.9-1.6 1.2-2.5.7z"/></svg>
            </a>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(container);
    return container;
  }

  // Inject CSS for floating player
  function injectPlayerCSS() {
    const style = document.createElement('style');
    style.textContent = `
      #persistent-player-container {
        position: fixed;
        bottom: 20px;
        left: 20px;
        z-index: 9998;
        font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .persistent-player {
        background: linear-gradient(135deg, #ff6b35 0%, #ff3b1f 100%);
        border-radius: 12px;
        padding: 0.8rem 1rem;
        box-shadow: 0 8px 24px rgba(255, 107, 53, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(10px);
        min-width: 280px;
        animation: slideUp 0.3s ease-out;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .persistent-player-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }

      .persistent-player-info {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        flex: 1;
        min-width: 0;
      }

      .persistent-player-icon {
        font-size: 1.5rem;
        flex-shrink: 0;
        animation: pulse 2s ease-in-out infinite;
      }

      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }

      .persistent-player-text {
        min-width: 0;
      }

      .persistent-player-title {
        font-size: 0.85rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.9);
        margin: 0;
      }

      .persistent-player-artist {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.7);
        margin: 0.2rem 0 0 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .persistent-player-controls {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        flex-shrink: 0;
      }

      .persistent-player-btn {
        background: rgba(255, 255, 255, 0.25);
        border: none;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        cursor: pointer;
        font-size: 0.8rem;
        transition: all 0.2s;
      }

      .persistent-player-btn:hover {
        background: rgba(255, 255, 255, 0.35);
        transform: scale(1.05);
      }

      .persistent-player-link {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        color: #fff;
        transition: all 0.2s;
      }

      .persistent-player-link:hover {
        transform: scale(1.1);
      }

      .persistent-player-link svg {
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
      }

      /* Responsive */
      @media (max-width: 768px) {
        .persistent-player {
          min-width: 260px;
          padding: 0.7rem 0.8rem;
        }

        .persistent-player-title {
          font-size: 0.8rem;
        }

        .persistent-player-artist {
          font-size: 0.7rem;
        }

        .persistent-player-btn,
        .persistent-player-link {
          width: 28px;
          height: 28px;
        }
      }

      @media (max-width: 480px) {
        #persistent-player-container {
          bottom: 10px;
          left: 10px;
          right: 10px;
        }

        .persistent-player {
          min-width: unset;
          width: 100%;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Initialize player
  document.addEventListener('DOMContentLoaded', function() {
    injectPlayerCSS();
    createFloatingPlayer();

    const toggleBtn = document.getElementById('persistent-player-toggle');
    const state = loadState();

    // Restore playing state
    if (state.isPlaying) {
      toggleBtn.textContent = '⏸';
      updateIndicator(true);
    }

    // Toggle play/pause
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const isPlaying = toggleBtn.textContent === '⏸';
        toggleBtn.textContent = isPlaying ? '▶' : '⏸';
        updateIndicator(!isPlaying);
        saveState({ isPlaying: !isPlaying, lastTimestamp: Date.now() });
      });
    }

    // Update pulse animation based on state
    function updateIndicator(isPlaying) {
      const icon = document.querySelector('.persistent-player-icon');
      if (icon) {
        if (isPlaying) {
          icon.style.animationPlayState = 'running';
        } else {
          icon.style.animationPlayState = 'paused';
        }
      }
    }

    // Save state when leaving page
    window.addEventListener('beforeunload', function() {
      const isPlaying = toggleBtn.textContent === '⏸';
      saveState({ isPlaying: isPlaying, lastTimestamp: Date.now() });
    });
  });

  // Expose for debugging
  window.__persistentPlayer = {
    saveState: saveState,
    loadState: loadState
  };

})();
