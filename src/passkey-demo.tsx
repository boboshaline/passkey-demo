import React, { useState } from "react";
import "./passkey-auth.css";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  bufferToBase64URLString,
  base64URLStringToBuffer,
} from "@simplewebauthn/browser";

const PassKeyAuth = () => {
  const [message, setMessage] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const { id } = location.state || {};
  console.log(id, "id from navigation");

  const register = async () => {
    console.log("Register function started!!!!!!!!!");
    try {
      // Correct the URL to include the slashes
      console.log("Preparing to send the user ID to server.");
      const response = await axios.post(
        "https://passkey-6.onrender.com/registerRequest",
        {
          userId: id,
        }
      );
      console.log(response, "response from passkey endpoint");

      console.log(JSON.stringify(response.data, null, 2), "data in response");

      if ("data" in response) {
        const dataTodestructure = response.data;

        const publicKey: PublicKeyCredentialCreationOptions = {
          challenge: base64URLStringToBuffer(dataTodestructure.challenge),
          rp: {
            name: dataTodestructure.rp,
          },
          user: {
            id: base64URLStringToBuffer(dataTodestructure.user.id),
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
          console.log(
            attestationResponse.clientDataJSON,
            "client data json to be sent"
          );
          const destPubKey = attestationResponse.getPublicKey();
          if (!destPubKey)
            throw new Error("=============no public key================");

          const publicKeyArrayBuffer = attestationResponse.getPublicKey();

          if (!publicKeyArrayBuffer) {
            throw new Error("Public key not available in attestation response");
          }

          const responsePayLoad = {
            id: credential.id,
            rawId: bufferToBase64URLString(credential.rawId),
            type: credential.type,
            response: {
              clientDataJSON: bufferToBase64URLString(
                attestationResponse.clientDataJSON
              ),
              attestationObject: bufferToBase64URLString(
                attestationResponse.attestationObject
              ),
            },
            clientExtensionResults: credential.getClientExtensionResults(),
            credentialPublicKey: bufferToBase64URLString(publicKeyArrayBuffer),
            authenticatorData: attestationResponse.getAuthenticatorData(),
            publicKeyAlgorithm: attestationResponse.getPublicKeyAlgorithm(),
            transports: attestationResponse.getTransports(),
          };
          console.log(
            responsePayLoad.response.clientDataJSON,
            "client data json in object"
          );
          const userId = id;
          console.log(userId, "id to send to server");
          const storeCredential = await axios.post(
            "https://passkey-6.onrender.com/registerResponse",
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
