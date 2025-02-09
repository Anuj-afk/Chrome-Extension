let timeElapsed = 0;
let interval = null;
let isPaused = true;
let duration = 10;

let blocked = []
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    chrome.storage.local.get(["blocked"], (result) => {

        if (result.blocked !== undefined) {
            blocked = Array.isArray(result.blocked)
                ? result.blocked
                : Object.values(result.blocked);
        }
    });
    for (let sites of blocked) {
        if (changeInfo.url?.includes(sites) && sites.length > 0 && !isPaused) {
            chrome.scripting.executeScript({
                target: { tabId },
                func: () => {
                },
            },() => {
                chrome.tabs.update(tabId, { url: "https://www.google.com" });
            });
        }
    }
    if (changeInfo.url) {
        console.log("User navigated to: ", changeInfo.url, tab, tabId);
    }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
        chrome.storage.local.get(["blocked"], (result) => {

        if (result.blocked !== undefined) {
            blocked = Array.isArray(result.blocked)
                ? result.blocked
                : Object.values(result.blocked);
        }
    });
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        for (let sites of blocked) {
            console.log(!isPaused);
            let tabId = tab.id
            if (tab.url?.includes(sites) && sites.length > 0 && !isPaused) {
                chrome.scripting.executeScript({
                    target: { tabId },
                    func: () => {
                    },
                },() => {
                    chrome.tabs.update(activeInfo.tabId, { url: "https://www.google.com" });
                });
            }
        }
        console.log("User switched to tab with URL: ", tab.url);
    });
});

const startTimer = (tabId) => {
    console.log(tabId);
    if (interval) clearInterval(interval);
    interval = setInterval(() => {
        if (!isPaused) {
            timeElapsed++;
            console.log(`Time elapsed: ${timeElapsed} seconds`);

            if (timeElapsed === duration) {
                chrome.notifications.create({
                    type: "basic",
                    iconUrl: "images/image.png",
                    title: "Timer Alert",
                    message: `${savedDuration} seconds have passed!`,
                });
                chrome.scripting.executeScript({
                    target: { tabId },
                    func: () => {
                        alert(`Time is over`);
                    },
                },() => {
                    resetTimer(tabId);
                });
            }
        }
    }, 1000);
};

const resetTimer = (tabId) => {
    clearInterval(interval);
    interval = null;
    timeElapsed = 0;
    startTimer(tabId); 
};


const pauseTimer = () => {
    isPaused = true;
    console.log("Timer paused");
};


const resumeTimer = () => {
    isPaused = false;
    console.log("Timer resumed");
};


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const tabId = message.tabId;

    if (message.action === "start") {
        isPaused = false;
        duration = message.duration;
        startTimer(tabId);
    } else if (message.action === "reset") {
        resetTimer(tabId);
    } else if (message.action === "pause") {
        pauseTimer();
    } else if (message.action === "resume") {
        resumeTimer();
    } else if (message.action === "getTime") {
        sendResponse({ timeElapsed });
    }
});
