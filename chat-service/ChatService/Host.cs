using System.Diagnostics.CodeAnalysis;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using ChatService;
using ChatService.Interfaces;


public class HostApp
{
    public static async Task Main(string[] args)
    {
        var host = Host.CreateDefaultBuilder(args)
            .ConfigureHostConfiguration(hostConfig =>
            {
                hostConfig.SetBasePath(Directory.GetCurrentDirectory());
                hostConfig.AddJsonFile("appsettings.json", optional: true);
                hostConfig.AddEnvironmentVariables(prefix: "PREFIX_");
                hostConfig.AddCommandLine(args);
            })
            .ConfigureServices((context, services) =>
            {
                
                services.RegisterServices(context.Configuration);
            })
            .Build();

        await host.RunAsync();
    } 

}



