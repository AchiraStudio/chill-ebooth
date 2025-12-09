import React, { useState, useEffect } from "react";
import "./Gallery.css";
import JSZip from "jszip"; // ⭐ Batch download support

// ⭐ Detect file type by extension
function getFileType(name) {
  const ext = name.split(".").pop().toLowerCase();

  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";
  if (["mp4", "mov", "avi", "webm", "mkv"].includes(ext)) return "video";
  if (["mp3", "wav", "ogg"].includes(ext)) return "audio";
  if (["pdf"].includes(ext)) return "pdf";

  return "file";
}

// ⭐ Load albums from GitHub repo
async function loadAlbums() {
  const owner = "AchiraStudio";
  const repo = "chill-ebooth";
  const basePath = "Gallery";

  const folderRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${basePath}`
  );
  const folderJson = await folderRes.json();

  const folders = folderJson.filter((item) => item.type === "dir");

  const albums = [];

  for (const folder of folders) {
    const filesRes = await fetch(folder.url);
    const filesJson = await filesRes.json();

    const files = filesJson
      .filter((f) => f.type === "file")
      .map((f) => ({
        name: f.name,
        url: f.download_url,
        type: getFileType(f.name),
      }));

    albums.push({
      title: folder.name,
      files,
    });
  }

  return albums;
}

function Gallery() {
  const [albums, setAlbums] = useState([]);
  const [currentView, setCurrentView] = useState("albums");
  const [currentAlbum, setCurrentAlbum] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // ⭐ Lightbox
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxContent, setLightboxContent] = useState(null);

  // ⭐ Multi-select
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // ⭐ Load albums on mount
  useEffect(() => {
    loadAlbums().then((data) => setAlbums(data));
  }, []);

  // ⭐ Toggle file selection
  function toggleSelect(file) {
    setSelectedFiles((prev) =>
      prev.includes(file) ? prev.filter((f) => f !== file) : [...prev, file]
    );
  }

  // ⭐ Download single file
  function downloadSingle(url, name) {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
  }

  // ⭐ Batch ZIP download
  async function downloadZip() {
    const zip = new JSZip();

    for (const file of selectedFiles) {
      const data = await fetch(file.url);
      const blob = await data.blob();
      zip.file(file.name, blob);
    }

    const output = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(output);
    a.download = `${currentAlbum.title}_batch.zip`;
    a.click();
  }

  return (
    <div className="gallery-app">

      {/* Background */}
      <div className="liquid-background">
        <div className="liquid-blob blob-1"></div>
        <div className="liquid-blob blob-2"></div>
        <div className="liquid-blob blob-3"></div>
        <div className="glass-morph"></div>
      </div>

      {/* ---------------- ALBUM LIST ---------------- */}
      {currentView === "albums" && (
        <div className="explorer-container">
          <header className="explorer-header">
            <div className="header-left">
              <div className="folder-icon">
                <div className="folder-tab"></div>
                <div className="folder-body"></div>
              </div>
              <h1>Chill'eBooth Explorer</h1>
            </div>

            {/* ⭐ SEARCH FUNCTIONAL NOW */}
            <div className="header-right">
              <div className="search-box glass-input">
                <span>🔍</span>
                <input
                  placeholder="Search albums..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </header>

          <div className="explorer-content">

            {/* Sidebar */}
            <div className="sidebar glass-card">
              <div className="sidebar-section">
                <h3>Quick Access</h3>
                <div className="sidebar-item active">📁 All Albums</div>
              </div>
            </div>

            {/* Album Grid */}
            <div className="main-content">
              <div className="content-header">
                <div className="breadcrumb">
                  <span>Chill'eBooth</span> /
                  <span className="current"> All Albums</span>
                </div>
                <div className="view-stats">
                  {
                    albums.filter((a) =>
                      a.title.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length
                  }{" "}
                  albums
                </div>
              </div>

              <div className="files-grid">
                {albums
                  .filter((album) =>
                    album.title.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((album, index) => (
                    <div
                      key={index}
                      className="file-item glass-card"
                      onClick={() => {
                        setCurrentAlbum(album);
                        setCurrentView("album");
                        setSelectedFiles([]);
                        setMultiSelectMode(false);
                      }}
                    >
                      <div className="folder-preview">
                        {album.files[0]?.type === "image" ? (
                          <img src={album.files[0].url} alt="cover" />
                        ) : (
                          <div className="album-initial">
                            {album.title.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="file-info">
                        <h3>{album.title}</h3>
                        <p>{album.files.length} files</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- ALBUM VIEW ---------------- */}
      {currentView === "album" && currentAlbum && (
        <div className="album-explorer">
          <header className="explorer-header">
            <div className="header-left">
              <button className="glass-button" onClick={() => setCurrentView("albums")}>
                ← Back
              </button>

              <div className="breadcrumb">
                <span className="clickable" onClick={() => setCurrentView("albums")}>
                  Gallery
                </span>
                <span>/</span>
                <span className="current">{currentAlbum.title}</span>
              </div>
            </div>

            {/* ⭐ Multi select buttons */}
            <div className="header-right">
              {!multiSelectMode && (
                <button className="glass-button" onClick={() => setMultiSelectMode(true)}>
                  Select Multiple
                </button>
              )}

              {multiSelectMode && (
                <>
                  <button className="glass-button" onClick={() => setMultiSelectMode(false)}>
                    Cancel
                  </button>

                  {selectedFiles.length > 0 && (
                    <button className="glass-button" onClick={downloadZip}>
                      Download {selectedFiles.length}
                    </button>
                  )}
                </>
              )}
            </div>
          </header>

          <div className="album-info-panel glass-card">

            {/* ⭐ ALBUM THUMBNAIL (cover or initial) */}
            <div className="album-cover-large">
              {currentAlbum.files[0]?.type === "image" ? (
                <img src={currentAlbum.files[0].url} alt={currentAlbum.title} />
              ) : (
                <div className="album-initial-large">
                  {currentAlbum.title.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="album-details">
              <h1>{currentAlbum.title}</h1>
              <p className="album-description">
                Kumpulan foto dari <b>{currentAlbum.title}</b>
              </p>

              <div className="album-stats">
                <div className="stat">
                  <span className="stat-number">{currentAlbum.files.length}</span>
                  <span className="stat-label">Items</span>
                </div>
              </div>
            </div>
          </div>

          {/* Files grid */}
          <div className="images-grid">
            {currentAlbum.files.map((file, i) => (
              <div
                key={i}
                className={`image-item glass-card ${selectedFiles.includes(file) ? "selected" : ""}`}
                onClick={() => {
                  if (multiSelectMode) return toggleSelect(file);
                  if (file.type === "image" || file.type === "video") {
                    setLightboxContent(file);
                    setIsLightboxOpen(true);
                  }
                }}
              >
                {/* ⭐ Checkbox for selection */}
                {multiSelectMode && (
                  <div className="select-checkbox">
                    {selectedFiles.includes(file) ? "✔" : ""}
                  </div>
                )}

                {file.type === "image" && <img src={file.url} alt={file.name} />}
                {file.type === "video" && <video src={file.url} muted />}
                {file.type === "audio" && <div className="file-audio">🎵 {file.name}</div>}
                {file.type === "pdf" && <div className="file-pdf">📄 {file.name}</div>}
                {file.type === "file" && <div className="file-generic">📁 {file.name}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- LIGHTBOX ---------------- */}
      {isLightboxOpen && lightboxContent && (
        <div className="lightbox-overlay" onClick={() => setIsLightboxOpen(false)}>
          <div className="lightbox-container" onClick={(e) => e.stopPropagation()}>
            
            {/* Close */}
            <button className="close-btn" onClick={() => setIsLightboxOpen(false)}>
              ✕
            </button>

            {/* ⭐ Single download */}
            <button
              className="glass-button"
              style={{ position: "absolute", top: 20, right: 80 }}
              onClick={() => downloadSingle(lightboxContent.url, lightboxContent.name)}
            >
              ⬇ Download
            </button>

            <div className="image-viewer">
              {lightboxContent.type === "image" && (
                <img src={lightboxContent.url} alt={lightboxContent.name} />
              )}

              {lightboxContent.type === "video" && (
                <video src={lightboxContent.url} controls autoPlay />
              )}
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="status-bar">
        <div className="status-left">
          <span>{albums.length} albums</span>
          <span>|</span>
          <span>Gallery UI v1.0</span>
        </div>
        <div className="status-right">Ready</div>
      </footer>
    </div>
  );
}

export default Gallery;
