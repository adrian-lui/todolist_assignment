import { Todo } from "./todoClass.js" // Todo is the object class of a todo item

/* 
  main.js handles the initialization of the page.
  It adds the callback events to the anchors, buttons and rows of todos
*/ 

export const todosList = {}; // save the todos list as an object in the browser
let todosListOrdered = []; // array for saving the user's order of todos after dragging

const tHead = document.getElementById("todos-head");
const tBody = document.getElementById("todos-body");
export function init() {
  // initialize the buttons and anchors callback events
  // create dragging mouse event for changing todos order
  tBody.addEventListener("mousedown", saveDragRow);
  tBody.addEventListener("mousemove", moveDragRow);
  tBody.addEventListener("mouseup", dragEnd);

  // create onclick callback funcs for nav top anchors
  document
    .getElementById("topnav")
    .querySelectorAll("a")
    .forEach((anchor) => {
      anchor.addEventListener("click", addAnchorOnClick);
    });

  // create onlick and Enter  key for adding todos row
  document.getElementById("addButton").addEventListener("click", addTodo);
  tHead.addEventListener("keypress", function (e) {
    if (e.key !== "Enter") return;
    addTodo();
  });

  // create export button to iCal format, which can be imported to icalendar or google calendar 
  document
    .getElementById("export-btn")
    .addEventListener("click", addExportiCAL);
}

/*
  The following are callback functions to be used when anchors or buttons are clicked, or todo row is dragged.
  The following code can be moved to another .js if one wants, but remember to export todoLists object to the new .js file for accessing to the browser's memory of todoList
*/

function refreshTodos(list, showArchived = false) {
  // refresh the todo list according to the anchor search, or after every row dragging or deleting to reformat the colors and position of todos
  const tBody = document.getElementById("todos-body");
  const hashtagsSet = new Set();
  tBody.innerHTML = "";
  for (const [id, todo] of Object.entries(list)) {
    if (!todosList[id]) continue; // this line is for escaping empty id in the todosListOrdered after deleting
    if (todo.archived === showArchived) {
      // filter archived/unarchived todos
      todo.createRow();
      todo.hashtags.forEach((hashtag) => hashtagsSet.add(hashtag));
      if (new Date(todo.date).getTime() <= Date.now()) todo.row.querySelector(".date").style.backgroundColor = "#eb5067"
    }
    if (showArchived)
      todo.row.querySelector(".done-btn").style.display = "none"; // hide the done-btn when archived
  }

  // refresh hashtags, add onclick event to hashtags anchors
  const hashtagsRow = document.getElementById("hashtagsRow");
  hashtagsRow.innerHTML = hashtagsSet.size ? "" : "<a>#AddSomeHashtags!</a>";
  hashtagsSet.forEach((hashtag) => {
    const hashtagAnchor = document.createElement("a");
    hashtagAnchor.textContent = hashtag;
    hashtagAnchor.addEventListener("click", function (e) {
      e.preventDefault();
      for (const row of tBody.children) {
        row.querySelector(".hashtags").textContent.split(",").includes(hashtag)
          ? (row.style.display = "")
          : (row.style.display = "none");
      }
    });
    hashtagsRow.append(hashtagAnchor);
  });
}

function addExportiCAL() {
  // export the todo list to .ics format that can be imported to iCalendar or google calendar
  // todos without a time will be set to the time when it was added to the list
  let iCal = `BEGIN:VCALENDAR
  VERSION:2.0
  PRODID:-//ZContent.net//Zap Calendar 1.0//EN
  CALSCALE:GREGORIAN
  METHOD:PUBLISH
  `

  // loop through the list and create the .ics VEVENT text
  for (const todo of Object.entries(todosList)) {
    iCal += `BEGIN:VEVENT
    UID:${todo[0]}
    DTSTAMP:${new Date(Number.parseInt(todo[0])).toISOString().replaceAll("-", "").replaceAll(":", "").slice(0,-7)}00
    DTSTART:${todo[1].date.replaceAll("-", "").replaceAll(":", "")? todo[1].date.replaceAll("-", "").replaceAll(":", ""):new Date(Number.parseInt(todo[0])).toISOString().replaceAll("-", "").replaceAll(":", "").slice(0,-7)}00
    DTEND:${todo[1].date.replaceAll("-", "").replaceAll(":", "")? todo[1].date.replaceAll("-", "").replaceAll(":", ""):new Date(Number.parseInt(todo[0])).toISOString().replaceAll("-", "").replaceAll(":", "").slice(0,-7)}00
    SUMMARY:${todo[1].todo}
    CATEGORIES:${todo[1].hashtags}
    STATUS:CONFIRMED
    END:VEVENT
    `
  }

  iCal += `END:VCALENDAR`
  console.log(iCal.replaceAll("  ", ""))
  window.open( "data:text/calendar;charset=utf8," + iCal.replaceAll("  ", ""));
}

/*
  The following three callback functions are dedicated for the dragging event for reordering the todo list
  saveDragRow saves the row to be moved when mousedown
  moveDragRow moves the row to the upper or lower space of the other rows by comparing their clientY positions when mousemove
  dragEnd saves the new order of todo list to todosListOrdered array
*/
let dragging = false;
let dragRow;
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
  if (!dragging || !dragRow) return;

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
  if (!document.getElementById("home").classList.contains("active") || !dragRow) return;
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
  const dateValue = todoDueDate.value;
  const todoValue = nextTodo.value
  .split(" ")
  .filter((word) => word.at(0) !== "#")
  .join(" ");
  if (!todoValue || !todoValue.trim()) return;
  
  // get hashtags
  const hashtags = nextTodo.value
    .split(" ")
    .filter((word) => word.at(0) == "#");

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
    .getElementById("topnav")
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
        if (!a[1].date && !b[1].date) return 0;
        if (!a[1].date) return -1;
        if (!b[1].date) return 1;
        return a[1].date < b[1].date ? 1 : -1;
      })
      refreshTodos(Object.fromEntries(urgentTodos));
      break;
    case "archived":
      refreshTodos(todosList, true);
      break;
  }
}
