document.getElementById('formCadastro').addEventListener('submit', async function(e) {
    e.preventDefault();

    const mensagemDiv = document.getElementById('mensagem');
    mensagemDiv.className = '';
    mensagemDiv.textContent = 'Cadastrando...';

    const crianca = {
        nome: document.getElementById('nomeCrianca').value,
        data_nascimento: document.getElementById('dataNascimento').value,
        turma: document.getElementById('turma').value,
        observacoes: document.getElementById('observacoes').value
    };

    const responsaveis = [];
    const resp1 = {
        nome: document.getElementById('nomeResp1').value,
        telefone_whatsapp: document.getElementById('whatsappResp1').value
    };
    if (resp1.nome && resp1.telefone_whatsapp) responsaveis.push(resp1);

    const resp2 = {
        nome: document.getElementById('nomeResp2').value,
        telefone_whatsapp: document.getElementById('whatsappResp2').value
    };
    if (resp2.nome && resp2.telefone_whatsapp) responsaveis.push(resp2);

    try {
        // Primeiro, cadastra a criança
        const responseCrianca = await fetch('http://localhost:5000/cadastrar-crianca', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(crianca)
        });

        const dataCrianca = await responseCrianca.json();

        if (!dataCrianca.success) {
            throw new Error(dataCrianca.error || 'Erro ao cadastrar criança');
        }

        // Depois, cadastra os responsáveis
        for (const resp of responsaveis) {
            resp.crianca_id = dataCrianca.crianca_id;
            const responseResp = await fetch('http://localhost:5000/cadastrar-responsavel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(resp)
            });
            const dataResp = await responseResp.json();
            if (!dataResp.success) {
                throw new Error(`Erro ao cadastrar responsável ${resp.nome}`);
            }
        }

        mensagemDiv.className = 'mensagem sucesso';
        mensagemDiv.textContent = '✅ Cadastro realizado com sucesso!';

        // Limpa o formulário
        document.getElementById('formCadastro').reset();

    } catch (error) {
        mensagemDiv.className = 'mensagem erro';
        mensagemDiv.textContent = '❌ Erro: ' + error.message;
    }
});
