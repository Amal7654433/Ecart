const mongoose = require('mongoose');
const schema = mongoose.Schema;

const adminSchema = new schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const Admin = mongoose.model('admindetails', adminSchema);

module.exports = Admin;
