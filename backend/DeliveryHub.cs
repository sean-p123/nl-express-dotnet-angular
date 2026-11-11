using Microsoft.AspNetCore.SignalR;

namespace NLExpressBackend;

public class DeliveryHub : Hub
{
    // We can leave this empty! Our background worker will push messages 
    // through this hub directly to connected clients.
}
