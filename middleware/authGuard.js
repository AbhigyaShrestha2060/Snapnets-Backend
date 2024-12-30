const jwt = require('jsonwebtoken');
const authGuard = (req, res, next) => {
  // check incoming data
  console.log(req.headers); //pass

  // get authorization data from headers
  const authHeader = req.headers.authorization;

  // check or validate
  if (!authHeader) {
    return res.status(400).json({
      success: false,
      message: 'Auth header is missing',
    });
  }

  // Split the data (Format : 'Bearer token-joyboy') -> only token
  const token = authHeader.split(' ')[1];

  // if token is not found : stop the process (res)
  if (!token || token === '') {
    return res.status(400).json({
      success: false,
      message: 'Please provide a token',
    });
  }

  // if token is found then verify
  try {
    const decodeUserData = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decodeUserData;
    next();
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: 'Not Authenticated',
    });
  }
};

module.exports = {
  authGuard,
};
