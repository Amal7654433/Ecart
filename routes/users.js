var express = require('express');
var router = express.Router();
const userControl = require("../controller/userController")
const auth=require('../middlewares/auth')
const cartControl=require("../controller/cartController")
const profileControl=require("../controller/profileController")
const orderControl=require("../controller/orderController")
const walletControl=require("../controller/walletController")
/* GET users listing. */
router.get('/home',auth.emailTempClear,userControl.productsPage)
router.get('/',auth.emailTempClear,userControl.productsPage)
// router.get('/category',userControl.categoryView)


/* signup section */
router.get('/signup',auth.emailTempClear,auth.userLogout,userControl.loadSignup)
router.post('/signup',userControl.subSignup)




/* login section */
router.get('/login',auth.emailTempClear,auth.userLogout,userControl.loadLogin)
router.post('/login',userControl.verifyLogin)
router.get('/verify',auth.userLogout,userControl.verifyMail)
router.get('/logout',userControl.userLogout)
// router.get('/blocked',userControl.userBlock)

router.get('/products',auth.emailTempClear,userControl.productsPage)
router.get('/products/view/:productId',auth.emailTempClear,userControl.productsView)
router.get('/products/category/:categoryId',auth.emailTempClear,userControl.productsByCategory)

// router.get('/products/view',userControl.productsView)

router.get('/forgetpassword',auth.userLogout,auth.emailTempClear,userControl.forgetPasswordEmail)
router.post('/forgetpassword',userControl.submitEmailForPasswordReset)
router.get('/forgetpassword/otp',auth.OtpAccess,auth.userLogout,userControl.verifyOtpGet)
router.post('/forgetpassword/otp',userControl.verifyOtp)
router.get('/forgetpassword/resetpassword',auth.OtpAccess,auth.resetpAccess,auth.userLogout,userControl.resetPassword)
router.post('/forgetpassword/resetpassword',userControl.verifyPassword)
router.get('/deactivate-user',auth.userLoggedIn,userControl.deactivateAccount)
// router.post('/forgetpassword',userControl.forgetVerify)
// router.get('/resetpassword',userControl.resetPasswordLoad)
// router.post('/resetpassword',userControl.resetPassword)

router.get('/cart',auth.userLoggedIn,cartControl.cartView)
router.patch('/addtocart/:id',auth.userLoggedIn,cartControl.addToCart)
router.patch('/cart/update-quantity',auth.userLoggedIn,cartControl.updateQty)
router.delete('/cart/remove/:id',cartControl. removeFromCart);


// profile routes
router.get('/profile',auth.userLoggedIn,profileControl.profileView)
// router.get('/profile/editprofile',auth.userLoggedIn,profileControl.profileEdit)
// router.post('/profile/editprofile',auth.userLoggedIn,profileControl.editProfilePost)
 router.get('/profile/address',auth.userLoggedIn,profileControl.addAddressView)
 router.post('/profile/address',auth.userLoggedIn,profileControl.addAddressPost)
 router.delete('/profile/address/remove/:addressId',auth.userLoggedIn,profileControl.removeAddress)
 router.get('/profile/address/edit/:id',auth.userLoggedIn,profileControl.updateAddressView)
 router.post('/profile/address/update/:id',auth.userLoggedIn,profileControl.updateAddressPost)
 router.get('/profile/name/edit',auth.userLoggedIn,profileControl.profileNameEdit)
 router.get('/profile/email/edit',auth.userLoggedIn,profileControl.profileEmailEdit)
 router.get('/profile/phone/edit',auth.userLoggedIn,profileControl.profilePhoneEdit)
 router.post('/profile/username/update',auth.userLoggedIn,profileControl.updateUserName)
 router.post('/profile/phone/update',auth.userLoggedIn,profileControl.updateUserPhone)
 router.post('/profile/email/update',auth.userLoggedIn,profileControl.updateUserEmail)



 //order routes
 router.get('/checkout',auth.userLoggedIn,orderControl.checkOutView)

 router.post('/checkout',auth.userLoggedIn,orderControl.checkOutPost)
 router.get('/checkout/payment',auth.userLoggedIn,orderControl.paymentView)
 router.post('/checkout/payment',auth.userLoggedIn,orderControl.paymentPost)
 router.get('/orders-redirect',auth.userLoggedIn,orderControl.orderSuccessRedirect)
 router.get('/orders',auth.userLoggedIn,orderControl.ordersView)
 router.post('/cancel-order',auth.userLoggedIn,orderControl.cancelOrder)
 router.post('/return-order',auth.userLoggedIn,orderControl.returnOrder)
 router.get('/invoice',auth.userLoggedIn,orderControl.invoice)
 router.get('/wallet',auth.userLoggedIn,walletControl.wallet)


module.exports = router;
