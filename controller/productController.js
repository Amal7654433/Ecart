
const user = require('../models/userSignup');
const prod = require('../models/adminProducts');
const catego = require('../models/categoryModel')

exports.filterProduct=async (req, res) => {
    try {
        console.log("messi",req.query.categoryId)
        const categoryId =req.query.categoryId
        
        const minPrice = parseFloat(req.query.minPrice) || 0; 
        const maxPrice = parseFloat(req.query.maxPrice) || Number.MAX_VALUE; 
console.log('amal',categoryId)
console.log(categoryId)
        const filteredProducts = await prod.find({
            category: categoryId,
            price: { $gte: minPrice, $lte: maxPrice },
            active: true
        });
console.log("filete items=",filteredProducts)
        res.json({ filteredProducts});
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}


