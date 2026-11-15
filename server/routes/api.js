const router = require('express').Router();
const db = require('../db');

router.post('/webhook/sale', async (req, res) => {
  try {
    console.log('📥 Webhook resevwa:', req.body); // Sa ap ekri nan loj yo

    const { api_key, referral_code, customer_name, amount, site_source } = req.body || {};

    if (!api_key || !referral_code || !amount) {
      return res.status(400).json({ error: 'Api key, kòd referans ak montan obligatwa' });
    }

    console.log('🔍 Ap chèche sit la ak API Key:', api_key);
    const site = await db.query('SELECT id, name FROM partner_sites WHERE api_key=$1 AND status=$2', [api_key, 'active']);
    
    if (!site.rows.length) {
      console.log('❌ Sit pa jwenn oswa sispann');
      return res.status(401).json({ error: 'API Key pa valid oswa sit sispann' });
    }

    console.log('🔍 Ap chèche afilye a ak kòd:', referral_code);
    const aff = await db.query('SELECT id FROM affiliates WHERE referral_code=$1', [referral_code]);
    
    if (!aff.rows.length) {
      console.log('❌ Afilye pa jwenn');
      return res.status(404).json({ error: 'Kòd afilye a pa egziste nan Enterprise' });
    }

    const affiliate_id = aff.rows[0].id;
    const amt = parseFloat(amount);
    const commission = +(amt * 0.10).toFixed(2);

    console.log('✅ Ap anrejistre vant la...');
    const r = await db.query(
      `INSERT INTO sales (affiliate_id, customer_name, amount, commission, service, site_source, referral_code_used, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending') RETURNING *`,
      [affiliate_id, customer_name || 'Kliyan Enkoni', amt, commission, site_source || site.rows[0].name, site.rows[0].name, referral_code]
    );

    console.log('✅ Vant anrejistre:', r.rows[0]);

    await db.query(
      'INSERT INTO notifications (affiliate_id, message) VALUES ($1, $2)',
      [affiliate_id, `Nouvo vant sou ${site.rows[0].name}! Kliyan: ${customer_name}. Komisyon: ${commission} HTG`]
    );

    res.json({ success: true, message: 'Vant anrejistre ak siksè', sale: r.rows[0] });
  } catch (e) {
    console.error('🔥 WEBHOOK ERROR:', e.message);
    console.error(e.stack); // Sa ap ekri tout detay erè a nan loj yo
    res.status(500).json({ error: 'Erè nan baz done a', details: e.message });
  }
});

// ... (rete kòd la pou webhook/click lan)
module.exports = router;
