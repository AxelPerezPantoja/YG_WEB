using System.Diagnostics;

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
        
        await _next(context);
        
        stopwatch.Stop();
        var elapsedMs = stopwatch.ElapsedMilliseconds;
        
        _logger.LogInformation($"⏱️ {context.Request.Method} {context.Request.Path} - {elapsedMs} ms");
        
        // Agregar header con el tiempo de respuesta
        context.Response.Headers.Append("X-Response-Time-ms", elapsedMs.ToString());
    }
}