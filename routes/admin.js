var express = require('express');
var router = express.Router();
const adminControl = require("../controller/adminController")
const couponControl=require("../controller/couponController")
const upload = require("../middlewares/multer")
const auth = require('../middlewares/auth')
const dashboardControl=require('../controller/dashboardController')



router.get('/admin/chart', auth.adminLoggedIn, dashboardControl.chart)
router.get('/admin/dashboard', auth.adminLoggedIn,   dashboardControl.dashboardView)
router.get('/admin/dashboard/report', auth.adminLoggedIn, dashboardControl.orderReport)
router.get('/admin/exportExcel', auth.adminLoggedIn, dashboardControl.orderExcel)
router.post('/admin/orderSearch', auth.adminLoggedIn, dashboardControl.orderSearch)


// /* GET home page. */
router.get('/admin',auth.adminLogout, adminControl.adminLogin)
router.post('/admin' ,adminControl.adminLoginPost)
 router.get('/admin/logout',auth.adminLoggedIn,  adminControl.adminLogout)
router.get('/admin/products', auth.adminLoggedIn, adminControl.productsView)
router.get('/admin/category', auth.adminLoggedIn,  adminControl.categoryView)
router.get('/admin/category/add',auth.adminLoggedIn, adminControl.categoryAdd)
router.post('/admin/category/add',  adminControl.addCategoryPost)
router.patch('/admin/category/active',  adminControl.categoryActive)
router.patch('/admin/category/deactive',  adminControl.categoryDeactive)
router.get('/admin/category/edit/:id',auth.adminLoggedIn,  adminControl.categoryEditLoad)
router.post('/admin/category/update/:id', adminControl.categoryEditPost)

//brand
router.get('/admin/brand',auth.adminLoggedIn,  adminControl.brandView)
router.get('/admin/brand/add',auth.adminLoggedIn,  adminControl.brandAdd)
router.post('/admin/brand/add',  adminControl.addBrandPost)
router.patch('/admin/brand/active',  adminControl.brandActive)
router.patch('/admin/brand/deactive',  adminControl.brandDeactive)
router.get('/admin/brand/edit/:id',auth.adminLoggedIn,  adminControl.brandEditLoad)
router.post('/admin/brand/update/:id',  adminControl.brandEditPost)


router.get('/admin/products/add',auth.adminLoggedIn, adminControl.addProduct)
router.post('/admin/products/add', upload.array('image'), adminControl.addProductpost)
router.patch('/admin/products/active', adminControl.productActive);
router.patch('/admin/products/deactive', adminControl.productDeactive);
router.get('/admin/products/edit/:id', auth.adminLoggedIn, adminControl.productEdit);

router.post('/admin/products/update/:id',  upload.array('image'), adminControl.productUpdate);
router.get('/admin/products/details/:id', auth.adminLoggedIn, adminControl.productDetails);
router.get('/admin/products/image/edit/:id',auth.adminLoggedIn,  adminControl.imageEdit);

router.get('/admin/customer',auth.adminLoggedIn,  adminControl.userManagement)



router.patch('/admin/customer/block-user', adminControl.blockUser)
router.patch('/admin/customer/unblock-user', adminControl.unblockUser)

router.patch('/admin/products/crop/:productId', adminControl.imageCrop)


// router.get('/admin/delete-user',adminControl.deleteUser)


router.get('/admin/order',auth.adminLoggedIn,  adminControl.orderManagement)
router.get('/admin/order/status',auth.adminLoggedIn,  adminControl.orderStatusLoad)
router.post('/admin/order/status',auth.adminLoggedIn,  adminControl.editOrderStatus)





router.get('/admin/banner', auth.adminLoggedIn, adminControl.bannerLoad)
router.post('/admin/banner/add', auth.adminLoggedIn, upload.single('image'), adminControl.bannerAdd)
router.get('/admin/banner/edit/:id', auth.adminLoggedIn, adminControl.bannerEditLoad)
router.post('/admin/banner/update/:id', auth.adminLoggedIn, upload.single('image'), adminControl.bannerUpdate)
router.patch('/admin/banner/disable', auth.adminLoggedIn, adminControl.bannerDisable)
router.patch('/admin/banner/enable', auth.adminLoggedIn, adminControl.bannerEnable)


router.get('/admin/coupons',auth.adminLoggedIn,couponControl.couponLoad)
router.post('/admin/coupons/add',auth.adminLoggedIn,couponControl.addCoupon)
router.get('/admin/coupons/edit/:id',auth.adminLoggedIn,couponControl.couponEditLoad)
router.post('/admin/coupons/update/:id',auth.adminLoggedIn,couponControl.updateCoupon)
router.patch('/admin/coupons/activate',auth.adminLoggedIn,couponControl.enableCoupon)
router.patch('/admin/coupons/deactivate',auth.adminLoggedIn,couponControl.disableCoupon)

module.exports = router;