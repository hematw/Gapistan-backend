/** Global kill switch — set VITE_E2EE_ENABLED=false to disable encryption app-wide */
export function isGlobalE2EEEnabled() {
  return import.meta.env.VITE_E2EE_ENABLED !== "false";
}

/** Whether this chat should encrypt/decrypt messages */
export function shouldUseE2EE(chat) {
  if (!isGlobalE2EEEnabled()) return false;
  if (!chat) return false;
  return chat.e2eeEnabled !== false;
}

/** Plaintext for display (encrypted messages use decryptedText) */
export function getMessageDisplayText(message) {
  if (message?.decryptedText) return message.decryptedText;
  if (message?.text && !message?.iv) return message.text;
  return message?.decryptedText ?? message?.text ?? "";
}
