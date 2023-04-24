const {model, Schema} = require('mongoose');

const Produto = model('produto',new Schema({
    nome: {
        type: String,
        require: true,
    },
    descricao:{
        type: String,
        require: true,
    },
    quantidade: {
        type: Number,
        require: true,
    },
    preco:{
        type: Number,
        require: true,
    },
    desconto: {
        type: Number,
    },
    dataDesconto: {
        type: Date,
    },
    categoria: {
        type: String,
        require: true,
    },
    imgProduto: {
        type: String,
        require: true,
    }
}));

module.exports = Produto;