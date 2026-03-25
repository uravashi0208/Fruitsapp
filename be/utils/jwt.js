const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN } = require('../config/env');

const signAccessToken  = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
const signRefreshToken = (payload) => jwt.sign(payload, JWT_SECRET + '_refresh', { expiresIn: JWT_REFRESH_EXPIRES_IN });
const verifyToken      = (token)   => jwt.verify(token, JWT_SECRET);
const verifyRefresh    = (token)   => jwt.verify(token, JWT_SECRET + '_refresh');

module.exports = { signAccessToken, signRefreshToken, verifyToken, verifyRefresh };
