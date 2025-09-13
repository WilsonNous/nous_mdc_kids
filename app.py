import requests
import os
import re
from dotenv import load_dotenv
from flask import Flask, request, jsonify, send_from_directory, session, redirect, url_for
from database import get_db_connection, close_db_connection
from datetime import datetime
from authlib.integrations.flask_client import OAuth  # ✅ NOVA BIBLIOTECA MODERNA

# ✅ 1. Carrega variáveis de ambiente
load_dotenv()

# ✅ 2. CRIA A INSTÂNCIA DO FLASK
app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'F1@skM1cr0W3bApp*Key*UltraSecure')

# ✅ 3. Configurações da Z-API
ZAPI_TOKEN = os.getenv("ZAPI_TOKEN")          # Token da instância (vai na URL)
ZAPI_CLIENT_TOKEN = os.getenv("ZAPI_CLIENT_TOKEN")  # Token de segurança (vai no header)
ZAPI_INSTANCE = os.getenv("ZAPI_INSTANCE")

# ✅ 4. ROTA RAIZ
@app.route('/')
def home():
    return send_from_directory('frontend', 'login.html')

# ✅ 5. ROTA CHECKIN PAGE
@app.route('/checkin')
def checkin_page():
    return send_from_directory('frontend', 'checkin.html')

# ✅ 5. ROTA MENU PAGE
@app.route('/menu')
def menu_page():
    return send_from_directory('frontend', 'menu.html')
    
# ✅ 6. ROTA PARA ARQUIVOS ESTÁTICOS
@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory('frontend', filename)

# ✅ 7. ROTA FALBACK
@app.route('/<path:path>')
def fallback(path):
    return send_from_directory('frontend', 'login.html')
    
# ✅ 8. FUNÇÃO DE ENVIO DE WHATSAPP — AJUSTADA
def enviar_whatsapp_alerta(crianca_id, motivo="Está precisando de você"):
    conn = get_db_connection()
    if not conn:
        print("❌ Erro ao conectar ao banco")
        return False

    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("SELECT nome FROM criancas WHERE id = %s", (crianca_id,))
    crianca = cursor.fetchone()
    if not crianca:
        cursor.close()
        conn.close()
        print("❌ Criança não encontrada")
        return False

    cursor.execute("SELECT nome, telefone_whatsapp FROM responsaveis WHERE crianca_id = %s", (crianca_id,))
    responsaveis = cursor.fetchall()
    cursor.close()
    conn.close()

    if not responsaveis:
        print("❌ Nenhum responsável encontrado")
        return False

    print(f"🔐 ZAPI_INSTANCE: {ZAPI_INSTANCE}")
    print(f"🔐 ZAPI_TOKEN: {ZAPI_TOKEN[:5]}...")
    print(f"🔐 ZAPI_CLIENT_TOKEN: {ZAPI_CLIENT_TOKEN[:5]}...")

    for resp in responsaveis:
        telefone = re.sub(r'\D', '', str(resp['telefone_whatsapp']))
        
        if len(telefone) == 11 and telefone.startswith('4'):
            telefone = '55' + telefone
        elif len(telefone) == 10 and telefone.startswith('4'):
            telefone = '55' + telefone
        elif len(telefone) == 13 and telefone.startswith('55'):
            pass
        else:
            print(f"❌ Telefone inválido para {resp['nome']}: {telefone}")
            continue

        mensagem = f"🔔 *Igreja Mais de Cristo - Cultinho Kids*\n\n" \
                   f"Oi, {resp['nome']}! Sua(o) filha(o) *{crianca['nome']}* está precisando de você aqui no cultinho.\n" \
                   f"Motivo: {motivo}\n\n" \
                   f"📍 Pode vir até a Sala Kids? Estamos com ela(e) com carinho!\n\n" \
                   f"❤️ Equipe Mais de Cristo Canasvieiras"

        # ✅ URL SEM ESPAÇOS + Client-Token no header
        url = f"https://api.z-api.io/instances/{ZAPI_INSTANCE}/token/{ZAPI_TOKEN}/send-text"
        headers = {
            "Client-Token": ZAPI_CLIENT_TOKEN,
            "Content-Type": "application/json"
        }
        payload = {
            "phone": telefone,
            "message": mensagem
        }

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            if response.status_code in [200, 201]:
                print(f"✅ Mensagem enviada para {resp['nome']} ({telefone}@s.whatsapp.net)")
            else:
                print(f"❌ Erro ao enviar para {telefone}: {response.text}")
        except Exception as e:
            print(f"❌ Erro na requisição: {e}")

    return True

# ✅ 9. ROTA: CHECK-IN — ATUALIZADA
@app.route('/checkin', methods=['POST'])
def registrar_checkin():
    data = request.json
    crianca_id = data.get('crianca_id')
    status = data.get('status', 'presente')
    observacao = data.get('observacao', '')

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Erro ao conectar ao banco"}), 500

    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO checkins (crianca_id, status, observacao_alerta) VALUES (%s, %s, %s)",
        (crianca_id, status, observacao)
    )
    conn.commit()
    checkin_id = cursor.lastrowid

    # ✅ Busca nome e turma da criança
    cursor.execute("SELECT nome, turma FROM criancas WHERE id = %s", (crianca_id,))
    crianca = cursor.fetchone()
    cursor.close()
    conn.close()

    if status == 'alerta_enviado':
        sucesso = enviar_whatsapp_alerta(crianca_id, observacao)
        if not sucesso:
            return jsonify({
                "success": True, 
                "checkin_id": checkin_id,
                "warning": "Check-in feito, mas falha ao enviar WhatsApp"
            }), 201

    return jsonify({
        "success": True, 
        "checkin_id": checkin_id,
        "crianca_nome": crianca[0] if crianca else "Criança",
        "crianca_turma": crianca[1] if crianca else "Turma não informada"
    }), 201

# ✅ ROTA: CHECKOUT — REGISTRA SAÍDA DA CRIANÇA
@app.route('/checkout', methods=['POST'])
def registrar_checkout():
    data = request.json
    crianca_id = data.get('crianca_id')
    responsavel_nome = data.get('responsavel_nome')
    motivo = data.get('motivo')

    if not all([crianca_id, responsavel_nome, motivo]):
        return jsonify({"error": "Todos os campos são obrigatórios."}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Erro ao conectar ao banco"}), 500

    cursor = conn.cursor()

    # Verifica se a criança existe e está em check-in ativo
    cursor.execute("SELECT nome FROM criancas WHERE id = %s", (crianca_id,))
    crianca = cursor.fetchone()
    if not crianca:
        cursor.close()
        conn.close()
        return jsonify({"error": "Criança não encontrada."}), 404

    # Registra o checkout
    cursor.execute("""
        INSERT INTO checkins (crianca_id, status, observacao_alerta, responsavel_retirada)
        VALUES (%s, %s, %s, %s)
    """, (crianca_id, 'checkout', motivo, responsavel_nome))

    conn.commit()
    checkin_id = cursor.lastrowid
    cursor.close()
    conn.close()

    return jsonify({
        "success": True,
        "checkin_id": checkin_id,
        "crianca_nome": crianca[0],
        "responsavel": responsavel_nome,
        "motivo": motivo
    }), 201

# ✅ 10. ROTA: CADASTRAR CRIANÇA — ATUALIZADA
@app.route('/cadastrar-crianca', methods=['POST'])
def cadastrar_crianca():
    try:
        data = request.json
        print("📥 Dados recebidos:", data)

        if not data:
            return jsonify({"error": "Nenhum dado recebido"}), 400

        conn = get_db_connection()
        if not conn:
            print("❌ Falha ao conectar ao banco de dados")
            return jsonify({"error": "Erro ao conectar ao banco"}), 500

        cursor = conn.cursor()
        
        # ✅ Gera código único
        import random
        import string
        def gerar_codigo_unico(cursor):
            while True:
                codigo = 'CHK-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
                cursor.execute("SELECT id FROM criancas WHERE codigo_checkin = %s", (codigo,))
                if not cursor.fetchone():
                    return codigo

        codigo_checkin = gerar_codigo_unico(cursor)
        
        print(f"📝 Inserindo: nome={data.get('nome')}, codigo={codigo_checkin}")

        cursor.execute(
            "INSERT INTO criancas (nome, data_nascimento, turma, observacoes, codigo_checkin, responsavel_principal_telefone) VALUES (%s, %s, %s, %s, %s, %s)",
            (
                data.get('nome'),
                data.get('data_nascimento'),
                data.get('turma'),
                data.get('observacoes', ''),
                codigo_checkin,
                data.get('whatsappResp1')  # ← Aqui é o novo campo!
            )
        )
        
        conn.commit()
        crianca_id = cursor.lastrowid
        print(f"✅ Criança cadastrada com ID: {crianca_id} e código: {codigo_checkin}")
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "success": True, 
            "crianca_id": crianca_id,
            "codigo_checkin": codigo_checkin
        })

    except Exception as e:
        print(f"🔥 ERRO AO CADASTRAR CRIANÇA: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Erro interno: {str(e)}"}), 500

# ✅ 11. ROTA: CADASTRAR RESPONSÁVEL
@app.route('/cadastrar-responsavel', methods=['POST'])
def cadastrar_responsavel():
    data = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Erro no banco"}), 500

    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO responsaveis (crianca_id, nome, telefone_whatsapp, tipo_relacao) VALUES (%s, %s, %s, %s)",
        (data['crianca_id'], data['nome'], data['telefone_whatsapp'], data.get('tipo_relacao', 'Responsável'))
    )
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"success": True})

# ✅ 12. ROTA: LISTAR CRIANÇAS
@app.route('/listar-criancas', methods=['GET'])
def listar_criancas():
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Erro no banco"}), 500

    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, nome, turma, responsavel_principal_telefone FROM criancas ORDER BY nome")
    criancas = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify({"success": True, "criancas": criancas})

# ✅ 13. ROTA: RELATÓRIO COMPLETO DE CHECKINS
@app.route('/relatorio-checkins', methods=['GET'])
def relatorio_checkins():
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Erro ao conectar ao banco"}), 500

        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT COUNT(*) as total FROM criancas")
        total_criancas = cursor.fetchone()['total']

        cursor.execute("""
            SELECT turma, COUNT(*) as total
            FROM criancas
            GROUP BY turma
            ORDER BY turma
        """)
        frequencia_por_turma = cursor.fetchall()

        cursor.execute("""
            SELECT c.nome, c.turma, ch.status, ch.data_checkin, ch.observacao_alerta
            FROM checkins ch
            JOIN criancas c ON ch.crianca_id = c.id
            ORDER BY ch.data_checkin DESC
            LIMIT 10
        """)
        ultimos_checkins = cursor.fetchall()

        cursor.execute("""
            SELECT c.nome, c.turma, ch.status, ch.data_checkin, ch.observacao_alerta
            FROM checkins ch
            JOIN criancas c ON ch.crianca_id = c.id
            WHERE ch.status IN ('alerta_enviado', 'pai_veio', 'acalmou_sozinha')
            ORDER BY ch.data_checkin DESC
            LIMIT 5
        """)
        alertas_recentes = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify({
            "success": True,
            "total_criancas": total_criancas,
            "frequencia_por_turma": frequencia_por_turma,
            "ultimos_checkins": ultimos_checkins,
            "alertas_recentes": alertas_recentes,
            "gerado_em": datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        })

    except Exception as e:
        print(f"🔥 ERRO no relatório: {str(e)}")
        return jsonify({"error": f"Erro interno: {str(e)}"}), 500
        
# ✅ 14. ROTA: WEBHOOK DA Z-API
@app.route('/webhook/zapi', methods=['POST'])
def webhook_zapi():
    try:
        payload = request.get_json()
        if not payload:
            print("❌ Webhook: payload vazio")
            return jsonify({"status": "error", "message": "Payload vazio"}), 400

        event_type = payload.get('type')
        print(f"📩 Webhook recebido | Tipo: {event_type}")

        if event_type == 'message.received':
            sender = payload.get('sender')
            message_text = payload.get('body', '').strip()
            print(f"💬 Mensagem de {sender}: {message_text}")

            if message_text.lower() in ['oi', 'ola', 'olá', 'bom dia', 'boa tarde', 'boa noite']:
                responder_whatsapp(sender, "👋 Olá! Aqui é a equipe do Cultinho Kids da Igreja Mais de Cristo. Como podemos ajudar?")

        elif event_type == 'message.status':
            message_id = payload.get('messageId')
            status = payload.get('status')
            print(f"📬 Status da mensagem {message_id}: {status}")

        elif event_type == 'connection.update':
            connection_status = payload.get('status')
            print(f"🔌 Conexão WhatsApp: {connection_status}")

        return jsonify({"status": "success"}), 200

    except Exception as e:
        print(f"🔥 ERRO no webhook: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

# ✅ 15. ROTA: ENVIAR QR CODE VIA Z-API — AJUSTADA
@app.route('/enviar-qrcode', methods=['POST'])
def enviar_qrcode():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Nenhum dado recebido"}), 400

        numero = data.get('numero')
        base64Image = data.get('base64Image')
        nomeCrianca = data.get('nomeCrianca')
        codigo = data.get('codigo')

        # ✅ Validação mínima
        if not all([numero, base64Image, nomeCrianca, codigo]):
            return jsonify({"error": "Dados incompletos: número, base64, nome e código são obrigatórios"}), 400

        # ✅ Limpa o número
        numero = re.sub(r'\D', '', str(numero))
        if len(numero) == 11 and numero.startswith('4'):
            numero = '55' + numero
        elif len(numero) == 10 and numero.startswith('4'):
            numero = '55' + numero
        elif len(numero) == 13 and numero.startswith('55'):
            pass
        else:
            return jsonify({"error": "Número de telefone inválido. Formato esperado: 55XXYYYYYYYYY"}), 400

        # ✅ VALIDAÇÃO CRÍTICA: Remove prefixo do base64 se houver
        if base64Image.startswith('data:image'):
            base64Image = base64Image.split(',')[1]

        # ✅ Verifica se é base64 válido (mínimo)
        if len(base64Image) < 100:
            return jsonify({"error": "Imagem base64 inválida ou corrompida"}), 400

        # ✅ Monta mensagem
        mensagem = f"Olá! Aqui está o QR Code para check-in rápido do(a) {nomeCrianca} 🎉\nCódigo: *{codigo}*\nBasta escanear na entrada do culto!\n\n❤️ Igreja Mais de Cristo - Canasvieiras"

        # ✅ URL CORRETA — SEM ESPAÇOS!
        url = f"https://api.z-api.io/instances/{ZAPI_INSTANCE}/token/{ZAPI_TOKEN}/send-image"
        headers = {
            "Client-Token": ZAPI_CLIENT_TOKEN,
            "Content-Type": "application/json"
        }
        payload = {
            "phone": numero,
            "caption": mensagem,
            "image": base64Image
        }

        # ✅ LOG DA URL PARA DEBUG (apenas em desenvolvimento!)
        print(f"🔗 Enviando QR para {numero} | URL: {url}")
        print(f"🖼️ Base64 length: {len(base64Image)}")

        response = requests.post(url, json=payload, headers=headers, timeout=15)

        if response.status_code in [200, 201]:
            print(f"✅ QR Code enviado com sucesso para {numero}")
            return jsonify({
                "status": "success",
                "message": "QR Code enviado com sucesso!",
                "received": {
                    "numero": numero,
                    "nome": nomeCrianca,
                    "codigo": codigo
                }
            }), 200
        else:
            error_msg = response.text
            print(f"❌ Erro na API Z-API: {response.status_code} - {error_msg}")
            return jsonify({
                "error": f"Erro na API Z-API ({response.status_code}): {error_msg}",
                "payload_sent": payload
            }), 500

    except Exception as e:
        print(f"🔥 ERRO INTERNO ao enviar QR Code: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Erro interno: {str(e)}"}), 500

# ✅ 16. ROTA: LOGIN COM EMAIL/SENHA
@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        email = data.get('email')
        senha = data.get('senha')
        
        if not email or not senha:
            return jsonify({"error": "E-mail e senha são obrigatórios"}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Erro ao conectar ao banco"}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        # ✅ Busca usuário ATIVO
        cursor.execute(
            "SELECT id, nome, email, tipo_usuario FROM usuarios WHERE email = %s AND senha = %s AND ativo = TRUE",
            (email, senha)
        )
        usuario = cursor.fetchone()
        
        if usuario:
            # ✅ Atualiza ultimo_login
            cursor.execute(
                "UPDATE usuarios SET ultimo_login = NOW() WHERE id = %s",
                (usuario['id'],)
            )
            conn.commit()
            
            cursor.close()
            conn.close()
            
            return jsonify({
                "success": True,
                "usuario": {
                    "id": usuario['id'],
                    "nome": usuario['nome'],
                    "email": usuario['email'],
                    "tipo_usuario": usuario['tipo_usuario']
                }
            })
        else:
            cursor.close()
            conn.close()
            return jsonify({"error": "E-mail ou senha inválidos"}), 401
            
    except Exception as e:
        print(f"Erro no login: {str(e)}")
        return jsonify({"error": "Erro interno no servidor"}), 500

# ✅ 17. FUNÇÃO AUXILIAR: RESPONDER MENSAGEM VIA Z-API — AJUSTADA
def responder_whatsapp(telefone, mensagem):
    if not ZAPI_TOKEN or not ZAPI_INSTANCE:
        print("❌ Tokens da Z-API não configurados")
        return False

    # ✅ URL SEM ESPAÇOS + Client-Token no header
    url = f"https://api.z-api.io/instances/{ZAPI_INSTANCE}/token/{ZAPI_TOKEN}/send-text"
    headers = {
        "Client-Token": ZAPI_CLIENT_TOKEN,
        "Content-Type": "application/json"
    }
    payload = {
        "phone": telefone,
        "message": mensagem
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        if response.status_code in [200, 201]:
            print(f"✅ Resposta enviada para {telefone}@s.whatsapp.net")
            return True
        else:
            print(f"❌ Erro ao responder: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Erro na requisição de resposta: {e}")
        return False

# ✅ 18. CONFIGURAÇÃO GOOGLE AUTH — MODERNA E FUNCIONAL (AUTHLIB)
oauth = OAuth(app)
google = oauth.register(
    name='google',
    client_id=os.getenv('GOOGLE_CLIENT_ID'),
    client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile',
        'prompt': 'select_account'
    }
)

@app.route('/login/google')
def login_google():
    redirect_uri = url_for('authorized', _external=True)
    return google.authorize_redirect(redirect_uri)

@app.route('/login/google/callback')
def authorized():
    try:
        # ✅ Tenta obter o token de acesso
        token = google.authorize_access_token()
        if not token:
            return jsonify({"error": "Falha ao obter token de acesso."}), 400

        # ✅ Usa o token para buscar informações do usuário
        resp = google.get('https://www.googleapis.com/oauth2/v2/userinfo')
        userinfo = resp.json()

        # ✅ Extrai os dados necessários
        email = userinfo.get('email')
        nome = userinfo.get('name')

        if not email:
            return jsonify({"error": "Email não disponível no perfil do Google."}), 400

        # ✅ Busca ou cria usuário no banco
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT id, nome, email, tipo_usuario FROM usuarios WHERE email = %s", (email,))
        usuario = cursor.fetchone()

        if not usuario:
            cursor.execute("""
                INSERT INTO usuarios (nome, email, tipo_usuario, ativo, created_at) 
                VALUES (%s, %s, %s, TRUE, NOW())
            """, (nome, email, 'Voluntário'))
            conn.commit()
            usuario_id = cursor.lastrowid
            usuario = {
                "id": usuario_id,
                "nome": nome,
                "email": email,
                "tipo_usuario": "Voluntário"
            }

        # ✅ Atualiza último login
        cursor.execute("UPDATE usuarios SET ultimo_login = NOW() WHERE id = %s", (usuario['id'],))
        conn.commit()
        cursor.close()
        conn.close()

        # ✅ Cria sessão
        session['user_id'] = usuario['id']
        session['user_name'] = usuario['nome']
        session['user_email'] = usuario['email']
        session['user_role'] = usuario['tipo_usuario']

        return redirect('/menu')

    except Exception as e:
        # ✅ LOG DO ERRO PARA DEPURAÇÃO
        print(f"🔥 ERRO NO CALLBACK DO GOOGLE: {str(e)}")
        import traceback
        traceback.print_exc()

        # ✅ RETORNA ERRO AMIGÁVEL (sem expor detalhes sensíveis)
        return jsonify({
            "error": "Erro interno ao processar login com Google. Tente novamente.",
            "details": str(e)  # Só para desenvolvimento — remova em produção!
        }), 500

# ✅ NOVA ROTA: PRESENÇA POR TURMA E DATA
@app.route('/presenca-por-turma')
def presenca_por_turma():
    try:
        data_str = request.args.get('data')
        turma_filtro = request.args.get('turma', '')

        if not data_str:
            return jsonify({"success": False, "error": "Data obrigatória."}), 400

        # Converte string de data para objeto datetime
        data_checkin = datetime.strptime(data_str, '%Y-%m-%d').date()

        conn = get_db_connection()
        if not conn:
            return jsonify({"success": False, "error": "Erro ao conectar ao banco"}), 500

        cursor = conn.cursor(dictionary=True)

        # ✅ Busca todas as crianças cadastradas
        if turma_filtro:
            cursor.execute("SELECT id, nome, turma FROM criancas WHERE turma = %s ORDER BY nome", (turma_filtro,))
        else:
            cursor.execute("SELECT id, nome, turma FROM criancas ORDER BY nome")
        criancas = cursor.fetchall()

        # ✅ Busca todos os check-ins da data selecionada
        cursor.execute("""
            SELECT crianca_id, status, data_checkin 
            FROM checkins 
            WHERE DATE(data_checkin) = %s AND status IN ('presente', 'alerta_enviado', 'pai_veio', 'acalmou_sozinha')
        """, (data_checkin,))
        checkins_do_dia = cursor.fetchall()

        # Cria um set de IDs das crianças que fizeram check-in hoje
        checkin_ids = {item['crianca_id'] for item in checkins_do_dia}

        # Monta lista final: cada criança com status de presença/ausência
        resultado = []
        for crianca in criancas:
            presenca = crianca['id'] in checkin_ids
            ultimo_checkin = None

            # Busca o último check-in dessa criança (para mostrar quando foi)
            if presenca:
                for chk in checkins_do_dia:
                    if chk['crianca_id'] == crianca['id']:
                        ultimo_checkin = chk['data_checkin']
                        break

            resultado.append({
                "nome": crianca['nome'],
                "turma": crianca['turma'],
                "presenca": presenca,
                "ultimo_checkin": ultimo_checkin
            })

        cursor.close()
        conn.close()

        return jsonify({
            "success": True,
            "data": resultado,
            "data_selecionada": data_str,
            "turma_selecionada": turma_filtro,
            "total_criancas": len(resultado),
            "total_presentes": sum(1 for c in resultado if c['presenca'])
        })

    except Exception as e:
        print(f"🔥 ERRO na rota /presenca-por-turma: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": f"Erro interno: {str(e)}"}), 500

# ✅ 19. RODA LOCALMENTE
if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
