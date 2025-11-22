async function fetchAllRecipes() {
    try {
        let res = await fetch(`../js/data.json`)
        let data = await res.json()
        return data.recipes  
    } catch (err) {
        console.error('error fetching:', err)
        return []
    }
}

let RECIPES = await fetchAllRecipes();
console.log(RECIPES)
let FAVORITES = JSON.parse(localStorage.getItem("FAV_RECIPES") || "[]")

function saveFavs() {
    localStorage.setItem("FAV_RECIPES", JSON.stringify(FAVORITES))
}

let filters = {
    search: "",
    meal: null,
    diet: [],
    difficulty: null,
    pill: null
};

/* =============================
   SIMPLE QUICK PILL RULES
============================= */
function matchPill(r) {
    if (!filters.pill) return true;

    if (filters.pill === "Quick & Easy") {
        return r.difficulty === "Easy" && (r.prep_time + r.cook_time) <= 30;
    }
    if (filters.pill === "Healthy") return r.calories <= 450;
    if (filters.pill === "Vegetarian") return r.diet_category === "Vegetarian";
    if (filters.pill === "High Protein") return r.protein >= 20;
    if (filters.pill === "Low Carb") return r.carbs <= 20;

    return true;
}

/* =============================
   UNIVERSAL SEARCH
============================= */
function matchesSearch(r) {
    if (!filters.search) return true;
    let t = filters.search.toLowerCase();

    return `
        ${r.name}
        ${r.description}
        ${r.meal_category}
        ${r.diet_category}
        ${r.difficulty}
        ${(r.tags||[]).join(" ")}
        ${(r.ingredients||[]).join(" ")}
    `.toLowerCase().includes(t);
}

/* =============================
   MAIN FILTER
============================= */
function passesAll(r) {
    if (!matchesSearch(r)) return false;
    if (!matchPill(r)) return false;

    if (filters.meal && r.meal_category !== filters.meal) return false;

    if (filters.diet.length > 0) {
        let diag = (r.diet_category || "").toLowerCase();
        let tags = (r.tags || []).map(t => t.toLowerCase());
        let ok = filters.diet.some(d => d.toLowerCase() === diag || tags.includes(d.toLowerCase()));
        if (!ok) return false;
    }

    if (filters.difficulty && r.difficulty !== filters.difficulty) return false;

    return true;
}

/* =============================
   SUMMARY BAR
============================= */
function updateSummary() {
    let sum = document.getElementById("filterCount");
    let parts = [];

    if (filters.pill) parts.push(filters.pill);
    if (filters.meal) parts.push("Meal: " + filters.meal);
    if (filters.diet.length) parts.push("Diet: " + filters.diet.join(", "));
    if (filters.difficulty) parts.push("Difficulty: " + filters.difficulty);

    sum.textContent = parts.length
        ? `${parts.length} filters applied | ${parts.join(" | ")}`
        : "0 filters applied | All cuisines";
}



/* =============================
   RENDER
============================= */
function renderRecipes() {
    let list = document.getElementById("recipes");
    let tpl = document.getElementById("card");
    list.innerHTML = "";

    let items = RECIPES.filter(passesAll);

    document.getElementById("count").textContent =
        `Showing ${items.length} of ${RECIPES.length} recipes`;

    updateSummary();

    items.forEach(r => {
        let node = tpl.content.cloneNode(true);
        let li = node.querySelector("li");
        li.dataset.id = r.id;

        node.querySelector("img").src = r.image;
        node.querySelector(".badge").textContent = r.difficulty;
        node.querySelector(".title").textContent = r.name;
        node.querySelector(".desc").textContent = r.description;
        node.querySelector("time").textContent = (r.prep_time + r.cook_time) + " min";


        

            // Get the meta list items
    let metaItems = node.querySelectorAll(".meta li");

    // Time with clock icon (first li)
    metaItems[0].innerHTML = `
        <svg class="icon" viewBox="0 0 24 24" width="16" height="16">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
            <polyline points="12 6 12 12 16 14" fill="none" stroke="currentColor" stroke-width="2"/>
        </svg>
        <time>${r.prep_time + r.cook_time} min</time>
    `;

    // Calories with fire icon (second li)
    metaItems[1].innerHTML = `
        <svg class="icon" viewBox="0 0 24 24" width="16" height="16">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" fill="none" stroke="currentColor" stroke-width="2"/>
        </svg>
        <output>${r.calories} cal</output>
    `;

    // Rating with stars (third li)
    let rating = parseFloat(r.rating);
    let fullStars = Math.floor(rating);
    let hasHalfStar = rating % 1 >= 0.5;

    let starsHTML = '<span class="stars">';
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<svg class="star" viewBox="0 0 24 24" width="16" height="16"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="#fbbf24" stroke="#f59e0b"/></svg>';
    }
    // Add half star if needed
    if (hasHalfStar) {
        starsHTML += '<svg class="star" viewBox="0 0 24 24" width="16" height="16"><defs><linearGradient id="half"><stop offset="50%" stop-color="#fbbf24"/><stop offset="50%" stop-color="transparent"/></linearGradient></defs><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="url(#half)" stroke="#f59e0b"/></svg>';
    }
    // Add empty stars
    let totalStars = fullStars + (hasHalfStar ? 1 : 0);
    for (let i = totalStars; i < 5; i++) {
        starsHTML += '<svg class="star" viewBox="0 0 24 24" width="16" height="16"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="none" stroke="#d1d5db" stroke-width="2"/></svg>';
    }
    starsHTML += ` <span style="margin-left: 4px;">${rating}</span></span>`;

    metaItems[2].innerHTML = starsHTML;








        let tagsBox = node.querySelector(".tags");
        tagsBox.innerHTML = "";

        let allTags = [r.meal_category, r.diet_category, ...(r.tags || [])];

        // show first 3 tags only
        let preview = allTags.slice(0, 3);
        let hidden = allTags.slice(3);

        // create preview tags
        preview.forEach(t => {
        let s = document.createElement("span");
        s.textContent = t;
        tagsBox.appendChild(s);
        });

        // if extras → show "+X more" button
        if (hidden.length > 0) {
        let moreBtn = document.createElement("span");
        moreBtn.className = "more-toggle";
        moreBtn.textContent = `+${hidden.length} more`;
        moreBtn.style.cursor = "pointer";
        moreBtn.style.background = "#e2e8f0";
        moreBtn.style.padding = "6px 12px";
        moreBtn.style.borderRadius = "12px";
        moreBtn.style.fontSize = "12px";

        tagsBox.appendChild(moreBtn);

        moreBtn.onclick = () => {
            let dialog = document.getElementById("tagDialog");
            let box = document.getElementById("tagDialogContent");

            // clear & fill
            box.innerHTML = "";
            allTags.forEach(t => {
            let s = document.createElement("span");
            s.textContent = t;
            box.appendChild(s);
            });

            dialog.showModal();
        };
        }


        node.querySelector(".primary").onclick = e => { e.preventDefault(); openModal(r); };

        let fav = node.querySelector(".fav");
        fav.classList.toggle("active", FAVORITES.includes(r.id));
        fav.onclick = () => {
            fav.classList.toggle("active");
            FAVORITES.includes(r.id)
                ? FAVORITES = FAVORITES.filter(id => id !== r.id)
                : FAVORITES.push(r.id);
            saveFavs();
        };

        list.appendChild(node);
    });
}
document.getElementById("tagDialogClose").onclick = () => {
    document.getElementById("tagDialog").close();
};

/* =============================
   POPULATE FILTERS DYNAMICALLY
============================= */
function populateFilters() {
    // Extract unique values from recipes
    let meals = [...new Set(RECIPES.map(r => r.meal_category))].sort();
    let diets = [...new Set(RECIPES.map(r => r.diet_category))].sort();
    let difficulties = [...new Set(RECIPES.map(r => r.difficulty))].sort();

    // Populate Meal Type dropdown
    let mealPanel = document.querySelectorAll('.dd-panel')[0];
    mealPanel.innerHTML = meals.map(m => `<button class="dd-item">${m}</button>`).join('');

    // Populate Dietary dropdown
    let dietPanel = document.querySelectorAll('.dd-panel')[1];
    dietPanel.innerHTML = diets.map(d => `<button class="dd-item">${d}</button>`).join('');

    // Populate Time & Difficulty dropdown (using difficulties only, as time isn't categorized in JSON)
    let diffPanel = document.querySelectorAll('.dd-panel')[2];
    diffPanel.innerHTML = difficulties.map(d => `<button class="dd-item">${d}</button>`).join('');
}

/* =============================
   MODAL
============================= */
function openModal(r) {
    let modal = document.getElementById("modal");
    modal.showModal();

    document.getElementById("mTitle").textContent = r.name;
    document.getElementById("mDesc").textContent = r.description;
    document.getElementById("mImg").src = r.image;

    document.getElementById("mPrep").textContent = r.prep_time + " min";
    document.getElementById("mCook").textContent = r.cook_time + " min";
    document.getElementById("mServ").textContent = r.servings;
    document.getElementById("mCal").textContent = r.calories;

    let ingr = document.getElementById("mIngr");
    ingr.innerHTML = "";
    r.ingredients.forEach(i => ingr.innerHTML += `<li>${i}</li>`);

    let steps = document.getElementById("mSteps");
    steps.innerHTML = "";
    r.instructions.forEach(s => steps.innerHTML += `<li>${s}</li>`);

    document.getElementById("mClose").onclick = () => modal.close();

    let mFav = document.querySelector(".modal-fav");
    mFav.classList.toggle("active", FAVORITES.includes(r.id));
    mFav.onclick = () => {
        mFav.classList.toggle("active");
        FAVORITES.includes(r.id)
            ? FAVORITES = FAVORITES.filter(id => id !== r.id)
            : FAVORITES.push(r.id);
        saveFavs();
        let btn = document.querySelector(`[data-id="${r.id}"] .fav`);
        if (btn) btn.classList.toggle("active");
    };
}

/* =============================
   DROPDOWNS
============================= */

document.addEventListener("click", e => {
    // open / close dropdown
    if (e.target.classList.contains("dd-btn")) {
        let panel = e.target.nextElementSibling;

        document.querySelectorAll(".dd-panel").forEach(p => {
            if (p !== panel) p.style.display = "none";
        });

        panel.style.display = panel.style.display === "block" ? "none" : "block";
        return;
    }

    // selecting an item
    if (e.target.classList.contains("dd-item")) {

        let panel = e.target.closest(".dd-panel");
        let btn   = e.target.closest(".dd-box").querySelector(".dd-btn");
        let label = btn.textContent.trim();
        let value = e.target.textContent.trim();
        let items = panel.querySelectorAll(".dd-item");

        /* ---------------------
           MEAL (single toggle)
        ----------------------*/
        if (label.includes("Meal")) {
            // clicked same? => remove selection
            if (filters.meal === value) {
                filters.meal = null;
                items.forEach(i => i.classList.remove("active"));
            } 
            else {
                filters.meal = value;
                items.forEach(i => i.classList.toggle("active", i === e.target));
            }
        }

        /* ---------------------
           DIET (multi toggle)
        ----------------------*/
        else if (label.includes("Diet")) {
            if (filters.diet.includes(value)) {
                filters.diet = filters.diet.filter(v => v !== value);
                e.target.classList.remove("active");
            } else {
                filters.diet.push(value);
                e.target.classList.add("active");
            }
        }

        /* ---------------------
           DIFFICULTY (single toggle)
        ----------------------*/
        else if (label.includes("Difficulty") || label.includes("Time")) {
            if (filters.difficulty === value) {
                filters.difficulty = null;
                items.forEach(i => i.classList.remove("active"));
            } 
            else {
                filters.difficulty = value;
                items.forEach(i => i.classList.toggle("active", i === e.target));
            }
        }

        // close dropdowns
        document.querySelectorAll(".dd-panel").forEach(p => p.style.display = "none");

        renderRecipes();
        return;
    }

    // click outside dropdowns
    if (!e.target.closest(".dd-box")) {
        document.querySelectorAll(".dd-panel").forEach(p => p.style.display = "none");
    }
});



/* =============================
   QUICK PILLS
============================= */
document.querySelectorAll(".quick-pill").forEach(pill => {
    pill.onclick = () => {
        document.querySelectorAll(".quick-pill").forEach(p => p.classList.remove("active"));
        let val = pill.textContent.trim();

        if (filters.pill === val) {
            filters.pill = null;
        } else {
            filters.pill = val;
            pill.classList.add("active");
        }

        renderRecipes();
    };
});

/* =============================
   SEARCH INPUT
============================= */
document.getElementById("searchInput").oninput = e => {
    filters.search = e.target.value.trim().toLowerCase();
    renderRecipes();
};

/* =============================
   FIRST RENDER
============================= */
populateFilters();  // Populate filters dynamically before rendering
renderRecipes();
