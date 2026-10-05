(() => {
  const state = {
    a: { label: "You", movies: new Map() },
    b: { label: "Friend", movies: new Map() },
    zone: "both",
    query: "",
  };

  const els = {
    fileA: document.getElementById("file-a"),
    fileB: document.getElementById("file-b"),
    nameA: document.getElementById("name-a"),
    nameB: document.getElementById("name-b"),
    ctaA: document.getElementById("cta-a"),
    ctaB: document.getElementById("cta-b"),
    metaA: document.getElementById("meta-a"),
    metaB: document.getElementById("meta-b"),
    results: document.getElementById("results"),
    hint: document.getElementById("hint"),
    venn: document.getElementById("venn"),
    countOnlyA: document.getElementById("count-onlyA"),
    countBoth: document.getElementById("count-both"),
    countOnlyB: document.getElementById("count-onlyB"),
    tabOnlyA: document.getElementById("tab-onlyA"),
    tabOnlyB: document.getElementById("tab-onlyB"),
    list: document.getElementById("movie-list"),
    listCount: document.getElementById("list-count"),
    empty: document.getElementById("empty"),
    search: document.getElementById("search"),
    reset: document.getElementById("reset"),
    zoneTabs: [...document.querySelectorAll(".zone-tab")],
    uploadA: document.querySelector('.upload[data-side="a"]'),
    uploadB: document.querySelector('.upload[data-side="b"]'),
  };

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      const next = text[i + 1];

      if (inQuotes) {
        if (char === '"' && next === '"') {
          field += '"';
          i += 1;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          field += char;
        }
        continue;
      }

      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        row.push(field);
        field = "";
      } else if (char === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else if (char === "\r") {
        // ignore CR; handled with LF
      } else {
        field += char;
      }
    }

    if (field.length || row.length) {
      row.push(field);
      rows.push(row);
    }

    return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
  }

  function movieKey(name, year, uri) {
    if (uri && uri.trim()) return `uri:${uri.trim().toLowerCase()}`;
    const n = (name || "").trim().toLowerCase();
    const y = (year || "").toString().trim();
    return `ny:${n}|${y}`;
  }

  function rowsToMovies(rows) {
    if (!rows.length) return new Map();

    const header = rows[0].map((h) => h.trim().toLowerCase());
    const nameIdx = header.findIndex((h) => h === "name" || h === "title");
    const yearIdx = header.findIndex((h) => h === "year");
    const uriIdx = header.findIndex(
      (h) => h.includes("letterboxd") || h === "uri" || h === "url"
    );
    const dateIdx = header.findIndex((h) => h === "date" || h === "watched date");

    if (nameIdx === -1) {
      throw new Error("Couldn’t find a Name/Title column. Use Letterboxd watched.csv.");
    }

    const movies = new Map();
    for (let i = 1; i < rows.length; i += 1) {
      const cells = rows[i];
      const name = (cells[nameIdx] || "").trim();
      if (!name) continue;

      const year = yearIdx >= 0 ? (cells[yearIdx] || "").trim() : "";
      const uri = uriIdx >= 0 ? (cells[uriIdx] || "").trim() : "";
      const date = dateIdx >= 0 ? (cells[dateIdx] || "").trim() : "";
      const key = movieKey(name, year, uri);

      if (!movies.has(key)) {
        movies.set(key, { key, name, year, uri, date });
      }
    }

    return movies;
  }

  async function loadFile(file, side) {
    const text = await file.text();
    const rows = parseCsv(text);
    const movies = rowsToMovies(rows);

    if (!movies.size) {
      throw new Error("No movies found in that CSV.");
    }

    state[side].movies = movies;

    const cta = side === "a" ? els.ctaA : els.ctaB;
    const meta = side === "a" ? els.metaA : els.metaB;
    const upload = side === "a" ? els.uploadA : els.uploadB;

    cta.textContent = "CSV loaded";
    meta.hidden = false;
    meta.textContent = `${movies.size.toLocaleString()} films · ${file.name}`;
    upload.classList.add("is-loaded");

    maybeRender();
  }

  function compare() {
    const onlyA = [];
    const onlyB = [];
    const both = [];

    for (const [key, movie] of state.a.movies) {
      if (state.b.movies.has(key)) {
        both.push({ ...movie, badge: "shared" });
      } else {
        onlyA.push({ ...movie, badge: "a" });
      }
    }

    for (const [key, movie] of state.b.movies) {
      if (!state.a.movies.has(key)) {
        onlyB.push({ ...movie, badge: "b" });
      }
    }

    const byName = (x, y) =>
      x.name.localeCompare(y.name, undefined, { sensitivity: "base" });

    onlyA.sort(byName);
    onlyB.sort(byName);
    both.sort(byName);

    return { onlyA, onlyB, both };
  }

  function maybeRender() {
    if (!state.a.movies.size || !state.b.movies.size) return;
    els.results.hidden = false;
    els.hint.hidden = true;
    document.body.classList.add("has-results");
    render();
  }

  function moviesForZone(sets) {
    if (state.zone === "onlyA") return sets.onlyA;
    if (state.zone === "onlyB") return sets.onlyB;
    if (state.zone === "both") return sets.both;
    return [...sets.both, ...sets.onlyA, ...sets.onlyB].sort((x, y) =>
      x.name.localeCompare(y.name, undefined, { sensitivity: "base" })
    );
  }

  function badgeLabel(badge) {
    if (badge === "shared") return "Shared";
    if (badge === "a") return `Only ${state.a.label}`;
    return `Only ${state.b.label}`;
  }

  function badgeClass(badge) {
    if (badge === "shared") return "movie-badge";
    if (badge === "a") return "movie-badge movie-badge--a";
    return "movie-badge movie-badge--b";
  }

  function render() {
    const sets = compare();
    els.countOnlyA.textContent = String(sets.onlyA.length);
    els.countBoth.textContent = String(sets.both.length);
    els.countOnlyB.textContent = String(sets.onlyB.length);

    els.tabOnlyA.textContent = `Only ${shortLabel(state.a.label)}`;
    els.tabOnlyB.textContent = `Only ${shortLabel(state.b.label)}`;

    els.venn.classList.remove(
      "is-zone-onlyA",
      "is-zone-onlyB",
      "is-zone-both",
      "is-zone-all"
    );
    els.venn.classList.add(`is-zone-${state.zone}`);

    const q = state.query.trim().toLowerCase();
    let movies = moviesForZone(sets);
    if (q) {
      movies = movies.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          String(m.year).includes(q)
      );
    }

    els.listCount.textContent = `${movies.length.toLocaleString()} film${
      movies.length === 1 ? "" : "s"
    }`;

    els.list.innerHTML = "";
    if (!movies.length) {
      els.empty.hidden = false;
      return;
    }

    els.empty.hidden = true;
    const frag = document.createDocumentFragment();

    movies.forEach((movie, index) => {
      const li = document.createElement("li");
      li.style.animationDelay = `${Math.min(index, 24) * 12}ms`;

      const title = document.createElement(movie.uri ? "a" : "span");
      title.textContent = movie.name;
      if (movie.uri) {
        title.href = movie.uri;
        title.target = "_blank";
        title.rel = "noopener noreferrer";
      }

      const year = document.createElement("span");
      year.className = "movie-year";
      year.textContent = movie.year || "—";

      const badge = document.createElement("span");
      badge.className = badgeClass(movie.badge);
      badge.textContent = badgeLabel(movie.badge);

      li.append(title, year, badge);
      frag.append(li);
    });

    els.list.append(frag);
  }

  function shortLabel(label) {
    return label.length > 8 ? `${label.slice(0, 7)}…` : label;
  }

  function setZone(zone) {
    state.zone = zone;
    els.zoneTabs.forEach((tab) => {
      tab.classList.toggle("is-active", tab.dataset.zone === zone);
    });
    render();
  }

  function resetAll() {
    state.a.movies = new Map();
    state.b.movies = new Map();
    state.zone = "both";
    state.query = "";

    els.fileA.value = "";
    els.fileB.value = "";
    els.search.value = "";
    els.results.hidden = true;
    els.hint.hidden = false;
    document.body.classList.remove("has-results");
    els.list.innerHTML = "";

    [els.uploadA, els.uploadB].forEach((el) => el.classList.remove("is-loaded"));
    els.ctaA.textContent = "Tap to add CSV";
    els.ctaB.textContent = "Tap to add CSV";
    els.metaA.hidden = true;
    els.metaB.hidden = true;
    els.metaA.textContent = "";
    els.metaB.textContent = "";

    els.zoneTabs.forEach((tab) => {
      tab.classList.toggle("is-active", tab.dataset.zone === "both");
    });
  }

  async function onFileChange(event, side) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await loadFile(file, side);
    } catch (err) {
      alert(err.message || "Couldn’t read that CSV.");
      event.target.value = "";
    }
  }

  els.fileA.addEventListener("change", (e) => onFileChange(e, "a"));
  els.fileB.addEventListener("change", (e) => onFileChange(e, "b"));

  els.nameA.addEventListener("input", () => {
    state.a.label = els.nameA.value.trim() || "You";
    if (state.a.movies.size && state.b.movies.size) render();
  });

  els.nameB.addEventListener("input", () => {
    state.b.label = els.nameB.value.trim() || "Friend";
    if (state.a.movies.size && state.b.movies.size) render();
  });

  els.zoneTabs.forEach((tab) => {
    tab.addEventListener("click", () => setZone(tab.dataset.zone));
  });

  els.venn.querySelectorAll(".venn__circle").forEach((circle) => {
    circle.addEventListener("click", () => {
      const zone = circle.dataset.zone;
      // Second tap on a side circle while already there → show shared
      if (state.zone === zone) setZone("both");
      else setZone(zone);
    });
  });

  // Tap the overlap area (approximate via SVG click coords)
  els.venn.addEventListener("click", (event) => {
    if (event.target.classList.contains("venn__circle")) return;
    const pt = els.venn.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const svgPt = pt.matrixTransform(els.venn.getScreenCTM().inverse());
    const inA = (svgPt.x - 118) ** 2 + (svgPt.y - 110) ** 2 <= 88 ** 2;
    const inB = (svgPt.x - 202) ** 2 + (svgPt.y - 110) ** 2 <= 88 ** 2;
    if (inA && inB) setZone("both");
  });

  els.search.addEventListener("input", () => {
    state.query = els.search.value;
    if (state.a.movies.size && state.b.movies.size) render();
  });

  els.reset.addEventListener("click", resetAll);
})();
