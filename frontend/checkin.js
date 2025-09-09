let criancaSelecionada = null;
let criancasCache = []; // Armazena lista para busca

document.addEventListener('DOMContentLoaded', () => {
    inicializarAplicacao();
});

function inicializarAplicacao() {
    carregarCriancas();
    document.getElementById('btnCadastrarNova').addEventListener('click', abrirCadastro);
    
    // ✅ Só adiciona o evento se o botão existir
    const btnRecarregar = document.getElementById('btnRecarregar');
    if (btnRecarregar) {
        btnRecarregar.classList.add('ativo');
        btnRecarregar.addEventListener('click', carregarCriancas);
    }

    // ✅ Campo de busca
    const inputBusca = document.getElementById('buscaCrianca');
    if (inputBusca) {
        inputBusca.addEventListener('input', (e) => {
            const termo = e.target.value.toLowerCase().trim();
            const filtradas = criancasCache.filter(crianca => 
                crianca.nome.toLowerCase().includes(termo) || 
                crianca.turma.toLowerCase().includes(termo)
            );
            renderizarListaCriancas(filtradas);
        });
    }

    // ✅ Check-in por código
    const btnCheckinCodigo = document.getElementById('btnCheckinCodigo');
    if (btnCheckinCodigo) {
        btnCheckinCodigo.addEventListener('click', () => {
            const codigoInput = document.getElementById('codigoCheckin');
            const codigo = codigoInput.value.trim();
            const match = codigo.match(/CHK-(\d+)/i); // Aceita maiúsculas/minúsculas
            
            if (!match) {
                alert('Código inválido. Use o formato: CHK-000123');
                return;
            }
            
            const id = parseInt(match[1]);
            const crianca = criancasCache.find(c => c.id === id);
            
            if (crianca) {
                realizarCheckin(crianca);
                codigoInput.value = ''; // Limpa após uso
            } else {
                alert('Criança não encontrada. Verifique o código.');
            }
        });
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

        criancasCache = data.criancas || [];
        renderizarListaCriancas(criancasCache);

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

function renderizarListaCriancas(criancas) {
    const listaDiv = document.getElementById('listaCriancas');
    listaDiv.innerHTML = '<h3>Selecione uma criança:</h3>';
    
    if (criancas.length === 0) {
        listaDiv.innerHTML += '<p class="empty-state">Nenhuma criança encontrada.</p>';
        return;
    }
    
    const containerBotoes = document.createElement('div');
    containerBotoes.className = 'botoes-criancas';
    
    criancas.forEach(crianca => {
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
            document.getElementById('areaAlerta').classList.add('ativo');
            
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
