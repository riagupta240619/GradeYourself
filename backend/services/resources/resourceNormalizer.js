"use strict";

/**
 * Normalizes resource objects into a standard format.
 *
 * Schema:
 * {
 *   id: string,
 *   title: string,
 *   subject: string,
 *   topic: string,
 *   description: string,
 *   source: "Let's Help Everyone" | "GeeksforGeeks",
 *   sourceUrl: string,
 *   contentType: "notes" | "guide" | "tutorial" | "practice" | "book" | "roadmap" | "exam",
 *   content: string, // Markdown/structured text for native GradeWise reader
 *   tags: string[],
 *   fetchedAt: string
 * }
 */

function generateId(source, subject, topic, title) {
  const sanitize = (str) =>
    String(str || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30);
  return `${sanitize(source)}-${sanitize(subject)}-${sanitize(topic)}-${sanitize(title)}`;
}

function normalizeResource({
  id,
  title,
  subject,
  topic,
  description = "",
  source,
  sourceUrl,
  contentType = "notes",
  content = "",
  tags = [],
}) {
  const cleanSubject = String(subject || "General").trim();
  const cleanTopic = String(topic || "Overview").trim();
  const cleanTitle = String(title || "Untitled Resource").trim();
  const cleanSource = String(source || "External").trim();

  return {
    id: id || generateId(cleanSource, cleanSubject, cleanTopic, cleanTitle),
    title: cleanTitle,
    subject: cleanSubject,
    topic: cleanTopic,
    description: String(description || "").trim(),
    source: cleanSource,
    sourceUrl: String(sourceUrl || "").trim(),
    contentType,
    content: String(content || "").trim(),
    tags: Array.isArray(tags) ? tags : [],
    fetchedAt: new Date().toISOString(),
  };
}

module.exports = {
  normalizeResource,
  generateId,
};
