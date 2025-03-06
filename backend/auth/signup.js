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
          age: parseInt(age),
          gender: gender,
          password: password,
          email: email,
        },
      });

      const token = tokenGenerate({
        role : role,
        name : name,
        email : email,
        age : age,
      });
        return res.json({"msg":"done signup",token:token,role:role});
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
            role : role,
            name : name,
            email : email,
        });
        return res.json({"msg":"done signup",token:token,role:role});
    }
  } catch (err) {
    console.error('Error in creating user:', err);
    res.status(400).send('Error in creating user');
  }
};

export default signup;