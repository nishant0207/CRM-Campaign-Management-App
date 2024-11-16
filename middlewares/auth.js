const admin = require('../config/firebase');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const idToken = authHeader.split(' ')[1];
  console.log('Incoming Firebase Token:', idToken);

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log('Decoded Token:', decodedToken);
    req.user = decodedToken; // Attach user info to request
    next();
  } catch (error) {
    console.error('Firebase token verification failed:', error);
    return res.status(403).json({ error: 'Unauthorized: Invalid token' });
  }
};

module.exports = authenticate;