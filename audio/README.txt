Instrucciones para la carpeta audio/

Coloca aquí tu archivo de audio si quieres usar un MP3 local.

Ejemplo:
  audio/ambient.mp3

Cómo configurarlo en el sitio:

1) Abrir cada HTML que incluye el reproductor (index.html, portafolio.html, informacion-personal.html)
   y antes de incluir audio-player.js añade una línea como:

   <script>window.SITE_AUDIO_SRC = 'audio/ambient.mp3';</script>

Notas importantes:
- Coloca tus archivos MP3 en la carpeta `audio/` o `musica/` y referencia la ruta en `window.SITE_AUDIO_SRC` o configura `window.SITE_PLAYLIST` con URLs locales.
- Por políticas de reproducción automática, los navegadores pueden bloquear la reproducción hasta que el usuario interactúe con la página.
- El reproductor intenta sincronizar tiempo y estado entre páginas usando localStorage, pero la reproducción continúa en la nueva pestaña solo tras interacción si el navegador lo requiere.

Si quieres, puedo ayudarte a configurar una URL específica o a añadir una pequeña lista de reproducción.
