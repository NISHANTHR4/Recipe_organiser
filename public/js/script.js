document.addEventListener('DOMContentLoaded', () => {
    const apiUrl = 'http://localhost:5000/api';

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            try {
                const response = await fetch(`${apiUrl}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });
                const data = await response.json();
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    window.location.href = 'dashboard.html';
                } else {
                    alert('Login failed');
                }
            } catch (error) {
                console.error('Error logging in', error);
            }
        });
    }

    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            try {
                const response = await fetch(`${apiUrl}/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });
                const data = await response.json();
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    window.location.href = 'dashboard.html';
                } else {
                    alert('Registration failed');
                }
            } catch (error) {
                console.error('Error registering', error);
            }
        });
    }

    // Dashboard
    const token = localStorage.getItem('token');
    if (token) {
        const recipeList = document.getElementById('recipeList');
        if (recipeList) {
            fetch(`${apiUrl}/recipes`, {
                headers: { 'x-access-token': token }
            })
            .then(response => response.json())
            .then(data => {
                data.forEach(recipe => {
                    const li = document.createElement('li');
                    li.textContent = recipe.title;
                    li.addEventListener('click', () => {
                        localStorage.setItem('currentRecipe', JSON.stringify(recipe));
                        window.location.href = 'recipe-detail.html';
                    });
                    recipeList.appendChild(li);
                });
            })
            .catch(error => console.error('Error fetching recipes', error));
        }

        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                localStorage.removeItem('token');
                window.location.href = 'index.html';
            });
        }
    }

    // Recipe form
    const recipeForm = document.getElementById('recipeForm');
    if (recipeForm) {
        recipeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('title').value;
            const category = document.getElementById('category').value;
            const instructions = document.getElementById('instructions').value;
            const image = document.getElementById('image').files[0];

            const formData = new FormData();
            formData.append('title', title);
            formData.append('category', category);
            formData.append('instructions', instructions);
            if (image) {
                formData.append('image', image);
            }

            try {
                const response = await fetch(`${apiUrl}/recipes`, {
                    method: 'POST',
                    headers: { 'x-access-token': token },
                    body: formData
                });
                if (response.ok) {
                    window.location.href = 'dashboard.html';
                } else {
                    alert('Error adding recipe');
                }
            } catch (error) {
                console.error('Error adding recipe', error);
            }
        });
    }

    // Recipe detail
    const currentRecipe = JSON.parse(localStorage.getItem('currentRecipe'));
    if (currentRecipe) {
        const recipeTitle = document.getElementById('recipeTitle');
        const recipeCategory = document.getElementById('recipeCategory');
        const recipeInstructions = document.getElementById('recipeInstructions');
        const recipeImage = document.getElementById('recipeImage');

        if (recipeTitle) recipeTitle.textContent = currentRecipe.title;
        if (recipeCategory) recipeCategory.textContent = `Category: ${currentRecipe.category}`;
        if (recipeInstructions) recipeInstructions.textContent = `Instructions: ${currentRecipe.instructions}`;
        if (recipeImage && currentRecipe.image) recipeImage.src = currentRecipe.image;

        const editButton = document.getElementById('editButton');
        if (editButton) {
            editButton.addEventListener('click', () => {
                window.location.href = `recipe-form.html?id=${currentRecipe.id}`;
            });
        }

        const deleteButton = document.getElementById('deleteButton');
        if (deleteButton) {
            deleteButton.addEventListener('click', async () => {
                try {
                    const response = await fetch(`${apiUrl}/recipes/${currentRecipe.id}`, {
                        method: 'DELETE',
                        headers: { 'x-access-token': token }
                    });
                    if (response.ok) {
                        window.location.href = 'dashboard.html';
                    } else {
                        alert('Error deleting recipe');
                    }
                } catch (error) {
                    console.error('Error deleting recipe', error);
                }
            });
        }
    }
});
