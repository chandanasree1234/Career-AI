const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, "Please provide a name"] 
    },
    email: { 
        type: String, 
        required: [true, "Please provide an email"], 
        unique: true, 
        lowercase: true 
    },
    password: { 
        type: String, 
        required: [true, "Please provide a password"],
        minlength: 6 
    },
    dateJoined: { 
        type: Date, 
        default: Date.now 
    }
});

// --- PASSWORD HASHING MIDDLEWARE ---
// This function runs automatically right before a user document is saved
userSchema.pre('save', async function(next) {
    // Only hash the password if it's new or being modified
    if (!this.isModified('password')) return next();

    try {
        // Generate a "salt" (random cost factor)
        const salt = await bcrypt.genSalt(10);
        // Scramble the password using the salt
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// --- HELPER METHOD: Password Verification ---
// We can add a method to the schema to compare entered passwords with the hashed one
userSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;