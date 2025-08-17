const authService = require('./auth.service');
const User = require('../../models/User');

class AuthMiddleware {
    // Middleware to authenticate JWT token
    authenticateToken = async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    status: 0,
                    message: 'Access token is required',
                    data: {}
                });
            }

            const token = authHeader.substring(7); // Remove 'Bearer ' prefix
            
            // Verify JWT token
            const decoded = authService.verifyToken(token);
            if (!decoded) {
                return res.status(401).json({
                    status: 0,
                    message: 'Invalid or expired access token',
                    data: {}
                });
            }

            // Find user and verify auth token
            const user = await User.findOne({ 
                _id: decoded.id, 
                authToken: decoded.authToken,
                isActive: true 
            });

            console.log('Authenticated user:', user ? user.email : 'Not found');
            if (!user) {
                return res.status(401).json({
                    status: 0,
                    message: 'User not found or session expired',
                    data: {}
                });
            }

            // Attach user to request object
            req.user = user;
            next();

        } catch (error) {
            console.error('Authentication middleware error:', error);
            return res.status(500).json({
                status: 0,
                message: 'Authentication error',
                data: {}
            });
        }
    };

    // Optional authentication - doesn't fail if no token
    optionalAuthentication = async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                req.user = null;
                return next();
            }

            const token = authHeader.substring(7);
            const decoded = authService.verifyToken(token);
            
            if (decoded) {
                const user = await User.findOne({ 
                    _id: decoded.id, 
                    authToken: decoded.authToken,
                    isActive: true 
                });
                req.user = user || null;
            } else {
                req.user = null;
            }

            next();

        } catch (error) {
            console.error('Optional authentication error:', error);
            req.user = null;
            next();
        }
    };
}

module.exports = new AuthMiddleware();

