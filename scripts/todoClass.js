import { todosList } from "./main.js" // access to browser's memory of todos saved

/* 
    Todo is the object class of a todo added by the user.
    The intantiated object is added to {todosList} for saving in the browser's memory what the user has added.
    The object can be easily deleted by using "delete todosList[id]" when a task is deleted.
    It does not have a lot to do at the moment except saving the input and creating the table row using a prototype method.
    But more methods can be added to the class make it easier to scale and expand.
*/

export const Todo = function (todo, date, hashtags) {
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
              <div class="date">${this.date.replace("T", " ")}</div>
              <div class="hashtags">${this.hashtags}</div>
          </div>
          <div class="todo-buttons">
              <button class="done-btn">✓</button>
              <button class="remove-btn">✗</button>
          </div>
      </td>
      `;
    // add archived and remove button callback functions
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