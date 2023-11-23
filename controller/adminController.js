const Admin = require('../models/adminLogin');
const user = require('../models/userSignup');
const bcrypt = require('bcrypt');
const prod = require('../models/adminProducts');
const multer = require("../middlewares/multer");
const brand = require('../models/brandsModel');
const sharp = require('sharp');
const fs = require('fs');
const order = require('../models/orderModel');
const catego = require('../models/categoryModel')
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
    // const active=await prod.findOne({brand:brands.name})
    // console.log(active)
    await prod.updateMany({ brand: brandDetails.name }, { $set: { active: true } })

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
    await prod.updateMany({ brand: brandDetails.name }, { $set: { active: false } })

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

    const cat = await catego.find()
    if (cat) {
      res.render('admin/categoriesList', { cat });
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
      res.render('admin/dashboard', { message: '' });
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
    // Find active categories
    const activeCategories = await catego.find({ active: true });

    // Find active brands
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
    console.log(req.body.category)
    const selectedCategoryName = req.body.category;
    const selectedCategory = await catego.findOne({ name: selectedCategoryName });
    console.log(selectedCategoryName)
    // if (!selectedCategory) {

    //   return res.render('admin/addProduct', {
    //     message: 'Selected category does not exist. Please choose a valid category.',
    //     categories,
    //     brands,
    //   });
    // }
    const images = req.files.map((file) => file.filename);

    products.name = req.body.name;


    products.category._id = selectedCategoryName._id

    products.brand = req.body.brand
    products.stock = req.body.stock

    products.price = req.body.price

    products.discount = req.body.discount
    products.details = req.body.details

    products.image = images





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
    res.render('admin/dashboard');
  } catch (error) {
    console.log(error.message);
  }
};


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
    req.session.destroy()
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
    await prod.updateMany({ category: catDetails.name }, { $set: { active: true } })
    res.send(200)
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
    await prod.updateMany({ category: catDetails.name }, { $set: { active: false } })
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
  const imageIndex = req.params.imageIndex;

  // Load the original image path from your database or source
  const originalImagePath = `/path/to/original_images/${productId}/${imageIndex}.jpg`;

  // Define the cropping dimensions
  const cropWidth = 200;
  const cropHeight = 200;

  // Create a sharp instance for the original image
  const image = sharp(originalImagePath);

  // Perform the crop operation
  image
    .resize(cropWidth, cropHeight)
    .toFile(`/path/to/cropped_images/${productId}/${imageIndex}_cropped.jpg`, (err) => {
      if (err) {
        console.error('Error cropping image', err);
        return res.status(500).send('Error cropping image');
      }
      // Send the cropped image to the client
      const croppedImagePath = `/path/to/cropped_images/${productId}/${imageIndex}_cropped.jpg`;
      res.render('cropImage', { imagePath: croppedImagePath });
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
        await prod.findOneAndUpdate(
          { _id: itemId },
          {
            $inc: { stock: -delivered.items[0].quantity },
          }
        );
      }
      return res.redirect(`/admin/order/status?id=${order2Id}`);
    } else {
      return res.redirect(`/admin/order/status?id=${order2Id}`);
    }
  } catch (error) {
    console.log(error.message);
  }
}

module.exports =
{
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
  unblockUser, imageCrop, productDetails, imageEdit
}




