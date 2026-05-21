const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Carregar o mapeamento de ações
const actionsPath = path.join(__dirname, '..', 'data', 'actions.json');
let actionsConfig = { actions: [] };

try {
  actionsConfig = JSON.parse(fs.readFileSync(actionsPath, 'utf-8'));
  console.log(`[ActionService] Carregadas ${actionsConfig.actions.length} categorias de ação.`);
} catch (error) {
  console.error('[ActionService] Erro ao carregar actions.json:', error.message);
}

/**
 * Analisa o texto do usuário para detectar se é um comando de ação local.
 * Retorna um objeto de ação ou null se for apenas uma pergunta normal de conversa.
 * 
 * @param {string} text - Texto transcrito pelo STT.
 * @returns {{ category: string, target: string, binary: string, description: string } | null}
 */
function detectAction(text) {
  const normalizedText = text.toLowerCase().trim();

  for (const actionGroup of actionsConfig.actions) {
    for (const keyword of actionGroup.keywords) {
      if (normalizedText.startsWith(keyword) || normalizedText.includes(keyword)) {
        // Encontrou uma keyword de ação. Agora procurar o alvo.
        for (const [targetName, targetInfo] of Object.entries(actionGroup.targets)) {
          if (normalizedText.includes(targetName)) {
            return {
              category: actionGroup.category,
              target: targetName,
              binary: targetInfo.binary,
              description: targetInfo.description
            };
          }
        }
        
        // Keyword encontrada mas alvo não reconhecido
        // Extrair o que vem depois da keyword como alvo genérico
        const afterKeyword = normalizedText.split(keyword).pop().trim();
        if (afterKeyword.length > 0) {
          return {
            category: actionGroup.category,
            target: afterKeyword,
            binary: null, // Alvo não mapeado
            description: `Alvo desconhecido: "${afterKeyword}"`
          };
        }
      }
    }
  }

  return null; // Não é um comando de ação, é conversa normal
}

/**
 * Executa a ação detectada no sistema operacional.
 * 
 * @param {{ category: string, target: string, binary: string, description: string }} action
 * @returns {Promise<string>} Mensagem de resultado da ação.
 */
async function executeAction(action) {
  if (!action.binary) {
    return `Não encontrei o programa "${action.target}" no meu mapa de ações. Você pode adicioná-lo ao arquivo de configuração.`;
  }

  return new Promise((resolve) => {
    if (action.category === 'open') {
      // Abrir o programa em background (detached) para não bloquear o Node
      const child = exec(`nohup ${action.binary} > /dev/null 2>&1 &`, (error) => {
        if (error) {
          console.error(`[ActionService] Erro ao abrir ${action.binary}:`, error.message);
          resolve(`Não consegui abrir o ${action.description}. Verifique se ele está instalado no sistema.`);
        } else {
          resolve(`Pronto. O ${action.description} foi aberto com sucesso.`);
        }
      });
      
      // Se o exec não retornou erro em 2 segundos, assumir sucesso
      setTimeout(() => {
        resolve(`Pronto. O ${action.description} foi aberto com sucesso.`);
      }, 2000);

    } else if (action.category === 'close') {
      exec(`pkill -f ${action.binary}`, (error) => {
        if (error) {
          resolve(`Não encontrei o processo do ${action.description} para encerrar.`);
        } else {
          resolve(`Pronto. O ${action.description} foi encerrado.`);
        }
      });

    } else {
      resolve(`Não sei como executar a ação "${action.category}" ainda.`);
    }
  });
}

/**
 * Recarrega o arquivo de ações do disco (para atualizações em tempo real).
 */
function reloadActions() {
  try {
    actionsConfig = JSON.parse(fs.readFileSync(actionsPath, 'utf-8'));
    console.log('[ActionService] Ações recarregadas com sucesso.');
    return true;
  } catch (error) {
    console.error('[ActionService] Erro ao recarregar ações:', error.message);
    return false;
  }
}

module.exports = {
  detectAction,
  executeAction,
  reloadActions
};
