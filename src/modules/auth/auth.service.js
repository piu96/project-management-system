const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../../models/User');

class AuthService {
    constructor() {
        this.jwtSecret = process.env.JWT_SECRET;
        this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
        this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '15m';
        this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    }

    // Generate random auth token for session management
    generateAuthToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    // Generate JWT access token
    generateAccessToken(user, authToken) {
        const payload = {
            id: user._id,
            email: user.email,
            authToken: authToken
        };
        
        return jwt.sign(payload, this.jwtSecret, { 
            expiresIn: this.jwtExpiresIn 
        });
    }

    // Generate JWT refresh token
    generateRefreshToken(user, authToken) {
        const payload = {
            id: user._id,
            authToken: authToken
        };
        
        return jwt.sign(payload, this.jwtRefreshSecret, { 
            expiresIn: this.jwtRefreshExpiresIn 
        });
    }

    // Register new user
    async register(userData) {
        try {
            const { name, email, password } = userData;

            // Check if user already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return {
                    success: false,
                    message: 'User with this email already exists'
                };
            }

            // Create new user
            const user = new User({
                name,
                email,
                password,
                authToken: this.generateAuthToken(),
                isEmailVerified: false
            });

            await user.save();

            // Generate tokens
            const accessToken = this.generateAccessToken(user, user.authToken);
            const refreshToken = this.generateRefreshToken(user, user.authToken);

            return {
                success: true,
                message: 'User registered successfully',
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    isEmailVerified: user.isEmailVerified,
                    createdAt: user.createdAt
                },
                tokens: {
                    accessToken,
                    refreshToken
                }
            };

        } catch (error) {
            console.error('Registration error:', error);
            return {
                success: false,
                message: 'Registration failed. Please try again.'
            };
        }
    }

    // Login user
    async login(loginData) {
        try {
            const { email, password } = loginData;

            // Find user by email
            const user = await User.findOne({ email }).select('+password');
            if (!user) {
                return {
                    success: false,
                    message: 'Invalid email or password'
                };
            }

            // Check if account is active
            if (!user.isActive) {
                return {
                    success: false,
                    message: 'Account is deactivated. Please contact support.'
                };
            }

            // Verify password
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                return {
                    success: false,
                    message: 'Invalid email or password'
                };
            }

            // Generate new auth token for security
            const authToken = this.generateAuthToken();
            user.authToken = authToken;
            user.lastLoginAt = new Date();
            await user.save();

            // Generate tokens
            const accessToken = this.generateAccessToken(user, authToken);
            const refreshToken = this.generateRefreshToken(user, authToken);

            return {
                success: true,
                message: 'Login successful',
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    isEmailVerified: user.isEmailVerified,
                    avatar: user.avatar,
                    lastLoginAt: user.lastLoginAt
                },
                tokens: {
                    accessToken,
                    refreshToken
                }
            };

        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: 'Login failed. Please try again.'
            };
        }
    }

    // Verify JWT token
    verifyToken(token) {
        try {
            return jwt.verify(token, this.jwtSecret);
        } catch (error) {
            return null;
        }
    }

    // Verify refresh token
    verifyRefreshToken(token) {
        try {
            return jwt.verify(token, this.jwtRefreshSecret);
        } catch (error) {
            return null;
        }
    }
}

module.exports = new AuthService();

// Generated by Copilot
