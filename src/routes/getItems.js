const db = require('../persistence/mysql');

module.exports = async (req, res) => {
    try {
        const items = await db.getItems();
        res.json(items);
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).send('Internal Server Error');
    }
};
