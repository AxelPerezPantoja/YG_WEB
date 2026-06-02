using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Concurrent;

namespace ApiAuth.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class MiddlewareMetricsController : ControllerBase
{
    // ==========================================
    // DATOS COMPARTIDOS CON LOS MIDDLEWARES
    // ==========================================
    
    // Para RateLimitingMiddleware
    public static ConcurrentDictionary<string, (int Count, DateTime ResetTime, DateTime LastSeen)> RateLimitRequests = new();
    public static int TotalRateLimitBlocks = 0;
    public static DateTime LastRateLimitBlock = DateTime.UtcNow;
    
    // Para TimingMiddleware
    public static List<TimingRecord> TimingRecords = new();
    public static readonly object TimingLock = new object();
    
    // Para JwtMiddleware
    public static int TotalTokensValidated = 0;
    public static int TotalTokensInvalid = 0;
    public static DateTime LastTokenValidation = DateTime.UtcNow;
    
    // Para LoggingMiddleware
    public static List<RequestLog> RequestLogs = new();
    public static readonly object LoggingLock = new object();

    // ==========================================
    // MODELOS DE DATOS
    // ==========================================
    
    public class TimingRecord
    {
        public string Method { get; set; } = string.Empty;
        public string Path { get; set; } = string.Empty;
        public long ElapsedMs { get; set; }
        public DateTime Timestamp { get; set; }
        public int StatusCode { get; set; }
    }
    
    public class RequestLog
    {
        public string Method { get; set; } = string.Empty;
        public string Path { get; set; } = string.Empty;
        public int StatusCode { get; set; }
        public DateTime Timestamp { get; set; }
        public string? UserId { get; set; }
    }

    // ==========================================
    // 1. ESTADÍSTICAS DE RATE LIMITING
    // ==========================================
    [HttpGet("rate-limiting")]
    public IActionResult GetRateLimitingMetrics()
    {
        var activeIps = RateLimitRequests
            .Where(x => x.Value.ResetTime > DateTime.UtcNow)
            .Select(x => new
            {
                ip = x.Key,
                peticiones = x.Value.Count,
                limite = 100,
                reinicio_en_segundos = (int)(x.Value.ResetTime - DateTime.UtcNow).TotalSeconds,
                ultima_actividad = x.Value.LastSeen
            })
            .OrderByDescending(x => x.peticiones)
            .Take(20)
            .ToList();
        
        return Ok(new
        {
            total_ips_bloqueadas = RateLimitRequests.Count,
            total_bloqueos_acumulados = TotalRateLimitBlocks,
            ultimo_bloqueo = LastRateLimitBlock,
            ips_activas = activeIps,
            limite_por_ip = 100,
            ventana_segundos = 60
        });
    }

    // ==========================================
    // 2. ESTADÍSTICAS DE TIEMPO (TIMING)
    // ==========================================
    [HttpGet("timing")]
    public IActionResult GetTimingMetrics()
    {
        lock (TimingLock)
        {
            var ultimasPeticiones = TimingRecords
                .OrderByDescending(x => x.Timestamp)
                .Take(50)
                .ToList();
            
            var promedioGeneral = TimingRecords.Count > 0 
                ? TimingRecords.Average(x => x.ElapsedMs) 
                : 0;
            
            var p95 = CalcularPercentil(TimingRecords.Select(x => (double)x.ElapsedMs).ToList(), 95);
            var p99 = CalcularPercentil(TimingRecords.Select(x => (double)x.ElapsedMs).ToList(), 99);
            
            var endpointsMasLentos = TimingRecords
                .GroupBy(x => x.Path)
                .Select(g => new
                {
                    endpoint = g.Key,
                    promedio_ms = g.Average(x => x.ElapsedMs),
                    total_peticiones = g.Count()
                })
                .OrderByDescending(x => x.promedio_ms)
                .Take(10)
                .ToList();
            
            return Ok(new
            {
                total_peticiones_medidas = TimingRecords.Count,
                tiempo_promedio_ms = Math.Round(promedioGeneral, 2),
                percentil_95_ms = Math.Round(p95, 2),
                percentil_99_ms = Math.Round(p99, 2),
                ultimas_peticiones = ultimasPeticiones,
                endpoints_mas_lentos = endpointsMasLentos
            });
        }
    }

    // ==========================================
    // 3. ESTADÍSTICAS DE JWT
    // ==========================================
    [HttpGet("jwt")]
    public IActionResult GetJwtMetrics()
    {
        var tasaExito = TotalTokensValidated + TotalTokensInvalid > 0
            ? (double)TotalTokensValidated / (TotalTokensValidated + TotalTokensInvalid) * 100
            : 0;
        
        return Ok(new
        {
            tokens_validados = TotalTokensValidated,
            tokens_invalidos = TotalTokensInvalid,
            total_validaciones = TotalTokensValidated + TotalTokensInvalid,
            tasa_exito_porcentaje = Math.Round(tasaExito, 2),
            ultima_validacion = LastTokenValidation,
            estado = tasaExito > 90 ? "Saludable" : (tasaExito > 70 ? "Aceptable" : "Crítico")
        });
    }

    // ==========================================
    // 4. ESTADÍSTICAS DE LOGGING
    // ==========================================
    [HttpGet("logging")]
    public IActionResult GetLoggingMetrics()
    {
        lock (LoggingLock)
        {
            var ultimasPeticiones = RequestLogs
                .OrderByDescending(x => x.Timestamp)
                .Take(50)
                .ToList();
            
            var peticionesPorEndpoint = RequestLogs
                .GroupBy(x => x.Path)
                .Select(g => new
                {
                    endpoint = g.Key,
                    total = g.Count(),
                    errores_4xx = g.Count(x => x.StatusCode >= 400 && x.StatusCode < 500),
                    errores_5xx = g.Count(x => x.StatusCode >= 500)
                })
                .OrderByDescending(x => x.total)
                .Take(10)
                .ToList();
            
            var tasaError = RequestLogs.Count > 0
                ? (double)RequestLogs.Count(x => x.StatusCode >= 400) / RequestLogs.Count * 100
                : 0;
            
            return Ok(new
            {
                total_peticiones_registradas = RequestLogs.Count,
                tasa_error_porcentaje = Math.Round(tasaError, 2),
                ultimas_peticiones = ultimasPeticiones,
                endpoints_mas_solicitados = peticionesPorEndpoint
            });
        }
    }

    // ==========================================
    // 5. DASHBOARD COMPLETO DE MIDDLEWARES
    // ==========================================
    [HttpGet("dashboard")]
    public IActionResult GetMiddlewareDashboard()
    {
        // Rate Limiting
        var totalIpsActivas = RateLimitRequests.Count(x => x.Value.ResetTime > DateTime.UtcNow);
        
        // Timing
        double promedioGeneral = 0;
        double p95 = 0;
        lock (TimingLock)
        {
            if (TimingRecords.Count > 0)
            {
                promedioGeneral = TimingRecords.Average(x => x.ElapsedMs);
                p95 = CalcularPercentil(TimingRecords.Select(x => (double)x.ElapsedMs).ToList(), 95);
            }
        }
        
        // JWT
        var totalValidaciones = TotalTokensValidated + TotalTokensInvalid;
        var tasaExitoJwt = totalValidaciones > 0
            ? (double)TotalTokensValidated / totalValidaciones * 100
            : 0;
        
        // Logging
        double tasaError = 0;
        lock (LoggingLock)
        {
            tasaError = RequestLogs.Count > 0
                ? (double)RequestLogs.Count(x => x.StatusCode >= 400) / RequestLogs.Count * 100
                : 0;
        }
        
        return Ok(new
        {
            rate_limiting = new
            {
                ips_activas = totalIpsActivas,
                total_bloqueos = TotalRateLimitBlocks,
                estado = totalIpsActivas > 10 ? "Alerta" : "Normal"
            },
            timing = new
            {
                tiempo_promedio_ms = Math.Round(promedioGeneral, 2),
                percentil_95_ms = Math.Round(p95, 2),
                estado = promedioGeneral > 500 ? "Lento" : (promedioGeneral > 200 ? "Aceptable" : "Rápido")
            },
            jwt = new
            {
                tokens_validados = TotalTokensValidated,
                tokens_invalidos = TotalTokensInvalid,
                tasa_exito = Math.Round(tasaExitoJwt, 2),
                estado = tasaExitoJwt > 90 ? "Saludable" : "Crítico"
            },
            logging = new
            {
                total_peticiones = RequestLogs.Count,
                tasa_error = Math.Round(tasaError, 2),
                estado = tasaError < 1 ? "Saludable" : (tasaError < 5 ? "Aceptable" : "Crítico")
            },
            resumen_general = new
            {
                salud_general = (promedioGeneral <= 500 && tasaExitoJwt > 90 && tasaError < 1) ? "Verde" : "Amarillo",
                ultima_actualizacion = DateTime.UtcNow
            }
        });
    }

    // ==========================================
    // 6. REINICIAR MÉTRICAS
    // ==========================================
    [HttpPost("reset")]
    public IActionResult ResetMetrics()
    {
        RateLimitRequests.Clear();
        TotalRateLimitBlocks = 0;
        
        lock (TimingLock)
        {
            TimingRecords.Clear();
        }
        
        TotalTokensValidated = 0;
        TotalTokensInvalid = 0;
        
        lock (LoggingLock)
        {
            RequestLogs.Clear();
        }
        
        return Ok(new { message = "Métricas reiniciadas correctamente" });
    }

    // ==========================================
    // MÉTODO AUXILIAR: Calcular percentil
    // ==========================================
    private double CalcularPercentil(List<double> valores, int percentil)
    {
        if (valores.Count == 0) return 0;
        
        var sorted = valores.OrderBy(x => x).ToList();
        var index = (int)Math.Ceiling((percentil / 100.0) * sorted.Count) - 1;
        index = Math.Max(0, Math.Min(index, sorted.Count - 1));
        
        return sorted[index];
    }
}