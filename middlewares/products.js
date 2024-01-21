const prod = require('../models/adminProducts');
const catego = require('../models/categoryModel')
const user = require('../models/userSignup');
const wish = require('../models/wishlistModel');
exports.category = async (req, res, next) => {
  try {

    const cat = await catego.find({ active: true });
    res.locals.cat = cat;
    next();
  } catch (error) {
    // Handle the error as needed
    next(error);
  }
};


exports.proudct = async (req, res, next) => {
  try {
    const userId = req.session.user;

    const users = await user.findById(userId).populate({
      path: 'cart.prod_id',
      model: 'productDetails',
      populate: {
        path: 'category',
        model: 'Category',
      },
    });

    // Replace with your cart items
    const carts = users ? users.cart : [];


    const wishlist = await wish.findOne({ user: users }).populate('products.productId');
    const wishlistsproducts = wishlist ? wishlist.products : [];

   

    const products = await prod.find({ active: true });
    res.locals.products = products;
    res.locals.cartLength = carts.length
    res.locals.wishlistLength = wishlistsproducts.length

    next();
  } catch (error) {
    // Handle the error as needed
    next(error);
  }
};