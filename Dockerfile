# Etapa 1: Compilación
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copiar el archivo de proyecto y restaurar dependencias
COPY ApiAuth.csproj .
RUN dotnet restore

# Copiar todo el código y compilar
COPY . .
RUN dotnet publish -c Release -o /app/publish

# Etapa 2: Runtime (más liviana)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Exponer el puerto de la API
EXPOSE 80
EXPOSE 443

# Copiar la aplicación compilada
COPY --from=build /app/publish .

# Entry point
ENTRYPOINT ["dotnet", "ApiAuth.dll"]