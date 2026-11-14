const router = require('express').Router();
const db = require('../db');

// ===== 1. API POU LÒT SIT YO VOYE VANT =====
router.post('/webhook/sale', async (req, res) => {
  try {
    const { api_key, referral_code, customer_name, amount, site_source } = req.body;

    if (!api_key || !referral_code || !amount) {
      return res.status(400).json({ error: 'Api key, kòd referans ak montan obligatwa' });
    }

    // Verifye si sit la gen pèmisyon (API Key)
    const site = await db.query('SELECT id, name FROM partner_sites WHERE api_key=$1 AND status=$2', [api_key, 'active']);
    if (!site.rows.length) {
      return res.status(401).json({ error: 'API Key pa valid oswa sit sispann' });
    }

    // Jwenn afilye a
    const aff = await db.query('SELECT id FROM affiliates WHERE referral_code=$1', [referral_code]);
    if (!aff.rows.length) {
      return res.status(404).json({ error: 'Kòd afilye a pa egziste' });
    }

    const affiliate_id = aff.rows[0].id;
    const amt = parseFloat(amount);
    const commission = +(amt * 0.10).toFixed(2);

    // Anrejistre vant la
    const r = await db.query(
      `INSERT INTO sales (affiliate_id, customer_name, amount, commission, service, site_source, referral_code_used, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending') RETURNING *`,
      [affiliate_id, customer_name || 'Kliyan Enkoni', amt, commission, site_source || site.rows[0].name, site.rows[0].name, referral_code]
    );

    // Voye yon notifikasyon bay afilye a
    await db.query(
      'INSERT INTO notifications (affiliate_id, message) VALUES ($1, $2)',
      [affiliate_id, `Nouvo vant sou ${site.rows[0].name}! Kliyan: ${customer_name}. Komisyon: ${commission} HTG`]
    );

    res.json({ success: true, message: 'Vant anrejistre ak siksè', sale: r.rows[0] });
  } catch (e) {
    console.error('Webhook Sale Error:', e);
    res.status(500).json({ error: 'Erè nan baz done a' });
  }
});

// ===== 2. API POU LÒT SIT YO VOYE KLIK =====
router.post('/webhook/click', async (req, res) => {
  try {
    const { api_key, referral_code } = req.body;

    if (!api_key || !referral_code) return res.status(400).json({ error: 'Api key ak kòd referans obligatwa' });

    const site = await db.query('SELECT id FROM partner_sites WHERE api_key=$1', [api_key]);
    if (!site.rows.length) return res.status(401).json({ error: 'API Key pa valid' });

    const aff = await db.query('SELECT id FROM affiliates WHERE referral_code=$1', [referral_code]);
    if (!aff.rows.length) return res.status(404).json({ error: 'Kòd afilye a pa egziste' });

    // Anrejistre klik la
    await db.query('INSERT INTO clicks (affiliate_id) VALUES ($1)', [aff.rows[0].id]);
    
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erè' });
  }
});

module.exports = router;
