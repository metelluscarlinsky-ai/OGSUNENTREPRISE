const router = require('express').Router();
const db = require('../db');

// 1. Wout pou teste si sèvè a ap viv (Pa manyen baz done a)
router.get('/ping', (req, res) => {
  res.json({ status: 'ok', message: 'Sèvè Enterprise lan byen mache!' });
});

// 2. Wout pou resevwa vant yo
router.post('/webhook/sale', async (req, res) => {
  console.log('--- NOUVO REKÈT WEBHOOK ---');
  console.log('Body resevwa:', req.body);
  
  try {
    const { api_key, referral_code, customer_name, amount, site_source } = req.body || {};

    if (!api_key || !referral_code || !amount) {
      console.log('❌ Erè: Api key, kòd referans oswa montan manke');
      return res.status(400).json({ error: 'Api key, kòd referans ak montan obligatwa' });
    }

    console.log('🔍 1. Ap chèche sit la ak API Key:', api_key);
    const site = await db.query('SELECT id, name FROM partner_sites WHERE api_key=$1 AND status=$2', [api_key, 'active']);
    
    if (!site.rows.length) {
      console.log('❌ Erè: API Key pa valid oswa sit sispann');
      return res.status(401).json({ error: 'API Key pa valid oswa sit sispann' });
    }

    console.log('🔍 2. Ap chèche afilye a ak kòd:', referral_code);
    const aff = await db.query('SELECT id FROM affiliates WHERE referral_code=$1', [referral_code]);
    
    if (!aff.rows.length) {
      console.log('❌ Erè: Kòd afilye a pa egziste');
      return res.status(404).json({ error: 'Kòd afilye a pa egziste nan Enterprise' });
    }

    const affiliate_id = aff.rows[0].id;
    const amt = parseFloat(amount);
    const commission = +(amt * 0.10).toFixed(2);

    console.log('✅ 3. Ap anrejistre vant la nan baz done a...');
    const r = await db.query(
      `INSERT INTO sales (affiliate_id, customer_name, amount, commission, service, site_source, referral_code_used, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending') RETURNING *`,
      [affiliate_id, customer_name || 'Kliyan Enkoni', amt, commission, site_source || site.rows[0].name, site.rows[0].name, referral_code]
    );

    console.log('✅ 4. Vant anrejistre ak siksè:', r.rows[0].id);

    await db.query(
      'INSERT INTO notifications (affiliate_id, message) VALUES ($1, $2)',
      [affiliate_id, `Nouvo vant sou ${site.rows[0].name}! Kliyan: ${customer_name}. Komisyon: ${commission} HTG`]
    );

    res.json({ success: true, message: 'Vant anrejistre ak siksè', sale: r.rows[0] });
  } catch (e) {
    console.error('🔥 ERÈ GRAV NAN WEBHOOK LA:', e.message);
    console.error(e.stack); // Sa ap bay plis detay nan Render Logs
    res.status(500).json({ error: 'Erè nan sèvè a', details: e.message });
  }
});

// 3. Wout pou klik (si w bezwen l)
router.post('/webhook/click', async (req, res) => {
  try {
    const { api_key, referral_code } = req.body || {};
    if (!api_key || !referral_code) return res.status(400).json({ error: 'Api key ak kòd referans obligatwa' });
    
    const site = await db.query('SELECT id FROM partner_sites WHERE api_key=$1', [api_key]);
    if (!site.rows.length) return res.status(401).json({ error: 'API Key pa valid' });
    
    const aff = await db.query('SELECT id FROM affiliates WHERE referral_code=$1', [referral_code]);
    if (!aff.rows.length) return res.status(404).json({ error: 'Kòd afilye a pa egziste' });
    
    await db.query('INSERT INTO clicks (affiliate_id) VALUES ($1)', [aff.rows[0].id]);
    res.json({ success: true });
  } catch (e) {
    console.error('🔥 ERÈ KLIK:', e.message);
    res.status(500).json({ error: 'Erè', details: e.message });
  }
});

module.exports = router;
