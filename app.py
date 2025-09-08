import requests
import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify, send_from_directory
from config import get_db_connection

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

        # ✅ URL CORRIGIDA — SEM ESPAÇOS!
        url = f"https://api.z-api.io/instances/{ZAPI_INSTANCE}/token/{ZAPI_TOKEN}/send-messages"
        payload = {
            "phone": telefone,
            "message": mensagem
        }
        headers = {'Content-Type': 'application/json'}

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
    data = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Erro no banco"}), 500

    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO criancas (nome, data_nascimento, turma, observacoes) VALUES (%s, %s, %s, %s)",
        (data['nome'], data['data_nascimento'], data['turma'], data.get('observacoes', ''))
    )
    conn.commit()
    crianca_id = cursor.lastrowid
    cursor.close()
    conn.close()
    return jsonify({"success": True, "crianca_id": crianca_id})

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

# ✅ 12. RODA LOCALMENTE (Render usa Gunicorn — ignora isso em produção)
if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
