const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cartItemSchema = new Schema({
  prod_id: {
    type: Schema.Types.ObjectId,
    ref: 'productDetails', // Reference to the Product model
    required: true,
  },
  qty: {
    type: Number,
    default: 1,
  },
  unit_price: {
    type: Number,
    required: true,
  },
  total_price: {
    type: Number,
    required: true,
  },

  // You can add other fields specific to cart items if needed
});
const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: Number,
    required: true
  },
  password: {
    type: String,
    required: true,
  },

  is_verified:
  {
    type: Number,
    default: 0
  },

  token: {
    type: String,
    default: ''

  },
  verified:
  {
    type: Boolean
  },
  blocked: {
    type: Boolean,
    default: false
  },
  wallet: {
    type: Number,
    default: 0,
  },
  coupon: {
    code: {
      type: String,
      default: null, 
    },
    discount: {
      type: Number,
      default: 0,
    },
  },
  // appliedCoupons: [
  //   {
  //       code: {
  //           type: String,
  //       },
  //       discount: {
  //           type: Number,
  //           default: 0,
  //       },
  //   },
  // ],

  walletHistory: [
    {
      date: {
        type: Date,
      },
      amount: {
        type: Number,
      },
      status: {
        type: String,
      },
    },
  ],
  referralCode: {
    type: String,
    unique: true,
  },
  cart: [cartItemSchema],
  address: {
    type: [{
      name: String,
      phone: Number,
      address: String,
      district: String,
      state: String,
      locality: String,
      pincode: Number

    }]
  },

}, { timestamps: true });

const user = mongoose.model('userdetails', userSchema);

module.exports = user;
