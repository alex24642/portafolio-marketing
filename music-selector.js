// Music Selector - Reproductor flotante con reproducción continua entre páginas
(function(){
  var STORAGE_KEY = 'music_player_state';
  var UPDATE_KEY = 'music_player_update';
  
  var playlist = [
    { title: 'Sueño Fugaz', file: 'musica/PARIS The Prince - Fleeting Dream (musica1).mp3' },
    { title: 'Sin un Corazón', file: 'musica/Cuco - Sin Un Corazon (musica2).mp3' },
    { title: 'Fly Me to the Moon', file: 'musica/Fly Me to the Moon (musica3).mp3' },
    { title: 'Las Noches', file: 'musica/Junior H - LAS NOCHES (musica4).mp3' }
  ];

  function saveState(trackIndex, isPlaying, currentTime, volume){
    try{
      var state = {
        trackIndex: trackIndex,
        playing: isPlaying,
        time: currentTime,
        volume: volume,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      localStorage.setItem(UPDATE_KEY, JSON.stringify({updated: Date.now()}));
    }catch(e){}
  }

  function loadState(){
    try{
      var s = localStorage.getItem(STORAGE_KEY);
      return s ? JSON.parse(s) : {trackIndex: 0, playing: false, time: 0, volume: 0.7, timestamp: 0};
    }catch(e){
      return {trackIndex: 0, playing: false, time: 0, volume: 0.7, timestamp: 0};
    }
  }

  function injectCSS(){
    var css = `
#floating-audio-player {
  position: fixed;
  right: 1.5rem;
  bottom: 1.5rem;
  background: rgba(30, 30, 45, 0.92);
  border: 1px solid rgba(125,211,252,0.35);
  border-radius: 50px;
  padding: 0.6rem 0.9rem;
  width: auto;
  max-width: 520px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  backdrop-filter: blur(10px);
  z-index: 9999;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex-wrap: nowrap;
}

.music-selector-group {
  margin: 0;
  display: flex;
  align-items: center;
}

.music-selector-group label {
  display: none;
}

#music-track-select {
  padding: 0.4rem 0.6rem;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(125,211,252,0.25);
  color: #fff;
  border-radius: 20px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 140px;
}

#music-track-select:hover,
#music-track-select:focus {
  outline: none;
  border-color: #7dd3fc;
  background: rgba(125,211,252,0.1);
}

#music-track-select option {
  background: #1a1a2e;
  color: #fff;
  padding: 0.4rem;
}

.music-progress-container {
  flex: 1;
  min-width: 120px;
  margin: 0;
}

.music-progress-bar {
  width: 100%;
  height: 5px;
  background: rgba(125,211,252,0.15);
  border-radius: 3px;
  overflow: hidden;
  cursor: pointer;
}

.music-progress-fill {
  height: 100%;
  background: #7dd3fc;
  width: 0%;
  transition: width 0.05s linear;
}

.music-controls {
  display: flex;
  gap: 0.25rem;
  margin: 0;
}

.music-btn {
  padding: 0.38rem 0.5rem;
  background: rgba(125,211,252,0.12);
  border: 1px solid rgba(125,211,252,0.25);
  color: #fff;
  border-radius: 18px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 0.2s;
  white-space: nowrap;
  min-width: auto;
  flex: 0 0 auto;
}

.music-btn:hover {
  background: rgba(125,211,252,0.25);
  border-color: rgba(125,211,252,0.5);
}

.music-btn:active {
  transform: scale(0.92);
}

.music-btn.playing {
  background: #7dd3fc;
  color: #0a0e27;
  border-color: #7dd3fc;
}

.music-volume-group {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin: 0;
  flex: 0 0 auto;
}

.music-volume-group label {
  display: none;
}

#music-volume-slider {
  width: 70px;
  height: 4px;
  background: rgba(125,211,252,0.15);
  border-radius: 2px;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
}

#music-volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 11px;
  height: 11px;
  background: #7dd3fc;
  border-radius: 50%;
  cursor: pointer;
  border: 1.5px solid rgba(125,211,252,0.6);
  box-shadow: 0 2px 6px rgba(125,211,252,0.3);
}

#music-volume-slider::-moz-range-thumb {
  width: 11px;
  height: 11px;
  background: #7dd3fc;
  border-radius: 50%;
  cursor: pointer;
  border: 1.5px solid rgba(125,211,252,0.6);
  box-shadow: 0 2px 6px rgba(125,211,252,0.3);
}

#music-volume-slider::-moz-range-track {
  background: transparent;
  border: none;
}

.music-volume-value {
  font-size: 0.7rem;
  color: #7dd3fc;
  min-width: 22px;
  text-align: center;
  font-weight: 600;
}

@media(max-width: 800px){
  #floating-audio-player {
    padding: 0.5rem 0.7rem;
    gap: 0.5rem;
  }
  #music-track-select {
    min-width: 120px;
    font-size: 0.8rem;
  }
  .music-progress-container {
    min-width: 100px;
  }
  .music-btn {
    padding: 0.35rem 0.45rem;
    font-size: 0.7rem;
  }
  #music-volume-slider {
    width: 60px;
  }
}

@media(max-width: 600px){
  #floating-audio-player {
    right: 0.8rem;
    bottom: 0.8rem;
    left: 0.8rem;
    width: calc(100% - 1.6rem);
    flex-wrap: wrap;
    justify-content: center;
  }
  #music-track-select {
    order: 1;
    min-width: 100px;
  }
  .music-controls {
    order: 2;
  }
  .music-progress-container {
    order: 3;
    width: 100%;
    margin-top: 0.4rem;
  }
  .music-volume-group {
    order: 4;
    width: 100%;
    justify-content: center;
    margin-top: 0.4rem;
  }
}
`;
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  function formatTime(seconds){
    if(!seconds || isNaN(seconds)) return '0:00';
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  document.addEventListener('DOMContentLoaded', function(){
    injectCSS();

    var state = loadState();
    var currentTrackIndex = state.trackIndex;
    var isPlaying = state.playing || false;
    var wasPlaying = state.playing || false;

    // Create HTML
    var playerDiv = document.createElement('div');
    playerDiv.id = 'floating-audio-player';
    playerDiv.innerHTML = `
      <button class="music-btn" id="music-play-btn" title="Reproducir/Pausa">▶</button>
      <div class="music-selector-group">
        <select id="music-track-select"></select>
      </div>
      <div class="music-progress-container">
        <div class="music-progress-bar" id="music-progress-bar">
          <div class="music-progress-fill" id="music-progress-fill"></div>
        </div>
      </div>
      <div class="music-volume-group">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M15.54 5.54a9 9 0 0 1 0 12.92"></path>
          <path d="M19.07 4.93a16 16 0 0 1 0 14.14"></path>
        </svg>
        <input type="range" id="music-volume-slider" min="0" max="100" value="70">
        <div class="music-volume-value" id="music-volume-value">70%</div>
      </div>
      <button class="music-btn" id="music-next-btn" title="Siguiente">⏭</button>
    `;
    document.body.appendChild(playerDiv);

    // Create audio element
    var audio = document.createElement('audio');
    audio.id = 'music-audio';
    audio.style.display = 'none';
    document.body.appendChild(audio);

    // Get references
    var selectTrack = document.getElementById('music-track-select');
    var playBtn = document.getElementById('music-play-btn');
    var nextBtn = document.getElementById('music-next-btn');
    var volumeSlider = document.getElementById('music-volume-slider');
    var volumeValue = document.getElementById('music-volume-value');
    var progressBar = document.getElementById('music-progress-bar');
    var progressFill = document.getElementById('music-progress-fill');

    // Populate select
    playlist.forEach(function(track, idx){
      var option = document.createElement('option');
      option.value = idx;
      option.textContent = track.title;
      selectTrack.appendChild(option);
    });

    function loadTrack(idx){
      if(idx < 0 || idx >= playlist.length) return;
      currentTrackIndex = idx;
      selectTrack.value = idx;
      var track = playlist[idx];
      audio.src = encodeURI(track.file);
      saveState(currentTrackIndex, isPlaying, audio.currentTime, audio.volume);
    }

    function updateUI(){
      playBtn.textContent = audio.paused ? '▶' : '⏸';
      if(audio.duration){
        var percent = (audio.currentTime / audio.duration) * 100;
        progressFill.style.width = percent + '%';
      }
    }

    // Event listeners
    playBtn.addEventListener('click', function(){
      if(audio.paused){
        audio.play().catch(function(e){ console.warn('Play failed:', e); });
      } else {
        audio.pause();
      }
    });

    nextBtn.addEventListener('click', function(){
      loadTrack(currentTrackIndex + 1);
    });

    selectTrack.addEventListener('change', function(){
      loadTrack(parseInt(this.value, 10));
    });

    volumeSlider.addEventListener('input', function(){
      var vol = parseFloat(this.value) / 100;
      audio.volume = vol;
      volumeValue.textContent = this.value + '%';
      saveState(currentTrackIndex, !audio.paused, audio.currentTime, audio.volume);
    });

    progressBar.addEventListener('click', function(e){
      if(!audio.duration) return;
      var rect = progressBar.getBoundingClientRect();
      var percent = (e.clientX - rect.left) / rect.width;
      audio.currentTime = percent * audio.duration;
    });

    audio.addEventListener('play', function(){ isPlaying = true; updateUI(); saveState(currentTrackIndex, true, audio.currentTime, audio.volume); });
    audio.addEventListener('pause', function(){ isPlaying = false; updateUI(); saveState(currentTrackIndex, false, audio.currentTime, audio.volume); });
    audio.addEventListener('timeupdate', updateUI);
    audio.addEventListener('loadedmetadata', updateUI);
    audio.addEventListener('ended', function(){
      if(currentTrackIndex < playlist.length - 1){
        loadTrack(currentTrackIndex + 1);
        audio.play().catch(function(e){});
      } else {
        isPlaying = false;
        updateUI();
      }
    });

    audio.addEventListener('error', function(){
      console.error('Audio error:', audio.error);
    });

    // Initialize
    audio.volume = state.volume;
    volumeSlider.value = Math.round(state.volume * 100);
    volumeValue.textContent = Math.round(state.volume * 100) + '%';
    loadTrack(currentTrackIndex);

    // Listen for changes from other tabs/pages
    window.addEventListener('storage', function(e){
      if(e.key === STORAGE_KEY){
        var newState = JSON.parse(e.newValue || '{}');
        if(newState.trackIndex !== undefined){
          currentTrackIndex = newState.trackIndex;
          selectTrack.value = currentTrackIndex;
          audio.src = encodeURI(playlist[currentTrackIndex].file);
        }
        if(newState.time !== undefined){
          audio.currentTime = newState.time;
        }
        if(newState.volume !== undefined){
          audio.volume = newState.volume;
          volumeSlider.value = Math.round(newState.volume * 100);
          volumeValue.textContent = Math.round(newState.volume * 100) + '%';
        }
        if(newState.playing && audio.paused){
          setTimeout(function(){ audio.play().catch(function(e){}); }, 100);
        }
        if(!newState.playing && !audio.paused){
          audio.pause();
        }
      }
    });

    // Delay playback start slightly to let audio load
    window.addEventListener('load', function(){
      if(wasPlaying && audio.paused){
        setTimeout(function(){
          if(state.time && state.time > 0){
            audio.currentTime = state.time;
          }
          audio.play().catch(function(e){
            console.log('Autoplay prevented by browser');
          });
        }, 200);
      }
    });

    // Save state periodically
    setInterval(function(){
      saveState(currentTrackIndex, !audio.paused, audio.currentTime, audio.volume);
    }, 1000);

    // Save state on unload
    window.addEventListener('beforeunload', function(){
      saveState(currentTrackIndex, !audio.paused, audio.currentTime, audio.volume);
    });

    // Force save on visibility change (when tab becomes inactive)
    document.addEventListener('visibilitychange', function(){
      if(document.hidden){
        saveState(currentTrackIndex, !audio.paused, audio.currentTime, audio.volume);
      }
    });
  });
})();
