const SUPABASE_URL = "https://gegpohltcnrmbonzpkpt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlZ3BvaGx0Y25ybWJvbnpwa3B0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyODAzMjUsImV4cCI6MjA4OTg1NjMyNX0.8p5b7Z_B0n4MVEzP-iNtbDMERDqCBDpGNlyzNXwZd9M";
const API = `${SUPABASE_URL}/rest/v1/todos`;
const AUTH = `${SUPABASE_URL}/auth/v1`;

let session = null;
let todos = [];

function authHeaders() {
    return {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
    };
}

// --- DOM ---
const authSection = document.getElementById("auth-section");
const appSection = document.getElementById("app-section");
const authMessage = document.getElementById("auth-message");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const tabs = document.querySelectorAll(".auth-tab");
const userEmail = document.getElementById("user-email");
const logoutBtn = document.getElementById("logout-btn");
const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const footer = document.getElementById("footer");
const countEl = document.getElementById("count");
const clearBtn = document.getElementById("clear-done");

// --- Auth UI ---
tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        const isLogin = tab.dataset.tab === "login";
        loginForm.style.display = isLogin ? "" : "none";
        registerForm.style.display = isLogin ? "none" : "";
        hideMessage();
    });
});

function showMessage(text, isError = false) {
    authMessage.textContent = text;
    authMessage.className = isError ? "error" : "success";
}

function hideMessage() {
    authMessage.textContent = "";
    authMessage.className = "hidden";
}

// --- Register ---
registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("register-email").value.trim();
    const password = document.getElementById("register-password").value;

    const res = await fetch(`${AUTH}/signup`, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (res.ok) {
        if (data.identities && data.identities.length === 0) {
            showMessage("Bu e-posta zaten kayıtlı.", true);
        } else {
            showMessage("Kayıt başarılı! E-postanıza gelen onay linkine tıklayın.");
            registerForm.reset();
        }
    } else {
        showMessage(data.error_description || data.msg || "Kayıt başarısız.", true);
    }
});

// --- Login ---
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    const res = await fetch(`${AUTH}/token?grant_type=password`, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (res.ok) {
        session = data;
        localStorage.setItem("session", JSON.stringify(data));
        showApp();
    } else {
        if (data.error === "email_not_confirmed") {
            showMessage("E-postanızı henüz onaylamadınız. Gelen kutunuzu kontrol edin.", true);
        } else {
            showMessage("E-posta veya şifre hatalı.", true);
        }
    }
});

// --- Logout ---
logoutBtn.addEventListener("click", async () => {
    await fetch(`${AUTH}/logout`, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${session.access_token}` },
    });
    session = null;
    localStorage.removeItem("session");
    showAuth();
});

// --- Session check ---
async function refreshSession(refreshToken) {
    const res = await fetch(`${AUTH}/token?grant_type=refresh_token`, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (res.ok) {
        const data = await res.json();
        session = data;
        localStorage.setItem("session", JSON.stringify(data));
        return true;
    }
    return false;
}

function showAuth() {
    authSection.style.display = "";
    appSection.style.display = "none";
    hideMessage();
}

function showApp() {
    authSection.style.display = "none";
    appSection.style.display = "";
    userEmail.textContent = session.user.email;
    fetchTodos();
}

// --- Handle email confirmation redirect ---
function handleAuthRedirect() {
    const hash = window.location.hash.substring(1);
    if (!hash) return false;
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");
    if (accessToken && type === "signup") {
        session = {
            access_token: accessToken,
            refresh_token: refreshToken,
            user: JSON.parse(atob(accessToken.split(".")[1])),
        };
        // Fetch full user info
        fetch(`${AUTH}/user`, {
            headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${accessToken}` },
        })
            .then((r) => r.json())
            .then((user) => {
                session.user = user;
                localStorage.setItem("session", JSON.stringify(session));
                window.location.hash = "";
                showApp();
            });
        return true;
    }
    return false;
}

// --- Todos ---
async function fetchTodos() {
    const res = await fetch(`${API}?order=created_at.asc`, { headers: authHeaders() });
    todos = await res.json();
    render();
}

function render() {
    list.innerHTML = "";
    todos.forEach((todo) => {
        const li = document.createElement("li");
        if (todo.done) li.classList.add("done");

        const span = document.createElement("span");
        span.textContent = todo.text;
        span.addEventListener("click", () => toggleDone(todo));

        const editBtn = document.createElement("button");
        editBtn.className = "edit-btn";
        editBtn.textContent = "\u270e";
        editBtn.addEventListener("click", () => startEdit(li, todo));

        const btn = document.createElement("button");
        btn.className = "delete-btn";
        btn.textContent = "\u00d7";
        btn.addEventListener("click", () => deleteTodo(todo.id));

        li.append(span, editBtn, btn);
        list.appendChild(li);
    });

    const remaining = todos.filter((t) => !t.done).length;
    countEl.textContent = `${remaining} g\u00f6rev kald\u0131`;
    footer.style.display = todos.length === 0 ? "none" : "";
}

async function addTodo(text) {
    await fetch(API, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ text, done: false, user_id: session.user.id || session.user.sub }),
    });
    await fetchTodos();
}

async function toggleDone(todo) {
    await fetch(`${API}?id=eq.${todo.id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ done: !todo.done }),
    });
    await fetchTodos();
}

async function updateText(id, text) {
    await fetch(`${API}?id=eq.${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ text }),
    });
    await fetchTodos();
}

async function deleteTodo(id) {
    await fetch(`${API}?id=eq.${id}`, {
        method: "DELETE",
        headers: authHeaders(),
    });
    await fetchTodos();
}

async function clearDone() {
    await fetch(`${API}?done=eq.true`, {
        method: "DELETE",
        headers: authHeaders(),
    });
    await fetchTodos();
}

form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    addTodo(text);
});

clearBtn.addEventListener("click", clearDone);

function startEdit(li, todo) {
    li.innerHTML = "";
    li.classList.add("editing");

    const editInput = document.createElement("input");
    editInput.type = "text";
    editInput.className = "edit-input";
    editInput.value = todo.text;

    const saveBtn = document.createElement("button");
    saveBtn.className = "save-btn";
    saveBtn.textContent = "Kaydet";

    function saveEdit() {
        const newText = editInput.value.trim();
        if (newText && newText !== todo.text) {
            updateText(todo.id, newText);
        } else {
            render();
        }
    }

    saveBtn.addEventListener("click", saveEdit);
    editInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") saveEdit();
        if (e.key === "Escape") render();
    });

    li.append(editInput, saveBtn);
    editInput.focus();
    editInput.select();
}

// --- Init ---
(async function init() {
    if (handleAuthRedirect()) return;

    const saved = localStorage.getItem("session");
    if (saved) {
        session = JSON.parse(saved);
        const refreshed = await refreshSession(session.refresh_token);
        if (refreshed) {
            showApp();
        } else {
            localStorage.removeItem("session");
            showAuth();
        }
    } else {
        showAuth();
    }
})();
