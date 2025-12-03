const urlList = document.getElementById('urlList');
const copyBtn = document.getElementById('copyBtn');

chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        func: () => {
            return new Promise(resolve => {
                chrome.runtime.sendMessage({action: "getURLs"}, resolve);
            });
        }
    }).then(result => {
        const urls = result[0].result || [];
        urls.forEach(u => {
            const li = document.createElement('li');
            li.textContent = u;
            urlList.appendChild(li);
        });
    });
});

// Copy to clipboard
copyBtn.addEventListener('click', () => {
    const urls = Array.from(urlList.children).map(li => li.textContent).join("\n");
    navigator.clipboard.writeText(urls);
    alert("Copied URLs to clipboard!");
});
