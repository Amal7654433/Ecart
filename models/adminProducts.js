const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    details: {
      type: String,
      required: true,
    },
    stock: {
      type: Number,
      required: true,
    },
    image: {
      type: [String],
      required: true,
    },
    // category: {
    //   type: String,
    //   required: true,
    // },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category', // This should match the model name of the Category schema
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    discount: {
      type: Number,
      required: true,
    },
    active: {
      type: Boolean,
      default: true
    }
  },  { timestamps: true })
const products = mongoose.model('productDetails', productSchema);

module.exports = products;

