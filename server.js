require('dotenv').config();
const express = require('express');
const path = require('path');
const pool = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/usuarios', async (req, res) => {
  const nome = typeof req.body.nome === 'string' ? req.body.nome.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';

  if (!nome || !email) {
    return res.status(400).json({ erro: 'Informe nome e e-mail.' });
  }
  if (nome.length > 100 || email.length > 150) {
    return res.status(400).json({ erro: 'Nome (máx. 100) ou e-mail (máx. 150) muito longo.' });
  }
  if (!REGEX_EMAIL.test(email)) {
    return res.status(400).json({ erro: 'E-mail inválido.' });
  }

  try {
    const sql = 'INSERT INTO usuarios (nome, email) VALUES (?, ?)';
    const [resultado] = await pool.execute(sql, [nome, email]);
    res.status(201).json({ id: resultado.insertId, nome, email });
  } catch (erro) {
    console.error('Erro ao cadastrar:', erro);
    if (erro.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ erro: 'E-mail já cadastrado.' });
    }
    res.status(500).json({ erro: 'Não foi possível cadastrar.' });
  }
});

app.get('/usuarios', async (_req, res) => {
  try {
    const [usuarios] = await pool.execute(
      'SELECT id, nome, email, criado_em FROM usuarios ORDER BY id DESC'
    );
    res.json(usuarios);
  } catch (erro) {
    console.error('Erro ao consultar:', erro);
    res.status(500).json({ erro: 'Não foi possível consultar.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor em http://localhost:${PORT}`);
});
