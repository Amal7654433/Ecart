
const user = require('../models/userSignup');

const prod = require('../models/adminProducts');
const multer = require("../middlewares/multer");

const sharp = require('sharp');
const fs = require('fs');
const excelJs = require('exceljs');
const order = require('../models/orderModel');






exports.dashboardView = async (req, res) => {
    try {
        const months = {};
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];


        const orders = await order.find({});
        orders.forEach((order) => {
            const month = monthNames[order.orderDate.getMonth()];
            if (!months[month]) {
                months[month] = 0;
            }
            months[month]++;

        });

        console.log("hello monthes", months)

        const paymentModeStats = await order.aggregate([
            {
                $group: { _id: '$paymentMode', count: { $sum: 1 } },
            },
        ]);

        const orderCount = await order.find({ __v: 0 }).count();
        const userCount = await user.find().count();

        const orderSum = await order.aggregate([
            { $unwind: '$items' },
            { $match: { 'items.orderStatus': 'Delivered' } },
            { $group: { _id: null, totalBill: { $sum: '$items.bill' } } },
        ]);
        const quantitySum = await order.aggregate([
            { $unwind: '$items' },
            { $match: { 'items.orderStatus': 'Delivered' } },
            { $group: { _id: null, totalProducts: { $sum: '$items.quantity' } } },
        ]);

        const totalRevenueResult = await order.aggregate([
            { $match: { "items.orderStatus": 'Delivered' } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: { $toDouble: "$orderBill" } }
                }
            }
        ]);

        const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].totalRevenue : 0;
        const monthlySalesData = await order.aggregate([
            {
                $match: { "items.orderStatus": 'Delivered' }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m", date: "$orderDate" }
                    },
                    totalSales: { $sum: { $toDouble: "$orderBill" } }
                }
            },
            {
                $project: {
                    _id: 0,
                    month: "$_id",
                    totalSales: 1
                }
            }
        ]);


        res.render('admin/dashboard', {
            months,
            data: JSON.stringify(paymentModeStats),
            totalBill: orderSum[0].totalBill,
            orderCount,
            userCount,
            totalQuantity: quantitySum[0].totalProducts,
            totalRevenue,

            monthlySalesData

        });


    } catch (error) {
        console.log(error.message);
    }
};

exports.salesReport = async (req, res) => {
    try {


        const totalRevenueResult = await order.aggregate([
            { $match: { "items.orderStatus": 'Delivered' } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: { $toDouble: "$orderBill" } }
                }
            }
        ]);


        const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].totalRevenue : 0;

        const monthlySalesData = await order.aggregate([
            {
                $match: { "items.orderStatus": 'Delivered' }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m", date: "$orderDate" }
                    },
                    totalSales: { $sum: { $toDouble: "$orderBill" } }
                }
            },
            {
                $project: {
                    _id: 0,
                    month: "$_id",
                    totalSales: 1
                }
            }
        ]);




        console.log(totalRevenue);

        res.render('admin/sales', {

            totalRevenue,

            monthlySalesData
        });

    } catch (error) {
        console.error('Error fetching sales data:', error);
        res.status(500).send('Internal Server Error');
    }
}
exports.chart = async (req, res) => {
    try {
        const { filter } = req.query;
        let filteredData = [];

        if (filter === 'monthly') {
            const monthlySalesData = await order.aggregate([
                {
                    $match: { "items.orderStatus": 'Delivered' }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: "%Y-%m", date: "$orderDate" }
                        },
                        totalSales: { $sum: { $toDouble: "$orderBill" } }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        month: "$_id",
                        totalSales: 1
                    }
                }
            ]);

            filteredData = monthlySalesData;
            //console.log("Monthly Data:", filteredData);

        } else if (filter === 'yearly') {

            const yearlySalesData = await order.aggregate([
                {
                    $match: { "items.orderStatus": 'Delivered' }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: "%Y", date: "$orderDate" }
                        },
                        totalSales: { $sum: { $toDouble: "$orderBill" } }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        year: "$_id",
                        totalSales: 1
                    }
                }
            ]);

            filteredData = yearlySalesData;
            //console.log("Yearly Data:", filteredData);
        } else if (filter === 'weekly') {

            const weeklySalesData = await order.aggregate([
                {
                    $match: { "items.orderStatus": 'Delivered' }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: "%Y-%U", date: "$orderDate" }
                        },
                        totalSales: { $sum: { $toDouble: "$orderBill" } }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        week: "$_id",
                        totalSales: 1
                    }
                },
                {
                    $sort: { week: 1 }
                }
            ]);

            filteredData = weeklySalesData;
            //console.log("Weekly Data:", filteredData);
        }

        const responseData = {
            monthNames: filteredData.map(item => item.year || item.week || item.month || null),
            salesData: filteredData.map(item => item.totalSales || 0),
            weeks: filteredData.map(item => item.week || null),
            years: filteredData.map(item => item.year || null),
        };

        res.json(responseData);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.orderReport = async (req, res) => {
    try {
        req.session.filterDate = false;
        const formatDate = function (date) {
            const day = ('0' + date.getDate()).slice(-2);
            const month = ('0' + (date.getMonth() + 1)).slice(-2);
            const year = date.getFullYear().toString();
            return `${day}-${month}-${year}`;
        };
        const orders = await order.find({ 'items.orderStatus': 'Delivered' });
        res.render('admin/reports', { orders, formatDate });
    } catch (error) {
        console.log(error.message);
    }
}
exports.orderExcel = async (req, res) => {
    try {
        let salesReport;
        if (req.session.filterDate) {
            const from = req.session.from;
            const to = req.session.to;
            salesReport = await order.find({
                'items.orderStatus': 'Delivered',
                orderDate: { $gte: from, $lte: to },
            });
        } else {
            salesReport = await order.find({ 'items.orderStatus': 'Delivered' });
        }
        const workbook = new excelJs.Workbook();
        const worksheet = workbook.addWorksheet('sales Report');
        worksheet.columns = [
            {
                header: 'S no.',
                key: 's_no',
                width: 10,
            },
            { header: 'OrderID', key: '_id', width: 30 },
            { header: 'Date', key: 'orderDate', width: 20 },
            { header: 'Products', key: 'ProductName', width: 30 },
            { header: 'Method', key: 'paymentMode', width: 10 },
            { header: 'Amount', key: 'orderBill' },
        ];
        let counter = 1;
        salesReport.forEach((report) => {
            report.s_no = counter;
            report.ProductName = '';
            report.items.forEach((eachProduct) => {
                report.ProductName += eachProduct.productName + ',';
            });
            worksheet.addRow(report);
            counter++;
        });
        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true };
        });
        res.header('Content-Type', 'application/vnd.oppenxmlformats-officedocument.spreadsheatml.sheet');
        res.header('Content-Disposition', 'attachment; filename=report.xlsx');

        workbook.xlsx.write(res);
    } catch (error) {
        console.log(error.message);
    }
}
exports.orderSearch = async (req, res) => {
    try {
        req.session.orderSearchErr = '';
        const formatDate = function (date) {
            const day = ('0' + date.getDate()).slice(-2);
            const month = ('0' + (date.getMonth() + 1)).slice(-2);
            const year = date.getFullYear().toString();
            return `${day}-${month}-${year}`;
        };

        const from = new Date(req.body.fromdate);
        const to = new Date(req.body.todate);
        req.session.filterDate = true;
        req.session.from = from;
        req.session.to = to;


        if (from > to) {
            req.session.orderSearchErr = "Invalid date range. 'From' date must be before or equal to 'To' date.";
            return res.render('admin/reports', { orders: [], formatDate, message: req.session.orderSearchErr });
        }

        const orders = await order.find({
            'items.orderStatus': 'Delivered',
            orderDate: { $gte: from, $lte: to },
        });

        if (orders.length === 0) {
            req.session.orderSearchErr = 'No orders found';
            return res.render('admin/reports', { orders: [], formatDate, message: req.session.orderSearchErr });
        }

        res.render('admin/reports', { orders, formatDate, message: req.session.orderSearchErr });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
}