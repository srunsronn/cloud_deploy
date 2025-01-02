const db = require('../persistence/mysql'); // Ensure the path is correct
const { v4: uuid } = require('uuid');

module.exports = async (req, res) => {
    const item = {
        id: uuid(),
        name: req.body.name,
        completed: false,
    };

    try {
        await db.storeItem(item); // This should match the exported function
        res.status(201).send(item); // Respond with the created item
    } catch (error) {
        console.error('Error storing item:', error);
        res.status(500).send('Internal Server Error');
    }
};
