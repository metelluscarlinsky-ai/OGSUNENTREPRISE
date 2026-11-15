const router = require('express').Router();

// Wout senp pou teste si API a mache
router.post('/webhook/sale', (req, res) => {
  console.log('Revet: ', req.body);
  res.json({ success: true, message: "API a byen resevwa mesaj la!" });
});

router.get('/ping', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = router;
