// Importing Express framework and creating a new router object.
const express = require('express');
const router = express.Router();

// Import a simple caching utility (if used to store temporary data)
const cache = require('../utils/cache');

// Import the functions that interact with Airtable:
// - getAirtableRecord: Fetches a record based on a redemption code
// - updateRedemptionStatusInAirtable: Updates the redemption status of a record in Airtable
const { getAirtableRecord, updateRedemptionStatusInAirtable } = require('../utils/airtable');

/**
 * POST /order-data
 *
 * This endpoint receives order data, extracts redemption codes from order line items,
 * updates the corresponding Airtable records' status to "Already Redeemed" using the
 * updateRedemptionStatusInAirtable function, and then caches the updated status.
 */
router.post('/order-data', async (req, res) => {
  try {
    // Extract the order data from the request body.
    const order = req.body;
    
    // Validate that the order data is in the expected format.
    // It must contain a "line_items" property that is an array.
    if (!order || !order.line_items || !Array.isArray(order.line_items)) {
      return res.status(400).json({ error: 'Invalid order data' });
    }

    // Initialize an array to store redemption codes found in the order.
    const redemptionCodes = [];

    // Loop through each line item in the order.
    order.line_items.forEach(item => {
      // Check if the line item has product personalizations and it's an array.
      if (item.product_personalizations && Array.isArray(item.product_personalizations)) {
        // Loop through each personalization associated with the product.
        item.product_personalizations.forEach(personalization => {
          // Check if the personalization contains attributes and it's an array.
          if (personalization.attributes && Array.isArray(personalization.attributes)) {
            // Loop through each attribute to find the "Redemption Code".
            personalization.attributes.forEach(attribute => {
              // If the key of the attribute is "Redemption Code", process it.
              if (attribute.key === 'Redemption Code') {
                console.log('Redemption Code:', attribute.value);
                // Add the redemption code value to the redemptionCodes array.
                redemptionCodes.push(attribute.value);
              }
            });
          }
        });
      }
    });

    // If no redemption codes are found, return a 400 error response.
    if (redemptionCodes.length === 0) {
      return res.status(400).json({ error: 'No redemption codes found in order items' });
    }

    // Loop through all detected redemption codes.
    // For each code, update the Airtable record to mark it as "Already Redeemed"
    // and store that status in the cache.
    for (const redemptionCode of redemptionCodes) {
      console.log('Updating redemption status for code:', redemptionCode);
      // Call the async function to update the record in Airtable.
      await updateRedemptionStatusInAirtable(redemptionCode);
      // Cache the updated status. The cache can be used to reduce redundant API calls.
      cache.set(redemptionCode, 'Already Redeemed');
    }

    // After all records have been processed, send a success response.
    res.json({ message: 'Redemption statuses updated to "Already Redeemed"' });
  } catch (error) {
    // Log the error to the console (detailed logging could be handled by a logger module).
    console.error('Error updating redemption statuses:', error);
    
    // Respond with a 500 error status and a generic error message.
    res.status(500).json({ error: 'Failed to update redemption statuses' });
  }
});

// Export the router so it can be mounted in the main server application.
module.exports = router;
