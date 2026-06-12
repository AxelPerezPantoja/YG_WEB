document.addEventListener("DOMContentLoaded", () => {
	// ========== SISTEMA DE NOTIFICACIONES PERSONALIZADAS ==========

	// Crear contenedor de notificaciones si no existe
	function createNotificationContainer() {
		if (!document.querySelector(".notification-container")) {
			const container = document.createElement("div");
			container.className = "notification-container";
			document.body.appendChild(container);
		}
		return document.querySelector(".notification-container");
	}

	// Mostrar notificación personalizada
	function showNotification(options) {
		const container = createNotificationContainer();

		const {
			type = "info", // success, error, warning, info
			title = "",
			message = "",
			duration = 4000, // milisegundos
		} = options;

		// Iconos según tipo
		const icons = {
			success: "✅",
			error: "❌",
			warning: "⚠️",
			info: "ℹ️",
		};

		const titles = {
			success: "¡Éxito!",
			error: "Error",
			warning: "Atención",
			info: "Información",
		};

		// Crear elemento notificación
		const notification = document.createElement("div");
		notification.className = `notification notification-${type}`;
		notification.innerHTML = `
            <div class="notification-icon">${icons[type] || "ℹ️"}</div>
            <div class="notification-content">
                <div class="notification-title">${title || titles[type]}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close">✕</button>
        `;

		container.appendChild(notification);

		// Animar entrada
		setTimeout(() => {
			notification.classList.add("show");
		}, 10);

		// Configurar cierre manual
		const closeBtn = notification.querySelector(".notification-close");
		closeBtn.addEventListener("click", () => {
			closeNotification(notification);
		});

		// Cierre automático
		let timeout = setTimeout(() => {
			closeNotification(notification);
		}, duration);

		// Cerrar al hacer clic en cualquier parte
		notification.addEventListener("click", (e) => {
			if (
				e.target === notification ||
				e.target.classList.contains("notification-content")
			) {
				clearTimeout(timeout);
				closeNotification(notification);
			}
		});

		function closeNotification(el) {
			el.classList.remove("show");
			el.classList.add("hide");
			setTimeout(() => {
				el.remove();
			}, 300);
		}
	}

	// 1. SCROLL SUAVE PARA ANCLAS
	document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
		anchor.addEventListener("click", function (e) {
			const href = this.getAttribute("href");
			if (href && href.startsWith("#")) {
				e.preventDefault();
				const target = document.querySelector(href);
				if (target) {
					target.scrollIntoView({ behavior: "smooth" });
				}
			}
		});
	});

	// 2. FUNCIÓN AVANZADA PARA VALIDAR EMAIL
	function isValidEmail(email) {
		email = email.trim();

		const emailRegex =
			/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9][a-zA-Z0-9.-]{2,}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;

		if (!emailRegex.test(email)) {
			return false;
		}

		const invalidPatterns = [
			/\.\./,
			/^\./,
			/\.@/,
			/@\./,
			/^-/,
			/-$/,
			/--/,
			/[<>()[\]\\,;:\s]/,
		];

		for (const pattern of invalidPatterns) {
			if (pattern.test(email)) {
				return false;
			}
		}

		const parts = email.split("@");
		if (parts.length !== 2) return false;

		const domainPart = parts[1];
		if (!domainPart.includes(".")) return false;

		const lastDot = domainPart.lastIndexOf(".");
		const domainName = domainPart.substring(0, lastDot);
		const extension = domainPart.substring(lastDot + 1);

		if (domainName.length < 3) return false;
		if (domainName.length > 63) return false;
		if (extension.length < 2 || extension.length > 6) return false;
		if (!/^[a-zA-Z]+$/.test(extension)) return false;

		return true;
	}

	// 3. GESTIÓN DE FORMULARIOS CON VALIDACIÓN MEJORADA
	const forms = document.querySelectorAll(".styled-form");

	forms.forEach((form) => {
		const emailInput = form.querySelector('input[type="email"]');
		const errorSpan = form.querySelector(".error-message");

		if (emailInput && errorSpan) {
			emailInput.addEventListener("input", function () {
				const email = this.value.trim();
				if (email !== "" && !isValidEmail(email)) {
					errorSpan.style.display = "block";
					this.style.borderColor = "#EC4899";
				} else {
					errorSpan.style.display = "none";
					this.style.borderColor = "rgba(0, 102, 255, 0.2)";
				}
			});

			emailInput.addEventListener("blur", function () {
				const email = this.value.trim();
				if (email !== "" && !isValidEmail(email)) {
					errorSpan.style.display = "block";
					this.style.borderColor = "#EC4899";

					if (!email.includes("@")) {
						errorSpan.innerHTML =
							'⚠️ El correo debe contener un "@" (ejemplo: nombre@dominio.com)';
					} else if (email.split("@").length !== 2) {
						errorSpan.innerHTML = '⚠️ El correo solo puede tener un "@"';
					} else if (email.includes("@.")) {
						errorSpan.innerHTML =
							'⚠️ No puede haber un punto inmediatamente después del "@"';
					} else if (
						email.split("@")[1] &&
						!email.split("@")[1].includes(".")
					) {
						errorSpan.innerHTML =
							"⚠️ El dominio debe contener un punto (ejemplo: dominio.com)";
					} else {
						const domainPart = email.split("@")[1];
						if (domainPart) {
							const domainName = domainPart.substring(
								0,
								domainPart.lastIndexOf("."),
							);
							if (domainName && domainName.length < 3) {
								errorSpan.innerHTML =
									'⚠️ El dominio es demasiado corto (ejemplo: "gmail", "yahoo" - mínimo 3 letras)';
							} else {
								errorSpan.innerHTML =
									"⚠️ Ingresa un correo válido (ejemplo: nombre@gmail.com)";
							}
						}
					}
				} else if (email !== "") {
					errorSpan.style.display = "none";
					this.style.borderColor = "rgba(0, 102, 255, 0.2)";
				}
			});
		}

		form.addEventListener("submit", (e) => {
			e.preventDefault();

			if (emailInput) {
				const email = emailInput.value.trim();

				if (email === "") {
					showNotification({
						type: "warning",
						title: "Campo requerido",
						message: "Por favor, ingresa tu correo electrónico.",
						duration: 4000,
					});
					emailInput.focus();
					if (errorSpan) {
						errorSpan.innerHTML = "⚠️ El correo electrónico es obligatorio";
						errorSpan.style.display = "block";
					}
					emailInput.style.borderColor = "#EC4899";
					return;
				}

				if (!isValidEmail(email)) {
					let errorMessage = "";
					if (!email.includes("@")) {
						errorMessage =
							'El correo debe contener un "@" (ejemplo: nombre@dominio.com)';
					} else if (email.split("@").length !== 2) {
						errorMessage = 'El correo solo puede tener un "@"';
					} else if (!email.includes(".")) {
						errorMessage =
							"El dominio debe contener un punto (ejemplo: dominio.com)";
					} else {
						const parts = email.split("@");
						if (parts.length === 2) {
							const domainPart = parts[1];
							const domainName = domainPart.substring(
								0,
								domainPart.lastIndexOf("."),
							);
							if (domainName && domainName.length < 3) {
								errorMessage =
									"El dominio es demasiado corto. Usa un dominio real como @gmail.com, @yahoo.com, etc.";
							} else {
								errorMessage =
									"Formato de correo inválido. Ejemplo válido: usuario@dominio.com";
							}
						} else {
							errorMessage =
								"Formato de correo inválido. Ejemplo válido: usuario@dominio.com";
						}
					}

					showNotification({
						type: "error",
						title: "Correo inválido",
						message: errorMessage,
						duration: 5000,
					});

					emailInput.focus();
					if (errorSpan) {
						errorSpan.style.display = "block";
					}
					emailInput.style.borderColor = "#EC4899";
					return;
				}
			}

			// Éxito - Notificación personalizada
			showNotification({
				type: "success",
				title: "¡Solicitud enviada!",
				message:
					"Gracias por contactarnos. Un asesor se comunicará en las próximas 24 horas.",
				duration: 5000,
			});

			form.reset();

			if (emailInput) {
				emailInput.style.borderColor = "rgba(0, 102, 255, 0.2)";
				if (errorSpan) {
					errorSpan.style.display = "none";
				}
			}
		});
	});

	// 4. EFECTO DE HEADER AL HACER SCROLL
	const header = document.querySelector("header");
	if (header) {
		window.addEventListener("scroll", () => {
			if (window.scrollY > 50) {
				header.style.boxShadow = "0 2px 15px rgba(0,0,0,0.1)";
				header.style.padding = "10px 5%";
			} else {
				header.style.boxShadow = "none";
				header.style.padding = "15px 5%";
			}
		});
	}

	// 5. CONTADOR ANIMADO
	const counters = document.querySelectorAll(".trust-number");
	if (counters.length > 0) {
		const animateNumbers = () => {
			counters.forEach((counter) => {
				const target = parseInt(counter.innerText);
				if (!isNaN(target) && !counter.hasAttribute("data-animated")) {
					counter.setAttribute("data-animated", "true");
					let current = 0;
					const increment = target / 50;
					const updateCounter = () => {
						current += increment;
						if (current < target) {
							counter.innerText = Math.ceil(current);
							requestAnimationFrame(updateCounter);
						} else {
							counter.innerText = target;
						}
					};
					updateCounter();
				}
			});
		};

		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					animateNumbers();
					observer.disconnect();
				}
			});
		});

		const trustSection = document.querySelector(".trust-banner");
		if (trustSection) observer.observe(trustSection);
	}
});
