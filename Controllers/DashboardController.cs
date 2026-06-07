using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ApiAuth.Data;
using ApiAuth.Models;

namespace ApiAuth.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _context;

    public DashboardController(AppDbContext context)
    {
        _context = context;
    }

    // ==========================================
    // MÉTODO AUXILIAR PARA TEXTO DEL PERÍODO
    // ==========================================
    private string ObtenerPeriodoTexto(int? dias, DateTime? fechaInicio, DateTime? fechaFin)
    {
        if (dias.HasValue)
            return $"últimos {dias} días";
        else if (fechaInicio.HasValue && fechaFin.HasValue)
            return $"{fechaInicio.Value:yyyy-MM-dd} al {fechaFin.Value:yyyy-MM-dd}";
        else if (fechaInicio.HasValue)
            return $"desde {fechaInicio.Value:yyyy-MM-dd}";
        else if (fechaFin.HasValue)
            return $"hasta {fechaFin.Value:yyyy-MM-dd}";
        else
            return "todo el histórico";
    }

    // ==========================================
    // MÉTODO AUXILIAR PARA APLICAR FILTROS DE FECHA
    // ==========================================
    private IQueryable<OrdenTrabajo> AplicarFiltrosFecha(IQueryable<OrdenTrabajo> query, int? dias, DateTime? fechaInicio, DateTime? fechaFin)
    {
        if (dias.HasValue && !fechaInicio.HasValue && !fechaFin.HasValue)
        {
            var fechaFinAuto = DateTime.UtcNow;
            var fechaInicioAuto = fechaFinAuto.AddDays(-dias.Value);
            var inicioUtc = DateTime.SpecifyKind(fechaInicioAuto, DateTimeKind.Utc);
            var finUtc = DateTime.SpecifyKind(fechaFinAuto, DateTimeKind.Utc);
            return query.Where(o => o.Fecha >= inicioUtc && o.Fecha <= finUtc);
        }
        
        if (fechaInicio.HasValue)
        {
            var inicioUtc = DateTime.SpecifyKind(fechaInicio.Value, DateTimeKind.Utc);
            query = query.Where(o => o.Fecha >= inicioUtc);
        }
        if (fechaFin.HasValue)
        {
            var finUtc = DateTime.SpecifyKind(fechaFin.Value, DateTimeKind.Utc);
            query = query.Where(o => o.Fecha <= finUtc);
        }
        return query;
    }

    // ==========================================
    // 1. Total de órdenes por lapso
    // ==========================================
    [HttpGet("ordenes-por-lapso")]
    public async Task<IActionResult> GetOrdenesPorLapso(
        [FromQuery] int? dias = null,
        [FromQuery] DateTime? fechaInicio = null,
        [FromQuery] DateTime? fechaFin = null,
        [FromQuery] string? zona = null)
    {
        var query = _context.OrdenesTrabajo.AsQueryable();
        query = AplicarFiltrosFecha(query, dias, fechaInicio, fechaFin);
        
        if (!string.IsNullOrEmpty(zona))
            query = query.Where(o => o.ZonaServicio == zona);

        var total = await query.CountAsync();
        var periodoTexto = ObtenerPeriodoTexto(dias, fechaInicio, fechaFin);

        return Ok(new { periodo = periodoTexto, zona_filtro = zona ?? "todas", total_ordenes = total });
    }

    // ==========================================
    // 2. Órdenes completadas por lapso
    // ==========================================
    [HttpGet("ordenes-completadas")]
    public async Task<IActionResult> GetOrdenesCompletadas(
        [FromQuery] int? dias = null,
        [FromQuery] DateTime? fechaInicio = null,
        [FromQuery] DateTime? fechaFin = null,
        [FromQuery] string? zona = null)
    {
        var query = _context.OrdenesTrabajo.Where(o => o.EstadoOrden == "Completado");
        query = AplicarFiltrosFecha(query, dias, fechaInicio, fechaFin);
        
        if (!string.IsNullOrEmpty(zona))
            query = query.Where(o => o.ZonaServicio == zona);

        var completadas = await query.CountAsync();
        var periodoTexto = ObtenerPeriodoTexto(dias, fechaInicio, fechaFin);

        return Ok(new { periodo = periodoTexto, zona_filtro = zona ?? "todas", ordenes_completadas = completadas });
    }

    // ==========================================
    // 3. Total de ingreso por mes seleccionable
    // ==========================================
    [HttpGet("ingreso-por-mes")]
    public async Task<IActionResult> GetIngresoPorMes(
        [FromQuery] int año,
        [FromQuery] int mes,
        [FromQuery] string? zona = null)
    {
        var inicio = new DateTime(año, mes, 1, 0, 0, 0, DateTimeKind.Utc);
        var fin = inicio.AddMonths(1).AddDays(-1);

        var query = _context.OrdenesTrabajo.Where(o => o.Fecha >= inicio && o.Fecha <= fin);
        
        if (!string.IsNullOrEmpty(zona))
            query = query.Where(o => o.ZonaServicio == zona);

        var ingreso = await query.SumAsync(o => o.IngresoGenerado);

        return Ok(new { año, mes, zona_filtro = zona ?? "todas", ingreso_total = ingreso });
    }

    // ==========================================
    // 4. Rendimiento de técnicos
    // ==========================================
    [HttpGet("rendimiento-tecnicos")]
    public async Task<IActionResult> GetRendimientoTecnicos(
        [FromQuery] int? dias = null,
        [FromQuery] DateTime? fechaInicio = null,
        [FromQuery] DateTime? fechaFin = null,
        [FromQuery] string? zona = null)
    {
        var query = _context.OrdenesTrabajo.AsQueryable();
        query = AplicarFiltrosFecha(query, dias, fechaInicio, fechaFin);
        
        if (!string.IsNullOrEmpty(zona))
            query = query.Where(o => o.ZonaServicio == zona);

        var tecnicos = await query
            .GroupBy(o => o.TecnicoAsignado)
            .Select(g => new
            {
                tecnico = g.Key,
                total_ordenes = g.Count(),
                completadas = g.Count(o => o.EstadoOrden == "Completado"),
                pendientes = g.Count(o => o.EstadoOrden == "Pendiente")
            })
            .OrderByDescending(x => x.total_ordenes)
            .ToListAsync();

        var periodoTexto = ObtenerPeriodoTexto(dias, fechaInicio, fechaFin);

        return Ok(new { periodo = periodoTexto, zona_filtro = zona ?? "todas", tecnicos });
    }

    // ==========================================
    // 5. Rendimiento por técnico + zona
    // ==========================================
    [HttpGet("rendimiento-tecnico-zona")]
    public async Task<IActionResult> GetRendimientoTecnicoZona(
        [FromQuery] int? dias = null,
        [FromQuery] DateTime? fechaInicio = null,
        [FromQuery] DateTime? fechaFin = null,
        [FromQuery] string? zona = null)
    {
        var query = _context.OrdenesTrabajo.AsQueryable();
        query = AplicarFiltrosFecha(query, dias, fechaInicio, fechaFin);
        
        if (!string.IsNullOrEmpty(zona))
            query = query.Where(o => o.ZonaServicio == zona);

        var tecnicosZona = await query
            .GroupBy(o => new { o.TecnicoAsignado, o.ZonaServicio })
            .Select(g => new
            {
                tecnico = g.Key.TecnicoAsignado,
                zona = g.Key.ZonaServicio,
                total_ordenes = g.Count(),
                completadas = g.Count(o => o.EstadoOrden == "Completado")
            })
            .OrderByDescending(x => x.total_ordenes)
            .ToListAsync();

        var periodoTexto = ObtenerPeriodoTexto(dias, fechaInicio, fechaFin);

        return Ok(new { periodo = periodoTexto, zona_filtro = zona ?? "todas", detalle = tecnicosZona });
    }

    // ==========================================
    // 6. Captación por canal digital
    // ==========================================
    [HttpGet("captacion-canal")]
    public async Task<IActionResult> GetCaptacionCanal(
        [FromQuery] int? dias = null,
        [FromQuery] DateTime? fechaInicio = null,
        [FromQuery] DateTime? fechaFin = null,
        [FromQuery] string? zona = null)
    {
        var query = _context.OrdenesTrabajo.AsQueryable();
        query = AplicarFiltrosFecha(query, dias, fechaInicio, fechaFin);
        
        if (!string.IsNullOrEmpty(zona))
            query = query.Where(o => o.ZonaServicio == zona);

        var canales = await query
            .GroupBy(o => o.CanalContacto)
            .Select(g => new
            {
                canal = g.Key,
                clientes_obtenidos = g.Sum(o => o.Conversiones),
                consultas_recibidas = g.Sum(o => o.Consultas)
            })
            .OrderByDescending(x => x.clientes_obtenidos)
            .ToListAsync();

        var periodoTexto = ObtenerPeriodoTexto(dias, fechaInicio, fechaFin);

        return Ok(new { periodo = periodoTexto, zona_filtro = zona ?? "todas", canales });
    }

    // ==========================================
    // 7. Tiempo promedio por servicio
    // ==========================================
    [HttpGet("tiempo-promedio")]
    public async Task<IActionResult> GetTiempoPromedio(
        [FromQuery] int? dias = null,
        [FromQuery] DateTime? fechaInicio = null,
        [FromQuery] DateTime? fechaFin = null,
        [FromQuery] string? zona = null)
    {
        var query = _context.OrdenesTrabajo
            .Where(o => o.EstadoOrden == "Completada" && o.TiempoInstalacionHoras > 0);
        query = AplicarFiltrosFecha(query, dias, fechaInicio, fechaFin);
        
        if (!string.IsNullOrEmpty(zona))
            query = query.Where(o => o.ZonaServicio == zona);

        var tiempoPorServicio = await query
            .GroupBy(o => o.TipoServicio)
            .Select(g => new
            {
                servicio = g.Key,
                tiempo_promedio_horas = Math.Round(g.Average(o => o.TiempoInstalacionHoras), 2),
                total_instalaciones = g.Count()
            })
            .OrderByDescending(x => x.tiempo_promedio_horas)
            .ToListAsync();

        var promedioGeneral = tiempoPorServicio.Any() 
            ? Math.Round(tiempoPorServicio.Average(x => x.tiempo_promedio_horas), 2) 
            : 0;

        var periodoTexto = ObtenerPeriodoTexto(dias, fechaInicio, fechaFin);

        return Ok(new
        {
            periodo = periodoTexto,
            zona_filtro = zona ?? "todas",
            promedio_general_horas = promedioGeneral,
            detalle_por_servicio = tiempoPorServicio
        });
    }

    // ==========================================
    // 8. Servicios demandados
    // ==========================================
    [HttpGet("servicios-demandados")]
    public async Task<IActionResult> GetServiciosDemandados(
        [FromQuery] int? dias = null,
        [FromQuery] DateTime? fechaInicio = null,
        [FromQuery] DateTime? fechaFin = null,
        [FromQuery] string? zona = null)
    {
        var query = _context.OrdenesTrabajo.AsQueryable();
        query = AplicarFiltrosFecha(query, dias, fechaInicio, fechaFin);
        
        if (!string.IsNullOrEmpty(zona))
            query = query.Where(o => o.ZonaServicio == zona);

        var servicios = await query
            .GroupBy(o => o.TipoServicio)
            .Select(g => new
            {
                servicio = g.Key,
                total_ordenes = g.Count(),
                completadas = g.Count(o => o.EstadoOrden == "Completado")
            })
            .OrderByDescending(x => x.total_ordenes)
            .ToListAsync();

        var periodoTexto = ObtenerPeriodoTexto(dias, fechaInicio, fechaFin);

        return Ok(new { periodo = periodoTexto, zona_filtro = zona ?? "todas", servicios });
    }

    // ==========================================
    // 9. Servicios demandados por zona
    // ==========================================
    [HttpGet("servicios-por-zona")]
    public async Task<IActionResult> GetServiciosPorZona(
        [FromQuery] int? dias = null,
        [FromQuery] DateTime? fechaInicio = null,
        [FromQuery] DateTime? fechaFin = null,
        [FromQuery] string? zona = null)
    {
        var query = _context.OrdenesTrabajo.AsQueryable();
        query = AplicarFiltrosFecha(query, dias, fechaInicio, fechaFin);
        
        if (!string.IsNullOrEmpty(zona))
            query = query.Where(o => o.ZonaServicio == zona);

        var serviciosZona = await query
            .GroupBy(o => new { o.TipoServicio, o.ZonaServicio })
            .Select(g => new
            {
                servicio = g.Key.TipoServicio,
                zona = g.Key.ZonaServicio,
                total_ordenes = g.Count()
            })
            .OrderByDescending(x => x.total_ordenes)
            .ToListAsync();

        var periodoTexto = ObtenerPeriodoTexto(dias, fechaInicio, fechaFin);

        return Ok(new { periodo = periodoTexto, zona_filtro = zona ?? "todas", detalle = serviciosZona });
    }

    // ==========================================
    // 10. Materiales más utilizados
    // ==========================================
    [HttpGet("materiales-utilizados")]
    public async Task<IActionResult> GetMaterialesUtilizados(
        [FromQuery] int? dias = null,
        [FromQuery] DateTime? fechaInicio = null,
        [FromQuery] DateTime? fechaFin = null,
        [FromQuery] string? zona = null,
        [FromQuery] int top = 10)
    {
        var query = _context.OrdenesTrabajo.Where(o => o.MaterialUtilizado != null);
        query = AplicarFiltrosFecha(query, dias, fechaInicio, fechaFin);
        
        if (!string.IsNullOrEmpty(zona))
            query = query.Where(o => o.ZonaServicio == zona);

        var materiales = await query
            .GroupBy(o => o.MaterialUtilizado)
            .Select(g => new
            {
                material = g.Key,
                cantidad_total = g.Sum(o => o.CantidadMaterial),
                ordenes_asociadas = g.Count()
            })
            .OrderByDescending(x => x.cantidad_total)
            .Take(top)
            .ToListAsync();

        var periodoTexto = ObtenerPeriodoTexto(dias, fechaInicio, fechaFin);

        return Ok(new { periodo = periodoTexto, zona_filtro = zona ?? "todas", materiales });
    }

    // ==========================================
    // 11. Estado de órdenes por lapso
    // ==========================================
    [HttpGet("estado-ordenes")]
    public async Task<IActionResult> GetEstadoOrdenes(
        [FromQuery] int? dias = null,
        [FromQuery] DateTime? fechaInicio = null,
        [FromQuery] DateTime? fechaFin = null,
        [FromQuery] string? zona = null)
    {
        var query = _context.OrdenesTrabajo.AsQueryable();
        query = AplicarFiltrosFecha(query, dias, fechaInicio, fechaFin);
        
        if (!string.IsNullOrEmpty(zona))
            query = query.Where(o => o.ZonaServicio == zona);

        var estados = await query
            .GroupBy(o => o.EstadoOrden)
            .Select(g => new
            {
                estado = g.Key,
                total = g.Count()
            })
            .ToListAsync();

        var periodoTexto = ObtenerPeriodoTexto(dias, fechaInicio, fechaFin);

        return Ok(new { periodo = periodoTexto, zona_filtro = zona ?? "todas", estados });
    }

    // ==========================================
    // 12. Técnicos con órdenes pendientes
    // ==========================================
    [HttpGet("tecnicos-pendientes")]
    public async Task<IActionResult> GetTecnicosPendientes(
        [FromQuery] int? dias = null,
        [FromQuery] DateTime? fechaInicio = null,
        [FromQuery] DateTime? fechaFin = null,
        [FromQuery] string? zona = null)
    {
        var query = _context.OrdenesTrabajo.Where(o => o.EstadoOrden == "Pendiente");
        query = AplicarFiltrosFecha(query, dias, fechaInicio, fechaFin);
        
        if (!string.IsNullOrEmpty(zona))
            query = query.Where(o => o.ZonaServicio == zona);

        var tecnicos = await query
            .GroupBy(o => o.TecnicoAsignado)
            .Select(g => new
            {
                tecnico = g.Key,
                ordenes_pendientes = g.Count()
            })
            .OrderByDescending(x => x.ordenes_pendientes)
            .ToListAsync();

        var periodoTexto = ObtenerPeriodoTexto(dias, fechaInicio, fechaFin);

        return Ok(new { periodo = periodoTexto, zona_filtro = zona ?? "todas", tecnicos });
    }

    // ==========================================
    // 13. Eficiencia operativa (por zona)
    // ==========================================
    [HttpGet("eficiencia-operativa")]
    public async Task<IActionResult> GetEficienciaOperativa(
        [FromQuery] int? dias = null,
        [FromQuery] DateTime? fechaInicio = null,
        [FromQuery] DateTime? fechaFin = null,
        [FromQuery] string? zona = null)
    {
        var query = _context.OrdenesTrabajo
            .Where(o => o.EstadoOrden == "Completado" && o.TiempoInstalacionHoras > 0);
        query = AplicarFiltrosFecha(query, dias, fechaInicio, fechaFin);
        
        if (!string.IsNullOrEmpty(zona))
            query = query.Where(o => o.ZonaServicio == zona);

        var promedioGeneral = await query.AverageAsync(o => (double?)o.TiempoInstalacionHoras) ?? 0;
        
        var porZona = await query
            .GroupBy(o => o.ZonaServicio)
            .Select(g => new
            {
                zona = g.Key,
                tiempo_promedio_horas = Math.Round(g.Average(o => o.TiempoInstalacionHoras), 2),
                total_instalaciones = g.Count()
            })
            .OrderBy(x => x.tiempo_promedio_horas)
            .ToListAsync();

        var periodoTexto = ObtenerPeriodoTexto(dias, fechaInicio, fechaFin);

        return Ok(new
        {
            periodo = periodoTexto,
            zona_filtro = zona ?? "todas",
            tiempo_promedio_general_horas = Math.Round(promedioGeneral, 2),
            detalle_por_zona = porZona
        });
    }

    // ==========================================
    // 14. Clientes recurrentes
    // ==========================================
    [HttpGet("clientes-recurrentes")]
    public async Task<IActionResult> GetClientesRecurrentes(
        [FromQuery] int? dias = null,
        [FromQuery] DateTime? fechaInicio = null,
        [FromQuery] DateTime? fechaFin = null,
        [FromQuery] string? zona = null)
    {
        var query = _context.OrdenesTrabajo.AsQueryable();
        query = AplicarFiltrosFecha(query, dias, fechaInicio, fechaFin);
        
        if (!string.IsNullOrEmpty(zona))
            query = query.Where(o => o.ZonaServicio == zona);

        var ordenesPorCliente = await query
            .GroupBy(o => o.OrdenId)
            .Select(g => new
            {
                ordenId = g.Key,
                cantidad = g.Count()
            })
            .ToListAsync();

        var recurrentes = ordenesPorCliente.Count(x => x.cantidad > 1);
        var totalClientes = ordenesPorCliente.Count;

        var periodoTexto = ObtenerPeriodoTexto(dias, fechaInicio, fechaFin);

        return Ok(new
        {
            periodo = periodoTexto,
            zona_filtro = zona ?? "todas",
            clientes_recurrentes = recurrentes,
            total_clientes = totalClientes,
            porcentaje_recurrencia = totalClientes > 0 ? Math.Round((double)recurrentes / totalClientes * 100, 2) : 0
        });
    }

    // ==========================================
    // 15. Tasas conversión (consulta → conversión)
    // ==========================================
    [HttpGet("tasa-conversion")]
    public async Task<IActionResult> GetTasaConversion(
        [FromQuery] int? dias = null,
        [FromQuery] DateTime? fechaInicio = null,
        [FromQuery] DateTime? fechaFin = null,
        [FromQuery] string? zona = null)
    {
        var query = _context.OrdenesTrabajo.AsQueryable();
        query = AplicarFiltrosFecha(query, dias, fechaInicio, fechaFin);
        
        if (!string.IsNullOrEmpty(zona))
            query = query.Where(o => o.ZonaServicio == zona);

        // Traer los datos agregados por zona (sin Math.Round en SQL)
        var datosPorZona = await query
            .GroupBy(o => o.ZonaServicio)
            .Select(g => new
            {
                zona = g.Key,
                consultas = g.Sum(o => o.Consultas),
                conversiones = g.Sum(o => o.Conversiones)
            })
            .ToListAsync();

        // Calcular tasa con Math.Round ya en memoria (cliente)
        var porZona = datosPorZona.Select(d => new
        {
            zona = d.zona,
            consultas = d.consultas,
            conversiones = d.conversiones,
            tasa = d.consultas > 0 
                ? Math.Round((double)d.conversiones / d.consultas * 100, 2) 
                : 0
        }).OrderByDescending(x => x.tasa).ToList();

        var totalConsultas = datosPorZona.Sum(d => d.consultas);
        var totalConversiones = datosPorZona.Sum(d => d.conversiones);

        var ratio = totalConsultas > 0
            ? (double)totalConversiones / totalConsultas
            : 0;

        var periodoTexto = ObtenerPeriodoTexto(dias, fechaInicio, fechaFin);

        return Ok(new
        {
            periodo = periodoTexto,
            zona_filtro = zona ?? "todas",
            consultas_totales = totalConsultas,
            conversiones_totales = totalConversiones,
            tasa_conversion = Math.Round(ratio * 100, 2),
            detalle_por_zona = porZona
        });
    }

    // ==========================================
    // 16. Satisfacción por servicio
    // ==========================================
    [HttpGet("satisfaccion-servicio")]
    public async Task<IActionResult> GetSatisfaccionServicio(
        [FromQuery] int? dias = null,
        [FromQuery] DateTime? fechaInicio = null,
        [FromQuery] DateTime? fechaFin = null,
        [FromQuery] string? zona = null)
    {
        var query = _context.OrdenesTrabajo.Where(o => o.SatisfaccionCliente > 0);
        query = AplicarFiltrosFecha(query, dias, fechaInicio, fechaFin);
        
        if (!string.IsNullOrEmpty(zona))
            query = query.Where(o => o.ZonaServicio == zona);

        // PASO 1: Traer los datos sin redondear desde la BD
        var datosSinRedondear = await query
            .GroupBy(o => o.TipoServicio)
            .Select(g => new
            {
                servicio = g.Key,
                promedio_bruto = g.Average(o => o.SatisfaccionCliente),
                total_valoraciones = g.Count()
            })
            .OrderByDescending(x => x.promedio_bruto)
            .ToListAsync();

        // PASO 2: Aplicar el redondeo en memoria (ya tenemos los datos)
        var satisfaccion = datosSinRedondear.Select(d => new
        {
            servicio = d.servicio,
            promedio = Math.Round(d.promedio_bruto, 2),
            total_valoraciones = d.total_valoraciones
        }).ToList();

        var periodoTexto = ObtenerPeriodoTexto(dias, fechaInicio, fechaFin);

        return Ok(new
        {
            periodo = periodoTexto,
            zona_filtro = zona ?? "todas",
            escala = "1 a 5 (1=Muy malo, 5=Muy bueno)",
            detalle_por_servicio = satisfaccion
        });
    }

    // ==========================================
    // 17. Costo e ingreso por servicio
    // ==========================================
    [HttpGet("costo-ingreso-servicio")]
    public async Task<IActionResult> GetCostoIngresoServicio(
        [FromQuery] int? dias = null,
        [FromQuery] DateTime? fechaInicio = null,
        [FromQuery] DateTime? fechaFin = null,
        [FromQuery] string? zona = null)
    {
        var query = _context.OrdenesTrabajo.AsQueryable();
        query = AplicarFiltrosFecha(query, dias, fechaInicio, fechaFin);
        
        if (!string.IsNullOrEmpty(zona))
            query = query.Where(o => o.ZonaServicio == zona);

        var resumen = await query
            .GroupBy(o => o.TipoServicio)
            .Select(g => new
            {
                servicio = g.Key,
                ingreso_total = g.Sum(o => o.IngresoGenerado),
                costo_total = g.Sum(o => o.CostoServicio),
                ganancia = g.Sum(o => o.IngresoGenerado) - g.Sum(o => o.CostoServicio)
            })
            .OrderByDescending(x => x.ingreso_total)
            .ToListAsync();

        var ingresoGeneral = resumen.Sum(x => x.ingreso_total);
        var costoGeneral = resumen.Sum(x => x.costo_total);

        var periodoTexto = ObtenerPeriodoTexto(dias, fechaInicio, fechaFin);

        return Ok(new
        {
            periodo = periodoTexto,
            zona_filtro = zona ?? "todas",
            totales = new
            {
                ingreso_total = ingresoGeneral,
                costo_total = costoGeneral,
                ganancia_total = ingresoGeneral - costoGeneral
            },
            detalle_por_servicio = resumen
        });
    }
}