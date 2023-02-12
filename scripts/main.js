const todosList = {}; // save the todos list as an object in the browser
let todosListOrdered = []; // array for saving the user's order of todos after dragging

export function init() {
  // initialize the buttons and anchors callback events
  const tHead = document.getElementById("todos-head");
  const tBody = document.getElementById("todos-body");

  // create dragging mouse event for changing todos order
  let dragging = false;
  let dragRow;
  tBody.addEventListener("mousedown", saveDragRow);
  tBody.addEventListener("mousemove", moveDragRow);
  tBody.addEventListener("mouseup", dragEnd);

  // create onclick callback funcs for nav top anchors
  document.querySelectorAll("a").forEach((anchor) => {
    anchor.addEventListener("click", addAnchorOnClick);
  });

  // create onlick and Enter  key for adding todos row
  document.getElementById("addButton").addEventListener("click", addTodo);
  tHead.addEventListener("keypress", function (e) {
    if (e.key !== "Enter") return;
    addTodo();
  });

  // create export button for logging the json object to the console
  document
    .getElementById("export-btn")
    .addEventListener("click", addExportJSON);

  function addExportJSON() {
    console.log(JSON.stringify(todosList));
    alert("Successfully exported TODOS as JSON format to the console.");
  }

  function saveDragRow(e) {
    // save the row to be dragged
    e.preventDefault();
    // limit dragging only for all todos page
    if (!document.getElementById("home").classList.contains("active")) return;

    // start dragging, save the row element to dragRow
    dragging = true;
    const rows = e.currentTarget.children;
    for (const row of rows) {
      const rowRect = row.getBoundingClientRect();
      if (e.clientY <= rowRect.bottom && e.clientY >= rowRect.top) {
        dragRow = row;
        dragRow.style.opacity = 0.5;
      }
    }
  }

  function moveDragRow(e) {
    // move dragRow during mousemove event
    e.preventDefault();
    if (!document.getElementById("home").classList.contains("active")) return;
    if (!dragging) return;

    // move dragRow when it is dragged on top of another row by comparing their Y offsets
    const rows = e.currentTarget.children;
    for (const row of rows) {
      const rowRect = row.getBoundingClientRect();
      const cellSize = (rowRect.bottom - rowRect.top) / 2;
      if (e.clientY <= rowRect.bottom && e.clientY >= rowRect.top + cellSize) {
        row.insertAdjacentElement("afterEnd", dragRow);
      }
      if (e.clientY <= rowRect.bottom - cellSize && e.clientY >= rowRect.top) {
        row.insertAdjacentElement("beforeBegin", dragRow);
      }
    }

    // end dragging when the mouse is outside the container
    const bodyRect = tBody.getBoundingClientRect();
    if (e.clientY <= bodyRect.top + 2 || e.clientY > bodyRect.bottom - 2) {
      dragEnd(e);
    }
  }

  function dragEnd(e) {
    // end of dragging event, save the new order of rows to todosListOrdered and refresh the coloured rows
    e.preventDefault();
    if (!document.getElementById("home").classList.contains("active")) return;
    dragging = false;
    dragRow.style.opacity = 1;
    todosListOrdered = [];
    for (const row of tBody.children) {
      todosListOrdered.unshift([row.id, todosList[row.id]]);
    }
    refreshTodos(Object.fromEntries(todosListOrdered));
  }

  function addTodo() {
    // add todo row to tBody
    if (!nextTodo.value) return;
    const dateValue = todoDueDate.value;
    const todoValue = nextTodo.value
      .split(" ")
      .filter((word) => word.at(0) !== "#")
      .join(" ");

    // get hashtags
    const hashtags = nextTodo.value
      .split(" ")
      .filter((word) => word.at(0) == "#" && word.length > 1);

    // create object of Todo class
    const todo = new Todo(todoValue, dateValue, hashtags);
    todosList[todo.id] = todo;
    todosListOrdered.push([todo.id, todo]);
    todo.createRow();
    nextTodo.value = "";
    todoDueDate.value = "";

    // refresh the rows
    document.getElementById("home").click();
  }

  function addAnchorOnClick(e) {
    // add onclick callback funcs to nav bar anchors
    e.preventDefault();
    document
      .querySelectorAll("a")
      .forEach((anchor) => anchor.classList.remove("active"));
    this.classList.add("active");

    // get anchor search word and refresh the todo list
    const searchWord = this.search.slice(this.search.indexOf("=") + 1);
    switch (searchWord) {
      case "todos":
        todosListOrdered.length
          ? refreshTodos(Object.fromEntries(todosListOrdered))
          : refreshTodos(todosList);
        break;
      case "urgent":
        const urgentTodos = Object.entries(todosList).sort((a, b) => {
          if (!a[1].date) return -1;
          if (!b[1].date) return 1;
          return a[1].date < b[1].date ? 1 : -1;
        });
        refreshTodos(Object.fromEntries(urgentTodos));
        break;
      case "archived":
        refreshTodos(todosList, true);
        break;
    }
  }
}

const Todo = function (todo, date, hashtags) {
  // construct Todo object class
  this.id = Date.now();
  this.todo = todo;
  this.date = date;
  this.hashtags = hashtags;
  this.archived = false;
};

Todo.prototype.createRow = function () {
  // createRow methods of the Todo class, call this function to create a row of a todo and append it to the tBody
  const tBody = document.getElementById("todos-body");
  this.row = document.createElement("tr");
  this.row.classList.add(tBody.children.length % 2 === 0 ? "dark" : "light");
  this.row.id = this.id;
  this.row.innerHTML = `
      <td>${this.todo}</td>
      <td>
          <div class="date-hashtags">
              <div class="date">${this.date}</div>
              <div class="hashtags">${this.hashtags}</div>
          </div>
          <div class="todo-buttons">
              <button class="done-btn">✓</button>
              <button class="remove-btn">✗</button>
          </div>
      </td>
      `;
  this.row.addEventListener("mousedown", function (e) {
    if (e.target.classList.contains("done-btn")) {
      todosList[e.currentTarget.id].archived = true;
    } else if (e.target.classList.contains("remove-btn")) {
      delete todosList[e.currentTarget.id];
    }
    document.querySelector("a.active").click();
  });
  tBody.prepend(this.row);
};

function refreshTodos(list, showArchived = false) {
  // refresh the todo list according to the anchor search, or after every row dragging or deleting to reformat the colors and position of todos
  const tBody = document.getElementById("todos-body");
  tBody.innerHTML = "";
  for (const [id, todo] of Object.entries(list)) {
    if (!todosList[id]) continue; // this line is for escaping empty id in the todosListOrdered after deleting
    if (todo.archived === showArchived) todo.createRow(); // filter archived/unarchived todos
    if (showArchived)
      todo.row.querySelector(".done-btn").style.display = "none"; // hide the done-btn when archived
  }
}
