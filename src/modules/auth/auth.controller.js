const { validationResult } = require('express-validator');
const authService = require('./auth.service');

class AuthController {
    // Register new user
    registerHandler = async (req, res) => {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    status: 0,
                    message: errors.array()[0].msg,
                    data: {}
                });
            }

            const { name, email, password } = req.body;

            // Register user through service
            const result = await authService.register({ name, email, password });

            if (!result.success) {
                return res.status(400).json({
                    status: 0,
                    message: result.message,
                    data: {}
                });
            }

            return res.status(201).json({
                status: 1,
                message: result.message,
                // token: result.tokens.accessToken,
                // refresh_token: result.tokens.refreshToken,
                data: {
                    id: result.user.id,
                    name: result.user.name,
                    email: result.user.email,
                    is_email_verified: result.user.isEmailVerified,
                    created_at: result.user.createdAt
                }
            });

        } catch (error) {
            console.error('Registration controller error:', error);
            return res.status(500).json({
                status: 0,
                message: 'Internal server error',
                data: {}
            });
        }
    };

    // Login user
    loginHandler = async (req, res) => {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    status: 0,
                    message: errors.array()[0].msg,
                    data: {}
                });
            }

            const { email, password } = req.body;

            // Login user through service
            const result = await authService.login({ email, password });

            if (!result.success) {
                return res.status(401).json({
                    status: 0,
                    message: result.message,
                    data: {}
                });
            }

            return res.status(200).json({
                status: 1,
                message: result.message,
                token: result.tokens.accessToken,
                refresh_token: result.tokens.refreshToken,
                data: {
                    id: result.user.id,
                    name: result.user.name,
                    email: result.user.email,
                    is_email_verified: result.user.isEmailVerified,
                    avatar: result.user.avatar,
                    last_login_at: result.user.lastLoginAt
                }
            });

        } catch (error) {
            console.error('Login controller error:', error);
            return res.status(500).json({
                status: 0,
                message: 'Internal server error',
                data: {}
            });
        }
    };
}

module.exports = new AuthController();
