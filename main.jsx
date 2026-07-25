import React from "react";
import ReactDOM from "react-dom/client";
import "./storage.js"; // must run before App so window.storage exists
import "./index.css";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
