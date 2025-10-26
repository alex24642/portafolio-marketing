const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const filterButtons = document.querySelectorAll('.filter-button');
const portfolioCards = document.querySelectorAll('.portfolio-card');
const testimonials = document.querySelectorAll('.testimonial');
const prevButton = document.querySelector('.slider-button.prev');
const nextButton = document.querySelector('.slider-button.next');
const backToTop = document.querySelector('.back-to-top');
const yearSpan = document.getElementById('current-year');

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

const uploadForm = document.querySelector('.upload-form');

uploadForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const fileInput = uploadForm.querySelector('input[type="file"]');
  const description = uploadForm.querySelector('textarea');
  const fileCount = fileInput?.files?.length || 0;
  const descriptionText = description?.value.trim();

  if (!fileCount && !descriptionText) {
    alert('Agrega un archivo o escribe una descripción para guardar el recurso.');
    return;
  }

  alert('¡Recurso guardado! Recibimos ' + fileCount + ' archivo(s).');
  uploadForm.reset();
});

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
