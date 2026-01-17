// controllers/reportController.js - SIMPLE VERSION
exports.getAllReports = async (req, res) => {
    res.json({
        success: true,
        message: 'Reports endpoint',
        data: []
    });
};

exports.getVehicleReports = async (req, res) => {
    res.json({
        success: true,
        message: 'Vehicle reports',
        data: []
    });
};

exports.getServiceReports = async (req, res) => {
    res.json({
        success: true,
        message: 'Service reports',
        data: []
    });
};

exports.getFinancialReports = async (req, res) => {
    res.json({
        success: true,
        message: 'Financial reports',
        data: []
    });
};

exports.exportReportsToExcel = async (req, res) => {
    res.json({
        success: false,
        message: 'Excel export requires exceljs package'
    });
};