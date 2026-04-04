// for verifying token for protected route
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization;
 
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized - Missing token' });
    }
 
    jwt.verify(token.split(' ')[1], process.env.JWT_SECRET , (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Unauthorized - Invalid token' });
      }
 
      req.userId = decoded.id;
      next();
    });
  };