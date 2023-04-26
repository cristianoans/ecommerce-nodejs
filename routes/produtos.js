const express = require('express');
const produtos = express.Router();
const Produto = require('../model/Produto');
const Joi = require('joi');
const mime = require('mime-types');
const moment = require('moment');
const multer = require('multer');
const path = require('path');
const fs = require('fs');


const storage = multer.diskStorage({ // função que define o nome do arquivo a ser gravado localmente, bem como em qual pasta será gravado.
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
    .post(upload.array('imgProduto', 5), async (req, res) => { // aqui informamos que esperamos receber um array de arquivos com tamanho máximo de 5.

        const postSchema = Joi.object({ // este schema define o tipo de cada dado presente na requisição para que façamos a validação.
            nome: Joi.string().required(),
            descricao: Joi.string().required(),
            quantidade: Joi.number().integer().required(),
            preco: Joi.number().positive().required(),
            desconto: Joi.number().min(0).max(1).optional(),
            dataDesconto: Joi.date().iso().optional(),
            categoria: Joi.string().required()
        });

        if (req.body.dataDesconto) { // esta função determina o formato esperado para a dataDesconto
            const momentDate = moment(req.body.dataDesconto, 'DD/MM/YYYY', true);
            if (!momentDate.isValid()) { // se não tiver no formato encerra o código e retorna erro ao usuário
                return res.status(400).json({ message: 'Data inválida. O formato esperado é DD/MM/YYYY.' });
            }
            req.body.dataDesconto = momentDate.format('YYYY-MM-DD'); // se o formato for válido, converte para o formato da iso e reatribui o valor na requisição para então validar com o Joi
        }

        const { error } = postSchema.validate(req.body); // usa a função validate do Joi, caso gere algum erro a variavel error será definida

        if (error) { // se a variavel tiver definida, retornamos o erro ao usuário e encerramos o código.
            return res.status(400).json({ message: error.details[0].message });
        }

        // desestruturação dos campos da requisição para gravar o objeto a ser criado.
        const { nome, descricao, quantidade, preco, desconto, dataDesconto, categoria } = req.body;

        try {
            
            //valida se o array de imagens está vazio
            if (req.files.length === 0) { // se array vazio encerra o a execução e retorna erro ao usuário
                return res.status(400).json({ mensagem: "campo imagem é obrigatório" })
            }

            for (const imagem of req.files) { // percorre cada arquivo enviado na requisição 
                if (!validaArquivo(imagem.originalname)) { // enviamos o arquivo para a função e ela verifica se é imagem ou não
                    fs.unlink(imagem.path, () => {}); // se não for imagem esta linha remove o arquivo da pasta antes de finalizar o código com erro ao usuário.
                    return res.status(400).json({ mensagem: 'Arquivo inválido. Somente imagens são permitidas.' });
                }
            }

            // define o nome do arquivo a ser gravado na pasta upload bem como seu caminho para ser gravado no banco de dados.
            const imgProduto = req.files.map(file => file.path.replace(/\\/g, '/'));

            // verifica se o campo desconto e dataDesconto foram informados na requisição
            if (typeof desconto !== 'undefined' && typeof dataDesconto !== 'undefined') { // se positivo gera o preco com desconto e grava o objeto com este campo.
                const precoComDesconto = preco - (preco * desconto);
                const produto = new Produto({ nome, descricao, quantidade, preco, desconto, precoComDesconto, dataDesconto, categoria, imgProduto });
                await produto.save();
                res.status(201).json(produto);
            } else { // se não for informado o desconto e dataDesconto, gravamos o objeto somente com o preco original e sem os dados de desconto.
                const produto = new Produto({ nome, descricao, quantidade, preco, categoria, imgProduto });
                await produto.save();
                res.status(201).json(produto);
            }
        } catch (err) { // se ocorrer algum erro no banco de dados retornamos o erro para o usuário.
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

        if (req.body.dataDesconto) {
            const momentDate = moment(req.body.dataDesconto, 'DD/MM/YYYY', true);
            if (!momentDate.isValid()) {
                return res.status(400).json({ message: 'Data inválida. O formato esperado é DD/MM/YYYY.' });
            }
            req.body.dataDesconto = momentDate.format('YYYY-MM-DD');
        }

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


function validaArquivo(nomeArquivo) { // função que verifica se o tipo de arquivo enviado é do tipo imagem
    const extensao = nomeArquivo.split('.').pop(); // faz o split para extrair a extensao do nome do arquivo
    const tipoMIME = mime.lookup(extensao); // usa a função do mime "lookup" para comparar a extensão

    return tipoMIME && tipoMIME.startsWith('image/');
}

module.exports = produtos;
