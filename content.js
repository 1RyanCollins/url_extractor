// Set of URLs extracted
let urlSet = new Set();

// Known domains for classification
const licensedSources = ['reuters.com', 'bloomberg.com', 'apnews.com'];
const publicWeb = ['wikipedia.org', 'heise.de', 'gov.de'];

// Function to classify URL
function classifyURL(url) {
    const domain = (new URL(url)).hostname.replace('www.', '');
    if (licensedSources.includes(domain)) return "Licensed";
    if (publicWeb.includes(domain)) return "Public Web";
    return "OpenAI-crawled / Unknown";
}

// Observe new messages in the ChatGPT chat container
const chatContainer = document.querySelector('main');
if (chatContainer) {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const links = node.querySelectorAll('a[href]');
                    links.forEach(a => {
                        urlSet.add(`${a.href} → ${classifyURL(a.href)}`);
                    });
                }
            });
        });
    });

    observer.observe(chatContainer, { childList: true, subtree: true });
}

// Listen for messages from popup to return URLs
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getURLs") {
        sendResponse(Array.from(urlSet));
    }
});
