const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    sender: {
      type: String,
      required: true,
      trim: true,
    },
    senderName: {
      type: String,
      trim: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    receiver: {
      type: String,
      required: true,
      trim: true,
    },
    receiverName: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Amount must be greater than zero'],
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
      uppercase: true,
    },
    timestamp: {
      type: Number,
      required: true,
    },
    nonce: {
      type: String,
      required: true,
      trim: true,
    },
    canonicalPayload: {
      type: String,
      required: true,
    },
    transactionHash: {
      type: String,
      required: true,
      trim: true,
    },
    sha256Hash: {
      type: String,
      trim: true,
    },
    hmac: {
      type: String,
      default: '',
    },
    hmacSignature: {
      type: String,
      default: '',
    },
    digitalSignature: {
      type: String,
      default: '',
    },
    rsaSignature: {
      type: String,
      default: '',
    },
    senderPublicKey: {
      type: String,
      default: '',
    },
    senderKeyFingerprint: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'REJECTED', 'SUCCESS', 'TAMPERED'],
      default: 'PENDING',
    },
    processedAt: {
      type: Date,
      default: null,
    },
    consumedAt: {
      type: Date,
      default: null,
    },
    integrityValid: {
      type: Boolean,
      default: true,
    },
    verificationBreakdown: {
      sha256Valid: { type: Boolean, default: true },
      hmacValid: { type: Boolean, default: true },
      rsaValid: { type: Boolean, default: true },
      nonceValid: { type: Boolean, default: true },
      timestampValid: { type: Boolean, default: true },
      overallVerified: { type: Boolean, default: true },
      rejectionReason: { type: String, default: null },
    },
    isSimulation: {
      type: Boolean,
      default: false,
    },
    simulationDetails: {
      tamperedField: { type: String, default: null },
      originalValue: { type: String, default: null },
      tamperedValue: { type: String, default: null },
      attackType: { type: String, default: null },
    },
  },
  { timestamps: true }
);

// Ensure unique index on nonce at schema level
transactionSchema.index({ nonce: 1 }, { unique: true });

// Pre-save hook to keep aliases synchronized
transactionSchema.pre('save', function (next) {
  if (!this.sender && this.senderName) this.sender = this.senderName;
  if (!this.senderName && this.sender) this.senderName = this.sender;
  if (!this.receiver && this.receiverName) this.receiver = this.receiverName;
  if (!this.receiverName && this.receiver) this.receiverName = this.receiver;
  if (!this.sha256Hash && this.transactionHash) this.sha256Hash = this.transactionHash;
  if (!this.transactionHash && this.sha256Hash) this.transactionHash = this.sha256Hash;
  if (!this.hmac && this.hmacSignature) this.hmac = this.hmacSignature;
  if (!this.hmacSignature && this.hmac) this.hmacSignature = this.hmac;
  if (!this.digitalSignature && this.rsaSignature) this.digitalSignature = this.rsaSignature;
  if (!this.rsaSignature && this.digitalSignature) this.rsaSignature = this.digitalSignature;
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
