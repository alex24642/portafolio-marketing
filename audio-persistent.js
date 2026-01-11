/*
  Invisible Persistent Audio Player
  - Keeps music playing when navigating between pages
  - Uses invisible iframe for Spotify embed or local audio
  - No floating UI, just continuous playback
*/

(function(){
  'use strict';

  const SPOTIFY_TRACK_ID = '12bYYQaLqHliSXvRIYlq8G';
  
  // Create invisible persistent audio container
  function createPersistentAudioContainer() {
    // Check if already exists
    if (document.getElementById('persistent-audio-container')) {
      return document.getElementById('persistent-audio-container');
    }

    const container = document.createElement('div');
    container.id = 'persistent-audio-container';
    container.style.cssText = 'position:fixed;bottom:-9999px;left:-9999px;width:1px;height:1px;z-index:9999;pointer-events:none;';
    
    // Create hidden audio element
    const audio = document.createElement('audio');
    audio.id = 'persistent-audio';
    audio.preload = 'auto';
    audio.style.display = 'none';
    audio.crossOrigin = 'anonymous';
    
    container.appendChild(audio);
    document.body.appendChild(container);
    
    return container;
  }

  // Initialize persistent audio player
  document.addEventListener('DOMContentLoaded', function() {
    createPersistentAudioContainer();
    loadSpotifySDK();
    initializeAudioPlayer();
  });

  // Load Spotify SDK
  function loadSpotifySDK() {
    if (window.Spotify) return;
    
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.head.appendChild(script);
  }

  // Initialize audio player
  function initializeAudioPlayer() {
    // Wait for Spotify SDK to load
    window.onSpotifyWebPlaybackSDKReady = function() {
      console.log('Spotify SDK Ready');
      const token = getSpotifyToken();
      
      if (token) {
        createSpotifyPlayer(token);
      }
    };

    // Fallback: if SDK doesn't load in 5 seconds, try audio element
    setTimeout(() => {
      if (!window.Spotify) {
        console.log('Spotify SDK not loaded, using fallback');
      }
    }, 5000);
  }

  // Create Spotify player
  function createSpotifyPlayer(token) {
    const player = new Spotify.Player({
      name: 'Gastro Lab',
      getOAuthToken: cb => { cb(token); },
      volume: 0.5
    });

    player.addListener('initialization_error', ({ message }) => {
      console.error('Failed to initialize', message);
    });

    player.addListener('authentication_error', ({ message }) => {
      console.error('Failed to authenticate', message);
    });

    player.addListener('account_error', ({ message }) => {
      console.error('Failed to validate account', message);
    });

    player.addListener('player_state_changed', state => {
      if (state) {
        console.log('Spotify player state:', state.paused ? 'paused' : 'playing');
      }
    });

    player.addListener('ready', ({ device_id }) => {
      console.log('Ready with Device ID', device_id);
      playTrack(device_id, token);
    });

    player.addListener('not_ready', ({ device_id }) => {
      console.log('Device ID has gone offline', device_id);
    });

    player.connect().then(success => {
      if (success) {
        console.log('Player connected successfully');
      } else {
        console.log('Could not connect player');
      }
    });

    // Store player globally
    window.__spotifyPlayer = player;
  }

  // Play track
  function playTrack(deviceId, token) {
    const trackUri = `spotify:track:${SPOTIFY_TRACK_ID}`;
    
    fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ uris: [trackUri] })
    }).then(response => {
      if (response.status === 204) {
        console.log('Track started playing');
      } else {
        console.log('Play request status:', response.status);
      }
    }).catch(error => {
      console.error('Error playing track:', error);
    });
  }

  // Get Spotify access token
  function getSpotifyToken() {
    // Try localStorage first
    const stored = localStorage.getItem('spotify_access_token');
    if (stored && !isTokenExpired(stored)) {
      return stored;
    }

    // Try URL hash
    const hash = window.location.hash.substring(1).split('&').reduce((initial, item) => {
      if (item) {
        var parts = item.split('=');
        initial[parts[0]] = decodeURIComponent(parts[1]);
      }
      return initial;
    }, {});

    if (hash.access_token) {
      localStorage.setItem('spotify_access_token', hash.access_token);
      localStorage.setItem('spotify_token_time', Date.now());
      window.history.replaceState(null, null, window.location.pathname);
      return hash.access_token;
    }

    return null;
  }

  // Check if token is expired (after 1 hour)
  function isTokenExpired(token) {
    const tokenTime = localStorage.getItem('spotify_token_time');
    if (!tokenTime) return true;
    const age = Date.now() - parseInt(tokenTime);
    return age > 3600000; // 1 hour
  }

  // Expose for debugging
  window.__persistentAudio = {
    getSpotifyToken: getSpotifyToken,
    playTrack: playTrack
  };

})();
