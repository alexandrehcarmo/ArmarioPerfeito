    // --- VARIÁVEIS GLOBAIS E DE LÓGICA ---
    let pontuacaoEstilos = {};
    let respostasPorPergunta = {};
    let estilosPrimarioSecundario = { primary: null, secondary: null, tertiary: null };
    let perguntaAtualIndice = -1;
    let faseAtual = 1;

    /* ====== Robust loader for html2pdf (definitive fix) ====== */
    async function loadScriptOnce(url, id) {
    if (id && document.getElementById(id)) return; // já carregado
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        if (id) s.id = id;
        s.src = url;
        s.async = false; // manter ordem previsível
        s.onload = () => resolve();
        s.onerror = (e) => reject(new Error('Failed to load script ' + url));
        document.head.appendChild(s);
    });
    }

    async function ensureHtml2pdf() {
    // já disponível
    if (window.html2pdf && typeof window.html2pdf === 'function') return;

    // tenta carregar versão conhecida compatível
    const cdn = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    try {
        await loadScriptOnce(cdn, 'html2pdf-lib');
        // aguarda microtick para garantir binding global
        await new Promise(r => setTimeout(r, 20));
        if (window.html2pdf && typeof window.html2pdf === 'function') return;
        throw new Error('html2pdf carregado mas não expõe função global html2pdf');
    } catch (err) {
        // fallback: tenta versão anterior sem bloqueio de integrity
        const fallback = 'https://unpkg.com/html2pdf.js@0.9.2/dist/html2pdf.bundle.js';
        try {
        await loadScriptOnce(fallback, 'html2pdf-fallback');
        await new Promise(r => setTimeout(r, 20));
        if (window.html2pdf && typeof window.html2pdf === 'function') return;
        throw new Error('fallback carregado mas html2pdf não disponível');
        } catch (err2) {
        // Erro definitivo
        throw new Error('Não foi possível carregar html2pdf. Verifique conexão/CDN. ' + err2.message);
        }
    }
    }
    /* ======================================================= */

    const totalPerguntas = 35;
    const todosOsEstilos = ["clássica", "tradicional", "dramática", "romântica", "sensual (sexy)", "criativa", "básica"];
    const labelsOpcoes = ["A", "B", "C", "D", "E", "F", "G"];
    let todasAsPerguntas = [];
    let phaseResultModal;

    // Guarda, para cada fase, o mapa de pontuações antes do reset
    const faseCounts = {
        1: {},
        2: {},
        3: {}
    };

    // Mapeamentos
    const imagemRanges = { 15: [3, 9], 16: [11, 17], 17: [19, 25], 18: [27, 33], 19: [35, 41], 20: [43, 49], 21: [51, 57], 22: [59, 65], 23: [67, 73], 24: [75, 81], 25: [83, 89], 26: [91, 97], 27: [99, 105], 28: [107, 113], 29: [115, 121], 30: [123, 129], 31: [131, 137], 32: [139, 145], 33: [147, 153], 34: [155, 161], 35: [163, 169] };
    const detalhesEstiloMapCompleto = { "clássica": "Você é elegante, refinada e feminina, prezando por acabamentos impecáveis e atemporalidade. Seu estilo é sofisticado, discreto, e você gosta de se enfeitar, encontrando prazer em combinar peças clássicas com detalhes que revelam uma sofisticação natural.", "tradicional": "Você é elegante, refinada e prática, valorizando a funcionalidade acima de tudo. Gosta de estar bem vestida com peças atemporais, clássicas e sóbrias, sem precisar dedicar muito tempo a isso. Discrição e eficiência são a sua marca.", "dramática": "Você é elegante, moderna e poderosa, buscando impacto sem dizer uma palavra. Adora misturar elementos diferentes para criar contrapontos, com roupas clássicas que possuem toques modernos, cores e elementos marcantes, sempre em busca de um visual interessante e contemporâneo.", "romântica": "Você é elegante, feminina e delicada, expressando leveza através das suas roupas. Prefere elementos femininos, como laços, pérolas e mangas bufantes, e se veste para realçar sua feminilidade de forma fofa e encantadora.", "sensual (sexy)": "Você é elegante, feminina e atraente, buscando se sentir poderosa e desejada. Suas roupas e acessórios valorizam seu corpo de forma elegante e magnética, mostrando o suficiente para ser atraente sem ser vulgar.", "criativa": "Você é elegante, moderna e fashionista, adorando ousar e brincar com combinações inusitadas. Acompanha tendências e usa a moda como forma de expressar sua criatividade e personalidade única, sem medo de experimentar e de se destacar.", "básica": "Você é elegante, prática e natural, priorizando o conforto e a discrição. Ama roupas confortáveis, fáceis de combinar e que não chamem muita atenção, evitando formalidade excessiva e prezando por um estilo simples, chique e sem frescura." };
    const ordemDesempate = [15, 21, 29, 33, 34, 35, 32, 31, 28, 25, 20, 19, 18, 17];

    // --- Conteúdo das páginas de introdução (Exatamente como no documento original) ---
    const introPages = [
        { 
            id: "intro-page-1", 
            title:"", 
            content: `
                <p>Seja bem-vinda ao nosso teste de estilos! Aqui você responderá a uma série de perguntas que foram cuidadosamente formuladas por mim, Marina, juntamente a uma equipe de consultoras e psicopedagogas. Este teste segue a metodologia Armário Perfeito de Consultoria de Imagem, método desenvolvido por mim e validado pelo MEC.</p>
                <p>Dentro do método AP, cada mulher possui 3 estilos predominantes: sendo um estilo primário, que é a sua identidade principal, seguido do estilo secundário e terciário.</p>
                <p>Vamos descobrir cada um deles e para isso o teste será dividido em <strong>3 etapas:</strong></p>
                <ol>
                    <li> a descoberta do estilo <strong>primário</strong></li>
                    <li> a descoberta do estilo <strong>secundário</strong></li>
                    <li> a descoberta do estilo <strong>terciário</strong></li>
                </ol>
                <p>Propositalmente, as perguntas se repetirão a cada etapa.</p>
                <p>Vamos começar? Separe <strong>30 minutos</strong> para responder!</p>
            ` 
        }
    ];
    
    let currentIntroPageIndex = 0;

    function initQuiz() {
        phaseResultModal = new bootstrap.Modal(document.getElementById('phase-result-modal'));
        document.getElementById('quiz-section').style.display = 'none';
        document.getElementById('final-resultado').style.display = 'none';
        showIntroPage();
        window.scrollTo(0, 0); // Para garantir que a página role para o topo ao iniciar
    }

    function showIntroPage() {
        const introSection = document.getElementById('intro-section');

        introSection.innerHTML = `
        <div class="intro-page card p-4 shadow-sm active">
            ${currentIntroPageIndex === 0 ? `
                <h1 class="display-4 fw-bold mb-3">Descubra seu estilo!</h1>
                
            ` : ''}
            <h3 class="card-title text-center mb-3 text-primary">${introPages[currentIntroPageIndex].title}</h3>
            <div class="card-text">${introPages[currentIntroPageIndex].content}</div>
            <div class="navigation-buttons">
                ${currentIntroPageIndex > 0 ? '<button class="btn btn-outline-secondary" onclick="prevIntroPage()">Voltar</button>' : ''}
                <button class="btn btn-primary" onclick="nextIntroPage()">${currentIntroPageIndex < introPages.length - 1 ? 'Próximo' : 'Começar Teste'}</button>
            </div>
        </div>
        `;
        
        introSection.style.display = 'block';
    }

    function nextIntroPage() {
        document.getElementById('intro-section').classList.add('fade-out-section');
        setTimeout(() => {
            document.getElementById('intro-section').style.display = 'none';
            startQuiz();
        }, 500);
    }

    function prevIntroPage() { if (currentIntroPageIndex > 0) { currentIntroPageIndex--; showIntroPage(); } }
    
    function startQuiz() {
        document.getElementById('quiz-section').style.display = 'block';
     
        // Esconde o resultado final caso tenha ficado exposto de execuções anteriores
        document.getElementById('final-resultado').style.display = 'none';


        loadAllQuestions();
        // todasAsPerguntas = shuffle([...todasAsPerguntas]); // embaralha mantendo os numeros originais

        // separa textuais e imagéticas
        const textQuestions  = todasAsPerguntas.filter(q => q.tipo === 'text');
        const imageQuestions = todasAsPerguntas.filter(q => q.tipo === 'image');

        // embaralha somente as opções das perguntas de texto
        textQuestions.forEach(q => {
        q.opcoes = shuffle([...q.opcoes]);
        });

        // mantém as perguntas na ordem: todas de texto primeiro, depois as de imagem
        todasAsPerguntas = [...textQuestions, ...imageQuestions];
            
        resetPontuacao();
        perguntaAtualIndice = 0;
        renderQuestion();
    }
    
    function resetPontuacao() { todosOsEstilos.forEach(estilo => { pontuacaoEstilos[estilo] = 0; }); }

    function renderQuestion() {   
        const quizSection = document.getElementById('quiz-section');
        quizSection.innerHTML = '';
        
        // Se acabar as perguntas, mostra os resultados da fase
        if (perguntaAtualIndice >= totalPerguntas) {
            processPhaseResults();
            return;
        }

        // Pega a pergunta atual (já embaralhada)
        const pergunta = todasAsPerguntas[perguntaAtualIndice];

        // Cria o card da pergunta
        const perguntaDiv = document.createElement('div');
        perguntaDiv.className = 'pergunta-container active card p-4 shadow-sm mb-4';

        // Calcula número para exibição na ordem aleatória
        const numeroExibicao = perguntaAtualIndice + 1;

        // Monta o HTML completo da pergunta
        /* perguntaDiv.innerHTML = `
            <p class="lead text-center">
                <strong>Pergunta ${numeroExibicao} de ${totalPerguntas} (Fase ${faseAtual})</strong>
            </p>
        <p class="text-center h5">${pergunta.texto}</p>
        <div class="row justify-content-center mt-3" id="opcoes-pergunta-${pergunta.numero}"></div>
        <div class="navigation-buttons">
            <button id="btn-proxima"
                class="btn btn-primary btn-lg"
                onclick="avancarParaProximaPergunta()"
                disabled>
              Próxima Pergunta
           </button>
        </div>
        `; */

        perguntaDiv.innerHTML = `
            <p class="lead text-center">
                <strong>Pergunta ${numeroExibicao} de ${totalPerguntas} (Fase ${faseAtual})</strong>
            </p>
            <p class="text-center h5">${pergunta.texto}</p>
            
            <div class="row justify-content-center mt-3" id="opcoes-pergunta-${pergunta.numero}"></div>
            
            <div class="navigation-buttons d-flex justify-content-between">
                <button id="btn-voltar"
                    class="btn btn-outline-secondary btn-lg"
                    onclick="voltarPergunta()"
                    ${perguntaAtualIndice === 0 ? 'disabled' : ''}> Voltar
                </button>
                <button id="btn-proxima"
                    class="btn btn-primary btn-lg"
                    onclick="avancarParaProximaPergunta()"
                    disabled>
                    Próxima Pergunta
                </button>
            </div>
        `;

        // Adiciona ao DOM
        quizSection.appendChild(perguntaDiv);
        
        /* ALTERADO 30/07 */ 
        perguntaDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Pega o container das opções e aplica classe de fase

        const opcoesContainer = document.getElementById(`opcoes-pergunta-${pergunta.numero}`);
        opcoesContainer.classList.add(`phase-${faseAtual}`);
        
        // Renderiza cada opção (texto ou imagem)
        let hasRenderableOptions = false;
        let currentVisualLabelIndex = 0;
        pergunta.opcoes.forEach(opcao => {
            const isEstiloOculto = 
                (faseAtual === 2 && estilosPrimarioSecundario.primary === opcao.estilo) || 
                (faseAtual === 3 && (
                    estilosPrimarioSecundario.primary === opcao.estilo || 
                    estilosPrimarioSecundario.secondary === opcao.estilo
                    )
                );
            if (!isEstiloOculto) {
                hasRenderableOptions = true;
                const visualLabel = labelsOpcoes[currentVisualLabelIndex++];
                const colDiv = document.createElement('div');
                colDiv.className = pergunta.tipo === 'text' ? 'col-12' : 'col-lg-4 col-md-6';
            
                if (pergunta.tipo === 'text') {
                    colDiv.innerHTML = `
                        <div class="d-grid gap-2">
                            <label class="btn btn-outline-primary mb-2 py-3 text-start">
                                <input type="radio" 
                                       class="d-none" 
                                       name="pergunta-${pergunta.numero}" 
                                       value="${opcao.label}" 
                                       data-estilo="${opcao.estilo}"> 
                                <strong>${visualLabel}.</strong> ${opcao.textExibicao}
                            </label>
                        </div>
                    `;
                } else {
                    colDiv.innerHTML = `
                        <div class="text-center mb-3">
                            <label class="d-block">
                                <input type="radio" 
                                    class="d-none" 
                                    name="pergunta-${pergunta.numero}" 
                                    value="${opcao.label}" 
                                    data-estilo="${opcao.estilo}">
                                <img src="${opcao.image}" class="quiz-img" alt="Opção ${visualLabel}">
                                <p class="text-muted mt-2 fw-bold">${visualLabel}</p>
                            </label>
                        </div>
                    `;
                }
                opcoesContainer.appendChild(colDiv);
            }
        });
    
        document.querySelectorAll(`input[name="pergunta-${pergunta.numero}"]`).forEach(input => {
            input.addEventListener('change', (event) => {
                handleAnswerSelection(pergunta.numero, event.target.dataset.estilo, event.target.value);
                if (pergunta.tipo === 'text') {
                    document.querySelectorAll(`input[name="pergunta-${pergunta.numero}"]`).forEach(radio => {
                        radio.parentElement.classList.remove('active', 'btn-primary');
                        radio.parentElement.classList.add('btn-outline-primary');
                    });
                    event.target.parentElement.classList.add('active', 'btn-primary');
                    event.target.parentElement.classList.remove('btn-outline-primary');
                } else {
                    document.querySelectorAll(`#opcoes-pergunta-${pergunta.numero} .quiz-img`).forEach(img => img.classList.remove('selected'));
                    event.target.nextElementSibling.classList.add('selected');
                }
            });
        });

        if (!hasRenderableOptions) {
            opcoesContainer.innerHTML = `<p class="text-center text-muted">Não há mais opções de estilo para esta fase. Avançando...</p>`;
            document.getElementById('btn-proxima').disabled = false;
        }

        if (perguntaDiv) { // Certifica-se de que a perguntaDiv existe
            // Delay curto para garantir que o evento de click / foco finalize antes do scroll.
            // Isso evita que o botão seja "desselecionado" pelo navegador enquanto ocorre o clique.
            setTimeout(() => {
                perguntaDiv.scrollIntoView({ block: "start", behavior: "smooth" });
            }, 80);
        }

    }

    function handleAnswerSelection(questionNumber, selectedStyle, selectedOptionLabel) {
        respostasPorPergunta[questionNumber] = { estilo: selectedStyle, label: selectedOptionLabel };
        document.getElementById('btn-proxima').disabled = false;
    }

    function avancarParaProximaPergunta() {
        const pergunta = todasAsPerguntas[perguntaAtualIndice];
        const resposta = respostasPorPergunta[pergunta.numero];
        if (resposta && resposta.estilo) {
            pontuacaoEstilos[resposta.estilo] = (pontuacaoEstilos[resposta.estilo] || 0) + 1;
        }
        perguntaAtualIndice++;
        renderQuestion();
    }

    function voltarPergunta() {
        if (perguntaAtualIndice > 0) {
            // Identifica a pergunta anterior
            const anterior = todasAsPerguntas[perguntaAtualIndice - 1];
            const respAntiga = respostasPorPergunta[anterior.numero];
            // Se havia resposta, remove o ponto
            if (respAntiga && respAntiga.estilo) {
                pontuacaoEstilos[respAntiga.estilo]--;
                delete respostasPorPergunta[anterior.numero];
            }
            perguntaAtualIndice--;
            renderQuestion();
            // Re-habilita “Próxima” se já tiver resposta nesta pergunta
            const respAtual = respostasPorPergunta[todasAsPerguntas[perguntaAtualIndice].numero];
            document.getElementById('btn-proxima').disabled = !respAtual;
        }
    }

    function processPhaseResults() {
       // passo 0: esconde e limpa o container FINAL em TODAS as fases
       const finalDiv = document.getElementById('final-resultado');
       finalDiv.style.display = 'none';
       finalDiv.classList.remove('show');
       finalDiv.innerHTML = '';

        // 1) Clone a pontuação desta fase
        faseCounts[faseAtual] = { ...pontuacaoEstilos };

        // 2) Determina o estilo vencedor desta fase
        let estilosExcluidos = [];
        if (faseAtual === 2) {
            estilosExcluidos = [estilosPrimarioSecundario.primary];
        } else if (faseAtual === 3) {
            estilosExcluidos = [
            estilosPrimarioSecundario.primary,
            estilosPrimarioSecundario.secondary
            ];
        }
        const estiloVencedorDaFase = getEstiloVencedor(pontuacaoEstilos, estilosExcluidos);

        // 3) Armazena o vencedor
        if (faseAtual === 1) {
            estilosPrimarioSecundario.primary = estiloVencedorDaFase;
        } else if (faseAtual === 2) {
            estilosPrimarioSecundario.secondary = estiloVencedorDaFase;
        } else {
            estilosPrimarioSecundario.tertiary = estiloVencedorDaFase;
        }

        console.log(`>>> Fase ${faseAtual} contagens:`, faseCounts[faseAtual]);
        console.log(
            `>>> Escolhido como ${
            faseAtual === 1
                ? 'primário'
                : faseAtual === 2
                ? 'secundário'
                : 'terciário'
            }:`,
            estiloVencedorDaFase
        );

        // 4) Só mostra modal de transição nas fases 1 e 2
        const modalTitle = document.getElementById('modalLabel');
        const modalBody  = document.getElementById('modalBody');
        const modalBtn   = document.getElementById('modal-continue-btn');

        if (faseAtual === 1) {
            modalTitle.textContent = 'FASE 2';
            modalBody.innerHTML = `
            Perfeito, com essas respostas já descobrimos o seu estilo primário. Na segunda fase vamos descobrir o seu estilo secundário.<br>
            Para isso, as perguntas da fase 1 se repetem, porém <strong>excluindo as que correspondem ao seu estilo primário</strong>.
            `;
            modalBtn.textContent = 'Ir para Fase 2';
            phaseResultModal.show();

        } else if (faseAtual === 2) {
            modalTitle.textContent = 'FASE 3';
            modalBody.innerHTML = `
            Estamos quase no fim, já identificamos seus estilos primário e secundário. 
            Agora vamos para a terceira (e última) fase do teste para descobrir o seu estilo terciário. 
            Lembrando, as perguntas das fases 1 e 2 se repetem, mas excluindo as que correspondem aos seus estilos primário e secundário. <br>
            <br>
            Vamos lá?
            `;
            modalBtn.textContent = 'Ir para Fase 3';
            phaseResultModal.show();

        } else {
            // 5) Somente na Fase 3 exibimos o resultado final
            console.log(">>> Chegou na Fase 3, exibindo resultado final");
            displayFinalResults();
        }
    }

    function proceedToNextStep() {

        // Oculta o resultado final entre fases
        document.getElementById('final-resultado').style.display = 'none';

        // Só chamados quando há modal. Aqui só avançamos fases 1 e 2.
        phaseResultModal.hide();
        faseAtual++;
        resetPontuacao();
        // todasAsPerguntas = shuffle([...todasAsPerguntas]); // nova ordem para a fase seguinte

        // agrupa e embaralha só opções de texto novamente
        const textQuestions  = todasAsPerguntas.filter(q => q.tipo === 'text');
        const imageQuestions = todasAsPerguntas.filter(q => q.tipo === 'image');
        textQuestions.forEach(q => {
          q.opcoes = shuffle([...q.opcoes]);
        });
        todasAsPerguntas = [...textQuestions, ...imageQuestions];

        perguntaAtualIndice = 0;
        renderQuestion();
    }
    function shuffle(array) {
        // perguntas exibidas em ordem aleatória
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    async function handleDownload() {
        try {
            const finalEl = document.getElementById('final-resultado');
            if (!finalEl) throw new Error('Elemento #final-resultado não encontrado');

            // Gera blob via html2pdf (usa sua função robusta)
            const blob = await generatePdfBlobFromElement(finalEl);

            const filename = `Resultado_ArmarioPerfeito_${new Date().toISOString().slice(0,10)}.pdf`;
            downloadPdfBlob(blob, filename);
        } catch (err) {
            console.error('handleDownload erro:', err);
            // fallback: abre a janela de print (usuário pode salvar como PDF)
            try {
            createPrintViewAndPrint(document.getElementById('final-resultado'));
            } catch (e) {
            alert('Erro ao gerar PDF. Veja console para detalhes.');
            }
        }
    }

    function displayFinalResults() {
        const finalDiv = document.getElementById('final-resultado');

        // 1) sair imediatamente se não for a fase 3
        if (faseAtual < 3) {
            finalDiv.style.display = 'none';
            return;
        }

        // — só chegamos aqui na fase 3, monta o HTML final —

        window.scrollTo(0, 0);
        document.getElementById('intro-section').style.display = 'none';
        document.getElementById('quiz-section').style.display  = 'none';

        const primary   = estilosPrimarioSecundario.primary   || 'NÃO DEFINIDO';
        const secondary = estilosPrimarioSecundario.secondary || 'NÃO DEFINIDO';
        const tertiary  = estilosPrimarioSecundario.tertiary  || 'NÃO DEFINIDO';

        const html = `
            <div class="final-results-header">
                <h3>Diagnóstico de estilo finalizado.</h3>
                <p class="text-center mb-1 lead">Parabéns! Os seus estilos são:</p>
                <p class="text-left mb-4">
                    <strong>Primário:</strong> ${primary.toUpperCase()}<br>
                    <strong>Secundário:</strong> ${secondary.toUpperCase()}<br>
                    <strong>Terciário:</strong> ${tertiary.toUpperCase()}
                </p>
            </div>

            <!-- BLOCO DO ESTILO PRIMÁRIO -->

            <div class="row justify-content-center">
                <div class="col-lg-8 mb-4">
                    <div class="style-result primary-style">
                        <h4><span class="style-icon">⭐</span>Estilo Primário</h4>
                        <span class="style-name">${primary.toUpperCase()}</span>
                        <p class="style-description">${detalhesEstiloMapCompleto[primary]}</p>
                    </div>
                </div>
            </div>

            <!-- BLOCOS DE SECUNDÁRIO E TERCIÁRIO -->

            <div class="row justify-content-center">
                <div class="col-lg-6 mb-4">
                    <div class="style-result secondary-style">
                        <h4><span class="style-icon">✨</span>Estilo Secundário</h4>
                        <span class="style-name">${secondary.toUpperCase()}</span>
                        <p class="style-description">${detalhesEstiloMapCompleto[secondary]}</p>
                    </div>
                </div>

                <div class="col-lg-6 mb-4">
                    <div class="style-result tertiary-style">
                        <h4><span class="style-icon">💫</span>Estilo Terciário</h4>
                        <span class="style-name">${tertiary.toUpperCase()}</span>
                         <p class="style-description">${detalhesEstiloMapCompleto[tertiary]}</p>
                    </div>
                </div>
            </div>

            <p class="final-call-to-action">
                Para entender todos os detalhes sobre eles e saber como aplicá-los
                no seu armário e na sua rotina, basta acessar os materiais
                de cada um deles que se encontram dentro da sessão inicial do nosso aplicativo!
            </p>
        `;

        // Limpa e exibe o resultado final
        finalDiv.innerHTML     = html;
        // Adiciona controles de exportação ao topo do resultado (botão imprimir/baixar PDF)
        finalDiv.innerHTML = `
            <div class="result-export-controls" style="display:flex;justify-content:flex-end;gap:12px;margin-bottom:18px;">
                <button id="btn-download-pdf" class="btn btn-outline-secondary" title="Baixar / Imprimir resultado">Baixar PDF</button>
            </div>
        ` + finalDiv.innerHTML;

        finalDiv.style.display = 'block';
        finalDiv.classList.add('show');
        
        // Delay curto para evitar conflitos com qualquer transição/fechamento de modal
        setTimeout(() => {
            finalDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);


        // liga o botão à coleta de nome/email + envio
        const pdfBtn = document.getElementById('btn-download-pdf');
        if (pdfBtn) {
            // remove listeners antigos (caso já tenham sido ligados em execuções anteriores)
            const clone = pdfBtn.cloneNode(true);
            pdfBtn.parentNode.replaceChild(clone, pdfBtn);
            clone.addEventListener('click', function (ev) {
                ev.preventDefault();
                ev.stopPropagation();   // evita que o listener global em document capture este clique - ADICIONADO 18/09
                handleDownload();
            });
        }

    }

    /**
     * Abre uma janela/aba limpa com uma versão leve do container final
     * e chama print() do navegador. Fecha a janela automaticamente após o print.
     *
     * Recebe o elemento container (#final-resultado).
     */
    /**
     * Gera PDF/imprime o conteúdo final do container.
     * - Desktop: abre janela e chama print()
     * - Mobile: utiliza html2pdf (cliente) para gerar e baixar o PDF
     */
    function createPrintViewAndPrint(finalContainer) {
        if (!finalContainer) {
            console.warn('createPrintViewAndPrint: container não encontrado');
            return;
        }

        // Conteúdo que vamos imprimir/transformar em PDF
        const contentHTML = finalContainer.innerHTML;

        // Versão leve do HTML que será usada tanto para print quanto para o html2pdf
        const printHTML = `
        <!doctype html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Resultado - Armário Perfeito</title>
            <meta name="viewport" content="width=device-width,initial-scale=1">
            <style>
            body { font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial; color:#222; margin:12px; background:#fff; }
            .final-results-header h3 { font-size: 20px; margin: 0 0 8px; }
            .final-results-header p.lead { font-size: 14px; margin: 0 0 12px; }
            .style-result { border-radius:6px; padding:10px; margin-bottom:10px; background:#fff; border:1px solid #e6e6e6; }
            .style-name { font-size:16px; display:block; margin:6px 0; font-weight:700; color:#163d2e; }
            .style-description { font-size:13px; line-height:1.45; color:#333; }
            img { max-width:100%; height:auto; display:block; margin:6px 0; }
            .result-export-controls { display:none !important; }
            /* Forçar imagens menos pesadas no PDF (escala) */
            img.pdf-optim { max-width: 480px; width: 100%; height: auto; object-fit: contain; }
            </style>
        </head>
        <body>
            ${contentHTML}
        </body>
        </html>
        `;

        // Detecta se é mobile simples
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // Se mobile -> tenta gerar PDF com html2pdf
        if (isMobile && window.html2pdf && typeof window.html2pdf === 'function') {
            // Cria temporariamente um elemento em memória com o HTML
            const wrapper = document.createElement('div');
            wrapper.innerHTML = printHTML;
            // Marcar imagens para otimização (aplica classe)
            const imgs = wrapper.querySelectorAll('img');
            imgs.forEach(img => img.classList.add('pdf-optim'));

            // Configurações do html2pdf
            const opt = {
                margin:       [10, 8, 10, 8], // mm (top,right,bottom,left)
                filename:     `Resultado_ArmarioPerfeito_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.pdf`,
                image:        { type: 'jpeg', quality: 0.85 },
                html2canvas:  { scale: 1.5, useCORS: true, logging: false },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            // Use html2pdf para gerar e baixar
            try {
                // html2pdf aceita um elemento DOM — passamos wrapper.firstElementChild (o <html>)
                window.html2pdf().set(opt).from(wrapper).save().then(() => {
                    console.info('PDF gerado e download iniciado (mobile).');
                }).catch(err => {
                    console.warn('html2pdf falhou, fallback para abrir print:', err);
                    // fallback: tenta abrir print normal (menos confiável em mobile)
                    openPrintWindowFallback(printHTML);
                });
            } catch (err) {
                console.error('Erro ao usar html2pdf:', err);
                openPrintWindowFallback(printHTML);
            }
            return;
        }

        // Desktop: usar janela + print
        openPrintWindowFallback(printHTML);

        // função auxiliar para fallback (abre nova janela e chama print)
        function openPrintWindowFallback(htmlContent) {
            const w = window.open('', '_blank', 'toolbar=0,location=0,menubar=0,width=900,height=700');
            if (!w) {
                alert('Não foi possível abrir a janela de impressão. Permita popups e tente novamente.');
                return;
            }
            w.document.open();
            w.document.write(htmlContent);
            w.document.close();

            // espera carregar recursos (simples timeout)
            setTimeout(() => {
                try {
                    w.focus();
                    w.print();
                    // tenta fechar a janela depois do print
                    setTimeout(() => { try { w.close(); } catch (e) {} }, 1000);
                } catch (err) {
                    console.error('Erro ao chamar print:', err);
                }
            }, 400);
        }
    }

    function getEstiloVencedor(pontuacoes, estilosExcluidos) {
        let maxPontos = -1;
        let vencedoresPotenciais = [];
        todosOsEstilos.forEach(estilo => {
            if (!estilosExcluidos.includes(estilo)) {
                const pontos = pontuacoes[estilo] || 0;
                if (pontos > maxPontos) {
                    maxPontos = pontos;
                    vencedoresPotenciais = [estilo];
                } else if (pontos === maxPontos && pontos > 0) {
                    vencedoresPotenciais.push(estilo);
                }
            }
        });
        if (vencedoresPotenciais.length === 1) return vencedoresPotenciais[0];
        if (vencedoresPotenciais.length > 1) return aplicarDesempate(vencedoresPotenciais, respostasPorPergunta, estilosExcluidos);
        // Fallback para caso não encontre nenhum vencedor potencial (todos excluídos ou 0 pontos)
        /* Adicione a linha abaixo (será a linha 460)  console.log("getEstiloVencedor: Retornando estilos:", { primary, secondary, tertiary });*/
        return todosOsEstilos.find(s => !estilosExcluidos.includes(s)) || todosOsEstilos[0]; 
    }

    function aplicarDesempate(estilosEmpatados, respostas, estilosExcluidos) {
        for (const qNum of ordemDesempate) {
            const respostaDaPergunta = respostas[qNum];
            if (respostaDaPergunta && estilosEmpatados.includes(respostaDaPergunta.estilo) && !estilosExcluidos.includes(respostaDaPergunta.estilo)) {
                return respostaDaPergunta.estilo;
            }
        }
        // Se o desempate não puder ser resolvido pelas perguntas específicas,
        // retorna o primeiro estilo empatado em ordem alfabética como fallback,
        // desde que não esteja na lista de excluídos.
        const sortedEmpatados = estilosEmpatados.sort();
        return sortedEmpatados.find(s => !estilosExcluidos.includes(s)) || sortedEmpatados[0];
    }

    function loadAllQuestions() {
        todasAsPerguntas = [
            { numero: 1, texto: "Como você gostaria de ser percebida ao entrar em um ambiente?", tipo: "text",
                opcoes: [
                    { label: "A", text: "Elegante, refinada e feminina", estilo: "clássica" },
                    { label: "B", text: "Elegante, refinada e prática", estilo: "tradicional" },
                    { label: "C", text: "Elegante, moderna e poderosa", estilo: "dramática" },
                    { label: "D", text: "Elegante, feminina e delicada", estilo: "romântica" },
                    { label: "E", text: "Elegante, feminina e atraente", estilo: "sensual (sexy)" },
                    { label: "F", text: "Elegante, moderna e fashionista", estilo: "criativa" },
                    { label: "G", text: "Elegante, prática e natural", estilo: "básica" }
                ]
            },
            { numero: 2, texto: "Qual, destas afirmações, mais combina com você?", tipo: "text",
                opcoes: [
                    { label: "A", text: `Gosto de sentir que estou sempre bem vestida e sofisticada.`, estilo: "clássica" },
                    { label: "B", text: `Gosto de sentir que estou sempre bem vestida mas antes, prezo pela funcionalidade.`, estilo: "tradicional" },
                    { label: "C", text: `Gosto de sentir que estou sempre bem vestida mas não gosto de me sentir "clássica demais”.`, estilo: "dramática" },
                    { label: "D", text: `Adoro me sentir feminina e mostrar delicadeza e leveza através das minhas roupas.`, estilo: "romântica" },
                    { label: "E", text: `Eu quero que minha roupa atraia olhares e mostre que sou uma mulher segura.`, estilo: "sensual (sexy)" },
                    { label: "F", text: `Adoro ser a pessoa mais estilosa do lugar, amo acompanhar tendências!`, estilo: "criativa" },
                    { label: "G", text: `Não gosto de chamar atenção, prefiro estar discreta, isso me deixa mais à vontade.`, estilo: "básica" }
                ]
            },
            { numero: 3, texto: "O que é mais importante dentre todas as alternativas?", tipo: "text",
                opcoes: [
                    { label: "A", text: "Ser elegante", estilo: "clássica" },
                    { label: "B", text: "Ser prática", estilo: "tradicional" },
                    { label: "C", text: "Ser moderna", estilo: "dramática" },
                    { label: "D", text: "Ser feminina", estilo: "romântica" },
                    { label: "E", text: "Ser atraente", estilo: "sensual (sexy)" },
                    { label: "F", text: "Ser fashion", estilo: "criativa" },
                    { label: "G", text: "Ser confortável", estilo: "básica" }
                ]
            },
            { numero: 4, texto: "Para combinar com <strong>jeans e camiseta básica</strong>, o que é mais a sua cara?", tipo: "text",
                opcoes: [
                    { label: "A", text: "Um blazer acinturado bege com botões dourados", estilo: "clássica" },
                    { label: "B", text: "Um blazer reto, risca de giz marinho", estilo: "tradicional" },
                    { label: "C", text: "Um blazer oversized com ombreiras", estilo: "dramática" },
                    { label: "D", text: "Um casaquinho de tweed rosa", estilo: "romântica" },
                    { label: "E", text: "Um casaco de pelos vinho", estilo: "sensual (sexy)" },
                    { label: "F", text: "Um kimono de veludo bordado com paetês coloridos", estilo: "criativa" },
                    { label: "G", text: "Uma jaqueta de couro preta", estilo: "básica" }
                ]
            },
            { numero: 5, texto: "Qual frase mais combina com o seu jeito de se vestir no dia-a-dia?", tipo: "text",
                opcoes: [
                    { label: "A", text: `“É possível ser feminina e formal ao mesmo tempo.”`, estilo: "clássica" },
                    { label: "B", text: `“Discrição é o último grau de sofisticação.”`, estilo: "tradicional" },
                    { label: "C", text: `“Amo causar impacto sem dizer uma palavra.”`, estilo: "dramática" },
                    { label: "D", text: `“Me visto para expressar minha feminilidade.”`, estilo: "romântica" },
                    { label: "E", text: `“Quero me sentir poderosa e desejada.”`, estilo: "sensual (sexy)" },
                    { label: "F", text: `“Amo brincar com combinações inusitadas.”`, estilo: "criativa" },
                    { label: "G", text: `“Me visto com praticidade e zero frescura.”`, estilo: "básica" }
                ]
            },
            { numero: 6, texto: "Qual é o melhor elogio sobre o seu look?", tipo: "text",
                opcoes: [
                    { label: "A", text: `“Você está chiquíssima.”`, estilo: "clássica" },
                    { label: "B", text: `“Você está simples e elegante.”`, estilo: "tradicional" },
                    { label: "C", text: `“Você está moderna e impactante.”`, estilo: "dramática" },
                    { label: "D", text: `“Você está tão delicada e feminina!”`, estilo: "romântica" },
                    { label: "E", text: `“Você está incrível e irresistível.”`, estilo: "sensual (sexy)" },
                    { label: "F", text: `“Você está diferente de todos e criativa!”`, estilo: "criativa" },
                    { label: "G", text: `“Você parece tão confortável e natural!”`, estilo: "básica" }
                ]
            },
            { numero: 7, texto: "Considerando o mesmo preço e qualidade, qual estilo de loja te atrai mais:", tipo: "text",
                opcoes: [
                    { label: "A", text: "Uma loja de peças clássicas com toque de feminilidade.", estilo: "clássica" },
                    { label: "B", text: "Uma loja de peças clássicas e confortáveis.", estilo: "tradicional" },
                    { label: "C", text: "Uma loja de peças clássicas misturada com peças de impacto.", estilo: "dramática" },
                    { label: "D", text: "Uma loja de peças leves, com ar delicado e feminino.", estilo: "romântica" },
                    { label: "E", text: "Uma loja de peças elegantes e sensuais ao mesmo tempo.", estilo: "sensual (sexy)" },
                    { label: "F", text: "Uma loja com tendencias, e todos os tipos de estilo.", estilo: "criativa" },
                    { label: "G", text: "Uma loja com peças básicas, confortáveis, sem modismos.", estilo: "básica" }
                ]
            },
            { numero: 8, texto: "Qual frase define melhor a sua relação com as <strong>tendências</strong>?", tipo: "text",
                opcoes: [
                    { label: "A", text: "Prefiro peças clássicas e atemporais, assim vou me sentir sempre elegante.", estilo: "clássica" },
                    { label: "B", text: "Acho chato essa coisa da moda ficar mudando, prefiro estar sempre igual, assim não erro e ganho mais tempo.", estilo: "tradicional" },
                    { label: "C", text: "Gosto de algumas tendências, mas sempre misturo com clássicos.", estilo: "dramática" },
                    { label: "D", text: "Gosto de tendências que realçam meu lado feminino de uma forma delicada.", estilo: "romântica" },
                    { label: "E", text: "Gosto de tendências que realçam meu lado feminino de uma forma mais poderosa.", estilo: "sensual (sexy)" },
                    { label: "F", text: "Estou sempre testando tudo que é novo, adoro ousar e me divirto fazendo isso.", estilo: "criativa" },
                    { label: "G", text: "Não tenho paciência para acompanhar tendências, gosto de roupas confortáveis e fáceis.", estilo: "básica" }
                ]
            },
            { numero: 9, texto: "Qual destas situações te faria repensar uma roupa?", tipo: "text",
                opcoes: [
                    { label: "A", text: "Parecer informal demais.", estilo: "clássica" },
                    { label: "B", text: "Sentir que a roupa me deixou muito doce.", estilo: "tradicional" },
                    { label: "C", text: "Ficar apagada ou sem destaque.", estilo: "dramática" },
                    { label: "D", text: "Sentir que a roupa endureceu sua imagem.", estilo: "romântica" },
                    { label: "E", text: "Sentir que a roupa não valoriza seu corpo.", estilo: "sensual (sexy)" },
                    { label: "F", text: "Achar que está comum demais", estilo: "criativa" },
                    { label: "G", text: "Sentir que está chamando atenção demais.", estilo: "básica" }
                ]
            },
            { numero: 10, texto: "Qual reação você mais gostaria de ouvir a respeito do seu look?", tipo: "text",
                opcoes: [
                    { label: "A", text: `“Você é sempre elegante e sofisticada!”`, estilo: "clássica" },
                    { label: "B", text: `“Você é sempre elegante e transmite força!”`, estilo: "tradicional" },
                    { label: "C", text: `“Uau, como você tem presença!”`, estilo: "dramática" },
                    { label: "D", text: `“Que fofa, você está muito linda!”`, estilo: "romântica" },
                    { label: "E", text: `“Que linda, você tem um magnetismo natural!”`, estilo: "sensual (sexy)" },
                    { label: "F", text: `“Você é a mais estilosa!”`, estilo: "criativa" },
                    { label: "G", text: `“Você é natural e chique de uma forma simples.”`, estilo: "básica" }
                ]
            },
            { numero: 11, texto: "Ao entrar em uma loja para olhar as novidades, você:", tipo: "text",
                opcoes: [
                    { label: "A", text: `Vai direto na sessão de peças clássicas e femininas.`, estilo: "clássica" },
                    { label: "B", text: `Vai direto na sessão de peças clássicas e cortes mais retos, sem "firula”.`, estilo: "tradicional" },
                    { label: "C", text: `Vai na sessão dos clássicos mas sempre olha as versões mais modernas deles.`, estilo: "dramática" },
                    { label: "D", text: `Vai na sessão de  peças com mais movimento e com ar delicado e feminino.`, estilo: "romântica" },
                    { label: "E", text: `Vai atrás de peças que tenham sensualidade, que são femininas de um jeito mais poderoso.`, estilo: "sensual (sexy)" },
                    { label: "F", text: `Vai direto na arara de tendências pra conhecer tudo que saiu de mais recente.`, estilo: "criativa" },
                    { label: "G", text: `Busca peças práticas, confortáveis e que deixam arrumada em precisar de fazer tanto esforço...`, estilo: "básica" }
                ]
            },
            { numero: 12, texto: "O que você prefere parecer:", tipo: "text",
                opcoes: [
                    { label: "A", text: "Polida e uma verdadeira dama", estilo: "clássica" },
                    { label: "B", text: "Reservada, racional e eficiente", estilo: "tradicional" },
                    { label: "C", text: "Interessante, contemporânea e poderosa", estilo: "dramática" },
                    { label: "D", text: "Feminina, familiar e cuidadosa", estilo: "romântica" },
                    { label: "E", text: "Feminina, poderosa e magnética", estilo: "sensual (sexy)" },
                    { label: "F", text: "Ousada, expansiva e divertida", estilo: "criativa" },
                    { label: "G", text: "Simples, natural e elegante sem nenhum excesso", estilo: "básica" }
                ]
            },
            { numero: 13, texto: "Se você fosse um sapato, você seria:", tipo: "text",
                opcoes: [
                    { label: "A", text: "Um scarpin de bico fino", estilo: "clássica" },
                    { label: "B", text: "Um mocassim", estilo: "tradicional" },
                    { label: "C", text: "Uma sandália impactante", estilo: "dramática" },
                    { label: "D", text: "Uma sapatilha", estilo: "romântica" },
                    { label: "E", text: "Uma sandália de salto agulha e apenas duas tiras", estilo: "sensual (sexy)" },
                    { label: "F", text: "Um sapato colorido e que ninguém tem", estilo: "criativa" },
                    { label: "G", text: "Uma rasteira fácil de calçar", estilo: "básica" }
                ]
            },
            { numero: 14, texto: "Qual das afirmações mais se aproxima de você?", tipo: "text",
                opcoes: [
                    { label: "A", text: "Gosto de roupas clássicas porque gosto de estar sempre bem vestida e refinada", estilo: "clássica" },
                    { label: "B", text: "Gosto de roupas clássicas porque gosto de estar bem vestida de forma prática", estilo: "tradicional" },
                    { label: "C", text: "Gosto de roupas clássicas mas mas também me interesso por elementos criativos e modernos", estilo: "dramática" },
                    { label: "D", text: "Gosto de roupas que tenham romantismo e feminilidade", estilo: "romântica" },
                    { label: "E", text: "Gosto de roupas que sejam sensuais mas que não sejam vulgares", estilo: "sensual (sexy)" },
                    { label: "F", text: "Gosto de roupas diferentes e criativas, amo experimentar um pouco de tudo", estilo: "criativa" },
                    { label: "G", text: "Gosto de roupas fáceis, simples e que eu não pareça muito montada", estilo: "básica" }
                ]
            },
            { numero: 15, texto: "Qual look tem mais a sua cara?", tipo: "image" },
            { numero: 16, texto: "Qual brinco de pérola que tem mais a sua cara?", tipo: "image" },
            { numero: 17, texto: "Qual vestido tem mais a sua cara?", tipo: "image" },
            { numero: 18, texto: "Qual camisa tem mais a sua cara?", tipo: "image" },
            { numero: 19, texto: "Qual calça tem mais a sua cara?", tipo: "image" },
            { numero: 20, texto: "Qual saia tem mais a sua cara?", tipo: "image" },
            { numero: 21, texto: "Com qual look você iria em um <strong>jantar romântico</strong> em um restaurante elegante:", tipo: "image" },
            { numero: 22, texto: "Para compor um look básico com <strong>jeans e camiseta</strong>, qual tênis você escolheria:", tipo: "image" },
            { numero: 23, texto: "Qual sandália tem mais a sua cara?", tipo: "image" },
            { numero: 24, texto: "Qual sapato tem mais a sua cara?", tipo: "image" },
            { numero: 25, texto: "Qual grupo de estampas você olha e <strong>imediatamente já gosta</strong> mais?", tipo: "image" },
            { numero: 26, texto: "Qual bolsa tem mais a sua cara?", tipo: "image" },
            { numero: 27, texto: "Qual óculos tem mais a sua cara?", tipo: "image" },
            { numero: 28, texto: "Qual look você usaria para um <strong>baile de gala</strong>?", tipo: "image" },
            { numero: 29, texto: "Todos estes looks tem a <strong>mesma base</strong>, mas os <strong>acessórios</strong> e a <strong>modelagem</strong> das roupas <strong>variam</strong>. Qual deles é mais a sua cara?", tipo: "image" },
            { numero: 30, texto: "Qual relógio é mais a sua cara?", tipo: "image" },
            { numero: 31, texto: "Se tivesse que usar esse <strong>vestido</strong>, como usaria?", tipo: "image" },
            { numero: 32, texto: "Se tivesse que usar essa <strong>calça de paetês prateados</strong>, como usaria?", tipo: "image" },
            { numero: 33, texto: "Se tivesse que usar essa <strong>mini saia de couro</strong>, como usaria?", tipo: "image" },
            { numero: 34, texto: "Se tivesse que usar essa <strong>camiseta básica branca</strong>, como usaria?", tipo: "image" },
            { numero: 35, texto: "Se tivesse que usar esta <strong>camisa</strong>, como usaria?", tipo: "image" }
        ];
        // Popula opções de imagem
        for (let i = 14; i < totalPerguntas; i++) 
            {
                const q = todasAsPerguntas[i];
            
                if (q.tipo === 'image') 
                  {
                    const [startImg, endImg] = imagemRanges[q.numero];
                    q.opcoes = [];
                    for (let imgNum = startImg, j = 0; imgNum <= endImg; imgNum++, j++) 
                        { 
                         if (todosOsEstilos[j]) 
                            { q.opcoes.push({ label: labelsOpcoes[j], image: `imagens/${imgNum}.png`, estilo: todosOsEstilos[j] });
                              todasAsPerguntas.forEach(q => {
                                if (q.tipo === 'text') {
                                    q.opcoes.forEach(o => {o.textExibicao = o.text.replace(/\s*\([^)]*\)\s*$/, '').trim();});
                                   }
                                });
                            }
                        }
                  }
            }
    }

    // Inicia o quiz assim que a página carrega 
    window.addEventListener('load', initQuiz);
    

    // fallback: garante que o clique em #btn-download-pdf funcione mesmo se a tela final for exibida sem passar por displayFinalResults()
    document.addEventListener('click', function (ev) {
    const btn = ev.target.closest && ev.target.closest('#btn-download-pdf');
    if (!btn) return;
    ev.preventDefault();
    // chama o handler existente se houver
    if (typeof handleDownload === 'function') {
        try { handleDownload(); } catch (e) { console.error('handleDownload erro (fallback):', e); }
        return;
    }
    // fallback direto caso handleDownload não exista por algum motivo
    (async () => {
        const finalEl = document.getElementById('final-resultado');
        if (!finalEl) { alert('Elemento final não encontrado'); return; }
        try {
        if (typeof generatePdfBlobFromElement === 'function') {
            const blob = await generatePdfBlobFromElement(finalEl);
            downloadPdfBlob(blob, `Resultado_ArmarioPerfeito_${new Date().toISOString().slice(0,10)}.pdf`);
        } else {
            createPrintViewAndPrint(finalEl);
        }
        } catch (err) {
        console.error('Fallback geração PDF erro:', err);
        try { createPrintViewAndPrint(finalEl); } catch(e){ alert('Falha ao gerar PDF. Veja console.'); }
        }
    })();
    });



    // Expondo funções globais para funcionar com type="module"
    window.nextIntroPage = nextIntroPage;
    window.prevIntroPage = prevIntroPage;
    window.startQuiz = startQuiz;
    window.proceedToNextStep = proceedToNextStep;
    window.avancarParaProximaPergunta = avancarParaProximaPergunta;
    window.handleAnswerSelection = handleAnswerSelection;
    window.renderQuestion = renderQuestion;
    window.voltarPergunta = voltarPergunta;

    // INSERIDO EM 05/08
    // Cabeçalho some ao rolar para baixo e volta ao rolar para cima
    let lastScrollY = window.pageYOffset;
    window.addEventListener('scroll', () => {
        const header = document.querySelector('.sticky-header');
        const currentScrollY = window.pageYOffset;

        if (currentScrollY > lastScrollY) {
            // rolando para baixo → esconde
            header.classList.add('hidden');
            } else {
                // rolando para cima → mostra
                header.classList.remove('hidden');
        }

        lastScrollY = currentScrollY;
    });


        /* ---------- NEW: send modal + client PDF generation + upload ---------- */

    const sendModalEl = document.getElementById('send-result-modal');
    const sendModal = sendModalEl ? new bootstrap.Modal(sendModalEl) : null;

    function openSendModalPrefill() {
    const nameInput = document.getElementById('sendName');
    const emailInput = document.getElementById('sendEmail');
    // preenche se já existir em sessionStorage
    if (sessionStorage.getItem('ap_name')) nameInput.value = sessionStorage.getItem('ap_name');
    if (sessionStorage.getItem('ap_email')) emailInput.value = sessionStorage.getItem('ap_email');
    sendModal.show();
    }


    // Aguarda a logo estar carregada (evita PDF sem a imagem)
    const waitForLogo = (timeout = 3000) => {
        const imgs = Array.from(document.querySelectorAll('img.logo-topo'));
        if (imgs.length === 0) return Promise.resolve();
        return Promise.all(imgs.map(img => {
            return new Promise(res => {
                if (img.complete) return res();
                img.addEventListener('load', () => res(), { once: true });
                img.addEventListener('error', () => res(), { once: true });
                // fallback timeout
                setTimeout(res, timeout);
            });
        }));
    };

    // Exemplo de uso: esperar antes de chamar a rotina de geração
    waitForLogo(3000).then(() => {
        // aqui chama a sua função original que gera o PDF, ex:
        generatePdfBlobFromElement(element);
        // ou html2pdf().from(element)...
        // mantenha sua chamada original aqui sem alteração.
    });

    // Gera PDF do container #final-resultado em blob usando html2pdf (robusto)
    async function generatePdfBlobFromElement(element) {
        if (!element) throw new Error('Elemento final-resultado não encontrado');

        // garante que a lib esteja carregada
        await ensureHtml2pdf();

        // opções html2pdf/html2canvas
        const opt = {
            margin:       [10, 8, 10, 8],
            filename:     `Resultado_ArmarioPerfeito.pdf`,
            image:        { type: 'jpeg', quality: 0.95 },
            html2canvas:  { 
                scale: 2, 
                useCORS: true, 
                logging: false,
                // onclone sanitiza o documento clonado antes do html2canvas tentar parsear CSS
                onclone: (clonedDoc) => {
                    try {
                        // proteção: garante que o elemento original existe
                        if (typeof element === 'undefined' || !element) {
                            console.warn('onclone: elemento original (element) não encontrado — abortando sanitização do clone.');
                            return;
                        }
                        // pega lista de elementos do original e do clone na mesma ordem
                        const originals = element.querySelectorAll('*');
                        const clones = clonedDoc.querySelectorAll('*');

                        const len = Math.min(originals.length, clones.length);
                        for (let i = 0; i < len; i++) {
                            const o = originals[i];
                            const c = clones[i];
                            if (!o || !c) continue;

                            const cs = window.getComputedStyle(o);

                            // força valores seguros (resolvidos pelo navegador)
                            if (cs.color) c.style.color = cs.color;
                            if (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                                c.style.backgroundColor = cs.backgroundColor;
                            } else {
                                c.style.backgroundColor = '#ffffff';
                            }

                            // desativa imagens/gradientes problemáticos no clone e aplica fallback
                            c.style.backgroundImage = 'none';
                            c.style.boxShadow = 'none';

                            // bordas e sombras
                            if (cs.borderColor) c.style.borderColor = cs.borderColor;

                            // remove filtros e propriedades que costumam quebrar o parser
                            c.style.filter = 'none';
                            c.style.backdropFilter = 'none';

                            // --- sanitize inline style text that can contain modern color functions ---
                            const inline = c.getAttribute && c.getAttribute('style');
                            if (inline && /(?:color-mix|color\(|lab\(|lch\()/i.test(inline)) {
                                try {
                                    c.setAttribute('style', inline.replace(/(?:color-mix\([^\)]*\)|color\([^\)]*\)|lab\([^\)]*\)|lch\([^\)]*\))/gi, ''));
                                } catch (e) { /* ignore per-element sanitize failures */ }
                            }
                        }

                        // --- sanitize <style> tags inside the cloned document (remove unsupported functions and page-breaks) ---
                        const styleTags = clonedDoc.querySelectorAll('style');
                        styleTags.forEach(st => {
                            try {
                                // remove modern color functions and any page-break rules that can create blank pages
                            st.textContent = st.textContent
                                .replace(/(?:color-mix\([^\)]*\)|color\([^\)]*\)|lab\([^\)]*\)|lch\([^\)]*\))/gi, '')
                                .replace(/page-break-(after|before):\s*always;?/gi, '')
                                .replace(/break-(after|before):\s*page;?/gi, '')
                                .replace(/@page[^{]*\{[^}]*\}/gi, '')              // remove regras @page
                                .replace(/break-inside:\s*avoid;?/gi, '')         // remove avoid breaks
                                .replace(/orphans:\s*\d+;?/gi, '')                // remove orphans
                                .replace(/widows:\s*\d+;?/gi, '');                // remove widows
                            } catch (e) { /* ignore */ }
                        });

                        // Remove external stylesheets from the clone head (to avoid complex rules)
                        const head = clonedDoc.querySelector('head');
                        if (head) {
                            head.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
                                try {
                                    const href = link.getAttribute('href') || '';
                                    // preserve arquivos de fontes/external font providers (ex: googleapis, gstatic, woff, woff2, ttf)
                                    if (/fonts\.googleapis|fonts\.gstatic|\.woff2?|\.ttf|\.otf/i.test(href)) {
                                        // mantém link para carregar fontes (essencial para medidas corretas)
                                        return;
                                    }
                                    // para outros estilos: em vez de remover, reduz seu impacto definindo media=print
                                    // isso tende a manter fontes carregadas, mas reduz re-parsing de regras que podem quebrar html2canvas
                                    try {
                                        link.media = 'print';
                                    } catch (e) {
                                        // fallback: se não conseguimos ajustar media, removemos
                                        link.remove();
                                    }
                                } catch (e) {
                                    // se algo falhar aqui, não interrompe o processo
                                    try { link.remove(); } catch (err) {}
                                }
                            });
                        }
                        // Remove the on-screen export controls (button) from the CLONE so they don't appear in the PDF
                        const hideSelectors = ['#btn-download-pdf', '#download-pdf', '.result-export-controls', '#btnGenerateAndSend'];
                        hideSelectors.forEach(sel => {
                            try {
                                clonedDoc.querySelectorAll(sel).forEach(n => n.remove());
                            } catch (e) { /* ignore */ }
                        });

                        // Inject a small safety style into the clone to avoid forced page-breaks or extra margins
                        try {
                            const safetyStyle = clonedDoc.createElement('style');
                            safetyStyle.textContent = `
                                /* Small adjustments only for the CLONE used to render PDF */
                                html, body { height: auto !important; overflow: visible !important; margin: 0; padding: 8px; }
                                body { font-size: 13px !important; line-height: 1.2 !important; color: #000 !important; }
                                /* Title styling fallback — se for h1/h2/p com esse texto, será maior via JS abaixo */
                                h1, h2, .final-title, .diagnostico-title { text-align: center !important; font-size: 20px !important; font-weight: 700 !important; margin-bottom: 12px !important; }
                                h1,h2,h3,h4 { page-break-after: avoid !important; break-after: avoid !important; }
                                p, ul, ol { page-break-inside: avoid !important; break-inside: avoid !important; }
                                img, img.logo, img.logo-topo, .logo { max-width: 160px !important; height: auto !important; display: block !important; }                                
                                .logo-topo { margin: 0 0 12px 0 !important; }
                                .result-export-controls, #btn-download-pdf, #download-pdf { display: none !important; }
                                * { box-sizing: border-box !important; -webkit-font-smoothing: antialiased !important; -moz-osx-font-smoothing: grayscale !important; }
                            `;
                            if (head) head.appendChild(safetyStyle);
                            // --- Ajustes finais no clone: centralizar título detectando o texto e destacar rótulos ---
                            try {
                                // centraliza e aumenta o título que contém "Diagnóstico de estilo finalizado"
                                const possibleTitle = Array.from(clonedDoc.querySelectorAll('h1,h2,h3,p,div')).find(n => /Diagn[áa]stico de estilo finalizado/i.test(n.textContent));
                                if (possibleTitle) {
                                    possibleTitle.style.textAlign = 'center';
                                    possibleTitle.style.fontSize = '20px';
                                    possibleTitle.style.fontWeight = '700';
                                    possibleTitle.style.marginBottom = '12px';
                                }

                                // realçar rótulos "Estilo Primário", "Estilo Secundário", "Estilo Terciário"
                                ['Estilo Primário','Estilo Secundário','Estilo Terciário'].forEach(lbl => {
                                    const node = Array.from(clonedDoc.querySelectorAll('*')).find(n => new RegExp('\\b' + lbl.replace(/ /g,'\\s+') + '\\b','i').test(n.textContent || ''));
                                    if (node) {
                                        node.style.fontSize = '16px';
                                        node.style.fontWeight = '700';
                                        node.style.marginTop = '10px';
                                        node.style.marginBottom = '6px';
                                    }
                                });
                            } catch (e) { /* não quebra se falhar */ }
                        } catch (e) { /* ignore */ }

                        // Ensure cloned html/body have no background gradients or large paddings that push an extra page
                        const clonedHtml = clonedDoc.querySelector('html');
                        const clonedBody = clonedDoc.querySelector('body');
                        if (clonedHtml) {
                            clonedHtml.style.backgroundImage = 'none';
                            clonedHtml.style.backgroundColor = '#ffffff';
                            clonedHtml.style.height = 'auto';
                        }
                        if (clonedBody) {
                            clonedBody.style.backgroundImage = 'none';
                            clonedBody.style.backgroundColor = '#ffffff';
                            clonedBody.style.height = 'auto';
                            clonedBody.style.paddingBottom = '0px';
                            clonedBody.style.overflow = 'visible';
                        }

                        // --- Forçar escala para caber em 1 página (apenas no CLONE) ---
                        // substituição segura: aguarda fonts, usa zoom (mais compatível com html2canvas) e retries
                        try {
                            if (clonedBody) {
                                // altura de página alvo em pixels (A4 portrait ~1122px @96dpi). Ajuste se necessário.
                                let pagePx = 1122;
                                // em mobile pode ser útil um valor um pouco menor:
                                if (window && window.innerWidth && window.innerWidth < 500) pagePx = 1000;
                                const marginPx = 40; // margens top+bottom reservadas
                                const targetHeight = pagePx - marginPx;

                                // função que mede e aplica zoom (usa clonedDoc.documentElement para leituras corretas)
                                const measureAndZoom = () => {
                                    try {
                                        // limpa qualquer transform anterior que possa atrapalhar a medição
                                        clonedBody.style.transform = '';
                                        clonedBody.style.transformOrigin = '';
                                        // mede altura do clone
                                        const bodyH = clonedBody.scrollHeight || clonedBody.offsetHeight || clonedDoc.documentElement.scrollHeight || 0;
                                        if (bodyH > 0 && bodyH > targetHeight) {
                                            const scale = targetHeight / bodyH;
                                            // aplica zoom (mais estável que transform para html2canvas)
                                        // tenta aplicar zoom; se não suportado, aplica transform de forma controlada
                                        if ('zoom' in clonedBody.style) {
                                            // aplica zoom e garante que qualquer transform anterior seja removido
                                            clonedBody.style.zoom = scale;
                                            clonedBody.style.transform = '';
                                            clonedBody.style.transformOrigin = '';
                                        } else {
                                            // fallback: transform — aplicamos apenas se zoom não existe
                                            clonedBody.style.transformOrigin = 'top left';
                                            clonedBody.style.transform = `scale(${scale})`;
                                            // garante que zoom não permaneça (segurança)
                                            clonedBody.style.zoom = '';
                                        }
                                        // remove espaçamentos que empurram nova página
                                        clonedBody.style.padding = '0';
                                        clonedBody.style.margin = '0';
                                        // garante largura compatível
                                        clonedBody.style.width = `${100 / (scale || 1)}%`;
                                        } else {
                                            // restaura estado normal (limpa zoom/transform/padding/margin/width)
                                            clonedBody.style.zoom = '';
                                            clonedBody.style.transform = '';
                                            clonedBody.style.transformOrigin = '';
                                            clonedBody.style.width = '';
                                            clonedBody.style.padding = '';
                                            clonedBody.style.margin = '';
                                        }
                                    } catch (e) {
                                        console.warn('measureAndZoom error', e);
                                    }
                                };

                                // se o navegador suporta Font Loading API, aguarda fonts (melhora medidas em webfonts)
                                const waitFonts = (timeout = 1200) => {
                                    if (document && document.fonts && typeof document.fonts.ready !== 'undefined') {
                                        return Promise.race([
                                            document.fonts.ready,
                                            new Promise(resolve => setTimeout(resolve, timeout))
                                        ]);
                                    }
                                    return new Promise(resolve => setTimeout(resolve, timeout));
                                };

                                // roda medida/zoom após aguardar fonts e com múltiplos retries (mobile stability)
                                waitFonts().then(() => {
                                    measureAndZoom();
                                    setTimeout(measureAndZoom, 50);
                                    setTimeout(measureAndZoom, 300);
                                    setTimeout(measureAndZoom, 700);
                                }).catch(() => {
                                    // se algo falhar, ainda tentamos medir algumas vezes
                                    measureAndZoom();
                                    setTimeout(measureAndZoom, 50);
                                    setTimeout(measureAndZoom, 300);
                                });
                            }
                        } catch (e) {
                            console.warn('scale-for-one-page failed', e);
                        }
                        try {
                            const last = clonedBody && clonedBody.lastElementChild;
                            if (last && last.tagName === 'DIV' && last.textContent.trim().length === 0 && last.querySelectorAll('img').length === 0) {
                                last.remove();
                            }
                        } catch (e) { /* ignore */ }

                    } catch (e) {
                        // não falha o processo se algo inesperado acontecer aqui
                        console.warn('onclone sanitization error', e);
                    }
                }
            },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // tenta o método moderno outputPdf('blob')
        try {
            if (window.html2pdf && typeof window.html2pdf === 'function' && typeof window.html2pdf().set === 'function' && typeof window.html2pdf().from === 'function') {
            const blob = await window.html2pdf().set(opt).from(element).outputPdf('blob');
            return blob;
            }
        } catch (err) {
            console.warn('outputPdf falhou, tentando fallback...', err);
        }

        // fallback para versões antigas (0.9.x): gera e pega blob via Promise
        return await new Promise((resolve, reject) => {
            try {
            window.html2pdf().set(opt).from(element).toPdf().output('blob', (blob) => {
                if (blob) resolve(blob);
                else reject(new Error('Falha ao obter blob (fallback).'));
            });
            } catch (e) {
            reject(new Error('Erro ao gerar PDF (fallback): ' + e.message));
            }
        });
    }

    function downloadPdfBlob(pdfBlob, filename = 'resultado-armario-perfeito.pdf') {
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    }
