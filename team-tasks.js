(() => {
    "use strict";
    if (window.SENAC_TEAM_TASKS_READY) return;
    window.SENAC_TEAM_TASKS_READY = true;

    const STATUS = [
        { id: "planned", label: "A organizar", tone: "#6b7786" },
        { id: "working", label: "Em andamento", tone: "#1976b8" },
        { id: "waiting", label: "Aguardando retorno", tone: "#d17b08" },
        { id: "done", label: "Concluída", tone: "#078847" }
    ];
    let currentUser = null;
    let db = null;
    let tasks = [];
    let analysts = [];
    let firstSnapshot = true;
    const STEP_PRESETS = ["Entrar em contato", "Registrar orientação", "Aguardar retorno", "Verificar evidências", "Atualizar o caderno", "Registrar conclusão"];

    const esc = value => String(value ?? "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
    const keyOf = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "") || "NAO_IDENTIFICADO";
    const today = () => new Date().toISOString().slice(0, 10);
    const displayDate = value => value ? value.split("-").reverse().join("/") : "Sem prazo";
    const openTasks = () => tasks.filter(task => task.status !== "done");

    function toast(message) {
        document.querySelector(".senac-task-toast")?.remove();
        const element = document.createElement("div");
        element.className = "senac-task-toast";
        element.textContent = message;
        document.body.appendChild(element);
        setTimeout(() => element.remove(), 4200);
    }

    function pageContext() {
        const turmaText = document.body.innerText.match(/Turma:\s*(\d{9})/i)?.[1] || "";
        return { turma: turmaText };
    }

    function availableClasses() {
        const central = Array.isArray(window.SENAC_CENTRAL_INITIAL_DATA?.classes) ? window.SENAC_CENTRAL_INITIAL_DATA.classes : [];
        const contextual = Array.isArray(window.SENAC_TASK_CONTEXT?.classes) ? window.SENAC_TASK_CONTEXT.classes : [];
        const values = [...central, ...contextual].map(item => ({ id: String(item.id || item.turma || item.turmaKey || "").match(/\d{9}/)?.[0] || "", course: String(item.course || ""), instructors: [...new Set([...(item.instructors || []), item.instructor, item.tutor1, item.tutor2].filter(Boolean).map(String))] })).filter(item => item.id);
        return [...new Map(values.map(item => [item.id, item])).values()].sort((a, b) => b.id.localeCompare(a.id));
    }

    function fillClassAndPeopleOptions(form) {
        const classes = availableClasses();
        const currentClass = window.SENAC_TASK_CONTEXT?.currentClass || pageContext().turma;
        form.elements.turma.innerHTML = `<option value="">Geral, sem turma específica</option>${classes.map(item => `<option value="${item.id}">${item.id}${item.course ? ` · ${esc(item.course)}` : ""}</option>`).join("")}`;
        form.elements.turma.value = classes.some(item => item.id === currentClass) ? currentClass : "";
        updateInstructorOptions(form);
        form.elements.analyst.innerHTML = `<option value="">Selecione, se necessário</option>${analysts.map(item => `<option value="${esc(item.email)}" ${item.email ? "" : "disabled"}>${esc(item.name)}${item.email ? ` · ${esc(item.email)}` : " · acesso ainda não identificado"}</option>`).join("")}`;
    }

    function updateInstructorOptions(form) {
        const classItem = availableClasses().find(item => item.id === form.elements.turma.value);
        const instructors = classItem?.instructors || window.SENAC_TASK_CONTEXT?.currentInstructors || [];
        form.elements.instructor.innerHTML = `<option value="">Sem caderno relacionado</option>${instructors.map(name => `<option value="${esc(name)}">${esc(name)}</option>`).join("")}`;
    }

    function buildUI() {
        const launcher = document.createElement("button");
        launcher.type = "button";
        launcher.className = "senac-task-launcher";
        launcher.innerHTML = `Tarefas e demandas <b id="senacTaskCount">0</b>`;
        const backdrop = document.createElement("div");
        backdrop.className = "senac-task-backdrop";
        backdrop.hidden = true;
        backdrop.innerHTML = `<section class="senac-task-modal" role="dialog" aria-modal="true" aria-label="Organizador de tarefas">
            <header class="senac-task-header"><div><h2>Tarefas e demandas</h2><p>Organize responsáveis, etapas, prazos e tratativas compartilhadas.</p></div><button type="button" class="senac-task-close" aria-label="Fechar">×</button></header>
            <div class="senac-task-tools"><button type="button" class="senac-task-button primary" data-new-task>Iniciar tarefa</button><button type="button" class="senac-task-button" data-task-report>Copiar resumo</button></div>
            <form class="senac-task-form" id="senacTaskForm">
                <label>Título<input name="title" required maxlength="120"></label><label>Turma<select name="turma"></select></label>
                <label class="wide">Descrição<textarea name="description" required rows="3"></textarea></label>
                <label>Analista responsável<select name="analyst"></select></label><label>E-mails adicionais<input name="members" placeholder="outro@pr.senac.br"></label>
                <label>Data de início<input name="startDate" type="date" required></label><label>Prazo<input name="dueDate" type="date" required></label>
                <div class="senac-task-presets">${STEP_PRESETS.map((step, index) => `<label><input type="checkbox" name="presetStep" value="${esc(step)}" ${[0,2,5].includes(index) ? "checked" : ""}> ${esc(step)}</label>`).join("")}</div>
                <label class="wide">Outras etapas, uma por linha<textarea name="steps" rows="3" placeholder="Digite somente as etapas adicionais"></textarea></label><p class="senac-task-helper">As etapas marcadas acima serão incluídas. Você pode desmarcar ou acrescentar novas etapas.</p>
                <label class="wide">Caderno do instrutor relacionado (opcional)<select name="instructor"></select></label>
                <div class="senac-task-form-actions"><button type="button" class="senac-task-button" data-cancel-task>Cancelar</button><button class="senac-task-button primary" type="submit">Criar e sinalizar</button></div>
            </form><div class="senac-task-board" id="senacTaskBoard"></div></section>`;
        document.body.append(launcher, backdrop);
        const form = backdrop.querySelector("#senacTaskForm");
        launcher.addEventListener("click", () => { backdrop.hidden = false; render(); });
        backdrop.querySelector(".senac-task-close").addEventListener("click", () => { backdrop.hidden = true; });
        backdrop.addEventListener("click", event => { if (event.target === backdrop) backdrop.hidden = true; });
        backdrop.querySelector("[data-new-task]").addEventListener("click", () => {
            form.classList.add("open");
            form.reset();
            fillClassAndPeopleOptions(form);
            form.elements.startDate.value = today();
            [...form.elements.presetStep].forEach((input, index) => { input.checked = [0,2,5].includes(index); });
            form.elements.title.focus();
        });
        form.elements.turma.addEventListener("change", () => updateInstructorOptions(form));
        backdrop.querySelector("[data-cancel-task]").addEventListener("click", () => form.classList.remove("open"));
        backdrop.querySelector("[data-task-report]").addEventListener("click", copySummary);
        form.addEventListener("submit", createTask);
        backdrop.querySelector("#senacTaskBoard").addEventListener("change", updateTaskFromBoard);
        backdrop.querySelector("#senacTaskBoard").addEventListener("click", event => {
            const calendarButton = event.target.closest("[data-task-calendar]");
            if (calendarButton) exportCalendar(tasks.find(task => task.id === calendarButton.dataset.taskCalendar));
        });
    }

    function render() {
        window.SENAC_TEAM_TASKS = tasks;
        const count = document.getElementById("senacTaskCount");
        if (count) count.textContent = openTasks().length;
        const board = document.getElementById("senacTaskBoard");
        if (!board) return;
        board.innerHTML = STATUS.map(column => {
            const items = tasks.filter(task => task.status === column.id);
            return `<section class="senac-task-column" style="--task-tone:${column.tone}"><header><span>${column.label}</span><b>${items.length}</b></header>${items.map(taskCard).join("") || `<div class="senac-task-empty">Sem tarefas</div>`}</section>`;
        }).join("");
        window.dispatchEvent(new CustomEvent("senac-team-tasks-updated", { detail: { tasks } }));
    }

    function taskCard(task) {
        const steps = Array.isArray(task.steps) ? task.steps : [];
        const done = steps.filter(step => step.done).length;
        const progress = steps.length ? Math.round(done / steps.length * 100) : 0;
        return `<article class="senac-task-card" style="--task-tone:${STATUS.find(item => item.id === task.status)?.tone || "#004a8d"}"><h3>${esc(task.title)}</h3><p>${esc(task.description)}</p><div class="senac-task-meta"><span>${esc(task.turma || "Geral")}</span><span>${done} de ${steps.length} etapas</span></div><div class="senac-task-progress"><i style="--task-progress:${progress}%"></i></div><div class="senac-task-steps">${steps.map((step, index) => `<label><input type="checkbox" data-task-step="${task.id}" data-step-index="${index}" ${step.done ? "checked" : ""}> <span>${esc(step.title)}</span></label>`).join("")}</div><div class="senac-task-meta"><span>Prazo: ${displayDate(task.dueDate)}</span><span>${esc((task.memberEmails || []).join(", "))}</span></div><select data-task-status="${task.id}">${STATUS.map(item => `<option value="${item.id}" ${item.id === task.status ? "selected" : ""}>${item.label}</option>`).join("")}</select><div class="senac-task-card-actions"><button type="button" class="senac-task-button" data-task-calendar="${task.id}">Agenda Outlook</button></div></article>`;
    }

    async function createTask(event) {
        event.preventDefault();
        const form = event.currentTarget;
        const analystEmail = String(form.elements.analyst.value || "").trim();
        const memberEmails = [...new Set([currentUser.email, analystEmail, ...String(form.elements.members.value).split(/[;,\s]+/)].map(value => value.trim().toLowerCase()).filter(value => /^[^@\s]+@[^@\s]+$/.test(value)))];
        const presetSteps = [...form.elements.presetStep].filter(input => input.checked).map(input => input.value);
        const customSteps = String(form.elements.steps.value).split(/\r?\n/).map(value => value.trim()).filter(Boolean);
        const steps = [...new Set([...presetSteps, ...customSteps])].map(title => ({ title, done: false }));
        if (!steps.length) return toast("Informe pelo menos uma etapa.");
        const ref = db.collection("team_tasks").doc();
        const task = { id: ref.id, title: form.elements.title.value.trim(), description: form.elements.description.value.trim(), turma: form.elements.turma.value.trim(), instructor: form.elements.instructor.value.trim(), creatorEmail: currentUser.email, creatorName: currentUser.displayName || currentUser.email, memberEmails, steps, status: "planned", startDate: form.elements.startDate.value, dueDate: form.elements.dueDate.value, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        await ref.set(task);
        await recordHistory(task, "create", `Tarefa criada: ${task.title}.`);
        await writeNotebookShadow(task);
        form.classList.remove("open");
        form.reset();
        toast("Tarefa criada e sinalizada aos responsáveis.");
    }

    async function updateTaskFromBoard(event) {
        const statusId = event.target.dataset.taskStatus;
        const stepTaskId = event.target.dataset.taskStep;
        const task = tasks.find(item => item.id === (statusId || stepTaskId));
        if (!task) return;
        const before = JSON.parse(JSON.stringify(task));
        if (statusId) task.status = event.target.value;
        if (stepTaskId) task.steps[Number(event.target.dataset.stepIndex)].done = event.target.checked;
        if (task.steps.length && task.steps.every(step => step.done)) task.status = "done";
        if (task.status === "done") task.steps = task.steps.map(step => ({ ...step, done: true }));
        task.updatedAt = new Date().toISOString();
        await db.collection("team_tasks").doc(task.id).set({ status: task.status, steps: task.steps, updatedAt: task.updatedAt }, { merge: true });
        await recordHistory(task, "update", `Tarefa atualizada: ${task.title} (${task.steps.filter(step => step.done).length} de ${task.steps.length} etapas).`, before);
        render();
    }

    async function recordHistory(task, action, summary, before = {}) {
        const ref = db.collection("activity_history").doc();
        await ref.set({ turmaKey: task.turma || "GERAL", category: "notebook", action: `task_${action}`, summary, occurredAt: new Date().toISOString(), actorEmail: currentUser.email, actorName: currentUser.displayName || currentUser.email, entityId: task.id, before, after: task });
    }

    async function writeNotebookShadow(task) {
        if (!task.turma || !task.instructor) return;
        const note = { turmaKey: keyOf(task.turma), instructorKey: keyOf(task.instructor), scope: "class", date: task.startDate, notes: `[Tarefa] ${task.title}\n${task.description}\nEtapas: ${task.steps.map(step => step.title).join("; ")}`, situationTypes: ["Tarefa / demanda"], attachments: [], treatmentStatus: "em_tratativa", responsibleAnalyst: task.creatorName, treatmentStartDate: task.startDate, treatmentDueDate: task.dueDate, treatmentDays: null, ownerEmail: currentUser.email, taskId: task.id };
        await db.collection("instructor_notes").doc(`task_${task.id}`).set(note).catch(error => console.warn("Tarefa criada; vínculo com o caderno não pôde ser gravado.", error));
    }

    function exportCalendar(task) {
        if (!task?.dueDate) return toast("A tarefa não possui prazo.");
        const date = task.dueDate.replaceAll("-", "");
        const content = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Senac//Tarefas//PT-BR", "BEGIN:VEVENT", `UID:${task.id}@senac`, `DTSTART;VALUE=DATE:${date}`, `DTEND;VALUE=DATE:${date}`, `SUMMARY:${task.title.replace(/[\r\n]/g, " ")}`, `DESCRIPTION:${task.description.replace(/[\r\n]/g, " ")} | Turma ${task.turma || "Geral"}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
        const link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob([content], { type: "text/calendar;charset=utf-8" }));
        link.download = `tarefa-${keyOf(task.title).toLowerCase()}.ics`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    }

    async function copySummary() {
        const text = [`TAREFAS E DEMANDAS`, `Em aberto: ${openTasks().length}`, `Concluídas: ${tasks.filter(task => task.status === "done").length}`, "", ...tasks.map(task => `${task.title} | ${task.turma || "Geral"} | ${task.steps.filter(step => step.done).length}/${task.steps.length} etapas | Prazo ${displayDate(task.dueDate)}`)].join("\n");
        await navigator.clipboard.writeText(text).catch(() => null);
        toast("Resumo das tarefas copiado.");
    }

    async function start(user) {
        currentUser = user;
        db = firebase.firestore();
        const fallbackAnalysts = (window.SENAC_ANALYST_OPTIONS || [
            { name: "Michel Farias" }, { name: "Mariana Mello" }, { name: "Bruna Cunha" }, { name: "Bianca Aresta" }, { name: "Juliana Severo" }
        ]).map(item => ({ name: item.name || String(item), email: item.email || "" }));
        try {
            const profiles = await db.collection("analyst_profiles").get();
            const saved = profiles.docs.map(doc => doc.data() || {}).map(item => ({ name: String(item.fullName || item.analystKey || "Analista"), email: String(item.email || "").toLowerCase() }));
            analysts = [...new Map([...fallbackAnalysts, ...saved].map(item => [keyOf(item.name), item])).values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
        } catch (error) {
            analysts = fallbackAnalysts;
            console.warn("Não foi possível atualizar a lista de analistas.", error);
        }
        buildUI();
        db.collection("team_tasks").where("memberEmails", "array-contains", user.email.toLowerCase()).limit(200).onSnapshot(snapshot => {
            const previousIds = new Set(tasks.map(task => task.id));
            tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
            if (!firstSnapshot) {
                const received = tasks.find(task => !previousIds.has(task.id) && task.creatorEmail !== user.email);
                if (received) toast(`Nova tarefa recebida: ${received.title}`);
            }
            firstSnapshot = false;
            render();
        }, error => console.warn("Não foi possível carregar tarefas compartilhadas.", error));
    }

    const waitForFirebase = setInterval(() => {
        if (!window.firebase?.auth) return;
        clearInterval(waitForFirebase);
        firebase.auth().onAuthStateChanged(user => { if (user) start(user); });
    }, 200);
})();
