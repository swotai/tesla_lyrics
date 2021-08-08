// Express Error handler
const errorHandler = (err, req, res) => {
    if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        res
            .status(403)
            .send({ title: "Server responded with an error", message: err.message });
    } else if (err.request) {
        // The request was made but no response was received
        res.status(503).send({
            title: "Unable to communicate with server",
            message: err.message,
        });
    } else {
        // Something happened in setting up the request that triggered an Error
        res
            .status(500)
            .send({ title: "An unexpected error occurred", message: err.message });
    }
};

exports.errorHandler = errorHandler;
