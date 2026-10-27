# Build the React client, publish the ASP.NET Core API, and serve both together.

# Stage 1: Build frontend assets
FROM node:22-alpine AS frontend-builder
WORKDIR /src
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Publish ASP.NET Core
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS api-builder
WORKDIR /src
COPY backend/GoalTracker.Api/GoalTracker.Api.csproj backend/GoalTracker.Api/
RUN dotnet restore backend/GoalTracker.Api/GoalTracker.Api.csproj
COPY backend/GoalTracker.Api/ backend/GoalTracker.Api/
RUN dotnet publish backend/GoalTracker.Api/GoalTracker.Api.csproj -c Release -o /app/publish --no-restore

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8000
ENV DATABASE_PATH=/app/data/goaltrack.db
ENV ASPNETCORE_ENVIRONMENT=Production
COPY --from=api-builder /app/publish ./
COPY --from=frontend-builder /src/dist ./wwwroot
RUN mkdir -p /app/data

EXPOSE 8000

ENTRYPOINT ["dotnet", "GoalTracker.Api.dll"]
