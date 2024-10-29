import React, { useState } from "react";
import "./passkey-auth.css";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export function bufferToBase64Url(buffer: ArrayBuffer | null) {
  // Convert ArrayBuffer to a byte array
  if (!buffer) {
    console.log("no public key");
    throw new Error("no public key");
  }
  const bytes = new Uint8Array(buffer);

  // Convert the byte array to a binary string
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  // Encode the binary string to Base64
  const base64 = window.btoa(binary);

  // Convert Base64 to URL-safe Base64 by replacing `+` and `/` and removing `=`
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

//encoding the public key
export function arrayBufferToBase64(buffer: any | null) {
  if (!buffer) {
    console.error("no public key");
    throw new Error("no public key found");
  }
  console.log(buffer, "public key");
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  console.log(window.btoa(binary), "encoded/decoded public key");
  return window.btoa(binary); // Convert binary string to Base64
}

//decoding the id/challenge
export function base64ToArrayBuffer(base64: string) {
  // Replace URL-safe characters
  let standardBase64 = base64
    .replace(/-/g, "+") // Replace '-' with '+'
    .replace(/_/g, "/"); // Replace '_' with '/'

  // Pad the base64 string with `=` if necessary
  const padding = standardBase64.length % 4;
  if (padding === 2) {
    standardBase64 += "=="; // Add two padding characters
  } else if (padding === 3) {
    standardBase64 += "="; // Add one padding character
  }

  // Decode the Base64 string
  const binaryString = window.atob(standardBase64);

  // Create a Uint8Array from the binary string
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes.buffer; // Return the ArrayBuffer
}

const PassKeyAuth = () => {
  const [message, setMessage] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const { id } = location.state || {};
  console.log(id, "id from navigation");
  // const userId = "671e52fa2d175460226d9c8d";
  const register = async () => {
    console.log("Register function started!!!!!!!!!");
    try {
      // Correct the URL to include the slashes
      console.log("Preparing to send the user ID to server.");
      const response = await axios.post(
        "http://localhost:3000/registerRequest",
        {
          userId: id,
        }
      );
      console.log(response, "response from passkey endpoint");

      console.log(JSON.stringify(response.data, null, 2), "data in response");

      if ("data" in response) {
        const dataTodestructure = response.data;

        const publicKey: PublicKeyCredentialCreationOptions = {
          challenge: base64ToArrayBuffer(dataTodestructure.challenge),
          rp: {
            name: dataTodestructure.rp,
          },
          user: {
            id: base64ToArrayBuffer(dataTodestructure.user.id),
            name: dataTodestructure.user.name,
            displayName: dataTodestructure.user.displayName,
          },
          pubKeyCredParams: dataTodestructure.pubKeyCredParams,
          authenticatorSelection: dataTodestructure.authenticatorSelection,
          attestation: "none",
        };

        const credential = (await navigator.credentials.create({
          publicKey,
        })) as PublicKeyCredential;

        console.log(
          JSON.stringify(credential, null, 2),
          "credential from WebAuthn API"
        );

        console.log(
          credential,
          "credential before checking data in credential."
        );
        //   // Send the credentials to the server for registration
        if (credential) {
          // Ensure you have a username or another identifier to send along with the credential

          const attestationResponse =
            credential.response as AuthenticatorAttestationResponse;

          if (!attestationResponse || !attestationResponse.clientDataJSON) {
            console.error(
              "Attestation response is missing required properties."
            );
            return;
          }

          if (!attestationResponse.clientDataJSON) {
            console.log("no client data json");
          }
          if (!credential.response.clientDataJSON) {
            console.error("no client data json");
          }

          const responsePayLoad = {
            id: credential.id,
            rawId: bufferToBase64Url(credential.rawId),
            type: credential.type,
            clientExtensionResults: credential.getClientExtensionResults(),
            credentialPublicKey: bufferToBase64Url(
              attestationResponse.getPublicKey()
            ),
            clientDataJSON: arrayBufferToBase64(
              credential.response.clientDataJSON
            ),
            authenticatorData: attestationResponse.getAuthenticatorData(),
            attestationObject: bufferToBase64Url(
              attestationResponse.attestationObject
            ),
            publicKeyAlgorithm: attestationResponse.getPublicKeyAlgorithm(),
            transports: attestationResponse.getTransports(),
          };
          const userId = id;
          console.log(userId, "id to send to server");
          const storeCredential = await axios.post(
            "http://localhost:3000/registerResponse",
            { response: responsePayLoad, userId }
          );

          console.log(storeCredential, "response from storage");
          setMessage("Registration successful!");
        }
      }

      // // Navigate to the welcome page after successful registration
      navigate("/welcome");
    } catch (error) {
      console.error("Error during registration:", error);
      setMessage("Registration failed!");
    }
  };

  return (
    <div className="div">
      <div className="card">
        <img
          src={require("./assets/fingerprint.jpg")}
          alt="fingerprint"
          className="card-image"
        />
        <div className="card-content">
          <h3 className="card-title">PASSKEY-AUTHENTICATION</h3>
          <p className="card-description">
            Create a passkey for this email.This will ensure security to this
            account and verify it is you.
          </p>
          <div className="button-container">
            <button className="button">CANCEL</button>
            <button className="button" onClick={register}>
              CREATE PASSKEY
            </button>
            {message && <h1>You've canceled passkey authentication.</h1>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassKeyAuth;
