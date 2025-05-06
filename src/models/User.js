const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password: { 
    type: String, 
    required: true,
    minlength: 8,
    select: false
  },
  role: { 
    type: String, 
    enum: ['citizen', 'business', 'admin'], 
    default: 'citizen' 
  },
  nationalId: { 
    type: String, 
    required: function() { return this.role === 'citizen'; },
    validate: {
      validator: function(v) {
        return /^[0-9]{8,12}$/.test(v);
      },
      message: props => `${props.value} is not a valid national ID!`
    }
  },
  businessRegNumber: { 
    type: String, 
    required: function() { return this.role === 'business'; },
    validate: {
      validator: function(v) {
        return /^[A-Z0-9]{6,15}$/i.test(v);
      },
      message: props => `${props.value} is not a valid business registration number!`
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ nationalId: 1 }, { unique: true, sparse: true });
userSchema.index({ businessRegNumber: 1 }, { unique: true, sparse: true });

// Document middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toAuthJSON = function() {
  return {
    id: this._id,
    email: this.email,
    role: this.role,
    isVerified: this.isVerified
  };
};

module.exports = mongoose.model('User', userSchema);