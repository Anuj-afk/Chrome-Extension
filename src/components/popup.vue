<script setup lang="ts">
import { ref, onMounted } from "vue";

const Hours1 = ref(0);
const Min1 = ref(0);
const Hours2 = ref(0);
const Min2 = ref(0);
let timeElapsedHours = ref(0);
let timeElapsedMin = ref(0);
let timeElapsedSec = ref(0);
const Hours = ref(10 * Hours1.value + Hours2.value);
const Min = ref(10 * Min1.value + Min2.value);
const blocked = ref([""]);
const site = ref("");
// Default duration is 10 seconds


const saveBlocked = () => {
    if (site.value.trim()) {
        // Remove empty string (if any) before adding a new site
        if (blocked.value[blocked.value.length - 1] === "") {
            blocked.value.pop();
        }

        // Add the new site to the blocked list
        blocked.value.push(site.value);

        // Clear the input field for the next entry
        site.value = "";

        // Add an empty string to trigger input field visibility again
        blocked.value.push("");

        // Save to local storage
        chrome.storage.local.set({ blocked: Array.from(blocked.value) });
    }
};

const removeSite = (index: number) => {
    blocked.value.splice(index, 1); // Remove item properly
    chrome.storage.local.set({ blocked: [...blocked.value] }); // Store as array
};

const updateTimerDisplay = () => {
    chrome.runtime.sendMessage({ action: "getTime" }, (response) => {

        if (response && response.timeElapsed !== undefined) {
            if (response.timeElapsed / 60 > 0) {
                timeElapsedHours.value = Math.floor(
                    response.timeElapsed / 3600
                );
                timeElapsedMin.value = Math.floor(
                    (response.timeElapsed % 3600) / 60
                );
            }
            timeElapsedSec.value = response.timeElapsed % 60;
        }
    });
};

const saveTimerDisplay = () => {
    Hours.value = 10 * Hours1.value + Hours2.value;
    Min.value = 10 * Min1.value + Min2.value;
    chrome.storage.local.set({ Hours: Hours.value, Min: Min.value });
};

const startTimer = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab) {
            chrome.runtime.sendMessage({
                action: "start",
                tabId: activeTab.id,
                duration: Hours.value * 3600 + Min.value * 60, // Pass the duration to background.js
            });
        }
    });
};

const resetTimer = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab) {
            chrome.runtime.sendMessage({
                action: "reset",
                tabId: activeTab.id,
            });
        }
    });
};

const pauseTimer = () => {
    chrome.runtime.sendMessage({ action: "pause" });
};

const resumeTimer = () => {
    chrome.runtime.sendMessage({ action: "resume" });
};

onMounted(() => {
    chrome.storage.local.get(["Hours", "Min", "blocked"], (result) => {
        if (result.Hours !== undefined) {
            Hours.value = result.Hours;
            Hours1.value = Math.floor(result.Hours / 10);
            Hours2.value = result.Hours % 10;
        }
        if (result.Min !== undefined) {
            Min.value = result.Min;
            Min1.value = Math.floor(result.Min / 10);
            Min2.value = result.Min % 10;
        }
        if (result.blocked !== undefined) {
            blocked.value = Array.isArray(result.blocked)
                ? result.blocked
                : Object.values(result.blocked);
        }
    });

    setInterval(updateTimerDisplay, 1000);
});
</script>

<template>
    <div class="min-w-[500px] min-h-[500px]">
        <h1 class="text-lg w-full text-center font-bold mt-4">
            Timer Extension
        </h1>
        <div class="p-4 text-center flex w-full justify-around mt-4">
            <div>
                <p class="text-white">
                    Time Elapsed: {{ timeElapsedHours }} Hours
                    {{ timeElapsedMin }} Minutes {{ timeElapsedSec }} seconds
                </p>
                <div class="mt-4">
                    <label for="duration" class="block text-white"
                        >Set Alert Duration:</label
                    >
                    <div class="flex gap-4">
                        <div class="flex">
                            <input
                                id="duration"
                                type="number"
                                v-model="Hours1"
                                min="0"
                                step="1"
                                max="9"
                                class="mt-2 pl-2 py-1 border rounded w-8 h-12 text-black bg-white"
                                v-on:change="saveTimerDisplay"
                            />
                            <input
                                id="duration"
                                type="number"
                                pattern="[0-9]{2}"
                                v-model="Hours2"
                                min="0"
                                step="1"
                                max="9"
                                class="mt-2 pl-2 py-1 border rounded w-8 h-12 text-black bg-white"
                                v-on:change="saveTimerDisplay"
                            />
                            <p class="text-white my-auto ml-2">Hours</p>
                        </div>
                        <div class="flex">
                            <input
                                id="duration"
                                type="number"
                                pattern="[0-9]{2}"
                                v-model="Min1"
                                min="0"
                                step="1"
                                max="6"
                                class="mt-2 pl-2 py-1 border rounded w-8 h-12 text-black bg-white"
                                v-on:change="saveTimerDisplay"
                            />
                            <input
                                id="duration"
                                type="number"
                                v-model="Min2"
                                min="0"
                                step="1"
                                :disabled="Min1 == 6"
                                max="9"
                                class="mt-2 pl-2 py-1 border rounded w-8 h-12 text-black bg-white"
                                v-on:change="saveTimerDisplay"
                            />
                            <p class="text-white my-auto ml-2">Minutes</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="flex flex-col gap-4">
                <button
                    @click="startTimer"
                    class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                    Start Timer
                </button>
                <button
                    @click="pauseTimer"
                    class="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                    Pause Timer
                </button>
                <button
                    @click="resumeTimer"
                    class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Resume Timer
                </button>
                <button
                    @click="resetTimer"
                    class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                    Reset Timer
                </button>
            </div>
        </div>
        <div class="text-white mt-4">
            <span class="text-xl ml-2">Blocked Sites: </span>
            <div class="flex mt-4 flex-wrap">
                <!-- Loop through the blocked list to display actual sites -->
                <div
                    v-for="(sites, index) in blocked"
                    :key="index"
                    class="flex items-center bg-gray-700 px-2 py-1 rounded-md mr-2 mb-2"
                >
                    <div
                        v-if="!sites.length"
                        class="flex items-center bg-gray-700 px-2 py-1 rounded-md mr-2 mb-2"
                    >
                        <input
                            type="text"
                            v-model="site"
                            class="pl-2 py-1 text-black bg-white rounded-md w-48"
                            placeholder="Add a site"
                        />
                        <i
                            class="fi fi-rr-add text-xl ml-2 text-blue-700 cursor-pointer hover:text-blue-500"
                            @click="saveBlocked"
                        ></i>
                    </div>
                    <!-- Display site name -->
                    <span v-else class="text-[16px] text-white">{{
                        sites
                    }}</span>
                    <!-- Remove button appears only for actual sites, not the input field -->
                    <i
                        v-if="sites"
                        class="fi fi-rr-x text-white text-[12px] ml-2 cursor-pointer hover:text-red-500"
                        @click="removeSite(index)"
                    ></i>
                </div>

                <!-- Input field will appear only if the last item in blocked is empty, and only when the input field is empty -->
            </div>
        </div>
    </div>
</template>
