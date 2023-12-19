
const user = require('../models/userSignup');
const prod = require('../models/adminProducts');
const catego = require('../models/categoryModel')

exports.filterProduct=async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const minPrice = parseFloat(req.query.minPrice) || 0; // Parse minPrice as a float, default to 0
        const maxPrice = parseFloat(req.query.maxPrice) || Number.MAX_VALUE; // Parse maxPrice as a float, default to Infinity
console.log('amal',categoryId)
        const filteredProducts = await prod.find({
            category: categoryId,
            price: { $gte: minPrice, $lte: maxPrice },
            active: true
        });
console.log("filete items=",filteredProducts)
        res.json({ products: filteredProducts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}