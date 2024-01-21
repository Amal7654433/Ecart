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
const Banner = require('../models/bannerModel');


const securePassword = async (password) => {
  const spassword = await bcrypt.hash(password, 10)
  return spassword
}




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
          req.session.signupEmail = req.body.email
          const OTP = generateOTP();
          await user.findOneAndUpdate({ email: req.body.email }, { $set: { token: OTP } });
          sendResetPasswordEmail(req.body.email, OTP)
          res.json({ otp: true })
          // res.redirect('/signup/otp')
        } else {
          if (userData.blocked) {

            res.json({ blocked: true })

           
          } else {
            req.session.user = userData._id;
            console.log("login success")
            res.json({ success: true })
           
          }
        }
      } else {
        res.status(401).json({ success: false, message: 'Email and password are incorrect.' });
      
      }
    } else {
      res.status(401).json({ success: false, message: 'Email and password are incorrect.' });
     
    }
  } catch (error) {
    console.log(error.message);
    return res.render("users/userLogin", {
      message: "An error occurred during login.",

    });
  }
};






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


// const verifyMail = async (req, res) => {
//   try {
//     const cat = await catego.find({ active: true });
//     const expire = false
//     const currentTimestamp = new Date().getTime();
//     const expiryTimestamp = parseInt(req.query.expiry, 10); 

//     if (currentTimestamp > expiryTimestamp) {
//       const expire = true
//       return res.render('users/emailVerificationExpired', { cat, expire });
//     }


//     const updateInfo = await user.updateOne({ _id: req.query.id }, { $set: { is_verified: 1 } });
//     const userData = await user.findOne({ _id: req.query.id });
//     if (updateInfo) {
//       req.session.user = userData._id
//     }

//     console.log(req.session.user)

//     console.log(updateInfo);

//     res.render('users/emailVerificationExpired', { cat, expire });
//   } catch (error) {
//     console.log(error.message);
//   }
// };
let referralCodeApplied;
const loadSignup = async (req, res) => {
  try {
    referralCodeApplied = req.query.referralCode;
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
    function generateReferralCode() {
      const timestamp = Date.now().toString(36);
      const randomChars = Math.random().toString(36).substr(2, 5);
      return timestamp + randomChars;
    }
    const code = generateReferralCode();
    // If no existing user found, proceed with user registration
    const cpassword = await securePassword(req.body.password);
    const newUser = new user({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      password: cpassword,
      referralCode: code,

    });

    const result = await newUser.save();

    if (result) {
      if (referralCodeApplied) {
        const referUser = await user.findOne({
          referralCode: referralCodeApplied,
        });
        if (referUser) {
          referUser.wallet += 200;
          referUser.walletHistory.push({
            status: "Referral link",
            date: new Date(),
            amount: 200,
          });
          await referUser.save();
        }
        const users = await user.findOne({ referralCode: code });
        if (users) {
          users.wallet += 200;
          users.walletHistory.push({
            status: "Referral link",
            date: new Date(),
            amount: 200,
          });
          await users.save();
        }
      }
      req.session.signupEmail = req.body.email
      // sendVerifyMail(req.body.name, req.body.email, result._id);
      const OTP = generateOTP();
      await user.findOneAndUpdate({ email: req.body.email }, { $set: { token: OTP } });
      sendResetPasswordEmail(req.body.email, OTP)
      res.redirect('/signup/otp')
    }
  } catch (error) {
    res.send(error.message);
  }
};
const signupOtpGet = async (req, res) => {
  try {

    if (!req.session.signupEmail) {
      // Redirect to the signup page if the email hasn't been entered
      return res.redirect('/login');
    }

    res.render('users/signupOtp', { message: '' });

  } catch (error) {
    console.log(error.message);
  }
};
const signupOtpPost = async (req, res) => {
  try {
    enteredOTP = req.body.otp;
    console.log('amal', enteredOTP)
    const users = await user.findOne({ email: req.session.signupEmail });
    const storedOTP = users.token;

    if (enteredOTP === storedOTP) {

      const updateInfo = await user.updateOne({ email: req.session.signupEmail }, { $set: { is_verified: 1 } });
      const userData = await user.findOne({ email: req.session.signupEmail });
      if (updateInfo) {
        req.session.user = userData._id
      }

      return res.redirect('/home');

    } else {
      // OTP is incorrect
      return res.render('users/signupOtp', { message: 'Invalid OTP' });
    }
  } catch (error) {
    console.log(error.message);
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
const resetPassword = async (req, res) => {
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

    req.session.user = null
   
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
  signupOtpGet, signupOtpPost,


  loadLogin,
  verifyLogin,

  loadSignup,
  subSignup,
  // verifyMail,
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
