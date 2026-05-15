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

        // 💡 SOLUCIÓN: Usar OnStarting para escribir el header justo antes de que se envíe la respuesta
        context.Response.OnStarting(() => {
            stopwatch.Stop();
            var elapsedMs = stopwatch.ElapsedMilliseconds;
            context.Response.Headers.Append("X-Response-Time-ms", elapsedMs.ToString());
            
            // También logueamos aquí para tener el tiempo real de envío
            _logger.LogInformation($"⏱️ {context.Request.Method} {context.Request.Path} - {elapsedMs} ms");
            
            return Task.CompletedTask;
        });

        await _next(context);
    }
}