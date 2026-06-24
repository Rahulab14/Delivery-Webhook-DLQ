async function simulateDbUpdate(event) {

console.log(
`[DB] Updating delivery ${event.deliveryId}`
);

return true;
}

async function simulateNotification(event) {

console.log(
`[NOTIFICATION] Delivery ${event.deliveryId} status changed to ${event.status}`
);

return true;
}

module.exports = {
simulateDbUpdate,
simulateNotification
};
