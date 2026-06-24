class MalformedPayloadError extends Error {

constructor(message) {

```
super(message);

this.name = "MalformedPayloadError";
```

}
}

module.exports = MalformedPayloadError;
