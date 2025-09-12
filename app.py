import requests
import os
import re
from dotenv import load_dotenv
from flask import Flask, request, jsonify, send_from_directory
from database import get_db_connection, close_db_connection
from datetime import datetime

# ✅ 1. Carrega variáveis de ambiente
load_dotenv()

# ✅ 2. CRIA A INSTÂNCIA DO FLASK
app = Flask(__name__)

# ✅ 3. Configurações da Z-API
ZAPI_TOKEN = os.getenv("ZAPI_TOKEN")          # Token da instância (vai na URL)
ZAPI_CLIENT_TOKEN = os.getenv("ZAPI_CLIENT_TOKEN")  # Token de segurança (vai no header)
ZAPI_INSTANCE = os.getenv("ZAPI_INSTANCE")

# ✅ 4. ROTA RAIZ
@app.route('/')
def home():
    return send_from_directory('frontend', 'index.html')

# ✅ 5. ROTA CHECKIN PAGE
@app.route('/checkin')
def checkin_page():
    return send_from_directory('frontend', 'checkin.html')
    
# ✅ 5. ROTA FALBACK — DEVE VIR ANTES DA ROTA DE ARQUIVOS ESTÁTICOS!
@app.route('/<path:path>')
def fallback(path):
    return send_from_directory('frontend', 'index.html')
    
# ✅ 6. ROTA PARA ARQUIVOS ESTÁTICOS
@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory('frontend', filename)

# ✅ 7. FUNÇÃO DE ENVIO DE WHATSAPP — AJUSTADA
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
            "Client-Token": ZAPI_CLIENT_TOKEN,  # ✅ Token de segurança
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

# ✅ 8. ROTA: CHECK-IN — ATUALIZADA
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

# ✅ 9. ROTA: CADASTRAR CRIANÇA — ATUALIZADA
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
            "INSERT INTO criancas (nome, data_nascimento, turma, observacoes, codigo_checkin) VALUES (%s, %s, %s, %s, %s)",
            (
                data.get('nome'),
                data.get('data_nascimento'),
                data.get('turma'),
                data.get('observacoes', ''),
                codigo_checkin
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
            "codigo_checkin": codigo_checkin  # ✅ Retorna o código gerado
        })

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
        
# ✅ 13. ROTA: WEBHOOK DA Z-API
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

# ✅ ROTA: ENVIAR QR CODE VIA Z-API — AJUSTADA
@app.route('/enviar-qrcode', methods=['POST'])
def enviar_qrcode():
    try:
        data = request.get_json()
        numero = data.get('numero')
        base64Image = data.get('base64Image')
        nomeCrianca = data.get('nomeCrianca')
        codigo = data.get('codigo')

        if not all([numero, base64Image, nomeCrianca, codigo]):
            return jsonify({"error": "Dados incompletos"}), 400

        numero = re.sub(r'\D', '', str(numero))
        if len(numero) == 11 and numero.startswith('4'):
            numero = '55' + numero
        elif len(numero) == 10 and numero.startswith('4'):
            numero = '55' + numero
        elif len(numero) == 13 and numero.startswith('55'):
            pass
        else:
            return jsonify({"error": "Número de telefone inválido"}), 400

        mensagem = f"Olá! Aqui está o QR Code para check-in rápido do(a) {nomeCrianca} 🎉\nCódigo: *{codigo}*\nBasta escanear na entrada do culto!"

        # ✅ URL SEM ESPAÇOS
        url = f"https://api.z-api.io/instances/{ZAPI_INSTANCE}/token/{ZAPI_TOKEN}/send-image"
        headers = {
            "Client-Token": ZAPI_CLIENT_TOKEN,  # ✅ Token de segurança
            "Content-Type": "application/json"
        }
        payload = {
            "phone": numero,
            "caption": mensagem,
            "image": base64Image
        }

        response = requests.post(url, json=payload, headers=headers, timeout=10)

        if response.status_code in [200, 201]:
            print(f"✅ QR Code enviado para {numero}@s.whatsapp.net")
            return jsonify({"status": "success", "message": "QR Code enviado com sucesso!"}), 200
        else:
            error_msg = response.text
            print(f"❌ Erro ao enviar QR Code: {error_msg}")
            return jsonify({"error": f"Erro na API: {error_msg}"}), 500

    except Exception as e:
        print(f"🔥 Erro interno ao enviar QR Code: {str(e)}")
        return jsonify({"error": f"Erro interno: {str(e)}"}), 500

# ✅ FUNÇÃO AUXILIAR: RESPONDER MENSAGEM VIA Z-API — AJUSTADA
def responder_whatsapp(telefone, mensagem):
    if not ZAPI_TOKEN or not ZAPI_INSTANCE:
        print("❌ Tokens da Z-API não configurados")
        return False

    # ✅ URL SEM ESPAÇOS + Client-Token no header
    url = f"https://api.z-api.io/instances/{ZAPI_INSTANCE}/token/{ZAPI_TOKEN}/send-text"
    headers = {
        "Client-Token": ZAPI_CLIENT_TOKEN,  # ✅ Token de segurança
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

# ✅ RODA LOCALMENTE
if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
