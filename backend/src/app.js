const express = require('express');
const app = express();
const cors = require('cors');

app.use(cors());
app.use(express.json());
  
//hello world
app.get('/', (req, res) => {
  res.send('Server is running on port 3001');
});

module.exports = app;
