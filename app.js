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
  const PATTERN_SVG = `
    <svg class="f-pattern" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <pattern id="girih" width="120" height="120" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1.4">
            <rect x="35" y="35" width="50" height="50"/>
            <rect x="35" y="35" width="50" height="50" transform="rotate(45 60 60)"/>
            <circle cx="60" cy="60" r="13"/>
            <path d="M60 0V24.6M60 95.4V120M0 60H24.6M95.4 60H120M35 35L0 0M85 35L120 0M35 85L0 120M85 85L120 120"/>
          </g>
        </pattern>
        <radialGradient id="fade" cx="50%" cy="52%" r="60%">
          <stop offset="0%" stop-color="#fff" stop-opacity="1"/>
          <stop offset="100%" stop-color="#fff" stop-opacity="0.25"/>
        </radialGradient>
        <mask id="m"><rect width="100%" height="100%" fill="url(#fade)"/></mask>
      </defs>
      <rect width="100%" height="100%" fill="url(#girih)" mask="url(#m)"/>
    </svg>`;

  const STAR_SVG = `
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <g fill="#e3c26f">
        <rect x="10" y="10" width="20" height="20"/>
        <rect x="10" y="10" width="20" height="20" transform="rotate(45 20 20)"/>
      </g>
      <circle cx="20" cy="20" r="5" fill="#091547"/>
    </svg>`;

  const BOOK_SVG = `
    <svg viewBox="0 0 108 84" aria-hidden="true">
      <defs>
        <linearGradient id="bk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#f1d58a"/><stop offset="1" stop-color="#b8913f"/>
        </linearGradient>
      </defs>
      <path d="M54 14C42 5 22 3 6 7v68c16-4 36-2 48 7 12-9 32-11 48-7V7C86 3 66 5 54 14z" fill="url(#bk)"/>
      <path d="M54 14v68" stroke="#091547" stroke-width="3"/>
      <g stroke="#091547" stroke-opacity=".35" stroke-width="2" fill="none">
        <path d="M14 22c11-2 24-1 32 4M14 34c11-2 24-1 32 4M14 46c11-2 24-1 32 4M14 58c11-2 24-1 32 4"/>
        <path d="M94 22c-11-2-24-1-32 4M94 34c-11-2-24-1-32 4M94 46c-11-2-24-1-32 4M94 58c-11-2-24-1-32 4"/>
      </g>
    </svg>`;

  // ---------------------------------------------------------------- flyer render
  function renderFlyer() {
    const month = HIJRI_MONTHS[state.hijriMonth] || HIJRI_MONTHS[0];
    const date = dateLabel();

    const logo1 = state.logo1
      ? `<img src="${state.logo1}" alt="" />`
      : `<div class="f-logo-builtin">
           <img class="official" src="assets/masjid-ibrahim-logo.png" alt="Masjid Ibrahim" />
           <div class="loc">SPRING, TEXAS</div>
         </div>`;

    const logo2 = state.logo2
      ? `<img src="${state.logo2}" alt="" />`
      : `${BOOK_SVG}<div class="name">KLEIN ISLAMIC<br/>CENTER</div>`;

    const rows = state.rows.map((r) => {
      const isJ = /jum/i.test(r.name);
      const name = (r.name || "").toUpperCase();
      const dimA = /^-+$/.test((r.a || "").trim()) ? " dim" : "";
      const dimB = /^-+$/.test((r.b || "").trim()) ? " dim" : "";
      return `
        <div class="f-row${isJ ? " jumuah" : ""}">
          <div class="f-time${dimA}">${timeHtml(r.a)}</div>
          <div class="f-name${name.length > 9 ? " long" : ""}">${esc(name)}</div>
          <div class="f-time${dimB}">${timeHtml(r.b)}</div>
        </div>`;
    }).join("");

    $("#flyer").innerHTML = `
      ${PATTERN_SVG}
      <div class="f-frame"></div>

      <div class="f-header">
        <div class="f-logo">${logo1}</div>
        <div class="f-title">
          <div class="f-arabic f-fit">${month.ar}</div>
          <div class="f-dates f-fit${date.long ? " long" : ""}">${date.html}</div>
          <div class="f-hijri f-fit"><i></i>${esc(month.en.toUpperCase())} ${esc(state.hijriYear)}<i></i></div>
        </div>
        <div class="f-kic">${logo2}</div>
      </div>

      <div class="f-divider"><i></i>${STAR_SVG}<i></i></div>

      <div class="f-table">
        <div class="f-cols">
          <div>${esc(state.loc1Name)}</div>
          <div class="mid">SALAH</div>
          <div>${esc(state.loc2Name)}</div>
        </div>
        <div class="f-rows">${rows}</div>
      </div>

      ${state.note.trim() ? `<div class="f-note">${esc(state.note.trim())}</div>` : ""}

      <div class="f-divider bottom"><i></i>${STAR_SVG}<i></i></div>

      <div class="f-footer">
        <div class="f-addr">
          <div class="t">${esc(state.addr1Name)}</div>
          <div class="s">${esc(state.addr1Street)}</div>
          <div class="c">${esc(state.addr1City)}</div>
        </div>
        <div class="f-contact">
          ${state.phone ? `<div><span class="lab">TEXT</span> · ${esc(state.phone)}</div>` : ""}
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
    $$("#flyer .f-fit, #flyer .f-addr > div, #flyer .f-contact > div, #flyer .f-cols > div").forEach((el) => {
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
  function renderRows() {
    const prev = lastExport && lastExport.rows;
    $("#rows").innerHTML = state.rows.map((r, i) => {
      const p = prev && prev[i];
      const changed = p && (p.a !== r.a || p.b !== r.b);
      return `
        <div class="time-row${changed ? " changed" : ""}" data-i="${i}">
          <input type="text" class="name" data-f="name" value="${esc(r.name)}" aria-label="Prayer name" />
          <input type="text" class="t" data-f="a" value="${esc(r.a)}" aria-label="${esc(state.loc1Name)} time" />
          <input type="text" class="t" data-f="b" value="${esc(r.b)}" aria-label="${esc(state.loc2Name)} time" />
          <button class="del" title="Remove row" aria-label="Remove row">×</button>
        </div>`;
    }).join("");
    $(".loc1-label").textContent = state.loc1Name;
    $(".loc2-label").textContent = state.loc2Name;
  }

  function fillFields() {
    $$("[data-k]").forEach((el) => { el.value = state[el.dataset.k] ?? ""; });
    renderRows();
  }

  let saveTimer;
  function commit() {
    renderFlyer();
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
    const sel = $("#hijriSelect");
    sel.innerHTML = HIJRI_MONTHS.map((m, i) => `<option value="${i}">${m.en} — ${m.ar}</option>`).join("");

    $("#editor").addEventListener("input", (e) => {
      const el = e.target;
      if (el.dataset.k) {
        state[el.dataset.k] = el.dataset.k === "hijriMonth" ? +el.value : el.value;
        if (el.dataset.k === "loc1Name" || el.dataset.k === "loc2Name") {
          $(".loc1-label").textContent = state.loc1Name;
          $(".loc2-label").textContent = state.loc2Name;
        }
        commit();
      } else if (el.dataset.f) {
        const i = +el.closest(".time-row").dataset.i;
        state.rows[i][el.dataset.f] = el.value;
        commit();
      }
    });

    $("#rows").addEventListener("focusout", (e) => {
      const el = e.target;
      if (el.dataset.f === "a" || el.dataset.f === "b") {
        const n = normalizeTime(el.value);
        if (n !== el.value) {
          el.value = n;
          state.rows[+el.closest(".time-row").dataset.i][el.dataset.f] = n;
          commit();
        }
      }
    });

    $("#rows").addEventListener("click", (e) => {
      if (!e.target.classList.contains("del")) return;
      const i = +e.target.closest(".time-row").dataset.i;
      state.rows.splice(i, 1);
      renderRows();
      commit();
    });

    $("#addRow").addEventListener("click", () => {
      state.rows.push({ name: "", a: "", b: "" });
      renderRows();
      commit();
      $$("#rows .time-row:last-child input")[0].focus();
    });

    $("#autoHijri").addEventListener("click", () => {
      const d = parseDate(state.startDate);
      if (!d) return toast("Pick a start date first");
      try {
        const parts = new Intl.DateTimeFormat("en-US-u-ca-islamic-umalqura", { month: "numeric", year: "numeric" }).formatToParts(d);
        const mo = +parts.find((p) => p.type === "month").value;
        const yr = parts.find((p) => p.type === "year").value.replace(/\D/g, "");
        state.hijriMonth = mo - 1;
        state.hijriYear = yr;
        fillFields();
        commit();
        toast(`Set to ${HIJRI_MONTHS[mo - 1].en} ${yr}`);
      } catch {
        toast("Your browser can't detect the Hijri date — pick it manually");
      }
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
    const availH = window.innerWidth > 980 ? window.innerHeight - 150 : Infinity;
    const scale = Math.min(availW / 1200, availH / 1600, 1);
    $("#scaler").style.transform = `scale(${scale})`;
    frame.style.width = `${1200 * scale}px`;
    frame.style.height = `${1600 * scale}px`;
  }

  // ---------------------------------------------------------------- export
  let fontCSS = null;
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

  function initExport() {
    $("#downloadBtn").addEventListener("click", (e) => withBusy(e.currentTarget, "Preparing…", async () => {
      const blob = await makeBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName();
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      markExported();
      toast("Image downloaded ✓");
    }));

    $("#shareBtn").addEventListener("click", (e) => withBusy(e.currentTarget, "Preparing…", async () => {
      const blob = await makeBlob();
      const file = new File([blob], fileName(), { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "Updated Salah Times" });
          markExported();
        } catch (err) {
          if (err.name !== "AbortError") throw err;
        }
      } else {
        toast("Sharing isn't supported here — use Download instead");
      }
    }));
  }

  // ---------------------------------------------------------------- boot
  initEditor();
  fillFields();
  renderFlyer();
  initExport();
  fitPreview();
  window.addEventListener("resize", fitPreview);
  document.fonts && document.fonts.ready.then(() => { fitText(); fitPreview(); });
})();
