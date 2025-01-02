if (process.env.DB_HOST) {
    console.log('Using MySQL persistence.');
    module.exports = require('./mysql');
}

