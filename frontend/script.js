function inicializarCadastro() {
    // Configurações (sem credenciais sensíveis!)
    const CONFIG = {
        endpoints: {
            crianca: '/cadastrar-crianca',
            responsavel: '/cadastrar-responsavel',
            enviarQRCode: '/enviar-qrcode' // ✅ Novo endpoint seguro
        },
        timeout: 30000, // 30 segundos
        debugMode: false // Alterne para false em produção
    };

    // Elementos do DOM — agora só são buscados DEPOIS que o conteúdo é carregado
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
            if (CONFIG.debugMode && elementos.debugInfo) {
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
            if (elementos.btnSubmit) {
                elementos.btnSubmit.disabled = estaCarregando;
            }
            if (elementos.progressBar) {
                elementos.progressBar.classList.toggle('ativo', estaCarregando);
            }
            if (elementos.status) {
                elementos.status.classList.toggle('ativo', estaCarregando);
            }
            estado.processando = estaCarregando;
            
            if (estaCarregando) {
                if (elementos.btnSubmit) {
                    elementos.btnSubmit.textContent = 'Processando...';
                }
            } else {
                if (elementos.btnSubmit) {
                    elementos.btnSubmit.textContent = 'Cadastrar';
                }
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
                if (!elemento || !elemento.value.trim()) {
                    throw new Error(`O campo "${campo.nome}" é obrigatório`);
                }
            }
            
            const telefone1 = document.getElementById('whatsappResp1').value;
            const telefone1Limpo = telefone1.replace(/\D/g, '');
            if (telefone1Limpo.length < 10 || telefone1Limpo.length > 13) {
                throw new Error('O número de WhatsApp do Responsável 1 deve ter entre 10 e 13 dígitos');
            }
            
            const telefone2 = document.getElementById('whatsappResp2').value;
            const nomeResp2 = document.getElementById('nomeResp2').value;
            
            if (telefone2) {
                const telefone2Limpo = telefone2.replace(/\D/g, '');
                if (telefone2Limpo.length < 10 || telefone2Limpo.length > 13) {
                    throw new Error('O número de WhatsApp do Responsável 2 deve ter entre 10 e 13 dígitos');
                }
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
                telefone_whatsapp: document.getElementById('whatsappResp1').value.replace(/\D/g, '').trim()
            };
            responsaveis.push(resp1);
            
            const resp2 = {
                nome: document.getElementById('nomeResp2').value.trim(),
                telefone_whatsapp: document.getElementById('whatsappResp2').value.replace(/\D/g, '').trim()
            };
            
            if (resp2.nome && resp2.telefone_whatsapp) {
                responsaveis.push(resp2);
            }
            
            return { crianca, responsaveis };
        }
    };

    // ✅ Função ATUALIZADA: envia QR Code via backend (sem token no frontend!)
    async function enviarQRParaWhatsApp(numero, base64Image, nomeCrianca, codigo) {
        try {
            const response = await fetch(CONFIG.endpoints.enviarQRCode, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    numero,
                    base64Image,
                    nomeCrianca,
                    codigo
                })
            });

            const data = await response.json();

            if (response.ok) {
                ui.mostrarMensagem('✅ QR Code enviado com sucesso para o WhatsApp!', 'sucesso');
            } else {
                throw new Error(data.error || 'Erro ao enviar');
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
            
            // ✅ CRIA O CONTAINER E INSERE NO DOM ANTES DE GERAR O QR CODE
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
            
            // ✅ INSERE NO DOM PRIMEIRO — ESSE É O PASSO CRÍTICO!
            elementos.mensagem.parentNode.appendChild(codigoDiv);

            // ✅ AGORA QUE ESTÁ NO DOM, BUSCA O ELEMENTO
            const qrcodeContainer = document.getElementById('qrcode-container');
            
            // ✅ Gera QR Code (lib já carregada no HTML)
            if (typeof QRCode !== 'undefined' && qrcodeContainer) {
                QRCode.toCanvas(qrcodeContainer, urlCheckin, { width: 160 }, function (error) {
                    if (error) {
                        console.error("❌ Erro ao gerar QR Code:", error);
                        qrcodeContainer.innerHTML = '<p style="color: red;">Erro ao gerar QR Code.</p>';
                        return;
                    }
                    console.log("✅ QR Code gerado com sucesso!");
                    
                    // Adiciona evento ao botão de envio por WhatsApp
                    const btnEnviarWhatsApp = document.getElementById('btnEnviarWhatsApp');
                    if (btnEnviarWhatsApp) {
                        btnEnviarWhatsApp.addEventListener('click', () => {
                            const numeroWhatsApp = document.getElementById('whatsappResp1').value.replace(/\D/g, '');
                            
                            if (!numeroWhatsApp || numeroWhatsApp.length < 10) {
                                alert('Por favor, verifique o número de WhatsApp do responsável.');
                                return;
                            }
                            
                            const canvas = qrcodeContainer.querySelector('canvas');
                            if (!canvas) {
                                alert('Erro ao obter QR Code para envio.');
                                return;
                            }
                            
                            const qrBase64 = canvas.toDataURL("image/png");
                            enviarQRParaWhatsApp(numeroWhatsApp, qrBase64, crianca.nome, codigoCheckin);
                        });
                    }
                });
            } else {
                console.error("❌ Lib QR Code não carregada ou container não encontrado!");
                if (qrcodeContainer) {
                    qrcodeContainer.innerHTML = '<p style="color: red;">Erro: Lib QR Code não carregada ou container ausente.</p>';
                }
            }
            
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

    // Inicialização — SÓ AGORA os elementos existem!
    if (elementos.form) {
        elementos.form.addEventListener('submit', processarCadastro);
    }
    
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
    
    console.log('✅ Sistema de cadastro inicializado (conteúdo carregado)');
}
