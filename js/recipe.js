// Enhanced Recipe Collection JavaScript
let allRecipes = [];
let favoriteRecipes = JSON.parse(localStorage.getItem("savedRecipes") || "[]");

// Enhanced filters with better structure
let currentFilters = {
    search: "",
    mealType: null,
    dietTypes: [],
    difficulty: null,
    quickFilter: null
};

// Debounce function for search performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        let later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Enhanced save favorites with validation
function saveFavorites() {
    try {
        localStorage.setItem("savedRecipes", JSON.stringify(favoriteRecipes));
    } catch (error) {
        console.error('Failed to save favorites:', error);
        showNotification('Failed to save favorites', 'error');
    }
}

// Enhanced recipe loading with fallback
async function loadAllRecipes() {
    try {
        let response = await fetch('../js/data.json');
        if (!response.ok) throw new Error('Network response was not ok');
        
        let data = await response.json();
        return data.recipes || [];
    } catch (error) {
        console.error('Error loading recipes:', error);
        
        // Provide fallback sample data
        return getFallbackRecipes();
    }
}

// Fallback recipes in case data.json fails
function getFallbackRecipes() {
    return [
        {
            id: 1,
            name: "Classic Grilled Chicken Salad",
            description: "A fresh and healthy grilled chicken salad with mixed greens, avocado, and lemon dressing.",
            image: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'><rect width='400' height='200' fill='%23f1f5f9'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='16' fill='%2394a3b8'>Grilled Chicken Salad</text></svg>",
            prep_time: 15,
            cook_time: 10,
            calories: 350,
            protein: 25,
            carbs: 15,
            rating: 4.8,
            servings: 4,
            difficulty: "Easy",
            meal_category: "Lunch",
            diet_category: "High Protein",
            tags: ["Quick & Easy", "Healthy", "Low Carb"],
            ingredients: [
                "2 chicken breasts",
                "4 cups mixed greens",
                "1 avocado, sliced",
                "1 cup cherry tomatoes",
                "1/4 red onion, thinly sliced",
                "2 tbsp olive oil",
                "1 lemon, juiced",
                "Salt and pepper to taste"
            ],
            instructions: [
                "Season chicken breasts with salt and pepper",
                "Grill chicken for 5-7 minutes per side until cooked through",
                "Let chicken rest for 5 minutes, then slice",
                "Combine mixed greens, avocado, tomatoes, and red onion in a large bowl",
                "Whisk together olive oil and lemon juice for dressing",
                "Top salad with sliced chicken and drizzle with dressing"
            ]
        }
    ];
}

// Enhanced search matching with better scoring
function matchesSearchTerm(recipe) {
    if (!currentFilters.search) return true;
    
    let searchTerm = currentFilters.search.toLowerCase();
    let searchableText = `
        ${recipe.name}
        ${recipe.description}
        ${recipe.meal_category}
        ${recipe.diet_category}
        ${recipe.difficulty}
        ${(recipe.tags || []).join(" ")}
        ${(recipe.ingredients || []).join(" ")}
    `.toLowerCase();

    return searchableText.includes(searchTerm);
}

// Enhanced filter matching
function matchesQuickFilter(recipe) {
    if (!currentFilters.quickFilter) return true;

    let filter = currentFilters.quickFilter;
    let totalTime = recipe.prep_time + recipe.cook_time;
    
    switch (filter) {
        case "Quick & Easy":
            return recipe.difficulty === "Easy" && totalTime <= 30;
        case "Healthy":
            return recipe.calories <= 450;
        case "Vegetarian":
            return recipe.diet_category === "Vegetarian";
        case "High Protein":
            return recipe.protein >= 20;
        case "Low Carb":
            return recipe.carbs <= 20;
        default:
            return true;
    }
}

// Enhanced recipe filtering
function shouldShowRecipe(recipe) {
    if (!matchesSearchTerm(recipe)) return false;
    if (!matchesQuickFilter(recipe)) return false;

    if (currentFilters.mealType && recipe.meal_category !== currentFilters.mealType) {
        return false;
    }

    if (currentFilters.dietTypes.length > 0) {
        let recipeDiet = recipe.diet_category.toLowerCase();
        let hasMatchingDiet = currentFilters.dietTypes.some(diet => 
            diet.toLowerCase() === recipeDiet
        );
        if (!hasMatchingDiet) return false;
    }

    if (currentFilters.difficulty && recipe.difficulty !== currentFilters.difficulty) {
        return false;
    }

    return true;
}

// Enhanced filter summary
function updateFilterSummary() {
    let summaryElement = document.getElementById("filterCount");
    let activeFilters = [];

    if (currentFilters.quickFilter) activeFilters.push(currentFilters.quickFilter);
    if (currentFilters.mealType) activeFilters.push(currentFilters.mealType);
    if (currentFilters.dietTypes.length) activeFilters.push(...currentFilters.dietTypes);
    if (currentFilters.difficulty) activeFilters.push(currentFilters.difficulty);

    if (activeFilters.length > 0) {
        summaryElement.textContent = `${activeFilters.length} filters: ${activeFilters.join(", ")}`;
        summaryElement.parentElement.style.display = 'flex';
    } else {
        summaryElement.textContent = "No filters applied";
        summaryElement.parentElement.style.display = 'none';
    }
}

// Enhanced star rating with accessibility
function createStarRating(rating) {
    let numberRating = parseFloat(rating);
    let fullStars = Math.floor(numberRating);
    let hasHalfStar = numberRating % 1 >= 0.5;

    let starsHTML = '<span class="stars" role="img" aria-label="Rating: ' + numberRating + ' out of 5 stars">';
    
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<svg class="star" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="#fbbf24" stroke="#f59e0b"/></svg>';
    }
    
    if (hasHalfStar) {
        starsHTML += '<svg class="star" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><defs><linearGradient id="half"><stop offset="50%" stop-color="#fbbf24"/><stop offset="50%" stop-color="transparent"/></linearGradient></defs><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="url(#half)" stroke="#f59e0b"/></svg>';
    }
    
    let starsShown = fullStars + (hasHalfStar ? 1 : 0);
    for (let i = starsShown; i < 5; i++) {
        starsHTML += '<svg class="star" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="none" stroke="#d1d5db" stroke-width="2"/></svg>';
    }
    
    starsHTML += ` <span style="margin-left: 4px;">${numberRating}</span></span>`;
    return starsHTML;
}

// Enhanced recipe display with better performance
function displayRecipes() {
    let recipesContainer = document.getElementById("recipes");
    let recipeTemplate = document.getElementById("card");
    
    recipesContainer.innerHTML = "";

    let filteredRecipes = allRecipes.filter(shouldShowRecipe);

    document.getElementById("count").textContent = 
        `Found ${filteredRecipes.length} recipes out of ${allRecipes.length} total`;

    updateFilterSummary();

    if (filteredRecipes.length === 0) {
        recipesContainer.innerHTML = `
            <div class="no-recipes">
                <p>No recipes found matching your criteria. Try changing your filters or search terms!</p>
            </div>
        `;
        return;
    }

    filteredRecipes.forEach(recipe => {
        let recipeCard = recipeTemplate.content.cloneNode(true);
        let listItem = recipeCard.querySelector("li");
        listItem.dataset.id = recipe.id;

        recipeCard.querySelector("img").src = recipe.image;
        recipeCard.querySelector(".badge").textContent = recipe.difficulty;
        recipeCard.querySelector(".title").textContent = recipe.name;
        recipeCard.querySelector(".desc").textContent = recipe.description;

        let metaItems = recipeCard.querySelectorAll(".meta li");
        let totalTime = recipe.prep_time + recipe.cook_time;

        metaItems[0].innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" width="16" height="16">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
                <polyline points="12 6 12 12 16 14" fill="none" stroke="currentColor" stroke-width="2"/>
            </svg>
            <time>${totalTime} min</time>
        `;

        metaItems[1].innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" width="16" height="16">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" fill="none" stroke="currentColor" stroke-width="2"/>
            </svg>
            <output>${recipe.calories} cal</output>
        `;

        metaItems[2].innerHTML = createStarRating(recipe.rating);

        let tagsContainer = recipeCard.querySelector(".tags");
        tagsContainer.innerHTML = "";

        let allRecipeTags = [recipe.meal_category, recipe.diet_category, ...(recipe.tags || [])];
        let visibleTags = allRecipeTags.slice(0, 3);
        let hiddenTags = allRecipeTags.slice(3);

        visibleTags.forEach(tag => {
            let tagElement = document.createElement("span");
            tagElement.textContent = tag;
            tagsContainer.appendChild(tagElement);
        });

        if (hiddenTags.length > 0) {
            let moreButton = document.createElement("span");
            moreButton.className = "more-toggle";
            moreButton.textContent = `+${hiddenTags.length} more`;
            
            moreButton.addEventListener('click', () => {
                let tagDialog = document.getElementById("tagDialog");
                let tagContent = document.getElementById("tagDialogContent");
                
                tagContent.innerHTML = "";
                allRecipeTags.forEach(tag => {
                    let tagElement = document.createElement("span");
                    tagElement.textContent = tag;
                    tagContent.appendChild(tagElement);
                });
                
                tagDialog.showModal();
            });
            
            tagsContainer.appendChild(moreButton);
        }

        let hoverButtons = document.createElement("div");
        hoverButtons.className = "hover-icons";

        let quickViewBtn = document.createElement("button");
        quickViewBtn.className = "hover-icon";
        quickViewBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>
        `;
        quickViewBtn.title = "Quick View";
        quickViewBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showRecipeDetails(recipe);
        });

        let addToPlanBtn = document.createElement("button");
        addToPlanBtn.className = "hover-icon";
        addToPlanBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
        `;
        addToPlanBtn.title = "Add to Meal Plan";
        addToPlanBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showNotification(`Added "${recipe.name}" to your meal plan!`, 'success');
        });

        hoverButtons.appendChild(quickViewBtn);
        hoverButtons.appendChild(addToPlanBtn);
        recipeCard.querySelector(".thumb").appendChild(hoverButtons);

        recipeCard.querySelector(".primary").addEventListener('click', e => { 
            e.preventDefault(); 
            showRecipeDetails(recipe); 
        });

        let favoriteBtn = recipeCard.querySelector(".fav");
        favoriteBtn.classList.toggle("active", favoriteRecipes.includes(recipe.id));
        
        favoriteBtn.addEventListener('click', () => {
            favoriteBtn.classList.toggle("active");
            
            if (favoriteRecipes.includes(recipe.id)) {
                favoriteRecipes = favoriteRecipes.filter(id => id !== recipe.id);
                showNotification('Removed from favorites', 'info');
            } else {
                favoriteRecipes.push(recipe.id);
                showNotification('Added to favorites!', 'success');
            }
            
            saveFavorites();
        });

        recipesContainer.appendChild(recipeCard);
    });
}

// Enhanced modal functionality
function showRecipeDetails(recipe) {
    let modal = document.getElementById("modal");
    
    document.body.classList.add('modal-open');
    modal.showModal();

    document.getElementById("mTitle").textContent = recipe.name;
    document.getElementById("mDesc").textContent = recipe.description;
    
    let modalImage = document.getElementById("mImg");
    modalImage.src = recipe.image;
    modalImage.alt = recipe.name;

    modalImage.onerror = () => {
        modalImage.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect width="400" height="200" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="16" fill="%2394a3b8">No Image Available</text></svg>';
    };

    let totalTime = recipe.prep_time + recipe.cook_time;
    document.getElementById("mTime").textContent = totalTime + " min";
    document.getElementById("mCal").textContent = recipe.calories + " cal";
    document.getElementById("mServ").textContent = recipe.servings + " servings";
    document.getElementById("mServingsCount").textContent = recipe.servings;

    let ingredientsList = document.getElementById("mIngr");
    ingredientsList.innerHTML = "";
    
    recipe.ingredients.forEach(ingredient => {
        let li = document.createElement("li");
        li.textContent = ingredient;
        
        li.addEventListener('click', function() {
            this.classList.toggle('checked');
        });
        
        ingredientsList.appendChild(li);
    });

    let instructionsList = document.getElementById("mInstr");
    instructionsList.innerHTML = "";
    
    if (recipe.instructions && recipe.instructions.length > 0) {
        recipe.instructions.forEach(instruction => {
            let li = document.createElement("li");
            
            let instructionText = document.createElement("div");
            instructionText.className = "instruction-text";
            instructionText.textContent = instruction;
            
            li.appendChild(instructionText);
            instructionsList.appendChild(li);
        });
    } else {
        let li = document.createElement("li");
        let instructionText = document.createElement("div");
        instructionText.className = "instruction-text";
        instructionText.textContent = "No specific instructions provided. Use your best judgment for preparation!";
        instructionText.style.fontStyle = "italic";
        instructionText.style.color = "#64748b";
        
        li.appendChild(instructionText);
        instructionsList.appendChild(li);
    }

    document.getElementById("mClose").onclick = () => {
        modal.close();
        document.body.classList.remove('modal-open');
    };

    let saveBtn = document.querySelector(".save-btn");
    let isCurrentlySaved = favoriteRecipes.includes(recipe.id);
    
    if (isCurrentlySaved) {
        saveBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg> Saved';
        saveBtn.style.background = "#dcfce7";
        saveBtn.style.borderColor = "#16a34a";
        saveBtn.style.color = "#166534";
    } else {
        saveBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg> Save Recipe';
        saveBtn.style.background = "white";
        saveBtn.style.borderColor = "#e2e8f0";
        saveBtn.style.color = "#475569";
    }
    
    saveBtn.onclick = () => {
        if (favoriteRecipes.includes(recipe.id)) {
            favoriteRecipes = favoriteRecipes.filter(id => id !== recipe.id);
            saveBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg> Save Recipe';
            saveBtn.style.background = "white";
            saveBtn.style.borderColor = "#e2e8f0";
            saveBtn.style.color = "#475569";
            showNotification('Removed from favorites', 'info');
        } else {
            favoriteRecipes.push(recipe.id);
            saveBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg> Saved';
            saveBtn.style.background = "#dcfce7";
            saveBtn.style.borderColor = "#16a34a";
            saveBtn.style.color = "#166534";
            showNotification('Added to favorites!', 'success');
        }
        
        saveFavorites();
        
        let cardFavoriteBtn = document.querySelector(`[data-id="${recipe.id}"] .fav`);
        if (cardFavoriteBtn) {
            cardFavoriteBtn.classList.toggle("active");
        }
    };

    let shareBtn = document.querySelector(".share-btn");
    shareBtn.onclick = async () => {
        let shareData = {
            title: recipe.name,
            text: recipe.description,
            url: window.location.href,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                
                let originalHTML = shareBtn.innerHTML;
                shareBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> Copied!';
                shareBtn.style.background = "#dcfce7";
                shareBtn.style.borderColor = "#16a34a";
                shareBtn.style.color = "#166534";
                showNotification('Link copied to clipboard!', 'success');
                
                setTimeout(() => {
                    shareBtn.innerHTML = originalHTML;
                    shareBtn.style.background = "white";
                    shareBtn.style.borderColor = "#e2e8f0";
                    shareBtn.style.color = "#475569";
                }, 2000);
            }
        } catch (err) {
            console.log('Sharing failed:', err);
            showNotification('Failed to share recipe', 'error');
        }
    };

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.close();
            document.body.classList.remove('modal-open');
        }
    });

    modal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modal.close();
            document.body.classList.remove('modal-open');
        }
    });

    modal.addEventListener('close', () => {
        document.body.classList.remove('modal-open');
    });
}

// Enhanced filter setup
function setupFilters() {
    let mealTypes = [...new Set(allRecipes.map(recipe => recipe.meal_category))].sort();
    let dietTypes = [...new Set(allRecipes.map(recipe => recipe.diet_category))].sort();
    let difficultyLevels = [...new Set(allRecipes.map(recipe => recipe.difficulty))].sort();

    let mealDropdown = document.querySelectorAll('.dd-panel')[0];
    mealDropdown.innerHTML = mealTypes.map(meal => 
        `<button class="dd-item">${meal}</button>`
    ).join('');

    let dietDropdown = document.querySelectorAll('.dd-panel')[1];
    dietDropdown.innerHTML = dietTypes.map(diet => 
        `<button class="dd-item">${diet}</button>`
    ).join('');

    let difficultyDropdown = document.querySelectorAll('.dd-panel')[2];
    difficultyDropdown.innerHTML = difficultyLevels.map(level => 
        `<button class="dd-item">${level}</button>`
    ).join('');
}

// Enhanced notification system
function showNotification(message, type = 'info') {
    let notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
    `;
    
    let backgroundColor = '#16a34a'; // success - green
    if (type === 'error') backgroundColor = '#dc2626'; // error - red
    if (type === 'info') backgroundColor = '#2563eb'; // info - blue
    if (type === 'warning') backgroundColor = '#d97706'; // warning - orange
    
    notification.style.background = backgroundColor;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add notification animation styles
let notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(notificationStyles);

// Enhanced event handling
document.addEventListener("click", event => {
    if (event.target.classList.contains("dd-btn")) {
        let dropdownPanel = event.target.nextElementSibling;

        document.querySelectorAll(".dd-panel").forEach(panel => {
            if (panel !== dropdownPanel) panel.style.display = "none";
        });

        dropdownPanel.style.display = dropdownPanel.style.display === "block" ? "none" : "block";
        return;
    }

    if (event.target.classList.contains("dd-item")) {
        let dropdownPanel = event.target.closest(".dd-panel");
        let dropdownButton = event.target.closest(".dd-box").querySelector(".dd-btn");
        let dropdownLabel = dropdownButton.textContent.trim();
        let selectedValue = event.target.textContent.trim();
        let allItems = dropdownPanel.querySelectorAll(".dd-item");

        if (dropdownLabel.includes("Meal")) {
            if (currentFilters.mealType === selectedValue) {
                currentFilters.mealType = null;
                allItems.forEach(item => item.classList.remove("active"));
            } else {
                currentFilters.mealType = selectedValue;
                allItems.forEach(item => item.classList.toggle("active", item === event.target));
            }
        } 
        else if (dropdownLabel.includes("Diet")) {
            if (currentFilters.dietTypes.includes(selectedValue)) {
                currentFilters.dietTypes = currentFilters.dietTypes.filter(item => item !== selectedValue);
                event.target.classList.remove("active");
            } else {
                currentFilters.dietTypes.push(selectedValue);
                event.target.classList.add("active");
            }
        }
        else if (dropdownLabel.includes("Difficulty") || dropdownLabel.includes("Time")) {
            if (currentFilters.difficulty === selectedValue) {
                currentFilters.difficulty = null;
                allItems.forEach(item => item.classList.remove("active"));
            } else {
                currentFilters.difficulty = selectedValue;
                allItems.forEach(item => item.classList.toggle("active", item === event.target));
            }
        }

        document.querySelectorAll(".dd-panel").forEach(panel => panel.style.display = "none");
        displayRecipes();
        return;
    }

    if (!event.target.closest(".dd-box")) {
        document.querySelectorAll(".dd-panel").forEach(panel => panel.style.display = "none");
    }
});

// Enhanced quick filter setup
document.querySelectorAll(".quick-pill").forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll(".quick-pill").forEach(btn => btn.classList.remove("active"));
        
        let filterValue = button.textContent.trim();

        if (currentFilters.quickFilter === filterValue) {
            currentFilters.quickFilter = null;
        } else {
            currentFilters.quickFilter = filterValue;
            button.classList.add("active");
        }

        displayRecipes();
    });
});

// Enhanced search with debouncing
let debouncedDisplayRecipes = debounce(displayRecipes, 300);
document.getElementById("searchInput").addEventListener('input', event => {
    currentFilters.search = event.target.value.trim().toLowerCase();
    debouncedDisplayRecipes();
});

// Enhanced tag dialog
document.getElementById("tagDialogClose").addEventListener('click', () => {
    document.getElementById("tagDialog").close();
});

// Enhanced initialization
async function initializeApp() {
    try {
        allRecipes = await loadAllRecipes();
        console.log('Loaded recipes:', allRecipes.length);
        setupFilters();
        displayRecipes();
        showNotification('Recipes loaded successfully!', 'success');
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showNotification('Failed to load recipes', 'error');
    }
}

// Start the application
initializeApp();