require('dotenv').config();
const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base('appC9GXdjmEmFlNk7');
const tableName = 'tblSsW6kAWQd3LZVa';

async function getAirtableRecord(redemptionCode) {
  try {
    const records = await base(tableName).select({
      filterByFormula: `{Redemption Code} = "${redemptionCode}"`,
      maxRecords: 1,
    }).firstPage();
    return records;
  } catch (error) {
    console.error(`Failed to fetch Airtable record for Redemption Code ${redemptionCode}:`, error);
    throw error;
  }
}

async function updateRedemptionStatusInAirtable(redemptionCode) {
  try {
    console.log(`Updating redemption status for code: ${redemptionCode}`);
    const records = await base(tableName).select({
      filterByFormula: `{Redemption Code} = "${redemptionCode}"`,
      maxRecords: 1,
    }).firstPage();

    if (!records.length) {
      throw new Error(`No record found for Redemption Code ${redemptionCode}`);
    }

    await base(tableName).update(records[0].id, {
      "Redemption Status": "Already Redeemed",
    });
    console.log(`Successfully updated redemption status for record: ${records[0].id}`);
  } catch (error) {
    console.error(`Failed to update redemption status for Redemption Code ${redemptionCode}:`, error);
    throw error;
  }
}

module.exports = {
  getAirtableRecord,
  updateRedemptionStatusInAirtable,
};
