const form = document.querySelector('#formulario');
const mensagem = document.querySelector('#mensagem');
const lista = document.querySelector('#lista');

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = tipo; // 'sucesso' ou 'erro'
}

async function carregarUsuarios() {
  try {
    const resposta = await fetch('/usuarios');
    if (!resposta.ok) throw new Error('Falha ao carregar a lista.');
    const usuarios = await resposta.json();

    lista.innerHTML = '';
    usuarios.forEach(u => {
      const li = document.createElement('li');
      // textContent evita XSS: o conteúdo nunca é interpretado como HTML
      li.textContent = `${u.nome} — ${u.email}`;
      lista.appendChild(li);
    });
  } catch (erro) {
    console.error(erro);
    mostrarMensagem('Não foi possível carregar os usuários.', 'erro');
  }
}

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const nome = document.querySelector('#nome').value.trim();
  const email = document.querySelector('#email').value.trim();
  const botao = form.querySelector('button');

  botao.disabled = true;
  try {
    const resposta = await fetch('/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email })
    });
    const dados = await resposta.json().catch(() => ({}));

    if (resposta.ok) {
      mostrarMensagem('Cadastro realizado!', 'sucesso');
      form.reset();
      carregarUsuarios();
    } else {
      mostrarMensagem(dados.erro || 'Erro ao cadastrar.', 'erro');
    }
  } catch (erro) {
    console.error(erro);
    mostrarMensagem('Não foi possível conectar ao servidor.', 'erro');
  } finally {
    botao.disabled = false;
  }
});

carregarUsuarios();
