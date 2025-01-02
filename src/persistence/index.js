if (process.env.DB_HOST) {
    console.log('Using MySQL persistence.');
    module.exports = require('./mysql');
}
// else {
//     console.warn('DB_HOST is not set. Falling back to SQLite.');
//     module.exports = require('./sqlite');
// }
