(() => {
    "use strict";

    const STORAGE_KEY = "senac_analyst_central_v2";
    const SAVED_CLASSES_INDEX_KEY = "saved_classes_v1_index";
    const SAVED_CLASS_DATA_PREFIX = "saved_class_v1_";
    const DASHBOARD_HISTORY_PREFIX = "dashboard_history_v1_";
    const DAY = 86400000;

    const statusMeta = {
        triage: { label: "Planejada", className: "gray", workflow: "triage" },
        open: { label: "Aberta", className: "red", workflow: "triage" },
        contacted: { label: "Contato realizado", className: "blue", workflow: "contacted" },
        waiting: { label: "Aguardando estudante", className: "amber", workflow: "waiting" },
        evaluation: { label: "Em avaliação", className: "purple", workflow: "evaluation" },
        closed: { label: "Concluída", className: "green", workflow: "closed" },
        cancelled: { label: "Cancelada", className: "gray", workflow: "closed" }
    };

    const outcomeMeta = {
        pending: { label: "Ainda não avaliado", className: "gray" },
        developed: { label: "Desenvolveu", className: "green" },
        "not-developed": { label: "Não desenvolveu", className: "red" },
        reopened: { label: "Reaberta", className: "purple" }
    };

    const competencyLabels = {
        planejamento: "Planejamento",
        resultados: "Foco em Resultados",
        visao_sistemica: "Visão Sistêmica",
        cliente: "Foco no Cliente",
        comunicacao: "Comunicação",
        problemas: "Solução de Problemas",
        equipe: "Trabalho em Equipe"
    };

    const workflowColumns = [
        { id: "triage", label: "A organizar", tone: "#6b7786" },
        { id: "contacted", label: "Em acompanhamento", tone: "#1976b8" },
        { id: "waiting", label: "Aguardando retorno", tone: "#d17b08" },
        { id: "evaluation", label: "Em avaliação", tone: "#6d3cb4" },
        { id: "closed", label: "Concluída", tone: "#078847" }
    ];
    const ANALYST_NAMES = Array.isArray(window.SENAC_ANALYST_NAMES) ? window.SENAC_ANALYST_NAMES : ["Michel Farias", "Mariana Mello", "Bruna Cunha", "Bianca Aresta"];

    const prototypeData = loadData();
    const state = {
        data: prototypeData,
        view: "overview",
        profileMode: "analyst",
        previewInstructor: prototypeData.classes[0]?.instructor || "",
        recoveryFilter: "all",
        workflowFilter: "all",
        monitoringFilter: "all",
        filters: { instructor: "all", analyst: "all", classId: "all", uc: "all", search: "" },
        draggedWorkflowCard: null,
        classDraft: null
    };

    function isoOffset(days) {
        const date = new Date();
        date.setHours(12, 0, 0, 0);
        date.setDate(date.getDate() + days);
        return date.toISOString().slice(0, 10);
    }

    function buildDefaultData() {
        const data = {
            version: 1,
            classes: [
                {
                    id: "202600001",
                    course: "Aprendizagem Profissional Comercial em Serviços Administrativos",
                    instructor: "Bianca Marcante",
                    start: isoOffset(-164),
                    end: isoOffset(82),
                    currentUc: "UC6",
                    studentsCount: 30,
                    frequency: 93.8,
                    dropouts: 2,
                    status: "active",
                    students: [
                        { id: "s1", name: "Amanda de Sousa Monteiro", email: "amanda.monteiro@aluno.pr.senac.br", orion: "659573" },
                        { id: "s2", name: "Bernardo Todeschini Lovatto", email: "bernardo.lovatto@aluno.pr.senac.br", orion: "658812" },
                        { id: "s3", name: "Bianca Marcante Telles", email: "bianca.telles@aluno.pr.senac.br", orion: "670686" }
                    ],
                    ucs: [
                        { name: "UC5", start: isoOffset(-25), end: isoOffset(-5) },
                        { name: "UC6", start: isoOffset(-4), end: isoOffset(5) },
                        { name: "UC7", start: isoOffset(6), end: isoOffset(28) }
                    ]
                },
                {
                    id: "202600026",
                    course: "Técnico em Administração",
                    instructor: "Bruna Lorena",
                    start: isoOffset(-185),
                    end: isoOffset(118),
                    currentUc: "UC9",
                    studentsCount: 28,
                    frequency: 91.4,
                    dropouts: 1,
                    status: "active",
                    students: [
                        { id: "s4", name: "Maria Clara de Souza Lima", email: "maria.lima@aluno.pr.senac.br", orion: "684102" },
                        { id: "s5", name: "Igor Samuel Ramos de Oliveira", email: "igor.oliveira@aluno.pr.senac.br", orion: "684118" },
                        { id: "s6", name: "Maria Beatriz Viana de Almeida", email: "maria.almeida@aluno.pr.senac.br", orion: "684137" }
                    ],
                    ucs: [
                        { name: "UC8", start: isoOffset(-30), end: isoOffset(-10) },
                        { name: "UC9", start: isoOffset(-9), end: isoOffset(3) },
                        { name: "UC10", start: isoOffset(4), end: isoOffset(29) }
                    ]
                },
                {
                    id: "202600053",
                    course: "Aprendizagem Profissional Comercial em Vendas",
                    instructor: "Jaqueline Vieira",
                    start: isoOffset(-120),
                    end: isoOffset(132),
                    currentUc: "UC4",
                    studentsCount: 26,
                    frequency: 96.2,
                    dropouts: 0,
                    status: "active",
                    students: [
                        { id: "s7", name: "Dailise Lena Giacomelli", email: "dailise.giacomelli@aluno.pr.senac.br", orion: "692201" },
                        { id: "s8", name: "Davi José Silva Cavalheiro", email: "davi.cavalheiro@aluno.pr.senac.br", orion: "692218" }
                    ],
                    ucs: [
                        { name: "UC3", start: isoOffset(-24), end: isoOffset(-6) },
                        { name: "UC4", start: isoOffset(-5), end: isoOffset(7) },
                        { name: "UC5", start: isoOffset(8), end: isoOffset(34) }
                    ]
                },
                {
                    id: "202500369",
                    course: "Técnico em Administração",
                    instructor: "Ana Claudia Hafemann",
                    start: isoOffset(-310),
                    end: isoOffset(45),
                    currentUc: "UC17",
                    studentsCount: 25,
                    frequency: 89.7,
                    dropouts: 3,
                    status: "active",
                    students: [
                        { id: "s9", name: "Ana Júlia Cordeiro Cavalcanti", email: "ana.cavalcanti@aluno.pr.senac.br", orion: "651940" },
                        { id: "s10", name: "João Lucas Pereira", email: "joao.pereira@aluno.pr.senac.br", orion: "651955" }
                    ],
                    ucs: [
                        { name: "UC16", start: isoOffset(-31), end: isoOffset(-12) },
                        { name: "UC17", start: isoOffset(-11), end: isoOffset(6) },
                        { name: "UC18", start: isoOffset(7), end: isoOffset(36) }
                    ]
                }
            ],
            recoveries: [
                { id: "r1", classId: "202600001", studentId: "s1", uc: "UC6", number: 1, reason: "Atividades não concluídas", start: isoOffset(-5), end: isoOffset(2), status: "waiting", outcome: "pending", notes: "Semana 1, Dia 1; Semana 1, Dia 2", assignedTo: "Bianca Marcante", createdBy: "Michel Farias" },
                { id: "r2", classId: "202600001", studentId: "s2", uc: "UC5", number: 1, reason: "Desempenho não desenvolvido", start: isoOffset(-18), end: isoOffset(-6), status: "closed", outcome: "developed", notes: "Atividades refeitas e avaliadas.", assignedTo: "Bianca Marcante", createdBy: "Michel Farias" },
                { id: "r3", classId: "202600026", studentId: "s4", uc: "UC9", number: 2, reason: "Recorrência de pendências", start: isoOffset(-8), end: isoOffset(1), status: "contacted", outcome: "pending", notes: "Semana 2, Dia 3; Semana 3, Dia 1", assignedTo: "Bruna Lorena", createdBy: "Bruna Cunha" },
                { id: "r4", classId: "202600026", studentId: "s5", uc: "UC9", number: 1, reason: "Atividades não concluídas", start: isoOffset(-4), end: isoOffset(5), status: "open", outcome: "pending", notes: "Semana 1, Dia 4", assignedTo: "Bruna Lorena", createdBy: "Mariana" },
                { id: "r5", classId: "202600053", studentId: "s7", uc: "UC3", number: 1, reason: "Frequência abaixo do mínimo", start: isoOffset(-28), end: isoOffset(-12), status: "closed", outcome: "not-developed", notes: "Contato registrado com estudante e supervisor.", assignedTo: "Jaqueline Vieira", createdBy: "Michel Farias" },
                { id: "r6", classId: "202600053", studentId: "s8", uc: "UC4", number: 1, reason: "Desempenho não desenvolvido", start: isoOffset(-3), end: isoOffset(7), status: "evaluation", outcome: "pending", notes: "Aguardando avaliação final do instrutor.", assignedTo: "Jaqueline Vieira", createdBy: "Juliana Severo" },
                { id: "r7", classId: "202500369", studentId: "s9", uc: "UC17", number: 3, reason: "Recorrência de pendências", start: isoOffset(-7), end: isoOffset(-1), status: "waiting", outcome: "reopened", notes: "Terceira recuperação aberta para a estudante.", assignedTo: "Ana Claudia Hafemann", createdBy: "Michel Farias" },
                { id: "r8", classId: "202500369", studentId: "s10", uc: "UC16", number: 1, reason: "Atividades não concluídas", start: isoOffset(-25), end: isoOffset(-14), status: "closed", outcome: "developed", notes: "Concluída dentro do prazo.", assignedTo: "Ana Claudia Hafemann", createdBy: "Michel Farias" }
            ],
            analystNotes: [
                { id: "n1", classId: "202600001", instructor: "Bianca Marcante", date: isoOffset(-18), type: "Elogio", subject: "Organização das devolutivas", notes: "As devolutivas aos estudantes foram registradas com clareza e dentro do período previsto.", competency: "Comunicação e acompanhamento", evaluationPercent: 92, author: "Michel Farias", status: "Concluído" },
                { id: "n2", classId: "202600001", instructor: "Bianca Marcante", date: isoOffset(-4), type: "Plano de ação", subject: "Recuperações antes do término da UC", notes: "Antecipar o contato com os estudantes que permanecem com atividades pendentes e registrar o retorno no caderno.", competency: "Planejamento", evaluationPercent: 74, author: "Mariana", status: "Em acompanhamento" },
                { id: "n3", classId: "202600026", instructor: "Bruna Lorena", date: isoOffset(-12), type: "Ponto de atenção", subject: "Prazo das avaliações", notes: "Revisar as atividades que permanecem como requer avaliação antes do fechamento da UC9.", competency: "Gestão pedagógica", evaluationPercent: 68, author: "Bruna Cunha", status: "Em acompanhamento" },
                { id: "n4", classId: "202600026", instructor: "Bruna Lorena", date: isoOffset(-2), type: "Orientação", subject: "Registro dos contatos", notes: "Manter no caderno os contatos realizados com estudantes em recuperação, incluindo data, retorno e encaminhamento.", competency: "Documentação e acompanhamento", evaluationPercent: 80, author: "Michel Farias", status: "Aberto" },
                { id: "n5", classId: "202600053", instructor: "Jaqueline Vieira", date: isoOffset(-7), type: "Elogio", subject: "Acompanhamento individual", notes: "Boa organização das tratativas individuais e retorno consistente aos estudantes e supervisores.", competency: "Relacionamento", evaluationPercent: 95, author: "Juliana Severo", status: "Concluído" },
                { id: "n6", classId: "202500369", instructor: "Ana Claudia Hafemann", date: isoOffset(-3), type: "Plano de ação", subject: "Redução de reincidências", notes: "Estruturar uma ação preventiva para estudantes que chegaram à segunda recuperação na mesma etapa do curso.", competency: "Planejamento", evaluationPercent: 72, author: "Michel Farias", status: "Em acompanhamento" }
            ]
        };

        const monitoringDefaults = {
            "202600001": {
                rows: [
                    ["UC5", 12, 12, 0, 0, 0, 28, 1, 0, 1, 29, "launched", -7],
                    ["UC6", 10, 8, 1, 1, 4, 21, 3, 2, 4, 23, "partial", -1],
                    ["UC7", 0, 0, 0, 0, 0, 0, 0, 0, 30, 0, "pending", null],
                    ["PI", 0, 0, 0, 0, 0, 18, 2, 3, 7, 20, "pending", -2]
                ]
            },
            "202600026": {
                rows: [
                    ["UC8", 14, 14, 0, 0, 0, 25, 1, 0, 2, 26, "launched", -12],
                    ["UC9", 12, 9, 2, 1, 6, 17, 4, 3, 4, 20, "pending", -1],
                    ["UC10", 0, 0, 0, 0, 0, 0, 0, 0, 28, 0, "pending", null],
                    ["PI", 0, 0, 0, 0, 0, 16, 3, 2, 7, 18, "partial", -3]
                ]
            },
            "202600053": {
                rows: [
                    ["UC3", 10, 10, 0, 0, 0, 24, 1, 0, 1, 25, "launched", -8],
                    ["UC4", 9, 8, 1, 0, 2, 22, 1, 1, 2, 23, "partial", -1],
                    ["UC5", 0, 0, 0, 0, 0, 0, 0, 0, 26, 0, "pending", null],
                    ["PI", 0, 0, 0, 0, 0, 21, 1, 1, 3, 22, "pending", -2]
                ]
            },
            "202500369": {
                rows: [
                    ["UC16", 16, 15, 0, 1, 2, 21, 2, 0, 2, 23, "partial", -14],
                    ["UC17", 13, 10, 2, 1, 7, 14, 3, 4, 4, 16, "pending", -1],
                    ["UC18", 0, 0, 0, 0, 0, 0, 0, 0, 25, 0, "pending", null],
                    ["PI", 0, 0, 0, 0, 0, 12, 2, 3, 8, 15, "pending", -2]
                ]
            }
        };

        data.classes.forEach(classItem => {
            const config = monitoringDefaults[classItem.id];
            classItem.monitoring = config.rows.map(row => ({
                uc: row[0],
                attendance: { expectedDays: row[1], completedDays: row[2], openDays: row[3], incompleteDays: row[4], pendingEntries: row[5] },
                practice: { totalStudents: classItem.studentsCount, completed: row[6], notCompleted: row[7], requiresEvaluation: row[8], blank: row[9], capturedAt: row[12] === null ? null : isoOffset(row[12]) },
                correction: { total: classItem.studentsCount, corrected: row[10], pending: Math.max(0, classItem.studentsCount - row[10]) },
                orion: { status: row[11], updatedAt: row[11] === "launched" ? isoOffset((row[12] || -1) + 1) : row[11] === "partial" ? isoOffset(row[12] || -1) : null, updatedBy: row[11] === "pending" ? null : classItem.instructor, notes: "" },
                alertCreated: false,
                alertCreatedAt: null
            }));
        });

        return data;
    }

    function loadData() {
        if (window.SENAC_CENTRAL_INITIAL_DATA) return JSON.parse(JSON.stringify(window.SENAC_CENTRAL_INITIAL_DATA));
        try {
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (stored && Array.isArray(stored.classes) && Array.isArray(stored.recoveries)) {
                const defaults = buildDefaultData();
                let migrated = false;
                if (!Array.isArray(stored.analystNotes)) {
                    stored.analystNotes = defaults.analystNotes;
                    migrated = true;
                }
                stored.classes.forEach(classItem => {
                    const fallback = defaults.classes.find(item => item.id === classItem.id);
                    if (Object.prototype.hasOwnProperty.call(classItem, "analyst")) { delete classItem.analyst; migrated = true; }
                    if (!Array.isArray(classItem.monitoring) && fallback) { classItem.monitoring = fallback.monitoring; migrated = true; }
                });
                stored.analystNotes.forEach(note => {
                    const fallback = defaults.analystNotes.find(item => item.id === note.id);
                    if (!note.classId && fallback?.classId) { note.classId = fallback.classId; migrated = true; }
                });
                if (migrated) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
                }
                return mergeInstructorClasses(stored);
            }
        } catch (error) {
            console.warn("Não foi possível ler a cópia local da Central.", error);
        }
        const defaults = buildDefaultData();
        mergeInstructorClasses(defaults);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
        return defaults;
    }

    function readLocalJSON(key, fallback) {
        try {
            const value = JSON.parse(localStorage.getItem(key) || "null");
            return value === null ? fallback : value;
        } catch (error) {
            console.warn(`Não foi possível ler ${key}.`, error);
            return fallback;
        }
    }

    function externalClassKey(value) {
        return String(value || "TURMA_DESCONHECIDA").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    }

    function validExternalName(value) {
        const text = String(value || "").trim();
        return text && !/^(não identificado|nao identificado|instrutor|tutor)$/i.test(text) ? text : "";
    }

    function ucOrder(value) {
        if (String(value).toUpperCase() === "PI") return 999;
        return Number(String(value).replace(/\D/g, "")) || 0;
    }

    function importedUcDates(ucNames, currentIndex) {
        return ucNames.map((name, index) => {
            const distance = index - currentIndex;
            return { name, start: isoOffset(distance * 21 - 10), end: isoOffset(distance * 21 + 10) };
        });
    }

    function buildImportedClass(summary, fullData) {
        const rawClassId = String(fullData.turma || summary.turma || summary.turmaKey || "");
        const classId = (rawClassId.match(/\d{9}/) || [summary.turmaKey || externalClassKey(rawClassId)])[0];
        const instructors = [...new Set([...(Array.isArray(fullData.instructors) ? fullData.instructors : []), fullData.tutor1, fullData.tutor2, ...(Array.isArray(summary.instructors) ? summary.instructors : [])].map(validExternalName).filter(Boolean))];
        const studentsSource = Array.isArray(fullData.students) ? fullData.students : [];
        const students = studentsSource.map((student, index) => ({
            id: String(student.id ?? `imported-${index + 1}`),
            name: String(student.name || `Aluno ${index + 1}`),
            email: String(student.studentEmail || ""),
            orion: String(student.orionCode || student.orion || "")
        }));
        const detectedUcs = [...new Set([...(Array.isArray(fullData.ucs) ? fullData.ucs : []), ...studentsSource.flatMap(student => Object.keys(student.uc_scores || {}))].map(value => String(value).toUpperCase()).filter(value => /^UC\d+$|^PI$/.test(value)))].sort((a, b) => ucOrder(a) - ucOrder(b));
        const scoredUcs = detectedUcs.filter(uc => studentsSource.some(student => student.uc_scores && student.uc_scores[uc]));
        const currentUc = scoredUcs.at(-1) || detectedUcs[0] || "UC1";
        const currentIndex = Math.max(0, detectedUcs.indexOf(currentUc));
        const ucs = importedUcDates(detectedUcs.length ? detectedUcs : [currentUc], currentIndex);
        const historyKey = `${DASHBOARD_HISTORY_PREFIX}${summary.turmaKey || externalClassKey(rawClassId)}`;
        const history = readLocalJSON(historyKey, []);
        const latest = Array.isArray(history) ? [...history].sort((a, b) => new Date(b.capturedAt || 0) - new Date(a.capturedAt || 0))[0] : null;
        const latestStudents = Object.values(latest?.students || {});
        const warnings = Array.isArray(fullData.attendanceWarnings) ? fullData.attendanceWarnings : [];
        const monitoring = ucs.map(uc => {
            const activityRows = latestStudents.map(student => student.activityByUC?.[uc.name]).filter(Boolean);
            const ucWarnings = warnings.filter(warning => JSON.stringify(warning).toUpperCase().includes(uc.name));
            const pendingStudents = new Set(ucWarnings.flatMap(warning => Array.isArray(warning.pendingStudents) ? warning.pendingStudents.map(String) : [])).size;
            const capturedAt = activityRows.length ? String(latest?.capturedAt || "").slice(0, 10) : null;
            const completed = activityRows.filter(item => Number(item.total || 0) > 0 && Number(item.pending || 0) === 0).length;
            const notCompleted = activityRows.filter(item => Number(item.notCompleted || 0) > 0).length;
            const requiresEvaluation = activityRows.filter(item => Number(item.requiresEvaluation || 0) > 0).length;
            const blank = activityRows.filter(item => Number(item.blank || 0) > 0).length;
            return {
                uc: uc.name,
                attendance: { expectedDays: ucWarnings.length, completedDays: 0, openDays: ucWarnings.length, incompleteDays: 0, pendingEntries: pendingStudents },
                practice: { totalStudents: students.length, completed, notCompleted, requiresEvaluation, blank, capturedAt },
                correction: { total: activityRows.length, corrected: completed, pending: Math.max(0, activityRows.length - completed) },
                orion: { status: "pending", updatedAt: null, updatedBy: null, notes: "" },
                alertCreated: false,
                alertCreatedAt: null
            };
        });
        const activeStudents = studentsSource.filter(student => !student.is_dropout && !student.is_process_dropout);
        const frequencyValues = activeStudents.map(student => Number(student.averageFreq)).filter(Number.isFinite);
        return {
            id: classId,
            course: String(fullData.course || summary.course || "Curso não identificado"),
            instructor: instructors[0] || "Instrutor não identificado",
            start: ucs[0]?.start || isoOffset(-30),
            end: ucs.at(-1)?.end || isoOffset(180),
            currentUc,
            studentsCount: students.length || Number(summary.studentCount || 0),
            frequency: frequencyValues.length ? Number((frequencyValues.reduce((sum, value) => sum + value, 0) / frequencyValues.length).toFixed(1)) : 0,
            dropouts: studentsSource.filter(student => student.is_dropout).length,
            status: "active",
            students,
            ucs,
            monitoring,
            importedFromInstructor: true,
            sourceUpdatedAt: summary.updatedAt || null
        };
    }

    function mergeInstructorClasses(data) {
        const index = readLocalJSON(SAVED_CLASSES_INDEX_KEY, []);
        if (!Array.isArray(index) || !index.length) return data;
        const merged = new Map((data.classes || []).map(classItem => [classItem.id, classItem]));
        index.forEach(summary => {
            const key = summary.turmaKey || externalClassKey(summary.turma);
            const fullData = readLocalJSON(`${SAVED_CLASS_DATA_PREFIX}${key}`, null);
            if (!fullData) return;
            const imported = buildImportedClass(summary, fullData);
            const previous = merged.get(imported.id);
            if (previous) {
                imported.start = previous.start || imported.start;
                imported.end = previous.end || imported.end;
                imported.ucs = imported.ucs.map(uc => previous.ucs?.find(item => item.name === uc.name) || uc);
                imported.monitoring = imported.monitoring.map(record => {
                    const oldRecord = previous.monitoring?.find(item => item.uc === record.uc);
                    return oldRecord ? { ...record, orion: oldRecord.orion || record.orion } : record;
                });
            }
            merged.set(imported.id, imported);
        });
        data.classes = [...merged.values()];
        return data;
    }

    function saveData(message) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
        if (typeof window.SENAC_CENTRAL_PERSIST === "function") window.SENAC_CENTRAL_PERSIST(state.data);
        if (message) showToast(message);
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
    }

    function parseDate(value) {
        if (!value) return null;
        const [year, month, day] = value.split("-").map(Number);
        return new Date(year, month - 1, day, 12, 0, 0, 0);
    }

    function formatDate(value) {
        const date = parseDate(value);
        return date ? date.toLocaleDateString("pt-BR") : "Não informado";
    }

    function daysUntil(value) {
        const target = parseDate(value);
        if (!target) return 9999;
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        return Math.round((target - today) / DAY);
    }

    function plural(value, singular, pluralText) {
        return `${value} ${value === 1 ? singular : pluralText}`;
    }

    function getClass(classId) {
        return state.data.classes.find(item => item.id === classId);
    }

    function getStudent(recovery) {
        const classItem = getClass(recovery.classId);
        return classItem?.students.find(student => student.id === recovery.studentId);
    }

    function isOpen(recovery) {
        return !["closed", "cancelled"].includes(recovery.status);
    }

    function isCritical(recovery) {
        return isOpen(recovery) && daysUntil(recovery.end) <= 7;
    }

    function dueLabel(value) {
        const days = daysUntil(value);
        if (days < 0) return `Vencida há ${Math.abs(days)} dia${Math.abs(days) === 1 ? "" : "s"}`;
        if (days === 0) return "Vence hoje";
        return `Em ${days} dia${days === 1 ? "" : "s"}`;
    }

    function matchesSearch(values) {
        const query = normalize(state.filters.search);
        if (!query) return true;
        return values.some(value => normalize(value).includes(query));
    }

    function normalize(value) {
        return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    }

    function canonicalAnalyst(value) {
        const normalized = normalize(value);
        const exact = ANALYST_NAMES.find(name => normalize(name) === normalized);
        if (exact) return exact;
        if (normalized.includes("bruna") && normalized.includes("cunha")) return ANALYST_NAMES.find(name => normalize(name).includes("bruna") && normalize(name).includes("cunha")) || null;
        return ANALYST_NAMES.find(name => {
            const firstName = normalize(name).split(/\s+/)[0];
            return firstName && normalized.split(/\s+/)[0] === firstName;
        }) || null;
    }

    function currentAnalystName() {
        return window.SENAC_CENTRAL_USER?.name || ANALYST_NAMES[0] || "Analista";
    }

    function instructorNamesForClass(classItem) {
        const names = Array.isArray(classItem?.instructors) ? classItem.instructors : [];
        return [...new Set([...names, classItem?.instructor].map(value => String(value || "").trim()).filter(Boolean))];
    }

    function instructorLabel(classItem) {
        return instructorNamesForClass(classItem).join(" / ") || "Instrutor não identificado";
    }

    function analystActivities() {
        const activities = [];
        state.data.recoveries.forEach(recovery => {
            const analyst = canonicalAnalyst(recovery.createdBy);
            if (analyst) activities.push({ analyst, classId: recovery.classId, uc: recovery.uc, type: "Recuperação", active: isOpen(recovery), date: recovery.start, sourceId: recovery.id });
        });
        (state.data.analystNotes || []).forEach(note => {
            const analyst = canonicalAnalyst(note.author);
            const classIds = note.classId ? [note.classId] : state.data.classes.filter(item => instructorNamesForClass(item).includes(note.instructor)).map(item => item.id);
            if (analyst) classIds.forEach(classId => activities.push({ analyst, classId, uc: note.uc || null, type: note.type || "Caderno do Analista", active: analystNoteWorkflow(note) !== "closed", date: note.date, sourceId: note.id }));
        });
        state.data.classes.forEach(classItem => (classItem.monitoring || []).forEach(record => {
            const analyst = canonicalAnalyst(record.orion.updatedBy);
            if (analyst) activities.push({ analyst, classId: classItem.id, uc: record.uc, type: "Atualização do Órion", active: record.orion.status !== "launched", date: record.orion.updatedAt, sourceId: `${classItem.id}-${record.uc}-orion` });
        }));
        return activities;
    }

    function analystsForClass(classId) {
        return [...new Set(analystActivities().filter(item => item.classId === classId).map(item => item.analyst))];
    }

    function analystClassLabel(classId) {
        const analysts = analystsForClass(classId);
        return analysts.length ? analysts.join(", ") : "Sem registro de analista";
    }

    function filteredClasses() {
        const effectiveInstructor = state.profileMode === "instructor" ? state.previewInstructor : state.filters.instructor;
        return state.data.classes.filter(classItem => {
            const instructorOk = effectiveInstructor === "all" || instructorNamesForClass(classItem).includes(effectiveInstructor);
            const analystOk = state.profileMode === "instructor" || state.filters.analyst === "all" || analystsForClass(classItem.id).includes(state.filters.analyst);
            const classOk = state.filters.classId === "all" || classItem.id === state.filters.classId;
            const ucOk = state.filters.uc === "all" || classItem.ucs.some(uc => uc.name === state.filters.uc) || classItem.monitoring?.some(item => item.uc === state.filters.uc);
            const searchOk = matchesSearch([classItem.id, classItem.course, ...instructorNamesForClass(classItem), ...analystsForClass(classItem.id), ...classItem.students.flatMap(student => [student.name, student.orion])]);
            return instructorOk && analystOk && classOk && ucOk && searchOk;
        });
    }

    function filteredRecoveries() {
        const allowedClasses = new Set(filteredClasses().map(item => item.id));
        return state.data.recoveries.filter(recovery => {
            const student = getStudent(recovery);
            const ucOk = state.filters.uc === "all" || recovery.uc === state.filters.uc;
            const searchOk = matchesSearch([recovery.classId, recovery.uc, recovery.reason, student?.name, student?.orion]);
            return allowedClasses.has(recovery.classId) && ucOk && searchOk;
        });
    }

    function filteredAnalystNotes() {
        const allowedClasses = new Set(filteredClasses().map(item => item.id));
        return (state.data.analystNotes || []).filter(note => {
            const analystOk = state.profileMode === "instructor" || state.filters.analyst === "all" || canonicalAnalyst(note.author) === state.filters.analyst;
            const classOk = !note.classId || allowedClasses.has(note.classId);
            const instructorOk = state.profileMode !== "instructor" || note.instructor === state.previewInstructor;
            const ucOk = state.filters.uc === "all" || !note.uc || note.uc === state.filters.uc;
            const searchOk = matchesSearch([note.classId, note.instructor, note.author, note.type, note.subject, note.notes, note.competency]);
            return analystOk && classOk && instructorOk && ucOk && searchOk;
        });
    }

    function analystNoteWorkflow(note) {
        if (!note.trackingEnabled) return "triage";
        if (["resolvido", "suspenso", "cancelado"].includes(note.trackingStatus)) return "closed";
        if (note.trackingStatus === "aguardando_retorno") return "waiting";
        if (note.trackingStatus === "em_avaliacao") return "evaluation";
        return "contacted";
    }

    function analystTrackingLabel(note) {
        if (!note.trackingEnabled) return "A organizar";
        return ({
            em_acompanhamento: "Em acompanhamento",
            aguardando_retorno: "Aguardando retorno",
            em_avaliacao: "Em avaliação",
            resolvido: "Resolvido",
            suspenso: "Suspenso",
            cancelado: "Cancelado"
        })[note.trackingStatus] || "Em acompanhamento";
    }

    function analystCompetencyLabel(value) {
        return competencyLabels[value] || String(value || "").replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase());
    }

    function canEditAnalystNote(note) {
        return String(note.ownerEmail || "").toLowerCase() === String(window.SENAC_CENTRAL_USER?.email || "").toLowerCase();
    }

    function isAnalystNoteCritical(note) {
        return analystNoteWorkflow(note) !== "closed" && Boolean(note.reminderDate) && daysUntil(note.reminderDate) <= 7;
    }

    function refreshIcons() {
        if (window.lucide?.createIcons) window.lucide.createIcons();
    }

    function showToast(message) {
        const toast = document.getElementById("toast");
        toast.textContent = message;
        toast.classList.add("show");
        clearTimeout(showToast.timer);
        showToast.timer = setTimeout(() => toast.classList.remove("show"), 3200);
    }

    function badge(label, className) {
        return `<span class="badge ${className}">${escapeHTML(label)}</span>`;
    }

    function renderFilterOptions() {
        const instructorSelect = document.getElementById("instructorFilter");
        const analystSelect = document.getElementById("analystFilter");
        const classSelect = document.getElementById("classFilter");
        const ucSelect = document.getElementById("ucFilter");
        const previewSelect = document.getElementById("previewInstructor");
        const instructors = [...new Set(state.data.classes.flatMap(instructorNamesForClass))].sort((a, b) => a.localeCompare(b, "pt-BR"));
        const analysts = [...new Set(ANALYST_NAMES)].sort((a, b) => a.localeCompare(b, "pt-BR"));
        const ucs = [...new Set(state.data.classes.flatMap(item => [...item.ucs.map(uc => uc.name), ...(item.monitoring || []).map(row => row.uc)]))].sort((a, b) => a === "PI" ? 1 : b === "PI" ? -1 : Number(a.replace(/\D/g, "")) - Number(b.replace(/\D/g, "")));
        const availableClasses = state.profileMode === "instructor" ? state.data.classes.filter(item => item.instructor === state.previewInstructor) : state.data.classes;

        instructorSelect.innerHTML = `<option value="all">Todos os instrutores</option>${instructors.map(name => `<option value="${escapeHTML(name)}">${escapeHTML(name)}</option>`).join("")}`;
        analystSelect.innerHTML = `<option value="all">Todos os analistas</option>${analysts.map(name => `<option value="${escapeHTML(name)}">${escapeHTML(name)}</option>`).join("")}`;
        previewSelect.innerHTML = instructors.map(name => `<option value="${escapeHTML(name)}">${escapeHTML(name)}</option>`).join("");
        classSelect.innerHTML = `<option value="all">${state.profileMode === "instructor" ? "Todas as minhas turmas" : "Todas as turmas"}</option>${availableClasses.map(item => `<option value="${item.id}">${item.id}</option>`).join("")}`;
        ucSelect.innerHTML = `<option value="all">Todas as UCs</option>${ucs.map(uc => `<option value="${uc}">${uc}</option>`).join("")}`;
        instructorSelect.value = state.profileMode === "instructor" ? state.previewInstructor : state.filters.instructor;
        analystSelect.value = state.filters.analyst;
        previewSelect.value = state.previewInstructor;
        classSelect.value = state.filters.classId;
        ucSelect.value = state.filters.uc;
    }

    function renderProfileMode() {
        const instructorMode = state.profileMode === "instructor";
        document.querySelectorAll("[data-profile-mode]").forEach(button => {
            const active = button.dataset.profileMode === state.profileMode;
            button.classList.toggle("active", active);
            button.setAttribute("aria-pressed", String(active));
        });
        document.getElementById("previewInstructor").hidden = !instructorMode;
        document.getElementById("profileRoleLabel").textContent = instructorMode ? "Analista em visão de instrutor" : "Perfil Analista";
        document.getElementById("instructorContext").hidden = !instructorMode;
        document.getElementById("instructorContextTitle").textContent = `Visualizando como ${state.previewInstructor}`;
        document.getElementById("instructorFilter").closest("label").hidden = instructorMode;
        document.getElementById("analystFilter").closest("label").hidden = instructorMode;
        document.getElementById("instructorNotesPreview").hidden = !instructorMode;
        document.querySelectorAll(".instructor-only").forEach(element => { element.hidden = !instructorMode; });
        document.querySelectorAll(".analyst-only").forEach(element => { element.hidden = instructorMode; });
        document.getElementById("overviewNavLabel").textContent = instructorMode ? "Minha visão" : "Visão geral";
        document.getElementById("classesNavLabel").textContent = instructorMode ? "Minhas turmas" : "Turmas";
        document.getElementById("reportsNavLabel").textContent = instructorMode ? "Meus relatórios" : "Relatórios";
        document.getElementById("monitoringNavLabel").textContent = instructorMode ? "Minha rotina" : "Monitoramento";
        document.getElementById("monitoringEyebrow").textContent = instructorMode ? "Rotina da chamada" : "Gestão da chamada";
        document.getElementById("monitoringTitle").textContent = instructorMode ? `Monitoramento de ${state.previewInstructor}` : "Monitoramento acadêmico global";
        document.getElementById("monitoringDescription").textContent = instructorMode ? "Pendências e entregas limitadas às turmas do instrutor visualizado." : "Situação de frequência, atividades, recuperação e lançamento no Órion.";
        document.getElementById("overviewEyebrow").textContent = instructorMode ? "Visão operacional" : "Panorama compartilhado";
        document.getElementById("overviewTitle").textContent = instructorMode ? `Acompanhamento de ${state.previewInstructor}` : "Acompanhamento das turmas";
        document.getElementById("overviewDescription").textContent = instructorMode ? "Somente turmas, estudantes e tratativas disponíveis para este instrutor." : "Dados consolidados das chamadas abertas pelos instrutores.";
        document.getElementById("reportsEyebrow").textContent = instructorMode ? "Desempenho das minhas turmas" : "Gestão e qualidade";
        document.getElementById("reportsTitle").textContent = instructorMode ? `Relatórios de ${state.previewInstructor}` : "Relatório global do analista";
        document.getElementById("reportsDescription").textContent = instructorMode ? "Indicadores limitados às turmas do instrutor visualizado." : "Comparativos por instrutor, turma, UC, motivo e resultado.";
    }

    function noteTone(type) {
        if (type === "Elogio") return { tone: "#078847", badge: "green" };
        if (type === "Ponto de atenção") return { tone: "#c62828", badge: "red" };
        if (type === "Plano de ação") return { tone: "#d17b08", badge: "amber" };
        return { tone: "#004a8d", badge: "blue" };
    }

    function instructorNoteCard(note) {
        const meta = noteTone(note.type);
        const statusLabel = analystTrackingLabel(note);
        return `<article class="note-card" style="--note-tone:${meta.tone}"><header><div>${badge(note.type, meta.badge)}<h4>${escapeHTML(note.subject)}</h4></div><time>${formatDate(note.date)}</time></header><p>${escapeHTML(note.notes)}</p><div class="note-meta">${note.competency ? badge(analystCompetencyLabel(note.competency), "blue") : ""}${badge(statusLabel, analystNoteWorkflow(note) === "closed" ? "green" : "amber")}<span class="badge gray">Analista: ${escapeHTML(note.author)}</span></div><div class="note-confidential"><i data-lucide="shield-check"></i> A avaliação interna do analista não é exibida nesta visualização.</div></article>`;
    }

    function renderInstructorNotes() {
        const notes = state.profileMode === "instructor" ? state.data.analystNotes.filter(note => note.instructor === state.previewInstructor).sort((a, b) => parseDate(b.date) - parseDate(a.date)) : [];
        document.getElementById("notesNavCount").textContent = notes.length;
        document.getElementById("instructorNotesPreviewList").innerHTML = notes.length ? notes.slice(0, 3).map(instructorNoteCard).join("") : `<div class="empty-state">Nenhuma anotação compartilhada para este instrutor.</div>`;
        document.getElementById("instructorNotesList").innerHTML = notes.length ? notes.map(instructorNoteCard).join("") : `<div class="empty-state">Nenhuma anotação compartilhada para este instrutor.</div>`;
        const open = notes.filter(note => analystNoteWorkflow(note) !== "closed").length;
        const praise = notes.filter(note => note.type === "Elogio").length;
        const plans = notes.filter(note => note.type === "Plano de ação").length;
        document.getElementById("notesSummary").innerHTML = [
            { label: "Registros recebidos", value: notes.length, tone: "#004a8d" },
            { label: "Em acompanhamento", value: open, tone: "#d17b08" },
            { label: "Elogios", value: praise, tone: "#078847" },
            { label: "Planos de ação", value: plans, tone: "#6d3cb4" }
        ].map(item => `<article style="--tone:${item.tone}"><span>${item.label}</span><strong>${item.value}</strong></article>`).join("");
    }

    function renderAlertStrip() {
        const recoveries = filteredRecoveries();
        const critical = recoveries.filter(isCritical);
        const endingUcs = filteredClasses().flatMap(classItem => classItem.ucs.map(uc => ({ ...uc, classItem }))).filter(item => daysUntil(item.end) >= 0 && daysUntil(item.end) <= 7);
        const academicAlerts = filteredMonitoringRows().filter(item => monitoringTiming(item.classItem, item.record) !== "future" && monitoringAttentionReasons(item.classItem, item.record).length > 0);
        document.getElementById("alertTitle").textContent = `${critical.length} recuperação(ões) e ${academicAlerts.length} ponto(s) acadêmico(s) exigem atenção`;
        document.getElementById("alertText").textContent = `${endingUcs.length} UC(s) terminam nos próximos sete dias. ${critical.filter(item => daysUntil(item.end) < 0).length} tratativa(s) estão vencidas. Consulte o Monitoramento para frequência, atividades e Órion.`;
    }

    function metricCard(title, value, note, icon, tone) {
        return `<article class="metric-card" style="--tone:${tone}"><header><span>${escapeHTML(title)}</span><i data-lucide="${icon}"></i></header><strong>${escapeHTML(value)}</strong><p>${note}</p></article>`;
    }

    function renderMetrics() {
        const classes = filteredClasses();
        const recoveries = filteredRecoveries();
        const open = recoveries.filter(isOpen);
        const critical = recoveries.filter(isCritical);
        const closed = recoveries.filter(item => item.status === "closed");
        const developed = closed.filter(item => item.outcome === "developed").length;
        const successRate = closed.length ? Math.round(developed / closed.length * 100) : 0;
        const dropouts = classes.reduce((sum, item) => sum + item.dropouts, 0);
        document.getElementById("metrics").innerHTML = [
            metricCard("Turmas ativas", classes.length, `<b>${classes.reduce((sum, item) => sum + item.studentsCount, 0)}</b> estudantes acompanhados`, "school", "#004a8d"),
            metricCard("Recuperações abertas", open.length, `<b>${recoveries.length}</b> registros no período`, "book-open-check", "#f58220"),
            metricCard("Prazo crítico", critical.length, `<b>${critical.filter(item => daysUntil(item.end) < 0).length}</b> vencidas`, "alarm-clock", "#c62828"),
            metricCard("Efetividade", `${successRate}%`, `<b>${developed}</b> concluídas com desenvolvimento`, "trending-up", "#078847"),
            metricCard("Desligamentos", dropouts, `Consolidados nas turmas filtradas`, "user-minus", "#6d3cb4")
        ].join("");
    }

    function renderInstructorChart() {
        const recoveries = filteredRecoveries();
        const instructors = [...new Set(filteredClasses().flatMap(instructorNamesForClass))];
        const chartData = instructors.map(name => {
            const items = recoveries.filter(item => getClass(item.classId)?.instructor === name);
            return { name, open: items.filter(isOpen).length, closed: items.filter(item => item.status === "closed").length };
        });
        const max = Math.max(1, ...chartData.flatMap(item => [item.open, item.closed]));
        document.getElementById("instructorChart").innerHTML = chartData.length ? chartData.map(item => `
            <div class="bar-group" title="${escapeHTML(item.name)}">
                <div class="bar" style="height:${Math.max(3, item.open / max * 175)}px"><em>${item.open}</em></div>
                <div class="bar closed" style="height:${Math.max(3, item.closed / max * 175)}px"><em>${item.closed}</em></div>
                <label>${escapeHTML(item.name.split(" ")[0])}</label>
            </div>`).join("") : `<div class="empty-state">Nenhum dado para os filtros escolhidos.</div>`;
    }

    function renderPriorityList() {
        const priorities = filteredRecoveries().filter(isCritical).sort((a, b) => daysUntil(a.end) - daysUntil(b.end)).slice(0, 5);
        document.getElementById("priorityList").innerHTML = priorities.length ? priorities.map(recovery => {
            const student = getStudent(recovery);
            const overdue = daysUntil(recovery.end) < 0;
            return `<article class="priority-item"><span class="priority-dot" style="--tone:${overdue ? "#c62828" : "#d17b08"}"></span><div><strong>${escapeHTML(student?.name || "Aluno")}</strong><p>${recovery.classId} · ${recovery.uc} · Recuperação ${recovery.number}</p></div><time style="--tone:${overdue ? "#c62828" : "#a85d00"}">${dueLabel(recovery.end)}</time></article>`;
        }).join("") : `<div class="empty-state">Nenhuma prioridade para os filtros escolhidos.</div>`;
    }

    function classRecoveryCounts(classId) {
        const items = state.data.recoveries.filter(recovery => recovery.classId === classId);
        return { open: items.filter(isOpen).length, total: items.length, critical: items.filter(isCritical).length };
    }

    function renderAttentionClasses() {
        const classes = filteredClasses().map(classItem => ({ classItem, counts: classRecoveryCounts(classItem.id) })).sort((a, b) => b.counts.critical - a.counts.critical).slice(0, 5);
        document.getElementById("attentionClasses").innerHTML = classes.length ? classes.map(({ classItem, counts }) => `
            <tr><td><span class="cell-main">${classItem.id}</span><span class="cell-sub">${escapeHTML(classItem.course)}</span></td><td>${escapeHTML(instructorLabel(classItem))}</td><td>${badge(classItem.currentUc, "blue")}</td><td><strong>${counts.open}</strong> abertas de ${counts.total}</td><td>${counts.critical ? badge(`${counts.critical} críticas`, "red") : badge("Em dia", "green")}</td><td><div class="progress-inline"><i style="--progress:${classItem.frequency}%;--tone:${classItem.frequency < 90 ? "#c62828" : "#078847"}"></i><strong>${classItem.frequency.toFixed(1)}%</strong></div></td><td><button class="icon-button table-action" data-edit-class="${classItem.id}" title="Abrir turma"><i data-lucide="chevron-right"></i></button></td></tr>`).join("") : `<tr><td colspan="7" class="empty-state">Nenhuma turma encontrada.</td></tr>`;
    }

    function renderClassesTable() {
        const classes = filteredClasses();
        document.getElementById("classesTable").innerHTML = classes.length ? classes.map(classItem => {
            const counts = classRecoveryCounts(classItem.id);
            return `<tr><td><span class="cell-main">${classItem.id}</span><span class="cell-sub">${escapeHTML(classItem.course)}</span></td><td>${escapeHTML(instructorLabel(classItem))}</td><td><span class="cell-main">${formatDate(classItem.start)} a ${formatDate(classItem.end)}</span><span class="cell-sub">Datas editáveis</span></td><td>${badge(classItem.currentUc, "blue")}</td><td>${classItem.studentsCount}</td><td><span class="cell-main">${counts.open} abertas</span><span class="cell-sub">${counts.total} no histórico</span></td><td>${counts.critical ? badge("Atenção", "red") : badge("Regular", "green")}</td><td><button class="secondary-button" data-edit-class="${classItem.id}"><i data-lucide="calendar-range"></i> Datas e UCs</button></td></tr>`;
        }).join("") : `<tr><td colspan="8" class="empty-state">Nenhuma turma encontrada.</td></tr>`;
    }

    function recoveryMatchesSegment(recovery) {
        if (state.recoveryFilter === "open") return isOpen(recovery);
        if (state.recoveryFilter === "critical") return isCritical(recovery);
        if (state.recoveryFilter === "closed") return recovery.status === "closed";
        return true;
    }

    function renderRecoverySegments() {
        const recoveries = filteredRecoveries();
        const counts = { all: recoveries.length, open: recoveries.filter(isOpen).length, critical: recoveries.filter(isCritical).length, closed: recoveries.filter(item => item.status === "closed").length };
        document.querySelectorAll("[data-recovery-filter]").forEach(button => {
            const key = button.dataset.recoveryFilter;
            button.classList.toggle("active", key === state.recoveryFilter);
            button.querySelector("span").textContent = counts[key];
        });
        document.getElementById("recoveryNavCount").textContent = counts.open;
    }

    function renderRecoveriesTable() {
        const recoveries = filteredRecoveries().filter(recoveryMatchesSegment).sort((a, b) => daysUntil(a.end) - daysUntil(b.end));
        document.getElementById("recoveriesTable").innerHTML = recoveries.length ? recoveries.map(recovery => {
            const student = getStudent(recovery);
            const status = statusMeta[recovery.status] || statusMeta.open;
            const outcome = outcomeMeta[recovery.outcome] || outcomeMeta.pending;
            return `<tr><td><span class="cell-main">${escapeHTML(student?.name || "Aluno")}</span><span class="cell-sub">Órion ${escapeHTML(student?.orion || "-")}</span></td><td><span class="cell-main">${recovery.classId}</span><span class="cell-sub">${recovery.uc}</span></td><td>${badge(`Recuperação ${recovery.number}`, "blue")}</td><td>${escapeHTML(recovery.reason)}</td><td><span class="cell-main">${formatDate(recovery.start)} a ${formatDate(recovery.end)}</span><span class="cell-sub" style="color:${isCritical(recovery) ? "#c62828" : "#647386"}">${isOpen(recovery) ? dueLabel(recovery.end) : "Encerrada"}</span></td><td>${badge(status.label, status.className)}</td><td>${badge(outcome.label, outcome.className)}</td><td><div class="button-row"><button class="icon-button table-action" data-mail-recovery="${recovery.id}" title="Abrir mensagem"><i data-lucide="mail"></i></button><button class="icon-button table-action" data-edit-recovery="${recovery.id}" title="Editar recuperação"><i data-lucide="pencil"></i></button></div></td></tr>`;
        }).join("") : `<tr><td colspan="8" class="empty-state">Nenhuma recuperação encontrada.</td></tr>`;
    }

    function renderKanban() {
        const recoveries = filteredRecoveries();
        const notes = filteredAnalystNotes();
        const showRecoveries = state.workflowFilter === "all" || state.workflowFilter === "student";
        const showNotes = state.workflowFilter === "all" || state.workflowFilter === "instructor";
        const grouped = Object.fromEntries(workflowColumns.map(column => [column.id, []]));
        if (showRecoveries) recoveries.forEach(recovery => grouped[statusMeta[recovery.status]?.workflow || "triage"].push({ type: "student", item: recovery }));
        if (showNotes) notes.forEach(note => grouped[analystNoteWorkflow(note)].push({ type: "instructor", item: note }));
        const workflowCounts = { all: recoveries.length + notes.length, student: recoveries.length, instructor: notes.length };
        document.querySelectorAll("[data-workflow-filter]").forEach(button => {
            const key = button.dataset.workflowFilter;
            button.classList.toggle("active", key === state.workflowFilter);
            button.querySelector("span").textContent = workflowCounts[key];
        });
        document.getElementById("kanbanBoard").innerHTML = workflowColumns.map(column => `
            <section class="kanban-column" data-drop-status="${column.id}" style="--tone:${column.tone}">
                <div class="kanban-heading"><strong>${column.label}</strong><span>${grouped[column.id].length}</span></div>
                <div class="kanban-list">${grouped[column.id].map(card => {
                    if (card.type === "student") {
                        const recovery = card.item;
                        const student = getStudent(recovery);
                        const critical = isCritical(recovery);
                        return `<article class="kanban-card" draggable="true" data-workflow-card-type="student" data-workflow-card-id="${recovery.id}" style="--card-tone:${critical ? "#c62828" : "#004a8d"}"><div class="card-top">${badge(`Aluno · ${recovery.uc} · R${recovery.number}`, critical ? "red" : "blue")}<button class="icon-button table-action" data-edit-recovery="${recovery.id}" title="Editar recuperação"><i data-lucide="pencil"></i></button></div><h4>${escapeHTML(student?.name || "Aluno")}</h4><p>${escapeHTML(recovery.reason)}</p><span class="card-context">${escapeHTML(recovery.assignedTo)} · ${escapeHTML(statusMeta[recovery.status]?.label || "Aberta")}</span><div class="kanban-meta"><span>${recovery.classId} · ${dueLabel(recovery.end)}</span><span class="mini-avatar" title="${escapeHTML(recovery.createdBy)}">${escapeHTML(initials(recovery.createdBy))}</span></div></article>`;
                    }
                    const note = card.item;
                    const editable = canEditAnalystNote(note);
                    const critical = isAnalystNoteCritical(note);
                    const due = note.reminderDate ? dueLabel(note.reminderDate) : "Sem lembrete";
                    return `<article class="kanban-card instructor-card${editable ? "" : " read-only"}" draggable="${editable}" data-workflow-card-type="instructor" data-workflow-card-id="${note.id}" style="--card-tone:${critical ? "#c62828" : "#f58220"}"><div class="card-top">${badge(`Instrutor · ${note.type}`, critical ? "red" : "amber")}<span class="mini-avatar" title="${escapeHTML(note.author)}">${escapeHTML(initials(note.author))}</span></div><h4>${escapeHTML(note.instructor)}</h4><p>${escapeHTML(note.subject || note.notes || "Mediação pedagógica")}</p><span class="card-context">${note.competency ? `${escapeHTML(analystCompetencyLabel(note.competency))} · ` : ""}${escapeHTML(analystTrackingLabel(note))}</span><div class="kanban-meta"><span>${escapeHTML(note.classId || "Sem turma")} · ${escapeHTML(due)}</span><span>${editable ? "Arraste para atualizar" : "Somente leitura"}</span></div></article>`;
                }).join("") || `<div class="empty-state">Sem tratativas</div>`}</div>
            </section>`).join("");
        bindKanbanEvents();
    }

    function initials(value) {
        return String(value || "NA").split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
    }

    function renderCalendar() {
        const events = filteredClasses().flatMap(classItem => classItem.ucs.map(uc => ({ ...uc, classItem }))).filter(item => daysUntil(item.end) >= -10).sort((a, b) => parseDate(a.end) - parseDate(b.end));
        document.getElementById("calendarTimeline").innerHTML = events.length ? events.map(event => {
            const days = daysUntil(event.end);
            const related = state.data.recoveries.filter(recovery => recovery.classId === event.classItem.id && recovery.uc === event.name && isOpen(recovery));
            const tone = days < 0 ? "#c62828" : days <= 7 ? "#d17b08" : "#1976b8";
            const date = parseDate(event.end);
            return `<article class="timeline-row"><time class="timeline-date">${date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}<strong>${String(date.getDate()).padStart(2, "0")}</strong></time><div class="timeline-content" style="--tone:${tone}"><h3>${event.classItem.id} · ${event.name}</h3><p>${escapeHTML(instructorLabel(event.classItem))} · ${related.length} recuperação(ões) aberta(s) · ${dueLabel(event.end)}</p></div>${related.length ? badge(`${related.length} em atenção`, days <= 7 ? "red" : "amber") : badge("Sem recuperação", "green")}</article>`;
        }).join("") : `<div class="empty-state">Nenhum evento encontrado.</div>`;

        const critical = filteredRecoveries().filter(isCritical);
        document.getElementById("calendarStats").innerHTML = `<div class="calendar-stat"><span>Alertas ativos</span><strong>${critical.length}</strong></div><div class="calendar-stat"><span>Vencidos</span><strong>${critical.filter(item => daysUntil(item.end) < 0).length}</strong></div><div class="calendar-stat"><span>Próximos 7 dias</span><strong>${critical.filter(item => daysUntil(item.end) >= 0).length}</strong></div>`;
    }

    function mediationIndicators() {
        const classes = filteredClasses();
        const notes = filteredAnalystNotes();
        const recoveries = filteredRecoveries();
        const monitoringRows = filteredMonitoringRows();
        const evaluations = notes.filter(note => note.evaluationPercent !== null && note.evaluationPercent !== "" && Number.isFinite(Number(note.evaluationPercent))).map(note => Number(note.evaluationPercent));
        const openMediations = notes.filter(note => analystNoteWorkflow(note) !== "closed").length;
        const accompaniedContacts = recoveries.filter(item => ["contacted", "waiting", "evaluation", "closed"].includes(item.status)).length;
        const correctedActivities = monitoringRows.reduce((sum, item) => sum + Number(item.record.correction?.corrected || 0), 0);
        const practiceRows = monitoringRows.filter(item => item.record.practice?.capturedAt);
        const practiceCompleted = practiceRows.reduce((sum, item) => sum + Number(item.record.practice?.completed || 0), 0);
        const practiceTotal = practiceRows.reduce((sum, item) => sum + Number(item.record.practice?.totalStudents || 0), 0);
        const closedRecoveries = recoveries.filter(item => item.status === "closed");
        const developedRecoveries = closedRecoveries.filter(item => item.outcome === "developed").length;
        const totalStudents = classes.reduce((sum, item) => sum + Number(item.studentsCount || 0), 0);
        const weightedFrequency = totalStudents ? classes.reduce((sum, item) => sum + Number(item.frequency || 0) * Number(item.studentsCount || 0), 0) / totalStudents : null;
        const dropouts = classes.reduce((sum, item) => sum + Number(item.dropouts || 0), 0);
        const percentage = (part, total) => total ? `${Math.round(part / total * 100)}%` : "--";
        return {
            notes: notes.length,
            openMediations,
            evaluationAverage: evaluations.length ? `${Math.round(evaluations.reduce((sum, value) => sum + value, 0) / evaluations.length)}%` : "--",
            evaluationCount: evaluations.length,
            accompaniedContacts,
            correctedActivities,
            engagement: percentage(practiceCompleted, practiceTotal),
            practiceCompleted,
            practiceTotal,
            recoveryDevelopment: percentage(developedRecoveries, closedRecoveries.length),
            developedRecoveries,
            closedRecoveries: closedRecoveries.length,
            averageFrequency: weightedFrequency === null ? "--" : `${weightedFrequency.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`,
            permanence: percentage(Math.max(0, totalStudents - dropouts), totalStudents),
            dropouts,
            totalStudents
        };
    }

    function indicatorCard(label, value, detail, tone) {
        return `<article class="indicator-card" style="--tone:${tone}"><span>${escapeHTML(label)}</span><strong>${escapeHTML(value)}</strong><small>${escapeHTML(detail)}</small></article>`;
    }

    function renderMediationIndicators() {
        const data = mediationIndicators();
        document.getElementById("instructorActionIndicators").innerHTML = [
            indicatorCard("Mediações documentadas", data.notes, `${data.openMediations} ainda em acompanhamento`, "#f58220"),
            indicatorCard("Média avaliativa", data.evaluationAverage, `${plural(data.evaluationCount, "avaliação interna", "avaliações internas")} sob sua responsabilidade`, "#6d3cb4"),
            indicatorCard("Contatos acompanhados", data.accompaniedContacts, "Recuperações com interação ou encaminhamento registrado", "#1976b8"),
            indicatorCard("Correções realizadas", data.correctedActivities, "Atividades corrigidas no último retrato disponível", "#078847")
        ].join("");
        document.getElementById("studentResultIndicators").innerHTML = [
            indicatorCard("Engajamento nas atividades", data.engagement, `${data.practiceCompleted} de ${data.practiceTotal} conclusões registradas`, "#004a8d"),
            indicatorCard("Desenvolvimento após recuperação", data.recoveryDevelopment, `${data.developedRecoveries} de ${data.closedRecoveries} recuperações concluídas`, "#078847"),
            indicatorCard("Frequência média", data.averageFrequency, "Média ponderada das turmas filtradas", "#d17b08"),
            indicatorCard("Permanência", data.permanence, `${data.dropouts} desligamento(s) em ${data.totalStudents} estudantes`, "#c62828")
        ].join("");
    }

    function renderReports() {
        const recoveries = filteredRecoveries();
        const closed = recoveries.filter(item => item.status === "closed");
        const developed = closed.filter(item => item.outcome === "developed").length;
        const effectiveness = closed.length ? Math.round(developed / closed.length * 100) : 0;
        const averageDays = closed.length ? Math.round(closed.reduce((sum, item) => sum + Math.max(0, (parseDate(item.end) - parseDate(item.start)) / DAY), 0) / closed.length) : 0;
        document.getElementById("reportMetrics").innerHTML = [
            metricCard("Aberturas", recoveries.length, `No conjunto filtrado`, "folder-plus", "#004a8d"),
            metricCard("Concluídas", closed.length, `<b>${effectiveness}%</b> com desenvolvimento`, "circle-check-big", "#078847"),
            metricCard("Tempo médio", `${averageDays} dias`, `Entre abertura e prazo`, "timer", "#6d3cb4"),
            metricCard("Reincidências", recoveries.filter(item => item.number > 1 || item.outcome === "reopened").length, `Recuperação 2 ou superior`, "refresh-ccw", "#c62828")
        ].join("");

        const ucCounts = [...new Set(recoveries.map(item => item.uc))].map(uc => ({ uc, count: recoveries.filter(item => item.uc === uc).length })).sort((a, b) => Number(a.uc.replace(/\D/g, "")) - Number(b.uc.replace(/\D/g, "")));
        const maxUc = Math.max(1, ...ucCounts.map(item => item.count));
        document.getElementById("ucChart").innerHTML = ucCounts.length ? ucCounts.map((item, index) => `<div class="h-bar-row"><strong>${item.uc}</strong><div class="h-bar-track"><i style="--value:${item.count / maxUc * 100}%;--tone:${index % 2 ? "#f58220" : "#004a8d"}"></i></div><b>${item.count}</b></div>`).join("") : `<div class="empty-state">Sem dados.</div>`;

        const outcomeCounts = {
            developed: closed.filter(item => item.outcome === "developed").length,
            notDeveloped: closed.filter(item => item.outcome === "not-developed").length,
            reopened: recoveries.filter(item => item.outcome === "reopened").length,
            pending: recoveries.filter(item => item.outcome === "pending").length
        };
        const total = Math.max(1, Object.values(outcomeCounts).reduce((sum, value) => sum + value, 0));
        const developedPct = outcomeCounts.developed / total * 100;
        const notDevelopedPct = developedPct + outcomeCounts.notDeveloped / total * 100;
        const reopenedPct = notDevelopedPct + outcomeCounts.reopened / total * 100;
        document.getElementById("qualityChart").innerHTML = `<div class="donut" data-value="${effectiveness}%" style="--developed:${developedPct}%;--not-developed:${notDevelopedPct}%;--reopened:${reopenedPct}%"></div><div class="donut-legend"><div><i style="--tone:#078847"></i><span>Desenvolveu</span><strong>${outcomeCounts.developed}</strong></div><div><i style="--tone:#c62828"></i><span>Não desenvolveu</span><strong>${outcomeCounts.notDeveloped}</strong></div><div><i style="--tone:#6d3cb4"></i><span>Reaberta</span><strong>${outcomeCounts.reopened}</strong></div><div><i style="--tone:#dce3ea"></i><span>Ainda sem resultado</span><strong>${outcomeCounts.pending}</strong></div></div>`;

        const reasons = [...new Set(recoveries.map(item => item.reason))].map(reason => ({ reason, count: recoveries.filter(item => item.reason === reason).length })).sort((a, b) => b.count - a.count);
        const maxReason = Math.max(1, ...reasons.map(item => item.count));
        document.getElementById("reasonTable").innerHTML = reasons.length ? reasons.map(item => `<div class="reason-row"><strong>${escapeHTML(item.reason)}</strong><div class="h-bar-track"><i style="--value:${item.count / maxReason * 100}%;--tone:#f58220"></i></div><span>${item.count} caso(s)</span></div>`).join("") : `<div class="empty-state">Sem dados.</div>`;
        renderMediationIndicators();
    }

    function filteredMonitoringRows() {
        return filteredClasses().flatMap(classItem => (classItem.monitoring || []).filter(record => state.filters.uc === "all" || record.uc === state.filters.uc).map(record => ({ classItem, record })));
    }

    function monitoringTiming(classItem, record) {
        if (record.uc === "PI") return "current";
        const uc = classItem.ucs.find(item => item.name === record.uc);
        if (!uc) return "current";
        if (daysUntil(uc.start) > 0) return "future";
        if (daysUntil(uc.end) < 0) return "ended";
        return "current";
    }

    function monitoringRecovery(classItem, record) {
        const items = state.data.recoveries.filter(item => item.classId === classItem.id && item.uc === record.uc);
        return { open: items.filter(isOpen).length, closed: items.filter(item => item.status === "closed").length, total: items.length };
    }

    function monitoringAttentionReasons(classItem, record) {
        const timing = monitoringTiming(classItem, record);
        if (timing === "future") return [];
        const reasons = [];
        const attendance = record.attendance;
        const practice = record.practice;
        const recovery = monitoringRecovery(classItem, record);
        if (attendance.expectedDays > 0 && (attendance.openDays > 0 || attendance.incompleteDays > 0 || attendance.pendingEntries > 0)) reasons.push(`${attendance.openDays + attendance.incompleteDays} chamada(s) aberta(s)/incompleta(s) e ${attendance.pendingEntries} registro(s) pendente(s)`);
        if (!practice.capturedAt) reasons.push("Diário da Prática ainda não carregado");
        else if (practice.notCompleted + practice.requiresEvaluation + practice.blank > 0) reasons.push(`${practice.notCompleted} NC, ${practice.requiresEvaluation} requer avaliação e ${practice.blank} em branco`);
        if (practice.capturedAt && record.correction.pending > 0) reasons.push(`${record.correction.pending} correção(ões) de atividade pendente(s)`);
        if (recovery.open > 0) reasons.push(`${recovery.open} recuperação(ões) aberta(s)`);
        if (timing === "ended" && record.orion.status !== "launched") reasons.push("Resultado da UC ainda não concluído no Órion");
        if (record.uc === "PI" && record.orion.status === "partial") reasons.push("Lançamento do PI parcialmente concluído no Órion");
        return reasons;
    }

    function ensureMonitoringAlerts() {
        let changed = false;
        state.data.classes.forEach(classItem => (classItem.monitoring || []).forEach(record => {
            if (monitoringAttentionReasons(classItem, record).length > 0 && !record.alertCreated) {
                record.alertCreated = true;
                record.alertCreatedAt = isoOffset(0);
                changed = true;
            }
        }));
        if (changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
    }

    function monitoringCompliance(classItem, record) {
        const timing = monitoringTiming(classItem, record);
        if (timing === "future") return null;
        const scores = [];
        if (record.attendance.expectedDays > 0) scores.push(Math.max(0, Math.min(100, record.attendance.completedDays / record.attendance.expectedDays * 100 - record.attendance.pendingEntries * 2)));
        if (record.practice.capturedAt) {
            scores.push(record.practice.completed / Math.max(1, record.practice.totalStudents) * 100);
            scores.push(record.correction.corrected / Math.max(1, record.correction.total) * 100);
        } else scores.push(0, 0);
        scores.push(record.orion.status === "launched" ? 100 : record.orion.status === "partial" ? 50 : timing === "current" ? 50 : 0);
        return Math.round(scores.reduce((sum, value) => sum + value, 0) / Math.max(1, scores.length));
    }

    function monitoringTotals(rows = filteredMonitoringRows()) {
        const activeRows = rows.filter(item => monitoringTiming(item.classItem, item.record) !== "future");
        return {
            rows: activeRows.length,
            openCalls: activeRows.reduce((sum, item) => sum + item.record.attendance.openDays + item.record.attendance.incompleteDays, 0),
            attendancePending: activeRows.reduce((sum, item) => sum + item.record.attendance.pendingEntries, 0),
            practicePending: activeRows.reduce((sum, item) => sum + item.record.practice.notCompleted + item.record.practice.requiresEvaluation + item.record.practice.blank, 0),
            correctionPending: activeRows.reduce((sum, item) => sum + (item.record.practice.capturedAt ? item.record.correction.pending : 0), 0),
            recoveryOpen: activeRows.reduce((sum, item) => sum + monitoringRecovery(item.classItem, item.record).open, 0),
            orionPending: activeRows.filter(item => item.record.orion.status !== "launched").length,
            alerts: activeRows.filter(item => monitoringAttentionReasons(item.classItem, item.record).length > 0).length
        };
    }

    function statusCell(title, detail, progress, tone, icon) {
        return `<div class="status-cell" style="--status-tone:${tone}"><strong><i data-lucide="${icon}"></i>${escapeHTML(title)}</strong><p>${detail}</p>${progress === null ? "" : `<div class="mini-progress"><i style="--progress:${Math.max(0, Math.min(100, progress))}%"></i></div>`}</div>`;
    }

    function orionMeta(status) {
        if (status === "launched") return { label: "Concluído", className: "green", tone: "#078847" };
        if (status === "partial") return { label: "Parcial", className: "amber", tone: "#d17b08" };
        return { label: "Não lançado", className: "red", tone: "#c62828" };
    }

    function monitoringRowMatches(item) {
        const reasons = monitoringAttentionReasons(item.classItem, item.record);
        if (state.monitoringFilter === "attention") return reasons.length > 0;
        if (state.monitoringFilter === "orion") return monitoringTiming(item.classItem, item.record) !== "future" && item.record.orion.status !== "launched";
        if (state.monitoringFilter === "regular") return reasons.length === 0;
        return true;
    }

    function renderMonitoringSegments(rows) {
        const counts = {
            all: rows.length,
            attention: rows.filter(item => monitoringAttentionReasons(item.classItem, item.record).length > 0).length,
            orion: rows.filter(item => monitoringTiming(item.classItem, item.record) !== "future" && item.record.orion.status !== "launched").length,
            regular: rows.filter(item => monitoringAttentionReasons(item.classItem, item.record).length === 0).length
        };
        document.querySelectorAll("[data-monitoring-filter]").forEach(button => {
            const active = button.dataset.monitoringFilter === state.monitoringFilter;
            button.classList.toggle("active", active);
            button.querySelector("span").textContent = counts[button.dataset.monitoringFilter];
        });
    }

    function monitoringTableRow(item, forReport = false) {
        const { classItem, record } = item;
        const timing = monitoringTiming(classItem, record);
        const attendance = record.attendance;
        const practice = record.practice;
        const recovery = monitoringRecovery(classItem, record);
        const reasons = monitoringAttentionReasons(classItem, record);
        const attendanceProgress = attendance.expectedDays ? attendance.completedDays / attendance.expectedDays * 100 : null;
        const practiceProgress = practice.capturedAt ? practice.completed / Math.max(1, practice.totalStudents) * 100 : null;
        const correctionProgress = practice.capturedAt ? record.correction.corrected / Math.max(1, record.correction.total) * 100 : null;
        const orion = orionMeta(record.orion.status);
        const analystLabel = analystClassLabel(classItem.id);
        if (forReport) return `<tr><td><span class="cell-main">${classItem.id} · ${record.uc}</span><span class="cell-sub">${escapeHTML(instructorLabel(classItem))} | ${escapeHTML(analystLabel)}</span></td><td>${attendance.expectedDays ? `${attendance.completedDays}/${attendance.expectedDays} dias; ${attendance.openDays + attendance.incompleteDays} abertas` : timing === "future" ? "Não iniciada" : "Não se aplica"}</td><td>${practice.capturedAt ? `${practice.completed}/${practice.totalStudents} concluíram; ${practice.notCompleted + practice.requiresEvaluation + practice.blank} pendências` : "Sem upload"}</td><td>${practice.capturedAt ? `${record.correction.corrected}/${record.correction.total}` : "Sem dados"}</td><td>${recovery.open}</td><td>${badge(orion.label, orion.className)}</td><td>${reasons.length}</td></tr>`;
        return `<tr><td><span class="cell-main">${classItem.id} · ${record.uc}</span><span class="cell-sub">${record.uc === classItem.currentUc ? "UC atual" : record.uc === "PI" ? "Projeto Integrador" : timing === "future" ? "Próxima UC" : "UC anterior"}</span></td><td><span class="cell-main">${escapeHTML(instructorLabel(classItem))}</span><span class="cell-sub">${analystLabel === "Sem registro de analista" ? analystLabel : `Analistas com registros: ${escapeHTML(analystLabel)}`}</span></td><td>${statusCell(attendance.expectedDays ? `${Math.round(attendanceProgress)}% preenchida` : timing === "future" ? "Não iniciada" : "Não se aplica", attendance.expectedDays ? `${attendance.completedDays}/${attendance.expectedDays} dias · ${attendance.openDays} aberta(s) · ${attendance.incompleteDays} incompleta(s) · ${attendance.pendingEntries} registros pendentes` : "Sem chamada prevista para esta etapa", attendanceProgress, attendance.openDays + attendance.incompleteDays + attendance.pendingEntries > 0 ? "#c62828" : "#078847", "calendar-check")}</td><td>${statusCell(practice.capturedAt ? `${practice.completed}/${practice.totalStudents} concluíram` : "Sem upload", practice.capturedAt ? `NC ${practice.notCompleted} · Requer avaliação ${practice.requiresEvaluation} · Em branco ${practice.blank} · ${formatDate(practice.capturedAt)}` : "O último status ainda não foi registrado", practiceProgress, practice.capturedAt && practice.notCompleted + practice.requiresEvaluation + practice.blank === 0 ? "#078847" : "#d17b08", "notebook-pen")}</td><td>${statusCell(practice.capturedAt ? `${record.correction.corrected}/${record.correction.total} corrigidas` : "Sem dados", practice.capturedAt ? `${record.correction.pending} correção(ões) pendente(s)` : "Aguardando upload das atividades", correctionProgress, record.correction.pending === 0 && practice.capturedAt ? "#078847" : "#d17b08", "list-checks")}</td><td>${statusCell(recovery.open ? `${recovery.open} aberta(s)` : "Sem recuperação aberta", `${recovery.closed} concluída(s) · ${recovery.total} no histórico`, recovery.total ? recovery.closed / recovery.total * 100 : 100, recovery.open ? "#c62828" : "#078847", "book-open-check")}</td><td><div class="orion-cell">${badge(orion.label, orion.className)}<span class="cell-sub">${record.orion.updatedAt ? `${formatDate(record.orion.updatedAt)} · ${escapeHTML(record.orion.updatedBy || "")}` : "Aguardando confirmação manual"}</span><button class="secondary-button" data-edit-orion data-class-id="${classItem.id}" data-uc="${record.uc}"><i data-lucide="pencil"></i> Atualizar</button></div></td><td>${reasons.length ? `<div class="attention-reasons">${reasons.map(reason => `<span><i data-lucide="triangle-alert"></i>${escapeHTML(reason)}</span>`).join("")}</div>` : badge(timing === "future" ? "Programada" : "Regular", timing === "future" ? "gray" : "green")}</td></tr>`;
    }

    function renderMonitoringCharts(rows) {
        const byInstructor = [...new Set(rows.flatMap(item => instructorNamesForClass(item.classItem)))].map(instructor => {
            const values = rows.filter(item => instructorNamesForClass(item.classItem).includes(instructor)).map(item => monitoringCompliance(item.classItem, item.record)).filter(value => value !== null);
            return { name: instructor, value: values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0 };
        }).sort((a, b) => b.value - a.value);
        document.getElementById("monitoringInstructorChart").innerHTML = byInstructor.length ? byInstructor.map(item => `<div class="h-bar-row"><strong>${escapeHTML(item.name.split(" ")[0])}</strong><div class="h-bar-track"><i style="--value:${item.value}%;--tone:${item.value >= 85 ? "#078847" : item.value >= 65 ? "#d17b08" : "#c62828"}"></i></div><b>${item.value}%</b></div>`).join("") : `<div class="empty-state">Sem dados.</div>`;

        const allowedClassIds = new Set(rows.map(item => item.classItem.id));
        let analystUsage = analystActivities().filter(item => allowedClassIds.has(item.classId));
        if (state.filters.uc !== "all") analystUsage = analystUsage.filter(item => !item.uc || item.uc === state.filters.uc);
        if (state.filters.analyst !== "all") analystUsage = analystUsage.filter(item => item.analyst === state.filters.analyst);
        const byAnalyst = [...new Set(analystUsage.map(item => item.analyst))].map(analyst => {
            const records = analystUsage.filter(item => item.analyst === analyst);
            return {
                name: analyst,
                classes: new Set(records.map(item => item.classId)).size,
                records: records.length,
                active: records.filter(item => item.active).length
            };
        }).sort((a, b) => b.active - a.active || b.records - a.records || a.name.localeCompare(b.name));
        document.getElementById("monitoringAnalystChart").innerHTML = byAnalyst.length ? byAnalyst.map((item, index) => `<div class="analyst-load-row" style="--tone:${["#004a8d", "#f58220", "#078847", "#6d3cb4", "#c62828"][index % 5]}"><div><strong>${escapeHTML(item.name)}</strong><small>${item.records} registro(s) em ${item.classes} turma(s)</small></div><b title="Registros ativos">${item.active}</b></div>`).join("") : `<div class="empty-state">O quadro será formado conforme os analistas registrarem situações.</div>`;

        const pendingVolume = item => {
            if (monitoringTiming(item.classItem, item.record) === "future") return 0;
            const attendance = item.record.attendance;
            const practicePending = item.record.practice.capturedAt ? item.record.practice.notCompleted + item.record.practice.requiresEvaluation + item.record.practice.blank : item.classItem.studentsCount;
            const correctionPending = item.record.practice.capturedAt ? item.record.correction.pending : 0;
            const recoveryOpen = monitoringRecovery(item.classItem, item.record).open;
            const orionPending = item.record.orion.status === "launched" ? 0 : 1;
            return attendance.openDays + attendance.incompleteDays + attendance.pendingEntries + practicePending + correctionPending + recoveryOpen + orionPending;
        };
        const groupPending = keyGetter => [...new Set(rows.map(keyGetter))].map(key => ({ name: key, value: rows.filter(item => keyGetter(item) === key).reduce((sum, item) => sum + pendingVolume(item), 0) })).sort((a, b) => b.value - a.value);
        const classPending = groupPending(item => item.classItem.id);
        const ucPending = groupPending(item => item.record.uc);
        const pendingBars = (items, toneA, toneB) => {
            const max = Math.max(1, ...items.map(item => item.value));
            return items.length ? items.map((item, index) => `<div class="h-bar-row"><strong>${escapeHTML(item.name)}</strong><div class="h-bar-track"><i style="--value:${item.value / max * 100}%;--tone:${index % 2 ? toneB : toneA}"></i></div><b>${item.value}</b></div>`).join("") : `<div class="empty-state">Sem dados.</div>`;
        };
        const classBars = pendingBars(classPending, "#004a8d", "#1976b8");
        const ucBars = pendingBars(ucPending, "#f58220", "#d17b08");
        document.getElementById("monitoringClassChart").innerHTML = classBars;
        document.getElementById("monitoringUcStatusChart").innerHTML = ucBars;
        document.getElementById("monitoringReportClassChart").innerHTML = classBars;
        document.getElementById("monitoringReportUcChart").innerHTML = ucBars;
    }

    function routineCard(item) {
        const { classItem, record } = item;
        const recovery = monitoringRecovery(classItem, record);
        const reasons = monitoringAttentionReasons(classItem, record);
        const step = (icon, title, detail, ok) => `<div class="routine-step" style="--step-tone:${ok ? "#078847" : "#c62828"}"><i data-lucide="${icon}"></i><div><strong>${title}</strong><span>${detail}</span></div></div>`;
        return `<article class="routine-card" style="--tone:${reasons.length ? "#f58220" : "#078847"}"><header><div><h4>${classItem.id} · ${record.uc}</h4><p>${record.uc === classItem.currentUc ? "Unidade curricular atual" : "Projeto Integrador"}</p></div>${reasons.length ? badge(`${reasons.length} atenção`, "red") : badge("Em dia", "green")}</header><div class="routine-steps">${step("calendar-check", "Frequência", `${record.attendance.openDays + record.attendance.incompleteDays} chamada(s) aberta(s)`, record.attendance.openDays + record.attendance.incompleteDays + record.attendance.pendingEntries === 0)}${step("notebook-pen", "Diário da Prática", record.practice.capturedAt ? `${record.practice.completed}/${record.practice.totalStudents} concluíram` : "Sem upload", !!record.practice.capturedAt && record.practice.notCompleted + record.practice.requiresEvaluation + record.practice.blank === 0)}${step("list-checks", "Correções", `${record.correction.pending} pendente(s)`, !!record.practice.capturedAt && record.correction.pending === 0)}${step("book-open-check", "Recuperação", `${recovery.open} aberta(s)`, recovery.open === 0)}${step("database-zap", "Resultado no Órion", orionMeta(record.orion.status).label, record.orion.status === "launched")}</div></article>`;
    }

    function renderMonitoringReports(rows, totals) {
        document.getElementById("monitoringReportCharts").innerHTML = [
            { label: "Chamadas abertas/incompletas", value: totals.openCalls, tone: "#c62828" },
            { label: "Pendências no Diário", value: totals.practicePending, tone: "#f58220" },
            { label: "Correções pendentes", value: totals.correctionPending, tone: "#6d3cb4" },
            { label: "Órion não concluído", value: totals.orionPending, tone: "#004a8d" }
        ].map(item => `<article class="report-monitoring-card" style="--tone:${item.tone}"><span>${item.label}</span><strong>${item.value}</strong></article>`).join("");
        document.getElementById("monitoringReportTable").innerHTML = rows.length ? rows.map(item => monitoringTableRow(item, true)).join("") : `<tr><td colspan="7" class="empty-state">Sem indicadores para os filtros escolhidos.</td></tr>`;
    }

    function renderMonitoring() {
        ensureMonitoringAlerts();
        const rows = filteredMonitoringRows();
        const activeRows = rows.filter(item => monitoringTiming(item.classItem, item.record) !== "future");
        const totals = monitoringTotals(rows);
        document.getElementById("monitoringMetrics").innerHTML = [
            metricCard("UCs acompanhadas", totals.rows, `<b>${new Set(activeRows.map(item => item.classItem.id)).size}</b> turma(s)`, "clipboard-check", "#004a8d"),
            metricCard("Chamadas abertas", totals.openCalls, `<b>${totals.attendancePending}</b> registros pendentes`, "calendar-clock", "#c62828"),
            metricCard("Diário da Prática", totals.practicePending, `NC, em branco ou requer avaliação`, "notebook-pen", "#f58220"),
            metricCard("Correções pendentes", totals.correctionPending, `Último resumo de atividades`, "list-checks", "#6d3cb4"),
            metricCard("Recuperações abertas", totals.recoveryOpen, `Geral e por UC`, "book-open-check", "#d17b08"),
            metricCard("Órion pendente", totals.orionPending, `Confirmação manual necessária`, "database-zap", "#078847")
        ].join("");

        const alerts = activeRows.filter(item => monitoringAttentionReasons(item.classItem, item.record).length > 0);
        document.getElementById("monitoringNavCount").textContent = alerts.length;
        document.getElementById("monitoringAlertBadge").textContent = `${alerts.length} alerta${alerts.length === 1 ? "" : "s"}`;
        document.getElementById("monitoringAlertList").innerHTML = alerts.length ? alerts.map(item => `<article class="monitoring-alert-item"><i data-lucide="triangle-alert"></i><div><strong>${item.classItem.id} · ${item.record.uc}</strong><p>${escapeHTML(monitoringAttentionReasons(item.classItem, item.record).join("; "))}</p></div><time>${formatDate(item.record.alertCreatedAt)}</time></article>`).join("") : `<div class="empty-state">Nenhum ponto de atenção para os filtros escolhidos.</div>`;

        renderMonitoringCharts(rows);
        const routineRows = rows.filter(item => item.record.uc === item.classItem.currentUc || item.record.uc === "PI");
        document.getElementById("instructorMonitoringCards").innerHTML = routineRows.length ? routineRows.map(routineCard).join("") : `<div class="empty-state">Sem UC atual ou PI para os filtros escolhidos.</div>`;
        renderMonitoringSegments(rows);
        const visibleRows = rows.filter(monitoringRowMatches);
        document.getElementById("monitoringTable").innerHTML = visibleRows.length ? visibleRows.map(item => monitoringTableRow(item)).join("") : `<tr><td colspan="8" class="empty-state">Nenhum indicador encontrado.</td></tr>`;
        renderMonitoringReports(rows, totals);
    }

    function renderAll() {
        renderProfileMode();
        renderFilterOptions();
        renderAlertStrip();
        renderMetrics();
        renderInstructorChart();
        renderPriorityList();
        renderAttentionClasses();
        renderClassesTable();
        renderRecoverySegments();
        renderRecoveriesTable();
        renderKanban();
        renderCalendar();
        renderReports();
        renderMonitoring();
        renderInstructorNotes();
        refreshIcons();
    }

    function openView(view) {
        if (view === "instructor-notes" && state.profileMode !== "instructor") view = "overview";
        state.view = view;
        document.querySelectorAll(".view").forEach(element => element.classList.toggle("active", element.id === `view-${view}`));
        document.querySelectorAll(".nav-item").forEach(element => element.classList.toggle("active", element.dataset.view === view));
        window.scrollTo({ top: 0, behavior: "smooth" });
        refreshIcons();
    }

    function openModal(id) {
        document.getElementById(id).hidden = false;
        document.body.style.overflow = "hidden";
        refreshIcons();
    }

    function closeModal(id) {
        document.getElementById(id).hidden = true;
        document.body.style.overflow = "";
    }

    function populateRecoveryClassOptions(selectedClassId) {
        const classSelect = document.getElementById("recoveryClass");
        const availableClasses = state.profileMode === "instructor" ? state.data.classes.filter(classItem => instructorNamesForClass(classItem).includes(state.previewInstructor)) : state.data.classes;
        classSelect.innerHTML = availableClasses.map(classItem => `<option value="${classItem.id}">${classItem.id} · ${escapeHTML(instructorLabel(classItem))}</option>`).join("");
        classSelect.value = selectedClassId || state.filters.classId !== "all" ? (selectedClassId || state.filters.classId) : availableClasses[0].id;
        updateRecoveryDependentOptions();
    }

    function updateRecoveryDependentOptions(selectedStudentId, selectedUc) {
        const classItem = getClass(document.getElementById("recoveryClass").value) || state.data.classes[0];
        const studentSelect = document.getElementById("recoveryStudent");
        const ucSelect = document.getElementById("recoveryUc");
        studentSelect.innerHTML = classItem.students.map(student => `<option value="${student.id}">${escapeHTML(student.name)} · Órion ${escapeHTML(student.orion)}</option>`).join("");
        ucSelect.innerHTML = classItem.ucs.map(uc => `<option value="${uc.name}">${uc.name}</option>`).join("");
        if (selectedStudentId) studentSelect.value = selectedStudentId;
        if (selectedUc) ucSelect.value = selectedUc;
        else if (classItem.ucs.some(uc => uc.name === classItem.currentUc)) ucSelect.value = classItem.currentUc;
        updateMessagePreview();
    }

    function openRecoveryModal(recoveryId) {
        const recovery = recoveryId ? state.data.recoveries.find(item => item.id === recoveryId) : null;
        document.getElementById("recoveryModalTitle").textContent = recovery ? `Editar Recuperação ${recovery.number}` : "Nova recuperação";
        document.getElementById("recoveryId").value = recovery?.id || "";
        populateRecoveryClassOptions(recovery?.classId);
        if (recovery) {
            updateRecoveryDependentOptions(recovery.studentId, recovery.uc);
            document.getElementById("recoveryReason").value = recovery.reason;
            document.getElementById("recoveryStart").value = recovery.start;
            document.getElementById("recoveryEnd").value = recovery.end;
            document.getElementById("recoveryStatus").value = recovery.status;
            document.getElementById("recoveryOutcome").value = recovery.outcome;
            document.getElementById("recoveryNotes").value = recovery.notes || "";
        } else {
            document.getElementById("recoveryReason").value = "";
            document.getElementById("recoveryStart").value = isoOffset(0);
            document.getElementById("recoveryEnd").value = isoOffset(7);
            document.getElementById("recoveryStatus").value = "open";
            document.getElementById("recoveryOutcome").value = "pending";
            document.getElementById("recoveryNotes").value = "";
        }
        updateMessagePreview();
        openModal("recoveryModal");
    }

    function getFormRecovery() {
        const classId = document.getElementById("recoveryClass").value;
        const studentId = document.getElementById("recoveryStudent").value;
        const existingId = document.getElementById("recoveryId").value;
        const existing = state.data.recoveries.find(item => item.id === existingId);
        const sequence = existing?.number || state.data.recoveries.filter(item => item.classId === classId && item.studentId === studentId).reduce((max, item) => Math.max(max, item.number), 0) + 1;
        return {
            id: existingId || `r-${Date.now()}`,
            classId,
            studentId,
            uc: document.getElementById("recoveryUc").value,
            number: sequence,
            reason: document.getElementById("recoveryReason").value,
            start: document.getElementById("recoveryStart").value,
            end: document.getElementById("recoveryEnd").value,
            status: document.getElementById("recoveryStatus").value,
            outcome: document.getElementById("recoveryOutcome").value,
            notes: document.getElementById("recoveryNotes").value.trim(),
            assignedTo: instructorLabel(getClass(classId)),
            createdBy: existing?.createdBy || currentAnalystName()
        };
    }

    function buildRecoveryMessage(recovery) {
        const student = getClass(recovery.classId)?.students.find(item => item.id === recovery.studentId);
        const classItem = getClass(recovery.classId);
        const uc = classItem?.ucs.find(item => item.name === recovery.uc);
        return `Olá, ${student?.name || "estudante"},\n\nA ${recovery.uc} terminou ou está próxima do término em ${formatDate(uc?.end)}. Foi aberta a Recuperação ${recovery.number} pelo motivo: ${recovery.reason || "a informar"}.\n\nO período para realização é de ${formatDate(recovery.start)} até ${formatDate(recovery.end)}.\n\nAtividades e orientações:\n${recovery.notes || "As atividades serão informadas pelo instrutor."}\n\nÉ fundamental acompanhar diariamente o quadro de aproveitamento e procurar o instrutor para esclarecer dúvidas. Para garantir o certificado ao final do programa, é necessário desenvolver em todas as unidades curriculares e manter pelo menos 75% de frequência.\n\nOrientação sobre os códigos no AVA:\nS = Semana | D = Dia | Exemplo: S1D1 significa Semana 1, Dia 1.`;
    }

    function updateMessagePreview() {
        const requiredElements = ["recoveryClass", "recoveryStudent", "recoveryUc", "recoveryStart", "recoveryEnd"];
        if (!requiredElements.every(id => document.getElementById(id)?.value)) return;
        document.getElementById("messagePreview").textContent = buildRecoveryMessage(getFormRecovery());
    }

    async function copyText(text, successMessage) {
        try {
            await navigator.clipboard.writeText(text);
            showToast(successMessage);
        } catch {
            const area = document.createElement("textarea");
            area.value = text;
            document.body.appendChild(area);
            area.select();
            document.execCommand("copy");
            area.remove();
            showToast(successMessage);
        }
    }

    function openRecoveryOutlook(recovery) {
        const student = getClass(recovery.classId)?.students.find(item => item.id === recovery.studentId);
        const subject = `Recuperação ${recovery.number} - ${student?.name || "Estudante"} - Turma ${recovery.classId}`;
        const mailto = `mailto:${encodeURIComponent(student?.email || "")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(buildRecoveryMessage(recovery))}`;
        window.open(mailto, "_blank", "noopener");
        showToast("Solicitação enviada ao Outlook. O envio permanece sob confirmação do usuário.");
    }

    function renderUcEditor(classItem) {
        const editor = document.getElementById("ucEditor");
        editor.innerHTML = classItem.ucs.map((uc, index) => `<div class="uc-editor-row" data-uc-row><label>UC<input data-uc-name value="${escapeHTML(uc.name)}"></label><label>Início<input data-uc-start type="date" value="${uc.start}"></label><label>Término<input data-uc-end type="date" value="${uc.end}"></label><button type="button" class="icon-button" data-remove-uc="${index}" title="Remover UC"><i data-lucide="trash-2"></i></button></div>`).join("");
        refreshIcons();
    }

    function openClassModal(classId) {
        const classItem = getClass(classId);
        if (!classItem) return;
        state.classDraft = JSON.parse(JSON.stringify(classItem));
        document.getElementById("classId").value = classItem.id;
        document.getElementById("classModalTitle").textContent = `Turma ${classItem.id}`;
        document.getElementById("classStart").value = classItem.start;
        document.getElementById("classEnd").value = classItem.end;
        document.getElementById("classInstructor").textContent = instructorLabel(classItem);
        renderUcEditor(state.classDraft);
        openModal("classModal");
    }

    function readUcEditor() {
        return [...document.querySelectorAll("[data-uc-row]")].map(row => ({ name: row.querySelector("[data-uc-name]").value.trim().toUpperCase(), start: row.querySelector("[data-uc-start]").value, end: row.querySelector("[data-uc-end]").value })).filter(item => item.name);
    }

    function bindKanbanEvents() {
        document.querySelectorAll("[data-workflow-card-id][draggable='true']").forEach(card => {
            card.addEventListener("dragstart", () => { state.draggedWorkflowCard = { type: card.dataset.workflowCardType, id: card.dataset.workflowCardId }; });
            card.addEventListener("dragend", () => { state.draggedWorkflowCard = null; document.querySelectorAll(".kanban-column").forEach(column => column.classList.remove("drag-over")); });
        });
        document.querySelectorAll("[data-drop-status]").forEach(column => {
            column.addEventListener("dragover", event => { event.preventDefault(); column.classList.add("drag-over"); });
            column.addEventListener("dragleave", () => column.classList.remove("drag-over"));
            column.addEventListener("drop", event => {
                event.preventDefault();
                const status = column.dataset.dropStatus;
                const dragged = state.draggedWorkflowCard;
                if (!dragged || !status) return;
                if (dragged.type === "student") {
                    const recovery = state.data.recoveries.find(item => item.id === dragged.id);
                    if (!recovery) return;
                    recovery.status = status === "triage" ? "open" : status;
                    if (status === "closed" && recovery.outcome === "pending") recovery.outcome = "developed";
                    saveData("Tratativa atualizada.");
                    renderAll();
                    return;
                }
                const note = (state.data.analystNotes || []).find(item => item.id === dragged.id);
                if (!note || !canEditAnalystNote(note)) return showToast("Somente o analista responsável pode alterar esta mediação.");
                const statusMap = { triage: "em_acompanhamento", contacted: "em_acompanhamento", waiting: "aguardando_retorno", evaluation: "em_avaliacao", closed: "resolvido" };
                note.trackingEnabled = status !== "triage";
                note.trackingStatus = statusMap[status];
                note.status = note.trackingStatus;
                saveData("Acompanhamento do instrutor atualizado.");
                renderAll();
            });
        });
    }

    function buildCalendarFile() {
        const critical = filteredRecoveries().filter(isCritical);
        if (!critical.length) return showToast("Não há alertas críticos para exportar.");
        const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Senac//Central do Analista//PT-BR"];
        critical.forEach(recovery => {
            const student = getStudent(recovery);
            const date = recovery.end.replaceAll("-", "");
            lines.push("BEGIN:VEVENT", `UID:${recovery.id}@prototipo.senac`, `DTSTART;VALUE=DATE:${date}`, `DTEND;VALUE=DATE:${date}`, `SUMMARY:Tratar Recuperação ${recovery.number} - ${student?.name || "Estudante"}`, `DESCRIPTION:Turma ${recovery.classId} | ${recovery.uc} | ${recovery.reason}`, "END:VEVENT");
        });
        lines.push("END:VCALENDAR");
        const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "alertas-recuperacao-prototipo.ics";
        link.click();
        URL.revokeObjectURL(url);
        showToast("Arquivo de lembretes criado para teste no Outlook.");
    }

    function reportSummary() {
        const recoveries = filteredRecoveries();
        const open = recoveries.filter(isOpen).length;
        const critical = recoveries.filter(isCritical).length;
        const closed = recoveries.filter(item => item.status === "closed");
        const developed = closed.filter(item => item.outcome === "developed").length;
        const title = state.profileMode === "instructor" ? `RELATÓRIO DO INSTRUTOR - ${state.previewInstructor.toUpperCase()}` : "RELATÓRIO GLOBAL DO ANALISTA";
        const instructorFilter = state.profileMode === "instructor" ? state.previewInstructor : state.filters.instructor;
        const monitoring = monitoringTotals();
        const mediation = mediationIndicators();
        return `${title}\n\nTurmas: ${filteredClasses().length}\nRecuperações registradas: ${recoveries.length}\nRecuperações abertas: ${open}\nPrazo crítico: ${critical}\nConcluídas: ${closed.length}\nConcluídas com desenvolvimento: ${developed}\n\nAÇÃO DO INSTRUTOR\nMediações documentadas: ${mediation.notes}\nMédia avaliativa interna: ${mediation.evaluationAverage} (${mediation.evaluationCount} avaliações)\nContatos acompanhados: ${mediation.accompaniedContacts}\nCorreções realizadas: ${mediation.correctedActivities}\n\nRESULTADO DOS ALUNOS\nEngajamento nas atividades: ${mediation.engagement}\nDesenvolvimento após recuperação: ${mediation.recoveryDevelopment}\nFrequência média: ${mediation.averageFrequency}\nPermanência: ${mediation.permanence}\n\nPLANILHA DE CHAMADA\nChamadas abertas/incompletas: ${monitoring.openCalls}\nRegistros de frequência pendentes: ${monitoring.attendancePending}\nPendências no Diário da Prática: ${monitoring.practicePending}\nCorreções pendentes: ${monitoring.correctionPending}\nResultados não concluídos no Órion: ${monitoring.orionPending}\nPontos de atenção: ${monitoring.alerts}\n\nFiltros: Analista ${state.filters.analyst}; Instrutor ${instructorFilter}; Turma ${state.filters.classId}; UC ${state.filters.uc}.`;
    }

    function monitoringSummary() {
        const totals = monitoringTotals();
        const title = state.profileMode === "instructor" ? `MONITORAMENTO ACADÊMICO - ${state.previewInstructor.toUpperCase()}` : "MONITORAMENTO ACADÊMICO GLOBAL";
        return `${title}\n\nTurmas: ${filteredClasses().length}\nUCs/etapas acompanhadas: ${totals.rows}\nChamadas abertas ou incompletas: ${totals.openCalls}\nRegistros de frequência pendentes: ${totals.attendancePending}\nPendências no Diário da Prática: ${totals.practicePending}\nCorreções pendentes: ${totals.correctionPending}\nRecuperações abertas: ${totals.recoveryOpen}\nResultados pendentes no Órion: ${totals.orionPending}\nPontos de atenção: ${totals.alerts}`;
    }

    function openOrionModal(classId, ucName) {
        const classItem = getClass(classId);
        const record = classItem?.monitoring?.find(item => item.uc === ucName);
        if (!classItem || !record) return;
        document.getElementById("orionClassId").value = classId;
        document.getElementById("orionUcName").value = ucName;
        const analystContext = state.profileMode === "analyst"
            ? `Esta atualização será registrada para ${currentAnalystName()}`
            : `Analistas com registros: ${analystClassLabel(classId)}`;
        document.getElementById("orionContext").innerHTML = `<strong>Turma ${escapeHTML(classId)} · ${escapeHTML(ucName)}</strong><span>${escapeHTML(instructorLabel(classItem))} · ${escapeHTML(analystContext)}</span>`;
        document.getElementById("orionStatus").value = record.orion.status;
        document.getElementById("orionUpdatedAt").value = record.orion.updatedAt || isoOffset(0);
        document.getElementById("orionNotes").value = record.orion.notes || "";
        openModal("orionModal");
    }

    function bindEvents() {
        document.addEventListener("click", event => {
            const nav = event.target.closest("[data-view]");
            const viewLink = event.target.closest("[data-open-view]");
            const recoveryButton = event.target.closest("[data-open-recovery]");
            const editRecovery = event.target.closest("[data-edit-recovery]");
            const mailRecovery = event.target.closest("[data-mail-recovery]");
            const editClass = event.target.closest("[data-edit-class]");
            const close = event.target.closest("[data-close-modal]");
            const removeUc = event.target.closest("[data-remove-uc]");
            const profileModeButton = event.target.closest("[data-profile-mode]");
            const editOrion = event.target.closest("[data-edit-orion]");
            if (nav) openView(nav.dataset.view);
            if (viewLink) openView(viewLink.dataset.openView);
            if (recoveryButton) openRecoveryModal();
            if (editRecovery) openRecoveryModal(editRecovery.dataset.editRecovery);
            if (mailRecovery) {
                const recovery = state.data.recoveries.find(item => item.id === mailRecovery.dataset.mailRecovery);
                if (recovery) openRecoveryModal(recovery.id);
            }
            if (editClass) openClassModal(editClass.dataset.editClass);
            if (editOrion) openOrionModal(editOrion.dataset.classId, editOrion.dataset.uc);
            if (close) closeModal(close.dataset.closeModal);
            if (removeUc) {
                const index = Number(removeUc.dataset.removeUc);
                state.classDraft.ucs = readUcEditor();
                state.classDraft.ucs.splice(index, 1);
                renderUcEditor(state.classDraft);
            }
            if (profileModeButton) {
                if (profileModeButton.dataset.profileMode === "instructor") {
                    window.location.href = "./index.html?perfil=instrutor";
                    return;
                }
                state.profileMode = profileModeButton.dataset.profileMode;
                state.filters.instructor = state.profileMode === "instructor" ? state.previewInstructor : "all";
                state.filters.analyst = "all";
                state.filters.classId = "all";
                state.filters.uc = "all";
                state.filters.search = "";
                document.getElementById("globalSearch").value = "";
                if (state.profileMode === "analyst" && state.view === "instructor-notes") openView("overview");
                renderAll();
                showToast(state.profileMode === "instructor" ? `Visualização de ${state.previewInstructor} ativada.` : "Central do Analista restaurada.");
            }
        });

        document.getElementById("instructorFilter").addEventListener("change", event => { state.filters.instructor = event.target.value; renderAll(); });
        document.getElementById("analystFilter").addEventListener("change", event => { state.filters.analyst = event.target.value; state.filters.classId = "all"; renderAll(); });
        document.getElementById("previewInstructor").addEventListener("change", event => {
            state.previewInstructor = event.target.value;
            state.filters.instructor = event.target.value;
            state.filters.classId = "all";
            state.filters.uc = "all";
            renderAll();
            showToast(`Agora você está visualizando o sistema como ${state.previewInstructor}.`);
        });
        document.getElementById("classFilter").addEventListener("change", event => { state.filters.classId = event.target.value; renderAll(); });
        document.getElementById("ucFilter").addEventListener("change", event => { state.filters.uc = event.target.value; renderAll(); });
        document.getElementById("globalSearch").addEventListener("input", event => { state.filters.search = event.target.value; renderAll(); });
        document.getElementById("clearFilters").addEventListener("click", () => { state.filters = { instructor: state.profileMode === "instructor" ? state.previewInstructor : "all", analyst: "all", classId: "all", uc: "all", search: "" }; document.getElementById("globalSearch").value = ""; renderAll(); });

        document.querySelectorAll("[data-recovery-filter]").forEach(button => button.addEventListener("click", () => { state.recoveryFilter = button.dataset.recoveryFilter; renderRecoverySegments(); renderRecoveriesTable(); refreshIcons(); }));
        document.querySelectorAll("[data-workflow-filter]").forEach(button => button.addEventListener("click", () => { state.workflowFilter = button.dataset.workflowFilter; renderKanban(); refreshIcons(); }));
        document.querySelectorAll("[data-monitoring-filter]").forEach(button => button.addEventListener("click", () => { state.monitoringFilter = button.dataset.monitoringFilter; renderMonitoring(); refreshIcons(); }));

        ["recoveryStudent", "recoveryUc", "recoveryReason", "recoveryStart", "recoveryEnd", "recoveryNotes"].forEach(id => document.getElementById(id).addEventListener("input", updateMessagePreview));
        document.getElementById("recoveryClass").addEventListener("change", () => updateRecoveryDependentOptions());

        document.getElementById("recoveryForm").addEventListener("submit", event => {
            event.preventDefault();
            const recovery = getFormRecovery();
            const existingIndex = state.data.recoveries.findIndex(item => item.id === recovery.id);
            if (existingIndex >= 0) state.data.recoveries[existingIndex] = recovery;
            else state.data.recoveries.push(recovery);
            saveData(existingIndex >= 0 ? "Recuperação atualizada." : `Recuperação ${recovery.number} criada.`);
            closeModal("recoveryModal");
            renderAll();
        });

        document.getElementById("copyRecoveryMessage").addEventListener("click", () => copyText(buildRecoveryMessage(getFormRecovery()), "Mensagem copiada."));
        document.getElementById("openRecoveryOutlook").addEventListener("click", () => openRecoveryOutlook(getFormRecovery()));

        document.getElementById("classForm").addEventListener("submit", event => {
            event.preventDefault();
            const classItem = getClass(document.getElementById("classId").value);
            classItem.start = document.getElementById("classStart").value;
            classItem.end = document.getElementById("classEnd").value;
            classItem.ucs = readUcEditor();
            state.classDraft = null;
            saveData("Calendário da turma atualizado.");
            closeModal("classModal");
            renderAll();
        });

        document.getElementById("addUc").addEventListener("click", () => {
            state.classDraft.ucs = readUcEditor();
            const nextNumber = Math.max(0, ...state.classDraft.ucs.map(uc => Number(uc.name.replace(/\D/g, "")) || 0)) + 1;
            state.classDraft.ucs.push({ name: `UC${nextNumber}`, start: isoOffset(0), end: isoOffset(14) });
            renderUcEditor(state.classDraft);
        });

        document.getElementById("simulateImport").addEventListener("click", () => openModal("importModal"));
        document.getElementById("mockFiles").addEventListener("change", event => {
            const files = [...event.target.files];
            document.getElementById("mockFileList").innerHTML = files.map(file => `<div class="mock-file-item"><span><strong>${escapeHTML(file.name)}</strong><span class="cell-sub">Somente simulação de leitura</span></span>${badge("Pronto", "green")}</div>`).join("");
            document.getElementById("finishMockImport").disabled = files.length === 0;
        });
        document.getElementById("finishMockImport").addEventListener("click", () => { closeModal("importModal"); showToast("Simulação concluída. Nenhum arquivo foi lido ou alterado."); });

        document.getElementById("orionForm").addEventListener("submit", event => {
            event.preventDefault();
            const classItem = getClass(document.getElementById("orionClassId").value);
            const record = classItem?.monitoring?.find(item => item.uc === document.getElementById("orionUcName").value);
            if (!record) return;
            record.orion.status = document.getElementById("orionStatus").value;
            record.orion.updatedAt = document.getElementById("orionUpdatedAt").value;
            record.orion.notes = document.getElementById("orionNotes").value.trim();
            record.orion.updatedBy = state.profileMode === "instructor" ? state.previewInstructor : currentAnalystName();
            saveData(`Status do Órion atualizado para ${orionMeta(record.orion.status).label}.`);
            closeModal("orionModal");
            renderAll();
        });

        document.getElementById("exportCalendar").addEventListener("click", buildCalendarFile);
        document.getElementById("copyMonitoringReport").addEventListener("click", () => copyText(monitoringSummary(), "Resumo do monitoramento copiado."));
        document.getElementById("printMonitoringReport").addEventListener("click", () => { openView("reports"); setTimeout(() => window.print(), 150); });
        document.getElementById("copyReport").addEventListener("click", () => copyText(reportSummary(), "Resumo global copiado."));
        document.getElementById("printReport").addEventListener("click", () => window.print());

        document.getElementById("resetDemo").addEventListener("click", () => window.location.reload());

        document.addEventListener("keydown", event => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                document.getElementById("globalSearch").focus();
            }
            if (event.key === "Escape") document.querySelectorAll(".modal-backdrop:not([hidden])").forEach(modal => closeModal(modal.id));
        });
    }

    bindEvents();
    renderAll();
})();
