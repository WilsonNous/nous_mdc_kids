from flask import Flask, request, jsonify
from config import get_db_connection
import requests  # para enviar WhatsApp depois

app = Flask(__name__)

@app.route('/checkin', methods=['POST'])
def registrar_checkin():
    data = request.json
    crianca_id = data.get('crianca_id')
    status = data.get('status', 'presente')
    observacao = data.get('observacao', '')

    conn = get_db_connection()
    if conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO checkins (crianca_id, status, observacao_alerta) VALUES (%s, %s, %s)",
            (crianca_id, status, observacao)
        )
        conn.commit()
        checkin_id = cursor.lastrowid
        cursor.close()
        conn.close()

        # Se for alerta, envia WhatsApp (vamos implementar depois)
        if status == 'alerta_enviado':
            enviar_whatsapp_alerta(crianca_id, observacao)

        return jsonify({"success": True, "checkin_id": checkin_id}), 201
    else:
        return jsonify({"error": "Erro no banco"}), 500

def enviar_whatsapp_alerta(crianca_id, motivo):
    # Função que busca os responsáveis e envia mensagem
    # Vamos implementar na próxima etapa!
    pass

if __name__ == '__main__':
    app.run(debug=True)
