const express = require('express');
const fetch = require('node-fetch');
const app = express();

app.get('/radar', async (req, res) => {
  const { z, x, y } = req.query;
  if (!z || !x || !y) return res.status(400).send('Missing parameters');

  try {
    const data = await fetch("https://api.rainviewer.com/public/maps.json").then(r => r.json());
    const latest = data[data.length - 1];
    const color = 3; // Dark
    const url = `https://tilecache.rainviewer.com/v2/radar/${latest}/256/${z}/${x}/${y}/${color}/1_0.png`;
    const img = await fetch(url);

    if (!img.ok) return res.status(502).send('Upstream image error');

    res.set('Content-Type', 'image/png');
    img.body.pipe(res);
  } catch (err) {
    res.status(500).send('Error fetching radar image');
  }
});

app.get('/', (req, res) => {
  res.send('RainViewer Proxy is up. Use /radar?z={z}&x={x}&y={y}');
});

app.listen(process.env.PORT || 3000, () => {
  console.log('RainViewer Proxy running');
});
