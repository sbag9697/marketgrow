const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { connectDB } = require('./utils/database');
const User = require('./models/User');

const resetAdmin = async () => {
    try {
        // Connect to database
        await connectDB();
        
        // Delete existing admin
        await User.deleteOne({ email: 'admin@marketgrow.com' });
        console.log('Existing admin deleted');
        
        // Create new admin
        const adminUser = new User({
            username: 'admin',
            email: 'admin@marketgrow.com',
            password: 'admin123!@#',
            name: '관리자',
            phone: '01012345678',
            role: 'admin',
            businessType: 'corporation',
            isEmailVerified: true,
            isPhoneVerified: true,
            isActive: true,
            termsAcceptedAt: new Date()
        });
        
        await adminUser.save();
        console.log('Admin user created successfully');
        console.log('Email: admin@marketgrow.com');
        console.log('Password: admin123!@#');
        
        // Test login
        const user = await User.findOne({ email: 'admin@marketgrow.com' }).select('+password');
        const isValid = await user.comparePassword('admin123!@#');
        console.log('Password test:', isValid ? 'PASS' : 'FAIL');
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

resetAdmin();