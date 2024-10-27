import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import "./App.css";

import UserSignUp from "./user-signup";
import PassKeyAuth from "./passkey-demo";
import { Welcome } from "./welcome";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UserSignUp />} />
        <Route path="/passkey" element={<PassKeyAuth />} />
        <Route path="/welcome" element={<Welcome />} />
      </Routes>
    </Router>
  );
}

export default App;
