// ==UserScript==
// @name         Notion AI Model Picker Pro
// @namespace    local.notion.ai.model-picker
// @version      2.0.0
// @description  Unlock hidden Notion AI models, configure reasoning effort, custom model IDs & dynamic discovery.
// @author       dj & VANTA
// @match        https://*.notion.com/*
// @match        https://notion.com/*
// @match        https://*.notion.so/*
// @match        https://notion.so/*
// @match        https://*.notion.site/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Storage Keys & Constants
  // ---------------------------------------------------------------------------
  const STORAGE_PREFIX = '__nai';
  const KEY_MODEL = `${STORAGE_PREFIX}Model`;
  const KEY_EFFORT = `${STORAGE_PREFIX}Effort`;
  const KEY_CUSTOM_MODELS = `${STORAGE_PREFIX}CustomModels`;
  const KEY_CACHE = `${STORAGE_PREFIX}ModelCache_v2.0`;
  const KEY_DEBUG = `${STORAGE_PREFIX}Debug`;

  const MODEL_HOST_ID = 'nai-model-host';
  const EFFORT_HOST_ID = 'nai-effort-host';
  const MODEL_MENU_ID = 'nai-model-menu';
  const EFFORT_MENU_ID = 'nai-effort-menu';
  const STYLE_ID = 'nai-picker-style';

  const MIC_SELECTOR = '[data-testid="unified-chat-start-recording-button"]';
  const FALLBACK_EFFORTS = ['low', 'medium', 'high', 'max'];

  const isDebug = () => localStorage.getItem(KEY_DEBUG) === 'true';
  const log = (...args) => {
    if (isDebug()) console.log('[ModelPicker]', ...args);
  };
  const logWarn = (...args) => console.warn('[ModelPicker]', ...args);

  // ---------------------------------------------------------------------------
  // Hardcoded Notion AI Model Codenames
  // ---------------------------------------------------------------------------
  const HARDCODED_MODELS = [
    // Claude (Anthropic)
    { id: 'anthropic-haiku-4.5', label: 'Haiku 4.5', provider: 'Claude', efforts: ['low', 'medium', 'high', 'max'], defaultEffort: null },
    { id: 'avocado-froyo-medium', label: 'Opus 4.6', provider: 'Claude', efforts: ['low', 'medium', 'high', 'max'], defaultEffort: 'medium' },
    { id: 'apricot-sorbet-high', label: 'Opus 4.7', provider: 'Claude', efforts: ['low', 'medium', 'high', 'max'], defaultEffort: 'high' },
    { id: 'ambrosia-tart-high', label: 'Opus 4.8', provider: 'Claude', efforts: ['low', 'medium', 'high', 'max'], defaultEffort: 'high' },
    { id: 'agave-flan', label: 'Opus 5', provider: 'Claude', efforts: ['low', 'medium', 'high', 'max'], defaultEffort: null },
    { id: 'albuquerque-quinn', label: 'Opus 5.5', provider: 'Claude', efforts: ['low', 'medium', 'high', 'max'], defaultEffort: null },
    { id: 'almond-croissant-low', label: 'Sonnet 4.6', provider: 'Claude', efforts: ['low', 'medium', 'high', 'max'], defaultEffort: 'low' },
    { id: 'angel-cake-high', label: 'Sonnet 5', provider: 'Claude', efforts: ['low', 'medium', 'high', 'max'], defaultEffort: 'high' },
    { id: 'acai-budino-high', label: 'Fable 5', provider: 'Claude', efforts: ['low', 'medium', 'high', 'max'], defaultEffort: 'high' },
    { id: 'assam-chai', label: 'Fable 5.1', provider: 'Claude', efforts: ['low', 'medium', 'high', 'max'], defaultEffort: null },

    // OpenAI (GPT)
    { id: 'oatmeal-cookie', label: 'GPT-5.2', provider: 'GPT', efforts: ['low', 'medium', 'high', 'max'], defaultEffort: null },
    { id: 'oval-kumquat-medium', label: 'GPT-5.4', provider: 'GPT', efforts: ['low', 'medium', 'high', 'max'], defaultEffort: 'medium' },
    { id: 'oregon-grape-medium', label: 'GPT-5.4 Mini', provider: 'GPT', efforts: ['low', 'medium', 'high', 'max'], defaultEffort: 'medium' },
    { id: 'otaheite-apple-medium', label: 'GPT-5.4 Nano', provider: 'GPT', efforts: ['low', 'medium', 'high', 'max'], defaultEffort: 'medium' },
    { id: 'opal-quince-medium', label: 'GPT-5.5', provider: 'GPT', efforts: ['low', 'medium', 'high', 'max'], defaultEffort: 'medium' },
    { id: 'olive-jellyroll', label: 'GPT-5.6 Luna', provider: 'GPT', efforts: ['low', 'medium', 'high', 'max'], defaultEffort: null },
    { id: 'orange-mousse', label: 'GPT-5.6 Sol', provider: 'GPT', efforts: ['low', 'medium', 'high', 'max'], defaultEffort: null },
    { id: 'orchid-muffin', label: 'GPT-5.6 Terra', provider: 'GPT', efforts: ['low', 'medium', 'high', 'max'], defaultEffort: null },
    { id: 'orlando-quinn', label: 'GPT-6 Astra', provider: 'GPT', efforts: ['low', 'medium', 'high', 'max'], defaultEffort: null },
    { id: 'omodi', label: 'GPT-6 Luna', provider: 'GPT', efforts: ['low', 'medium', 'high', 'max'], defaultEffort: null },
    { id: 'onico', label: 'GPT-6 Sol', provider: 'GPT', efforts: ['low', 'medium', 'high', 'max'], defaultEffort: null },

    // Google (Gemini)
    { id: 'gingerbread', label: 'Gemini 3 Flash', provider: 'Gemini', efforts: ['low', 'medium', 'high', 'max'], defaultEffort: null },
    { id: 'galette-medium-thinking', label: 'Gemini 3.1 Pro', provider: 'Gemini', efforts: ['low', 'medium', 'high', 'max'], defaultEffort: 'medium' },
    { id: 'vertex-gemini-3.5-flash', label: 'Gemini 3.5 Flash', provider: 'Gemini', efforts: ['low', 'medium', 'high', 'max'], defaultEffort: null },
    { id: 'vertex-gemini-3.6-flash', label: 'Gemini 3.6 Flash', provider: 'Gemini', efforts: ['low', 'medium', 'high', 'max'], defaultEffort: null },
    { id: 'grapefruit-zeppole', label: 'Gemini 3.7 Flash', provider: 'Gemini', efforts: ['low', 'medium', 'high', 'max'], defaultEffort: null },

    // DeepSeek
    { id: 'baseten-deepseek-v4-flash', label: 'DeepSeek V4 Flash', provider: 'DeepSeek', efforts: ['low', 'medium', 'high', 'max'], defaultEffort: null },
    { id: 'baseten-deepseek-v4-pro', label: 'DeepSeek V4 Pro', provider: 'DeepSeek', efforts: ['low', 'medium', 'high', 'max'], defaultEffort: null },
    { id: 'baseten-deepseek-v4.1-flash', label: 'DeepSeek V4.1 Flash', provider: 'DeepSeek', efforts: ['low', 'medium', 'high', 'max'], defaultEffort: null },

    // xAI (Grok)
    { id: 'xigua-mochi-medium', label: 'Grok 4.3', provider: 'xAI', efforts: ['low', 'medium', 'high', 'max'], defaultEffort: 'medium' },
    { id: 'strawberry-whoopiepie', label: 'Grok 4.5', provider: 'xAI', efforts: ['low', 'medium', 'high', 'max'], defaultEffort: null },
    { id: 'soursop-shortcake', label: 'Grok 4.6', provider: 'xAI', efforts: ['low', 'medium', 'high', 'max'], defaultEffort: null },
    { id: 'xinomavro-cake', label: 'Grok Build 0.1', provider: 'xAI', efforts: ['low', 'medium', 'high', 'max'], defaultEffort: null },

    // Kimi & GLM
    { id: 'fireworks-kimi-k3', label: 'Kimi K3', provider: 'Kimi', efforts: ['low', 'medium', 'high', 'max'], defaultEffort: null },
    { id: 'baseten-glm-5.2', label: 'GLM 5.2', provider: 'GLM', efforts: ['low', 'medium', 'high', 'max'], defaultEffort: null },
    { id: 'baseten-glm-5.3', label: 'GLM 5.3', provider: 'GLM', efforts: ['low', 'medium', 'high', 'max'], defaultEffort: null },
    { id: 'baseten-glm-5.3-flash', label: 'GLM 5.3 Flash', provider: 'GLM', efforts: ['low', 'medium', 'high', 'max'], defaultEffort: null }
  ];

  // ---------------------------------------------------------------------------
  // State Management
  // ---------------------------------------------------------------------------
  let activeTab = 'All';
  let isProbing = false;
  let mountScheduled = false;
  let activeHighlightedIndex = -1;

  function loadCustomModels() {
    try {
      const stored = localStorage.getItem(KEY_CUSTOM_MODELS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  function saveCustomModels(models) {
    try {
      localStorage.setItem(KEY_CUSTOM_MODELS, JSON.stringify(models));
    } catch (e) {
      logWarn('Failed to save custom models:', e);
    }
  }

  function loadCachedModels() {
    try {
      const cached = JSON.parse(localStorage.getItem(KEY_CACHE) || '[]');
      if (Array.isArray(cached) && cached.length) return cached;
    } catch {
      /* ignore */
    }
    return [];
  }

  function mergeCatalogs(hardcoded, cached, custom) {
    const map = new Map();
    // 1. Hardcoded as foundation
    for (const m of hardcoded) {
      map.set(m.id, { ...m, disabled: false, source: 'built-in' });
    }
    // 2. Discovered/cached from backend
    for (const m of cached) {
      if (map.has(m.id)) {
        const existing = map.get(m.id);
        map.set(m.id, {
          ...existing,
          efforts: m.efforts && m.efforts.length ? m.efforts : existing.efforts,
          defaultEffort: m.defaultEffort || existing.defaultEffort,
          source: 'verified'
        });
      } else {
        map.set(m.id, { ...m, disabled: false, source: 'discovered' });
      }
    }
    // 3. User custom models
    for (const m of custom) {
      map.set(m.id, { ...m, disabled: false, source: 'custom' });
    }
    return Array.from(map.values());
  }

  let MODELS = mergeCatalogs(HARDCODED_MODELS, loadCachedModels(), loadCustomModels());

  const selectedModelId = () => localStorage.getItem(KEY_MODEL);
  const currentEffort = () => localStorage.getItem(KEY_EFFORT);
  const modelById = (id) => MODELS.find((m) => m.id === id);

  const availableEfforts = () => {
    const selected = modelById(selectedModelId());
    return selected?.efforts?.length ? selected.efforts : FALLBACK_EFFORTS;
  };

  const titleCase = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

  // ---------------------------------------------------------------------------
  // Network Interception & Request Patching
  // ---------------------------------------------------------------------------
  function patchAiConfig(payload, targetModel, targetEffort) {
    if (!payload || typeof payload !== 'object') return false;
    let modified = false;

    const walk = (node) => {
      if (!node || typeof node !== 'object') return;

      // Notion AI standard config block
      if (node.type === 'config' && node.value && typeof node.value === 'object') {
        node.value.model = targetModel;
        node.value.modelFromUser = true;
        if (targetEffort) {
          node.value.reasoningEffort = targetEffort;
          node.value.effort = targetEffort;
        }
        modified = true;
      }

      // Root or nested direct parameters
      if (typeof node.model === 'string' && ('modelFromUser' in node || 'contextOverrides' in node)) {
        node.model = targetModel;
        node.modelFromUser = true;
        if (targetEffort) {
          node.reasoningEffort = targetEffort;
          node.effort = targetEffort;
        }
        modified = true;
      }

      for (const key of Object.keys(node)) {
        if (typeof node[key] === 'object') walk(node[key]);
      }
    };

    walk(payload);
    return modified;
  }

  const originalFetch = window.fetch;
  window.fetch = async function (input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    const selected = selectedModelId();
    const effort = currentEffort();

    if (selected && init && typeof init.body === 'string' && (init.body.includes('"config"') || init.body.includes('"model"'))) {
      try {
        const body = JSON.parse(init.body);
        if (patchAiConfig(body, selected, effort)) {
          init = { ...init, body: JSON.stringify(body) };
          log(`[Request Patched] ${url} -> model: ${selected} | effort: ${effort || 'default'}`);
        }
      } catch (e) {
        logWarn('Fetch patch error:', e);
      }
    }

    const response = await originalFetch.call(this, input, init);

    // Passive Model Harvesting
    if (/getAvailableModels|getAiAvailableModels|availablemodels/i.test(url)) {
      try {
        const clone = response.clone();
        const contentType = clone.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          clone.json().then((json) => harvestModels(json)).catch(() => {});
        }
      } catch (err) {
        logWarn('Model response clone failed:', err);
      }
    }

    return response;
  };

  const originalXhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...args) {
    this.__naiUrl = url;
    return originalXhrOpen.call(this, method, url, ...args);
  };

  const originalXhrSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (...args) {
    const url = String(this.__naiUrl || '');
    const selected = selectedModelId();
    const effort = currentEffort();

    if (selected && typeof args[0] === 'string' && (args[0].includes('"config"') || args[0].includes('"model"'))) {
      try {
        const body = JSON.parse(args[0]);
        if (patchAiConfig(body, selected, effort)) {
          args[0] = JSON.stringify(body);
          log(`[XHR Patched] ${url} -> model: ${selected} | effort: ${effort || 'default'}`);
        }
      } catch (e) {
        logWarn('XHR patch error:', e);
      }
    }
    return originalXhrSend.apply(this, args);
  };

  // ---------------------------------------------------------------------------
  // Dynamic Probing & Model Harvesting
  // ---------------------------------------------------------------------------
  function findModelArray(value, seen = new WeakSet()) {
    if (!value || typeof value !== 'object') return null;
    if (seen.has(value)) return null;
    seen.add(value);

    if (Array.isArray(value)) {
      if (value.length && value.some((item) => item && typeof item === 'object' && ('model' in item || 'modelConfiguration' in item))) {
        return value;
      }
      for (const item of value) {
        const found = findModelArray(item, seen);
        if (found) return found;
      }
    } else {
      for (const key of Object.keys(value)) {
        const found = findModelArray(value[key], seen);
        if (found) return found;
      }
    }
    return null;
  }

  function providerLabel(item) {
    const id = String(item.model || '').toLowerCase();
    const msg = String(item.modelMessage || item.displayName || '').toLowerCase();
    const prov = String(item.provider || '').toLowerCase();

    if (prov.includes('anthropic') || id.includes('claude') || msg.includes('claude') || id.startsWith('a')) return 'Claude';
    if (prov.includes('openai') || id.includes('gpt') || msg.includes('gpt') || id.startsWith('o')) return 'GPT';
    if (prov.includes('google') || id.includes('gemini') || msg.includes('gemini') || id.startsWith('g')) return 'Gemini';
    if (prov.includes('deepseek') || id.includes('deepseek')) return 'DeepSeek';
    if (prov.includes('xai') || id.includes('grok') || msg.includes('grok')) return 'xAI';
    if (prov.includes('kimi') || id.includes('kimi')) return 'Kimi';
    if (prov.includes('glm') || id.includes('glm')) return 'GLM';
    return item.provider || 'Other';
  }

  function harvestModels(data) {
    const list = findModelArray(data);
    if (!list || !list.length) return 0;

    const harvested = [];
    for (const item of list) {
      if (!item || !item.model) continue;
      const config = item.modelConfiguration || {};
      const id = String(item.model);
      const label = String(item.modelMessage || item.displayName || item.model);
      const efforts = Array.isArray(config.supportedReasoningEfforts) ? config.supportedReasoningEfforts.filter(Boolean) : [];
      harvested.push({
        id,
        label,
        provider: providerLabel(item),
        disabled: false,
        efforts,
        defaultEffort: config.defaultReasoningEffort || null,
        source: 'discovered'
      });
    }

    if (harvested.length) {
      try {
        localStorage.setItem(KEY_CACHE, JSON.stringify(harvested));
      } catch {}
      MODELS = mergeCatalogs(HARDCODED_MODELS, harvested, loadCustomModels());
      log(`Harvested ${harvested.length} models. Total: ${MODELS.length}`);
      renderModelList();
      renderEffortMenu();
      updateControls();
    }
    return harvested.length;
  }

  async function probeModelList(force = false) {
    if (isProbing) return;
    isProbing = true;

    const refreshBtn = document.getElementById('nai-refresh-btn');
    if (refreshBtn) refreshBtn.classList.add('spinning');

    const paths = ['/api/v3/getAvailableModels', '/api/v3/getAiAvailableModels', '/api/v3/ai/getAvailableModels'];
    let spaceId = null;
    const cookieMatch = document.cookie.match(/spaceId=([0-9a-f-]{36})/i);
    if (cookieMatch) spaceId = cookieMatch[1];

    let foundCount = 0;
    for (const path of paths) {
      for (const body of ['{}', spaceId ? JSON.stringify({ spaceId }) : null].filter(Boolean)) {
        try {
          const resp = await originalFetch.call(window, path, {
            method: 'POST',
            credentials: 'include',
            headers: { 'content-type': 'application/json' },
            body
          });
          if (resp.ok) {
            const data = await resp.json();
            foundCount = harvestModels(data);
            if (foundCount > 0) break;
          }
        } catch {
          /* next */
        }
      }
      if (foundCount > 0) break;
    }

    if (refreshBtn) refreshBtn.classList.remove('spinning');
    isProbing = false;
  }

  // ---------------------------------------------------------------------------
  // UI Styles & Icons
  // ---------------------------------------------------------------------------
  const css = `
    #${MODEL_HOST_ID}, #${EFFORT_HOST_ID} {
      position: relative;
      display: inline-flex !important;
      align-items: center;
      flex: 0 0 auto;
      z-index: 2;
      font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .nai-trigger {
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      height: 28px;
      border: 0;
      border-radius: 999px;
      color: var(--c-texSec, rgba(55,53,47,.65));
      background: var(--c-bacInt, rgba(55,53,47,.06));
      font: inherit;
      font-size: 13px;
      font-weight: 500;
      line-height: 1;
      white-space: nowrap;
      cursor: pointer;
      user-select: none;
      transition: background 120ms ease, color 120ms ease;
    }

    .nai-trigger:hover, .nai-trigger[aria-expanded="true"] {
      background: var(--c-bacIntHov, rgba(55,53,47,.10));
      color: var(--c-texPri, rgb(55,53,47));
    }

    #nai-model-trigger {
      max-width: 210px;
      padding: 0 10px;
    }

    #nai-model-trigger .nai-model-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    #nai-effort-trigger {
      width: 28px;
      padding: 0;
      margin-right: 4px;
    }

    #nai-effort-trigger .nai-bars {
      display: flex;
      align-items: flex-end;
      gap: 2px;
      height: 14px;
    }

    #nai-effort-trigger .nai-bars i {
      width: 3px;
      border-radius: 1px;
      background: currentColor;
      opacity: .28;
    }

    #nai-effort-trigger .nai-bars i.on { opacity: 1; color: var(--c-bluBdrAccPri, #2383e2); }
    #nai-effort-trigger .nai-bars i:nth-child(1) { height: 4px; }
    #nai-effort-trigger .nai-bars i:nth-child(2) { height: 7px; }
    #nai-effort-trigger .nai-bars i:nth-child(3) { height: 10px; }
    #nai-effort-trigger .nai-bars i:nth-child(4) { height: 13px; }

    .nai-chevron {
      width: 12px;
      height: 12px;
      flex: 0 0 auto;
      fill: currentColor;
    }

    .nai-popover {
      position: fixed;
      z-index: 2147483647;
      display: none;
      flex-direction: column;
      padding: 8px;
      border: 1px solid var(--c-bdrSec, rgba(55,53,47,.12));
      border-radius: 12px;
      color: var(--c-texPri, rgb(55,53,47));
      background: var(--c-bacPri, #fff);
      box-shadow: 0 12px 32px rgba(15,15,15,.18), 0 2px 8px rgba(15,15,15,.08);
      font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .nai-popover.open { display: flex; }

    #${MODEL_MENU_ID} {
      width: min(420px, calc(100vw - 24px));
      max-height: min(600px, calc(100vh - 24px));
    }

    #${EFFORT_MENU_ID} {
      width: min(240px, calc(100vw - 24px));
    }

    .nai-popover-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;
    }

    #nai-model-search {
      flex: 1;
      height: 32px;
      padding: 0 10px;
      border: 1px solid var(--c-bdrSec, rgba(55,53,47,.14));
      border-radius: 6px;
      outline: none;
      color: inherit;
      background: var(--c-bacSec, rgba(242,241,238,.6));
      font: inherit;
      font-size: 13px;
    }

    #nai-model-search:focus {
      border-color: var(--c-bluBdrAccPri, #2383e2);
      box-shadow: 0 0 0 1px var(--c-bluBdrAccPri, #2383e2);
    }

    .nai-icon-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: 0;
      border-radius: 6px;
      background: transparent;
      color: var(--c-texSec, rgba(55,53,47,.65));
      cursor: pointer;
      transition: background 120ms ease;
    }

    .nai-icon-btn:hover {
      background: var(--c-bacIntHov, rgba(55,53,47,.08));
      color: var(--c-texPri, rgb(55,53,47));
    }

    .nai-icon-btn.spinning svg {
      animation: nai-spin 800ms linear infinite;
    }

    @keyframes nai-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .nai-tabs {
      display: flex;
      gap: 4px;
      overflow-x: auto;
      padding-bottom: 6px;
      margin-bottom: 4px;
      border-bottom: 1px solid var(--c-bdrSec, rgba(55,53,47,.08));
      scrollbar-width: none;
    }
    .nai-tabs::-webkit-scrollbar { display: none; }

    .nai-tab {
      padding: 3px 8px;
      border: 0;
      border-radius: 4px;
      background: transparent;
      color: var(--c-texTer, rgba(55,53,47,.6));
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
    }

    .nai-tab:hover {
      background: var(--c-bacIntHov, rgba(55,53,47,.06));
      color: var(--c-texPri, rgb(55,53,47));
    }

    .nai-tab.active {
      background: var(--c-bacIntHov, rgba(55,53,47,.12));
      color: var(--c-texPri, rgb(55,53,47));
      font-weight: 600;
    }

    #nai-model-list, #nai-effort-list {
      overflow-y: auto;
      overscroll-behavior: contain;
      flex: 1;
    }

    .nai-section-label {
      padding: 8px 10px 4px;
      color: var(--c-texTer, rgba(55,53,47,.5));
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: .5px;
    }

    .nai-separator {
      height: 1px;
      margin: 4px 8px;
      background: var(--c-bdrSec, rgba(55,53,47,.08));
    }

    .nai-row {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      min-height: 38px;
      padding: 6px 10px;
      border: 0;
      border-radius: 6px;
      color: inherit;
      background: transparent;
      text-align: left;
      font: inherit;
      cursor: pointer;
      transition: background 80ms ease;
    }

    .nai-row:hover, .nai-row:focus-visible, .nai-row.highlighted {
      background: var(--c-bacIntHov, rgba(55,53,47,.08));
      outline: none;
    }

    .nai-row.active {
      background: var(--c-bacIntHov, rgba(55,53,47,.10));
      font-weight: 600;
    }

    .nai-row-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      flex: 0 0 22px;
      font-size: 15px;
      opacity: .85;
    }

    .nai-row-copy {
      min-width: 0;
      flex: 1;
    }

    .nai-row-name {
      display: flex;
      align-items: center;
      gap: 6px;
      overflow: hidden;
      font-size: 14px;
      line-height: 18px;
    }

    .nai-row-name span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .nai-row-badge {
      padding: 1px 5px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      background: var(--c-bacIntHov, rgba(55,53,47,.08));
      color: var(--c-texSec, rgba(55,53,47,.7));
    }

    .nai-row-meta {
      overflow: hidden;
      font-size: 11px;
      color: var(--c-texTer, rgba(55,53,47,.5));
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .nai-row-check {
      width: 16px;
      font-size: 14px;
      color: var(--c-bluBdrAccPri, #2383e2);
      visibility: hidden;
    }

    .nai-row.active .nai-row-check {
      visibility: visible;
    }

    .nai-custom-modal {
      display: none;
      flex-direction: column;
      gap: 8px;
      padding: 10px;
      margin-top: 6px;
      border-top: 1px solid var(--c-bdrSec, rgba(55,53,47,.1));
    }

    .nai-custom-modal.open { display: flex; }

    .nai-custom-modal input {
      height: 28px;
      padding: 0 8px;
      border: 1px solid var(--c-bdrSec, rgba(55,53,47,.14));
      border-radius: 5px;
      background: var(--c-bacSec, rgba(242,241,238,.6));
      color: inherit;
      font: inherit;
      font-size: 12px;
    }

    .nai-custom-modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 6px;
    }

    .nai-btn {
      padding: 4px 10px;
      border: 0;
      border-radius: 5px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
    }

    .nai-btn-pri {
      background: var(--c-bluBdrAccPri, #2383e2);
      color: #fff;
    }

    .nai-empty {
      padding: 20px 12px;
      text-align: center;
      color: var(--c-texTer, rgba(55,53,47,.5));
      font-size: 13px;
    }
  `;

  function installStyle() {
    if (document.getElementById(STYLE_ID) || !document.head) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  function iconSvg(name) {
    if (name === 'chevron') {
      return '<svg class="nai-chevron" viewBox="0 0 12 12"><path d="M2.2 4.25a.65.65 0 0 1 .92 0L6 7.13l2.88-2.88a.65.65 0 1 1 .92.92L6.46 8.51a.65.65 0 0 1-.92 0L2.2 5.17a.65.65 0 0 1 0-.92Z"/></svg>';
    }
    if (name === 'refresh') {
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>';
    }
    if (name === 'plus') {
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
    }
    return '';
  }

  function iconFor(model) {
    const prov = (model.provider || '').toLowerCase();
    if (prov.includes('claude')) return '✳';
    if (prov.includes('gemini')) return '✦';
    if (prov.includes('gpt')) return '◉';
    if (prov.includes('deepseek')) return '⚡';
    if (prov.includes('xai')) return '𝕏';
    if (prov.includes('kimi')) return '◎';
    return '◈';
  }

  // ---------------------------------------------------------------------------
  // Host Buttons & DOM Mounting
  // ---------------------------------------------------------------------------
  function buildEffortHost() {
    const host = document.createElement('div');
    host.id = EFFORT_HOST_ID;

    const button = document.createElement('button');
    button.id = 'nai-effort-trigger';
    button.className = 'nai-trigger';
    button.type = 'button';
    button.title = 'Reasoning effort';
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-expanded', 'false');

    const bars = document.createElement('span');
    bars.className = 'nai-bars';
    for (let i = 0; i < 4; i++) bars.appendChild(document.createElement('i'));
    button.appendChild(bars);

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      togglePopover(EFFORT_MENU_ID);
    });

    host.appendChild(button);
    return host;
  }

  function buildModelHost() {
    const host = document.createElement('div');
    host.id = MODEL_HOST_ID;

    const button = document.createElement('button');
    button.id = 'nai-model-trigger';
    button.className = 'nai-trigger';
    button.type = 'button';
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-expanded', 'false');

    const label = document.createElement('span');
    label.className = 'nai-model-label';
    label.textContent = 'Auto';

    button.appendChild(label);
    button.insertAdjacentHTML('beforeend', iconSvg('chevron'));

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      togglePopover(MODEL_MENU_ID);
    });

    host.appendChild(button);
    return host;
  }

  // ---------------------------------------------------------------------------
  // Menus & Popovers
  // ---------------------------------------------------------------------------
  function buildModelMenu() {
    const menu = document.createElement('div');
    menu.id = MODEL_MENU_ID;
    menu.className = 'nai-popover';
    menu.setAttribute('role', 'dialog');

    // Header: Search + Refresh + Add Custom
    const header = document.createElement('div');
    header.className = 'nai-popover-header';

    const search = document.createElement('input');
    search.id = 'nai-model-search';
    search.type = 'search';
    search.placeholder = 'Search models or type name…';
    search.autocomplete = 'off';
    search.spellcheck = false;

    const refreshBtn = document.createElement('button');
    refreshBtn.id = 'nai-refresh-btn';
    refreshBtn.className = 'nai-icon-btn';
    refreshBtn.type = 'button';
    refreshBtn.title = 'Refresh models from Notion server';
    refreshBtn.innerHTML = iconSvg('refresh');
    refreshBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      probeModelList(true);
    });

    const addBtn = document.createElement('button');
    addBtn.id = 'nai-add-custom-btn';
    addBtn.className = 'nai-icon-btn';
    addBtn.type = 'button';
    addBtn.title = 'Add custom model ID';
    addBtn.innerHTML = iconSvg('plus');
    addBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const modal = document.getElementById('nai-custom-modal');
      modal?.classList.toggle('open');
    });

    header.append(search, refreshBtn, addBtn);

    // Provider Tabs
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'nai-tabs';
    const tabList = ['All', 'Claude', 'GPT', 'Gemini', 'DeepSeek', 'xAI', 'Other'];
    for (const tabName of tabList) {
      const tab = document.createElement('button');
      tab.className = `nai-tab${tabName === activeTab ? ' active' : ''}`;
      tab.textContent = tabName;
      tab.addEventListener('click', () => {
        activeTab = tabName;
        tabsContainer.querySelectorAll('.nai-tab').forEach((t) => t.classList.toggle('active', t.textContent === tabName));
        renderModelList(search.value);
      });
      tabsContainer.appendChild(tab);
    }

    // Model List Container
    const list = document.createElement('div');
    list.id = 'nai-model-list';

    // Custom Model Modal
    const customModal = document.createElement('div');
    customModal.id = 'nai-custom-modal';
    customModal.className = 'nai-custom-modal';
    customModal.innerHTML = `
      <input id="nai-custom-id" placeholder="Model ID (e.g. claude-3-7-sonnet)" />
      <input id="nai-custom-label" placeholder="Display Label (optional)" />
      <div class="nai-custom-modal-actions">
        <button class="nai-btn" id="nai-custom-cancel" type="button">Cancel</button>
        <button class="nai-btn nai-btn-pri" id="nai-custom-save" type="button">Add Model</button>
      </div>
    `;

    menu.append(header, tabsContainer, list, customModal);
    menu.addEventListener('click', (e) => e.stopPropagation());

    // Search events & keyboard navigation
    search.addEventListener('input', () => {
      activeHighlightedIndex = -1;
      renderModelList(search.value);
    });

    search.addEventListener('keydown', (e) => {
      const rows = list.querySelectorAll('.nai-row');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeHighlightedIndex = (activeHighlightedIndex + 1) % rows.length;
        updateHighlight(rows);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeHighlightedIndex = (activeHighlightedIndex - 1 + rows.length) % rows.length;
        updateHighlight(rows);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeHighlightedIndex >= 0 && rows[activeHighlightedIndex]) {
          rows[activeHighlightedIndex].click();
        }
      } else if (e.key === 'Escape') {
        closeAll();
      }
    });

    // Custom modal handlers
    customModal.querySelector('#nai-custom-cancel').addEventListener('click', () => {
      customModal.classList.remove('open');
    });

    customModal.querySelector('#nai-custom-save').addEventListener('click', () => {
      const idInput = customModal.querySelector('#nai-custom-id');
      const labelInput = customModal.querySelector('#nai-custom-label');
      const id = idInput.value.trim();
      const label = labelInput.value.trim() || id;

      if (!id) return;

      const customList = loadCustomModels();
      if (!customList.some((m) => m.id === id)) {
        customList.push({ id, label, provider: 'Custom', efforts: FALLBACK_EFFORTS, defaultEffort: null, source: 'custom' });
        saveCustomModels(customList);
        MODELS = mergeCatalogs(HARDCODED_MODELS, loadCachedModels(), customList);
        renderModelList();
      }

      localStorage.setItem(KEY_MODEL, id);
      idInput.value = '';
      labelInput.value = '';
      customModal.classList.remove('open');
      updateControls();
      renderEffortMenu();
      closeAll();
    });

    document.body.appendChild(menu);
    return menu;
  }

  function updateHighlight(rows) {
    rows.forEach((r, idx) => {
      r.classList.toggle('highlighted', idx === activeHighlightedIndex);
      if (idx === activeHighlightedIndex) r.scrollIntoView({ block: 'nearest' });
    });
  }

  function buildEffortMenu() {
    const menu = document.createElement('div');
    menu.id = EFFORT_MENU_ID;
    menu.className = 'nai-popover';
    menu.setAttribute('role', 'dialog');

    const label = document.createElement('div');
    label.className = 'nai-section-label';
    label.textContent = 'Reasoning Effort';

    const list = document.createElement('div');
    list.id = 'nai-effort-list';

    menu.append(label, list);
    menu.addEventListener('click', (e) => e.stopPropagation());
    document.body.appendChild(menu);
    return menu;
  }

  function buildRow({ icon, name, badge, meta, active, onSelect }) {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = `nai-row${active ? ' active' : ''}`;

    const iconSpan = document.createElement('span');
    iconSpan.className = 'nai-row-icon';
    iconSpan.textContent = icon || '◈';

    const copy = document.createElement('div');
    copy.className = 'nai-row-copy';

    const nameDiv = document.createElement('div');
    nameDiv.className = 'nai-row-name';
    const textSpan = document.createElement('span');
    textSpan.textContent = name;
    nameDiv.appendChild(textSpan);

    if (badge) {
      const badgeSpan = document.createElement('span');
      badgeSpan.className = 'nai-row-badge';
      badgeSpan.textContent = badge;
      nameDiv.appendChild(badgeSpan);
    }

    const metaDiv = document.createElement('div');
    metaDiv.className = 'nai-row-meta';
    metaDiv.textContent = meta || '';

    copy.append(nameDiv, metaDiv);

    const check = document.createElement('span');
    check.className = 'nai-row-check';
    check.textContent = '✓';

    row.append(iconSpan, copy, check);
    row.addEventListener('click', onSelect);
    return row;
  }

  function renderModelList(query = '') {
    const list = document.getElementById('nai-model-list');
    if (!list) return;
    list.innerHTML = '';

    const lowerQuery = query.trim().toLowerCase();
    const currentSelected = selectedModelId();

    // Auto Row
    if (!lowerQuery) {
      list.appendChild(
        buildRow({
          icon: '⌁',
          name: 'Auto (Default Notion)',
          meta: 'Let Notion determine the best model automatically',
          active: !currentSelected,
          onSelect: () => {
            localStorage.removeItem(KEY_MODEL);
            updateControls();
            renderEffortMenu();
            closeAll();
          }
        })
      );
      const sep = document.createElement('div');
      sep.className = 'nai-separator';
      list.appendChild(sep);
    }

    const filtered = MODELS.filter((m) => {
      const matchQuery = `${m.label} ${m.provider} ${m.id}`.toLowerCase().includes(lowerQuery);
      const matchTab = activeTab === 'All' || m.provider.toLowerCase() === activeTab.toLowerCase() || (activeTab === 'Other' && !['Claude', 'GPT', 'Gemini', 'DeepSeek', 'xAI'].includes(m.provider));
      return matchQuery && matchTab;
    });

    if (!filtered.length) {
      const empty = document.createElement('div');
      empty.className = 'nai-empty';
      empty.textContent = lowerQuery ? `No models matching "${query}"` : 'No models available';
      list.appendChild(empty);
      return;
    }

    // Group by provider
    const groups = new Map();
    for (const m of filtered) {
      if (!groups.has(m.provider)) groups.set(m.provider, []);
      groups.get(m.provider).push(m);
    }

    for (const [provider, models] of groups) {
      const label = document.createElement('div');
      label.className = 'nai-section-label';
      label.textContent = provider;
      list.appendChild(label);

      for (const model of models) {
        const metaBits = [];
        if (model.efforts?.length) metaBits.push(`efforts: ${model.efforts.join(', ')}`);
        if (model.id !== model.label) metaBits.push(model.id);

        list.appendChild(
          buildRow({
            icon: iconFor(model),
            name: model.label,
            badge: model.source === 'custom' ? 'Custom' : model.source === 'discovered' ? 'Live' : '',
            meta: metaBits.join(' · '),
            active: currentSelected === model.id,
            onSelect: () => {
              localStorage.setItem(KEY_MODEL, model.id);
              if (model.defaultEffort && !localStorage.getItem(KEY_EFFORT)) {
                localStorage.setItem(KEY_EFFORT, model.defaultEffort);
              }
              updateControls();
              renderEffortMenu();
              closeAll();
            }
          })
        );
      }
    }
  }

  function renderEffortMenu() {
    const list = document.getElementById('nai-effort-list');
    if (!list) return;
    list.innerHTML = '';

    const active = currentEffort();
    const efforts = availableEfforts();

    // Auto / Default
    list.appendChild(
      buildRow({
        icon: '○',
        name: 'Auto',
        meta: 'Controlled by model / Notion defaults',
        active: !active,
        onSelect: () => {
          localStorage.removeItem(KEY_EFFORT);
          updateControls();
          closeAll();
        }
      })
    );

    const sep = document.createElement('div');
    sep.className = 'nai-separator';
    list.appendChild(sep);

    for (const eff of efforts) {
      list.appendChild(
        buildRow({
          icon: '●',
          name: titleCase(eff),
          meta: `Reasoning budget: ${eff}`,
          active: active === eff,
          onSelect: () => {
            localStorage.setItem(KEY_EFFORT, eff);
            updateControls();
            closeAll();
          }
        })
      );
    }
  }

  function updateControls() {
    const modelLabel = document.querySelector('#nai-model-trigger .nai-model-label');
    if (modelLabel) {
      const id = selectedModelId();
      const model = modelById(id);
      modelLabel.textContent = !id ? 'Auto' : model ? model.label : id;
    }

    const effortTrigger = document.getElementById('nai-effort-trigger');
    if (effortTrigger) {
      const active = currentEffort();
      const efforts = availableEfforts();
      const idx = active ? efforts.indexOf(active) : -1;
      const count = idx < 0 ? 0 : Math.max(1, Math.round(((idx + 1) / efforts.length) * 4));

      effortTrigger.querySelectorAll('.nai-bars i').forEach((bar, pos) => {
        bar.classList.toggle('on', pos < count);
      });
      effortTrigger.title = active ? `Thinking effort: ${titleCase(active)}` : 'Thinking effort: Auto';
    }
  }

  // ---------------------------------------------------------------------------
  // Positioning & Popover Toggles
  // ---------------------------------------------------------------------------
  function closeAll() {
    document.querySelectorAll('.nai-popover').forEach((p) => p.classList.remove('open'));
    document.querySelectorAll('.nai-trigger').forEach((t) => t.setAttribute('aria-expanded', 'false'));
  }

  function positionMenu(menu, trigger) {
    if (!menu || !trigger) return;
    const rect = trigger.getBoundingClientRect();
    const menuWidth = menu.offsetWidth || 380;
    const menuHeight = menu.offsetHeight || 300;

    let left = rect.left;
    if (left + menuWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - menuWidth - 12);
    }

    let top = rect.top - menuHeight - 8;
    if (top < 12) {
      top = rect.bottom + 8;
    }

    menu.style.left = `${Math.round(left)}px`;
    menu.style.top = `${Math.round(top)}px`;
  }

  function togglePopover(menuId) {
    const menu = document.getElementById(menuId);
    const triggerId = menuId === MODEL_MENU_ID ? 'nai-model-trigger' : 'nai-effort-trigger';
    const trigger = document.getElementById(triggerId);
    if (!menu || !trigger) return;

    const isOpen = menu.classList.contains('open');
    closeAll();

    if (!isOpen) {
      if (menuId === MODEL_MENU_ID) {
        const search = document.getElementById('nai-model-search');
        if (search) search.value = '';
        activeHighlightedIndex = -1;
        renderModelList();
      } else {
        renderEffortMenu();
      }

      menu.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
      positionMenu(menu, trigger);

      if (menuId === MODEL_MENU_ID) {
        document.getElementById('nai-model-search')?.focus();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // DOM Mounting Scheduler
  // ---------------------------------------------------------------------------
  function findAnchor() {
    const direct = document.querySelector(MIC_SELECTOR) ||
                   document.querySelector('[aria-label="Start voice recording"]') ||
                   document.querySelector('[aria-label*="recording" i]') ||
                   document.querySelector('[aria-label*="voice" i]') ||
                   document.querySelector('[data-testid="agent-send-message-button"]') ||
                   document.querySelector('[data-testid*="send" i]') ||
                   document.querySelector('[aria-label="Submit AI message"]') ||
                   document.querySelector('[aria-label*="Send" i]');
    if (direct) return direct;

    const svgs = document.querySelectorAll('svg');
    for (const svg of svgs) {
      const cls = (svg.getAttribute('class') || '').toLowerCase();
      if (cls.includes('microphone') || cls.includes('arrowup') || cls.includes('arrow-up')) {
        const btn = svg.closest('button, [role="button"]');
        if (btn) return btn;
      }
    }

    const btns = document.querySelectorAll('button, [role="button"]');
    for (const btn of btns) {
      const label = (btn.getAttribute('aria-label') || '').toLowerCase();
      if (label.includes('mic') || label.includes('voice') || label.includes('record') || label.includes('send') || label.includes('submit')) {
        return btn;
      }
    }
    return null;
  }

  function mount() {
    if (!document.body || !document.head) return;
    installStyle();

    let anchor = findAnchor();
    if (!anchor) return;

    if (anchor.closest('[data-popup-origin="true"]')) {
      anchor = anchor.closest('[data-popup-origin="true"]');
    }
    const actionsRow = anchor.parentElement;
    if (!actionsRow) return;

    const modelHost = document.getElementById(MODEL_HOST_ID) || buildModelHost();
    const effortHost = document.getElementById(EFFORT_HOST_ID) || buildEffortHost();

    // Insert [Effort] [Model] before anchor
    if (modelHost.parentElement !== actionsRow || modelHost.nextSibling !== anchor) {
      actionsRow.insertBefore(modelHost, anchor);
    }
    if (effortHost.parentElement !== actionsRow || effortHost.nextSibling !== modelHost) {
      actionsRow.insertBefore(effortHost, modelHost);
    }

    if (!document.getElementById(MODEL_MENU_ID)) buildModelMenu();
    if (!document.getElementById(EFFORT_MENU_ID)) buildEffortMenu();

    updateControls();
    console.log('[ModelPicker] Controls mounted in Notion composer');
  }

  function scheduleMount() {
    const modelHost = document.getElementById(MODEL_HOST_ID);
    if (modelHost && modelHost.isConnected) return;

    if (mountScheduled) return;
    mountScheduled = true;
    requestAnimationFrame(() => {
      mountScheduled = false;
      mount();
    });
  }

  // ---------------------------------------------------------------------------
  // Initialization & Event Listeners
  // ---------------------------------------------------------------------------
  document.addEventListener('click', closeAll, true);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
  });
  window.addEventListener('resize', () => {
    const openMenu = document.querySelector('.nai-popover.open');
    if (openMenu) {
      const trigger = document.getElementById(openMenu.id === MODEL_MENU_ID ? 'nai-model-trigger' : 'nai-effort-trigger');
      positionMenu(openMenu, trigger);
    }
  }, { passive: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      mount();
      probeModelList();
    }, { once: true });
  } else {
    mount();
    probeModelList();
  }

  new MutationObserver(scheduleMount).observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  console.log('[ModelPicker] Notion AI Model Picker Pro v2.0.0 initialized on', location.href);
})();
