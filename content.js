// Store URLs globally
let urlSet = new Set();

// Monkey-patch WebSocket to intercept delta messages
(function() {
    const OriginalWebSocket = window.WebSocket;

    window.WebSocket = function(url, protocols) {
        const ws = protocols ? new OriginalWebSocket(url, protocols) : new OriginalWebSocket(url);

        ws.addEventListener('message', event => {
            try {
                const data = JSON.parse(event.data);

                // Check for delta messages
                if (data.type === 'delta') {
                    const contents = data.message?.content || [];
                    contents.forEach(item => {
                        if (item.text) {
                            const urls = item.text.match(/https?:\/\/[^\s]+/g);
                            if (urls) urls.forEach(u => urlSet.add(u));
                        }
                    });
                }
            } catch (e) {
                // Ignore non-JSON or parse errors
            }
        });

        return ws;
    };
})();
  
// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getURLs") {
        sendResponse(Array.from(urlSet));
    }
});



