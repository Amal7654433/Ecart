const user = require('../models/userSignup');
const bcrypt = require('bcrypt')
const mail = require('nodemailer')
const auth = require('../middlewares/auth')
const prod = require('../models/adminProducts');
const randomString = require('randomstring')
const catego = require('../models/categoryModel')
const { v4: uuidv4 } = require('uuid');
const { productDetails } = require('./adminController');
const { ObjectId } = require('mongoose').Types;



const profileView = async (req, res) => {
    try {
      
        const cat = await catego.find({ active: true })
        const userData = await user.findById({ _id: req.session.user })

        res.render('users/profile', { cat, userData });
    } catch (error) {
        console.log(error.message);
    }
};

// const profileEdit = async (req, res) => {
//     try {
//         console.log(req.session.user)
//         const cat = await catego.find({ active: true })
//         const userId = req.session.user; 
//         const userData = await user.findById(userId);
//         console.log(userData.name)
//         if (!userData) {

//             return res.status(404).send('User not found');
//         }


//         res.render('users/profileEdit', { userData, cat });
//     } catch (error) {
//         res.status(500).send('Internal Server Error');
//         console.log(error.message);
//     }
// };

const editProfilePost = async (req, res) => {
    try {
        // Get the user's ID from the session
        const userId = req.session.user; // Assuming the user's ID is stored in the session

        // Get the updated profile data from the request body
        const { name, email, phone } = req.body;

        // Find the user's profile in the database
        const userData = await user.findById(userId);

        if (!userData) {
            // Handle the case where the user is not found
            return res.status(404).send('User not found');
        }

        // Check if the email is being updated
        if (email !== userData.email) {
            // Email is being changed, set is_verified to false and invalidate the session
            userData.is_verified = false;
            req.session.destroy(); // Invalidate the current session
        }

        // Update the user's profile with the new data
        userData.name = name;
        userData.email = email;
        userData.phone = phone;

        // Save the updated user data to the database
        const updatedUserData = await userData.save();

        // Redirect to the user's profile page or another appropriate page
        res.redirect('/profile'); // Redirect to the profile page after successful update
    } catch (error) {
        // Handle any errors, e.g., log them or display an error page
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};
const securePassword = async (password) => {
    const spassword = await bcrypt.hash(password, 10)
    return spassword
}
const addAddressView = async (req, res) => {
    try {

        const userData = await user.findById({ _id: req.session.user })

        res.render('users/addAddress', { userData });
    } catch (error) {
        console.log(error.message);
    }
};



const addAddressPost = async (req, res) => {
    try {
        const { name, phone, locality, address, district, state, pincode } = req.body;
        const userData = await user.findById({ _id: req.session.user })
        // Create a new address instance
        userData.address.push({
            name: name,
            phone: phone,
            locality: locality,
            address: address,
            district: district,
            state: state,
            pincode: pincode
        })

        // Save the address to the database
        const savedAddress = await userData.save();
        console.log('Address saved successfully:', savedAddress);
        res.redirect('/profile')




    } catch (error) {
        console.error('Error saving address to the database:', error);
        return res.status(500).send('Error saving address to the database');
    }
}
const removeAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const userData = await user.findById(req.session.user);

        // Find the index of the address with the given addressId
        const addressIndex = userData.address.findIndex((address) => address._id.toString() === addressId.toString());

        // If the address is found, remove it
        if (addressIndex !== -1) {
            userData.address.splice(addressIndex, 1);
            await userData.save();
            return res.status(200).send('Address removed successfully');
        } else {
            return res.status(404).send('Address not found');
        }
    } catch (error) {
        console.error('Error removing address from the database:', error);
        return res.status(500).send('Error removing address from the database');
    }
};
const updateAddressView = async (req, res) => {
    try {
        const id = req.params.id

        console.log(id)
        const userData = await user.findById({ _id: req.session.user })
        const addressId = userData.address.find((item) => item._id.toString() === id);

        res.render('users/editAddress', { userData, addressId, id });
    } catch (error) {
        console.log(error.message);
    }
};

const updateAddressPost = async (req, res) => {
    try {
      





        const { name, phone, locality, address, district, state, pincode } = req.body;
        const userData = await user.findById(req.session.user);


        // Find the address with the given addressId
        const addressToUpdate = userData.address.find((address) => address._id.toString() === req.params.id);

        // If the address is found, update its properties
        if (addressToUpdate) {
            addressToUpdate.name = name;
            addressToUpdate.phone = phone;
            addressToUpdate.locality = locality;
            addressToUpdate.address = address;
            addressToUpdate.district = district;
            addressToUpdate.state = state;
            addressToUpdate.pincode = pincode;

            await userData.save();

            return res.status(200).redirect('/profile');

        } else {
            return res.status(404).send('Address not found');
        }
    } catch (error) {
        console.error('Error updating address in the database:', error);
        return res.status(500).send('Error updating address in the database');
    }
};

const profileNameEdit = async (req, res) => {
    try {

        const name = true
        const userData = await user.findById({ _id: req.session.user })

        res.render('users/profileEdit', { userData, name });
    } catch (error) {
        console.log(error.message);
    }
};
const profileEmailEdit = async (req, res) => {
    try {

        const email = true
        const name = false
        const userData = await user.findById({ _id: req.session.user })

        res.render('users/profileEdit', { userData, name, email });
    } catch (error) {
        console.log(error.message);
    }
};
const profilePhoneEdit = async (req, res) => {
    try {


        const email = false
        const name = false
        const userData = await user.findById({ _id: req.session.user })

        res.render('users/profileEdit', { userData, name, email });
    } catch (error) {
        console.log(error.message);
    }
};
const updateUserName = async (req, res) => {
    try {
        const userId = req.session.user; // Assuming the user's ID is stored in the session
        const { name } = req.body;

        // Find the user's profile in the database
        const userData = await user.findById(userId);

        if (!userData) {
            // Handle the case where the user is not found
            return res.status(404).send('User not found');
        }

        // Update the user's name
        userData.name = name;

        // Save the updated user data to the database
        const updatedUserData = await userData.save();

        // Redirect to the user's profile page or another appropriate page
        res.redirect('/profile'); // Redirect to the profile page after successful update
    } catch (error) {
        // Handle any errors, e.g., log them or display an error page
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};
const updateUserPhone = async (req, res) => {
    try {
        const userId = await user.findById(req.session.user);
        const { phone } = req.body;


        const phoneNumberExists = await user.exists({ phone: phone });




        if (phoneNumberExists && phoneNumberExists._id.toString() !== userId._id.toString()) {

            return res.status(400).send('Phone number already in use');
        }

        // Find the user's profile in the database
        const userData = await user.findById(userId);

        if (!userData) {
            // Handle the case where the user is not found
            return res.status(404).send('User not found');
        }

        // Update the user's phone number
        userData.phone = phone;

        // Save the updated user data to the database
        const updatedUserData = await userData.save();


        res.redirect('/profile'); // Redirect to the profile page after successful update
    } catch (error) {
        // Handle any errors, e.g., log them or display an error page
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

const generateOTP = function () {
    return Math.floor(100000 + Math.random() * 900000);
};
const sendVerificationEmail = async (email, otp) => {
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
const updateUserEmail = async (req, res) => {
    try {
        const userId = await user.findById(req.session.user); // Assuming the user's ID is stored in the session
        const { email } = req.body;

        // Check if the new email already exists in the database
        const emailExists = await user.exists({ email: email });

        if (emailExists && emailExists._id.toString() !== userId._id.toString()) {
            // Handle the case where the email already exists
            return res.status(400).send('Email already in use');
        }



        const userData = await user.findById(req.session.user);

        if (!userData) {
            
            return res.status(404).send('User not found');
        }
        if (email === userData.email) {

            return res.redirect('/profile');
        }

      
        userData.email = email;

        const updatedUserData = await userData.save();
        if (updatedUserData) {

            await user.updateOne({ _id: userData._id }, { $set: { is_verified: false } });
            req.session.user = false
            res.redirect('/login');
        }
        // Redirect to the user's profile page or another appropriate page
        // Redirect to the profile page after successful update
    } catch (error) {
        // Handle any errors, e.g., log them or display an error page
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};
const getTotalSum = async function (id) {
    try {
        const users = await user.findById({ _id: id });
        if (users.cart) {
            const cart = users.cart;
            const sum = cart.reduce((sum, item) => sum + item.total_price, 0);
            return sum;
        } else return 0;
    } catch (error) {
        throw new Error('error while calculating net total price');
    }
};


module.exports = {
    profileView,
    editProfilePost,
    addAddressView,
    addAddressPost,
    removeAddress,
    updateAddressView,
    updateAddressPost,
    profileNameEdit,
    profileEmailEdit,
    profilePhoneEdit,
    updateUserName,
    updateUserPhone,
    updateUserEmail,


}