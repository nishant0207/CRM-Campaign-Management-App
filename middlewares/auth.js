const admin = require('../config/firebase');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('Missing or invalid Authorization header');
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const idToken = authHeader.split(' ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log('Decoded Token:', decodedToken); // Debug decoded token
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token Verification Failed:', error); // Debug error
    return res.status(403).json({ error: 'Unauthorized: Invalid token' });
  }
};

module.exports = authenticate;