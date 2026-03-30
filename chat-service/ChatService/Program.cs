using ChatService;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.RegisterServices(builder.Configuration);

builder.Services.AddCors(options =>
{
    options.AddPolicy("DenyAll", policy =>
    {
        policy.SetIsOriginAllowed(_ => false);
    });
});

var app = builder.Build();

app.UseCors("DenyAll");
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.MapControllers();

app.Run(); 

