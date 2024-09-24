const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb+srv://ofiralmog2:2YIoYX7moljlhN22@gamescout.vbdbi.mongodb.net/', {
})
  .then(() => {
      console.log('Connected to MongoDB');
  })
  .catch((error) => {
      console.error('Error connecting to MongoDB:', error);
  });
app.get('/', (req, res) => {
  res.send('GameScout API is running');
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
