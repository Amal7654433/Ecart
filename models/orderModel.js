const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema(
  {
    user_id : {
        type : mongoose.Types.ObjectId,
        required : true
    }, 
    address: {
      name: { type: String },
      phone: { type: Number },
      address: { type: String },
      locality: { type: String },
    
      district: { type: String },
      state: { type: String },
      pincode: { type: Number },
    },

    items: [
      {
        productId: { type: String },
        productName: { type: String },
        price: { type: Number },
        category: { type: String },
        image: { type: String },
        bill: { type: Number },
        // size: { type: Number },
        quantity: { type: Number },
        orderStatus: { type: String },
      },
    ],
    paymentMode: {
      type: String,
    },
    orderBill: {
      type: String,
    },
    orderDate: {
      type: Date,
      default: Date(),
    },
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
