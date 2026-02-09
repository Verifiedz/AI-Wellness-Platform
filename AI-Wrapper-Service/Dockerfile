# =============================================================================
# AI Wrapper Service - Dockerfile
# =============================================================================
# Multi-stage build for optimized production image
# Final image: ~250MB (vs ~850MB with SDK)
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: BUILD
# -----------------------------------------------------------------------------
# Use SDK image for building (has compilers and build tools)
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build

WORKDIR /src

# Copy only the project file first (layer caching optimization)
# This layer is cached until .csproj changes
COPY AIWrapperService/AiWrapperService.csproj ./AIWrapperService/

# Restore dependencies (cached separately from code changes)
RUN dotnet restore AIWrapperService/AiWrapperService.csproj

# Copy the rest of the source code
COPY AIWrapperService/. ./AIWrapperService/

# Build and publish in Release mode
RUN dotnet publish AIWrapperService/AiWrapperService.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

# -----------------------------------------------------------------------------
# Stage 2: RUNTIME
# -----------------------------------------------------------------------------
# Use minimal ASP.NET runtime image (no SDK, no compilers)
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime

# Create non-root user for security
RUN adduser --disabled-password --gecos "" --home /app appuser

WORKDIR /app

# Copy published app from build stage
COPY --from=build /app/publish .

# Change ownership to non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port (documentation - actual mapping done at runtime)
EXPOSE 8080

# Configure ASP.NET Core to listen on all interfaces
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Health check - Docker will monitor this
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start the application
ENTRYPOINT ["dotnet", "AiWrapperService.dll"]
