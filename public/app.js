const API = '/api';
let me = null;

function renderAuth() {
    const auth = document.getElementById('auth');
    if (!me) {
        auth.innerHTML = `
            <h2>Login</h2>
            <input id="email" placeholder="Email">
            <input id="password" type="password" placeholder="Password">
            <button onclick="login()">Login</button>
            <p>or</p>
            <button onclick="register()">Register</button>
        `;
    } else {
        auth.innerHTML = `
            <h2>Welcome, ${me.name}</h2>
            <button onclick="logout()">Logout</button>
            <button onclick="showNew()">New Idea</button>
        `;
    }
}

function refresh() {
    fetch(API + '/ideas')
        .then(res => res.json())
        .then(ideas => {
            const ideasDiv = document.getElementById('ideas');
            ideasDiv.innerHTML = '<h2>Ideas</h2>' + ideas.map(i => `
                <div class="idea">
                    <h3>${i.title}</h3>
                    <p>${i.description}</p>
                    <p>Price: $${i.price}</p>
                    <p>Created by: ${i.user.name}</p>
                </div>
            `).join('');
        })
        .catch(console.error);
}

function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    fetch(API + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(res => res.json())
    .then(data => {
        me = data;
        renderAuth();
        refresh();
    })
    .catch(console.error);
}

function register() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const name = prompt('Enter your name');
    if (!name) return;
    fetch(API + '/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
    })
    .then(res => res.json())
    .then(data => {
        me = data;
        renderAuth();
        refresh();
    })
    .catch(console.error);
}

function logout() {
    fetch(API + '/logout', { method: 'POST' })
        .then(() => {
            me = null;
            renderAuth();
            refresh();
        })
        .catch(console.error);
}

function showNew() {
    if (!me) {
        alert('Login first');
        return;
    }
    document.getElementById('main').innerHTML = `
        <h2>New Idea</h2>
        <input id="title" placeholder="Title">
        <textarea id="desc" placeholder="Description"></textarea>
        <input id="price" type="number" min="0" step="0.01" placeholder="Price">
        <button onclick="postIdea()">Publish</button>
    `;
}

function postIdea() {
    const title = document.getElementById('title').value;
    const description = document.getElementById('desc').value;
    const price = Number(document.getElementById('price').value);
    
    fetch(API + '/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, price })
    })
    .then(refresh)
    .catch(console.error);
}

renderAuth();
refresh();
