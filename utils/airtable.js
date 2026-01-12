// Load environment variables from the .env file to securely access sensitive keys
require('dotenv').config();

// Import the Airtable library to interact with the Airtable API
const Airtable = require('airtable');

// Initialize the Airtable client with your API key from environment variables,
// then select the specific base using its unique identifier.
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base('appC9GXdjmEmFlNk7');

// Define the table name (ID) where your records are stored.
const tableName = 'tbl4YQBCXN4f2WREk';

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

/**
 * Perform a case-insensitive substring search against a specific field in the Airtable table.
 * Mirrors the behavior of a generic query function using the Airtable REST API but leverages
 * the Airtable SDK already initialized here.
 *
 * Caching is intentionally NOT handled inside this utility to keep it pure; the route layer
 * applies caching so different cache strategies can be swapped without touching data access.
 *
 * @param {string} field - The Airtable field name to search (must be whitelisted / sanitized).
 * @param {string} query - The user provided partial text to search for (case-insensitive).
 * @param {object} options - Optional parameters.
 * @param {number} [options.maxRecords=25] - Maximum records to return (hard capped at 100).
 * @returns {Promise<{records: Array}>} Object containing an array of matching records in a shape
 * similar to the raw Airtable REST API (id, fields, createdTime).
 */
async function queryAirtableContains(field, query, options = {}) {
  const cleanQuery = (query || '').trim();
  if (!cleanQuery) return { records: [] };

  // Basic field name sanitation: allow letters, numbers, spaces, and limited punctuation.
  // Prevent formula injection via curly braces or suspicious characters.
  const allowedFieldPattern = /^[A-Za-z0-9 _-]+$/;
  if (!allowedFieldPattern.test(field)) {
    throw new Error('Invalid field name');
  }

  const maxRecords = Math.min(parseInt(options.maxRecords, 10) || 25, 100);

  // Allow dynamic base override (AIRTABLE_BASE_ID) with validation.
  const baseIdPattern = /^app[a-zA-Z0-9]{14}$/; // Standard Airtable base id format
  let activeBase = base; // default base instance
  if (options.base && baseIdPattern.test(options.base)) {
    // Create a new base instance lazily (lightweight) if provided.
    activeBase = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(options.base);
  } else if (options.base && !baseIdPattern.test(options.base)) {
    throw new Error('Invalid base identifier');
  }

  // Allow dynamic table override (either table ID like tblXXXXXXXXXXXXXX or a plain name) with validation.
  let activeTable = tableName; // default table
  if (options.table) {
    const tbl = String(options.table).trim();
    const tableIdPattern = /^tbl[a-zA-Z0-9]{14}$/; // Typical Airtable table ID (starts with tbl)
    const tableNamePattern = /^[A-Za-z0-9 _-]+$/; // Simplistic safe name pattern
    if (tableIdPattern.test(tbl) || tableNamePattern.test(tbl)) {
      activeTable = tbl;
    } else {
      throw new Error('Invalid table identifier');
    }
  }

  // Escape double quotes inside the query string for formula safety.
  const escaped = cleanQuery.replace(/"/g, '\\"');
  const lowered = escaped.toLowerCase();
  // Case-insensitive substring search using SEARCH over LOWER(field).
  const formula = `SEARCH("${lowered}", LOWER({${field}}))`; // returns position or 0 / blank

  try {
  const records = await activeBase(activeTable).select({
      filterByFormula: formula,
      maxRecords,
    }).all();

    // Conform to Airtable REST API-ish response shape
    return {
      records: records.map(r => ({
        id: r.id,
        createdTime: r._rawJson && r._rawJson.createdTime,
        fields: { ...r.fields },
      })),
    };
  } catch (err) {
    console.error('Failed generic Airtable contains query:', err);
    throw err;
  }
}

// Re-export including the new generic query helper
module.exports.queryAirtableContains = queryAirtableContains;
