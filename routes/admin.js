var express = require('express');
var router = express.Router();
const adminControl = require("../controller/adminController")
const upload = require("../middlewares/multer")
const auth = require('../middlewares/auth')

// /* GET home page. */
router.get('/admin',auth.adminLogout, adminControl.adminLogin)
router.post('/admin',auth.adminLogout ,adminControl.adminLoginPost)
 router.get('/admin/logout',auth.adminLoggedIn,  adminControl.adminLogout)
router.get('/admin/products', auth.adminLoggedIn, adminControl.productsView)
router.get('/admin/category', auth.adminLoggedIn,  adminControl.categoryView)
router.get('/admin/category/add',auth.adminLoggedIn, adminControl.categoryAdd)
router.post('/admin/category/add',  adminControl.addCategoryPost)
router.post('/admin/category/active',  adminControl.categoryActive)
router.post('/admin/category/deactive',  adminControl.categoryDeactive)
router.get('/admin/category/edit/:id',auth.adminLoggedIn,  adminControl.categoryEditLoad)
router.post('/admin/category/update/:id', adminControl.categoryEditPost)

//brand
router.get('/admin/brand',auth.adminLoggedIn,  adminControl.brandView)
router.get('/admin/brand/add',auth.adminLoggedIn,  adminControl.brandAdd)
router.post('/admin/brand/add',  adminControl.addBrandPost)
router.post('/admin/brand/active',  adminControl.brandActive)
router.post('/admin/brand/deactive',  adminControl.brandDeactive)
router.get('/admin/brand/edit/:id',auth.adminLoggedIn,  adminControl.brandEditLoad)
router.post('/admin/brand/update/:id',  adminControl.brandEditPost)


router.get('/admin/products/add',auth.adminLoggedIn, adminControl.addProduct)
router.post('/admin/products/add', upload.array('image'), adminControl.addProductpost)
router.post('/admin/products/active', adminControl.productActive);
router.post('/admin/products/deactive', adminControl.productDeactive);
router.get('/admin/products/edit/:id', auth.adminLoggedIn, adminControl.productEdit);

router.post('/admin/products/update/:id',  upload.array('image'), adminControl.productUpdate);
router.get('/admin/products/details/:id', auth.adminLoggedIn, adminControl.productDetails);
router.get('/admin/products/image/edit/:id',auth.adminLoggedIn,  adminControl.imageEdit);

router.get('/admin/dashboard', auth.adminLoggedIn,   adminControl.dashboardView)
router.get('/admin/customer',auth.adminLoggedIn,  adminControl.userManagement)

router.post('/admin/customer/block-user', adminControl.blockUser)
router.post('/admin/customer/unblock-user', adminControl.unblockUser)
router.get('/admin/products/crop/:productId/:imageIndex', adminControl.imageCrop)


// router.get('/admin/delete-user',adminControl.deleteUser)


router.get('/admin/order',auth.adminLoggedIn,  adminControl.orderManagement)
router.get('/admin/order/status',auth.adminLoggedIn,  adminControl.orderStatusLoad)
router.post('/admin/order/status',auth.adminLoggedIn,  adminControl.editOrderStatus)



module.exports = router;