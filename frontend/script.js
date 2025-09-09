// Configurações
const CONFIG = {
    endpoints: {
        crianca: '/cadastrar-crianca',
        responsavel: '/cadastrar-responsavel'
    },
    timeout: 30000, // 30 segundos
    debugMode: true, // Alterne para false em produção
    zapi: {
        instance: 'SUA_INSTANCIA', // ⚠️ Substitua!
        token: 'SEU_TOKEN',        // ⚠️ Substitua!
        url: 'https://api.z-api.io/instances/SUA_INSTANCIA/token/SEU_TOKEN/send-image'
    }
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

// Funções de UI
const ui = {
    // Mostrar mensagem para o usuário
    mostrarMensagem: (texto, tipo) => {
        elementos.mensagem.textContent = texto;
        elementos.mensagem.className = 'mensagem ' + tipo;
    },
    
    // Atualizar barra de progresso
    atualizarProgresso: (etapa, total) => {
        if (total > 0) {
            const percentual = (etapa / total) * 100;
            elementos.progress.style.width = percentual + '%';
            elementos.status.textContent = `Processando: ${etapa} de ${total} concluído`;
        }
    },
    
    // Mostrar/ocultar estado de carregamento
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
        elementos.progress.style.width = '0%';
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

// 🆕 Função para enviar QR Code via Z-API
async function enviarQRParaWhatsApp(numero, base64Image, nomeCrianca, codigo) {
    const mensagem = `Olá! Aqui está o QR Code para check-in rápido do(a) ${nomeCrianca} 🎉\nCódigo: *${codigo}*\nBasta escanear na entrada do culto!`;

    try {
        const urlZAPI = CONFIG.zapi.url
            .replace('SUA_INSTANCIA', CONFIG.zapi.instance)
            .replace('SEU_TOKEN', CONFIG.zapi.token);

        const response = await fetch(urlZAPI, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                phone: `${numero}@s.whatsapp.net`,
                caption: mensagem,
                image: base64Image
            })
        });

        const data = await response.json();

        if (data.status === 'success') {
            ui.mostrarMensagem('✅ QR Code enviado com sucesso para o WhatsApp!', 'sucesso');
        } else {
            throw new Error(data.message || 'Erro ao enviar');
        }
    } catch (error) {
        console.error('Erro ao enviar QR Code:', error);
        ui.mostrarMensagem(`❌ Falha ao enviar: ${error.message}`, 'erro');
    }
}

// Processamento principal do formulário
const processarCadastro = async (e) => {
    e.preventDefault();
    
    try {
        // Valida o formulário
        validacao.validarFormulario();
        
        // Prepara interface para processamento
        ui.toggleCarregamento(true);
        elementos.mensagem.className = '';
        
        // Coleta dados do formulário
        const { crianca, responsaveis } = validacao.coletarDadosFormulario();
        
        // Configura progresso (1 etapa para criança + 1 para cada responsável)
        estado.etapaAtual = 0;
        estado.totalEtapas = 1 + responsaveis.length;
        ui.atualizarProgresso(estado.etapaAtual, estado.totalEtapas);
        
        // 1. Cadastra a criança
        const dataCrianca = await api.cadastrarCrianca(crianca);
        
        // 2. Cadastra os responsáveis
        for (let i = 0; i < responsaveis.length; i++) {
            const responsavel = {
                ...responsaveis[i],
                crianca_id: dataCrianca.crianca_id
            };
            
            await api.cadastrarResponsavel(responsavel, i);
        }
        
        // ✅ SUCESSO — GERA QR CODE + OPÇÕES
        ui.mostrarMensagem('✅ Cadastro realizado com sucesso!', 'sucesso');
        
        // Gera código e URL
        const codigoCheckin = `CHK-${dataCrianca.crianca_id.toString().padStart(6, '0')}`;
        const urlCheckin = `${window.location.origin}/checkin-auto.html?id=${dataCrianca.crianca_id}`;
        
        // Cria container visual
        const codigoDiv = document.createElement('div');
        codigoDiv.innerHTML = `
            <div class="card" style="margin-top: 20px; text-align: center;">
                <h3>📲 QR Code para Check-in Rápido</h3>
                <p>Escaneie ou envie para o WhatsApp dos responsáveis.</p>
                <div id="qrcode-container" style="margin: 20px auto; width: 160px; height: 160px;"></div>
                <p><strong>Código: ${codigoCheckin}</strong></p>
                <p><small>Acesse: ${urlCheckin}</small></p>
                <button id="btnEnviarWhatsApp" class="btn-alerta" style="margin-top: 15px; width: 100%;">
                    📲 Enviar QR Code por WhatsApp
                </button>
                <button onclick="window.print()" style="margin-top: 10px; padding: 10px 20px; background: #007BFF; color: white; border: none; border-radius: 6px; cursor: pointer; width: 100%;">
                    🖨️ Imprimir Cartão
                </button>
            </div>
        `;
        elementos.mensagem.parentNode.appendChild(codigoDiv);
        
        // Carrega lib QR Code
        const scriptQR = document.createElement('script');
        scriptQR.src = "https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js";
        scriptQR.onload = () => {
            QRCode.toCanvas(document.getElementById('qrcode-container'), urlCheckin, { width: 160 }, function (error) {
                if (error) console.error(error);
                
                // Adiciona evento ao botão de envio por WhatsApp
                document.getElementById('btnEnviarWhatsApp').addEventListener('click', () => {
                    const numeroWhatsApp = document.getElementById('whatsappResp1').value.replace(/\D/g, '');
                    
                    if (!numeroWhatsApp || numeroWhatsApp.length < 10) {
                        alert('Por favor, verifique o número de WhatsApp do responsável.');
                        return;
                    }
                    
                    // Gera imagem do QR Code em base64
                    const canvas = document.getElementById('qrcode-container').querySelector('canvas');
                    const qrBase64 = canvas.toDataURL("image/png");
                    
                    // Envia via Z-API
                    enviarQRParaWhatsApp(numeroWhatsApp, qrBase64, crianca.nome, codigoCheckin);
                });
            });
        };
        document.head.appendChild(scriptQR);
        
        // Limpa formulário
        ui.limparFormulario();
        
    } catch (error) {
        // Tratamento de erro
        console.error('Erro no cadastro:', error);
        ui.mostrarMensagem(`❌ Erro: ${error.message}`, 'erro');
        
    } finally {
        // Sempre executa, independente de sucesso ou erro
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
