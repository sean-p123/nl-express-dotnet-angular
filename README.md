# NL-Express Real-Time Logistics

A full-stack, real-time parcel tracking system built with **.NET 9 Minimal APIs**, **SignalR**, **Entity Framework Core (SQLite)**, and **Angular (TypeScript & Signals)**. 

Designed to simulate a Dutch logistics dispatch dashboard across the Randstad, the application demonstrates decoupled backend processing, real-time WebSocket broadcasting, and reactive frontend state management.

---

## Architecture Overview

```text
┌─────────────────────────────┐         HTTP REST (GET / POST)         ┌─────────────────────────────┐
│      Angular Frontend       │ ─────────────────────────────────────► │   ASP.NET Core 9 Web API    │
│  (TypeScript, Signals, RxJS)│                                        │        (Minimal APIs)       │
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
1. **REST API Layer (`Program.cs`):** Exposes endpoints to fetch active deliveries (`GET /api/deliveries`), dispatch new packages (`POST /api/deliveries`), and reset the simulation (`POST /api/deliveries/reset`).
2. **Background Worker (`DeliverySimulationWorker.cs`):** A hosted `BackgroundService` wakes up every 5 seconds, opens a scoped `AppDbContext` via `IServiceScopeFactory`, and advances packages through their lifecycle (`Pending` ➔ `InTransit` ➔ `Delivered`).
3. **Real-Time Broadcasting (`DeliveryHub.cs`):** Whenever a package status updates in SQLite, the worker pushes the updated record over SignalR (`DeliveryUpdated`) to all connected Angular clients without requiring page reloads.
4. **Reactive UI (`frontend/`):** Angular bridges incoming SignalR WebSocket events into RxJS observables and updates **Angular Signals** inside `NgZone` for instant DOM rendering.

---

## Tech Stack

### Backend
* **.NET 9 / C#** (ASP.NET Core Minimal APIs)
* **ASP.NET Core SignalR** (Real-time WebSocket communication)
* **Entity Framework Core 9** (ORM with SQLite persistence & WAL mode)
* **BackgroundService (`IHostedService`)** (Asynchronous background job processing)

### Frontend
* **Angular** (Standalone Components, Signals, `@for` control flow)
* **TypeScript & RxJS** (Reactive streams & strict type mirroring)
* **`@microsoft/signalr`** (WebSocket client with automatic reconnection)

---

## Project Structure

```text
nl-express-logistics/
├── backend/
│   ├── AppDbContext.cs                 # EF Core database context
│   ├── DeliveryHub.cs                  # SignalR WebSocket hub
│   ├── DeliveryJob.cs                  # Domain entity model
│   ├── DeliverySimulationWorker.cs     # Background worker simulating truck dispatches
│   ├── Program.cs                      # DI setup, CORS, DB seeding, and Minimal API routes
│   └── NLExpressBackend.csproj         # .NET 9 project configuration
├── frontend/
│   └── src/app/
│       ├── delivery.service.ts         # HTTP client & SignalR-to-RxJS bridge
│       ├── app.config.ts               # Standalone providers (HttpClient)
│       ├── app.ts                      # Dashboard component logic & Signals state
│       └── app.html                    # Dispatch form & live tracking table
└── .gitignore
```

---

## Getting Started

### Prerequisites
* [.NET 9.0 SDK](https://microsoft.com)
* [Node.js](https://nodejs.org) (v22.22+ or v24+ LTS) & Angular CLI

### 1. Run the .NET Backend
Navigate to the `backend` folder and start the server with hot reload:

```bash
cd backend
dotnet watch
```
* The API will start at `http://localhost:5041`.
* On first launch, `EnsureCreated()` automatically generates `nlexpress.db` and seeds initial starter packages (**Amsterdam** and **Utrecht**).

### 2. Run the Angular Frontend
Open a second terminal, navigate to the `frontend` folder, install dependencies, and start the dev server:

```bash
cd frontend
npm install
npm start
```
* Open **`http://localhost:4200`** in your browser.
* Dispatch a new package or click **Reset Simulation** to watch statuses update automatically every 5 seconds.

---
