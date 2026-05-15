using System.Collections.Concurrent;

namespace ApiAuth.Middleware;

public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;
    private static readonly ConcurrentDictionary<string, (int Count, DateTime ResetTime)> _requests = new();
    private readonly int _maxRequests = 100;      // Máximo 100 peticiones
    private readonly int _timeWindowSeconds = 60; // por minuto

    public RateLimitingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var now = DateTime.UtcNow;

        // Limpiar entradas expiradas cada cierto tiempo
        if (_requests.Count > 1000)
        {
            var expired = _requests.Where(x => x.Value.ResetTime < now).Select(x => x.Key).ToList();
            foreach (var key in expired)
                _requests.TryRemove(key, out _);
        }

        // Obtener o crear registro para esta IP
        var requestInfo = _requests.GetOrAdd(ip, (0, now.AddSeconds(_timeWindowSeconds)));

        // Si expiró la ventana, reiniciar
        if (requestInfo.ResetTime < now)
        {
            requestInfo = (1, now.AddSeconds(_timeWindowSeconds));
            _requests[ip] = requestInfo;
        }
        // Si está dentro de la ventana, incrementar
        else
        {
            if (requestInfo.Count >= _maxRequests)
            {
                context.Response.StatusCode = 429; // Too Many Requests
                await context.Response.WriteAsJsonAsync(new 
                { 
                    message = "Demasiadas peticiones. Intenta nuevamente en unos segundos.",
                    retryAfter = (int)(requestInfo.ResetTime - now).TotalSeconds
                });
                return;
            }
            
            requestInfo.Count++;
            _requests[ip] = requestInfo;
        }

        await _next(context);
    }
}