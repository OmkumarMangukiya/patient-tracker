import express from 'express';
import signup from './auth/signup.js';
import signin from './auth/signin.js';
import addPatient from './doctor/addPatient.js';
import setPassword from './auth/setPassword.js';
import retrievePatients from './doctor/retirevePatients.js';
import retrieveAllPatients from './doctor/retireveAllPatints.js';
import assignPatient from './doctor/assign-patient.js';
import cors from 'cors';
const app = express();

app.use(express.json()); 

app.get('/', (req, res) => {
  res.send('Server is running');
});
app.use('*',cors());

app.post('/auth/signup', signup);
app.post('/auth/signin', signin);
app.get('/doctor/retrievePatients', retrievePatients);
app.post('/doctor/add-patient', addPatient);
app.post('/auth/set-password', setPassword);
app.get('/doctor/retrieveAllPatients', retrieveAllPatients);
app.post('/doctor/assign-patient', assignPatient);
app.listen(8000, () => {
  console.log('Server is running on port 8000');
});