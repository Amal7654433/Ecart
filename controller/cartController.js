const user = require('../models/userSignup');
const bcrypt = require('bcrypt')
const mail = require('nodemailer')
const auth = require('../middlewares/auth')
const prod = require('../models/adminProducts');
const randomString = require('randomstring')
const catego = require('../models/categoryModel')
const { v4: uuidv4 } = require('uuid');
const { ObjectId } = require('mongoose').Types;
//cart management
const addToCart = async (req, res) => {
    try {
        // Check if a user is logged in and retrieve their user ID from the session
        if (!req.session.user) {
            return res.status(401).send('You must be logged in to add items to the cart');
        }

        const userId = req.session.user;

        const productId = req.params.id; // Assuming the product ID is sent in the request body
        const quantity = parseInt(req.body.quantity) || 1; // Default to 1 if quantity is not provided
console.log(productId)
        // Fetch the product details based on the product ID
        const product = await prod.findById(productId);
        const unitPrice = Math.floor(product.price - ((product.price * product.discount) / 100))
        if (!product) {
            // Handle the case where the product is not found
            return res.status(404).send('Product not found');
        }

        // Find the user based on their ID
        const users = await user.findById(userId);

        if (!users) {
            // Handle the case where the user is not found
            return res.status(404).send('User not found');
        }

        // Check if the product is already in the user's cart
        const existingCartItemIndex = users.cart.findIndex((item) => item.prod_id._id.toString() === productId.toString());

        // if (existingCartItemIndex !== -1) {
        // If the product already exists in the cart, update the quantity
        // users.cart[existingCartItemIndex].qty +=quantity
        // } else {
        // If the product is not in the cart, add it as a new item
        if (existingCartItemIndex === -1) {
        users.cart.push({
            prod_id: productId,
            qty: quantity,
            unit_price: unitPrice,
            total_price: unitPrice
        });
        // }

        // Save the user's updated cart
        const cartDetail = await users.save();

    }

        res.redirect('/cart');



    } catch (error) {
        // Handle any errors, e.g., log them or display an error page
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};
const updateQty = async (req, res) => {
    try {
        const userId = req.session.user;

        const { productId, newQuantity } = req.body;

        // Fetch the user from the database
        const users = await user.findById(userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Find the product in the user's cart
        const cartItem = users.cart.find(item => item.prod_id.toString() === productId);

        if (cartItem) {
            // Update the quantity
            cartItem.qty = newQuantity;
            cartItem.total_price = cartItem.unit_price * cartItem.qty
            const sucess = await users.save();

            return res.status(200).send('Quantity updated successfully');
        } else {
            return res.status(404).send('Product not found in the cart');
        }
    } catch (error) {
        console.error('Error updating quantity:', error);
        res.status(500).send('Internal Server Error');
    }
}
const getTotalSum = async function (id) {
    try {
        const users = await user.findById({ _id: id });
        if (users.cart) {
            const cart = users.cart;
            const sum = cart.reduce((sum, item) => sum + item.total_price, 0);
            return sum;
        } else return 0;
    } catch (error) {
        throw new Error('error while calculating net total price');
    }
};
const getTotalCount = async function (id) {
    try {
        const user = await user.findById({ _id: id });
        if (user.cart) {
            const cart = user.cart;
            const count = cart.reduce((count, item) => count + item.qty, 0);
            return count;
        } else return 0;
    } catch (error) {
        throw new Error('error while calculating net total price');
    }
};

const cartView = async (req, res) => {
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
        const cart = users ? users.cart : [];
        console.log(users)
     
        if (cart.length === 0) {
            const empty = true
            res.render('users/cart', { users, cart, empty, message: ' Your cart is empty' });

        }
        else {
            const empty = false
            res.render('users/cart', { users, cart, empty });
        }



    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

const removeFromCart = async (req, res) => {
    try {
        const productId = req.params.id;
        // Assuming you pass the product ID in the URL as a parameter
        
        const users = await user.findById(req.session.user)

        if (!users.cart) {
            console.log('Cart is empty')
            // If the cart doesn't exist in the session, nothing to remove
            return res.status(404).send('Cart is empty');
        }

        // Find the index of the product in the cart
        const productIndex = users.cart.findIndex((item) => item.prod_id._id.toString() === productId.toString());

        if (productIndex === -1) {
            // If the product is not found in the cart, return an error
            return res.status(404).send('Product not found in cart');
        }

        // Remove the product from the cart
        users.cart.splice(productIndex, 1);
        // const result = await user.updateOne({ id: users._id }, { $pull: { cart: { productId } } })
        await users.save();
        // Redirect back to the cart page or another appropriate page
        res.redirect('/cart'); // Redirect to the cart page after removing the product

    } catch (error) {
        // Handle any errors, e.g., log them or display an error page
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};
module.exports =
{
    cartView, addToCart, removeFromCart, updateQty
}