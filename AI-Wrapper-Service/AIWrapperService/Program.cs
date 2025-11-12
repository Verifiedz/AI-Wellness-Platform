using AIWrapperService.APIs;
using AIWrapperService.Interfaces;
using AIWrapperService.Services;
using DotNetEnv;

if (File.Exists(".env")) Env.Load();

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks();

builder.Services.AddHttpClient<IOpenAIChatService, OpenAIChatService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapHealthChecks("/health");
app.MapChatApi();

app.Run();
