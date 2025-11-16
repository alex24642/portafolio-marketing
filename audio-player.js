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
      '#music-bar{position:fixed;right:16px;bottom:16px;z-index:9999;display:flex;align-items:center;gap:8px;background:rgba(0,0,0,0.7);padding:8px 12px;border-radius:10px;color:#fff;font-family:Arial,sans-serif;}'+
      '#music-bar button{background:transparent;border:1px solid rgba(255,255,255,0.08);color:#fff;padding:6px 8px;border-radius:6px;cursor:pointer;}'+
      '#music-bar select{background:transparent;color:#fff;border:1px solid rgba(255,255,255,0.08);padding:6px;border-radius:6px;}'+
      '#music-bar input[type=range]{cursor:pointer;}'+
      '#music-bar .time{font-size:12px;color:#ddd;margin-left:6px;}';
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

    function setTrack(i, autoplay){
      index = ((i % PLAYLIST.length) + PLAYLIST.length) % PLAYLIST.length;
      ui.select.value = index;
      try{ ui.audio.src = PLAYLIST[index].url; ui.audio.load(); }catch(e){ console.warn('setTrack error', e); }
      if(autoplay){ var p = ui.audio.play(); if(p && p.catch) p.catch(function(err){ console.warn('play blocked', err); }); }
      saveState({ index: index, volume: ui.audio.volume });
    }

    ui.volume.value = Math.round(vol * 100);
    ui.audio.volume = vol;

    // initialize
    setTrack(index, false);

    ui.play.addEventListener('click', function(){
      if(ui.audio.paused){ var p = ui.audio.play(); if(p && p.catch) p.catch(function(e){ console.warn('play failed', e); }); ui.play.textContent = ''; }
      else { ui.audio.pause(); ui.play.textContent = ''; }
    });

    ui.select.addEventListener('change', function(){ var idx = parseInt(this.value,10); setTrack(idx, true); ui.play.textContent = ''; });

    ui.volume.addEventListener('input', function(){ var v = parseInt(this.value,10)/100; ui.audio.volume = v; saveState({ index: index, volume: v }); });

    ui.progress.addEventListener('input', function(){ try{ ui.audio.currentTime = parseFloat(this.value); }catch(e){} });

    ui.audio.addEventListener('timeupdate', function(){ ui.progress.max = isFinite(ui.audio.duration) ? ui.audio.duration : 100; ui.progress.value = ui.audio.currentTime || 0; var t = Math.floor(ui.audio.currentTime||0); ui.time.textContent = Math.floor(t/60)+':' + (''+ (t%60)).padStart(2,'0'); });

    ui.audio.addEventListener('ended', function(){ // auto next
      var next = (index+1) % PLAYLIST.length; setTrack(next, true); ui.play.textContent = ''; });

    ui.audio.addEventListener('play', function(){ ui.play.textContent = ''; });
    ui.audio.addEventListener('pause', function(){ ui.play.textContent = ''; });

    // Save on unload
    window.addEventListener('pagehide', function(){ saveState({ index: index, volume: ui.audio.volume }); });

    // Expose for debugging
    window.__simpleMusicBar = { ui: ui, playlist: PLAYLIST };
  });
})();
