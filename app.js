const SUPABASE_URL = "https://gegpohltcnrmbonzpkpt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlZ3BvaGx0Y25ybWJvbnpwa3B0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyODAzMjUsImV4cCI6MjA4OTg1NjMyNX0.8p5b7Z_B0n4MVEzP-iNtbDMERDqCBDpGNlyzNXwZd9M";
const API = `${SUPABASE_URL}/rest/v1/todos`;
const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
};

const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const footer = document.getElementById("footer");
const countEl = document.getElementById("count");
const clearBtn = document.getElementById("clear-done");

let todos = [];

async function fetchTodos() {
    const res = await fetch(`${API}?order=created_at.asc`, { headers });
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
    footer.classList.toggle("hidden", todos.length === 0);
}

async function addTodo(text) {
    await fetch(API, {
        method: "POST",
        headers,
        body: JSON.stringify({ text, done: false }),
    });
    await fetchTodos();
}

async function toggleDone(todo) {
    await fetch(`${API}?id=eq.${todo.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ done: !todo.done }),
    });
    await fetchTodos();
}

async function updateText(id, text) {
    await fetch(`${API}?id=eq.${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ text }),
    });
    await fetchTodos();
}

async function deleteTodo(id) {
    await fetch(`${API}?id=eq.${id}`, {
        method: "DELETE",
        headers,
    });
    await fetchTodos();
}

async function clearDone() {
    await fetch(`${API}?done=eq.true`, {
        method: "DELETE",
        headers,
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

fetchTodos();
