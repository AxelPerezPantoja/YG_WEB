document.addEventListener('DOMContentLoaded', () => {
    // 1. SCROLL SUAVE PARA ANCLAS
    // Esto permite que al hacer clic en "CONTACT" desde el index, baje suavemente.
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            
            // Si el enlace es solo un ancla (ej. #solicitud)
            if (href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    // 2. GESTIÓN DEL FORMULARIO DE CONTACTO
    // Solo se ejecuta si el formulario existe en la página actual (evita errores en About Us)
    const form = document.querySelector('.styled-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            // Simulación de envío
            alert('¡Gracias! Tu solicitud ha sido enviada a YG Solución. Nos pondremos en contacto pronto.');
            form.reset();
        });
    }

    // 3. EFECTO DE HEADER ACTIVO AL HACER SCROLL
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
            header.style.padding = '10px 5%';
        } else {
            header.style.boxShadow = 'none';
            header.style.padding = '15px 5%';
        }
    });
});