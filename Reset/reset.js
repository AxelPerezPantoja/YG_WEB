// ==========================================
// CONFIGURACIÓN
// ==========================================
const API_FORGOT_URL = "http://localhost:8080/api/Auth/forgot-password";

// Elementos DOM
const form = document.getElementById('resetForm');
const emailInput = document.getElementById('email');
const resetBtn = document.getElementById('resetBtn');
const messageContainer = document.getElementById('messageContainer');

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================
function clearMessage() {
    messageContainer.innerHTML = '';
    messageContainer.className = 'message-area';
}

function showError(text) {
    messageContainer.innerHTML = `<div class="error-message"><i class="fas fa-circle-exclamation" style="margin-right: 8px;"></i> ${text}</div>`;
}

function showSuccess(text) {
    messageContainer.innerHTML = `<div class="success-message"><i class="fas fa-check-circle" style="margin-right: 8px;"></i> ${text}</div>`;
}

function setLoading(isLoading) {
    if (isLoading) {
        resetBtn.disabled = true;
        resetBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> <span>Enviando...</span>';
    } else {
        resetBtn.disabled = false;
        resetBtn.innerHTML = '<i class="fas fa-paper-plane"></i> <span>Enviar código</span>';
    }
}

function validateEmail(email) {
    if (!email.trim()) {
        showError('El correo electrónico es obligatorio.');
        return false;
    }
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Ingresa un correo válido (ejemplo: nombre@dominio.com).');
        return false;
    }
    return true;
}

// ==========================================
// SOLICITAR CÓDIGO DE RECUPERACIÓN
// ==========================================
async function requestResetCode(email) {
    try {
        console.log("📡 Enviando petición a:", API_FORGOT_URL);
        
        const response = await fetch(API_FORGOT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        console.log("📡 Status response:", response.status);
        
        const data = await response.json();
        console.log("📡 Datos recibidos:", data);

        if (!response.ok) {
            throw new Error(data.message || 'Error al solicitar recuperación');
        }

        return {
            success: true,
            message: data.message,
            note: data.note
        };

    } catch (error) {
        console.error('❌ Error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ==========================================
// MANEJADOR DEL FORMULARIO
// ==========================================
async function handleSubmit(event) {
    event.preventDefault();

    const email = emailInput.value.trim();

    clearMessage();

    if (!validateEmail(email)) {
        return;
    }

    setLoading(true);

    const result = await requestResetCode(email);

    setLoading(false);

    if (result.success) {
        showSuccess(`✅ ${result.message}`);
        
        // Guardar el email en sessionStorage para usarlo en el siguiente paso
        sessionStorage.setItem('resetEmail', email);
        
        // Redirigir a la página para ingresar el código y nueva contraseña
        setTimeout(() => {
            window.location.href = 'new-password.html';
        }, 2000);
    } else {
        showError(result.error || 'Error al enviar el código. Intenta nuevamente.');
    }
}

// ==========================================
// VERIFICAR SI YA HAY UN EMAIL GUARDADO
// ==========================================
function checkExistingEmail() {
    const savedEmail = sessionStorage.getItem('resetEmail');
    if (savedEmail) {
        emailInput.value = savedEmail;
    }
}

// ==========================================
// EVENT LISTENERS
// ==========================================
form.addEventListener('submit', handleSubmit);
emailInput.addEventListener('input', clearMessage);

// Cargar email guardado si existe
checkExistingEmail();