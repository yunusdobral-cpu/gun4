const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const footer = document.getElementById("footer");
const countEl = document.getElementById("count");
const clearBtn = document.getElementById("clear-done");

let todos = JSON.parse(localStorage.getItem("todos") || "[]");

function save() {
    localStorage.setItem("todos", JSON.stringify(todos));
}

function render() {
    list.innerHTML = "";
    todos.forEach((todo, i) => {
        const li = document.createElement("li");
        if (todo.done) li.classList.add("done");

        const span = document.createElement("span");
        span.textContent = todo.text;
        span.addEventListener("click", () => {
            todos[i].done = !todos[i].done;
            save();
            render();
        });

        const editBtn = document.createElement("button");
        editBtn.className = "edit-btn";
        editBtn.textContent = "\u270e";
        editBtn.addEventListener("click", () => startEdit(li, i));

        const btn = document.createElement("button");
        btn.className = "delete-btn";
        btn.textContent = "\u00d7";
        btn.addEventListener("click", () => {
            todos.splice(i, 1);
            save();
            render();
        });

        li.append(span, editBtn, btn);
        list.appendChild(li);
    });

    const remaining = todos.filter((t) => !t.done).length;
    countEl.textContent = `${remaining} g\u00f6rev kald\u0131`;
    footer.classList.toggle("hidden", todos.length === 0);
}

form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    todos.push({ text, done: false });
    input.value = "";
    save();
    render();
});

clearBtn.addEventListener("click", () => {
    todos = todos.filter((t) => !t.done);
    save();
    render();
});

function startEdit(li, index) {
    li.innerHTML = "";
    li.classList.add("editing");

    const editInput = document.createElement("input");
    editInput.type = "text";
    editInput.className = "edit-input";
    editInput.value = todos[index].text;

    const saveBtn = document.createElement("button");
    saveBtn.className = "save-btn";
    saveBtn.textContent = "Kaydet";

    function saveEdit() {
        const newText = editInput.value.trim();
        if (newText) {
            todos[index].text = newText;
            save();
        }
        render();
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

render();
