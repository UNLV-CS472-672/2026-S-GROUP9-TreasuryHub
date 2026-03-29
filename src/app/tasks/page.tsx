"use client";

import { useState } from "react";

/*
  This defines what a Task looks like in our app.
  I added:
  - type: what kind of task it is
  - assignType: whether it is assigned to a role or an individual
  - assignedTo: the actual role/member name
  - dueDate: optional due date
*/
type Task = {
  id: number;
  title: string;
  type: string;
  assignType: "role" | "individual";
  assignedTo: string;
  dueDate?: string;
};

/*
  These are our sample existing roles and members.
  For now they are hardcoded, but later these could come from a database.
*/
const existingRoles = ["Officer", "Treasurer", "Secretary", "Member"];
const existingMembers = ["Prabh", "Enrique", "Mathew", "Danilo", "Keith", "Tracy", "Ricardo", "Kaley", "Miguel", "Xae"];

/*
  This is a fake current user role for frontend testing.
  The UC says only officer-level or above can create/edit/delete tasks.
*/
const currentUserRole = "Officer";

/*
  Helper function to check if the current user has permission.
  For this frontend version, officer and treasurer are allowed.
*/
function hasOfficerAccess(role: string) {
  return role === "Officer" || role === "Treasurer";
}

export default function TasksPage() {
  // stores all tasks
  const [tasks, setTasks] = useState<Task[]>([]);

  // stores form input values
  const [title, setTitle] = useState("");
  const [taskType, setTaskType] = useState("TODO");
  const [assignType, setAssignType] = useState<"role" | "individual">("role");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");

  /*
    FUNCTION: isValidFutureDate
    Checks if the selected date is a valid future date.
    The UC says due date must be a valid future date if it is provided.
  */
  const isValidFutureDate = (dateString: string) => {
    if (!dateString) return true; // due date is optional

    const selectedDate = new Date(dateString);
    const today = new Date();

    // set time to midnight so comparison is only by date, not by hours/minutes
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    return selectedDate > today;
  };

  /*
    FUNCTION: isValidAssignment
    Makes sure the selected role or member actually exists.
    This is part of the validation requirement in the UC.
  */
  const isValidAssignment = () => {
    if (assignType === "role") {
      return existingRoles.includes(assignedTo);
    } else {
      return existingMembers.includes(assignedTo);
    }
  };

  /*
    FUNCTION: addTask
    - checks permissions
    - validates title
    - validates due date
    - validates assignment
    - creates the task and adds it to the list
  */
  const addTask = () => {
    // only officer-level or above can do this
    if (!hasOfficerAccess(currentUserRole)) {
      alert("Only officer-level users or above can create tasks.");
      return;
    }

    if (!title.trim()) {
      alert("Task title is required.");
      return;
    }

    if (!assignedTo) {
      alert("Please assign the task to a role or individual.");
      return;
    }

    if (!isValidAssignment()) {
      alert("Task must be assigned to an existing role or member.");
      return;
    }

    if (!isValidFutureDate(dueDate)) {
      alert("Due date must be a valid future date.");
      return;
    }

    const newTask: Task = {
      id: Date.now(),
      title,
      type: taskType,
      assignType,
      assignedTo,
      dueDate,
    };

    setTasks([...tasks, newTask]);

    // clear form after adding
    setTitle("");
    setTaskType("TODO");
    setAssignType("role");
    setAssignedTo("");
    setDueDate("");
  };

  /*
    FUNCTION: editTask
    Lets the user edit all main task fields.
    I used prompt() to keep it simple and beginner-friendly.
  */
  const editTask = (id: number) => {
    if (!hasOfficerAccess(currentUserRole)) {
      alert("Only officer-level users or above can edit tasks.");
      return;
    }

    const taskToEdit = tasks.find((task) => task.id === id);
    if (!taskToEdit) return;

    const newTitle = prompt("Edit task title:", taskToEdit.title);
    if (!newTitle || !newTitle.trim()) {
      alert("Task title cannot be empty.");
      return;
    }

    const newType = prompt(
      "Edit task type (TODO, EVENT, INVOICE, PAYROLL, PAYMENT, FUNDRAISER, MEETING):",
      taskToEdit.type
    );
    if (!newType || !newType.trim()) {
      alert("Task type cannot be empty.");
      return;
    }

    const newAssignTypeInput = prompt(
      "Assign to 'role' or 'individual':",
      taskToEdit.assignType
    );

    if (
      newAssignTypeInput !== "role" &&
      newAssignTypeInput !== "individual"
    ) {
      alert("Assignment type must be either 'role' or 'individual'.");
      return;
    }

    const newAssignedTo = prompt(
      `Enter existing ${newAssignTypeInput}:`,
      taskToEdit.assignedTo
    );

    if (!newAssignedTo || !newAssignedTo.trim()) {
      alert("Assigned value cannot be empty.");
      return;
    }

    // validate edited assignment
    if (
      (newAssignTypeInput === "role" &&
        !existingRoles.includes(newAssignedTo)) ||
      (newAssignTypeInput === "individual" &&
        !existingMembers.includes(newAssignedTo))
    ) {
      alert("Task must be assigned to an existing role or member.");
      return;
    }

    const newDueDate = prompt(
      "Edit due date in YYYY-MM-DD format (leave blank for no due date):",
      taskToEdit.dueDate || ""
    );

    if (newDueDate && !isValidFutureDate(newDueDate)) {
      alert("Due date must be a valid future date.");
      return;
    }

    setTasks(
      tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              title: newTitle,
              type: newType,
              assignType: newAssignTypeInput,
              assignedTo: newAssignedTo,
              dueDate: newDueDate || "",
            }
          : task
      )
    );
  };

  /*
    FUNCTION: deleteTask
    Removes a task from the list
  */
  const deleteTask = (id: number) => {
    if (!hasOfficerAccess(currentUserRole)) {
      alert("Only officer-level users or above can delete tasks.");
      return;
    }

    setTasks(tasks.filter((task) => task.id !== id));
  };

  /*
    FUNCTION: getAlert
    Shows an alert label based on the due date.
    Since due dates must be future dates, this will mainly show:
    - due soon
    - upcoming
  */
  function getAlert(dueDate?: string) {
    if (!dueDate) return "";

    const today = new Date();
    const due = new Date(dueDate);

    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const diff = Math.floor(
      (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diff === 1) return "🟡 DUE TOMORROW";
    if (diff <= 3) return "🟢 UPCOMING";
    return "";
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Task List</h1>

      {/* showing current user role just for demo/testing */}
      <p>
        <strong>Current User Role:</strong> {currentUserRole}
      </p>

      {/* INPUT SECTION */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "400px" }}>
        {/* task title */}
        <input
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* task type dropdown */}
        <select value={taskType} onChange={(e) => setTaskType(e.target.value)}>
          <option value="TODO">To-Do</option>
          <option value="EVENT">Event</option>
          <option value="INVOICE">Invoice Due Date</option>
          <option value="PAYROLL">Payroll Deadline</option>
          <option value="PAYMENT">Scheduled Payment</option>
          <option value="FUNDRAISER">Fundraiser</option>
          <option value="MEETING">Meeting</option>
        </select>

        {/* choose whether assignment is to a role or individual */}
        <select
          value={assignType}
          onChange={(e) =>
            setAssignType(e.target.value as "role" | "individual")
          }
        >
          <option value="role">Assign to Role</option>
          <option value="individual">Assign to Individual</option>
        </select>

        {/* assignment dropdown changes depending on assignType */}
        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
        >
          <option value="">Select Assignment</option>

          {assignType === "role"
            ? existingRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))
            : existingMembers.map((member) => (
                <option key={member} value={member}>
                  {member}
                </option>
              ))}
        </select>

        {/* optional due date */}
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />

        {/* add task button */}
        <button onClick={addTask}>Add Task</button>
      </div>

      {/* TASK LIST */}
      <ul style={{ marginTop: "20px" }}>
        {tasks.map((task) => (
          <li
            key={task.id}
            style={{
              marginBottom: "12px",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "8px",
            }}
          >
            {/* main task info */}
            <strong>{task.title}</strong>
            <div>Type: {task.type}</div>
            <div>
              Assigned {task.assignType === "role" ? "Role" : "Individual"}:{" "}
              {task.assignedTo}
            </div>

            {task.dueDate && <div>Due: {task.dueDate}</div>}

            <div>{getAlert(task.dueDate)}</div>

            {/* action buttons */}
            <button
              onClick={() => deleteTask(task.id)}
              style={{ marginTop: "8px", marginRight: "8px" }}
            >
              Delete
            </button>

            <button
              onClick={() => editTask(task.id)}
              style={{ marginTop: "8px" }}
            >
              Edit
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}