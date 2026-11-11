const router = require('express').Router();
const { authRequired } = require('../middleware/auth');

// Lis videyo fòmasyon (statik, pa bezwen DB)
const VIDEOS = [
  {
    id: 1,
    title: 'Kijan pou w vann sou OGSUN Shop',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    description: 'Aprann fondamantal yo pou kòmanse vann sou platfòm nou an.'
  },
  {
    id: 2,
    title: 'Kijan pou w fè pwomosyon OGCARS',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    description: 'Teknik pou atire kliyan pou machin ak van.'
  },
  {
    id: 3,
    title: 'Sèvi ak WhatsApp pou w vann plis',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    description: 'Kijan pou w kreye yon rezo kliyan fidèl.'
  }
];

router.get('/', authRequired, (req, res) => res.json(VIDEOS));

module.exports = router;
