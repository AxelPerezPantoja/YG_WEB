// ==========================================
// CONFIGURACIÓN
// ==========================================
const API_RESET_URL = "http://localhost:8080/api/Auth/reset-password";

// Elementos DOM
const form = document.getElementById('resetPasswordForm');
const emailInput = document.getElementById('email');
const resetCodeInput = document.getElementById('resetCode');
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
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
        resetBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> <span>Restableciendo...</span>';
    } else {
        resetBtn.disabled = false;
        resetBtn.innerHTML = '<i class="fas fa-save"></i> <span>Restablecer contraseña</span>';
    }
}

function togglePassword(inputId, btnId) {
    const input = document.getElementById(inputId);
    const btn = document.getElementById(btnId);
    if (input && btn) {
        btn.addEventListener('click', () => {
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            const icon = btn.querySelector('i');
            if (type === 'text') {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            } else {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            }
        });
        btn.addEventListener('mousedown', (e) => e.preventDefault());
    }
}

function validateForm(email, resetCode, newPassword, confirmPassword) {
    if (!email.trim()) {
        showError('El correo electrónico es obligatorio.');
        return false;
    }
    if (!resetCode.trim()) {
        showError('El código de verificación es obligatorio.');
        return false;
    }
    if (resetCode.length < 6) {
        showError('El código debe tener al menos 6 caracteres.');
        return false;
    }
    if (!newPassword.trim()) {
        showError('La nueva contraseña es obligatoria.');
        return false;
    }
    if (newPassword.length < 6) {
        showError('La contraseña debe tener al menos 6 caracteres.');
        return false;
    }
    if (newPassword !== confirmPassword) {
        showError('Las contraseñas no coinciden.');
        return false;
    }
    return true;
}

// ==========================================
// RESTABLECER CONTRASEÑA
// ==========================================
async function resetPassword(email, resetCode, newPassword) {
    try {
        console.log("📡 Enviando petición a:", API_RESET_URL);
        
        const response = await fetch(API_RESET_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email, resetCode, newPassword })
        });

        console.log("📡 Status response:", response.status);
        
        const data = await response.json();
        console.log("📡 Datos recibidos:", data);

        if (!response.ok) {
            throw new Error(data.message || 'Error al restablecer la contraseña');
        }

        return {
            success: true,
            message: data.message
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
    const resetCode = resetCodeInput.value.trim();
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    clearMessage();

    if (!validateForm(email, resetCode, newPassword, confirmPassword)) {
        return;
    }

    setLoading(true);

    const result = await resetPassword(email, resetCode, newPassword);

    setLoading(false);

    if (result.success) {
        showSuccess(`✅ ${result.message}`);
        
        // Limpiar datos de recuperación
        sessionStorage.removeItem('resetEmail');
        
        // Redirigir al login después de 2 segundos
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 2000);
    } else {
        showError(result.error || 'Error al restablecer la contraseña. Verifica el código e intenta nuevamente.');
    }
}

// ==========================================
// CARGAR EMAIL GUARDADO
// ==========================================
function loadSavedEmail() {
    const savedEmail = sessionStorage.getItem('resetEmail');
    if (savedEmail) {
        emailInput.value = savedEmail;
    } else {
        // Si no hay email guardado, redirigir al paso anterior
        showError('No se encontró información de recuperación. Por favor, solicita un nuevo código.');
        setTimeout(() => {
            window.location.href = 'reset.html';
        }, 2000);
    }
}

// ==========================================
// EVENT LISTENERS
// ==========================================
form.addEventListener('submit', handleSubmit);
resetCodeInput.addEventListener('input', clearMessage);
newPasswordInput.addEventListener('input', clearMessage);
confirmPasswordInput.addEventListener('input', clearMessage);

// Configurar toggles de contraseña
togglePassword('newPassword', 'toggleNewPassword');
togglePassword('confirmPassword', 'toggleConfirmPassword');

// Cargar email guardado
loadSavedEmail();