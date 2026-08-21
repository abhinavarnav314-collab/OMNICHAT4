import { getProvider } from './providers';
import { useChatStore } from '../store/useChatStore';
import { useAppStore } from '../store/useAppStore';
import { getSecret } from './db';
import { decryptKey } from './crypto';
import { Message } from '../types';
import { estimateTokens } from '../utils/tokenEstimator';
import { calculateCost } from '../utils/costCalculator';

export async function sendMessageService(convoId: string, content: string, parentId: string | null = null, signal?: AbortSignal) {
  const chatStore = useChatStore.getState();
  const appStore = useAppStore.getState();
  
  const { settings, passphrase } = appStore;
  if (!passphrase) throw new Error("App is locked. Passphrase required.");

  const convo = chatStore.conversations.find(c => c.id === convoId);
  if (!convo) throw new Error("Conversation not found");

  const isComparison = convo.isComparison;
  const modelsToRun = isComparison && convo.comparisonModels?.length === 2 
    ? convo.comparisonModels 
    : [{ providerId: settings.defaultProviderId, modelId: settings.defaultModelId }];

  const userMsgId = crypto.randomUUID();
  const userMsg: Message = {
    id: userMsgId,
    role: 'user',
    content,
    timestamp: Date.now(),
    parentId
  };

  await chatStore.addMessage(convoId, userMsg);

  // We need to trace back from userMsg to get history
  const getHistory = (msgId: string) => {
    const history: Message[] = [];
    let currentId: string | null | undefined = msgId;
    const allMsgs = useChatStore.getState().conversations.find(c => c.id === convoId)?.messages || [];
    const msgMap = new Map(allMsgs.map(m => [m.id, m]));
    
    while (currentId) {
      const msg = msgMap.get(currentId);
      if (!msg) break;
      if (!msg.isError) {
        history.unshift(msg);
      }
      currentId = msg.parentId;
    }
    return history;
  };

  const history = getHistory(userMsgId);

  // Execute in parallel for comparison
  const promises = modelsToRun.map(async (modelSpec) => {
    const provider = getProvider(modelSpec.providerId);
    if (!provider) return;

    let apiKey = '';
    const encrypted = await getSecret(modelSpec.providerId);
    if (!encrypted) {
      const errText = `API key for ${provider.name} not found.`;
      await chatStore.addMessage(convoId, {
        id: crypto.randomUUID(), role: 'assistant', content: `**Error**: ${errText}`, timestamp: Date.now(),
        parentId: userMsgId, providerId: modelSpec.providerId, modelId: modelSpec.modelId, isError: true
      });
      return;
    }
    
    try {
      apiKey = await decryptKey(encrypted, passphrase);
    } catch (e) {
      await chatStore.addMessage(convoId, {
        id: crypto.randomUUID(), role: 'assistant', content: `**Error**: Failed to decrypt API key.`, timestamp: Date.now(),
        parentId: userMsgId, providerId: modelSpec.providerId, modelId: modelSpec.modelId, isError: true
      });
      return;
    }

    const assistantMsgId = crypto.randomUUID();
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      parentId: userMsgId,
      providerId: modelSpec.providerId,
      modelId: modelSpec.modelId
    };
    await chatStore.addMessage(convoId, assistantMsg);

    let currentText = '';
    let attempt = 0;
    const maxRetries = 2;
    
    while (attempt <= maxRetries) {
      try {
        const promptText = history.map(m => m.content).join('\n') + (convo.systemPrompt || '');
        let promptTokens = estimateTokens(promptText, modelSpec.modelId);
        let completionTokens = estimateTokens(currentText, modelSpec.modelId);
        
        let apiReportedUsage: {prompt: number, completion: number} | undefined = undefined;

        await provider.sendMessage(
          history,
          modelSpec.modelId,
          apiKey,
          (chunk) => {
            currentText += chunk;
            chatStore.updateMessage(convoId, assistantMsgId, { content: currentText }, true);
          },
          signal,
          settings.proxyUrl,
          convo.systemPrompt,
          convo.parameters,
          (usage) => { apiReportedUsage = usage; }
        );
        
        if (apiReportedUsage) {
            promptTokens = apiReportedUsage.prompt;
            completionTokens = apiReportedUsage.completion;
        }

        const cost = calculateCost(promptTokens, completionTokens, modelSpec.modelId);
        
        await chatStore.updateMessage(convoId, assistantMsgId, { 
          content: currentText, // Save final text
          tokens: { prompt: promptTokens, completion: completionTokens },
          cost,
          isUsageEstimated: !apiReportedUsage
        }, false);
        
        break; // Success, exit retry loop

      } catch (err: any) {
        if (err.name === 'AbortError' || attempt === maxRetries) {
          if (err.name === 'AbortError') {
            currentText += ' [Cancelled by user]';
          } else {
            currentText += `\n\n**Error**: ${err.message}`;
          }
          await chatStore.updateMessage(convoId, assistantMsgId, { content: currentText, isError: true }, false);
          break; // Stop retrying on abort or max retries
        } else {
          // Retry logic
          attempt++;
          currentText += `\n\n*[Connection failed. Retrying ${attempt}/${maxRetries}...]*\n\n`;
          chatStore.updateMessage(convoId, assistantMsgId, { content: currentText }, true);
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500)); // Exponential backoff (1s, 2s)
        }
      }
    }
  });

  await Promise.all(promises);
}
