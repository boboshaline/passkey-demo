import React, { useState } from "react";
import axios from "axios";
import "./user-signup.css";
import { useNavigate } from "react-router-dom";
import { PublicKeyCredentialWithAssertion } from "./types/passkey";
import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  bufferToBase64Url,
} from "./passkey-demo";

function decodeArrayBuffer(buffer: any) {
  // Create a new TextDecoder instance
  const decoder = new TextDecoder("utf-8"); // You can specify different encoding if needed
  // Decode the ArrayBuffer to a string
  console.log(decoder.decode(buffer), "decoded user handle");
  return decoder.decode(buffer);
}
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
        setUserId(response.data.userId);
        console.log(response.data, "response from server");
        if ("error" in response) {
          console.log(
            JSON.stringify(response.error, null, 2),
            "error in request"
          );
        }
        if (response.data.userId) {
          // Navigate after successful response using the ID directly from response
          navigate(`/passkey`, { state: { id: response.data.userId } });
        } else {
          console.error("User ID not found in the response");
        }

        // Navigate after successful response
        // navigate(`/passkey`, { state: { id: userId } });
      }
    } catch (error) {
      console.error(error, "error in user-sign up");
    }
  };

  async function login() {
    const abortController = new AbortController();

    try {
      //fetch challenge and options from backend
      const response = await axios.post("http://localhost:3000/signinRequest");
      console.log(JSON.stringify(response.data), "response from login request");

      if ("data" in response) {
        const publicKey: PublicKeyCredentialRequestOptions = {
          challenge: base64ToArrayBuffer(response.data.challenge),
          allowCredentials: response.data.allowCredentials,
          rpId: response.data.rpId,
          userVerification: "required",
        };
        const assertion = (await navigator.credentials.get({
          publicKey,
          signal: abortController.signal,
          mediation: "required",
        })) as PublicKeyCredentialWithAssertion;
        console.log(
          JSON.stringify(assertion, null, 2),
          "response from login with passkeys"
        );
        console.log(assertion, "assertion from web authn");
        if (!assertion.response.userHandle)
          throw new Error("no user handle provided");
        console.log(
          decodeArrayBuffer(assertion.response.userHandle),
          "user handle encoded"
        );

        if (assertion) {
          const responseToSend = {
            id: base64ToArrayBuffer(assertion.id),
            rawId: bufferToBase64Url(assertion.rawId),
            clientDataJSON: arrayBufferToBase64(
              assertion.response.clientDataJSON
            ),
            authenticatorAttachment: assertion.authenticatorAttachment,
            signature: arrayBufferToBase64(assertion.response.signature),
            type: assertion.type,
            userHandle: arrayBufferToBase64(assertion.response.userHandle),
            authenticatorData: assertion.response.authenticatorData,
          };
          const id = decodeArrayBuffer(assertion.response.userHandle);
          console.log(
            responseToSend,
            "---------------------response to send to server----------------------------------------"
          );
          const result = await axios.post(
            "http://localhost:3000/signinResponse",
            {
              response: responseToSend,
              userId: id,
            }
          );
          console.log(result, "result from saving to server");
        }
      }
      navigate("/welcome");
    } catch (error: any) {
      console.error(error, "error from login with passkeys.");
      if (error.name === "AbortError") {
        console.error("Credential request was aborted.");
      } else {
        console.error("An error occurred during credential retrieval:", error);
      }
    }
  }

  return (
    <div className="body">
      <div className="form-container">
        <h1 className="h1">Sign Up</h1>
        <form className="form" onSubmit={handleSubmit}>
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            autoComplete="email webauthn"
          />
          <label className="label">Username</label>
          <input
            className="input"
            type="text"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            autoComplete="username webauthn"
          />

          <button className="button" type="submit">
            Submit
          </button>
          <p>Already have an account?Click the login button</p>
          <button className="button" onClick={login}>
            LOGIN
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignupForm;
