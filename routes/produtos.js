const express = require('express');
const produtos = express.Router();
const Produto = require('../model/Produto');
const Joi = require('joi');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

const upload = multer({ storage });

produtos.route('/')
    .get(async (req, res) => {
        const { nome, preco, categoria } = req.query;

        try {
            if (!nome && !preco && !categoria) {
                const response = await Produto.find();
                res.status(200).json(response);
            } else {
                const query = {};
                if (nome) {
                    query.nome = { $regex: nome, $options: 'i' };
                }
                if (preco) {
                    query.preco = { $gte: preco };
                }
                if (categoria) {
                    query.categoria = categoria;
                }
                const response = await Produto.find().or([query]);
                res.status(200).json(response)
            }
        } catch (err) {
            res.status(500).json(err);
        }

    })
    .post(upload.array('imgProduto', 5), async (req, res) => {

        const postSchema = Joi.object({
            nome: Joi.string().required(),
            descricao: Joi.string().required(),
            quantidade: Joi.number().integer().required(),
            preco: Joi.number().positive().required(),
            desconto: Joi.number().min(0).max(1).optional(),
            dataDesconto: Joi.date().iso().optional(),
            categoria: Joi.string().required()
        });

        const { error } = postSchema.validate(req.body);

        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const { nome, descricao, quantidade, preco, desconto, dataDesconto, categoria } = req.body;

        try {
            const imgProduto = req.files.map(file => file.path.replace(/\\/g, '/'));
            if(imgProduto.length === 0) {
                return res.status(400).json({mensagem: "campo imagem é obrigatório"})
            }

            if (typeof desconto !== 'undefined' && typeof dataDesconto !== 'undefined') {
                const precoComDesconto = preco - (preco * desconto);
                const produto = new Produto({ nome, descricao, quantidade, preco, desconto, precoComDesconto, dataDesconto, categoria, imgProduto });
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
        const putSchema = Joi.object({
            id: Joi.string().required(),
            nome: Joi.string().required(),
            descricao: Joi.string().required(),
            quantidade: Joi.number().integer().required(),
            preco: Joi.number().positive().required(),
            desconto: Joi.number().min(0).max(1).optional(),
            dataDesconto: Joi.date().iso().optional(),
            categoria: Joi.string().required(),
            imgProduto: Joi.string().required()
        });

        const { error } = putSchema.validate(req.body);

        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const { id, nome, descricao, quantidade, preco, desconto, dataDesconto, categoria, imgProduto } = req.body;

        try {

            const produtoEncontrado = await Produto.findById(id);
            if (!produtoEncontrado) {
                return res.status(404).json({ message: "produto não encontrado!" });
            }

            if (typeof desconto !== 'undefined' && typeof dataDesconto !== 'undefined') {
                const precoComDesconto = preco - (preco * desconto);
                const response = await Produto.findByIdAndUpdate(id, { nome, descricao, quantidade, preco, desconto, dataDesconto, precoComDesconto, categoria, imgProduto }, { new: true })
                res.status(200).json(response);
            } else {
                const response = await Produto.findByIdAndUpdate(id, { nome, descricao, quantidade, preco, categoria, imgProduto }, { new: true })
                res.status(200).json(response);
            }

        } catch (err) {
            console.log(err);
            res.status(500).json(err);
        }

    })
    .delete(async (req, res) => {
        const deleteSchema = Joi.object({
            id: Joi.string().required()
        });

        const { error } = deleteSchema.validate(req.body);

        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const { id } = req.body;

        try {
            const response = await Produto.findByIdAndRemove(id);
            if (!response) {
                return res.status(404).json({ mensagem: "produto não encontrado" });
            }
            res.status(200).json({ mensagem: "produto excluido com sucesso.", produto: response });
        } catch (err) {
            res.status(500).json(err);
        }
    });

module.exports = produtos;