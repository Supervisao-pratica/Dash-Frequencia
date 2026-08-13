(function () {
    "use strict";

    if (window.SENAC_INHO_LOADED) return;
    window.SENAC_INHO_LOADED = true;

    const ownScriptUrl = document.currentScript && document.currentScript.src;
    const mascotUrl = new URL("./assets/senac-inho.png", ownScriptUrl || window.location.href).href;
    const assistantStyleUrl = new URL("./senac-inho.css?v=1.6.1", ownScriptUrl || window.location.href).href;
    const STOP_WORDS = new Set(["a", "ao", "as", "como", "da", "das", "de", "do", "dos", "e", "em", "eu", "o", "os", "para", "por", "que", "um", "uma"]);

    const icons = {
        search: '<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>',
        send: '<path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path>',
        x: '<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>',
        chevron: '<path d="m9 18 6-6-6-6"></path>',
        play: '<path d="m5 3 14 9-14 9Z"></path>',
        pause: '<rect width="4" height="16" x="6" y="4" rx="1"></rect><rect width="4" height="16" x="14" y="4" rx="1"></rect>',
        previous: '<path d="m19 20-9-8 9-8Z"></path><path d="M5 19V5"></path>',
        next: '<path d="m5 4 9 8-9 8Z"></path><path d="M19 5v14"></path>',
        volume: '<path d="M11 5 6 9H2v6h4l5 4Z"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>',
        muted: '<path d="M11 5 6 9H2v6h4l5 4Z"></path><path d="m22 9-6 6"></path><path d="m16 9 6 6"></path>',
        eye: '<path d="M2.1 12a10.9 10.9 0 0 1 19.8 0 10.9 10.9 0 0 1-19.8 0Z"></path><circle cx="12" cy="12" r="3"></circle>',
        help: '<circle cx="12" cy="12" r="10"></circle><path d="M9.1 9a3 3 0 1 1 5.7 1c-.8 1-1.8 1.4-2.3 2.3-.2.3-.3.7-.3 1.2"></path><path d="M12 17h.01"></path>',
        login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" x2="3" y1="12" y2="12"></line>',
        upload: '<path d="M12 16V4"></path><path d="m7 9 5-5 5 5"></path><path d="M20 15v5H4v-5"></path>',
        users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>',
        refresh: '<path d="M20 6v6h-6"></path><path d="M4 18v-6h6"></path><path d="M18.5 9A7 7 0 0 0 6 5.5L4 8"></path><path d="M5.5 15A7 7 0 0 0 18 18.5l2-2.5"></path>',
        database: '<ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"></path><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"></path>',
        warning: '<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>',
        calendar: '<rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M16 2v4"></path><path d="M8 2v4"></path><path d="M3 10h18"></path>',
        filter: '<polygon points="22 3 2 3 10 12.5 10 19 14 21 14 12.5 22 3"></polygon>',
        student: '<circle cx="12" cy="8" r="5"></circle><path d="M20 21a8 8 0 0 0-16 0"></path>',
        contact: '<path d="M16 2H8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z"></path><path d="M12 18h.01"></path>',
        message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"></path>',
        activity: '<path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>',
        report: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"></path><path d="M14 2v6h6"></path><path d="M8 13h8"></path><path d="M8 17h8"></path>',
        history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"></path><path d="M3 3v5h5"></path><path d="M12 7v5l3 2"></path>',
        notebook: '<path d="M2 6h4"></path><path d="M2 10h4"></path><path d="M2 14h4"></path><path d="M2 18h4"></path><rect width="16" height="20" x="4" y="2" rx="2"></rect><path d="M16 2v20"></path>',
        chart: '<path d="M3 3v18h18"></path><path d="m7 16 4-5 4 3 5-7"></path>',
        signature: '<path d="M20 7c-2.5-2.5-5.5-2.5-8 0L5 14l-1 5 5-1 7-7"></path><path d="M14 5l5 5"></path><path d="M12 20h9"></path>',
        info: '<circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path>',
        check: '<path d="M20 6 9 17l-5-5"></path>'
    };

    function svg(name, label) {
        const aria = label ? ` role="img" aria-label="${label}"` : ' aria-hidden="true"';
        return `<svg${aria} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icons[name] || icons.help}</svg>`;
    }

    const categories = [
        ["all", "Todos"], ["access", "Acesso e turmas"], ["attendance", "Frequência"],
        ["activities", "Atividades"], ["students", "Alunos"], ["reports", "Relatórios"],
        ["notebooks", "Cadernos"], ["ata", "ATA"]
    ];

    const t = (id, category, icon, title, summary, keywords, steps, tip) => ({ id, category, icon, title, summary, keywords, steps, tip });
    const s = (title, text, target, location, options = {}) => ({ title, text, target, location, ...options });

    const topics = [
        t("login", "access", "login", "Entrar no sistema", "Use seu e-mail institucional e a senha criada no Firebase.", "login entrar acesso email institucional senha pr docente conta usuário", [
            s("Informe o e-mail", "Digite o e-mail completo terminado em arroba pr ponto senac ponto br ou arroba docente ponto pr ponto senac ponto br.", { placeholder: "nome@pr.senac.br" }, "Tela de acesso"),
            s("Informe a senha", "Digite a senha cadastrada para esse e-mail. Ela precisa ter pelo menos seis caracteres.", { text: "Senha", tags: ["label"] }, "Tela de acesso"),
            s("Conclua o acesso", "Clique em Entrar. O caderno liberado será identificado pelo e-mail autenticado.", { text: "Entrar", tags: ["button"] }, "Tela de acesso")
        ], "Se o e-mail ainda não existir no Firebase Authentication, o acesso não será concluído."),

        t("load-sheet", "access", "upload", "Abrir uma chamada pela primeira vez", "Carregue a planilha de frequência para montar o Dashboard da turma.", "abrir subir carregar chamada planilha xlsm arquivo arrastar primeira vez", [
            s("Localize o carregamento", "Na tela inicial, use a área pontilhada destinada à planilha de chamada.", { selector: "#fileUpload", closest: ".border-dashed" }, "Tela inicial"),
            s("Selecione o arquivo", "Clique na área ou arraste o arquivo XLSM da turma. O sistema fará a leitura das UCs, alunos e situações.", { text: "Clique ou arraste o arquivo aqui" }, "Tela inicial"),
            s("Aguarde a conferência", "Depois da leitura, confira o número da turma, o curso e os alertas antes de trabalhar nos registros.", { text: "Gestão de Frequência - Relatório e ATA", tags: ["h1"] }, "Cabeçalho da turma")
        ], "Carregar a planilha não altera o arquivo original; o Dashboard apenas lê seus dados."),

        t("saved-classes", "access", "users", "Abrir uma turma salva", "Abra uma turma que já foi armazenada sem selecionar novamente a planilha.", "minhas turmas turma salva abrir voltar lista nuvem firebase", [
            s("Abra Minhas turmas", "Na tela inicial, localize a lista de turmas salvas. Dentro de uma turma, o mesmo acesso aparece no cabeçalho.", { text: "Minhas turmas", tags: ["h2", "button"] }, "Tela inicial ou cabeçalho"),
            s("Sincronize as turmas", "Clique em Sincronizar turmas salvas para buscar no Firebase a relação mais recente de turmas compartilhadas.", { text: "Sincronizar turmas salvas", tags: ["button"] }, "Bloco Minhas turmas"),
            s("Escolha a turma", "Confirme o número, o curso e a data de atualização. Depois clique na linha da turma desejada.", { text: "Atualizada", tags: ["span"] }, "Lista de turmas"),
            s("Exclua turmas encerradas", "Use o botão de lixeira ao lado da turma e confirme a exclusão. A chamada sai de Minhas turmas, mas cadernos, contatos, justificativas e histórico são preservados.", { title: "Excluir turma" }, "Lista de turmas")
        ], "A exclusão da chamada é compartilhada e retira a turma da lista de todos os usuários que tinham acesso."),

        t("update-call", "access", "refresh", "Atualizar a chamada da turma", "Substitua somente os dados variáveis pela versão mais recente da planilha.", "atualizar chamada reler planilha mudou mudança frequência arquivo rede substituir", [
            s("Abra a turma correta", "Confira o número da turma no cabeçalho antes de selecionar qualquer arquivo.", { text: "Turma:", tags: ["span"] }, "Cabeçalho"),
            s("Clique em Atualizar chamada", "No aplicativo instalado, o sistema usa o número da turma para localizar automaticamente a chamada na rede do Senac. Na versão web com Edge ou Chrome, escolha a planilha na primeira vez.", { text: "Atualizar chamada", tags: ["button"] }, "Barra de ações"),
            s("Permita o acesso", "Na versão web, o navegador guarda o vínculo com o arquivo. Nas próximas vezes, basta clicar em Atualizar chamada e permitir a leitura quando solicitado. Em navegadores sem esse recurso, o seletor manual será aberto.", { text: "Atualizando...", tags: ["button"] }, "Barra de ações"),
            s("Revise os alertas", "Ao terminar, confira novamente pendências, NA, alunos e percentuais.", { text: "Pendências de preenchimento da chamada" }, "Painel principal")
        ], "A versão web não consegue procurar sozinha em toda a rede, mas pode lembrar o arquivo escolhido. O aplicativo instalado continua sendo a opção de automação completa."),

        t("general-data", "students", "database", "Carregar Dados Gerais", "Associe e-mail e telefone do aluno e do supervisor aos quadros da turma.", "dados gerais contato telefone email supervisor aluno informações gerais arquivo", [
            s("Clique em Dados Gerais", "Use o botão de carregamento localizado na barra superior da turma.", { text: "Dados Gerais", tags: ["label", "button"] }, "Barra de ações"),
            s("Escolha a planilha", "Selecione o arquivo Informações Gerais que contenha a aba DADOS GERAIS.", { text: "Dados Gerais", tags: ["label"] }, "Barra de ações"),
            s("Confira a associação", "O sistema relaciona os contatos pelo nome do aluno e informa quantos registros foram encontrados.", { text: "Dados de contato" }, "Quadro do aluno")
        ], "Os contatos podem ser editados no quadro do aluno e ficam compartilhados na turma."),

        t("call-pending", "attendance", "warning", "Entender pendências da chamada", "Veja UCs, datas e alunos que ainda precisam de preenchimento.", "pendência chamada branco incompleta data não realizada preenchimento aberta alerta", [
            s("Localize o alerta", "O painel amarelo apresenta somente as UCs consideradas em andamento.", { text: "Pendências de preenchimento da chamada" }, "Painel principal"),
            s("Leia a data e a quantidade", "Chamada não realizada significa que nenhum aluno foi preenchido. Chamada incompleta indica preenchimento parcial.", { text: "chamada incompleta" }, "Alerta de pendências"),
            s("Corrija na fonte", "Abra a planilha de frequência, preencha a chamada e depois use Atualizar chamada para reler o arquivo.", { text: "Atualizar chamada", tags: ["label", "button"] }, "Barra de ações")
        ], "Sábados e domingos são ignorados, exceto sábados aplicáveis a alunos com contraturno."),

        t("na-red", "attendance", "calendar", "NA vermelho e justificativas", "Entenda quais faltas entram no alerta e como registrar a tratativa.", "na vermelho falta ausência justificar justificativa motivo pendente", [
            s("Abra o quadro do aluno", "No Dashboard, clique no cartão desejado. A demonstração mostra onde ficam os registros. Somente NA com fonte vermelha de alunos ativos entram como falta sem justificativa.", { text: "Registros NA da chamada" }, "Quadro do aluno"),
            s("Confira os registros", "Cada item informa a UC, a data e a aba de origem da falta identificada.", { text: "Registros NA da chamada" }, "Quadro do aluno"),
            s("Localize Registros NA", "No quadro do aluno, encontre Registros NA da chamada e escolha o item que será tratado.", { text: "Registros NA da chamada" }, "Quadro do aluno"),
            s("Registre a justificativa", "Use Marcar como justificado e, se desejar, informe o motivo. O motivo não é obrigatório.", { text: "Marcar como justificado", tags: ["button"] }, "Registros NA")
        ], "NA de alunos evadidos, desligados ou em processo não deve compor o alerta principal."),

        t("countershift", "attendance", "calendar", "Contraturno e sábados", "A regra de sábado é aplicada somente aos alunos identificados com contraturno.", "contraturno sábado sabado ensino médio dia atividade fim semana", [
            s("Confira o contraturno", "O cartão e o quadro do aluno mostram a informação lida da coluna de contraturno.", { text: "Contra Turno:" }, "Cartão do aluno"),
            s("Entenda a regra", "Para quem possui contraturno, uma chamada em branco no sábado pode gerar pendência.", { text: "Pendências de preenchimento da chamada" }, "Painel principal"),
            s("Demais alunos", "Para alunos sem contraturno, sábados e domingos continuam fora da verificação.", { text: "Sem Contra Turno" }, "Cartão ou quadro do aluno")
        ], "A aplicação é individual: o sábado não transforma a turma inteira em pendente."),

        t("student-status", "attendance", "filter", "Situações dos alunos e suas cores", "Interprete Desenvolveu, Recuperação, Conselho, Em Processo e Evasão.", "situação status cores desenvolveu recuperação conselho processo evasão desligado evadido laranja", [
            s("Desenvolveu", "Verde indica aluno ativo sem recuperação ou baixa frequência no recorte atual.", { text: "Desenvolveu (", tags: ["button"] }, "Filtros"),
            s("Recuperação", "Vermelho indica dificuldade de desempenho ou situação não desenvolvida.", { text: "Recuperação (", tags: ["button"] }, "Filtros"),
            s("Conselho", "Amarelo destaca baixa frequência que precisa de acompanhamento.", { text: "Conselho (", tags: ["button"] }, "Filtros"),
            s("Em Processo e Evasão", "Fonte laranja no nome indica processo de desligamento. Célula do nome pintada de laranja ou termos como evadido, desistente e desligado levam à Evasão.", { text: "Em Processo (", tags: ["button"] }, "Filtros")
        ], "Ao filtrar uma UC, os contadores e as situações são recalculados somente para ela."),

        t("filters", "students", "filter", "Filtrar por UC, situação, nome ou Órion", "Reduza a lista para analisar exatamente o grupo necessário.", "filtro uc busca nome orion código situação abas todos", [
            s("Escolha a UC", "Use o seletor Todas as UCs para mudar do panorama global para uma unidade específica.", { selectText: "Todas as UCs (Global)" }, "Barra de filtros"),
            s("Escolha a situação", "Use Todos, Desenvolveu, Recuperação, Conselho, Em Processo ou Evasão.", { text: "Todos (", tags: ["button"] }, "Barra de filtros"),
            s("Use a busca", "Digite parte do nome ou o código Órion do aluno.", { placeholder: "Buscar aluno ou código Órion" }, "Barra de filtros")
        ], "O rótulo do cartão informa se a frequência exibida é global ou da UC selecionada."),

        t("student-card", "students", "student", "Usar o quadro do aluno", "Consulte situação, contatos, frequência, atividades, NA e observações em um só lugar.", "quadro bloco cartão aluno abrir situação frequência detalhe orion", [
            s("Localize o aluno", "Use os filtros ou a busca para encontrar o cartão desejado.", { placeholder: "Buscar aluno ou código Órion" }, "Barra de filtros"),
            s("Abra o quadro", "Clique na área principal do cartão desejado, sem marcar a caixa de seleção. A cena mostra o quadro que será aberto.", { text: "Situação Atual" }, "Quadro do aluno"),
            s("Navegue pelos blocos", "O quadro organiza situação atual, contatos, atividades, NA, frequência por UC e observações.", { text: "Situação Atual" }, "Quadro do aluno"),
            s("Emita o relatório", "Use o botão único Emitir relatório para escolher quais informações serão incluídas.", { text: "Emitir relatório", tags: ["button"] }, "Quadro do aluno")
        ], "A caixa no canto do cartão serve para selecionar alunos no relatório de alunos selecionados. A ATA usa a turma toda automaticamente."),

        t("contacts", "students", "contact", "Editar contatos e abrir o WhatsApp", "Mantenha os dados do aluno e do supervisor atualizados na turma.", "contato editar telefone email supervisor whatsapp aluno dados", [
            s("Abra o quadro do aluno", "Clique no cartão do aluno e localize o bloco Dados de contato mostrado na demonstração.", { text: "Dados de contato" }, "Quadro do aluno"),
            s("Edite somente o necessário", "Os campos já ficam disponíveis para edição. Atualize nome, telefone ou e-mail e confira antes de salvar.", { text: "Nome do aluno" }, "Dados de contato"),
            s("Salve os dados", "Clique em Salvar dados somente depois de revisar aluno e supervisor. O tutorial não salva automaticamente.", { text: "Salvar dados", tags: ["button"] }, "Dados de contato"),
            s("Use o WhatsApp", "Quando houver telefone válido, o ícone verde abre uma conversa com o aluno ou supervisor. O tutorial não abre conversas automaticamente.", { title: "Abrir conversa no WhatsApp" }, "Dados de contato")
        ], "Contatos ficam vinculados à turma e podem ser consultados por outros usuários autorizados."),

        t("observations", "students", "message", "Observações das UCs e da chamada", "Entenda a organização de textos e comentários encontrados nas planilhas.", "observação observações comentário célula dia chamada pedagógico planilha", [
            s("Abra o quadro", "As observações aparecem agrupadas por origem para facilitar a leitura.", { text: "Observações organizadas da planilha" }, "Quadro do aluno"),
            s("Confira a origem", "Cada registro informa a UC, a aba ou a data em que o texto foi encontrado.", { text: "registro(s)" }, "Observações organizadas"),
            s("Veja a observação principal", "O sistema também destaca a observação pedagógica considerada principal quando houver conteúdo aplicável.", { text: "Observação Pedagógica (Principal)" }, "Quadro do aluno")
        ], "Comentários inseridos em células de dias da chamada também são apresentados quando identificados."),

        t("activities-upload", "activities", "upload", "Ler uma ou várias planilhas de atividades", "Carregue arquivos de diferentes UCs na mesma sessão.", "ler atividades subir várias planilhas arquivos uc blackboard desempenho", [
            s("Clique em Ler atividades", "O botão permite selecionar mais de um arquivo de atividades.", { text: "Ler atividades", tags: ["label", "button"] }, "Barra de ações"),
            s("Escolha os arquivos", "Selecione as planilhas exportadas por UC. O sistema separa os dados pelo nome e conteúdo de cada arquivo.", { text: "Ler atividades", tags: ["label"] }, "Barra de ações"),
            s("Confira o resumo", "Depois da leitura, o painel de pendências e os cartões dos alunos recebem os indicadores da sessão atual.", { text: "Pendências de atividades" }, "Painel principal"),
            s("Atualize uma UC", "Se carregar novamente a mesma UC, os dados temporários daquela UC são substituídos.", { text: "Ler atividades", tags: ["label"] }, "Barra de ações")
        ], "Atividades não ficam gravadas no Firebase; carregue os arquivos necessários antes de emitir relatórios."),

        t("activity-status", "activities", "activity", "C, NC, em branco e Requer avaliação", "Interprete as situações de execução das atividades.", "c nc não concluiu branco requer avaliação atividade legenda", [
            s("Concluiu", "C indica que o estudante concluiu a atividade.", { text: "Atividades C" }, "Cartão do aluno"),
            s("Não concluiu", "NC é ponto de atenção porque a atividade não foi concluída.", { text: "Não concluiu" }, "Painel de atividades"),
            s("Em branco", "Em branco indica que o estudante não realizou a atividade.", { text: "Em branco" }, "Painel de atividades"),
            s("Requer avaliação", "O estudante enviou a atividade, mas o instrutor ainda precisa avaliá-la.", { text: "Requer avaliação" }, "Painel de atividades")
        ], "S1D2 é apresentado como Semana 1, Dia 2 no sistema e nos relatórios."),

        t("activity-competencies", "activities", "chart", "Indicadores e competências das atividades", "Leia A, PA, NA, D e ND conforme as legendas avaliativas.", "indicador competência competências a pa na d nd desempenho menção avaliativa", [
            s("Indicadores", "A significa atendido, PA parcialmente atendido e NA não atendido.", { text: "Indicadores A" }, "Cartão do aluno"),
            s("Competências", "D significa desenvolvida e ND não desenvolvida. Situações NA também podem aparecer conforme o arquivo.", { text: "Competência D" }, "Cartão do aluno"),
            s("Use nos relatórios", "Esses dados entram no relatório individual e no relatório por UCs enquanto os arquivos estiverem carregados.", { text: "Relatório por UCs", tags: ["button"] }, "Barra de ações")
        ], "A leitura segue as legendas do relatório de menções avaliativas do sistema educacional."),

        t("individual-report", "reports", "report", "Emitir relatório individual", "Escolha as seções necessárias para um aluno específico.", "relatório individual aluno opções atividades contatos justificativa frequência", [
            s("Abra o quadro do aluno", "Clique no cartão do estudante desejado. A demonstração reproduz o quadro que aparece.", { text: "Situação Atual" }, "Quadro do aluno"),
            s("Abra as opções", "Dentro do quadro, clique em Emitir relatório. A demonstração passa para a janela de opções.", { text: "Emitir relatório do aluno", tags: ["h2"] }, "Opções do relatório"),
            s("Selecione as seções", "Nenhuma opção começa marcada. Escolha contatos, justificativas, frequência, observações, caderno ou atividades.", { text: "Atualização de contato do aluno" }, "Opções do relatório"),
            s("Emita e confira", "Depois da seleção, clique em Emitir relatório e revise a nova janela antes de imprimir, copiar ou enviar. O tutorial não gera o documento automaticamente.", { text: "Emitir relatório", tags: ["button"] }, "Rodapé das opções")
        ], "As atividades aparecem somente quando suas planilhas tiverem sido carregadas na sessão."),

        t("selected-report", "reports", "report", "Gerar relatório dos alunos selecionados", "Use as caixas dos cartões para reunir um ou vários alunos no mesmo relatório.", "gerar relatório selecionados caixas seleção vários alunos turma botão desabilitado", [
            s("Selecione os alunos", "Marque a caixa no canto de cada cartão. Use a caixa geral da barra para selecionar todos os alunos visíveis no filtro.", { kind: "student-checkbox" }, "Cartões e barra de filtros"),
            s("Confira o recorte", "A seleção respeita os alunos exibidos pelo filtro de UC, situação e busca.", { text: "Todos (", tags: ["button"] }, "Barra de filtros"),
            s("Clique em Gerar Relatório", "O botão fica habilitado quando existe pelo menos um aluno selecionado.", { text: "Gerar Relatório", tags: ["button"] }, "Barra de ações"),
            s("Revise a prévia", "Confira se todos os alunos desejados aparecem antes de imprimir, copiar ou enviar.", { text: "Relatório de Desempenho" }, "Prévia do relatório")
        ], "Para relatórios diferentes, limpe a seleção anterior antes de escolher o próximo grupo."),

        t("uc-report", "reports", "report", "Relatório completo por UCs", "Escolha um intervalo de UCs e os conteúdos que serão exibidos.", "relatório por ucs global intervalo uc turma aluno filtros completo", [
            s("Abra o relatório por UCs", "Clique em Relatório por UCs na barra superior. A demonstração mostra a janela completa de configuração.", { text: "Relatório por intervalo de UCs", tags: ["h2"] }, "Janela do relatório"),
            s("Defina o intervalo", "Escolha a UC inicial e a UC final. O sistema inclui todas as unidades existentes entre elas.", { text: "Intervalo de Unidades Curriculares" }, "Janela do relatório"),
            s("Ajuste os filtros", "Escolha a situação dos alunos e marque frequência, atividades, chamada, observações ou caderno conforme a necessidade.", { text: "Filtros do relatório" }, "Janela do relatório"),
            s("Escolha o alcance", "Turma inteira é o padrão. Para um grupo específico, escolha Alunos selecionados e use a busca interna.", { text: "Alcance do relatório" }, "Janela do relatório"),
            s("Confira as atividades", "Dados de atividades entram no intervalo quando os arquivos correspondentes estiverem carregados. O tutorial não emite o relatório automaticamente.", { text: "Atividades" }, "Filtros do relatório")
        ], "O visual da prévia segue o mesmo padrão organizado dos relatórios individuais."),

        t("outlook", "reports", "send", "Enviar relatório pelo Outlook", "Abra uma nova mensagem com destinatário, assunto e corpo preparados.", "outlook email enviar aluno supervisor assunto corpo copiar relatório", [
            s("Abra as opções do relatório", "No quadro do aluno, clique em Emitir relatório. Escolha as seções e emita a prévia manualmente.", { text: "Emitir relatório do aluno", tags: ["h2"] }, "Opções do relatório"),
            s("Emita a prévia", "Marque as informações desejadas e clique em Emitir relatório. A nova janela também receberá a ajuda contextual do Senac-inho.", { text: "Emitir relatório", tags: ["button"] }, "Rodapé das opções"),
            s("Escolha o destinatário", "Selecione estudante ou supervisor, conforme os contatos cadastrados.", { text: "Enviar para" }, "Prévia do relatório"),
            s("Clique em Enviar por Outlook", "O sistema abre o aplicativo de e-mail com destinatário, assunto e texto preenchidos.", { text: "Enviar por Outlook", tags: ["button"] }, "Prévia do relatório"),
            s("Confira antes de enviar", "Revise o destinatário e o conteúdo no Outlook. O envio final continua sob seu controle.", null, "Outlook")
        ], "Para preservar exatamente o visual, use também Copiar para e-mail e cole no corpo da mensagem."),

        t("notes-report", "reports", "notebook", "Relatório de anotações dos cadernos", "Consulte chamados, pontos de atenção, responsáveis, prazos e tratativas.", "relatório anotações caderno chamados pontos atenção status tratativas", [
            s("Abra o relatório", "Clique em Relatório de Anotações na barra superior. A demonstração reproduz a janela da turma.", { text: "Relatório de Anotações", tags: ["h2"] }, "Relatório de anotações"),
            s("Use os filtros", "Filtre por alcance, status da tratativa, analista ou pesquise aluno, assunto e anotação.", { selectText: "Todas as anotações" }, "Filtros do relatório"),
            s("Revise prazos", "Dê prioridade aos registros vencidos, em tratativa ou que aguardam retorno.", { text: "Vencidas" }, "Relatório ou painel")
        ], "O relatório respeita a visibilidade e o caderno associado ao usuário autenticado."),

        t("history", "reports", "history", "Histórico de acompanhamento", "Compare como NA e atividades evoluíram entre diferentes leituras.", "histórico evolução gráfico antes hoje mudanças na atividades turma aluno", [
            s("Abra Histórico", "Clique em Histórico na barra superior. A demonstração reproduz a janela de acompanhamento.", { text: "Histórico de acompanhamento", tags: ["h2"] }, "Janela do histórico"),
            s("Escolha o recorte", "Selecione turma inteira ou um aluno e ajuste o período desejado.", { text: "Aluno selecionado" }, "Janela do histórico"),
            s("Compare as leituras", "Analise a evolução dos NA, pendências de atividades e status entre as datas registradas.", { text: "Evolução das pendências" }, "Janela do histórico")
        ], "O histórico guarda retratos de acompanhamento, sem transformar atividades temporárias em cadastro fixo."),

        t("instructor-notebook", "notebooks", "notebook", "Caderno do Instrutor", "Registre situações de alunos ou da turma e acompanhe as tratativas.", "caderno instrutor anotação aluno turma situação específica responsável prazo tratativa", [
            s("Abra seu caderno", "Clique no seu nome na faixa de instrutores. O caderno é associado ao e-mail autenticado e outro instrutor não deve ter acesso a ele.", { text: "Caderno do Instrutor", tags: ["h2"] }, "Caderno do Instrutor"),
            s("Defina o alcance", "Escolha um aluno, vários alunos ou a turma toda.", { text: "Turma toda" }, "Caderno do Instrutor"),
            s("Registre as situações", "Selecione uma ou várias situações específicas e descreva o fato ou encaminhamento.", { text: "Situação Específica" }, "Caderno do Instrutor"),
            s("Organize a tratativa", "Informe analista responsável, data, prazo e status antes de salvar.", { text: "Status da tratativa" }, "Caderno do Instrutor")
        ], "Somente o instrutor identificado pelo login acessa o próprio caderno."),

        t("treatment-status", "notebooks", "check", "Status e prazo das tratativas", "Use cores e estados para saber o que precisa de retorno.", "tratativa concluída em tratativa aberta aguardando retorno vencida prazo período", [
            s("Defina o status", "Escolha Aberta, Em tratativa, Aguardando retorno, Concluída ou Cancelada, conforme o andamento.", { text: "Status da tratativa" }, "Caderno ou quadro do aluno"),
            s("Informe o prazo", "Use o período de tratativa para indicar quando o registro deve ser revisto.", { text: "Prazo" }, "Caderno"),
            s("Acompanhe as cores", "Cada status recebe uma identificação visual e pode ser filtrado nos relatórios.", { text: "Tratativas em aberto" }, "Painel principal")
        ], "Ao concluir uma ação, atualize o status em vez de criar um registro duplicado."),

        t("analyst-notebook", "notebooks", "chart", "Caderno do Analista e PDI", "Acompanhe instrutores, registre evidências e observe a evolução.", "caderno analista pdi instrutor competência avaliação evolução acompanhamento", [
            s("Abra seu caderno", "Clique no nome do analista ao lado do usuário. O acesso é disponibilizado quando o login é reconhecido.", { text: "Caderno do Analista", tags: ["h2"] }, "Caderno do Analista"),
            s("Escolha o instrutor", "Selecione o profissional acompanhado e informe o tipo e o assunto.", { text: "Instrutor acompanhado" }, "Caderno do Analista"),
            s("Use as sugestões", "Competência e avaliação são sugeridas pelo tipo, assunto e registro, mas podem ser alteradas manualmente.", { text: "Classificação PDI" }, "Caderno do Analista"),
            s("Acompanhe o PDI", "O gráfico, pontos fortes, oportunidades e ações consolidam os registros avaliativos.", { text: "PDI consolidado" }, "Caderno do Analista")
        ], "Registros não avaliativos podem ficar sem competência ou nota."),

        t("analyst-visibility", "notebooks", "eye", "Visibilidade das anotações do analista", "Escolha quando o instrutor poderá consultar um acompanhamento.", "analista visibilidade instrutor permitir visualizar restrito privado anotação", [
            s("Localize a opção", "Dentro do Caderno do Analista, há uma caixa para permitir visualização pelo instrutor.", { text: "Permitir visualização pelo instrutor" }, "Caderno do Analista"),
            s("Marcada", "Quando marcada, o instrutor acompanhado poderá consultar o registro.", { text: "Permitir visualização pelo instrutor" }, "Caderno do Analista"),
            s("Desmarcada", "Quando desmarcada, a anotação permanece restrita ao analista responsável.", { text: "Restrito" }, "Histórico do acompanhamento")
        ], "Revise a visibilidade antes de salvar informações sensíveis de acompanhamento."),

        t("ata", "ata", "signature", "Gerar ATA do Conselho de Classe", "Gere a ATA global da turma com as situações de atenção identificadas pelo sistema.", "ata conselho classe gerar doc documento imprimir assinatura data uc extenso global turma atenção", [
            s("Abra o gerador da ATA", "A ATA é global e não depende de selecionar alunos. A demonstração mostra o gerador usando automaticamente os dados de toda a turma.", { text: "Gerador de ATA Digital", tags: ["h2"] }, "Gerador de ATA"),
            s("Entenda quem entra no documento", "O sistema percorre a turma e inclui as situações de conselho, recuperação, processo de desligamento e evasão ou desligamento encontradas na chamada.", { text: "Configuração da ATA" }, "Gerador de ATA"),
            s("Confira os responsáveis", "Revise o nome e a assinatura do analista e dos instrutores. Esses dados formam os blocos de assinatura do documento.", { text: "Analista Responsável" }, "Configuração da ATA"),
            s("Revise a prévia", "Confira a data, as UCs por extenso, as situações dos alunos, os desligados sem documento, o texto justificado e as linhas de assinatura.", { selector: "#ata-preview-content" }, "Prévia editável da ATA"),
            s("Exporte somente após conferir", "Use Imprimir ou Salvar PDF, ou baixe o documento para edição. O Senac-inho nunca aciona a exportação automaticamente.", { text: "Imprimir / Salvar PDF", tags: ["button"] }, "Rodapé do gerador")
        ], "Não marque cartões de alunos para gerar a ATA. A prévia é editável e deve ser revisada antes da exportação."),

        t("system-reading", "access", "info", "O que o Dashboard lê e o que fica salvo", "Entenda a diferença entre dados da planilha, dados persistentes e informações temporárias.", "salvo gravado firebase temporário planilha leitura o que fica dados sistema", [
            s("Planilha de frequência", "Alunos, UCs, presença, observações, instrutores, situações e Órion são relidos ao atualizar a chamada.", { text: "Atualizar chamada", tags: ["label", "button"] }, "Barra de ações"),
            s("Dados persistentes", "Contatos, justificativas, cadernos e alterações de acompanhamento ficam vinculados à turma.", { text: "Dados de contato" }, "Quadro do aluno"),
            s("Atividades temporárias", "Os arquivos de Ler atividades valem para a sessão atual e podem variar por UC.", { text: "Ler atividades", tags: ["label", "button"] }, "Barra de ações"),
            s("Histórico", "O histórico pode guardar indicadores das leituras para permitir comparações de evolução.", { text: "Histórico", tags: ["button"] }, "Barra de ações")
        ], "Atualizar a chamada não deve apagar contatos, justificativas ou anotações já gravadas.")
    ];

    function readAudioPreference() {
        try { return window.localStorage.getItem("senacInhoAudio") !== "off"; }
        catch (_) { return true; }
    }

    function saveAudioPreference(enabled) {
        try { window.localStorage.setItem("senacInhoAudio", enabled ? "on" : "off"); }
        catch (_) { /* O tutorial continua mesmo sem armazenamento local. */ }
    }

    function readSpeedPreference() {
        try {
            const saved = Number(window.localStorage.getItem("senacInhoSpeed"));
            return [1.15, 1.5, 2].includes(saved) ? saved : 1.15;
        } catch (_) { return 1.15; }
    }

    function saveSpeedPreference(speed) {
        try { window.localStorage.setItem("senacInhoSpeed", String(speed)); }
        catch (_) { /* A velocidade escolhida continua válida durante a sessão. */ }
    }

    const state = {
        category: "all",
        query: "",
        expandedTopic: null,
        tourTopic: null,
        tourIndex: 0,
        playing: false,
        audio: readAudioPreference(),
        speed: readSpeedPreference(),
        utterance: null,
        timer: null,
        speechWatchdog: null,
        speechToken: 0,
        target: null,
        toastTimer: null,
        currentContext: null
    };

    let launcher;
    let overlay;
    let panel;
    let results;
    let queryInput;
    let highlight;
    let player;
    let fallback;
    let toast;
    let contextObserver;
    let contextTimer;

    function normalize(value) {
        return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9@]+/g, " ").trim();
    }

    function queryWords(value) {
        return normalize(value).split(/\s+/).filter(word => word.length > 1 && !STOP_WORDS.has(word));
    }

    function isVisible(element) {
        if (!element || !(element instanceof Element) || element.closest(".sena-panel, .sena-tour-player, .sena-launcher")) return false;
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity || 1) > 0 && rect.width > 1 && rect.height > 1;
    }

    function visibleText() {
        const clone = document.body.cloneNode(true);
        clone.querySelectorAll(".sena-launcher,.sena-panel,.sena-overlay,.sena-tour-player,.sena-highlight,.sena-tour-fallback,.sena-toast,script,style").forEach(node => node.remove());
        return normalize(clone.innerText || clone.textContent || "");
    }

    function scoreTopic(topic, query) {
        const words = queryWords(query);
        if (!words.length) return 0;
        const title = normalize(topic.title);
        const haystack = normalize(`${topic.title} ${topic.summary} ${topic.keywords} ${topic.steps.map(step => `${step.title} ${step.text}`).join(" ")} ${topic.tip || ""}`);
        return words.reduce((score, word) => {
            if (title.includes(word)) return score + 7;
            if (haystack.includes(word)) return score + 3;
            const partial = haystack.split(" ").some(candidate => candidate.length > 4 && (candidate.startsWith(word) || word.startsWith(candidate)));
            return score + (partial ? 1 : 0);
        }, 0);
    }

    const contextProfiles = [
        { id: "ata", label: "Gerador de ATA", all: ["gerador de ata digital"], topics: ["ata"] },
        { id: "student-report", label: "Relatório do aluno", any: ["emitir relatorio do aluno", "relatorio de atividades"], topics: ["individual-report", "activity-status", "outlook"] },
        { id: "uc-report", label: "Relatório por intervalo de UCs", all: ["relatorio por intervalo de ucs"], topics: ["uc-report", "activities-upload", "outlook"] },
        { id: "notes-report", label: "Relatório de Anotações", all: ["relatorio de anotacoes"], topics: ["notes-report", "treatment-status", "instructor-notebook"] },
        { id: "history", label: "Histórico de acompanhamento", all: ["historico de acompanhamento"], topics: ["history", "call-pending", "activity-status"] },
        { id: "analyst-notebook", label: "Caderno do Analista", all: ["caderno do analista"], topics: ["analyst-notebook", "analyst-visibility"] },
        { id: "instructor-notebook", label: "Caderno do Instrutor", all: ["caderno do instrutor"], topics: ["instructor-notebook", "treatment-status", "notes-report"] },
        { id: "student", label: "Quadro do aluno", all: ["situacao atual", "dados de contato"], topics: ["student-card", "contacts", "na-red", "observations", "individual-report"] },
        { id: "pdi-preview", label: "Plano de Desenvolvimento Individual", all: ["plano de desenvolvimento individual"], topics: ["analyst-notebook", "analyst-visibility"] },
        { id: "uc-report-preview", label: "Prévia do relatório por UCs", any: ["relatorio completo da turma aluno", "relatorio completo por ucs"], topics: ["uc-report", "outlook"] },
        { id: "notes-preview", label: "Relatório de Anotações", all: ["relatorio de anotacoes do caderno"], topics: ["notes-report", "treatment-status"] },
        { id: "report-preview", label: "Prévia do relatório", any: ["relatorio de desempenho", "relatorio de situacoes"], topics: ["individual-report", "selected-report", "outlook"] },
        { id: "login", label: "Acesso do instrutor", all: ["acesso do instrutor"], topics: ["login"] },
        { id: "classes", label: "Tela inicial e turmas salvas", all: ["clique ou arraste o arquivo aqui"], topics: ["load-sheet", "saved-classes", "system-reading"] },
        { id: "dashboard", label: "Painel principal da turma", all: ["gestao de frequencia relatorio e ata"], topics: ["filters", "student-status", "student-card", "individual-report"] }
    ];

    function visibleLayerCandidates() {
        const selector = "[role='dialog'],[aria-modal='true'],[class*='fixed'][class*='inset-0']";
        return [...document.querySelectorAll(selector)]
            .filter(element => isVisible(element) && !element.closest(".sena-panel,.sena-tour-player,.sena-launcher") && !element.classList.contains("sena-overlay") && !element.classList.contains("sena-tour-fallback"));
    }

    function topVisibleLayer() {
        const layers = visibleLayerCandidates();
        if (!layers.length) return null;
        return layers.map((element, index) => {
            const zIndex = Number.parseInt(window.getComputedStyle(element).zIndex, 10);
            return { element, index, zIndex: Number.isFinite(zIndex) ? zIndex : 0 };
        }).sort((a, b) => a.zIndex - b.zIndex || a.index - b.index).pop().element;
    }

    function contextHeading(container) {
        const headings = [...container.querySelectorAll("h1,h2,h3")].filter(isVisible);
        const heading = headings.find(item => normalize(item.textContent).length > 2);
        return heading ? String(heading.innerText || heading.textContent).replace(/\s+/g, " ").trim() : "";
    }

    function profileMatches(profile, text) {
        if (profile.all && !profile.all.every(marker => text.includes(marker))) return false;
        if (profile.any && !profile.any.some(marker => text.includes(marker))) return false;
        return true;
    }

    function topicsForContextText(text, preferredIds) {
        const selected = [];
        const add = topic => { if (topic && !selected.some(item => item.id === topic.id)) selected.push(topic); };
        (preferredIds || []).forEach(id => add(topics.find(topic => topic.id === id)));
        topics.map(topic => ({ topic, score: scoreTopic(topic, text) }))
            .filter(item => item.score >= 6)
            .sort((a, b) => b.score - a.score)
            .slice(0, 6)
            .forEach(item => add(item.topic));
        return selected.slice(0, 6);
    }

    function detectCurrentContext() {
        const layer = topVisibleLayer();
        const container = layer || document.body;
        const rawText = String(container.innerText || container.textContent || "").slice(0, 24000);
        const text = normalize(rawText);
        const profile = contextProfiles.find(item => profileMatches(item, text));
        const title = contextHeading(container) || (profile && profile.label) || document.title || "Dashboard";
        let topicIds = profile ? [...profile.topics] : [];

        if (profile && profile.id === "dashboard") {
            if (text.includes("pendencias de preenchimento da chamada")) topicIds.unshift("call-pending");
            if (text.includes("pendencias de atividades")) topicIds.unshift("activity-status", "activities-upload");
            if (text.includes("anotacoes dos cadernos")) topicIds.unshift("notes-report");
        }

        const matchedTopics = topicsForContextText(text, topicIds);
        if (!matchedTopics.length) matchedTopics.push(topics.find(topic => topic.id === "system-reading"));
        return {
            id: profile ? profile.id : layer ? "dialog-generic" : "page-generic",
            label: profile ? profile.label : title,
            title,
            text,
            element: layer,
            topics: matchedTopics.filter(Boolean),
            signature: `${profile ? profile.id : "generic"}|${normalize(title)}|${layer ? "layer" : "page"}`
        };
    }

    function contextualTopicIds() {
        return detectCurrentContext().topics.map(topic => topic.id);
    }

    function createUi() {
        launcher = document.createElement("button");
        launcher.type = "button";
        launcher.className = "sena-launcher";
        launcher.setAttribute("aria-label", "Abrir o Senac-inho");
        launcher.setAttribute("aria-expanded", "false");
        launcher.innerHTML = `<span class="sena-launcher-avatar"><img src="${mascotUrl}" alt=""></span><span class="sena-launcher-copy"><strong>Senac-inho</strong><small>Tire suas dúvidas</small></span><span class="sena-online-dot" aria-hidden="true"></span>`;

        overlay = document.createElement("div");
        overlay.className = "sena-overlay";

        panel = document.createElement("aside");
        panel.className = "sena-panel";
        panel.setAttribute("aria-hidden", "true");
        panel.setAttribute("aria-label", "Ajuda do Senac-inho");
        panel.innerHTML = `
            <header class="sena-panel-header">
                <img class="sena-panel-mascot" src="${mascotUrl}" alt="Senac-inho">
                <div class="sena-panel-title"><strong>Senac-inho</strong><span>Ajuda prática do Dashboard de Frequência</span></div>
                <button class="sena-icon-button" type="button" data-sena-action="close" aria-label="Fechar ajuda">${svg("x")}</button>
            </header>
            <div class="sena-panel-body">
                <div class="sena-greeting"><strong>Olá!</strong> Escolha um assunto ou escreva sua dúvida. Cada tutorial abre uma demonstração visual com foco na etapa e narração.</div>
                <div class="sena-current-context"><span>Você está vendo</span><strong data-sena-context-name>Dashboard</strong></div>
                <label class="sena-search">${svg("search")}<input type="search" placeholder="Ex.: Como justificar um NA?" aria-label="Pesquisar ajuda"><button type="button" data-sena-action="search" aria-label="Pesquisar">${svg("send")}</button></label>
                <button class="sena-context-button" type="button" data-sena-action="context">${svg("eye")} <span data-sena-context-action>Explicar esta tela</span></button>
                <div class="sena-categories" aria-label="Categorias de ajuda"></div>
                <section class="sena-results" aria-live="polite"></section>
            </div>`;

        highlight = document.createElement("div");
        highlight.className = "sena-highlight sena-hidden";
        highlight.innerHTML = '<span class="sena-highlight-label">Veja aqui</span>';

        fallback = document.createElement("div");
        fallback.className = "sena-tour-fallback sena-hidden";
        fallback.innerHTML = "<span></span>";

        toast = document.createElement("div");
        toast.className = "sena-toast";
        toast.setAttribute("role", "status");
        toast.setAttribute("aria-live", "polite");

        document.body.append(overlay, panel, launcher, highlight, fallback, toast);
        results = panel.querySelector(".sena-results");
        queryInput = panel.querySelector(".sena-search input");
        renderCategories();
        renderResults();
        bindUi();
    }

    function renderCategories() {
        const container = panel.querySelector(".sena-categories");
        container.innerHTML = categories.map(([id, label]) => `<button type="button" class="sena-category${state.category === id ? " is-active" : ""}" data-sena-category="${id}">${label}</button>`).join("");
    }

    function topicCard(topic) {
        const expanded = state.expandedTopic === topic.id;
        return `<article class="sena-topic${expanded ? " is-expanded" : ""}" data-sena-topic-card="${topic.id}">
            <button type="button" class="sena-topic-main" data-sena-topic="${topic.id}" aria-expanded="${expanded}">
                <span class="sena-topic-icon">${svg(topic.icon)}</span>
                <span class="sena-topic-copy"><strong>${topic.title}</strong><small>${topic.summary}</small></span>
                ${svg("chevron")}
            </button>
            <div class="sena-topic-detail">
                <div class="sena-topic-meaning"><strong>O que significa</strong><span>${topic.summary}</span></div>
                <div class="sena-topic-how">Como realizar</div>
                <ol>${topic.steps.map(step => `<li>${step.title}: ${step.text}</li>`).join("")}</ol>
                ${topic.tip ? `<div class="sena-topic-tip"><strong>Atenção:</strong> ${topic.tip}</div>` : ""}
                <button type="button" class="sena-play-topic" data-sena-play="${topic.id}">${svg("play")} Reproduzir tutorial com áudio</button>
            </div>
        </article>`;
    }

    const directSearchAliases = new Map([
        ["login", "login"],
        ["entrar", "login"],
        ["abrir chamada", "load-sheet"],
        ["subir chamada", "load-sheet"],
        ["turmas salvas", "saved-classes"],
        ["atualizar chamada", "update-call"],
        ["dados gerais", "general-data"],
        ["pendencias da chamada", "call-pending"],
        ["ata", "ata"],
        ["gerar ata", "ata"],
        ["conselho de classe", "ata"],
        ["na", "na-red"],
        ["na vermelho", "na-red"],
        ["contraturno", "countershift"],
        ["situacao do aluno", "student-status"],
        ["status do aluno", "student-status"],
        ["filtros", "filters"],
        ["quadro do aluno", "student-card"],
        ["bloco do aluno", "student-card"],
        ["contatos", "contacts"],
        ["observacoes", "observations"],
        ["ler atividades", "activities-upload"],
        ["situacoes das atividades", "activity-status"],
        ["competencias das atividades", "activity-competencies"],
        ["relatorio individual", "individual-report"],
        ["relatorio dos alunos", "selected-report"],
        ["relatorio por ucs", "uc-report"],
        ["relatorio de anotacoes", "notes-report"],
        ["outlook", "outlook"],
        ["historico", "history"],
        ["caderno do instrutor", "instructor-notebook"],
        ["status da tratativa", "treatment-status"],
        ["tratativa", "treatment-status"],
        ["caderno do analista", "analyst-notebook"],
        ["pdi", "analyst-notebook"],
        ["visibilidade do analista", "analyst-visibility"],
        ["dados salvos", "system-reading"],
        ["ucs", "uc-report"]
    ]);

    function directSearchTopic(query) {
        const topicId = directSearchAliases.get(normalize(query));
        return topicId ? topics.find(topic => topic.id === topicId) : null;
    }

    function filteredTopics() {
        let list = topics;
        if (!state.query && state.category !== "all") list = list.filter(topic => topic.category === state.category);
        if (!state.query) return list;
        const direct = directSearchTopic(state.query);
        if (direct) return [direct];
        const matches = list.map(topic => ({ topic, score: scoreTopic(topic, state.query) }))
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score || a.topic.title.localeCompare(b.topic.title, "pt-BR"))
            .map(item => item.topic);
        return matches;
    }

    function renderResults(customList, label) {
        const list = customList || filteredTopics();
        if (!list.length) {
            results.innerHTML = `<div class="sena-no-results">${svg("help")}<strong>Não encontrei essa dúvida.</strong><span>Tente usar palavras como NA, atividades, aluno, relatório, caderno, histórico ou ATA.</span></div>`;
            return;
        }
        const resultLabel = label || (state.query ? `${list.length} orientação(ões) encontrada(s)` : "Tutoriais do sistema");
        results.innerHTML = `<p class="sena-results-label">${resultLabel}</p><div class="sena-topic-list">${list.map(topicCard).join("")}</div>`;
    }

    function applyDetectedContext(context, renderContext) {
        state.currentContext = context;
        const contextName = panel.querySelector("[data-sena-context-name]");
        const contextAction = panel.querySelector("[data-sena-context-action]");
        const launcherSubtitle = launcher.querySelector(".sena-launcher-copy small");
        if (contextName) contextName.textContent = context.label;
        if (contextAction) contextAction.textContent = context.element ? "Explicar esta janela" : "Explicar esta tela";
        if (launcherSubtitle) launcherSubtitle.textContent = context.element ? "Ajuda desta janela" : "Ajuda desta tela";

        if (renderContext) {
            state.query = "";
            queryInput.value = "";
            state.category = "all";
            state.expandedTopic = context.topics[0] ? context.topics[0].id : null;
            renderCategories();
            renderResults(context.topics, `Ajuda para: ${context.label}`);
        }
    }

    function refreshDetectedContext(forceRender) {
        const context = detectCurrentContext();
        const changed = !state.currentContext || state.currentContext.signature !== context.signature;
        if (!changed && !forceRender) return;
        const shouldRender = Boolean(forceRender || (panel.classList.contains("is-open") && !state.query));
        applyDetectedContext(context, shouldRender);
    }

    function scheduleContextRefresh() {
        if (contextTimer) window.clearTimeout(contextTimer);
        contextTimer = window.setTimeout(() => refreshDetectedContext(false), 140);
    }

    function observeDashboardContext() {
        if (contextObserver) contextObserver.disconnect();
        contextObserver = new MutationObserver(mutations => {
            const dashboardChanged = mutations.some(mutation => {
                const target = mutation.target instanceof Element ? mutation.target : mutation.target.parentElement;
                return target && !target.closest(".sena-panel,.sena-tour-player,.sena-launcher,.sena-toast");
            });
            if (dashboardChanged) scheduleContextRefresh();
        });
        contextObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style", "hidden"] });
        refreshDetectedContext(false);
    }

    function openPanel() {
        refreshDetectedContext(true);
        panel.classList.add("is-open");
        overlay.classList.add("is-open");
        panel.setAttribute("aria-hidden", "false");
        launcher.setAttribute("aria-expanded", "true");
        window.setTimeout(() => queryInput.focus(), 180);
    }

    function closePanel() {
        panel.classList.remove("is-open");
        overlay.classList.remove("is-open");
        panel.setAttribute("aria-hidden", "true");
        launcher.setAttribute("aria-expanded", "false");
    }

    function search() {
        state.query = queryInput.value.trim();
        if (state.query) {
            state.category = "all";
            renderCategories();
        }
        const matches = filteredTopics();
        state.expandedTopic = state.query && matches.length ? matches[0].id : null;
        renderResults();
    }

    function explainContext() {
        refreshDetectedContext(true);
    }

    function bindUi() {
        launcher.addEventListener("click", () => panel.classList.contains("is-open") ? closePanel() : openPanel());
        overlay.addEventListener("click", closePanel);
        panel.addEventListener("click", event => {
            const action = event.target.closest("[data-sena-action]");
            if (action) {
                if (action.dataset.senaAction === "close") closePanel();
                if (action.dataset.senaAction === "search") search();
                if (action.dataset.senaAction === "context") explainContext();
                return;
            }
            const category = event.target.closest("[data-sena-category]");
            if (category) {
                state.category = category.dataset.senaCategory;
                state.expandedTopic = null;
                renderCategories();
                renderResults();
                return;
            }
            const topicButton = event.target.closest("[data-sena-topic]");
            if (topicButton) {
                state.expandedTopic = state.expandedTopic === topicButton.dataset.senaTopic ? null : topicButton.dataset.senaTopic;
                renderResults();
                const expanded = results.querySelector(`[data-sena-topic-card="${state.expandedTopic}"]`);
                if (expanded) expanded.scrollIntoView({ block: "nearest" });
                return;
            }
            const playButton = event.target.closest("[data-sena-play]");
            if (playButton) startTour(playButton.dataset.senaPlay);
        });
        queryInput.addEventListener("keydown", event => { if (event.key === "Enter") search(); });
        queryInput.addEventListener("input", () => { if (!queryInput.value) { state.query = ""; renderResults(); } });
        document.addEventListener("keydown", event => {
            if (event.key !== "Escape") return;
            if (state.tourTopic) stopTour();
            else if (panel.classList.contains("is-open")) closePanel();
        });
        window.addEventListener("resize", scheduleHighlightUpdate, { passive: true });
        window.addEventListener("scroll", scheduleHighlightUpdate, { passive: true, capture: true });
    }

    function findByText(target) {
        const wanted = Array.isArray(target.text) ? target.text.map(normalize) : [normalize(target.text)];
        const selector = (target.tags && target.tags.length ? target.tags : ["button", "label", "h1", "h2", "h3", "h4", "p", "span", "div", "a"]).join(",");
        const candidates = [...document.querySelectorAll(selector)].filter(isVisible);
        let best = null;
        let bestScore = -1;
        candidates.forEach(element => {
            const text = normalize(element.innerText || element.textContent || "");
            if (!text || text.length > 650) return;
            wanted.forEach(value => {
                let score = -1;
                if (text === value) score = 100;
                else if (text.startsWith(value)) score = 70 - Math.min(30, text.length - value.length);
                else if (text.includes(value)) score = 45 - Math.min(25, text.length - value.length);
                if (score > bestScore) { best = element; bestScore = score; }
            });
        });
        return best;
    }

    function findTarget(target) {
        if (!target) return null;
        let element = null;
        if (target.kind === "student-card") {
            const headings = [...document.querySelectorAll("main h3")].filter(isVisible);
            const heading = headings.find(item => !/pendências|observação|situação|dados/i.test(item.textContent || ""));
            element = heading && (heading.closest(".group") || heading.closest("[class*='shadow']") || heading.parentElement);
        } else if (target.kind === "student-checkbox") {
            element = [...document.querySelectorAll("main input[type='checkbox']")].find(isVisible) || null;
        } else if (target.selector) {
            element = [...document.querySelectorAll(target.selector)].find(isVisible) || document.querySelector(target.selector);
        } else if (target.placeholder) {
            const value = normalize(target.placeholder);
            element = [...document.querySelectorAll("input[placeholder],textarea[placeholder]")].find(item => isVisible(item) && normalize(item.placeholder).includes(value)) || null;
        } else if (target.title) {
            const value = normalize(target.title);
            element = [...document.querySelectorAll("[title]")].find(item => isVisible(item) && normalize(item.getAttribute("title")).includes(value)) || null;
        } else if (target.selectText) {
            const value = normalize(target.selectText);
            element = [...document.querySelectorAll("select")].find(select => isVisible(select) && normalize(select.textContent).includes(value)) || null;
        } else if (target.text) {
            element = findByText(target);
        }
        if (element && target.closest) element = element.closest(target.closest) || element;
        if (element && !isVisible(element)) return null;
        return element;
    }

    function demoFocus(content, extraClass = "") {
        return `<div class="sena-demo-focus ${extraClass}"><span class="sena-demo-focus-label">Etapa atual</span>${content}</div>`;
    }

    function demoButton(label, active = false) {
        return active ? demoFocus(`<button type="button" tabindex="-1">${label}</button>`, "sena-demo-focus-inline") : `<button type="button" tabindex="-1">${label}</button>`;
    }

    function demoAppHeader(activeLabel = "") {
        const buttons = ["Atualizar chamada", "Dados Gerais", "Ler atividades", "Relatório de Anotações", "Relatório por UCs", "Histórico", "Gerar ATA"];
        return `<div class="sena-demo-app-header"><div class="sena-demo-brand"><strong>Senac</strong><span>Gestão de Frequência - Relatório e ATA</span><small>Turma: 202600001</small></div><div class="sena-demo-toolbar">${buttons.map(label => demoButton(label, normalize(label) === normalize(activeLabel))).join("")}</div></div>`;
    }

    function demoWindow(title, body, focusWhole = false) {
        const content = `<div class="sena-demo-modal"><div class="sena-demo-modal-title"><strong>${title}</strong><span>×</span></div><div class="sena-demo-modal-body">${body}</div></div>`;
        return focusWhole ? demoFocus(content, "sena-demo-focus-window") : content;
    }

    function dashboardScene(topic, step, index) {
        let active = "";
        if (topic.id === "update-call" && index < 3) active = "Atualizar chamada";
        if (topic.id === "general-data") active = "Dados Gerais";
        if (topic.id === "activities-upload" && index !== 2) active = "Ler atividades";
        if (topic.id === "activity-competencies" && index === 2) active = "Relatório por UCs";
        if (topic.id === "system-reading" && index === 0) active = "Atualizar chamada";
        if (topic.id === "system-reading" && index === 2) active = "Ler atividades";
        const alertFocus = topic.id === "call-pending" || (topic.id === "countershift" && index === 1) || (topic.id === "update-call" && index === 3) || (topic.id === "activities-upload" && index === 2);
        const filterFocus = ["filters", "student-status"].includes(topic.id) || (topic.id === "student-card" && index === 0);
        const selectionFocus = topic.id === "selected-report";
        const alertTitle = topic.id === "activities-upload" ? "Pendências de atividades" : "Pendências de preenchimento da chamada";
        const alertText = topic.id === "activities-upload" ? "NC: 3 · Em branco: 2 · Requer avaliação: 1" : "UC5 · chamada incompleta · 3 alunos pendentes";
        return `${demoAppHeader(active)}<div class="sena-demo-content">
            ${alertFocus ? demoFocus(`<div class="sena-demo-alert"><strong>${alertTitle}</strong><span>${alertText}</span></div>`) : `<div class="sena-demo-alert"><strong>${alertTitle}</strong><span>${alertText}</span></div>`}
            ${filterFocus ? demoFocus(`<div class="sena-demo-filters"><select><option>Todas as UCs (Global)</option></select><button>Todos (30)</button><button>Desenvolveu (15)</button><button>Recuperação (8)</button><button>Conselho (5)</button><input placeholder="Buscar aluno ou código Órion"></div>`) : `<div class="sena-demo-filters"><select><option>Todas as UCs (Global)</option></select><button>Todos (30)</button><button>Desenvolveu (15)</button><button>Recuperação (8)</button><input placeholder="Buscar aluno ou código Órion"></div>`}
            <div class="sena-demo-cards">${["ANA JÚLIA CORDEIRO", "BERNARDO TODESCHINI", "BIANCA MARCANTE"].map((name, cardIndex) => {
                const card = `<article class="sena-demo-student"><div><input type="checkbox" ${selectionFocus && cardIndex < 2 ? "checked" : ""}><strong>${name}</strong><span class="sena-demo-status">${cardIndex === 1 ? "CONSELHO" : "DESENVOLVEU"}</span></div><small>Órion: 65957${cardIndex}</small><b>${cardIndex === 1 ? "90,9" : "98,5"}%</b><i></i><small>Contra Turno: Sem Contra Turno</small></article>`;
                return selectionFocus && cardIndex === 0 ? demoFocus(card) : card;
            }).join("")}</div>
        </div>`;
    }

    function loginScene(topic, step, index) {
        const parts = [
            `<label>E-mail institucional<input placeholder="nome@pr.senac.br"></label>`,
            `<label>Senha<input type="password" value="senac123"></label>`,
            `<button>Entrar</button>`
        ];
        return `<div class="sena-demo-login"><div class="sena-demo-login-logo">Senac</div><h2>Gestão de Frequência</h2><p>Acesso do instrutor</p>${parts.map((part, partIndex) => partIndex === Math.min(index, 2) ? demoFocus(part) : part).join("")}</div>`;
    }

    function homeScene(topic, step, index) {
        const saved = topic.id === "saved-classes";
        const homeHead = `<div class="sena-demo-home-head"><strong>Senac</strong><h2>Gestão de Frequência</h2></div>`;
        const deleteButton = index === 3 ? demoFocus(`<button>Excluir</button>`, "sena-demo-focus-inline") : `<button>Excluir</button>`;
        const classRow = `<div class="sena-demo-class-row"><strong>Turma 202600001</strong><span>Atualizada hoje</span><span><button>Abrir turma</button>${deleteButton}</span></div>`;
        return `<div class="sena-demo-home">${saved && index === 0 ? demoFocus(`${homeHead}<h3>Minhas turmas</h3>`) : homeHead}${saved ? `${index === 1 ? demoFocus(`<button>Sincronizar turmas salvas</button>`) : `<button>Sincronizar turmas salvas</button>`}${index === 2 ? demoFocus(classRow) : classRow}` : `${index < 2 ? demoFocus(`<div class="sena-demo-dropzone"><strong>Clique ou arraste o arquivo aqui</strong><span>Planilha de frequência XLSM</span></div>`) : demoFocus(`<div class="sena-demo-success">Turma carregada com sucesso</div>`)}`}</div>`;
    }

    function studentScene(topic, step, index) {
        let block = "status";
        if (topic.id === "contacts" || (topic.id === "system-reading" && index === 1)) block = "contacts";
        if (topic.id === "na-red") block = "na";
        if (topic.id === "observations") block = "observations";
        if (["activity-status", "activity-competencies"].includes(topic.id)) block = "activities";
        if (topic.id === "individual-report" && index > 0) return studentReportScene(topic, step, index);
        const row = (name, value) => `<label>${name}<input value="${value}"></label>`;
        const body = `<div class="sena-demo-student-head"><strong>ANA JÚLIA CORDEIRO CAVALCANTI</strong><span>90,1% Freq.</span></div>
            ${block === "status" && !(topic.id === "student-card" && index === 3) ? demoFocus(`<section><h3>Situação Atual</h3><span class="sena-demo-pill green">Desenvolvimento pleno</span><p>Contra Turno: Sem Contra Turno · Órion 659571</p></section>`) : `<section><h3>Situação Atual</h3><span class="sena-demo-pill green">Desenvolvimento pleno</span></section>`}
            ${block === "contacts" ? demoFocus(`<section><h3>Dados de contato</h3><div class="sena-demo-grid">${row("Nome do aluno", "Ana Júlia")}${row("Telefone do aluno", "(41) 99999-0000")}${row("E-mail do aluno", "aluno@exemplo.com")}${row("Nome do supervisor", "Supervisor")}</div><button>Salvar dados</button></section>`) : ""}
            ${block === "activities" ? demoFocus(`<section><h3>Acompanhamento de atividades</h3><div class="sena-demo-metrics"><b>C 12</b><b>NC 3</b><b>Em branco 2</b><b>Requer avaliação 1</b></div><p>Semana 1, Dia 2 · Indicador parcialmente atendido · Competência ND</p></section>`) : ""}
            ${block === "na" ? demoFocus(`<section><h3>Registros NA da chamada</h3><div class="sena-demo-na"><strong>UC5 · 13/07</strong><input placeholder="Motivo da justificativa (opcional)"><button>Marcar como justificado</button></div></section>`) : ""}
            ${block === "observations" ? demoFocus(`<section><h3>Observações organizadas da planilha</h3><div class="sena-demo-note"><strong>UC5 · Chamada · 13/07</strong><p>Registro pedagógico identificado na planilha.</p></div><h3>Observação Pedagógica (Principal)</h3></section>`) : ""}
            ${topic.id === "student-card" && index === 3 ? demoFocus(`<button>Emitir relatório</button>`) : ""}`;
        return `${demoAppHeader()}<div class="sena-demo-backdrop">${demoWindow("Quadro do aluno", body)}</div>`;
    }

    function studentReportScene(topic, step, index) {
        const focused = index === 1 ? "title" : index === 2 ? "options" : "emit";
        const body = `${focused === "title" ? demoFocus(`<div><h3>Escolha as informações que deseja enviar</h3><p>ANA JÚLIA · Turma 202600001</p></div>`) : `<h3>Escolha as informações que deseja enviar</h3>`}
            ${focused === "options" ? demoFocus(`<div class="sena-demo-options"><label><input type="checkbox"> Atualização de contato do aluno</label><label><input type="checkbox"> Justificativas e faltas NA</label><label><input type="checkbox"> Frequência, desempenho e situação</label><label><input type="checkbox"> Atividades do upload atual</label></div>`) : `<div class="sena-demo-options"><label>Atualização de contato</label><label>Justificativas e faltas NA</label><label>Atividades do upload atual</label></div>`}
            ${focused === "emit" ? demoFocus(`<button>Emitir relatório</button>`) : `<button>Emitir relatório</button>`}`;
        return `${demoAppHeader()}<div class="sena-demo-backdrop">${demoWindow("Emitir relatório do aluno", body)}</div>`;
    }

    function ucReportScene(topic, step, index) {
        const blocks = [
            `<div><h3>Relatório por intervalo de UCs</h3><p>Frequência, desempenho, chamada, atividades e caderno.</p></div>`,
            `<section><h3>Intervalo de Unidades Curriculares</h3><div class="sena-demo-grid"><label>Da UC<select><option>UC1</option></select></label><label>Até a UC<select><option>UC11</option></select></label></div></section>`,
            `<section><h3>Filtros do relatório</h3><select><option>Todas as situações</option></select><div class="sena-demo-checks">Frequência e desempenho · Atividades · Chamada e NA · Observações</div></section>`,
            `<section><h3>Alcance do relatório</h3><button>Turma inteira</button><button>Alunos selecionados</button><input placeholder="Buscar aluno ou Órion"></section>`,
            `<section><h3>Atividades</h3><p>Incluídas quando as planilhas das UCs estiverem carregadas.</p><button>Emitir relatório</button></section>`
        ];
        const body = blocks.map((item, itemIndex) => itemIndex === Math.min(index, blocks.length - 1) ? demoFocus(item) : item).join("");
        return `${demoAppHeader()}<div class="sena-demo-backdrop">${demoWindow("Relatório por intervalo de UCs", body)}</div>`;
    }

    function notesReportScene(topic, step, index) {
        const filters = `<div class="sena-demo-grid"><select><option>Todas as anotações</option></select><select><option>Todos os status</option></select><select><option>Todos os analistas</option></select><input placeholder="Buscar aluno, assunto ou anotação"></div>`;
        const summary = `<div class="sena-demo-metrics"><b>Total: 8</b><b>Em aberto: 3</b><b>Vencidas: 1</b></div><div class="sena-demo-note"><strong>Turma toda · Em tratativa</strong><p>Acompanhamento registrado pelo instrutor.</p></div>`;
        const body = `${index === 0 ? demoFocus(`<p>Chamados, pontos de atenção e registros da turma.</p>`) : ""}${index === 1 ? demoFocus(filters) : filters}${index >= 2 ? demoFocus(summary) : summary}`;
        return `${demoAppHeader()}<div class="sena-demo-backdrop">${demoWindow("Relatório de Anotações", body)}</div>`;
    }

    function historyScene(topic, step, index) {
        const body = `${index === 0 ? demoFocus(`<p>Evolução das pendências de chamada, atividades e tratativas.</p>`) : ""}${index === 1 ? demoFocus(`<div class="sena-demo-grid"><select><option>Turma inteira</option><option>Aluno selecionado</option></select><label>Período<input type="date"></label></div>`) : ""}${index >= 2 ? demoFocus(`<section><h3>Evolução das pendências</h3><div class="sena-demo-chart"><i style="height:35%"></i><i style="height:60%"></i><i style="height:42%"></i><i style="height:75%"></i></div></section>`) : ""}`;
        return `${demoAppHeader()}<div class="sena-demo-backdrop">${demoWindow("Histórico de acompanhamento", body)}</div>`;
    }

    function instructorNotebookScene(topic, step, index) {
        const focusIndex = topic.id === "treatment-status" ? Math.min(index + 2, 4) : index;
        const blocks = [
            `<div><h3>Instrutora responsável</h3><p>Nova anotação para a turma 202600001</p></div>`,
            `<section><h3>Alcance da anotação</h3><button>Aluno específico</button><button>Turma toda</button></section>`,
            `<section><h3>Situação Específica</h3><div class="sena-demo-checks">Frequência · Desempenho · Contato · Comportamento</div></section>`,
            `<section><h3>Analista responsável</h3><select><option>Bianca</option></select><h3>Período de tratativa</h3><input value="7 dias"></section>`,
            `<section><h3>Status da tratativa</h3><select><option>Em tratativa</option><option>Concluída</option></select><span class="sena-demo-pill orange">Prazo previsto</span></section>`
        ];
        const body = blocks.map((item, itemIndex) => itemIndex === focusIndex ? demoFocus(item) : item).join("");
        return `${demoAppHeader()}<div class="sena-demo-backdrop">${demoWindow("Caderno do Instrutor", body)}</div>`;
    }

    function analystNotebookScene(topic, step, index) {
        const visibility = topic.id === "analyst-visibility";
        const focusIndex = visibility ? Math.min(index + 2, 4) : index;
        const blocks = [
            `<p>Acompanhamento de instrutores e construção do PDI · Michel</p>`,
            `<section><h3>Instrutor acompanhado</h3><select><option>Jaqueline Vieira</option></select><label>Tipo<select><option>Acompanhamento</option></select></label><label>Assunto<input value="Planejamento"></label></section>`,
            `<section><h3>Classificação PDI</h3><p>Competência e avaliação sugeridas automaticamente.</p><button>Ajustar manualmente</button></section>`,
            `<label class="sena-demo-share"><input type="checkbox"> <strong>Permitir visualização pelo instrutor</strong><span>Desmarcado, o registro fica restrito ao analista.</span></label>`,
            `<section><h3>PDI consolidado</h3><div class="sena-demo-chart"><i style="height:45%"></i><i style="height:67%"></i><i style="height:78%"></i></div><p>Pontos fortes · Oportunidades e ações</p></section>`
        ];
        const body = blocks.map((item, itemIndex) => itemIndex === focusIndex ? demoFocus(item) : item).join("");
        return `${demoAppHeader()}<div class="sena-demo-backdrop">${demoWindow("Caderno do Analista", body)}</div>`;
    }

    function ataScene(topic, step, index) {
        const blocks = [
            `<p>A ATA é gerada com a turma toda e não exige seleção de alunos.</p>`,
            `<section><h3>Situações incluídas automaticamente</h3><div class="sena-demo-checks">Conselho · Recuperação · Processo de desligamento · Evasão</div></section>`,
            `<section><h3>Configuração da ATA</h3><label>Analista Responsável<input value="Michel"></label><label>Instrutor 1<input value="Instrutora"></label></section>`,
            `<article class="sena-demo-paper"><strong>ATA DO CONSELHO DE CLASSE</strong><p>Turma 202600001 · UC 1 (um) · Data da realização</p><p>Desligados sem documento...</p><hr><small>Manifesto de assinaturas</small></article>`,
            `<div><button>Imprimir / Salvar PDF</button><button>Baixar Documento (.doc)</button></div>`
        ];
        const body = blocks.map((item, itemIndex) => itemIndex === index ? demoFocus(item) : item).join("");
        return `${demoAppHeader()}<div class="sena-demo-backdrop">${demoWindow("Gerador de ATA Digital", body)}</div>`;
    }

    function outlookScene(topic, step, index) {
        if (index === 0) return studentReportScene(topic, step, 1);
        if (index === 1) return studentReportScene(topic, step, 3);
        const body = `<div class="sena-demo-mailbar"><select><option>Enviar para estudante</option><option>Enviar para supervisor</option></select>${index === 2 ? demoFocus(`<button>Enviar por Outlook</button>`) : `<button>Enviar por Outlook</button>`}</div><article class="sena-demo-paper"><strong>Relatório de Desempenho</strong><p>ANA JÚLIA · Turma 202600001</p><hr><p>Frequência, desempenho e atividades organizadas.</p></article>${index >= 3 ? demoFocus(`<div class="sena-demo-outlook"><strong>Outlook</strong><p>Para: aluno@exemplo.com</p><p>Assunto: Relatório de Desempenho - Ana Júlia - Turma 202600001</p></div>`) : ""}`;
        return `${demoAppHeader()}<div class="sena-demo-backdrop">${demoWindow("Prévia do relatório", body)}</div>`;
    }

    function reportPreviewScene() {
        const body = demoFocus(`<article class="sena-demo-paper"><strong>Relatório de Desempenho</strong><p>ANA JÚLIA e BERNARDO · Turma 202600001</p><hr><p>Frequência, desempenho, atividades e situações organizadas por aluno.</p></article>`);
        return `${demoAppHeader()}<div class="sena-demo-backdrop">${demoWindow("Prévia do relatório", body)}</div>`;
    }

    function tutorialScene(topic, step, index) {
        if (topic.id === "login") return loginScene(topic, step, index);
        if (["load-sheet", "saved-classes"].includes(topic.id)) return homeScene(topic, step, index);
        if (topic.id === "student-card" && index === 0) return dashboardScene(topic, step, index);
        if (topic.id === "countershift" && index === 1) return dashboardScene(topic, step, index);
        if (topic.id === "activity-competencies" && index === 2) return dashboardScene(topic, step, index);
        if (topic.id === "general-data" && index === 2) return studentScene({ ...topic, id: "contacts" }, step, index);
        if (topic.id === "selected-report" && index === 3) return reportPreviewScene();
        if (["student-card", "contacts", "observations", "na-red", "countershift", "activity-status", "activity-competencies", "individual-report"].includes(topic.id)) return studentScene(topic, step, index);
        if (topic.id === "uc-report") return ucReportScene(topic, step, index);
        if (topic.id === "outlook") return outlookScene(topic, step, index);
        if (topic.id === "notes-report" || (topic.id === "treatment-status" && index === 2)) return notesReportScene(topic, step, index);
        if (topic.id === "history" || (topic.id === "system-reading" && index === 3)) return historyScene(topic, step, index);
        if (topic.id === "instructor-notebook" || topic.id === "treatment-status") return instructorNotebookScene(topic, step, index);
        if (["analyst-notebook", "analyst-visibility"].includes(topic.id)) return analystNotebookScene(topic, step, index);
        if (topic.id === "ata") return ataScene(topic, step, index);
        if (topic.id === "system-reading" && index === 1) return studentScene(topic, step, index);
        return dashboardScene(topic, step, index);
    }

    function createPlayer() {
        player = document.createElement("section");
        player.className = "sena-tour-player sena-video-player";
        player.setAttribute("role", "dialog");
        player.setAttribute("aria-modal", "true");
        player.setAttribute("aria-label", "Tutorial visual do Senac-inho");
        player.innerHTML = `
            <div class="sena-video-window">
                <header class="sena-video-header"><div class="sena-video-mascot"><div class="sena-speaking-bars"><span></span><span></span><span></span><span></span></div><img src="${mascotUrl}" alt="Senac-inho"></div><div><strong>Tutorial visual do Senac-inho</strong><span class="sena-video-topic"></span></div><button type="button" data-tour="close" aria-label="Fechar tutorial">${svg("x")}</button></header>
                <div class="sena-video-stage"><div class="sena-demo-browser"><div class="sena-demo-browser-bar"><i></i><i></i><i></i><span>Dashboard de Frequência</span></div><div class="sena-demo-screen"></div></div></div>
                <div class="sena-video-caption" aria-live="polite"><div class="sena-tour-meta"><span></span><span></span></div><h3></h3><p></p><p class="sena-tour-location"></p></div>
                <div class="sena-tour-controls">
                    <button type="button" data-tour="previous" aria-label="Etapa anterior">${svg("previous")}</button>
                    <button type="button" class="sena-play-control" data-tour="toggle" aria-label="Pausar">${svg("pause")}</button>
                    <button type="button" data-tour="next" aria-label="Próxima etapa">${svg("next")}</button>
                    <button type="button" data-tour="audio" aria-label="Desativar áudio">${svg(state.audio ? "volume" : "muted")}</button><span class="sena-audio-status">${state.audio ? "Áudio ligado" : "Áudio desligado"}</span>
                    <select class="sena-speed-control" data-tour-speed aria-label="Velocidade da narração" title="Velocidade da narração"><option value="1.15"${state.speed === 1.15 ? " selected" : ""}>Normal</option><option value="1.5"${state.speed === 1.5 ? " selected" : ""}>1,5x</option><option value="2"${state.speed === 2 ? " selected" : ""}>2x</option></select>
                    <div class="sena-tour-progress"><span></span></div><span class="sena-tour-step-count"></span>
                </div>
            </div>`;
        player.addEventListener("click", event => {
            const button = event.target.closest("[data-tour]");
            if (!button) return;
            if (button.dataset.tour === "previous") goToTourStep(state.tourIndex - 1, true);
            if (button.dataset.tour === "next") goToTourStep(state.tourIndex + 1, true);
            if (button.dataset.tour === "toggle") toggleTourPlayback();
            if (button.dataset.tour === "audio") toggleAudio();
            if (button.dataset.tour === "close") stopTour();
        });
        player.addEventListener("change", event => {
            if (!event.target.matches("[data-tour-speed]")) return;
            state.speed = Number(event.target.value) || 1.15;
            saveSpeedPreference(state.speed);
            if (state.playing) narrateStep();
            showToast(`Velocidade da narração: ${event.target.options[event.target.selectedIndex].text}.`);
        });
        document.body.append(player);
    }

    function startTour(topicId) {
        const topic = topics.find(item => item.id === topicId);
        if (!topic) return;
        closePanel();
        stopSpeech();
        if (player) player.remove();
        state.tourTopic = topic;
        state.tourIndex = 0;
        state.playing = true;
        createPlayer();
        document.documentElement.classList.add("sena-lock-scroll");
        highlight.classList.add("sena-hidden");
        fallback.classList.add("sena-hidden");
        goToTourStep(0, false);
    }

    function stopTour() {
        stopSpeech();
        state.tourTopic = null;
        state.playing = false;
        highlight.classList.add("sena-hidden");
        highlight.classList.remove("is-visible");
        fallback.classList.add("sena-hidden");
        document.documentElement.classList.remove("sena-lock-scroll");
        if (player) { player.remove(); player = null; }
    }

    function stopSpeech() {
        if (state.timer) window.clearTimeout(state.timer);
        if (state.speechWatchdog) window.clearTimeout(state.speechWatchdog);
        state.timer = null;
        state.speechWatchdog = null;
        state.speechToken += 1;
        if ("speechSynthesis" in window) window.speechSynthesis.cancel();
        state.utterance = null;
        if (player) player.classList.remove("is-speaking");
    }

    function preferredVoice() {
        if (!("speechSynthesis" in window)) return null;
        const voices = window.speechSynthesis.getVoices();
        const portuguese = voices.filter(voice => /^pt(-|_)/i.test(voice.lang));
        const voiceScore = voice => {
            const name = normalize(voice.name);
            let score = /pt[-_]br/i.test(voice.lang) ? 30 : 0;
            if (name.includes("natural")) score += 100;
            if (name.includes("francisca")) score += 90;
            if (name.includes("thalita")) score += 85;
            if (name.includes("google") && name.includes("portugu")) score += 80;
            if (name.includes("luciana") || name.includes("maria")) score += 65;
            if (voice.localService) score += 5;
            return score;
        };
        return portuguese.sort((a, b) => voiceScore(b) - voiceScore(a))[0] || null;
    }

    function narrationText(topic, step) {
        return `${step.title}. ${step.text}`;
    }

    function splitNarration(text, maximumLength = 155) {
        const sentences = String(text || "").match(/[^.!?;:]+[.!?;:]?/g) || [String(text || "")];
        const chunks = [];
        let current = "";
        const addWords = sentence => {
            sentence.trim().split(/\s+/).forEach(word => {
                if (current && `${current} ${word}`.length > maximumLength) {
                    chunks.push(current.trim());
                    current = word;
                } else current = current ? `${current} ${word}` : word;
            });
        };
        sentences.forEach(sentence => {
            const clean = sentence.trim();
            if (!clean) return;
            if (current && `${current} ${clean}`.length > maximumLength) {
                chunks.push(current.trim());
                current = "";
            }
            if (clean.length > maximumLength) addWords(clean);
            else current = current ? `${current} ${clean}` : clean;
        });
        if (current.trim()) chunks.push(current.trim());
        return chunks.filter(Boolean);
    }

    function fallbackDuration(text) {
        return Math.max(2400, Math.min(9000, (String(text).length * 46) / Math.max(1, state.speed)));
    }

    function setAudioStatus(message) {
        const status = player && player.querySelector(".sena-audio-status");
        if (status) status.textContent = message;
    }

    function speakNarrationChunks(chunks, chunkIndex, topic, stepIndex, token, voice, attempt = 0) {
        if (!state.playing || state.speechToken !== token || state.tourTopic !== topic || state.tourIndex !== stepIndex) return;
        if (chunkIndex >= chunks.length) {
            state.utterance = null;
            if (player) player.classList.remove("is-speaking");
            advanceAfterNarration(topic, stepIndex);
            return;
        }

        const chunk = chunks[chunkIndex];
        const utterance = new SpeechSynthesisUtterance(chunk);
        utterance.lang = "pt-BR";
        utterance.rate = state.speed;
        utterance.pitch = 1.02;
        utterance.volume = 1;
        if (voice) utterance.voice = voice;

        let settled = false;
        const completeChunk = () => {
            if (settled) return;
            settled = true;
            if (state.speechWatchdog) window.clearTimeout(state.speechWatchdog);
            state.speechWatchdog = null;
            if (state.speechToken !== token || !state.playing) return;
            state.timer = window.setTimeout(() => speakNarrationChunks(chunks, chunkIndex + 1, topic, stepIndex, token, voice, 0), 110);
        };

        utterance.onstart = () => {
            if (player) player.classList.add("is-speaking");
            setAudioStatus("Áudio ligado");
        };
        utterance.onend = completeChunk;
        utterance.onerror = event => {
            if (settled) return;
            const error = event && event.error;
            if (error === "not-allowed") {
                settled = true;
                if (state.speechWatchdog) window.clearTimeout(state.speechWatchdog);
                state.speechWatchdog = null;
                state.playing = false;
                state.utterance = null;
                if (player) player.classList.remove("is-speaking");
                setAudioStatus("Clique em reproduzir");
                updatePlayButton();
                showToast("O navegador bloqueou a voz. Clique em reproduzir para liberar o áudio.");
                return;
            }
            const retryable = state.speechToken === token && state.playing && !["canceled", "interrupted"].includes(error);
            if (retryable && attempt < 1) {
                settled = true;
                if (state.speechWatchdog) window.clearTimeout(state.speechWatchdog);
                state.speechWatchdog = null;
                state.timer = window.setTimeout(() => speakNarrationChunks(chunks, chunkIndex, topic, stepIndex, token, null, attempt + 1), 180);
                return;
            }
            if (!["canceled", "interrupted"].includes(error)) setAudioStatus("Tentando continuar o áudio");
            completeChunk();
        };
        state.utterance = utterance;
        window.speechSynthesis.resume?.();
        window.speechSynthesis.speak(utterance);

        state.speechWatchdog = window.setTimeout(() => {
            if (settled || state.speechToken !== token) return;
            completeChunk();
            window.speechSynthesis.cancel();
        }, Math.max(3500, Math.min(12000, (chunk.length * 82) / Math.max(1, state.speed))));
    }

    function narrateStep() {
        stopSpeech();
        if (!state.playing || !state.tourTopic) return;
        const topic = state.tourTopic;
        const index = state.tourIndex;
        const step = topic.steps[index];
        if (!state.audio || !("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
            state.timer = window.setTimeout(() => advanceAfterNarration(topic, index), fallbackDuration(step.text));
            return;
        }
        const token = state.speechToken;
        const chunks = splitNarration(narrationText(topic, step));
        const begin = () => speakNarrationChunks(chunks, 0, topic, index, token, preferredVoice());
        state.timer = window.setTimeout(begin, 90);
    }

    function advanceAfterNarration(topic, index) {
        if (!state.playing || state.tourTopic !== topic || state.tourIndex !== index) return;
        if (index < topic.steps.length - 1) goToTourStep(index + 1, false);
        else {
            state.playing = false;
            updatePlayButton();
            showToast("Tutorial concluído. Você pode rever qualquer etapa.");
        }
    }

    function goToTourStep(index, userAction) {
        if (!state.tourTopic) return;
        const last = state.tourTopic.steps.length - 1;
        state.tourIndex = Math.max(0, Math.min(index, last));
        if (userAction) state.playing = true;
        if (renderTourStep() !== false) narrateStep();
    }

    function renderTourStep() {
        const topic = state.tourTopic;
        if (!topic || !player) return;
        const step = topic.steps[state.tourIndex];
        const meta = player.querySelectorAll(".sena-tour-meta span");
        meta[0].textContent = topic.title;
        meta[1].textContent = `Etapa ${state.tourIndex + 1} de ${topic.steps.length}`;
        player.querySelector(".sena-video-topic").textContent = topic.title;
        player.querySelector(".sena-video-caption h3").textContent = step.title;
        player.querySelector(".sena-video-caption > p:not(.sena-tour-location)").textContent = step.text;
        player.querySelector(".sena-tour-location").textContent = step.location ? `Onde encontrar: ${step.location}` : "";
        player.querySelector("[data-tour='previous']").disabled = state.tourIndex === 0;
        player.querySelector("[data-tour='next']").disabled = state.tourIndex === topic.steps.length - 1;
        player.querySelector(".sena-tour-progress span").style.width = `${((state.tourIndex + 1) / topic.steps.length) * 100}%`;
        player.querySelector(".sena-tour-step-count").textContent = `${state.tourIndex + 1}/${topic.steps.length}`;
        updatePlayButton();
        player.querySelector(".sena-demo-screen").innerHTML = tutorialScene(topic, step, state.tourIndex);
        highlight.classList.add("sena-hidden");
        fallback.classList.add("sena-hidden");
        return true;
    }

    function scheduleHighlightUpdate() { /* O foco agora pertence à cena visual do tutorial. */ }
    function updateHighlight() { /* Mantido para compatibilidade com ouvintes já registrados. */ }

    function toggleTourPlayback() {
        if (!state.tourTopic) return;
        if (state.playing) {
            state.playing = false;
            stopSpeech();
        } else {
            state.playing = true;
            if (renderTourStep() !== false) narrateStep();
        }
        updatePlayButton();
    }

    function updatePlayButton() {
        if (!player) return;
        const button = player.querySelector("[data-tour='toggle']");
        button.innerHTML = svg(state.playing ? "pause" : "play");
        button.setAttribute("aria-label", state.playing ? "Pausar" : "Reproduzir");
    }

    function toggleAudio() {
        state.audio = !state.audio;
        saveAudioPreference(state.audio);
        const button = player && player.querySelector("[data-tour='audio']");
        if (button) {
            button.innerHTML = svg(state.audio ? "volume" : "muted");
            button.setAttribute("aria-label", state.audio ? "Desativar áudio" : "Ativar áudio");
        }
        setAudioStatus(state.audio ? "Áudio ligado" : "Áudio desligado");
        if (state.playing) narrateStep();
        showToast(state.audio ? "Narração ativada." : "Narração desativada. O tutorial continuará automaticamente.");
    }

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add("is-visible");
        if (state.toastTimer) window.clearTimeout(state.toastTimer);
        state.toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
    }

    function attachAssistantToChildWindow(childWindow) {
        let attempts = 0;
        const attachmentTimer = window.setInterval(() => {
            attempts += 1;
            try {
                if (!childWindow || childWindow.closed) {
                    window.clearInterval(attachmentTimer);
                    return;
                }
                const childDocument = childWindow.document;
                if (!childDocument || !childDocument.head || !childDocument.body || childDocument.documentElement.innerHTML.length < 200) {
                    if (attempts >= 24) window.clearInterval(attachmentTimer);
                    return;
                }
                if (childDocument.querySelector("[data-senac-inho-child]")) {
                    window.clearInterval(attachmentTimer);
                    return;
                }
                const stylesheet = childDocument.createElement("link");
                stylesheet.rel = "stylesheet";
                stylesheet.href = assistantStyleUrl;
                stylesheet.dataset.senacInhoChild = "style";
                const script = childDocument.createElement("script");
                script.src = ownScriptUrl || new URL("./senac-inho.js?v=1.6.1", window.location.href).href;
                script.dataset.senacInhoChild = "script";
                childDocument.head.append(stylesheet);
                childDocument.body.append(script);
                window.clearInterval(attachmentTimer);
            } catch (_) {
                window.clearInterval(attachmentTimer);
            }
        }, 220);
    }

    function installChildWindowSupport() {
        if (window.SENAC_INHO_OPEN_PATCHED) return;
        window.SENAC_INHO_OPEN_PATCHED = true;
        const nativeOpen = window.open.bind(window);
        window.open = function (...args) {
            const childWindow = nativeOpen(...args);
            const destination = String(args[0] || "");
            if (childWindow && (!destination || destination === "about:blank")) attachAssistantToChildWindow(childWindow);
            return childWindow;
        };
    }

    function init() {
        if (document.querySelector(".sena-launcher")) return;
        createUi();
        observeDashboardContext();
        installChildWindowSupport();
        if ("speechSynthesis" in window) {
            window.speechSynthesis.getVoices();
            window.speechSynthesis.addEventListener?.("voiceschanged", preferredVoice, { once: true });
        }
        window.SenacInho = {
            open: openPanel,
            close: closePanel,
            search(question) { openPanel(); queryInput.value = question || ""; search(); },
            play(topicId) { startTour(topicId); },
            topics: topics.map(({ id, title, category }) => ({ id, title, category }))
        };
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
    else init();
})();
