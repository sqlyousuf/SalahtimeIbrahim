(() => {
  "use strict";

  const STORE_KEY = "salah-flyer-v1";
  const EXPORTED_KEY = "salah-flyer-last-export-v1";

  const HIJRI_MONTHS = [
    { en: "Muharram", ar: "مُحَرَّم" },
    { en: "Safar", ar: "صَفَر" },
    { en: "Rabi ul Awwal", ar: "رَبِيعُ الأَوَّل" },
    { en: "Rabi ul Akhir", ar: "رَبِيعُ الآخِر" },
    { en: "Jumad ul Awwal", ar: "جُمَادَى الأُولَى" },
    { en: "Jumad ul Akhir", ar: "جُمَادَى الآخِرَة" },
    { en: "Rajab", ar: "رَجَب" },
    { en: "Sha'ban", ar: "شَعْبَان" },
    { en: "Ramadan", ar: "رَمَضَان" },
    { en: "Shawwal", ar: "شَوَّال" },
    { en: "Dhul Qa'dah", ar: "ذُو القَعْدَة" },
    { en: "Dhul Hijjah", ar: "ذُو الحِجَّة" },
  ];

  const DEFAULTS = {
    startDate: "2026-10-15",
    endDate: "2026-10-31",
    dateOverride: "",
    hijriMonth: 4,
    hijriYear: "1448",
    loc1Name: "Masjid Ibrahim",
    loc2Name: "KIC Musalla",
    rows: [
      { name: "Fajr", a: "6:45 AM", b: "6:40 AM" },
      { name: "Dhuhr", a: "2:00 PM", b: "1:45 PM" },
      { name: "Asr", a: "5:30 PM", b: "5:20 PM" },
      { name: "Maghrib", a: "SUNSET", b: "SUNSET" },
      { name: "Isha", a: "8:15 PM", b: "8:10 PM" },
      { name: "Jumu'ah # 1", a: "1:30 PM", b: "--" },
      { name: "Jumu'ah # 2", a: "2:30 PM", b: "--" },
    ],
    note: "",
    addr1Name: "Masjid Ibrahim",
    addr1Street: "5500 FM 2920 Rd",
    addr1City: "Spring TX 77388",
    addr2Name: "KIC Musalla",
    addr2Street: "18901 Kuykendahl Rd",
    addr2City: "Spring TX 77379",
    phone: "832-743-8303",
    email: "admin@kleinislamiccenter.org",
    logo1: null,
    logo2: null,
  };

  const MONTHS = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clone = (o) => JSON.parse(JSON.stringify(o));

  function load(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  }
  function save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch { return false; }
  }

  let state = Object.assign(clone(DEFAULTS), load(STORE_KEY) || {});
  let lastExport = load(EXPORTED_KEY);

  // ---------------------------------------------------------------- helpers
  function ordinal(n) {
    const v = n % 100;
    if (v >= 11 && v <= 13) return "TH";
    return { 1: "ST", 2: "ND", 3: "RD" }[n % 10] || "TH";
  }

  function parseDate(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }

  function dateLabel() {
    if (state.dateOverride.trim()) return { html: esc(state.dateOverride.trim().toUpperCase()), long: state.dateOverride.length > 20 };
    const a = parseDate(state.startDate);
    const b = parseDate(state.endDate);
    if (!a) return { html: "", long: false };
    if (!b) return { html: `FROM ${MONTHS[a.getMonth()]} ${a.getDate()}<sup>${ordinal(a.getDate())}</sup>`, long: true };
    if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
      return { html: `${MONTHS[a.getMonth()]} ${a.getDate()}-${b.getDate()}<sup>${ordinal(b.getDate())}</sup>`, long: false };
    }
    return { html: `${MONTHS[a.getMonth()]} ${a.getDate()} – ${MONTHS[b.getMonth()]} ${b.getDate()}<sup>${ordinal(b.getDate())}</sup>`, long: true };
  }

  function normalizeTime(v) {
    const s = String(v || "").trim();
    const m = /^(\d{1,2})(?::|\.)?(\d{2})?\s*([ap])\.?\s*m?\.?$/i.exec(s);
    if (m) return `${+m[1]}:${m[2] || "00"} ${m[3].toUpperCase()}M`;
    const m2 = /^(\d{1,2}):?(\d{2})$/.exec(s);
    if (m2) return `${+m2[1]}:${m2[2]}`;
    return s.toUpperCase();
  }

  function timeHtml(v) {
    const s = String(v || "").trim();
    const m = /^(.+?)\s*(AM|PM)$/i.exec(s);
    if (m) return `${esc(m[1])}<small>${m[2].toUpperCase()}</small>`;
    return esc(s.toUpperCase() || "--");
  }

  // ---------------------------------------------------------------- svgs
  const GOLD = "#d9b866";

  // Sixteen-point rosette: squares rotated in 22.5° steps, plus rings.
  const ROSETTE = (() => {
    let g = "";
    for (let k = 0; k < 4; k++) {
      g += `<rect x="-250" y="-250" width="500" height="500" transform="rotate(${k * 22.5})"/>`;
      g += `<rect x="-160" y="-160" width="320" height="320" transform="rotate(${k * 22.5 + 11.25})"/>`;
    }
    for (let k = 0; k < 16; k++) g += `<path d="M0 -354L0 -440" transform="rotate(${k * 22.5})"/>`;
    return `${g}<circle r="354"/><circle r="440"/><circle r="452"/><circle r="226"/><circle r="120"/>`;
  })();

  const PATTERN_SVG = `
    <svg class="f-pattern" viewBox="0 0 1200 1600" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <pattern id="girih" width="96" height="96" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="${GOLD}" stroke-width="1">
            <rect x="28" y="28" width="40" height="40"/>
            <rect x="28" y="28" width="40" height="40" transform="rotate(45 48 48)"/>
            <circle cx="48" cy="48" r="9"/>
            <path d="M48 0V19.7M48 76.3V96M0 48H19.7M76.3 48H96M28 28L0 0M68 28L96 0M28 68L0 96M68 68L96 96"/>
          </g>
        </pattern>
        <radialGradient id="fade" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stop-color="#fff" stop-opacity="0.35"/>
          <stop offset="55%" stop-color="#fff" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#fff" stop-opacity="1"/>
        </radialGradient>
        <mask id="m"><rect width="1200" height="1600" fill="url(#fade)"/></mask>
        <radialGradient id="rosFade" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fff" stop-opacity="1"/>
          <stop offset="100%" stop-color="#fff" stop-opacity="0.2"/>
        </radialGradient>
        <mask id="rm"><rect x="-460" y="-460" width="920" height="920" fill="url(#rosFade)"/></mask>
        <filter id="grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0"/>
        </filter>
      </defs>
      <rect width="1200" height="1600" fill="url(#girih)" mask="url(#m)" opacity="0.16"/>
      <g transform="translate(600 930)" fill="none" stroke="${GOLD}" stroke-width="1.3" opacity="0.10" mask="url(#rm)">${ROSETTE}</g>
      <rect width="1200" height="1600" filter="url(#grain)" opacity="0.07"/>
    </svg>`;

  // Small eight-point star used at the frame corners and in dividers.
  const star = (cls = "") => `
    <svg class="${cls}" viewBox="0 0 40 40" aria-hidden="true">
      <g fill="#091547" stroke="${GOLD}" stroke-width="1.6">
        <rect x="9" y="9" width="22" height="22"/>
        <rect x="9" y="9" width="22" height="22" transform="rotate(45 20 20)"/>
      </g>
      <rect x="15.5" y="15.5" width="9" height="9" fill="${GOLD}" transform="rotate(45 20 20)"/>
    </svg>`;

  const rule = (cls = "") => `<div class="f-rule ${cls}"><i></i>${star()}<i></i></div>`;

  const BOOK_SVG = `
    <svg class="book" viewBox="0 0 108 84" aria-hidden="true">
      <defs>
        <linearGradient id="bk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#f3dc9a"/><stop offset="1" stop-color="#b48a3c"/>
        </linearGradient>
      </defs>
      <path d="M54 14C42 5 22 3 6 7v68c16-4 36-2 48 7 12-9 32-11 48-7V7C86 3 66 5 54 14z" fill="url(#bk)"/>
      <path d="M54 14v68" stroke="#091547" stroke-width="3"/>
      <g stroke="#091547" stroke-opacity=".35" stroke-width="2" fill="none">
        <path d="M14 22c11-2 24-1 32 4M14 34c11-2 24-1 32 4M14 46c11-2 24-1 32 4M14 58c11-2 24-1 32 4"/>
        <path d="M94 22c-11-2-24-1-32 4M94 34c-11-2-24-1-32 4M94 46c-11-2-24-1-32 4M94 58c-11-2-24-1-32 4"/>
      </g>
    </svg>`;

  const ARABIC_NAMES = [
    [/fajr|fajar/i, "الفجر"],
    [/sunrise|shuruq/i, "الشروق"],
    [/dhuhr|zuhr|duhr|thuhr/i, "الظهر"],
    [/asr/i, "العصر"],
    [/maghrib/i, "المغرب"],
    [/isha/i, "العشاء"],
    [/jum/i, "الجمعة"],
    [/eid/i, "العيد"],
    [/tara?we?e?h/i, "التراويح"],
    [/tahajjud|qiyam/i, "قيام الليل"],
  ];
  const arabicFor = (name) => (ARABIC_NAMES.find(([re]) => re.test(name)) || [, ""])[1];

  // ---------------------------------------------------------------- flyer render
  function renderFlyer() {
    const month = HIJRI_MONTHS[state.hijriMonth] || HIJRI_MONTHS[0];
    const date = dateLabel();

    const logo1 = state.logo1
      ? `<img class="custom" src="${state.logo1}" alt="" />`
      : `<img class="official" src="assets/masjid-ibrahim-logo.png" alt="Masjid Ibrahim" />
         <div class="loc">SPRING · TEXAS</div>`;

    const logo2 = state.logo2
      ? `<img class="custom" src="${state.logo2}" alt="" />`
      : `${BOOK_SVG}<div class="name">KLEIN<br/>ISLAMIC CENTER</div>`;

    const rows = state.rows.map((r) => {
      const isJ = /jum/i.test(r.name);
      const ar = arabicFor(r.name);
      const kind = (v) => { v = (v || "").trim(); return /^-*$/.test(v) ? " dim" : /\d/.test(v) ? "" : " word"; };
      const dimA = kind(r.a);
      const dimB = kind(r.b);
      return `
        <div class="f-row${isJ ? " jumuah" : ""}">
          <div class="f-time${dimA}">${timeHtml(r.a)}</div>
          <div class="f-name">
            <div class="en f-fit">${esc((r.name || "").toUpperCase())}</div>
            ${ar ? `<div class="ar" dir="rtl">${ar}</div>` : ""}
          </div>
          <div class="f-time${dimB}">${timeHtml(r.b)}</div>
        </div>`;
    }).join("");

    $("#flyer").innerHTML = `
      ${PATTERN_SVG}
      <div class="f-frame">
        ${star("c tl")}${star("c tr")}${star("c bl")}${star("c br")}
      </div>

      <div class="f-header">
        <div class="f-logo">${logo1}</div>
        <div class="f-title">
          <div class="f-bigtitle f-fit">SALAH</div>
          <div class="f-bigtitle f-fit">TIMINGS</div>
          ${rule("short")}
          <div class="f-dates f-fit">${date.html}</div>
          <div class="f-hijri f-fit">${esc(month.en.toUpperCase())} &nbsp;·&nbsp; ${esc(state.hijriYear)} AH</div>
        </div>
        <div class="f-kic">${logo2}</div>
      </div>

      <div class="f-table">
        <div class="f-cols">
          <div class="f-fit">${esc(state.loc1Name)}</div>
          <div></div>
          <div class="f-fit">${esc(state.loc2Name)}</div>
        </div>
        <div class="f-rows">${rows}</div>
      </div>

      ${state.note.trim() ? `<div class="f-note"><i></i><span class="f-fit">${esc(state.note.trim())}</span><i></i></div>` : ""}

      <div class="f-footer">
        <div class="f-addr">
          <div class="t">${esc(state.addr1Name)}</div>
          <div class="s">${esc(state.addr1Street)}</div>
          <div class="c">${esc(state.addr1City)}</div>
        </div>
        <div class="f-contact">
          ${state.phone ? `<div class="lab">Text</div><div class="ph">${esc(state.phone)}</div>` : ""}
          ${state.email ? `<div class="em">${esc(state.email)}</div>` : ""}
        </div>
        <div class="f-addr right">
          <div class="t">${esc(state.addr2Name)}</div>
          <div class="s">${esc(state.addr2Street)}</div>
          <div class="c">${esc(state.addr2City)}</div>
        </div>
      </div>`;
    fitText();
  }

  // Shrink any single-line flyer text until it fits its box.
  function fitText() {
    $$("#flyer .f-fit, #flyer .f-addr > div, #flyer .f-contact > div").forEach((el) => {
      el.style.fontSize = "";
      el.style.whiteSpace = "nowrap";
      let size = parseFloat(getComputedStyle(el).fontSize);
      while (el.scrollWidth > el.clientWidth + 1 && size > 12) {
        size -= 1;
        el.style.fontSize = size + "px";
      }
    });
  }

  // ---------------------------------------------------------------- editor
  // Every editable time cell in reading order, for the sheet's "Next" button.
  const cellOrder = () => state.rows.flatMap((_, i) => [[i, "a"], [i, "b"]]);

  function isChanged(i, f) {
    const p = lastExport && lastExport.rows && lastExport.rows[i];
    return !!p && p[f] !== state.rows[i][f];
  }

  function cellHtml(v) {
    const s = String(v || "").trim();
    if (/^-*$/.test(s)) return `<span class="none">—</span>`;
    const m = /^(.+?)\s*(AM|PM)$/i.exec(s);
    return m ? `${esc(m[1])}<small>${m[2].toUpperCase()}</small>` : `<span class="word">${esc(s.toUpperCase())}</span>`;
  }

  function renderRows() {
    $$(".tl-a").forEach((t) => (t.textContent = state.loc1Name));
    $$(".tl-b").forEach((t) => (t.textContent = state.loc2Name));
    $("#rows").innerHTML = state.rows.map((r, i) => `
      <div class="tt-row" data-i="${i}">
        <button type="button" class="tt-name">${esc(r.name || "Untitled")}</button>
        <button type="button" class="cell${isChanged(i, "a") ? " changed" : ""}" data-f="a" aria-label="${esc(r.name)} at ${esc(state.loc1Name)}">${cellHtml(r.a)}</button>
        <button type="button" class="cell${isChanged(i, "b") ? " changed" : ""}" data-f="b" aria-label="${esc(r.name)} at ${esc(state.loc2Name)}">${cellHtml(r.b)}</button>
      </div>`).join("");
    if (sheetAt) markActive();
  }

  function hijriFromDate(d) {
    try {
      const parts = new Intl.DateTimeFormat("en-US-u-ca-islamic-umalqura", { month: "numeric", year: "numeric" }).formatToParts(d);
      return {
        month: +parts.find((p) => p.type === "month").value - 1,
        year: parts.find((p) => p.type === "year").value.replace(/\D/g, ""),
      };
    } catch { return null; }
  }

  function renderHijriLine() {
    const m = HIJRI_MONTHS[state.hijriMonth] || HIJRI_MONTHS[0];
    $("#hijriText").innerHTML = `<b>${esc(m.en)} ${esc(state.hijriYear)}</b> <span dir="rtl">${m.ar}</span>`;
  }

  function fillFields() {
    $$("[data-k]").forEach((el) => { el.value = state[el.dataset.k] ?? ""; });
    renderRows();
    renderHijriLine();
  }

  // "6:45 PM" <-> "18:45" for the native time picker
  function to24(v) {
    const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i.exec(String(v || "").trim());
    if (!m) return "";
    let h = +m[1] % 12;
    if ((m[3] || "").toUpperCase() === "PM") h += 12;
    else if (!m[3] && +m[1] === 12) h = 12;
    return `${String(h).padStart(2, "0")}:${m[2]}`;
  }
  function from24(v) {
    const m = /^(\d{2}):(\d{2})/.exec(v || "");
    if (!m) return "";
    const h = +m[1];
    return `${h % 12 || 12}:${m[2]} ${h >= 12 ? "PM" : "AM"}`;
  }

  // Move "6:45 AM" by delta minutes; returns null for non-times like SUNSET.
  function shiftTime(v, delta) {
    const t24 = to24(normalizeTime(v));
    if (!t24) return null;
    const [h, m] = t24.split(":").map(Number);
    const t = (((h * 60 + m + delta) % 1440) + 1440) % 1440;
    return from24(`${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`);
  }

  // ---- bottom sheet
  let sheetAt = null; // [rowIndex, "a" | "b" | "name"]

  function markActive() {
    $$("#rows .active").forEach((el) => el.classList.remove("active"));
    if (!sheetAt) return;
    const [i, f] = sheetAt;
    const row = $(`#rows .tt-row[data-i="${i}"]`);
    const el = row && (f === "name" ? row.querySelector(".tt-name") : row.querySelector(`.cell[data-f="${f}"]`));
    if (el) {
      el.classList.add("active");
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  function syncSheet() {
    const [i, f] = sheetAt;
    const row = state.rows[i];
    const sheet = $("#sheet .sheet");
    sheet.dataset.mode = f === "name" ? "name" : "time";
    $("#sheetTitle").textContent = row.name || "Prayer";
    if (f === "name") {
      $("#sheetSub").textContent = "Rename or remove this prayer";
      $("#sheetName").value = row.name;
      return;
    }
    $("#sheetSub").textContent = f === "a" ? state.loc1Name : state.loc2Name;
    const v = String(row[f] || "").trim().toUpperCase();
    $("#sheetTime").value = to24(v);
    $("#sheet").classList.toggle("is-word", !to24(v));
    $$("#sheet [data-set]").forEach((b) => b.classList.toggle("on", b.dataset.set === v || (b.dataset.set === "--" && /^-*$/.test(v))));
    const order = cellOrder();
    const k = order.findIndex(([ci, cf]) => ci === i && cf === f);
    $("#sheetNext").textContent = k < order.length - 1 ? "Next time →" : "Finish ✓";
  }

  function openSheet(i, f) {
    sheetAt = [i, f];
    syncSheet();
    markActive();
    const wrap = $("#sheet");
    wrap.hidden = false;
    requestAnimationFrame(() => wrap.classList.add("open"));
    if (f === "name") setTimeout(() => $("#sheetName").focus(), 250);
  }

  function closeSheet() {
    const wrap = $("#sheet");
    wrap.classList.remove("open");
    sheetAt = null;
    markActive();
    setTimeout(() => { if (!sheetAt) wrap.hidden = true; }, 220);
  }

  function setCell(v) {
    const [i, f] = sheetAt;
    state.rows[i][f] = v;
    renderRows();
    syncSheet();
    commit();
  }

  function nextCell() {
    const order = cellOrder();
    const k = order.findIndex(([i, f]) => i === sheetAt[0] && f === sheetAt[1]);
    if (k < 0 || k >= order.length - 1) return closeSheet();
    sheetAt = order[k + 1];
    syncSheet();
    markActive();
  }

  let saveTimer;
  function commit() {
    renderFlyer();
    invalidateImage();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const ok = save(STORE_KEY, state);
      $("#saved").textContent = ok ? "All changes saved on this device" : "Could not save (storage full?)";
    }, 250);
  }

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove("show"), 2600);
  }

  function initEditor() {
    $("#hijriSelect").innerHTML = HIJRI_MONTHS.map((m, i) => `<option value="${i}">${m.en} — ${m.ar}</option>`).join("");

    $("#editor").addEventListener("input", (e) => {
      const el = e.target;
      const k = el.dataset.k;
      if (!k) return;
      state[k] = k === "hijriMonth" ? +el.value : el.value;
      if (k === "startDate") {
        const h = parseDate(state.startDate) && hijriFromDate(parseDate(state.startDate));
        if (h) {
          state.hijriMonth = h.month;
          state.hijriYear = h.year;
          $("#hijriSelect").value = h.month;
          $('[data-k="hijriYear"]').value = h.year;
        }
      }
      if (k === "startDate" || k === "hijriMonth" || k === "hijriYear") renderHijriLine();
      if (k === "loc1Name" || k === "loc2Name") renderRows();
      commit();
    });

    $("#hijriChange").addEventListener("click", () => {
      $("#more").open = true;
      $("#hijriSelect").scrollIntoView({ block: "center", behavior: "smooth" });
      setTimeout(() => $("#hijriSelect").focus(), 350);
    });

    $("#rows").addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const i = +btn.closest(".tt-row").dataset.i;
      openSheet(i, btn.classList.contains("tt-name") ? "name" : btn.dataset.f);
    });

    $("#addRow").addEventListener("click", () => {
      state.rows.push({ name: "New prayer", a: "", b: "--" });
      renderRows();
      commit();
      openSheet(state.rows.length - 1, "name");
    });

    // sheet controls
    $("#sheet").addEventListener("click", (e) => { if (e.target.id === "sheet") closeSheet(); });
    $("#sheetClose").addEventListener("click", closeSheet);
    $("#sheetDone").addEventListener("click", closeSheet);
    $("#sheetNext").addEventListener("click", nextCell);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && sheetAt) closeSheet(); });

    const onTime = () => { const v = from24($("#sheetTime").value); if (v) setCell(v); };
    $("#sheetTime").addEventListener("input", onTime);
    $("#sheetTime").addEventListener("change", onTime);

    $$("#sheet .nudge").forEach((b) => b.addEventListener("click", () => {
      const [i, f] = sheetAt;
      const next = shiftTime(state.rows[i][f], +b.dataset.d);
      if (!next) return toast("Pick a time first");
      setCell(next);
    }));
    $$("#sheet [data-set]").forEach((b) => b.addEventListener("click", () => setCell(b.dataset.set)));

    $("#sheetName").addEventListener("input", (e) => {
      state.rows[sheetAt[0]].name = e.target.value;
      $("#sheetTitle").textContent = e.target.value || "Prayer";
      renderRows();
      commit();
    });
    $("#sheetNameDone").addEventListener("click", closeSheet);
    $("#sheetRemove").addEventListener("click", () => {
      const i = sheetAt[0];
      if (!confirm(`Remove "${state.rows[i].name || "this prayer"}" from the flyer?`)) return;
      closeSheet();
      state.rows.splice(i, 1);
      renderRows();
      commit();
    });

    $$("[data-logo]").forEach((inp) => {
      inp.addEventListener("change", async () => {
        const f = inp.files[0];
        if (!f) return;
        state[inp.dataset.logo] = await shrinkImage(f, 700);
        commit();
        inp.value = "";
        toast("Logo updated");
      });
    });
    $$("[data-clear]").forEach((b) => b.addEventListener("click", () => {
      state[b.dataset.clear] = null;
      commit();
    }));

    $("#resetBtn").addEventListener("click", () => {
      if (!confirm("Reset everything back to the original flyer?")) return;
      const keep = { logo1: state.logo1, logo2: state.logo2 };
      state = Object.assign(clone(DEFAULTS), keep);
      fillFields();
      commit();
    });
  }

  function shrinkImage(file, max) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onerror = reject;
      r.onload = () => {
        const img = new Image();
        img.onload = () => {
          const k = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement("canvas");
          c.width = Math.round(img.width * k);
          c.height = Math.round(img.height * k);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL("image/png"));
        };
        img.onerror = reject;
        img.src = r.result;
      };
      r.readAsDataURL(file);
    });
  }

  // ---------------------------------------------------------------- preview scaling
  function fitPreview() {
    const frame = $("#frame");
    const stage = frame.parentElement;
    const availW = stage.clientWidth;
    if (!availW) return;
    const availH = Math.max(360, window.innerHeight - 290);
    const scale = Math.min(availW / 1200, availH / 1600, 1);
    $("#scaler").style.transform = `scale(${scale})`;
    frame.style.width = `${1200 * scale}px`;
    frame.style.height = `${1600 * scale}px`;
  }

  // ---------------------------------------------------------------- export
  let fontCSS = null;
  let cached = null;      // { blob } for the current state
  let pending = null;     // in-flight render promise
  let prerenderTimer;

  // Build the image in the background after edits, so Share can open
  // instantly (iOS rejects a share that starts too long after the tap).
  function invalidateImage() {
    cached = null;
    pending = null;
    clearTimeout(prerenderTimer);
    prerenderTimer = setTimeout(() => getBlob().catch(() => {}), 1500);
  }

  function getBlob() {
    if (cached) return Promise.resolve(cached.blob);
    if (pending) return pending;
    const p = makeBlob().then((blob) => {
      if (pending === p) cached = { blob };
      return blob;
    }).finally(() => { if (pending === p) pending = null; });
    pending = p;
    return p;
  }

  async function makeBlob() {
    const node = $("#flyer");
    await document.fonts.ready;
    const opts = { pixelRatio: 1.5, width: 1200, height: 1600, backgroundColor: "#091547" };
    if (!fontCSS) {
      try { fontCSS = await htmlToImage.getFontEmbedCSS(node); } catch { fontCSS = ""; }
    }
    if (fontCSS) opts.fontEmbedCSS = fontCSS;
    // Safari needs a warm-up pass before fonts/images paint reliably.
    if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) await htmlToImage.toBlob(node, opts);
    return htmlToImage.toBlob(node, opts);
  }

  function fileName() {
    const d = parseDate(state.startDate);
    const tag = d ? `${MONTHS[d.getMonth()].slice(0, 3)}-${d.getDate()}-${d.getFullYear()}` : "latest";
    return `Salah-Times-${tag}.png`.replace(/\s+/g, "-");
  }

  function markExported() {
    lastExport = clone({ rows: state.rows });
    save(EXPORTED_KEY, lastExport);
    renderRows();
  }

  async function withBusy(btn, label, fn) {
    const old = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = label;
    try { await fn(); } catch (err) {
      console.error(err);
      toast("Something went wrong creating the image — please try again");
    } finally {
      btn.disabled = false;
      btn.innerHTML = old;
    }
  }

  function downloadBlob(blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  async function share() {
    const ready = !!cached;
    const blob = await getBlob();
    const file = new File([blob], fileName(), { type: "image/png" });
    if (!(navigator.canShare && navigator.canShare({ files: [file] }))) {
      downloadBlob(blob);
      markExported();
      return toast("Image saved — attach it in WhatsApp");
    }
    try {
      await navigator.share({ files: [file] });
      markExported();
    } catch (err) {
      if (err.name === "AbortError") return;
      if (!ready && err.name === "NotAllowedError") return toast("Image ready — tap Share again");
      throw err;
    }
  }

  function initExport() {
    $$('[data-action="download"]').forEach((b) => b.addEventListener("click", () => withBusy(b, "Preparing…", async () => {
      downloadBlob(await getBlob());
      markExported();
      toast("Image saved ✓");
    })));
    $$('[data-action="share"]').forEach((b) => b.addEventListener("click", () => withBusy(b, "Preparing…", share)));
  }

  function initViews() {
    $$("[data-go]").forEach((btn) => btn.addEventListener("click", () => {
      const v = btn.dataset.go;
      document.body.classList.toggle("view-edit", v === "edit");
      document.body.classList.toggle("view-preview", v === "preview");
      window.scrollTo({ top: 0 });
      fitPreview();
    }));
  }

  // ---------------------------------------------------------------- boot
  initEditor();
  fillFields();
  renderFlyer();
  initExport();
  initViews();
  fitPreview();
  invalidateImage();
  window.addEventListener("resize", fitPreview);
  document.fonts && document.fonts.ready.then(() => { fitText(); fitPreview(); });
})();
