const express = require("express");

const router = express.Router();

const deliveryQueue =
require("../queue/queue");

router.post("/", async (req, res) => {

try {

```
const {
  deliveryId,
  status,
  timestamp,
  courierId
} = req.body;

if (
  !deliveryId ||
  !status ||
  !timestamp ||
  !courierId
) {
  return res.status(400).json({
    error: "Invalid payload"
  });
}

await deliveryQueue.add(
  req.body,
  {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000
    }
  }
);

return res.status(202).json({
  status: "accepted"
});
```

} catch (error) {

```
console.error(error);

return res.status(500).json({
  error: "Failed to queue event"
});
```

}
});

module.exports = router;
