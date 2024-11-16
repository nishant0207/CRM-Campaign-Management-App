const { createClient } = require('redis');
require('dotenv').config();

// Create a Redis client
const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});

// Connect Redis client
redisClient.on('error', (err) => console.error('Redis connection error:', err));
redisClient.connect()
  .then(() => console.log('Connected to Redis for Pub-Sub'))
  .catch((err) => console.error('Failed to connect to Redis:', err));

// Function to publish messages to the Redis channel
function publish(message) {
  const channel = process.env.DELIVERY_RECEIPT_CHANNEL || 'delivery-receipts';
  console.log(`Publishing message to channel "${channel}":`, message);
  redisClient.publish(channel, JSON.stringify(message));
}

// Function to consume messages (used by Redis Subscriber)
function consume(channel, callback) {
  const subscriber = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  });

  subscriber.on('error', (err) => console.error('Redis Subscriber error:', err));
  subscriber.connect()
    .then(() => console.log(`Subscribed to channel "${channel}"`))
    .catch((err) => console.error('Failed to subscribe to Redis channel:', err));

  subscriber.subscribe(channel, (message) => {
    console.log(`Message received from channel "${channel}":`, message);
    callback(JSON.parse(message)); // Process the message using the provided callback
  });
}

module.exports = { publish, consume };