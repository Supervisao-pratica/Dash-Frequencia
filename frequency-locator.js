const fs = require('fs');
const path = require('path');

const DEFAULT_NETWORK_ROOT = '\\\\intra.pr.senac.br\\Arquivos\\Portao\\RedeEADAprendizagem\\Aprendizagem-Nacional';
const FREQUENCY_EXTENSIONS = new Set(['.xlsm', '.xlsx', '.xls']);

const normalizeName = value => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

const extractClassNumber = value => {
    const match = String(value || '').match(/\d{6,}/);
    return match ? match[0] : '';
};

const directoryEntries = async directory => fs.promises.readdir(directory, { withFileTypes: true });

const isFrequencyFile = entry => {
    if (!entry.isFile() || entry.name.startsWith('~$')) return false;
    if (!FREQUENCY_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) return false;
    const normalized = normalizeName(entry.name);
    if (/INFORMACOES? GERAIS|DADOS GERAIS|ATIVIDADE|MALA DIRETA|CRONOGRAMA|RESUMO|SUPERVISOR/.test(normalized)) return false;
    return normalized.includes('FREQUENCIA') || normalized.includes('CHAMADA');
};

const rankCandidate = (candidate, turma) => {
    const normalized = normalizeName(candidate.name);
    let score = 0;
    if (normalized.includes('FREQUENCIA')) score += 100;
    if (normalized.includes('CHAMADA')) score += 80;
    if (normalized.includes(turma)) score += 35;
    if (path.extname(candidate.name).toLowerCase() === '.xlsm') score += 25;
    if (normalized.includes('MODELO')) score -= 5;
    return score;
};

const listFrequencyFiles = async (directory, turma) => {
    let entries;
    try {
        entries = await directoryEntries(directory);
    } catch (error) {
        if (['ENOENT', 'ENOTDIR'].includes(error.code)) return [];
        throw error;
    }
    const candidates = await Promise.all(entries.filter(isFrequencyFile).map(async entry => {
        const filePath = path.join(directory, entry.name);
        const stat = await fs.promises.stat(filePath);
        return {
            path: filePath,
            name: entry.name,
            mtimeMs: Number(stat.mtimeMs || 0),
            score: rankCandidate(entry, turma)
        };
    }));
    return candidates.sort((a, b) => b.score - a.score || b.mtimeMs - a.mtimeMs || a.name.localeCompare(b.name, 'pt-BR'));
};

const findClassDirectory = async (root, turma) => {
    const year = turma.slice(0, 4);
    let rootEntries;
    try {
        rootEntries = await directoryEntries(root);
    } catch (error) {
        error.message = `Não foi possível acessar a rede do Senac. ${error.message}`;
        throw error;
    }
    const yearDirectories = rootEntries
        .filter(entry => entry.isDirectory() && /^TURMAS\s+\d{4}$/i.test(normalizeName(entry.name)))
        .sort((a, b) => (normalizeName(a.name) === `TURMAS ${year}` ? -1 : 0) - (normalizeName(b.name) === `TURMAS ${year}` ? -1 : 0));

    for (const yearEntry of yearDirectories) {
        const yearPath = path.join(root, yearEntry.name);
        const classEntries = await directoryEntries(yearPath);
        const classEntry = classEntries.find(entry => entry.isDirectory() && entry.name.startsWith(turma) && !/^\d/.test(entry.name.slice(turma.length, turma.length + 1)));
        if (classEntry) return path.join(yearPath, classEntry.name);
    }
    return '';
};

const findControlDirectory = entries => entries.find(entry => {
    if (!entry.isDirectory()) return false;
    const normalized = normalizeName(entry.name);
    return normalized.includes('CONTROLE') && normalized.includes('FREQUENCIA');
});

const findChildDirectory = async (directory, matcher) => {
    let entries;
    try { entries = await directoryEntries(directory); }
    catch (error) { return ''; }
    const entry = entries.find(item => item.isDirectory() && matcher(normalizeName(item.name)));
    return entry ? path.join(directory, entry.name) : '';
};

const countFilesRecursive = async (directory, depth = 2) => {
    let entries;
    try { entries = await directoryEntries(directory); }
    catch (error) { return { fileCount: 0, latestMtimeMs: 0 }; }
    let fileCount = 0;
    let latestMtimeMs = 0;
    for (const entry of entries) {
        const itemPath = path.join(directory, entry.name);
        if (entry.isFile() && !entry.name.startsWith('~$')) {
            fileCount += 1;
            try { latestMtimeMs = Math.max(latestMtimeMs, Number((await fs.promises.stat(itemPath)).mtimeMs || 0)); } catch (error) {}
        } else if (entry.isDirectory() && depth > 0) {
            const child = await countFilesRecursive(itemPath, depth - 1);
            fileCount += child.fileCount;
            latestMtimeMs = Math.max(latestMtimeMs, child.latestMtimeMs);
        }
    }
    return { fileCount, latestMtimeMs };
};

async function scanDropoutDocuments(turmaValue, studentNames, options = {}) {
    const turma = extractClassNumber(turmaValue);
    if (!turma) throw new Error('O número da turma não foi identificado.');
    const root = options.root || DEFAULT_NETWORK_ROOT;
    const classDirectory = await findClassDirectory(root, turma);
    if (!classDirectory) throw new Error(`A pasta da turma ${turma} não foi encontrada na rede.`);
    const documentsDirectory = await findChildDirectory(classDirectory, name => /^DOCUMENTOS?$/.test(name.trim()) || name.includes('DOCUMENTOS'));
    if (!documentsDirectory) return { turma, classDirectory, documentsDirectory: '', dropoutDirectory: '', students: [] };
    const dropoutDirectory = await findChildDirectory(documentsDirectory, name => name.includes('DESLIGAMENTO') || name.includes('EVASAO') || name.includes('DESISTENTE'));
    if (!dropoutDirectory) return { turma, classDirectory, documentsDirectory, dropoutDirectory: '', students: [] };
    const folders = (await directoryEntries(dropoutDirectory)).filter(entry => entry.isDirectory());
    const students = [];
    for (const studentName of studentNames || []) {
        const normalizedStudent = normalizeName(studentName).replace(/[^A-Z0-9]+/g, ' ').trim();
        if (!normalizedStudent) continue;
        const folder = folders.find(entry => {
            const normalizedFolder = normalizeName(entry.name).replace(/[^A-Z0-9]+/g, ' ').trim();
            return normalizedFolder === normalizedStudent || normalizedFolder.includes(normalizedStudent);
        });
        if (!folder) continue;
        const folderPath = path.join(dropoutDirectory, folder.name);
        const summary = await countFilesRecursive(folderPath);
        students.push({
            studentName,
            folderName: folder.name,
            fileCount: summary.fileCount,
            latestMtimeMs: summary.latestMtimeMs,
            hasDocuments: summary.fileCount > 0
        });
    }
    return { turma, classDirectory, documentsDirectory, dropoutDirectory, students };
}

async function locateFrequencyFile(turmaValue, options = {}) {
    const turma = extractClassNumber(turmaValue);
    if (!turma) throw new Error('O número da turma não foi identificado.');
    const root = options.root || DEFAULT_NETWORK_ROOT;
    const classDirectory = await findClassDirectory(root, turma);
    if (!classDirectory) throw new Error(`A pasta da turma ${turma} não foi encontrada na rede.`);

    const directCandidates = await listFrequencyFiles(classDirectory, turma);
    if (directCandidates.length) return { ...directCandidates[0], turma, classDirectory, location: 'Pasta da turma' };

    const classEntries = await directoryEntries(classDirectory);
    const controlEntry = findControlDirectory(classEntries);
    const controlDirectory = controlEntry ? path.join(classDirectory, controlEntry.name) : '';
    const controlCandidates = controlDirectory ? await listFrequencyFiles(controlDirectory, turma) : [];
    if (controlCandidates.length) return { ...controlCandidates[0], turma, classDirectory, location: controlEntry.name };

    throw new Error(`Nenhuma planilha de frequência foi encontrada para a turma ${turma} na pasta da turma ou em Controle de Frequência.`);
}

module.exports = { DEFAULT_NETWORK_ROOT, extractClassNumber, locateFrequencyFile, normalizeName, scanDropoutDocuments };
