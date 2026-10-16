const express = require('express');
const app = express();
const PORTA = 3000;

app.use(express.json());

let proximoId = 3;
let livros = [
  { id: 1, titulo: 'Dom Casmurro', autor: 'Machado de Assis' },
  { id: 2, titulo: 'Vidas Secas', autor: 'Graciliano Ramos' }
];

// ---------- Página web (abre em http://localhost:3000) ----------
const PAGINA = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>API de Livros</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 640px; margin: 24px auto; padding: 0 16px; background: #f5f5f7; color: #222; }
  h1 { font-size: 1.5rem; }
  .card { background: #fff; border-radius: 10px; padding: 16px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
  input { padding: 8px; margin: 4px 4px 4px 0; border: 1px solid #ccc; border-radius: 6px; font-size: 1rem; }
  button { padding: 8px 12px; border: 0; border-radius: 6px; background: #2563eb; color: #fff; cursor: pointer; font-size: .95rem; }
  button.sec { background: #6b7280; }
  button.del { background: #dc2626; }
  .livro { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee; gap: 8px; }
  .livro:last-child { border-bottom: 0; }
  #msg { min-height: 1.4em; font-weight: 600; }
  .ok { color: #15803d; } .erro { color: #b91c1c; }
</style>
</head>
<body>
<h1>📚 API de Livros</h1>
<div id="msg"></div>

<div class="card">
  <strong>Adicionar livro</strong><br>
  <input id="titulo" placeholder="Título">
  <input id="autor" placeholder="Autor">
  <button onclick="adicionar()">Adicionar</button>
</div>

<div class="card">
  <strong>Buscar</strong><br>
  <input id="termo" placeholder="Título ou autor">
  <button onclick="buscar()">Buscar</button>
  <button class="sec" onclick="listar()">Mostrar todos</button>
</div>

<div class="card">
  <strong>Livros</strong>
  <div id="lista"></div>
</div>

<script>
function mensagem(texto, ok) {
  var m = document.getElementById('msg');
  m.textContent = texto;
  m.className = ok ? 'ok' : 'erro';
}

function mostrar(livros) {
  var lista = document.getElementById('lista');
  lista.innerHTML = '';
  if (livros.length === 0) { lista.textContent = 'Nenhum livro encontrado.'; return; }
  livros.forEach(function (l) {
    var linha = document.createElement('div');
    linha.className = 'livro';
    var texto = document.createElement('span');
    texto.textContent = '#' + l.id + ' — ' + l.titulo + ' (' + l.autor + ')';
    var botoes = document.createElement('span');
    var bEd = document.createElement('button');
    bEd.textContent = 'Editar';
    bEd.onclick = function () { editar(l); };
    var bDel = document.createElement('button');
    bDel.textContent = 'Apagar';
    bDel.className = 'del';
    bDel.onclick = function () { apagar(l.id); };
    botoes.appendChild(bEd);
    botoes.appendChild(document.createTextNode(' '));
    botoes.appendChild(bDel);
    linha.appendChild(texto);
    linha.appendChild(botoes);
    lista.appendChild(linha);
  });
}

async function listar() {
  var r = await fetch('/livros');
  mostrar(await r.json());
}

async function buscar() {
  var termo = document.getElementById('termo').value;
  var r = await fetch('/buscar?termo=' + encodeURIComponent(termo));
  mostrar(await r.json());
}

async function adicionar() {
  var titulo = document.getElementById('titulo').value;
  var autor = document.getElementById('autor').value;
  var r = await fetch('/livros', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ titulo: titulo, autor: autor })
  });
  var dados = await r.json();
  if (r.ok) {
    mensagem('Livro adicionado (status ' + r.status + ')', true);
    document.getElementById('titulo').value = '';
    document.getElementById('autor').value = '';
    listar();
  } else {
    mensagem(dados.erro + ' (status ' + r.status + ')', false);
  }
}

async function editar(l) {
  var titulo = prompt('Novo título:', l.titulo);
  if (titulo === null) return;
  var autor = prompt('Novo autor:', l.autor);
  if (autor === null) return;
  var r = await fetch('/livros/' + l.id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ titulo: titulo, autor: autor })
  });
  var dados = await r.json();
  if (r.ok) { mensagem('Livro atualizado (status ' + r.status + ')', true); listar(); }
  else { mensagem(dados.erro + ' (status ' + r.status + ')', false); }
}

async function apagar(id) {
  if (!confirm('Apagar o livro ' + id + '?')) return;
  var r = await fetch('/livros/' + id, { method: 'DELETE' });
  if (r.status === 204) { mensagem('Livro apagado (status 204)', true); listar(); }
  else { mensagem('Livro não encontrado (status ' + r.status + ')', false); }
}

listar();
</script>
</body>
</html>`;

app.get('/', (req, res) => {
  res.send(PAGINA);
});

// ---------- API ----------
app.get('/livros', (req, res) => {
  res.json(livros);
});

app.get('/buscar', (req, res) => {
  const termo = String(req.query.termo || '').toLowerCase();
  const resultado = livros.filter(l =>
    l.titulo.toLowerCase().includes(termo) ||
    l.autor.toLowerCase().includes(termo)
  );
  res.json(resultado);
});

app.get('/livros/:id', (req, res) => {
  const id = Number(req.params.id);
  const livro = livros.find(item => item.id === id);
  if (!livro) {
    return res.status(404).json({ erro: 'Livro não encontrado' });
  }
  res.json(livro);
});

app.post('/livros', (req, res) => {
  const { titulo, autor } = req.body || {};
  if (typeof titulo !== 'string' || !titulo.trim() ||
      typeof autor !== 'string' || !autor.trim()) {
    return res.status(400).json({ erro: 'Informe título e autor válidos' });
  }
  const novoLivro = { id: proximoId++, titulo: titulo.trim(), autor: autor.trim() };
  livros.push(novoLivro);
  res.status(201).json(novoLivro);
});

app.put('/livros/:id', (req, res) => {
  const id = Number(req.params.id);
  const livro = livros.find(item => item.id === id);
  if (!livro) {
    return res.status(404).json({ erro: 'Livro não encontrado' });
  }
  const { titulo, autor } = req.body || {};
  if (typeof titulo === 'string' && titulo.trim()) livro.titulo = titulo.trim();
  if (typeof autor === 'string' && autor.trim()) livro.autor = autor.trim();
  res.json(livro);
});

app.delete('/livros/:id', (req, res) => {
  const id = Number(req.params.id);
  const quantidadeAntes = livros.length;
  livros = livros.filter(item => item.id !== id);
  if (livros.length === quantidadeAntes) {
    return res.status(404).json({ erro: 'Livro não encontrado' });
  }
  res.status(204).end();
});

app.listen(PORTA, () => {
  console.log(`API ativa em http://localhost:${PORTA}`);
});
