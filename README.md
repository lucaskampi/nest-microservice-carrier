# NestJS Microservice - Carrier Service

## Overview

This service handles delivery scheduling and voucher generation.

## Tech Stack

- NestJS
- TypeScript
- Prisma (MySQL)
- RabbitMQ

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `4002` |
| `DATABASE_URL` | MySQL database connection string | Required |
| `RABBITMQ_URL` | RabbitMQ connection string | `amqp://localhost:5672` |

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL
- RabbitMQ

### Installation

```bash
npm install
```

### Database Setup

```bash
npm run prisma:generate
npm run prisma:migrate
```

### Development

```bash
npm run dev
```

### Testing

```bash
npm test
```

## Docker

### Build

```bash
docker build -t carrier-service .
```

### Run

```bash
docker-compose up -d
```

## API Endpoints

### Base URL

```
http://localhost:4002/api
```

### Swagger Documentation

```
http://localhost:4002/api/docs
```

### Health Check

```
GET http://localhost:4002/api/health
```

## Message Queues

### Consumed Queues

- `carrier.schedule.create` - Create delivery schedule
- `carrier.schedule.update` - Update delivery schedule
- `carrier.voucher.generate` - Generate voucher

### Published Queues

- `carrier.schedule.created` - Schedule created event
- `carrier.voucher.generated` - Voucher generated event
