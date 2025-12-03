// Set to store URLs uniquely
let urlSet = new Set();

// Known domains for classification
const licensedSources = ['reuters.com', 'bloomberg.com', 'apnews.com'];
const publicWeb = ['wikipedia.org', 'heise.de', 'gov.de'];

// Classify URLs
function classifyURL(url) {
    try {
        const domain = (new URL(url)).hostname.replace('www.', '');
        if (licensedSources.includes(domain)) return "Licensed";
        if (publicWeb.includes(domain)) return "Public Web";
        return "OpenAI-crawled / Unknown";
    } catch {
        return "Invalid URL";
    }
}

// Regex for URLs
const urlRegex = /https?:\/\/[^\s)]+/g;

// ------------------ Capture DOM URLs ------------------
function initObserver() {
    const container = document.querySelector('main');
    if (!container) return;

    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // <a> tags
                    node.querySelectorAll('a[href]').forEach(a => {
                        urlSet.add(`${a.href} → ${classifyURL(a.href)}`);
                    });
                    // Plain text URLs
                    const textUrls = node.textContent.match(urlRegex);
                    if (textUrls) {
                        textUrls.forEach(u => urlSet.add(`${u} → ${classifyURL(u)}`));
                    }
                }
            });
        });
    });

    observer.observe(container, { childList: true, subtree: true });
}

// ------------------ Capture WebSocket URLs ------------------
// Inject script into page context
const wsCaptureScript = document.createElement('script');
wsCaptureScript.textContent = `
(function() {
    const originalWS = window.WebSocket;
    window.WebSocket = function(url, protocols) {
        const ws = protocols ? new originalWS(url, protocols) : new originalWS(url);
        
        ws.addEventListener('message', function(event) {
            try {
                const data = event.data;
                let json;
                try { json = JSON.parse(data); } catch { return; }
                
                function extractUrls(obj) {
                    if (!obj) return;
                    if (typeof obj === 'string') {
                        const matches = obj.match(/https?:\\/\\/[^\\s)]+/g);
                        return matches || [];
                    } else if (typeof obj === 'object') {
                        let urls = [];
                        for (const key in obj) {
                            urls = urls.concat(extractUrls(obj[key]));
                        }
                        return urls;
                    }
                    return [];
                }

                const urls = extractUrls(json);
                if (urls.length) {
                    window.postMessage({ type: 'CHATGPT_URLS', urls }, '*');
                }
            } catch(e) {}
        });
        
        return ws;
    };
})();
`;
document.documentElement.appendChild(wsCaptureScript);

// Listen for URLs from the injected script
window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data && event.data.type === 'CHATGPT_URLS') {
        event.data.urls.forEach(u => urlSet.add(`${u} → ${classifyURL(u)}`));
    }
});

// Initialize DOM observer
setTimeout(initObserver, 2000);

// Listen for popup requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getURLs") {
        sendResponse(Array.from(urlSet));
    }
});

