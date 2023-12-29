const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const couponSchema = new Schema({
  couponName: {
    type: String,
  },
  code: {
    type: String,
    trim: true,
    uppercase: true,
    unique: true,
  },
  value: {
    type: Number,
    required: true,
  },

  minBill: {
    type: Number,
    required: true,
  },
  maxAmount: {
    type: Number,
    required: true,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  active: {
    type: Boolean,
    default: true
},
  usedUsers: [
    {
      type: Schema.Types.ObjectId,
      ref: "userdetails",
    },
  ],
});

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;