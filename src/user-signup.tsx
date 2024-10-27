import React, { useState } from "react";
import axios from "axios";
import "./user-signup.css";
import { useNavigate } from "react-router-dom";

const SignupForm = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [userId, setUserId] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    // Handle form submission logic here
    try {
      if (username && email) {
        const headers = {
          "Content-Type": "application/json", // Specify the content type
        };
        const personalInfo = {
          email: email,
          userName: username,
        };
        // Send personalInfo as the request body and headers separately
        const response = await axios.post(
          "http://localhost:3000/signup",
          personalInfo
        ); // Pass headers as a separate parameter
        setUserId(response.data.id);
        console.log(response.data, "response from server");
        if ("error" in response) {
          console.log(
            JSON.stringify(response.error, null, 2),
            "error in request"
          );
        }
        // Navigate after successful response
        navigate(`/passkey`, { state: { userId } });
      }
    } catch (error) {
      console.error(error, "error in user-sign up");
    }
  };

  return (
    <div className="body">
      <div className="form-container">
        <h1 className="h1">Sign Up</h1>
        <form className="form" onSubmit={handleSubmit}>
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
          <label className="label">Username</label>
          <input
            className="input"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
          />
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />
          <button className="button" type="submit">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignupForm;
