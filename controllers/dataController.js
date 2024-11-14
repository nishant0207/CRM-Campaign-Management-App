const Customer = require('../models/Customer');
const Order = require('../models/Order');
const Campaign = require('../models/Campaign');
const CommunicationLog = require('../models/CommunicationLog');

// Controller to add a new customer
const addCustomer = async (req, res) => {
  try {
    const { name, email, phone, totalSpending, visits, lastVisit } = req.body;

    // Create a new customer entry
    const newCustomer = new Customer({
      name,
      email,
      phone,
      totalSpending,
      visits,
      lastVisit,
    });

    await newCustomer.save();
    res.status(201).json({ message: 'Customer added successfully', customer: newCustomer });
  } catch (error) {
    console.error('Error adding customer:', error);
    res.status(500).json({ error: 'Failed to add customer' });
  }
};

// Controller to add a new order
const addOrder = async (req, res) => {
  try {
    const { customerId, amount } = req.body;

    // Create a new order entry
    const newOrder = new Order({
      customerId,
      amount,
    });

    await newOrder.save();
    res.status(201).json({ message: 'Order added successfully', order: newOrder });
  } catch (error) {
    console.error('Error adding order:', error);
    res.status(500).json({ error: 'Failed to add order' });
  }
};


const createAudienceSegment = async (req, res) => {
  try {
    const { conditions } = req.body; // conditions should contain criteria for segmentation

    // Build MongoDB query based on conditions
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

    // Query the Customer collection
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

    // Fetch the audience size based on conditions
    const audience = await Customer.find(conditions);
    const audienceSize = audience.length;

    // Create a new campaign entry
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

    // Send message to each customer in the audience
    let messagesSent = 0;
    for (const customer of audience) {
      const personalizedMessage = campaign.message.replace('[Name]', customer.name);

      // Create a communication log entry
      const log = new CommunicationLog({
        campaignId,
        customerId: customer._id,
        message: personalizedMessage,
      });

      await log.save();
      messagesSent++;
    }

    // Update campaign stats
    campaign.stats.messagesSent = messagesSent;
    await campaign.save();

    res.status(200).json({ message: 'Messages sent successfully', totalAudienceSize, messagesSent });
  } catch (error) {
    console.error('Error sending messages:', error);
    res.status(500).json({ error: 'Failed to send messages' });
  }
};


const deliveryReceipt = async (req, res) => {
  try {
    const { logId } = req.params;

    // Retrieve the communication log entry
    const log = await CommunicationLog.findById(logId);
    if (!log) {
      return res.status(404).json({ error: 'Communication log not found' });
    }

    // Randomly assign SENT or FAILED status
    const status = Math.random() < 0.9 ? 'SENT' : 'FAILED';
    log.status = status;
    await log.save();

    // Update campaign stats
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



module.exports = { addCustomer, addOrder, createAudienceSegment, createCampaign, getCampaigns, sendMessages, deliveryReceipt };