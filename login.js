// ==========================================
// CONFIGURACIÓN
// ==========================================
const API_LOGIN_URL = "http://localhost:8080/api/Auth/login";

// Elementos DOM
const form = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const toggleBtn = document.getElementById('togglePasswordBtn');
const messageContainer = document.getElementById('messageContainer');
const rememberCheck = document.getElementById('rememberCheck');
const loginBtn = document.getElementById('loginBtn');
const forgotLink = document.getElementById('forgotLink');
const signupMock = document.getElementById('signupMock');

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
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> <span>Verificando...</span>';
    } else {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-arrow-right-to-bracket"></i> <span>Iniciar sesión</span>';
    }
}

function validateInputs(email, password) {
    if (!email.trim()) {
        showError('El correo electrónico es obligatorio.');
        return false;
    }
    if (!password.trim()) {
        showError('Por favor, ingresa tu contraseña.');
        return false;
    }
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Ingresa un correo válido (ejemplo: nombre@dominio.com).');
        return false;
    }
    return true;
}

// Guardar token y datos del usuario
function saveAuthData(token, userData) {
    if (rememberCheck.checked) {
        localStorage.setItem('authToken', token);
        localStorage.setItem('userEmail', userData.email);
        localStorage.setItem('userName', userData.username);
        localStorage.setItem('userRole', userData.role);
        localStorage.setItem('tokenExpiresAt', userData.expiresAt);
    } else {
        sessionStorage.setItem('authToken', token);
        sessionStorage.setItem('userEmail', userData.email);
        sessionStorage.setItem('userName', userData.username);
        sessionStorage.setItem('userRole', userData.role);
        sessionStorage.setItem('tokenExpiresAt', userData.expiresAt);
    }
    console.log("✅ Token guardado correctamente");
}

// Realizar petición de login
async function performLogin(email, password) {
    try {
        console.log("📡 Enviando petición a:", API_LOGIN_URL);
        
        const response = await fetch(API_LOGIN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        console.log("📡 Status response:", response.status);
        
        const data = await response.json();
        console.log("📡 Datos recibidos:", data);

        if (!response.ok) {
            if (data.message) {
                throw new Error(data.message);
            } else {
                throw new Error('Credenciales inválidas');
            }
        }

        if (!data.token) {
            throw new Error('No se recibió token de autenticación');
        }

        return {
            success: true,
            token: data.token,
            user: {
                username: data.username,
                email: data.email,
                role: data.role,
                expiresAt: data.expiresAt
            }
        };

    } catch (error) {
        console.error('❌ Error en login:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ==========================================
// MANEJADOR DEL LOGIN
// ==========================================
async function handleSubmit(event) {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    clearMessage();

    if (!validateInputs(email, password)) {
        return;
    }

    setLoading(true);

    const result = await performLogin(email, password);

    setLoading(false);

    if (result.success) {
        saveAuthData(result.token, result.user);
        
        showSuccess(`✅ ¡Bienvenido, ${result.user.username}! Redirigiendo al dashboard...`);
        
        setTimeout(() => {
            window.location.href = 'Dash/Dashindex.html';
        }, 1200);
    } else {
        showError(result.error || 'Credenciales inválidas. Intenta nuevamente.');
        passwordInput.value = '';
        passwordInput.focus();
    }
}

// ==========================================
// MOSTRAR/OCULTAR CONTRASEÑA
// ==========================================
function togglePasswordVisibility() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    const icon = toggleBtn.querySelector('i');
    if (type === 'text') {
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    } else {
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    }
}

function handleForgotPassword(e) {
    e.preventDefault();
    showError('📧 Contacta con el administrador para restablecer tu contraseña.');
}

function handleSignup(e) {
    e.preventDefault();
    showSuccess('📋 Solicita acceso escribiendo a soporte@ygsoluciones.com');
}

function checkExistingSession() {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token) {
        const email = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
        if (email) {
            emailInput.value = email;
            rememberCheck.checked = !!localStorage.getItem('authToken');
            showSuccess(`👋 Sesión previa detectada para ${email}. Ingresa tu contraseña para continuar.`);
        }
    }
}

// ==========================================
// EVENT LISTENERS
// ==========================================
form.addEventListener('submit', handleSubmit);
toggleBtn.addEventListener('click', togglePasswordVisibility);
//forgotLink.addEventListener('click', handleForgotPassword);
signupMock.addEventListener('click', handleSignup);
toggleBtn.addEventListener('mousedown', (e) => e.preventDefault());

emailInput.addEventListener('input', clearMessage);
passwordInput.addEventListener('input', clearMessage);

checkExistingSession();