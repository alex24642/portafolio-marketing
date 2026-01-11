/*
  Invisible Persistent Audio Player with Spotify Web Preview
  - Keeps music playing when navigating between pages
  - Uses Spotify Web Player SDK for continuous playback
  - No visible UI, just background audio
  - Requires Spotify authentication via embed or manual token
*/

(function(){
  'use strict';

  // Persistent audio state
  const audioState = {
    isPlaying: localStorage.getItem('audio_playing') === 'true',
    currentTrack: localStorage.getItem('current_track') || 'spotify:track:12bYYQaLqHliSXvRIYlq8G',
    volume: parseFloat(localStorage.getItem('audio_volume')) || 0.5
  };

  // Create invisible persistent audio container
  function createPersistentAudioContainer() {
    if (document.getElementById('persistent-audio-container')) {
      return document.getElementById('persistent-audio-container');
    }

    const container = document.createElement('div');
    container.id = 'persistent-audio-container';
    container.style.cssText = 'position:fixed;bottom:-9999px;left:-9999px;width:1px;height:1px;z-index:-9999;pointer-events:none;';
    
    const audio = document.createElement('audio');
    audio.id = 'persistent-audio';
    audio.preload = 'auto';
    audio.loop = true;
    audio.volume = audioState.volume;
    audio.style.display = 'none';
    
    container.appendChild(audio);
    document.body.appendChild(container);
    
    return container;
  }

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    createPersistentAudioContainer();
    loadSpotifySDK();
    restoreAudioState();
  });

  // Load Spotify SDK
  function loadSpotifySDK() {
    if (window.Spotify) return;
    
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.head.appendChild(script);
    
    // Handle SDK ready
    window.onSpotifyWebPlaybackSDKReady = initializeSpotifyPlayer;
  }

  // Initialize Spotify player
  function initializeSpotifyPlayer() {
    console.log('Spotify SDK Ready');
    const token = getSpotifyToken();
    
    if (!token) {
      console.log('No Spotify token - waiting for authentication via embed');
      // Wait for token from Spotify embed or other auth method
      window.addEventListener('storage', function() {
        const newToken = getSpotifyToken();
        if (newToken) {
          initializeSpotifyPlayer();
        }
      });
      return;
    }

    createSpotifyPlayer(token);
  }

  // Create and connect Spotify player
  function createSpotifyPlayer(token) {
    if (window.__spotifyPlayer) return; // Already initialized
    
    const player = new Spotify.Player({
      name: 'Gastro Lab',
      getOAuthToken: cb => { cb(token); },
      volume: audioState.volume
    });

    player.addListener('ready', ({ device_id }) => {
      console.log('Spotify player ready - Device ID:', device_id);
      localStorage.setItem('spotify_device_id', device_id);
      
      // Auto-play if enabled
      if (audioState.isPlaying) {
        playTrack(device_id, token);
      }
    });

    player.addListener('player_state_changed', state => {
      if (state) {
        localStorage.setItem('audio_playing', !state.paused);
        audioState.isPlaying = !state.paused;
      }
    });

    player.addListener('not_ready', ({ device_id }) => {
      console.log('Device offline:', device_id);
      localStorage.removeItem('spotify_device_id');
    });

    player.addListener('initialization_error', ({ message }) => {
      console.error('Spotify init error:', message);
    });

    player.addListener('authentication_error', ({ message }) => {
      console.error('Spotify auth error:', message);
      localStorage.removeItem('spotify_access_token');
    });

    player.addListener('account_error', ({ message }) => {
      console.error('Spotify account error:', message);
    });

    player.connect();
    window.__spotifyPlayer = player;
  }

  // Play track using Spotify API
  function playTrack(deviceId, token) {
    const trackUri = 'spotify:track:12bYYQaLqHliSXvRIYlq8G';
    
    fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        uris: [trackUri],
        offset: { position: 0 }
      })
    }).then(response => {
      if (response.status === 204) {
        console.log('✓ Track playing on device');
        localStorage.setItem('audio_playing', 'true');
      } else if (response.status === 401) {
        console.log('Token expired, clearing...');
        localStorage.removeItem('spotify_access_token');
      }
    }).catch(error => console.error('Play error:', error));
  }

  // Get Spotify access token from localStorage or URL hash
  function getSpotifyToken() {
    const stored = localStorage.getItem('spotify_access_token');
    if (stored && !isTokenExpired()) {
      return stored;
    }

    // Parse URL hash for auth redirect
    const hash = window.location.hash.substring(1).split('&').reduce((acc, item) => {
      if (item) {
        const [key, value] = item.split('=');
        acc[key] = decodeURIComponent(value);
      }
      return acc;
    }, {});

    if (hash.access_token) {
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
    return Date.now() - parseInt(tokenTime) > 3600000;
  }

  // Restore playback state on page load
  function restoreAudioState() {
    const deviceId = localStorage.getItem('spotify_device_id');
    const token = getSpotifyToken();
    
    if (deviceId && token && audioState.isPlaying) {
      // Small delay to ensure player is ready
      setTimeout(() => {
        if (window.__spotifyPlayer) {
          playTrack(deviceId, token);
        }
      }, 1000);
    }
  }

  // Expose for debugging
  window.__persistentAudio = {
    getToken: getSpotifyToken,
    play: () => {
      const token = getSpotifyToken();
      const deviceId = localStorage.getItem('spotify_device_id');
      if (token && deviceId) playTrack(deviceId, token);
    },
    pause: () => {
      if (window.__spotifyPlayer) {
        fetch('https://api.spotify.com/v1/me/player/pause', {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${getSpotifyToken()}` }
        });
      }
    },
    state: audioState,
    playTrack: playTrack
  };

})();
