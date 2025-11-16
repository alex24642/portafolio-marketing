/* Audio Player: injects a floating player with playlist support and syncs play state/time via localStorage
   Usage: add <script src="audio-player.js"></script> to every HTML page.
   Configure playlist in window.SITE_PLAYLIST before loading this script.
*/
(function(){
  var AUDIO_KEY = 'site_audio_state_v2';
  var SAVE_INTERVAL = 2000; // ms
  
  // Default playlist: reemplaza con tus archivos MP3 locales o URLs directas a MP3
  var defaultPlaylist = [
    {title: 'Sueño Fugaz', url: 'musica/PARIS The Prince - Fleeting Dream (musica1).mp3'},
    {title: 'Sin un Corazón', url: 'musica/Cuco - Sin Un Corazon (musica2).mp3'},
    {title: 'Fly Me to the Moon', url: 'musica/Fly Me to the Moon (musica3).mp3'},
    {title: 'Las Noches', url: 'musica/Junior H - LAS NOCHES (musica4).mp3'}
  ];
  
  var playlist = window.SITE_PLAYLIST || defaultPlaylist;
  var currentTrackIndex = 0;

  function createPlayer(){
    var container = document.createElement('div');
    container.id = 'floating-audio-player';
    container.innerHTML = `
      <button id="ap-toggle" aria-label="Play/Pausa">▶</button>
      <div id="ap-info">
        <div id="ap-title">Música</div>
        <div id="ap-playlist-select">
          <select id="ap-track-select" aria-label="Seleccionar canción">
            ${playlist.map((track, i) => `<option value="${i}">${track.title}</option>`).join('')}
          </select>
        </div>
      </div>
      <div id="ap-progress-wrap">
        <input id="ap-progress" type="range" min="0" max="100" value="0" step="0.1">
      </div>
      <div class="ap-volume-group">
        <button id="ap-mute" aria-label="Silenciar">🔊</button>
        <input id="ap-volume-slider" type="range" min="0" max="100" value="70">
        <div class="ap-volume-value" id="ap-volume-value">70%</div>
      </div>
      <button id="ap-next" aria-label="Siguiente">⏭</button>
    `;
    document.body.appendChild(container);

    var audio = document.createElement('audio');
    audio.id = 'ap-audio';
    audio.preload = 'auto';
    audio.loop = false;
    audio.style.display = 'none';
    document.body.appendChild(audio);

    return {container: container, audio: audio};
  }

  function loadState(){
    try{
      var raw = localStorage.getItem(AUDIO_KEY);
      return raw ? JSON.parse(raw) : {time:0,playing:false,volume:1,trackIndex:0};
    }catch(e){return {time:0,playing:false,volume:1,trackIndex:0};}
  }
  function saveState(state){
    try{ localStorage.setItem(AUDIO_KEY, JSON.stringify(state)); }catch(e){}
  }

  // inject styles
  function injectStyles(){
    var css = `
#floating-audio-player{
  position:fixed;
  right:1.5rem;
  bottom:1.5rem;
  display:flex;
  align-items:center;
  gap:0.7rem;
  background:rgba(30, 30, 45, 0.92);
  padding:0.6rem 0.9rem;
  border-radius:50px;
  border:1px solid rgba(125,211,252,0.35);
  backdrop-filter:blur(10px);
  z-index:2000;
  width:auto;
  max-width:520px;
  box-shadow:0 8px 32px rgba(0,0,0,0.5)
}
#floating-audio-player button{
  background:rgba(125,211,252,0.12);
  border:1px solid rgba(125,211,252,0.25);
  color:#fff;
  font-size:0.75rem;
  padding:0.38rem 0.5rem;
  cursor:pointer;
  border-radius:18px;
  transition:all 0.2s;
  white-space:nowrap;
  font-weight:600
}
#floating-audio-player button:hover{
  background:rgba(125,211,252,0.25);
  border-color:rgba(125,211,252,0.5)
}
#floating-audio-player button:active{
  transform:scale(0.92)
}
#ap-info{
  display:flex;
  flex-direction:column;
  min-width:180px;
  max-width:280px;
  gap:0.4rem
}
#ap-title{
  font-weight:600;
  color:#7dd3fc;
  font-size:0.95rem
}
#ap-playlist-select select{
  background:rgba(255,255,255,0.05);
  border:1px solid rgba(125,211,252,0.25);
  color:#fff;
  border-radius:20px;
  padding:0.4rem 0.6rem;
  font-size:0.85rem;
  cursor:pointer;
  transition:all 0.2s;
  min-width:140px
}
#ap-playlist-select select:hover,#ap-playlist-select select:focus{
  outline:none;
  border-color:#7dd3fc;
  background:rgba(125,211,252,0.1)
}
#ap-playlist-select select option{
  background:#1a1a2e;
  color:#fff;
  padding:0.4rem
}
#ap-progress-wrap{
  margin-top:0.2rem;
  flex:1;
  min-width:120px;
  margin-right:0.5rem
}
#ap-progress{
  width:100%;
  height:5px;
  cursor:pointer;
  background:rgba(125,211,252,0.15);
  border-radius:3px;
  -webkit-appearance:none;
  appearance:none;
  border:none
}
#ap-progress::-webkit-slider-thumb{
  -webkit-appearance:none;
  appearance:none;
  width:11px;
  height:11px;
  background:#7dd3fc;
  border-radius:50%;
  cursor:pointer;
  border:1.5px solid rgba(125,211,252,0.6);
  box-shadow:0 2px 6px rgba(125,211,252,0.3)
}
#ap-progress::-moz-range-thumb{
  width:11px;
  height:11px;
  background:#7dd3fc;
  border-radius:50%;
  cursor:pointer;
  border:1.5px solid rgba(125,211,252,0.6);
  box-shadow:0 2px 6px rgba(125,211,252,0.3)
}
#ap-progress::-moz-range-track{
  background:transparent;
  border:none
}
.ap-volume-group{
  display:flex;
  align-items:center;
  gap:0.3rem;
  margin:0;
  flex:0 0 auto
}
#ap-mute{
  padding:0.38rem 0.5rem;
  font-size:0.9rem
}
#ap-volume-slider{
  width:70px;
  height:4px;
  background:rgba(125,211,252,0.15);
  border-radius:2px;
  cursor:pointer;
  -webkit-appearance:none;
  appearance:none;
  border:none
}
#ap-volume-slider::-webkit-slider-thumb{
  -webkit-appearance:none;
  appearance:none;
  width:11px;
  height:11px;
  background:#7dd3fc;
  border-radius:50%;
  cursor:pointer;
  border:1.5px solid rgba(125,211,252,0.6);
  box-shadow:0 2px 6px rgba(125,211,252,0.3)
}
#ap-volume-slider::-moz-range-thumb{
  width:11px;
  height:11px;
  background:#7dd3fc;
  border-radius:50%;
  cursor:pointer;
  border:1.5px solid rgba(125,211,252,0.6);
  box-shadow:0 2px 6px rgba(125,211,252,0.3)
}
#ap-volume-slider::-moz-range-track{
  background:transparent;
  border:none
}
.ap-volume-value{
  font-size:0.7rem;
  color:#7dd3fc;
  min-width:22px;
  text-align:center;
  font-weight:600
}
@media(max-width:600px){
  #floating-audio-player{
    right:0.8rem;
    left:0.8rem;
    bottom:0.8rem;
    width:calc(100% - 1.6rem);
    flex-wrap:wrap;
    justify-content:center
  }
  #ap-info{
    order:1;
    min-width:100px
  }
  #ap-progress-wrap{
    order:3;
    width:100%;
    margin-right:0;
    margin-top:0.4rem
  }
  .ap-volume-group{
    order:4;
    width:100%;
    justify-content:center;
    margin-top:0.4rem
  }
}
`;
    var s = document.createElement('style'); s.appendChild(document.createTextNode(css));
    document.head.appendChild(s);
  }

  // main
  document.addEventListener('DOMContentLoaded', function(){
    injectStyles();
    var parts = createPlayer();
    var audio = parts.audio;
    var toggle = document.getElementById('ap-toggle');
    var mute = document.getElementById('ap-mute');
    var progress = document.getElementById('ap-progress');
    var title = document.getElementById('ap-title');
    var trackSelect = document.getElementById('ap-track-select');
    var volumeSlider = document.getElementById('ap-volume-slider');
    var volumeValue = document.getElementById('ap-volume-value');
    var nextBtn = document.getElementById('ap-next');

    var state = loadState();
    audio.volume = state.volume != null ? state.volume : 1;
    currentTrackIndex = state.trackIndex || 0;

    // Initialize volume display
    volumeSlider.value = Math.round(audio.volume * 100);
    volumeValue.textContent = Math.round(audio.volume * 100) + '%';

    function loadTrack(index){
      if(index < 0 || index >= playlist.length) return;
      currentTrackIndex = index;
      // Encode the URL to handle spaces and special characters
      try {
        var src = encodeURI(playlist[index].url);
        audio.src = src;
      } catch (err) {
        audio.src = playlist[index].url;
      }
      title.textContent = playlist[index].title;
      trackSelect.value = index;
      state.trackIndex = index;
      saveState(state);
    }

    function updateToggle(){ toggle.textContent = audio.paused ? '▶' : '⏸'; }
    
    // Load initial track
    loadTrack(currentTrackIndex);
    updateToggle();

    // On metadata load
    audio.addEventListener('loadedmetadata', function(){
      if(state.time && state.time < audio.duration - 1){ 
        try{ audio.currentTime = state.time; }catch(e){}
      }
      progress.max = audio.duration || 100;
    });

    // Play/Pause toggle
    toggle.addEventListener('click', function(){
      if(audio.paused){ 
        audio.play().catch(function(e){ console.log('Autoplay blocked:', e); title.textContent = 'Pulse ▶ para reproducir (autoplay bloqueado)'; });
      } else { 
        audio.pause(); 
      }
    });

    // Mute toggle
    mute.addEventListener('click', function(){ 
      audio.muted = !audio.muted; 
      mute.textContent = audio.muted ? '🔇' : '🔊'; 
    });

    // Track selection
    trackSelect.addEventListener('change', function(){
      var newIndex = parseInt(this.value);
      loadTrack(newIndex);
      audio.play().catch(function(e){});
    });

    // Volume control
    volumeSlider.addEventListener('input', function(){
      var vol = parseFloat(this.value) / 100;
      audio.volume = vol;
      volumeValue.textContent = this.value + '%';
      state.volume = vol;
      saveState(state);
    });

    // Next button
    nextBtn.addEventListener('click', function(){
      if(currentTrackIndex < playlist.length - 1){
        loadTrack(currentTrackIndex + 1);
        audio.play().catch(function(e){});
      }
    });

    // Play/Pause events
    audio.addEventListener('play', function(){ updateToggle(); state.playing = true; saveState(state); });
    audio.addEventListener('pause', function(){ updateToggle(); state.playing = false; saveState(state); });

    // Progress bar
    audio.addEventListener('timeupdate', function(){ progress.value = audio.currentTime; });
    progress.addEventListener('input', function(){ 
      try{ audio.currentTime = progress.value; }catch(e){} 
    });

    // Auto-play next track when current ends with crossfade
    audio.addEventListener('ended', function(){
      if(currentTrackIndex < playlist.length - 1){
        playNextTrackWithCrossfade();
      }
    });

    function playNextTrackWithCrossfade(){
      var crossfadeDuration = 10; // seconds
      var fadeSteps = 100;
      var fadeInterval = (crossfadeDuration * 1000) / fadeSteps;
      var startVolume = audio.volume;
      var step = 0;
      
      var fadeOutInterval = setInterval(function(){
        step++;
        var progress = step / fadeSteps;
        audio.volume = startVolume * (1 - progress);
        
        if(step >= fadeSteps){
          clearInterval(fadeOutInterval);
          audio.volume = 0;
          
          // Load next track
          var nextIndex = currentTrackIndex + 1;
          if(nextIndex < playlist.length){
            loadTrack(nextIndex);
            audio.play().catch(function(e){});
            
            // Fade in
            step = 0;
            var fadeInInterval = setInterval(function(){
              step++;
              var progress = step / fadeSteps;
              audio.volume = startVolume * progress;
              
              if(step >= fadeSteps){
                clearInterval(fadeInInterval);
                audio.volume = startVolume;
              }
            }, fadeInterval);
          }
        }
      }, fadeInterval);
    }

    // Error handling for audio loading/playback
    audio.addEventListener('error', function(ev){
      console.error('Audio error loading:', audio.src, audio.error, ev);
      title.textContent = 'Error cargando pista';
    });

    // Periodic save
    setInterval(function(){ 
      state.time = audio.currentTime || 0; 
      state.playing = !audio.paused; 
      state.volume = audio.volume; 
      state.trackIndex = currentTrackIndex;
      saveState(state); 
    }, SAVE_INTERVAL);

    // Restore play state if previously playing
    if(state.playing){ 
      audio.play().catch(function(e){}); 
    }

    // Save on unload
    window.addEventListener('pagehide', function(){ 
      state.time = audio.currentTime || 0; 
      state.playing = !audio.paused; 
      state.volume = audio.volume; 
      state.trackIndex = currentTrackIndex;
      saveState(state); 
    });

  });
})();
