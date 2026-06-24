const request = require("supertest");

const app = require("../src/app");

const db = require("../src/db/db");

describe("Dead Letter Queue API", () => {

beforeEach(() => {

```
db.prepare(
  "DELETE FROM dead_letter_queue"
).run();
```

});

describe("GET /queue/failed", () => {

```
test(
  "returns empty list",
  async () => {

    const res =
      await request(app)
        .get("/queue/failed");

    expect(res.status).toBe(200);

    expect(res.body.total)
      .toBe(0);

    expect(res.body.failed)
      .toEqual([]);
  }
);

test(
  "returns failed records",
  async () => {

    db.prepare(`
      INSERT INTO dead_letter_queue (
        id,
        delivery_id,
        payload,
        error_message,
        error_type,
        retry_count,
        first_failed_at,
        last_failed_at,
        status
      )
      VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `).run(
      "1",
      "DEL-1001",
      JSON.stringify({
        deliveryId: "DEL-1001"
      }),
      "Database error",
      "db_error",
      3,
      new Date().toISOString(),
      new Date().toISOString(),
      "failed"
    );

    const res =
      await request(app)
        .get("/queue/failed");

    expect(res.status).toBe(200);

    expect(res.body.total)
      .toBe(1);

    expect(
      typeof res.body.failed[0]
        .payload
    ).toBe("object");
  }
});
```

});

describe(
"POST /queue/retry/:id",
() => {

```
  test(
    "returns 404 if record not found",
    async () => {

      const res =
        await request(app)
          .post(
            "/queue/retry/999"
          );

      expect(res.status)
        .toBe(404);
    }
  );
}
```

);
});
