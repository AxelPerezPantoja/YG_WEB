using System.Diagnostics;
using ApiAuth.Controllers;  


namespace ApiAuth.Middleware;

public class TimingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TimingMiddleware> _logger;

    public TimingMiddleware(RequestDelegate next, ILogger<TimingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        long elapsedMs = 0;

        context.Response.OnStarting(() => {
            stopwatch.Stop();
            elapsedMs = stopwatch.ElapsedMilliseconds;
            context.Response.Headers.Append("X-Response-Time-ms", elapsedMs.ToString());
            _logger.LogInformation($"⏱️ {context.Request.Method} {context.Request.Path} - {elapsedMs} ms");
            return Task.CompletedTask;
        });

        await _next(context);
        
        stopwatch.Stop();
        elapsedMs = stopwatch.ElapsedMilliseconds;

        // Registrar la métrica DESPUÉS de que la respuesta se ha generado
        lock (MiddlewareMetricsController.TimingLock)
        {
            MiddlewareMetricsController.TimingRecords.Add(new MiddlewareMetricsController.TimingRecord
            {
                Method = context.Request.Method,
                Path = context.Request.Path,
                ElapsedMs = elapsedMs,
                Timestamp = DateTime.UtcNow,
                StatusCode = context.Response.StatusCode
            });
            
            // Mantener solo las últimas 1000 mediciones
            if (MiddlewareMetricsController.TimingRecords.Count > 1000)
            {
                MiddlewareMetricsController.TimingRecords = MiddlewareMetricsController.TimingRecords
                    .Skip(200)
                    .ToList();
            }
        }
    }
}