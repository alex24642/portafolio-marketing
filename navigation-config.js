/* Navigation Configuration: ordena las páginas de Parte 1 y Parte 2 */

const pagesOrder = {
  parte1: [
    { name: 'Información Personal', url: 'informacion-personal.html' },
    { name: 'Información del Docente', url: 'informacion-docente.html' },
    { name: 'Medio ciclo', url: 'primer-parcial.html' },
    { name: 'Información de la Asignatura', url: 'informacion-asignatura.html' }
  ],
  parte2: [
    { name: 'Aprendizaje en Contacto', url: 'aprendizaje-contacto.html' },
    { name: 'Aprendizaje Práctico', url: 'aprendizaje-practico.html' },
    { name: 'Aprendizaje Autónomo', url: 'aprendizaje-autonomo.html' },
    { name: 'Logro de Aprendizaje', url: 'logro-aprendizaje.html' }
  ]
};

function getNextPageUrl(currentUrl) {
  // Obtén el nombre del archivo actual
  const fileName = currentUrl.split('/').pop();
  
  // Busca el archivo en parte1
  let currentIndex = pagesOrder.parte1.findIndex(p => p.url === fileName);
  let currentPart = 'parte1';
  
  if (currentIndex === -1) {
    // Busca en parte2
    currentIndex = pagesOrder.parte2.findIndex(p => p.url === fileName);
    currentPart = 'parte2';
  }
  
  if (currentIndex === -1) return null; // No encontrado
  
  // Si no es el último de su parte, siguiente en la misma parte
  if (currentIndex < pagesOrder[currentPart].length - 1) {
    return pagesOrder[currentPart][currentIndex + 1].url;
  }
  
  // Si es el último de parte1, siguiente es el primero de parte2
  if (currentPart === 'parte1') {
    return pagesOrder.parte2[0].url;
  }
  
  // Si es el último de parte2, va a índice (volver al portafolio)
  return 'index.html#portfolio';
}

function getPreviousPageUrl(currentUrl) {
  const fileName = currentUrl.split('/').pop();
  
  let currentIndex = pagesOrder.parte1.findIndex(p => p.url === fileName);
  let currentPart = 'parte1';
  
  if (currentIndex === -1) {
    currentIndex = pagesOrder.parte2.findIndex(p => p.url === fileName);
    currentPart = 'parte2';
  }
  
  if (currentIndex === -1) return null;
  
  // Si no es el primero de su parte, anterior en la misma parte
  if (currentIndex > 0) {
    return pagesOrder[currentPart][currentIndex - 1].url;
  }
  
  // Si es el primero de parte2, anterior es el último de parte1
  if (currentPart === 'parte2') {
    return pagesOrder.parte1[pagesOrder.parte1.length - 1].url;
  }
  
  // Si es el primero de parte1, va a índice
  return 'index.html#portfolio';
}

function getNextPageName(currentUrl) {
  const nextUrl = getNextPageUrl(currentUrl);
  if (!nextUrl) return 'Portafolio';
  
  const next = [...pagesOrder.parte1, ...pagesOrder.parte2].find(p => p.url === nextUrl);
  return next ? next.name : 'Portafolio';
}

function getPreviousPageName(currentUrl) {
  const prevUrl = getPreviousPageUrl(currentUrl);
  if (!prevUrl) return 'Portafolio';
  
  const prev = [...pagesOrder.parte1, ...pagesOrder.parte2].find(p => p.url === prevUrl);
  return prev ? prev.name : 'Portafolio';
}

// Inicializa botones de navegación en las páginas
function initNavigationButtons() {
  // Obtén el nombre de la página actual desde window.location.pathname
  const currentPath = window.location.pathname;
  const currentUrl = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html';
  
  const nextUrl = getNextPageUrl(currentUrl);
  const prevUrl = getPreviousPageUrl(currentUrl);
  
  const nextBtn = document.getElementById('next-theme-btn');
  const prevBtn = document.getElementById('prev-theme-btn');
  const navContainer = document.getElementById('theme-navigation');
  
  if (nextBtn && nextUrl) {
    nextBtn.href = nextUrl;
    nextBtn.textContent = `Siguiente: ${getNextPageName(currentUrl)} →`;
  }
  
  if (prevBtn && prevUrl) {
    prevBtn.href = prevUrl;
    prevBtn.textContent = `← Anterior: ${getPreviousPageName(currentUrl)}`;
    // Asegura que el botón 'Anterior' use la misma clase que el botón 'Siguiente'
    prevBtn.className = 'button';
  }
  
  // Si no hay botones, créalos dinámicamente
  if (!navContainer && nextUrl) {
    const container = document.createElement('nav');
    container.id = 'theme-navigation';
    container.className = 'theme-navigation';
    
    let html = '';
    
    if (prevUrl) {
      html += `<a href="${prevUrl}" class="button" id="prev-theme-btn">← Anterior: ${getPreviousPageName(currentUrl)}</a>`;
    }
    
    if (nextUrl) {
      html += `<a href="${nextUrl}" class="button" id="next-theme-btn">Siguiente: ${getNextPageName(currentUrl)} →</a>`;
    }
    
    container.innerHTML = html;
    
    // Inserta antes del footer
    const footer = document.querySelector('footer');
    if (footer) {
      footer.parentNode.insertBefore(container, footer);
    } else {
      document.body.appendChild(container);
    }
  }
}

// Ejecuta al cargar el DOM
document.addEventListener('DOMContentLoaded', initNavigationButtons);
