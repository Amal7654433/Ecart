
const user = require('../models/userSignup');
const prod = require('../models/adminProducts');
const catego = require('../models/categoryModel')
const brand = require('../models/brandsModel');
const Banner = require('../models/bannerModel');

exports.productSearch = async (req, res) => {

    try {
        const searchTerm = req.query.q;

        console.log('term=', searchTerm)
        const activeCategories = await catego.find({ active: true });
        const activeBrands = await brand.find({ active: true });

        products = await prod.find({
            name: { $regex: new RegExp(searchTerm, 'i') },
            active: true,
            category: { $in: activeCategories.map(category => category._id) },
            brand: { $in: activeBrands.map(brand => brand.name) },

        }).populate('category');

        let productsLength = products.length
        console.log(productsLength)
        if (products) {

            if (req.session.user) {
                const userId = req.session.user;
                const users = await user.findById(userId);
                const userCartProductIds = users ? users.cart.map(item => item.prod_id.toString()) : [];

                const productsWithCartFlag = products.map(product => ({
                    ...product._doc,
                    inCart: userCartProductIds.includes(product._id.toString())
                }));

                res.render('users/productSearch', { products: productsWithCartFlag, activeBrands, productsLength });
            } else {

                res.render('users/productSearch', { products, activeBrands, productsLength });
            }
        } else {

            throw new Error('Error while fetching products from the database');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}
exports.filterProduct = async (req, res) => {
    try {

        const categoryId = req.query.categoryId
        const sortOrder = req.query.sortOrder
        console.log(sortOrder, 'sortoreder')

        const minPrice = parseFloat(req.query.minPrice) || 0;
        const maxPrice = parseFloat(req.query.maxPrice) || Number.MAX_VALUE;


        let brands = req.query.brand;

        if (typeof brands === 'string' && brands.trim() !== '') {
            brands = brands.split(',');
        }

        const filter = {
            active: true
        };

        if (categoryId) {
            filter.category = categoryId;
        }

        if (Array.isArray(brands) && brands.length > 0) {
            // Handle multiple brand names
            filter.brand = { $in: brands };
        }

        if (!isNaN(minPrice) && !isNaN(maxPrice) && minPrice <= maxPrice) {
            filter.price = { $gte: minPrice, $lte: maxPrice };
        }

        if (minPrice >= maxPrice) {
            res.json({ invalidQuantity: true })
            console.log('invalid quantity ')
        }

        else {
            const sortOption = sortOrder === '1' ? { price: 1 } : { price: -1 };
            const filteredProducts = await prod.find(filter).sort(sortOption);
            if (filteredProducts) { res.json({ filteredProducts }); }
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

exports.productsByCategory = async (req, res) => {
    try {

        const categoryIdentifier = req.params.categoryId;

        const cat = await catego.find({ active: true });

        const category = await catego.findOne({ _id: categoryIdentifier, active: true });
        const productCount = await prod.countDocuments({ category: categoryIdentifier });
        console.log('number=', productCount)
        if (category) {
            const activeBrands = await brand.find({ active: true });
            const products = await prod.find({ category: category._id, active: true, brand: { $in: activeBrands.map(brand => brand.name) } });


            if (products) {

                if (req.session.user) {
                    const userId = req.session.user;
                    const users = await user.findById(userId);
                    const userCartProductIds = users ? users.cart.map(item => item.prod_id.toString()) : [];

                    const productsWithCartFlag = products.map(product => ({
                        ...product._doc,
                        inCart: userCartProductIds.includes(product._id.toString())
                    }));

                    res.render('users/categoryProduct', { products: productsWithCartFlag, category, cat, activeBrands, productCount });
                } else {

                    res.render('users/categoryProduct', { products, category, cat, activeBrands, productCount });
                }
            } else {

                throw new Error('Error while fetching products from the database');
            }
        } else {

            res.status(404).send('Category not found');
        }
    } catch (error) {

        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};



exports.langingPage = async (req, res) => {
    try {

        const banner = await Banner.find({ active: true })
        const activeCategories = await catego.find({ active: true });
        const activeBrands = await brand.find({ active: true });
        const products = await prod.find({
            active: true,
            category: { $in: activeCategories.map(category => category._id) },
            brand: { $in: activeBrands.map(brand => brand.name) },

        }).populate('category');

        const cat = await catego.find({ active: true });

        if (products) {

            if (req.session.user) {
                const userId = req.session.user;


                const users = await user.findById(userId);
                const userCartProductIds = users ? users.cart.map(item => item.prod_id.toString()) : [];


                const productsWithCartFlag = products.map(product => ({
                    ...product._doc,
                    inCart: userCartProductIds.includes(product._id.toString())
                }));


                res.render('users/landing', { products: productsWithCartFlag, cat, banner });
            } else {

                res.render('users/landing', { products, cat, banner });
            }
        } else {

            throw new Error('Error while fetching products from the database');
        }
    } catch (error) {
        // Handle any errors that occur during the process
        console.error(error.message);
        // You might want to send an error response to the client here
        res.status(500).send('Internal Server Error');
    }
};
exports.homeView = async (req, res) => {
    try {
        const cat = await catego.find({ active: true })

        res.render('users/home', { cat });
    } catch (error) {
        console.log(error.message);
    }
};

exports.productsView = async (req, res) => {
    try {
        const productId = req.params.productId;
        const product = await prod.findById(productId);
        const cat = await catego.find({ active: true });

        if (!product) {

            return res.status(404).render('error', { message: 'Product not found' });
        }
        if (req.session.user) {
            const userId = req.session.user;
            const users = await user.findById(userId);
            const userCartProductIds = users ? users.cart.map(item => item.prod_id.toString()) : [];
            product.inCart = userCartProductIds.includes(productId);
        }
        const userId = req.session.user;
        const users = await user.findById(userId).populate({
            path: 'cart.prod_id',
            model: 'productDetails',
            populate: {
                path: 'category',
                model: 'Category',
            },
        });

        res.render('users/productDetails', { product, cat });
    } catch (error) {
        console.error(error.message);
        // Handle the error, e.g., render an error page
        res.status(500).render('error', { message: 'Internal server error' });
    }
};
exports.referral = async (req, res) => {
    try {
        const pageTitle = "Referral Offer";

        const userData = await user.findById(req.session.user);
        const referral = userData.referralCode;
        res.render("users/referral", {
            pageTitle,

            referral,
        });
    } catch (error) {
        console.log(error.message);
        res.render("user/error");
    }
};

