// Data is loaded from diagnosis_data.js globally

// --- State Management ---
const state = {
    currentQuestionIndex: 0,
    answers: [], // Stores selected option for each question
    scores: {
        U: 0, // Urgency
        L: 0, // Legal
        B: 0, // Burden
        V: 0  // Value
    }
};

// --- Logic Functions ---

// Initialize or Reset State
function initDiagnosis() {
    state.currentQuestionIndex = 0;
    state.answers = [];
    state.scores = { U: 0, L: 0, B: 0, V: 0 };
    renderQuestion();
}

// Calculate Scores based on all answers
function calculateScores() {
    // Reset scores first to ensure clean calculation from recorded answers
    let newScores = { U: 0, L: 0, B: 0, V: 0 };
    
    state.answers.forEach(answer => {
        const option = answer.selectedOption;
        
        // Add scores defined in the option
        if (option.score) {
            for (const [key, value] of Object.entries(option.score)) {
                if (newScores[key] !== undefined) {
                    newScores[key] += value;
                }
            }
        }
    });

    state.scores = newScores;
    console.log("Calculated Scores:", state.scores);
    return newScores;
}

// Calculate Neglect Risk Score (0-100)
// Max possible score based on data is approx 55 (U=12, L=15, B=18, V=10 approx max sum path)
// We will simply sum all scores and map to 0-100 based on a max of 55.
function calculateRiskScore() {
    const { U, L, B, V } = state.scores;
    const total = U + L + B + V;
    const maxScore = 55;
    let score = Math.round((total / maxScore) * 100);
    if (score > 100) score = 100;
    return score;
}

// Determine Result Type based on "Waterfall" Logic (Prioritized)
function determineResultType() {
    const { U, L, B, V } = state.scores;
    const answers = state.answers;

    // Helper to check answer value for a specific question ID
    // Note: answers array index is id - 1
    const getAnsVal = (qId) => {
        const ans = answers.find(a => a.questionId === qId);
        return ans?.selectedOption?.value; // Returns 'A', 'B', 'C', 'D' or undefined
    };

    console.log("Checking Logic with:", { U, L, B, V });

    // 1. Type E (Emergency): High Urgency
    if (U >= 12) {
        return 'E';
    }

    // 2. Type C (Legal/Rights): Legal issues prioritized
    const q5 = getAnsVal(5); // Name
    const q7 = getAnsVal(7); // Family Consensus
    if (L >= 10 && (['B', 'C'].includes(q5) || ['C', 'D'].includes(q7))) {
        return 'C';
    }

    // 3. Type B (Burden): High Burden or Serious Deterioration
    const q10 = getAnsVal(10); // Building State
    if (B >= 12 || q10 === 'D') {
        return 'B';
    }

    // 4. Type D (Value/Asset): Wants to keep/utilize, but burden is manageable
    if (V >= 10 && B <= 15) {
        return 'D';
    }

    // 5. Type A (Action/Sale): Default for those ready to move
    return 'A';
}

// --- DOM Elements ---
const screens = {
    hero: document.getElementById('hero-section'),
    question: document.getElementById('question-section'),
    loading: document.getElementById('loading-section'),
    result: document.getElementById('result-section')
};

const ui = {
    startBtn: document.getElementById('start-btn'),
    // Question UI
    qNum: document.getElementById('current-q-num'),
    // progressText: document.getElementById('current-progress-text'), // Removed in new design
    // progressBar: document.getElementById('progress-bar'),         // Removed in new design
    qText: document.getElementById('question-text'),
    optionsContainer: document.getElementById('options-container'),
    backBtn: document.getElementById('back-btn'),
    // Result UI
    resLabel: document.getElementById('result-label'),
    resH1: document.getElementById('result-h1'),
    resSubCopy: document.getElementById('result-subcopy'),
    resWhyNow: document.getElementById('result-why-now'),
    resRisk: document.getElementById('result-risk'),
    resActionList: document.getElementById('result-action-list'),
    resSupplement: document.getElementById('result-supplement'),
    ctaBtn: document.getElementById('cta-btn'),
    // Risk Score UI - Will be dynamically added or updated
    loadingText: document.getElementById('loading-text')
};

// --- UI Transitions ---

function switchScreen(screenName) {
    Object.values(screens).forEach(el => el.classList.add('hidden'));
    screens[screenName].classList.remove('hidden');
    window.scrollTo(0, 0);
}

// --- Rendering ---

function renderQuestion() {
    const qIndex = state.currentQuestionIndex;
    const question = diagnosisData.questions[qIndex];
    const totalQ = diagnosisData.questions.length;

    // Update Progress
    ui.qNum.textContent = qIndex + 1;
    // Progress bar removed in new design, only Step number remains

    // Update Text
    ui.qText.textContent = question.text;

    // Create Options
    ui.optionsContainer.innerHTML = '';
    question.options.forEach((option, idx) => {
        const btn = document.createElement('button');
        // New Design Class
        btn.className = "w-full text-left p-6 border-2 border-slate-200 hover:border-navy-900 bg-white hover:bg-slate-50 transition-all font-bold text-navy-900 sharp-shadow-active text-lg group flex items-start";
        
        // Add checkmark circle visual
        const circle = document.createElement('span');
        circle.className = "w-6 h-6 rounded-full border-2 border-slate-300 mr-4 mt-1 flex-shrink-0 group-hover:border-navy-900 group-hover:bg-signal-400 transition-colors";
        
        const textSpan = document.createElement('span');
        textSpan.textContent = option.text;

        btn.appendChild(circle);
        btn.appendChild(textSpan);

        btn.onclick = () => handleAnswer(question.id, option);
        ui.optionsContainer.appendChild(btn);
    });

    // Back Button visibility
    if (qIndex > 0) {
        ui.backBtn.classList.remove('hidden');
    } else {
        ui.backBtn.classList.add('hidden');
    }

    switchScreen('question');
}

function handleAnswer(qId, selectedOption) {
    // Record Answer
    state.answers[state.currentQuestionIndex] = {
        questionId: qId,
        selectedOption: selectedOption
    };
    
    // Move to next or Finish
    if (state.currentQuestionIndex < diagnosisData.questions.length - 1) {
        state.currentQuestionIndex++;
        
        // Small delay for visual feedback if needed, but instant is snappier
        renderQuestion();
    } else {
        finishDiagnosis();
    }
}

function finishDiagnosis() {
    switchScreen('loading');
    
    // Step 1: 0ms
    if(ui.loadingText) ui.loadingText.textContent = "回答データを解析中...";
    
    // Step 2: 500ms (Duration of Step 1)
    setTimeout(() => {
        if(ui.loadingText) ui.loadingText.textContent = "法的リスク要因を照合中...";
    }, 500);

    // Step 3: 1500ms (Duration of Step 2 was 1.0s)
    setTimeout(() => {
        if(ui.loadingText) ui.loadingText.textContent = "近隣相場データと突合中...";
    }, 1500);

    // Step 4: 2500ms (Duration of Step 3 was 1.0s) -> Finish
    setTimeout(() => {
        if(ui.loadingText) ui.loadingText.textContent = "診断レポート作成完了";
        
        // Slight pause to let the user see "Complete"
        setTimeout(() => {
             calculateScores();
             const resultType = determineResultType();
             const riskScore = calculateRiskScore();
             renderResult(resultType, riskScore);
        }, 800);
        
    }, 2500);
}

function renderResult(typeId, riskScore) {
    const data = diagnosisData.results[typeId];
    if (!data) {
        console.error("Unknown result type:", typeId);
        return;
    }

    // Populate Data
    ui.resLabel.textContent = data.label;
    ui.resH1.textContent = data.h1;
    
    // Inject Risk Score
    const riskGaugeHtml = `
      <div class="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-sm">
        <p class="text-sm text-slate-500 font-bold mb-2 tracking-widest text-center">あなたの実家放置リスク</p>
        <div class="flex items-center justify-center gap-4">
            <div class="w-full bg-slate-200 h-4 rounded-full overflow-hidden max-w-md">
                <div class="bg-red-600 h-full transition-all duration-1000 ease-out" style="width: ${riskScore}%"></div>
            </div>
            <span class="text-4xl font-mono font-black text-red-600">${riskScore}%</span>
        </div>
      </div>
    `;
    
    // Prepend or insert Risk Gauge securely
    // We'll insert it after resH1 for now or manipulate DOM structure
    // Let's modify index.html to have a container, OR insert it here.
    // For safety, let's insert it into a container we'll create in index.html, 
    // OR just prepend to subcopy if container doesn't exist.
    // Actually, asking to modify index.html is better, but here we can just insertAdjacentHTML
    
    // Let's assume we will add a container in index.html with id 'result-risk-gauge-container'
    const riskContainer = document.getElementById('result-risk-gauge-container');
    if (riskContainer) {
        riskContainer.innerHTML = riskGaugeHtml;
    }

    ui.resSubCopy.textContent = data.subCopy;
    
    // New Cards
    ui.resWhyNow.textContent = data.whyNow;
    ui.resRisk.textContent = data.risk;

    // Action List
    ui.resActionList.innerHTML = ''; // Clear previous
    if (data.action && Array.isArray(data.action)) {
        data.action.forEach(item => {
            const li = document.createElement('li');
            li.className = "flex items-start";
            li.innerHTML = `<span class="text-signal-400 mr-2">▶</span> ${item}`;
            ui.resActionList.appendChild(li);
        });
    }

    // Supplement Text
    if (ui.resSupplement) {
        ui.resSupplement.innerHTML = data.supplement; // No regex replace needed as data uses template literals mostly, or plain text
    }
    
    // CTA Button Text update
    if (ui.ctaBtn) {
        ui.ctaBtn.textContent = data.ctaText;
    }

    switchScreen('result');
}

// --- Event Listeners ---

ui.startBtn.addEventListener('click', () => {
    initDiagnosis();
});

ui.backBtn.addEventListener('click', () => {
    if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex--;
        renderQuestion();
    }
});

// Initialize
console.log("Diagnosis Logic Loaded (Rebranded)");
