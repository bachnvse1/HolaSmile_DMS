using Xunit;

namespace HolaSmile_DMS.Tests.Containter;

[CollectionDefinition("SystemTestCollection")]
public class SystemTestCollection : ICollectionFixture<CustomWebApplicationFactory<Program>>
{
}