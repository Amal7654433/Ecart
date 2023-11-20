const user = require('../models/userSignup');
const order = require('../models/orderModel');
const bcrypt = require('bcrypt')
const mail = require('nodemailer')
const auth = require('../middlewares/auth')
const prod = require('../models/adminProducts');
const randomString = require('randomstring')
const catego = require('../models/categoryModel')
const { v4: uuidv4 } = require('uuid');
const { ObjectId } = require('mongoose').Types;

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
const checkOutView = async (req, res) => {
    try {

        let buynow

        const productId = req.query.id


        const userData = await user.findById(req.session.user).populate({
            path: 'cart.prod_id',
            model: 'productDetails',
            populate: {
                path: 'category',
                model: 'Category',
            },
        });
        if (userData.cart.length === 0) {
            return res.redirect('/cart');
        }
        else {


            if (productId) {
                buynow = true
                const filteredCart = userData.cart.filter(item => item.prod_id._id.toString() === productId);
                console.log(filteredCart)
                res.render('users/checkout', { userData, filteredCart, buynow });
            }
            else {
                buynow = false
                const totalBill = await getTotalSum(userData._id);

                res.render('users/checkout', { userData, totalBill, buynow });
            }

        }
    } catch (error) {
        console.log(error.message);
    }
};


const checkOutPost = async (req, res) => {
    try {
        const userData = await user.findById(req.session.user)
        const selectedAddressIndex = req.body.selectedAddressIndex;
        console.log(selectedAddressIndex)
        const selectedAddress = userData.address[selectedAddressIndex];
        req.session.addr = selectedAddress;
       
        res.redirect('/checkout/payment')


    } catch (error) {
        console.log(error.message);
    }
};
const paymentView = async (req, res) => {
    try {

        const userData = await user.findById(req.session.user).populate({
            path: 'cart.prod_id',
            model: 'productDetails',
            populate: {
                path: 'category',
                model: 'Category',
            },
        });
        console.log(req.session.addr)
        if (userData.cart.length !== 0 && req.session.addr) {
            res.render('users/payment', {});
        }
        else {
            return res.redirect('/cart');
        }

    } catch (error) {
        console.log(error.message);
    }
};
const paymentPost = async (req, res) => {
    try {
        const userData = await user.findById(req.session.user).populate({
            path: 'cart.prod_id',
            model: 'productDetails',
            populate: {
                path: 'category',
                model: 'Category',
            },
        });

        const paymentModelSelect = req.body.cod
        console.log(req.body.cod)


        const selectedAddress = req.session.addr
        const totalBill = await getTotalSum(userData._id);
        const addr = {
            name: selectedAddress.name,
            phone: selectedAddress.phone,
            address: selectedAddress.address,
            locality: selectedAddress.locality,
            district: selectedAddress.district,
            state: selectedAddress.state,
            pincode: selectedAddress.pincode,
        };
        const carts = userData.cart;
        const cartItems = [];
        carts.forEach((item) => {
            cartItems.push({
                productId: item.prod_id._id,
                productName: item.prod_id.name,
                price: item.unit_price,
                category: item.prod_id.category.name,
                image: item.prod_id.image[0],

                bill: item.total_price,

                quantity: item.qty,
            });
        });

        const orderData = {
            user_id: userData._id,
            address: addr,
            items: cartItems,
            paymentMode: paymentModelSelect,
            orderBill: totalBill,
            orderDate: Date(),
        };
        const orders = new order(orderData);
        await orders.save()
        req.session.addr=false
        res.redirect('/orders')
    } catch (error) {
        console.log(error.message);
    }
};
const ordersView = async (req, res) => {
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

        const data = await order.find({ user_id: users._id }).sort({ orderDate: -1 }).lean();

        res.render('users/orders', { data, users })


    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};
module.exports = { ordersView, checkOutView, checkOutPost, paymentView, paymentPost }