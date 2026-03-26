# Technology Stack

**Analysis Date:** 2026-03-25

## Languages

**Primary:**
- C# .NET 8.0 / 9.0 - Backend services (API layer, business logic)
- JavaScript (React Native) - Mobile frontend via Expo
- TypeScript - Frontend type safety (Expo/React Native)
- SQL (PostgreSQL dialect) - Database scripts and stored procedures

## Frameworks

**Core Backend:**
- ASP.NET Core 8.0/9.0 - HTTP API framework (`auth-service/`, `chat-service/`, `AI-Wrapper-Service/`, `notification-service/`, `journal-service/`)

**Frontend:**
- React Native 0.81.5 + Expo 54.0.33
- React Navigation 7.x (@react-navigation/native-stack, @react-navigation/bottom-tabs)

## Key Dependencies

**Backend Critical:**
- Npgsql 9.0.0-10.0.1 - PostgreSQL data provider
- BCrypt.Net-Next 4.0.3 - Password hashing (`auth-service/`)
- Dapper 2.1.35 - ORM (`auth-service/`)
- System.IdentityModel.Tokens.Jwt 8.3.0 - JWT tokens
- Microsoft.AspNetCore.Authentication.JwtBearer 8.0.0/9.0.0

**Infrastructure:**
- Microsoft.Extensions.Caching.StackExchangeRedis 10.0.3 - Redis caching (`chat-service/`)
- Yarp.ReverseProxy 2.2.0 - API gateway (`auth-service/`)
- FirebaseAdmin 3.4.0 - Push notifications (`notification-service/`)

**Frontend:**
- date-fns 4.1.0, expo-notifications 0.32.16, expo-secure-store 15.0.8
- @react-native-async-storage/async-storage 2.2.0

**Testing:**
- xUnit 2.9.3, Moq 4.20.72, FluentAssertions 8.8.0, coverlet
