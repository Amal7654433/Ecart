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
module.exports={adminLogout, adminLoggedIn}