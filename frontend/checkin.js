let criancaSelecionada = null;

document.addEventListener('DOMContentLoaded', () => {
    inicializarAplicacao();
});

function inicializarAplicacao() {
    carregarCriancas();
    document.getElementById('btnCadastrarNova').addEventListener('click', abrirCadastro);
    
    // ✅ Só adiciona o evento se o botão existir
    const btnRecarregar = document.getElementById('btnRecarregar');
    if (btnRecarregar) {
        btnRecarregar.classList.add('ativo'); // Mostra via classe CSS
        btnRecarregar.addEventListener('click', carregarCriancas);
    }
}

async function carregarCriancas() {
    const listaDiv = document.getElementById('listaCriancas');
    listaDiv.innerHTML = '<p class="loading">Carregando...</p>';

    try {
        const response = await fetch('/listar-criancas');
        
        if (!response.ok) {
            throw new Error(`Erro no servidor: ${response.status}`);
        }
        
        const data = await response.json();

        if (!data.success) throw new Error(data.error);

        listaDiv.innerHTML = '<h3>Selecione uma criança:</h3>';
        
        if (data.criancas.length === 0) {
            listaDiv.innerHTML += '<p class="empty-state">Nenhuma criança cadastrada.</p>';
            return;
        }
        
        const containerBotoes = document.createElement('div');
        containerBotoes.className = 'botoes-criancas';
        
        data.criancas.forEach(crianca => {
            const btn = document.createElement('button');
            btn.className = 'btn-checkin';
            btn.dataset.id = crianca.id;
            btn.innerHTML = `
                <span class="icon">✅</span>
                <span class="nome">${crianca.nome}</span>
                <span class="turma">${crianca.turma}</span>
            `;
            btn.addEventListener('click', () => realizarCheckin(crianca));
            containerBotoes.appendChild(btn);
        });
        
        listaDiv.appendChild(containerBotoes);

    } catch (error) {
        console.error('Erro ao carregar crianças:', error);
        listaDiv.innerHTML = `
            <p class="error-message">❌ Erro ao carregar: ${error.message}</p>
            <button class="btn-recarregar" onclick="carregarCriancas()">
                🔄 Tentar novamente
            </button>
        `;
    }
}

async function realizarCheckin(crianca) {
    criancaSelecionada = crianca;
    const msgDiv = document.getElementById('mensagemCheckin');
    
    // Feedback visual imediato
    const botaoClicado = document.querySelector(`.btn-checkin[data-id="${crianca.id}"]`);
    if (botaoClicado) {
        botaoClicado.classList.add('processing');
        botaoClicado.disabled = true;
    }
    
    msgDiv.className = 'mensagem info';
    msgDiv.textContent = `Processando check-in para ${crianca.nome}...`;

    try {
        const response = await fetch('/checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                crianca_id: crianca.id,
                status: 'presente',
                timestamp: new Date().toISOString()
            })
        });
        
        if (!response.ok) {
            throw new Error(`Erro no servidor: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            msgDiv.className = 'mensagem sucesso';
            msgDiv.innerHTML = `✅ Check-in realizado para <strong>${crianca.nome}</strong>!`;
            document.getElementById('areaAlerta').classList.add('ativo'); // Mostra via classe
            
            // Animação de confirmação
            if (botaoClicado) {
                botaoClicado.classList.remove('processing');
                botaoClicado.classList.add('success');
                setTimeout(() => {
                    botaoClicado.classList.remove('success');
                    botaoClicado.disabled = false;
                }, 2000);
            }
            
            // Recarrega a lista após 3 segundos
            setTimeout(carregarCriancas, 3000);
        } else {
            throw new Error(data.error);
        }
    } catch (err) {
        console.error('Erro no check-in:', err);
        msgDiv.className = 'mensagem erro';
        msgDiv.textContent = '❌ Erro: ' + err.message;
        
        if (botaoClicado) {
            botaoClicado.classList.remove('processing');
            botaoClicado.disabled = false;
        }
    }
}

function abrirCadastro() {
    if (confirm("Deseja cadastrar uma nova criança? Você será redirecionado para a página de cadastro.")) {
        window.location.href = "index.html";
    }
}
