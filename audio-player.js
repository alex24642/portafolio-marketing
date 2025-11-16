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

    // --- PJAX navigation: intercept internal link clicks and load <main> via fetch
    function isInternalLink(a){
      if(!a || !a.href) return false;
      try{
        var u = new URL(a.href, location.href);
        return u.origin === location.origin && (u.pathname.endsWith('.html') || u.pathname === '/' || u.pathname.indexOf('.') === -1);
      }catch(e){return false;}
    }

    function runScriptsFromFragment(fragment){
      // execute inline and external scripts inside the fragment
      var scripts = fragment.querySelectorAll('script');
      scripts.forEach(function(s){
        var el = document.createElement('script');
        if(s.src){ el.src = s.src; el.async = false; }
        else { el.textContent = s.textContent; }
        document.body.appendChild(el);
        // remove appended script after load to keep DOM clean
        el.addEventListener('load', function(){ setTimeout(function(){ el.parentNode && el.parentNode.removeChild(el); },1000); });
      });
    }

    function ajaxNavigateTo(url, addToHistory){
      fetch(url, { credentials: 'same-origin' }).then(function(resp){ if(!resp.ok) throw new Error('Network response not ok'); return resp.text(); }).then(function(html){
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');
        var newMain = doc.querySelector('main');
        if(newMain){
          var oldMain = document.querySelector('main');
          if(oldMain){ oldMain.innerHTML = newMain.innerHTML; }
          else { document.body.appendChild(newMain); }
          // update title
          if(doc.title) document.title = doc.title;
          // run scripts found in new main
          runScriptsFromFragment(newMain);
          window.scrollTo(0,0);
          if(addToHistory) history.pushState({ pjax: true }, doc.title || '', url);
          // notify other scripts
          document.dispatchEvent(new CustomEvent('pjax:loaded', { detail: { url: url } }));
        } else { window.location.href = url; }
      }).catch(function(err){ console.warn('PJAX load failed, falling back to full navigation', err); window.location.href = url; });
    }

    // global click handler to intercept internal links
    document.addEventListener('click', function(e){
      var a = e.target;
      while(a && a.tagName !== 'A') a = a.parentNode;
      if(!a) return;
      if(a.target && a.target !== '' && a.target !== '_self') return; // allow external targets
      if(a.hasAttribute('download') || a.rel === 'external') return;
      if(isInternalLink(a)){
        e.preventDefault();
        var href = a.getAttribute('href');
        if(href.indexOf('#') === 0){ location.hash = href; return; }
        ajaxNavigateTo(href, true);
      }
    }, true);

    // handle back/forward
    window.addEventListener('popstate', function(e){ if(e.state && e.state.pjax){ ajaxNavigateTo(location.href, false); } else { /* for safety, do full load */ ajaxNavigateTo(location.href, false); } });

    function updatePlayButton(){ ui.play.textContent = ui.audio.paused ? '▶' : '⏸'; }
    updatePlayButton();

    ui.play.addEventListener('click', function(){
      if(ui.audio.paused){ var p = ui.audio.play(); if(p && p.catch) p.catch(function(e){ console.warn('play failed', e); }); updatePlayButton(); }
      else { ui.audio.pause(); updatePlayButton(); }
    });

    ui.select.addEventListener('change', function(){ var idx = parseInt(this.value,10); setTrack(idx, true); updatePlayButton(); });

    ui.volume.addEventListener('input', function(){ var v = parseInt(this.value,10)/100; ui.audio.volume = v; saveState({ index: index, volume: v }); });

    ui.progress.addEventListener('input', function(){ try{ ui.audio.currentTime = parseFloat(this.value); }catch(e){} });

    ui.audio.addEventListener('timeupdate', function(){ ui.progress.max = isFinite(ui.audio.duration) ? ui.audio.duration : 100; ui.progress.value = ui.audio.currentTime || 0; var t = Math.floor(ui.audio.currentTime||0); ui.time.textContent = Math.floor(t/60)+':' + (''+ (t%60)).padStart(2,'0'); });

    ui.audio.addEventListener('ended', function(){ // auto next
      var next = (index+1) % PLAYLIST.length; setTrack(next, true); updatePlayButton(); });

    ui.audio.addEventListener('play', function(){ updatePlayButton(); });
    ui.audio.addEventListener('pause', function(){ updatePlayButton(); });

    // Save on unload
    window.addEventListener('pagehide', function(){ saveState({ index: index, volume: ui.audio.volume }); });

    // Expose for debugging
    window.__simpleMusicBar = { ui: ui, playlist: PLAYLIST };
  });
})();
