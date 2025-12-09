import React, { useState, useEffect } from "react";
import "./Gallery.css";
import { supabase } from "./supabase";


// ⭐ Detect file type from extension
function getFileType(name) {
  const ext = name.split(".").pop().toLowerCase();

  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";
  if (["mp4", "mov", "avi", "webm", "mkv"].includes(ext)) return "video";
  if (["mp3", "wav", "ogg"].includes(ext)) return "audio";
  if (["pdf"].includes(ext)) return "pdf";

  return "file"; // fallback
}


// ⭐ Load albums from Supabase
async function loadAlbums() {
  let { data: root } = await supabase.storage
    .from("gallery")
    .list("", {
      limit: 100,
      offset: 0,
      sortBy: { column: "name", order: "asc" }
    });

  console.log("ROOT LIST:", root);

  // Fallback if root folder listing fails
  if (!root || root.length === 0) {
    const alt = await supabase.storage.from("gallery").list(null, {
      limit: 100,
      offset: 0
    });
    console.log("ALT ROOT LIST:", alt);
    root = alt.data;
  }

  const folders = root.filter((item) => item.type === "folder");
  console.log("DETECTED FOLDERS:", folders);

  const albums = [];

  for (const folder of folders) {
    const folderName = folder.name;

    const { data: files } = await supabase.storage
      .from("gallery")
      .list(folderName, { limit: 200 });

    console.log(`FILES IN ${folderName}:`, files);

    const items = files
      .filter((f) => f.name) // include ALL files
      .map((f) => {
        const path = `${folderName}/${f.name}`;
        const { data: pub } = supabase.storage
          .from("gallery")
          .getPublicUrl(path);

        return {
          name: f.name,
          url: pub.publicUrl,
          type: getFileType(f.name)
        };
      });

    albums.push({
      title: folderName,
      files: items
    });
  }

  return albums;
}




function Gallery() {
  const [albums, setAlbums] = useState([]);
  const [currentView, setCurrentView] = useState("albums");
  const [currentAlbum, setCurrentAlbum] = useState(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxContent, setLightboxContent] = useState(null);

  // ⭐ Load album list
  useEffect(() => {
    loadAlbums().then((data) => {
      console.log("Loaded Supabase albums:", data);
      setAlbums(data);
    });
  }, []);




  return (
    <div className="gallery-app">

      {/* Background */}
      <div className="liquid-background">
        <div className="liquid-blob blob-1"></div>
        <div className="liquid-blob blob-2"></div>
        <div className="liquid-blob blob-3"></div>
        <div className="glass-morph"></div>
      </div>




      {/* ---------------- ALBUM LIST VIEW ---------------- */}
      {currentView === "albums" && (
        <div className="explorer-container">

          <header className="explorer-header">
            <div className="header-left">
              <div className="folder-icon">
                <div className="folder-tab"></div>
                <div className="folder-body"></div>
              </div>
              <h1>Gallery</h1>
            </div>

            <div className="header-right">
              <div className="search-box glass-input">
                <span>🔍</span>
                <input placeholder="Search..." disabled />
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




            {/* Main */}
            <div className="main-content">
              <div className="content-header">
                <div className="breadcrumb">
                  <span>Gallery</span> / 
                  <span className="current">All Albums</span>
                </div>
                <div className="view-stats">{albums.length} items</div>
              </div>


              <div className="files-grid">
                {albums.map((album, index) => (
                  <div
                    key={index}
                    className="file-item glass-card"
                    onClick={() => {
                      setCurrentAlbum(album);
                      setCurrentView("album");
                    }}
                  >
                    <div className="folder-preview">
                      {album.files.length > 0 ? (
                        album.files[0].type === "image" ? (
                          <img src={album.files[0].url} alt="cover" />
                        ) : (
                          <div className="placeholder-folder">📁</div>
                        )
                      ) : (
                        <div className="placeholder-folder">📁</div>
                      )}
                    </div>

                    <div className="file-info">
                      <h3>{album.title}</h3>
                      <p>{album.files.length} items</p>
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
          </header>


          <div className="album-info-panel glass-card">
            <div className="album-cover-large placeholder-image" />
            <div className="album-details">
              <h1>{currentAlbum.title}</h1>
              <p className="album-description">Album imported from Supabase</p>

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
                className="image-item glass-card"
                onClick={() => {
                  if (file.type === "image" || file.type === "video") {
                    setLightboxContent(file);
                    setIsLightboxOpen(true);
                  }
                }}
              >

                {/* IMAGE */}
                {file.type === "image" && (
                  <img src={file.url} alt={file.name} />
                )}

                {/* VIDEO */}
                {file.type === "video" && (
                  <video src={file.url} muted />
                )}

                {/* AUDIO */}
                {file.type === "audio" && (
                  <div className="file-audio">🎵 {file.name}</div>
                )}

                {/* PDF */}
                {file.type === "pdf" && (
                  <div className="file-pdf">📄 {file.name}</div>
                )}

                {/* OTHER FILE */}
                {file.type === "file" && (
                  <div className="file-generic">📁 {file.name}</div>
                )}

              </div>
            ))}
          </div>

        </div>
      )}




      {/* ---------------- LIGHTBOX ---------------- */}
      {isLightboxOpen && lightboxContent && (
        <div className="lightbox-overlay" onClick={() => setIsLightboxOpen(false)}>
          <div className="lightbox-container" onClick={(e) => e.stopPropagation()}>

            <button className="close-btn" onClick={() => setIsLightboxOpen(false)}>
              ✕
            </button>

            <div className="image-viewer">

              {/* IMAGE PREVIEW */}
              {lightboxContent.type === "image" && (
                <img src={lightboxContent.url} alt={lightboxContent.name} />
              )}

              {/* VIDEO PREVIEW */}
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
