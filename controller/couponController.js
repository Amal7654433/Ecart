const Coupon = require('../models/couponModel')
const user = require('../models/userSignup');
const dateConvert = require('../helpers/dateHelper')
const crypto = require('crypto');
// admin side implementaions

exports.couponLoad = async (req, res) => {
    try {
        const formatDate = dateConvert.formatDate
        const coupon = await Coupon.find().sort({ _id: -1 });


        return res.render('admin/coupon2', { formatDate, coupon, });

    } catch (error) {
        console.log(error.message);
    }
}

exports.addCoupon = async (req, res) => {
    try {

        const { couponName, value, minBill, maxAmount, expiryDate } = req.body;
        let isUnique = false;
        let randomString;

        while (!isUnique) {
            randomString = crypto.randomBytes(3).toString('hex');

            const existingCoupon = await Coupon.findOne({ code: randomString });

            if (!existingCoupon) {
                isUnique = true;
            }
        }
        // Create a new coupon instance
        const newCoupon = new Coupon({
            couponName,
            code: randomString,
            value,
            minBill,
            maxAmount,
            expiryDate,
        });


        const savedCoupon = await newCoupon.save();
        res.redirect('/admin/coupons')

        // res.status(201).json({ success: true, message: 'Coupon added successfully', coupon: savedCoupon });
    } catch (error) {
        console.error('Error adding coupon:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
exports.couponEditLoad = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        const formatDate = dateConvert.formatDate
        if (!coupon) {
            // Handle case where the banner with the provided ID is not found
            return res.status(404).send('coupon not found');
        }

        res.render('admin/couponEdit', { coupon, formatDate });
    } catch (error) {
        console.error('Error fetching coupon for editing:', error);
        res.status(500).send('Internal Server Error');
    }
}
exports.updateCoupon = async (req, res) => {
    try {

        const { couponName, value, minBill, maxAmount, expiryDate } = req.body;
        const couponId = req.params.id;
        const existingCoupon = await Coupon.findById(couponId);

        if (!existingCoupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }

        existingCoupon.couponName = couponName;
        existingCoupon.value = value;
        existingCoupon.minBill = minBill;
        existingCoupon.maxAmount = maxAmount;
        existingCoupon.expiryDate = expiryDate;


        const updatedCoupon = await existingCoupon.save();
        res.redirect('/admin/coupons')

        // res.status(200).json({ success: true, message: 'Coupon updated successfully', coupon: updatedCoupon });
    } catch (error) {
        console.error('Error updating coupon:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
exports.enableCoupon = async (req, res) => {
    try {
        const coupon = req.body.id
        const CouponDetails = await Coupon.findById(coupon);
        await Coupon.updateOne({ _id: coupon }, { $set: { active: true } })


        res.sendStatus(200)
    } catch (error) {
        console.log(error.message);
        res.render('error')
    }
}
exports.disableCoupon = async (req, res) => {
    try {
        const coupon = req.body.id
        const CouponDetails = await Coupon.findById(coupon);
        await Coupon.updateOne({ _id: coupon }, { $set: { active: false } })


        res.sendStatus(200)
    } catch (error) {
        console.log(error.message);
        res.render('error')
    }
}

// user side implementaions
exports.applyCoupon = async (req, res) => {

    try {
        const couponCode = req.body.couponCode
        const coupon = await Coupon.findOne({ code: couponCode });
        const userData = await user.findById(req.session.user)


        const cart = userData.cart;
        const sum = cart.reduce((sum, item) => sum + item.total_price, 0);
        const currentDate = new Date();

        if (!coupon || !coupon.active || sum < coupon.minBill || sum > coupon.maxAmount || coupon.code !== couponCode || coupon.expiryDate < currentDate) {
            console.log('Invalid coupon code:', couponCode);
            return res.json({ success: false, message: 'Invalid coupon code' });
        }
        else if (coupon.usedUsers.includes(userData._id)) {
            console.log('Coupon already applied by this user');
            return res.json({ used: true, message: 'Coupon already applied by this user' });
        }
        else {
            await Coupon.findByIdAndUpdate(coupon._id, { $addToSet: { usedUsers: userData._id } });
            userData.coupon = {
                code: couponCode,
                discount: coupon.value,
            };
            await userData.save();

            res.json({ success: true, message: 'Coupon applied successfully' });

        }

    } catch (error) {
        console.error('Error applying coupon:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};



exports.removeCoupon = async (req, res) => {
    try {
        const userData = await user.findById(req.session.user);

        // Reset user's coupon field (setting the default discount to zero)
        const removedCouponCode = userData.coupon.code;
        userData.coupon = { code: null, discount: 0 };
        await userData.save();

        if (removedCouponCode) {
            await Coupon.updateOne({ code: removedCouponCode }, { $pull: { usedUsers: userData._id } });
        }

        res.json({ success: true, message: 'Coupon removed successfully' });
    } catch (error) {
        console.error('Error removing coupon:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
