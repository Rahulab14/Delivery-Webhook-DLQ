const db = require("../db/db");
const redis = require("../redis/redis");
const deliveryQueue = require("../queue/queue");

function classifyError(error) {

if (error.name === "DbError") {
return "db_error";
}

if (error.name === "NotificationError") {
return "notification_error";
}

if (error.name === "MalformedPayloadError") {
return "malformed_payload";
}

return "unknown";
}

function captureFailedJob(job, error) {

const now = new Date().toISOString();

const stmt = db.prepare(`     INSERT OR REPLACE INTO dead_letter_queue (
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
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

stmt.run(
String(job.id),
job.data.deliveryId || "",
JSON.stringify(job.data),
error.message,
classifyError(error),
job.attemptsMade,
now,
now,
"failed"
);
}

function getFailedEvents() {

const stmt = db.prepare(`     SELECT *
    FROM dead_letter_queue
    ORDER BY last_failed_at DESC
  `);

const rows = stmt.all();

return rows.map((row) => ({
id: row.id,
deliveryId: row.delivery_id,
payload: JSON.parse(row.payload),
errorMessage: row.error_message,
errorType: row.error_type,
retryCount: row.retry_count,
firstFailedAt: row.first_failed_at,
lastFailedAt: row.last_failed_at,
status: row.status,
requeuedAt: row.requeued_at
}));
}

async function retryFailedEvent(id) {

const record = db
.prepare(`       SELECT *
      FROM dead_letter_queue
      WHERE id = ?
    `)
.get(id);

if (!record) {
return {
statusCode: 404,
body: {
error: "Record not found"
}
};
}

if (record.status === "requeued") {
return {
statusCode: 409,
body: {
error: "Event already requeued",
id
}
};
}

const lockKey = `retry:lock:${id}`;

const lock = await redis.set(
lockKey,
"locked",
"NX",
"EX",
300
);

if (!lock) {
return {
statusCode: 409,
body: {
error: "Event already requeued",
id
}
};
}

const payload =
JSON.parse(record.payload);

const newJob =
await deliveryQueue.add(
payload,
{
attempts: 3,
backoff: {
type: "exponential",
delay: 1000
}
}
);

const now =
new Date().toISOString();

db.prepare(`     UPDATE dead_letter_queue
    SET status = ?,
        requeued_at = ?
    WHERE id = ?
  `).run(
"requeued",
now,
id
);

return {
statusCode: 201,
body: {
status: "requeued",
id,
newJobId: newJob.id
}
};
}

module.exports = {
captureFailedJob,
getFailedEvents,
retryFailedEvent
};
