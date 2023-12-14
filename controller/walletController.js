exports.wallet=async (req, res) => {
    try {
     res.render('users/wallet')
    } catch (error) {
      console.log(error.message);
    }
  }