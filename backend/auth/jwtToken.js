import jwt from 'jsonwebtoken';

const tokenVerify = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    return decoded;
  } catch (err) {
    return false;
  }
};

const tokenGenerate = (data) => {
  return jwt.sign(data, process.env.TOKEN_SECRET, { expiresIn: '24h' });
};

export { tokenGenerate, tokenVerify };