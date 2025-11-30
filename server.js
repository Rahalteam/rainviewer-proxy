const express = require('express');
const fetch = require('node-fetch');
const app = express();

// تقليل مشاكل التخزين المؤقت
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// نقطة اختبار سريعة
app.get('/', (req, res) => {
  res.send('RainViewer Proxy is up. Use /radar/{z}/{x}/{y}.png or /radar?z=&x=&y=');
});

// دعم الصيغة: /radar?z=&x=&y=
app.get('/radar', async (req, res) => {
  const { z, x, y } = req.query;
  if (!z || !x || !y) return res.status(400).send('Missing parameters: z, x, y');
  await proxyTile(res, z, x, y);
});

// دعم الصيغة: /radar/{z}/{x}/{y}.png
app.get('/radar/:z/:x/:y.png', async (req, res) => {
  const { z, x, y } = req.params;
  await proxyTile(res, z, x, y);
});

async function proxyTile(res, z, x, y) {
  try {
    const data = await fetch('https://api.rainviewer.com/public/maps.json').then(r => r.json());
    const latest = data[data.length - 1];
    const color = 3; // Dark
    const url = `https://tilecache.rainviewer.com/v2/radar/${latest}/256/${z}/${x}/${y}/${color}/1_0.png`;
    const img = await fetch(url);

    if (!img.ok) {
      return res.status(502).send('Upstream image error');
    }

    res.set('Content-Type', 'image/png');
    // تمرير البودي مباشرة
    img.body.pipe(res);
  } catch (err) {
    res.status(500).send('Error fetching radar image');
  }
}

app.listen(process.env.PORT || 3000, () => {
  console.log('RainViewer Proxy running');
});
