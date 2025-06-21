import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'RaviBuraga';

export function authenticateAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ message: 'No token.' });
  try {
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    // Accept any token with isAdmin: true and adminId (for DB admins)
    if (!decoded.isAdmin || !decoded.adminId) return res.status(403).json({ message: 'Admin only.' });
    req.user = decoded;
    next();
  } catch (_err) {
    return res.status(401).json({ message: 'Invalid token.' });
  }
}

export function authenticateUser(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ message: 'No token.' });
  try {
    // Log the token for debugging
    console.log('Authorization header:', auth);

    // Extract the token from the header
    console.log('Extracting token...');
    const token = auth.split(' ')[1];
    console.log('Token:', token);
    console.log('Using JWT secret:',  jwt.verify(token, JWT_SECRET));
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Decoded:', decoded);
    req.user = decoded;
    next();
  } catch (_err) {
    return res.status(401).json({ message: 'Invalid token.' });
  }
}
