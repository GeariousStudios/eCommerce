# 1. Build.
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy csproj -> reset dependencies.
COPY *.csproj ./
RUN dotnet restore

# Copy rest and build.
COPY . ./
RUN dotnet publish -c Release -o /out

# --- #

# 2. Run.
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /out .

# Dynamic port
ENV ASPNETCORE_URLS=http://0.0.0.0:${PORT}

# Start app
ENTRYPOINT ["dotnet", "eCommerce.dll"]