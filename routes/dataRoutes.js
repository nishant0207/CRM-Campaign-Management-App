const express = require('express');
const { addCustomer, addOrder, createAudienceSegment,createCampaign, getCampaigns,sendMessages, deliveryReceipt } = require('../controllers/dataController');
const router = express.Router();

// Route to add a new customer
router.post('/customer', addCustomer);

// Route to add a new order
router.post('/order', addOrder);

// New route for audience creation
router.post('/audience', createAudienceSegment); 

// New routes for campaign creation and retrieval
router.post('/campaign', createCampaign);
router.get('/campaigns', getCampaigns);

// route to send messages
router.post('/campaign/:campaignId/send', sendMessages);


router.post('/communication/:logId/receipt', deliveryReceipt);  // New route for delivery receipt
module.exports = router;