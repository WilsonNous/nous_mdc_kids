<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cadastro de Crianças - Versão Melhorada</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Arial', sans-serif;
        }
        
        body {
            background: #f5f7fa;
            color: #003366;
            min-height: 100vh;
            line-height: 1.6;
            padding: 20px;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 6px 20px rgba(0,0,0,0.08);
        }
        
        h1 {
            color: #007BFF;
            text-align: center;
            margin-bottom: 20px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
            color: #003366;
        }
        
        input, select, textarea {
            width: 100%;
            padding: 14px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 1rem;
            transition: all 0.3s ease;
        }
        
        input:focus, select:focus, textarea:focus {
            outline: none;
            border-color: #007BFF;
            box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.15);
        }
        
        .responsavel-group {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #007BFF;
        }
        
        .responsavel-group h3 {
            color: #007BFF;
            margin-bottom: 15px;
        }
        
        button {
            background: #E6007A;
            color: white;
            font-weight: bold;
            padding: 16px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            width: 100%;
            font-size: 1.1rem;
            transition: background 0.3s, transform 0.2s;
            margin-top: 10px;
        }
        
        button:hover {
            background: #C6006A;
            transform: translateY(-2px);
        }
        
        button:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
        }
        
        .mensagem {
            margin-top: 20px;
            padding: 16px;
            border-radius: 8px;
            text-align: center;
            font-weight: bold;
            display: none;
        }
        
        .sucesso {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
            display: block;
        }
        
        .erro {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
            display: block;
        }
        
        .processando {
            background: #cce5ff;
            color: #004085;
            border: 1px solid #b8daff;
            display: block;
        }
        
        .progress-bar {
            height: 6px;
            background: #e9ecef;
            border-radius: 3px;
            overflow: hidden;
            margin-top: 10px;
            display: none;
        }
        
        .progress {
            height: 100%;
            background: #007BFF;
            width: 0%;
            transition: width 0.3s ease;
        }
        
        .status {
            text-align: center;
            margin-top: 10px;
            font-style: italic;
            color: #6c757d;
            display: none;
        }
        
        .debug-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
            font-family: monospace;
            font-size: 0.9rem;
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Cadastro de Criança</h1>
        
        <form id="formCadastro">
            <div class="form-group">
                <label for="nomeCrianca">Nome da Criança *</label>
                <input type="text" id="nomeCrianca" required>
            </div>
            
            <div class="form-group">
                <label for="dataNascimento">Data de Nascimento *</label>
                <input type="date" id="dataNascimento" required>
            </div>
            
            <div class="form-group">
                <label for="turma">Turma *</label>
                <select id="turma" required>
                    <option value="">Selecione uma turma</option>
                    <option value="Maternal">Maternal</option>
                    <option value="Jardim I">Jardim I</option>
                    <option value="Jardim II">Jardim II</option>
                    <option value="Pré I">Pré I</option>
                    <option value="Pré II">Pré II</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="observacoes">Observações</label>
                <textarea id="observacoes" rows="3"></textarea>
            </div>
            
            <div class="responsavel-group">
                <h3>Responsável 1 *</h3>
                <div class="form-group">
                    <label for="nomeResp1">Nome do Responsável *</label>
                    <input type="text" id="nomeResp1" required>
                </div>
                
                <div class="form-group">
                    <label for="whatsappResp1">WhatsApp *</label>
                    <input type="tel" id="whatsappResp1" placeholder="(11) 99999-9999" required>
                </div>
            </div>
            
            <div class="responsavel-group">
                <h3>Responsável 2 (Opcional)</h3>
                <div class="form-group">
                    <label for="nomeResp2">Nome do Responsável</label>
                    <input type="text" id="nomeResp2">
                </div>
                
                <div class="form-group">
                    <label for="whatsappResp2">WhatsApp</label>
                    <input type="tel" id="whatsappResp2" placeholder="(11) 99999-9999">
                </div>
            </div>
            
            <button type="submit" id="btnSubmit">Cadastrar</button>
            
            <div class="progress-bar" id="progressBar">
                <div class="progress" id="progress"></div>
            </div>
            
            <div class="status" id="status">Processando...</div>
        </form>
        
        <div class="mensagem" id="mensagem"></div>
        
        <div class="debug-info" id="debugInfo"></div>
    </div>

    <script>
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
                // Oculta informações sensíveis para debug
                if (copia.telefone_whatsapp) {
                    copia.telefone_whatsapp = '***' + copia.telefone_whatsapp.slice(-4);
                }
                return JSON.stringify(copia, null, 2);
            },
            
            // Exibir informações de debug
            exibirDebug: (info) => {
                if (CONFIG.debugMode) {
                    elementos.debugInfo.style.display = 'block';
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
                elementos.progressBar.style.display = estaCarregando ? 'block' : 'none';
                elementos.status.style.display = estaCarregando ? 'block' : 'none';
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
                
                // Verifica campos obrigatórios
                for (const campo of camposObrigatorios) {
                    const elemento = document.getElementById(campo.id);
                    if (!elemento.value.trim()) {
                        throw new Error(`O campo "${campo.nome}" é obrigatório`);
                    }
                }
                
                // Valida telefone do responsável 1
                const telefone1 = document.getElementById('whatsappResp1').value;
                if (!utils.validarTelefone(telefone1)) {
                    throw new Error('O número de WhatsApp do Responsável 1 não é válido');
                }
                
                // Valida telefone do responsável 2 se preenchido
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
                
                // Responsável 1 (obrigatório)
                const resp1 = {
                    nome: document.getElementById('nomeResp1').value.trim(),
                    telefone_whatsapp: document.getElementById('whatsappResp1').value.trim()
                };
                responsaveis.push(resp1);
                
                // Responsável 2 (opcional)
                const resp2 = {
                    nome: document.getElementById('nomeResp2').value.trim(),
                    telefone_whatsapp: document.getElementById('whatsappResp2').value.trim()
                };
                
                // Só adiciona se ambos os campos estiverem preenchidos
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
                
                // Sucesso!
                ui.mostrarMensagem('✅ Cadastro realizado com sucesso!', 'sucesso');
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
    </script>
</body>
</html>
