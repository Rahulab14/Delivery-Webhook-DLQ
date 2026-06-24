const express = require("express");

const router = express.Router();

const {
getFailedEvents,
retryFailedEvent
} = require("../services/dlq.service");

router.get("/failed", (req, res) => {

const failed =
getFailedEvents();

return res.json({
total: failed.length,
failed
});
});

router.post(
"/retry/:id",
async (req, res) => {

```
const result =
  await retryFailedEvent(
    req.params.id
  );

return res
  .status(result.statusCode)
  .json(result.body);
```

}
);

module.exports = router;
