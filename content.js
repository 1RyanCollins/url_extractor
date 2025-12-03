// content.js
let urlSet = new Set();

// Intercept fetch requests to capture delta messages
(function() {
    const origFetch = window.fetch;
    window.fetch = async (...args) => {
        const response = await origFetch(...args);

        // Only intercept ChatGPT conversation endpoint
        if (args[0].includes("/backend-api/f/conversation")) {
            const cloned = response.clone();
            cloned.json().then(data => {
                if (data?.message?.content) {
                    data.message.content.forEach(item => {
                        if (item.text) {
                            const urls = item.text.match(/https?:\/\/[^\s]+/g);
                            if (urls) urls.forEach(u => urlSet.add(u));
                        }
                    });
                }
            }).catch(e => {});
        }
        return response;
    };
})();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getURLs") {
        sendResponse(Array.from(urlSet));
    }
});


