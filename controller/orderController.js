const user = require('../models/userSignup');
const order = require('../models/orderModel');
const bcrypt = require('bcrypt')
const mail = require('nodemailer')
const brand = require('../models/brandsModel');
const auth = require('../middlewares/userAuth')
const prod = require('../models/adminProducts');
const randomString = require('randomstring')
const catego = require('../models/categoryModel')
const { v4: uuidv4 } = require('uuid');
const { ObjectId } = require('mongoose').Types;
const fs = require('fs');
const easyinvoice = require('easyinvoice');
const helper = require('../helpers/helperDate');
const config = require('../config/connection')
const Coupon = require('../models/couponModel')
const Razorpay = require('razorpay');
const svgCaptcha = require('svg-captcha');


var instance = new Razorpay({ key_id: process.env.RAZORPAY_ID_KEY, key_secret: process.env.RAZORPAY_SECRET_KEY })




const getTotalSum = async function (id) {
    try {
        const users = await user.findById({ _id: id });
        if (users.cart) {
            const cart = users.cart;
            const sum = cart.reduce((sum, item) => sum + item.total_price, 0);
            let discount = (users.coupon.discount / 100) * sum;
            const finaltotal = sum - discount
            return finaltotal;
        } else return 0;
    } catch (error) {
        throw new Error('error while calculating net total price');
    }
};
const checkOutView = async (req, res) => {
    try {

        const userData = await user.findById(req.session.user).populate({
            path: 'cart.prod_id',
            model: 'productDetails',
            populate: {
                path: 'category',
                model: 'Category',
            },
        });
        const userId = req.session.user;
        const cart = userData.cart;
        const totalBill = cart.reduce((sum, item) => sum + item.total_price, 0);
        const currentDate = new Date();
        if (userData.cart.length === 0) {
            return res.redirect('/cart');
        }
        else {

            const coupons = await Coupon.find({
                $and: [
                    { minBill: { $lte: totalBill } },
                    { maxAmount: { $gte: totalBill } },
                    { active: true },
                    { usedUsers: { $not: { $in: [userId] } } },
                    { expiryDate: { $gte: currentDate } }
                ]
            });

            res.render('users/checkout', { userData, coupons });
        }
    } catch (error) {
        console.log(error.message);
    }
};


const checkOutPost = async (req, res) => {
    try {
        const userData = await user.findById(req.session.user)
        const selectedAddressIndex = req.body.selectedAddressIndex;
        console.log(selectedAddressIndex, 'index')
        const selectedAddress = userData.address[selectedAddressIndex];
        req.session.addr = selectedAddress;
        const cartItems = userData.cart;
        const couponCode = userData.coupon.code
        const sum = cartItems.reduce((sum, item) => sum + item.total_price, 0);
        if (couponCode !== null) {
            const coupon = await Coupon.findOne({ code: couponCode });
            if (!coupon || !coupon.active || sum < coupon.minBill || sum > coupon.maxAmount || coupon.code !== couponCode) {
                console.log('Invalid coupon code:', couponCode);
                return res.json({ couponCodeFailure: true, message: 'Invalid coupon code' });
            }
        }
        const brands = await brand.find({ active: true });

        // Function to check if the brand is active
        function isBrandActive(brand) {
            // Check if the provided brand is in the list of active brands
            return brands.some(activeBrand => activeBrand.name === brand);
        }
        const productIds = cartItems.map(item => item.prod_id);
        const productsData = await prod.find({ _id: { $in: productIds } }).populate('category');


        let redirectFlag = false;

        cartItems.forEach(cartItem => {
            const productData = productsData.find(p => p._id.equals(cartItem.prod_id));

            if (cartItem.qty > productData.stock) {

                redirectFlag = true;
                res.json({ flag: true, message: 'The quantity you selected exceeds the available stock.', title: 'Quantity Exceeds Stock' })

            }
            if (!productData.active) {
                redirectFlag = true;
                res.json({ flag: true, message: productData.name + ' are not currently active.', title: 'Product Not Available' });
            }

            if (!productData.category.active) {
                redirectFlag = true;
                res.json({ flag: true, message: productData.name + ' is from inactive category.', title: 'Product Not Available' });
            }


            if (!isBrandActive(productData.brand)) {
                redirectFlag = true;
                res.json({ flag: true, message: productData.name + ' is from inactive brand.', title: 'Product Not Available' });
            }

        });


        if (!redirectFlag) {
            // res.redirect('/checkout/payment')
            res.json({ success: true })
        }


    } catch (error) {
        console.log(error.message);
    }
};
const paymentView = async (req, res) => {
    try {
        const captcha = svgCaptcha.create();
        req.session.captcha = captcha.text;
        res.locals.captchaSvg = captcha.data;

        const userData = await user.findById(req.session.user).populate({
            path: 'cart.prod_id',
            model: 'productDetails',
            populate: {
                path: 'category',
                model: 'Category',
            },
        });

        const sum = userData.cart.reduce((sum, item) => sum + item.total_price, 0);
        const totalBill = await getTotalSum(userData._id);

        const couponDiscount = (userData.coupon.discount / 100) * sum


        if (userData.cart.length !== 0 && req.session.addr) {
            const cart = userData.cart;

            const keyId = process.env.RAZORPAY_ID_KEY

            res.render('users/payment', { totalBill, keyId, userData, cart, couponDiscount });

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

        const paymentModelSelect = req.body.radio

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
            let discount = (userData.coupon.discount / 100) * item.total_price;
            cartItems.push({
                productId: item.prod_id._id,
                productName: item.prod_id.name,
                price: item.prod_id.price,
                category: item.prod_id.category.name,
                image: item.prod_id.image[0],

                bill: item.total_price - discount,

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
        req.session.order = orderData;

        const productIds = carts.map(item => item.prod_id);


        const productsData = await prod.find({ _id: { $in: productIds } }).populate('category');
        const brands = await brand.find({ active: true });

        // Function to check if the brand is active
        function isBrandActive(brand) {
            // Check if the provided brand is in the list of active brands
            return brands.some(activeBrand => activeBrand.name === brand);
        }
        let redirectFlag = false;
        let message = '';
        let title = ''
        carts.forEach(cartItem => {

            const productData = productsData.find(p => p._id.equals(cartItem.prod_id._id));


            if (cartItem.qty > productData.stock) {
                redirectFlag = true;
                title = 'Quantity Exceeds Stock'
                message = 'The quantity you selected exceeds the available stock.'
            }
            if (!productData.active) {
                redirectFlag = true;
                message = productData.name + ' are not currently active.'
                title = 'Product Not Available'

            }

            if (!productData.category.active) {
                redirectFlag = true;
                message = productData.name + ' is from inactive category.',
                    title = 'Product Not Available'

            }
            if (!isBrandActive(productData.brand)) {
                redirectFlag = true;
                message = productData.name + ' is from inactive brand.',
                    title = 'Product Not Available'
            }


        });
        if (redirectFlag == true) {

            res.json({ flag: true, messages: message, title })
        }
        else {


            if (paymentModelSelect === "cod") {
                const userCaptcha = req.body.captcha; // Assuming the input field has the name "captcha"
                const storedCaptcha = req.session.captcha;

                if (userCaptcha !== storedCaptcha) {
                    console.log('invalid captch')
                    res.json({ captchaError: true });
                }
                else {
                    res.json({ cod: true })
                }


            }
            else if (paymentModelSelect === "online") {


                const totalBill = await getTotalSum(userData._id);

                var options = {
                    amount: totalBill * 100, // to smallest currency  paisa
                    currency: 'INR',
                };
                instance.orders.create(options, (err, order) => {
                    if (err) {

                        console.log(err);
                    } else {

                        res.json({ order, razorpay: true });
                    }
                });


            }
            else if (paymentModelSelect == 'wallet') {

                if (userData.wallet >= totalBill) {

                    await user.findByIdAndUpdate({ _id: userData._id }, {
                        $inc: { wallet: -totalBill }, $push: {
                            walletHistory: {
                                date: new Date(),
                                amount: totalBill,
                                status: "Debit",
                            },
                        },
                    });
                    res.json({ walletSuccess: true });
                }
                else {

                    res.json({ balance: true });

                }
            }
        }

        // await orders.save()
        // req.session.addr = false





        // if (!redirectFlag) {
        //     res.redirect('/orders-redirect')
        // }



    } catch (error) {
        console.log(error.message);
    }
};
const orderSuccessRedirect = async (req, res) => {
    try {
        const userData = await user.findById(req.session.user)


        const orders = req.session.order;


        orders.items.forEach((item) => {
            item.orderStatus = 'Processed';
        });


        const newOrder = new order(orders);
        const orderSaved = await newOrder.save();


        const updatedUser = await user.findOneAndUpdate(
            { _id: userData._id }, // Corrected to use userData._id
            { $set: { cart: [] } },
            { new: true }
        );

        userData.coupon = { code: null, discount: 0 };
        await userData.save();
        // res.status(200).json({ success: true, message: 'Order placed successfully.' });

        return res.redirect('/orders');
    } catch (error) {
        console.log('Error while handling the order success:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const razorpayRedirect = async (req, res) => {
    try {
        console.log('hello')
        const userData = await user.findById(req.session.user).populate({
            path: 'cart.prod_id',
            model: 'productDetails',
            populate: {
                path: 'category',
                model: 'Category',
            },
        });
        const totalBill = await getTotalSum(userData._id);

        var options = {
            amount: totalBill * 100, // to smallest currency  paisa
            currency: 'INR',
        };
        const order = await razorpayInstance.orders.create(options);
        return res.render('users/razorpay', { order, key_id: config.RsecretId, totalBill });

    } catch (error) {
        console.log(error.message);
    }
}
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
        console.log(data.length, 'heu')
        res.render('users/order2', { data, users })


    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};
const cancelOrder = async (req, res) => {
    try {

        const userData = req.session.user;
        const users = await user.findById(userData)

        const id = req.body.id;
        const paymode = req.body.paymode
        const refund = req.body.refund

        const orders = await order.findOne({
            user_id: users._id,
            'items._id': id
        })

        const selectedItem = orders.items.find(item => item._id.toString() == id);
        if (selectedItem.orderStatus !== "Delivered") {
            const result = await order.findOneAndUpdate(
                {
                    user_id: users._id,
                    'items._id': id,
                },
                {
                    $set: { 'items.$.orderStatus': 'Cancelled' },
                },
                { new: true }
            );

            if (!result) {
                return res.status(404).json({ error: 'Order or item not found' });
            }
            if (paymode === 'wallet' || paymode === 'online') {
                await user.findByIdAndUpdate({ _id: users._id }, {
                    $inc: { wallet: refund }, $push: {
                        walletHistory: {
                            date: new Date(),
                            amount: refund,
                            status: "Credit",
                        },
                    },
                });

            }
            // Uncomment the following block if you want to update product stock
            // const result2 = await prod.findOneAndUpdate(
            //   { _id: result.items[0].productId },
            //   { $inc: { stock: result.items[0].quantity } }
            // );
            // res.json(result2);

            res.json(result);
        }
        // Assuming you want to send the updated order details as the response
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal Server Error' }); // Adjust the status code and message accordingly
    }
};
const returnOrder = async (req, res) => {
    try {

        const userData = req.session.user;
        const users = await user.findById(userData)
        // const id = req.query.id;
        const id = req.body.id;
        const refund = req.body.refund
        const result = await order.findOneAndUpdate(
            {
                user_id: users._id,
                'items._id': id,
            },
            {
                $set: { 'items.$.orderStatus': 'Return initiated' },
            }
        );
        const orders = await order.findOne({
            user_id: users._id,
            'items._id': id
        })

        const selectedItem = orders.items.find(item => item._id.toString() == id);

        const result2 = await prod.findOneAndUpdate(
            { _id: selectedItem.productId },
            { $inc: { stock: selectedItem.quantity } }
        );
        await user.findByIdAndUpdate({ _id: users._id }, {
            $inc: { wallet: refund }, $push: {
                walletHistory: {
                    date: new Date(),
                    amount: refund,
                    status: "Credit",
                },
            },
        });
        res.redirect('/orders?user=true');
    } catch (error) {
        console.log(error.message);
    }
};

const invoice = async (req, res) => {
    try {
        const orderId = req.query.order_id


        const orders = await order.findById(orderId);

        if (!orders) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // const item = orders.items.find((item) => item._id.equals(itemId));


        const productIds = orders.items.map(itme => itme.productId)

        const productsData = await prod.find({ _id: { $in: productIds } });

        let totalDiscount = 0;
        const ddd = orders.items.reduce((total, item) => {
            return total + (item.price * item.quantity)
        }, 0)
        const abc = ddd - orders.orderBill
        console.log("discount", abc)
        dis = (abc / ddd) * 100


        const address = orders.address;
        const date = helper.formatDate(orders.orderDate);

        const data = {
            images: {
                logo: "https://upload.wikimedia.org/wikipedia/commons/6/64/Seeker_Media_Logo.png",
            },
            sender: {
                company: 'ShopSeeker',
                address: 'HustleHub Techpark',
                city: 'mumbai',
                country: 'maharahtra',
            },
            client: {
                company: address.name,
                address: address.address,
                zip: address.pincode,
                city: address.district,
                country: address.state,
            },
            information: {
                number: 'REF#' + orders._id,
                date,
                'due-date': orders.paymentMode,
            },
            // products: [
            //     {
            //         quantity: item.quantity,
            //         description: item.productName,
            //         'tax-rate': 0,
            //         price: item.price,
            //     },
            // ],

            products: orders.items.map(item => ({
                quantity: item.quantity,
                description: item.productName,
                'tax-rate': -dis,

                price: item.price,
            })),

            'bottom-notice': 'Thank you for shopping with us',
            settings: {
                currency: 'INR',

            },
            translate: {
                'due-date': 'Payment',
                vat: 'discount',
            },
        };

        res.json(data);
        console.log("this is the pdf data" + data)
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

// const applyCoupon = async (req, res) => {
//     try {
//         console.log("ehmmo ajdjdjdjsj")
//         const code = req.body.coupon;
//         const bill = req.body.bill;
//         console.log("code=", code, "bill=", bill)
//         const couponFound = await Coupon.findOne({ code });
//         if (couponFound) {
//             if (couponFound.Status === 'Active') {
//                 const coupDate = new Date(couponFound.expiryDate);
//                 const currDate = new Date();
//                 const status = currDate.getTime() > coupDate.getTime() ? 'Expired' : 'Active';

//                 await Coupon.findOneAndUpdate({ code }, { $set: { Status: status } });

//                 const Vcoupon = await Coupon.findOne({ code }); // Extra validation

//                 if (Vcoupon.minBill < bill) {
//                     req.session.appliedCoupon = Vcoupon;
//                     const deduction = (bill * Vcoupon.value) / 100;
//                     let final;
//                     if (Vcoupon.maxAmount > deduction) {
//                         final = bill - (bill * Vcoupon.value) / 100;
//                     } else {
//                         final = bill - Vcoupon.maxAmount;
//                     }

//                     req.session.orderBill = final;
//                 }
//                 res.json(couponFound);
//             } else {
//                 res.json(couponFound);
//             }
//         } else {
//             res.json(307);
//         }
//     } catch (error) {
//         console.log(error.message);
//     }
// };

const orderSuccess = async (res, req) => {
    try {
        res.render('users/orderSuccess');
    } catch (error) {
        console.log(error.message);
    }
};
module.exports = { ordersView, orderSuccess, checkOutView, checkOutPost, paymentView, paymentPost, cancelOrder, orderSuccessRedirect, returnOrder, invoice, razorpayRedirect, }