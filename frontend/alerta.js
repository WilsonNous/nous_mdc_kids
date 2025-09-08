let criancaSelecionada = null;

document.addEventListener('DOMContentLoaded', carregarCriancas);

async function carregarCriancas() {
    const listaDiv = document.getElementById('listaCriancas');
    listaDiv.innerHTML = '<p>Carregando...</p>';

    try {
        const response = await fetch('/listar-criancas');
        const data = await response.json();

        if (!data.success) throw new Error(data.error);

        if (data.criancas.length === 0) {
            listaDiv.innerHTML = '<p>❌ Nenhuma criança cadastrada ainda.</p>';
            return;
        }

        listaDiv.innerHTML = '<h3>Selecione uma criança para fazer check-in:</h3>';
        data.criancas.forEach(crianca => {
            const btn = document.createElement('button');
            btn.textContent = `✅ ${crianca.nome} (${crianca.turma})`;
            btn.onclick = () => selecionarCrianca(crianca);
            listaDiv.appendChild(btn);
        });

    } catch (error) {
        listaDiv.innerHTML = `<p>❌ Erro ao carregar: ${error.message}</p>`;
    }
}

function selecionarCrianca(crianca) {
    criancaSelecionada = crianca;
    document.getElementById('areaAlerta').style.display = 'block';
    document.getElementById('mensagemCheckin').className = 'mensagem sucesso';
    document.getElementById('mensagemCheckin').textContent = `Check-in registrado para ${crianca.nome}!`;
    
    // Envia check-in para o backend
    fetch('/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            crianca_id: crianca.id,
            status: 'presente'
        })
    }).catch(err => console.log('Erro ao registrar check-in:', err));
}

document.getElementById('btnAlerta').addEventListener('click', async function() {
    if (!criancaSelecionada) {
        alert('Selecione uma criança primeiro!');
        return;
    }

    const motivo = document.getElementById('motivoAlerta').value;
    const confirmar = confirm(`Tem certeza que deseja avisar os pais de ${criancaSelecionada.nome}?`);
    
    if (!confirmar) return;

    const btn = document.getElementById('btnAlerta');
    btn.disabled = true;
    btn.textContent = 'Enviando...';

    try {
        const response = await fetch('/checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                crianca_id: criancaSelecionada.id,
                status: 'alerta_enviado',
                observacao: motivo
            })
        });

        const data = await response.json();

        if (data.success) {
            document.getElementById('mensagemCheckin').className = 'mensagem sucesso';
            document.getElementById('mensagemCheckin').textContent = '✅ Alerta enviado com sucesso! Os pais foram notificados.';
        } else {
            throw new Error(data.error || 'Erro ao enviar alerta');
        }

    } catch (error) {
        document.getElementById('mensagemCheckin').className = 'mensagem erro';
        document.getElementById('mensagemCheckin').textContent = '❌ Erro: ' + error.message;
    } finally {
        btn.disabled = false;
        btn.textContent = '🔔 AVISAR PAIS AGORA';
    }
});
