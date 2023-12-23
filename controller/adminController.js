const Admin = require('../models/adminLogin');
const user = require('../models/userSignup');
const bcrypt = require('bcrypt');
const prod = require('../models/adminProducts');
const multer = require("../middlewares/multer");
const brand = require('../models/brandsModel');
const sharp = require('sharp');
const fs = require('fs');
const excelJs = require('exceljs');
const order = require('../models/orderModel');
const catego = require('../models/categoryModel')
const Coupon = require('../models/couponModel')
const Banner = require('../models/bannerModel');
const moment = require('moment');


const salesReport= async (req, res) => {
  try {
    // Aggregate total revenue per month
    const revenueData = await order.aggregate([
      {
        $group: {
          _id: { $month: '$orderDate' },
          totalRevenue: { $sum: { $toDouble: '$orderBill' } },
        },
      },
    ]);

    // Extract month names and revenue values
    const months = revenueData.map(entry => moment().month(entry._id - 1).format('MMMM')); // Format month names
    const revenues = revenueData.map(entry => entry.totalRevenue);

    // Render the sales page with chart data
    res.render('admin/sales', { months, revenues });
  } catch (error) {
    console.error('Error fetching sales data:', error);
    res.status(500).send('Internal Server Error');
  }
}
const categoryEditLoad = async (req, res) => {
  try {
    // Find the brand by ID in the database
    const cat = await catego.findById(req.params.id);

    if (cat) {
      res.render('admin/editCategory', { cat }); // Render the edit brand page
    } else {
      res.status(404).send('Brand not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error while editing brand');
  }
}
const categoryEditPost = async (req, res) => {
  try {
    // Find the brand by ID in the database
    const cat = await catego.findById(req.params.id);

    if (!cat) {
      return res.status(404).send('Brand not found');
    }
    // const brandWithUpdatedName = await catego.findOne({ name: req.body.name });
    const brandWithUpdatedName = await catego.findOne(
      { name: { $regex: new RegExp(req.body.name, 'i') } }
    );

    if (brandWithUpdatedName && brandWithUpdatedName._id.toString() !== req.params.id) {
      return res.status(400).render('admin/editCategory', { message: 'category name is already in use', cat });
    }
    // Update brand information based on form data
    cat.name = req.body.name;
    cat.description = req.body.description;

    // Save the updated brand
    const updatedBrand = await cat.save();

    if (updatedBrand) {
      res.redirect('/admin/category'); // Redirect to the brand listing page
    } else {
      res.status(500).send('Error while updating brand');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error while updating brand');
  }
}


//category management
const brandView = async (req, res) => {
  try {

    const brands = await brand.find()
    if (brands) {
      res.render('admin/brands', { brands });
    }
    else {
      throw new Error('error while fetching brands from database');
    }

  } catch (error) {
    console.log(error.message);
  }
};
const brandAdd
  = async (req, res) => {
    try {
      res.render('admin/brandAdd');
    } catch (error) {
      console.log(error.message);
    }
  };
const addBrandPost = async (req, res) => {
  console.log(req.body)
  try {
    // const existingBrand = await brand.findOne(
    //   { name: req.body.name }
    // );
    const existingBrand = await brand.findOne(
      { name: { $regex: new RegExp(req.body.name, 'i') } }
    );


    if (existingBrand) {
      // User with the same email or phone number already exists
      return res.render('admin/brandAdd', {
        message: 'brand name already in use. Please try another one.',

      });
    }

    const c = new brand({
      name: req.body.name,
      description: req.body.description




    })
    console.log(c)
    const result = await c.save()
    if (result) {
      res.redirect('/admin/brand')
    }

  } catch (error) {
    console.log(error.message);
  }
};
const brandActive = async (req, res) => {
  try {
    const brands = req.body.id
    const brandDetails = await brand.findById(brands);
    await brand.updateOne({ _id: brands }, { $set: { active: true } })


    res.sendStatus(200)
  } catch (error) {
    console.log(error.message);
    res.render('error')
  }
}
const brandDeactive = async (req, res) => {
  try {
    const brands = req.body.id
    const brandDetails = await brand.findById(brands);


    await brand.updateOne({ _id: brands }, { $set: { active: false } })
    // await prod.updateMany({ brand: brandDetails.name }, { $set: { active: false } })

    res.sendStatus(200)
  } catch (error) {
    console.log(error.message);
    res.render('error')
  }
}
const brandEditLoad = async (req, res) => {
  try {
    // Find the brand by ID in the database
    const brands = await brand.findById(req.params.id);

    if (brands) {
      res.render('admin/editBrand', { brands }); // Render the edit brand page
    } else {
      res.status(404).send('Brand not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error while editing brand');
  }
}
const brandEditPost = async (req, res) => {
  try {
    // Find the brand by ID in the database
    const brands = await brand.findById(req.params.id);

    if (!brands) {
      return res.status(404).send('Brand not found');
    }
    // const brandWithUpdatedName = await brand.findOne({ name: req.body.name });
    const brandWithUpdatedName = await brand.findOne(
      { name: { $regex: new RegExp(req.body.name, 'i') } }
    );

    if (brandWithUpdatedName && brandWithUpdatedName._id.toString() !== req.params.id) {
      return res.status(400).render('admin/editBrand', { message: 'Brand name is already in use', brands });
    }

    // Update brand information based on form data
    brands.name = req.body.name;
    brands.description = req.body.description;

    // Save the updated brand
    const updatedBrand = await brands.save();

    if (updatedBrand) {
      res.redirect('/admin/brand'); // Redirect to the brand listing page
    } else {
      res.status(500).send('Error while updating brand');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error while updating brand');
  }
}

const categoryView = async (req, res) => {
  try {
    const count = await catego.find().estimatedDocumentCount()
    console.log(count)
    const cat = await catego.find()
    if (cat) {
      res.render('admin/categoriesList', { cat, count });
    }
    else {
      throw new Error('error while fetching products from database');
    }

  } catch (error) {
    console.log(error.message);
  }
};

const categoryAdd = async (req, res) => {
  try {
    res.render('admin/addCategory');
  } catch (error) {
    console.log(error.message);
  }
};
const addCategoryPost = async (req, res) => {
  console.log(req.body)
  try {
    // const existingCategory = await catego.findOne(
    //   { name: req.body.name }
    // );
    const existingCategory = await catego.findOne(
      { name: { $regex: new RegExp(req.body.name, 'i') } }
    );

    if (existingCategory) {
      // User with the same email or phone number already exists
      return res.render('admin/addCategory', {
        message: 'category name already in use. Please try another one.',

      });
    }

    const c = new catego({
      name: req.body.name,
      description: req.body.description




    })
    console.log(c)
    const result = await c.save()
    if (result) {
      res.redirect('/admin/category')
    }

  } catch (error) {
    console.log(error.message);
  }
};


const adminLogin = async (req, res) => {
  try {
    res.render('admin/adminLogin');
  } catch (error) {
    console.log(error.message);
  }
};
const adminLoginPost = async (req, res) => {
  const { email, password } = req.body;
  console.log(email);
  console.log(password);
  try {
    const adminData = await Admin.findOne({ email, password });
    if (adminData) {
      req.session.admin = adminData._id
      res.redirect('/admin/dashboard');
    } else {

      res.render('admin/adminLogin', { message: 'wrong credentials' });
    }
  } catch (error) {
    console.log(error.message);
  }
}



// const
//   productsView = async (req, res) => {
//     try {
//       const products = await prod.find()
//       const cat = await catego.find({ active: true })
//       const brands = await brand.find({ active: true });

//       if (products) {

//         res.render('admin/products', { products, cat });
//       } else {
//         throw new Error('error while fetching products from database');
//       }
//     } catch (error) {
//       console.log(error.message);
//     }
//   };
// const productsView = async (req, res) => {
//   try {
//     // Fetch active categories
//     const activeCategories = await catego.find({ active: true });

//     if (activeCategories) {
//       // Get the IDs of active categories
//       const activeCategoryIds = activeCategories.map((category) => category.name);
//       console.log(activeCategoryIds)

//       // Fetch products that belong to active categories
//       const products = await prod.find({ category: { $in: activeCategoryIds } });
//       console.log(products)

//       res.render('admin/products', { products, activeCategories });
//     } else {
//       throw new Error('Error while fetching active categories from the database');
//     }
//   } catch (error) {
//     console.log(error.message);
//   }
// };
const productsView = async (req, res) => {
  try {

    const activeCategories = await catego.find({ active: true });


    const activeBrands = await brand.find({ active: true });

    // Find products that belong to active categories and brands
    const products = await prod.find({
      category: { $in: activeCategories.map(category => category._id) },
      brand: { $in: activeBrands.map(brand => brand.name) },

    }).populate('category');

    if (products) {
      res.render('admin/products', { products, activeCategories, activeBrands });
    } else {
      throw new Error('Error while fetching products from the database');
    }
  } catch (error) {
    console.log(error.message);
  }
};




const addProduct = async (req, res) => {
  try {
    const brands = await brand.find({ active: true })
    const categories = await catego.find({ active: true })
    res.render('admin/addProduct', { categories, brands });
  } catch (error) {
    console.log(error.message);
  }
};
const
  addProductpost = async (req, res) => {
    try {
      const brands = await brand.find({ active: true })
      const categories = await catego.find({ active: true })
      const existingProduct = await prod.findOne(
        { name: req.body.name }
      );

      if (existingProduct) {
        // User with the same email or phone number already exists
        return res.render('admin/addProduct', {
          message: 'product  name already in use. Please try another one.', categories, brands

        });
      }
      const selectedCategoryName = req.body.category;
      const selectedCategory = await catego.findOne({ name: selectedCategoryName });
      console.log(selectedCategoryName)
      if (!selectedCategory) {
        // Handle the case where the selected category does not exist
        // For example, you might render an error message.
        return res.render('admin/addProduct', {
          message: 'Selected category does not exist. Please choose a valid category.',
          categories,
          brands,
        });
      }
      const images = req.files.map((file) => file.filename);
      const c = new prod({
        name: req.body.name,
        category: selectedCategory._id,

        brand: req.body.brand,
        stock: req.body.stock,
        price: req.body.price,

        discount: req.body.discount,
        details: req.body.details,
        image: images,



      })
      const result = await c.save()
      console.log(result.image)
      if (result) {
        res.redirect('/admin/products')
      }

    } catch (error) {
      console.log(error.message);
    }
  };
const productDetails = async (req, res) => {
  try {
    const products = await prod.findById(req.params.id).populate('category');;
    if (products) {
      res.render('admin/productDetailView', { products });
    } else {
      res.status(404).send('products not found');
    }
  } catch (error) {
    console.log(error.message);
  }
};
const productEdit = async (req, res) => {
  try {
    // Find the brand by ID in the database
    const products = await prod.findById(req.params.id).populate('category');
    const brands = await brand.find({ active: true })
    const categories = await catego.find({ active: true })




    if (products) {
      res.render('admin/editProduct', { products, brands, categories }); // Render the edit brand page
    } else {
      res.status(404).send('products not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error while editing brand');
  }
}
const productUpdate = async (req, res) => {
  try {
    // Find the brand by ID in the database
    const products = await prod.findById(req.params.id);
    const brands = await brand.find({ active: true })
    const categories = await catego.find({ active: true })


    if (!products) {
      return res.status(404).send('Brand not found');
    }
    const brandWithUpdatedName = await prod.findOne({ name: req.body.name });

    if (brandWithUpdatedName && brandWithUpdatedName._id.toString() !== req.params.id) {
      return res.status(400).render('admin/editProduct', { message: 'product name is already in use', products, categories, brands });
    }
  
    const selectedCategoryName = req.body.category;
    const selectedCategory = await catego.findOne({ name: selectedCategoryName });
    console.log(selectedCategoryName)
   
    // const images =  req.files.map((file) => file.filename);
    if (req.files && req.files.length > 0) {
      const images = req.files.map((file) => file.filename);
      products.image = images;
    }

    products.name = req.body.name;


    products.category._id = selectedCategoryName._id

    products.brand = req.body.brand
    products.stock = req.body.stock

    products.price = req.body.price

    products.discount = req.body.discount
    products.details = req.body.details

  





    // Save the updated brand
    const updatedBrand = await products.save();
    console.log(updatedBrand.image)
    if (updatedBrand) {
      res.redirect('/admin/products'); // Redirect to the brand listing page after the update
    } else {
      res.status(500).send('Error while updating product');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error while updating product');
  }
}




const securePassword = async (password) => {
  const spassword = await bcrypt.hash(password, 10)
  return spassword
}
// const loginPost=async (req, res) => {
//   try {
//     // const {name,email,password}=req.body
//     const cpassword = await securePassword(req.body.password)
//     const b = new login({

//       email: req.body.email,
//       password: cpassword

//     })
//     const result = await b.save()
//    console.log(req.body)
//     res.render('admin/adminLogin', { message: 'success' })

//   } catch (error) {
//     res.send(error.message)
//   }

// }
const customerView = async (req, res) => {
  try {
    res.render('admin/customer');
  } catch (error) {
    console.log(error.message);
  }
};
const dashboardView = async (req, res) => {
  try {
    const months = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];


    const orders = await order.find({});
    orders.forEach((order) => {
      const month = monthNames[order.orderDate.getMonth()];
      if (!months[month]) {
        months[month] = 0;
      }
      months[month]++;

    });

    console.log("hello monthes", months)

    const paymentModeStats = await order.aggregate([
      {
        $group: { _id: '$paymentMode', count: { $sum: 1 } },
      },
    ]);

    const orderCount = await order.find({ __v: 0 }).count();
    const userCount = await user.find().count();

    const orderSum = await order.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.orderStatus': 'Delivered' } },
      { $group: { _id: null, totalBill: { $sum: '$items.bill' } } },
    ]);
    const quantitySum = await order.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.orderStatus': 'Delivered' } },
      { $group: { _id: null, totalProducts: { $sum: '$items.quantity' } } },
    ]);



    res.render('admin/dashboard', {
      months,
      data: JSON.stringify(paymentModeStats),
      totalBill: orderSum[0].totalBill,
      orderCount,
      userCount,
      totalQuantity: quantitySum[0].totalProducts,

    });


  } catch (error) {
    console.log(error.message);
  }
};
const orderReport = async (req, res) => {
  try {
    req.session.filterDate = false;
    const formatDate = function (date) {
      const day = ('0' + date.getDate()).slice(-2);
      const month = ('0' + (date.getMonth() + 1)).slice(-2);
      const year = date.getFullYear().toString();
      return `${day}-${month}-${year}`;
    };
    const orders = await order.find({ 'items.orderStatus': 'Delivered' });
    res.render('admin/reports', { orders, formatDate });
  } catch (error) {
    console.log(error.message);
  }
}
const orderExcel = async (req, res) => {
  try {
    let salesReport;
    if (req.session.filterDate) {
      const from = req.session.from;
      const to = req.session.to;
      salesReport = await order.find({
        'items.orderStatus': 'Delivered',
        orderDate: { $gte: from, $lte: to },
      });
    } else {
      salesReport = await order.find({ 'items.orderStatus': 'Delivered' });
    }
    const workbook = new excelJs.Workbook();
    const worksheet = workbook.addWorksheet('sales Report');
    worksheet.columns = [
      {
        header: 'S no.',
        key: 's_no',
        width: 10,
      },
      { header: 'OrderID', key: '_id', width: 30 },
      { header: 'Date', key: 'orderDate', width: 20 },
      { header: 'Products', key: 'ProductName', width: 30 },
      { header: 'Method', key: 'paymentMode', width: 10 },
      { header: 'Amount', key: 'orderBill' },
    ];
    let counter = 1;
    salesReport.forEach((report) => {
      report.s_no = counter;
      report.ProductName = '';
      report.items.forEach((eachProduct) => {
        report.ProductName += eachProduct.productName + ',';
      });
      worksheet.addRow(report);
      counter++;
    });
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
    res.header('Content-Type', 'application/vnd.oppenxmlformats-officedocument.spreadsheatml.sheet');
    res.header('Content-Disposition', 'attachment; filename=report.xlsx');

    workbook.xlsx.write(res);
  } catch (error) {
    console.log(error.message);
  }
}
const orderSearch = async (req, res) => {
  try {
    req.session.orderSearchErr = '';
    const formatDate = function (date) {
      const day = ('0' + date.getDate()).slice(-2);
      const month = ('0' + (date.getMonth() + 1)).slice(-2);
      const year = date.getFullYear().toString();
      return `${day}-${month}-${year}`;
    };

    const from = new Date(req.body.fromdate);
    const to = new Date(req.body.todate);
    req.session.filterDate = true;
    req.session.from = from;
    req.session.to = to;


    if (from > to) {
      req.session.orderSearchErr = "Invalid date range. 'From' date must be before or equal to 'To' date.";
      return res.render('admin/reports', { orders: [], formatDate, message: req.session.orderSearchErr });
    }

    const orders = await order.find({
      'items.orderStatus': 'Delivered',
      orderDate: { $gte: from, $lte: to },
    });

    if (orders.length === 0) {
      req.session.orderSearchErr = 'No orders found';
      return res.render('admin/reports', { orders: [], formatDate, message: req.session.orderSearchErr });
    }

    res.render('admin/reports', { orders, formatDate, message: req.session.orderSearchErr });
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
}

const verifyLogin = async (req, res) => {
  const { email, password } = req.body;
  console.log(email);
  console.log(password);
  try {
    const adminData = await Admin.findOne({ email, password });
    if (adminData) {
      req.session.admin = true;
      res.render('admin/dashboard', { message: '' });
    } else {
      req.session.admin = false;
      res.render('admin/adminLogin', { message: 'wrong credentials' });
    }
  } catch (error) {
    console.log(error.message);
  }
}
// const verifyLogin = async (req, res) => {
//   try {
//     const email = req.body.email
//     const password = req.body.password
//     const userData = await user.findOne({ email: email })
//     if (userData) {
//       passwordMatch = await bcrypt.compare(password, userData.password)
//       if (passwordMatch) {
//         if (userData.is_admin === 0) {
//           res.render("admin/adminLogin", { message: "please verify your email" })
//         }
//         else {
//           req.session.user_id=userData._id
//           res.redirect('/admin/dashboard')
//         }
//       }

//     else {
//       res.render("admin/adminLogin", { message: "email and password is incorrect" })
//     }
//   }
//     else
// {
//   res.render('admin/adminLogin', { message: "email and password is incorrect" })
// }

//   } catch (error) {
//   console.log(error.message);
// }
// };
const adminLogout = async (req, res) => {
  try {
    req.session.admin = false
    res.redirect('/admin')
  } catch (error) {
    console.log(error.message);
  }
};



// const productEdit= async (req, res) => {
//   try {
//     const id = req.query.id;
//     req.session.productQuery = id;
//     const product = await prod.findById({ _id: id });
//     if (product) {

//       return res.render('admin/editProduct', { product });
//     }
//   } catch (error) {
//     console.log(error.message);
//   }
// }


//   console.log(req.query.id)
//   const id = req.session.productQuery;
//   console.log(id)
//   const productUpdate = await prod.findByIdAndUpdate({ _id: id }, {
//     $set: {
//       name: req.body.name,
//       category: req.body.category,

//       brand: req.body.brand,
//       stock: req.body.stock,

//       price: req.body.price,

//       discount: req.body.discount,
//       details: req.body.details,
//       image: req.file.filename,

//     }
//   })
//   if (productUpdate) {
//     res.redirect('admin/products')
//   }
// }
// catch (error) {
//   console.log(error.message);
// }


// const productUpdate = async (req, res) => {
//   try {
//     console.log(req.body);

//     const newStatus = req.body.new == undefined ? 0 : 1;
//     const id = req.session.productQuery;
//     const updateObj = {
//       $set: {
//         name: req.body.name,
//         category: req.body.category,

//         brand: req.body.brand,
//         stock: req.body.stock,
//         price: req.body.price,

//         discount: req.body.discount,
//         details: req.body.details,
//         image: req.file.filename,

//       },
//     };

//     if (req.files[0] && req.files[0].filename) {
//       updateObj.$set.image = req.files[0].filename;
//     }


//     const result = await prod.findByIdAndUpdate({ _id: id }, updateObj);
//     if (result) {
//       req.session.productMessage = 'Product Updated Successfully';
//       return res.redirect('/admin/products');
//     }
//   } catch (error) {
//     console.log(error.message);
//   }
// }
const userManagement = async (req, res) => {
  try {
    const users = await user.find({});
    if (users) {
      req.session.users = users;
      res.render('admin/customer', { users });
      // userblock message
    }
  } catch (error) {
    console.log(error.message);
  }
}
// const deleteUser=async (req, res) => {
//   try {

//    const id =req.query.id
//    console.log(id)
//   //  var ido = new mongoose.Types.ObjectId(id);

//      await user.deleteOne({_id:id})
//      res.redirect('/admin/customer')
//   } catch (error) {
//     console.log(error.message);
//   }
// }
const categoryActive = async (req, res) => {
  try {
    const category = req.body.id
    const catDetails = await catego.findById(category);
    await catego.updateOne({ _id: category }, { $set: { active: true } })
    // await prod.updateMany({ category: catDetails._id }, { $set: { active: true } })
    res.sendStatus(200)
  } catch (error) {
    console.log(error.message);
    res.render('error')
  }
}
const categoryDeactive = async (req, res) => {
  try {
    const category = req.body.id
    const catDetails = await catego.findById(category);
    await catego.updateOne({ _id: category }, { $set: { active: false } })
    // await prod.updateMany({ category: catDetails._id}, { $set: { active: false } })
    res.sendStatus(200)
  } catch (error) {
    console.log(error.message);
    res.render('error')
  }
}


const productActive = async (req, res) => {
  try {
    const products = req.body.id
    await prod.updateOne({ _id: products }, { $set: { active: true } })
    res.sendStatus(200)
  } catch (error) {
    console.log(error.message);
    res.render('error')
  }
}
const productDeactive = async (req, res) => {
  try {
    const products = req.body.id
    await prod.updateOne({ _id: products }, { $set: { active: false } })
    res.sendStatus(200)
  } catch (error) {
    console.log(error.message);
    res.render('error')
  }
}
const blockUser = async (req, res) => {
  try {
    console.log(req.params.id)
    const users = req.body.id
    await user.updateOne({ _id: users }, { $set: { blocked: true } })
    req.session.user = false
    res.sendStatus(200)
  } catch (error) {
    console.log(error.message);
    res.render('error')
  }
}
const unblockUser = async (req, res) => {
  try {
    console.log(req.body.id)
    const users = req.body.id
    await user.updateOne({ _id: users }, { $set: { blocked: false } })
    res.sendStatus(200)
  } catch (error) {
    console.log(error.message);
    res.render('error')
  }
}
const imageEdit = async (req, res) => {
  try {
    const product = await prod.findById(req.params.id);
    res.render('admin/imageEdit', { product })

  } catch (error) {
    console.log(error.message);
    res.render('error')
  }
}

const imageCrop = (req, res) => {
  const productId = req.params.productId;

  const imageIndex = req.body.data;
  console.log('index=', imageIndex)
  // Load the original image path from your database or source

  const originalImagePath = `public/images/${imageIndex}`;

  // Define the cropping dimensions
  const cropWidth = 200;
  const cropHeight = 200;

  // Create a sharp instance for the original image
  const image = sharp(originalImagePath);
  image
    .resize(cropWidth, cropHeight)
    .toBuffer((err, croppedBuffer) => {
      if (err) {
        console.error('Error cropping image', err);
        return res.status(500).send('Error cropping image');
      }

      // image
      //   .resize(cropWidth, cropHeight)
      //   .toFile(`/path/to/cropped_images/${productId}/${imageIndex}_cropped.jpg`, (err) => {
      //     if (err) {
      //       console.error('Error cropping image', err);
      //       return res.status(500).send('Error cropping image');
      //     }
      // Send the cropped image to the client
      const croppedImagePath = `public/images/${imageIndex}`;
      fs.writeFileSync(croppedImagePath, croppedBuffer);
      res.redirect('/admin/products')
      // res.render('cropImage', { imagePath: croppedImagePath });
    });
}

const orderManagement = async (req, res) => {
  try {
    const orders = await order.find({}).sort({ orderDate: -1 });

    return res.render('admin/orders', { orders });

  } catch (error) {
    console.log(error.message);
  }
}
const orderStatusLoad = async (req, res) => {
  try {
    const id = req.query.id;
    req.session.orderId = id
    const orders = await order.find({ _id: id });
    console.log(orders);
    res.render('admin/orderStatus', { orders });
  } catch (error) {
    console.log(error.message);
  }
}

const editOrderStatus = async (req, res) => {
  try {
    const id = req.query.orderId;
    console.log("itemid--" + id)
    const orders = await order.findOne({ _id: req.session.orderId })
    console.log("orders--" + orders)
    const selectedItem = orders.items.find(item => item._id.toString() == id);

    if (selectedItem.orderStatus !== 'Cancelled') {


      const order2Id = req.session.orderId;
      if (req.query.approve) {
        const id = req.query.orderId;
        await order.findOneAndUpdate(
          { _id: order2Id, 'items._id': id },
          { $set: { 'items.$.orderStatus': 'Approved' } }
        );
        return res.redirect(`/admin/order/status?id=${order2Id}`);
      } else if (req.query.deny) {
        const id = req.query.deny;
        await order.findOneAndUpdate(
          { _id: order2Id, 'items._id': id },
          { $set: { 'items.$.orderStatus': 'Cancelled' } }
        );
        return res.redirect(`/admin/order/status?id=${order2Id}`);
      } else if (req.query.shipped) {
        const id = req.query.orderId;
        await order.findOneAndUpdate(
          { _id: order2Id, 'items._id': id },
          { $set: { 'items.$.orderStatus': 'Shipped' } }
        );
        return res.redirect(`/admin/order/status?id=${order2Id}`);
      } else if (req.query.delivered) {
        const id = req.query.orderId;


        const itemId = req.query.itemId;
        const delivered = await order.findOneAndUpdate(
          { _id: order2Id, 'items._id': id },
          { $set: { 'items.$.orderStatus': 'Delivered' } },
          { new: true }
        );
        if (delivered) {

          const orders = await order.findOne({ _id: order2Id })

          const selectedItem = orders.items.find(item => item._id.toString() == id);

          console.log(selectedItem.quantity)
          await prod.findOneAndUpdate(
            { _id: itemId },
            {
              $inc: { stock: -selectedItem.quantity },
            }
          );
        }
        return res.redirect(`/admin/order/status?id=${order2Id}`);
      } else {
        return res.redirect(`/admin/order/status?id=${order2Id}`);
      }
    }
    else {
      const order2Id = req.session.orderId;
      return res.redirect(`/admin/order/status?id=${order2Id}`);
    }
  } catch (error) {
    console.log(error.message);
  }
}
// const loadBanner = async (req, res) => {
//   try {
//     res.render('admin/banner')
//   } catch (error) {
//     console.log(error.message);
//   }
// }

const couponLoad = async (req, res) => {
  try {
    const formatDate = function (date) {
      const day = ('0' + date.getDate()).slice(-2);
      const month = ('0' + (date.getMonth() + 1)).slice(-2);
      const year = date.getFullYear().toString();
      return `${day}-${month}-${year}`;
    };
    const coupon = await Coupon.find().sort({ _id: -1 });
    if (coupon) {
      if (req.query.edit) {
        const edit = await Coupon.findOne({ _id: req.query.edit });

        return res.render('admin/coupon', { couponEdit: edit, coupon, formatDate });
      } else {
        req.query.edit = false;
        const message = req.session.couponMessage;
        const errorMessage = req.session.couponErrMessage;
        res.render('admin/coupon', { coupon, message, errorMessage, formatDate });
      }
    } else {
      return res.render('admin/coupon', { formatDate });
    }
  } catch (error) {
    console.log(error.message);
  }
}


const couponAdd = async (req, res) => {
  try {
    req.session.couponErrMessage = '';
    req.session.couponMessage = '';
    const code = req.body.couponCode;
    const value = req.body.couponValue;
    const expiry = req.body.couponExpiry;
    const bill = req.body.minBill;
    const maxAmount = req.body.maxAmount;

    if (
      code.trim() != '' &&
      value.trim() != '' &&
      expiry.trim() != '' &&
      bill.trim() != '' &&
      maxAmount.trim() != ''
    ) {
      const find = await Coupon.findOne({ code });

      if (find) {
        req.session.couponMessage = '';
        req.session.couponErrMessage = 'Coupon already exists';
        return res.redirect('/admin/coupon');
      } else {
        if (value > 0 && value <= 100) {
          const couponData = new Coupon({
            code,
            value,
            minBill: bill,
            maxAmount,
            expiryDate: Date(),
          });
          await couponData.save();
          req.session.couponErrMessage = '';
          const message = 'New Coupon Added Successfully';
          req.session.couponMessage = message;
          res.redirect('/admin/coupon');
        } else {
          req.session.couponMessage = '';
          req.session.couponErrMessage = 'Coupon Value must be between 0 and 100';
          res.redirect('/admin/coupon');
        }
      }
    } else {
      req.session.couponMessage = '';
      req.session.couponErrMessage = 'Fields cannot be null';
      res.redirect('/admin/coupon');
    }
  } catch (error) {
    console.log(error.message);
  }
}

const couponDeactivate = async (req, res) => {
  try {
    const id = req.query.id;
    await Coupon.findOneAndUpdate({ _id: id }, { $set: { Status: 'Inactive' } });
    req.session.couponErrMessage = '';
    const message = 'coupon Deactivated Successfully';
    req.session.couponMessage = message;
    res.redirect('/admin/coupon');
  } catch (error) {
    console.log(error.message);
  }
}

const couponActivate = async (req, res) => {
  try {
    const id = req.query.id;
    const expired = await Coupon.findOne({ _id: id, Status: 'Expired' });
    if (expired) {
      req.session.couponMessage = '';
      req.session.couponErrMessage = 'Coupon expiry need to updated before activating';
      return res.redirect('/admin/coupon');
    } else {
      await Coupon.findOneAndUpdate({ _id: id }, { $set: { Status: 'Active' } });
      req.session.couponErrMessage = '';
      const message = 'coupon Activated Successfully';
      req.session.couponMessage = message;
      return res.redirect('/admin/coupon');
    }
  } catch (error) {
    console.log(error.message);
  }
}

const couponEdit = async (req, res) => {
  try {
    const id = req.query.id;
    res.redirect(`/admin/coupon?edit=${id}`);
  } catch (error) {
    console.log(error.message);
  }
}

const couponUpdate = async (req, res) => {
  try {
    req.session.couponMessage = '';
    req.session.couponErrMessage = '';
    const id = req.query.id;
    const code = req.body.couponCode;
    const value = req.body.couponValue;
    const expiry = new Date(req.body.couponExpiry);
    const bill = req.body.minBill;
    const maxAmount = req.body.maxAmount;
    const currDate = new Date();
    const Status = currDate.getTime() < expiry.getTime() ? 'Active' : 'Expired';
    const updated = await Coupon.findByIdAndUpdate(
      { _id: id },
      {
        $set: {
          code,
          value,
          expiryDate: expiry,
          minBill: bill,
          maxAmount,
          Status,
        },
      }
    );
    if (!updated) {
      throw new Error('an error occured while updating the coupon');
    }
    req.session.couponMessage = 'coupon Updated Successfully';
    return res.redirect('/admin/coupon');
  } catch (error) {
    console.log(error.message);
  }
}
const bannerLoad = async (req, res) => {
  try {
    const banner = await Banner.find({}).sort({ _id: 1 });
  if(banner)
  {
    res.render('admin/banner',{banner})
  }
  } catch (error) {
    console.log(error.message);
  }
}

const bannerAdd = async (req, res) => {
  try {
    const { title, subtitle, description, redirect } = req.body;
    const image = req.file.filename
  
    const newBanner = new Banner({
      title,
      subtitle,
      description,
      image,
      redirect,
    });

    const savedBanner = await newBanner.save();


    res.redirect('/admin/banner');
  } catch (error) {
    console.error('Error adding banner:', error);
    
    res.redirect('/error');
  }
}



const bannerUpdate = async (req, res) => {
  try {
    const { title, subtitle, description, redirect } = req.body;
    // If a new image is uploaded, handle it appropriately (e.g., with multer)
    const image = req.file ? req.file.filename : undefined;

    const updatedBanner = {
      title,
      subtitle,
      description,
      redirect,
    };

    if (image) {
      updatedBanner.image = image;
    }

    const editedBanner = await Banner.findByIdAndUpdate(req.params.id, updatedBanner, { new: true });

    if (!editedBanner) {
    
      return res.status(404).send('Banner not found');
    }

    res.redirect('/admin/banner'); 
  } catch (error) {
    console.error('Error editing banner:', error);
    res.status(500).send('Internal Server Error');
  }
}

const bannerDisable =  async (req, res) => {
  try {
    const banner = req.body.id
    const brandDetails = await Banner.findById(banner);
    await Banner.updateOne({ _id: banner }, { $set: { active: false } })


    res.sendStatus(200)
  } catch (error) {
    console.log(error.message);
    res.render('error')
  }
}
const bannerEnable =  async (req, res) => {
  try {
    const banner = req.body.id
    const brandDetails = await Banner.findById(banner);
    await Banner.updateOne({ _id: banner }, { $set: { active: true } })


    res.sendStatus(200)
  } catch (error) {
    console.log(error.message);
    res.render('error')
  }
}
module.exports =
{
salesReport,
  orderManagement, orderStatusLoad, editOrderStatus,
  adminLogin,
  productsView,
  customerView,
  dashboardView,
  categoryView,
  categoryAdd,
  categoryActive,
  categoryDeactive,
  addCategoryPost,
  categoryEditLoad,
  categoryEditPost,
  brandView,
  brandAdd,
  addBrandPost,
  brandActive,
  brandDeactive,
  brandEditLoad,
  brandEditPost,
  addProduct,
  addProductpost,
  verifyLogin,
  adminLogout,
  productEdit,
  productUpdate,
  productActive,
  productDeactive,
  adminLoginPost,
  userManagement,
  blockUser,
  unblockUser, imageCrop, productDetails, imageEdit, orderReport, orderExcel, orderSearch, couponLoad, couponActivate, couponAdd, couponDeactivate, couponEdit, couponUpdate, bannerLoad, bannerAdd, bannerUpdate, bannerEnable, bannerDisable
}




