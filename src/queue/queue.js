const Queue = require("bull");

const deliveryQueue = new Queue(
"delivery-events",
{
redis: {
host: process.env.REDIS_HOST || "127.0.0.1",
port: process.env.REDIS_PORT || 6379
}
}
);

deliveryQueue.on("error", (error) => {
console.error(
"[QUEUE ERROR]",
error.message
);
});

module.exports = deliveryQueue;
