const express = require('express');
const produtos = express.Router();
const Produto = require('../model/Produto');

produtos.route('/')
    .get(async (req, res) => {
        res.json({ mensagem: 'rota get' })
    })
    .post(async (req, res) => {
        const { nome, descricao, quantidade, preco, desconto, dataDesconto, categoria, imgProduto } = req.body;
        try {
            if (!nome || !descricao || !quantidade || !preco || !categoria || !imgProduto) {
                return res.status(400).json({ message: "Campos obrigatórios ausentes." });
            }
            if (desconto && dataDesconto) {
                const produto = new Produto({ nome, descricao, quantidade, preco, desconto, dataDesconto, categoria, imgProduto });
                await produto.save();
                res.status(201).json(produto);
            } else {
                const produto = new Produto({ nome, descricao, quantidade, preco, categoria, imgProduto });
                await produto.save();
                res.status(201).json(produto);
            }
        } catch (err) {
            console.log(err);
            res.status(500).json(err);
        }

    })
    .put(async (req, res) => {
        res.json({ message: "rota put" })
    })
    .delete(async (req, res) => {
        res.json({ mensagem: 'rota delete' })
    });

module.exports = produtos;