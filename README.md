# 🚚 Delivery Webhook Dead Letter Queue System

A resilient webhook processing system built with Node.js, Express, Bull Queue, Redis, SQLite, and Jest.

This project demonstrates:

* Asynchronous webhook processing
* Redis-backed Bull queue
* Automatic retries with exponential backoff
* Dead Letter Queue (DLQ) persistence using SQLite
* Failed event visibility
* Manual retry endpoint
* Redis-based idempotency protection
* Automated testing with Jest and Supertest

---

# 📌 Features

### Webhook Processing

* Accept delivery status events
* Respond immediately
* Push events into Bull queue
* No synchronous processing

### Background Worker

* Processes queued events
* Simulates database updates
* Simulates notification delivery
* Deduplicates events using Redis

### Retry Mechanism

Retries failed jobs automatically:

| Attempt | Delay     |
| ------- | --------- |
| 1       | 1 second  |
| 2       | 2 seconds |
| 3       | 4 seconds |

After all retries fail, the event is moved into the Dead Letter Queue.

---

# 🏗 Architecture

```text
                    +----------------+
                    | Courier System |
                    +-------+--------+
                            |
                            v

                    POST /webhook
                            |
                            v

                     +-------------+
                     | Express API |
                     +------+------+ 
                            |
                            v

                     +-------------+
                     | Bull Queue  |
                     +------+------+ 
                            |
                            v

                   +----------------+
                   | Background     |
                   | Worker         |
                   +-------+--------+
                           |
          +----------------+----------------+
          |                                 |
          v                                 v

   Database Update                 Notification

          |
          v

   Success / Failure
          |
          v

    Retry (1s,2s,4s)
          |
          v

  +---------------------+
  | Dead Letter Queue   |
  | SQLite Database     |
  +---------------------+

          |
          v

 GET /queue/failed

 POST /queue/retry/:id
```

---

# 🛠 Tech Stack

* Node.js
* Express.js
* Bull
* Redis
* SQLite (better-sqlite3)
* Jest
* Supertest

---

# 📂 Project Structure

```text
delivery-webhook-dlq/

src/
│
├── db/
│   └── db.js
│
├── queue/
│   └── queue.js
│
├── redis/
│   └── redis.js
│
├── routes/
│   ├── webhook.routes.js
│   ├── stats.routes.js
│   └── dlq.routes.js
│
├── services/
│   ├── processing.service.js
│   └── dlq.service.js
│
├── errors/
│   ├── DbError.js
│   ├── NotificationError.js
│   └── MalformedPayloadError.js
│
├── app.js
└── server.js

worker.js

tests/
└── dlq.test.js

data/
└── dlq.db

README.md
package.json
.gitignore
.env.example
```

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/your-username/delivery-webhook-dlq.git

cd delivery-webhook-dlq
```

---

## Install Dependencies

```bash
npm install
```

---

# Redis Setup

## Using Docker

```bash
docker run -d --name redis-server -p 6379:6379 redis
```

Verify:

```bash
docker ps
```

---

# Environment Variables

Create:

```text
.env
```

Example:

```env
PORT=3000

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

---

# Running the Application

## Start API Server

```bash
npm run dev
```

Output:

```text
Server running on port 3000
```

---

## Start Worker

Open a second terminal:

```bash
node worker.js
```

Output:

```text
Redis Connected
Worker Started
```

---

# API Endpoints

---

## POST /webhook

Queues a delivery event.

### Request

```json
{
  "deliveryId": "DEL-1001",
  "status": "delivered",
  "timestamp": "2026-06-25T10:00:00Z",
  "courierId": "COURIER-1"
}
```

### Response

```json
{
  "status": "accepted"
}
```

---

## GET /queue/stats

Returns queue statistics.

### Response

```json
{
  "waiting": 0,
  "active": 0,
  "completed": 10,
  "failed": 2
}
```

---

## GET /queue/failed

Returns all failed events from the Dead Letter Queue.

### Response

```json
{
  "total": 1,
  "failed": [
    {
      "id": "1",
      "deliveryId": "DEL-1001",
      "payload": {
        "deliveryId": "DEL-1001"
      },
      "errorMessage": "Invalid payload",
      "errorType": "malformed_payload",
      "retryCount": 3,
      "status": "failed"
    }
  ]
}
```

---

## POST /queue/retry/:id

Retries a failed event.

### Example

```bash
POST /queue/retry/1
```

### Success

```json
{
  "status": "requeued",
  "id": "1",
  "newJobId": "12"
}
```

### Duplicate Retry

```json
{
  "error": "Event already requeued",
  "id": "1"
}
```

Status:

```http
409 Conflict
```

---

# Error Classification

The worker classifies errors into:

| Error                 | Type               |
| --------------------- | ------------------ |
| DbError               | db_error           |
| NotificationError     | notification_error |
| MalformedPayloadError | malformed_payload  |
| Other                 | unknown            |

---

# Simulating Failures

---

## Database Failure

```json
{
  "deliveryId": "DEL-2001",
  "status": "db_fail",
  "timestamp": "2026-06-25T10:00:00Z",
  "courierId": "C1"
}
```

---

## Notification Failure

```json
{
  "deliveryId": "DEL-2002",
  "status": "notify_fail",
  "timestamp": "2026-06-25T10:00:00Z",
  "courierId": "C1"
}
```

---

## Malformed Payload

```json
{
  "deliveryId": "",
  "status": "wrong_status"
}
```

This will:

* Retry 3 times
* Enter DLQ
* Be visible in `/queue/failed`

---

# Deduplication Demo

Send the same delivery twice within 60 seconds:

```json
{
  "deliveryId": "DEL-3001",
  "status": "delivered"
}
```

Worker output:

```text
[DUPLICATE] DEL-3001 skipped
```

The second event is ignored.

---

# Idempotency Demo

First retry:

```bash
POST /queue/retry/1
```

Response:

```http
201 Created
```

Second retry:

```bash
POST /queue/retry/1
```

Response:

```http
409 Conflict
```

Reason:

```text
Event already requeued
```

Redis lock prevents duplicate jobs.

---

# Running Tests

```bash
npm test
```

Expected:

```text
PASS tests/dlq.test.js

Test Suites: 1 passed
Tests: 3 passed
```

---

# Test Coverage

Tests include:

* GET /queue/failed (empty state)
* GET /queue/failed (records exist)
* Payload parsing validation
* POST /queue/retry/:id (404)
* POST /queue/retry/:id (201)
* POST /queue/retry/:id (409)
* Dead Letter Queue capture
* Malformed payload classification

---

# Assessment Requirements Covered

✅ SQLite Dead Letter Queue

✅ GET /queue/failed

✅ POST /queue/retry/:id

✅ Redis Idempotency Lock

✅ Error Classification

✅ Retry Logic

✅ Bull Queue

✅ Worker Process

✅ Jest Tests

✅ Architecture Diagram

✅ Documentation

---

# Author

 Async Queue and Webhook Processing Assessment

Project:
Delivery Webhook Dead Letter Queue System

Built with:

* Node.js
* Express
* Bull
* Redis
* SQLite
* Jest
