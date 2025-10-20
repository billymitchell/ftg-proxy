// Import the Express framework and create a new router instance.
const express = require('express');
const router = express.Router();

// Import a simple caching utility to temporarily store response data.
const cache = require('../utils/cache');

// Import the function to retrieve records from Airtable using a redemption code.
const { getAirtableRecord } = require('../utils/airtable');

// Define a GET endpoint that receives a redemption code as a route parameter.
router.get('/:redemptionCode', async (req, res) => {
  // Extract the redemption code from the request parameters.
  const { redemptionCode } = req.params;

  // First, check if the cache contains data for the given redemption code.
  // This helps reduce redundant calls to the Airtable API.
  const cachedStatus = cache.get(redemptionCode);
  if (cachedStatus) {
    // If a valid cache record exists, return the cached response immediately.
    return res.json(cachedStatus);
  }

  try {
    // Call the function to retrieve Airtable records filtered by the redemption code.
    const records = await getAirtableRecord(redemptionCode);
    if (records.length > 0) {
      // If one or more records are returned from Airtable, use the first record.
      const record = records[0];

      // Helper to pick the first available field name from a list of candidates
      const pickField = (rec, names) => {
        for (const n of names) {
          const v = rec.get(n);
          if (v !== undefined && v !== null && v !== '') return v;
        }
        return undefined;
      };

      const responsePayload = {
        redemptionCode: record.get('Redemption Code'),
        establishmentName: pickField(record, ['Establishment Name', 'Official Establishment Name']),
        establishmentType: record.get('Establishment Type'),
        awardLevel: record.get('Award Level'),
        redemptionStatus: record.get('Redemption Status'),
      };

      // Cache the retrieved record for future requests. This helps in improving performance
      // by reducing the number of API calls to Airtable.
      cache.set(redemptionCode, responsePayload);

      // Send a JSON response containing essential fields from the Airtable record.
      res.json(responsePayload);
    } else {
      // If no records are found, respond with a 404 status code and an error message.
      res.status(404).json({ error: 'Sorry, this redemption code is not valid' });
    }
  } catch (error) {
    // In case of any errors (e.g., API call failure), respond with a 500 status code.
    res.status(500).json({ error: 'Failed to retrieve redemption code status' });
  }
});

// Export the router so it can be mounted in the main application.
module.exports = router;
