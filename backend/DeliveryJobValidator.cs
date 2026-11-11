using FluentValidation;

namespace NLExpressBackend;

public class DeliveryJobValidator : AbstractValidator<DeliveryJob>
{
public DeliveryJobValidator()
    {
        RuleFor(x => x.PackageManifest)
        .NotEmpty().WithMessage("Package manifest is required.")
        .MaximumLength(100).WithMessage("Manifest cannot exceed 100 characters.");

        RuleFor(x => x.DestinationCity)
        .NotEmpty().WithMessage("Destination city is required.");

        // Enforce valid Dutch postal code format: 4 digits (starting 1-9), optional space, 2 uppercase letters
        RuleFor(x => x.PostalCode)
            .NotEmpty().WithMessage("Postal code is required.")
            .Matches(@"^[1-9][0-9]{3}\s?[A-Z]{2}$")
            .WithMessage("Invalid Dutch postal code format. Expected format: '1012 JS'.");
    }
}