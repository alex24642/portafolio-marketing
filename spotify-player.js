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

  // Playlist configuration - you can add more songs here
  var PLAYLIST = [
    {
      title: 'I Just Might',
      artist: 'Bruno Mars',
      image: 'https://i.scdn.co/image/ab67616d0000b27374f5d961a8b58ca1a17d96e9',
      url: 'musica/Fly Me to the Moon (musica3).mp3',
      spotifyUrl: 'https://open.spotify.com/intl-es/track/12bYYQaLqHliSXvRIYlq8G?si=c0383b4aabd94672'
    },
    {
      title: 'Fleeting Dream',
      artist: 'PARIS The Prince',
      image: 'https://i.scdn.co/image/ab67616d0000b27374f5d961a8b58ca1a17d96e9',
      url: 'musica/PARIS The Prince - Fleeting Dream (musica1).mp3',
      spotifyUrl: 'https://open.spotify.com/artist/4A3ItkgkJBxfNJ1UnVfQZW'
    },
    {
      title: 'Sin Un Corazon',
      artist: 'Cuco',
      image: 'https://i.scdn.co/image/ab67616d0000b27374f5d961a8b58ca1a17d96e9',
      url: 'musica/Cuco - Sin Un Corazon (musica2).mp3',
      spotifyUrl: 'https://open.spotify.com/artist/5P3Ey0lsF0vNZIjPcDMZHy'
    },
    {
      title: 'LAS NOCHES',
      artist: 'Junior H',
      image: 'https://i.scdn.co/image/ab67616d0000b27374f5d961a8b58ca1a17d96e9',
      url: 'musica/Junior H - LAS NOCHES (musica4).mp3',
      spotifyUrl: 'https://open.spotify.com/artist/4N6AxWjvFwj0mKaDYmRh4B'
    }
  ];

  var currentTrackIndex = 0;
  var isPlaying = false;
  var audio = null;

  document.addEventListener('DOMContentLoaded', function(){
    try {
      var playBtn = document.getElementById('spotify-play-btn');
      var playerContainer = document.querySelector('.spotify-player');
      var linkBtn = document.querySelector('.spotify-link-btn');
      
      if (!playerContainer) return;

      // Create hidden audio element
      audio = document.createElement('audio');
      audio.id = 'spotify-audio';
      audio.preload = 'auto';
      document.body.appendChild(audio);

      // Play/Pause button click
      if (playBtn) {
        playBtn.addEventListener('click', function(e){
          e.preventDefault();
          togglePlayPause();
        });
      }

      // Update UI when track ends
      if (audio) {
        audio.addEventListener('ended', function(){
          nextTrack();
        });

        audio.addEventListener('play', function(){
          isPlaying = true;
          updatePlayButton();
        });

        audio.addEventListener('pause', function(){
          isPlaying = false;
          updatePlayButton();
        });
      }

      // Allow clicking on track info to play/pause
      if (playerContainer) {
        var trackInfo = playerContainer.querySelector('.spotify-player-track');
        if (trackInfo) {
          trackInfo.style.cursor = 'pointer';
          trackInfo.addEventListener('click', togglePlayPause);
        }
      }

      // Load first track
      loadTrack(0);

    } catch(e) {
      console.error('Spotify player initialization error:', e);
    }
  });

  function loadTrack(index) {
    currentTrackIndex = (index % PLAYLIST.length + PLAYLIST.length) % PLAYLIST.length;
    var track = PLAYLIST[currentTrackIndex];
    
    if (audio) {
      audio.src = track.url;
    }

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
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      var p = audio.play();
      if (p && p.catch) {
        p.catch(function(e){
          console.warn('Play failed:', e);
        });
      }
    }
  }

  function nextTrack() {
    loadTrack(currentTrackIndex + 1);
    if (audio) {
      var p = audio.play();
      if (p && p.catch) {
        p.catch(function(e){
          console.warn('Play failed:', e);
        });
      }
    }
  }

  function updatePlayButton() {
    var playBtn = document.getElementById('spotify-play-btn');
    if (playBtn) {
      playBtn.textContent = (audio && !audio.paused) ? '⏸' : '▶';
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
