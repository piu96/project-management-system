const sendResponse = (res, error, message, data = null, errors = null) => {
    res.status(status).json({
        error,
        message,
        data,
        page,
        per_page,
        total,
        total_pages,
        errors
    });
};

module.exports = { sendResponse };
