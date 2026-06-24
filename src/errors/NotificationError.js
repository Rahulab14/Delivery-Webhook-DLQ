class NotificationError extends Error {

constructor(message) {

```
super(message);

this.name = "NotificationError";
```

}
}

module.exports = NotificationError;
