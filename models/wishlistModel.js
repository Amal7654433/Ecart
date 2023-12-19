const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const wishlistSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "userdetails",
  },
  products: [
    {
      productId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "productDetails",
      },
    },
  ],
});
const wish= mongoose.model("Wishlist", wishlistSchema);
module.exports = wish