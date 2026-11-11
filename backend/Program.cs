using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using NLExpressBackend;

var builder = WebApplication.CreateBuilder(args);

// Register SQLite Database
builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlite("Data Source=nlexpress.db"));

// Register SignalR and CORS
builder.Services.AddSignalR();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:4200")
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials(); // cruicial for SignalR!
    });
});

builder.Services.AddHostedService<DeliverySimulationWorker>();

var app = builder.Build();

// Seed starter data directly into SQLite if the table is empty
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();

    if (!db.Deliveries.Any())
    {
        db.Deliveries.AddRange(
            new DeliveryJob { PackageManifest = "Electronics", DestinationCity = "Amsterdam", PostalCode = "1012 JS", Status = "Pending" },
            new DeliveryJob { PackageManifest = "Books", DestinationCity = "Utrecht", PostalCode = "3511 AA", Status = "Pending" }
        );
        db.SaveChanges();
    }
}
// Enable CORS before mapping endpoints
app.UseCors();

// REST endpoints
app.MapGet("/api/deliveries", async (AppDbContext db) => 
    await db.Deliveries.OrderByDescending(order => order.CreatedAt).ToListAsync());

app.MapPost("/api/deliveries", async (DeliveryJob newJob, AppDbContext db) =>
{
    newJob.Status = "Pending";
    newJob.CreatedAt = DateTime.UtcNow;

    db.Deliveries.Add(newJob);
    await db.SaveChangesAsync(); 
    return Results.Created($"/api/deliveries/{newJob.Id}", newJob);
});

app.MapPost("/api/deliveries/reset", async (AppDbContext db, IHubContext<DeliveryHub> hubContext) =>
{
   
   // Delete all existing rows in SQLite in a single command
   await db.Deliveries.ExecuteDeleteAsync();

   // Re-seed the starter items
   var starterJobs = new List<DeliveryJob>
    {
        new() { PackageManifest = "Electronics", DestinationCity = "Amsterdam", PostalCode = "1012 JS", Status = "Pending" },
        new() { PackageManifest = "Books", DestinationCity = "Utrecht", PostalCode = "3511 AA", Status = "Pending" }
    };

    db.Deliveries.AddRange(starterJobs);
    await db.SaveChangesAsync();

    // Notify all conneted clients of the fresh list 
    await hubContext.Clients.All.SendAsync("DeliveriesReset", starterJobs);

    return Results.Ok(starterJobs); 
});
// Map the SignalR WebSocket route
app.MapHub<DeliveryHub>("/hubs/deliveries");

app.Run();
