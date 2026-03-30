FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build 
WORKDIR /src 
COPY ["AuthService.csproj", "."] 
RUN dotnet restore "AuthService.csproj" 
COPY . . 
WORKDIR "/src/." 
RUN dotnet publish "AuthService.csproj" -c Release -o /app/publish 
 
FROM mcr.microsoft.com/dotnet/aspnet:9.0
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "AuthService.dll"] 
