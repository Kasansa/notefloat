import React, { useState, useEffect } from "react";
const { ipcRenderer } = window.require("electron");

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [notePosition, setNotePosition] = useState({ x: 100, y: 100 });
  const [noteSize, setNoteSize] = useState({ width: 300, height: 400 });
  const [isDraggingNote, setIsDraggingNote] = useState(false);
  const [isResizingNote, setIsResizingNote] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [dragOffset, setDragOffset] = useState({ offsetX: 0, offsetY: 0 });

  useEffect(() => {
    const savedTasks = JSON.parse(localStorage.getItem("tasks")) || [];
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTasks(savedTasks);
    setTheme(savedTheme);
  }, []);

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
    localStorage.setItem("theme", theme);
  }, [tasks, theme]);

  const addTask = () => {
    if (newTask.trim() !== "") {
      setTasks([...tasks, newTask]);
      setNewTask("");
    }
  };

  const deleteTask = (index) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleDragBarMouseDown = (e) => {
    setIsDraggingNote(true);
    setDragOffset({
      offsetX: e.clientX - notePosition.x,
      offsetY: e.clientY - notePosition.y,
    });
  };

  const handleMouseMove = (e) => {
    if (isDraggingNote) {
      setNotePosition({
        x: e.clientX - dragOffset.offsetX,
        y: e.clientY - dragOffset.offsetY,
      });
    } else if (isResizingNote) {
      setNoteSize({
        width: Math.max(200, e.clientX - notePosition.x),
        height: Math.max(200, e.clientY - notePosition.y),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDraggingNote(false);
    setIsResizingNote(false);
  };

  const handleMouseEnter = () => {
    ipcRenderer.send("set-ignore-mouse-events", false);
  };

  const handleMouseLeave = () => {
    ipcRenderer.send("set-ignore-mouse-events", true);
  };

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingNote, isResizingNote]);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Floating Button */}
      <div
        className="cursor-grab fixed"
        style={{
          top: 20,
          left: 20,
          zIndex: 1000,
          WebkitAppRegion: "drag",
                cursor: isDraggingNote ? "grabbing" : "grab",
        }}
      >
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
          onClick={() => setIsVisible(!isVisible)}
          onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
          📝
        </button>
      </div>

      {/* Notepad and Settings Container */}
      {isVisible && (
        <div className="flex ">
          {/* Main Note Window */}
          <div
            className={`absolute shadow-lg rounded-xl  ${
              theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black"
            }`}
            style={{
              top: notePosition.y,
              left: notePosition.x,
              width: noteSize.width,
              height: noteSize.height,
              display: "flex",
              flexDirection: "column",
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* Drag Bar */}
            <div
              className="cursor-grab p-2 flex items-center justify-between rounded-xl "
              onMouseDown={handleDragBarMouseDown}
              style={{
                backgroundColor: theme === "dark" ? "#333" : "#f0f0f0",
                cursor: isDraggingNote ? "grabbing" : "grab",
              }}
            >
              <h1 className="text-lg font-bold font">NoteFloat</h1>
              <button
                className={`hover:bg-blue-700 text-white rounded-full w-12 h-6 flex items-center justify-center shadow-lg ${
                  theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black"
                }`}
                onClick={() => setIsSettingsVisible(!isSettingsVisible)}
              >
                ⚙️
              </button>
            </div>

            {/* Task List */}
            <div
              className="flex-1 overflow-y-auto p-4 anime"
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <ul className="mb-4 space-y-2">
                {tasks.map((task, index) => (
                  <li
                    key={index}
                    className={`p-2 rounded flex justify-between items-center ${
                      theme === "dark" ? "bg-gray-800" : "bg-gray-200"
                    }`}
                  >
                    {task}
                    <button
                      className="text-red-500 hover:text-red-700"
                      onClick={() => deleteTask(index)}
                    >
                      ✖
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  className={`flex-1 p-2 rounded ${
                    theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-300"
                  }`}
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="New task..."
                  onKeyPress={(e) => {
                    if (e.key === "Enter") addTask();
                  }}
                />
                <button
                  className="bg-blue-500 hover:scale-105 text-white px-3 py-2 rounded"
                  onClick={addTask}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Resize Handle */}
            <div
              className="absolute bottom-0 right-0 cursor-se-resize"
              style={{
                width: "20px",
                height: "20px",
                backgroundColor: "transparent",
              }}
              onMouseDown={(e) => setIsResizingNote(true)}
            ></div>
          </div>

          {/* Settings Panel */}
          {isSettingsVisible && (
            <div
              className={`absolute shadow-lg rounded-md transition-opacity duration-200 ${
                theme === "dark" ? "bg-gray-800 text-white" : "bg-gray-200 text-black"
              }`}
              style={{
                top: notePosition.y,
                left: notePosition.x + noteSize.width + 10,
                width: 200,
                opacity: isSettingsVisible ? 1 : 0,
              }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div className="p-4">
                <h2 className="text-lg font-bold mb-4">Settings</h2>
                <div className="space-y-4">
                  <label className="flex items-center justify-between">
                    <span>Theme</span>
                    <div className="flex items-center space-x-2">
                      <span>{theme === "dark" ? "Dark" : "Light"}</span>
                      <button
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className={`w-12 h-6 rounded-full relative ${
                          theme === "dark" ? "bg-cyan-600" : "bg-gray-400"
                        }`}
                      >
                        <div
                          className={`absolute w-4 h-4 rounded-full bg-white top-1 transition-transform ${
                            theme === "dark" ? "translate-x-7" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;