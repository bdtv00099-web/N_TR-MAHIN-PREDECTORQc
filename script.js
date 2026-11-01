const DAY_PASSWORDS = {
    0: "X9#kP", 1: "Mz$4v", 2: "Q8!wR", 3: "J2n&L", 4: "T5y@S", 5: "B7c^F", 6: "Z3d*H"
};
const MASTER_PASSWORD = "Ntrmahin@000";

let userName = "Boss";
let history = [];
let wins = 0;
let losses = 0;
let consecutiveLosses = 0; // পরপর কতটি লস হয়েছে
let holdRoundsLeft = 0;    // কতটি রাউন্ড হোল্ডে থাকবে
let activePrediction = null;
let isReverseMode = false;
let isMinimized = true;

// 🔊 Voice Synthesis
function playAudioVoice(phrase) {
    const isVoiceEnabled = document.getElementById('voiceToggle').checked;
    if (!isVoiceEnabled) return;

    let textToSpeak = "";
    if (phrase === "UNLOCK") textToSpeak = `${userName} Boss, System Unlocked`;
    else if (phrase === "PLAYER") textToSpeak = `${userName} Boss, Next Prediction Player`;
    else if (phrase === "BANKER") textToSpeak = `${userName} Boss, Next Prediction Banker`;
    else if (phrase === "HOLD") textToSpeak = `${userName} Boss, System is on Hold. Please Wait`;

    if (!textToSpeak) return;

    const audioUrl = "https://translate.google.com/translate_tts?ie=UTF-8&q=" + encodeURIComponent(textToSpeak) + "&tl=en&client=tw-ob";
    const audio = new Audio(audioUrl);
    audio.play().catch(() => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utt = new SpeechSynthesisUtterance(textToSpeak);
            utt.pitch = 1.1;
            utt.rate = 1.0;
            window.speechSynthesis.speak(utt);
        }
    });
}

function verifyPassword() {
    const inputName = document.getElementById('nameInput').value.trim();
    const inputPass = document.getElementById('passInput').value.trim();
    const errorEl = document.getElementById('errorMsg');
    const todayIndex = new Date().getDay();
    const validDayPass = DAY_PASSWORDS[todayIndex];

    if (inputName !== "" && (inputPass === MASTER_PASSWORD || inputPass === validDayPass)) {
        userName = inputName;
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('greetingDisplay').innerText = `WELCOME, ${userName.toUpperCase()} BOSS`;
        playAudioVoice("UNLOCK");
        makeCardDraggable();
    } else {
        errorEl.style.display = 'block';
    }
}

// 🖐️ Manual Result Input (P or B)
function addManualResult(result) {
    if (activePrediction && holdRoundsLeft === 0) {
        const expected = activePrediction === 'PLAYER' ? 'P' : 'B';
        if (result === expected) {
            wins++;
            consecutiveLosses = 0; // উইন হলে লস স্ট্রিক রিসেট
        } else {
            losses++;
            consecutiveLosses++; // লস কাউন্ট বৃদ্ধি
            holdRoundsLeft = consecutiveLosses; // যত লস, তত রাউন্ড হোল্ড!
        }
    } else if (holdRoundsLeft > 0) {
        holdRoundsLeft--; // হোল্ড রাউন্ড কমানো
    }

    history.push(result);
    updateUI();

    if (holdRoundsLeft > 0) {
        playAudioVoice("HOLD");
    } else if (activePrediction) {
        playAudioVoice(activePrediction);
    }
}

// 🖐️ Touch & Mouse Drag Functionality
function makeCardDraggable() {
    const card = document.getElementById("floatingCard");
    const header = document.getElementById("cardHeader");
    const bubble = document.getElementById("bubbleView");
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    header.onmousedown = dragMouseDown;
    header.ontouchstart = dragTouchStart;
    bubble.onmousedown = dragMouseDown;
    bubble.ontouchstart = dragTouchStart;

    function dragMouseDown(e) {
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        card.style.top = (card.offsetTop - pos2) + "px";
        card.style.left = (card.offsetLeft - pos1) + "px";
        bubble.style.top = card.style.top;
        bubble.style.left = card.style.left;
    }

    function dragTouchStart(e) {
        const touch = e.touches[0];
        pos3 = touch.clientX;
        pos4 = touch.clientY;
        document.ontouchend = closeDragElement;
        document.ontouchmove = elementTouchMove;
    }

    function elementTouchMove(e) {
        const touch = e.touches[0];
        pos1 = pos3 - touch.clientX;
        pos2 = pos4 - touch.clientY;
        pos3 = touch.clientX;
        pos4 = touch.clientY;
        card.style.top = (card.offsetTop - pos2) + "px";
        card.style.left = (card.offsetLeft - pos1) + "px";
        bubble.style.top = card.style.top;
        bubble.style.left = card.style.left;
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        document.ontouchend = null;
        document.ontouchmove = null;
    }
}

function toggleMinimize() {
    isMinimized = !isMinimized;
    const card = document.getElementById('floatingCard');
    const bubble = document.getElementById('bubbleView');
    if (isMinimized) {
        card.classList.add('minimized');
        bubble.style.display = 'flex';
    } else {
        card.classList.remove('minimized');
        bubble.style.display = 'none';
    }
}

function undoLast() {
    if (history.length > 0) {
        history.pop();
        updateUI();
    }
}

function resetAll() {
    history = [];
    wins = 0;
    losses = 0;
    consecutiveLosses = 0;
    holdRoundsLeft = 0;
    activePrediction = null;
    isReverseMode = false;
    updateUI();
}

// 🧠 20 Pattern Logic Engine
function calculateBasePattern(historyList) {
    const clean = historyList.filter(x => x !== 'T');
    const len = clean.length;
    if (len < 2) return null;
    
    const last10 = clean.slice(-10);
    const str = last10.join('');

    if (str.endsWith("BBB")) return { signal: 'P', name: 'TRIPLE BREAK', conf: 88 };
    if (str.endsWith("PPP")) return { signal: 'B', name: 'TRIPLE BREAK', conf: 88 };
    if (str.endsWith("PBP")) return { signal: 'B', name: 'ZIGZAG', conf: 86 };
    if (str.endsWith("BPB")) return { signal: 'P', name: 'ZIGZAG', conf: 86 };
    if (str.endsWith("BBPP")) return { signal: 'B', name: 'DOUBLE ZIGZAG', conf: 90 };
    if (str.endsWith("PPBB")) return { signal: 'P', name: 'DOUBLE ZIGZAG', conf: 90 };
    if (str.endsWith("BB")) return { signal: 'P', name: 'BLOCK MIRROR', conf: 84 };
    if (str.endsWith("PP")) return { signal: 'B', name: 'BLOCK MIRROR', conf: 84 };
    if (str.endsWith("BBPBB")) return { signal: 'B', name: 'REPEATING BLOCK', conf: 92 };
    if (str.endsWith("PPBPP")) return { signal: 'P', name: 'REPEATING BLOCK', conf: 92 };
    if (str.endsWith("BBBB")) return { signal: 'B', name: 'LONG STREAK FOLLOW', conf: 93 };
    if (str.endsWith("PPPP")) return { signal: 'P', name: 'LONG STREAK FOLLOW', conf: 93 };
    if (str.endsWith("BBP")) return { signal: 'P', name: 'SAME BLOCK OPPOSITE', conf: 85 };
    if (str.endsWith("PPB")) return { signal: 'B', name: 'SAME BLOCK OPPOSITE', conf: 85 };
    if (str.endsWith("BBPB")) return { signal: 'B', name: 'VARIABLE BLOCK', conf: 89 };
    if (str.endsWith("PPBP")) return { signal: 'P', name: 'VARIABLE BLOCK', conf: 89 };
    if (str.endsWith("BBPPP")) return { signal: 'P', name: 'BLOCK CONTINUATION', conf: 94 };
    if (str.endsWith("PPBBB")) return { signal: 'B', name: 'BLOCK CONTINUATION', conf: 94 };
    if (str.endsWith("BPBB")) return { signal: 'B', name: 'ZIGZAG BREAK', conf: 87 };
    if (str.endsWith("PBPP")) return { signal: 'P', name: 'ZIGZAG BREAK', conf: 87 };

    const last = clean[len - 1];
    return { signal: last === 'P' ? 'B' : 'P', name: 'TREND MOMENTUM', conf: 78 };
}

function updateUI() {
    document.getElementById('winCount').innerText = wins;
    document.getElementById('lossCount').innerText = losses;
    const totalRounds = wins + losses;
    const rate = totalRounds > 0 ? Math.round((wins / totalRounds) * 100) : 0;
    document.getElementById('winRate').innerText = `${rate}%`;

    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    history.slice(-12).forEach(item => {
        const badge = document.createElement('div');
        badge.className = `hist-badge hb-${item}`;
        badge.innerText = item;
        historyList.appendChild(badge);
    });

    const modeBadgeEl = document.getElementById('modeBadge');
    if (isReverseMode) {
        modeBadgeEl.innerText = "REVERSE MODE";
        modeBadgeEl.className = "mode-badge mode-reverse";
    } else {
        modeBadgeEl.innerText = "NORMAL MODE";
        modeBadgeEl.className = "mode-badge mode-normal";
    }

    const predEl = document.getElementById('predOutput');
    const predSub = document.getElementById('predSub');
    const baseResult = calculateBasePattern(history);

    // 🛑 HOLD Logic Check
    if (holdRoundsLeft > 0) {
        activePrediction = null;
        predEl.innerText = `HOLD (${holdRoundsLeft} ROUNDS)`;
        predEl.style.color = "#f59e0b";
        predSub.innerText = `Loss Protection Active. Wait ${holdRoundsLeft} round(s).`;
        return;
    }

    if (!baseResult) {
        activePrediction = null;
        predEl.innerText = "WAITING...";
        predEl.style.color = "var(--text-main)";
        predSub.innerText = `Tap P or B according to game result`;
    } else {
        let finalSignal = baseResult.signal;
        if (isReverseMode) {
            finalSignal = baseResult.signal === 'P' ? 'B' : 'P';
        }

        activePrediction = finalSignal === 'P' ? 'PLAYER' : 'BANKER';
        predEl.innerText = `${activePrediction} (${baseResult.conf}%)`;
        predEl.style.color = activePrediction === 'PLAYER' ? 'var(--player-blue)' : 'var(--banker-red)';

        const modeText = isReverseMode ? "REVERSE" : "NORMAL";
        predSub.innerText = `${baseResult.name} | ${modeText}`;
    }
}