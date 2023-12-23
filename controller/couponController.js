const Coupon = require('../models/couponModel')

exports.applyCoupon  = async (req, res) => {


    const toalcopen = await Coupon.find({}, { code: 1 })

    const { cartId, totalBill, couponCode } = req.body;

    try {


        // Use case-insensitive comparison
        const coupon = await Coupon.findOne({ code: { $regex: new RegExp('^' + couponCode + '$', 'i') } });


        if (!coupon || coupon.Status !== 'Active') {
            console.log('Invalid coupon code:', couponCode);
            return res.json({ success: false, message: 'Invalid coupon code' });
        }


        const discount = calculateDiscount(totalBill, coupon);
        req.session.coupdis = discount
        console.log("discount", discount)
        res.json({ success: true, discount });
        req.session.coup = true
        console.log('coupon added sucess')
    } catch (error) {
        console.error('Error applying coupon:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


function calculateDiscount(totalBill, coupon) {

    if (totalBill >= coupon.minBill) {
        return (coupon.value / 100) * totalBill;
    } else {
        return 0;
    }
}