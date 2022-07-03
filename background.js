chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ allGpa: 0, allScore: 0, requiredGpa: 0,requiredScore: 0 });
})