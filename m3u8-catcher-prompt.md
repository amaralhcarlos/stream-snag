# Tarefa: Criar extensão Chrome "StreamSnag"

## Objetivo
Extensão Chrome (Manifest V3) que monitora requisições de rede na aba ativa,
detecta URLs com `.m3u8`, lista essas URLs no popup e gera comandos ffmpeg
prontos para copiar.

---

## Estrutura de arquivos

```
streamsnag/
├── manifest.json
├── background.js
├── popup.html
├── popup.css
├── popup.js
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## manifest.json

- `manifest_version: 3`
- `name`: `StreamSnag`
- `description`: `Detects .m3u8 HLS streams on the current tab and generates ffmpeg download commands.`
- `permissions`: `webRequest`, `tabs`, `scripting`
- `host_permissions`: `<all_urls>`
- `background.service_worker`: `background.js`
- `action.default_popup`: `popup.html`

---

## background.js (service worker)

- Mantém um `Map<tabId, Set<string>>` para armazenar as URLs detectadas por aba
- Usa `chrome.webRequest.onBeforeRequest` com `{ urls: ["<all_urls>"] }` para
  interceptar todas as requisições
- Filtra URLs que contêm `.m3u8`
- Ignora requisições com `tabId < 0` (requests de background)
- Atualiza o badge da extensão com a contagem de URLs detectadas naquela aba
  (cor vermelha `#e53e3e`)
- Limpa o Map e o badge quando a aba fecha (`chrome.tabs.onRemoved`)
- Limpa o Map e o badge quando a aba navega para nova página
  (`chrome.tabs.onUpdated` com `changeInfo.status === "loading"`)
- Responde duas mensagens do popup:
  - `GET_URLS` -> retorna `Array.from(detectedUrls.get(tabId) ?? [])`
  - `CLEAR_URLS` -> limpa o Set da aba e reseta o badge

---

## popup.html

- Header com título "▶ StreamSnag" e botão "Clear"
- Área principal com:
  - Mensagem de estado vazio (quando nenhuma URL foi detectada)
  - `<ul id="url-list">` para a lista de URLs

---

## popup.css

- Largura fixa de 380px, sem overflow horizontal
- Fundo escuro (tema dark): background `#1a1a2e`, texto claro
- Header com flexbox, alinhado, com separador inferior
- Cada item da lista (`<li>`) exibe:
  - A URL truncada com `text-overflow: ellipsis`
  - Dois botões na mesma linha: "Copiar URL" e "Copiar ffmpeg"
- Botões com estilo compacto; botão "Copiar ffmpeg" com destaque visual (cor
  diferente, ex: azul ou verde)
- Estado vazio centralizado, com texto em tom mais suave
- Badge de confirmação de cópia ("Copiado!") visível brevemente ao clicar

---

## popup.js

1. Ao abrir, consulta a aba ativa com `chrome.tabs.query`
2. Envia mensagem `GET_URLS` com o `tabId` para o service worker
3. Renderiza a resposta:
   - Se vazio: exibe mensagem de estado vazio
   - Se há URLs: para cada URL gera um `<li>` com:
     - Texto da URL (truncado visualmente via CSS)
     - Botão **"Copiar URL"**: copia a URL para o clipboard
     - Botão **"Copiar ffmpeg"**: copia o comando:
       ```
       ffmpeg -i "<url>" -c copy output.mp4
       ```
     - Ao clicar qualquer botão, mostra brevemente "Copiado!" no lugar do
       texto do botão e restaura após 1.5s
4. Botão "Clear" envia mensagem `CLEAR_URLS` e re-renderiza a lista vazia

---

## icons/

Gerar ícones PNG programaticamente via script Node.js ou Python (usando canvas
ou Pillow) com:
- Fundo vermelho escuro
- Letra "M" centralizada em branco
- Tamanhos: 16x16, 48x48, 128x128

---

## Restrições e preferências

- Sem autenticação SASL, sem dependências externas (vanilla JS no popup)
- Comentários do código em inglês
- Sem uso de `eval` ou `innerHTML` com dados não sanitizados (usar
  `textContent` e criação de elementos via DOM API)
- Compatível com Chrome 114+
