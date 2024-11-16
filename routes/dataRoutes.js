const express = require('express');
const {
  addCustomer,
  addOrder,
  createAudienceSegment,
  createCampaign,
  getCampaigns,
  sendMessages,
  deliveryReceipt,
  getCustomerByEmail,
} = require('../controllers/dataController');
const authenticate = require('../middlewares/auth'); // Import authentication middleware

const router = express.Router();

// Route to add a new customer (Protected)
router.post('/customer', authenticate, addCustomer);

// Route to add a new order (Protected)
router.post('/order', authenticate, addOrder);

// New route for audience creation (Protected)
router.post('/audience', authenticate, createAudienceSegment);

// New routes for campaign creation and retrieval (Protected)
router.post('/campaign', authenticate, createCampaign);
router.get('/campaigns', authenticate, getCampaigns);

// Route to send messages (Protected)
router.post('/campaign/:campaignId/send', authenticate, sendMessages);

// Route to get customer by email (Protected)
router.get('/customer/:email', authenticate, getCustomerByEmail);

// Route for delivery receipt (Protected)
router.post('/communication/:logId/receipt', authenticate, deliveryReceipt);

module.exports = router;