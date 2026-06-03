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
    let barServiciosChart, lineaIngresosChart, pieCanalesChart, barZonasChart;

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
            data: { labels: [], datasets: [{ label: 'Demanda', data: [], backgroundColor: '#f77f00' }] },
            options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#9aa4bf' },
                        grid: { color: '#1e2d45' } }, y: { ticks: { color: '#9aa4bf' } } } }
        });
    }

    function actualizarGraficos(ordenesFiltradas) {
        // Servicios más demandados
        const conteoServicios = {};
        servicios.forEach(s => conteoServicios[s] = 0);
        ordenesFiltradas.forEach(o => conteoServicios[o.servicio]++);
        barServiciosChart.data.labels = servicios;
        barServiciosChart.data.datasets[0].data = servicios.map(s => conteoServicios[s]);
        barServiciosChart.update();

        // Ingresos mensuales (simulamos meses con los datos filtrados, usando una distribución simple)
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
        const ingresosPorMes = new Array(6).fill(0);
        ordenesFiltradas.forEach((o, i) => {
            const mesIdx = i % 6;
            ingresosPorMes[mesIdx] += o.ingresos;
        });
        lineaIngresosChart.data.labels = meses;
        lineaIngresosChart.data.datasets[0].data = ingresosPorMes;
        lineaIngresosChart.update();

        // Canales digitales
        const conteoCanales = {};
        canales.forEach(c => conteoCanales[c] = 0);
        ordenesFiltradas.forEach(o => conteoCanales[o.canal]++);
        pieCanalesChart.data.labels = canales;
        pieCanalesChart.data.datasets[0].data = canales.map(c => conteoCanales[c]);
        pieCanalesChart.update();

        // Demanda por zona
        const conteoZonas = {};
        zonas.forEach(z => conteoZonas[z] = 0);
        ordenesFiltradas.forEach(o => conteoZonas[o.zona]++);
        barZonasChart.data.labels = zonas;
        barZonasChart.data.datasets[0].data = zonas.map(z => conteoZonas[z]);
        barZonasChart.update();

        // Tabla técnicos
        const rendimientoTecnicos = {};
        tecnicosNombres.forEach(t => rendimientoTecnicos[t] = { inst: 0, horas: 0, materiales: {} });
        ordenesFiltradas.forEach(o => {
            if (rendimientoTecnicos[o.tecnico]) {
                rendimientoTecnicos[o.tecnico].inst += 1;
                rendimientoTecnicos[o.tecnico].horas += o.tiempo;
                rendimientoTecnicos[o.tecnico].materiales[o.material] = (rendimientoTecnicos[o.tecnico]
                    .materiales[o.material] || 0) + 1;
            }
        });
        const tbody = document.querySelector('#tablaTecnicosBody tbody');
        tbody.innerHTML = '';
        tecnicosNombres.forEach(t => {
            const datos = rendimientoTecnicos[t];
            const eficiencia = datos.horas > 0 ? (datos.inst / datos.horas).toFixed(2) : '0';
            const matMasUsado = Object.entries(datos.materiales).sort((a, b) => b[1] - a[1])[0]?.[0] ||
                '-';
            tbody.innerHTML += `<tr style="border-bottom:1px solid var(--border);">
                <td style="padding:8px;">${t}</td>
                <td>${datos.inst}</td>
                <td>${datos.horas.toFixed(1)}</td>
                <td>${eficiencia} inst/h</td>
                <td>${matMasUsado}</td>
              </tr>`;
        });
    }

    function refrescarTodo() {
        const filtradas = aplicarFiltros();
        actualizarKPIs(filtradas);
        actualizarGraficos(filtradas);
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

    // Toggle panels
    document.querySelectorAll('.toggle-group').forEach(group => {
        const checkbox = group.querySelector('input');
        const targetId = group.dataset.target;
        checkbox.addEventListener('change', function() {
            const el = document.getElementById(targetId);
            if (el) {
                if (this.checked) el.classList.remove('hidden');
                else el.classList.add('hidden');
                setTimeout(() => {
                    if (targetId.includes('chart') && this.checked) {
                        if (barServiciosChart && targetId === 'chart-servicios')
                            barServiciosChart.resize();
                        if (lineaIngresosChart && targetId === 'chart-ingresos')
                            lineaIngresosChart.resize();
                        if (pieCanalesChart && targetId === 'chart-canales') pieCanalesChart
                            .resize();
                        if (barZonasChart && targetId === 'chart-zonas') barZonasChart.resize();
                    }
                }, 400);
            }
        });
    });

    // Inicializar
    crearGraficos();
    refrescarTodo();

    // Resize handler
    window.addEventListener('resize', () => {
        barServiciosChart?.resize();
        lineaIngresosChart?.resize();
        pieCanalesChart?.resize();
        barZonasChart?.resize();
    });
})();