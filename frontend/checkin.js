let criancaSelecionada = null;

document.addEventListener('DOMContentLoaded', () => {
    inicializarAplicacao();
});

function inicializarAplicacao() {
    carregarCriancas();
    document.getElementById('btnCadastrarNova').addEventListener('click', abrirCadastro);
    document.getElementById('btnRecarregar').addEventListener('click', carregarCriancas);
}

async function carregarCriancas() {
    const listaDiv = document.getElementById('listaCriancas');
    const loadingElement = listaDiv.querySelector('.loading') || document.createElement('p');
    
    loadingElement.className = 'loading';
    loadingElement.textContent = 'Carregando...';
    listaDiv.innerHTML = '';
    listaDiv.appendChild(loadingElement);

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
            btn.textContent = `${crianca.nome} (${crianca.turma})`;
            btn.className = 'btn-checkin';
            btn.dataset.id = crianca.id;
            btn.innerHTML = `
                <span class="icon">✅</span>
                <span class="nome">${crianca.nome}</span>
                <span class="turma">${crianca.turma}</span>
            `;
            btn.onclick = () => realizarCheckin(crianca);
            containerBotoes.appendChild(btn);
        });
        
        listaDiv.appendChild(containerBotoes);

    } catch (error) {
        console.error('Erro ao carregar crianças:', error);
        listaDiv.innerHTML = `
            <p class="error-message">❌ Erro ao carregar: ${error.message}</p>
            <button class="btn-recarregar" onclick="carregarCriancas()">
                Tentar novamente
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
            document.getElementById('areaAlerta').style.display = 'block';
            
            // Adicionar animação de confirmação
            if (botaoClicado) {
                botaoClicado.classList.remove('processing');
                botaoClicado.classList.add('success');
                setTimeout(() => {
                    botaoClicado.classList.remove('success');
                    botaoClicado.disabled = false;
                }, 2000);
            }
            
            // Opcional: recarregar a lista após um breve delay
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

// Mover os estilos para um arquivo CSS separado é recomendado
// Estes estilos são apenas para funcionalidade básica
const style = document.createElement('style');
style.textContent = `
    .loading, .empty-state, .error-message {
        text-align: center;
        padding: 20px;
        color: #666;
    }
    
    .error-message {
        color: #e74c3c;
    }
    
    .botoes-criancas {
        display: grid;
        gap: 10px;
        margin-top: 15px;
    }
    
    .btn-checkin {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        margin: 8px 0;
        padding: 12px 15px;
        background: #27ae60;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.3s ease;
    }
    
    .btn-checkin:hover {
        background: #229954;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    
    .btn-checkin.processing {
        background: #f39c12;
        opacity: 0.8;
    }
    
    .btn-checkin.success {
        background: #27ae60;
        animation: pulse 1s;
    }
    
    .btn-checkin .icon {
        font-size: 1.2em;
    }
    
    .btn-checkin .nome {
        flex-grow: 1;
        text-align: left;
        margin-left: 10px;
    }
    
    .btn-checkin .turma {
        background: rgba(255, 255, 255, 0.2);
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 0.9em;
    }
    
    .btn-cadastrar, .btn-recarregar {
        width: 100%;
        padding: 14px;
        background: #3498db;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        font-size: 1.1rem;
        margin: 10px 0;
        transition: background 0.3s;
    }
    
    .btn-cadastrar:hover, .btn-recarregar:hover {
        background: #2980b9;
    }
    
    .mensagem {
        padding: 12px;
        border-radius: 5px;
        margin: 15px 0;
        text-align: center;
    }
    
    .mensagem.sucesso {
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
    }
    
    .mensagem.erro {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
    }
    
    .mensagem.info {
        background: #d1ecf1;
        color: #0c5460;
        border: 1px solid #bee5eb;
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);
