document.addEventListener("DOMContentLoaded", function () {
    // --- DOM Element Selection ---
    const searchButton = document.getElementById("search-btn");
    const usernameInput = document.getElementById("user-input");
    const statsContainer = document.getElementById("stats-container");
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

    // UPDATED: Animates both solved and total numbers in circles
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

    // NEW: Animates a single number for the stat cards
    function animateCardNumber(element, endValue, duration) {
        let startTime = null;
        
        function animationStep(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const current = Math.min(Math.floor(progress / duration * endValue), endValue);
            
            element.textContent = current.toLocaleString(); // Format with commas

            if (progress < duration) {
                requestAnimationFrame(animationStep);
            } else {
                element.textContent = endValue.toLocaleString();
            }
        }
        requestAnimationFrame(animationStep);
    }

    // --- Fetch and Display User Data ---
    async function fetchUserDetails(username) {
        // 1. Reset UI State
        searchButton.textContent = "Searching...";
        searchButton.disabled = true;
        loader.classList.remove("d-none");
        statsContainer.classList.add("d-none", "fade-in");
        errorMessage.classList.add("d-none");
        
        easyProgress.style.setProperty("--progress-degree", "0deg");
        mediumProgress.style.setProperty("--progress-degree", "0deg");
        hardProgress.style.setProperty("--progress-degree", "0deg");
        easyLabel.textContent = `0 / 0`;
        mediumLabel.textContent = `0 / 0`;
        hardLabel.textContent = `0 / 0`;


        const url = `https://leetcode-stats-api.herokuapp.com/${username}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error("User not found. Please check the username and try again.");
            }
            
            const data = await response.json();
            if (data.status === "error") {
                throw new Error(data.message);
            }

            const animationDuration = 1200; // 1.2 seconds

            cardStatsContainer.innerHTML = createStatCards(data);
            statsContainer.classList.remove("d-none");

            setTimeout(() => {
                updateCircleProgress(easyProgress, data.easySolved, data.totalEasy);
                updateCircleProgress(mediumProgress, data.mediumSolved, data.totalMedium);
                updateCircleProgress(hardProgress, data.hardSolved, data.totalHard);

                animateCircleNumbers(easyLabel, data.easySolved, data.totalEasy, animationDuration);
                animateCircleNumbers(mediumLabel, data.mediumSolved, data.totalMedium, animationDuration);
                animateCircleNumbers(hardLabel, data.hardSolved, data.totalHard, animationDuration);

                // Animate ranking number after the card is on the page
                const rankingValueElement = document.getElementById('ranking-value');
                if (rankingValueElement) {
                    animateCardNumber(rankingValueElement, data.ranking, animationDuration);
                }

            }, 100); 

        } catch (error) {
            showError(error.message);
        } finally {
            searchButton.textContent = "Search";
            searchButton.disabled = false;
            loader.classList.add("d-none");
        }
    }

    function updateCircleProgress(progressEl, solved, total) {
        const percentage = total > 0 ? (solved / total) * 100 : 0;
        const degree = (percentage / 100) * 360; 
        progressEl.style.setProperty("--progress-degree", `${degree}deg`);
    }

    // UPDATED: Adds an ID to the ranking card's text for animation targeting
    function createStatCards(data) {
        const stats = {
            'Total Solved': data.totalSolved,
            'Acceptance Rate': `${data.acceptanceRate}%`,
            'Ranking': data.ranking,
            'Contribution': data.contributionPoints,
            'Reputation': data.reputation,
            'Total Questions': data.totalQuestions
        };

        let cardsHtml = '';
        for (const [title, value] of Object.entries(stats)) {
            // Add a special ID only for the Ranking card's value
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


    // --- Event Listeners ---
    searchButton.addEventListener("click", function () {
        const username = usernameInput.value.trim();
        if (validateUsername(username)) {
            fetchUserDetails(username);
        }
    });

    usernameInput.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
            searchButton.click();
        }
    });
});
