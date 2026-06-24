const db = require("../db/db");

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

const message =
error.message.toLowerCase();

if (
message.includes("database") ||
message.includes("db")
) {
return "db_error";
}

if (
message.includes("notification") ||
message.includes("push")
) {
return "notification_error";
}

if (
message.includes("malformed") ||
message.includes("invalid") ||
message.includes("parse")
) {
return "malformed_payload";
}

return "unknown";
}

function captureFailedJob(
job,
error
) {

const errorType =
classifyError(error);

const now =
new Date().toISOString();

const insert =
db.prepare(`       INSERT OR REPLACE INTO dead_letter_queue (
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
    `);

insert.run(
String(job.id),
job.data.deliveryId,
JSON.stringify(job.data),
error.message,
errorType,
job.attemptsMade,
now,
now,
"failed"
);

console.log(
`[DLQ] Job ${job.id} stored`
);
}

module.exports = {
captureFailedJob,
classifyError
};
