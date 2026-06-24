require("dotenv").config();

const deliveryQueue = require("./src/queue/queue");
const redis = require("./src/redis/redis");

const {
captureFailedJob
} = require("./src/services/dlq.service");

const DbError = require("./src/errors/DbError");
const NotificationError = require("./src/errors/NotificationError");
const MalformedPayloadError = require("./src/errors/MalformedPayloadError");

/**

* Simulate database update
  */
  async function simulateDbUpdate(event) {

if (event.status === "db_fail") {
throw new DbError(
"Simulated database write failure"
);
}

console.log(
`[DB] Updated delivery ${event.deliveryId}`
);

return true;
}

/**

* Simulate notification dispatch
  */
  async function simulateNotification(event) {

if (event.status === "notify_fail") {
throw new NotificationError(
"Simulated push notification failure"
);
}

console.log(
`[NOTIFICATION] Sent notification for ${event.deliveryId}`
);

return true;
}

/**

* Worker Consumer
  */
  deliveryQueue.process(async (job) => {

const event = job.data;

console.log(
`[PROCESSING] Job ${job.id}`
);

/**

* Payload Validation
  */
  if (
  !event.deliveryId ||
  typeof event.deliveryId !== "string" ||
  event.deliveryId.trim() === ""
  ) {
  throw new MalformedPayloadError(
  "Invalid payload: deliveryId is required"
  );
  }

const validStatuses = [
"pending",
"in_transit",
"delivered",
"failed"
];

if (
!validStatuses.includes(event.status)
) {
throw new MalformedPayloadError(
`Invalid payload: status must be one of ${validStatuses.join(", ")}`
);
}

/**

* Deduplication
  */
  const dedupeKey =
  `delivery:${event.deliveryId}`;

const alreadyProcessed =
await redis.get(dedupeKey);

if (alreadyProcessed) {

```
console.log(
  `[DUPLICATE] ${event.deliveryId} skipped`
);

return {
  skipped: true
};
```

}

await redis.set(
dedupeKey,
"processed",
"EX",
60
);

/**

* Simulate Processing
  */
  await simulateDbUpdate(event);

await simulateNotification(event);

console.log(
`[SUCCESS] ${event.deliveryId} processed`
);

return {
success: true
};
});

/**

* Capture Failed Jobs
  */
  deliveryQueue.on(
  "failed",
  async (job, error) => {

  console.log(
  `[FAILED] Job ${job.id} attempt ${job.attemptsMade}`
  );

  if (
  job.attemptsMade ===
  job.opts.attempts
  ) {

  console.log(
  `[DLQ] Capturing failed job ${job.id}`
  );

  captureFailedJob(
  job,
  error
  );
  }
  }
  );

deliveryQueue.on(
"completed",
(job) => {

```
console.log(
  `[COMPLETED] Job ${job.id}`
);
```

}
);

console.log(
"🚀 Worker Started"
);
