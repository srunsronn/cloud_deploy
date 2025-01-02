require('dotenv').config();
const express = require('express');
const app = express();
const db = require('./persistence/mysql');
const getItems = require('./routes/getItems');
const addItem = require('./routes/addItem');
const updateItem = require('./routes/updateItem');
const deleteItem = require('./routes/deleteItem');

app.use(express.json());
app.use(express.static(__dirname + '/static'));

app.get('/items', getItems);
app.post('/items', addItem);
app.put('/items/:id', updateItem);
app.delete('/items/:id', deleteItem);

console.log('Initializing database connection...');
db.init()
    .then(() => {
        console.log('Database connected, starting server...');
        app.listen(3000, () => console.log('Listening on port 3000'));
    })
    .catch((err) => {
        console.error('Database initialization failed:', err);
        process.exit(1);
    });

const gracefulShutdown = () => {
    db.teardown()
        .catch(() => {})
        .then(() => process.exit());
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('SIGUSR2', gracefulShutdown); // Sent by nodemon
