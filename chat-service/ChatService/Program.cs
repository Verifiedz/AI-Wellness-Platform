using ChatService;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.RegisterServices(builder.Configuration);

var app = builder.Build();
if (!app.Environment.IsDevelopment()) 
{
    app.UseAuthentication();
    app.UseAuthorization();
}

app.MapControllers();

app.Run(); 

