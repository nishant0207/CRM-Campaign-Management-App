const mongoose = require('mongoose');
const { createClient } = require('redis');
const CommunicationLog = require('../models/CommunicationLog');
const Campaign = require('../models/Campaign');
const dotenv = require('dotenv');
dotenv.config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://Karanv1972:Karanv1972@cluster0.efuzb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected for Delivery Receipt Consumer'))
  .catch(error => {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  });

// Redis Client Setup
const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = process.env.REDIS_PORT || '6379';
const redisQueue = process.env.DELIVERY_RECEIPT_QUEUE || 'delivery-receipts';

const redisClient = createClient({
  url: `redis://${redisHost}:${redisPort}`,
});

redisClient.on('error', (err) => console.error('Redis error:', err));
redisClient.connect()
  .then(() => console.log(`Connected to Redis at redis://${redisHost}:${redisPort}`))
  .catch(error => {
    console.error('Redis connection failed:', error);
    process.exit(1);
  });

// Batch configuration
const BATCH_SIZE = 5; // Number of messages to process in one batch
const POLL_INTERVAL = 5000; // Polling interval in milliseconds for remaining messages


// Process a batch of messages
async function processBatch(messages) {
  console.log(`Processing batch of ${messages.length} messages`);
  const session = await mongoose.startSession(); // Optional: Use transactions for batch operations
  session.startTransaction();

  try {
    for (const message of messages) {
      const receipt = JSON.parse(message);
      const { logId, campaignId, customerId, message: personalizedMessage } = receipt;

      // Randomly set receipt status
      const status = Math.random() < 0.9 ? 'SENT' : 'FAILED';

      // Create or update the Communication Log
      let log = await CommunicationLog.findById(logId);
      if (!log) {
        log = new CommunicationLog({
          _id: logId,
          campaignId,
          customerId,
          message: personalizedMessage,
          status,
        });
      } else {
        log.status = status;
      }
      await log.save({ session });

      // Update Campaign Stats
      const campaign = await Campaign.findById(campaignId);
      if (campaign) {
        if (status === 'SENT') {
          campaign.stats.messagesSent += 1;
        } else {
          campaign.stats.messagesFailed += 1;
        }
        await campaign.save({ session });
      }
    }

    await session.commitTransaction(); // Commit transaction
    console.log(`Batch of ${messages.length} messages processed successfully`);
  } catch (error) {
    console.error('Error processing batch:', error);
    await session.abortTransaction(); // Rollback transaction on error
  } finally {
    session.endSession();
  }
}

// Consume messages from Redis queue
async function consumeMessages() {
  while (true) {
    try {
      // Retrieve a batch of messages from the Redis queue
      const messages = await redisClient.lRange(redisQueue, 0, BATCH_SIZE - 1);

      if (messages.length > 0) {
        await processBatch(messages); // Process the batch
        await redisClient.lTrim(redisQueue, messages.length, -1); // Remove processed messages
      } else {
        console.log('No messages in the queue, waiting...');
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
      }
    } catch (error) {
      console.error('Error consuming messages:', error);
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL)); // Wait before retrying
    }
  }
}

// Start consuming messages
consumeMessages();