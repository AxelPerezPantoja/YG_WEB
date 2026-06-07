const API_URL = "http://localhost:5230/api";
const TOKEN =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiIyIiwidW5pcXVlX25hbWUiOiJBeGVsX1BlcmV6IiwiZW1haWwiOiJheGVscGVyZXowNDA0MDdAZ21haWwuY29tIiwicm9sZSI6IkFkbWluIiwibmJmIjoxNzgwODA2MjEyLCJleHAiOjE3ODA4MzUwMTIsImlhdCI6MTc4MDgwNjIxMiwiaXNzIjoiQXBpQXV0aCIsImF1ZCI6IkFwaUF1dGhDbGllbnQifQ.00sPcbUFWtsHQ7v8eQGy-E5jxkrkko0SWhsOdIX48dE"
console.log("TOKEN:", TOKEN);

async function obtenerDatos(endpoint) {
    try {
        console.log("=================================");
        console.log("Endpoint:", endpoint);
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
            console.error(" Error HTTP:", response.status);
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

(function() {
    // Gráficos
    let barServiciosChart, lineaIngresosChart, pieCanalesChart, barZonasChart, pieEstadosChart, barGananciasChart, barMaterialesChart;

    function obtenerParametrosFiltro() {
        const zona = document.getElementById('filtroZona')?.value || 'todas';
        const servicio = document.getElementById('filtroServicio')?.value || 'todos';
        const tecnico = document.getElementById('filtroTecnico')?.value || 'todos';
        
        const params = new URLSearchParams();
        
        if (zona && zona !== 'todas') {
            params.append('zona', zona);
        }
        if (servicio && servicio !== 'todos') {
            params.append('servicio', servicio);
        }
        if (tecnico && tecnico !== 'todos') {
            params.append('tecnico', tecnico);
        }
        
        const queryString = params.toString();
        return queryString ? `?${queryString}` : '';
    }

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
            data: { labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'], datasets: [{ label: 'Ingresos C$',
                    data: [], borderColor: '#06d6a0', tension: 0.3, fill: true,
                    backgroundColor: 'rgba(6,214,160,0.1)' }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
                scales: { y: { ticks: { color: '#9aa4bf', callback: v => 'C$' + v.toLocaleString() },
                        grid: { color: '#1e2d45' } }, x: { ticks: { color: '#9aa4bf' } } } }
        });
        
        pieCanalesChart = new Chart(ctx3, {
            type: 'doughnut',
            data: { labels: [], datasets: [{ data: [], backgroundColor: ['#00d87a', '#0077b6', '#f77f00', '#ffd166'] }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom',
                        labels: { color: '#9aa4bf' } } } }
        });
        
        barZonasChart = new Chart(ctx4, {
            type: 'bar',
            data: { labels: [], datasets: [] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#f3f4f7' } } },
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
            data: { labels: [], datasets: [{ data: [], backgroundColor: ["#06d6a0", "#ed5555", "#ffd166"] }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { color: "#9aa4bf" } } } }
        });

        const ctxGanancias = document.getElementById("barGanancias").getContext("2d");
        barGananciasChart = new Chart(ctxGanancias, {
            type: "bar",
            data: { labels: [], datasets: [{ label: "Ganancia C$", data: [] }] },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    // Agrega esta función después de cargarMaterialesUtilizados()
    async function cargarIngresosPorMes() {
        try {
            const filtros = obtenerParametrosFiltro();
            
            // Obtener el año actual y los meses 1-6
            const año = 2026; // Puedes hacerlo dinámico o tomar del filtro
            const meses = [1, 2, 3, 4, 5, 6];
            const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
            
            // Obtener zona y servicio del filtro
            const zona = document.getElementById('filtroZona')?.value;
            const servicio = document.getElementById('filtroServicio')?.value;
            
            // Construir promesas para cada mes
            const promesas = meses.map(async (mes) => {
                // Construir URL con parámetros
                let url = `Dashboard/ingreso-por-mes?año=${año}&mes=${mes}`;
                
                if (zona && zona !== 'todas') {
                    url += `&zona=${encodeURIComponent(zona)}`;
                }
                
                // Si hay filtro de servicio, necesitas ver si el endpoint lo soporta
                // Si no, podrías filtrar después o el endpoint ya considera el servicio
                
                try {
                    const data = await obtenerDatos(url);
                    return data.ingreso_total || 0;
                } catch (error) {
                    console.error(`Error cargando mes ${mes}:`, error);
                    return 0;
                }
            });
            
            // Esperar todos los resultados
            const ingresosPorMes = await Promise.all(promesas);
            
            console.log("📊 Ingresos por mes:", ingresosPorMes);
            
            // Actualizar el gráfico
            if (lineaIngresosChart) {
                lineaIngresosChart.data.labels = nombresMeses;
                lineaIngresosChart.data.datasets[0].data = ingresosPorMes;
                lineaIngresosChart.update();
            }
            
            return ingresosPorMes;
            
        } catch (error) {
            console.error("Error cargando ingresos por mes:", error);
        }
    }

    // También actualiza cargarKPIs para que no dé error con los nuevos parámetros
    async function cargarKPIs() {
        try {
            const filtros = obtenerParametrosFiltro();
            
            // Extraer parámetros para pasar a los endpoints que los soportan
            const params = new URLSearchParams(filtros.replace('?', ''));
            const zona = params.get('zona');
            const servicio = params.get('servicio');
            
            // Construir URLs condicionalmente según lo que soporte cada endpoint
            let urlOrdenes = 'Dashboard/ordenes-por-lapso';
            let urlCompletadas = 'Dashboard/ordenes-completadas';
            let urlEstados = 'Dashboard/estado-ordenes';
            let urlTiempo = 'Dashboard/tiempo-promedio';
            let urlConversion = 'Dashboard/tasa-conversion';
            let urlFinanzas = 'Dashboard/costo-ingreso-servicio';
            
            // Agregar zona a los endpoints que la soportan (ajusta según tu API)
            if (zona) {
                urlOrdenes += `?zona=${encodeURIComponent(zona)}`;
                urlCompletadas += `?zona=${encodeURIComponent(zona)}`;
                urlEstados += `?zona=${encodeURIComponent(zona)}`;
                urlTiempo += `?zona=${encodeURIComponent(zona)}`;
                urlConversion += `?zona=${encodeURIComponent(zona)}`;
                urlFinanzas += `?zona=${encodeURIComponent(zona)}`;
            }
            
            // Agregar servicio si el endpoint lo soporta
            if (servicio) {
                const conector = urlOrdenes.includes('?') ? '&' : '?';
                urlOrdenes += `${conector}servicio=${encodeURIComponent(servicio)}`;
                urlFinanzas += `${conector}servicio=${encodeURIComponent(servicio)}`;
            }
            
            const [ordenes, completadas, estados, tiempo, conversion, finanzas] = await Promise.all([
                obtenerDatos(urlOrdenes),
                obtenerDatos(urlCompletadas),
                obtenerDatos(urlEstados),
                obtenerDatos(urlTiempo),
                obtenerDatos(urlConversion),
                obtenerDatos(urlFinanzas)
            ]);

            const pendientes = estados.estados?.find(e => e.estado === "Pendiente")?.total || 0;

            document.getElementById("kpi-instalaciones").textContent = ordenes.total_ordenes || 0;
            document.getElementById("kpi-pendientes").textContent = pendientes;
            const satisfaccionData = await obtenerDatos(`Dashboard/satisfaccion-servicio${filtros}`);
            const promedioSatisfaccion = satisfaccionData.detalle_por_servicio.length > 0
                ? (satisfaccionData.detalle_por_servicio.reduce((acc, s) => acc + s.promedio, 0) / satisfaccionData.detalle_por_servicio.length).toFixed(1)
                : 0;
            document.getElementById("kpi-satisfaccion").textContent = promedioSatisfaccion + '/5';
            document.getElementById("kpi-tiempo").textContent = (tiempo.promedio_general_horas || 0) + 'h';
            document.getElementById("kpi-conversion").textContent = (conversion.tasa_conversion || 0) + '%';
            document.getElementById("kpi-ingresos").textContent = "C$ " + (finanzas.totales?.ingreso_total || 0).toLocaleString();
            document.getElementById("kpi-ganancia").textContent = "C$ " + (finanzas.totales?.ganancia_total || 0).toLocaleString();

            const alertaPend = document.getElementById('alertaPendientes');
            if (pendientes > 5) {
                alertaPend.style.display = 'inline-block';
                alertaPend.textContent = '⚠️ ' + pendientes + ' pendientes';
            } else {
                alertaPend.style.display = 'none';
            }
        } catch (error) {
            console.error("Error cargando KPIs:", error);
        }
    }

    async function cargarServiciosDemandados() {
        try {
            const filtros = obtenerParametrosFiltro();
            const data = await obtenerDatos(`Dashboard/servicios-demandados${filtros}`);
            
            barServiciosChart.data.labels = data.servicios?.map(s => s.servicio) || [];
            barServiciosChart.data.datasets[0].data = data.servicios?.map(s => s.total_ordenes) || [];
            barServiciosChart.update();
        } catch (error) {
            console.error("Error cargando servicios demandados:", error);
        }
    }

    async function cargarServiciosPorZona() {
        try {
            const filtros = obtenerParametrosFiltro();
            const data = await obtenerDatos(`Dashboard/servicios-por-zona${filtros}`);
            
            const zonas = [...new Set(data.detalle?.map(d => d.zona) || [])];
            const servicios = [...new Set(data.detalle?.map(d => d.servicio) || [])];
            
            const datasets = servicios.map(servicio => ({
                label: servicio,
                data: zonas.map(zona => {
                    const item = data.detalle?.find(d => d.zona === zona && d.servicio === servicio);
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

    async function cargarRendimientoTecnicos() {
        try {
            const filtros = obtenerParametrosFiltro();
            const data = await obtenerDatos(`Dashboard/rendimiento-tecnicos${filtros}`);
            
            const tbody = document.getElementById("tablaTecnicosBody");
            tbody.innerHTML = "";
            
            data.tecnicos?.forEach(t => {
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

    async function cargarEstadoOrdenes() {
        try {
            const filtros = obtenerParametrosFiltro();
            const data = await obtenerDatos(`Dashboard/estado-ordenes${filtros}`);
            
            pieEstadosChart.data.labels = data.estados?.map(e => e.estado) || [];
            pieEstadosChart.data.datasets[0].data = data.estados?.map(e => e.total) || [];
            pieEstadosChart.update();
        } catch (error) {
            console.error("Error cargando estados:", error);
        }
    }

    async function cargarCaptacionCanal() {
        try {
            const filtros = obtenerParametrosFiltro();
            const data = await obtenerDatos(`Dashboard/captacion-canal${filtros}`);
            
            pieCanalesChart.data.labels = data.canales?.map(c => c.canal) || [];
            pieCanalesChart.data.datasets[0].data = data.canales?.map(c => c.clientes_obtenidos) || [];
            pieCanalesChart.update();
        } catch (error) {
            console.error("Error cargando captación:", error);
        }
    }

    async function cargarGananciasServicio() {
        try {
            const filtros = obtenerParametrosFiltro();
            const data = await obtenerDatos(`Dashboard/costo-ingreso-servicio${filtros}`);
            
            barGananciasChart.data.labels = data.detalle_por_servicio?.map(s => s.servicio) || [];
            barGananciasChart.data.datasets[0].data = data.detalle_por_servicio?.map(s => s.ganancia) || [];
            barGananciasChart.update();
        } catch (error) {
            console.error("Error cargando ganancias:", error);
        }
    }

    async function cargarMaterialesUtilizados() {
        try {
            const filtros = obtenerParametrosFiltro();
            const data = await obtenerDatos(`Dashboard/materiales-utilizados${filtros}`);
            
            const top5 = data.materiales?.sort((a, b) => b.cantidad_total - a.cantidad_total).slice(0, 5) || [];
            
            barMaterialesChart.data.labels = top5.map(m => m.material);
            barMaterialesChart.data.datasets[0].data = top5.map(m => m.cantidad_total);
            barMaterialesChart.update();
        } catch (error) {
            console.error("Error materiales:", error);
        }
    }

    async function cargarTecnicosFiltro() {
        try {
            const data = await obtenerDatos("Dashboard/rendimiento-tecnicos");
            const select = document.getElementById("filtroTecnico");
            
            select.innerHTML = '<option value="todos">Todos los técnicos</option>';
            data.tecnicos?.forEach(t => {
                const option = document.createElement("option");
                option.value = t.tecnico;
                option.textContent = t.tecnico;
                select.appendChild(option);
            });
        } catch (error) {
            console.error("Error cargando técnicos:", error);
        }
    }

    function refrescarTodo() {
        cargarKPIs();
        cargarEstadoOrdenes();
        cargarCaptacionCanal();
        cargarRendimientoTecnicos();
        cargarServiciosPorZona();
        cargarGananciasServicio();
        cargarMaterialesUtilizados();
        cargarServiciosDemandados();
        cargarIngresosPorMes(); 
    }

    // Eventos de filtros
    document.getElementById('aplicarFiltros')?.addEventListener('click', () => {
        refrescarTodo();
    });

document.getElementById('resetFiltros')?.addEventListener('click', () => {
    // Resetear selects
    document.getElementById('filtroZona').value = 'todas';
    document.getElementById('filtroServicio').value = 'todos';
    document.getElementById('filtroTecnico').value = 'todos';
    
    // Limpiar cualquier otro estado interno si existe
    filtroZona = 'todas';
    filtroServicio = 'todos';
    filtroTecnico = 'todos';
    
    // Recargar todos los datos desde cero
    refrescarTodo();
    
    // Opcional: mostrar un pequeño mensaje
    console.log('✅ Filtros reseteados completamente');
});
    
        // Toggle panels
    document.querySelectorAll('.toggle-group').forEach(group => {
        const checkbox = group.querySelector('input');
        const targetId = group.dataset.target;
        const targetElement = document.getElementById(targetId);
        
        if (!targetElement) return;
        
        checkbox.checked = true;
        targetElement.style.display = '';
        
        checkbox.addEventListener('change', function() {
            if (targetElement) {
                if (this.checked) {
                    targetElement.style.display = '';
                    setTimeout(() => {
                        if (targetId.includes('chart')) {
                            if (barServiciosChart && targetId === 'chart-servicios') barServiciosChart.resize();
                            if (lineaIngresosChart && targetId === 'chart-ingresos') lineaIngresosChart.resize();
                            if (pieCanalesChart && targetId === 'chart-canales') pieCanalesChart.resize();
                            if (barZonasChart && targetId === 'chart-zonas') barZonasChart.resize();
                            if (pieEstadosChart && targetId === 'chart-estados') pieEstadosChart.resize();
                            if (barMaterialesChart && targetId === 'chart-materiales') barMaterialesChart.resize();
                            if (barGananciasChart && targetId === 'chart-finanzas') barGananciasChart.resize();
                        }
                    }, 100);
                } else {
                    targetElement.style.display = 'none';
                }
            }
        });
    });

    // Inicializar
    crearGraficos();
    cargarTecnicosFiltro();
    refrescarTodo();

    // Resize handler
    window.addEventListener('resize', () => {
        barServiciosChart?.resize();
        lineaIngresosChart?.resize();
        pieCanalesChart?.resize();
        barZonasChart?.resize();
        pieEstadosChart?.resize();
        barMaterialesChart?.resize();
        barGananciasChart?.resize();
    });
})();