const express = require('express');
const app = express();
const path = require('path');
const port = 4111;

app.use(express.static(path.join(__dirname, 'lib')));

app.listen(port, () => { console.log(`Dev server now listening on ${port}`)});