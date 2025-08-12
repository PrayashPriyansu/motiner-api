# Motiner API

A standalone Hono-based API for website monitoring and uptime tracking.

## Features

- **Website Monitoring**: Check website status and response times
- **Ping Triggers**: Intelligent background ping scheduling
- **Site Management**: CRUD operations for monitored sites
- **Statistics Tracking**: Uptime and performance metrics
- **OpenAPI Documentation**: Auto-generated API docs

## Development

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database URL and other settings

# Start development server
pnpm dev
```

The API will be available at `http://localhost:9999`

## API Documentation

Visit `http://localhost:9999/scalar` for interactive API documentation.

## Environment Variables

- `DATABASE_URL`: Neon PostgreSQL connection string
- `PORT`: Server port (default: 9999)
- `NODE_ENV`: Environment (development/production)
- `MONITORING_LOCATION`: Location name for ping data
- `MONITORING_REGION_CODE`: Region code for ping data
- `PING_TIMEOUT_MS`: Request timeout in milliseconds
- `MAX_CONCURRENT_PINGS`: Maximum concurrent ping operations

## Deployment

This API is designed to deploy seamlessly to Vercel:

```bash
# Deploy to Vercel
vercel

# Or deploy to production
vercel --prod
```

## Architecture

- **Framework**: Hono (Web Standards-based)
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Zod schemas
- **Documentation**: OpenAPI/Swagger with Scalar UI
- **Deployment**: Vercel Serverless Functions