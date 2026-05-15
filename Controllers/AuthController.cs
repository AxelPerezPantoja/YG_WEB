using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ApiAuth.Models;
using ApiAuth.Services;

namespace ApiAuth.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var response = await _authService.Login(request);
        if (response == null)
            return Unauthorized(new { message = "Credenciales inválidas" });

        return Ok(response);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var response = await _authService.Register(request);
        if (response == null)
            return BadRequest(new { message = "El usuario ya existe" });

        return Ok(response);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userId = HttpContext.Items["UserId"] as int?;
        if (userId == null) return Unauthorized();

        var user = await _authService.GetUserById(userId.Value);
        if (user == null) return NotFound();

        return Ok(new { user.Id, user.Username, user.Email, user.Role });
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        if (string.IsNullOrEmpty(request.Email))
        {
            return BadRequest(new { message = "El correo electrónico es requerido" });
        }

        var result = await _authService.RequestPasswordReset(request.Email);

        // Siempre devolvemos el mismo mensaje por seguridad
        // (así no decimos si el email existe o no)
        return Ok(new
        {
            message = "Si el correo existe, recibirás un código de recuperación",
            note = "En desarrollo, revisa la consola para ver el código"
        });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        // Validaciones básicas
        if (string.IsNullOrEmpty(request.Email) ||
            string.IsNullOrEmpty(request.ResetCode) ||
            string.IsNullOrEmpty(request.NewPassword))
        {
            return BadRequest(new { message = "Todos los campos son requeridos" });
        }

        if (request.NewPassword.Length < 6)
        {
            return BadRequest(new { message = "La contraseña debe tener al menos 6 caracteres" });
        }

        var result = await _authService.ResetPassword(
            request.Email,
            request.ResetCode,
            request.NewPassword
        );

        if (!result)
        {
            return BadRequest(new { message = "Código inválido o expirado" });
        }

        return Ok(new { message = "Contraseña actualizada correctamente" });
    }
}