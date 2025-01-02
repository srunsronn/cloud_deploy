const waitPort = require('wait-port');
const mysql = require('mysql2');
const fs = require('fs');

// console.log('Environment Variables:', process.env);
const {
    MYSQL_HOST: HOST,
    MYSQL_USER: USER,
    MYSQL_PASSWORD: PASSWORD,
    MYSQL_DB: DB,
} = process.env;
console.log({ HOST, USER, PASSWORD, DB });
if (!HOST || !USER || !PASSWORD || !DB) {
    throw new Error(
        'Database connection variables are not set correctly. Please check your .env file.',
    );
}
let pool;

async function init() {
    // Wait for the RDS instance to be accessible
    await waitPort({
        host: HOST,
        port: 3306,
        timeout: 10000,
        waitForDns: true,
    });

    // Create a connection pool
    pool = mysql.createPool({
        connectionLimit: 5,
        host: HOST,
        user: USER.trim(),
        password: PASSWORD,
        database: DB,
        charset: 'utf8mb4',
        ssl: {
            rejectUnauthorized: false,
        }, // Use SSL if RDS requires it
    });

    return new Promise((resolve, reject) => {
        pool.query(
            'CREATE TABLE IF NOT EXISTS todo_items (id varchar(36), name varchar(255), completed boolean) DEFAULT CHARSET utf8mb4',
            (err) => {
                if (err) return reject(err);
                console.log(`Connected to MySQL database at ${HOST}`);
                resolve();
            },
        );
    });
}

async function teardown() {
    return new Promise((acc, rej) => {
        pool.end((err) => {
            if (err) rej(err);
            else acc();
        });
    });
}

async function getItems() {
    return new Promise((acc, rej) => {
        pool.query('SELECT * FROM todo_items', (err, rows) => {
            if (err) return rej(err);
            acc(
                rows.map((item) =>
                    Object.assign({}, item, {
                        completed: item.completed === 1,
                    }),
                ),
            );
        });
    });
}

async function getItem(id) {
    console.log('Fetching items from the database...');
    return new Promise((acc, rej) => {
        pool.query('SELECT * FROM todo_items WHERE id=?', [id], (err, rows) => {
            if (err) return rej(err);
            acc(
                rows.map((item) =>
                    Object.assign({}, item, {
                        completed: item.completed === 1,
                    }),
                )[0],
            );
        });
    });
}

async function storeItem(item) {
    return new Promise((acc, rej) => {
        pool.query(
            'INSERT INTO todo_items (id, name, completed) VALUES (?, ?, ?)',
            [item.id, item.name, item.completed ? 1 : 0],
            (err) => {
                if (err) return rej(err);
                acc();
            },
        );
    });
}

async function updateItem(id, item) {
    return new Promise((acc, rej) => {
        pool.query(
            'UPDATE todo_items SET name=?, completed=? WHERE id=?',
            [item.name, item.completed ? 1 : 0, id],
            (err) => {
                if (err) return rej(err);
                acc();
            },
        );
    });
}

async function removeItem(id) {
    return new Promise((acc, rej) => {
        pool.query('DELETE FROM todo_items WHERE id = ?', [id], (err) => {
            if (err) return rej(err);
            acc();
        });
    });
}

module.exports = {
    init,
    teardown,
    getItems,
    getItem,
    storeItem,
    updateItem,
    removeItem,
};
