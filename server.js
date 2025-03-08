'use strict';

const express = require('express');
const app = express();
const path = require('path');
const homeRoute = require('./routes/home');
const staticRoutes = require('./routes/static');

const environment = process.env.NODE_ENV || 'development';
const config = require(`./config/${environment}.js`);

app.set('view engine', 'ejs'); // Set EJS as templating engine
app.set('views', path.join(__dirname, 'templates')); // Define template folder

// Serve static files (CSS, JS, images) from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', homeRoute);  // ✅ Home page
app.use('/', staticRoutes); // ✅ Serve Solidity contract content

// 404 Error Handling
app.use((req, res) => {
    res.status(404).send('404 - Not Found');
});

// Start Server
app.listen(config.port, () => {
    console.log(`🚀 Server Listening - http://localhost:${config.port}. ${environment} environment`);
});
