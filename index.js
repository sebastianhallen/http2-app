'use strict';
const express = require('express');
const path = require('path');
const port = process.env.PORT || 1337;
const app = express();

app.get('/', (request, response) => {
  response.sendFile(path.join(__dirname, 'static', 'index.html'));
});

app.use('/static', express.static(path.join(__dirname, 'static')));

app.listen(port);
console.log(`server running on port: ${port}`);
