const mongoose = require("mongoose")

const Schema = mongoose.Schema

const brandSchema = new Schema({
    name : {
        type:String,
        
        required: true
    },
    description:
    {
        type:String,
       
        required: true,
    },
    active:{
        type:Boolean,
        default:true
    }
})

const brand = mongoose.model("brands",brandSchema)

module.exports = brand