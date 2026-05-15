using MailKit.Net.Smtp;
using MimeKit;

namespace ApiAuth.Services;

public class EmailService
{
    private readonly IConfiguration _config;
    
    public EmailService(IConfiguration config)
    {
        _config = config;
    }
    
    public async Task<bool> SendPasswordResetEmail(string toEmail, string resetCode)
    {
        try
        {
            var from = _config["Email:From"];
            var host = _config["Email:Host"];
            var portStr = _config["Email:Port"];
            var password = _config["Email:Password"];

            if (string.IsNullOrEmpty(from) || string.IsNullOrEmpty(host) || string.IsNullOrEmpty(portStr) || string.IsNullOrEmpty(password))
            {
                Console.WriteLine("❌ Configuración de email incompleta");
                return false;
            }

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress("API Auth", from));
            message.To.Add(new MailboxAddress("", toEmail));
            message.Subject = "Recuperación de Contraseña";
            
            message.Body = new TextPart("html")
            {
                Text = $@"
                    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                        <h2 style='color: #333;'>Recuperación de Contraseña</h2>
                        <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
                        <div style='background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px;'>
                            <strong>{resetCode}</strong>
                        </div>
                        <p>Este código expira en <strong>15 minutos</strong>.</p>
                        <p>Si no solicitaste este cambio, ignora este mensaje.</p>
                        <hr>
                        <small>API Auth - Sistema de Autenticación</small>
                    </div>
                "
            };
            
            using (var client = new SmtpClient())
            {
                await client.ConnectAsync(host, int.Parse(portStr), true);
                await client.AuthenticateAsync(from, password);
                await client.SendAsync(message);
                await client.DisconnectAsync(true);
            }
            
            Console.WriteLine($"✅ Email enviado a {toEmail}");
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error enviando email: {ex.Message}");
            return false;
        }
    }
}