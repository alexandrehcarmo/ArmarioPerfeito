    // --- VARIÁVEIS GLOBAIS E DE LÓGICA ---
    let pontuacaoEstilos = {};
    let respostasPorPergunta = {};
    let estilosPrimarioSecundario = { primary: null, secondary: null, tertiary: null };
    let perguntaAtualIndice = -1;
    let faseAtual = 1;

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
        document.getElementById('modal-continue-btn').addEventListener('click', continueToNextPhase); // Correção: proceedToNextStep() é chamado por continueToNextPhase()
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
                <h1 class="display-4 fw-bold mb-3">Descubra seu estilo!</h1>
                
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
            // Re-habilita "Próxima" se já tiver resposta nesta pergunta
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

        const estiloVencedor = getEstiloVencedor(pontuacaoEstilos, estilosExcluidos);

        // 3) Armazena o resultado da fase
        if (faseAtual === 1) {
            estilosPrimarioSecundario.primary = estiloVencedor;
        } else if (faseAtual === 2) {
            estilosPrimarioSecundario.secondary = estiloVencedor;
        } else if (faseAtual === 3) {
            estilosPrimarioSecundario.tertiary = estiloVencedor;
        }

        // 4) Exibe o modal de resultado da fase
        showPhaseResultModal(estiloVencedor);
    }

    function showPhaseResultModal(estiloVencedor) {
        const modalTitle = document.getElementById('phase-result-modal-title');
        const modalBody = document.getElementById('phase-result-modal-body');

        modalTitle.textContent = `Resultado da Fase ${faseAtual}`;
        modalBody.innerHTML = `
            <div class="text-center">
                <h4>Seu estilo ${faseAtual === 1 ? 'primário' : faseAtual === 2 ? 'secundário' : 'terciário'} é:</h4>
                <h2 class="text-primary">${estiloVencedor.toUpperCase()}</h2>
                <p class="mt-3">${detalhesEstiloMapCompleto[estiloVencedor]}</p>
            </div>
        `;

        phaseResultModal.show();
    }

    function continueToNextPhase() {
        phaseResultModal.hide();
        
        if (faseAtual < 3) {
            faseAtual++;
            resetPontuacao();
            perguntaAtualIndice = 0;
            renderQuestion();
        } else {
            showFinalResults();
        }
    }

    function showFinalResults() {
        document.getElementById('quiz-section').style.display = 'none';
        
        const { primary, secondary, tertiary } = estilosPrimarioSecundario;
        
        const html = `
            <div class="final-result-header text-center mb-4">
                <h1 class="display-4 fw-bold text-primary">Seus Estilos Descobertos!</h1>
                <p class="lead">Parabéns! Você completou o teste de estilos. Aqui estão seus resultados:</p>
            </div>

            <div class="row mb-4">
                <div class="col-md-4 mb-3">
                    <div class="card h-100 border-primary">
                        <div class="card-header bg-primary text-white text-center">
                            <h5 class="mb-0">Estilo Primário</h5>
                        </div>
                        <div class="card-body text-center">
                            <h3 class="text-primary">${primary.toUpperCase()}</h3>
                            <p class="small">${detalhesEstiloMapCompleto[primary]}</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="card h-100 border-secondary">
                        <div class="card-header bg-secondary text-white text-center">
                            <h5 class="mb-0">Estilo Secundário</h5>
                        </div>
                        <div class="card-body text-center">
                            <h3 class="text-secondary">${secondary.toUpperCase()}</h3>
                            <p class="small">${detalhesEstiloMapCompleto[secondary]}</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="card h-100 border-info">
                        <div class="card-header bg-info text-white text-center">
                            <h5 class="mb-0">Estilo Terciário</h5>
                        </div>
                        <div class="card-body text-center">
                            <h3 class="text-info">${tertiary.toUpperCase()}</h3>
                            <p class="small">${detalhesEstiloMapCompleto[tertiary]}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="final-summary card p-4 mb-4">
                <h4 class="text-center mb-3">Resumo dos Seus Estilos</h4>
                <p class="text-center">
                    Seu estilo principal é <strong>${primary}</strong>, complementado pelo estilo <strong>${secondary}</strong> 
                    e com toques de <strong>${tertiary}</strong>. Esta combinação única define sua personalidade de moda 
                    e pode ser usada para criar looks autênticos e harmoniosos.
                </p>
            </div>

            <p class="final-call-to-action">
                Para entender todos os detalhes sobre eles e saber como aplicá-los
                no seu armário e na sua rotina, basta acessar os materiais
                de cada um deles que se encontram dentro da sessão inicial do nosso aplicativo!
            </p>
        `;

        // Limpa e exibe o resultado final
        finalDiv.innerHTML = html;
        
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
                    { label: "C", text: `Gosto de sentir que estou sempre bem vestida mas não gosto de me sentir "clássica demais".`, estilo: "dramática" },
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
                    { label: "A", text: `"É possível ser feminina e formal ao mesmo tempo."`, estilo: "clássica" },
                    { label: "B", text: `"Discrição é o último grau de sofisticação."`, estilo: "tradicional" },
                    { label: "C", text: `"Amo causar impacto sem dizer uma palavra."`, estilo: "dramática" },
                    { label: "D", text: `"Me visto para expressar minha feminilidade."`, estilo: "romântica" },
                    { label: "E", text: `"Quero me sentir poderosa e desejada."`, estilo: "sensual (sexy)" },
                    { label: "F", text: `"Amo brincar com combinações inusitadas."`, estilo: "criativa" },
                    { label: "G", text: `"Me visto com praticidade e zero frescura."`, estilo: "básica" }
                ]
            },
            { numero: 6, texto: "Qual é o melhor elogio sobre o seu look?", tipo: "text",
                opcoes: [
                    { label: "A", text: `"Você está chiquíssima."`, estilo: "clássica" },
                    { label: "B", text: `"Você está simples e elegante."`, estilo: "tradicional" },
                    { label: "C", text: `"Você está moderna e impactante."`, estilo: "dramática" },
                    { label: "D", text: `"Você está tão delicada e feminina!"`, estilo: "romântica" },
                    { label: "E", text: `"Você está incrível e irresistível."`, estilo: "sensual (sexy)" },
                    { label: "F", text: `"Você está diferente de todos e criativa!"`, estilo: "criativa" },
                    { label: "G", text: `"Você parece tão confortável e natural!"`, estilo: "básica" }
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
                    { label: "A", text: `"Você é sempre elegante e sofisticada!"`, estilo: "clássica" },
                    { label: "B", text: `"Você é sempre elegante e transmite força!"`, estilo: "tradicional" },
                    { label: "C", text: `"Uau, como você tem presença!"`, estilo: "dramática" },
                    { label: "D", text: `"Que fofa, você está muito linda!"`, estilo: "romântica" },
                    { label: "E", text: `"Que linda, você tem um magnetismo natural!"`, estilo: "sensual (sexy)" },
                    { label: "F", text: `"Você é a mais estilosa!"`, estilo: "criativa" },
                    { label: "G", text: `"Você é natural e chique de uma forma simples."`, estilo: "básica" }
                ]
            },
            { numero: 11, texto: "Ao entrar em uma loja para olhar as novidades, você:", tipo: "text",
                opcoes: [
                    { label: "A", text: `Vai direto na sessão de peças clássicas e femininas.`, estilo: "clássica" },
                    { label: "B", text: `Vai direto na sessão de peças clássicas e cortes mais retos, sem "firula".`, estilo: "tradicional" },
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
            { numero: 14, texto: "Qual dessas situações mais combina com você?", tipo: "text",
                opcoes: [
                    { label: "A", text: "Gosto de me arrumar e me enfeitar, encontro prazer nisso.", estilo: "clássica" },
                    { label: "B", text: "Gosto de estar sempre bem vestida, mas sem dedicar muito tempo a isso.", estilo: "tradicional" },
                    { label: "C", text: "Gosto de estar sempre bem vestida e de criar contrapontos interessantes.", estilo: "dramática" },
                    { label: "D", text: "Gosto de me vestir para realçar minha feminilidade de forma fofa.", estilo: "romântica" },
                    { label: "E", text: "Gosto de me vestir para realçar minha feminilidade de forma poderosa.", estilo: "sensual (sexy)" },
                    { label: "F", text: "Gosto de me vestir para expressar minha criatividade e personalidade.", estilo: "criativa" },
                    { label: "G", text: "Gosto de me vestir de forma simples, chique e sem frescura.", estilo: "básica" }
                ]
            },
            // Perguntas de imagem (15-35)
            { numero: 15, tipo: "image", texto: "Qual dessas imagens mais combina com você?",
                opcoes: [
                    { label: "A", image: "https://i.imgur.com/3.jpg", estilo: "clássica" },
                    { label: "B", image: "https://i.imgur.com/4.jpg", estilo: "tradicional" },
                    { label: "C", image: "https://i.imgur.com/5.jpg", estilo: "dramática" },
                    { label: "D", image: "https://i.imgur.com/6.jpg", estilo: "romântica" },
                    { label: "E", image: "https://i.imgur.com/7.jpg", estilo: "sensual (sexy)" },
                    { label: "F", image: "https://i.imgur.com/8.jpg", estilo: "criativa" },
                    { label: "G", image: "https://i.imgur.com/9.jpg", estilo: "básica" }
                ]
            },
            { numero: 16, tipo: "image", texto: "Qual dessas imagens mais combina com você?",
                opcoes: [
                    { label: "A", image: "https://i.imgur.com/11.jpg", estilo: "clássica" },
                    { label: "B", image: "https://i.imgur.com/12.jpg", estilo: "tradicional" },
                    { label: "C", image: "https://i.imgur.com/13.jpg", estilo: "dramática" },
                    { label: "D", image: "https://i.imgur.com/14.jpg", estilo: "romântica" },
                    { label: "E", image: "https://i.imgur.com/15.jpg", estilo: "sensual (sexy)" },
                    { label: "F", image: "https://i.imgur.com/16.jpg", estilo: "criativa" },
                    { label: "G", image: "https://i.imgur.com/17.jpg", estilo: "básica" }
                ]
            },
            { numero: 17, tipo: "image", texto: "Qual dessas imagens mais combina com você?",
                opcoes: [
                    { label: "A", image: "https://i.imgur.com/19.jpg", estilo: "clássica" },
                    { label: "B", image: "https://i.imgur.com/20.jpg", estilo: "tradicional" },
                    { label: "C", image: "https://i.imgur.com/21.jpg", estilo: "dramática" },
                    { label: "D", image: "https://i.imgur.com/22.jpg", estilo: "romântica" },
                    { label: "E", image: "https://i.imgur.com/23.jpg", estilo: "sensual (sexy)" },
                    { label: "F", image: "https://i.imgur.com/24.jpg", estilo: "criativa" },
                    { label: "G", image: "https://i.imgur.com/25.jpg", estilo: "básica" }
                ]
            },
            { numero: 18, tipo: "image", texto: "Qual dessas imagens mais combina com você?",
                opcoes: [
                    { label: "A", image: "https://i.imgur.com/27.jpg", estilo: "clássica" },
                    { label: "B", image: "https://i.imgur.com/28.jpg", estilo: "tradicional" },
                    { label: "C", image: "https://i.imgur.com/29.jpg", estilo: "dramática" },
                    { label: "D", image: "https://i.imgur.com/30.jpg", estilo: "romântica" },
                    { label: "E", image: "https://i.imgur.com/31.jpg", estilo: "sensual (sexy)" },
                    { label: "F", image: "https://i.imgur.com/32.jpg", estilo: "criativa" },
                    { label: "G", image: "https://i.imgur.com/33.jpg", estilo: "básica" }
                ]
            },
            { numero: 19, tipo: "image", texto: "Qual dessas imagens mais combina com você?",
                opcoes: [
                    { label: "A", image: "https://i.imgur.com/35.jpg", estilo: "clássica" },
                    { label: "B", image: "https://i.imgur.com/36.jpg", estilo: "tradicional" },
                    { label: "C", image: "https://i.imgur.com/37.jpg", estilo: "dramática" },
                    { label: "D", image: "https://i.imgur.com/38.jpg", estilo: "romântica" },
                    { label: "E", image: "https://i.imgur.com/39.jpg", estilo: "sensual (sexy)" },
                    { label: "F", image: "https://i.imgur.com/40.jpg", estilo: "criativa" },
                    { label: "G", image: "https://i.imgur.com/41.jpg", estilo: "básica" }
                ]
            },
            { numero: 20, tipo: "image", texto: "Qual dessas imagens mais combina com você?",
                opcoes: [
                    { label: "A", image: "https://i.imgur.com/43.jpg", estilo: "clássica" },
                    { label: "B", image: "https://i.imgur.com/44.jpg", estilo: "tradicional" },
                    { label: "C", image: "https://i.imgur.com/45.jpg", estilo: "dramática" },
                    { label: "D", image: "https://i.imgur.com/46.jpg", estilo: "romântica" },
                    { label: "E", image: "https://i.imgur.com/47.jpg", estilo: "sensual (sexy)" },
                    { label: "F", image: "https://i.imgur.com/48.jpg", estilo: "criativa" },
                    { label: "G", image: "https://i.imgur.com/49.jpg", estilo: "básica" }
                ]
            },
            { numero: 21, tipo: "image", texto: "Qual dessas imagens mais combina com você?",
                opcoes: [
                    { label: "A", image: "https://i.imgur.com/51.jpg", estilo: "clássica" },
                    { label: "B", image: "https://i.imgur.com/52.jpg", estilo: "tradicional" },
                    { label: "C", image: "https://i.imgur.com/53.jpg", estilo: "dramática" },
                    { label: "D", image: "https://i.imgur.com/54.jpg", estilo: "romântica" },
                    { label: "E", image: "https://i.imgur.com/55.jpg", estilo: "sensual (sexy)" },
                    { label: "F", image: "https://i.imgur.com/56.jpg", estilo: "criativa" },
                    { label: "G", image: "https://i.imgur.com/57.jpg", estilo: "básica" }
                ]
            },
            { numero: 22, tipo: "image", texto: "Qual dessas imagens mais combina com você?",
                opcoes: [
                    { label: "A", image: "https://i.imgur.com/59.jpg", estilo: "clássica" },
                    { label: "B", image: "https://i.imgur.com/60.jpg", estilo: "tradicional" },
                    { label: "C", image: "https://i.imgur.com/61.jpg", estilo: "dramática" },
                    { label: "D", image: "https://i.imgur.com/62.jpg", estilo: "romântica" },
                    { label: "E", image: "https://i.imgur.com/63.jpg", estilo: "sensual (sexy)" },
                    { label: "F", image: "https://i.imgur.com/64.jpg", estilo: "criativa" },
                    { label: "G", image: "https://i.imgur.com/65.jpg", estilo: "básica" }
                ]
            },
            { numero: 23, tipo: "image", texto: "Qual dessas imagens mais combina com você?",
                opcoes: [
                    { label: "A", image: "https://i.imgur.com/67.jpg", estilo: "clássica" },
                    { label: "B", image: "https://i.imgur.com/68.jpg", estilo: "tradicional" },
                    { label: "C", image: "https://i.imgur.com/69.jpg", estilo: "dramática" },
                    { label: "D", image: "https://i.imgur.com/70.jpg", estilo: "romântica" },
                    { label: "E", image: "https://i.imgur.com/71.jpg", estilo: "sensual (sexy)" },
                    { label: "F", image: "https://i.imgur.com/72.jpg", estilo: "criativa" },
                    { label: "G", image: "https://i.imgur.com/73.jpg", estilo: "básica" }
                ]
            },
            { numero: 24, tipo: "image", texto: "Qual dessas imagens mais combina com você?",
                opcoes: [
                    { label: "A", image: "https://i.imgur.com/75.jpg", estilo: "clássica" },
                    { label: "B", image: "https://i.imgur.com/76.jpg", estilo: "tradicional" },
                    { label: "C", image: "https://i.imgur.com/77.jpg", estilo: "dramática" },
                    { label: "D", image: "https://i.imgur.com/78.jpg", estilo: "romântica" },
                    { label: "E", image: "https://i.imgur.com/79.jpg", estilo: "sensual (sexy)" },
                    { label: "F", image: "https://i.imgur.com/80.jpg", estilo: "criativa" },
                    { label: "G", image: "https://i.imgur.com/81.jpg", estilo: "básica" }
                ]
            },
            { numero: 25, tipo: "image", texto: "Qual dessas imagens mais combina com você?",
                opcoes: [
                    { label: "A", image: "https://i.imgur.com/83.jpg", estilo: "clássica" },
                    { label: "B", image: "https://i.imgur.com/84.jpg", estilo: "tradicional" },
                    { label: "C", image: "https://i.imgur.com/85.jpg", estilo: "dramática" },
                    { label: "D", image: "https://i.imgur.com/86.jpg", estilo: "romântica" },
                    { label: "E", image: "https://i.imgur.com/87.jpg", estilo: "sensual (sexy)" },
                    { label: "F", image: "https://i.imgur.com/88.jpg", estilo: "criativa" },
                    { label: "G", image: "https://i.imgur.com/89.jpg", estilo: "básica" }
                ]
            },
            { numero: 26, tipo: "image", texto: "Qual dessas imagens mais combina com você?",
                opcoes: [
                    { label: "A", image: "https://i.imgur.com/91.jpg", estilo: "clássica" },
                    { label: "B", image: "https://i.imgur.com/92.jpg", estilo: "tradicional" },
                    { label: "C", image: "https://i.imgur.com/93.jpg", estilo: "dramática" },
                    { label: "D", image: "https://i.imgur.com/94.jpg", estilo: "romântica" },
                    { label: "E", image: "https://i.imgur.com/95.jpg", estilo: "sensual (sexy)" },
                    { label: "F", image: "https://i.imgur.com/96.jpg", estilo: "criativa" },
                    { label: "G", image: "https://i.imgur.com/97.jpg", estilo: "básica" }
                ]
            },
            { numero: 27, tipo: "image", texto: "Qual dessas imagens mais combina com você?",
                opcoes: [
                    { label: "A", image: "https://i.imgur.com/99.jpg", estilo: "clássica" },
                    { label: "B", image: "https://i.imgur.com/100.jpg", estilo: "tradicional" },
                    { label: "C", image: "https://i.imgur.com/101.jpg", estilo: "dramática" },
                    { label: "D", image: "https://i.imgur.com/102.jpg", estilo: "romântica" },
                    { label: "E", image: "https://i.imgur.com/103.jpg", estilo: "sensual (sexy)" },
                    { label: "F", image: "https://i.imgur.com/104.jpg", estilo: "criativa" },
                    { label: "G", image: "https://i.imgur.com/105.jpg", estilo: "básica" }
                ]
            },
            { numero: 28, tipo: "image", texto: "Qual dessas imagens mais combina com você?",
                opcoes: [
                    { label: "A", image: "https://i.imgur.com/107.jpg", estilo: "clássica" },
                    { label: "B", image: "https://i.imgur.com/108.jpg", estilo: "tradicional" },
                    { label: "C", image: "https://i.imgur.com/109.jpg", estilo: "dramática" },
                    { label: "D", image: "https://i.imgur.com/110.jpg", estilo: "romântica" },
                    { label: "E", image: "https://i.imgur.com/111.jpg", estilo: "sensual (sexy)" },
                    { label: "F", image: "https://i.imgur.com/112.jpg", estilo: "criativa" },
                    { label: "G", image: "https://i.imgur.com/113.jpg", estilo: "básica" }
                ]
            },
            { numero: 29, tipo: "image", texto: "Qual dessas imagens mais combina com você?",
                opcoes: [
                    { label: "A", image: "https://i.imgur.com/115.jpg", estilo: "clássica" },
                    { label: "B", image: "https://i.imgur.com/116.jpg", estilo: "tradicional" },
                    { label: "C", image: "https://i.imgur.com/117.jpg", estilo: "dramática" },
                    { label: "D", image: "https://i.imgur.com/118.jpg", estilo: "romântica" },
                    { label: "E", image: "https://i.imgur.com/119.jpg", estilo: "sensual (sexy)" },
                    { label: "F", image: "https://i.imgur.com/120.jpg", estilo: "criativa" },
                    { label: "G", image: "https://i.imgur.com/121.jpg", estilo: "básica" }
                ]
            },
            { numero: 30, tipo: "image", texto: "Qual dessas imagens mais combina com você?",
                opcoes: [
                    { label: "A", image: "https://i.imgur.com/123.jpg", estilo: "clássica" },
                    { label: "B", image: "https://i.imgur.com/124.jpg", estilo: "tradicional" },
                    { label: "C", image: "https://i.imgur.com/125.jpg", estilo: "dramática" },
                    { label: "D", image: "https://i.imgur.com/126.jpg", estilo: "romântica" },
                    { label: "E", image: "https://i.imgur.com/127.jpg", estilo: "sensual (sexy)" },
                    { label: "F", image: "https://i.imgur.com/128.jpg", estilo: "criativa" },
                    { label: "G", image: "https://i.imgur.com/129.jpg", estilo: "básica" }
                ]
            },
            { numero: 31, tipo: "image", texto: "Qual dessas imagens mais combina com você?",
                opcoes: [
                    { label: "A", image: "https://i.imgur.com/131.jpg", estilo: "clássica" },
                    { label: "B", image: "https://i.imgur.com/132.jpg", estilo: "tradicional" },
                    { label: "C", image: "https://i.imgur.com/133.jpg", estilo: "dramática" },
                    { label: "D", image: "https://i.imgur.com/134.jpg", estilo: "romântica" },
                    { label: "E", image: "https://i.imgur.com/135.jpg", estilo: "sensual (sexy)" },
                    { label: "F", image: "https://i.imgur.com/136.jpg", estilo: "criativa" },
                    { label: "G", image: "https://i.imgur.com/137.jpg", estilo: "básica" }
                ]
            },
            { numero: 32, tipo: "image", texto: "Qual dessas imagens mais combina com você?",
                opcoes: [
                    { label: "A", image: "https://i.imgur.com/139.jpg", estilo: "clássica" },
                    { label: "B", image: "https://i.imgur.com/140.jpg", estilo: "tradicional" },
                    { label: "C", image: "https://i.imgur.com/141.jpg", estilo: "dramática" },
                    { label: "D", image: "https://i.imgur.com/142.jpg", estilo: "romântica" },
                    { label: "E", image: "https://i.imgur.com/143.jpg", estilo: "sensual (sexy)" },
                    { label: "F", image: "https://i.imgur.com/144.jpg", estilo: "criativa" },
                    { label: "G", image: "https://i.imgur.com/145.jpg", estilo: "básica" }
                ]
            },
            { numero: 33, tipo: "image", texto: "Qual dessas imagens mais combina com você?",
                opcoes: [
                    { label: "A", image: "https://i.imgur.com/147.jpg", estilo: "clássica" },
                    { label: "B", image: "https://i.imgur.com/148.jpg", estilo: "tradicional" },
                    { label: "C", image: "https://i.imgur.com/149.jpg", estilo: "dramática" },
                    { label: "D", image: "https://i.imgur.com/150.jpg", estilo: "romântica" },
                    { label: "E", image: "https://i.imgur.com/151.jpg", estilo: "sensual (sexy)" },
                    { label: "F", image: "https://i.imgur.com/152.jpg", estilo: "criativa" },
                    { label: "G", image: "https://i.imgur.com/153.jpg", estilo: "básica" }
                ]
            },
            { numero: 34, tipo: "image", texto: "Qual dessas imagens mais combina com você?",
                opcoes: [
                    { label: "A", image: "https://i.imgur.com/155.jpg", estilo: "clássica" },
                    { label: "B", image: "https://i.imgur.com/156.jpg", estilo: "tradicional" },
                    { label: "C", image: "https://i.imgur.com/157.jpg", estilo: "dramática" },
                    { label: "D", image: "https://i.imgur.com/158.jpg", estilo: "romântica" },
                    { label: "E", image: "https://i.imgur.com/159.jpg", estilo: "sensual (sexy)" },
                    { label: "F", image: "https://i.imgur.com/160.jpg", estilo: "criativa" },
                    { label: "G", image: "https://i.imgur.com/161.jpg", estilo: "básica" }
                ]
            },
            { numero: 35, tipo: "image", texto: "Qual dessas imagens mais combina com você?",
                opcoes: [
                    { label: "A", image: "https://i.imgur.com/163.jpg", estilo: "clássica" },
                    { label: "B", image: "https://i.imgur.com/164.jpg", estilo: "tradicional" },
                    { label: "C", image: "https://i.imgur.com/165.jpg", estilo: "dramática" },
                    { label: "D", image: "https://i.imgur.com/166.jpg", estilo: "romântica" },
                    { label: "E", image: "https://i.imgur.com/167.jpg", estilo: "sensual (sexy)" },
                    { label: "F", image: "https://i.imgur.com/168.jpg", estilo: "criativa" },
                    { label: "G", image: "https://i.imgur.com/169.jpg", estilo: "básica" }
                ]
            }
        ];

        // Adiciona textExibicao para perguntas de texto
        todasAsPerguntas.forEach(pergunta => {
            if (pergunta.tipo === 'text') {
                pergunta.opcoes.forEach(opcao => {
                    opcao.textExibicao = opcao.text;
                });
            }
        });
    }

    function shuffle(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    // Função para lidar com o download
    function handleDownload() {
        // Verifica se já está gerando PDF para evitar múltiplas execuções
        if (window._pdfGenerating) {
            console.log('PDF já está sendo gerado...');
            return;
        }

        // Coleta nome e email do usuário
        const nome = prompt('Digite seu nome:');
        if (!nome) return;
        
        const email = prompt('Digite seu e-mail:');
        if (!email) return;

        // Chama a função de geração de PDF
        generatePdfForEstiloAndDownload(nome, email);
    }

    // Função corrigida para gerar PDF sem dupla abertura
    async function generatePdfForEstiloAndDownload(nome, email, filename) {
        // Previne múltiplas execuções simultâneas
        if (window._pdfGenerating) {
            console.log('PDF já está sendo gerado...');
            return;
        }
        
        window._pdfGenerating = true;
        
        try {
            // Verifica se jsPDF está disponível
            if (typeof window.jsPDF === 'undefined') {
                console.error('jsPDF não está carregado');
                alert('Erro: Biblioteca de PDF não encontrada. Recarregue a página e tente novamente.');
                return;
            }

            const { jsPDF } = window.jsPDF;
            const doc = new jsPDF();
            const pageW = doc.internal.pageSize.getWidth();
            const pageH = doc.internal.pageSize.getHeight();
            const margin = 20;
            let cursorY = margin;

            // Cabeçalho do PDF
            doc.setFontSize(18);
            doc.text('Resultado do Teste de Estilos', pageW / 2, cursorY, { align: 'center' });
            cursorY += 20;

            // Informações do usuário
            doc.setFontSize(12);
            doc.text(`Nome: ${nome}`, margin, cursorY);
            cursorY += 16;
            doc.text(`E-mail: ${email}`, margin, cursorY);
            cursorY += 18;

            // Resultados dos estilos
            const { primary, secondary, tertiary } = estilosPrimarioSecundario;
            
            doc.setFontSize(14);
            doc.text('Seus Estilos:', margin, cursorY);
            cursorY += 16;
            
            doc.setFontSize(12);
            doc.text(`Estilo Primário: ${primary.toUpperCase()}`, margin, cursorY);
            cursorY += 12;
            doc.text(`Estilo Secundário: ${secondary.toUpperCase()}`, margin, cursorY);
            cursorY += 12;
            doc.text(`Estilo Terciário: ${tertiary.toUpperCase()}`, margin, cursorY);
            cursorY += 20;

            // Descrições dos estilos
            doc.setFontSize(10);
            
            // Primário
            doc.setFontSize(12);
            doc.text(`Estilo Primário - ${primary.toUpperCase()}:`, margin, cursorY);
            cursorY += 12;
            doc.setFontSize(10);
            const descPrimary = doc.splitTextToSize(detalhesEstiloMapCompleto[primary], pageW - margin * 2);
            doc.text(descPrimary, margin, cursorY);
            cursorY += descPrimary.length * 5 + 10;

            // Verifica se precisa de nova página
            if (cursorY > pageH - 60) {
                doc.addPage();
                cursorY = margin;
            }

            // Secundário
            doc.setFontSize(12);
            doc.text(`Estilo Secundário - ${secondary.toUpperCase()}:`, margin, cursorY);
            cursorY += 12;
            doc.setFontSize(10);
            const descSecondary = doc.splitTextToSize(detalhesEstiloMapCompleto[secondary], pageW - margin * 2);
            doc.text(descSecondary, margin, cursorY);
            cursorY += descSecondary.length * 5 + 10;

            // Verifica se precisa de nova página
            if (cursorY > pageH - 60) {
                doc.addPage();
                cursorY = margin;
            }

            // Terciário
            doc.setFontSize(12);
            doc.text(`Estilo Terciário - ${tertiary.toUpperCase()}:`, margin, cursorY);
            cursorY += 12;
            doc.setFontSize(10);
            const descTertiary = doc.splitTextToSize(detalhesEstiloMapCompleto[tertiary], pageW - margin * 2);
            doc.text(descTertiary, margin, cursorY);
            cursorY += descTertiary.length * 5 + 10;

            // Rodapé
            const footer = 'Gerado em: ' + new Date().toLocaleString();
            doc.setFontSize(8);
            doc.text(footer, margin, pageH - 20);

            // Gera o PDF e faz download/abertura - CORRIGIDO PARA EVITAR DUPLA ABERTURA
            const blob = doc.output('blob');
            const url = URL.createObjectURL(blob);
            const filenameToUse = filename || 'resultado_teste_estilos.pdf';
            
            // Detecta se é mobile
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

            if (isMobile) {
                // Mobile: força download direto
                const a = document.createElement('a');
                a.href = url;
                a.download = filenameToUse;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                // Libera o objeto após delay
                setTimeout(() => URL.revokeObjectURL(url), 2000);
            } else {
                // Desktop: abre em nova aba para visualização/download
                window.open(url, '_blank');
                
                // Libera o objeto após delay maior
                setTimeout(() => URL.revokeObjectURL(url), 5000);
            }

        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            alert('Erro ao gerar PDF. Tente novamente.');
        } finally {
            // Sempre libera o flag de geração
            window._pdfGenerating = false;
        }
    }

