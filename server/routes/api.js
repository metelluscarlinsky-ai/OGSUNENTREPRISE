const router = require('express').Router();
const db = require('../db');
router.get('/ping', (req, res) => res.json({ status: 'ok' }));
router.post('/webhook/sale', async (req, res) => {
  try {
    const { api_key, referral_code, customer_name, amount, site_source } = req.body || {};
    if (!api_key || !referral_code || !amount) return res.status(400).json({ error: 'Manke done' });
    const site = await db.query('SELECT id FROM partner_sites WHERE api_key=$1 AND status=$2', [api_key, 'active']);
    if (!site.rows.length) return res.status(401).json({ error: 'API Key pa valid' });
    const aff = await db.query('SELECT id FROM affiliates WHERE referral_code=$1', [referral_code]);
    if (!aff.rows.length) return res.status(404).json({ error: 'Kòd afilye pa jwenn' });
    const amt = parseFloat(amount);
    const commission = +(amt * 0.10).toFixed(2);
    const r = await db.query(`INSERT INTO sales (affiliate_id, customer_name, amount, commission, service, site_source, referral_code_used) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, [aff.rows[0].id, customer_name || 'Kliyan', amt, commission, site_source, site_source, referral_code]);
    await db.query('INSERT INTO notifications (affiliate_id, message) VALUES ($1, $2)', [aff.rows[0].id, `Nouvo vant sou ${site_source}! ${commission} HTG`]);
    res.json({ success: true, sale: r.rows[0] });
  } catch (e) { res.status(500).json({ error: 'Erè baz done' }); }
});
module.exports = router;
