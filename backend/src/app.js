const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Server is running on por 3000');
});

module.exports = app;