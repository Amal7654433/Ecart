const mongoose = require('mongoose');
const { schema } = require('./userSignup');

const Schema = mongoose.Schema;
const verificationSchema=new schema({
    userId:string
})