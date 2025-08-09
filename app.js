let currentUser = null;

const users = JSON.parse(localStorage.getItem('users')) || [];
const posts = JSON.parse(localStorage.getItem('posts')) || [];
const subscriptions = JSON.parse(localStorage.getItem('subscriptions')) || {}; // { username: [usernames] }

document.getElementById('auth-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    let user = users.find(u => u.username === username);
    if (!user) {
        //Регистрация
        users.push({ username, password });
        localStorage.setItem('users', JSON.stringify(users));
        alert('Зарегистрированы успешно!');
        login(username);
    } else {
        //Вход
        if (user.password === password) {
            login(username);
        } else {
            alert('Неверный пароль');
        }
    }
});

function login(username) {
    currentUser = username;
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    loadUserPosts();
    loadSubscriptions();
    loadPublicPosts();
}

document.getElementById('logout-btn').addEventListener('click', () => {
    currentUser = null;
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('app').style.display = 'none';
});

document.getElementById('post-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();
    const tags = document.getElementById('post-tags').value.split(',').map(t => t.trim()).filter(t => t);
    const isSecret = document.getElementById('secret-post').checked;

    const newPost = {
        id: Date.now(),
        author: currentUser,
        title,
        content,
        tags,
        isSecret,
        isHidden: false,
        createdAt: new Date()
    };
    posts.push(newPost);
    localStorage.setItem('posts', JSON.stringify(posts));
    loadUserPosts();
    document.getElementById('post-form').reset();
});

//Функция просмотра постов пользователя
function loadUserPosts() {
    const userPostsDiv = document.getElementById('user-posts');
    userPostsDiv.innerHTML = '';
    const userPosts = posts.filter(p => p.author === currentUser);
    userPosts.forEach(post => {
        const postDiv = document.createElement('div');
        postDiv.innerHTML = `
            <h3>${post.title}</h3>
            <p>${post.content}</p>
            <p>Теги: ${post.tags.join(', ')}</p>
            <button onclick="editPost(${post.id})">Редактировать</button>
            <button onclick="deletePost(${post.id})">Удалить</button>
            <button onclick="toggleSecret(${post.id})">${post.isSecret ? 'Сделать публичным' : 'Сделать скрытым'}</button>
            <button onclick="addComment(${post.id})">Комментировать</button>
            <div id="comments-post-${post.id}"></div>
        `;
        userPostsDiv.appendChild(postDiv);
    });
}

//Функции редактирования и удаления
function editPost(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post || post.author !== currentUser) return;
    const newTitle = prompt('Измените заголовок', post.title);
    const newContent = prompt('Измените содержание', post.content);
    if (newTitle !== null) post.title = newTitle;
    if (newContent !== null) post.content = newContent;
    localStorage.setItem('posts', JSON.stringify(posts));
    loadUserPosts();
}

function deletePost(postId) {
    const index = posts.findIndex(p => p.id === postId);
    if (index !== -1 && posts[index].author === currentUser) {
        posts.splice(index, 1);
        localStorage.setItem('posts', JSON.stringify(posts));
        loadUserPosts();
    }
}

function toggleSecret(postId) {
    const post = posts.find(p => p.id === postId);
    if (post && post.author === currentUser) {
        post.isSecret = !post.isSecret;
        localStorage.setItem('posts', JSON.stringify(posts));
        loadUserPosts();
    }
}

//Подписка на пользователей
document.getElementById('subscribe-form').addEventListener('submit', e => {
    e.preventDefault();
    const usernameToSubscribe = document.getElementById('subscribe-username').value.trim();
    if (usernameToSubscribe === currentUser) {
        alert('Невозможно подписаться на себя');
        return;
    }
    if (!users.find(u => u.username === usernameToSubscribe)) {
        alert('Пользователь не найден');
        return;
    }
    if (!subscriptions[currentUser]) {
        subscriptions[currentUser] = [];
    }
    if (!subscriptions[currentUser].includes(usernameToSubscribe)) {
        subscriptions[currentUser].push(usernameToSubscribe);
        localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
        loadSubscriptions();
    }
});

function loadSubscriptions() {
    const listDiv = document.getElementById('subscriptions-list');
    listDiv.innerHTML = '';
    const subs = subscriptions[currentUser] || [];
    subs.forEach(sub => {
        const p = document.createElement('p');
        p.textContent = sub;
        listDiv.appendChild(p);
    });
}

//Загрузка публичных постов
function loadPublicPosts() {
    const container = document.getElementById('public-posts');
    container.innerHTML = '';
    const publicPosts = posts.filter(p => !p.isSecret && !p.isHidden);
    publicPosts.forEach(post => {
        const postDiv = document.createElement('div');
        postDiv.innerHTML = `
            <h3>${post.title}</h3>
            <p>${post.content}</p>
            <p>Автор: ${post.author}</p>
            <p>Теги: ${post.tags.join(', ')}</p>
            <button onclick="showComments(${post.id})">Комментарии</button>
        `;
        container.appendChild(postDiv);
    });
}

//Скрытые посты "только по запросу"
function showSecretPosts() {
    const hiddenPosts = posts.filter(p => p.isSecret && !p.isHidden);
    // Можно реализовать запрос по имени пользователя или ключевому слову
    // Для простоты показываем все скрытые посты по кнопке
}

//Добавление комментариев (упрощённо)
function addComment(postId) {
    const comment = prompt('Введите комментарий:');
    if (!comment) return;
    const post = posts.find(p => p.id === postId);
    if (!post.comments) post.comments = [];
    post.comments.push({ user: currentUser, text: comment, date: new Date() });
    localStorage.setItem('posts', JSON.stringify(posts));
    showComments(postId);
}

function showComments(postId) {
    const post = posts.find(p => p.id === postId);
    const commentsDiv = document.getElementById(`comments-post-${postId}`);
    commentsDiv.innerHTML = '';
    if (post.comments) {
        post.comments.forEach(c => {
            const cDiv = document.createElement('div');
            cDiv.innerHTML = `<b>${c.user}</b>: ${c.text} <i>${c.date.toLocaleString()}</i>`;
            commentsDiv.appendChild(cDiv);
        });
    }
}