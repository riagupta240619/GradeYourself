"use strict";

const GitHubLink = require("../models/github-link-model");
const User = require("../models/user-model");

// Helper: resolve the backend API base
function resolveApiBase() {
  const raw = (globalThis?.process?.env?.VITE_API_URL || "").trim();
  if (!raw) return "http://localhost:5000/api";
  const clean = raw.replace(/\/+$/, "");
  if (clean.endsWith("/api")) return clean;
  return `${clean}/api`;
}

/**
 * GET /api/github/authorize
 * Generates the GitHub OAuth authorization URL.
 */
async function getAuthUrl(req, res) {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID || "";
    const redirectUri = req.query.redirect_uri || `${resolveApiBase()}/github/callback`;
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo%20user`;
    res.json({ authUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * POST /api/github/token
 * Exchanges the OAuth code for a GitHub access token.
 */
async function exchangeCodeForToken(req, res) {
  try {
    const { code, redirectUri } = req.body;
    if (!code) {
      return res.status(400).json({ message: "OAuth code is required" });
    }

    const clientId = process.env.GITHUB_CLIENT_ID || "";
    const clientSecret = process.env.GITHUB_CLIENT_SECRET || "";

    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await response.json();
    if (data.error) {
      return res.status(400).json({ message: data.error_description || data.error });
    }

    // Fetch GitHub username
    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${data.access_token}`, "User-Agent": "GradeWise-AI" },
    });
    const userData = await userRes.json();

    res.json({ token: data.access_token, username: userData.login || "" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * GET /api/github/repos
 * Fetches the authenticated user's repositories.
 */
async function fetchUserRepos(req, res) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "") || "";
    const { search } = req.query;

    if (!token) {
      return res.status(401).json({ message: "GitHub access token required" });
    }

    const ghRes = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100", {
      headers: { Authorization: `Bearer ${token}`, "User-Agent": "GradeWise-AI" },
    });
    let repos = await ghRes.json();

    if (!Array.isArray(repos)) {
      return res.status(400).json({ message: repos.message || "Failed to fetch repositories" });
    }

    if (search) {
      const q = String(search).toLowerCase();
      repos = repos.filter((r) => r.name.toLowerCase().includes(q) || (r.description && r.description.toLowerCase().includes(q)));
    }

    res.json(repos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * POST /api/github/link
 * Links a GitHub repository to a subject/semester.
 */
async function linkRepoToSubject(req, res) {
  try {
    const userId = req.user?._id;
    const { subjectId, semesterId, repoFullName, repoName, htmlUrl, isPublic, repoDescription, stars } = req.body;

    if (!repoFullName || !repoName) {
      return res.status(400).json({ message: "Repository fullName and name are required" });
    }

    const linkedRepo = await GitHubLink.create({
      user: userId,
      repoFullName,
      repoName,
      htmlUrl: htmlUrl || `https://github.com/${repoFullName}`,
      subjectId: subjectId || null,
      semesterId: semesterId || null,
      isPublic: Boolean(isPublic),
      repoDescription: repoDescription || "",
      stars: stars || 0,
    });

    res.status(201).json(linkedRepo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * GET /api/github/linked
 * Retrieves all linked repositories for a specific subject or semester.
 */
async function getLinkedRepos(req, res) {
  try {
    const userId = req.user?._id;
    const { subjectId, semesterId } = req.query;

    const query = { user: userId };
    if (subjectId) query.subjectId = subjectId;
    if (semesterId) query.semesterId = semesterId;

    const linkedRepos = await GitHubLink.find(query).sort({ linkedAt: -1 });
    res.json(linkedRepos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * DELETE /api/github/link/:linkId
 * Unlinks a GitHub repository from a subject/semester.
 */
async function unlinkRepo(req, res) {
  try {
    const userId = req.user?._id;
    const { linkId } = req.params;

    const result = await GitHubLink.deleteOne({ _id: linkId, user: userId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Linked repository not found" });
    }

    res.json({ success: true, message: "Repository unlinked successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * GET /api/github/linked/check
 * Checks if a GitHub repo is already linked to a subject/semester.
 */
async function isRepoLinked(req, res) {
  try {
    const userId = req.user?._id;
    const { repo, subjectId, semesterId } = req.query;

    const query = { user: userId, repoFullName: String(repo) };
    if (subjectId) query.subjectId = subjectId;
    if (semesterId) query.semesterId = semesterId;

    const count = await GitHubLink.countDocuments(query);
    res.json({ linked: count > 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * GET /api/github/repos/:fullName
 * Fetches detailed information about a specific GitHub repository.
 */
async function getRepoDetails(req, res) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "") || "";
    const fullName = req.params.fullName;

    const ghRes = await fetch(`https://api.github.com/repos/${fullName}`, {
      headers: token ? { Authorization: `Bearer ${token}`, "User-Agent": "GradeWise-AI" } : { "User-Agent": "GradeWise-AI" },
    });

    const repoDetails = await ghRes.json();
    res.json(repoDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * PATCH /api/github/link/:linkId/visibility
 * Updates the public/private status of a linked repo.
 */
async function updateLinkVisibility(req, res) {
  try {
    const userId = req.user?._id;
    const { linkId } = req.params;
    const { isPublic } = req.body;

    const updatedLink = await GitHubLink.findOneAndUpdate(
      { _id: linkId, user: userId },
      { isPublic: Boolean(isPublic) },
      { new: true }
    );

    if (!updatedLink) {
      return res.status(404).json({ message: "Linked repository not found" });
    }

    res.json(updatedLink);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  getAuthUrl,
  exchangeCodeForToken,
  fetchUserRepos,
  linkRepoToSubject,
  getLinkedRepos,
  unlinkRepo,
  isRepoLinked,
  getRepoDetails,
  updateLinkVisibility,
};