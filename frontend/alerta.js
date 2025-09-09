<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sistema de Check-in - Versão Melhorada</title>
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
            max-width: 900px;
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
        
        h3 {
            color: #007BFF;
            margin: 20px 0 15px 0;
            padding-bottom: 8px;
            border-bottom: 2px solid #E6007A;
        }
        
        .card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            margin-bottom: 20px;
            border-left: 4px solid #007BFF;
        }
        
        .alerta-card {
            border-left: 4px solid #E6007A;
            background: #fff9f9;
        }
        
        .crianca-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        
        .crianca-btn {
            background: #007BFF;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 15px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s;
            text-align: left;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .crianca-btn:hover {
            background: #0056b3;
            transform: translateY(-2px);
        }
        
        .crianca-btn.selecionada {
            background: #28a745;
            box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.3);
        }
        
        .crianca-btn .icone {
            font-size: 1.2rem;
        }
        
        .crianca-info {
            display: flex;
            flex-direction: column;
        }
        
        .crianca-nome {
            font-weight: bold;
            font-size: 1.1rem;
        }
        
        .crianca-turma {
            font-size: 0.9rem;
            opacity: 0.8;
        }
        
        .area-alerta {
            display: none;
            margin-top: 30px;
            animation: fadeIn 0.5s;
        }
        
        .crianca-selecionada {
            background: #e8f4ff;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .crianca-selecionada .avatar {
            width: 50px;
            height: 50px;
            background: #007BFF;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 1.2rem;
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
        
        textarea {
            width: 100%;
            padding: 14px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 1rem;
            transition: all 0.3s ease;
            min-height: 100px;
            resize: vertical;
        }
        
        textarea:focus {
            outline: none;
            border-color: #E6007A;
            box-shadow: 0 0 0 3px rgba(230, 0, 122, 0.15);
        }
        
        .btn-alerta {
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
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        .btn-alerta:hover {
            background: #C6006A;
            transform: translateY(-2px);
        }
        
        .btn-alerta:disabled {
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
        }
        
        .sucesso {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .erro {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .processando {
            background: #cce5ff;
            color: #004085;
            border: 1px solid #b8daff;
        }
        
        .status-bar {
            height: 6px;
            background: #e9ecef;
            border-radius: 3px;
            overflow: hidden;
            margin-top: 10px;
            display: none;
        }
        
        .progresso {
            height: 100%;
            background: #007BFF;
            width: 0%;
            transition: width 0.3s ease;
        }
        
        .contador {
            text-align: center;
            margin: 15px 0;
            font-style: italic;
            color: #6c757d;
        }
        
        .ultimo-checkin {
            font-size: 0.9rem;
            color: #6c757d;
            margin-top: 5px;
        }
        
        .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 40px;
            flex-direction: column;
            gap: 15px;
        }
        
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #007BFF;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .filtros {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        
        .filtro-btn {
            padding: 8px 16px;
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .filtro-btn.ativo {
            background: #007BFF;
            color: white;
            border-color: #007BFF;
        }
        
        @media (max-width: 768px) {
            .crianca-list {
                grid-template-columns: 1fr;
            }
            
            .filtros {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Sistema de Check-in</h1>
        
        <div class="card">
            <h3>Lista de Crianças</h3>
            <div class="filtros">
                <button class="filtro-btn ativo" data-turma="todas">Todas</button>
                <button class="filtro-btn" data-turma="Maternal">Maternal</button>
                <button class="filtro-btn" data-turma="Jardim I">Jardim I</button>
                <button class="filtro-btn" data-turma="Jardim II">Jardim II</button>
                <button class="filtro-btn" data-turma="Pré I">Pré I</button>
                <button class="filtro-btn" data-turma="Pré II">Pré II</button>
            </div>
            
            <div class="contador" id="contadorCriancas">Carregando...</div>
            
            <div id="listaCriancas" class="crianca-list">
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Carregando crianças...</p>
                </div>
            </div>
        </div>
        
        <div id="areaAlerta" class="area-alerta">
            <div class="card alerta-card">
                <h3>Check-in Realizado</h3>
                
                <div class="crianca-selecionada" id="infoCriancaSelecionada">
                    <div class="avatar" id="avatarCrianca">?</div>
                    <div>
                        <div class="crianca-nome" id="nomeCriancaSelecionada">Nome da Criança</div>
                        <div class="crianca-turma" id="turmaCriancaSelecionada">Turma</div>
                        <div class="ultimo-checkin" id="ultimoCheckin">Check-in registrado agora</div>
                    </div>
                </div>
                
                <div class="mensagem" id="mensagemCheckin"></div>
                
                <h3>Enviar Alerta aos Pais</h3>
                <p>Use esta função apenas se necessário avisar os pais sobre algo importante.</p>
                
                <div class="form-group">
                    <label for="motivoAlerta">Motivo do Alerta:</label>
                    <textarea id="motivoAlerta" placeholder="Descreva o motivo do alerta..."></textarea>
                </div>
                
                <button id="btnAlerta" class="btn-alerta">
                    <span class="icone">🔔</span>
                    AVISAR PAIS AGORA
                </button>
                
                <div class="status-bar" id="statusBar">
                    <div class="progresso" id="progresso"></div>
                </div>
            </div>
        </div>
    </div>

    <script>
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

        // Funções de UI
        const ui = {
            // Mostrar mensagem para o usuário
            mostrarMensagem: (texto, tipo) => {
                elementos.mensagemCheckin.textContent = texto;
                elementos.mensagemCheckin.className = 'mensagem ' + tipo;
            },
            
            // Atualizar barra de progresso
            atualizarProgresso: (percentual) => {
                elementos.progresso.style.width = percentual + '%';
            },
            
            // Mostrar/ocultar estado de carregamento do botão
            toggleCarregamentoBtn: (estaCarregando) => {
                elementos.btnAlerta.disabled = estaCarregando;
                elementos.statusBar.style.display = estaCarregando ? 'block' : 'none';
                
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
                        <div style="grid-column: 1 / -1; text-align: center; padding: 30px;">
                            <p>❌ Nenhuma criança ${filtro === 'todas' ? 'cadastrada' : 'na ' + filtra}.</p>
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
                    <div class="loading" style="grid-column: 1 / -1;">
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
                        <div style="grid-column: 1 / -1; text-align: center; padding: 30px;">
                            <p>❌ Erro ao carregar: ${error.message}</p>
                            <button onclick="api.carregarCriancas()" style="margin-top: 10px;">
                                Tentar Novamente
                            </button>
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
            elementos.areaAlerta.style.display = 'block';
            ui.mostrarMensagem(`Check-in registrado para ${crianca.nome}!`, 'sucesso');
            
            // Atualizar botão selecionado
            document.querySelectorAll('.crianca-btn').forEach(btn => {
                const btnCriancaId = parseInt(btn.getAttribute('data-id'));
                if (btnCriancaId === crianca.id) {
                    btn.classList.add('selecionada');
                } else {
                    btn.classList.remove('selecionada');
                }
            });
            
            // Registrar check-in no servidor
            api.registrarCheckin(crianca.id, 'presente')
                .then(data => {
                    // Atualizar último check-in na UI
                    elementos.ultimoCheckin.textContent = `Check-in registrado em ${new Date().toLocaleString('pt-BR')}`;
                    
                    // Atualizar na lista de crianças
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

            // Preparar UI para envio
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
                
                // Limpar campo de motivo
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
            // Carregar crianças
            api.carregarCriancas();
            
            // Configurar evento do botão de alerta
            elementos.btnAlerta.addEventListener('click', enviarAlerta);
            
            // Configurar filtros
            elementos.filtros.forEach(filtro => {
                filtro.addEventListener('click', () => {
                    // Atualizar estado do filtro
                    elementos.filtros.forEach(f => f.classList.remove('ativo'));
                    filtro.classList.add('ativo');
                    estado.filtroAtivo = filtro.getAttribute('data-turma');
                    
                    // Atualizar UI
                    ui.renderizarCriancas(estado.criancas, estado.filtroAtivo);
                    utils.atualizarContador(estado.criancas, estado.filtroAtivo);
                });
            });
            
            console.log('Sistema de check-in inicializado');
        });
    </script>
</body>
</html>
