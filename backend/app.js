import express from 'express';
import signup from './auth/signup.js';

const app = express();

app.use(express.json()); // Middleware to parse JSON bodies

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.post('/signup', signup);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});