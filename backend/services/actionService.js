const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const actionsPath = path.join(__dirname, '..', 'data', 'actions.json');
let actionsConfig = { actions: [] };

try {
  actionsConfig = JSON.parse(fs.readFileSync(actionsPath, 'utf-8'));
  console.log(`[ActionService] Carregadas ${actionsConfig.actions.length} categorias de ação.`);
} catch (error) {
  console.error('[ActionService] Erro ao carregar actions.json:', error.message);
}

/**
 * Detecta se o texto é um comando de ação.
 * Retorna o objeto com flags de compound/search ou null se for conversa normal.
 */
function detectAction(text) {
  const n = text.toLowerCase().trim();

  for (const group of actionsConfig.actions) {
    for (const kw of group.keywords) {
      if (!n.includes(kw)) continue;

      // ─── Categoria SEARCH (sem alvo específico) ───
      if (group.category === 'search') {
        const query = extractAfterKeyword(n, kw);
        if (query.length > 1) {
          return {
            category: 'search',
            target: 'google',
            binary: 'google-chrome',
            description: 'Pesquisa no Google',
            argument: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
            compound: false
          };
        }
      }

      // ─── Categorias com alvos mapeados ───
      for (const [tName, tInfo] of Object.entries(group.targets)) {
        if (!n.includes(tName)) continue;

        // Se for ação composta (ex: tocar música → perguntar qual)
        if (tInfo.compound) {
          return {
            category: group.category,
            target: tName,
            binary: tInfo.binary,
            description: tInfo.description,
            compound: true,
            followUp: tInfo.followUp,
            searchCommand: tInfo.searchCommand || null
          };
        }

        // Ação simples — extrair argumento (ex: "pesquise por X")
        let argument = null;
        const remainder = n.substring(n.indexOf(tName) + tName.length).trim();
        const searchPatterns = [
          'pesquise por', 'pesquisa por', 'procure por', 'busque por',
          'pesquise', 'pesquisa', 'procure', 'busque',
          'e pesquise por', 'e pesquisa por', 'e procure por',
          'e pesquise', 'e pesquisa', 'e procure'
        ];
        for (const pat of searchPatterns) {
          if (remainder.includes(pat)) {
            let q = remainder.split(pat).pop().trim();
            q = q.replace(/\b(no google|na web|na internet)\b/gi, '').trim();
            if (q) { argument = `https://www.google.com/search?q=${encodeURIComponent(q)}`; }
            break;
          }
        }

        return {
          category: group.category,
          target: tName,
          binary: tInfo.binary,
          description: tInfo.description,
          argument,
          compound: false
        };
      }

      // Keyword detectada mas alvo NÃO mapeado
      if (group.category !== 'search') {
        let clean = extractAfterKeyword(n, kw);
        if (clean.length > 1) {
          return {
            category: group.category,
            target: clean,
            binary: null,
            description: `Alvo desconhecido: "${clean}"`,
            argument: null,
            compound: false
          };
        }
      }
    }
  }

  return null;
}

/** Extrai texto após keyword, removendo artigos */
function extractAfterKeyword(text, keyword) {
  return text.split(keyword).pop().trim().replace(/^(o|a|os|as|um|uma|uns|umas)\s+/i, '').trim();
}

/**
 * Executa uma ação simples no SO.
 */
async function executeAction(action) {
  if (!action.binary) {
    return `Não encontrei "${action.target}" no meu mapa de ações.`;
  }

  return new Promise((resolve) => {
    if (action.category === 'open' || action.category === 'play' || action.category === 'search') {
      const cmd = action.argument
        ? `nohup ${action.binary} "${action.argument}" > /dev/null 2>&1 &`
        : `nohup ${action.binary} > /dev/null 2>&1 &`;

      exec(cmd, (err) => {
        if (err) {
          resolve(`Erro ao abrir ${action.description}: ${err.message}`);
        } else {
          const detail = action.argument ? ' e direcionei para o destino solicitado' : '';
          resolve(`Pronto. ${action.description} iniciado${detail}.`);
        }
      });
      setTimeout(() => {
        const detail = action.argument ? ' e direcionei para o destino' : '';
        resolve(`Pronto. ${action.description} foi iniciado${detail}.`);
      }, 1500);

    } else if (action.category === 'close') {
      let killCmd = `pkill -f "${action.binary}"`;
      if (action.binary.includes('flatpak') || action.binary.includes('app.')) {
        const appId = action.binary.split(' ').pop();
        killCmd = `flatpak kill ${appId} 2>/dev/null; pkill -f "${appId}"`;
      }
      exec(killCmd, (err) => {
        resolve(err ? `Não encontrei o processo do ${action.description} ativo.` : `${action.description} encerrado.`);
      });

    } else {
      resolve(`Ainda não sei executar "${action.category}".`);
    }
  });
}

/**
 * Executa a busca composta dentro de um app já aberto (via xdotool).
 */
async function executeCompoundSearch(searchCommand, query) {
  const finalCmd = searchCommand.replace(/\{query\}/g, query);
  console.log(`[ActionService] Compound search: ${finalCmd}`);

  return new Promise((resolve) => {
    exec(finalCmd, { timeout: 15000 }, (err) => {
      if (err) {
        console.error('[ActionService] Compound search error:', err.message);
        resolve(`Tentei pesquisar "${query}", mas encontrei um erro na automação.`);
      } else {
        resolve(`Pronto. Pesquisei e selecionei "${query}" para você.`);
      }
    });
  });
}

function reloadActions() {
  try {
    actionsConfig = JSON.parse(fs.readFileSync(actionsPath, 'utf-8'));
    console.log('[ActionService] Ações recarregadas.');
    return true;
  } catch (e) {
    console.error('[ActionService] Erro ao recarregar:', e.message);
    return false;
  }
}

module.exports = { detectAction, executeAction, executeCompoundSearch, reloadActions };
