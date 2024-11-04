import React, { useState } from "react";
import axios from "axios";
import "./user-signup.css";
import { useNavigate } from "react-router-dom";
import { PublicKeyCredentialWithAssertion } from "./types/passkey";

import { isoBase64URL } from "@simplewebauthn/server/helpers";
import {
  base64URLStringToBuffer,
  bufferToBase64URLString,
} from "@simplewebauthn/browser";

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

  const navigate = useNavigate();

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    // Handle form submission logic here
    try {
      if (username && email) {
        const personalInfo = {
          email: email,
          userName: username,
        };
        // Send personalInfo as the request body and headers separately
        const response = await axios.post(
          "http://localhost:3000/signup",
          personalInfo
        ); // Pass headers as a separate parameter

        console.log(response.data, "response from server");
        if ("error" in response) {
          console.log(
            JSON.stringify(response.error, null, 2),
            "error in request"
          );
        }
        if (response.data.userId) {
          navigate(`/passkey`, { state: { id: response.data.userId } });
        } else {
          console.error("User ID not found in the response");
        }
      }
    } catch (error) {
      console.error(error, "error in user-sign up");
    }
  };

  async function login() {
    const abortController = new AbortController();
    //prompt for email
    const email = window.prompt("Please enter your email");
    console.log(email, "email from prompt");
    //prompt for username
    const username = window.prompt("Please enter your username");
    console.log(username, "username from prompt");
    if (email && username) {
      setEmail(email);
      setUsername(username);
    } else {
      console.log("no data provided.");
    }
    if (!email) throw new Error("no data provided");
    if (!username) throw new Error("no data provided");

    const userData = {
      email: email,
      userName: username,
    };

    try {
      console.log(userData, "data to send to backend");
      const storedResponse = await axios.post("http://localhost:3000/signup");
      console.log(
        JSON.stringify(storedResponse, null, 2),
        "stored response from backend"
      );

      if ("data" in storedResponse) {
        const userId = storedResponse.data.userId;
        console.log(userId, "userId from backend");
        //fetch challenge and options from backend
        const response = await axios.post(
          "http://localhost:3000/signinRequest",
          { userId },
          {
            withCredentials: true,
          }
        );
        console.log(
          JSON.stringify(response.data),
          "response from login request"
        );
        if ("data" in response) {
          const publicKey: PublicKeyCredentialRequestOptions = {
            challenge: base64URLStringToBuffer(response.data.challenge),
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
          const newData = new Uint8Array(assertion.response.authenticatorData);
          const newSignature = new Uint8Array(assertion.response.signature);
          if (assertion) {
            const responseToSend = {
              id: assertion.id,
              rawId: bufferToBase64URLString(assertion.rawId),
              response: {
                clientDataJSON: bufferToBase64URLString(
                  assertion.response.clientDataJSON
                ),
                authenticatorData: isoBase64URL.fromBuffer(newData),
                userHandle: bufferToBase64URLString(
                  assertion.response.userHandle
                ),
                signature: isoBase64URL.fromBuffer(newSignature),
              },
              authenticatorAttachment: assertion.authenticatorAttachment,
              type: assertion.type,
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
              },
              { withCredentials: true }
            );
            console.log(result, "result from saving to server");
          }
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
            onChange={(e) => [setEmail(e.target.value)]}
            placeholder="Enter your email"
            autoComplete="email webauthn"
          />
          <label className="label">Username</label>
          <input
            className="input"
            type="text"
            name="username"
            value={username}
            onChange={(e) => [setUsername(e.target.value)]}
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
