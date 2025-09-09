// Configurações
const CONFIG = {
    endpoints: {
        listarCriancas: '/listar-criancas',
        checkin: '/checkin'
    },
    timeout: 30000, // 30 segundos
    debugMode: true
};

// Elementos do DOM
const elementos = {
    listaCriancas: document.getElementById('listaCriancas'),
    areaAlerta: document.getElementById('areaAlerta'),
    mensagemCheckin: document.getElementById('mensagemCheckin'),
    btnAlerta: document.getElementById('btnAlerta'),
    motivoAlerta: document.getElementById('motivoAlerta'),
    statusBar: document.getElementById('statusBar'),
    progresso: document.getElementById('progresso'),
    contadorCriancas: document.getElementById('contadorCriancas'),
    nomeCriancaSelecionada: document.getElementById('nomeCriancaSelecionada'),
    turmaCriancaSelecionada: document.getElementById('turmaCriancaSelecionada'),
    avatarCrianca: document.getElementById('avatarCrianca'),
    ultimoCheckin: document.getElementById('ultimoCheckin'),
    filtros: document.querySelectorAll('.filtro-btn')
};

// Estado da aplicação
let estado = {
    criancaSelecionada: null,
    criancas: [],
    filtroAtivo: 'todas'
};

// Utilitários
const utils = {
    // Obter iniciais do nome para o avatar
    obterIniciais: (nome) => {
        return nome.split(' ').map(palavra => palavra[0]).join('').toUpperCase().substring(0, 2);
    },
    
    // Formatar data e hora
    formatarData: (dataString) => {
        if (!dataString) return 'Nunca';
        const data = new Date(dataString);
        return data.toLocaleString('pt-BR');
    },
    
    // Filtrar crianças por turma
    filtrarCriancas: (criancas, turma) => {
        if (turma === 'todas') return criancas;
        return criancas.filter(c => c.turma === turma);
    },
    
    // Atualizar contador de crianças
    atualizarContador: (criancas, filtro) => {
        const criancasFiltradas = utils.filtrarCriancas(criancas, filtro);
        elementos.contadorCriancas.textContent = 
            `${criancasFiltradas.length} criança(s) ${filtro === 'todas' ? 'no total' : 'na ' + filtro}`;
    }
};

// Funções de UI (SEM CSS — só classes e texto)
const ui = {
    // Mostrar mensagem para o usuário
    mostrarMensagem: (texto, tipo) => {
        elementos.mensagemCheckin.textContent = texto;
        elementos.mensagemCheckin.className = 'mensagem ' + tipo;
    },
    
    // Atualizar barra de progresso (única exceção justificada)
    atualizarProgresso: (percentual) => {
        elementos.progresso.style.width = percentual + '%';
    },
    
    // Mostrar/ocultar estado de carregamento do botão
    toggleCarregamentoBtn: (estaCarregando) => {
        elementos.btnAlerta.disabled = estaCarregando;
        elementos.statusBar.classList.toggle('ativo', estaCarregando);
        
        if (estaCarregando) {
            elementos.btnAlerta.innerHTML = '<span class="icone">⏳</span> ENVIANDO...';
        } else {
            elementos.btnAlerta.innerHTML = '<span class="icone">🔔</span> AVISAR PAIS AGORA';
        }
    },
    
    // Exibir informações da criança selecionada
    exibirCriancaSelecionada: (crianca) => {
        elementos.nomeCriancaSelecionada.textContent = crianca.nome;
        elementos.turmaCriancaSelecionada.textContent = crianca.turma;
        elementos.avatarCrianca.textContent = utils.obterIniciais(crianca.nome);
        elementos.ultimoCheckin.textContent = `Check-in registrado em ${new Date().toLocaleTimeString('pt-BR')}`;
    },
    
    // Renderizar lista de crianças
    renderizarCriancas: (criancas, filtro) => {
        const criancasFiltradas = utils.filtrarCriancas(criancas, filtro);
        
        if (criancasFiltradas.length === 0) {
            elementos.listaCriancas.innerHTML = `
                <div class="lista-vazia">
                    <p>❌ Nenhuma criança ${filtro === 'todas' ? 'cadastrada' : 'na ' + filtro}.</p>
                </div>
            `;
            return;
        }
        
        elementos.listaCriancas.innerHTML = criancasFiltradas.map(crianca => `
            <button class="crianca-btn ${estado.criancaSelecionada?.id === crianca.id ? 'selecionada' : ''}" 
                    data-id="${crianca.id}">
                <span class="icone">👶</span>
                <div class="crianca-info">
                    <span class="crianca-nome">${crianca.nome}</span>
                    <span class="crianca-turma">${crianca.turma}</span>
                    ${crianca.ultimo_checkin ? `
                        <span class="ultimo-checkin">Último check-in: ${utils.formatarData(crianca.ultimo_checkin)}</span>
                    ` : ''}
                </div>
            </button>
        `).join('');
        
        // Adicionar event listeners aos botões
        document.querySelectorAll('.crianca-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const criancaId = parseInt(btn.getAttribute('data-id'));
                const crianca = criancas.find(c => c.id === criancaId);
                if (crianca) {
                    selecionarCrianca(crianca);
                }
            });
        });
    },
    
    // Mostrar estado de carregamento
    mostrarCarregamento: () => {
        elementos.listaCriancas.innerHTML = `
            <div class="loading-container">
                <div class="spinner"></div>
                <p>Carregando crianças...</p>
            </div>
        `;
    }
};

// Funções de API
const api = {
    // Buscar lista de crianças
    carregarCriancas: async () => {
        ui.mostrarCarregamento();
        
        try {
            const response = await fetch(CONFIG.endpoints.listarCriancas);
            const data = await response.json();

            if (!data.success) throw new Error(data.error || 'Erro ao carregar crianças');
            
            estado.criancas = data.criancas || [];
            ui.renderizarCriancas(estado.criancas, estado.filtroAtivo);
            utils.atualizarContador(estado.criancas, estado.filtroAtivo);
            
            return data.criancas;
        } catch (error) {
            elementos.listaCriancas.innerHTML = `
                <div class="erro-container">
                    <p>❌ Erro ao carregar: ${error.message}</p>
                    <button onclick="api.carregarCriancas()">Tentar Novamente</button>
                </div>
            `;
            throw error;
        }
    },
    
    // Registrar check-in
    registrarCheckin: async (criancaId, status, observacao = '') => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);
        
        try {
            const response = await fetch(CONFIG.endpoints.checkin, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    crianca_id: criancaId,
                    status: status,
                    observacao: observacao
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || `Erro ao registrar ${status}`);
            }
            
            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Tempo excedido ao registrar check-in');
            }
            throw error;
        }
    }
};

// Lógica de seleção de criança
function selecionarCrianca(crianca) {
    estado.criancaSelecionada = crianca;
    
    // Atualizar UI
    ui.exibirCriancaSelecionada(crianca);
    elementos.areaAlerta.classList.add('ativo');
    ui.mostrarMensagem(`Check-in registrado para ${crianca.nome}!`, 'sucesso');
    
    // Atualizar botão selecionado
    document.querySelectorAll('.crianca-btn').forEach(btn => {
        const btnCriancaId = parseInt(btn.getAttribute('data-id'));
        btn.classList.toggle('selecionada', btnCriancaId === crianca.id);
    });
    
    // Registrar check-in no servidor
    api.registrarCheckin(crianca.id, 'presente')
        .then(data => {
            elementos.ultimoCheckin.textContent = `Check-in registrado em ${new Date().toLocaleString('pt-BR')}`;
            
            const criancaIndex = estado.criancas.findIndex(c => c.id === crianca.id);
            if (criancaIndex !== -1) {
                estado.criancas[criancaIndex].ultimo_checkin = new Date().toISOString();
                ui.renderizarCriancas(estado.criancas, estado.filtroAtivo);
            }
        })
        .catch(error => {
            console.error('Erro ao registrar check-in:', error);
            ui.mostrarMensagem(`❌ Erro ao registrar check-in: ${error.message}`, 'erro');
        });
}

// Enviar alerta para os pais
async function enviarAlerta() {
    if (!estado.criancaSelecionada) {
        alert('Selecione uma criança primeiro!');
        return;
    }

    const motivo = elementos.motivoAlerta.value.trim();
    if (!motivo) {
        alert('Por favor, informe o motivo do alerta!');
        return;
    }

    const confirmar = confirm(`Tem certeza que deseja avisar os pais de ${estado.criancaSelecionada.nome}?\n\nMotivo: ${motivo}`);
    if (!confirmar) return;

    ui.toggleCarregamentoBtn(true);
    ui.atualizarProgresso(30);

    try {
        ui.atualizarProgresso(60);
        const data = await api.registrarCheckin(
            estado.criancaSelecionada.id, 
            'alerta_enviado', 
            motivo
        );

        ui.atualizarProgresso(100);
        ui.mostrarMensagem('✅ Alerta enviado com sucesso! Os pais foram notificados.', 'sucesso');
        elementos.motivoAlerta.value = '';

    } catch (error) {
        console.error('Erro ao enviar alerta:', error);
        ui.mostrarMensagem(`❌ Erro: ${error.message}`, 'erro');
    } finally {
        ui.toggleCarregamentoBtn(false);
        setTimeout(() => ui.atualizarProgresso(0), 1000);
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    api.carregarCriancas();
    elementos.btnAlerta.addEventListener('click', enviarAlerta);
    
    elementos.filtros.forEach(filtro => {
        filtro.addEventListener('click', () => {
            elementos.filtros.forEach(f => f.classList.remove('ativo'));
            filtro.classList.add('ativo');
            estado.filtroAtivo = filtro.getAttribute('data-turma');
            
            ui.renderizarCriancas(estado.criancas, estado.filtroAtivo);
            utils.atualizarContador(estado.criancas, estado.filtroAtivo);
        });
    });
    
    console.log('Sistema de check-in inicializado');
});
