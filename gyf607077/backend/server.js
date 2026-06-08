const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const routes = require('./src/routes');

const PORT = process.env.PORT || 4000;
const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api', routes);

const BUILD_DIR = path.join(__dirname, '..', 'frontend', 'dist');
const fs = require('fs');
if (fs.existsSync(BUILD_DIR)) {
  app.use(express.static(BUILD_DIR));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(BUILD_DIR, 'index.html'));
    }
  });
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || '服务器错误' });
});

app.listen(PORT, () => {
  console.log(`婴幼儿睡眠观察复核墙 API 已启动: http://localhost:${PORT}`);
});
