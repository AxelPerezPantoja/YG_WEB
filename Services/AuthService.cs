using ApiAuth.Data;
using ApiAuth.Models;
using Microsoft.EntityFrameworkCore;

namespace ApiAuth.Services;

public class AuthService
{
    private readonly AppDbContext _context;
    private readonly TokenService _tokenService;
    private readonly EmailService _emailService;

    // ✅ Constructor CORREGIDO
    public AuthService(AppDbContext context, TokenService tokenService, EmailService emailService)
    {
        _context = context;
        _tokenService = tokenService;
        _emailService = emailService;
    }

    public async Task<AuthResponse?> Login(LoginRequest request)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email && u.IsActive);

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return null;

        return _tokenService.GenerateToken(user);
    }

    public async Task<AuthResponse?> Register(RegisterRequest request)
    {
        var exists = await _context.Users.AnyAsync(u => u.Email == request.Email);
        if (exists) return null;

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = "User"
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return _tokenService.GenerateToken(user);
    }

    public async Task<User?> GetUserById(int id)
    {
        return await _context.Users.FindAsync(id);
    }

    // ✅ Solicitar código de recuperación
    public async Task<bool> RequestPasswordReset(string email)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email && u.IsActive);

        if (user == null)
            return false;

        var random = new Random();
        string resetCode = random.Next(100000, 999999).ToString();

        user.ResetCode = resetCode;
        user.ResetCodeExpiration = DateTime.UtcNow.AddMinutes(15);
        await _context.SaveChangesAsync();

        // Enviar correo
        bool emailSent = await _emailService.SendPasswordResetEmail(email, resetCode);

        if (emailSent)
            Console.WriteLine($"[RECUPERACIÓN] Código enviado a {email}");
        else
            Console.WriteLine($"[RECUPERACIÓN] Falló envío a {email}");

        return emailSent;
    }

    // ✅ NUEVO: Método para restablecer contraseña
    public async Task<bool> ResetPassword(string email, string resetCode, string newPassword)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email && u.IsActive);

        if (user == null)
            return false;

        if (user.ResetCode != resetCode)
            return false;

        if (user.ResetCodeExpiration < DateTime.UtcNow)
            return false;

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        user.ResetCode = null;
        user.ResetCodeExpiration = null;

        await _context.SaveChangesAsync();
        return true;
    }
}