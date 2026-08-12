"use strict";

/**
 * Resolve the user's grading scale from their profile.
 * Returns "4.0" if the user's semesterSystem contains "4.0", otherwise "10.0".
 *
 * @param {object|null} user - The Mongoose user document (or null).
 * @returns {"4.0"|"10.0"} The resolved grading scale.
 */
function resolveScale(user) {
  return user?.semesterSystem?.includes("4.0") ? "4.0" : "10.0";
}

module.exports = { resolveScale };
