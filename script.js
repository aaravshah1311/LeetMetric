document.addEventListener("DOMContentLoaded", function () {
    // --- DOM Element Selection ---
    const searchButton = document.getElementById("search-btn");
    const compareButton = document.getElementById("compare-btn");
    const usernameInput = document.getElementById("user-input");
    const usernameInput2 = document.getElementById("user-input-2");
    const statsContainer = document.getElementById("stats-container");
    const comparisonContainer = document.getElementById("comparison-container");
    const loader = document.getElementById("loader");
    const errorMessage = document.getElementById("error-message");
    const easyProgress = document.getElementById("easy-progress");
    const mediumProgress = document.getElementById("medium-progress");
    const hardProgress = document.getElementById("hard-progress");
    const easyLabel = document.getElementById("easy-label");
    const mediumLabel = document.getElementById("medium-label");
    const hardLabel = document.getElementById("hard-label");
    const cardStatsContainer = document.getElementById("stats-cards");
    const title = document.getElementById("title");

    // --- State Tracking ---
    let currentlyDisplayedUser = null;

    // --- Title Animation ---
    const targetText = "LeetMetric";
    const chars = "#$/?*!:+<&";
    let iteration = 0;

    function animateTitle() {
        let displayText = "";
        for (let i = 0; i < targetText.length; i++) {
            if (i < iteration) {
                displayText += targetText[i];
            } else {
                displayText += chars[Math.floor(Math.random() * chars.length)];
            }
        }
        title.textContent = displayText;

        if (iteration <= targetText.length) {
            iteration++;
            setTimeout(animateTitle, 70);
        } else {
            setTimeout(() => {
                iteration = 0;
                animateTitle();
            }, 5000);
        }
    }
    animateTitle();

    // --- Helper function to display errors ---
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove("d-none");
    }

    // --- Validate username input ---
    function validateUsername(username) {
        if (username.trim() === "") {
            showError("Username cannot be empty.");
            return false;
        }
        const regex = /^[a-zA-Z0-9_][a-zA-Z0-9_-]{0,14}$/;
        if (!regex.test(username)) {
            showError("Invalid username format. Please check and try again.");
            return false;
        }
        return true;
    }

    // --- Animation Functions ---
    function animateCircleNumbers(element, endSolved, endTotal, duration) {
        let startTime = null;
        function animationStep(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const currentSolved = Math.min(Math.floor(progress / duration * endSolved), endSolved);
            const currentTotal = Math.min(Math.floor(progress / duration * endTotal), endTotal);
            element.textContent = `${currentSolved} / ${currentTotal}`;
            if (progress < duration) {
                requestAnimationFrame(animationStep);
            } else {
                element.textContent = `${endSolved} / ${endTotal}`;
            }
        }
        requestAnimationFrame(animationStep);
    }

    function animateCardNumber(element, endValue, duration) {
        let startTime = null;
        function animationStep(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const current = Math.min(Math.floor(progress / duration * endValue), endValue);
            element.textContent = current.toLocaleString();
            if (progress < duration) {
                requestAnimationFrame(animationStep);
            } else {
                element.textContent = endValue.toLocaleString();
            }
        }
        requestAnimationFrame(animationStep);
    }
    
    // --- Caching with localStorage ---
    const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

    function getCachedData(username) {
        const cached = localStorage.getItem(username);
        if (cached) {
            const { timestamp, data } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_DURATION) {
                return data;
            }
        }
        return null;
    }

    function setCachedData(username, data) {
        const cacheData = { timestamp: Date.now(), data: data };
        localStorage.setItem(username, JSON.stringify(cacheData));
    }

    // --- Fetch User Data ---
    async function fetchUserDetails(username) {
        loader.classList.remove("d-none");
        errorMessage.classList.add("d-none");
        
        const cachedData = getCachedData(username);
        if (cachedData) {
            console.log(`Using cached data for ${username}`);
            displayUserData(cachedData, username);
            loader.classList.add("d-none");
            return cachedData;
        }
        
        const url = `https://alfa-leetcode-api.onrender.com/${username}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`User "${username}" not found or API error.`);
            }
            
            const data = await response.json();
            if (data.status === "error" || data.errors) {
                 throw new Error(data.message || data.errors[0].message);
            }
            
            setCachedData(username, data);
            displayUserData(data, username);
            return data;

        } catch (error) {
            showError(error.message);
            return null;
        } finally {
            loader.classList.add("d-none");
        }
    }
    
    function displayUserData(data, username) {
        const animationDuration = 1200;

        cardStatsContainer.innerHTML = createStatCards(data);
        statsContainer.classList.remove("d-none");
        currentlyDisplayedUser = username;

        setTimeout(() => {
            updateCircleProgress(easyProgress, data.easySolved, data.totalEasy);
            updateCircleProgress(mediumProgress, data.mediumSolved, data.totalMedium);
            updateCircleProgress(hardProgress, data.hardSolved, data.totalHard);

            animateCircleNumbers(easyLabel, data.easySolved, data.totalEasy, animationDuration);
            animateCircleNumbers(mediumLabel, data.mediumSolved, data.totalMedium, animationDuration);
            animateCircleNumbers(hardLabel, data.hardSolved, data.totalHard, animationDuration);

            const rankingValueElement = document.getElementById('ranking-value');
            if (rankingValueElement) {
                animateCardNumber(rankingValueElement, data.ranking, animationDuration);
            }
        }, 100);
    }

    function updateCircleProgress(progressEl, solved, total) {
        const percentage = total > 0 ? (solved / total) * 100 : 0;
        const degree = (percentage / 100) * 360; 
        progressEl.style.setProperty("--progress-degree", `${degree}deg`);
    }

    function createStatCards(data) {
        const stats = {
            'Total Solved': data.totalSolved,
            'Acceptance Rate': `${data.acceptanceRate}%`,
            'Ranking': data.ranking,
            'Contribution': data.contributionPoints,
            'Reputation': data.reputation,
        };

        let cardsHtml = '';
        for (const [title, value] of Object.entries(stats)) {
            const valueHtml = title === 'Ranking'
                ? `<p class="card-text" id="ranking-value">${value.toLocaleString()}</p>`
                : `<p class="card-text">${typeof value === 'number' ? value.toLocaleString() : value}</p>`;

            cardsHtml += `
                <div class="col-6 col-md-4">
                    <div class="card p-3">
                        <div class="card-body p-0">
                            <h5 class="card-title">${title}</h5>
                            ${valueHtml}
                        </div>
                    </div>
                </div>`;
        }
        return cardsHtml;
    }
    
    // --- Comparison Functions ---
    async function compareUsers(username1, username2) {
        currentlyDisplayedUser = null;
        
        // Use a separate fetch function for comparison to avoid display side-effects
        const fetchForCompare = async (username) => {
            const cached = getCachedData(username);
            if(cached) return cached;
            const response = await fetch(`https://alfa-leetcode-api.onrender.com/${username}`);
            if(!response.ok) throw new Error(`Failed to fetch data for ${username}`);
            const data = await response.json();
            setCachedData(username, data);
            return data;
        }

        try {
            const [data1, data2] = await Promise.all([
                fetchForCompare(username1),
                fetchForCompare(username2)
            ]);
            displayComparison(data1, data2, username1, username2);
        } catch(error) {
            showError(error.message);
        }
    }

    function displayComparison(data1, data2, username1, username2) {
        const fieldsToCompare = {
            'Total Solved': 'totalSolved',
            'Easy Solved': 'easySolved',
            'Medium Solved': 'mediumSolved',
            'Hard Solved': 'hardSolved',
            'Acceptance Rate': 'acceptanceRate',
            'Ranking': 'ranking',
            'Contribution': 'contributionPoints',
            'Reputation': 'reputation'
        };

        let comparisonHtml = `
            <div class="row text-center mb-3">
                <div class="col-6"><h3>${username1}</h3></div>
                <div class="col-6"><h3>${username2}</h3></div>
            </div>
        `;

        for (const [label, key] of Object.entries(fieldsToCompare)) {
            const value1 = data1[key];
            const value2 = data2[key];
            const isRate = key === 'acceptanceRate';
            let class1 = 'text-white', class2 = 'text-white';
            
            if (key === 'ranking') {
                 if (value1 < value2) class1 = 'text-success';
                 if (value2 < value1) class2 = 'text-success';
            } else {
                 if (value1 > value2) class1 = 'text-success';
                 if (value2 > value1) class2 = 'text-success';
            }

            comparisonHtml += `
                <div class="row comparison-row align-items-center">
                    <div class="col-5 text-end"><span class="${class1}">${isRate ? value1 + '%' : value1.toLocaleString()}</span></div>
                    <div class="col-2 text-center comparison-label">${label}</div>
                    <div class="col-5 text-start"><span class="${class2}">${isRate ? value2 + '%' : value2.toLocaleString()}</span></div>
                </div>
            `;
        }
        
        comparisonContainer.innerHTML = comparisonHtml;
        comparisonContainer.classList.remove("d-none");
    }

    // --- Event Listeners ---
    searchButton.addEventListener("click", async function () {
        const username = usernameInput.value.trim();
        
        if (username === currentlyDisplayedUser && !statsContainer.classList.contains('d-none')) {
            return;
        }

        if (validateUsername(username)) {
            statsContainer.classList.add('d-none');
            comparisonContainer.classList.add('d-none');
            searchButton.textContent = "Searching...";
            searchButton.disabled = true;
            
            try {
                await fetchUserDetails(username);
            } finally {
                // **FIX: This block now correctly resets the button state**
                searchButton.textContent = "Search";
                searchButton.disabled = false;
            }
        }
    });

    usernameInput.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
            searchButton.click();
        }
    });
    
    compareButton.addEventListener("click", async function () {
        const username1 = usernameInput.value.trim();
        const username2 = usernameInput2.value.trim();
        if (username1 === username2) {
            showError("Please enter two different usernames to compare.");
            return;
        }
        if (validateUsername(username1) && validateUsername(username2)) {
            statsContainer.classList.add('d-none');
            comparisonContainer.classList.add('d-none');
            compareButton.textContent = "Comparing...";
            compareButton.disabled = true;

            try {
                await compareUsers(username1, username2);
            } finally {
                // **FIX: This block now correctly resets the button state**
                compareButton.textContent = "Compare";
                compareButton.disabled = false;
            }
        }
    });

    usernameInput2.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
            compareButton.click();
        }
    });
});
