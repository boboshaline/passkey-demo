// 3. Enum for PublicKeyCredentialType (credential types like passkeys)
export type PublicKeyCredentialType = "public-key";

// 1. Type for PublicKeyCredentialRequestOptions (used for authentication)
export interface PublicKeyCredentialRequestOptions {
  challenge: Uint8Array; // a unique challenge from the server, usually a random Uint8Array
  rpId?: string; // Relying Party ID, typically the domain name
  allowCredentials?: PublicKeyCredentialDescriptor[]; // list of acceptable credentials for the user
  userVerification?: UserVerificationRequirement; // options: 'required', 'preferred', 'discouraged'
  timeout?: number; // optional timeout in milliseconds for the authentication prompt
}

// 2. Type for PublicKeyCredentialDescriptor (defines allowable credentials)
export interface PublicKeyCredentialDescriptor {
  type: PublicKeyCredentialType; // 'public-key' (for passkeys)
  id: ArrayBuffer; // credential ID received during registration
  transports?: AuthenticatorTransport[]; // e.g., ['usb', 'ble', 'nfc', 'internal']
}

// 4. Enum for AuthenticatorTransport (allowed transports for authenticators)
export type AuthenticatorTransport = "usb" | "nfc" | "ble" | "internal";

// 5. Enum for UserVerificationRequirement (specifies user verification level)
export type UserVerificationRequirement =
  | "required"
  | "preferred"
  | "discouraged";

// 6. The WebAuthn API returns an Assertion, which includes authenticator data
export interface AuthenticatorAssertionResponse {
  clientDataJSON: ArrayBuffer; // JSON data that contains the client data
  authenticatorData: ArrayBuffer; // data specific to the authenticator
  signature: ArrayBuffer; // cryptographic signature created by the authenticator
  userHandle?: ArrayBuffer | null; // unique identifier for the user, often null in typical cases
}

// 7. The main type for the `navigator.credentials.get()` response
export interface PublicKeyCredentialWithAssertion extends PublicKeyCredential {
  response: AuthenticatorAssertionResponse; // authenticator response data
}
