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

// Determine Result Type based on Waterfall Logic
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

    // 1. Type E: (U >= 19) OR (U >= 13 AND (B >= 13 OR L >= 13))
    if (U >= 19 || (U >= 13 && (B >= 13 || L >= 13))) {
        return 'E';
    }

    // 2. Type C: (L >= 19) OR (L >= 13 AND (Q5 is B/C OR Q7 is C/D))
    const q5 = getAnsVal(5);
    const q7 = getAnsVal(7);
    if (L >= 19 || (L >= 13 && (['B', 'C'].includes(q5) || ['C', 'D'].includes(q7)))) {
        return 'C';
    }

    // 3. Type B: (B >= 19) OR (B >= 13 AND (Q9 is C/D OR Q10 is C/D))
    const q9 = getAnsVal(9);
    const q10 = getAnsVal(10);
    if (B >= 19 || (B >= 13 && (['C', 'D'].includes(q9) || ['C', 'D'].includes(q10)))) {
        return 'B';
    }

    // 4. Type D: (V >= 19) OR (V >= 13 AND (Q15 is A/B AND B <= 12))
    const q15 = getAnsVal(15);
    if (V >= 19 || (V >= 13 && (['A', 'B'].includes(q15) && B <= 12))) {
        return 'D';
    }

    // 5. Type A: Everything else
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
    progressText: document.getElementById('current-progress-text'),
    progressBar: document.getElementById('progress-bar'),
    qText: document.getElementById('question-text'),
    optionsContainer: document.getElementById('options-container'),
    backBtn: document.getElementById('back-btn'),
    // Result UI
    resLabel: document.getElementById('result-label'),
    resH1: document.getElementById('result-h1'),
    resSubCopy: document.getElementById('result-subcopy'),
    resIssues: document.getElementById('result-issues'),
    resAdvice: document.getElementById('result-advice'),
    resSupplement: document.getElementById('result-supplement'),
    ctaBtn: document.querySelector('#cta-btn span') // Target the text span inside the button
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
    const progress = Math.round((qIndex / totalQ) * 100);
    ui.qNum.textContent = qIndex + 1;
    ui.progressText.textContent = progress;
    ui.progressBar.style.width = `${progress}%`;

    // Update Text
    ui.qText.textContent = question.text;

    // Create Options
    ui.optionsContainer.innerHTML = '';
    question.options.forEach((option, idx) => {
        const btn = document.createElement('button');
        btn.className = "w-full text-left p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition font-medium text-gray-700 active:bg-blue-100 flex items-center";
        
        // Adding A/B/C/D labels for better UX (optional, but good for "Q1. A, B...")
        // const label = String.fromCharCode(65 + idx); // 65 is 'A'
        // btn.innerHTML = `<span class="bg-gray-100 text-gray-600 font-bold py-1 px-3 rounded mr-3 text-sm">${label}</span>${option.text}`;
        btn.textContent = option.text;

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
    
    // Simulate calculation time for UX (1.5 seconds)
    setTimeout(() => {
        calculateScores();
        const resultType = determineResultType();
        renderResult(resultType);
    }, 1500);
}

function renderResult(typeId) {
    const data = diagnosisData.results[typeId];
    if (!data) {
        console.error("Unknown result type:", typeId);
        return;
    }

    // Populate Data
    ui.resLabel.textContent = data.label;
    ui.resH1.textContent = data.h1;
    ui.resSubCopy.textContent = data.subCopy;
    ui.resIssues.textContent = data.issues;
    ui.resAdvice.textContent = data.advice;
    
    // Set Image
    if (data.image) {
        const imgEl = document.getElementById('result-image');
        if (imgEl) {
            imgEl.src = data.image;
        }
    }
    
    // Supplement Text (with line breaks)
    if (ui.resSupplement) {
        ui.resSupplement.innerHTML = data.supplement.replace(/\n/g, '<br>');
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
console.log("Diagnosis Logic Loaded");
