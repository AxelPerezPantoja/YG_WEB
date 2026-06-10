// ==========================================
// CONFIGURACIÓN
// ==========================================
const API_URL = "http://localhost:8080/api";

// ==========================================
// FUNCIÓN PARA OBTENER EL TOKEN GUARDADO
// ==========================================
function getAuthToken() {
    // Buscar en ambos storages
    let token = localStorage.getItem('authToken');
    if (!token) token = sessionStorage.getItem('authToken');
    
    console.log("🔑 Buscando token en storage...");
    console.log("localStorage authToken:", localStorage.getItem('authToken') ? "SÍ" : "NO");
    console.log("sessionStorage authToken:", sessionStorage.getItem('authToken') ? "SÍ" : "NO");
    
    if (!token) {
        console.error("❌ No hay token de autenticación");
        return null;
    }
    
    console.log("✅ Token encontrado:", token.substring(0, 50) + "...");
    return token;
}

// ==========================================
// MOSTRAR INFORMACIÓN DEL USUARIO
// ==========================================
function displayUserInfo() {
    let userName = localStorage.getItem('userName');
    if (!userName) userName = sessionStorage.getItem('userName');
    
    let userRole = localStorage.getItem('userRole');
    if (!userRole) userRole = sessionStorage.getItem('userRole');
    
    const userInfoDiv = document.getElementById('userInfo');
    if (userInfoDiv) {
        const displayName = userName || 'Usuario';
        userInfoDiv.innerHTML = `
            <span style="font-size:0.85rem;">
                <i class="fas fa-user-circle"></i> ${displayName} 
                <span style="color:var(--text2);font-size:0.75rem;">${userRole || 'Usuario'}</span>
            </span>
            <button id="logoutBtn" class="logout-btn">🚪 Cerrar sesión</button>
        `;
        
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '../index.html';
            });
        }
    }
}

// ==========================================
// FUNCIÓN obtenerDatos - SIN REDIRECCIÓN AUTOMÁTICA
// ==========================================
async function obtenerDatos(endpoint) {
    const token = getAuthToken();
    
    // Si no hay token, mostrar error pero NO redirigir automáticamente
    if (!token) {
        console.error("❌ No hay token disponible para:", endpoint);
        // Mostrar mensaje en consola pero no interrumpir
        throw new Error("No hay token de autenticación");
    }
    
    try {
        console.log(`📡 Fetching: ${API_URL}/${endpoint}`);
        console.log(`🔑 Usando token: ${token.substring(0, 30)}...`);

        const response = await fetch(`${API_URL}/${endpoint}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        console.log(`📡 Status: ${response.status}`);

        // Si es 401, mostrar error pero NO redirigir
        if (response.status === 401) {
            console.error("❌ Token inválido o expirado (401)");
            // Mostrar mensaje en el dashboard
            const msgDiv = document.createElement('div');
            msgDiv.style.cssText = 'background:#ef476f;color:white;padding:10px;text-align:center;position:fixed;top:70px;left:0;right:0;z-index:1000;';
            msgDiv.innerHTML = '⚠️ Token expirado. Por favor, <a href="../index.html" style="color:white;font-weight:bold;">vuelve a iniciar sesión</a>';
            document.body.prepend(msgDiv);
            throw new Error("Token inválido");
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log(`✅ Datos recibidos de ${endpoint}:`, data);
        return data;

    } catch (error) {
        console.error(`❌ Error en ${endpoint}:`, error);
        throw error;
    }
}

// ==========================================
// VARIABLES GLOBALES
// ==========================================
let barServiciosChart, lineaIngresosChart, pieCanalesChart, barZonasChart, pieEstadosChart, barGananciasChart, barMaterialesChart;

// ==========================================
// FUNCIÓN: Cargar ingresos mensuales
// ==========================================
async function cargarIngresosMensuales() {
    try {
        const año = 2026;
        
        if (!lineaIngresosChart) {
            console.warn("⏳ Gráfico aún no inicializado, reintentando...");
            setTimeout(cargarIngresosMensuales, 500);
            return;
        }
        
        const promesas = [];
        for (let mes = 1; mes <= 12; mes++) {
            promesas.push(
                obtenerDatos(`Dashboard/ingreso-por-mes?año=${año}&mes=${mes}`)
                    .catch(err => ({ ingreso_total: 0 }))
            );
        }
        
        const resultados = await Promise.all(promesas);
        const ingresos = resultados.map(r => r.ingreso_total || 0);
        
        lineaIngresosChart.data.datasets[0].data = ingresos;
        lineaIngresosChart.update();
        console.log("✅ Ingresos mensuales cargados:", ingresos);
        
    } catch (error) {
        console.error("❌ Error cargando ingresos mensuales:", error);
    }
}

// ==========================================
// CREAR GRÁFICOS
// ==========================================
function crearGraficos() {
    const ctx1 = document.getElementById('barServicios');
    const ctx2 = document.getElementById('lineaIngresos');
    const ctx3 = document.getElementById('pieCanales');
    const ctx4 = document.getElementById('barZonas');

    if (ctx1) {
        barServiciosChart = new Chart(ctx1, {
            type: 'bar',
            data: { labels: [], datasets: [{ label: 'Órdenes', data: [], backgroundColor: '#00b4d8' }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { color: '#9aa4bf' }, grid: { color: '#1e2d45' } },
                    x: { ticks: { color: '#9aa4bf' } } } }
        });
    }
    
    if (ctx2) {
        lineaIngresosChart = new Chart(ctx2, {
            type: 'line',
            data: { labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'], 
                     datasets: [{ label: 'Ingresos C$', data: [], borderColor: '#06d6a0', tension: 0.3, fill: true,
                    backgroundColor: 'rgba(6,214,160,0.1)' }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
                scales: { y: { ticks: { color: '#9aa4bf', callback: v => 'C$' + v.toLocaleString() },
                        grid: { color: '#1e2d45' } }, x: { ticks: { color: '#9aa4bf' } } } }
        });
    }
    
    if (ctx3) {
        pieCanalesChart = new Chart(ctx3, {
            type: 'doughnut',
            data: { labels: [], datasets: [{ data: [], backgroundColor: ['#00b4d8', '#0077b6', '#f77f00', '#ffd166'] }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom',
                        labels: { color: '#9aa4bf' } } } }
        });
    }
    
    if (ctx4) {
        barZonasChart = new Chart(ctx4, {
            type: 'bar',
            data: { labels: [], datasets: [] },
            options: { responsive: true, maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#f3f4f7' } } },
                scales: { y: { beginAtZero: true, ticks: { color: '#9aa4bf' }, grid: { color: '#1e2d45' } },
                    x: { ticks: { color: '#9aa4bf' } } } }
        });
    }
    
    const ctx5 = document.getElementById("barMateriales");
    if (ctx5) {
        barMaterialesChart = new Chart(ctx5, {
            type: "bar",
            data: { labels: [], datasets: [{ label: "Cantidad utilizada", data: [], backgroundColor: '#00b4d8' }] },
            options: { indexAxis: "y", responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }

    const ctxEstados = document.getElementById("pieEstados");
    if (ctxEstados) {
        pieEstadosChart = new Chart(ctxEstados, {
            type: "doughnut",
            data: { labels: [], datasets: [{ data: [], backgroundColor: ["#06d6a0", "#ffd166", "#ef476f"] }] },
            options: { responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: "bottom", labels: { color: "#9aa4bf" } } } }
        });
    }

    const ctxGanancias = document.getElementById("barGanancias");
    if (ctxGanancias) {
        barGananciasChart = new Chart(ctxGanancias, {
            type: "bar",
            data: { labels: [], datasets: [{ label: "Ganancia C$", data: [], backgroundColor: '#f77f00' }] },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
}

// ==========================================
// FUNCIONES DE CARGA DE DATOS
// ==========================================
async function cargarServiciosDemandados() {
    try {
        const data = await obtenerDatos("Dashboard/servicios-demandados");
        if (data.servicios && barServiciosChart) {
            barServiciosChart.data.labels = data.servicios.map(s => s.servicio);
            barServiciosChart.data.datasets[0].data = data.servicios.map(s => s.total_ordenes);
            barServiciosChart.update();
        }
    } catch (error) {
        console.error("❌ Error cargando servicios demandados:", error);
    }
}

async function cargarEstadoOrdenes() {
    try {
        const data = await obtenerDatos("Dashboard/estado-ordenes");
        if (data.estados && pieEstadosChart) {
            pieEstadosChart.data.labels = data.estados.map(e => e.estado);
            pieEstadosChart.data.datasets[0].data = data.estados.map(e => e.total);
            pieEstadosChart.update();
        }
    } catch (error) {
        console.error("❌ Error cargando estados:", error);
    }
}

async function cargarCaptacionCanal() {
    try {
        const data = await obtenerDatos("Dashboard/captacion-canal");
        if (data.canales && pieCanalesChart) {
            pieCanalesChart.data.labels = data.canales.map(c => c.canal);
            pieCanalesChart.data.datasets[0].data = data.canales.map(c => c.clientes_obtenidos);
            pieCanalesChart.update();
        }
    } catch (error) {
        console.error("❌ Error cargando captación:", error);
    }
}

async function cargarRendimientoTecnicos() {
    try {
        const data = await obtenerDatos("Dashboard/rendimiento-tecnicos");
        const tbody = document.getElementById("tablaTecnicosBody");
        if (tbody && data.tecnicos) {
            tbody.innerHTML = "";
            data.tecnicos.forEach(t => {
                const eficiencia = t.total_ordenes > 0 ? ((t.completadas / t.total_ordenes) * 100).toFixed(1) : 0;
                tbody.innerHTML += `
                    <tr>
                        <td style="padding:8px;">${t.tecnico}</td>
                        <td>${t.total_ordenes}</td>
                        <td>${t.completadas}</td>
                        <td>${eficiencia}%</td>
                        <td>${t.pendientes}</td>
                    </tr>
                `;
            });
        }
    } catch (error) {
        console.error("Error cargando técnicos:", error);
    }
}

async function cargarServiciosPorZona() {
    try {
        const data = await obtenerDatos("Dashboard/servicios-por-zona");
        if (data.detalle && barZonasChart) {
            const zonas = [...new Set(data.detalle.map(d => d.zona))];
            const servicios = [...new Set(data.detalle.map(d => d.servicio))];
            const datasets = servicios.map(servicio => ({
                label: servicio,
                data: zonas.map(zona => {
                    const item = data.detalle.find(d => d.zona === zona && d.servicio === servicio);
                    return item ? item.total_ordenes : 0;
                }),
                backgroundColor: `hsl(${Math.random() * 360}, 70%, 55%)`
            }));
            barZonasChart.data.labels = zonas;
            barZonasChart.data.datasets = datasets;
            barZonasChart.update();
        }
    } catch (error) {
        console.error("Error cargando servicios por zona:", error);
    }
}

async function cargarKPIs() {
    try {
        const [ordenes, completadas, estados, tiempo, conversion, finanzas] = await Promise.all([
            obtenerDatos("Dashboard/ordenes-por-lapso"),
            obtenerDatos("Dashboard/ordenes-completadas"),
            obtenerDatos("Dashboard/estado-ordenes"),
            obtenerDatos("Dashboard/tiempo-promedio"),
            obtenerDatos("Dashboard/tasa-conversion"),
            obtenerDatos("Dashboard/costo-ingreso-servicio")
        ]);
        
        const pendientes = estados.estados?.find(e => e.estado === "Pendiente")?.total || 0;
        
        const elementos = {
            kpiInstalaciones: document.getElementById("kpi-instalaciones"),
            kpiPendientes: document.getElementById("kpi-pendientes"),
            kpiSatisfaccion: document.getElementById("kpi-satisfaccion"),
            kpiTiempo: document.getElementById("kpi-tiempo"),
            kpiConversion: document.getElementById("kpi-conversion"),
            kpiIngresos: document.getElementById("kpi-ingresos"),
            kpiGanancia: document.getElementById("kpi-ganancia")
        };
        
        if (elementos.kpiInstalaciones) elementos.kpiInstalaciones.textContent = ordenes.total_ordenes || 0;
        if (elementos.kpiPendientes) elementos.kpiPendientes.textContent = pendientes;
        if (elementos.kpiSatisfaccion) elementos.kpiSatisfaccion.textContent = (completadas.ordenes_completadas || 0) + "%";
        if (elementos.kpiTiempo) elementos.kpiTiempo.textContent = (tiempo.promedio_general_horas || 0) + "h";
        if (elementos.kpiConversion) elementos.kpiConversion.textContent = (conversion.tasa_conversion || 0) + "%";
        if (elementos.kpiIngresos) elementos.kpiIngresos.textContent = "C$ " + (finanzas.totales?.ingreso_total || 0).toLocaleString();
        if (elementos.kpiGanancia) elementos.kpiGanancia.textContent = "C$ " + (finanzas.totales?.ganancia_total || 0).toLocaleString();
        
    } catch (error) {
        console.error("Error cargando KPIs:", error);
    }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
async function init() {
    console.log("🚀 Iniciando Dashboard...");
    
    // Verificar token (solo para información, NO redirigir)
    const token = getAuthToken();
    if (!token) {
        console.warn("⚠️ No hay token disponible. Algunas funciones pueden no funcionar.");
        const msgDiv = document.createElement('div');
        msgDiv.style.cssText = 'background:#ffd166;color:#000;padding:10px;text-align:center;font-size:0.85rem;';
        msgDiv.innerHTML = '⚠️ No se encontró sesión activa. <a href="../index.html" style="color:#000;font-weight:bold;">Iniciar sesión</a>';
        document.querySelector('.header')?.after(msgDiv);
    }
    
    // Mostrar información del usuario
    displayUserInfo();
    
    // Crear gráficos
    crearGraficos();
    
    // Configurar toggles
    setupToggles();
    
    // Cargar datos
    await cargarKPIs();
    await cargarEstadoOrdenes();
    await cargarCaptacionCanal();
    await cargarRendimientoTecnicos();
    await cargarServiciosPorZona();
    await cargarServiciosDemandados();
    await cargarIngresosMensuales();
}

function setupToggles() {
    const toggles = document.querySelectorAll('.toggle-group');
    toggles.forEach(toggle => {
        const checkbox = toggle.querySelector('input');
        const targetId = toggle.getAttribute('data-target');
        
        if (checkbox && targetId) {
            checkbox.addEventListener('change', (e) => {
                const target = document.getElementById(targetId);
                if (target) {
                    if (!e.target.checked) {
                        target.classList.add('hidden');
                    } else {
                        target.classList.remove('hidden');
                    }
                }
            });
        }
    });
}

// Ejecutar inicialización
init();