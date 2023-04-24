require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const produtos = require('./routes/produtos');
const app = express();

app.use(express.json());
mongoose.connect(process.env.db_url);

//rotas
app.use('/produtos', produtos);

app.listen(3000, () =>{
    console.log('http://localhost:3000');
})




