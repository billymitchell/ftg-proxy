// Load environment variables from the .env file to securely access sensitive keys
require('dotenv').config();

// Import the Airtable library to interact with the Airtable API
const Airtable = require('airtable');

// Initialize the Airtable client with your API key from environment variables,
// then select the specific base using its unique identifier.
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base('appC9GXdjmEmFlNk7');

// Define the table name (ID) where your records are stored.
const tableName = 'tblSsW6kAWQd3LZVa';

/**
 * Retrieves an Airtable record matching the given redemption code.
 *
 * This asynchronous function queries the Airtable table with the specified
 * redemption code using a filter formula. It returns the first matching record,
 * if any.
 *
 * @param {string} redemptionCode - The redemption code to look for.
 * @returns {Promise<Array>} - A promise that resolves to an array of records (maximum one record).
 * @throws Will throw an error if the record retrieval fails.
 */
async function getAirtableRecord(redemptionCode) {
  try {
    // Query the Airtable table using a filter formula that matches the redemption code.
    // The 'maxRecords: 1' option limits the response to a single record.
    const records = await base(tableName).select({
      filterByFormula: `{Redemption Code} = "${redemptionCode}"`,
      maxRecords: 1,
    }).firstPage();

    // Return the records array (will be empty if no matching record is found).
    return records;
  } catch (error) {
    // Log error details if the Airtable API call fails.
    console.error(`Failed to fetch Airtable record for Redemption Code ${redemptionCode}:`, error);
    // Propagate the error upward to be handled by the calling function.
    throw error;
  }
}

/**
 * Updates the redemption status of an Airtable record matching the given redemption code.
 *
 * This asynchronous function first searches for a record with the provided redemption code.
 * If found, it then updates the "Redemption Status" field to "Already Redeemed".
 *
 * @param {string} redemptionCode - The redemption code corresponding to the record to update.
 * @returns {Promise<void>} - A promise that resolves when the update operation is complete.
 * @throws Will throw an error if no record is found or if the update fails.
 */
async function updateRedemptionStatusInAirtable(redemptionCode) {
  try {
    console.log(`Updating redemption status for code: ${redemptionCode}`);

    // Fetch the record that matches the given redemption code.
    // The same filtering method is used as in the getAirtableRecord function.
    const records = await base(tableName).select({
      filterByFormula: `{Redemption Code} = "${redemptionCode}"`,
      maxRecords: 1,
    }).firstPage();

    // If no record is found, throw an error to indicate that the operation cannot proceed.
    if (!records.length) {
      throw new Error(`No record found for Redemption Code ${redemptionCode}`);
    }

    // Update the record's "Redemption Status" field to "Already Redeemed".
    await base(tableName).update(records[0].id, {
      "Redemption Status": "Already Redeemed",
    });

    // Log a success message including the ID of the updated record.
    console.log(`Successfully updated redemption status for record: ${records[0].id}`);
  } catch (error) {
    // Log detailed error information if the update operation fails.
    console.error(`Failed to update redemption status for Redemption Code ${redemptionCode}:`, error);
    // Propagate the error upward for additional handling.
    throw error;
  }
}

// Export the functions so they can be used elsewhere in the application.
module.exports = {
  getAirtableRecord,
  updateRedemptionStatusInAirtable,
};
