import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { v4 as uuidv4 } from "uuid";
import '../styles/Board.css';
import Link from "next/link";

const initialData = {
  todo: {
    title: "To Do",
    tasks: [
      {
        id: "1",
        title: "Finish login page",
        subtasks: ["UI", "Firebase auth"],
        completedSubtasks: [],
      },
      {
        id: "2",
        title: "Setup Firebase",
        subtasks: ["Hosting", "Firestore"],
        completedSubtasks: [],
      },
    ],
  },
  inprogress: {
    title: "In Progress",
    tasks: [],
  },
  completed: {
    title: "Completed",
    tasks: [],
  },
};

export default function Dashboard() {
  const router = useRouter();
  const [columns, setColumns] = useState(initialData);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newSubtasks, setNewSubtasks] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/");
      }
    });
  
    const savedData = localStorage.getItem("kanbanBoard");
    if (savedData) {
      setColumns(JSON.parse(savedData));
    }
  
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem("kanbanBoard", JSON.stringify(columns));
  }, [columns]);

  const handleLogout = () => {
    signOut(auth).then(() => router.push("/"));
  };

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    const sourceCol = columns[source.droppableId];
    const destCol = columns[destination.droppableId];
    const sourceTasks = [...sourceCol.tasks];
    const destTasks = [...destCol.tasks];
    const [movedTask] = sourceTasks.splice(source.index, 1);

    if (source.droppableId === destination.droppableId) {
      sourceTasks.splice(destination.index, 0, movedTask);
      setColumns({
        ...columns,
        [source.droppableId]: {
          ...sourceCol,
          tasks: sourceTasks,
        },
      });
    } else {
      destTasks.splice(destination.index, 0, movedTask);
      setColumns({
        ...columns,
        [source.droppableId]: {
          ...sourceCol,
          tasks: sourceTasks,
        },
        [destination.droppableId]: {
          ...destCol,
          tasks: destTasks,
        },
      });
    }
  };

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    const task = {
      id: uuidv4(),
      title: newTaskTitle,
      subtasks: newSubtasks ? newSubtasks.split(",").map((s) => s.trim()) : [],
      completedSubtasks: [],
    };
    setColumns((prev) => ({
      ...prev,
      todo: {
        ...prev.todo,
        tasks: [...prev.todo.tasks, task],
      },
    }));
    setNewTaskTitle("");
    setNewSubtasks("");
  };

  const toggleSubtask = (taskId, subtask, colId) => {
    const column = columns[colId];
    const updatedTasks = column.tasks.map((task) => {
      if (task.id !== taskId) return task;

      const completed = task.completedSubtasks.includes(subtask)
        ? task.completedSubtasks.filter((s) => s !== subtask)
        : [...task.completedSubtasks, subtask];

      return { ...task, completedSubtasks: completed };
    });

    const updatedTask = updatedTasks.find((task) => task.id === taskId);

    if (
      colId === "inprogress" &&
      updatedTask.completedSubtasks.length === updatedTask.subtasks.length
    ) {
      const filteredInProgress = updatedTasks.filter((t) => t.id !== taskId);
      const updatedCompleted = [
        ...columns.completed.tasks,
        updatedTask,
      ];

      setColumns((prev) => ({
        ...prev,
        inprogress: {
          ...prev.inprogress,
          tasks: filteredInProgress,
        },
        completed: {
          ...prev.completed,
          tasks: updatedCompleted,
        },
      }));
    } else {
      setColumns((prev) => ({
        ...prev,
        [colId]: {
          ...column,
          tasks: updatedTasks,
        },
      }));
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Kanban Board</h1>
      <div style={{ marginBottom: 20 }}>
        <Link href="/calendar">
          <button style={{ marginLeft: 10 }}>View Calendar</button>
        </Link>
      </div>
  
      <div style={{ marginTop: 20, marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Task title"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          style={{ marginRight: 10 }}
        />
        <input
          type="text"
          placeholder="Subtasks (comma separated)"
          value={newSubtasks}
          onChange={(e) => setNewSubtasks(e.target.value)}
          style={{ marginRight: 10 }}
        />
        <button onClick={addTask}>Add Task</button>
      </div>
  
      <div style={{ display: "flex", gap: 20 }}>
        <DragDropContext onDragEnd={onDragEnd}>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            {Object.entries(columns).map(([columnId, column]) => (
              <Droppable key={columnId} droppableId={columnId}>
                {(provided) => (
                  <div
                    className="board-column"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    <h2>{column.title}</h2>
                    {column.tasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided) => (
                          <div
                            className="task-card"
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <h4>{task.title}</h4>
                            {task.subtasks.map((sub, i) => (
                              <div key={i}>
                                <label>
                                  <input
                                    type="checkbox"
                                    checked={task.completedSubtasks.includes(sub)}
                                    onChange={() => toggleSubtask(task.id, sub, columnId)}
                                  />
                                  {sub}
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Logout Button at the bottom-right */}
      <button
        onClick={handleLogout}
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          padding: "10px 20px",
          backgroundColor: "#ff4d4d",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Logout
      </button>
    </div>
  );
}
