/*
  Invisible Persistent Audio Player - Spotify Edition
  - Keeps Spotify music playing when navigating between pages
  - Uses Spotify Web Player SDK for continuous playback
  - No visible UI, just background audio persistence
  - Works across all pages from index.html onward
*/

(function(){
  'use strict';

  const SPOTIFY_TRACK_ID = '12bYYQaLqHliSXvRIYlq8G';
  let initAttempts = 0;
  const maxInitAttempts = 10;

  // Persistent audio state
  const audioState = {
    isPlaying: localStorage.getItem('audio_playing') === 'true',
    currentTrack: SPOTIFY_TRACK_ID,
    volume: 0.5
  };

  // Create invisible persistent audio container
  function createPersistentAudioContainer() {
    if (document.getElementById('persistent-audio-container')) {
      return document.getElementById('persistent-audio-container');
    }

    const container = document.createElement('div');
    container.id = 'persistent-audio-container';
    container.style.cssText = 'position:fixed;bottom:-9999px;left:-9999px;width:1px;height:1px;z-index:-9999;pointer-events:none;visibility:hidden;';
    
    const audio = document.createElement('audio');
    audio.id = 'persistent-audio';
    audio.preload = 'auto';
    audio.style.display = 'none';
    
    container.appendChild(audio);
    document.body.appendChild(container);
    
    return container;
  }

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    console.log('[🎵 Audio Persistent] Initializing...');
    createPersistentAudioContainer();
    loadSpotifySDK();
    
    // Listen for storage changes (token updates from other pages/tabs)
    window.addEventListener('storage', function(e) {
      if (e.key === 'spotify_access_token' || e.key === 'spotify_device_id') {
        console.log('[🎵 Audio Persistent] Storage updated:', e.key);
        attemptReconnect();
      }
    });
  });

  // Load Spotify SDK
  function loadSpotifySDK() {
    if (window.Spotify) {
      console.log('[🎵 Audio Persistent] SDK already loaded');
      initializeSpotifyPlayer();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    script.onload = () => console.log('[🎵 Audio Persistent] SDK script loaded');
    document.head.appendChild(script);
    
    // Set up SDK ready handler
    window.onSpotifyWebPlaybackSDKReady = initializeSpotifyPlayer;
    
    // Fallback timeout
    setTimeout(() => {
      if (!window.Spotify && initAttempts < maxInitAttempts) {
        console.log('[🎵 Audio Persistent] SDK not ready, retrying...');
        initAttempts++;
        initializeSpotifyPlayer();
      }
    }, 2000);
  }

  // Initialize Spotify player
  function initializeSpotifyPlayer() {
    const token = getSpotifyToken();
    
    if (!token) {
      console.log('[🎵 Audio Persistent] Waiting for Spotify authentication token...');
      // Retry every 3 seconds if no token
      setTimeout(() => {
        const newToken = getSpotifyToken();
        if (newToken) {
          initializeSpotifyPlayer();
        }
      }, 3000);
      return;
    }

    if (!window.Spotify) {
      console.log('[🎵 Audio Persistent] Waiting for Spotify SDK...');
      setTimeout(initializeSpotifyPlayer, 1000);
      return;
    }

    createSpotifyPlayer(token);
  }

  // Attempt to reconnect with existing device
  function attemptReconnect() {
    const token = getSpotifyToken();
    const deviceId = localStorage.getItem('spotify_device_id');
    
    if (token && deviceId && window.__spotifyPlayer) {
      console.log('[🎵 Audio Persistent] Reconnecting to device:', deviceId);
      if (audioState.isPlaying) {
        setTimeout(() => playTrack(deviceId, token), 500);
      }
    }
  }

  // Create and connect Spotify player
  function createSpotifyPlayer(token) {
    if (window.__spotifyPlayer) {
      console.log('[🎵 Audio Persistent] Player already created');
      attemptReconnect();
      return;
    }
    
    console.log('[🎵 Audio Persistent] Creating new Spotify player...');
    
    const player = new Spotify.Player({
      name: 'Gastro Lab',
      getOAuthToken: cb => { cb(token); },
      volume: audioState.volume
    });

    player.addListener('ready', ({ device_id }) => {
      console.log('[🎵 Audio Persistent] ✓ Player ready - Device ID:', device_id);
      localStorage.setItem('spotify_device_id', device_id);
      localStorage.setItem('spotify_player_initialized', 'true');
      
      // Auto-play if was playing before
      if (audioState.isPlaying) {
        console.log('[🎵 Audio Persistent] Resuming playback...');
        setTimeout(() => playTrack(device_id, token), 500);
      } else {
        // Start playing by default
        console.log('[🎵 Audio Persistent] Starting playback...');
        setTimeout(() => playTrack(device_id, token), 500);
      }
    });

    player.addListener('player_state_changed', state => {
      if (state) {
        const nowPlaying = !state.paused;
        localStorage.setItem('audio_playing', nowPlaying);
        audioState.isPlaying = nowPlaying;
        console.log('[🎵 Audio Persistent] State:', nowPlaying ? '▶ Playing' : '⏸ Paused');
      }
    });

    player.addListener('not_ready', ({ device_id }) => {
      console.log('[🎵 Audio Persistent] Device offline:', device_id);
      localStorage.removeItem('spotify_device_id');
    });

    player.addListener('initialization_error', ({ message }) => {
      console.error('[🎵 Audio Persistent] Init error:', message);
    });

    player.addListener('authentication_error', ({ message }) => {
      console.error('[🎵 Audio Persistent] Auth error:', message);
      localStorage.removeItem('spotify_access_token');
      localStorage.removeItem('spotify_device_id');
    });

    player.addListener('account_error', ({ message }) => {
      console.error('[🎵 Audio Persistent] Account error:', message);
    });

    player.connect().then(success => {
      if (success) {
        console.log('[🎵 Audio Persistent] Player connected');
      } else {
        console.log('[🎵 Audio Persistent] Failed to connect player');
      }
    });

    window.__spotifyPlayer = player;
  }

  // Play track using Spotify API
  function playTrack(deviceId, token) {
    if (!deviceId || !token) {
      console.log('[🎵 Audio Persistent] Missing deviceId or token');
      return;
    }

    const trackUri = `spotify:track:${SPOTIFY_TRACK_ID}`;
    
    fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        uris: [trackUri]
      })
    }).then(response => {
      if (response.status === 204) {
        console.log('[🎵 Audio Persistent] ✓ Playback started');
        localStorage.setItem('audio_playing', 'true');
        audioState.isPlaying = true;
      } else if (response.status === 401) {
        console.log('[🎵 Audio Persistent] Token expired, need re-auth');
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_device_id');
      } else if (response.status === 404) {
        console.log('[🎵 Audio Persistent] Device not found, reconnecting...');
        localStorage.removeItem('spotify_device_id');
        initializeSpotifyPlayer();
      } else {
        console.log('[🎵 Audio Persistent] Play response:', response.status);
      }
    }).catch(error => {
      console.error('[🎵 Audio Persistent] Play error:', error);
    });
  }

  // Get Spotify access token from localStorage or URL hash
  function getSpotifyToken() {
    const stored = localStorage.getItem('spotify_access_token');
    if (stored && !isTokenExpired()) {
      console.log('[🎵 Audio Persistent] Found valid token in storage');
      return stored;
    }

    // Parse URL hash for auth redirect from Spotify
    const hash = window.location.hash.substring(1).split('&').reduce((acc, item) => {
      if (item) {
        const [key, value] = item.split('=');
        acc[key] = decodeURIComponent(value);
      }
      return acc;
    }, {});

    if (hash.access_token) {
      console.log('[🎵 Audio Persistent] Got token from URL hash');
      localStorage.setItem('spotify_access_token', hash.access_token);
      localStorage.setItem('spotify_token_time', Date.now());
      // Clean URL
      window.history.replaceState(null, null, window.location.pathname);
      return hash.access_token;
    }

    return null;
  }

  // Check token expiration (1 hour)
  function isTokenExpired() {
    const tokenTime = localStorage.getItem('spotify_token_time');
    if (!tokenTime) return true;
    const expired = Date.now() - parseInt(tokenTime) > 3600000;
    if (expired) {
      console.log('[🎵 Audio Persistent] Token expired');
      localStorage.removeItem('spotify_access_token');
    }
    return expired;
  }

  // Expose for debugging
  window.__persistentAudio = {
    getToken: getSpotifyToken,
    play: () => {
      const token = getSpotifyToken();
      const deviceId = localStorage.getItem('spotify_device_id');
      if (token && deviceId) {
        console.log('[🎵 Audio Persistent] Manual play command');
        playTrack(deviceId, token);
      } else {
        console.log('[🎵 Audio Persistent] Cannot play - missing token or device');
      }
    },
    pause: () => {
      if (window.__spotifyPlayer) {
        console.log('[🎵 Audio Persistent] Manual pause command');
        fetch('https://api.spotify.com/v1/me/player/pause', {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${getSpotifyToken()}` }
        });
      }
    },
    state: audioState,
    isReady: () => !!(localStorage.getItem('spotify_device_id') && getSpotifyToken())
  };

})();
