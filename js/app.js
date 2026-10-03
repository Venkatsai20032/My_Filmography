// ==========================================================================
// MY FILMOGRAPHY PORTFOLIO - CONTROLLER & DATA MANAGER
// ==========================================================================

import { PRESETS, DEFAULT_PORTFOLIO_DATA } from './data.js';

document.addEventListener("DOMContentLoaded", async () => {
  // Database Configuration for Safe Large Data & Image Storage
  const DB_NAME = "MyFilmographyDB";
  const DB_STORE = "portfolioStore";
  const DB_KEY = "active_portfolio";

  // App State
  let appData = null;
  let currentFilter = "All";
  let activePIndexToUpload = null;
  let autoSaveTimeout = null;
  let isSuperAdmin = sessionStorage.getItem("filmography_super_admin") === "true";
  let currentMode = isSuperAdmin ? "edit" : "showcase";

  // Super Admin UI Sync Function
  function updateSuperAdminUI() {
    const adminBar = document.getElementById("adminStudioBar");
    const lockIcon = document.getElementById("superLockIcon");
    const lockBtn = document.getElementById("btnSuperLoginTrigger");
    const btnModeEdit = document.getElementById("btnModeEdit");
    const btnModeView = document.getElementById("btnModeView");

    if (isSuperAdmin) {
      if (adminBar) adminBar.style.display = "flex";
      if (lockBtn) {
        lockBtn.classList.add("unlocked");
        lockBtn.title = "Super Studio Active (Click to Logout/Lock)";
      }
      if (lockIcon) {
        lockIcon.className = "fa-solid fa-lock-open";
      }

      if (currentMode === "edit") {
        document.body.classList.add("body-edit-mode");
        if (btnModeEdit) btnModeEdit.classList.add("active");
        if (btnModeView) btnModeView.classList.remove("active");
      } else {
        document.body.classList.remove("body-edit-mode");
        if (btnModeView) btnModeView.classList.add("active");
        if (btnModeEdit) btnModeEdit.classList.remove("active");
      }
    } else {
      if (adminBar) adminBar.style.display = "none";
      if (lockBtn) {
        lockBtn.classList.remove("unlocked");
        lockBtn.title = "Super Admin Login";
      }
      if (lockIcon) {
        lockIcon.className = "fa-solid fa-lock";
      }
      document.body.classList.remove("body-edit-mode");
      if (btnModeEdit) btnModeEdit.classList.remove("active");
      if (btnModeView) btnModeView.classList.add("active");
    }
  }

  // Initialize Storage Engine & Load Data
  await initStorageAndLoadData();

  // Initialize UI & Bindings
  initElements();
  populatePresets();
  renderAll();
  bindEvents();
  updateSuperAdminUI();

  // Set current year
  const yearElem = document.getElementById("currentYear");
  if (yearElem) yearElem.textContent = new Date().getFullYear();

  // ==========================================================================
  // 1. DUAL STORAGE ENGINE (IndexedDB + LocalStorage Fallback)
  // Ensures data and images are never lost and eliminates quota limits.
  // ==========================================================================
  function openDatabase() {
    return new Promise((resolve) => {
      if (!window.indexedDB) {
        resolve(null);
        return;
      }
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(DB_STORE)) {
          db.createObjectStore(DB_STORE);
        }
      };
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = () => resolve(null);
    });
  }

  function getFromIndexedDB(db) {
    return new Promise((resolve) => {
      if (!db) return resolve(null);
      try {
        const tx = db.transaction(DB_STORE, "readonly");
        const store = tx.objectStore(DB_STORE);
        const req = store.get(DB_KEY);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch (err) {
        resolve(null);
      }
    });
  }

  function putToIndexedDB(db, data) {
    return new Promise((resolve) => {
      if (!db) return resolve(false);
      try {
        const tx = db.transaction(DB_STORE, "readwrite");
        const store = tx.objectStore(DB_STORE);
        const req = store.put(data, DB_KEY);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      } catch (err) {
        resolve(false);
      }
    });
  }

  async function initStorageAndLoadData() {
    let loaded = null;
    const db = await openDatabase();
    if (db) {
      loaded = await getFromIndexedDB(db);
    }

    if (!loaded) {
      const localStr = localStorage.getItem("filmography_portfolio_data");
      if (localStr) {
        try {
          loaded = JSON.parse(localStr);
        } catch (e) {
          console.warn("Error parsing localStorage data:", e);
        }
      }
    }

    if (loaded) {
      // Deep merge with default template so newly added fields (facebook, p1Scale, episodes) exist
      appData = mergeWithDefaults(loaded, DEFAULT_PORTFOLIO_DATA);
    } else {
      appData = JSON.parse(JSON.stringify(DEFAULT_PORTFOLIO_DATA));
    }
  }

  function mergeWithDefaults(source, defaults) {
    const merged = JSON.parse(JSON.stringify(defaults));
    if (!source || typeof source !== "object") return merged;

    // Merge profile
    if (source.profile) {
      merged.profile = { ...merged.profile, ...source.profile };
      if (!merged.profile.avatarUrl && defaults.profile.avatarUrl) {
        merged.profile.avatarUrl = defaults.profile.avatarUrl;
      }
      if (!merged.profile.p1 && defaults.profile.p1) {
        merged.profile.p1 = defaults.profile.p1;
      }
      if (!merged.profile.p2 && defaults.profile.p2) {
        merged.profile.p2 = defaults.profile.p2;
      }
      if (!merged.profile.p3 && defaults.profile.p3) {
        merged.profile.p3 = defaults.profile.p3;
      }
      if (source.profile.socials) {
        merged.profile.socials = { ...merged.profile.socials, ...source.profile.socials };
      }
    }

    // Merge summary
    if (source.summary) {
      merged.summary = { ...merged.summary, ...source.summary };
    }

    // Merge project header
    if (source.projectHeader) {
      merged.projectHeader = { ...merged.projectHeader, ...source.projectHeader };
    }

    // Merge projects: preserve any user edits and photos, while ensuring all 10 default projects are loaded
    if (Array.isArray(defaults.projects)) {
      merged.projects = defaults.projects.map(defPrj => {
        const userPrj = (source.projects || []).find(p => p.id === defPrj.id || p.number === defPrj.number);
        if (userPrj) {
          // Merge episodes carefully to preserve default episode thumbnails if missing in user's cache
          let mergedEpisodes = defPrj.episodes || [];
          if (Array.isArray(userPrj.episodes) && userPrj.episodes.length > 0) {
            mergedEpisodes = userPrj.episodes.map((userEp, epIdx) => {
              const defEp = (defPrj.episodes || [])[epIdx];
              return {
                ...(defEp || {}),
                ...userEp,
                thumbnail: (userEp.thumbnail && userEp.thumbnail.trim() !== "") 
                  ? userEp.thumbnail 
                  : (defEp?.thumbnail || `./images/project-${String(defPrj.number || '01')}-ep-${String(epIdx + 1).padStart(2, '0')}.jpg`)
              };
            });
          }

          return {
            ...defPrj,
            ...userPrj,
            creditType: userPrj.creditImage ? "image" : (userPrj.creditType || defPrj.creditType || "image"),
            creditImage: userPrj.creditImage || defPrj.creditImage,
            creditName: userPrj.creditName || defPrj.creditName,
            thumbnail: userPrj.thumbnail || defPrj.thumbnail,
            link: userPrj.link || defPrj.link,
            storyline: userPrj.storyline || defPrj.storyline,
            episodes: mergedEpisodes
          };
        }
        return defPrj;
      });

      // Also append any extra custom projects user created beyond the 10
      (source.projects || []).forEach(p => {
        if (!merged.projects.some(m => m.id === p.id || m.number === p.number)) {
          merged.projects.push(p);
        }
      });
    }

    return merged;
  }

  async function saveState(showToastMsg = true) {
    collectInputsToState();

    // 1. Save to IndexedDB (unlimited capacity)
    const db = await openDatabase();
    if (db) {
      await putToIndexedDB(db, appData);
    }

    // 2. Mirror to LocalStorage safely
    try {
      localStorage.setItem("filmography_portfolio_data", JSON.stringify(appData));
    } catch (quotaErr) {
      console.warn("LocalStorage full, primary copy safely saved in IndexedDB.");
    }

    if (showToastMsg) {
      showToast("Changes saved successfully! ✓", "success");
    }
  }

  function triggerAutoSave() {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
      collectInputsToState();
      saveState(false);
    }, 600);
  }

  // ==========================================================================
  // 2. IMAGE COMPRESSION UTILITY
  // Auto-resizes high-res phone/camera photos down to ~120KB crisp WebP/JPEG
  // ==========================================================================
  function compressImageFile(file, maxWidth = 1400, quality = 0.82) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Export compressed JPEG
          const compressed = canvas.toDataURL("image/jpeg", quality);
          resolve(compressed);
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // ==========================================================================
  // 3. PRESETS POPULATION
  // ==========================================================================
  function populatePresets() {
    const stateList = document.getElementById("statesDataList");
    if (stateList) {
      stateList.innerHTML = PRESETS.states.map(s => `<option value="${s}"></option>`).join("");
    }

    const cityList = document.getElementById("citiesDataList");
    if (cityList) {
      cityList.innerHTML = PRESETS.cities.map(c => `<option value="${c}"></option>`).join("");
    }
  }

  // ==========================================================================
  // 4. RENDER CONTROLLERS
  // ==========================================================================
  function renderAll() {
    renderProfile();
    renderSummary();
    renderProjectHeader();
    renderProjects();
  }

  // Render Section 1: Profile Details
  function renderProfile() {
    const p = appData.profile;

    // Avatar
    const avatarImg = document.getElementById("avatarImg");
    const avatarPlaceholder = document.getElementById("avatarPlaceholder");
    if (p.avatarUrl) {
      avatarImg.src = p.avatarUrl;
      avatarImg.style.display = "block";
      avatarImg.style.transform = `scale(${(p.avatarScale || 100) / 100})`;
      avatarImg.style.objectPosition = `center ${p.avatarOffset || 50}%`;
      avatarPlaceholder.style.display = "none";
    } else {
      avatarImg.style.display = "none";
      avatarPlaceholder.style.display = "flex";
    }
    document.getElementById("avatarUrlInput").value = p.avatarUrl || "";
    document.getElementById("avatarScaleRange").value = p.avatarScale || 100;
    const offsetRange = document.getElementById("avatarOffsetRange");
    if (offsetRange) offsetRange.value = p.avatarOffset !== undefined ? p.avatarOffset : 50;

    // Status Badge
    updateStatusBadge(p.status || "Active");
    document.getElementById("statusSelect").value = p.status || "Active";

    // Sub-profiles: P1, P2, P3 with Adjustable Tools
    ["1", "2", "3"].forEach(idx => {
      const key = `p${idx}`;
      const scaleKey = `p${idx}Scale`;
      const imgElem = document.getElementById(`pImg${idx}`);
      const labelElem = document.getElementById(`pLabel${idx}`);
      const scaleInput = document.getElementById(`p${idx}ScaleRange`);

      const scaleVal = p[scaleKey] || 100;
      if (scaleInput) scaleInput.value = scaleVal;

      if (p[key]) {
        imgElem.src = p[key];
        imgElem.style.display = "block";
        imgElem.style.transform = `scale(${scaleVal / 100})`;
        labelElem.style.display = "none";
      } else {
        imgElem.src = "";
        imgElem.style.display = "none";
        labelElem.style.display = "block";
      }
    });

    // Mobile & Email
    document.getElementById("mobileDisplay").textContent = p.mobile || "Not specified";
    document.getElementById("mobileInput").value = p.mobile || "";
    document.getElementById("emailDisplay").textContent = p.email || "Not specified";
    document.getElementById("emailInput").value = p.email || "";

    // Socials
    bindSocialItem("Instagram", p.socials.instagram, "https://instagram.com/");
    bindSocialItem("Facebook", p.socials.facebook, "https://facebook.com/");
    bindSocialItem("Whatsapp", p.socials.whatsapp, "https://wa.me/");
    bindSocialItem("Youtube", p.socials.youtube, "https://youtube.com/");
    bindSocialItem("X", p.socials.x, "https://x.com/");

    // Username & Name
    document.getElementById("usernameDisplay").textContent = p.username ? `@${p.username}` : "@creator";
    document.getElementById("usernameInput").value = p.username || "";
    document.getElementById("nameDisplay").textContent = p.name || "THOTA VENKAT SAI";
    document.getElementById("nameInput").value = p.name || "";

    // Gender
    document.getElementById("genderDisplay").textContent = p.gender || "Male";
    const genderRadios = document.getElementsByName("genderRadio");
    for (let r of genderRadios) {
      r.checked = (r.value.toLowerCase() === (p.gender || "male").toLowerCase());
    }

    // DoB & Age
    const dobFormatted = formatDate(p.dob);
    document.getElementById("dobDisplay").textContent = `${dobFormatted} (Age: ${p.age || '23'})`;
    document.getElementById("dobInput").value = p.dob || "";
    document.getElementById("ageInput").value = p.age || "";

    // Categories
    renderTagSection("category", p.categories || [], PRESETS.categories, "categoryDisplay", "categoryTagPicker");

    // Location
    document.getElementById("stateDisplay").textContent = p.state || "Andhra Pradesh";
    document.getElementById("stateInput").value = p.state || "";
    document.getElementById("cityDisplay").textContent = p.city || "Tirupati";
    document.getElementById("cityInput").value = p.city || "";
    document.getElementById("placeDisplay").textContent = p.place || "Tirupati";
    document.getElementById("placeInput").value = p.place || "";

    // Interests, Genres, Types
    renderTagSection("interest", p.areaOfInterest || [], PRESETS.interests, "interestDisplay", "interestTagPicker");
    renderTagSection("genre", p.interestedGenre || [], PRESETS.genres, "genreDisplay", "genreTagPicker");
    renderTagSection("type", p.interestedType || [], PRESETS.types, "typeDisplay", "typeTagPicker");

    // Experience & Languages
    document.getElementById("experienceDisplay").textContent = p.experienceYears || "3 Years";
    document.getElementById("experienceInput").value = p.experienceYears || "";
    renderTagSection("language", p.languagesKnown || [], PRESETS.languages, "languageDisplay", "languageTagPicker");

    // Availability
    document.getElementById("availabilityDisplay").textContent = p.availability || "Active";
    document.getElementById("availabilitySelect").value = p.availability || "Active";
  }

  function bindSocialItem(key, url, defaultUrl) {
    const linkElem = document.getElementById(`socialLink${key}`);
    const inputElem = document.getElementById(`socialInput${key}`);
    if (inputElem) inputElem.value = url || "";

    if (linkElem) {
      if (url && url.trim().length > 0) {
        linkElem.href = url.trim();
        linkElem.style.display = "flex";
      } else {
        linkElem.href = defaultUrl;
      }
    }
  }

  function updateStatusBadge(statusValue) {
    const badgeDisplay = document.getElementById("statusBadgeDisplay");
    const statusText = document.getElementById("statusText");
    const statusDot = document.getElementById("statusDot");
    const found = PRESETS.statuses.find(s => s.value.toLowerCase() === (statusValue || "").toLowerCase());
    const item = found || PRESETS.statuses[0];

    statusText.textContent = item.label;
    badgeDisplay.style.color = item.color;
    badgeDisplay.style.borderColor = item.color;
    badgeDisplay.style.background = item.bg;
    statusDot.style.background = item.color;
  }

  function renderTagSection(typeKey, selectedList, presetSuggestions, displayContainerId, pickerContainerId) {
    const displayContainer = document.getElementById(displayContainerId);
    const pickerContainer = document.getElementById(pickerContainerId);
    if (!displayContainer || !pickerContainer) return;

    // View Mode Display
    if (!selectedList || selectedList.length === 0) {
      displayContainer.innerHTML = `<span style="color:var(--text-muted); font-size:0.9rem;">None selected</span>`;
    } else {
      displayContainer.innerHTML = selectedList.map(tag => `
        <span class="tag-chip">${escapeHtml(tag)}</span>
      `).join("");
    }

    // Edit Mode Picker
    pickerContainer.innerHTML = `
      <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:6px;">
        ${(selectedList || []).map((tag, idx) => `
          <span class="tag-chip">
            ${escapeHtml(tag)}
            <button type="button" class="remove-chip-btn" data-type="${typeKey}" data-index="${idx}">&times;</button>
          </span>
        `).join("")}
      </div>
      <div class="available-chips-row">
        ${presetSuggestions.map(preset => {
          const isSelected = (selectedList || []).includes(preset);
          return `
            <button type="button" class="chip-suggestion ${isSelected ? 'selected' : ''}" 
              data-type="${typeKey}" data-val="${escapeHtml(preset)}">
              ${isSelected ? '✓ ' : '+ '}${escapeHtml(preset)}
            </button>
          `;
        }).join("")}
      </div>
      <div class="custom-chip-input-row" style="margin-top:6px; display:flex; gap:6px;">
        <input type="text" id="${typeKey}CustomInput" class="cinema-input" placeholder="Add custom tag..." style="font-size:0.8rem; padding:4px 8px; flex:1;">
        <button type="button" class="btn-cinema btn-ghost" data-action="add-custom-tag" data-type="${typeKey}" style="font-size:0.75rem; padding:4px 10px;">+ Add</button>
      </div>
    `;
  }

  // Render Section 2: Summary (Bio & Motive)
  function renderSummary() {
    const s = appData.summary || {};
    document.getElementById("bioDisplay").textContent = s.bio || "No bio provided.";
    document.getElementById("bioInput").value = s.bio || "";
    updateCounter("bioCounter", (s.bio || "").length, 700);

    document.getElementById("motiveDisplay").textContent = s.motive || "No motive stated.";
    document.getElementById("motiveInput").value = s.motive || "";
    updateCounter("motiveCounter", (s.motive || "").length, 300);
  }

  function updateCounter(counterId, count, max) {
    const elem = document.getElementById(counterId);
    if (!elem) return;
    elem.textContent = `${count} / ${max} chars`;
    elem.style.color = count > max * 0.9 ? "#ff333d" : "var(--text-muted)";
  }

  // Render Section 3: Project Header
  function renderProjectHeader() {
    const ph = appData.projectHeader || {};
    document.getElementById("noOfProjectsDisplay").textContent = ph.noOfProjects || "01";
    document.getElementById("noOfProjectsInput").value = ph.noOfProjects || "";
    renderTagSection("projectTypes", ph.typesOfProjects || [], PRESETS.types, "typeOfProjectsDisplay", "typeOfProjectsTagPicker");
  }

  // Render Section 4: Dynamic Project Cards (Supports Webseries & Dynamic Episodes)
  function renderProjects() {
    const container = document.getElementById("projectsContainer");
    let projects = appData.projects || [];

    if (currentFilter !== "All") {
      projects = projects.filter(p => {
        if (!p.type) return false;
        return p.type.toLowerCase().trim() === currentFilter.toLowerCase().trim();
      });
    }

    if (projects.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:40px; background:var(--bg-card); border-radius:var(--radius-md); border:1px dashed var(--border-subtle);">
          <i class="fa-solid fa-film" style="font-size:2.5rem; color:var(--text-muted); margin-bottom:12px;"></i>
          <p style="color:var(--text-secondary); font-size:1.1rem;">No projects found under category "${escapeHtml(currentFilter)}".</p>
        </div>
      `;
      return;
    }

    container.innerHTML = projects.map((prj, index) => {
      const isFirst = index === 0;
      const isLast = index === projects.length - 1;
      const isWebseries = (prj.type === "Web series" || prj.type === "Short-series");

      // Ensure episodes exist for web series
      if (isWebseries && (!prj.episodes || prj.episodes.length === 0)) {
        prj.episodes = [
          {
            id: "ep-" + Date.now(),
            episodeNo: "01",
            title: prj.title ? `${prj.title} - Episode 1` : "Episode 1",
            role: prj.role || "Director",
            type: "Web series",
            storyline: prj.storyline || "",
            link: prj.link || "",
            releaseYear: prj.releaseYear || "2026",
            thumbnail: prj.thumbnail || ""
          }
        ];
      }

      // Credit content
      let creditHtml = "";
      if (prj.creditImage && (prj.creditType === "image" || !prj.creditType)) {
        creditHtml = `<img src="${prj.creditImage}" alt="Credit Image" class="credit-img">`;
      } else if (prj.creditType === "image" && prj.creditImage) {
        creditHtml = `<img src="${prj.creditImage}" alt="Credit Image" class="credit-img">`;
      } else {
        creditHtml = `<span class="credit-placeholder-text">${escapeHtml(prj.creditName || "CREDIT NAME")}</span>`;
      }

      // Episodes HTML for Webseries
      let episodesHtml = "";
      if (isWebseries) {
        const episodesList = prj.episodes || [];

        // Edit Mode Episodes Markup
        const episodesEditCards = episodesList.map((ep, epIdx) => {
          const epThumbnail = (ep.thumbnail && ep.thumbnail.trim() !== "") 
            ? ep.thumbnail 
            : `./images/project-${String(prj.number || (index + 1)).padStart(2, '0')}-ep-${String(epIdx + 1).padStart(2, '0')}.jpg`;

          return `
          <div class="episode-card episode-item-row" data-ep-id="${ep.id}" data-ep-index="${epIdx}">
            <div class="episode-card-header">
              <span class="episode-badge-pill"><i class="fa-solid fa-play fa-xs"></i> Episode ${escapeHtml(ep.episodeNo || String(epIdx + 1).padStart(2, '0'))}</span>
              ${episodesList.length > 1 ? `
                <button type="button" class="btn-cinema btn-ghost" data-action="delete-episode" data-project-id="${prj.id}" data-ep-index="${epIdx}" style="color:#ef4444; padding:2px 8px; font-size:0.75rem;">
                  <i class="fa-solid fa-trash"></i> Delete Episode
                </button>
              ` : ''}
            </div>

            <div class="episode-grid-layout">
              <!-- Left: Episode Thumbnail Box -->
              <div>
                <div class="episode-thumb-preview-box" data-action="view-episode-thumb" data-project-id="${prj.id}" data-ep-index="${epIdx}" title="Click to view image">
                  <img src="${epThumbnail}" alt="Episode ${ep.episodeNo}" class="episode-thumb-img" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';">
                  <span style="display:none; font-size:0.8rem; color:var(--text-muted);"><i class="fa-solid fa-image"></i> Poster / Thumbnail</span>
                </div>
                <div style="display:flex; flex-direction:column; gap:4px; margin-top:6px;">
                  <input type="file" accept="image/*" class="cinema-input episode-thumb-file" data-project-id="${prj.id}" data-ep-index="${epIdx}" style="font-size:0.72rem; padding:4px;">
                  <input type="url" class="cinema-input episode-thumb-url" data-project-id="${prj.id}" data-ep-index="${epIdx}" placeholder="Or Poster URL..." value="${escapeHtml(ep.thumbnail || epThumbnail || '')}" style="font-size:0.72rem;">
                </div>
              </div>

              <!-- Right: Episode Details (Episode No, Role, Type, Storyline, Link, Year) -->
              <div class="episode-fields-col">
                <div class="project-field-row">
                  <span class="project-field-label" style="font-size:1.1rem; width:130px; min-width:130px;">EPISODE NO:</span>
                  <input type="text" class="cinema-input episode-no-input" data-project-id="${prj.id}" data-ep-index="${epIdx}" value="${escapeHtml(ep.episodeNo || String(epIdx + 1).padStart(2, '0'))}" placeholder="01" style="max-width:100px;">
                </div>

                <div class="project-field-row">
                  <span class="project-field-label" style="font-size:1.1rem; width:130px; min-width:130px;">ROLE:</span>
                  <input type="text" class="cinema-input episode-role-input" data-project-id="${prj.id}" data-ep-index="${epIdx}" value="${escapeHtml(ep.role || prj.role || 'Director')}" placeholder="Role for this episode">
                </div>

                <div class="project-field-row">
                  <span class="project-field-label" style="font-size:1.1rem; width:130px; min-width:130px;">TYPE:</span>
                  <input type="text" class="cinema-input episode-type-input" data-project-id="${prj.id}" data-ep-index="${epIdx}" value="${escapeHtml(ep.type || 'Web series')}" placeholder="Web series episode">
                </div>

                <div class="project-field-row align-start">
                  <span class="project-field-label" style="font-size:1.1rem; width:130px; min-width:130px;">STORY LINE:</span>
                  <textarea class="cinema-textarea episode-story-input" data-project-id="${prj.id}" data-ep-index="${epIdx}" placeholder="Episode synopsis..." style="min-height:75px;">${escapeHtml(ep.storyline || '')}</textarea>
                </div>

                <div class="project-field-row">
                  <span class="project-field-label" style="font-size:1.1rem; width:130px; min-width:130px;">LINK:</span>
                  <input type="url" class="cinema-input episode-link-input" data-project-id="${prj.id}" data-ep-index="${epIdx}" value="${escapeHtml(ep.link || '')}" placeholder="https://youtu.be/... (Episode link)">
                </div>

                <div class="project-field-row">
                  <span class="project-field-label" style="font-size:1.1rem; width:130px; min-width:130px;">RELEASE YEAR:</span>
                  <input type="text" class="cinema-input episode-year-input" data-project-id="${prj.id}" data-ep-index="${epIdx}" value="${escapeHtml(ep.releaseYear || '2026')}" placeholder="2026" style="max-width:100px;">
                </div>
              </div>
            </div>
          </div>
        `;
        }).join("");

        // View Mode Episodes Markup
        const episodesViewCards = episodesList.map((ep, epIdx) => {
          const epThumbnail = (ep.thumbnail && ep.thumbnail.trim() !== "") 
            ? ep.thumbnail 
            : `./images/project-${String(prj.number || (index + 1)).padStart(2, '0')}-ep-${String(epIdx + 1).padStart(2, '0')}.jpg`;

          return `
          <div class="episode-showcase-card">
            <div class="episode-showcase-thumb-wrap">
              <img src="${epThumbnail}" alt="Episode ${escapeHtml(ep.episodeNo || '')}" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';">
              <div style="display:none; width:100%; height:100%; align-items:center; justify-content:center; color:var(--text-muted); font-size:1rem;"><i class="fa-solid fa-clapperboard fa-2x"></i></div>
              ${ep.link ? `
                <a href="${escapeHtml(ep.link)}" target="_blank" rel="noopener noreferrer" class="episode-showcase-play-overlay" title="Watch Episode">
                  <i class="fa-solid fa-play"></i>
                </a>
              ` : ''}
            </div>
            <div class="episode-showcase-content">
              <div class="episode-showcase-title-row">
                <span class="episode-showcase-number">EPISODE ${escapeHtml(ep.episodeNo || String(epIdx + 1).padStart(2, '0'))}</span>
                <span class="episode-showcase-year">${escapeHtml(ep.releaseYear || '2026')}</span>
              </div>
              <div class="episode-showcase-role"><i class="fa-solid fa-user-tag"></i> ${escapeHtml(ep.role || 'Director')} &bull; ${escapeHtml(ep.type || 'Web series')}</div>
              <div class="episode-showcase-storyline">${escapeHtml(ep.storyline || 'Synopsis not provided.')}</div>
              ${ep.link ? `
                <a href="${escapeHtml(ep.link)}" target="_blank" rel="noopener noreferrer" class="watch-link-btn" style="margin-top:auto;">
                  <i class="fa-solid fa-arrow-up-right-from-square"></i> Watch Episode ${escapeHtml(ep.episodeNo || (epIdx + 1))}
                </a>
              ` : ''}
            </div>
          </div>
        `;
        }).join("");

        episodesHtml = `
          <div class="episodes-section-wrap">
            <div class="episodes-header-row">
              <span class="episodes-header-title">
                <i class="fa-solid fa-tv"></i> Series Episodes (${episodesList.length})
              </span>
              <button type="button" class="btn-add-episode edit-only" data-action="add-episode" data-project-id="${prj.id}">
                <i class="fa-solid fa-plus"></i> + Add Episode
              </button>
            </div>

            <!-- Edit Mode Episodes List -->
            <div class="edit-only" style="display:flex; flex-direction:column; gap:14px; width:100%;">
              ${episodesEditCards}
            </div>

            <!-- View Mode Episodes Showcase Grid -->
            <div class="view-only episodes-showcase-grid">
              ${episodesViewCards}
            </div>
          </div>
        `;
      }

      return `
        <div class="project-card" data-id="${prj.id}">
          
          <!-- Left Column: 16:9 Thumbnail & Credit Box -->
          <div class="project-media-col">
            <!-- 16:9 Thumbnail Box -->
            <div class="thumbnail-16-9-box" data-action="view-thumbnail" data-id="${prj.id}" title="Click to view full image">
              ${prj.thumbnail 
                ? `<img src="${prj.thumbnail}" alt="${escapeHtml(prj.title || 'Project Thumbnail')}" class="thumbnail-img">`
                : `<span class="thumbnail-placeholder-text">Thumbnail</span>`
              }
            </div>
            <div class="edit-only" style="display:flex; flex-direction:column; gap:6px;">
              <input type="file" accept="image/*" class="cinema-input project-thumb-file" data-id="${prj.id}" style="font-size:0.75rem; padding:4px;">
              <input type="url" class="cinema-input project-thumb-url" data-id="${prj.id}" placeholder="Or thumbnail URL..." value="${escapeHtml(prj.thumbnail || '')}" style="font-size:0.75rem;">
            </div>

            <!-- 16:9 Credit Box -->
            <div class="credit-box-16-9" data-action="view-credit" data-id="${prj.id}">
              ${creditHtml}
            </div>
            <div class="edit-only" style="display:flex; flex-direction:column; gap:6px;">
              <div style="display:flex; gap:10px; font-size:0.8rem;">
                <label><input type="radio" name="creditType_${prj.id}" value="text" ${prj.creditType !== 'image' ? 'checked' : ''} data-id="${prj.id}"> Text Credit</label>
                <label><input type="radio" name="creditType_${prj.id}" value="image" ${prj.creditType === 'image' ? 'checked' : ''} data-id="${prj.id}"> Image Credit</label>
              </div>
              <input type="text" class="cinema-input project-credit-name" data-id="${prj.id}" placeholder="Credit text (e.g. Directed by Ram)" value="${escapeHtml(prj.creditName || '')}">
              <input type="file" accept="image/*" class="cinema-input project-credit-file" data-id="${prj.id}" style="font-size:0.75rem; padding:4px; display:${prj.creditType === 'image' ? 'block' : 'none'};">
            </div>
          </div>

          <!-- Right Column: Project Details -->
          <div class="project-details-col">

            <!-- Project No -->
            <div class="project-field-row">
              <span class="project-field-label">PROJECT NO:</span>
              <div class="project-field-val view-only">${escapeHtml(prj.number || (index + 1).toString().padStart(2, '0'))}</div>
              <input type="text" class="cinema-input edit-only project-number-input" data-id="${prj.id}" value="${escapeHtml(prj.number || '')}" placeholder="01" style="max-width:120px;">
            </div>

            <!-- Title -->
            <div class="project-field-row">
              <span class="project-field-label">TITLE:</span>
              <div class="project-field-val view-only">
                <span class="project-title-heading">${escapeHtml(prj.title || 'UNTITLED PROJECT')}</span>
              </div>
              <input type="text" class="cinema-input edit-only project-title-input" data-id="${prj.id}" value="${escapeHtml(prj.title || '')}" placeholder="Project Title...">
            </div>

            <!-- Genre -->
            <div class="project-field-row">
              <span class="project-field-label">GENRE:</span>
              <div class="project-field-val view-only">
                <span class="tag-chip">${escapeHtml(prj.genre || 'Rom-com')}</span>
              </div>
              <input type="text" class="cinema-input edit-only project-genre-input" list="genreSuggestionsList" data-id="${prj.id}" value="${escapeHtml(prj.genre || '')}" placeholder="Genre (e.g. Rom-com)">
            </div>

            <!-- Role -->
            <div class="project-field-row">
              <span class="project-field-label">ROLE:</span>
              <div class="project-field-val view-only">${escapeHtml(prj.role || 'Director')}</div>
              <input type="text" class="cinema-input edit-only project-role-input" data-id="${prj.id}" value="${escapeHtml(prj.role || '')}" placeholder="Your Role (e.g. Director)">
            </div>

            <!-- Type -->
            <div class="project-field-row">
              <span class="project-field-label">TYPE:</span>
              <div class="project-field-val view-only">
                <span class="tag-chip">${escapeHtml(prj.type || 'Web series')}</span>
              </div>
              <select class="cinema-select edit-only project-type-select" data-id="${prj.id}">
                ${PRESETS.types.map(t => `<option value="${t}" ${t === prj.type ? 'selected' : ''}>${t}</option>`).join("")}
              </select>
            </div>

            <!-- Story line (700 characters limit for series storyline) -->
            <div class="project-field-row align-start">
              <span class="project-field-label">STORY LINE:</span>
              <div class="project-field-val view-only" style="line-height:1.6; color:rgba(255,255,255,0.9);">
                ${escapeHtml(prj.storyline || 'Synopsis not provided.')}
              </div>
              <div class="edit-only" style="width:100%; display:flex; flex-direction:column; gap:4px;">
                <textarea class="cinema-textarea project-storyline-input" data-id="${prj.id}" maxlength="700" placeholder="Series overarching story line (0-700 characters)...">${escapeHtml(prj.storyline || '')}</textarea>
                <span class="char-counter prj-storyline-counter" data-id="${prj.id}" style="text-align:right;">${(prj.storyline || '').length} / 700 chars</span>
              </div>
            </div>

            <!-- Available on -->
            <div class="project-field-row">
              <span class="project-field-label">AVAILABLE ON:</span>
              <div class="project-field-val view-only">
                <span class="platform-pill"><i class="fa-solid fa-play"></i> ${escapeHtml(prj.availableOn || 'YouTube')}</span>
              </div>
              <select class="cinema-select edit-only project-platform-select" data-id="${prj.id}">
                ${PRESETS.platforms.map(p => `<option value="${p}" ${p === prj.availableOn ? 'selected' : ''}>${p}</option>`).join("")}
              </select>
            </div>

            <!-- For Non-Webseries: direct Link & Release Year -->
            ${!isWebseries ? `
              <!-- Link -->
              <div class="project-field-row">
                <span class="project-field-label">LINK:</span>
                <div class="project-field-val view-only">
                  ${prj.link 
                    ? `<a href="${escapeHtml(prj.link)}" target="_blank" rel="noopener noreferrer" class="watch-link-btn"><i class="fa-solid fa-arrow-up-right-from-square"></i> Watch / Test Link</a>` 
                    : `<span style="color:var(--text-muted);">No link provided</span>`
                  }
                </div>
                <input type="url" class="cinema-input edit-only project-link-input" data-id="${prj.id}" value="${escapeHtml(prj.link || '')}" placeholder="https://youtube.com/watch?v=...">
              </div>

              <!-- Release Year -->
              <div class="project-field-row">
                <span class="project-field-label">RELEASE YEAR:</span>
                <div class="project-field-val view-only">${escapeHtml(prj.releaseYear || '2026')}</div>
                <input type="text" class="cinema-input edit-only project-year-input" data-id="${prj.id}" value="${escapeHtml(prj.releaseYear || '')}" placeholder="2026" style="max-width:120px;">
              </div>
            ` : ''}

            <!-- Episodes Section (For Webseries) -->
            ${episodesHtml}

            <!-- Edit Mode Actions: Duplicate, Delete, Move -->
            <div class="card-actions-bar edit-only">
              <button type="button" class="btn-cinema btn-ghost" data-action="move-up" data-id="${prj.id}" ${isFirst ? 'disabled style="opacity:0.4;"' : ''} title="Move Up">
                <i class="fa-solid fa-arrow-up"></i>
              </button>
              <button type="button" class="btn-cinema btn-ghost" data-action="move-down" data-id="${prj.id}" ${isLast ? 'disabled style="opacity:0.4;"' : ''} title="Move Down">
                <i class="fa-solid fa-arrow-down"></i>
              </button>
              <button type="button" class="btn-cinema btn-ghost" data-action="duplicate" data-id="${prj.id}" title="Duplicate Project">
                <i class="fa-solid fa-clone"></i> Duplicate
              </button>
              <button type="button" class="btn-cinema btn-ghost" data-action="delete" data-id="${prj.id}" style="color:#ef4444;" title="Delete Project">
                <i class="fa-solid fa-trash"></i> Delete
              </button>
            </div>

          </div>

        </div>
      `;
    }).join("");
  }

  // ==========================================================================
  // 5. INPUT COLLECTION INTO STATE
  // ==========================================================================
  function collectInputsToState() {
    if (!appData) return;
    const p = appData.profile;

    const avatarUrl = document.getElementById("avatarUrlInput");
    if (avatarUrl) p.avatarUrl = avatarUrl.value.trim();

    const avatarScale = document.getElementById("avatarScaleRange");
    if (avatarScale) p.avatarScale = parseInt(avatarScale.value, 10) || 100;

    const avatarOffset = document.getElementById("avatarOffsetRange");
    if (avatarOffset) p.avatarOffset = parseInt(avatarOffset.value, 10) || 50;

    const statusSelect = document.getElementById("statusSelect");
    if (statusSelect) p.status = statusSelect.value;

    const mobileInput = document.getElementById("mobileInput");
    if (mobileInput) p.mobile = mobileInput.value.trim();

    const emailInput = document.getElementById("emailInput");
    if (emailInput) p.email = emailInput.value.trim();

    const usernameInput = document.getElementById("usernameInput");
    if (usernameInput) p.username = usernameInput.value.trim();

    const nameInput = document.getElementById("nameInput");
    if (nameInput) p.name = nameInput.value.trim();

    // Gender
    const genderRadios = document.getElementsByName("genderRadio");
    for (let r of genderRadios) {
      if (r.checked) {
        p.gender = r.value;
        break;
      }
    }

    const dobInput = document.getElementById("dobInput");
    if (dobInput) p.dob = dobInput.value;

    const ageInput = document.getElementById("ageInput");
    if (ageInput) p.age = ageInput.value.trim();

    const stateInput = document.getElementById("stateInput");
    if (stateInput) p.state = stateInput.value.trim();

    const cityInput = document.getElementById("cityInput");
    if (cityInput) p.city = cityInput.value.trim();

    const placeInput = document.getElementById("placeInput");
    if (placeInput) p.place = placeInput.value.trim();

    const expInput = document.getElementById("experienceInput");
    if (expInput) p.experienceYears = expInput.value.trim();

    const availSelect = document.getElementById("availabilitySelect");
    if (availSelect) p.availability = availSelect.value;

    // Sub-profiles zoom scale values
    ["1", "2", "3"].forEach(idx => {
      const scaleInput = document.getElementById(`p${idx}ScaleRange`);
      if (scaleInput) {
        p[`p${idx}Scale`] = parseInt(scaleInput.value, 10) || 100;
      }
    });

    // Socials (Including Facebook)
    const ig = document.getElementById("socialInputInstagram");
    const fb = document.getElementById("socialInputFacebook");
    const wa = document.getElementById("socialInputWhatsapp");
    const yt = document.getElementById("socialInputYoutube");
    const x = document.getElementById("socialInputX");

    p.socials = {
      instagram: ig ? ig.value.trim() : (p.socials.instagram || ""),
      facebook: fb ? fb.value.trim() : (p.socials.facebook || ""),
      whatsapp: wa ? wa.value.trim() : (p.socials.whatsapp || ""),
      youtube: yt ? yt.value.trim() : (p.socials.youtube || ""),
      x: x ? x.value.trim() : (p.socials.x || "")
    };

    // Summary
    const bioInp = document.getElementById("bioInput");
    const motiveInp = document.getElementById("motiveInput");
    appData.summary = {
      bio: bioInp ? bioInp.value : (appData.summary?.bio || ""),
      motive: motiveInp ? motiveInp.value : (appData.summary?.motive || "")
    };

    // Project Header
    const noPrj = document.getElementById("noOfProjectsInput");
    if (noPrj) appData.projectHeader.noOfProjects = noPrj.value.trim();

    // Collect Project Cards from DOM
    document.querySelectorAll(".project-card").forEach(card => {
      const id = card.dataset.id;
      const prj = appData.projects.find(x => x.id === id);
      if (!prj) return;

      const numInput = card.querySelector(".project-number-input");
      const titleInput = card.querySelector(".project-title-input");
      const genreInput = card.querySelector(".project-genre-input");
      const roleInput = card.querySelector(".project-role-input");
      const typeSelect = card.querySelector(".project-type-select");
      const storylineInput = card.querySelector(".project-storyline-input");
      const platformSelect = card.querySelector(".project-platform-select");
      const linkInput = card.querySelector(".project-link-input");
      const yearInput = card.querySelector(".project-year-input");
      const thumbUrlInput = card.querySelector(".project-thumb-url");
      const creditNameInput = card.querySelector(".project-credit-name");

      if (numInput) prj.number = numInput.value.trim();
      if (titleInput) prj.title = titleInput.value.trim();
      if (genreInput) prj.genre = genreInput.value.trim();
      if (roleInput) prj.role = roleInput.value.trim();
      if (typeSelect) prj.type = typeSelect.value;
      if (storylineInput) prj.storyline = storylineInput.value;
      if (platformSelect) prj.availableOn = platformSelect.value;
      if (linkInput) prj.link = linkInput.value.trim();
      if (yearInput) prj.releaseYear = yearInput.value.trim();
      if (thumbUrlInput && thumbUrlInput.value.trim()) prj.thumbnail = thumbUrlInput.value.trim();
      if (creditNameInput) prj.creditName = creditNameInput.value.trim();

      // Collect Episodes if present
      if (card.querySelectorAll(".episode-item-row").length > 0) {
        if (!prj.episodes) prj.episodes = [];
        card.querySelectorAll(".episode-item-row").forEach((epRow, epIdx) => {
          let ep = prj.episodes[epIdx];
          if (!ep) {
            ep = { id: "ep-" + Date.now() + "-" + epIdx };
            prj.episodes.push(ep);
          }
          const epNoInput = epRow.querySelector(".episode-no-input");
          const epRoleInput = epRow.querySelector(".episode-role-input");
          const epTypeInput = epRow.querySelector(".episode-type-input");
          const epStoryInput = epRow.querySelector(".episode-story-input");
          const epLinkInput = epRow.querySelector(".episode-link-input");
          const epYearInput = epRow.querySelector(".episode-year-input");
          const epThumbUrl = epRow.querySelector(".episode-thumb-url");

          if (epNoInput) ep.episodeNo = epNoInput.value.trim();
          if (epRoleInput) ep.role = epRoleInput.value.trim();
          if (epTypeInput) ep.type = epTypeInput.value.trim();
          if (epStoryInput) ep.storyline = epStoryInput.value.trim();
          if (epLinkInput) ep.link = epLinkInput.value.trim();
          if (epYearInput) ep.releaseYear = epYearInput.value.trim();
          if (epThumbUrl && epThumbUrl.value.trim()) ep.thumbnail = epThumbUrl.value.trim();
        });
      }
    });
  }

  // ==========================================================================
  // 6. EVENT BINDINGS
  // ==========================================================================
  function bindEvents() {

    // Mode Toggles (Edit vs Showcase)
    const btnModeEdit = document.getElementById("btnModeEdit");
    const btnModeView = document.getElementById("btnModeView");

    if (btnModeEdit) {
      btnModeEdit.addEventListener("click", () => {
        if (!isSuperAdmin) return;
        currentMode = "edit";
        updateSuperAdminUI();
      });
    }

    if (btnModeView) {
      btnModeView.addEventListener("click", () => {
        collectInputsToState();
        saveState(false);
        renderAll();
        currentMode = "showcase";
        updateSuperAdminUI();
      });
    }

    // Save Button
    const btnSaveData = document.getElementById("btnSaveData");
    if (btnSaveData) {
      btnSaveData.addEventListener("click", async () => {
        if (!isSuperAdmin) return;
        await saveState(true);
        renderAll();
      });
    }

    // Backup JSON Button
    const btnExportData = document.getElementById("btnExportData");
    if (btnExportData) {
      btnExportData.addEventListener("click", () => {
        collectInputsToState();
        const dataStr = JSON.stringify(appData, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const dateStr = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `thota_venkat_sai_filmography_backup_${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("Portfolio backup JSON downloaded successfully! ✓", "success");
      });
    }

    // Restore JSON Button
    const btnImportData = document.getElementById("btnImportData");
    const importJsonFileInput = document.getElementById("importJsonFileInput");
    if (btnImportData && importJsonFileInput) {
      btnImportData.addEventListener("click", () => importJsonFileInput.click());
      importJsonFileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const imported = JSON.parse(event.target.result);
            if (!imported || !imported.profile) {
              throw new Error("Invalid portfolio format");
            }
            appData = mergeWithDefaults(imported, DEFAULT_PORTFOLIO_DATA);
            await saveState(false);
            renderAll();
            showToast("Portfolio restored from JSON backup! ✓", "success");
          } catch (err) {
            alert("Failed to import JSON file. Please ensure it is a valid filmography backup.");
          }
        };
        reader.readAsText(file);
        importJsonFileInput.value = "";
      });
    }

    // Reset Data
    const btnResetData = document.getElementById("btnResetData");
    if (btnResetData) {
      btnResetData.addEventListener("click", () => {
        if (!isSuperAdmin) return;
        if (confirm("Reset to sample portfolio data? All fields will be refreshed to clean defaults.")) {
          appData = JSON.parse(JSON.stringify(DEFAULT_PORTFOLIO_DATA));
          saveState(false);
          renderAll();
          showToast("Reset to default cinematic portfolio.", "info");
        }
      });
    }

    // Super Logout Button
    const btnSuperLogout = document.getElementById("btnSuperLogout");
    if (btnSuperLogout) {
      btnSuperLogout.addEventListener("click", () => {
        logoutSuperAdmin();
      });
    }

    function logoutSuperAdmin() {
      isSuperAdmin = false;
      currentMode = "showcase";
      sessionStorage.removeItem("filmography_super_admin");
      updateSuperAdminUI();
      showToast("Studio locked. Portfolio is now in public showcase view.", "info");
    }

    // Super Login Modal Management
    const superLoginModal = document.getElementById("superLoginModal");
    const btnSuperLoginTrigger = document.getElementById("btnSuperLoginTrigger");
    const btnCloseSuperLogin = document.getElementById("btnCloseSuperLogin");
    const superLoginForm = document.getElementById("superLoginForm");
    const superPasscodeInput = document.getElementById("superPasscodeInput");
    const loginErrorMsg = document.getElementById("loginErrorMsg");
    const btnTogglePasscodeVisibility = document.getElementById("btnTogglePasscodeVisibility");
    const eyeIcon = document.getElementById("eyeIcon");

    function openSuperLoginModal() {
      if (superLoginModal) {
        superLoginModal.classList.add("open");
        superLoginModal.style.display = "flex";
        superLoginModal.style.opacity = "1";
        superLoginModal.style.pointerEvents = "auto";
        if (loginErrorMsg) loginErrorMsg.style.display = "none";
        if (superPasscodeInput) {
          superPasscodeInput.value = "";
          setTimeout(() => superPasscodeInput.focus(), 150);
        }
      }
    }

    function closeSuperLoginModal() {
      if (superLoginModal) {
        superLoginModal.classList.remove("open");
        superLoginModal.style.display = "none";
        superLoginModal.style.opacity = "0";
        superLoginModal.style.pointerEvents = "none";
      }
    }

    function handleTriggerSuperLogin() {
      if (isSuperAdmin) {
        if (confirm("You are currently logged in as Super Admin. Do you want to logout and lock the portfolio?")) {
          logoutSuperAdmin();
        }
        return;
      }
      openSuperLoginModal();
    }

    if (btnSuperLoginTrigger) {
      btnSuperLoginTrigger.addEventListener("click", (e) => {
        e.stopPropagation();
        handleTriggerSuperLogin();
      });
    }

    const headerRightBadge = document.querySelector(".header-right-title");
    if (headerRightBadge) {
      headerRightBadge.style.cursor = "pointer";
      headerRightBadge.addEventListener("click", () => {
        handleTriggerSuperLogin();
      });
    }

    if (btnCloseSuperLogin) {
      btnCloseSuperLogin.addEventListener("click", closeSuperLoginModal);
    }

    if (superLoginModal) {
      superLoginModal.addEventListener("click", (e) => {
        if (e.target === superLoginModal) closeSuperLoginModal();
      });
    }

    if (btnTogglePasscodeVisibility && superPasscodeInput) {
      btnTogglePasscodeVisibility.addEventListener("click", () => {
        const isPassword = superPasscodeInput.type === "password";
        superPasscodeInput.type = isPassword ? "text" : "password";
        if (eyeIcon) {
          eyeIcon.className = isPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye";
        }
      });
    }

    if (superLoginForm) {
      superLoginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const code = (superPasscodeInput?.value || "").trim();
        const validCodes = ["venkat2026", "admin123", "cinema2026", (localStorage.getItem("filmography_custom_passcode") || "").trim()].filter(Boolean);

        if (validCodes.includes(code)) {
          isSuperAdmin = true;
          currentMode = "edit";
          sessionStorage.setItem("filmography_super_admin", "true");
          updateSuperAdminUI();
          closeSuperLoginModal();
          showToast("Super Admin unlocked! Studio tools activated. 🎬", "success");
        } else {
          if (loginErrorMsg) {
            loginErrorMsg.textContent = "Incorrect passcode. Please try again.";
            loginErrorMsg.style.display = "block";
          }
          if (superPasscodeInput) {
            superPasscodeInput.style.borderColor = "#ff333d";
            superPasscodeInput.focus();
            setTimeout(() => {
              if (superPasscodeInput) superPasscodeInput.style.borderColor = "";
            }, 1500);
          }
        }
      });
    }

    // Keyboard shortcut (Ctrl + Shift + L or Alt + L) to toggle Super Login
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "l") || (e.altKey && e.key.toLowerCase() === "l")) {
        e.preventDefault();
        if (isSuperAdmin) {
          currentMode = currentMode === "edit" ? "showcase" : "edit";
          updateSuperAdminUI();
          showToast(`Switched to ${currentMode === 'edit' ? 'Edit Mode' : 'Showcase View'}`, "info");
        } else {
          openSuperLoginModal();
        }
      }
      if (e.key === "Escape") {
        closeSuperLoginModal();
      }
    });

    // Download as PDF (In Footer)
    const btnDownloadPdf = document.getElementById("btnDownloadPdf");
    if (btnDownloadPdf) {
      btnDownloadPdf.addEventListener("click", () => {
        collectInputsToState();
        saveState(false);
        renderAll();

        const wasEditMode = document.body.classList.contains("body-edit-mode");
        document.body.classList.remove("body-edit-mode");

        setTimeout(() => {
          window.print();
          if (wasEditMode && isSuperAdmin && currentMode === "edit") {
            document.body.classList.add("body-edit-mode");
          }
        }, 250);
      });
    }

    // Auto-save & sync on typing
    document.addEventListener("input", (e) => {
      // Storyline char counter update
      if (e.target.classList.contains("project-storyline-input")) {
        const prjId = e.target.dataset.id;
        const counter = document.querySelector(`.prj-storyline-counter[data-id="${prjId}"]`);
        if (counter) {
          counter.textContent = `${e.target.value.length} / 700 chars`;
          counter.style.color = e.target.value.length > 650 ? "#ff333d" : "var(--text-muted)";
        }
      }
      if (e.target.id === "bioInput") {
        updateCounter("bioCounter", e.target.value.length, 700);
      }
      if (e.target.id === "motiveInput") {
        updateCounter("motiveCounter", e.target.value.length, 300);
      }
      triggerAutoSave();
    });

    // Main Avatar Controls
    const avatarFileInput = document.getElementById("avatarFileInput");
    const avatarUrlInput = document.getElementById("avatarUrlInput");
    const avatarScaleRange = document.getElementById("avatarScaleRange");
    const avatarOffsetRange = document.getElementById("avatarOffsetRange");
    const btnClearAvatar = document.getElementById("btnClearAvatar");
    const avatarEditTrigger = document.getElementById("avatarEditTrigger");

    if (avatarEditTrigger) {
      avatarEditTrigger.addEventListener("click", () => avatarFileInput.click());
    }

    avatarFileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (file) {
        const compressed = await compressImageFile(file, 1000, 0.85);
        appData.profile.avatarUrl = compressed;
        renderProfile();
        saveState(false);
        showToast("Profile picture updated & optimized!", "success");
      }
    });

    avatarUrlInput.addEventListener("input", (e) => {
      appData.profile.avatarUrl = e.target.value.trim();
      renderProfile();
      triggerAutoSave();
    });

    avatarScaleRange.addEventListener("input", (e) => {
      appData.profile.avatarScale = parseInt(e.target.value, 10) || 100;
      const avatarImg = document.getElementById("avatarImg");
      if (avatarImg) {
        avatarImg.style.transform = `scale(${appData.profile.avatarScale / 100})`;
      }
      triggerAutoSave();
    });

    if (avatarOffsetRange) {
      avatarOffsetRange.addEventListener("input", (e) => {
        appData.profile.avatarOffset = parseInt(e.target.value, 10) || 50;
        const avatarImg = document.getElementById("avatarImg");
        if (avatarImg) {
          avatarImg.style.objectPosition = `center ${appData.profile.avatarOffset}%`;
        }
        triggerAutoSave();
      });
    }

    btnClearAvatar.addEventListener("click", () => {
      appData.profile.avatarUrl = "";
      avatarFileInput.value = "";
      avatarUrlInput.value = "";
      renderProfile();
      saveState(false);
      showToast("Profile picture cleared.", "info");
    });

    // Status Select
    document.getElementById("statusSelect").addEventListener("change", (e) => {
      appData.profile.status = e.target.value;
      updateStatusBadge(e.target.value);
      saveState(false);
    });

    // Sub-profile zoom sliders (P1, P2, P3)
    ["1", "2", "3"].forEach(idx => {
      const slider = document.getElementById(`p${idx}ScaleRange`);
      if (slider) {
        slider.addEventListener("input", (e) => {
          const val = parseInt(e.target.value, 10) || 100;
          appData.profile[`p${idx}Scale`] = val;
          const img = document.getElementById(`pImg${idx}`);
          if (img) img.style.transform = `scale(${val / 100})`;
          triggerAutoSave();
        });
      }
    });

    // Sub-profile P1, P2, P3 File Upload
    const pFileInput = document.getElementById("pTripletFileInput");
    pFileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (file && activePIndexToUpload) {
        const compressed = await compressImageFile(file, 1200, 0.85);
        appData.profile[`p${activePIndexToUpload}`] = compressed;
        renderProfile();
        saveState(false);
        showToast(`Sub-profile P${activePIndexToUpload} image updated!`, "success");
      }
      pFileInput.value = "";
    });

    // Portfolio Triplet Box Click Actions
    document.getElementById("portfolioTripletBox").addEventListener("click", (e) => {
      const cellBtn = e.target.closest(".cell-btn");
      if (cellBtn) {
        e.stopPropagation();
        const action = cellBtn.dataset.action;
        const idx = cellBtn.dataset.index;
        if (action === "upload") {
          activePIndexToUpload = idx;
          pFileInput.click();
        } else if (action === "clear") {
          appData.profile[`p${idx}`] = "";
          renderProfile();
          saveState(false);
          showToast(`Cleared P${idx} image.`, "info");
        }
        return;
      }

      const cell = e.target.closest(".portfolio-cell");
      if (cell) {
        const idx = cell.dataset.index;
        if (document.body.classList.contains("body-edit-mode")) {
          activePIndexToUpload = idx;
          pFileInput.click();
        } else {
          const imgSrc = appData.profile[`p${idx}`];
          if (imgSrc) openLightbox(imgSrc);
        }
      }
    });

    // Sub-profile clear buttons in adjustment panel
    document.addEventListener("click", (e) => {
      const clearPBtn = e.target.closest('[data-action="clear-p"]');
      if (clearPBtn) {
        const idx = clearPBtn.dataset.index;
        appData.profile[`p${idx}`] = "";
        renderProfile();
        saveState(false);
        showToast(`Cleared P${idx} image.`, "info");
      }
    });

    // Filter Tabs
    document.getElementById("projectFilterTabs").addEventListener("click", (e) => {
      const tab = e.target.closest(".filter-tab-btn");
      if (!tab) return;
      collectInputsToState();
      document.querySelectorAll(".filter-tab-btn").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentFilter = tab.dataset.filter;
      renderProjects();
    });

    // Add New Project
    document.getElementById("btnAddNewProject").addEventListener("click", () => {
      collectInputsToState();
      const newNum = String((appData.projects || []).length + 1).padStart(2, "0");
      const newPrj = {
        id: "prj-" + Date.now(),
        number: newNum,
        title: "NEW CINEMA PROJECT",
        thumbnail: "",
        creditType: "text",
        creditName: "Directed by " + (appData.profile.name || "You"),
        creditImage: "",
        genre: "Rom-com",
        role: "Director",
        type: currentFilter !== "All" ? currentFilter : "Web series",
        storyline: "",
        availableOn: "YouTube",
        link: "",
        releaseYear: new Date().getFullYear().toString(),
        episodes: [
          {
            id: "ep-" + Date.now(),
            episodeNo: "01",
            title: "Episode 1",
            role: "Director",
            type: "Web series",
            storyline: "",
            link: "",
            releaseYear: new Date().getFullYear().toString(),
            thumbnail: ""
          }
        ]
      };
      appData.projects.push(newPrj);
      appData.projectHeader.noOfProjects = String(appData.projects.length).padStart(2, "0");
      renderAll();
      saveState(false);
      showToast("Added new project card!", "success");
    });

    // Delegated Project Actions & Episodes Actions
    const prjContainer = document.getElementById("projectsContainer");

    prjContainer.addEventListener("click", (e) => {
      // Add Episode button
      const addEpBtn = e.target.closest('[data-action="add-episode"]');
      if (addEpBtn) {
        collectInputsToState();
        const prjId = addEpBtn.dataset.projectId;
        const prj = appData.projects.find(p => p.id === prjId);
        if (prj) {
          if (!prj.episodes) prj.episodes = [];
          const nextEpNum = String(prj.episodes.length + 1).padStart(2, "0");
          prj.episodes.push({
            id: "ep-" + Date.now(),
            episodeNo: nextEpNum,
            title: `Episode ${prj.episodes.length + 1}`,
            role: prj.role || "Director",
            type: "Web series",
            storyline: "",
            link: "",
            releaseYear: prj.releaseYear || "2026",
            thumbnail: ""
          });
          renderProjects();
          saveState(false);
          showToast(`Added Episode ${nextEpNum}!`, "success");
        }
        return;
      }

      // Delete Episode button
      const delEpBtn = e.target.closest('[data-action="delete-episode"]');
      if (delEpBtn) {
        const prjId = delEpBtn.dataset.projectId;
        const epIdx = parseInt(delEpBtn.dataset.epIndex, 10);
        const prj = appData.projects.find(p => p.id === prjId);
        if (prj && prj.episodes && prj.episodes.length > 1) {
          if (confirm(`Delete Episode ${prj.episodes[epIdx].episodeNo || (epIdx + 1)}?`)) {
            collectInputsToState();
            prj.episodes.splice(epIdx, 1);
            renderProjects();
            saveState(false);
            showToast("Episode removed.", "info");
          }
        }
        return;
      }

      // View full images in lightbox
      const viewThumb = e.target.closest('[data-action="view-thumbnail"]');
      if (viewThumb) {
        const prj = appData.projects.find(p => p.id === viewThumb.dataset.id);
        if (prj && prj.thumbnail) openLightbox(prj.thumbnail);
        return;
      }

      const viewEpThumb = e.target.closest('[data-action="view-episode-thumb"]');
      if (viewEpThumb) {
        const prj = appData.projects.find(p => p.id === viewEpThumb.dataset.projectId);
        const epIdx = parseInt(viewEpThumb.dataset.epIndex, 10);
        if (prj && prj.episodes && prj.episodes[epIdx]?.thumbnail) {
          openLightbox(prj.episodes[epIdx].thumbnail);
        }
        return;
      }

      const viewCredit = e.target.closest('[data-action="view-credit"]');
      if (viewCredit) {
        const prj = appData.projects.find(p => p.id === viewCredit.dataset.id);
        if (prj && prj.creditType === "image" && prj.creditImage) {
          openLightbox(prj.creditImage);
        }
        return;
      }

      // Card action buttons (Duplicate, Delete, Move)
      const actionBtn = e.target.closest(".card-actions-bar button");
      if (actionBtn) {
        const action = actionBtn.dataset.action;
        const id = actionBtn.dataset.id;
        handleProjectAction(action, id);
      }
    });

    // Delegated Change Listeners for Type Selector and Files
    prjContainer.addEventListener("change", async (e) => {
      // Type select changed -> If changed to Web series, ensure episodes exist
      if (e.target.classList.contains("project-type-select")) {
        collectInputsToState();
        const prjId = e.target.dataset.id;
        const prj = appData.projects.find(p => p.id === prjId);
        if (prj) {
          prj.type = e.target.value;
          if (prj.type === "Web series" || prj.type === "Short-series") {
            if (!prj.episodes || prj.episodes.length === 0) {
              prj.episodes = [
                {
                  id: "ep-" + Date.now(),
                  episodeNo: "01",
                  title: prj.title ? `${prj.title} - Episode 1` : "Episode 1",
                  role: prj.role || "Director",
                  type: "Web series",
                  storyline: prj.storyline || "",
                  link: prj.link || "",
                  releaseYear: prj.releaseYear || "2026",
                  thumbnail: prj.thumbnail || ""
                }
              ];
            }
          }
          renderProjects();
          saveState(false);
        }
        return;
      }

      // Project thumbnail file upload
      if (e.target.classList.contains("project-thumb-file")) {
        const file = e.target.files[0];
        const prjId = e.target.dataset.id;
        if (file && prjId) {
          const compressed = await compressImageFile(file, 1280, 0.82);
          const prj = appData.projects.find(p => p.id === prjId);
          if (prj) {
            prj.thumbnail = compressed;
            renderProjects();
            saveState(false);
            showToast("Project thumbnail updated!", "success");
          }
        }
        return;
      }

      // Episode thumbnail file upload
      if (e.target.classList.contains("episode-thumb-file")) {
        const file = e.target.files[0];
        const prjId = e.target.dataset.projectId;
        const epIdx = parseInt(e.target.dataset.epIndex, 10);
        if (file && prjId) {
          const compressed = await compressImageFile(file, 1280, 0.82);
          const prj = appData.projects.find(p => p.id === prjId);
          if (prj && prj.episodes && prj.episodes[epIdx]) {
            prj.episodes[epIdx].thumbnail = compressed;
            renderProjects();
            saveState(false);
            showToast(`Episode ${prj.episodes[epIdx].episodeNo} poster updated!`, "success");
          }
        }
        return;
      }

      // Project Credit image upload
      if (e.target.classList.contains("project-credit-file")) {
        const file = e.target.files[0];
        const prjId = e.target.dataset.id;
        if (file && prjId) {
          const compressed = await compressImageFile(file, 1000, 0.82);
          const prj = appData.projects.find(p => p.id === prjId);
          if (prj) {
            prj.creditImage = compressed;
            prj.creditType = "image";
            renderProjects();
            saveState(false);
            showToast("Project credit image updated!", "success");
          }
        }
        return;
      }

      // Radio credit type
      if (e.target.name && e.target.name.startsWith("creditType_")) {
        const prjId = e.target.dataset.id;
        const prj = appData.projects.find(p => p.id === prjId);
        if (prj) {
          prj.creditType = e.target.value;
          renderProjects();
          saveState(false);
        }
      }
    });

    // Tag actions delegation (Add custom, remove chip, toggle preset)
    document.addEventListener("click", (e) => {
      // Remove chip
      const removeBtn = e.target.closest(".remove-chip-btn");
      if (removeBtn) {
        const type = removeBtn.dataset.type;
        const idx = parseInt(removeBtn.dataset.index, 10);
        removeTagItem(type, idx);
        return;
      }

      // Preset suggestion chip toggle
      const chipSuggestion = e.target.closest(".chip-suggestion");
      if (chipSuggestion) {
        const type = chipSuggestion.dataset.type;
        const val = chipSuggestion.dataset.val;
        toggleTagItem(type, val);
        return;
      }

      // Add custom tag button
      const addCustomBtn = e.target.closest('[data-action="add-custom-tag"]');
      if (addCustomBtn) {
        const type = addCustomBtn.dataset.type;
        const inp = document.getElementById(`${type}CustomInput`);
        if (inp && inp.value.trim().length > 0) {
          addCustomTagItem(type, inp.value.trim());
          inp.value = "";
        }
        return;
      }
    });

    // Lightbox Modal Close
    document.getElementById("btnCloseLightbox").addEventListener("click", closeLightbox);
    document.getElementById("imageLightboxModal").addEventListener("click", (e) => {
      if (e.target.id === "imageLightboxModal") closeLightbox();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeLightbox();
    });
  }

  // ==========================================================================
  // 7. TAG ACTIONS
  // ==========================================================================
  function getTagListRef(type) {
    const p = appData.profile;
    if (type === "category") return p.categories;
    if (type === "interest") return p.areaOfInterest;
    if (type === "genre") return p.interestedGenre;
    if (type === "type") return p.interestedType;
    if (type === "language") return p.languagesKnown;
    if (type === "projectTypes") return appData.projectHeader.typesOfProjects;
    return [];
  }

  function setTagListRef(type, newList) {
    const p = appData.profile;
    if (type === "category") p.categories = newList;
    if (type === "interest") p.areaOfInterest = newList;
    if (type === "genre") p.interestedGenre = newList;
    if (type === "type") p.interestedType = newList;
    if (type === "language") p.languagesKnown = newList;
    if (type === "projectTypes") appData.projectHeader.typesOfProjects = newList;
  }

  function toggleTagItem(type, val) {
    let list = getTagListRef(type);
    if (!list) list = [];
    if (list.includes(val)) {
      list = list.filter(item => item !== val);
    } else {
      list.push(val);
    }
    setTagListRef(type, list);
    renderAll();
    saveState(false);
  }

  function removeTagItem(type, idx) {
    let list = getTagListRef(type);
    if (list && list.length > idx) {
      list.splice(idx, 1);
      setTagListRef(type, list);
      renderAll();
      saveState(false);
    }
  }

  function addCustomTagItem(type, val) {
    let list = getTagListRef(type);
    if (!list) list = [];
    if (!list.includes(val)) {
      list.push(val);
      setTagListRef(type, list);
      renderAll();
      saveState(false);
    }
  }

  // ==========================================================================
  // 8. PROJECT ACTIONS (Duplicate, Delete, Move)
  // ==========================================================================
  function handleProjectAction(action, id) {
    collectInputsToState();
    const idx = appData.projects.findIndex(p => p.id === id);
    if (idx === -1) return;

    if (action === "delete") {
      if (confirm(`Delete project "${appData.projects[idx].title || 'Untitled'}"?`)) {
        appData.projects.splice(idx, 1);
        appData.projectHeader.noOfProjects = String(appData.projects.length).padStart(2, "0");
        renderAll();
        saveState(false);
        showToast("Project deleted.", "info");
      }
    } else if (action === "duplicate") {
      const orig = appData.projects[idx];
      const dup = JSON.parse(JSON.stringify(orig));
      dup.id = "prj-" + Date.now();
      dup.number = String(appData.projects.length + 1).padStart(2, "0");
      dup.title = `${orig.title} (Copy)`;
      appData.projects.splice(idx + 1, 0, dup);
      appData.projectHeader.noOfProjects = String(appData.projects.length).padStart(2, "0");
      renderAll();
      saveState(false);
      showToast("Project duplicated!", "success");
    } else if (action === "move-up" && idx > 0) {
      const temp = appData.projects[idx];
      appData.projects[idx] = appData.projects[idx - 1];
      appData.projects[idx - 1] = temp;
      renderAll();
      saveState(false);
    } else if (action === "move-down" && idx < appData.projects.length - 1) {
      const temp = appData.projects[idx];
      appData.projects[idx] = appData.projects[idx + 1];
      appData.projects[idx + 1] = temp;
      renderAll();
      saveState(false);
    }
  }

  // ==========================================================================
  // 9. UTILITIES & LIGHTBOX
  // ==========================================================================
  function openLightbox(imgSrc) {
    const modal = document.getElementById("imageLightboxModal");
    const img = document.getElementById("lightboxImage");
    img.src = imgSrc;
    modal.classList.add("open");
  }

  function closeLightbox() {
    const modal = document.getElementById("imageLightboxModal");
    modal.classList.remove("open");
  }

  function formatDate(isoStr) {
    if (!isoStr) return "Not provided";
    try {
      const parts = isoStr.split("-");
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return isoStr;
    } catch (e) {
      return isoStr;
    }
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    const icon = type === "success" ? "fa-circle-check" : (type === "error" ? "fa-circle-xmark" : "fa-circle-info");
    toast.innerHTML = `<i class="fa-solid ${icon}" style="color:${type === 'success' ? '#22c55e' : '#ff333d'};"></i> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = "slideInRight 0.3s ease reverse";
      setTimeout(() => toast.remove(), 280);
    }, 2500);
  }

  function initElements() {
    // Populate Genre suggestions datalist
    let genreDatalist = document.getElementById("genreSuggestionsList");
    if (!genreDatalist) {
      genreDatalist = document.createElement("datalist");
      genreDatalist.id = "genreSuggestionsList";
      genreDatalist.innerHTML = PRESETS.genres.map(g => `<option value="${g}"></option>`).join("");
      document.body.appendChild(genreDatalist);
    }
  }
});
