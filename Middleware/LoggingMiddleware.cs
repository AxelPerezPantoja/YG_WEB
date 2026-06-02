using ApiAuth.Controllers;  


namespace ApiAuth.Middleware;
public class LoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<LoggingMiddleware> _logger;

    public LoggingMiddleware(RequestDelegate next, ILogger<LoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        _logger.LogInformation("📥 Request: {Method} {Path}", 
            context.Request.Method, 
            context.Request.Path);

        await _next(context);

        _logger.LogInformation("📤 Response: {StatusCode}", 
            context.Response.StatusCode);

        // Registrar el log (después de await _next)
        lock (MiddlewareMetricsController.LoggingLock)
        {
            MiddlewareMetricsController.RequestLogs.Add(new MiddlewareMetricsController.RequestLog
            {
                Method = context.Request.Method,
                Path = context.Request.Path,
                StatusCode = context.Response.StatusCode,
                Timestamp = DateTime.UtcNow,
                UserId = context.Items["UserId"]?.ToString()
            });
            
            // Mantener solo las últimas 1000 entradas
            if (MiddlewareMetricsController.RequestLogs.Count > 1000)
            {
                MiddlewareMetricsController.RequestLogs = MiddlewareMetricsController.RequestLogs
                    .Skip(200)
                    .ToList();
            }
        }
    }
}