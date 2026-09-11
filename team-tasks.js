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
    const STEP_HELP = {
        "Entrar em contato": "Fale com o jovem, responsável ou instrutor. Conclua após registrar a data, o canal e o resultado do contato.",
        "Registrar orientação": "Descreva a orientação dada, o que foi combinado e o prazo para cumprir a ação.",
        "Aguardar retorno": "Acompanhe a resposta até o prazo combinado. Marque como concluída somente quando o retorno chegar.",
        "Verificar evidências": "Confira atividades, documentos ou comprovantes e registre se atendem ao que foi solicitado.",
        "Atualizar o caderno": "Registre a tratativa e seus encaminhamentos no caderno do instrutor relacionado.",
        "Registrar conclusão": "Descreva o resultado final e confirme que não existem pendências antes de encerrar a demanda."
    };
    const stepHelp = title => STEP_HELP[title] || "Execute a ação descrita e marque quando estiver concluída.";

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
        const values = [...central, ...contextual].map(item => ({ id: String(item.id || item.turma || item.turmaKey || "").match(/\d{9}/)?.[0] || "", course: String(item.course || ""), instructors: [...new Set([...(item.instructors || []), item.instructor, item.tutor1, item.tutor2].filter(Boolean).map(String))], students: Array.isArray(item.students) ? item.students : [] })).filter(item => item.id);
        return [...new Map(values.map(item => [item.id, item])).values()].sort((a, b) => b.id.localeCompare(a.id));
    }

    async function fillClassAndPeopleOptions(form, task = null) {
        const classes = availableClasses();
        const currentClass = task?.turma || window.SENAC_TASK_CONTEXT?.currentClass || pageContext().turma;
        form.elements.turma.innerHTML = `<option value="">Geral, sem turma específica</option>${classes.map(item => `<option value="${item.id}">${item.id}${item.course ? ` · ${esc(item.course)}` : ""}</option>`).join("")}`;
        form.elements.turma.value = classes.some(item => item.id === currentClass) ? currentClass : "";
        updateInstructorOptions(form, task?.instructor);
        form.elements.analyst.innerHTML = `<option value="">Selecione, se necessário</option>${analysts.map(item => `<option value="${esc(item.email)}" data-name="${esc(item.name)}" ${item.email ? "" : "disabled"}>${esc(item.name)}${item.email ? ` · ${esc(item.email)}` : " · acesso ainda não identificado"}</option>`).join("")}`;
        if (task?.analystEmail) form.elements.analyst.value = task.analystEmail;
        await fillStudents(form, task);
        refreshStageAssignments(form, task?.steps || []);
    }

    function updateInstructorOptions(form, selected = "") {
        const classItem = availableClasses().find(item => item.id === form.elements.turma.value);
        const instructors = classItem?.instructors || window.SENAC_TASK_CONTEXT?.currentInstructors || [];
        form.elements.instructor.innerHTML = `<option value="">Sem caderno relacionado</option>${instructors.map(name => `<option value="${esc(name)}">${esc(name)}</option>`).join("")}`;
        form.elements.instructor.value = instructors.includes(selected) ? selected : (instructors.length === 1 ? instructors[0] : "");
    }

    async function fillStudents(form, task = null) {
        const box = form.querySelector("[data-task-students]");
        const request = box._request = (box._request || 0) + 1;
        const turma = form.elements.turma.value;
        const scope = task?.studentScope || form.elements.studentScope.value || "all";
        form.elements.studentScope.value = scope;
        box.hidden = scope !== "selected";
        if (scope !== "selected") { box.innerHTML = ""; return; }
        if (!turma) { box.textContent = "Selecione uma turma para escolher os jovens."; return; }
        box.innerHTML = "Carregando jovens...";
        try {
            const classItem = availableClasses().find(item => item.id === form.elements.turma.value);
            let source = classItem?.students || [];
            if (typeof window.SENAC_CENTRAL_LOAD_CLASS_STUDENTS === "function") source = await window.SENAC_CENTRAL_LOAD_CLASS_STUDENTS(form.elements.turma.value);
            else if (typeof window.SENAC_TASK_LOAD_STUDENTS === "function") source = await window.SENAC_TASK_LOAD_STUDENTS(form.elements.turma.value);
            if (request !== box._request || turma !== form.elements.turma.value) return;
            source = Array.isArray(source) ? source : [];
            source = [...new Map([...source, ...(task?.students || [])].map(student => [String(student.id ?? student.name), student])).values()];
            const selected = new Set((task?.students || []).map(item => String(item.id)));
            box.innerHTML = source.length ? source.map((student, index) => `<label><input type="checkbox" data-student-id="${esc(student.id ?? index)}" data-student-name="${esc(student.name)}" ${selected.has(String(student.id ?? index)) ? "checked" : ""}> ${esc(student.name)}</label>`).join("") : "Nenhum jovem encontrado nesta turma.";
        } catch (error) {
            if (request !== box._request) return;
            box.innerHTML = "Não foi possível carregar os jovens desta turma.";
        }
    }

    function stageTitles(form) {
        const preset = [...form.elements.presetStep].filter(input => input.checked).map(input => input.value);
        const custom = String(form.elements.steps.value).split(/\r?\n/).map(value => value.trim()).filter(Boolean);
        return [...new Set([...preset, ...custom])];
    }

    function refreshStageAssignments(form, savedSteps = []) {
        const holder = form.querySelector("[data-stage-assignments]");
        const previous = new Map([...holder.querySelectorAll("[data-stage-row]")].map(row => [row.dataset.stageRow, { name: row.querySelector("[data-stage-name]").value, email: row.querySelector("[data-stage-email]").value }]));
        const people = [{ name: currentUser.displayName || currentUser.email, email: currentUser.email }, ...analysts, ...(availableClasses().find(item => item.id === form.elements.turma.value)?.instructors || []).map(name => ({ name, email: "" }))];
        const options = [...new Map(people.map(item => [keyOf(item.name), item])).values()];
        holder.innerHTML = stageTitles(form).map(title => {
            const saved = savedSteps.find(step => step.title === title) || previous.get(title) || {};
            return `<div class="senac-task-stage-row" data-stage-row="${esc(title)}"><strong>${esc(title)}</strong><input data-stage-name list="senacTaskPeople" placeholder="Responsável por nome" value="${esc(saved.assigneeName || saved.name || "")}"><input data-stage-email type="email" placeholder="E-mail do responsável" value="${esc(saved.assigneeEmail || saved.email || "")}"></div>`;
        }).join("");
        form.querySelector("#senacTaskPeople").innerHTML = options.map(item => `<option value="${esc(item.name)}" data-email="${esc(item.email)}"></option>`).join("");
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
            <div class="senac-task-tools"><button type="button" class="senac-task-button primary" data-new-task>+ Nova demanda</button><button type="button" class="senac-task-button" data-task-report>Copiar resumo</button><span>Arraste os cartões entre colunas ou use “Mover para”. Edite ou exclua as demandas que você criou.</span></div>
            <form class="senac-task-form" id="senacTaskForm"><input type="hidden" name="taskId"><datalist id="senacTaskPeople"></datalist>
                <label>Título<input name="title" required maxlength="120"></label><label>Turma<select name="turma"></select></label>
                <label class="wide">Descrição<textarea name="description" required rows="3"></textarea></label>
                <label>A quem se refere a demanda?<select name="studentScope"><option value="all">Toda a turma / demanda geral</option><option value="selected">Um ou mais jovens da turma</option></select></label>
                <label>Caderno do instrutor relacionado<select name="instructor"></select></label>
                <div class="senac-task-students wide" data-task-students hidden></div>
                <label>Analista responsável<select name="analyst"></select></label><label>E-mails adicionais<input name="members" placeholder="outro@pr.senac.br"></label>
                <label>Data de início<input name="startDate" type="date" required></label><label>Prazo<input name="dueDate" type="date" required></label>
                <div class="wide senac-task-guide"><strong>Checklist da demanda</strong><p>Escolha as ações necessárias abaixo. Selecionar aqui inclui a etapa; depois de salvar, marque no cartão somente o que já foi feito. Marcar “Aguardar retorno” não envia mensagens nem cria lembretes automáticos.</p></div>
                <div class="senac-task-presets">${STEP_PRESETS.map((step, index) => `<label><input type="checkbox" name="presetStep" value="${esc(step)}" ${[0,2,5].includes(index) ? "checked" : ""}><span><strong>${esc(step)}</strong><small>${esc(stepHelp(step))}</small></span></label>`).join("")}</div>
                <label class="wide">Outras etapas, uma por linha<textarea name="steps" rows="3" placeholder="Digite somente as etapas adicionais"></textarea></label><p class="senac-task-helper">As etapas marcadas acima serão incluídas. Você pode desmarcar ou acrescentar novas etapas.</p>
                <div class="senac-task-stage-assignments wide"><strong>Responsável por cada etapa</strong><div data-stage-assignments></div></div>
                <label class="senac-task-notify wide"><input type="checkbox" name="notifyEmail" checked> Abrir o Outlook com o aviso pronto ao salvar</label>
                <div class="senac-task-form-actions"><button type="button" class="senac-task-button" data-cancel-task>Cancelar</button><button class="senac-task-button primary" type="submit">Salvar e sinalizar</button></div>
            </form><div class="senac-task-board" id="senacTaskBoard"></div></section>`;
        document.body.append(backdrop);
        const entryCopy = document.createElement("span");
        entryCopy.className = "senac-task-entry-copy";
        entryCopy.textContent = "Organize tarefas, responsáveis e prazos";
        const placeLauncher = () => {
            const slot = document.querySelector("[data-task-launcher-slot]");
            if (slot && launcher.parentElement !== slot) slot.append(entryCopy, launcher);
        };
        placeLauncher();
        // O cabeçalho React pode aparecer depois da autenticação ou ser recriado.
        new MutationObserver(placeLauncher).observe(document.body, { childList: true, subtree: true });
        const form = backdrop.querySelector("#senacTaskForm");
        launcher.addEventListener("click", () => { backdrop.hidden = false; render(); });
        backdrop.querySelector(".senac-task-close").addEventListener("click", () => { backdrop.hidden = true; });
        backdrop.addEventListener("click", event => { if (event.target === backdrop) backdrop.hidden = true; });
        const openForm = async (task = null) => {
            form.classList.add("open");
            backdrop.querySelector(".senac-task-modal").scrollTop = 0;
            form.reset();
            form.querySelector("[data-stage-assignments]").innerHTML = "";
            form.elements.taskId.value = task?.id || "";
            form.elements.title.value = task?.title || "";
            form.elements.description.value = task?.description || "";
            form.elements.members.value = (task?.extraMemberEmails || []).join("; ");
            form.elements.startDate.value = task?.startDate || today();
            form.elements.dueDate.value = task?.dueDate || "";
            [...form.elements.presetStep].forEach((input, index) => { input.checked = task ? task.steps.some(step => step.title === input.value) : [0,2,5].includes(index); });
            form.elements.steps.value = task ? task.steps.filter(step => !STEP_PRESETS.includes(step.title)).map(step => step.title).join("\n") : "";
            await fillClassAndPeopleOptions(form, task);
            form.elements.title.focus();
        };
        backdrop._openTaskForm = openForm;
        backdrop.querySelector("[data-new-task]").addEventListener("click", () => openForm());
        form.elements.turma.addEventListener("change", async () => { updateInstructorOptions(form); await fillStudents(form); refreshStageAssignments(form); });
        form.elements.studentScope.addEventListener("change", () => fillStudents(form));
        [...form.elements.presetStep].forEach(input => input.addEventListener("change", () => refreshStageAssignments(form)));
        form.elements.steps.addEventListener("input", () => refreshStageAssignments(form));
        form.querySelector("[data-stage-assignments]").addEventListener("change", event => {
            if (!event.target.matches("[data-stage-name]")) return;
            const option = [...form.querySelector("#senacTaskPeople").options].find(item => item.value === event.target.value);
            if (option?.dataset.email) event.target.closest("[data-stage-row]").querySelector("[data-stage-email]").value = option.dataset.email;
        });
        backdrop.querySelector("[data-cancel-task]").addEventListener("click", () => form.classList.remove("open"));
        backdrop.querySelector("[data-task-report]").addEventListener("click", copySummary);
        form.addEventListener("submit", async event => {
            const button = form.querySelector('[type="submit"]');
            button.disabled = true;
            try { await createTask(event); } catch (error) { toast("Não foi possível concluir o salvamento. Confira a conexão e as permissões."); console.error(error); }
            finally { button.disabled = false; }
        });
        const board = backdrop.querySelector("#senacTaskBoard");
        board.addEventListener("change", event => updateTaskFromBoard(event).catch(() => { render(); toast("Não foi possível atualizar a demanda."); }));
        board.addEventListener("dragstart", event => {
            const card = event.target.closest("[data-card-id]");
            if (card) event.dataTransfer.setData("text/plain", card.dataset.cardId);
        });
        board.addEventListener("dragover", event => { if (event.target.closest("[data-column]")) event.preventDefault(); });
        board.addEventListener("drop", event => {
            const column = event.target.closest("[data-column]");
            if (!column) return;
            event.preventDefault();
            const id = event.dataTransfer.getData("text/plain");
            if (!tasks.some(task => task.id === id)) return;
            updateTaskFromBoard({ target: { dataset: { taskStatus: id }, value: column.dataset.column } }).catch(() => { render(); toast("Não foi possível mover a demanda."); });
        });
        backdrop.querySelector("#senacTaskBoard").addEventListener("click", event => {
            const calendarButton = event.target.closest("[data-task-calendar]");
            const editButton = event.target.closest("[data-task-edit]");
            const deleteButton = event.target.closest("[data-task-delete]");
            if (calendarButton) openOutlookCalendar(tasks.find(task => task.id === calendarButton.dataset.taskCalendar));
            if (editButton) openForm(tasks.find(task => task.id === editButton.dataset.taskEdit));
            if (deleteButton) deleteTask(tasks.find(task => task.id === deleteButton.dataset.taskDelete)).catch(() => toast("Não foi possível concluir a exclusão. Confira a conexão e as permissões."));
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
            return `<section class="senac-task-column" data-column="${column.id}" style="--task-tone:${column.tone}"><header><span>${column.label}</span><b>${items.length}</b></header>${items.map(taskCard).join("") || `<div class="senac-task-empty">Arraste uma demanda para cá</div>`}</section>`;
        }).join("");
        window.dispatchEvent(new CustomEvent("senac-team-tasks-updated", { detail: { tasks } }));
    }

    function taskCard(task) {
        const steps = Array.isArray(task.steps) ? task.steps : [];
        const done = steps.filter(step => step.done).length;
        const progress = steps.length ? Math.round(done / steps.length * 100) : 0;
        const target = task.studentScope === "selected" ? (task.students || []).map(student => student.name).join(", ") : (task.turma ? "Toda a turma" : "Demanda geral");
        const canManage = task.creatorEmail === currentUser.email.toLowerCase();
        return `<article class="senac-task-card" draggable="true" data-card-id="${esc(task.id)}" style="--task-tone:${STATUS.find(item => item.id === task.status)?.tone || "#004a8d"}">
            <div class="senac-task-card-actions">${canManage ? `<button type="button" class="senac-task-button" data-task-edit="${esc(task.id)}">Editar</button><button type="button" class="senac-task-button danger" data-task-delete="${esc(task.id)}">Excluir</button>` : '<small>Compartilhada com você</small>'}</div>
            <h3>${esc(task.title)}</h3><p>${esc(task.description)}</p>
            <div class="senac-task-target"><strong>${task.turma ? `Turma ${esc(task.turma)}` : "Geral"}</strong><span>${esc(target)}</span></div>
            <div class="senac-task-meta"><span>Checklist de execução</span><span>${done}/${steps.length} · ${progress}%</span></div>
            <div class="senac-task-progress"><i style="--task-progress:${progress}%"></i></div>
            <div class="senac-task-steps">${steps.map((step, index) => `<label><input type="checkbox" data-task-step="${esc(task.id)}" data-step-index="${index}" ${step.done ? "checked" : ""}><span><strong>${esc(step.title)}</strong><small>${esc(stepHelp(step.title))}</small>${step.assigneeName || step.assigneeEmail ? `<small>Responsável: ${esc(step.assigneeName || step.assigneeEmail)}</small>` : ""}</span></label>`).join("")}</div>
            <div class="senac-task-meta"><span>Prazo: ${displayDate(task.dueDate)}</span><span>${esc(task.analystName || task.instructor || "")}</span></div>
            <label class="senac-task-move">Mover para<select data-task-status="${esc(task.id)}">${STATUS.map(item => `<option value="${item.id}" ${item.id === task.status ? "selected" : ""}>${item.label}</option>`).join("")}</select></label>
            <button type="button" class="senac-task-button" data-task-calendar="${esc(task.id)}">Agenda Outlook</button></article>`;
    }

    async function createTask(event) {
        event.preventDefault();
        const form = event.currentTarget;
        const existing = tasks.find(item => item.id === form.elements.taskId.value);
        const analystEmail = String(form.elements.analyst.value || "").trim();
        const extraMemberEmails = String(form.elements.members.value).split(/[;,\s]+/).map(value => value.trim().toLowerCase()).filter(value => /^[^@\s]+@[^@\s]+$/.test(value));
        const steps = [...form.querySelectorAll("[data-stage-row]")].map(row => ({ title: row.dataset.stageRow, done: Boolean(existing?.steps.find(step => step.title === row.dataset.stageRow)?.done), assigneeName: row.querySelector("[data-stage-name]").value.trim(), assigneeEmail: row.querySelector("[data-stage-email]").value.trim().toLowerCase() }));
        if (!steps.length) return toast("Informe pelo menos uma etapa.");
        const invalidAssignee = steps.find(step => step.assigneeName && !/^[^@\s]+@[^@\s]+$/.test(step.assigneeEmail));
        if (invalidAssignee) return toast(`Informe o e-mail de ${invalidAssignee.assigneeName}.`);
        const students = form.elements.studentScope.value === "selected" ? [...form.querySelectorAll("[data-student-id]:checked")].map(input => ({ id: input.dataset.studentId, name: input.dataset.studentName })) : [];
        if (form.elements.studentScope.value === "selected" && !form.elements.turma.value) return toast("Selecione a turma dos jovens.");
        if (form.elements.studentScope.value === "selected" && !students.length) return toast("Selecione pelo menos um jovem.");
        const analystName = form.elements.analyst.selectedOptions[0]?.dataset.name || "";
        const memberEmails = [...new Set([currentUser.email, analystEmail, ...extraMemberEmails, ...steps.map(step => step.assigneeEmail)].map(value => value.trim().toLowerCase()).filter(value => /^[^@\s]+@[^@\s]+$/.test(value)))];
        const ref = db.collection("team_tasks").doc(existing?.id);
        const task = { id: ref.id, title: form.elements.title.value.trim(), description: form.elements.description.value.trim(), turma: form.elements.turma.value.trim(), instructor: form.elements.instructor.value.trim(), analystName, analystEmail, studentScope: form.elements.studentScope.value, students, creatorEmail: existing?.creatorEmail || currentUser.email, creatorName: existing?.creatorName || currentUser.displayName || currentUser.email, memberEmails, extraMemberEmails, steps, status: existing?.status || "planned", startDate: form.elements.startDate.value, dueDate: form.elements.dueDate.value, createdAt: existing?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
        const recipients = memberEmails.filter(email => email !== currentUser.email.toLowerCase());
        const mailWindow = form.elements.notifyEmail.checked && recipients.length ? window.open("about:blank", "_blank") : null;
        await ref.set(task);
        await recordHistory(task, existing ? "update" : "create", `Tarefa ${existing ? "atualizada" : "criada"}: ${task.title}.`, existing || {});
        await writeNotebookShadow(task);
        form.classList.remove("open");
        form.reset();
        toast(`Tarefa ${existing ? "atualizada" : "criada"} e sinalizada aos responsáveis.`);
        if (mailWindow) mailWindow.location.href = outlookMailUrl(task, recipients);
    }

    async function deleteTask(task) {
        if (!task || !confirm(`Excluir a tarefa "${task.title}"?`)) return;
        await db.collection("team_tasks").doc(task.id).delete();
        await db.collection("instructor_notes").doc(`task_${task.id}`).delete().catch(() => null);
        await recordHistory(task, "delete", `Tarefa excluída: ${task.title}.`, task);
        toast("Tarefa excluída.");
    }

    async function updateTaskFromBoard(event) {
        const statusId = event.target.dataset.taskStatus;
        const stepTaskId = event.target.dataset.taskStep;
        const original = tasks.find(item => item.id === (statusId || stepTaskId));
        if (!original) return;
        const before = JSON.parse(JSON.stringify(original));
        const task = JSON.parse(JSON.stringify(original));
        if (statusId) task.status = event.target.value;
        if (stepTaskId) task.steps[Number(event.target.dataset.stepIndex)].done = event.target.checked;
        if (stepTaskId) {
            if (task.steps.length && task.steps.every(step => step.done)) task.status = "done";
            else if (task.status === "done") task.status = "working";
        }
        if (statusId && task.status === "done" && task.steps.some(step => !step.done)) {
            if (!confirm("Concluir a demanda e marcar todas as etapas como realizadas?")) { render(); return; }
            task.steps = task.steps.map(step => ({ ...step, done: true }));
        }
        task.updatedAt = new Date().toISOString();
        await db.collection("team_tasks").doc(task.id).set({ status: task.status, steps: task.steps, updatedAt: task.updatedAt }, { merge: true });
        Object.assign(original, task);
        await recordHistory(task, "update", `Tarefa atualizada: ${task.title} (${task.steps.filter(step => step.done).length} de ${task.steps.length} etapas).`, before);
        render();
    }

    async function recordHistory(task, action, summary, before = {}) {
        const ref = db.collection("activity_history").doc();
        await ref.set({ turmaKey: task.turma || "GERAL", category: "notebook", action: `task_${action}`, summary, occurredAt: new Date().toISOString(), actorEmail: currentUser.email, actorName: currentUser.displayName || currentUser.email, entityId: task.id, before, after: task });
    }

    async function writeNotebookShadow(task) {
        if (!task.turma || !task.instructor) return;
        const targetNames = task.studentScope === "selected" ? task.students.map(student => student.name) : [];
        const note = { turmaKey: keyOf(task.turma), instructorKey: keyOf(task.instructor), scope: targetNames.length === 1 ? "student" : "class", studentName: targetNames.length === 1 ? targetNames[0] : "", date: task.startDate, notes: `[Tarefa] ${task.title}\n${task.description}\nJovens: ${targetNames.length ? targetNames.join(", ") : "Toda a turma"}\nEtapas: ${task.steps.map(step => `${step.title}${step.assigneeName ? ` (${step.assigneeName})` : ""}`).join("; ")}`, situationTypes: ["Tarefa / demanda"], attachments: [], treatmentStatus: task.status === "done" ? "concluida" : "em_tratativa", responsibleAnalyst: task.analystName || "", treatmentStartDate: task.startDate, treatmentDueDate: task.dueDate, treatmentDays: null, ownerEmail: currentUser.email, taskId: task.id };
        await db.collection("instructor_notes").doc(`task_${task.id}`).set(note).catch(error => console.warn("Tarefa criada; vínculo com o caderno não pôde ser gravado.", error));
    }

    function openOutlookCalendar(task) {
        if (!task?.dueDate) return toast("A tarefa não possui prazo.");
        const start = `${task.dueDate}T09:00:00`;
        const end = `${task.dueDate}T09:30:00`;
        const body = `${task.description}\nTurma: ${task.turma || "Geral"}\nJovens: ${task.studentScope === "selected" ? task.students.map(item => item.name).join(", ") : "Toda a turma"}`;
        window.open(`https://outlook.office.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(task.title)}&startdt=${encodeURIComponent(start)}&enddt=${encodeURIComponent(end)}&body=${encodeURIComponent(body)}&allday=false`, "_blank", "noopener");
    }

    function outlookMailUrl(task, recipients) {
        const subject = `Tarefa: ${task.title}${task.turma ? ` - Turma ${task.turma}` : ""}`;
        const body = [`Olá,`, "", "Você foi indicado(a) em uma tarefa no Dashboard Senac.", `Tarefa: ${task.title}`, `Turma: ${task.turma || "Geral"}`, `Jovens: ${task.studentScope === "selected" ? task.students.map(item => item.name).join(", ") : "Toda a turma"}`, `Prazo: ${displayDate(task.dueDate)}`, "", "Etapas:", ...task.steps.map((step, index) => `${index + 1}. ${step.title}${step.assigneeName ? ` - ${step.assigneeName}` : ""}`), "", task.description].join("\n");
        return `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(recipients.join(";"))}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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
