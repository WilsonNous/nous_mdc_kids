let criancaSelecionada = null;
let criancasCache = []; // Armazena lista para busca e seleção

document.addEventListener('DOMContentLoaded', () => {
    inicializarAplicacao();
});

function inicializarAplicacao() {
    carregarCriancas();

    // ✅ Adiciona evento ao formulário
    const formCheckout = document.getElementById('formCheckout');
    if (formCheckout) {
        formCheckout.addEventListener('submit', handleCheckoutSubmit);
    }

    // ✅ Botões de feedback
    const btnCheckout = document.querySelector('.btn-checkout');
    if (btnCheckout) {
        btnCheckout.addEventListener('click', () => {
            // Evita submissão direta se não houver seleção
            if (!criancaSelecionada) {
                alert('Selecione uma criança antes de registrar a saída.');
                return false;
            }
        });
    }
}

async function carregarCriancas() {
    const select = document.getElementById('crianca_id');
    const mensagem = document.getElementById('mensagem');

    // Limpa e mostra loading
    select.innerHTML = '<option value="">Carregando...</option>';
    mensagem.textContent = '';

    try {
        const response = await fetch('/listar-criancas');

        if (!response.ok) {
            throw new Error(`Erro no servidor: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Erro ao carregar crianças');
        }

        criancasCache = data.criancas || [];
        renderizarListaCriancas(select, criancasCache);

    } catch (error) {
        console.error('Erro ao carregar crianças:', error);
        select.innerHTML = `
            <option value="">❌ Erro ao carregar</option>
        `;
        mensagem.className = 'mensagem erro';
        mensagem.textContent = '⚠️ Não foi possível carregar as crianças. Tente novamente.';
    }
}

function renderizarListaCriancas(selectElement, criancas) {
    selectElement.innerHTML = '<option value="">Selecione a criança...</option>';

    if (criancas.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = '❌ Nenhuma criança cadastrada';
        option.disabled = true;
        selectElement.appendChild(option);
        return;
    }

    criancas.forEach(crianca => {
        const option = document.createElement('option');
        option.value = crianca.id;
        option.textContent = `${crianca.nome} (${crianca.turma})`;
        selectElement.appendChild(option);
    });
}

async function handleCheckoutSubmit(e) {
    e.preventDefault();

    const msgDiv = document.getElementById('mensagem');
    const btnCheckout = document.querySelector('.btn-checkout');

    // Validação básica
    const criancaId = document.getElementById('crianca_id').value;
    const responsavelNome = document.getElementById('responsavel_nome').value.trim();
    const motivo = document.getElementById('motivo').value;

    if (!criancaId) {
        msgDiv.className = 'mensagem erro';
        msgDiv.textContent = 'Selecione uma criança!';
        return;
    }

    if (!responsavelNome) {
        msgDiv.className = 'mensagem erro';
        msgDiv.textContent = 'Informe o nome do responsável que retirou!';
        return;
    }

    if (!motivo) {
        msgDiv.className = 'mensagem erro';
        msgDiv.textContent = 'Escolha o motivo da saída!';
        return;
    }

    // Busca a criança selecionada
    criancaSelecionada = criancasCache.find(c => c.id == parseInt(criancaId));
    if (!criancaSelecionada) {
        msgDiv.className = 'mensagem erro';
        msgDiv.textContent = 'Criança não encontrada. Tente recarregar.';
        return;
    }

    // Feedback visual
    btnCheckout.disabled = true;
    btnCheckout.textContent = 'Enviando...';
    msgDiv.className = 'mensagem info';
    msgDiv.textContent = `Registrando saída de ${criancaSelecionada.nome}...`;

    try {
        const response = await fetch('/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                crianca_id: criancaSelecionada.id,
                responsavel_nome: responsavelNome,
                motivo: motivo
            })
        });

        if (!response.ok) {
            throw new Error(`Erro no servidor: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            msgDiv.className = 'mensagem sucesso';
            msgDiv.innerHTML = `✅ <strong>${criancaSelecionada.nome}</strong> saiu com <strong>${responsavelNome}</strong>!`;
            
            // Limpa o formulário
            document.getElementById('formCheckout').reset();
            criancaSelecionada = null;

            // Animação de sucesso
            btnCheckout.classList.add('success');
            setTimeout(() => {
                btnCheckout.classList.remove('success');
                btnCheckout.disabled = false;
                btnCheckout.textContent = '✅ Registrar Saída';
            }, 2000);

        } else {
            throw new Error(data.error || 'Falha ao registrar saída');
        }

    } catch (err) {
        console.error('Erro no checkout:', err);
        msgDiv.className = 'mensagem erro';
        msgDiv.textContent = '❌ Erro: ' + err.message;

        btnCheckout.disabled = false;
        btnCheckout.textContent = '✅ Registrar Saída';
    }
}
