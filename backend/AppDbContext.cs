using Microsoft.EntityFrameworkCore;

namespace NLExpressBackend;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    // This tells EF core to create a table named "Deliveries" based on your DeliveryJob class
    public DbSet<DeliveryJob> Deliveries => Set<DeliveryJob>();
}