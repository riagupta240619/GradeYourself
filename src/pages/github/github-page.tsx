import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  GitBranch,
  Star,
  ExternalLink,
  Search,
  CheckCircle2,
  Lock,
  Sparkles,
  RefreshCw,
  GitFork,
  BookOpen,
  Sliders,
  CheckSquare,
  Square,
  LogOut,
  Users,
  Code2,
} from "lucide-react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/utils/cn";

interface GitHubAccount {
  username: string;
  profileUrl: string;
  avatarUrl?: string;
  name?: string;
  bio?: string;
  publicRepos: number;
  followers: number;
  following: number;
  connectedAt?: string;
  featuredCount?: number;
}

interface RepositoryItem {
  id: number;
  name: string;
  fullName: string;
  description: string;
  language: string;
  stars: number;
  updatedAt: string;
  htmlUrl: string;
  isFeatured: boolean;
}

export function GitHubPage() {
  const navigate = useNavigate();
  const [account, setAccount] = useState<GitHubAccount | null>(null);
  const [repos, setRepos] = useState<RepositoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyFeatured, setOnlyFeatured] = useState(false);

  // Connect Form State
  const [connectUsername, setConnectUsername] = useState("");
  const [connectToken, setConnectToken] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  const loadGitHub = async () => {
    try {
      setLoading(true);
      const [statusRes, reposRes] = await Promise.all([
        api.get("/github/status"),
        api.get("/github/repos"),
      ]);

      if (statusRes.data.connected) {
        setAccount(statusRes.data.account);
      } else {
        setAccount(null);
      }
      setRepos(reposRes.data.repos || []);
    } catch (err) {
      console.error("GitHub load error:", err);
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadGitHub();
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectUsername.trim()) {
      toast.error("Please provide your GitHub username");
      return;
    }

    try {
      setIsConnecting(true);
      const res = await api.post("/github/connect", {
        username: connectUsername.trim(),
        token: connectToken.trim() || undefined,
      });

      toast.success(res.data.message || "GitHub connected!");
      setConnectUsername("");
      setConnectToken("");
      await loadGitHub();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to connect GitHub");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect GitHub?")) return;
    try {
      await api.post("/github/disconnect");
      toast.success("GitHub account disconnected");
      setAccount(null);
      await loadGitHub();
    } catch (err) {
      toast.error("Failed to disconnect");
    }
  };

  const handleToggleFeatured = async (repo: RepositoryItem) => {
    try {
      const nextFeatured = !repo.isFeatured;
      await api.post("/github/featured", {
        repoFullName: repo.fullName,
        repoName: repo.name,
        htmlUrl: repo.htmlUrl,
        repoDescription: repo.description,
        language: repo.language,
        stars: repo.stars,
        isFeatured: nextFeatured,
      });

      toast.success(
        nextFeatured
          ? `Marked "${repo.name}" as Featured Project`
          : `Removed "${repo.name}" from Featured Projects`
      );

      setRepos((prev) =>
        prev.map((r) => (r.fullName === repo.fullName ? { ...r, isFeatured: nextFeatured } : r))
      );
    } catch (err) {
      toast.error("Failed to update featured project");
    }
  };

  const filteredRepos = repos.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.language.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFeatured = onlyFeatured ? r.isFeatured : true;
    return matchesSearch && matchesFeatured;
  });

  const featuredProjects = repos.filter((r) => r.isFeatured);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
              <GitBranch size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                GitHub Integration
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                Connect your account, browse repositories, designate Featured Projects, and generate interview project deep-dives.
              </p>
            </div>
          </div>
        </div>

        {account && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            className="border-red-200 text-red-600 hover:bg-red-50 text-xs"
          >
            <LogOut size={14} className="mr-1.5" />
            Disconnect GitHub
          </Button>
        )}
      </div>

      {/* 3.1 & 3.2: Account Connection Banner & Profile */}
      {!account ? (
        <div className="surface-card rounded-2xl p-6 relative overflow-hidden">
          <div className="max-w-xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 px-3 py-1 text-xs font-semibold">
              <GitBranch size={13} />
              <span>Connect Developer Profile</span>
            </div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Link Your GitHub Account
            </h2>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Connect your GitHub profile to showcase repositories, select Featured Projects for your portfolio,
              and integrate with Interview Preparation for technical project questions.
            </p>

            <form onSubmit={handleConnect} className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  required
                  placeholder="GitHub Username (e.g. riagupta240619)"
                  value={connectUsername}
                  onChange={(e) => setConnectUsername(e.target.value)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] px-3 py-2 text-xs text-[var(--text-primary)] outline-hidden focus:border-purple-600 flex-1"
                />
                <Button
                  type="submit"
                  disabled={isConnecting}
                  className="bg-purple-600 text-xs font-semibold text-white hover:bg-purple-700"
                >
                  {isConnecting ? "Connecting..." : "Connect Account"}
                </Button>
              </div>
              <p className="text-[10px] text-[var(--text-tertiary)]">
                GradeWise uses official public GitHub APIs. Your credentials and privacy remain isolated to your account.
              </p>
            </form>
          </div>
        </div>
      ) : (
        /* Profile Showcase Card */
        <div className="surface-card rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={account.avatarUrl || `https://github.com/${account.username}.png`}
                alt={account.username}
                className="h-16 w-16 rounded-2xl border border-[var(--border)] object-cover shadow-sm"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">
                    {account.name || account.username}
                  </h2>
                  <span className="rounded-full bg-emerald-500/10 text-emerald-600 px-2 py-0.5 text-[10px] font-bold">
                    Connected
                  </span>
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400 font-mono">
                  @{account.username}
                </p>
                {account.bio && (
                  <p className="mt-1 text-xs text-[var(--text-secondary)] line-clamp-2 max-w-md">
                    {account.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Profile Metrics */}
            <div className="flex items-center gap-6 border-t sm:border-t-0 sm:border-l border-[var(--border)] pt-3 sm:pt-0 sm:pl-6">
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] block">
                  Public Repos
                </span>
                <span className="text-xl font-extrabold text-[var(--text-primary)]">
                  {account.publicRepos}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] block">
                  Followers
                </span>
                <span className="text-xl font-extrabold text-[var(--text-primary)]">
                  {account.followers}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] block">
                  Featured Projects
                </span>
                <span className="text-xl font-extrabold text-purple-600 dark:text-purple-400">
                  {featuredProjects.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3.4 FEATURED PROJECTS SECTION */}
      {featuredProjects.length > 0 && (
        <div className="surface-card rounded-2xl p-6 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="text-purple-600" size={18} />
              <h3 className="font-bold text-sm text-[var(--text-primary)]">
                Featured Projects ({featuredProjects.length})
              </h3>
            </div>
            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
              Available in Interview Hub for Architecture Deep-Dives
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProjects.map((repo) => (
              <div
                key={repo.fullName}
                className="rounded-xl border border-purple-500/30 bg-[var(--bg-surface)] p-4 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-purple-500/10 text-purple-600 px-2 py-0.5 text-[10px] font-bold">
                      {repo.language || "Project"}
                    </span>
                    <button
                      onClick={() => handleToggleFeatured(repo)}
                      className="text-purple-600 hover:text-purple-700"
                      title="Unmark Featured"
                    >
                      <CheckSquare size={16} />
                    </button>
                  </div>
                  <h4 className="mt-2 font-bold text-xs text-[var(--text-primary)] truncate">
                    {repo.name}
                  </h4>
                  <p className="mt-1 text-[11px] text-[var(--text-secondary)] line-clamp-2">
                    {repo.description}
                  </p>
                </div>

                <div className="mt-4 pt-2 border-t border-[var(--border)] flex items-center justify-between">
                  <a
                    href={repo.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[var(--text-tertiary)] hover:text-purple-600 inline-flex items-center gap-1"
                  >
                    GitHub <ExternalLink size={11} />
                  </a>
                  <button
                    onClick={() =>
                      navigate(
                        `/app/interview?project=${encodeURIComponent(repo.name)}&repoUrl=${encodeURIComponent(
                          repo.htmlUrl
                        )}`
                      )
                    }
                    className="text-[11px] font-semibold text-purple-600 hover:underline inline-flex items-center gap-1"
                  >
                    <Code2 size={12} /> Prep Questions →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3.3 REPOSITORIES LIST */}
      <div className="surface-card rounded-2xl p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h3 className="font-bold text-base text-[var(--text-primary)]">
              GitHub Repositories
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Select repositories to designate as Featured Projects for your portfolio and interview technical prep.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
              />
              <input
                type="text"
                placeholder="Search repos or language..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] outline-hidden focus:border-purple-600 w-48 sm:w-60"
              />
            </div>

            <button
              onClick={() => setOnlyFeatured(!onlyFeatured)}
              className={cn(
                "rounded-xl border px-3 py-1.5 text-xs font-semibold transition",
                onlyFeatured
                  ? "border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300"
                  : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]"
              )}
            >
              Featured Only ({featuredProjects.length})
            </button>
          </div>
        </div>

        {filteredRepos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] p-12 text-center text-xs text-[var(--text-tertiary)]">
            <BookOpen className="mx-auto h-8 w-8 mb-2 opacity-50" />
            No repositories found matching your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRepos.map((repo) => (
              <div
                key={repo.fullName}
                className={cn(
                  "surface-card rounded-xl p-4 flex flex-col justify-between transition-all hover:border-purple-500/40 hover:shadow-xs",
                  repo.isFeatured && "border-purple-500/30 bg-purple-500/5"
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4
                        className="font-bold text-xs text-[var(--text-primary)] truncate"
                        title={repo.name}
                      >
                        {repo.name}
                      </h4>
                      <p className="mt-1 text-[11px] text-[var(--text-secondary)] line-clamp-2">
                        {repo.description || "No description provided."}
                      </p>
                    </div>

                    {/* Featured Checkbox */}
                    <button
                      onClick={() => handleToggleFeatured(repo)}
                      className={cn(
                        "rounded-lg p-1 transition",
                        repo.isFeatured
                          ? "text-purple-600 hover:text-purple-700"
                          : "text-[var(--text-tertiary)] hover:text-purple-600"
                      )}
                      title={repo.isFeatured ? "Unmark as Featured" : "Mark as Featured"}
                    >
                      {repo.isFeatured ? <CheckSquare size={17} /> : <Square size={17} />}
                    </button>
                  </div>

                  {/* Metadata pills */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px]">
                    {repo.language && (
                      <span className="rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 font-bold">
                        {repo.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[var(--text-tertiary)]">
                      <Star size={11} className="text-amber-500" />
                      {repo.stars}
                    </span>
                    <span className="text-[var(--text-tertiary)]">
                      Updated {new Date(repo.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-2.5 border-t border-[var(--border)] flex items-center justify-between">
                  <a
                    href={repo.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-medium text-[var(--text-secondary)] hover:text-purple-600 inline-flex items-center gap-1"
                  >
                    View on GitHub <ExternalLink size={11} />
                  </a>

                  {repo.isFeatured && (
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                      ★ Featured
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
