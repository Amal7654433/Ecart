const prod = require('../models/adminProducts');
const catego = require('../models/categoryModel')
 exports.category= async (req, res, next) => {
    try {

      const cat = await catego.find({ active: true });
      res.locals.cat = cat;
      next();
    } catch (error) {
      // Handle the error as needed
      next(error);
    }
  };


exports.proudct=async (req, res, next) => {
    try {
      const products = await prod.find({ active: true });
      res.locals.products = products;
      next();
    } catch (error) {
      // Handle the error as needed
      next(error);
    }
  };