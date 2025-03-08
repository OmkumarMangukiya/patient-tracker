import { tokenGenerate } from './jwtToken.js';
import prisma from '../client.js';

const signin = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    let user;
    if (role === 'patient') {
      user = await prisma.Patient.findUnique({
        where: { email: email },
      });
    } else if (role === 'doctor') {
      user = await prisma.Doctor.findUnique({
        where: { email: email },
      });
    }

    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = tokenGenerate({
      role: role,
      name: user.name,
      email: user.email,
      id :user.id,
    });

    return res.json({ message: 'Sign-in successful', token: token, role: role });
  } catch (err) {
    console.error('Error in signing in:', err);
    res.status(500).send('Error in signing in');
  }
};

export default signin;