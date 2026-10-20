import { useEffect, useMemo, useRef, useState } from "react";

const emptyForm = {
  title: "",
  subject: "",
  description: "",
  type: "Notes",
  url: "",
  uploadedBy: ""
};

function currentPageFromHash() {
  const page = window.location.hash.replace(/^#\/?/, "").split("/")[0];
  return ["explore", "share", "guide"].includes(page) ? page : "home";
}

async function requestResources(path, options) {
  let response;
  try {
    response = await fetch(path, options);
  } catch {
    throw new Error("Could not reach the server. Check that the app is running and try again.");
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      `The API returned an unexpected response (${response.status}). Check the server and MongoDB Atlas connection.`
    );
  }

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "The request could not be completed.");
  }

  return result;
}

function App() {
  const [resources, setResources] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(currentPageFromHash);
  const [focusSearchOnExplore, setFocusSearchOnExplore] = useState(false);
  const searchInputRef = useRef(null);

  async function loadResources() {
    setLoading(true);
    setError("");
    try {
      const data = await requestResources("/api/resources");
      setResources(data);
      setLoadError(false);
    } catch (loadError) {
      setError(loadError.message);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResources();
  }, []);

  useEffect(() => {
    function syncPage() {
      setPage(currentPageFromHash());
      window.scrollTo(0, 0);
    }

    window.addEventListener("hashchange", syncPage);
    return () => window.removeEventListener("hashchange", syncPage);
  }, []);

  useEffect(() => {
    function handleSearchShortcut(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (page === "explore") {
          searchInputRef.current?.focus();
        } else {
          setFocusSearchOnExplore(true);
          navigateTo("explore");
        }
      }
    }

    window.addEventListener("keydown", handleSearchShortcut);
    return () => window.removeEventListener("keydown", handleSearchShortcut);
  }, [page]);

  useEffect(() => {
    if (page === "explore" && focusSearchOnExplore) {
      searchInputRef.current?.focus();
      setFocusSearchOnExplore(false);
    }
  }, [page, focusSearchOnExplore]);

  const filteredResources = useMemo(() => {
    const query = search.trim().toLowerCase();
    return resources.filter((resource) => {
      const matchesType = selectedType === "All" || resource.type === selectedType;
      const searchableText = [
        resource.title,
        resource.subject,
        resource.description,
        resource.uploadedBy
      ].join(" ").toLowerCase();
      return matchesType && (!query || searchableText.includes(query));
    });
  }, [resources, search, selectedType]);

  const subjectCount = new Set(resources.map((resource) => resource.subject.trim()).filter(Boolean)).size;
  const formatCount = new Set(resources.map((resource) => resource.type)).size;

  function navigateTo(nextPage) {
    window.location.hash = nextPage === "home" ? "/" : `/${nextPage}`;
  }

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  function startEditing(resource) {
    setEditingId(resource._id);
    setForm({
      title: resource.title,
      subject: resource.subject,
      description: resource.description,
      type: resource.type,
      url: resource.url,
      uploadedBy: resource.uploadedBy
    });
    setError("");
    navigateTo("share");
  }

  function cancelEditing() {
    setEditingId(null);
    setForm(emptyForm);
    navigateTo("explore");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const path = editingId ? `/api/resources/${editingId}` : "/api/resources";
      const method = editingId ? "PUT" : "POST";
      const savedResource = await requestResources(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      setResources((currentResources) => {
        if (editingId) {
          return currentResources.map((resource) =>
            resource._id === savedResource._id ? savedResource : resource
          );
        }
        return [savedResource, ...currentResources];
      });
      cancelEditing();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteResource(resource) {
    if (!window.confirm(`Delete "${resource.title}"? This cannot be undone.`)) {
      return;
    }

    setError("");
    try {
      await requestResources(`/api/resources/${resource._id}`, { method: "DELETE" });
      setResources((currentResources) =>
        currentResources.filter((item) => item._id !== resource._id)
      );
      if (editingId === resource._id) {
        cancelEditing();
      }
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#/" aria-label="StudyShelf home">
          <span className="brand-mark">S</span>
          <span>StudyShelf</span>
        </a>
        <span className="topbar-note">A little help goes a long way.</span>
        <nav className="main-nav" aria-label="Main navigation">
          {[
            ["home", "Home"],
            ["explore", "Explore"],
            ["share", "Share"],
            ["guide", "Study guide"]
          ].map(([target, label]) => (
            <a
              aria-current={page === target ? "page" : undefined}
              className={`nav-link${page === target ? " active" : ""}${target === "share" ? " nav-link-share" : ""}`}
              href={target === "home" ? "#/" : `#/${target}`}
              key={target}
            >
              {label}
            </a>
          ))}
        </nav>
      </header>

      <main id="home">
        {page === "home" && (
          <>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-dot" /> YOUR CLASS, SHARING KNOWLEDGE</p>
            <h1>Good resources.<br /><span>Better together.</span></h1>
            <p className="hero-description">
              Find notes, videos, and useful links shared by students like you.
              Got something helpful? Add it to the shelf.
            </p>
            <button className="button button-dark hero-button" onClick={() => navigateTo("share")} type="button">
              <span aria-hidden="true">＋</span> Share a resource
            </button>
            <div className="hero-stats" aria-label="Community shelf at a glance">
              <div>
                <strong>{loading ? "—" : String(resources.length).padStart(2, "0")}</strong>
                <span>resources shared</span>
              </div>
              <div>
                <strong>{loading ? "—" : String(subjectCount).padStart(2, "0")}</strong>
                <span>subjects covered</span>
              </div>
              <div>
                <strong>{loading ? "—" : String(formatCount).padStart(2, "0")}</strong>
                <span>resource formats</span>
              </div>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="art-sun" />
            <div className="art-book book-back"><span /></div>
            <div className="art-book book-front">
              <div className="book-label">STUDY<br />NOTES</div>
              <div className="book-lines"><i /><i /><i /></div>
            </div>
            <div className="art-spark spark-one">✳</div>
            <div className="art-spark spark-two">✳</div>
            <div className="art-caption">Shared by students, for students</div>
          </div>
          <div className="hero-bottom">
            <span>MAKE LEARNING A LITTLE LIGHTER</span>
            <span aria-hidden="true">↓</span>
          </div>
        </section>

        <section className="home-next">
          <div className="home-next-heading">
            <div>
              <p className="eyebrow">YOUR NEXT STUDY SESSION</p>
              <h2>A shelf full of <span>good ideas.</span></h2>
              <p className="section-description">Find something useful, share what worked, and help your class learn together.</p>
            </div>
            <a className="text-link" href="#/explore">Browse the shelf <span aria-hidden="true">↗</span></a>
          </div>
          <div className="home-feature-grid">
            <a className="home-feature" href="#/explore">
              <span className="feature-icon" aria-hidden="true">⌕</span>
              <span className="feature-kicker">01 / DISCOVER</span>
              <strong>Find your next resource</strong>
              <span>Search notes, videos, and sites shared by your classmates.</span>
              <span className="feature-arrow" aria-hidden="true">↗</span>
            </a>
            <a className="home-feature" href="#/share">
              <span className="feature-icon" aria-hidden="true">＋</span>
              <span className="feature-kicker">02 / CONTRIBUTE</span>
              <strong>Share what helped</strong>
              <span>One great explanation can make someone else's day.</span>
              <span className="feature-arrow" aria-hidden="true">↗</span>
            </a>
            <a className="home-feature" href="#/guide">
              <span className="feature-icon" aria-hidden="true">✳</span>
              <span className="feature-kicker">03 / LEARN</span>
              <strong>Build better study habits</strong>
              <span>Try a few practical techniques for your next session.</span>
              <span className="feature-arrow" aria-hidden="true">↗</span>
            </a>
          </div>
          <div className="home-latest">
            <div>
              <p className="eyebrow">FRESH FROM THE SHELF</p>
              <h2>Recently shared</h2>
            </div>
            <a className="text-link" href="#/explore">See all resources <span aria-hidden="true">↗</span></a>
          </div>
          {loading ? (
            <p className="home-latest-empty">Loading the latest resources...</p>
          ) : resources.length ? (
            <div className="latest-list">
              {resources.slice(0, 3).map((resource) => (
                <a className="latest-item" href="#/explore" key={resource._id}>
                  <span className={`type-tag tag-${resource.type.toLowerCase()}`}>{resource.type}</span>
                  <span className="latest-item-copy">
                    <strong>{resource.title}</strong>
                    <span>{resource.subject} · shared by {resource.uploadedBy}</span>
                  </span>
                  <span className="latest-arrow" aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          ) : (
            <div className="home-latest-empty">
              <span>The shelf is ready for its first resource.</span>
              <a href="#/share">Share something useful <span aria-hidden="true">↗</span></a>
            </div>
          )}
        </section>
          </>
        )}

        {page === "explore" && <section className="resources-section" id="resources">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THE COMMUNITY SHELF</p>
              <h2>Find your next <span>aha!</span></h2>
              <p className="section-description">A growing collection of things that make studying click.</p>
            </div>
            <div className="resource-count">
              <strong>{resources.length.toString().padStart(2, "0")}</strong>
              <span>RESOURCES<br />SHARED</span>
            </div>
          </div>

          <div className="toolbar">
            <label className="search-box">
              <span aria-hidden="true">⌕</span>
              <input
                aria-label="Search resources"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by title, subject, or name..."
                ref={searchInputRef}
                type="search"
                value={search}
              />
              <kbd>{navigator.userAgent.includes("Mac") ? "⌘ K" : "Ctrl K"}</kbd>
            </label>
            <div className="filter-list" aria-label="Filter by resource type">
              {["All", "Notes", "Video", "Website", "Other"].map((type) => (
                <button
                  aria-pressed={selectedType === type}
                  className={`filter-chip ${selectedType === type ? "active" : ""}`}
                  key={type}
                  onClick={() => setSelectedType(type)}
                  type="button"
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="error-banner" role="alert">
              <span>{error}</span>
              <button onClick={loadResources} type="button">Try again</button>
            </div>
          )}

          <div className="results-line">
            <span>{loading ? "Loading resources..." : `${filteredResources.length} ${filteredResources.length === 1 ? "RESOURCE" : "RESOURCES"}`}</span>
            <span className="results-rule" />
            <span>{selectedType === "All" ? "EVERYTHING THAT'S BEEN SHARED" : `${selectedType.toUpperCase()} SHARED WITH YOU`}</span>
          </div>

          {loading ? (
            <div className="empty-state"><span className="empty-icon">◌</span><p>Getting the shelf ready...</p></div>
          ) : filteredResources.length > 0 ? (
            <div className="resource-grid">
              {filteredResources.map((resource, index) => (
                <article className="resource-card" key={resource._id}>
                  <div className="card-topline">
                    <span className={`type-tag tag-${resource.type.toLowerCase()}`}>{resource.type}</span>
                    <span className="card-number">{String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <p className="card-subject">{resource.subject}</p>
                  <h3>{resource.title}</h3>
                  <p className="card-description">{resource.description}</p>
                  <div className="card-footer">
                    <span className="contributor"><span className="avatar">{resource.uploadedBy.charAt(0).toUpperCase()}</span> {resource.uploadedBy}</span>
                    <div className="card-actions">
                      <button aria-label={`Edit ${resource.title}`} className="text-button" onClick={() => startEditing(resource)} type="button">Edit</button>
                      <button aria-label={`Delete ${resource.title}`} className="text-button delete-button" onClick={() => deleteResource(resource)} type="button">Delete</button>
                      <a aria-label={`Open ${resource.title}`} className="open-link" href={resource.url} rel="noreferrer" target="_blank">↗</a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : loadError ? (
            <div className="empty-state">
              <span className="empty-icon">!</span>
              <h3>The shelf couldn't load yet.</h3>
              <p>Check the API and Atlas connection, then use “Try again” above.</p>
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">✳</span>
              <h3>{resources.length ? "Nothing matches just yet." : "The shelf is waiting for its first resource."}</h3>
              <p>{resources.length ? "Try another search or choose a different filter." : "Be the first to share something useful with your classmates."}</p>
              {!resources.length && (
                <button className="button button-dark" onClick={() => setFormOpen(true)} type="button">Share the first resource <span aria-hidden="true">↗</span></button>
              )}
            </div>
          )}
        </section>}

        {page === "share" && (
          <section className="page-section share-page">
            <div className="page-intro">
              <p className="eyebrow">MAKE THE SHELF BETTER</p>
              <h1>{editingId ? "Update a resource." : <>Share what <span>helped you.</span></>}</h1>
              <p>Found a clear explanation, useful set of notes, or great tutorial? Add it here so another student can benefit too.</p>
            </div>
            <form className="resource-form" id="resource-form" onSubmit={handleSubmit}>
              <div className="form-heading">
                <div>
                  <p className="eyebrow">{editingId ? "UPDATE THE SHELF" : "ADD TO THE SHELF"}</p>
                  <h3>{editingId ? "Edit resource details" : "Resource details"}</h3>
                </div>
              </div>
              {error && <div className="error-banner" role="alert"><span>{error}</span></div>}
              <div className="form-grid">
                <label>
                  Resource title
                  <input maxLength="100" name="title" onChange={updateForm} placeholder="e.g. A friendly guide to React hooks" required value={form.title} />
                </label>
                <label>
                  Subject
                  <input maxLength="60" name="subject" onChange={updateForm} placeholder="e.g. Web Development" required value={form.subject} />
                </label>
                <label>
                  Type
                  <select name="type" onChange={updateForm} value={form.type}>
                    <option>Notes</option>
                    <option>Video</option>
                    <option>Website</option>
                    <option>Other</option>
                  </select>
                </label>
                <label>
                  Your name
                  <input maxLength="60" name="uploadedBy" onChange={updateForm} placeholder="e.g. Sam" required value={form.uploadedBy} />
                </label>
                <label className="full-width">
                  Link to resource
                  <input name="url" onChange={updateForm} placeholder="https://..." required type="url" value={form.url} />
                </label>
                <label className="full-width">
                  Short description
                  <textarea maxLength="500" name="description" onChange={updateForm} placeholder="What makes this resource helpful?" required rows="3" value={form.description} />
                </label>
              </div>
              <div className="form-actions">
                <button className="button button-light" onClick={cancelEditing} type="button">Cancel</button>
                <button className="button button-dark" disabled={saving} type="submit">
                  {saving ? "Saving..." : editingId ? "Save changes" : "Share resource"}
                  {!saving && <span aria-hidden="true">↗</span>}
                </button>
              </div>
            </form>
            <aside className="sharing-note">
              <span aria-hidden="true">✳</span>
              <p><strong>A helpful share goes beyond the link.</strong> Add a short description so classmates know what they'll find and why it's worth their time.</p>
            </aside>
          </section>
        )}

        {page === "guide" && (
          <section className="page-section guide-page">
            <div className="page-intro">
              <p className="eyebrow">A TOOLKIT FOR YOUR NEXT SESSION</p>
              <h1>Study smarter, <span>one step at a time.</span></h1>
              <p>Small, repeatable habits can make studying feel less overwhelming and help new ideas stick.</p>
            </div>
            <div className="guide-grid">
              <article className="guide-card">
                <span className="guide-number">01</span>
                <span className="guide-symbol" aria-hidden="true">◎</span>
                <h2>Start with a small goal</h2>
                <p>Choose one specific outcome for this session, like solving three practice problems or summarizing one chapter.</p>
                <span className="guide-tip">TRY THIS · Write your goal before you begin.</span>
              </article>
              <article className="guide-card">
                <span className="guide-number">02</span>
                <span className="guide-symbol" aria-hidden="true">↻</span>
                <h2>Recall, then review</h2>
                <p>Close your notes and explain the idea from memory. Then check what you missed instead of rereading everything.</p>
                <span className="guide-tip">TRY THIS · Explain it in your own words.</span>
              </article>
              <article className="guide-card">
                <span className="guide-number">03</span>
                <span className="guide-symbol" aria-hidden="true">◷</span>
                <h2>Take a real break</h2>
                <p>Work in a focused block, then step away for a few minutes. A short reset can make it easier to focus again.</p>
                <span className="guide-tip">TRY THIS · Stretch or get a glass of water.</span>
              </article>
              <article className="guide-card">
                <span className="guide-number">04</span>
                <span className="guide-symbol" aria-hidden="true">↗</span>
                <h2>Use more than one resource</h2>
                <p>If a topic isn't clicking, try another explanation or format. A different example can reveal the missing piece.</p>
                <span className="guide-tip">TRY THIS · Explore notes and videos by subject.</span>
              </article>
            </div>
            <div className="guide-cta">
              <div>
                <p className="eyebrow">PUT IT INTO PRACTICE</p>
                <h2>Find something new to learn.</h2>
              </div>
              <a className="button button-dark" href="#/explore">Explore resources <span aria-hidden="true">↗</span></a>
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <a className="brand" href="#/"><span className="brand-mark">S</span><span>StudyShelf</span></a>
        <p>Made for curious minds, and the people who help them learn.</p>
        <a className="back-top" href="#/">BACK TO TOP ↑</a>
      </footer>
    </div>
  );
}

export default App;
