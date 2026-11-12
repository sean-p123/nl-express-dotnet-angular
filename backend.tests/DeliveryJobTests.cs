using NLExpressBackend;

namespace NLExpressBackend.Tests;

public class DeliveryJobTests
{
    [Fact]
    public void AdvanceStatus_Should_Move_From_Pending_To_InTransit_To_Delivered()
    {
        var job = new DeliveryJob { Status = "Pending" };

        job.AdvanceStatus();
        Assert.Equal("InTransit", job.Status);

        job.AdvanceStatus();
        Assert.Equal("Delivered", job.Status);

        job.AdvanceStatus();
        Assert.Equal("Delivered", job.Status);
    }
}
