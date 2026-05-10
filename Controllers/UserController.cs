using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ApiAuth.Data;
using Microsoft.EntityFrameworkCore;
using ApiAuth.Models;

namespace ApiAuth.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserController : ControllerBase
{
    private readonly AppDbContext _context;

    public UserController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _context.Users
            .Select(u => new
            {
                u.Id,
                u.Username,
                u.Email,
                u.Role,
                u.CreatedAt,
                u.IsActive
            })
            .OrderBy(u => u.Id)
            .ToListAsync();

        return Ok(new
        {
            total = users.Count,
            users = users
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetUser(int id)
    {
        var currentUserId = HttpContext.Items["UserId"] as int?;

        if (!User.IsInRole("Admin") && currentUserId != id)
            return Forbid();

        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();

        return Ok(new { user.Id, user.Username, user.Email, user.Role });
    }

    [HttpPut("{id}/role")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateUserRole(int id, [FromBody] UpdateRoleRequest request)
    {
        // Buscar el usuario por ID
        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            return NotFound(new { message = $"Usuario con ID {id} no encontrado" });
        }

        // Validar que el rol sea válido
        var validRoles = new[] { "Admin", "User" };
        if (!validRoles.Contains(request.Role))
        {
            return BadRequest(new
            {
                message = $"Rol inválido. Roles permitidos: {string.Join(", ", validRoles)}",
                validRoles = validRoles
            });
        }

        // Guardar el rol anterior por si queremos mostrarlo
        string oldRole = user.Role;

        // Actualizar el rol
        user.Role = request.Role;
        await _context.SaveChangesAsync();

        // Registrar la acción (opcional, para auditoría)
        var adminId = HttpContext.Items["UserId"] as int?;
        Console.WriteLine($"[AUDITORÍA] Admin ID {adminId} cambió rol de usuario {user.Id} de '{oldRole}' a '{request.Role}'");

        return Ok(new
        {
            message = $"Rol actualizado correctamente",
            userId = user.Id,
            username = user.Username,
            oldRole = oldRole,
            newRole = user.Role,
            updatedBy = adminId
        });
    }
}