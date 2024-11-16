// controllers/dataController.js
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const Campaign = require('../models/Campaign');
const CommunicationLog = require('../models/CommunicationLog');
const { createClient } = require('redis');
const dotenv = require('dotenv');
const { publish } = require('../controllers/messageQueue'); // Import Redis publish function

dotenv.config();

// Redis client setup
const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

redisClient.connect()
  .then(() => console.log('Connected to Redis'))
  .catch(console.error);

// Controller to add a new customer
const addCustomer = async (req, res) => {
  try {
    const { name, email, phone, totalSpending, visits, lastVisit } = req.body;
    const customerData = { name, email, phone, totalSpending, visits, lastVisit };

    console.log('Publishing customer data:', customerData); // Log data before publishing
    await redisClient.rPush(process.env.REDIS_CHANNEL, JSON.stringify({ type: 'customer', data: customerData }));

    res.status(201).json({ message: 'Customer data validated and published to Redis queue' });
  } catch (error) {
    console.error('Error adding customer:', error);
    res.status(500).json({ error: 'Failed to add customer' });
  }
};

// Controller to add a new order
const addOrder = async (req, res) => {
  try {
    const { customerId, amount } = req.body;
    const orderData = { customerId, amount };

    console.log('Publishing order data:', orderData);
    await redisClient.rPush(process.env.REDIS_CHANNEL, JSON.stringify({ type: 'order', data: orderData }));

    res.status(201).json({ message: 'Order data validated and published to Redis queue' });
  } catch (error) {
    console.error('Error adding order:', error);
    res.status(500).json({ error: 'Failed to add order' });
  }
};

// Controller to create an audience segment
const createAudienceSegment = async (req, res) => {
  try {
    const { conditions } = req.body;
    const query = {};

    if (conditions.spending) {
      query.totalSpending = { $gt: conditions.spending };
    }
    if (conditions.visits) {
      query.visits = { $lte: conditions.visits };
    }
    if (conditions.lastVisit) {
      const dateThreshold = new Date();
      dateThreshold.setMonth(dateThreshold.getMonth() - conditions.lastVisit);
      query.lastVisit = { $lt: dateThreshold };
    }

    const audience = await Customer.find(query);
    const audienceSize = audience.length;

    res.status(200).json({ audienceSize, audience });
  } catch (error) {
    console.error('Error creating audience segment:', error);
    res.status(500).json({ error: 'Failed to create audience segment' });
  }
};

// Controller to create a new campaign
const createCampaign = async (req, res) => {
  try {
    const { name, conditions, message } = req.body;
    const audience = await Customer.find(conditions);
    const audienceSize = audience.length;

    const newCampaign = new Campaign({
      name,
      conditions,
      message,
      stats: {
        audienceSize: audienceSize,
      }
    });

    await newCampaign.save();
    res.status(201).json({ message: 'Campaign created successfully', campaign: newCampaign });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
};

// Controller to retrieve all campaigns, ordered by most recent
const getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 }).select('name createdAt stats');
    res.status(200).json({ campaigns });
  } catch (error) {
    console.error('Error retrieving campaigns:', error);
    res.status(500).json({ error: 'Failed to retrieve campaigns' });
  }
};

// Controller to send messages based on campaign
const sendMessages = async (req, res) => {
  try {
    const { campaignId } = req.params;

    // Fetch campaign details
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Fetch audience based on campaign conditions
    const audience = await Customer.find(campaign.conditions);
    const totalAudienceSize = audience.length;

    let messagesSent = 0;

    for (const customer of audience) {
      const personalizedMessage = campaign.message.replace('[Name]', customer.name);

      // Create a Redis message for delivery receipt
      const deliveryMessage = {
        logId: new mongoose.Types.ObjectId(), // Generate a new ObjectId for the log
        campaignId,
        customerId: customer._id,
        message: personalizedMessage,
      };

      // Publish the message to the Redis channel
      publish({
        type: 'delivery_receipt',
        data: deliveryMessage,
      });

      messagesSent++;
    }

    // Update campaign stats
    campaign.stats.messagesSent = messagesSent;
    await campaign.save();

    res.status(200).json({
      message: 'Messages sent successfully',
      totalAudienceSize,
      messagesSent,
    });
  } catch (error) {
    console.error('Error sending messages:', error);
    res.status(500).json({ error: 'Failed to send messages' });
  }
};

// Controller for delivery receipt
const deliveryReceipt = async (req, res) => {
  try {
    const { logId } = req.params;
    const log = await CommunicationLog.findById(logId);
    if (!log) {
      return res.status(404).json({ error: 'Communication log not found' });
    }

    const status = Math.random() < 0.9 ? 'SENT' : 'FAILED';
    log.status = status;
    await log.save();

    const campaign = await Campaign.findById(log.campaignId);
    if (status === 'SENT') {
      campaign.stats.messagesSent += 1;
    } else {
      campaign.stats.messagesFailed += 1;
    }
    await campaign.save();

    res.status(200).json({ message: 'Delivery receipt updated', status });
  } catch (error) {
    console.error('Error updating delivery receipt:', error);
    res.status(500).json({ error: 'Failed to update delivery receipt' });
  }
};

// Controller to get customer by email
const getCustomerByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const customer = await Customer.findOne({ email });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.status(200).json({ customer });
  } catch (error) {
    console.error('Error retrieving customer:', error);
    res.status(500).json({ error: 'Failed to retrieve customer' });
  }
};

module.exports = {
  addCustomer,
  addOrder,
  createAudienceSegment,
  createCampaign,
  getCampaigns,
  sendMessages,
  deliveryReceipt,
  getCustomerByEmail
};