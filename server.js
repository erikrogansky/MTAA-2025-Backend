require('dotenv').config();
const express = require('express');
const usersRoutes = require('./routes/users');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'Hello, Node.js Server!' });
});

app.use('/users', usersRoutes);

app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
