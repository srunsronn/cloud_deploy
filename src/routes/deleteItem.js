const db = require('../persistence/mysql');

module.exports = async (req, res) => {
    await db.removeItem(req.params.id);
    res.sendStatus(200);
};
