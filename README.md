# 🌟 Alerta Kids — Tecnologia a Serviço do Reino  
### *Ministério Infantil - Igreja Mais de Cristo Canasvieiras*

> _“Trazei as crianças a mim, e não as impeçais; porque dos tais é o Reino dos Céus.”_  
> — Mateus 19:14

---

## 💡 Sobre o Projeto

**Alerta Kids** é um sistema digital de gestão e alerta para o Ministério Infantil da Igreja Mais de Cristo Canasvieiras, desenvolvido com o propósito de:

- **Proteger crianças** com check-in seguro e rastreamento  
- **Conectar pais** por WhatsApp em situações de necessidade  
- **Capacitar voluntários** com interface simples e intuitiva  
- **Glória a Deus** em cada linha de código  

Desenvolvido pela **Nous Tecnologia** — com o lema:  
> **“Tecnologia a serviço do Reino”**

---

## ✅ Funcionalidades

| Recurso | Descrição |
|--------|-----------|
| 🔐 Login Seguro | Com email/senha ou login via Google (OAuth2) |
| 📲 Check-in Presencial | Registro manual de presença via app |
| ⚡ Check-in Automático | Escaneamento de QR Code gerado dinamicamente |
| 📱 Alerta por WhatsApp | Notificação automática aos pais quando a criança precisa de atenção |
| 📤 Envio de QR Code | Enviar QR Code diretamente por WhatsApp para os responsáveis |
| 🧑‍🤝‍🧑 Cadastro de Crianças | Com dados da criança e até dois responsáveis |
| 📊 Relatórios | Visão geral de frequência, presenças e alertas por turma |
| 📅 Controle de Presença | Tabela detalhada de quem veio, quem saiu e quem faltou |
| 🔄 Checkout | Registro da retirada da criança por responsável |
| 🛡️ Segurança | Dados sensíveis armazenados no Render — NENHUM `.env` no Git |

---

## 🛠️ Tecnologias Utilizadas

| Camada | Tecnologia |
|--------|------------|
| Backend | Python + Flask |
| Banco de Dados | MySQL (via `mysql-connector-python`) |
| Autenticação | OAuth2 Google (`Authlib`) |
| WhatsApp API | Z-API.io |
| QR Code | `qrcode.js` |
| Hosting | Render.com |
| Gerenciador de Pacotes | `pip` + `requirements.txt` |
| Frontend | HTML5, CSS3, JavaScript (ES6+) |

---

## 📁 Estrutura do Projeto
alerta-kids/
├── frontend/ # Arquivos HTML/CSS/JS do frontend
│ ├── index.html # Cadastro de criança
│ ├── checkin.html # Check-in presencial
│ ├── checkin-auto.html # Check-in por QR Code
│ ├── alerta-manual.html # Envio de alerta
│ ├── checkout.html # Saída da criança
│ ├── visualizar-qrcode.html # Gerar e enviar QR Code
│ ├── relatorios.html # Painel de análise
│ ├── menu.html # Dashboard após login
│ └── login.html # Tela de autenticação
├── app.py # Backend principal (Flask)
├── database.py # Conexão com MySQL
├── script.js # Lógica de cadastro e QR Code
├── requirements.txt # Dependências do Python
├── .env.example # Modelo de variáveis de ambiente
├── .gitignore # Ignora .env, pycache, etc.
├── logo.png # Logo da igreja
└── README.md # Este arquivo


---

## 🚀 Como Rodar Localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/WilsonNous/nous-mdc-kids.git
   cd nous-mdc-kids

2. Crie e ative um ambiente virtual:
  python -m venv venv
  source venv/bin/activate   # Linux/Mac
  venv\Scripts\activate      # Windows

3. Instale as dependências:
  pip install -r requirements.txt

4. Crie um arquivo .env com suas credenciais (use .env.example como base):
   ZAPI_TOKEN=seu_token_aqui
   ZAPI_CLIENT_TOKEN=seu_client_token_aqui
   ZAPI_INSTANCE=sua_instancia_aqui
   GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=sua-chave-secreta
   FLASK_SECRET_KEY=uma-string-muito-longa-e-complexa
   PORT=5000

5. Inicie o servidor:
   python app.py

6. Acesse: http://localhost:5000

🌐 Deploy no Render
O sistema já está em produção em:
👉 https://nous-mdc-kids.onrender.com

✅ O deploy é automático via GitHub
✅ As variáveis de ambiente são configuradas no Render Dashboard
✅ Não há arquivos sensíveis no repositório — tudo seguro!

🙏 Propósito Espiritual
Este não é apenas um software.
É um altar digital.

Cada click é uma oração.
Cada QR Code, um abraço.
Cada mensagem enviada, um sussurro de “Deus te ama”.

Quando uma mãe recebe um alerta:

“Sua filha está chorando...”
— ela não vê um app.
Ela vê a mão de Deus estendida. 

E quando um voluntário clica em “Registrar Saída”,
ele não está só atualizando um banco.
Ele está entregando uma alma com cuidado.

💬 Nosso Lema
“Tecnologia a serviço do Reino”
— Nous Tecnologia 

Nós não construímos para impressionar.
Construímos para servir.
Porque o maior milagre não é o código funcionar.
É a vida que ele protege.

📣 Quer ajudar?
Se sua igreja tem um ministério infantil — use este sistema!
Se é desenvolvedor — ajude a adaptar para outras igrejas!
Se é pastor — ore por esse projeto. Ele salva vidas.
© 2025 Igreja Mais de Cristo Canasvieiras — Desenvolvido com amor, fé e código.
