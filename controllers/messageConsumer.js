const mongoose = require('mongoose');
const { createClient } = require('redis');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const dotenv = require('dotenv');
dotenv.config();

// MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://Karanv1972:Karanv1972@cluster0.efuzb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Log Redis environment variables for debugging
console.log('Redis Host:', process.env.REDIS_HOST || '127.0.0.1');
console.log('Redis Port:', process.env.REDIS_PORT || '6379');
console.log('Redis Channel:', process.env.REDIS_CHANNEL || 'xeno-queue');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};
connectDB();

// Redis client setup
const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || '6379'}`,
});
const redisChannel = process.env.REDIS_CHANNEL || 'xeno-queue';

console.log('Connecting to Redis at', `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || '6379'}`);

redisClient.connect()
  .then(() => console.log('Connected to Redis as Consumer'))
  .catch(error => {
    console.error('Redis connection failed:', error);
    process.exit(1);
  });

console.log("messageConsumer.js file running");

async function processBatch(messages) {
  for (const message of messages) {
    try {
      console.log('Processing message:', message);

      const parsedMessage = JSON.parse(message);
      if (parsedMessage.type === 'customer') {
        const customer = new Customer(parsedMessage.data);
        await customer.save();
        console.log('Customer saved:', customer);
      } else if (parsedMessage.type === 'order') {
        const { customerId, ...orderData } = parsedMessage.data;

        // Validate customerId
        if (!mongoose.Types.ObjectId.isValid(customerId)) {
          console.error('Invalid customerId:', customerId);
          continue; // Skip invalid message
        }

        const order = new Order({ customerId, ...orderData });
        await order.save();
        console.log('Order saved:', order);
      } else {
        console.log('Unknown message type:', parsedMessage.type);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  }
}

// Function to consume messages in batches
async function consumeMessages(batchSize = 10) {
  while (true) {
    try {
      // Fetch up to `batchSize` messages from the Redis queue
      const messages = await redisClient.lRange(redisChannel, 0, batchSize - 1);

      if (messages.length > 0) {
        console.log(`Processing batch of ${messages.length} messages`);
        await processBatch(messages);

        // Remove the processed messages from the queue
        await redisClient.lTrim(redisChannel, messages.length, -1);
      } else {
        console.log('No messages in Redis queue, waiting...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second
      }
    } catch (error) {
      console.error('Error consuming messages:', error);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before retrying
    }
  }
}

// Start consuming messages in batches
consumeMessages();