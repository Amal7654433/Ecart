
const user = require('../models/userSignup');
const prod = require('../models/adminProducts');
const wish = require('../models/wishlistModel');
exports.wishlistLoad = async (req, res) => {
  try {
    const userId = await user.findById(req.session.user);
    const wishlist = await wish.findOne({ user: userId }).populate('products.productId');
    
    res.render('users/wishlist', { wishlist })
  } catch (error) {
    console.log(error.message);
  }
}
exports.wishlistAdd = async (req, res) => {
  const { productId } = req.params;

  try {

    const userId = await user.findById(req.session.user);

    const existingWishlist = await wish.findOne({ user: userId, 'products.productId': productId });

    if (existingWishlist) {
      
      return res.status(200).json({ exist:true});
    }
    else {
    
      const result = await wish.findOneAndUpdate(
        { user: userId },
        { $push: { products: { productId } } },
        { upsert: true }
      );
      if (result) {
    
        return res.status(200).json({ success: true });
      }
    }


  } catch (error) {
    console.error('Error adding product to wishlist:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

exports.removeWishlistItem = async (req, res) => {
  const { productId } = req.params;

  try {
    const userId = await user.findById(req.session.user);

    const result = await wish.findOneAndUpdate(
      { user: userId },
      { $pull: { products: { productId } } },
      { new: true } // `new: true` returns the modified document
    );

    if (result) {
      res.status(200).json({ success: true, message: 'Product removed from wishlist successfully.' });
    } else {
      res.status(404).json({ success: false, message: 'Product not found in wishlist.' });
    }
  } catch (error) {
    console.error('Error removing product from wishlist:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

