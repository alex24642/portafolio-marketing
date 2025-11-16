/*
  Simple Music Bar for all pages
  - Single <audio> element
  - Select one of the 4 local songs, play/pause, progress/seek and volume control
  - Persists last track and volume in localStorage
  Usage: add <script src="audio-player.js"></script> to every HTML page where you want the bar.
*/

(function(){
  'use strict';

  var STORAGE_KEY = 'simple_music_bar_v1';
  var PLAYLIST = [
    { title: 'PARIS The Prince - Fleeting Dream', url: 'musica/PARIS The Prince - Fleeting Dream (musica1).mp3' },
    { title: 'Cuco - Sin Un Corazon', url: 'musica/Cuco - Sin Un Corazon (musica2).mp3' },
    { title: 'Fly Me to the Moon', url: 'musica/Fly Me to the Moon (musica3).mp3' },
    { title: 'Junior H - LAS NOCHES', url: 'musica/Junior H - LAS NOCHES (musica4).mp3' }
  ];

  function readState(){ try{ var raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : {}; }catch(e){ return {}; } }
  function saveState(s){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }catch(e){} }

  function injectCSS(){
    var css = ''+
      '#music-bar{position:fixed;right:20px;bottom:20px;z-index:9999;display:flex;align-items:center;gap:12px;background:rgba(20,20,25,0.95);padding:12px 16px;border-radius:12px;color:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;border:1px solid rgba(255,255,255,0.1);box-shadow:0 4px 12px rgba(0,0,0,0.3);}'+
      '#music-bar button{background:rgba(100,150,255,0.2);border:1px solid rgba(100,150,255,0.4);color:#fff;padding:8px 10px;border-radius:8px;cursor:pointer;font-size:14px;transition:all 0.2s;min-width:36px;text-align:center;}'+
      '#music-bar button:hover{background:rgba(100,150,255,0.35);border-color:rgba(100,150,255,0.6);}'+
      '#music-bar select{background:rgba(15,15,20,0.95);color:#fff;border:1px solid rgba(100,150,255,0.5);padding:8px 10px;border-radius:8px;font-family:inherit;font-size:13px;cursor:pointer;transition:all 0.2s;min-width:220px;}'+
      '#music-bar select:hover,#music-bar select:focus{outline:none;background-color:rgba(25,25,35,0.95);border-color:rgba(100,150,255,0.8);}'+
      '#music-bar select option{background:#0a0a0f;color:#fff;padding:10px 8px;}'+
      '#music-bar select option:checked{background:rgba(100,150,255,0.8);color:#fff;}'+
      '#music-bar input[type=range]{cursor:pointer;accent-color:rgba(100,150,255,0.8);}'+
      '#music-bar .time{font-size:11px;color:#aaa;min-width:30px;text-align:center;font-weight:500;}';
    var s = document.createElement('style'); s.appendChild(document.createTextNode(css)); document.head.appendChild(s);
  }

  function createUI(){
    var bar = document.createElement('div'); bar.id = 'music-bar';
    bar.innerHTML = ''+
      '<button id="mb-play"></button>' +
      '<select id="mb-select"></select>' +
      '<input id="mb-progress" type="range" min="0" max="100" step="0.1" value="0" style="width:200px">' +
      '<span class="time" id="mb-time">0:00</span>' +
      '<input id="mb-volume" type="range" min="0" max="100" step="1" value="70" style="width:100px">';
    document.body.appendChild(bar);
    var select = bar.querySelector('#mb-select');
    PLAYLIST.forEach(function(t,i){ var opt = document.createElement('option'); opt.value = i; opt.textContent = t.title; select.appendChild(opt); });
    var audio = document.createElement('audio'); audio.id = 'mb-audio'; audio.preload = 'auto'; audio.style.display = 'none'; document.body.appendChild(audio);
    return { bar: bar, play: bar.querySelector('#mb-play'), select: select, progress: bar.querySelector('#mb-progress'), time: bar.querySelector('#mb-time'), volume: bar.querySelector('#mb-volume'), audio: audio };
  }

  document.addEventListener('DOMContentLoaded', function(){
    injectCSS();
    var ui = createUI();
    var state = readState();
    var index = (typeof state.index === 'number') ? state.index : 0;
    var vol = (typeof state.volume === 'number') ? state.volume : 0.7;

    // BroadcastChannel for persistent player window communication
    var bc = null;
    try{ bc = new BroadcastChannel('music-player'); }catch(e){ bc = null; }

    function openPlayerPopup(){ try{ var w = window.open('player-window.html?v=1.1', 'music-player', 'width=420,height=120'); if(w) w.focus(); }catch(e){} }
    function sendToPlayer(msg){ if(bc) try{ bc.postMessage(msg); }catch(e){} }
    function formatTime(seconds){ var t = Math.floor(seconds||0); return Math.floor(t/60)+':' + (''+ (t%60)).padStart(2,'0'); }

    function setTrack(i, autoplay){
      index = ((i % PLAYLIST.length) + PLAYLIST.length) % PLAYLIST.length;
      ui.select.value = index;
      try{ ui.audio.src = PLAYLIST[index].url; ui.audio.load(); }catch(e){ console.warn('setTrack error', e); }
      if(autoplay){
        if(bc){ openPlayerPopup(); sendToPlayer({ type: 'SET_TRACK', index: index, autoplay: true }); }
        else { var p = ui.audio.play(); if(p && p.catch) p.catch(function(err){ console.warn('play blocked', err); }); }
      }
      saveState({ index: index, volume: ui.audio.volume });
    }

    ui.volume.value = Math.round(vol * 100);
    ui.audio.volume = vol;

    // If there's a persistent player, announce playlist and request current state
    if(bc){
      sendToPlayer({ type: 'SET_PLAYLIST', playlist: PLAYLIST });
      setTimeout(function(){ sendToPlayer({ type: 'REQUEST_STATE' }); }, 150);
      bc.onmessage = function(ev){ var m = ev.data; if(!m || !m.type) return; if(m.type === 'STATE'){
        try{
          ui.select.value = (typeof m.index === 'number') ? m.index : ui.select.value;
          ui.volume.value = (typeof m.volume === 'number') ? Math.round(m.volume*100) : ui.volume.value;
          ui.progress.max = isFinite(m.duration) ? m.duration : ui.progress.max;
          ui.progress.value = m.currentTime || ui.progress.value;
          ui.time.textContent = formatTime(m.currentTime || 0);
          ui.play.textContent = m.playing ? '⏸' : '▶';
          try{ if(m.playing) ui.audio.pause(); }catch(e){}
        }catch(e){}
      } };
    }

    // initialize local fallback
    setTrack(index, false);

    function updatePlayButton(){ ui.play.textContent = ui.audio.paused ? '▶' : '⏸'; }
    updatePlayButton();

    ui.play.addEventListener('click', function(){
      if(bc){ openPlayerPopup(); sendToPlayer({ type: 'TOGGLE_PLAY' }); }
      else {
        if(ui.audio.paused){ var p = ui.audio.play(); if(p && p.catch) p.catch(function(e){ console.warn('play failed', e); }); updatePlayButton(); }
        else { ui.audio.pause(); updatePlayButton(); }
      }
    });

    ui.select.addEventListener('change', function(){ var idx = parseInt(this.value,10); if(bc){ openPlayerPopup(); sendToPlayer({ type: 'SET_TRACK', index: idx, autoplay: true }); } else { setTrack(idx, true); updatePlayButton(); } });

    ui.volume.addEventListener('input', function(){ var v = parseInt(this.value,10)/100; if(bc){ sendToPlayer({ type: 'SET_VOLUME', volume: v }); } else { ui.audio.volume = v; saveState({ index: index, volume: v }); } });

    ui.progress.addEventListener('input', function(){ try{ ui.audio.currentTime = parseFloat(this.value); }catch(e){} });

    ui.audio.addEventListener('timeupdate', function(){ ui.progress.max = isFinite(ui.audio.duration) ? ui.audio.duration : 100; ui.progress.value = ui.audio.currentTime || 0; var t = Math.floor(ui.audio.currentTime||0); ui.time.textContent = Math.floor(t/60)+':' + (''+ (t%60)).padStart(2,'0'); });

    ui.audio.addEventListener('ended', function(){ // auto next
      var next = (index+1) % PLAYLIST.length; if(bc){ sendToPlayer({ type: 'SET_TRACK', index: next, autoplay: true }); } else { setTrack(next, true); updatePlayButton(); } });

    ui.audio.addEventListener('play', function(){ updatePlayButton(); });
    ui.audio.addEventListener('pause', function(){ updatePlayButton(); });

    // Save on unload
    window.addEventListener('pagehide', function(){ saveState({ index: index, volume: ui.audio.volume }); });

    // Expose for debugging
    window.__simpleMusicBar = { ui: ui, playlist: PLAYLIST };
  });
})();
