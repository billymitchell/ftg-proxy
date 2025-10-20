const express = require('express');
const router = express.Router();
const cache = require('../utils/cache');
const { queryAirtableContains } = require('../utils/airtable');

// Allowed fields to mitigate schema exposure and injection risk.
// Use canonical Airtable field names in this set.
const ALLOWED_FIELDS = new Set([
  'Redemption Code',
  'Establishment Name',
  'Establishment Type',
  'Award Level',
]);

// Optional aliases to make the API friendlier without exposing the full schema.
// Incoming "field" values will be normalized using this map before validation.
const FIELD_ALIASES = {
  // Backward compatibility: old field name maps to the new canonical name.
  'Official Establishment Name': 'Establishment Name',
};

/**
 * GET /api/query
 *
 * Query params:
 *   field       Airtable field name (must be allowed)
 *   q           Partial text to search (case-insensitive substring)
 *   maxRecords  Optional limit (default 25, max 100)
 *
 * Response: { records: [ { id, createdTime, fields: { ... } } ] }
 */
router.get('/query', async (req, res) => {
  try {
  const { field, q, maxRecords, AIRTABLE_TABLE, AIRTABLE_BASE_ID } = req.query;

    if (!field || !q) {
      return res.status(400).json({ error: 'Missing required query parameters: field, q' });
    }
    // Normalize field using aliases, then validate against the allowlist
    const normalizedField = FIELD_ALIASES[field] || field;
    if (!ALLOWED_FIELDS.has(normalizedField)) {
      return res.status(400).json({ error: 'Field not allowed' });
    }

  const cacheKey = `contains::${AIRTABLE_BASE_ID || 'defaultBase'}::${AIRTABLE_TABLE || 'defaultTable'}::${normalizedField}::${q.toLowerCase()}::${maxRecords || ''}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

  const data = await queryAirtableContains(normalizedField, q, { maxRecords, table: AIRTABLE_TABLE, base: AIRTABLE_BASE_ID });
    cache.set(cacheKey, data);
    res.json(data);
  } catch (err) {
    console.error('Generic Airtable query error:', err);
  res.status(500).json({ error: err.message || 'Failed to query Airtable' });
  }
});

module.exports = router;
