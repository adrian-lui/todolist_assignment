const jsonCache = {
  todos: [],
  archived: [],
};

export function init() {
  const tHead = document.getElementById("todos-head");
  const nextTodo = document.getElementById("nextTodo");
  const addButton = document.getElementById("addButton");
  const todoDueDate = document.getElementById("todoDueDate");

  addButton.addEventListener("click", function (e) {
    e.preventDefault();
    const todoValue = nextTodo.value;
    const dateValue = todoDueDate.value;
    const hashtags = nextTodo.value
      .split(" ")
      .filter((word) => word.at(0) == "#");
    const todo = new Todo(todoValue, dateValue, hashtags);
    jsonCache.todos.push(todo);
    createRow(todoValue, dateValue, hashtags);
  });
}

const Todo = function (todo, date, hashtags) {
  this.todo = todo;
  this.date = date;
  this.hashtags = hashtags;
};

const createRow = function (todo, date, hashtags) {
  const tBody = document.getElementById("todos-body");
  const row = document.createElement("tr");
  row.classList.add(jsonCache.todos.length % 2 === 0 ? "dark" : "light");
  row.innerHTML = `
    <td>${todo}</td>
    <td>${date} ${hashtags}</td>
    `;
  tBody.prepend(row);
};
