let timeElapsed = 0;
let interval = null;
let isPaused = false;
let duration = 10;

// Start the timer
let blocked = []
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Check if the URL has changed (this ensures the site has changed)
    chrome.storage.local.get(["blocked"], (result) => {

        if (result.blocked !== undefined) {
            blocked = Array.isArray(result.blocked)
                ? result.blocked
                : Object.values(result.blocked);
        }
    });
    for (let sites of blocked) {
        console.log(sites);
        if (changeInfo.url?.includes(sites) && sites.length > 0) {
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
        // You can execute your logic here when the site changes
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
            let tabId = tab.id
            if (tab.url?.includes(sites) && sites.length > 0) {
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
        // You can execute your logic here when the user switches tabs
    });
});

const startTimer = (tabId) => {
    console.log(tabId);
    if (interval) clearInterval(interval);// Clear any existing timer
    interval = setInterval(() => {
        if (!isPaused) {
            timeElapsed++;
            console.log(`Time elapsed: ${timeElapsed} seconds`);

            if (timeElapsed === duration) {
                // Send a notification
                chrome.notifications.create({
                    type: "basic",
                    iconUrl: "images/image.png", // Ensure this path is valid
                    title: "Timer Alert",
                    message: `${savedDuration} seconds have passed!`,
                });

                // Execute an alert script in the active tab
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

// Reset the timer
const resetTimer = (tabId) => {
    clearInterval(interval);
    interval = null;
    timeElapsed = 0;
    startTimer(tabId); // Restart the timer
};

// Pause the timer
const pauseTimer = () => {
    isPaused = true;
    console.log("Timer paused");
};

// Resume the timer
const resumeTimer = () => {
    isPaused = false;
    console.log("Timer resumed");
};

// Listen for messages from the popup
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
