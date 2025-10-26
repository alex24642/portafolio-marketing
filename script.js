const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const filterButtons = document.querySelectorAll('.filter-button');
const portfolioCards = document.querySelectorAll('.portfolio-card');
const testimonials = document.querySelectorAll('.testimonial');
const prevButton = document.querySelector('.slider-button.prev');
const nextButton = document.querySelector('.slider-button.next');
const backToTop = document.querySelector('.back-to-top');
const yearSpan = document.getElementById('current-year');
const uploadForm = document.querySelector('.upload-form');
const uploadedList = document.querySelector('.uploaded-resources-list');
const uploadedEmptyState = document.querySelector('.uploaded-resources-empty');
const previewModal = document.querySelector('.resource-preview');
const previewCloseButton = document.querySelector('.resource-preview-close');
const previewTitle = document.querySelector('.resource-preview-title');
const previewDescription = document.querySelector('.resource-preview-description');
const previewMeta = document.querySelector('.resource-preview-meta');
const previewBody = document.querySelector('.resource-preview-body');
const previewUnavailable = document.querySelector('.resource-preview-unavailable');
const previewDownload = document.querySelector('.resource-preview-download');

if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', (!expanded).toString());
    navLinks.classList.toggle('show');
  });
}

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;

    filterButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    portfolioCards.forEach(card => {
      const matches = filter === 'all' || card.dataset.category === filter;
      card.style.display = matches ? 'grid' : 'none';
    });
  });
});

let currentTestimonial = 0;
const updateTestimonials = () => {
  testimonials.forEach((testimonial, index) => {
    testimonial.classList.toggle('active', index === currentTestimonial);
  });
};

if (prevButton && nextButton) {
  prevButton.addEventListener('click', () => {
    currentTestimonial = (currentTestimonial - 1 + testimonials.length) % testimonials.length;
    updateTestimonials();
  });

  nextButton.addEventListener('click', () => {
    currentTestimonial = (currentTestimonial + 1) % testimonials.length;
    updateTestimonials();
  });
}

setInterval(() => {
  currentTestimonial = (currentTestimonial + 1) % testimonials.length;
  updateTestimonials();
}, 7000);

const handleScroll = () => {
  if (window.scrollY > 400) {
    backToTop?.classList.add('visible');
  } else {
    backToTop?.classList.remove('visible');
  }
};

window.addEventListener('scroll', handleScroll);

backToTop?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

const RESOURCE_STORAGE_KEY = 'saboresRecursosPersonalizados';
let lastFocusedElement = null;

const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `res-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const formatBytes = (bytes) => {
  if (!bytes) return '0 KB';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const order = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
  const value = bytes / Math.pow(1024, order);
  return `${value.toFixed(order === 0 ? 0 : 1)} ${sizes[order]}`;
};

const getStoredResources = () => {
  try {
    const stored = localStorage.getItem(RESOURCE_STORAGE_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('No se pudieron leer los recursos almacenados', error);
    return [];
  }
};

const saveResources = (resources) => {
  try {
    localStorage.setItem(RESOURCE_STORAGE_KEY, JSON.stringify(resources));
    return true;
  } catch (error) {
    console.error('No se pudieron guardar los recursos personalizados', error);
    throw new Error('No se pudo guardar el recurso porque el almacenamiento está lleno o deshabilitado.');
  }
};

const clearPreviewMedia = () => {
  if (!previewBody) return;
  const existingMedia = previewBody.querySelector('.resource-preview-render');
  existingMedia?.remove();
  if (previewUnavailable) {
    previewUnavailable.hidden = true;
  }
};

const closePreview = () => {
  if (!previewModal) return;
  previewModal.classList.remove('visible');
  previewModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  if (lastFocusedElement) {
    lastFocusedElement.focus();
    lastFocusedElement = null;
  }
  clearPreviewMedia();
};

const openPreview = (resource) => {
  if (!previewModal || !previewTitle || !previewDescription || !previewMeta || !previewBody || !previewDownload) {
    return;
  }

  previewTitle.textContent = resource.name;
  previewDescription.textContent = resource.description || 'Sin descripción disponible para este recurso.';

  previewMeta.innerHTML = '';
  const typeItem = document.createElement('li');
  typeItem.textContent = `Tipo: ${resource.type || 'Desconocido'}`;
  const sizeItem = document.createElement('li');
  sizeItem.textContent = `Tamaño: ${formatBytes(resource.size)}`;
  const dateItem = document.createElement('li');
  const createdAt = resource.addedAt ? new Date(resource.addedAt) : new Date();
  dateItem.textContent = `Agregado: ${createdAt.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}`;
  previewMeta.append(typeItem, sizeItem, dateItem);

  previewDownload.href = resource.data;
  previewDownload.download = resource.name;

  clearPreviewMedia();

  const mediaWrapper = document.createElement('div');
  mediaWrapper.className = 'resource-preview-render';

  const supportsImage = resource.type?.startsWith('image/');
  const supportsPdf = resource.type === 'application/pdf';
  const supportsText = resource.type?.startsWith('text/');

  if (supportsImage) {
    const image = document.createElement('img');
    image.src = resource.data;
    image.alt = resource.description || resource.name;
    image.loading = 'lazy';
    mediaWrapper.append(image);
  } else if (supportsPdf || supportsText) {
    const frame = document.createElement('iframe');
    frame.src = resource.data;
    frame.title = `Vista previa de ${resource.name}`;
    frame.setAttribute('loading', 'lazy');
    mediaWrapper.append(frame);
  } else {
    if (previewUnavailable) {
      previewUnavailable.hidden = false;
    }
  }

  if (mediaWrapper.childElementCount > 0) {
    previewBody.append(mediaWrapper);
  }

  lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  previewModal.classList.add('visible');
  previewModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  previewCloseButton?.focus();
};

const renderStoredResources = () => {
  if (!uploadedList) {
    return;
  }

  const resources = getStoredResources();
  uploadedList.innerHTML = '';

  if (!resources.length) {
    uploadedEmptyState?.removeAttribute('hidden');
    return;
  }

  uploadedEmptyState?.setAttribute('hidden', '');

  resources.forEach((resource) => {
    const card = document.createElement('article');
    card.className = 'uploaded-resource-card';
    card.setAttribute('role', 'listitem');

    const info = document.createElement('div');
    info.className = 'uploaded-resource-info';

    const title = document.createElement('h4');
    title.textContent = resource.name;

    const description = document.createElement('p');
    description.textContent = resource.description?.trim() || 'Sin descripción añadida.';

    const meta = document.createElement('ul');
    meta.className = 'uploaded-resource-meta';

    const typeItem = document.createElement('li');
    typeItem.textContent = resource.type || 'Tipo no disponible';

    const sizeItem = document.createElement('li');
    sizeItem.textContent = formatBytes(resource.size);

    const dateItem = document.createElement('li');
    const addedDate = resource.addedAt ? new Date(resource.addedAt) : new Date();
    dateItem.textContent = addedDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });

    meta.append(typeItem, sizeItem, dateItem);

    info.append(title, description, meta);

    const actions = document.createElement('div');
    actions.className = 'uploaded-resource-actions';

    const previewButton = document.createElement('button');
    previewButton.type = 'button';
    previewButton.className = 'button ghost';
    previewButton.textContent = 'Vista previa';
    previewButton.dataset.resourceId = resource.id;

    const downloadLink = document.createElement('a');
    downloadLink.href = resource.data;
    downloadLink.download = resource.name;
    downloadLink.className = 'button secondary';
    downloadLink.textContent = 'Descargar';

    actions.append(previewButton, downloadLink);

    card.append(info, actions);
    uploadedList.append(card);
  });
};

const readFiles = (files, description) => Promise.all(
  files.map((file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        id: generateId(),
        name: file.name,
        description,
        type: file.type,
        size: file.size,
        data: reader.result,
        addedAt: new Date().toISOString(),
      });
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado.'));
    reader.readAsDataURL(file);
  }))
);

uploadForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const fileInput = uploadForm.querySelector('input[type="file"]');
  const descriptionInput = uploadForm.querySelector('textarea');
  const files = Array.from(fileInput?.files || []);
  const description = descriptionInput?.value.trim() || '';

  if (!files.length) {
    alert('Selecciona al menos un archivo para guardarlo en tu biblioteca.');
    return;
  }

  try {
    const newResources = await readFiles(files, description);
    const storedResources = getStoredResources();
    const updatedResources = [...newResources, ...storedResources];
    saveResources(updatedResources);
    renderStoredResources();
    uploadForm.reset();
    alert(`¡Recurso${files.length > 1 ? 's' : ''} guardado${files.length > 1 ? 's' : ''}! Ahora es${files.length > 1 ? 'tán' : 'tá'} visible en tu biblioteca.`);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Ocurrió un problema al guardar el archivo. Intenta nuevamente.';
    alert(message);
  }
});

uploadedList?.addEventListener('click', (event) => {
  const previewTrigger = event.target instanceof HTMLElement ? event.target.closest('[data-resource-id]') : null;
  if (!previewTrigger) {
    return;
  }
  const resourceId = previewTrigger.getAttribute('data-resource-id');
  if (!resourceId) {
    return;
  }
  const resources = getStoredResources();
  const resource = resources.find((item) => item.id === resourceId);
  if (resource) {
    openPreview(resource);
  }
});

previewCloseButton?.addEventListener('click', closePreview);

previewModal?.addEventListener('click', (event) => {
  if (event.target === previewModal) {
    closePreview();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && previewModal?.classList.contains('visible')) {
    closePreview();
  }
});

renderStoredResources();

const newsletterForm = document.querySelector('.newsletter-form');
newsletterForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const emailInput = newsletterForm.querySelector('input[type="email"]');
  if (emailInput && emailInput.validity.valid) {
    alert('¡Gracias por suscribirte! Pronto recibirás ideas deliciosas.');
    newsletterForm.reset();
  }
});

const contactForm = document.querySelector('.contact-form');
contactForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  alert('¡Mensaje enviado! Nos pondremos en contacto contigo para planear la degustación.');
  contactForm.reset();
});
