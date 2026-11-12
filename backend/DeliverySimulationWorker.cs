using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace NLExpressBackend;

public class DeliverySimulationWorker : BackgroundService
{
    // private readonly List<DeliveryJob> _deliveries;

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHubContext<DeliveryHub> _hubContext;
    private readonly ILogger<DeliverySimulationWorker> _logger;

    // We inject our in-memory list so the background worker can modify the exact same data
    public DeliverySimulationWorker(
    // List<DeliveryJob> deliveries,

     // IServiceScopeFactory is a factory that creates temporary Dependency Injection (DI) scopes.
    // Because this BackgroundService is a Singleton (lives forever) and AppDbContext is Scoped 
    // (designed to live briefly and be disposed), we must use this factory to safely open 
    // and close a fresh database connection on every loop cycle.
    IServiceScopeFactory scopeFactory,
    ILogger<DeliverySimulationWorker> logger,
    IHubContext<DeliveryHub> hubcontext)
    {
        // use DB created instead of test data
        // _deliveries = deliveries;
        _scopeFactory = scopeFactory;
        _hubContext = hubcontext;
        _logger = logger;
    }

    // stoppingToken is a CancellationToken managed by the .NET host. 
    // If you press Ctrl+C or shut down the server, .NET flips this token to "Cancelled" 
    // so running tasks can abort cleanly instead of hanging or corrupting data.
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("NL-Express Delivery Simulation Worker has started.");

        //loop continuously until server is shut down
        while (!stoppingToken.IsCancellationRequested)
            {
                // wait 5 sec between simulation ticks
                await Task.Delay(5000, stoppingToken);
            
                // 1. Open a temporary DI scope. The "using" keyword guarantees that as soon as this 
                // loop iteration finishes, the scope (and its SQLite connection) is safely destroyed.
                using var scope = _scopeFactory.CreateScope();
                
                // 2. Ask the temporary scope for a fresh instance of our database session (AppDbContext).
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                //find first package that is still Pending
                // var pendingJob = _deliveries.FirstOrDefault(delivery => delivery.Status == "Pending");

                // 3. Query the SQLite "Deliveries" table asynchronously for the first "Pending" package.
                // EF Core tracks this object in memory so it notices any property changes we make to it.
                var pendingJob = await db.Deliveries.FirstOrDefaultAsync(delivery => delivery.Status == "Pending", stoppingToken);
                if (pendingJob != null)
                {
                    pendingJob.AdvanceStatus();

                    // 4. SaveChangesAsync inspects all tracked objects, sees that Status changed, 
                    // generates a SQL "UPDATE Deliveries SET Status = 'InTransit'..." command, 
                    // and commits it to nlexpress.db. Passing stoppingToken aborts the DB write if shutting down.
                    await db.SaveChangesAsync(stoppingToken);
                    _logger.LogInformation($"🚚 Truck dispatched: Package {pendingJob.Id} is now InTransit to {pendingJob.DestinationCity}!");

                    // 5. Push the updated record over SignalR WebSockets to all connected Angular clients.
                    await _hubContext.Clients.All.SendAsync("DeliveryUpdated", pendingJob, stoppingToken);
                    continue; //move to next loop cycle
                }  

                var inTransitJob = await db.Deliveries.FirstOrDefaultAsync(delivery => delivery.Status == "InTransit");
            
                if (inTransitJob != null)
                {
                    inTransitJob.AdvanceStatus();

                    await db.SaveChangesAsync(stoppingToken);

                    _logger.LogInformation($"✅ Package {inTransitJob.Id} successfully Delivered to {inTransitJob.DestinationCity}!");

                    await _hubContext.Clients.All.SendAsync("DeliveryUpdated", inTransitJob, stoppingToken);
                }

            }       
    }   
}