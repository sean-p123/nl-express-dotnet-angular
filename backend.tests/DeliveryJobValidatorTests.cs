using FluentValidation.TestHelper;

namespace NLExpressBackend.Tests;

public class DeliveryJobValidatorTests
{
    private readonly DeliveryJobValidator _validator = new();

    [Theory]
    [InlineData("1012 JS")]
    [InlineData("3511AA")]
    [InlineData("2511 AA")]
    public void Should_Pass_When_DeliveryJob_Is_Valid(string validPostalCode)
    {
        var job = new DeliveryJob
        {
            PackageManifest = "Stroopwafels",
            DestinationCity = "Amsterdam",
            PostalCode = validPostalCode
        };

        var result = _validator.TestValidate(job);

        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("0123 AA")]
    [InlineData("12345")]  
    [InlineData("1012 js")]
    [InlineData("")]      
    public void Should_Fail_When_PostalCode_Is_Invalid(string invalidPostalCode)
    {
        var job = new DeliveryJob
        {
            PackageManifest = "Electronics",
            DestinationCity = "Utrecht",
            PostalCode = invalidPostalCode
        };

        var result = _validator.TestValidate(job);

        result.ShouldHaveValidationErrorFor(x => x.PostalCode);
    }

    [Fact]
    public void Should_Fail_When_Manifest_Or_City_Is_Empty()
    {
        var job = new DeliveryJob
        {
            PackageManifest = "",
            DestinationCity = "",
            PostalCode = "1012 JS"
        };

        var result = _validator.TestValidate(job);

        result.ShouldHaveValidationErrorFor(x => x.PackageManifest);
        result.ShouldHaveValidationErrorFor(x => x.DestinationCity);
    }
}
