# Technology Stack: Hardening Tools

**Project:** AI Wellness Platform (Sakina) — Hardening Milestone
**Researched:** 2026-03-29
**Scope:** Security scanning, testing, static analysis, and dependency auditing tools to layer on top of the existing .NET 9 / React Native (Expo 54) stack. No new application frameworks. No new languages.

---

## Recommended Hardening Stack

### .NET Backend: Testing

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| `xUnit` | 2.9.3 (existing) | Test runner | Already in use on AI Wrapper and chat services. No reason to introduce NUnit or MSTest alongside it. Keep one runner across all 6 services. |
| `Moq` | 4.20.72 (existing) | Interface mocking | Already in use. Sufficient for all unit test scenarios in this codebase (mock `IAuthService`, `IUserRepository`, etc.). |
| `FluentAssertions` | 8.8.0 (existing) | Readable assertions | Already in use on AI Wrapper tests. Standardize across all new test projects — `result.Should().Be(...)` is far more readable than `Assert.Equal(...)` and produces better failure messages. |
| `Microsoft.AspNetCore.Mvc.Testing` | 9.0.x | In-process test server | `WebApplicationFactory<Program>` is the canonical way to write HTTP-level integration tests against ASP.NET Core without a real network. Already used on AI Wrapper. Extend to auth-service and community-service which have zero tests. |
| `Testcontainers.PostgreSql` | 4.11.0 | Real Postgres in tests | Spins up a throwaway Docker container of PostgreSQL 16 for integration tests. Eliminates the mocked-database problem: tests exercise real SQL, real stored procedures, real Npgsql behavior. Required for auth-service and journal-service tests where business logic is tightly coupled to stored procedures. |
| `Respawn` | 7.0.0 | Database state reset | After each integration test, deletes data in correct foreign-key order without dropping the schema. Faster than recreating the container per test. Use with `IAsyncLifetime` in xUnit — call `ResetAsync` in `InitializeAsync` before each test. |
| `Bogus` | 35.6.5 | Fake data generation | Generates realistic test data (emails, names, codes) without hardcoding. Use a `Faker<T>` builder per domain entity — keeps test data maintenance out of test bodies. Strongly preferred over `new User { Email = "test@test.com" }` literals scattered across tests. |

**Why NOT NUnit:** Introduces a second test runner alongside the existing xUnit setup. No benefit justifies the inconsistency tax.

**Why NOT AutoFixture:** Bogus is more explicit. AutoFixture's auto-population can hide which fields a test actually depends on, making test intent unclear. For this codebase's scale, Bogus is sufficient.

---

### .NET Backend: Static Analysis / Security Scanning

| Tool | Version / Form | Purpose | Why |
|------|----------------|---------|-----|
| `Microsoft.CodeAnalysis.NetAnalyzers` | 10.0.104 (NuGet) | Roslyn CA rules (CA1xxx–CA5xxx) | Ships built into the .NET SDK but the NuGet package decouples updates from SDK version. CA5350/CA5351 flag weak cryptography. CA2100 flags SQL built from string concatenation — directly addresses the `StoredProcedureExecutor` injection risk. Enable as warnings in all service `.csproj` files. **Confidence: HIGH** (Microsoft official package). |
| `SecurityCodeScan.VS2019` | 5.6.7 (NuGet) | SAST: injection, XSS, CSRF, path traversal | Roslyn analyzer that performs inter-procedural taint analysis. Runs at build time — no separate CI step needed. Add as an `<IncludeAssets>analyzers</IncludeAssets>` reference so it never ships in the runtime output. The `AdaskoTheBeAsT.SecurityCodeScan.VS2022` community fork (v5.6.7.50) is an alternative if VS2022 compatibility issues arise. **Confidence: MEDIUM** (original package deprecated, VS2019 variant is the current maintained release). |

**Installation pattern for both Roslyn analyzers:**
```xml
<PackageReference Include="Microsoft.CodeAnalysis.NetAnalyzers" Version="10.0.104">
  <PrivateAssets>all</PrivateAssets>
  <IncludeAssets>runtime; build; native; contentfiles; analyzers</IncludeAssets>
</PackageReference>
<PackageReference Include="SecurityCodeScan.VS2019" Version="5.6.7">
  <PrivateAssets>all</PrivateAssets>
  <IncludeAssets>runtime; build; native; contentfiles; analyzers</IncludeAssets>
</PackageReference>
```

**Why NOT SonarQube/SonarCloud:** Valuable for ongoing CI pipelines but out of scope per PROJECT.md (no CI/CD pipeline in this milestone). SonarQube is a server product; it adds operational overhead that isn't warranted for a hardening pass. The Roslyn analyzers above run at build time inside the IDE and are zero-config.

**Why NOT Veracode or Snyk Code:** Commercial platforms with per-seat pricing. Overkill for a capstone project. The built-in CA analyzers + SecurityCodeScan cover the specific concerns in CONCERNS.md (SQL injection surface, weak crypto, PII logging).

---

### .NET Backend: Dependency Auditing

| Tool | Form | Purpose | Why |
|------|------|---------|-----|
| `dotnet list package --vulnerable --include-transitive` | Built-in .NET SDK CLI | Identifies NuGet packages with known CVEs | Zero install cost. Checks both direct and transitive deps against NuGet's vulnerability sources (backed by GitHub Advisory Database). Run before each phase commit. **Confidence: HIGH** (Microsoft official). |
| NuGet Audit (MSBuild property) | `.csproj` / `Directory.Build.props` | Warn during `dotnet restore` if vulnerable package is referenced | Enable `<NuGetAuditMode>all</NuGetAuditMode>` in `Directory.Build.props` at solution root. This makes every `dotnet build` also check transitive deps, surfacing the Npgsql version fragmentation risk proactively. **Confidence: HIGH**. |

**No third-party dependency scanner is needed.** The built-in toolchain is sufficient for this project's scale. OWASP Dependency-Check and Snyk Open Source are valuable for CI-integrated scanning but are out of scope for this milestone.

---

### Frontend (React Native / Expo 54): Testing

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| `jest-expo` | `~54.0.17` | Jest preset for Expo | The official Expo-blessed Jest preset. Mocks native modules, configures `transformIgnorePatterns` correctly for the Expo SDK, and sets up the platform-specific test environments. Do not use a plain `jest` config — Expo's Metro bundler requires jest-expo to mock the native layer. Pin to the `~54.0.x` range to stay aligned with SDK 54. |
| `jest` | Managed by `jest-expo` | Test runner | `jest-expo` brings its own compatible Jest version. Do not add a separate `jest` pin unless `jest-expo` instructs it. |
| `@testing-library/react-native` | `^13.3.3` (stable v13) | Component and context testing | v13 is the current stable release. v14 is in beta and requires React 19.0+ — the project is on React 19.1.0 but the v14 API surface is still beta. Use v13 for stability. Provides `render`, `fireEvent`, `waitFor`, and user-centric queries (`getByRole`, `getByText`). Replaces the deprecated `react-test-renderer`. **Confidence: HIGH** (npm stable). |
| `@testing-library/jest-native` | `^5.4.x` | Extended Jest matchers | Adds matchers like `toBeVisible()`, `toHaveTextContent()`, `toBeDisabled()`. Required for readable assertions in component tests. Import via `setupFilesAfterEachEach` in `jest.config.js`. **Note:** As of RNTL v13, the matchers from `@testing-library/jest-native` are being migrated into `@testing-library/react-native` directly — check the version you install and avoid duplicating matchers. |

**Install command (use `npx expo install` to get version-compatible packages):**
```bash
npx expo install jest-expo jest @testing-library/react-native -- --save-dev
```

**jest.config.js (minimal working config for Expo SDK 54):**
```js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterFramework: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
};
```

**Why NOT Vitest:** Vitest is a Vite-native test runner. Expo uses Metro, not Vite. The transformer and module resolution systems are incompatible. jest-expo is the only viable choice.

**Why NOT Detox for unit/integration tests:** Detox is an E2E framework that runs on a real device or simulator. The priority concern in CONCERNS.md is unit-level testing of `AuthContext.js`, `api.js`, and `chatApi.js` — not full E2E flows. Detox setup is expensive and out of scope for this milestone.

---

### Frontend: Dependency Auditing

| Tool | Form | Purpose | Why |
|------|------|---------|-----|
| `npm audit` | Built-in npm CLI | Identify CVEs in JavaScript deps | Zero install cost. Checks against GitHub Advisory Database. Run `npm audit --audit-level=high` from `frontend/`. The `--audit-level=high` flag prevents false-positives from low-severity advisories blocking work. **Confidence: HIGH** (npm official). |

---

## What NOT to Use

| Rejected Tool | Category | Reason |
|---------------|----------|--------|
| SonarQube / SonarCloud | SAST server | Requires server infrastructure. No CI pipeline in this milestone per PROJECT.md constraints. |
| OWASP Dependency-Check | Dep audit | Heavy CLI tool, requires JVM. `dotnet list package --vulnerable` covers the same CVE database for NuGet. |
| Snyk CLI / Snyk Code | SAST + dep audit | Commercial, per-seat beyond free tier. Not needed given built-in toolchain coverage. |
| Parasoft dotTEST | SAST | Commercial, enterprise-grade. Overkill for a capstone project. |
| Detox | E2E testing | Requires a real device/simulator and significant CI setup. Out of scope for this hardening milestone. |
| ESLint / Prettier | Frontend linting | Explicitly out of scope per PROJECT.md ("Adding frontend linting/formatting is a quality improvement, not hardening"). Do not add during this milestone. |
| AutoFixture | Test data | Bogus is more explicit and readable. AutoFixture's auto-population obscures which fields a test actually cares about. |
| NUnit / MSTest | Backend testing | Project already uses xUnit. Adding a second test runner creates inconsistency with no benefit. |
| `react-test-renderer` | Frontend testing | Deprecated in React 19 context. `@testing-library/react-native` v13 replaces it. Do not add. |

---

## Installation Summary

### Backend (per new test project)

```bash
# Add to each new *.Tests.csproj
dotnet add package xunit
dotnet add package xunit.runner.visualstudio
dotnet add package Microsoft.NET.Test.Sdk
dotnet add package Moq
dotnet add package FluentAssertions
dotnet add package Bogus
dotnet add package Testcontainers.PostgreSql    # integration test projects only
dotnet add package Respawn                       # integration test projects only
dotnet add package Microsoft.AspNetCore.Mvc.Testing  # API-level integration tests only

# Add to each service project (not test projects) for static analysis
dotnet add package Microsoft.CodeAnalysis.NetAnalyzers
dotnet add package SecurityCodeScan.VS2019
```

### Backend (solution-level vulnerability audit)

```bash
# Run from solution root before committing each phase
dotnet list package --vulnerable --include-transitive
```

Add to `Directory.Build.props` at solution root:
```xml
<PropertyGroup>
  <NuGetAuditMode>all</NuGetAuditMode>
  <NuGetAuditLevel>moderate</NuGetAuditLevel>
</PropertyGroup>
```

### Frontend

```bash
cd frontend

# Testing framework (use expo install for version compatibility)
npx expo install jest-expo jest -- --save-dev
npx expo install @testing-library/react-native -- --save-dev
npm install --save-dev @testing-library/jest-native

# Dependency audit (run before each commit)
npm audit --audit-level=high
```

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| xUnit / Moq / FluentAssertions | HIGH | Already in codebase, official NuGet |
| Testcontainers 4.11.0 | HIGH | Verified on NuGet Gallery (March 2026) |
| Respawn 7.0.0 | HIGH | Verified on NuGet Gallery (November 2025) |
| Bogus 35.6.5 | HIGH | Verified on NuGet Gallery (October 2025) |
| Microsoft.AspNetCore.Mvc.Testing | HIGH | Microsoft official, existing codebase usage |
| Microsoft.CodeAnalysis.NetAnalyzers 10.0.104 | HIGH | Verified on NuGet Gallery (March 2026) |
| SecurityCodeScan.VS2019 5.6.7 | MEDIUM | NuGet verified, original package deprecated — VS2019 variant is the maintained fork; .NET 9 compatibility confirmed via community reports |
| jest-expo ~54.0.17 | HIGH | Expo official changelog, Expo SDK 54 |
| @testing-library/react-native ^13.3.3 | HIGH | npm stable, v14 explicitly still beta |
| dotnet list package --vulnerable | HIGH | Microsoft official CLI, no external dependency |
| npm audit | HIGH | npm official, zero-install |

---

## Sources

- [Testcontainers.PostgreSql on NuGet](https://www.nuget.org/packages/Testcontainers.PostgreSql) — v4.11.0 confirmed March 2026
- [Testcontainers for .NET official docs](https://dotnet.testcontainers.org/modules/postgres/)
- [Respawn on NuGet](https://www.nuget.org/packages/Respawn) — v7.0.0
- [Bogus on NuGet](https://www.nuget.org/packages/Bogus) — v35.6.5
- [Microsoft.CodeAnalysis.NetAnalyzers on NuGet](https://www.nuget.org/packages/Microsoft.CodeAnalysis.NetAnalyzers) — v10.0.104 (March 2026)
- [SecurityCodeScan.VS2019 on NuGet](https://www.nuget.org/packages/SecurityCodeScan.VS2019/) — v5.6.7
- [SecurityCodeScan official site](https://security-code-scan.github.io/)
- [Expo SDK 54 changelog](https://expo.dev/changelog/sdk-54)
- [jest-expo security patch 54.0.17](https://expo.dev/changelog/mitigating-critical-security-vulnerability-in-react-server-components)
- [Expo Unit Testing docs](https://docs.expo.dev/develop/unit-testing/)
- [React Native Testing Library releases](https://github.com/callstack/react-native-testing-library/releases) — v13.3.3 stable
- [NuGetAudit 2.0 announcement](https://devblogs.microsoft.com/dotnet/nugetaudit-2-0-elevating-security-and-trust-in-package-management/)
- [Auditing NuGet packages — Microsoft Learn](https://learn.microsoft.com/en-us/nuget/concepts/auditing-packages)
- [ASP.NET Core Integration Tests — Microsoft Learn](https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests)
- [Testcontainers best practices for .NET](https://www.milanjovanovic.tech/blog/testcontainers-best-practices-dotnet-integration-testing)
