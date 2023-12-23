
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bannerSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
        type: String,
        required: true,
      },
    active: {
        type: Boolean,
        default: true
    },
    redirect: {
      type: String,

    },
  },
  {
    timestamps: true,
  }
);



const Banner = mongoose.model('Banner', bannerSchema);
module.exports = Banner;
