(() => {
    "use strict";

    const ANALYST_SEEDS = [
        { key: "MICHEL", tokens: ["michel"], fallbackName: "Michel Farias" },
        { key: "MARIANA", tokens: ["mariana"], fallbackName: "Mariana Mello" },
        { key: "BRUNA_CUNHA", tokens: ["bruna", "cunha"], fallbackName: "Bruna Cunha" },
        { key: "BIANCA", tokens: ["bianca"], fallbackName: "Bianca Aresta" },
        { key: "JULIANA_SEVERO", tokens: ["juliana", "severo"], fallbackName: "Juliana Severo" }
    ];
    const DAY = 86400000;

    const normalize = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const keyOf = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const titleCase = value => String(value || "").split(/[._\-\s]+/).filter(Boolean).map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(" ");
    const isoOffset = days => new Date(Date.now() + days * DAY).toISOString().slice(0, 10);
    const ucOrder = value => String(value).toUpperCase() === "PI" ? 999 : Number(String(value).replace(/\D/g, "")) || 0;
    const validName = value => {
        const text = String(value || "").trim();
        return text && !/^(não identificado|nao identificado|instrutor|tutor)$/i.test(text) ? text : "";
    };
    const validClassSummary = summary => /\d{9}/.test(String(summary?.turma || summary?.turmaKey || ""));
    const baseCanonicalInstructor = value => {
        const text = validName(value);
        const key = normalize(text).replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
        if (!key || /^\d+[.]?$/.test(key) || /a partir de|periodo|não identificado|nao identificado/.test(key)) return "";
        if (key === "jean" || key.startsWith("jean elizeu")) return "Jean Elizeu Sauka";
        if (key === "ana claudia" || key.startsWith("ana claudia hafemann")) return "Ana Claudia Hafemann";
        if (key === "bruna lorena" || key.startsWith("bruna lorena de lima")) return "Bruna Lorena de Lima";
        return text;
    };
    let canonicalInstructor = baseCanonicalInstructor;

    function configureInstructorAliases(classSummaries) {
        const names = [...new Set(classSummaries.flatMap(summary => [...(summary.instructors || []), summary.tutor1, summary.tutor2]).map(baseCanonicalInstructor).filter(Boolean))];
        const records = names.map(name => ({ name, tokens: normalize(name).replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean) }));
        canonicalInstructor = value => {
            const base = baseCanonicalInstructor(value);
            const tokens = normalize(base).replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
            if (!tokens.length) return "";
            const extensions = records.filter(record => record.tokens.length > tokens.length && tokens.every((token, index) => record.tokens[index] === token));
            if (!extensions.length) return base;
            const nextTokens = new Set(extensions.map(record => record.tokens[tokens.length]));
            if (nextTokens.size !== 1) return base;
            return extensions.sort((a, b) => b.tokens.length - a.tokens.length || b.name.length - a.name.length)[0].name;
        };
    }

    function analystSeedForUser(user) {
        const identity = normalize(`${user?.email?.split("@")[0] || ""} ${user?.displayName || ""}`);
        return ANALYST_SEEDS.find(seed => seed.tokens.every(token => identity.includes(token))) || null;
    }

    function analystFullName(user, seed) {
        const displayName = String(user?.displayName || "").trim();
        if (displayName.split(/\s+/).length >= 2) return displayName;
        const fromEmail = titleCase(user?.email?.split("@")[0] || "");
        return fromEmail.split(/\s+/).length >= 2 ? fromEmail : seed.fallbackName;
    }

    function buildUcDates(ucNames, currentIndex) {
        return ucNames.map((name, index) => ({ name, start: isoOffset((index - currentIndex) * 21 - 10), end: isoOffset((index - currentIndex) * 21 + 10) }));
    }

    function latestHistoryByClass(documents) {
        const latest = new Map();
        documents.forEach(doc => {
            const value = { id: doc.id, ...doc.data() };
            const key = String(value.turmaKey || keyOf(value.turma));
            const current = latest.get(key);
            if (!current || String(value.capturedAt || "") > String(current.capturedAt || "")) latest.set(key, value);
        });
        return latest;
    }

    function groupStudents(documents) {
        const groups = new Map();
        documents.forEach(doc => {
            const value = doc.data() || {};
            const key = String(value.turmaKey || "");
            if (!groups.has(key)) groups.set(key, []);
            if (value.data) groups.get(key).push(value.data);
        });
        return groups;
    }

    function buildClass(summary, studentsSource, latest, override, responsibleAnalyst) {
        const rawClass = String(summary.turma || summary.turmaKey || "");
        const id = (rawClass.match(/\d{9}/) || [summary.turmaKey || keyOf(rawClass)])[0];
        const instructors = [...new Set([...(summary.instructors || []), summary.tutor1, summary.tutor2].map(canonicalInstructor).filter(Boolean))];
        const studentSources = Array.isArray(studentsSource) ? studentsSource : [];
        const students = studentSources.map((student, index) => ({
            id: String(student.id ?? `${id}-${index + 1}`),
            name: String(student.name || `Aluno ${index + 1}`),
            email: String(student.studentEmail || ""),
            orion: String(student.orionCode || student.orion || ""),
            needsRecovery: Boolean(student.needs_recuperacao),
            needsCouncil: Boolean(student.needs_conselho),
            isProcessDropout: Boolean(student.is_process_dropout),
            isDropout: Boolean(student.is_dropout),
            dropoutReason: String(student.dropout_reason || ""),
            documentStatus: String(student.dropoutDocumentStatus || "")
        }));
        const detectedUcs = [...new Set([...(summary.ucs || []), ...studentSources.flatMap(student => Object.keys(student.uc_scores || {}))].map(value => String(value).toUpperCase()).filter(value => /^UC\d+$|^PI$/.test(value)))].sort((a, b) => ucOrder(a) - ucOrder(b));
        const scoredUcs = detectedUcs.filter(uc => studentSources.some(student => student.uc_scores && student.uc_scores[uc]));
        const currentUc = String(override?.currentUc || scoredUcs.at(-1) || detectedUcs[0] || "UC1");
        const currentIndex = Math.max(0, detectedUcs.indexOf(currentUc));
        const generatedUcs = buildUcDates(detectedUcs.length ? detectedUcs : [currentUc], currentIndex);
        const ucs = generatedUcs.map(uc => {
            const configured = override?.ucs?.find(item => item.name === uc.name);
            return configured?.start && configured?.end ? configured : uc;
        });
        const historyStudents = Object.values(latest?.students || {});
        const warnings = Array.isArray(summary.attendanceWarnings) ? summary.attendanceWarnings : [];
        const monitoring = ucs.map(uc => {
            const activityRows = historyStudents.map(student => student.activityByUC?.[uc.name]).filter(Boolean);
            const ucWarnings = warnings.filter(warning => JSON.stringify(warning).toUpperCase().includes(uc.name));
            const pendingStudents = new Set(ucWarnings.flatMap(warning => Array.isArray(warning.pendingStudents) ? warning.pendingStudents.map(String) : [])).size;
            const completed = activityRows.filter(item => Number(item.total || 0) > 0 && Number(item.pending || 0) === 0).length;
            const oldOrion = override?.orion?.[uc.name];
            return {
                uc: uc.name,
                attendance: { expectedDays: ucWarnings.length, completedDays: 0, openDays: ucWarnings.length, incompleteDays: 0, pendingEntries: pendingStudents },
                practice: {
                    totalStudents: students.length || Number(summary.studentCount || 0),
                    completed,
                    notCompleted: activityRows.filter(item => Number(item.notCompleted || 0) > 0).length,
                    requiresEvaluation: activityRows.filter(item => Number(item.requiresEvaluation || 0) > 0).length,
                    blank: activityRows.filter(item => Number(item.blank || 0) > 0).length,
                    capturedAt: activityRows.length ? String(latest?.capturedAt || "").slice(0, 10) : null
                },
                correction: { total: activityRows.length, corrected: completed, pending: Math.max(0, activityRows.length - completed) },
                orion: oldOrion || { status: "pending", updatedAt: null, updatedBy: null, notes: "" },
                alertCreated: false,
                alertCreatedAt: null
            };
        });
        const active = studentSources.filter(student => !student.is_dropout && !student.is_process_dropout);
        const frequencies = active.map(student => Number(student.averageFreq)).filter(Number.isFinite);
        return {
            id,
            course: String(summary.course || "Curso não identificado"),
            instructor: instructors[0] || "Instrutor não identificado",
            instructors,
            start: override?.start || ucs[0]?.start || isoOffset(-30),
            end: override?.end || ucs.at(-1)?.end || isoOffset(180),
            currentUc,
            studentsCount: students.length || Number(summary.studentCount || 0),
            frequency: frequencies.length ? Number((frequencies.reduce((sum, value) => sum + value, 0) / frequencies.length).toFixed(1)) : 0,
            dropouts: studentSources.filter(student => student.is_dropout).length,
            status: "active",
            students,
            ucs,
            monitoring,
            responsibleAnalyst: String(responsibleAnalyst || summary.responsibleAnalyst || ""),
            responsibleAnalystKey: String(summary.responsibleAnalystKey || ""),
            sourceFolderName: String(summary.sourceFolderName || ""),
            sourceUpdatedAt: summary.updatedAt || null
        };
    }

    async function bootstrap() {
        const loading = document.getElementById("centralLoading");
        const config = window.SENAC_FIREBASE_CONFIG;
        if (!config || !window.firebase) throw new Error("Configuração do Firebase indisponível.");
        if (!firebase.apps.length) firebase.initializeApp(config);
        const auth = firebase.auth();
        const user = await new Promise(resolve => {
            const unsubscribe = auth.onAuthStateChanged(value => { unsubscribe(); resolve(value); });
        });
        if (!user) {
            window.location.replace("./index.html");
            return;
        }
        const seed = analystSeedForUser(user);
        if (!seed) {
            window.location.replace("./Dashboard_V76.html?perfil=instrutor");
            return;
        }
        const currentName = analystFullName(user, seed);
        const db = firebase.firestore();
        try {
            await db.collection("analyst_profiles").doc(user.uid).set({
                analystKey: seed.key,
                fullName: currentName,
                email: String(user.email || "").toLowerCase(),
                updatedAt: new Date().toISOString()
            }, { merge: true });
        } catch (error) {
            console.warn("O perfil do analista não pôde ser atualizado; o acesso seguirá pelo e-mail institucional reconhecido.", error);
        }

        const ownerEmail = String(user.email || "").toLowerCase();
        const syncWarnings = [];
        const safeGet = async (label, query, required = false) => {
            try {
                return await query.get();
            } catch (error) {
                console.error(`Falha ao carregar ${label}.`, error);
                syncWarnings.push(label);
                if (required) throw new Error(`Não foi possível consultar ${label}. Verifique as permissões do Firebase.`);
                return { docs: [] };
            }
        };
        const [profiles, classes, students, histories, recoveries, sharedNotes, ownNotes, ownEvaluations, overrides, instructorNotes, activityHistory] = await Promise.all([
            safeGet("perfis dos analistas", db.collection("analyst_profiles")),
            safeGet("turmas sincronizadas", db.collection("saved_classes"), true),
            safeGet("alunos das turmas", db.collection("saved_class_students"), true),
            safeGet("histórico do dashboard", db.collection("dashboard_history")),
            safeGet("recuperações", db.collection("analyst_recoveries")),
            safeGet("anotações compartilhadas", db.collection("analyst_shared_notes").where("visibleToInstructor", "==", true)),
            safeGet("caderno privado do analista", db.collection("analyst_notes").where("ownerEmail", "==", ownerEmail)),
            safeGet("avaliações privadas", db.collection("analyst_evaluations").where("ownerEmail", "==", ownerEmail)),
            safeGet("configurações das turmas", db.collection("analyst_class_overrides")),
            safeGet("chamados dos instrutores", db.collection("instructor_notes")),
            safeGet("histórico de movimentações", db.collection("activity_history"))
        ]);

        const profileMap = new Map(profiles.docs.map(doc => [String(doc.data().analystKey || ""), doc.data()]));
        const analystNames = ANALYST_SEEDS.map(item => String(profileMap.get(item.key)?.fullName || (item.key === seed.key ? currentName : item.fallbackName)));
        const analystNameByKey = new Map(ANALYST_SEEDS.map((item, index) => [item.key, analystNames[index]]));
        const studentGroups = groupStudents(students.docs);
        const latestHistories = latestHistoryByClass(histories.docs);
        const overrideMap = new Map(overrides.docs.map(doc => [doc.id, doc.data()]));
        configureInstructorAliases(classes.docs.map(doc => ({ turmaKey: doc.id, ...doc.data() })));
        const classData = classes.docs.map(doc => ({ doc, summary: { turmaKey: doc.id, ...doc.data() } })).filter(item => validClassSummary(item.summary)).map(({ doc, summary }) => {
            return buildClass(summary, studentGroups.get(doc.id) || [], latestHistories.get(doc.id), overrideMap.get(doc.id), analystNameByKey.get(String(summary.responsibleAnalystKey || "")) || summary.responsibleAnalyst);
        }).sort((a, b) => b.id.localeCompare(a.id));

        const recordedRecoveries = recoveries.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const recordedKeys = new Set(recordedRecoveries.map(item => `${item.classId}|${normalize(item.studentName || item.studentKey || item.studentId)}`));
        const untreatedRecoveries = classData.flatMap(classItem => classItem.students.filter(student => student.needsRecovery && !recordedKeys.has(`${classItem.id}|${normalize(student.name)}`)).map(student => ({ id: `pending-${classItem.id}-${keyOf(student.name)}`, classId: classItem.id, studentId: student.id, studentKey: normalize(student.name), studentName: student.name, uc: classItem.currentUc, number: 1, reason: "Identificado na aba Recuperação da chamada; tratativa ainda não registrada.", start: "", end: "", status: "triage", outcome: "pending", synthetic: true })));
        const recoveryData = [...recordedRecoveries, ...untreatedRecoveries];
        const evaluationMap = new Map(ownEvaluations.docs.map(doc => [doc.id, doc.data()]));
        const noteDocuments = new Map(sharedNotes.docs.map(doc => [doc.id, doc]));
        ownNotes.docs.forEach(doc => noteDocuments.set(doc.id, doc));
        const analystNoteData = [...noteDocuments.values()].map(doc => {
            const note = doc.data() || {};
            const evaluation = evaluationMap.get(doc.id);
            return {
                id: doc.id,
                classId: String(note.turmaKey || ""),
                instructor: String(note.instructorName || note.instructorKey || "Instrutor"),
                date: String(note.date || "").slice(0, 10),
                type: String(note.followupType || "Acompanhamento"),
                subject: String(note.subject || "Acompanhamento"),
                notes: String(note.notes || ""),
                competency: String(note.competency || ""),
                evaluationPercent: evaluation && Number.isFinite(Number(evaluation.score)) ? Number(evaluation.score) : null,
                author: String(note.analystName || note.analystKey || "Análise"),
                ownerEmail: String(note.ownerEmail || "").toLowerCase(),
                trackingEnabled: note.trackingEnabled === true,
                trackingStatus: String(note.trackingStatus || "em_acompanhamento"),
                reminderDate: String(note.reminderDate || note.periodEnd || "").slice(0, 10),
                periodStart: String(note.periodStart || note.date || "").slice(0, 10),
                periodEnd: String(note.periodEnd || "").slice(0, 10),
                status: String(note.trackingStatus || "em_acompanhamento"),
                dimension: String(note.dimension || "action"),
                contactAttempt: String(note.contactAttempt || "not_applicable"),
                studentResponse: String(note.studentResponse || "unknown"),
                engagementEffect: String(note.engagementEffect || "unknown"),
                learningEvidence: String(note.learningEvidence || "unknown"),
                permanenceRisk: String(note.permanenceRisk || "none")
            };
        });
        const instructorNoteData = instructorNotes.docs.map(doc => {
            const note = doc.data() || {};
            if (!String(note.responsibleAnalyst || "").trim()) return null;
            return {
                id: `instructor-${doc.id}`,
                classId: String(note.turmaKey || ""),
                instructor: canonicalInstructor(note.instructorName || note.instructorKey || "Instrutor"),
                date: String(note.date || note.createdAt || "").slice(0, 10),
                type: String((note.situationTypes || [])[0] || "Ponto de atenção"),
                subject: String(note.subject || (note.situationTypes || []).join(", ") || "Chamado do instrutor"),
                notes: String(note.notes || ""),
                competency: "",
                evaluationPercent: null,
                author: String(note.responsibleAnalyst || "Analista responsável"),
                responsibleAnalyst: String(note.responsibleAnalyst || ""),
                trackingEnabled: Boolean(note.treatmentDueDate || note.treatmentStatus),
                trackingStatus: String(note.treatmentStatus || "em_tratativa"),
                reminderDate: String(note.treatmentDueDate || "").slice(0, 10),
                periodStart: String(note.treatmentStartDate || note.date || "").slice(0, 10),
                periodEnd: String(note.treatmentDueDate || "").slice(0, 10),
                status: String(note.treatmentStatus || "em_tratativa"),
                source: "instructor_notebook"
            };
        }).filter(Boolean);
        const noteData = [...analystNoteData, ...instructorNoteData];
        const recordedHistory = activityHistory.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const frequencyHistory = histories.docs.map(doc => {
            const snapshot = doc.data() || {};
            const metrics = snapshot.class || {};
            const alerts = Number(metrics.naPending || 0) + Number(metrics.activityPending || 0) + Number(metrics.treatmentOpen || 0);
            return { id: `snapshot-${doc.id}`, turmaKey: String(snapshot.turmaKey || snapshot.turma || ""), category: "frequency", action: "snapshot", occurredAt: String(snapshot.capturedAt || ""), actorName: String(snapshot.recordedBy || "Sistema"), actorEmail: String(snapshot.recordedBy || ""), entityId: String(snapshot.turmaKey || ""), summary: `Chamada atualizada: ${Number(metrics.naPending || 0)} NA pendente(s), ${Number(metrics.activityPending || 0)} atividade(s) pendente(s) e ${Number(metrics.treatmentOpen || 0)} tratativa(s) aberta(s).`, detail: alerts ? `${alerts} ponto(s) de atenção no retrato.` : "Nenhum ponto de atenção no retrato." };
        });
        const recoveryHistory = recordedRecoveries.map(item => ({ id: `current-recovery-${item.id}`, turmaKey: String(item.classId || ""), category: "recovery", action: "current", occurredAt: String(item.updatedAt || item.start || ""), actorName: String(item.updatedBy || item.createdBy || "Sistema"), actorEmail: String(item.updatedBy || ""), entityId: item.id, summary: `${item.studentName || "Aluno"}: Recuperação ${item.number || 1} está como ${item.status || "sem tratativa"}.`, detail: `${item.uc || "UC não informada"} · ${item.reason || "Motivo não informado"}` }));
        const notebookHistory = noteData.map(item => ({ id: `current-note-${item.id}`, turmaKey: String(item.classId || ""), category: "notebook", action: "current", occurredAt: String(item.date || ""), actorName: String(item.author || "Sistema"), actorEmail: String(item.ownerEmail || ""), entityId: item.id, summary: `${item.type || "Anotação"}: ${item.subject || "Sem assunto"}.`, detail: `${item.instructor || "Instrutor não identificado"} · ${item.trackingStatus || item.status || "Sem status"}` }));
        const dropoutHistory = classData.flatMap(classItem => classItem.students.filter(student => student.isProcessDropout || student.isDropout || student.documentStatus).map(student => ({ id: `current-dropout-${classItem.id}-${keyOf(student.name)}`, turmaKey: classItem.id, category: "dropout", action: "current", occurredAt: String(classItem.sourceUpdatedAt || ""), actorName: "Sistema", actorEmail: "", entityId: student.id, summary: `${student.name}: ${student.isDropout ? "evasão/desligamento" : "processo de desligamento"}.`, detail: student.documentStatus ? `Documentação: ${student.documentStatus.replaceAll("_", " ")}.` : "Situação documental não informada." })));
        const activityHistoryData = [...recordedHistory, ...frequencyHistory, ...recoveryHistory, ...notebookHistory, ...dropoutHistory].sort((a, b) => String(b.occurredAt || "").localeCompare(String(a.occurredAt || ""))).slice(0, 1000);

        window.SENAC_CENTRAL_USER = { uid: user.uid, email: user.email, name: currentName, analystKey: seed.key };
        window.senacDesktop?.startAutomaticNetworkSync?.().catch(error => console.warn("Não foi possível iniciar a sincronização automática da rede.", error));
        window.SENAC_ANALYST_NAMES = analystNames;
        window.SENAC_ANALYST_OPTIONS = ANALYST_SEEDS.map((item, index) => ({ key: item.key, name: analystNames[index] || item.fallbackName }));
        window.SENAC_CENTRAL_SYNC_WARNINGS = syncWarnings;
        window.SENAC_CENTRAL_INITIAL_DATA = { version: 2, classes: classData, recoveries: recoveryData, analystNotes: noteData, activityHistory: activityHistoryData };
        installPersistence(db, user, window.SENAC_CENTRAL_INITIAL_DATA);
        let receivedInitialClassSnapshot = false;
        let classRefreshTimer = null;
        const savedClassesQuery = db.collection("saved_classes");
        if (typeof savedClassesQuery.onSnapshot === "function") {
            savedClassesQuery.onSnapshot(() => {
                if (!receivedInitialClassSnapshot) {
                    receivedInitialClassSnapshot = true;
                    return;
                }
                clearTimeout(classRefreshTimer);
                classRefreshTimer = setTimeout(() => window.location.reload(), 4000);
            }, error => console.warn("Não foi possível acompanhar atualizações de turmas em tempo real.", error));
        }

        document.getElementById("analystProfileName").textContent = currentName;
        document.getElementById("profileAvatar").textContent = currentName.split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase();
        const script = document.createElement("script");
        script.src = `./analista.js?v=2.6.0`;
        script.onload = () => loading?.remove();
        script.onerror = () => { if (loading) loading.innerHTML = "Não foi possível carregar a Central do Analista."; };
        document.body.appendChild(script);
    }

    function installPersistence(db, user, initialData) {
        let previous = JSON.parse(JSON.stringify(initialData));
        let timer = null;
        window.SENAC_CENTRAL_PERSIST = data => {
            clearTimeout(timer);
            timer = setTimeout(async () => {
                const previousRecoveries = new Map((previous.recoveries || []).map(item => [item.id, item]));
                const nextRecoveries = new Map((data.recoveries || []).map(item => [item.id, item]));
                const writes = [];
                const historyWrite = (category, action, entityId, turmaKey, summary, before, after) => {
                    const id = `event-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
                    const clean = value => JSON.parse(JSON.stringify(value || {}));
                    writes.push(db.collection("activity_history").doc(id).set({
                        turmaKey: String(turmaKey || "GERAL"), category, action, summary: String(summary || "Alteração registrada."),
                        occurredAt: new Date().toISOString(), actorEmail: String(user.email || ""), actorName: String(window.SENAC_CENTRAL_USER?.name || user.email || "Usuário"),
                        entityId: String(entityId || ""), before: clean(before), after: clean(after)
                    }));
                };
                nextRecoveries.forEach((item, id) => {
                    if (JSON.stringify(item) !== JSON.stringify(previousRecoveries.get(id))) {
                        writes.push(db.collection("analyst_recoveries").doc(id).set({ ...item, updatedBy: user.email, ownerEmail: user.email, updatedAt: new Date().toISOString() }, { merge: true }));
                        const oldItem = previousRecoveries.get(id);
                        historyWrite("recovery", oldItem ? "update" : "create", id, item.classId, `${item.studentName || "Aluno"}: Recuperação ${item.number || 1} ${oldItem ? `alterada de ${oldItem.status || "sem status"} para ${item.status || "sem status"}` : "criada"}.`, oldItem, item);
                    }
                });
                previousRecoveries.forEach((item, id) => { if (!nextRecoveries.has(id)) { writes.push(db.collection("analyst_recoveries").doc(id).delete()); historyWrite("recovery", "delete", id, item.classId, `${item.studentName || "Aluno"}: registro de recuperação removido.`, item, {}); } });
                (data.classes || []).forEach(classItem => {
                    const oldClass = (previous.classes || []).find(item => item.id === classItem.id);
                    const payload = {
                        start: classItem.start,
                        end: classItem.end,
                        currentUc: classItem.currentUc,
                        ucs: classItem.ucs,
                        orion: Object.fromEntries((classItem.monitoring || []).map(record => [record.uc, record.orion])),
                        updatedBy: user.email,
                        updatedAt: new Date().toISOString()
                    };
                    const oldPayload = oldClass ? { start: oldClass.start, end: oldClass.end, currentUc: oldClass.currentUc, ucs: oldClass.ucs, orion: Object.fromEntries((oldClass.monitoring || []).map(record => [record.uc, record.orion])) } : null;
                    const comparable = { start: payload.start, end: payload.end, currentUc: payload.currentUc, ucs: payload.ucs, orion: payload.orion };
                    if (JSON.stringify(comparable) !== JSON.stringify(oldPayload)) {
                        writes.push(db.collection("analyst_class_overrides").doc(classItem.id).set(payload, { merge: true }));
                        const oldOrion = oldPayload?.orion || {};
                        const changedOrion = Object.keys(payload.orion || {}).filter(uc => JSON.stringify(payload.orion[uc]) !== JSON.stringify(oldOrion[uc]));
                        historyWrite(changedOrion.length ? "orion" : "frequency", "update", classItem.id, classItem.id, changedOrion.length ? `Órion atualizado em ${changedOrion.join(", ")}.` : "Datas ou unidades curriculares da turma foram atualizadas.", oldPayload, comparable);
                    }
                });
                const previousNotes = new Map((previous.analystNotes || []).filter(item => item.source !== "instructor_notebook").map(item => [item.id, item]));
                const nextNotes = new Map((data.analystNotes || []).filter(item => item.source !== "instructor_notebook").map(item => [item.id, item]));
                nextNotes.forEach(note => {
                    const oldNote = previousNotes.get(note.id);
                    const isOwner = String(note.ownerEmail || "").toLowerCase() === String(user.email || "").toLowerCase();
                    if (!isOwner || JSON.stringify(note) === JSON.stringify(oldNote)) return;
                    const updatedAt = new Date().toISOString();
                    const privatePayload = {
                        ownerEmail: user.email,
                        turmaKey: String(note.classId || "GERAL"),
                        analystKey: String(window.SENAC_CENTRAL_USER?.analystKey || keyOf(note.author || user.email)),
                        analystName: String(note.author || user.email),
                        instructorKey: keyOf(note.instructor),
                        instructorName: String(note.instructor || "Instrutor"),
                        date: String(note.date || ""),
                        followupType: String(note.type || "Acompanhamento"),
                        subject: String(note.subject || "Acompanhamento"),
                        notes: String(note.notes || ""),
                        competency: String(note.competency || ""),
                        visibleToInstructor: true,
                        score: null,
                        trackingEnabled: note.trackingEnabled === true,
                        trackingStatus: String(note.trackingStatus || "em_acompanhamento"),
                        reminderDate: String(note.reminderDate || ""),
                        periodStart: String(note.periodStart || note.date || ""),
                        periodEnd: String(note.periodEnd || note.date || ""),
                        dimension: String(note.dimension || "action"),
                        contactAttempt: String(note.contactAttempt || "not_applicable"),
                        studentResponse: String(note.studentResponse || "unknown"),
                        engagementEffect: String(note.engagementEffect || "unknown"),
                        learningEvidence: String(note.learningEvidence || "unknown"),
                        permanenceRisk: String(note.permanenceRisk || "none"),
                        updatedAt
                    };
                    const sharedPayload = { ...privatePayload };
                    delete sharedPayload.score;
                    writes.push(db.collection("analyst_notes").doc(note.id).set(privatePayload, { merge: true }));
                    writes.push(db.collection("analyst_shared_notes").doc(note.id).set(sharedPayload, { merge: true }));
                    historyWrite("notebook", oldNote ? "update" : "create", note.id, privatePayload.turmaKey, `${privatePayload.followupType}: ${privatePayload.subject} ${oldNote ? "foi atualizado" : "foi criado"} para ${privatePayload.instructorName}.`, oldNote, note);
                    if (note.evaluationPercent !== null && note.evaluationPercent !== "" && Number.isInteger(Number(note.evaluationPercent))) {
                        writes.push(db.collection("analyst_evaluations").doc(note.id).set({ ownerEmail: user.email, turmaKey: privatePayload.turmaKey, analystKey: privatePayload.analystKey, score: Number(note.evaluationPercent), updatedAt }, { merge: true }));
                    } else if (oldNote?.evaluationPercent !== null && oldNote?.evaluationPercent !== undefined) {
                        writes.push(db.collection("analyst_evaluations").doc(note.id).delete());
                    }
                });
                previousNotes.forEach((note, id) => {
                    if (nextNotes.has(id) || String(note.ownerEmail || "").toLowerCase() !== String(user.email || "").toLowerCase()) return;
                    writes.push(db.collection("analyst_notes").doc(id).delete());
                    writes.push(db.collection("analyst_shared_notes").doc(id).delete());
                    writes.push(db.collection("analyst_evaluations").doc(id).delete());
                    historyWrite("notebook", "delete", id, note.classId, `${note.type || "Anotação"}: ${note.subject || "Sem assunto"} foi removida.`, note, {});
                });
                try {
                    await Promise.all(writes);
                    previous = JSON.parse(JSON.stringify(data));
                } catch (error) {
                    console.error("Não foi possível sincronizar a Central do Analista.", error);
                }
            }, 500);
        };
    }

    bootstrap().catch(error => {
        console.error(error);
        const loading = document.getElementById("centralLoading");
        if (loading) loading.innerHTML = `<strong>Não foi possível abrir a Central do Analista.</strong><span>${String(error.message || error)}</span><a href="./Dashboard_V76.html?perfil=instrutor">Voltar ao Dashboard</a>`;
    });
})();
