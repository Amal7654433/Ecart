// const userLoggedIn = (req, res, next) => {
//   if (req.session.user) {
//     return next();
//   } else {
//     res.redirect('/login');
//   }
// };
const user = require('../models/userSignup');
const
  userLoggedIn = async (req, res, next) => {

    if (req.session.user) {
      try {
        const users = req.session.user;
        const userDetails = await user.findOne({ _id: users });
      
        req.userDetails = userDetails;
        if (userDetails.blocked) {
          req.session.destroy((err) => {
            console.log(err);
            res.status(500)
          })
          res.clearCookie('connect.sid')
          res.redirect('/login?message=blocked by admin', 302, { message: 'blocked by admin' }
          )
        }
        next();
      } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
      }

    } else {
      return res.redirect('/login?message=Log in for Accessibility');
    }

  }

const userLogout = (req, res, next) => {
  if (req.session.user) {
    return res.redirect('/?message=You Logged In Already!')
  }
  next()
}

const adminLoggedIn = (req, res, next) => {
  try {
    if (req.session.admin) {

    } else {
      res.redirect('/admin')
    }
    next()
  } catch (error) {
    console.log(error.message);
  }
}

const adminLogout = (req, res, next) => {
  try {
    if (req.session.admin) {
      return res.redirect('/admin/dashboard')
    }
    next()

  } catch (error) {
    console.log(error.message);
  }
}
const OtpAccess = (req, res, next) => {
  try {
    if (req.session.emailTemp) {
      next()
    }
    else {
      return res.redirect('/forgetpassword')

    }



  } catch (error) {
    console.log(error.message);
  }
}
const emailTempClear= (req, res, next) => {
  try {
    if (req.session.emailTemp) {
      req.session.emailTemp=false
    }
    next()
  


  } catch (error) {
    console.log(error.message);
  }
}
const resetpAccess= (req, res, next) => {
  try {
    if (req.session.otp) {
      next()
    }
    else{
      return res.redirect('/forgetpassword/otp')
    }
  


  } catch (error) {
    console.log(error.message);
  }
}


module.exports = { adminLogout, adminLoggedIn, userLoggedIn, userLogout, OtpAccess,emailTempClear,resetpAccess }
