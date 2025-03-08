import jwt from 'jsonwebtoken';

export function tokenVerify(token) {
  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    return decoded;
  } catch (err) {
    return false;
  }
}

export function tokenGenerate(data) {
  return jwt.sign(data, process.env.TOKEN_SECRET, { expiresIn: '24h' });
}
