let allRecipes = [];

let favoriteRecipes = JSON.parse(localStorage.getItem("savedRecipes") || "[]");

// These are the filters people can use to find recipes
let currentFilters = {
    search: "",           // What people type in search box
    mealType: null,       // Breakfast, Lunch, Dinner
    dietTypes: [],        // Vegetarian, Vegan, etc.
    difficulty: null,     // Easy, Medium, Hard
    quickFilter: null     // Quick buttons like "Healthy"
};

// Save favorites to the browser so they don't disappear
function saveFavorites() {
    localStorage.setItem("savedRecipes", JSON.stringify(favoriteRecipes));
}

// Get all recipes from our data file
async function loadAllRecipes() {
    try {
        // Try to load the recipes
        const response = await fetch('../js/data.json');
        const data = await response.json();
        return data.recipes || [];
    } catch (error) {
        // If something goes wrong, show a friendly message
        console.log('Oops! Could not load the recipes. Please check if the file exists.');
        return [];
    }
}

// Check if a recipe matches what people are searching for
function matchesSearchTerm(recipe) {
    // If no search term, show all recipes
    if (!currentFilters.search) return true;

    // Make search case-insensitive
    const searchTerm = currentFilters.search.toLowerCase();

    // Combine all text we want to search through
    const searchableText = `
        ${recipe.name}
        ${recipe.description}
        ${recipe.meal_category}
        ${recipe.diet_category}
        ${recipe.difficulty}
        ${(recipe.tags || []).join(" ")}
        ${(recipe.ingredients || []).join(" ")}
    `.toLowerCase();

    // Return true if the recipe contains the search term
    return searchableText.includes(searchTerm);
}

// Check if recipe matches the quick filter buttons
function matchesQuickFilter(recipe) {
    // If no quick filter is selected, show all recipes
    if (!currentFilters.quickFilter) return true;

    const filter = currentFilters.quickFilter;
    const totalTime = recipe.prep_time + recipe.cook_time;

    // Check different types of quick filters
    if (filter === "Quick & Easy") {
        return recipe.difficulty === "Easy" && totalTime <= 30;
    }
    if (filter === "Healthy") {
        return recipe.calories <= 450;
    }
    if (filter === "Vegetarian") {
        return recipe.diet_category === "Vegetarian";
    }
    if (filter === "High Protein") {
        return recipe.protein >= 20;
    }
    if (filter === "Low Carb") {
        return recipe.carbs <= 20;
    }

    // If we don't recognize the filter, show the recipe
    return true;
}

// Decide if we should show this recipe based on all active filters
function shouldShowRecipe(recipe) {
    // First check if it matches the search
    if (!matchesSearchTerm(recipe)) return false;

    // Then check if it matches the quick filter
    if (!matchesQuickFilter(recipe)) return false;

    // Check meal type (like Breakfast, Lunch, Dinner)
    if (currentFilters.mealType && recipe.meal_category !== currentFilters.mealType) {
        return false;
    }

    // Check diet types (can have multiple selected)
    if (currentFilters.dietTypes.length > 0) {
        const recipeDiet = recipe.diet_category.toLowerCase();
        const hasMatchingDiet = currentFilters.dietTypes.some(diet =>
            diet.toLowerCase() === recipeDiet
        );

        if (!hasMatchingDiet) return false;
    }

    // Check difficulty level
    if (currentFilters.difficulty && recipe.difficulty !== currentFilters.difficulty) {
        return false;
    }

    // If we passed all checks, show this recipe!
    return true;
}

// Update the text that shows how many filters are active
function updateFilterSummary() {
    const summaryElement = document.getElementById("filterCount");
    const activeFilters = [];

    // Build a list of active filters
    if (currentFilters.quickFilter) activeFilters.push(currentFilters.quickFilter);
    if (currentFilters.mealType) activeFilters.push(currentFilters.mealType);
    if (currentFilters.dietTypes.length) activeFilters.push(...currentFilters.dietTypes);
    if (currentFilters.difficulty) activeFilters.push(currentFilters.difficulty);

    // Show the active filters
    if (activeFilters.length > 0) {
        summaryElement.textContent = `${activeFilters.length} filters applied: ${activeFilters.join(", ")}`;
    } else {
        summaryElement.textContent = "No filters applied - showing all recipes";
    }
}

// Create pretty star ratings
function createStarRating(rating) {
    const numberRating = parseFloat(rating);
    const fullStars = Math.floor(numberRating);
    const hasHalfStar = numberRating % 1 >= 0.5;

    let starsHTML = '<span class="stars">';

    // Add full stars
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<svg class="star" viewBox="0 0 24 24" width="16" height="16"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="#fbbf24" stroke="#f59e0b"/></svg>';
    }

    // Add half star if needed
    if (hasHalfStar) {
        starsHTML += '<svg class="star" viewBox="0 0 24 24" width="16" height="16"><defs><linearGradient id="half"><stop offset="50%" stop-color="#fbbf24"/><stop offset="50%" stop-color="transparent"/></linearGradient></defs><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="url(#half)" stroke="#f59e0b"/></svg>';
    }

    // Add empty stars to make 5 total
    const starsShown = fullStars + (hasHalfStar ? 1 : 0);
    for (let i = starsShown; i < 5; i++) {
        starsHTML += '<svg class="star" viewBox="0 0 24 24" width="16" height="16"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="none" stroke="#d1d5db" stroke-width="2"/></svg>';
    }

    starsHTML += ` <span style="margin-left: 4px;">${numberRating}</span></span>`;
    return starsHTML;
}

// Show all the recipes on the page
function displayRecipes() {
    const recipesContainer = document.getElementById("recipes");
    const recipeTemplate = document.getElementById("card");

    // Clear any existing recipes
    recipesContainer.innerHTML = "";

    // Get recipes that match our current filters
    const filteredRecipes = allRecipes.filter(shouldShowRecipe);

    // Update the results counter
    document.getElementById("count").textContent =
        `Found ${filteredRecipes.length} recipes out of ${allRecipes.length} total`;

    updateFilterSummary();

    // If no recipes found, show a friendly message
    if (filteredRecipes.length === 0) {
        recipesContainer.innerHTML = `
            <div class="no-recipes">
                <p>No recipes found matching your criteria. Try changing your filters or search terms!</p>
            </div>
        `;
        return;
    }

    // Create a card for each recipe
    filteredRecipes.forEach(recipe => {
        const recipeCard = recipeTemplate.content.cloneNode(true);
        const listItem = recipeCard.querySelector("li");
        listItem.dataset.id = recipe.id;

        // Fill in the basic recipe information
        recipeCard.querySelector("img").src = recipe.image;
        recipeCard.querySelector(".badge").textContent = recipe.difficulty;
        recipeCard.querySelector(".title").textContent = recipe.name;
        recipeCard.querySelector(".desc").textContent = recipe.description;

        // Fill in the meta information (time, calories, rating)
        const metaItems = recipeCard.querySelectorAll(".meta li");
        const totalTime = recipe.prep_time + recipe.cook_time;

        // Cooking time with a clock icon
        metaItems[0].innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" width="16" height="16">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
                <polyline points="12 6 12 12 16 14" fill="none" stroke="currentColor" stroke-width="2"/>
            </svg>
            <time>${totalTime} min</time>
        `;

        // Calories with a fire icon
        metaItems[1].innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" width="16" height="16">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" fill="none" stroke="currentColor" stroke-width="2"/>
            </svg>
            <output>${recipe.calories} cal</output>
        `;

        // Star rating display
        metaItems[2].innerHTML = createStarRating(recipe.rating);

        // Handle tags - show first 3, then a "+ more" button
        const tagsContainer = recipeCard.querySelector(".tags");
        tagsContainer.innerHTML = "";

        const allRecipeTags = [recipe.meal_category, recipe.diet_category, ...(recipe.tags || [])];
        const visibleTags = allRecipeTags.slice(0, 3);
        const hiddenTags = allRecipeTags.slice(3);

        // Add visible tags
        visibleTags.forEach(tag => {
            const tagElement = document.createElement("span");
            tagElement.textContent = tag;
            tagsContainer.appendChild(tagElement);
        });

        // Add "+ more" button if there are hidden tags
        if (hiddenTags.length > 0) {
            const moreButton = document.createElement("span");
            moreButton.className = "more-toggle";
            moreButton.textContent = `+${hiddenTags.length} more`;

            moreButton.addEventListener('click', () => {
                const tagDialog = document.getElementById("tagDialog");
                const tagContent = document.getElementById("tagDialogContent");

                tagContent.innerHTML = "";
                allRecipeTags.forEach(tag => {
                    const tagElement = document.createElement("span");
                    tagElement.textContent = tag;
                    tagContent.appendChild(tagElement);
                });

                tagDialog.showModal();
            });

            tagsContainer.appendChild(moreButton);
        }

        // Add hover action buttons on the image
        const hoverButtons = document.createElement("div");
        hoverButtons.className = "hover-icons";

        // Quick view button (eye icon)
        const quickViewBtn = document.createElement("button");
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

        // Add to plan button (plus icon)
        const addToPlanBtn = document.createElement("button");
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
            alert(`Added "${recipe.name}" to your meal plan!`);
        });

        hoverButtons.appendChild(quickViewBtn);
        hoverButtons.appendChild(addToPlanBtn);
        recipeCard.querySelector(".thumb").appendChild(hoverButtons);

        // Set up the main "View Recipe" button
        recipeCard.querySelector(".primary").addEventListener('click', e => {
            e.preventDefault();
            showRecipeDetails(recipe);
        });

        // Favorite button functionality
        const favoriteBtn = recipeCard.querySelector(".fav");
        favoriteBtn.classList.toggle("active", favoriteRecipes.includes(recipe.id));

        favoriteBtn.addEventListener('click', () => {
            favoriteBtn.classList.toggle("active");

            if (favoriteRecipes.includes(recipe.id)) {
                // Remove from favorites
                favoriteRecipes = favoriteRecipes.filter(id => id !== recipe.id);
            } else {
                // Add to favorites
                favoriteRecipes.push(recipe.id);
            }

            saveFavorites();
        });

        // Add the completed recipe card to the page
        recipesContainer.appendChild(recipeCard);
    });
}

// Show recipe details in a popup modal
// Show recipe details in a popup modal
function showRecipeDetails(recipe) {
    const modal = document.getElementById("modal");

    // Prevent body scrolling and fix background
    document.body.classList.add('modal-open');

    // Show the modal
    modal.showModal();

    // Fill in the recipe information
    document.getElementById("mTitle").textContent = recipe.name;
    document.getElementById("mDesc").textContent = recipe.description;

    // Set the recipe image
    const modalImage = document.getElementById("mImg");
    modalImage.src = recipe.image;
    modalImage.alt = recipe.name;

    // If image fails to load, show a placeholder
    modalImage.onerror = () => {
        modalImage.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect width="400" height="200" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="16" fill="%2394a3b8">No Image Available</text></svg>';
    };

    // Fill in the stats
    const totalTime = recipe.prep_time + recipe.cook_time;
    document.getElementById("mTime").textContent = totalTime + " min";
    document.getElementById("mCal").textContent = recipe.calories + " cal";
    document.getElementById("mServ").textContent = recipe.servings + " servings";
    document.getElementById("mServingsCount").textContent = recipe.servings;

    // Fill in ingredients
    const ingredientsList = document.getElementById("mIngr");
    ingredientsList.innerHTML = "";

    recipe.ingredients.forEach(ingredient => {
        const li = document.createElement("li");
        li.textContent = ingredient;

        // Click to check/uncheck ingredient
        li.addEventListener('click', function () {
            if (this.style.background === 'rgb(220, 252, 231)') {
                this.style.background = '#f8fafc';
                this.style.setProperty('--check-char', '"☐"');
            } else {
                this.style.background = '#dcfce7';
                this.style.setProperty('--check-char', '"☑"');
            }
        });

        // Start with unchecked
        li.style.setProperty('--check-char', '"☐"');
        ingredientsList.appendChild(li);
    });

    // Fill in instructions
    const instructionsList = document.getElementById("mInstr");
    instructionsList.innerHTML = "";

    if (recipe.instructions && recipe.instructions.length > 0) {
        recipe.instructions.forEach(instruction => {
            const li = document.createElement("li");

            const instructionText = document.createElement("div");
            instructionText.className = "instruction-text";
            instructionText.textContent = instruction;

            li.appendChild(instructionText);
            instructionsList.appendChild(li);
        });
    } else {
        // Show message if no instructions
        const li = document.createElement("li");
        const instructionText = document.createElement("div");
        instructionText.className = "instruction-text";
        instructionText.textContent = "No specific instructions provided. Use your best judgment for preparation!";
        instructionText.style.fontStyle = "italic";
        instructionText.style.color = "#64748b";

        li.appendChild(instructionText);
        instructionsList.appendChild(li);
    }

    // Close button functionality
    document.getElementById("mClose").onclick = () => {
        modal.close();
        // Re-enable body scrolling
        document.body.classList.remove('modal-open');
    };

    // Save button functionality
    const saveBtn = document.querySelector(".save-btn");
    const isCurrentlySaved = favoriteRecipes.includes(recipe.id);

    // Set initial save button state
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
            // Remove from favorites
            favoriteRecipes = favoriteRecipes.filter(id => id !== recipe.id);
            saveBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg> Save Recipe';
            saveBtn.style.background = "white";
            saveBtn.style.borderColor = "#e2e8f0";
            saveBtn.style.color = "#475569";
        } else {
            // Add to favorites
            favoriteRecipes.push(recipe.id);
            saveBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg> Saved';
            saveBtn.style.background = "#dcfce7";
            saveBtn.style.borderColor = "#16a34a";
            saveBtn.style.color = "#166534";
        }

        saveFavorites();

        // Update favorite button on recipe card if visible
        const cardFavoriteBtn = document.querySelector(`[data-id="${recipe.id}"] .fav`);
        if (cardFavoriteBtn) {
            cardFavoriteBtn.classList.toggle("active");
        }
    };

    // Share button functionality
    const shareBtn = document.querySelector(".share-btn");
    shareBtn.onclick = async () => {
        const shareData = {
            title: recipe.name,
            text: recipe.description,
            url: window.location.href,
        };

        try {
            if (navigator.share) {
                // Use the browser's native share feature
                await navigator.share(shareData);
            } else {
                // Fallback: copy link to clipboard
                await navigator.clipboard.writeText(window.location.href);

                // Show feedback that it was copied
                const originalHTML = shareBtn.innerHTML;
                shareBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> Copied!';
                shareBtn.style.background = "#dcfce7";
                shareBtn.style.borderColor = "#16a34a";
                shareBtn.style.color = "#166534";

                // Reset after 2 seconds
                setTimeout(() => {
                    shareBtn.innerHTML = originalHTML;
                    shareBtn.style.background = "white";
                    shareBtn.style.borderColor = "#e2e8f0";
                    shareBtn.style.color = "#475569";
                }, 2000);
            }
        } catch (err) {
            console.log('Sharing failed:', err);
        }
    };

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.close();
            // Re-enable body scrolling
            document.body.classList.remove('modal-open');
        }
    });

    // Close modal with Escape key
    modal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modal.close();
            // Re-enable body scrolling
            document.body.classList.remove('modal-open');
        }
    });

    // Also handle when modal closes for any other reason
    modal.addEventListener('close', () => {
        // Re-enable body scrolling
        document.body.classList.remove('modal-open');
    });
}

// Fill the filter dropdowns with options from our recipes
function setupFilters() {
    // Get all unique values from our recipes
    const mealTypes = [...new Set(allRecipes.map(recipe => recipe.meal_category))].sort();
    const dietTypes = [...new Set(allRecipes.map(recipe => recipe.diet_category))].sort();
    const difficultyLevels = [...new Set(allRecipes.map(recipe => recipe.difficulty))].sort();

    // Fill the meal type dropdown
    const mealDropdown = document.querySelectorAll('.dd-panel')[0];
    mealDropdown.innerHTML = mealTypes.map(meal =>
        `<button class="dd-item">${meal}</button>`
    ).join('');

    // Fill the dietary dropdown
    const dietDropdown = document.querySelectorAll('.dd-panel')[1];
    dietDropdown.innerHTML = dietTypes.map(diet =>
        `<button class="dd-item">${diet}</button>`
    ).join('');

    // Fill the difficulty dropdown
    const difficultyDropdown = document.querySelectorAll('.dd-panel')[2];
    difficultyDropdown.innerHTML = difficultyLevels.map(level =>
        `<button class="dd-item">${level}</button>`
    ).join('');
}

// Handle all the click events for filters and dropdowns
document.addEventListener("click", event => {
    // Opening/closing dropdowns when clicking the buttons
    if (event.target.classList.contains("dd-btn")) {
        const dropdownPanel = event.target.nextElementSibling;

        // Close all other dropdowns
        document.querySelectorAll(".dd-panel").forEach(panel => {
            if (panel !== dropdownPanel) panel.style.display = "none";
        });

        // Toggle this dropdown (show/hide)
        dropdownPanel.style.display = dropdownPanel.style.display === "block" ? "none" : "block";
        return;
    }

    // Selecting a filter option from dropdown
    if (event.target.classList.contains("dd-item")) {
        const dropdownPanel = event.target.closest(".dd-panel");
        const dropdownButton = event.target.closest(".dd-box").querySelector(".dd-btn");
        const dropdownLabel = dropdownButton.textContent.trim();
        const selectedValue = event.target.textContent.trim();
        const allItems = dropdownPanel.querySelectorAll(".dd-item");

        // Handle different types of dropdowns
        if (dropdownLabel.includes("Meal")) {
            // Meal type - single selection (toggle on/off)
            if (currentFilters.mealType === selectedValue) {
                currentFilters.mealType = null;
                allItems.forEach(item => item.classList.remove("active"));
            } else {
                currentFilters.mealType = selectedValue;
                allItems.forEach(item => item.classList.toggle("active", item === event.target));
            }
        }
        else if (dropdownLabel.includes("Diet")) {
            // Diet types - multiple selection allowed
            if (currentFilters.dietTypes.includes(selectedValue)) {
                currentFilters.dietTypes = currentFilters.dietTypes.filter(item => item !== selectedValue);
                event.target.classList.remove("active");
            } else {
                currentFilters.dietTypes.push(selectedValue);
                event.target.classList.add("active");
            }
        }
        else if (dropdownLabel.includes("Difficulty") || dropdownLabel.includes("Time")) {
            // Difficulty - single selection
            if (currentFilters.difficulty === selectedValue) {
                currentFilters.difficulty = null;
                allItems.forEach(item => item.classList.remove("active"));
            } else {
                currentFilters.difficulty = selectedValue;
                allItems.forEach(item => item.classList.toggle("active", item === event.target));
            }
        }

        // Close all dropdowns after selection
        document.querySelectorAll(".dd-panel").forEach(panel => panel.style.display = "none");

        // Update the displayed recipes
        displayRecipes();
        return;
    }

    // Clicking outside dropdowns closes them
    if (!event.target.closest(".dd-box")) {
        document.querySelectorAll(".dd-panel").forEach(panel => panel.style.display = "none");
    }
});

// Set up the quick filter buttons (the colored pills)
document.querySelectorAll(".quick-pill").forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all quick filters
        document.querySelectorAll(".quick-pill").forEach(btn => btn.classList.remove("active"));

        const filterValue = button.textContent.trim();

        // Toggle the filter - if it's already active, clear it
        if (currentFilters.quickFilter === filterValue) {
            currentFilters.quickFilter = null;
        } else {
            currentFilters.quickFilter = filterValue;
            button.classList.add("active");
        }

        displayRecipes();
    });
});

// Set up the search box
document.getElementById("searchInput").addEventListener('input', event => {
    currentFilters.search = event.target.value.trim().toLowerCase();
    displayRecipes();
});

// Close the tag dialog when the close button is clicked
document.getElementById("tagDialogClose").addEventListener('click', () => {
    document.getElementById("tagDialog").close();
});

// Add CSS for the ingredient checkboxes
const dynamicStyles = `

`;

// Add the styles to the page
const styleSheet = document.createElement('style');
styleSheet.textContent = dynamicStyles;
document.head.appendChild(styleSheet);

// Initialize everything when the page loads
async function initializeApp() {
    allRecipes = await loadAllRecipes();
    console.log('Loaded recipes:', allRecipes);
    setupFilters();
    displayRecipes();
}

// Start the application
initializeApp();