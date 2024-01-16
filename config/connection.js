// const db = "mongodb://127.0.0.1:27017/Newcart"
// const mongo= mongoose
//     .connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
//     .then(() => {
//         console.log('Database connected');
//     })
//     .catch((error) => {
//         console.error('Database connection error:', error);
//     });
// module.exports=mongo
module.exports = {
    port: process.env.PORT,
    databaseURL: process.env.DATABASE_URL,
    SECRET_KEY: process.env.SECRET_KEY,
    RsecretKey: process.env.RAZORPAY_SECRET_KEY,

    RsecretId: process.env.RAZORPAY_ID_KEY,
}
