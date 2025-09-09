// Configurações
const CONFIG = {
    endpoints: {
        crianca: '/cadastrar-crianca',
        responsavel: '/cadastrar-responsavel'
    },
    timeout: 30000, // 30 segundos
    debugMode: true // Alterne para false em produção
};

// Elementos do DOM
const elementos = {
    form: document.getElementById('formCadastro'),
    mensagem: document.getElementById('mensagem'),
    btnSubmit: document.getElementById('btnSubmit'),
    progressBar: document.getElementById('progressBar'),
    progress: document.getElementById('progress'),
    status: document.getElementById('status'),
    debugInfo: document.getElementById('debugInfo')
};

// Estados da aplicação
let estado = {
    processando: false,
    etapaAtual: 0,
    totalEtapas: 0
};

// Utilitários
const utils = {
    // Validar telefone (formato básico)
    validarTelefone: (telefone) => {
        const regex = /^\(?\d{2}\)?[\s-]?\d{4,5}-?\d{4}$/;
        return regex.test(telefone);
    },
    
    // Formatar dados para exibição (remove informações sensíveis)
    formatarDadosParaDebug: (dados) => {
        const copia = {...dados};
        if (copia.telefone_whatsapp) {
            copia.telefone_whatsapp = '***' + copia.telefone_whatsapp.slice(-4);
        }
        return JSON.stringify(copia, null, 2);
    },
    
    // Exibir informações de debug
    exibirDebug: (info) => {
        if (CONFIG.debugMode) {
            elementos.debugInfo.textContent = info;
        }
    }
};

// Funções de UI (SEM CSS — só manipulação de classes e texto)
const ui = {
    // Mostrar mensagem para o usuário (via classes CSS)
    mostrarMensagem: (texto, tipo) => {
        elementos.mensagem.textContent = texto;
        elementos.mensagem.className = 'mensagem ' + tipo;
    },
    
    // Atualizar barra de progresso (só altera width via JS — necessário para animação)
    atualizarProgresso: (etapa, total) => {
        if (total > 0) {
            const percentual = (etapa / total) * 100;
            elementos.progress.style.width = percentual + '%'; // ÚNICA EXCEÇÃO JUSTIFICADA — animação dinâmica
            elementos.status.textContent = `Processando: ${etapa} de ${total} concluído`;
        }
    },
    
    // Mostrar/ocultar estado de carregamento (via classes e atributos)
    toggleCarregamento: (estaCarregando) => {
        elementos.btnSubmit.disabled = estaCarregando;
        elementos.progressBar.classList.toggle('ativo', estaCarregando);
        elementos.status.classList.toggle('ativo', estaCarregando);
        estado.processando = estaCarregando;
        
        if (estaCarregando) {
            elementos.btnSubmit.textContent = 'Processando...';
        } else {
            elementos.btnSubmit.textContent = 'Cadastrar';
        }
    },
    
    // Limpar formulário
    limparFormulario: () => {
        elementos.form.reset();
        elementos.progress.style.width = '0%'; // ÚNICA EXCEÇÃO — reset visual da barra
    }
};

// Funções de API
const api = {
    // Requisição genérica com tratamento de erros
    fazerRequisicao: async (url, dados, operacao) => {
        const controller = new AbortController();
        const idTimeout = setTimeout(() => controller.abort(), CONFIG.timeout);
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados),
                signal: controller.signal
            });
            
            clearTimeout(idTimeout);
            
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || `Erro ao ${operacao}`);
            }
            
            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error(`Tempo excedido ao tentar ${operacao}`);
            }
            throw error;
        }
    },
    
    // Cadastrar criança
    cadastrarCrianca: async (dadosCrianca) => {
        ui.mostrarMensagem('Cadastrando criança...', 'processando');
        utils.exibirDebug(`Enviando dados da criança: ${utils.formatarDadosParaDebug(dadosCrianca)}`);
        
        const resposta = await api.fazerRequisicao(
            CONFIG.endpoints.crianca, 
            dadosCrianca, 
            'cadastrar criança'
        );
        
        estado.etapaAtual = 1;
        ui.atualizarProgresso(estado.etapaAtual, estado.totalEtapas);
        
        return resposta;
    },
    
    // Cadastrar responsável
    cadastrarResponsavel: async (dadosResponsavel, indice) => {
        ui.mostrarMensagem(`Cadastrando responsável ${indice + 1}...`, 'processando');
        utils.exibirDebug(`Enviando dados do responsável: ${utils.formatarDadosParaDebug(dadosResponsavel)}`);
        
        const resposta = await api.fazerRequisicao(
            CONFIG.endpoints.responsavel, 
            dadosResponsavel, 
            `cadastrar responsável ${indice + 1}`
        );
        
        estado.etapaAtual += 1;
        ui.atualizarProgresso(estado.etapaAtual, estado.totalEtapas);
        
        return resposta;
    }
};

// Validação de formulário
const validacao = {
    // Validar todos os campos do formulário
    validarFormulario: () => {
        const camposObrigatorios = [
            {id: 'nomeCrianca', nome: 'Nome da Criança'},
            {id: 'dataNascimento', nome: 'Data de Nascimento'},
            {id: 'turma', nome: 'Turma'},
            {id: 'nomeResp1', nome: 'Nome do Responsável 1'},
            {id: 'whatsappResp1', nome: 'WhatsApp do Responsável 1'}
        ];
        
        for (const campo of camposObrigatorios) {
            const elemento = document.getElementById(campo.id);
            if (!elemento.value.trim()) {
                throw new Error(`O campo "${campo.nome}" é obrigatório`);
            }
        }
        
        const telefone1 = document.getElementById('whatsappResp1').value;
        if (!utils.validarTelefone(telefone1)) {
            throw new Error('O número de WhatsApp do Responsável 1 não é válido');
        }
        
        const telefone2 = document.getElementById('whatsappResp2').value;
        const nomeResp2 = document.getElementById('nomeResp2').value;
        
        if (telefone2 && !utils.validarTelefone(telefone2)) {
            throw new Error('O número de WhatsApp do Responsável 2 não é válido');
        }
        
        if ((telefone2 && !nomeResp2) || (nomeResp2 && !telefone2)) {
            throw new Error('Para cadastrar um segundo responsável, ambos nome e telefone devem ser preenchidos');
        }
        
        return true;
    },
    
    // Coletar dados do formulário
    coletarDadosFormulario: () => {
        const crianca = {
            nome: document.getElementById('nomeCrianca').value.trim(),
            data_nascimento: document.getElementById('dataNascimento').value,
            turma: document.getElementById('turma').value,
            observacoes: document.getElementById('observacoes').value.trim()
        };
        
        const responsaveis = [];
        
        const resp1 = {
            nome: document.getElementById('nomeResp1').value.trim(),
            telefone_whatsapp: document.getElementById('whatsappResp1').value.trim()
        };
        responsaveis.push(resp1);
        
        const resp2 = {
            nome: document.getElementById('nomeResp2').value.trim(),
            telefone_whatsapp: document.getElementById('whatsappResp2').value.trim()
        };
        
        if (resp2.nome && resp2.telefone_whatsapp) {
            responsaveis.push(resp2);
        }
        
        return { crianca, responsaveis };
    }
};

// Processamento principal do formulário
const processarCadastro = async (e) => {
    e.preventDefault();
    
    try {
        validacao.validarFormulario();
        
        ui.toggleCarregamento(true);
        elementos.mensagem.className = '';
        
        const { crianca, responsaveis } = validacao.coletarDadosFormulario();
        
        estado.etapaAtual = 0;
        estado.totalEtapas = 1 + responsaveis.length;
        ui.atualizarProgresso(estado.etapaAtual, estado.totalEtapas);
        
        const dataCrianca = await api.cadastrarCrianca(crianca);
        
        for (let i = 0; i < responsaveis.length; i++) {
            const responsavel = {
                ...responsaveis[i],
                crianca_id: dataCrianca.crianca_id
            };
            
            await api.cadastrarResponsavel(responsavel, i);
        }
        
        ui.mostrarMensagem('✅ Cadastro realizado com sucesso!', 'sucesso');
        ui.limparFormulario();
        
    } catch (error) {
        console.error('Erro no cadastro:', error);
        ui.mostrarMensagem(`❌ Erro: ${error.message}`, 'erro');
        
    } finally {
        ui.toggleCarregamento(false);
    }
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    elementos.form.addEventListener('submit', processarCadastro);
    
    // Adiciona máscara para telefone
    const inputsTelefone = document.querySelectorAll('input[type="tel"]');
    inputsTelefone.forEach(input => {
        input.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.slice(0, 11);
            
            if (value.length > 0) {
                value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
                if (value.length > 10) {
                    value = value.replace(/(\d{5})(\d)/, '$1-$2');
                } else {
                    value = value.replace(/(\d{4})(\d)/, '$1-$2');
                }
            }
            
            e.target.value = value;
        });
    });
    
    console.log('Sistema de cadastro inicializado');
});
