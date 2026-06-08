const API_URL = "http://localhost:8080/api";
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiIyIiwidW5pcXVlX25hbWUiOiJBeGVsX1BlcmV6IiwiZW1haWwiOiJheGVscGVyZXowNDA0MDdAZ21haWwuY29tIiwicm9sZSI6IkFkbWluIiwibmJmIjoxNzgwOTM0NDQwLCJleHAiOjE3ODA5NjMyNDAsImlhdCI6MTc4MDkzNDQ0MCwiaXNzIjoiQXBpQXV0aCIsImF1ZCI6IkFwaUF1dGhDbGllbnQifQ.vGK3fNjOYBGU2wx_aCrZnKWsrOdLG2foqTUnVgkBQrE"

console.log("TOKEN:", TOKEN);

async function obtenerDatos(endpoint) {
    try {
        console.log("=================================");
        console.log("Endpoint:", endpoint);
        console.log("TOKEN:", TOKEN);
        console.log("Authorization:", `Bearer ${TOKEN}`);

        const response = await fetch(`${API_URL}/${endpoint}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${TOKEN}`,
                "Content-Type": "application/json"
            }
        });

        console.log("Status:", response.status);

        const texto = await response.text();

        console.log("Respuesta:", texto);

        if (!response.ok) {
            console.error("❌ Error HTTP:", response.status);
            throw new Error(`Error ${response.status}`);
        }

        const data = JSON.parse(texto);

        console.log("✅ Data:", data);

        return data;

    } catch (error) {

        console.error("❌ Error en fetch:", error);

        throw error;
    }
}

async function probarConexion() {
    try {
        const ordenes = await obtenerDatos(
            "Dashboard/ordenes-por-lapso"
        );

        console.log("✅ Datos recibidos:", ordenes);

    } catch (error) {
        console.error("❌ Error:", error);
    }
}

probarConexion();

// ==========================================
// VARIABLES GLOBALES
// ==========================================
let barServiciosChart, lineaIngresosChart, pieCanalesChart, barZonasChart, pieEstadosChart, barGananciasChart, barMaterialesChart;

// ==========================================
// NUEVA FUNCIÓN: Cargar ingresos mensuales reales
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
                    .catch(err => ({ ingreso_total: 0, error: true }))
            );
        }
        
        const resultados = await Promise.all(promesas);
        const ingresos = resultados.map(r => r.ingreso_total || 0);
        
        lineaIngresosChart.data.datasets[0].data = ingresos;
        lineaIngresosChart.update();
        console.log("✅ Ingresos mensuales cargados desde API:", ingresos);
        
    } catch (error) {
        console.error("❌ Error cargando ingresos mensuales:", error);
    }
}

// ==========================================
// CREAR GRÁFICOS
// ==========================================
function crearGraficos() {
    const ctx1 = document.getElementById('barServicios').getContext('2d');
    const ctx2 = document.getElementById('lineaIngresos').getContext('2d');
    const ctx3 = document.getElementById('pieCanales').getContext('2d');
    const ctx4 = document.getElementById('barZonas').getContext('2d');

    barServiciosChart = new Chart(ctx1, {
        type: 'bar',
        data: { labels: [], datasets: [{ label: 'Órdenes', data: [], backgroundColor: '#00b4d8' }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { color: '#9aa4bf' }, grid: { color: '#1e2d45' } },
                x: { ticks: { color: '#9aa4bf' } } } }
    });
    lineaIngresosChart = new Chart(ctx2, {
        type: 'line',
        data: { labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'], 
                 datasets: [{ label: 'Ingresos ',
                data: [], borderColor: '#06d6a0', tension: 0.3, fill: true,
                backgroundColor: 'rgba(6,214,160,0.1)' }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
            scales: { y: { ticks: { color: '#9aa4bf', callback: v => 'C$' + v.toLocaleString() },
                    grid: { color: '#1e2d45' } }, x: { ticks: { color: '#9aa4bf' } } } }
    });
    pieCanalesChart = new Chart(ctx3, {
        type: 'doughnut',
        data: { labels: [], datasets: [{ data: [], backgroundColor: ['#00b4d8', '#0077b6', '#f77f00',
                '#ffd166'
            ] }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom',
                    labels: { color: '#9aa4bf' } } } }
    });
    barZonasChart = new Chart(ctx4, {
        type: 'bar',
        data: { labels: [], datasets: [] },
        options: { responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#f3f4f7' } } },
            scales: { y: { beginAtZero: true, ticks: { color: '#9aa4bf' }, grid: { color: '#1e2d45' } },
                x: { ticks: { color: '#9aa4bf' } } } }
    });
    
    const ctx5 = document.getElementById("barMateriales").getContext("2d");
    barMaterialesChart = new Chart(ctx5, {
        type: "bar",
        data: { labels: [], datasets: [{ label: "Cantidad utilizada", data: [] }] },
        options: { indexAxis: "y", responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });

    const ctxEstados = document.getElementById("pieEstados").getContext("2d");
    pieEstadosChart = new Chart(ctxEstados, {
        type: "doughnut",
        data: { labels: [], datasets: [{ data: [], backgroundColor: ["#06d6a0", "#ffd166", "#ef476f"] }] },
        options: { responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: "bottom", labels: { color: "#9aa4bf" } } } }
    });

    const ctxGanancias = document.getElementById("barGanancias").getContext("2d");
    barGananciasChart = new Chart(ctxGanancias, {
        type: "bar",
        data: { labels: [], datasets: [{ label: "Ganancia $", data: [] }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// ==========================================
// FUNCIONES DE CARGA DE DATOS (API)
// ==========================================
async function cargarMaterialesUtilizados() {
    try {
        const data = await obtenerDatos("Dashboard/materiales-utilizados");
        const top5 = data.materiales.sort((a, b) => b.cantidad_total - a.cantidad_total).slice(0, 5);
        barMaterialesChart.data.labels = top5.map(m => m.material);
        barMaterialesChart.data.datasets[0].data = top5.map(m => m.cantidad_total);
        barMaterialesChart.update();
    } catch(error) {
        console.error("Error materiales:", error);
    }
}

async function cargarGananciasServicio() {
    try {
        const data = await obtenerDatos("Dashboard/costo-ingreso-servicio");
        barGananciasChart.data.labels = data.detalle_por_servicio.map(s => s.servicio);
        barGananciasChart.data.datasets[0].data = data.detalle_por_servicio.map(s => s.ganancia);
        barGananciasChart.update();
    } catch(error) {
        console.error("Error cargando ganancias:", error);
    }
}

async function cargarServiciosDemandados() {
    try {
        const data = await obtenerDatos("Dashboard/servicios-demandados");
        barServiciosChart.data.labels = data.servicios.map(s => s.servicio);
        barServiciosChart.data.datasets[0].data = data.servicios.map(s => s.total_ordenes);
        barServiciosChart.update();
    } catch (error) {
        console.error("❌ Error cargando servicios demandados:", error);
    }
}

async function cargarTecnicosFiltro() {
    try {
        const data = await obtenerDatos("Dashboard/rendimiento-tecnicos");
        const select = document.getElementById("filtroTecnico");
        select.innerHTML = '<option value="todos">Todos los técnicos</option>';
        data.tecnicos.forEach(t => {
            const option = document.createElement("option");
            option.value = t.tecnico;
            option.textContent = t.tecnico;
            select.appendChild(option);
        });
    } catch(error) {
        console.error("❌ Error cargando técnicos:", error);
    }
}

async function cargarEstadoOrdenes() {
    try {
        const data = await obtenerDatos("Dashboard/estado-ordenes");
        pieEstadosChart.data.labels = data.estados.map(e => e.estado);
        pieEstadosChart.data.datasets[0].data = data.estados.map(e => e.total);
        pieEstadosChart.update();
    } catch (error) {
        console.error("❌ Error cargando estados:", error);
    }
}

async function cargarCaptacionCanal() {
    try {
        const data = await obtenerDatos("Dashboard/captacion-canal");
        pieCanalesChart.data.labels = data.canales.map(c => c.canal);
        pieCanalesChart.data.datasets[0].data = data.canales.map(c => c.clientes_obtenidos);
        pieCanalesChart.update();
    } catch (error) {
        console.error("❌ Error cargando captación:", error);
    }
}

async function cargarRendimientoTecnicos() {
    try {
        const data = await obtenerDatos("Dashboard/rendimiento-tecnicos");
        const tbody = document.getElementById("tablaTecnicosBody");
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
    } catch (error) {
        console.error("Error cargando técnicos:", error);
    }
}

async function cargarServiciosPorZona() {
    try {
        const data = await obtenerDatos("Dashboard/servicios-por-zona");
        const zonas = [...new Set(data.detalle.map(d => d.zona))];
        const servicios = [...new Set(data.detalle.map(d => d.servicio))];
        const datasets = servicios.map(servicio => ({
            label: servicio,
            data: zonas.map(zona => {
                const item = data.detalle.find(d => d.zona === zona && d.servicio === servicio);
                return item ? item.total_ordenes : 0;
            })
        }));
        barZonasChart.data.labels = zonas;
        barZonasChart.data.datasets = datasets;
        barZonasChart.update();
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
        
        const pendientes = estados.estados.find(e => e.estado === "Pendiente")?.total || 0;
        
        document.getElementById("kpi-instalaciones").textContent = ordenes.total_ordenes || 0;
        document.getElementById("kpi-pendientes").textContent = pendientes;
        document.getElementById("kpi-satisfaccion").textContent = completadas.ordenes_completadas + "%";
        document.getElementById("kpi-tiempo").textContent = (tiempo.promedio_general_horas || 0) + "h";
        document.getElementById("kpi-conversion").textContent = (conversion.tasa_conversion || 0) + "%";
        document.getElementById("kpi-ingresos").textContent = "C$ " + (finanzas.totales?.ingreso_total || 0).toLocaleString();
        document.getElementById("kpi-ganancia").textContent = "C$ " + (finanzas.totales?.ganancia_total || 0).toLocaleString();
        
    } catch (error) {
        console.error("Error cargando KPIs:", error);
    }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
(async function() {
    crearGraficos();
    
    await cargarKPIs();
    await cargarEstadoOrdenes();
    await cargarCaptacionCanal();
    await cargarRendimientoTecnicos();
    await cargarServiciosPorZona();
    await cargarGananciasServicio();
    await cargarMaterialesUtilizados();
    await cargarTecnicosFiltro();
    await cargarServiciosDemandados();
    await cargarIngresosMensuales();
    
    window.addEventListener('resize', () => {
        barServiciosChart?.resize();
        lineaIngresosChart?.resize();
        pieCanalesChart?.resize();
        barZonasChart?.resize();
    });
})();