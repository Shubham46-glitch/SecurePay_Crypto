const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    balance: {
      type: Number,
      default: 50000.0,
    },
    rsaPublicKey: {
      type: String,
      default: '',
    },
    rsaPrivateKey: {
      type: String,
      default: '',
    },
    publicKeyFingerprint: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'auditor', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.rsaPrivateKey;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('User', userSchema);
