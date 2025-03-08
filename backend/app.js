import express from 'express';
import signup from './auth/signup.js';
import signin from './auth/signin.js';
import retrievePatients from './doctor/retirevePatients.js';
import cors from 'cors';
const app = express();

app.use(express.json()); // Middleware to parse JSON bodies

app.get('/', (req, res) => {
  res.send('Server is running');
});
app.use('*',cors());
app.post('/signup', signup);
app.post('/signin', signin);
app.get('/doctor/retrievePatients', retrievePatients);

app.listen(8000, () => {
  console.log('Server is running on port 8000');
});