const { format } = require("date-fns");
const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
const formate = require("date-fns");

app.use(express.json());

let dataBase = null;

const dataPath = path.join(__dirname, "todoApplication.db");

const initializeDatabase = async () => {
  try {
    dataBase = await open({
      filename: dataPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server is Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB error ${error.message}`);
    process.exit(1);
  }
};

initializeDatabase();

let validateTodoItems = (item, object) => {
  let statusArray = ["TO DO", "IN PROGRESS", "DONE"];
  let categoryArray = ["WORK", "HOME", "LEARNING"];
  let priorityArray = ["HIGH", "MEDIUM", "LOW"];
  let validate = true;
  let output;
  let error;
  for (each of item) {
    if (each === "todo") {
      output = "Todo Updated";
    } else if (each === "status") {
      if (statusArray.includes(object[each])) {
        output = "Status Updated";
      } else {
        validate = false;
        error = "Invalid Todo Status";
        break;
      }
    } else if (each === "priority") {
      if (priorityArray.includes(object[each])) {
        output = "Priority Updated";
      } else {
        validate = false;
        error = "Invalid Todo Priority";
        break;
      }
    } else if (each === "category") {
      if (categoryArray.includes(object[each])) {
        output = "Category Updated";
      } else {
        validate = false;
        error = "Invalid Todo Category";
        break;
      }
    } else if (each === "dueDate") {
      if (object[each] === format(new Date(object[each]), "yyyy-MM-dd")) {
        output = "Due Date Updated";
      } else {
        validate = false;
        error = "Invalid Due Date";
        break;
      }
    }
  }
  return { validate: validate, output: output, error: error };
};

//API 1
app.get("/todos/", async (request, response) => {
  const {
    status = "",
    priority = "",
    search_q = "",
    category = "",
  } = request.query;
  const getTodosQuery = `
    SELECT
        *
    FROM
        todo
    WHERE
        status LIKE '%${status}%' AND priority LIKE '%${priority}%' AND  todo LIKE '%${search_q}%' AND category LIKE '%${category}%';`;
  const getTodo = await dataBase.all(getTodosQuery);
  response.send(getTodo);
});

//API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
  SELECT
    *
  FROM
    todo
  WHERE
    id = ${todoId};`;
  const getTodoResult = await dataBase.get(getTodoQuery);
  response.send(getTodoResult);
});

//API 3

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  let dates = format(new Date(date), "yyyy-MM-dd");
  console.log(date);
  const getAgenda = `SELECT * FROM todo WHERE due_date = '${dates}';`;
  const result = await dataBase.all(getAgenda);
  response.send(result);
});

//API 4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  let dates = format(new Date(dueDate), "yyyy-MM-dd");
  const body = request.body;
  let bodyKeys = Object.keys(body);
  let values = Object.values(body);
  let updateProperty = bodyKeys[0];
  let todoResult = validateTodoItems(bodyKeys, body);
  console.log(todoResult);
  if (todoResult.validate) {
    const createTodoQuery = `
        INSERT INTO todo(id, todo, priority, status, category, due_date)
        VALUES(${id}, '${todo}', '${priority}', '${status}', '${category}', '${dates}');`;
    const createResult = await dataBase.run(createTodoQuery);
    response.send("Todo Successfully Added");
  } else {
    response.status(400);
    response.send(todoResult.error);
  }
});

//API 5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const body = request.body;
  let bodyKeys = Object.keys(body);
  let values = Object.values(body);
  let updateProperty = bodyKeys[0];
  let todoResult = validateTodoItems(bodyKeys, body);
  console.log(todoResult);
  if (bodyKeys[0] === "dueDate") {
    updateProperty = "due_date";
  }
  if (todoResult.validate) {
    const updateQuery = `UPDATE todo 
        SET ${updateProperty} = '${values[0]}'
        WHERE
            id = ${todoId};`;
    const updateResult = await dataBase.run(updateQuery);
    response.send(todoResult.output);
  } else {
    response.status(400);
    response.send(todoResult.error);
  }
});

//API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `DELETE FROM
    todo WHERE id = ${todoId};`;
  const deleteResult = await dataBase.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;

//updateProperty = bodyKeys[0];

//     if (bodyKeys[0] === "dueDate") {
//       response.send("Due Date Updated");
//     } else {
//       response.send(
//         updateProperty[0].toUpperCase() + updateProperty.slice(1) + " Updated"
//       );
//     }
//   } else {
//     response.status(400);
//     response.send("Invalid Todo Status");
//   }
