// ==========================================
// 💾 STATE & LOCAL STORAGE INITIALIZATION
// ==========================================
let state = {
    credits: 0,
    xp: 0,
    level: 1,
    streak: 0,
    lastActiveDate: null,
    timerSeconds: 1500, // 25 minutes default
    isRunning: false
};

// Load saved data if it exists
if (localStorage.getItem('studyOS_save')) {
    state = JSON.parse(localStorage.getItem('studyOS_save'));
    state.isRunning = false; // Never start running on load
    state.timerSeconds = 1500; // Reset timer visually on reload
}

// ==========================================
// ⏰ DOM ELEMENTS
// ==========================================
const timerDisplay = document.getElementById('timer');
const creditDisplay = document.getElementById('creditCount');
const levelDisplay = document.getElementById('levelCount');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const taskbarClock = document.getElementById('taskbar-clock');

// ==========================================
// 🚀 INITIALIZATION
// ==========================================
updateUI();
updateClock();
setInterval(updateClock, 1000);
checkStreak();

let timerInterval = null;
let creditAccumulator = 0; // Tracks seconds passed to award credits every 10 mins (600s)

// ==========================================
// ⏱️ POMODORO TIMER CORE LOGIC
// ==========================================
function startTimer() {
    if (state.isRunning) return;
    state.isRunning = true;
    
    timerInterval = setInterval(() => {
        if (state.timerSeconds > 0) {
            state.timerSeconds--;
            creditAccumulator++;
            
            // 💸 Award +100 credits every 10 minutes (600 seconds)
            if (creditAccumulator >= 600) {
                earnCredits(100);
                triggerGlitchEffect();
                spawnNotification("SYSTEM", "Credits generated. Keep focusing.");
                creditAccumulator = 0;
            }
            
            // Give tiny bits of XP dynamically for studying (1 XP per minute)
            if (state.timerSeconds % 60 === 0) {
                gainXP(5);
            }
            
        } else {
            // Timer Finished!
            clearInterval(timerInterval);
            state.isRunning = false;
            state.timerSeconds = 1500; // Reset to 25 mins
            
            earnCredits(250); // Big bonus for completion
            gainXP(50);
            updateStreak();
            triggerGlitchEffect();
            
            spawnNotification("ALERT.EXE", "Session complete. motivation.dll has loaded.");
            showRandomDreamcoreQuote();
        }
        
        updateUI();
        saveData();
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerInterval);
    state.isRunning = false;
    saveData();
}

function resetTimer() {
    clearInterval(timerInterval);
    state.isRunning = false;
    state.timerSeconds = 1500;
    creditAccumulator = 0;
    updateUI();
    saveData();
}

// ==========================================
// ⭐ XP, LEVEL, AND REWARDS SYSTEM
// ==========================================
function earnCredits(amount) {
    state.credits += amount;
    // Hook for shop logic later
    onCreditsChanged(state.credits);
}

function gainXP(amount) {
    state.xp += amount;
    let xpNeeded = state.level * 100; // Level 1 needs 100XP, Level 2 needs 200XP...
    
    if (state.xp >= xpNeeded) {
        state.xp -= xpNeeded;
        state.level++;
        spawnNotification("UPGRADE", `System updated to Level ${state.level}!`);
        triggerGlitchEffect();
        // Hook for achievement unlocks later
        onLevelUp(state.level);
    }
}

// ==========================================
// 🔥 DAILY STREAK TRACKING
// ==========================================
function checkStreak() {
    const today = new Date().toDateString();
    if (state.lastActiveDate) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (state.lastActiveDate !== today && state.lastActiveDate !== yesterday.toDateString()) {
            state.streak = 0; // Broke the streak
        }
    }
}

function updateStreak() {
    const today = new Date().toDateString();
    if (state.lastActiveDate !== today) {
        state.streak++;
        state.lastActiveDate = today;
        spawnNotification("STREAK", `Daily streak extended to ${state.streak} days.`);
    }
}

// ==========================================
// 🖥️ UI INTERACTION & UPDATES
// ==========================================
function updateUI() {
    // Format timer MM:SS
    let mins = Math.floor(state.timerSeconds / 60);
    let secs = state.timerSeconds % 60;
    timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    
    // Counters
    creditDisplay.textContent = state.credits;
    levelDisplay.textContent = state.level;
}

function updateClock() {
    const now = new Date();
    let hrs = now.getHours().toString().padStart(2, '0');
    let mins = now.getMinutes().toString().padStart(2, '0');
    taskbarClock.textContent = `${hrs}:${mins}`;
}

// ⚡ Glitch flash effect on earning
function triggerGlitchEffect() {
    const glitchElement = document.querySelector('.glitch');
    if (!glitchElement) return;
    
    glitchElement.style.background = 'rgba(138, 206, 0, 0.4)';
    setTimeout(() => {
        glitchElement.style.background = '';
    }, 150);
}

// ==========================================
// 📢 POPUP NOTIFICATIONS & DREAMCORE LOGIC
// ==========================================
function spawnNotification(title, message) {
    const popup = document.createElement('div');
    popup.className = 'window notification-popup';
    popup.style.cssText = `
        position: fixed;
        bottom: 50px;
        right: 20px;
        width: 280px;
        z-index: 10000;
        top: auto; left: auto;
    `;
    
    popup.innerHTML = `
        <div class="titlebar">
            <span>${title}</span>
            <div class="buttons"><span class="close-notif">×</span></div>
        </div>
        <div class="window-content" style="padding:10px; font-size:0.75rem;">
            ${message}
        </div>
    `;
    
    document.body.appendChild(popup);
    
    // Play a retro click/beep sound structure if desired later
    popup.querySelector('.close-notif').addEventListener('click', () => popup.remove());
    
    // Auto clear after 6 seconds
    setTimeout(() => { if (popup) popup.remove(); }, 6000);
}

const dreamcoreQuotes = [
    "the moon is watching your revision.",
    "system integrity restored.",
    "motivation.dll has loaded.",
    "are you looking for files that aren't there?",
    "your time is recorded. the universe approves.",
    "do not close your eyes until the cycle finishes.",
    "memory optimization complete."
];

function showRandomDreamcoreQuote() {
    const quoteBox = document.querySelector('.quote');
    if (quoteBox) {
        const randomIndex = Math.floor(Math.random() * dreamcoreQuotes.length);
        quoteBox.textContent = dreamcoreQuotes[randomIndex];
    }
}

// Periodic creepy message checks (every 7 minutes)
setInterval(() => {
    if (state.isRunning && Math.random() > 0.5) {
        const msg = dreamcoreQuotes[Math.floor(Math.random() * dreamcoreQuotes.length)];
        spawnNotification("DREAMCORE.SYS", msg);
    }
}, 420000);

// ==========================================
// 💾 SAVE UTILITY
// ==========================================
function saveData() {
    localStorage.setItem('studyOS_save', JSON.stringify(state));
}

// ==========================================
// 🎣 SYSTEM FUTURE HOOKS (For shop & achievements)
// ==========================================
function onCreditsChanged(currentCredits) {
    console.log(`[Shop Hook] Credits updated: ${currentCredits}`);
    // Future shop script will hook into this to enable/disable buy buttons
}

function onLevelUp(currentLevel) {
    console.log(`[Achievement Hook] Level achieved: ${currentLevel}`);
    // Future achievement script can unlock items based on milestones here
}

// ==========================================
// 🎛️ EVENT LISTENERS
// ==========================================
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

// Quick initialization notification
setTimeout(() => {
    spawnNotification("SYSTEM.EXE", "Welcome back. Operating system loaded successfully.");
}, 2000);
