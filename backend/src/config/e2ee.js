/** Global kill switch — set E2EE_ENABLED=false to disable encryption app-wide */
export function isGlobalE2EEEnabled() {
  return process.env.E2EE_ENABLED !== "false";
}

/** Default per-chat E2EE when a new chat is created */
export function getDefaultChatE2EE() {
  if (!isGlobalE2EEEnabled()) return false;
  return process.env.E2EE_DEFAULT_ENABLED !== "false";
}
