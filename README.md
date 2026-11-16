# NL-Express Real-Time Logistics

A full-stack, real-time parcel tracking system built with **.NET 9 Minimal APIs**, **SignalR**, **Entity Framework Core (SQLite)**, and **Angular (TypeScript, Signals & Angular Material)**.

Designed to simulate a Dutch logistics dispatch dashboard across the Randstad, the application demonstrates decoupled background processing, real-time WebSocket broadcasting, defense-in-depth validation, automated unit testing, and multi-container Docker deployment.

---

## Architecture Overview

```text
┌─────────────────────────────┐         HTTP REST (GET / POST)         ┌─────────────────────────────┐
│      Angular Frontend       │ ─────────────────────────────────────► │   ASP.NET Core 9 Web API    │
│  (Signals, RxJS, Material)  │                                        │ (Minimal APIs + Validation) │
│                             │ ◄───────────────────────────────────── │                             │
└─────────────────────────────┘      SignalR WebSockets (Real-Time)    └──────────────┬──────────────┘
                                                                                      │
                                                                                      ▼
┌─────────────────────────────┐      IServiceScopeFactory / EF Core    ┌─────────────────────────────┐
│  DeliverySimulationWorker   │ ─────────────────────────────────────► │       SQLite Database       │
│     (BackgroundService)     │                                        │       (nlexpress.db)        │
└─────────────────────────────┘                                        └─────────────────────────────┘
```

### How It Works
1. **REST API & Validation (`Program.cs`, `DeliveryJobValidator.cs`):** Exposes Minimal API endpoints to fetch active deliveries (`GET /api/deliveries`), dispatch new packages (`POST /api/deliveries`), and reset the simulation (`POST /api/deliveries/reset`). Incoming payloads are validated via **FluentValidation** to enforce valid Dutch postal code formatting (`1012 JS`).
2. **Background Worker (`DeliverySimulationWorker.cs`):** A hosted `BackgroundService` wakes up every 5 seconds, opens a scoped `AppDbContext` via `IServiceScopeFactory`, and advances packages through their lifecycle (`Pending` ➔ `InTransit` ➔ `Delivered`).
3. **Real-Time Broadcasting (`DeliveryHub.cs`):** Whenever a package status updates in SQLite, the worker pushes the updated record over SignalR (`DeliveryUpdated`) to all connected Angular clients without requiring page reloads.
4. **Reactive UI (`frontend/`):** Angular uses **Reactive Forms** with client-side regex validation, bridges incoming SignalR WebSocket events into RxJS observables, and updates **Angular Signals** inside `NgZone` for instant DOM rendering.

---

## Tech Stack

### Backend
* **.NET 9 / C#** (ASP.NET Core Minimal APIs)
* **ASP.NET Core SignalR** (Real-time WebSocket communication)
* **Entity Framework Core 9** (ORM with SQLite persistence & WAL mode)
* **FluentValidation** (Domain validation for Dutch postal codes)
* **BackgroundService (`IHostedService`)** (Asynchronous background job processing)
* **xUnit** (Automated unit tests for domain rules and validation)

### Frontend
* **Angular** (Standalone Components, Signals, Reactive Forms, `@for` control flow)
* **Angular Material** (Material 3 form fields, buttons, and validation feedback)
* **TypeScript & RxJS** (Reactive streams & strict type mirroring)
* **`@microsoft/signalr`** (WebSocket client)
* **Vitest / Jasmine & `HttpTestingController`** (Component and HTTP service unit tests)

### DevOps
* **Docker & Docker Compose** (Multi-stage builds for .NET 9 runtime and Nginx static hosting with persistent SQLite volumes)

---

## Project Structure

```text
nl-express-logistics/
├── backend/
│   ├── AppDbContext.cs                 # EF Core database context
│   ├── DeliveryHub.cs                  # SignalR WebSocket hub
│   ├── DeliveryJob.cs                  # Domain entity & state transition logic
│   ├── DeliveryJobValidator.cs         # FluentValidation rules for Dutch postal codes
│   ├── DeliverySimulationWorker.cs     # Background worker simulating truck dispatches
│   ├── Program.cs                      # DI setup, CORS, DB seeding, and Minimal API routes
│   ├── Dockerfile                      # Multi-stage .NET 9 container build
│   └── NLExpressBackend.csproj         # .NET 9 project configuration
├── backend.tests/
│   ├── DeliveryJobValidatorTests.cs    # Theory-driven validation unit tests
│   ├── DeliveryJobTests.cs             # Delivery unit tests
│   └── NLExpressBackend.Tests.csproj   # xUnit test project
├── frontend/
│   ├── Dockerfile                      # Multi-stage Angular + Nginx container build
│   └── src/app/
│       ├── delivery.service.ts         # HTTP client & SignalR-to-RxJS bridge
│       ├── delivery.service.spec.ts    # HttpTestingController unit tests
│       ├── app.config.ts               # Standalone providers (HttpClient)
│       ├── app.ts                      # Dashboard component, Signals & Reactive Form
│       ├── app.spec.ts                 # Component & SignalR state unit tests
│       ├── app.html                    # Material dispatch form & live tracking table
│       └── app.css                     # Component & Material token styles
├── docker-compose.yml                  # Orchestrates backend, frontend, and SQLite volume
└── .gitignore
```

---

## Getting Started

### Option A: Run with Docker Compose (Recommended)
If you have Docker Desktop installed, spin up both the `.NET 9` API and `Angular` frontend with a single command from the root directory:

```bash
docker compose up --build
```
* Open **`http://localhost:4200`** in your browser.
* SQLite data is persisted across container restarts via a named Docker volume (`sqlite_data`).

### Option B: Run Locally

#### Prerequisites
* [.NET 9.0 SDK](https://microsoft.com)
* [Node.js](https://nodejs.org) (v22.22+ or v26 LTS) & Angular CLI

#### 1. Start the .NET Backend
```bash
cd backend
dotnet watch
```
* The API runs at `http://localhost:5041` and automatically creates and seeds `nlexpress.db` on startup.

#### 2. Start the Angular Frontend
```bash
cd frontend
npm install
npm start
```
* Open **`http://localhost:4200`** in your browser.

---

## Running Automated Tests

### Backend Unit Tests (xUnit)
Run from the root directory (stop `dotnet watch` first if running):
```bash
dotnet test
```

### Frontend Unit Tests
Run from the `frontend/` directory:
```bash
cd frontend
npm test
```
