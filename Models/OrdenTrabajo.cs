using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ApiAuth.Models;

[Table("OrdenesTrabajo")]
public class OrdenTrabajo
{
    [Key]
    public int Id { get; set; }
    public string OrdenId { get; set; } = string.Empty;
    public DateTime Fecha { get; set; }
    public string TipoServicio { get; set; } = string.Empty;
    public string TecnicoAsignado { get; set; } = string.Empty;
    public string EstadoOrden { get; set; } = string.Empty;
    public decimal TiempoInstalacionHoras { get; set; }
    public string? MaterialUtilizado { get; set; }
    public int CantidadMaterial { get; set; }
    public string? EstadoEquipo { get; set; }
    public DateTime? FechaVencimiento { get; set; }
    public decimal IngresoGenerado { get; set; }
    public decimal CostoServicio { get; set; }
    public string ZonaServicio { get; set; } = string.Empty;
    public string CanalContacto { get; set; } = string.Empty;
    public int SatisfaccionCliente { get; set; }
    public int InstalacionesDiarias { get; set; }
    public string PrioridadOrden { get; set; } = string.Empty;
    public string TipoCliente { get; set; } = string.Empty;
    public int Conversiones { get; set; }
    public int Consultas { get; set; }
    public int EquiposPerdidos { get; set; }
}