/* Audio Player: injects a floating player and syncs play state/time via localStorage
   Usage: add <script src="audio-player.js"></script> to every HTML page.
   Replace 'audio/ambient.mp3' with your audio file in the project (or a remote URL).
*/
(function(){
  var AUDIO_KEY = 'site_audio_state_v1';
  var SAVE_INTERVAL = 2000; // ms
  // Fuente configurable: window.SITE_AUDIO_SRC || default local file
  // - Para MP3 local o URL directa: 'audio/ambient.mp3' o 'https://.../file.mp3'
  // - Para YouTube: use prefix 'youtube:VIDEO_ID' (ej: 'youtube:dQw4w9WgXcQ')
  var audioSrc = window.SITE_AUDIO_SRC || 'audio/ambient.mp3'; // <-- puedes sobrescribir desde el HTML

  function createPlayer(){
    var container = document.createElement('div');
    container.id = 'floating-audio-player';
    container.innerHTML = '\n      <button id="ap-toggle" aria-label="Play/Pausa">\u25B6</button>\n      <div id="ap-info">\n        <div id="ap-title">Música</div>\n        <div id="ap-progress-wrap">\n          <input id="ap-progress" type="range" min="0" max="100" value="0" step="0.1">\n        </div>\n      </div>\n      <button id="ap-mute" aria-label="Silenciar">\uD83D\uDD0A</button>\n    ';
    document.body.appendChild(container);

    var audio = document.createElement('audio');
    audio.id = 'ap-audio';
    audio.src = audioSrc;
    audio.preload = 'auto';
    audio.loop = true;
    audio.style.display = 'none';
    document.body.appendChild(audio);

    return {container: container, audio: audio};
  }

  function loadState(){
    try{
      var raw = localStorage.getItem(AUDIO_KEY);
      return raw ? JSON.parse(raw) : {time:0,playing:false,volume:1};
    }catch(e){return {time:0,playing:false,volume:1};}
  }
  function saveState(state){
    try{ localStorage.setItem(AUDIO_KEY, JSON.stringify(state)); }catch(e){}
  }

  // inject styles
  function injectStyles(){
  var css = `
#floating-audio-player{position:fixed;right:1rem;bottom:1rem;display:flex;align-items:center;gap:0.6rem;background:rgba(0,0,0,0.6);padding:0.5rem 0.7rem;border-radius:999px;border:1px solid rgba(255,255,255,0.06);backdrop-filter:blur(6px);z-index:2000}
#floating-audio-player button{background:none;border:none;color:var(--text);font-size:1rem;padding:0.35rem;cursor:pointer}
#ap-info{display:flex;flex-direction:column;min-width:160px;max-width:260px}
#ap-title{font-weight:600;color:var(--secondary);font-size:0.95rem}
#ap-progress-wrap{margin-top:0.3rem}
#ap-progress{width:100%}
  @media(max-width:600px){#floating-audio-player{right:0.6rem;left:0.6rem;bottom:0.8rem}}
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
    var state = loadState();

    // Two modes: normal audio element or YouTube iframe (prefix 'youtube:ID')
    var isYouTube = typeof audioSrc === 'string' && audioSrc.indexOf('youtube:') === 0;

    if(!isYouTube){
      // HTMLAudio mode
      audio.src = audioSrc;
      audio.volume = state.volume != null ? state.volume : 1;
      // On some browsers setting currentTime before metadata loads throws; wait
      audio.addEventListener('loadedmetadata', function(){
        if(state.time && state.time < audio.duration - 1){ try{ audio.currentTime = state.time; }catch(e){} }
        progress.max = audio.duration || 100;
      });

      // reflect play/pause
      function updateToggle(){ toggle.textContent = audio.paused ? '\u25B6' : '\u23F8'; }
      updateToggle();

      toggle.addEventListener('click', function(){
        if(audio.paused){ audio.play().catch(function(e){ console.log('Autoplay blocked:', e); }); }
        else { audio.pause(); }
      });

      mute.addEventListener('click', function(){ audio.muted = !audio.muted; mute.textContent = audio.muted ? '\uD83D\uDD07' : '\uD83D\uDD0A'; });

      audio.addEventListener('play', function(){ updateToggle(); state.playing = true; saveState(state); });
      audio.addEventListener('pause', function(){ updateToggle(); state.playing = false; saveState(state); });

      audio.addEventListener('timeupdate', function(){ progress.value = audio.currentTime; });

      progress.addEventListener('input', function(){ try{ audio.currentTime = progress.value; }catch(e){} });

      // periodic save
      var saveTimer = setInterval(function(){ state.time = audio.currentTime || 0; state.playing = !audio.paused; state.volume = audio.volume; saveState(state); }, SAVE_INTERVAL);

      // restore play state if previously playing
      if(state.playing){ audio.play().catch(function(e){}); }

      // save on unload too
      window.addEventListener('pagehide', function(){ state.time = audio.currentTime || 0; state.playing = !audio.paused; state.volume = audio.volume; saveState(state); });

    } else {
      // YouTube mode
      var videoId = audioSrc.split(':')[1];
      // Replace audio element with a placeholder iframe container
      var iframeWrap = document.createElement('div'); iframeWrap.id = 'ap-youtube-wrap'; iframeWrap.style.display = 'none';
      document.body.appendChild(iframeWrap);

      // load YT API
      var ytReady = false, ytPlayer = null;
      window.onYouTubeIframeAPIReady = function(){ ytReady = true; ytPlayer = new YT.Player('ap-youtube-wrap', {
        height: '0', width: '0', videoId: videoId, playerVars: {controls:1,rel:0,iv_load_policy:3,playsinline:1}, events: {
          onReady: function(){
            try{ var dur = ytPlayer.getDuration(); if(dur) progress.max = dur; }catch(e){}
            // seek to saved time
            if(state.time) try{ ytPlayer.seekTo(state.time, true); }catch(e){}
            if(state.playing) try{ ytPlayer.playVideo(); }catch(e){}
          },
          onStateChange: function(e){
            // update toggle display
            if(e.data === YT.PlayerState.PLAYING) toggle.textContent = '\u23F8', state.playing = true, saveState(state);
            if(e.data === YT.PlayerState.PAUSED) toggle.textContent = '\u25B6', state.playing = false, saveState(state);
          }
        }
      }); };
      // inject API script
      var ytScript = document.createElement('script'); ytScript.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(ytScript);

      // Update UI handlers to control YT
      toggle.addEventListener('click', function(){ if(ytPlayer){ var s = ytPlayer.getPlayerState(); if(s === YT.PlayerState.PLAYING) ytPlayer.pauseVideo(); else ytPlayer.playVideo(); } });
      mute.addEventListener('click', function(){ if(ytPlayer){ var cur = ytPlayer.isMuted(); if(cur) ytPlayer.unMute(); else ytPlayer.mute(); mute.textContent = ytPlayer.isMuted() ? '\uD83D\uDD07' : '\uD83D\uDD0A'; } });

      // progress handling via polling
      setInterval(function(){ if(ytPlayer && ytPlayer.getDuration){ try{ var t = ytPlayer.getCurrentTime(); progress.value = t; state.time = t; saveState(state); }catch(e){} } }, 1000);

      progress.addEventListener('input', function(){ if(ytPlayer) try{ ytPlayer.seekTo(progress.value, true); }catch(e){} });
    }

  });
})();
