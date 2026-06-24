const express = require("express");

const router = express.Router();

const deliveryQueue =
require("../queue/queue");

router.get("/", async (req, res) => {

try {

```
const waiting =
  await deliveryQueue.getWaitingCount();

const active =
  await deliveryQueue.getActiveCount();

const completed =
  await deliveryQueue.getCompletedCount();

const failed =
  await deliveryQueue.getFailedCount();

return res.json({
  waiting,
  active,
  completed,
  failed
});
```

} catch (error) {

```
console.error(error);

return res.status(500).json({
  error: "Unable to fetch queue stats"
});
```

}
});

module.exports = router;
