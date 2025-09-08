import requests
import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify, send_from_directory
from database import get_db_connection, close_db_connection
from datetime import datetime

# ✅ 1. Carrega variáveis de ambiente
load_dotenv()

# ✅ 2. CRIA A INSTÂNCIA DO FLASK — ISSO DEVE VIR ANTES DE QUALQUER @app.route!
app = Flask(__name__)

# ✅ 3. Configurações da Z-API
ZAPI_TOKEN = os.getenv("ZAPI_TOKEN")
ZAPI_INSTANCE = os.getenv("ZAPI_INSTANCE")

# ✅ 4. ROTA RAIZ — AGORA SIM, app JÁ EXISTE!
@app.route('/')
def home():
    return send_from_directory('frontend', 'index.html')

# ✅ 5. ROTA CHECKIN PAGE
@app.route('/checkin')
def checkin_page():
    return send_from_directory('frontend', 'checkin.html')

# ✅ 6. ROTA PARA ARQUIVOS ESTÁTICOS (CSS, JS)
@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory('frontend', filename)

# ✅ 7. FUNÇÃO DE ENVIO DE WHATSAPP
def enviar_whatsapp_alerta(crianca_id, motivo="Está precisando de você"):
    conn = get_db_connection()
    if not conn:
        print("❌ Erro ao conectar ao banco")
        return False

    cursor = conn.cursor(dictionary=True)
    
    # Busca dados da criança
    cursor.execute("SELECT nome FROM criancas WHERE id = %s", (crianca_id,))
    crianca = cursor.fetchone()
    if not crianca:
        cursor.close()
        conn.close()
        print("❌ Criança não encontrada")
        return False

    # Busca responsáveis
    cursor.execute("SELECT nome, telefone_whatsapp FROM responsaveis WHERE crianca_id = %s", (crianca_id,))
    responsaveis = cursor.fetchall()
    cursor.close()
    conn.close()

    if not responsaveis:
        print("❌ Nenhum responsável encontrado")
        return False

    # ✅ DEBUG: Verifica se tokens estão carregados
    print(f"🔐 ZAPI_INSTANCE: {ZAPI_INSTANCE}")
    print(f"🔐 ZAPI_TOKEN: {ZAPI_TOKEN[:5]}...")

    for resp in responsaveis:
        # Formata telefone: garante que começa com 55
        telefone = resp['telefone_whatsapp']
        if not telefone.startswith('55'):
            telefone = '55' + telefone

        mensagem = f"🔔 *Igreja Mais de Cristo - Cultinho Kids*\n\n" \
                   f"Oi, {resp['nome']}! Sua(o) filha(o) *{crianca['nome']}* está precisando de você aqui no cultinho.\n" \
                   f"Motivo: {motivo}\n\n" \
                   f"📍 Pode vir até a Sala Kids? Estamos com ela(e) com carinho!\n\n" \
                   f"❤️ Equipe Mais de Cristo Canasvieiras"

        # ✅ URL E HEADERS CORRIGIDOS — PADRÃO Z-API
        url = f"https://api.z-api.io/instances/{ZAPI_INSTANCE}/messages/text"
        headers = {
            "Client-Token": ZAPI_TOKEN,
            "Content-Type": "application/json"
        }
        payload = {
            "phone": telefone,
            "message": mensagem
        }

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            if response.status_code in [200, 201]:
                print(f"✅ Mensagem enviada para {resp['nome']} ({telefone})")
            else:
                print(f"❌ Erro ao enviar para {telefone}: {response.text}")
        except Exception as e:
            print(f"❌ Erro na requisição: {e}")

    return True

# ✅ 8. ROTA: CHECK-IN
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
    cursor.close()
    conn.close()

    # Se for alerta, envia WhatsApp
    if status == 'alerta_enviado':
        sucesso = enviar_whatsapp_alerta(crianca_id, observacao)
        if not sucesso:
            return jsonify({"success": True, "checkin_id": checkin_id, "warning": "Check-in feito, mas falha ao enviar WhatsApp"}), 201

    return jsonify({"success": True, "checkin_id": checkin_id}), 201

# ✅ 9. ROTA: CADASTRAR CRIANÇA
@app.route('/cadastrar-crianca', methods=['POST'])
def cadastrar_crianca():
    try:
        data = request.json
        print("📥 Dados recebidos:", data)  # Log para debug

        if not data:
            return jsonify({"error": "Nenhum dado recebido"}), 400

        conn = get_db_connection()
        if not conn:
            print("❌ Falha ao conectar ao banco de dados")
            return jsonify({"error": "Erro ao conectar ao banco"}), 500

        cursor = conn.cursor()
        
        # Log dos valores que serão inseridos
        print(f"📝 Inserindo: nome={data.get('nome')}, data_nasc={data.get('data_nascimento')}, turma={data.get('turma')}")

        cursor.execute(
            "INSERT INTO criancas (nome, data_nascimento, turma, observacoes) VALUES (%s, %s, %s, %s)",
            (
                data.get('nome'),
                data.get('data_nascimento'),
                data.get('turma'),
                data.get('observacoes', '')
            )
        )
        
        conn.commit()
        crianca_id = cursor.lastrowid
        print(f"✅ Criança cadastrada com ID: {crianca_id}")
        
        cursor.close()
        conn.close()
        
        return jsonify({"success": True, "crianca_id": crianca_id})

    except Exception as e:
        print(f"🔥 ERRO AO CADASTRAR CRIANÇA: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Erro interno: {str(e)}"}), 500

# ✅ 10. ROTA: CADASTRAR RESPONSÁVEL
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

# ✅ 11. ROTA: LISTAR CRIANÇAS
@app.route('/listar-criancas', methods=['GET'])
def listar_criancas():
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Erro no banco"}), 500

    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, nome, turma FROM criancas ORDER BY nome")
    criancas = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify({"success": True, "criancas": criancas})

# ✅ 14. ROTA: RELATÓRIO COMPLETO DE CHECKINS
@app.route('/relatorio-checkins', methods=['GET'])
def relatorio_checkins():
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Erro ao conectar ao banco"}), 500

        cursor = conn.cursor(dictionary=True)

        # ✅ 1. Total de crianças cadastradas
        cursor.execute("SELECT COUNT(*) as total FROM criancas")
        total_criancas = cursor.fetchone()['total']

        # ✅ 2. Frequência por turma
        cursor.execute("""
            SELECT turma, COUNT(*) as total
            FROM criancas
            GROUP BY turma
            ORDER BY turma
        """)
        frequencia_por_turma = cursor.fetchall()

        # ✅ 3. Últimos 10 check-ins (com nome da criança e status)
        cursor.execute("""
            SELECT c.nome, c.turma, ch.status, ch.data_checkin, ch.observacao_alerta
            FROM checkins ch
            JOIN criancas c ON ch.crianca_id = c.id
            ORDER BY ch.data_checkin DESC
            LIMIT 10
        """)
        ultimos_checkins = cursor.fetchall()

        # ✅ 4. Alertas recentes (últimos 5 alertas)
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
        
# ✅ 13. ROTA: WEBHOOK DA Z-API — RECEBE EVENTOS DO WHATSAPP
@app.route('/webhook/zapi', methods=['POST'])
def webhook_zapi():
    try:
        payload = request.get_json()
        if not payload:
            print("❌ Webhook: payload vazio")
            return jsonify({"status": "error", "message": "Payload vazio"}), 400

        event_type = payload.get('type')

        # ✅ LOG DO EVENTO RECEBIDO
        print(f"📩 Webhook recebido | Tipo: {event_type}")
        print(f"📦 Payload: {payload}")

        # 🔍 Se for mensagem recebida
        if event_type == 'message.received':
            sender = payload.get('sender')  # telefone no formato 5511999999999
            message_text = payload.get('body', '').strip()

            print(f"💬 Mensagem de {sender}: {message_text}")

            # ✅ AQUI VOCÊ PODE INTEGRAR COM SEU BANCO!
            # Ex: buscar se esse telefone é de um responsável cadastrado
            # Ex: se a mensagem for "CADASTRAR: ...", processar cadastro

            # 🚧 POR ENQUANTO, SÓ LOGAMOS — mas já tá RECEBENDO!
            # Vamos adicionar a lógica de resposta automática abaixo 👇

            # ✅ Responder automaticamente (opcional)
            if message_text.lower() in ['oi', 'ola', 'olá', 'bom dia', 'boa tarde', 'boa noite']:
                responder_whatsapp(sender, "👋 Olá! Aqui é a equipe do Cultinho Kids da Igreja Mais de Cristo. Como podemos ajudar?")

        # ✅ Se for status de mensagem (entregue, lida etc)
        elif event_type == 'message.status':
            message_id = payload.get('messageId')
            status = payload.get('status')
            print(f"📬 Status da mensagem {message_id}: {status}")

        # ✅ Se for atualização de conexão
        elif event_type == 'connection.update':
            connection_status = payload.get('status')
            print(f"🔌 Conexão WhatsApp: {connection_status}")

        # ✅ SEMPRE responda com 200 OK — senão a Z-API reenvia!
        return jsonify({"status": "success"}), 200

    except Exception as e:
        print(f"🔥 ERRO no webhook: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

# ✅ FUNÇÃO AUXILIAR: RESPONDER MENSAGEM VIA Z-API
def responder_whatsapp(telefone, mensagem):
    """Envia uma mensagem de resposta via Z-API"""
    if not ZAPI_TOKEN or not ZAPI_INSTANCE:
        print("❌ Tokens da Z-API não configurados")
        return False

    url = f"https://api.z-api.io/instances/{ZAPI_INSTANCE}/messages/text"
    headers = {
        "Client-Token": ZAPI_TOKEN,
        "Content-Type": "application/json"
    }
    payload = {
        "phone": telefone,
        "message": mensagem
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        if response.status_code in [200, 201]:
            print(f"✅ Resposta enviada para {telefone}")
            return True
        else:
            print(f"❌ Erro ao responder: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Erro na requisição de resposta: {e}")
        return False
        
# ✅ 12. RODA LOCALMENTE (Render usa Gunicorn — ignora isso em produção)
if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
