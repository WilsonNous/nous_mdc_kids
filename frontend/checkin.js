let criancaSelecionada = null;

document.addEventListener('DOMContentLoaded', () => {
    carregarCriancas();
    document.getElementById('btnCadastrarNova').addEventListener('click', abrirCadastro);
});

async function carregarCriancas() {
    const listaDiv = document.getElementById('listaCriancas');
    listaDiv.innerHTML = '<p>Carregando...</p>';

    try {
        const response = await fetch('/listar-criancas');
        const data = await response.json();

        if (!data.success) throw new Error(data.error);

        listaDiv.innerHTML = '<h3>Selecione uma criança:</h3>';
        if (data.criancas.length === 0) {
            listaDiv.innerHTML += '<p>Nenhuma criança cadastrada.</p>';
        } else {
            data.criancas.forEach(crianca => {
                const btn = document.createElement('button');
                btn.textContent = `✅ ${crianca.nome} (${crianca.turma})`;
                btn.className = 'btn-checkin';
                btn.onclick = () => realizarCheckin(crianca);
                listaDiv.appendChild(btn);
            });
        }

    } catch (error) {
        listaDiv.innerHTML = `<p>❌ Erro ao carregar: ${error.message}</p>`;
    }
}

function realizarCheckin(crianca) {
    criancaSelecionada = crianca;

    // Envia check-in
    fetch('/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            crianca_id: crianca.id,
            status: 'presente'
        })
    })
    .then(r => r.json())
    .then(data => {
        const msgDiv = document.getElementById('mensagemCheckin');
        if (data.success) {
            msgDiv.className = 'mensagem sucesso';
            msgDiv.textContent = `✅ Check-in realizado para ${crianca.nome}!`;
            document.getElementById('areaAlerta').style.display = 'block'; // Mostra opção de alerta
        } else {
            throw new Error(data.error);
        }
    })
    .catch(err => {
        document.getElementById('mensagemCheckin').className = 'mensagem erro';
        document.getElementById('mensagemCheckin').textContent = '❌ Erro: ' + err.message;
    });
}

function abrirCadastro() {
    if (confirm("Deseja cadastrar uma nova criança? Você será redirecionado.")) {
        window.location.href = "index.html";
    }
}

// Estilo básico para os botões (opcional, pode mover pro CSS)
const style = document.createElement('style');
style.textContent = `
    .btn-checkin {
        width: 100%;
        margin: 8px 0;
        padding: 12px;
        background: #27ae60;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
    }
    .btn-checkin:hover {
        background: #229954;
    }
    .btn-cadastrar {
        width: 100%;
        padding: 14px;
        background: #3498db;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        font-size: 1.1rem;
    }
    .btn-cadastrar:hover {
        background: #2980b9;
    }
`;
document.head.appendChild(style);
