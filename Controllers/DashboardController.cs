using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ApiAuth.Data;

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
    // 1. TOTAL DE ÓRDENES
    // ==========================================
    [HttpGet("total-ordenes")]
    public async Task<IActionResult> GetTotalOrdenes()
    {
        var total = await _context.OrdenesTrabajo.CountAsync();
        return Ok(new { total_ordenes = total });
    }

    // ==========================================
    // 2. ÓRDENES COMPLETADAS VS PENDIENTES
    // ==========================================
    [HttpGet("estado-ordenes")]
    public async Task<IActionResult> GetEstadoOrdenes()
    {
        var completadas = await _context.OrdenesTrabajo.CountAsync(o => o.EstadoOrden == "Completado");
        var pendientes = await _context.OrdenesTrabajo.CountAsync(o => o.EstadoOrden == "Pendiente");
        var enProceso = await _context.OrdenesTrabajo.CountAsync(o => o.EstadoOrden == "En proceso");
        
        return Ok(new
        {
            completadas = completadas,
            pendientes = pendientes,
            en_proceso = enProceso
        });
    }

    // ==========================================
    // 3. INGRESOS TOTALES
    // ==========================================
    [HttpGet("ingresos-totales")]
    public async Task<IActionResult> GetIngresosTotales()
    {
        var total = await _context.OrdenesTrabajo.SumAsync(o => o.IngresoGenerado);
        return Ok(new { ingresos_totales = total });
    }

    // ==========================================
    // 4. INGRESOS POR MES (Para línea de tiempo)
    // ==========================================
    [HttpGet("ingresos-por-mes")]
    public async Task<IActionResult> GetIngresosPorMes()
    {
        var ingresos = await _context.OrdenesTrabajo
            .GroupBy(o => new { o.Fecha.Year, o.Fecha.Month })
            .Select(g => new
            {
                año = g.Key.Year,
                mes = g.Key.Month,
                nombre_mes = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMMM"),
                total = g.Sum(o => o.IngresoGenerado)
            })
            .OrderBy(x => x.año)
            .ThenBy(x => x.mes)
            .ToListAsync();
        
        return Ok(ingresos);
    }

    // ==========================================
    // 5. SERVICIOS MÁS DEMANDADOS
    // ==========================================
    [HttpGet("servicios-mas-demandados")]
    public async Task<IActionResult> GetServiciosMasDemandados()
    {
        var servicios = await _context.OrdenesTrabajo
            .GroupBy(o => o.TipoServicio)
            .Select(g => new
            {
                servicio = g.Key,
                cantidad = g.Count(),
                ingreso_total = g.Sum(o => o.IngresoGenerado)
            })
            .OrderByDescending(x => x.cantidad)
            .ToListAsync();
        
        return Ok(servicios);
    }

    // ==========================================
    // 6. RENDIMIENTO POR TÉCNICO
    // ==========================================
    [HttpGet("rendimiento-tecnicos")]
    public async Task<IActionResult> GetRendimientoTecnicos()
    {
        var tecnicos = await _context.OrdenesTrabajo
            .Where(o => o.EstadoOrden == "Completado")
            .GroupBy(o => o.TecnicoAsignado)
            .Select(g => new
            {
                tecnico = g.Key,
                instalaciones = g.Count(),
                tiempo_promedio = g.Average(o => o.TiempoInstalacionHoras),
                ingresos_generados = g.Sum(o => o.IngresoGenerado)
            })
            .OrderByDescending(x => x.instalaciones)
            .ToListAsync();
        
        return Ok(tecnicos);
    }

    // ==========================================
    // 7. DEMANDA POR ZONA
    // ==========================================
    [HttpGet("demanda-por-zona")]
    public async Task<IActionResult> GetDemandaPorZona()
    {
        var zonas = await _context.OrdenesTrabajo
            .GroupBy(o => o.ZonaServicio)
            .Select(g => new
            {
                zona = g.Key,
                ordenes = g.Count(),
                ingresos = g.Sum(o => o.IngresoGenerado)
            })
            .OrderByDescending(x => x.ordenes)
            .ToListAsync();
        
        return Ok(zonas);
    }

    // ==========================================
    // 8. MATERIALES MÁS UTILIZADOS
    // ==========================================
    [HttpGet("materiales-mas-utilizados")]
    public async Task<IActionResult> GetMaterialesMasUtilizados()
    {
        var materiales = await _context.OrdenesTrabajo
            .Where(o => o.MaterialUtilizado != null)
            .GroupBy(o => o.MaterialUtilizado)
            .Select(g => new
            {
                material = g.Key,
                cantidad_total = g.Sum(o => o.CantidadMaterial),
                ordenes = g.Count()
            })
            .OrderByDescending(x => x.cantidad_total)
            .Take(10)
            .ToListAsync();
        
        return Ok(materiales);
    }

    // ==========================================
    // 9. SATISFACCIÓN DEL CLIENTE POR SERVICIO
    // ==========================================
    [HttpGet("satisfaccion-por-servicio")]
    public async Task<IActionResult> GetSatisfaccionPorServicio()
    {
        var satisfaccion = await _context.OrdenesTrabajo
            .Where(o => o.SatisfaccionCliente > 0)
            .GroupBy(o => o.TipoServicio)
            .Select(g => new
            {
                servicio = g.Key,
                promedio = g.Average(o => o.SatisfaccionCliente)
            })
            .OrderByDescending(x => x.promedio)
            .ToListAsync();
        
        return Ok(satisfaccion);
    }

    // ==========================================
    // 10. CAPTACIÓN POR CANAL
    // ==========================================
    [HttpGet("captacion-por-canal")]
    public async Task<IActionResult> GetCaptacionPorCanal()
    {
        var canales = await _context.OrdenesTrabajo
            .GroupBy(o => o.CanalContacto)
            .Select(g => new
            {
                canal = g.Key,
                clientes = g.Sum(o => o.Conversiones),
                consultas = g.Sum(o => o.Consultas)
            })
            .OrderByDescending(x => x.clientes)
            .ToListAsync();
        
        return Ok(canales);
    }

    // ==========================================
    // 11. KPI COMPLETO (TODO EN UNO)
    // ==========================================
    [HttpGet("kpi-completo")]
    public async Task<IActionResult> GetKPICompleto()
    {
        var totalOrdenes = await _context.OrdenesTrabajo.CountAsync();
        var completadas = await _context.OrdenesTrabajo.CountAsync(o => o.EstadoOrden == "Completado");
        var ingresosTotales = await _context.OrdenesTrabajo.SumAsync(o => o.IngresoGenerado);
        var satisfaccionPromedio = await _context.OrdenesTrabajo
            .Where(o => o.SatisfaccionCliente > 0)
            .AverageAsync(o => o.SatisfaccionCliente);
        
        var serviciosTop = await _context.OrdenesTrabajo
            .GroupBy(o => o.TipoServicio)
            .Select(g => new { servicio = g.Key, total = g.Count() })
            .OrderByDescending(x => x.total)
            .Take(3)
            .ToListAsync();
        
        var tecnicosTop = await _context.OrdenesTrabajo
            .Where(o => o.EstadoOrden == "Completado")
            .GroupBy(o => o.TecnicoAsignado)
            .Select(g => new { tecnico = g.Key, instalaciones = g.Count() })
            .OrderByDescending(x => x.instalaciones)
            .Take(3)
            .ToListAsync();
        
        var zonaTop = await _context.OrdenesTrabajo
            .GroupBy(o => o.ZonaServicio)
            .Select(g => new { zona = g.Key, ordenes = g.Count() })
            .OrderByDescending(x => x.ordenes)
            .FirstOrDefaultAsync();
        
        return Ok(new
        {
            total_ordenes = totalOrdenes,
            porcentaje_completadas = totalOrdenes > 0 ? Math.Round((double)completadas / totalOrdenes * 100, 2) : 0,
            ingresos_totales = ingresosTotales,
            satisfaccion_promedio = Math.Round(satisfaccionPromedio, 2),
            servicios_mas_demandados = serviciosTop,
            tecnicos_top = tecnicosTop,
            zona_mayor_demanda = zonaTop
        });
    }

    // ==========================================
    // 12. TIEMPO PROMEDIO DE INSTALACIÓN
    // ==========================================
    [HttpGet("tiempo-promedio")]
    public async Task<IActionResult> GetTiempoPromedio([FromQuery] string? tipoServicio = null)
    {
        var query = _context.OrdenesTrabajo.Where(o => o.EstadoOrden == "Completado");
        
        if (!string.IsNullOrEmpty(tipoServicio))
            query = query.Where(o => o.TipoServicio == tipoServicio);
        
        var promedio = await query.AverageAsync(o => o.TiempoInstalacionHoras);
        
        return Ok(new { tiempo_promedio_horas = promedio });
    }

    [HttpGet("equipos-por-vencer")]
public async Task<IActionResult> GetEquiposPorVencer([FromQuery] int dias = 30)
{
    var fechaLimite = DateTime.UtcNow.AddDays(dias);
    
    var equipos = await _context.OrdenesTrabajo
        .Where(o => o.FechaVencimiento.HasValue && o.FechaVencimiento <= fechaLimite)
        .Select(o => new
        {
            material = o.MaterialUtilizado,
            fecha_vencimiento = o.FechaVencimiento,
            cantidad = o.CantidadMaterial
        })
        .ToListAsync();
    
    return Ok(new
    {
        total_equipos_por_vencer = equipos.Count,
        equipos = equipos
    });
}
}