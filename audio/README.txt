Instrucciones para la carpeta audio/

Coloca aquí tu archivo de audio si quieres usar un MP3 local.

Ejemplo:
  audio/ambient.mp3

Cómo configurarlo en el sitio:

1) Abrir cada HTML que incluye el reproductor (index.html, portafolio.html, informacion-personal.html)
   y antes de incluir audio-player.js añade una línea como:

   <script>window.SITE_AUDIO_SRC = 'audio/ambient.mp3';</script>

2) Alternativamente, puedes usar un vídeo de YouTube público (no YouTube Music) estableciendo:

   <script>window.SITE_AUDIO_SRC = 'youtube:VIDEO_ID';</script>

   Donde VIDEO_ID es el id del vídeo (la parte después de v= en la URL de YouTube).

Notas importantes:
- YouTube Music no ofrece un embed público que podamos controlar desde el sitio. Si quieres reproducir una pista alojada en YouTube Music, lo práctico es usar la versión pública del vídeo en YouTube (si existe).
- Por políticas de reproducción automática, los navegadores pueden bloquear la reproducción hasta que el usuario interactúe con la página.
- El reproductor intenta sincronizar tiempo y estado entre páginas usando localStorage, pero la reproducción continúa en la nueva pestaña solo tras interacción si el navegador lo requiere.

Si quieres, puedo ayudarte a configurar una URL específica o a añadir una pequeña lista de reproducción.
