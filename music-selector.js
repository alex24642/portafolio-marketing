// Music Selector - Reproductor flotante con selector visual
(function(){
  var STORAGE_KEY = 'music_player_state';
  
  var playlist = [
    { title: 'Sueño Fugaz', file: 'musica/PARIS The Prince - Fleeting Dream (musica1).mp3' },
    { title: 'Sin un Corazón', file: 'musica/Cuco - Sin Un Corazon (musica2).mp3' },
    { title: 'Fly Me to the Moon', file: 'musica/Fly Me to the Moon (musica3).mp3' },
    { title: 'Las Noches', file: 'musica/Junior H - LAS NOCHES (musica4).mp3' }
  ];

  function saveState(trackIndex, isPlaying, currentTime, volume){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        trackIndex: trackIndex,
        playing: isPlaying,
        time: currentTime,
        volume: volume
      }));
    }catch(e){}
  }

  function loadState(){
    try{
      var s = localStorage.getItem(STORAGE_KEY);
      return s ? JSON.parse(s) : {trackIndex: 0, playing: false, time: 0, volume: 0.7};
    }catch(e){
      return {trackIndex: 0, playing: false, time: 0, volume: 0.7};
    }
  }

  function injectCSS(){
    var css = `
#music-player-widget {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  background: linear-gradient(135deg, rgba(20,20,30,0.95), rgba(40,40,60,0.95));
  border: 1px solid rgba(100,150,255,0.3);
  border-radius: 12px;
  padding: 1rem;
  width: 320px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  backdrop-filter: blur(8px);
  z-index: 9999;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #fff;
}

#music-player-widget h3 {
  margin: 0 0 0.8rem 0;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #7dd3fc;
  font-weight: 600;
}

.music-current-track {
  background: rgba(100,150,255,0.1);
  border-left: 3px solid #7dd3fc;
  padding: 0.8rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  min-height: 40px;
  display: flex;
  align-items: center;
}

.music-current-track .track-title {
  font-weight: 600;
  font-size: 0.95rem;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.music-current-track .track-time {
  font-size: 0.75rem;
  color: #aaa;
  margin-top: 0.3rem;
}

.music-selector-group {
  margin-bottom: 1rem;
}

.music-selector-group label {
  display: block;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #aaa;
  margin-bottom: 0.5rem;
}

#music-track-select {
  width: 100%;
  padding: 0.6rem;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(100,150,255,0.2);
  color: #fff;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: border-color 0.2s;
}

#music-track-select:hover {
  border-color: rgba(100,150,255,0.5);
}

#music-track-select:focus {
  outline: none;
  border-color: #7dd3fc;
  background: rgba(100,150,255,0.1);
}

#music-track-select option {
  background: #1a1a2e;
  color: #fff;
}

.music-progress-container {
  margin-bottom: 1rem;
}

.music-progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(100,150,255,0.1);
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

.music-time-display {
  font-size: 0.75rem;
  color: #aaa;
  text-align: right;
  margin-top: 0.3rem;
}

.music-controls {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.music-btn {
  flex: 1;
  padding: 0.7rem;
  background: rgba(100,150,255,0.2);
  border: 1px solid rgba(100,150,255,0.3);
  color: #fff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.music-btn:hover {
  background: rgba(100,150,255,0.4);
  border-color: rgba(100,150,255,0.6);
}

.music-btn:active {
  transform: scale(0.95);
}

.music-btn.playing {
  background: #7dd3fc;
  color: #0a0e27;
  border-color: #7dd3fc;
}

.music-volume-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.music-volume-group label {
  font-size: 0.75rem;
  color: #aaa;
  white-space: nowrap;
  margin-bottom: 0;
}

#music-volume-slider {
  flex: 1;
  height: 6px;
  background: rgba(100,150,255,0.1);
  border-radius: 3px;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
}

#music-volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  background: #7dd3fc;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid rgba(125,211,252,0.5);
}

#music-volume-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: #7dd3fc;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid rgba(125,211,252,0.5);
}

.music-volume-value {
  font-size: 0.75rem;
  color: #7dd3fc;
  min-width: 30px;
  text-align: right;
}

@media(max-width: 480px){
  #music-player-widget {
    width: calc(100% - 2rem);
    right: 1rem;
    left: 1rem;
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
    var isPlaying = false;

    // Create HTML
    var widget = document.createElement('div');
    widget.id = 'music-player-widget';
    widget.innerHTML = `
      <h3>🎵 Música</h3>
      <div class="music-current-track">
        <div>
          <div class="track-title" id="music-now-playing">Selecciona una canción</div>
          <div class="track-time" id="music-track-time">0:00 / 0:00</div>
        </div>
      </div>
      <div class="music-selector-group">
        <label for="music-track-select">Canción:</label>
        <select id="music-track-select"></select>
      </div>
      <div class="music-progress-container">
        <div class="music-progress-bar" id="music-progress-bar">
          <div class="music-progress-fill" id="music-progress-fill"></div>
        </div>
        <div class="music-time-display" id="music-time-display">0:00 / 0:00</div>
      </div>
      <div class="music-controls">
        <button class="music-btn" id="music-prev-btn">⏮ Anterior</button>
        <button class="music-btn" id="music-play-btn">▶ Reproducir</button>
        <button class="music-btn" id="music-next-btn">Siguiente ⏭</button>
      </div>
      <div class="music-selector-group">
        <div class="music-volume-group">
          <label for="music-volume-slider">Volumen:</label>
          <input type="range" id="music-volume-slider" min="0" max="100" value="70">
          <div class="music-volume-value" id="music-volume-value">70%</div>
        </div>
      </div>
    `;
    document.body.appendChild(widget);

    // Create audio element
    var audio = document.createElement('audio');
    audio.id = 'music-audio';
    audio.style.display = 'none';
    document.body.appendChild(audio);

    // Get references
    var selectTrack = document.getElementById('music-track-select');
    var playBtn = document.getElementById('music-play-btn');
    var prevBtn = document.getElementById('music-prev-btn');
    var nextBtn = document.getElementById('music-next-btn');
    var volumeSlider = document.getElementById('music-volume-slider');
    var volumeValue = document.getElementById('music-volume-value');
    var nowPlaying = document.getElementById('music-now-playing');
    var trackTime = document.getElementById('music-track-time');
    var timeDisplay = document.getElementById('music-time-display');
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
      nowPlaying.textContent = track.title;
      saveState(currentTrackIndex, isPlaying, audio.currentTime, audio.volume);
    }

    function updateUI(){
      playBtn.textContent = audio.paused ? '▶ Reproducir' : '⏸ Pausa';
      playBtn.classList.toggle('playing', !audio.paused);
      timeDisplay.textContent = formatTime(audio.currentTime) + ' / ' + formatTime(audio.duration);
      trackTime.textContent = formatTime(audio.currentTime) + ' / ' + formatTime(audio.duration);
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

    prevBtn.addEventListener('click', function(){
      loadTrack(currentTrackIndex - 1);
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
      nowPlaying.textContent = 'Error cargando: ' + playlist[currentTrackIndex].title;
      console.error('Audio error:', audio.error);
    });

    // Initialize
    audio.volume = state.volume;
    volumeSlider.value = Math.round(state.volume * 100);
    volumeValue.textContent = Math.round(state.volume * 100) + '%';
    loadTrack(currentTrackIndex);

    // Save state periodically
    setInterval(function(){
      saveState(currentTrackIndex, !audio.paused, audio.currentTime, audio.volume);
    }, 2000);

    // Restore playback state on page load if was playing
    window.addEventListener('load', function(){
      if(state.playing && audio.paused){
        // Comment this out if you don't want autoplay
        // audio.play().catch(function(e){});
      }
    });

    // Save state on unload
    window.addEventListener('beforeunload', function(){
      saveState(currentTrackIndex, !audio.paused, audio.currentTime, audio.volume);
    });
  });
})();
