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

module.exports = { DEFAULT_NETWORK_ROOT, extractClassNumber, locateFrequencyFile, normalizeName };
