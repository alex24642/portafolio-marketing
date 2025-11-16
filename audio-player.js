/* Audio Player: injects a floating player with playlist support and syncs play state/time via localStorage
   Usage: add <script src="audio-player.js"></script> to every HTML page.
   Configure playlist in window.SITE_PLAYLIST before loading this script.
*/
(function(){
  var AUDIO_KEY = 'site_audio_state_v2';
  var SAVE_INTERVAL = 2000; // ms
  
  // Default playlist: reemplaza con tus links de YouTube o MP3
  var defaultPlaylist = [
    {title: 'Sueño Fugaz', url: 'https://www.youtube.com/embed/uKATwfkZCDI?autoplay=1'},
    {title: 'Sin un Corazón', url: 'https://www.youtube.com/embed/Qwlzp5bLjZA?autoplay=1'},
    {title: 'Fly Me to the Moon', url: 'https://www.youtube.com/embed/gtI9tITk5Fg?autoplay=1'},
    {title: 'Las Noches', url: 'https://www.youtube.com/embed/3ShkWzG7tFs?autoplay=1'}
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
        <div id="ap-progress-wrap">
          <input id="ap-progress" type="range" min="0" max="100" value="0" step="0.1">
        </div>
      </div>
      <button id="ap-mute" aria-label="Silenciar">🔊</button>
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
#floating-audio-player{position:fixed;right:1rem;bottom:1rem;display:flex;align-items:center;gap:0.6rem;background:rgba(0,0,0,0.6);padding:0.5rem 0.7rem;border-radius:999px;border:1px solid rgba(255,255,255,0.06);backdrop-filter:blur(6px);z-index:2000}
#floating-audio-player button{background:none;border:none;color:var(--text);font-size:1rem;padding:0.35rem;cursor:pointer}
#ap-info{display:flex;flex-direction:column;min-width:180px;max-width:280px;gap:0.4rem}
#ap-title{font-weight:600;color:var(--secondary);font-size:0.95rem}
#ap-playlist-select select{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:var(--text);border-radius:6px;padding:0.35rem;font-size:0.85rem;cursor:pointer}
#ap-progress-wrap{margin-top:0.2rem}
#ap-progress{width:100%;height:4px;cursor:pointer}
@media(max-width:600px){#floating-audio-player{right:0.6rem;left:0.6rem;bottom:0.8rem;flex-wrap:wrap}#ap-info{min-width:auto}}
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

    var state = loadState();
    audio.volume = state.volume != null ? state.volume : 1;
    currentTrackIndex = state.trackIndex || 0;

    function loadTrack(index){
      if(index < 0 || index >= playlist.length) return;
      currentTrackIndex = index;
      audio.src = playlist[index].url;
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
        audio.play().catch(function(e){ console.log('Autoplay blocked:', e); }); 
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

    // Play/Pause events
    audio.addEventListener('play', function(){ updateToggle(); state.playing = true; saveState(state); });
    audio.addEventListener('pause', function(){ updateToggle(); state.playing = false; saveState(state); });

    // Progress bar
    audio.addEventListener('timeupdate', function(){ progress.value = audio.currentTime; });
    progress.addEventListener('input', function(){ 
      try{ audio.currentTime = progress.value; }catch(e){} 
    });

    // Auto-play next track when current ends
    audio.addEventListener('ended', function(){
      if(currentTrackIndex < playlist.length - 1){
        loadTrack(currentTrackIndex + 1);
        audio.play().catch(function(e){});
      }
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
