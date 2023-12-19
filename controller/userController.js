const user = require('../models/userSignup');
const bcrypt = require('bcrypt')
const mail = require('nodemailer')
const auth = require('../middlewares/auth')
const prod = require('../models/adminProducts');
const randomString = require('randomstring')
const catego = require('../models/categoryModel')
const { v4: uuidv4 } = require('uuid');
const brand = require('../models/brandsModel');
const { ObjectId } = require('mongoose').Types;


const securePassword = async (password) => {
  const spassword = await bcrypt.hash(password, 10)
  return spassword
}


const homeView = async (req, res) => {
  try {
    const cat = await catego.find({ active: true })

    res.render('users/home', { cat });
  } catch (error) {
    console.log(error.message);
  }
};

const loadLogin = async (req, res) => {
  try {
    const cat = await catego.find({ active: true })
    res.render('users/userLogin', { cat });
  } catch (error) {
    console.log(error.message);
  }
};

const verifyLogin = async (req, res) => {
  try {
    const cat = await catego.find({ active: true });
    const email = req.body.email;
    const password = req.body.password;

    const userData = await user.findOne({ email: email });

    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);

      if (passwordMatch) {
        // req.session.user = userData._id
        if (userData.is_verified === 0) {
          // If the user is not verified, send a verification email
          sendVerifyMail(userData.name, email, userData._id);
          return res.render("users/userLogin", {
            message: "Please verify your email. We've sent a new verification link to your email.",
            cat,
          });
        } else {
          if (userData.blocked) {


            return res.render("users/userLogin", {
              message: "Your account is blocked. Please contact the admin.",
              cat,
            });
          } else {
            req.session.user = userData._id;
            return res.redirect("/products");
          }
        }
      } else {
        return res.render("users/userLogin", {
          message: "Email and password are incorrect.",
          cat,
        });
      }
    } else {
      return res.render("users/userLogin", {
        message: "Email and password are incorrect.",
        cat,
      });
    }
  } catch (error) {
    console.log(error.message);
    return res.render("users/userLogin", {
      message: "An error occurred during login.",
      cat,
    });
  }
};
const productsByCategory = async (req, res) => {
  try {

    const categoryIdentifier = req.params.categoryId;

    const cat = await catego.find({ active: true });

    const category = await catego.findOne({ _id: categoryIdentifier, active: true });


    if (category) {
      const activeBrands = await brand.find({ active: true });
      const products = await prod.find({ category: category._id, active: true, brand: { $in: activeBrands.map(brand => brand.name) } });


      if (products) {

        if (req.session.user) {
          const userId = req.session.user;
          const users = await user.findById(userId);
          const userCartProductIds = users ? users.cart.map(item => item.prod_id.toString()) : [];

          const productsWithCartFlag = products.map(product => ({
            ...product._doc,
            inCart: userCartProductIds.includes(product._id.toString())
          }));

          res.render('users/categoryProduct', { products: productsWithCartFlag, category, cat,activeBrands });
        } else {

          res.render('users/categoryProduct', { products, category, cat, activeBrands });
        }
      } else {

        throw new Error('Error while fetching products from the database');
      }
    } else {

      res.status(404).send('Category not found');
    }
  } catch (error) {

    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
};



const productsPage = async (req, res) => {
  try {
    const activeCategories = await catego.find({ active: true });
    const activeBrands = await brand.find({ active: true });
    const products = await prod.find({
      active: true,
      category: { $in: activeCategories.map(category => category._id) },
      brand: { $in: activeBrands.map(brand => brand.name) },

    }).populate('category');


    const cat = await catego.find({ active: true });

    if (products) {

      if (req.session.user) {
        const userId = req.session.user;


        const users = await user.findById(userId);
        const userCartProductIds = users ? users.cart.map(item => item.prod_id.toString()) : [];


        const productsWithCartFlag = products.map(product => ({
          ...product._doc,
          inCart: userCartProductIds.includes(product._id.toString())
        }));


        res.render('users/landing', { products: productsWithCartFlag, cat });
      } else {

        res.render('users/landing', { products, cat });
      }
    } else {

      throw new Error('Error while fetching products from the database');
    }
  } catch (error) {
    // Handle any errors that occur during the process
    console.error(error.message);
    // You might want to send an error response to the client here
    res.status(500).send('Internal Server Error');
  }
};

// const productsView = async (req, res) => {
//   try {
//     const id = req.query.id;
//     // const name = req.query.name
//     const productDetails = await prod.findById({ _id: id })
//     if (productDetails) {
//       if (req.session.userData) {
//         res.render('users/products', {
//           userData: req.session.userData,
//           product: productDetails,
//         });
//       } else {
//         res.send('User is loggedout');
//       }
//     } else {
//       throw new Error('error while fetching the product');
//     }
//   } catch (error) {
//     console.log(error.message);
//   }
// };
// const productsView = async (req, res) => {
//   try {
//     const productId = req.params.productId;

//     const product = await prod.findById(productId);
//     const cat = await catego.find({ active: true })

//     if (!product) {

//       return res.status(404).render('error', { message: 'Product not found' });
//     }


//     res.render('users/productDetails', { product, cat });
//   } catch (error) {
//     console.error(error.message);

//     res.status(500).render('error', { message: 'Internal server error' });
//   }
// }
const productsView = async (req, res) => {
  try {

    const productId = req.params.productId;
    console.log(productId)

    const product = await prod.findById(productId);


    const cat = await catego.find({ active: true });

    if (!product) {

      return res.status(404).render('error', { message: 'Product not found' });
    }


    if (req.session.user) {
      const userId = req.session.user;


      const users = await user.findById(userId);
      const userCartProductIds = users ? users.cart.map(item => item.prod_id.toString()) : [];


      product.inCart = userCartProductIds.includes(productId);
    }
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
    //     const filteredCart = users.cart.filter(item => item.prod_id._id.toString() === productId);
    // console.log(filteredCart)
    // Render a dedicated product details page, passing the product and categories to the template
    res.render('users/productDetails', { product, cat });
  } catch (error) {
    console.error(error.message);
    // Handle the error, e.g., render an error page
    res.status(500).render('error', { message: 'Internal server error' });
  }
};

// const sendVerifyMail = async (name, email, user_id) => {
//   try {
//     const transporter = mail.createTransport({
//       service: 'gmail',
//       auth: {
//         user: 'amal790257@gmail.com',
//         pass: 'oazg dytp cbaw ovml'

//       },

//     })
//     const mailOptions = {
//       from: 'amal790257@gmail.com',
//       to: email,
//       subject: 'for verification mail',
//       html: '<p>Hii ' + name + ',plaese click here to <a href="http://localhost:7000/verify?id=' + user_id + '"'
//     }
//     transporter.sendMail(mailOptions, function (error, info) {
//       if (error) {
//         console.log(error.message)
//       }
//       else {
//         console.log("email has been send", info.response)
//       }

//     })

//   } catch (error) {
//     console.log(error.message);
//   }
// };
const sendVerifyMail = async (name, email, user_id) => {
  try {
    const uniqueToken = uuidv4();

    const transporter = mail.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS
      }
    });

    // Calculate expiry time (1 minute from now)
    // const expiryTime = new Date();
    // expiryTime.setMinutes(expiryTime.getMinutes() + 1);
    // Calculate expiry time (e.g., 1 hour from now)
    const expiryTime = new Date();
    // expiryTime.setHours(expiryTime.getHours() + 1);
    expiryTime.setMinutes(expiryTime.getMinutes() + 1);

    // Convert the expiry time to a Unix timestamp (milliseconds since January 1, 1970)
    const expiryTimestamp = expiryTime.getTime();

    const mailOptions = {
      from: 'amal790257@gmail.com',
      to: email,
      subject: 'Verification Mail',
      html: `<p>Hi ${name}, please click here to <a href="http://localhost:7000/verify?id=${user_id}&expiry=${expiryTimestamp}">verify your account</a>This verification link will expire on ${expiryTime.toString()}</p>`,
      text: `<p>This verification link will expire on ${expiryTime.toString()}</p>`
    };


    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error.message);
      } else {
        console.log("Email has been sent. Response:", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};


const verifyMail = async (req, res) => {
  try {
    const cat = await catego.find({ active: true });
    const expire = false
    const currentTimestamp = new Date().getTime();
    const expiryTimestamp = parseInt(req.query.expiry, 10); // Extract expiry timestamp from URL

    if (currentTimestamp > expiryTimestamp) {
      const expire = true
      return res.render('users/emailVerificationExpired', { cat, expire });
    }

    // If the link is not expired, proceed with verification
    const updateInfo = await user.updateOne({ _id: req.query.id }, { $set: { is_verified: 1 } });
    const userData = await user.findOne({ _id: req.query.id });
    if (updateInfo) {
      req.session.user = userData._id
    }

    console.log(req.session.user)

    console.log(updateInfo);

    res.render('users/emailVerificationExpired', { cat, expire });
  } catch (error) {
    console.log(error.message);
  }
};

const loadSignup = async (req, res) => {
  try {
    const cat = await catego.find({ active: true })
    res.render('users/signup', { cat });
  } catch (error) {
    console.log(error.message);
  }
};
const subSignup = async (req, res) => {
  try {
    const cat = await catego.find({ active: true });

    // Check if the email or phone number already exists in the database
    const existingUser = await user.findOne({
      $or: [{ email: req.body.email }, { phone: req.body.phone }],
    });

    if (existingUser) {
      // User with the same email or phone number already exists
      return res.render('users/signup', {
        message: 'Email or phone number already in use. Please try another one.',
        cat,
      });
    }

    // If no existing user found, proceed with user registration
    const cpassword = await securePassword(req.body.password);
    const newUser = new user({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      password: cpassword,
    });

    const result = await newUser.save();

    console.log(req.body);
    console.log(result);

    if (result) {
      sendVerifyMail(req.body.name, req.body.email, result._id);

      return res.render('users/signup', {
        isSuccess: 'The verification link has been sent to your email.',
        cat,
      });
    }
  } catch (error) {
    res.send(error.message);
  }
};

const forgetPasswordEmail = async (req, res) => {
  try {
    // if(req.session.emailTemp)
    // {
    //   req.session.emailTemp=false
    // }
    // Set req.session.otp to true

    const cat = await catego.find({ active: true });
    res.render('users/forgetPasswordEmailEnter', { cat });
    console.log(req.session.emailTemp)
  } catch (error) {
    console.log(error.message);
  }
};

const generateOTP = function () {
  return Math.floor(100000 + Math.random() * 900000);
};

// const sendResetPasswordEmail = async (email, user_id) => {
//   try {
//     const OTP = generateOTP();

//     // Update the user's record with the OTP (you can use your model and database here)
//     const result = await user.findOneAndUpdate({ email: email }, { $set: { token: OTP } });

//     if (result) {
//       const transporter = mail.createTransport({
//         service: 'gmail',
//         auth: {
//           user: 'amal790257@gmail.com',
//           pass: 'oazg dytp cbaw ovml',
//         },
//       });

//       const options = {
//         from: 'amal790257@gmail.com',
//         to: email,
//         subject: 'Password Reset OTP',
//         text: `Your OTP for password reset is: ${OTP}`,
//       };

//       await transporter.sendMail(options);
//       console.log('Email has been sent');

//       // Return user ID for further processing (e.g., in a session)
//       return user_id;
//     } else {
//       // Handle the case where the user is not found
//       return null;
//     }
//   } catch (error) {
//     console.log(error.message);
//     return null;
//   }
// };

// const submitEmailForPasswordReset = async (req, res) => {
//   try {
//     const enteredEmail = req.body.email;
// const userData=await user.findOne({email:enteredEmail})
//     if (enteredEmail === '') {
//       return res.render('users/forgetPasswordEmailEnter', { message: 'Email should not be empty' });
//     }

//     // Call the sendResetPasswordEmail function to send the OTP email
//     const userId = await sendResetPasswordEmail(enteredEmail, userData._id);

//     if (userId !== null) {
//       // Set the user ID in the session for further processing
//       req.session.userId = userId;

//       return res.render('users/forgetPasswordOtp', { message: '' });
//     } else {
//       return res.render('users/forgetPasswordEmailEnter', { message: 'User not found' });
//     }
//   } catch (error) {
//     console.log(error.message);
//   }
// };
const sendResetPasswordEmail = async (email, otp) => {
  try {
    const transporter = mail.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS
      }
    });

    const mailOptions = {
      from: 'amal790257@gmail.com',
      to: email,
      subject: 'OTP Verification',
      text: `Your OTP is: ${otp}`
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error.message);
  }
};
const submitEmailForPasswordReset = async (req, res) => {
  try {
    const cat = await catego.find({ active: true });
    const enteredEmail = req.body.email;
    if (enteredEmail === '') {
      return res.render('users/forgetPasswordEmailEnter', { message: 'Email should not be empty', cat });
    }
    const existingEmail = await user.findOne(
      { email: req.body.email }
    );

    if (!existingEmail) {
      // User with the same email or phone number already exists
      return res.render('users/forgetPasswordEmailEnter', {
        message: 'email does not exist try another one', cat

      });
    }


    req.session.emailTemp = enteredEmail

    const OTP = generateOTP();
    const result = await user.find({ email: enteredEmail })

    if (result) {
      await user.findOneAndUpdate({ email: enteredEmail }, { $set: { token: OTP } });



      await sendResetPasswordEmail
        (enteredEmail, OTP);

      setTimeout(() => {
        req.session.emailTemp = false;
      }, 15000);

      return res.redirect('/forgetpassword/otp');
    } else {
      return res.json({ message: 'Incorrect credentials' });
    }
  } catch (error) {
    console.error('Error in /send-otp route:', error.message);
    return res.json({ message: 'An error occurred' });
  }
}
const verifyOtp = async (req, res) => {
  const
    enteredOTP = req.body.otp; // Assuming you're sending the email and OTP in the request body
  console.log(req.body)

  console.log(req.session.emailTemp
  )

  const email = req.session.emailTemp
  try {
    // Find the user with the provided email
    const users = await user.findOne({ email: email });
    console.log(users.email)
    console.log(users)
    if (!users) {
      return res.status(404).json({ message: 'User not found' });
    }
    const storedOTP = users.token;
    console.log(users.token)
    console.log(enteredOTP)


    // Check if the entered OTP matches the stored OTP
    // const OTPMatch = await bcrypt.compare(enteredOTP, storedOTP);

    if (enteredOTP === storedOTP) {
      // OTP is correct
      req.session.otp = true
      return res.redirect('/forgetpassword/resetpassword');

    } else {
      // OTP is incorrect
      return res.render('users/forgetPasswordOtp', { message: 'Invalid OTP' });
    }
  } catch (error) {
    console.error('Error in OTP verification:', error.message);
    return res.json({ message: 'An error occurred' });
  }
}
const resetPassword =
  async (req, res) => {
    try {

      res.render('users/resetPassword', { message: '' });






    } catch (error) {
      console.log(error.message);
    }
  };

const verifyOtpGet = async (req, res) => {
  try {
    req.session.otp = false
    res.render('users/forgetPasswordOtp', { message: '' });

  } catch (error) {
    console.log(error.message);
  }
};


// =====================email logic=============================

// =======================change password====================
const verifyPassword = async (req, res) => {
  const { password, cPassword } = req.body;
  const email = req.session.emailTemp
  try {
    if (password != '' && cPassword != '') {
      if (password == cPassword) {
        const passwordhash = await securePassword(password);
        if (passwordhash) {
          const update = await user.updateOne({ email: email }, { $set: { password: passwordhash } });
          if (update) {

            req.session.user = false;
            res.redirect('/login')
          } else {
            throw new Error("couldn't update the user");
          }
        } else {
          throw new Error('password hasing is not working');
        }
      } else {
        throw new Error('both password are not matching');
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const userLogout = async (req, res) => {
  try {

    req.session.user = false
    res.redirect('/home')
  } catch (error) {
    console.log(error.message);
  }
};
const userBlock = async (req, res) => {
  try {
    const users = await user.findById({ _id: req.session.user })
    if (users.blocked) {


      req.session.destroy()
    }


  } catch (error) {
    console.log(error.message);
  }
};
const deactivateAccount = async (req, res) => {
  const userDetails = req.userDetails
  await user.updateOne({ _id: userDetails._id }, { $set: { blocked: true } })
  req.session.destroy((err) => {
    console.log(err);
    res.status(500)
  })
  res.clearCookie('connect.sid')
  res.redirect('/?message=Your Account has been destroyed')
}



// Define a route for removing a product from the cart







module.exports = {
  homeView,
  productsPage,
  productsView
  , productsByCategory,
  loadLogin,
  verifyLogin,

  loadSignup,
  subSignup,
  verifyMail,
  forgetPasswordEmail,
  submitEmailForPasswordReset,
  userLogout,
  verifyOtp,
  resetPassword,
  verifyPassword,
  userBlock,
  verifyOtpGet,
  deactivateAccount,

}
