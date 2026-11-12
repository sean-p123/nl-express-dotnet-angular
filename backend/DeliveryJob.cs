namespace NLExpressBackend;

public class DeliveryJob
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string PackageManifest { get; set; } = string.Empty;
    public string DestinationCity { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending"; //pending, inTransit, Delivered
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;


    public void AdvanceStatus()
    {
        Status = Status switch
        {
            "Pending" => "InTransit",
            "InTransit" => "Delivered",
            _ => Status // Keeps "Delivered" unchanged
        };
    }

}


//if we needed to create two singletons of the same type
public class LocalDeliveryRepository { public List<DeliveryJob> Jobs {get;} = [];}
public class InternationalDeliveryRepository { public List<DeliveryJob> Jobs {get;} = [];}