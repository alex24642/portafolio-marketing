/*
  New Audio Player
  - Dual <audio> elements for overlap/gapless 10s crossfade
  - Play/Pause, Next, Track select, Volume, Seek (progress)
  - Track select always starts playback (user requested)
  - Persistent state in localStorage (time, playing, volume, trackIndex)
  - Defensive error handling and console logs to help debugging

  Usage: include <script src="audio-player.js"></script> on pages
*/
(function(){
  'use strict';

  var STORAGE_KEY = 'site_audio_state_v3';
  var CROSSFADE_SECONDS = 10;
  var SAVE_INTERVAL = 2000; // ms

  var defaultPlaylist = [
    { title: 'Sueño Fugaz', url: 'musica/PARIS The Prince - Fleeting Dream (musica1).mp3' },
    { title: 'Sin un Corazón', url: 'musica/Cuco - Sin Un Corazon (musica2).mp3' },
    { title: 'Fly Me to the Moon', url: 'musica/Fly Me to the Moon (musica3).mp3' },
    { title: 'Las Noches', url: 'musica/Junior H - LAS NOCHES (musica4).mp3' }
  ];

  var playlist = window.SITE_PLAYLIST || defaultPlaylist;

  function loadState(){
    try{ var raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null; }catch(e){ return null; }
  }
  function saveState(state){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){} }

  function injectCSS(){
    var css = `
    #floating-audio-player{ position:fixed; right:1.2rem; bottom:1.2rem; z-index:2000; display:flex; gap:0.6rem; align-items:center; background:rgba(20,20,30,0.92); padding:0.6rem 0.9rem; border-radius:40px; border:1px solid rgba(125,211,252,0.18); backdrop-filter: blur(8px); }
    #floating-audio-player button{ width:40px; height:40px; border-radius:50%; border:1px solid rgba(255,255,255,0.06); background:rgba(255,255,255,0.03); color:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; }
    #ap-track-select{ background:transparent; color:#fff; border-radius:18px; padding:6px 10px; border:1px solid rgba(255,255,255,0.06); min-width:160px }
    #ap-progress{ width:220px }
    #ap-volume-slider{ width:90px }
    #ap-progress, #ap-volume-slider{ appearance:none; height:6px; border-radius:3px; background:rgba(125,211,252,0.12) }
    `;
    var s = document.createElement('style'); s.appendChild(document.createTextNode(css)); document.head.appendChild(s);
  }

  function createUI(){
    var container = document.createElement('div'); container.id = 'floating-audio-player';

    container.innerHTML = `
      <button id="ap-toggle" aria-label="Play/Pause">▶</button>
      <select id="ap-track-select"></select>
      <input id="ap-progress" type="range" min="0" max="100" step="0.1" value="0">
      <button id="ap-next" aria-label="Siguiente">⏭</button>
      <button id="ap-mute" aria-label="Silenciar">🔊</button>
      <input id="ap-volume-slider" type="range" min="0" max="100" step="1" value="70">
    `;

    document.body.appendChild(container);

    var select = document.getElementById('ap-track-select');
    playlist.forEach(function(t,i){ var opt = document.createElement('option'); opt.value = i; opt.textContent = t.title; select.appendChild(opt); });

    // create two audio elements
    var a = document.createElement('audio'); a.preload = 'auto'; a.style.display = 'none'; a.id = 'ap-a';
    var b = document.createElement('audio'); b.preload = 'auto'; b.style.display = 'none'; b.id = 'ap-b';
    document.body.appendChild(a); document.body.appendChild(b);

    return { container: container, toggle: container.querySelector('#ap-toggle'), select: select, progress: container.querySelector('#ap-progress'), next: container.querySelector('#ap-next'), mute: container.querySelector('#ap-mute'), volume: container.querySelector('#ap-volume-slider'), audioA: a, audioB: b };
  }

  // Replace old player with new one
  document.addEventListener('DOMContentLoaded', function(){
    injectCSS();
    var ui = createUI();
    var audioA = ui.audioA, audioB = ui.audioB;
    var active = audioA, inactive = audioB;
    var state = loadState() || { time:0, playing:false, volume:0.7, trackIndex:0 };
    var isCrossfading = false;

    // initialize volumes
    active.volume = inactive.volume = (state.volume != null ? state.volume : 0.7);
    ui.volume.value = Math.round(active.volume * 100);

    function setToggleText(){ ui.toggle.textContent = active.paused ? '▶' : '⏸'; }

    // helper: set sources on audio element
    function setSources(el, url){
      el.pause();
      while(el.firstChild) el.removeChild(el.firstChild);
      var s1 = document.createElement('source'); s1.type='audio/mpeg'; s1.src = url; el.appendChild(s1);
      var s2 = document.createElement('source'); s2.type='audio/mpeg'; s2.src = encodeURI(url); el.appendChild(s2);
      try{ el.load(); }catch(e){ console.warn('audio.load failed', e); }
    }

    // load initially into active and prefetch next into inactive
    function loadInitial(i){
      state.trackIndex = i; saveState(state);
      setSources(active, playlist[i].url);
      ui.select.value = i;
      // try set time after metadata
      active.addEventListener('loadedmetadata', function once(){
        active.removeEventListener('loadedmetadata', once);
        if(state.time && state.time < active.duration - 1) try{ active.currentTime = state.time; }catch(e){}
      });
      // prefetch next
      var next = (i+1) % playlist.length; setSources(inactive, playlist[next].url);
    }

    // crossfade overlap from active -> targetIndex
    function crossfadeTo(targetIndex){
      if(isCrossfading) return; isCrossfading = true;
      var startVol = active.volume || 0.7;
      var steps = 100; var interval = (CROSSFADE_SECONDS*1000)/steps; var step=0;

      // prepare inactive with target
      setSources(inactive, playlist[targetIndex].url);
      inactive.volume = 0; inactive.currentTime = 0;

      var startInactive = function(){
        // start playback of inactive
        var p = inactive.play(); if(p && p.catch) p.catch(function(e){ console.log('inactive.play failed', e); });

        var fade = setInterval(function(){
          step++; var prog = step/steps;
          try{ active.volume = Math.max(0, startVol * (1-prog)); }catch(e){}
          try{ inactive.volume = Math.min(startVol, startVol * prog); }catch(e){}
          if(step >= steps){ clearInterval(fade);
            try{ active.pause(); }catch(e){}
            // swap
            var old = active; active = inactive; inactive = old;
            state.trackIndex = targetIndex; saveState(state);
            setToggleText(); isCrossfading = false;
            // prefetch following track
            var n = (state.trackIndex + 1) % playlist.length; setSources(inactive, playlist[n].url); inactive.volume = active.volume;
          }
        }, interval);
      };

      // wait for inactive to be ready (canplay) or call directly if readyState
      if(inactive.readyState >= 3){ startInactive(); } else {
        var onCan = function(){ inactive.removeEventListener('canplay', onCan); startInactive(); };
        inactive.addEventListener('canplay', onCan);
      }
    }

    // automatic scheduling: when remaining time <= CROSSFADE_SECONDS, start crossfade to next
    function scheduleAutoCrossfade(){
      if(!active.duration || isNaN(active.duration)) return;
      var remaining = active.duration - active.currentTime;
      if(!isCrossfading && remaining <= CROSSFADE_SECONDS && remaining > 0){
        var nextIdx = (state.trackIndex + 1) % playlist.length; crossfadeTo(nextIdx);
      }
    }

    // UI handlers
    ui.toggle.addEventListener('click', function(){
      if(active.paused){ var p = active.play(); if(p && p.catch) p.catch(function(e){ console.log('play failed', e); }); }
      else active.pause();
      setToggleText();
    });

    ui.next.addEventListener('click', function(){ var next = (state.trackIndex+1)%playlist.length; crossfadeTo(next); });

    ui.select.addEventListener('change', function(){ var i = parseInt(this.value,10); if(isNaN(i)) return; // user requested selection should always play
      // If playing -> crossfade, else load and play
      if(!active.paused){ crossfadeTo(i); } else { loadInitial(i); var p = active.play(); if(p && p.catch) p.catch(function(e){ console.log('play failed', e); }); setToggleText(); }
    });

    ui.volume.addEventListener('input', function(){ var v = parseInt(this.value,10)/100; active.volume = inactive.volume = v; state.volume = v; saveState(state); });

    // progress/seek
    ui.progress.addEventListener('input', function(){ try{ active.currentTime = parseFloat(this.value);}catch(e){} });
    ui.progress.addEventListener('change', function(){ try{ active.currentTime = parseFloat(this.value);}catch(e){} });

    // sync progress UI
    active.addEventListener('timeupdate', function(){ ui.progress.max = active.duration || 100; ui.progress.value = active.currentTime || 0; scheduleAutoCrossfade(); });
    // reflect play/pause
    active.addEventListener('play', function(){ setToggleText(); state.playing = true; saveState(state); });
    active.addEventListener('pause', function(){ setToggleText(); state.playing = false; saveState(state); });

    // error logging
    function logError(ev){ var el = ev.target || this; console.error('Audio error', el.id, el.currentSrc, el.error); }
    audioA.addEventListener('error', logError); audioB.addEventListener('error', logError);

    // Save periodically
    setInterval(function(){ try{ state.time = active.currentTime || 0; }catch(e){ state.time = 0; } state.playing = !active.paused; state.volume = active.volume; state.trackIndex = state.trackIndex; saveState(state); }, SAVE_INTERVAL);

    // Save on unload
    window.addEventListener('pagehide', function(){ try{ state.time = active.currentTime || 0; }catch(e){ state.time = 0; } state.playing = !active.paused; saveState(state); });

    // initialize
    loadInitial(state.trackIndex || 0);
    // if was playing before, try to play now (may be blocked until user interacts)
    if(state.playing){ setTimeout(function(){ try{ var p = active.play(); if(p && p.catch) p.catch(function(e){ console.log('autoplay restore failed', e); }); }catch(e){} }, 120); }

    // expose for debugging
    window.__siteAudio = { ui: ui, activeAudio: function(){ return active; }, inactiveAudio: function(){ return inactive; }, playlist: playlist };
    setToggleText();
  });
})();
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
        <div id="ap-playlist-select">
          <select id="ap-track-select" aria-label="Seleccionar canción">
            ${playlist.map((track, i) => `<option value="${i}">${track.title}</option>`).join('')}
          </select>
        </div>
      </div>
      <div id="ap-progress-wrap">
        <input id="ap-progress" type="range" min="0" max="100" value="0" step="0.1">
      </div>
      <button id="ap-mute" aria-label="Silenciar">🔊</button>
      <div class="ap-volume-group">
        <input id="ap-volume-slider" type="range" min="0" max="100" value="70">
        <div class="ap-volume-value" id="ap-volume-value">22%</div>
      </div>
      <button id="ap-next" aria-label="Siguiente">⏭</button>
    `;
    document.body.appendChild(container);

    // Create two audio elements to enable gapless crossfade by overlapping playback
    var audioA = document.createElement('audio');
    audioA.id = 'ap-audio-a';
    audioA.preload = 'auto';
    audioA.loop = false;
    audioA.style.display = 'none';
    document.body.appendChild(audioA);

    var audioB = document.createElement('audio');
    audioB.id = 'ap-audio-b';
    audioB.preload = 'auto';
    audioB.loop = false;
    audioB.style.display = 'none';
    document.body.appendChild(audioB);

    return {container: container, audioA: audioA, audioB: audioB};
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
  max-width:none;
  box-shadow:0 8px 32px rgba(0,0,0,0.5);
  flex-wrap:nowrap
}
#floating-audio-player button{
  background:rgba(125,211,252,0.12);
  border:1px solid rgba(125,211,252,0.25);
  color:#fff;
  font-size:0.9rem;
  padding:0.5rem 0.6rem;
  cursor:pointer;
  border-radius:50%;
  transition:all 0.2s;
  white-space:nowrap;
  font-weight:600;
  width:40px;
  height:40px;
  display:flex;
  align-items:center;
  justify-content:center;
  flex-shrink:0
}
#floating-audio-player button:hover{
  background:rgba(125,211,252,0.25);
  border-color:rgba(125,211,252,0.5)
}
#ap-info{
  display:flex;
  align-items:center;
  gap:0.6rem;
  flex-shrink:0
}
#ap-title{
  display:none
}
#ap-playlist-select select{
  background:rgba(255,255,255,0.05);
  border:1px solid rgba(125,211,252,0.25);
  color:#fff;
  border-radius:20px;
  padding:0.5rem 0.8rem;
  font-size:0.9rem;
  cursor:pointer;
  transition:all 0.2s;
  min-width:150px;
  font-family:inherit
}
#ap-playlist-select select:hover,#ap-playlist-select select:focus{
  outline:none;
  border-color:#7dd3fc;
  background:rgba(125,211,252,0.1)
}
#ap-playlist-select select option{
  background:#1a1a2e;
  color:#fff;
  padding:0.6rem
}
#ap-progress-wrap{
  flex:1;
  min-width:150px;
  display:flex;
  align-items:center;
  height:auto
}
#ap-progress{
  width:100%;
  height:6px;
  cursor:pointer;
  background:rgba(125,211,252,0.15);
  border-radius:3px;
  -webkit-appearance:none;
  appearance:none;
  border:none;
  outline:none
}
#ap-progress::-webkit-slider-thumb{
  -webkit-appearance:none;
  appearance:none;
  width:14px;
  height:14px;
  background:#7dd3fc;
  border-radius:50%;
  cursor:pointer;
  border:none;
  box-shadow:0 2px 6px rgba(125,211,252,0.4)
}
#ap-progress::-moz-range-thumb{
  width:14px;
  height:14px;
  background:#7dd3fc;
  border-radius:50%;
  cursor:pointer;
  border:none;
  box-shadow:0 2px 6px rgba(125,211,252,0.4)
}
#ap-progress::-moz-range-track{
  background:transparent;
  border:none
}
#ap-mute{
  width:40px;
  height:40px;
  padding:0;
  border-radius:50%
}
.ap-volume-group{
  display:flex;
  align-items:center;
  gap:0.5rem;
  margin:0;
  flex:0 0 auto
}
#ap-volume-slider{
  width:80px;
  height:6px;
  background:rgba(125,211,252,0.15);
  border-radius:3px;
  cursor:pointer;
  -webkit-appearance:none;
  appearance:none;
  border:none;
  outline:none
}
#ap-volume-slider::-webkit-slider-thumb{
  -webkit-appearance:none;
  appearance:none;
  width:14px;
  height:14px;
  background:#7dd3fc;
  border-radius:50%;
  cursor:pointer;
  border:none;
  box-shadow:0 2px 6px rgba(125,211,252,0.4)
}
#ap-volume-slider::-moz-range-thumb{
  width:14px;
  height:14px;
  background:#7dd3fc;
  border-radius:50%;
  cursor:pointer;
  border:none;
  box-shadow:0 2px 6px rgba(125,211,252,0.4)
}
#ap-volume-slider::-moz-range-track{
  background:transparent;
  border:none
}
.ap-volume-value{
  font-size:0.75rem;
  color:#7dd3fc;
  min-width:28px;
  text-align:center;
  font-weight:600
}
#ap-next{
  width:40px;
  height:40px;
  padding:0;
  border-radius:50%
}
@media(max-width:1200px){
  #floating-audio-player{
    right:1rem;
    bottom:1rem
  }
  #ap-playlist-select select{
    min-width:130px;
    font-size:0.85rem
  }
  #ap-progress-wrap{
    min-width:120px
  }
}
@media(max-width:800px){
  #floating-audio-player{
    right:0.8rem;
    bottom:0.8rem;
    gap:0.5rem;
    padding:0.5rem 0.7rem
  }
  #ap-playlist-select select{
    min-width:110px;
    padding:0.4rem 0.6rem;
    font-size:0.8rem
  }
  #floating-audio-player button{
    width:36px;
    height:36px;
    font-size:0.85rem;
    padding:0.4rem
  }
  #ap-progress-wrap{
    min-width:100px
  }
  #ap-volume-slider{
    width:60px
  }
  .ap-volume-value{
    font-size:0.7rem;
    min-width:24px
  }
}
@media(max-width:600px){
  #floating-audio-player{
    right:0.6rem;
    bottom:0.6rem;
    left:0.6rem;
    width:calc(100% - 1.2rem);
    gap:0.4rem;
    padding:0.4rem 0.6rem
  }
  #ap-playlist-select select{
    min-width:100px;
    padding:0.35rem 0.5rem;
    font-size:0.75rem
  }
  #floating-audio-player button{
    width:32px;
    height:32px;
    font-size:0.8rem;
    padding:0.3rem
  }
  #ap-progress-wrap{
    min-width:80px
  }
  #ap-volume-slider{
    width:50px
  }
  .ap-volume-value{
    font-size:0.65rem;
    min-width:20px
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
    var audioA = parts.audioA;
    var audioB = parts.audioB;
    // activeAudio is the one currently considered the "main" for controls/progress
    var activeAudio = audioA;
    var inactiveAudio = audioB;
    var isCrossfading = false;
    var toggle = document.getElementById('ap-toggle');
    var mute = document.getElementById('ap-mute');
    var progress = document.getElementById('ap-progress');
    var title = document.getElementById('ap-title');
    var trackSelect = document.getElementById('ap-track-select');
    var volumeSlider = document.getElementById('ap-volume-slider');
    var volumeValue = document.getElementById('ap-volume-value');
    var nextBtn = document.getElementById('ap-next');

    var state = loadState();
    // initialize both audio volumes
    audioA.volume = audioB.volume = (state.volume != null ? state.volume : 0.7);
    currentTrackIndex = state.trackIndex || 0;

    // Initialize volume display (use activeAudio)
    volumeSlider.value = Math.round(activeAudio.volume * 100);
    volumeValue.textContent = Math.round(activeAudio.volume * 100) + '%';

    // Load a track into a specific audio element (used for overlapping playback)
    function loadTrackInto(audioElement, index){
      if(index < 0 || index >= playlist.length) return;
      var baseUrl = playlist[index].url;
      audioElement.innerHTML = '';
      var source = document.createElement('source'); source.type = 'audio/mpeg'; source.src = baseUrl; audioElement.appendChild(source);
      var source2 = document.createElement('source'); source2.type = 'audio/mpeg'; source2.src = encodeURI(baseUrl); audioElement.appendChild(source2);
      try{ audioElement.load(); }catch(e){ console.warn('loadTrackInto: load failed', e); }
      console.log('Loaded into element:', audioElement.id, playlist[index].title, baseUrl);
    }

    // Convenience: load track into inactive audio and update UI state (does not swap active)
    function loadTrack(index){
      if(index < 0 || index >= playlist.length) return;
      currentTrackIndex = index;
      loadTrackInto(activeAudio, index);
      trackSelect.value = index;
      state.trackIndex = index; saveState(state);
    }

    function updateToggle(){ toggle.textContent = activeAudio.paused ? '▶' : '⏸'; }
    
    // Load initial track
    loadTrack(currentTrackIndex);
    updateToggle();

    // On metadata load for active audio
    function onActiveLoadedMetadata(){
      if(state.time && state.time < activeAudio.duration - 1){ 
        try{ activeAudio.currentTime = state.time; }catch(e){}
      }
      progress.max = activeAudio.duration || 100;
    }
    activeAudio.addEventListener('loadedmetadata', onActiveLoadedMetadata);

    // Also update progress max when inactive loads (useful when preparing next track)
    function onInactiveLoadedMetadata(){
      // no-op for now
    }
    inactiveAudio.addEventListener('loadedmetadata', onInactiveLoadedMetadata);

    // Play/Pause toggle operating on activeAudio
    toggle.addEventListener('click', function(){
      if(activeAudio.paused){ 
        var playPromise = activeAudio.play();
        if(playPromise !== undefined) {
          playPromise.catch(function(e){ 
            console.log('Autoplay blocked or error:', e); 
            activeAudio.muted = true;
            activeAudio.play().catch(function(e2){ console.log('Even muted play failed:', e2); });
          });
        }
      } else { 
        activeAudio.pause(); 
      }
    });

    // Mute toggle (toggles both audio elements)
    mute.addEventListener('click', function(){ 
      var newMuted = !activeAudio.muted;
      audioA.muted = audioB.muted = newMuted;
      mute.textContent = newMuted ? '🔇' : '🔊'; 
    });

    // Track selection
    trackSelect.addEventListener('change', function(){
      var newIndex = parseInt(this.value);
      // If audio is currently playing, perform crossfade to the selected track
      if(!activeAudio.paused){
        playNextTrackWithCrossfade(newIndex);
      } else {
        loadTrack(newIndex);
        // don't force play if was paused
      }
    });

    // Volume control
    volumeSlider.addEventListener('input', function(){
      var vol = parseFloat(this.value) / 100;
      activeAudio.volume = vol;
      // keep the other audio in sync as well
      try{ inactiveAudio.volume = vol; }catch(e){}
      volumeValue.textContent = this.value + '%';
      state.volume = vol;
      saveState(state);
    });

    // Next button: always crossfade to next (wrap around)
    nextBtn.addEventListener('click', function(){
      var nextIndex = (currentTrackIndex + 1) % playlist.length;
      playNextTrackWithCrossfade(nextIndex);
    });

    // Play/Pause events for active audio
    activeAudio.addEventListener('play', function(){ updateToggle(); state.playing = true; saveState(state); });
    activeAudio.addEventListener('pause', function(){ updateToggle(); state.playing = false; saveState(state); });

    // Progress bar (use activeAudio)
    activeAudio.addEventListener('timeupdate', function(){ progress.value = activeAudio.currentTime; 
      // If remaining time is less than crossfade duration and not already crossfading, schedule crossfade
      var remaining = (activeAudio.duration || 0) - (activeAudio.currentTime || 0);
      if(!isCrossfading && remaining > 0 && remaining <= 10){
        // schedule crossfade to next
        isCrossfading = true;
        var nextIdx = (currentTrackIndex + 1) % playlist.length;
        playNextTrackWithCrossfade(nextIdx);
      }
    });
    // Allow both input and change events for seeking (touch/desktop)
    function seekToProgress(){
      try{ activeAudio.currentTime = parseFloat(progress.value); }catch(e){ console.warn('Seek failed', e); }
    }
    progress.addEventListener('input', seekToProgress);
    progress.addEventListener('change', seekToProgress);

    // We implement gapless crossfade by overlapping the active and inactive audio elements.
    // When crossfading, inactiveAudio will be prepared with the target track and played at volume 0,
    // then we gradually decrease activeAudio and increase inactiveAudio over crossfadeDuration seconds,
    // finally pausing the old active and swapping references.
    function playNextTrackWithCrossfade(targetIndex){
      var crossfadeDuration = 10; // seconds
      var fadeSteps = 100;
      var fadeInterval = (crossfadeDuration * 1000) / fadeSteps;
      var startVolume = activeAudio.volume || 0.7;

      if(typeof targetIndex !== 'number') targetIndex = (currentTrackIndex + 1) % playlist.length;
      targetIndex = ((targetIndex % playlist.length) + playlist.length) % playlist.length;

      // If already crossfading, ignore further calls
      if(isCrossfading) return;
      isCrossfading = true;

      // Prepare inactiveAudio with target
      loadTrackInto(inactiveAudio, targetIndex);
      // Ensure its volume is 0 and start from 0
      try{ inactiveAudio.volume = 0; }catch(e){}
      inactiveAudio.currentTime = 0;

      // Once the inactive audio can play, start it and perform overlapping fade
      var started = false;
      var onCanPlay = function(){
        if(started) return; started = true;
        var p = inactiveAudio.play();
        if(p !== undefined){ p.catch(function(e){ console.log('Inactive play failed:', e); }); }

        var step = 0;
        var fadeOutInterval = setInterval(function(){
          step++;
          var prog = step / fadeSteps;
          try{ activeAudio.volume = Math.max(0, startVolume * (1 - prog)); }catch(e){}
          try{ inactiveAudio.volume = Math.min(startVolume, startVolume * prog); }catch(e){}

          if(step >= fadeSteps){
            clearInterval(fadeOutInterval);
            try{ activeAudio.pause(); }catch(e){}
            // swap active/inactive
            var oldActive = activeAudio;
            activeAudio = inactiveAudio;
            inactiveAudio = oldActive;
            currentTrackIndex = targetIndex;
            trackSelect.value = currentTrackIndex;
            state.trackIndex = currentTrackIndex; saveState(state);
            isCrossfading = false;
            // reattach listeners for active audio timeupdate/play/pause
            updateActiveListeners();
          }
        }, fadeInterval);
      };

      inactiveAudio.removeEventListener('canplay', onCanPlay);
      inactiveAudio.addEventListener('canplay', onCanPlay);
      // If it's already ready, call immediately
      if(inactiveAudio.readyState >= 3){ onCanPlay(); }
    }

    // Re-attach play/pause/timeupdate listeners to the new active audio after swap
    function updateActiveListeners(){
      // Remove handlers from both to avoid duplicates
      audioA.onplay = audioA.onpause = audioA.ontimeupdate = null;
      audioB.onplay = audioB.onpause = audioB.ontimeupdate = null;

      activeAudio.onplay = function(){ updateToggle(); state.playing = true; saveState(state); };
      activeAudio.onpause = function(){ updateToggle(); state.playing = false; saveState(state); };
      activeAudio.ontimeupdate = function(){ progress.value = activeAudio.currentTime;
        var remaining = (activeAudio.duration || 0) - (activeAudio.currentTime || 0);
        if(!isCrossfading && remaining > 0 && remaining <= 10){ isCrossfading = true; var nextIdx = (currentTrackIndex + 1) % playlist.length; playNextTrackWithCrossfade(nextIdx); }
      };
    }

    // Error handling and canplay logging for both audio elements
    function audioErrorHandler(ev){
      var el = ev.target || this;
      console.error('Audio error on', el.id, { src: el.currentSrc || el.src, error: el.error, event: ev });
    }
    function audioCanPlayHandler(ev){
      var el = ev.target || this;
      console.log('Audio ready to play:', el.id, playlist[currentTrackIndex] && playlist[currentTrackIndex].title);
    }
    audioA.addEventListener('error', audioErrorHandler);
    audioB.addEventListener('error', audioErrorHandler);
    audioA.addEventListener('canplay', audioCanPlayHandler);
    audioB.addEventListener('canplay', audioCanPlayHandler);

    // Periodic save (use activeAudio)
    setInterval(function(){ 
      try{ state.time = activeAudio.currentTime || 0; }catch(e){ state.time = 0; }
      state.playing = !activeAudio.paused; 
      state.volume = activeAudio.volume; 
      state.trackIndex = currentTrackIndex;
      saveState(state); 
    }, SAVE_INTERVAL);

    // Restore play state if previously playing
    if(state.playing){ 
      setTimeout(function(){
        var playPromise = activeAudio.play();
        if(playPromise !== undefined) {
          playPromise.catch(function(e){ console.log('Restore play failed:', e); });
        }
      }, 100);
    }

    // Save on unload
    window.addEventListener('pagehide', function(){ 
      try{ state.time = activeAudio.currentTime || 0; }catch(e){ state.time = 0; }
      state.playing = !activeAudio.paused; 
      state.volume = activeAudio.volume; 
      state.trackIndex = currentTrackIndex;
      saveState(state); 
    });

    // Attach initial active listeners
    updateActiveListeners();

  });
})();
