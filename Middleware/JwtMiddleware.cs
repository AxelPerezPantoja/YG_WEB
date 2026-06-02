using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using ApiAuth.Controllers;  

namespace ApiAuth.Middleware;

public class JwtMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IConfiguration _config;
    
    public JwtMiddleware(RequestDelegate next, IConfiguration config)
    {
        _next = next;
        _config = config;
    }
    
    public async Task Invoke(HttpContext context)
    {
        var token = context.Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();
        
        if (token != null)
            AttachUserToContext(context, token);
            
        await _next(context);
    }
    
    private void AttachUserToContext(HttpContext context, string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_config["Jwt:Key"] ?? "2P2mRcSjIlAcutYaDAZ2Bg8cVMEF07fQ0t01TsbAf0hPujiOs8GqOD4bFniZC8Rc");
            
            tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = _config["Jwt:Issuer"],
                ValidateAudience = true,
                ValidAudience = _config["Jwt:Audience"],
                ClockSkew = TimeSpan.Zero
            }, out SecurityToken validatedToken);
            
            var jwtToken = (JwtSecurityToken)validatedToken;
            var userId = int.Parse(jwtToken.Claims.First(x => x.Type == "nameid").Value);
            
            // Después de obtener userId
context.Items["UserId"] = userId;
MiddlewareMetricsController.TotalTokensValidated++;
MiddlewareMetricsController.LastTokenValidation = DateTime.UtcNow;

            
        }
        catch
{
    MiddlewareMetricsController.TotalTokensInvalid++;
    MiddlewareMetricsController.LastTokenValidation = DateTime.UtcNow;
}
    }
}