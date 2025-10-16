const signpPageButton = document.querySelector(".signupPageBtn")
const loginPageButton = document.querySelector(".loginPageBtn")
const loginButton = document.querySelector(".loginBtn")
const loginForm = document.querySelector(".login")
const signUpForm = document.querySelector(".signup")
const emailInput = document.querySelector('.login .email');
const passwordInput = document.querySelector('.login .password');

signpPageButton.addEventListener("click", () => {
    loginForm.style.display = "none"
    signUpForm.style.display = "flex"
})
loginPageButton.addEventListener("click", () => {
    loginForm.style.display = "flex"
    signUpForm.style.display = "none"
})
loginButton.addEventListener("click", () => {
    fetch('../js/data.json')
        .then(res => res.json())
        .then(data => {
            const users = data.users;
            const foundUser = users.find(
                user => user.email === emailInput.value && user.password === passwordInput.value
            );
            if (foundUser) {
                console.log("found")
            } else {
                console.log("not found")
            }
        })
        .catch(err => console.error('Error fetching users:', err));
})