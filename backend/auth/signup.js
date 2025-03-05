import { tokenGenerate } from './jwtToken.js';
import prisma from '../client.js';

const signup = async (req, res) => {
    const { role } = req.body;
  try {
    if (role === 'patient') {
    const { role, name, email, age, gender, password } = req.body;

      const user = await prisma.Patient.create({
        data: {
          name: name,
          age: age,
          gender: gender,
          password: password,
          email: email,
        },
      });

      const token = tokenGenerate({
        role,
        name,
        email,
        age,
      });

      res.send(`Signup done successfully ${token}`);
    } else if (role ==='doctor'){
      const {role,name,email,password,specialization} = req.body;
        const user = await prisma.Doctor.create({
            data: {
            name: name,
            specialization: specialization,
            password: password,
            email: email,
            },
        });
        const token = tokenGenerate({
            role,
            name,
            email,
        });
        res.send(`Signup done successfully ${token}`);
    }
  } catch (err) {
    console.error('Error in creating user:', err);
    res.status(400).send('Error in creating user');
  }
};

export default signup;