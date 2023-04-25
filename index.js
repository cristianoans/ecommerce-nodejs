require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');



const produtos = require('./routes/produtos');
const app = express();

app.use(express.json());

mongoose.connect(process.env.db_url);

//rotas
app.use('/produtos', produtos);
app.use(express.static('uploads'))
app.get('/uploads/:filename', (req, res) => {
    const filename = req.params.filename;
      res.sendFile(`${__dirname}/uploads/${filename}`);
  });
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(3000, () =>{
    console.log('http://localhost:3000');
})