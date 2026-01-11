/*
  Spotify-style Player - Local reproduction
  Allows playing local audio files with Spotify-like UI
*/

(function(){
  'use strict';

  // Check if we're on index.html
  var currentPage = window.location.pathname.split('/').pop() || 'index.html';
  if (currentPage !== 'index.html' && currentPage !== '') {
    return;
  }

  // Playlist configuration - Links to Spotify
  var PLAYLIST = [
    {
      title: 'I Just Might',
      artist: 'Bruno Mars',
      image: 'https://i.scdn.co/image/ab67616d0000b27374f5d961a8b58ca1a17d96e9',
      spotifyUrl: 'https://open.spotify.com/intl-es/track/12bYYQaLqHliSXvRIYlq8G?si=c0383b4aabd94672'
    }
  ];

  var currentTrackIndex = 0;
  var isPlaying = false;

  document.addEventListener('DOMContentLoaded', function(){
    try {
      var playBtn = document.getElementById('spotify-play-btn');
      var playerContainer = document.querySelector('.spotify-player');
      var linkBtn = document.querySelector('.spotify-link-btn');
      
      if (!playerContainer) return;

      // Play button - opens Spotify
      if (playBtn) {
        playBtn.addEventListener('click', function(e){
          e.preventDefault();
          togglePlayPause();
        });
      }

      // Allow clicking on track info to open Spotify
      if (playerContainer) {
        var trackInfo = playerContainer.querySelector('.spotify-player-track');
        if (trackInfo) {
          trackInfo.style.cursor = 'pointer';
          trackInfo.addEventListener('click', togglePlayPause);
        }
      }

      // Load first track info
      loadTrack(0);

    } catch(e) {
      console.error('Spotify player initialization error:', e);
    }
  });

  function loadTrack(index) {
    currentTrackIndex = (index % PLAYLIST.length + PLAYLIST.length) % PLAYLIST.length;
    var track = PLAYLIST[currentTrackIndex];

    // Update UI
    var trackTitle = document.querySelector('.spotify-player-track h4');
    var trackArtist = document.querySelector('.spotify-player-track p');
    var albumArt = document.querySelector('.spotify-album-art');
    var linkBtn = document.querySelector('.spotify-link-btn');

    if (trackTitle) trackTitle.textContent = track.title;
    if (trackArtist) trackArtist.textContent = track.artist;
    if (albumArt) albumArt.src = track.image;
    if (linkBtn) linkBtn.href = track.spotifyUrl;

    updatePlayButton();
  }

  function togglePlayPause() {
    // Toggle play state
    isPlaying = !isPlaying;
    updatePlayButton();
    
    // Open Spotify link
    var track = PLAYLIST[currentTrackIndex];
    if (track && track.spotifyUrl) {
      window.open(track.spotifyUrl, '_blank');
    }
  }

  function nextTrack() {
    loadTrack(currentTrackIndex + 1);
  }

  function updatePlayButton() {
    var playBtn = document.getElementById('spotify-play-btn');
    if (playBtn) {
      playBtn.textContent = isPlaying ? '⏸' : '▶';
    }
  }

  // Expose functions globally for debugging
  window.__spotifyPlayer = {
    loadTrack: loadTrack,
    togglePlayPause: togglePlayPause,
    nextTrack: nextTrack,
    playlist: PLAYLIST
  };

})();
