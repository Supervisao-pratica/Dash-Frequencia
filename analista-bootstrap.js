(() => {
    "use strict";

    const ANALYST_SEEDS = [
        { key: "MICHEL", tokens: ["michel"], fallbackName: "Michel Farias" },
        { key: "MARIANA", tokens: ["mariana"], fallbackName: "Mariana Mello" },
        { key: "BRUNA_CUNHA", tokens: ["bruna", "cunha"], fallbackName: "Bruna Cunha" },
        { key: "BIANCA", tokens: ["bianca"], fallbackName: "Bianca Aresta" }
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

    function buildClass(summary, studentsSource, latest, override) {
        const rawClass = String(summary.turma || summary.turmaKey || "");
        const id = (rawClass.match(/\d{9}/) || [summary.turmaKey || keyOf(rawClass)])[0];
        const instructors = [...new Set([...(summary.instructors || []), summary.tutor1, summary.tutor2].map(validName).filter(Boolean))];
        const studentSources = Array.isArray(studentsSource) ? studentsSource : [];
        const students = studentSources.map((student, index) => ({
            id: String(student.id ?? `${id}-${index + 1}`),
            name: String(student.name || `Aluno ${index + 1}`),
            email: String(student.studentEmail || ""),
            orion: String(student.orionCode || student.orion || "")
        }));
        const detectedUcs = [...new Set([...(summary.ucs || []), ...studentSources.flatMap(student => Object.keys(student.uc_scores || {}))].map(value => String(value).toUpperCase()).filter(value => /^UC\d+$|^PI$/.test(value)))].sort((a, b) => ucOrder(a) - ucOrder(b));
        const scoredUcs = detectedUcs.filter(uc => studentSources.some(student => student.uc_scores && student.uc_scores[uc]));
        const currentUc = String(override?.currentUc || scoredUcs.at(-1) || detectedUcs[0] || "UC1");
        const currentIndex = Math.max(0, detectedUcs.indexOf(currentUc));
        const generatedUcs = buildUcDates(detectedUcs.length ? detectedUcs : [currentUc], currentIndex);
        const ucs = generatedUcs.map(uc => override?.ucs?.find(item => item.name === uc.name) || uc);
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
            window.location.replace("./index.html?perfil=instrutor");
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
        const [profiles, classes, students, histories, recoveries, sharedNotes, ownNotes, ownEvaluations, overrides] = await Promise.all([
            safeGet("perfis dos analistas", db.collection("analyst_profiles")),
            safeGet("turmas sincronizadas", db.collection("saved_classes"), true),
            safeGet("alunos das turmas", db.collection("saved_class_students"), true),
            safeGet("histórico do dashboard", db.collection("dashboard_history")),
            safeGet("recuperações", db.collection("analyst_recoveries")),
            safeGet("anotações compartilhadas", db.collection("analyst_shared_notes").where("visibleToInstructor", "==", true)),
            safeGet("caderno privado do analista", db.collection("analyst_notes").where("ownerEmail", "==", ownerEmail)),
            safeGet("avaliações privadas", db.collection("analyst_evaluations").where("ownerEmail", "==", ownerEmail)),
            safeGet("configurações das turmas", db.collection("analyst_class_overrides"))
        ]);

        const profileMap = new Map(profiles.docs.map(doc => [String(doc.data().analystKey || ""), doc.data()]));
        const analystNames = ANALYST_SEEDS.map(item => String(profileMap.get(item.key)?.fullName || (item.key === seed.key ? currentName : item.fallbackName)));
        const studentGroups = groupStudents(students.docs);
        const latestHistories = latestHistoryByClass(histories.docs);
        const overrideMap = new Map(overrides.docs.map(doc => [doc.id, doc.data()]));
        const classData = classes.docs.map(doc => {
            const summary = { turmaKey: doc.id, ...doc.data() };
            return buildClass(summary, studentGroups.get(doc.id) || [], latestHistories.get(doc.id), overrideMap.get(doc.id));
        }).sort((a, b) => b.id.localeCompare(a.id));

        const recoveryData = recoveries.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const evaluationMap = new Map(ownEvaluations.docs.map(doc => [doc.id, doc.data()]));
        const noteDocuments = new Map(sharedNotes.docs.map(doc => [doc.id, doc]));
        ownNotes.docs.forEach(doc => noteDocuments.set(doc.id, doc));
        const noteData = [...noteDocuments.values()].map(doc => {
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
                status: String(note.trackingStatus || "em_acompanhamento")
            };
        });

        window.SENAC_CENTRAL_USER = { uid: user.uid, email: user.email, name: currentName, analystKey: seed.key };
        window.SENAC_ANALYST_NAMES = analystNames;
        window.SENAC_CENTRAL_SYNC_WARNINGS = syncWarnings;
        window.SENAC_CENTRAL_INITIAL_DATA = { version: 2, classes: classData, recoveries: recoveryData, analystNotes: noteData };
        installPersistence(db, user, window.SENAC_CENTRAL_INITIAL_DATA);

        document.getElementById("analystProfileName").textContent = currentName;
        document.getElementById("profileAvatar").textContent = currentName.split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase();
        const script = document.createElement("script");
        script.src = `./analista.js?v=2.1.0`;
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
                nextRecoveries.forEach((item, id) => {
                    if (JSON.stringify(item) !== JSON.stringify(previousRecoveries.get(id))) {
                        writes.push(db.collection("analyst_recoveries").doc(id).set({ ...item, ownerEmail: user.email, updatedAt: new Date().toISOString() }, { merge: true }));
                    }
                });
                previousRecoveries.forEach((item, id) => { if (!nextRecoveries.has(id)) writes.push(db.collection("analyst_recoveries").doc(id).delete()); });
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
                    if (JSON.stringify(comparable) !== JSON.stringify(oldPayload)) writes.push(db.collection("analyst_class_overrides").doc(classItem.id).set(payload, { merge: true }));
                });
                const previousNotes = new Map((previous.analystNotes || []).map(item => [item.id, item]));
                (data.analystNotes || []).forEach(note => {
                    const oldNote = previousNotes.get(note.id);
                    const isOwner = String(note.ownerEmail || "").toLowerCase() === String(user.email || "").toLowerCase();
                    const trackingChanged = oldNote && (note.trackingStatus !== oldNote.trackingStatus || note.trackingEnabled !== oldNote.trackingEnabled);
                    if (!isOwner || !trackingChanged) return;
                    const statusUpdate = { trackingEnabled: note.trackingEnabled === true, trackingStatus: note.trackingStatus, updatedAt: new Date().toISOString() };
                    writes.push(db.collection("analyst_notes").doc(note.id).set(statusUpdate, { merge: true }));
                    writes.push(db.collection("analyst_shared_notes").doc(note.id).set(statusUpdate, { merge: true }));
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
        if (loading) loading.innerHTML = `<strong>Não foi possível abrir a Central do Analista.</strong><span>${String(error.message || error)}</span><a href="./index.html?perfil=instrutor">Voltar ao Dashboard</a>`;
    });
})();
