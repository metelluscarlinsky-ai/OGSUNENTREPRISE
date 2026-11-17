const express = require('express');
const app = express();

app.get('/', (req, res) => res.send('Sèvè a byen mache!'));
app.get('/api/partner/ping', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('✅ TEST SERVER ap kouri sou pò ' + PORT);
});
