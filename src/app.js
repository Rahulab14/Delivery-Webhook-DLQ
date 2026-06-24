const express = require("express");

const webhookRoutes = require("./routes/webhook.routes");
const statsRoutes = require("./routes/stats.routes");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
res.json({
message: "Delivery Webhook DLQ API Running"
});
});

app.use("/webhook", webhookRoutes);

app.use("/queue/stats", statsRoutes);

app.use((req, res) => {
res.status(404).json({
error: "Route not found"
});
});

module.exports = app;
