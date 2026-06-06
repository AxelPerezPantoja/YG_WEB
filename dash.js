const API_URL = "http://localhost:5230/api";
const TOKEN =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiIyIiwidW5pcXVlX25hbWUiOiJBeGVsX1BlcmV6IiwiZW1haWwiOiJheGVscGVyZXowNDA0MDdAZ21haWwuY29tIiwicm9sZSI6IkFkbWluIiwibmJmIjoxNzgwNzEzMjY4LCJleHAiOjE3ODA3NDIwNjgsImlhdCI6MTc4MDcxMzI2OCwiaXNzIjoiQXBpQXV0aCIsImF1ZCI6IkFwaUF1dGhDbGllbnQifQ.vPoz-EKU9SVzg3NuqkU8KJEAl3vLFeXAi_pkCr0MASI";

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

(function() {
    // ─── DATOS BASE ────────────────────────
    const zonas = ['Managua', 'León', 'Granada', 'Masaya'];
    const servicios = ['Telecomunicaciones', 'Electricidad', 'Seguridad Electrónica', 'Informática'];
    const tecnicosNombres = ['Carlos López', 'María Castillo', 'José Gómez', 'Ana Martínez'];
    const canales = ['Facebook', 'Instagram', 'Web', 'WhatsApp'];

    // Datos completos simulados: array de órdenes
    const ordenesRaw = [
        { zona: 'Managua', servicio: 'Telecomunicaciones', tecnico: 'Carlos López', ingresos: 12500,
            instalacion: 1, pendiente: false, satisfaccion: 92, tiempo: 2.1, material: 'Cable UTP',
            canal: 'Facebook' },
        { zona: 'Managua', servicio: 'Electricidad', tecnico: 'María Castillo', ingresos: 18000,
            instalacion: 1, pendiente: true, satisfaccion: 88, tiempo: 3.2, material: 'Breaker',
            canal: 'Web' },
        { zona: 'León', servicio: 'Seguridad Electrónica', tecnico: 'José Gómez', ingresos: 22000,
            instalacion: 1, pendiente: false, satisfaccion: 95, tiempo: 2.8, material: 'Cámara IP',
            canal: 'Instagram' },
        { zona: 'Granada', servicio: 'Informática', tecnico: 'Ana Martínez', ingresos: 9500, instalacion: 1,
            pendiente: false, satisfaccion: 85, tiempo: 1.5, material: 'Disco SSD', canal: 'WhatsApp' },
        { zona: 'Masaya', servicio: 'Telecomunicaciones', tecnico: 'Carlos López', ingresos: 11000,
            instalacion: 1, pendiente: true, satisfaccion: 90, tiempo: 2.3, material: 'Antena',
            canal: 'Facebook' },
        { zona: 'Managua', servicio: 'Electricidad', tecnico: 'José Gómez', ingresos: 21000, instalacion: 1,
            pendiente: false, satisfaccion: 94, tiempo: 3.5, material: 'Cable THW', canal: 'Web' },
        { zona: 'León', servicio: 'Informática', tecnico: 'Ana Martínez', ingresos: 8500, instalacion: 1,
            pendiente: false, satisfaccion: 82, tiempo: 1.8, material: 'Router', canal: 'WhatsApp' },
        { zona: 'Granada', servicio: 'Seguridad Electrónica', tecnico: 'María Castillo', ingresos: 19500,
            instalacion: 1, pendiente: true, satisfaccion: 91, tiempo: 2.9, material: 'Sensor',
            canal: 'Instagram' },
        { zona: 'Masaya', servicio: 'Electricidad', tecnico: 'Carlos López', ingresos: 16000, instalacion: 1,
            pendiente: false, satisfaccion: 87, tiempo: 2.7, material: 'Tomacorriente', canal: 'Facebook' },
        { zona: 'Managua', servicio: 'Telecomunicaciones', tecnico: 'María Castillo', ingresos: 14000,
            instalacion: 1, pendiente: false, satisfaccion: 93, tiempo: 2.0, material: 'Fibra óptica',
            canal: 'Web' },
    ];
    // Expandir un poco más para tener volumen
    for (let i = 0; i < 30; i++) {
        const z = zonas[Math.floor(Math.random() * zonas.length)];
        const s = servicios[Math.floor(Math.random() * servicios.length)];
        const t = tecnicosNombres[Math.floor(Math.random() * tecnicosNombres.length)];
        const ing = Math.floor(Math.random() * 25000 + 5000);
        const pend = Math.random() < 0.2;
        const sat = Math.floor(Math.random() * 20 + 80);
        const tiem = (Math.random() * 3 + 1).toFixed(1);
        const mat = ['Cable UTP', 'Breaker', 'Cámara IP', 'Disco SSD', 'Antena', 'Router', 'Sensor',
            'Fibra óptica'
        ][Math.floor(Math.random() * 8)];
        const can = canales[Math.floor(Math.random() * canales.length)];
        ordenesRaw.push({ zona: z, servicio: s, tecnico: t, ingresos: ing, instalacion: 1, pendiente: pend,
            satisfaccion: sat, tiempo: parseFloat(tiem), material: mat, canal: can });
    }

    // Estado de filtros
    let filtroZona = 'todas';
    let filtroServicio = 'todos';
    let filtroTecnico = 'todos';

    function aplicarFiltros() {
        return ordenesRaw.filter(o => {
            if (filtroZona !== 'todas' && o.zona !== filtroZona) return false;
            if (filtroServicio !== 'todos' && o.servicio !== filtroServicio) return false;
            if (filtroTecnico !== 'todos' && o.tecnico !== filtroTecnico) return false;
            return true;
        });
    }

    // Actualizar KPIs
    function actualizarKPIs(ordenesFiltradas) {
        const totalInst = ordenesFiltradas.length;
        const pendientes = ordenesFiltradas.filter(o => o.pendiente).length;
        const satProm = ordenesFiltradas.length ? (ordenesFiltradas.reduce((a, o) => a + o.satisfaccion,
            0) / ordenesFiltradas.length).toFixed(0) : 0;
        const tiempoProm = ordenesFiltradas.length ? (ordenesFiltradas.reduce((a, o) => a + o.tiempo, 0) /
            ordenesFiltradas.length).toFixed(1) : 0;
        const conversion = totalInst ? ((totalInst - pendientes) / totalInst * 100).toFixed(1) : 0;

        document.getElementById('kpi-instalaciones').textContent = totalInst;
        document.getElementById('kpi-pendientes').textContent = pendientes;
        document.getElementById('kpi-satisfaccion').textContent = satProm + '%';
        document.getElementById('kpi-tiempo').textContent = tiempoProm + 'h';
        document.getElementById('kpi-conversion').textContent = conversion + '%';

        const alertaPend = document.getElementById('alertaPendientes');
        if (pendientes > 5) {
            alertaPend.style.display = 'inline-block';
            alertaPend.textContent = '⚠️ ' + pendientes + ' pendientes';
        } else {
            alertaPend.style.display = 'none';
        }
    }

    // Gráficos
    let barServiciosChart,lineaIngresosChart,pieCanalesChart,barZonasChart,pieEstadosChart,barGananciasChart,barMaterialesChart;
    

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
            data: { labels: [], datasets: [{ data: [], backgroundColor: ['#00b4d8', '#0077b6', '#f77f00',
                    '#ffd166'
                ] }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom',
                        labels: { color: '#9aa4bf' } } } }
        });
        barZonasChart = new Chart(ctx4, {
            type: 'bar',
            data: {
                labels: [],
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#f3f4f7'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#9aa4bf'
                        },
                        grid: {
                            color: '#1e2d45'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#9aa4bf'
                        }
                    }
                }
            }
        });
        
        const ctx5 =
            document
                .getElementById("barMateriales")
                .getContext("2d");

        barMaterialesChart = new Chart(ctx5, {
            type: "bar",
            data: {
                labels: [],
                datasets: [{
                    label: "Cantidad utilizada",
                    data: [],
                }]
            },
            options: {
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });

        const ctxEstados =
            document.getElementById("pieEstados")
            .getContext("2d");

        pieEstadosChart = new Chart(ctxEstados, {
            type: "doughnut",

            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        "#06d6a0",
                        "#ffd166",
                        "#ef476f"
                    ]
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            color: "#9aa4bf"
                        }
                    }
                }
            }
        });


        const ctxGanancias =
            document.getElementById(
                "barGanancias"
            ).getContext("2d");

        barGananciasChart =
            new Chart(ctxGanancias, {
                type: "bar",
                data: {
                    labels: [],
                    datasets: [{
                        label: "Ganancia C$",
                        data: []
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });

    }

    async function cargarMaterialesUtilizados() {

        try {

            const data =
                await obtenerDatos(
                    "Dashboard/materiales-utilizados"
                );

            console.log(
                "📦 Materiales:",
                data
            );

            const top5 =
                data.materiales
                    .sort(
                        (a, b) =>
                            b.cantidad_total -
                            a.cantidad_total
                    )
                    .slice(0, 5);

            barMaterialesChart.data.labels =
                top5.map(
                    m => m.material
                );

            barMaterialesChart.data.datasets[0].data =
                top5.map(
                    m => m.cantidad_total
                );

            barMaterialesChart.update();

        }
        catch(error){

            console.error(
                "Error materiales:",
                error
            );

        }
    }

    async function actualizarGraficos() {

        // SERVICIOS MÁS DEMANDADOS
        try {

            const dataServicios = await obtenerDatos(
                "Dashboard/servicios-demandados"
            );

            console.log("📊 Servicios demandados:", dataServicios);

            barServiciosChart.data.labels =
                dataServicios.servicios.map(s => s.servicio);

            barServiciosChart.data.datasets[0].data =
                dataServicios.servicios.map(s => s.total_ordenes);

            barServiciosChart.update();

        } catch (error) {
            console.error("❌ Error cargando servicios demandados:", error);
        }

        // =====================================
        // TODO LO DEMÁS SIGUE SIMULADO POR AHORA
        // =====================================

        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
        const ingresosPorMes = [0, 0, 0, 0, 0, 0];

        lineaIngresosChart.data.labels = meses;
        lineaIngresosChart.data.datasets[0].data = ingresosPorMes;
        lineaIngresosChart.update();

        barZonasChart.data.labels = ['Managua', 'León', 'Granada', 'Masaya'];
        barZonasChart.data.datasets[0].data = [0, 0, 0, 0];
        barZonasChart.update();
    }

    async function cargarGananciasServicio() {

        try {

            const data =
                await obtenerDatos(
                    "Dashboard/costo-ingreso-servicio"
                );

            const labels =
                data.detalle_por_servicio.map(
                    s => s.servicio
                );

            const ganancias =
                data.detalle_por_servicio.map(
                    s => s.ganancia
                );

            barGananciasChart.data.labels =
                labels;

            barGananciasChart.data.datasets[0].data =
                ganancias;

            barGananciasChart.update();

        } catch(error) {

            console.error(
                "Error cargando ganancias:",
                error
            );

        }

    }

   //Funcion para llamar ServiciosMAsDemandados nuevo
    async function cargarServiciosDemandados() {
        try {

            const data = await obtenerDatos(
                "Dashboard/servicios-demandados"
            );
            console.log(" Servicios demandados:", data);

            const labels = data.servicios.map(s => s.servicio);
            const valores = data.servicios.map(s => s.total_ordenes);

            barServiciosChart.data.labels = labels;

            barServiciosChart.data.datasets[0].data = valores;

            barServiciosChart.update();

        } catch (error) {

            console.error(
                "❌ Error cargando servicios demandados:",
                error
            );

        }
    }

    async function cargarTecnicosFiltro() {

        try {

            const data = await obtenerDatos(
                "Dashboard/rendimiento-tecnicos"
            );

            const select =
                document.getElementById(
                    "filtroTecnico"
                );

            select.innerHTML =
                '<option value="todos">Todos los técnicos</option>';

            data.tecnicos.forEach(t => {

                const option =
                    document.createElement("option");

                option.value =
                    t.tecnico;

                option.textContent =
                    t.tecnico;

                select.appendChild(option);

            });

            console.log(
                "✅ Técnicos cargados:",
                data.tecnicos.length
            );

        }
        catch(error){

            console.error(
                "❌ Error cargando técnicos:",
                error
            );

        }
    }

    //Cargar estado de ordenes
    async function cargarEstadoOrdenes() {

        try {

            const data =
                await obtenerDatos(
                    "Dashboard/estado-ordenes"
                );

            console.log(
                "📋 Estado órdenes:",
                data
            );

            pieEstadosChart.data.labels =
                data.estados.map(
                    e => e.estado
                );

            pieEstadosChart.data.datasets[0].data =
                data.estados.map(
                    e => e.total
                );

            pieEstadosChart.update();

        } catch (error) {

            console.error(
                "❌ Error cargando estados:",
                error
            );
        }
    }


    //Captacion por canal
    async function cargarCaptacionCanal() {

    try {


            const data =
                await obtenerDatos(
                    "Dashboard/captacion-canal"
                );

            console.log(
                "📱 Captación por canal:",
                data
            );

            pieCanalesChart.data.labels =
                data.canales.map(
                    c => c.canal
                );

            pieCanalesChart.data.datasets[0].data =
                data.canales.map(
                    c => c.clientes_obtenidos
                );

            pieCanalesChart.update();

        } catch (error) {

            console.error(
                "❌ Error cargando captación:",
                error
            );

        }
    }


    //Datos rendimiento de tecnico
    async function cargarRendimientoTecnicos() {
        try {
            // const filtros =
            //     obtenerParametrosFiltro();

            // const data =
            //     await obtenerDatos(
            //         `Dashboard/rendimiento-tecnicos?${filtros}`
            //     );

            // console.log("Cargando rendimiento técnicos...");

            const data = await obtenerDatos(
                "Dashboard/rendimiento-tecnicos"
            );

            console.log(data);

            const tbody =
                document.getElementById(
                    "tablaTecnicosBody"
                );

            tbody.innerHTML = "";

            data.tecnicos.forEach(t => {

                const eficiencia =
                    t.total_ordenes > 0
                    ? ((t.completadas / t.total_ordenes) * 100).toFixed(1)
                    : 0;

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

            console.error(
                "Error cargando técnicos:",
                error
            );

        }
    }


    async function cargarServiciosPorZona() {

        try {

            const data = await obtenerDatos(
                "Dashboard/servicios-por-zona"
            );

            console.log("📍 Servicios por zona:", data);

            const zonas = [
                ...new Set(
                    data.detalle.map(d => d.zona)
                )
            ];

            const servicios = [
                ...new Set(
                    data.detalle.map(d => d.servicio)
                )
            ];

            const datasets = servicios.map(servicio => {

                return {
                    label: servicio,
                    data: zonas.map(zona => {

                        const item = data.detalle.find(
                            d =>
                                d.zona === zona &&
                                d.servicio === servicio
                        );

                        return item
                            ? item.total_ordenes
                            : 0;

                    })
                };

            });

            barZonasChart.data.labels = zonas;

            barZonasChart.data.datasets = datasets;

            barZonasChart.update();

        }
        catch (error) {

            console.error(
                "Error cargando servicios por zona:",
                error
            );

        }
    }

    // function obtenerParametrosFiltro() {

    //     const zona =
    //         document.getElementById(
    //             "filtroZona"
    //         ).value;

    //     const fechaInicio =
    //         document.getElementById(
    //             "fechaInicio"
    //         ).value;

    //     const fechaFin =
    //         document.getElementById(
    //             "fechaFin"
    //         ).value;

    //     const params =
    //         new URLSearchParams();

    //     if (
    //         zona &&
    //         zona !== "todas"
    //     ) {
    //         params.append(
    //             "zona",
    //             zona
    //         );
    //     }

    //     if (fechaInicio) {
    //         params.append(
    //             "fechaInicio",
    //             fechaInicio
    //         );
    //     }

    //     if (fechaFin) {
    //         params.append(
    //             "fechaFin",
    //             fechaFin
    //         );
    //     }

    //     return params.toString();
    // }

    //funcion cargar servicios
    async function cargarKPIs() {
        try {

            const [
                ordenes,
                completadas,
                estados,
                tiempo,
                conversion,
                finanzas
            ] = await Promise.all([
                obtenerDatos("Dashboard/ordenes-por-lapso"),
                obtenerDatos("Dashboard/ordenes-completadas"),
                obtenerDatos("Dashboard/estado-ordenes"),
                obtenerDatos("Dashboard/tiempo-promedio"),
                obtenerDatos("Dashboard/tasa-conversion"),
                obtenerDatos("Dashboard/costo-ingreso-servicio")
            ]);

            const pendientes =
                estados.estados.find(
                    e => e.estado === "Pendiente"
                )?.total || 0;

            document.getElementById(
                "kpi-instalaciones"
            ).textContent =
                ordenes.total_ordenes;

            document.getElementById(
                "kpi-pendientes"
            ).textContent =
                pendientes;

            document.getElementById(
                "kpi-satisfaccion"
            ).textContent =
                completadas.ordenes_completadas;

            document.getElementById(
                "kpi-tiempo"
            ).textContent =
                tiempo.promedio_general_horas + "h";

            document.getElementById(
                "kpi-conversion"
            ).textContent =
                conversion.tasa_conversion + "%";
            document.getElementById(
               "kpi-ingresos"
            ).textContent =
                "C$ " +
                finanzas.totales.ingreso_total;

            document.getElementById(
                "kpi-ganancia"
            ).textContent =
                "C$ " +
                finanzas.totales.ganancia_total;

        } catch (error) {

            console.error(
                "Error cargando KPIs:",
                error
            );

        }
    }
    function refrescarTodo() {
        actualizarGraficos();
    }
    // Eventos de filtros
    document.getElementById('aplicarFiltros').addEventListener('click', () => {
        filtroZona = document.getElementById('filtroZona').value;
        filtroServicio = document.getElementById('filtroServicio').value;
        filtroTecnico = document.getElementById('filtroTecnico').value;
        refrescarTodo();
    });
    document.getElementById('resetFiltros').addEventListener('click', () => {
        document.getElementById('filtroZona').value = 'todas';
        document.getElementById('filtroServicio').value = 'todos';
        document.getElementById('filtroTecnico').value = 'todos';
        filtroZona = 'todas';
        filtroServicio = 'todos';
        filtroTecnico = 'todos';
        refrescarTodo();
        alert('Filtros restablecidos. Se muestran todas las alertas activas.');
    });

    // Toggle panels - Versión que siempre inicia con todos visibles al recargar
    document.querySelectorAll('.toggle-group').forEach(group => {
        const checkbox = group.querySelector('input');
        const targetId = group.dataset.target;
        const targetElement = document.getElementById(targetId);
        
        if (!targetElement) return;
        
        // FORZAR que al cargar la página, el checkbox esté marcado y el panel visible
        checkbox.checked = true;
        targetElement.style.display = '';
        
        // Escuchar cambios (esto solo afecta mientras la página está abierta)
        checkbox.addEventListener('change', function() {
            if (targetElement) {
                if (this.checked) {
                    targetElement.style.display = '';
                    // Forzar resize de gráficos si es necesario
                    setTimeout(() => {
                        if (targetId.includes('chart')) {
                            if (barServiciosChart && targetId === 'chart-servicios') barServiciosChart.resize();
                            if (lineaIngresosChart && targetId === 'chart-ingresos') lineaIngresosChart.resize();
                            if (pieCanalesChart && targetId === 'chart-canales') pieCanalesChart.resize();
                            if (barZonasChart && targetId === 'chart-zonas') barZonasChart.resize();
                            if (pieEstadosChart && targetId === 'chart-estados') pieEstadosChart.resize();
                            if (barMaterialesChart && targetId === 'chart-materiales') barMaterialesChart.resize();
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

    cargarKPIs();

    cargarEstadoOrdenes();

    cargarCaptacionCanal();

    cargarRendimientoTecnicos();

    cargarServiciosPorZona();

    cargarGananciasServicio();

    cargarMaterialesUtilizados();

    cargarTecnicosFiltro();

    cargarServiciosDemandados();
    // Resize handler
    window.addEventListener('resize', () => {
        barServiciosChart?.resize();
        lineaIngresosChart?.resize();
        pieCanalesChart?.resize();
        barZonasChart?.resize();
    });
})();