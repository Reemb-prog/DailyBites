let navbar = document.getElementById('navbar');
let toggle = document.getElementById('menu-toggle');
let links = document.getElementById('primary-navigation');
let closeBtn = document.querySelector(".close")
closeBtn.addEventListener("click", () => {
    overlay.style.display = "none";
    document.querySelector("body").classList.remove("overlayOpen")
})
function setMenu(open) {
    if (!links || !toggle) return;
    links.classList.toggle('show', open);
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
}

toggle?.addEventListener('click', () => {
    setMenu(!links.classList.contains('show'));
});

links?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => setMenu(false));
});

window.addEventListener('keydown', e => {
    if (e.key === 'Escape') setMenu(false);
});

window.matchMedia('(min-width: 861px)').addEventListener('change', () => setMenu(false));

let main = document.querySelector("main > div");

function getThisWeek() {
    let today = new Date();
    let day = today.getDay();

    let monday = new Date();
    let diff = day === 0 ? -6 : 1 - day;
    monday.setDate(today.getDate() + diff);

    let week = [];
    for (let i = 0; i < 7; i++) {
        let d = new Date();
        d.setDate(monday.getDate() + i);
        week.push(d);
    }
    return week;
}

let days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
let months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

let thisWeek = getThisWeek();
let mealNames = ["Breakfast", "Lunch", "Dinner", "Notes"];
let prevIsMobile = window.innerWidth < 780;
let recipes;
let overlay = document.querySelector(".overlay");
let searchInput = document.querySelector(".search");
let recipesContainer = document.querySelector(".recipes");

function fetchAllRecipes() {
    fetch("../js/data.json")
        .then(res => res.json())
        .then(data => recipes = data.recipes)
        .catch(()=>console.error('error fetching'))
}
fetchAllRecipes();

function renderLayout() {
    let isMobile = window.innerWidth < 780;
    let html = "";

    thisWeek.forEach(d => {
        let dayName = days[d.getDay()];
        let dateLabel = `${months[d.getMonth()]} ${d.getDate()}`;

        html += `<section class="day-section" data-day="${dayName}">
      <div class="day-info">
        <p>${dayName}</p>
        <p>${dateLabel}</p>
      </div>`;

        for (let i = 0; i < mealNames.length; i++) {
            let label = isMobile ? `${mealNames[i]} +Add` : "+ Add";
            html += `<div class="meal-slot">
        <button class="add"><span>${label}</span></button>
      </div>`;
        }

        html += `</section>`;
    });
    let cat = `<section class="categories">
                <div class="hidden">
                    <p>Monday</p>
                    <p>Oct 21</p>
                </div>
                <div>Breakfast</div>
                <div>Lunch</div>
                <div>Dinner</div>
                <div>Notes</div>
            </section>`
    main.innerHTML = cat + html;

    loadSavedMeals();
    setAddBtnListeners();
}

searchInput.addEventListener("input", () => {
    let query = searchInput.value.toLowerCase();
    recipesContainer.innerHTML = "<p>Results</p>";

    let filtered = !query.trim() ? recipes : recipes.filter(meal => meal.name.toLowerCase().includes(query));

    if (!filtered || filtered.length === 0) {
        recipesContainer.innerHTML += `<div>No recipes found</div>`;
        return;
    }

    filtered.forEach(meal => {
        recipesContainer.innerHTML += `<div class="recipe-item">${meal.name}</div>`;
    });

    attachRecipeClickListeners();
});

function attachRecipeClickListeners() {
    let recipeDivs = recipesContainer.querySelectorAll(".recipe-item");

    recipeDivs.forEach(recipeDiv => {
        recipeDiv.addEventListener("click", () => {
            let mealName = recipeDiv.textContent;
            let openSection = document.querySelector("section.day-section.active-slot");
            if (!openSection) return;

            let day = openSection.getAttribute("data-day");
            let mealDivs = Array.from(openSection.querySelectorAll(".meal-slot"));
            let activeSlot = openSection.querySelector(".meal-slot.active");
            let mealIndex = mealDivs.indexOf(activeSlot);
            let mealType = mealNames[mealIndex];

            saveMeal(day, mealType, mealName);

            overlay.style.display = "none";
            document.querySelector("body").classList.remove("overlayOpen");
            if (searchInput) searchInput.value = "";

            document.querySelectorAll(".active-slot, .meal-slot.active").forEach(el =>
                el.classList.remove("active-slot", "active")
            );

            loadSavedMeals();
        });
    });
}

function loadSavedMeals() {
    let saved = JSON.parse(localStorage.getItem("mealPlanner")) || {};

    let sections = document.querySelectorAll("main section.day-section");

    sections.forEach(section => {
        let day = section.getAttribute("data-day");
        let mealDivs = section.querySelectorAll(".meal-slot");

        mealDivs.forEach((div, index) => {
            let mealType = mealNames[index];
            let key = `${day}-${mealType}`;
            let savedMeal = saved[key];

            if (savedMeal) {
                div.innerHTML = `<p class="saved-meal">${savedMeal}</p>`;
            } 
        });
    });

    document.querySelectorAll(".saved-meal").forEach(mealEl => {
        let parent = mealEl.parentElement;
        let newNode = mealEl.cloneNode(true);
        parent.replaceChild(newNode, mealEl);

        newNode.addEventListener("click", (e) => {
            let section = e.target.closest("section.day-section");
            let day = section.getAttribute("data-day");
            let mealDivs = Array.from(section.querySelectorAll(".meal-slot"));
            let mealIndex = mealDivs.indexOf(newNode.parentElement);
            let mealType = mealNames[mealIndex];

            if (mealType === "Notes") {
                openNoteModal(day, newNode.parentElement);
                return;
            }

            if (confirm("Remove this recipe?")) {
                removeMeal(day, mealType);
                let isMobile = window.innerWidth < 780;
                let label = isMobile ? `${mealNames[mealIndex]} +Add` : "+ Add";
                newNode.parentElement.innerHTML = `<button class="add"><span>${label}</span></button>`;
                setAddBtnListeners();
            }
        });
    });
}

function setAddBtnListeners() {
    let addButtons = document.querySelectorAll("button.add");

    addButtons.forEach(btn => {
        btn.replaceWith(btn.cloneNode(true));
    });
    let freshBtns = document.querySelectorAll("button.add");
    freshBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            let section = e.target.closest("section.day-section");
            let day = section.getAttribute("data-day");
            let mealDivs = Array.from(section.querySelectorAll(".meal-slot"));
            let mealSlot = e.target.closest(".meal-slot");
            let mealIndex = mealDivs.indexOf(mealSlot);
            let mealType = mealNames[mealIndex];

            document.querySelectorAll(".active-slot, .meal-slot.active").forEach(el =>
                el.classList.remove("active-slot", "active")
            );
            section.classList.add("active-slot");
            mealSlot.classList.add("active");

            if (mealType === "Notes") {
                openNoteModal(day, mealSlot);
                return;
            }

            overlay.style.display = "flex";
            recipesContainer.innerHTML = "<p>Results</p>";
            document.querySelector("body").classList.add("overlayOpen")
            if (!recipes) {
                recipesContainer.innerHTML += `<div>Loading recipes...</div>`;
            } else {
                recipes.forEach(meal => {
                    recipesContainer.innerHTML += `<div class="recipe-item">${meal.name}</div>`;
                });
            }

            recipesContainer.querySelectorAll(".recipe-item").forEach(recipeDiv => {
                recipeDiv.addEventListener("click", () => {
                    let mealName = recipeDiv.textContent;
                    saveMeal(day, mealType, mealName);

                    overlay.style.display = "none";
                    document.querySelector("body").classList.remove("overlayOpen")
                    if (searchInput) searchInput.value = "";

                    document.querySelectorAll(".active-slot, .meal-slot.active").forEach(el =>
                        el.classList.remove("active-slot", "active")
                    );

                    loadSavedMeals();
                });
            });
        });
    });
}

function saveMeal(day, mealType, mealName) {
    let saved = JSON.parse(localStorage.getItem("mealPlanner")) || {};
    saved[`${day}-${mealType}`] = mealName;
    localStorage.setItem("mealPlanner", JSON.stringify(saved));
}

function removeMeal(day, mealType) {
    let saved = JSON.parse(localStorage.getItem("mealPlanner")) || {};
    delete saved[`${day}-${mealType}`];
    localStorage.setItem("mealPlanner", JSON.stringify(saved));
}

function openNoteModal(day) {
    let modal = document.createElement("div");
    modal.className = "note-modal";
    modal.innerHTML = `
    <div class="note-box">
      <div class="note-header">
        <h3>Add Note for ${day}</h3>
        <i class="bi bi-x-lg close-note"></i>
      </div>
      <textarea placeholder="Write your note here..."></textarea>
      <button class="save-note">Save Note</button>
    </div>
  `;
    document.body.appendChild(modal);

    let closeNote = modal.querySelector(".close-note");
    let saveNote = modal.querySelector(".save-note");
    let textarea = modal.querySelector("textarea");

    closeNote.addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => {
        if (e.target.classList.contains("note-modal")) modal.remove();
    });

    saveNote.addEventListener("click", () => {
        let note = textarea.value.trim();
        if (!note) return alert("Please write something!");
        saveMeal(day, "Notes", note);
        modal.remove();
        loadSavedMeals();
    });
}

overlay.addEventListener("click", (e) => {
    if (e.target.classList.contains("overlay")) {
        e.target.style.display = "none";
        document.querySelector("body").classList.remove("overlayOpen")
        if (searchInput) searchInput.value = "";
        document.querySelectorAll(".active-slot, .meal-slot.active").forEach(el =>
            el.classList.remove("active-slot", "active")
        );
    }
});

renderLayout();

window.addEventListener("resize", () => {
    let isMobile = window.innerWidth < 780;
    if (isMobile !== prevIsMobile) {
        prevIsMobile = isMobile;
        renderLayout();
    } 
});
