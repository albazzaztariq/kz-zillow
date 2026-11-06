// Almaty sold-price explorer front end: language switch, charts, street + address search, the property map
// (clustered dots) and the property page. The same code runs against the FastAPI server (/data/*.json) and the
// static GitHub Pages export (window.KZ = {static:true, base:"/repo/", data:"/repo/data/"}).
(function () {
  const KZ = window.KZ || { static: false, base: "/", data: "/data/" };
  const lang = document.documentElement.lang === "en" ? "en" : "ru";
  const EN = lang === "en";
  const fmt = (v) => (v == null ? "—" : Math.round(v).toLocaleString(EN ? "en-US" : "ru-RU"));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const getJSON = (url) => fetch(url).then((r) => { if (!r.ok) throw new Error(url + " " + r.status); return r.json(); });
  const data = (name) => getJSON(KZ.data + name);
  const L10N = (ru, en) => (EN ? en : ru);

  // ---- language switch (Russian is the default; the choice is remembered) ----------------------
  const langBtn = document.getElementById("lang");
  if (langBtn) langBtn.addEventListener("click", () => {
    try { localStorage.setItem("kzLang", EN ? "ru" : "en"); } catch (e) {}
    location.reload();
  });
  const input = document.querySelector("input[name=q]");
  if (input) input.placeholder = EN ? "Search an address or street (type it in Russian), e.g. Утепова 31" : "Поиск по адресу или улице, например: Утепова 31";
  document.querySelectorAll(".chip[data-q]").forEach((c) => c.addEventListener("click", () => {
    input.value = c.dataset.q; input.focus(); input.dispatchEvent(new Event("input", { bubbles: true }));
  }));
  if (EN) {
    const t = document.querySelector('meta[name="title-en"]');
    if (t) document.title = t.content;
  }

  // ---- Russian -> English names (same rules as app/i18n.py) -------------------------------------
  const MAP = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
    н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y",
    ь: "", э: "e", ю: "yu", я: "ya", ә: "a", ғ: "g", қ: "k", ң: "n", ө: "o", ұ: "u", ү: "u", һ: "h", і: "i" };
  const WORDS = { "улица": "St.", "ул.": "St.", "проспект": "Ave.", "пр.": "Ave.", "микрорайон": "Microdistrict", "мкр.": "Mkr.",
    "бульвар": "Blvd.", "бул.": "Blvd.", "переулок": "Ln.", "пер.": "Ln.", "проезд": "Passage", "площадь": "Sq.", "шоссе": "Hwy",
    "район": "district", "д.": "No." };
  const DISTRICT_EN = { "Алатауский": "Alatau", "Алмалинский": "Almaly", "Ауэзовский": "Auezov", "Бостандыкский": "Bostandyk",
    "Жетысуский": "Zhetysu", "Медеуский": "Medeu", "Наурызбайский": "Nauryzbay", "Турксибский": "Turksib", "Other": "Other" };
  const translit = (s) => [...s].map((ch) => { const lo = ch.toLowerCase(); if (!(lo in MAP)) return ch;
    const t = MAP[lo]; return ch !== lo && t ? t[0].toUpperCase() + t.slice(1) : t; }).join("");
  const toEn = (s) => String(s || "").split(/(\s+|,)/).map((p) => WORDS[p.toLowerCase()] || translit(p)).join("");
  const name = (ru) => (EN ? toEn(ru) : ru);                       // street / address labels
  const dname = (ru) => (EN ? DISTRICT_EN[ru] || translit(ru) : ru); // district names

  // ---- page URLs (server: dynamic routes; static: generated file names) ------------------------
  const SLUG = { "Алатауский": "alatau", "Алмалинский": "almaly", "Ауэзовский": "auezov", "Бостандыкский": "bostandyk",
                 "Жетысуский": "zhetysu", "Медеуский": "medeu", "Наурызбайский": "nauryzbay", "Турксибский": "turksib" };
  const suffix = (t) => (t === "house" ? "-house" : "");
  const districtUrl = (n, t) => (KZ.static ? `${KZ.base}district/${SLUG[n]}${suffix(t)}.html` : `/district/${encodeURIComponent(n)}?type=${t}`);
  const streetUrl = (id, t) => (KZ.static ? `${KZ.base}street/${id}${suffix(t)}.html` : `/street/${id}?type=${t}`);
  const buildingUrl = (id, t) => (KZ.static ? `${KZ.base}building.html?id=${id}&type=${t}` : `/building?id=${id}&type=${t}`);
  const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };

  // ---- price/m2 line + deal-count bars ---------------------------------------------------------
  const canvas = document.getElementById("chart");
  if (canvas && canvas.dataset.chart && window.Chart) {
    const d = JSON.parse(canvas.dataset.chart);
    new Chart(canvas, {
      data: {
        labels: d.labels,
        datasets: [
          { type: "line", label: L10N("Медиана ₸/м²", "Median ₸/m²"), data: d.median, yAxisID: "y", borderColor: "#1f5fbf",
            backgroundColor: "#1f5fbf", tension: 0.15, pointRadius: d.labels.length > 60 ? 0 : 3, spanGaps: true },
          { type: "bar", label: L10N("Сделок", "Deals"), data: d.n, yAxisID: "y2", backgroundColor: "rgba(120,130,145,.28)" },
        ],
      },
      options: {
        maintainAspectRatio: false, interaction: { mode: "index", intersect: false },
        scales: {
          y: { position: "left", title: { display: true, text: L10N("₸/м²", "₸/m²") }, ticks: { callback: fmt } },
          y2: { position: "right", grid: { drawOnChartArea: false }, title: { display: true, text: L10N("сделок", "deals") } },
          x: { ticks: { maxTicksLimit: 14 } },
        },
        plugins: { tooltip: { callbacks: { label: (c) => c.dataset.label + ": " + fmt(c.parsed.y) } } },
      },
    });
  }

  // ---- search: addresses (house number typed) + streets ----------------------------------------
  const KK = { ә: "а", ғ: "г", қ: "к", ң: "н", ө: "о", ұ: "у", ү: "у", һ: "х", і: "и", ё: "е", й: "и" };
  const LAT = { a: "а", b: "в", c: "с", e: "е", k: "к", m: "м", h: "н", o: "о", p: "р", t: "т", x: "х", y: "у" };
  const fold = (s) => s.toLowerCase().replace(/[әғқңөұүһіёй]/g, (c) => KK[c]);
  const KIND = /(^|\s)(улица|ул|проспект|пр-кт|пр-т|просп|пр|микрораион|мкр|мик|бульвар|б-р|бул|переулок|пер|проезд|пр-д|площадь|пл|шоссе|тупик|массив|квартал|набережная|наб|аллея|им|имени|д|дом)(?=[\s.]|$)\.?/g;
  const core = (s) => fold(s).replace(/(\d+)\s*-?\s*(?:и|ый|ой|ий)(?=\s|$)/g, "$1").replace(KIND, " ").replace(/[^0-9a-zа-я]+/g, " ").replace(/\s+/g, " ").trim();
  const houseKey = (h) => fold(h).replace(/\s+/g, "").replace(/[a-z]/g, (c) => LAT[c] || c).replace(/[^0-9а-я/]/g, "");
  const grams = (s) => { const g = new Map(); for (let i = 0; i < s.length - 1; i++) { const k = s.slice(i, i + 2); g.set(k, (g.get(k) || 0) + 1); } return g; };
  const dice = (a, b) => { const A = grams(a), B = grams(b); let hit = 0, tot = 0;
    A.forEach((v, k) => { tot += v; hit += Math.min(v, B.get(k) || 0); }); B.forEach((v) => (tot += v)); return tot ? (2 * hit) / tot : 0; };
  const ptype0 = document.body.dataset.ptype || "apartment";
  const out = document.getElementById("results");
  let streetIdx = null, addrIdx = null;

  // "Абая 150", "ул. Муратбаева 14", "мкр Орбита-4 12а": last token that starts with a digit = house, the rest = name
  function parseQuery(raw) {
    const toks = raw.trim().split(/[\s,]+/).filter(Boolean);
    const last = toks[toks.length - 1] || "";
    if (toks.length >= 2 && /^\d/.test(last) && /^[\d\/а-яa-zәғқңөұүһі-]+$/i.test(last)) return { name: core(toks.slice(0, -1).join(" ")), house: houseKey(last) };
    return { name: core(raw), house: null };
  }

  function searchAddresses(ix, p) {
    const toks = p.name.split(" ").filter((t) => t.length >= 1);
    if (!p.house || !toks.length) return [];
    return ix.a.filter((a) => {
      const words = a[3].split(" ");
      return toks.every((t) => words.some((w) => w.startsWith(t))) && a[4].startsWith(p.house);
    }).sort((x, y) => (x[4] === p.house ? 0 : 1) - (y[4] === p.house ? 0 : 1) || y[5] - x[5]).slice(0, 12);
  }

  function searchStreets(ix, raw) {
    const q = fold(raw.trim()).replace(/\s+/g, " ");
    return ix.map((r) => ({ r, s: Math.max(r.key.startsWith(q) ? 100 : r.key.includes(q) ? 88 : 0, r.lab.includes(q) ? 85 : 0,
                                          60 + 40 * Math.max(dice(q, r.key), dice(q, r.lab))) }))
      .filter((h) => h.s >= 80).sort((a, b) => b.s - a.s || b.r.n - a.r.n).slice(0, 10);
  }

  // runs the search for the current text and fills the dropdown; returns the first link (address first, then street)
  async function doSearch() {
    const raw = input.value.trim();
    if (raw.length < 2) { out.innerHTML = ""; return null; }
    const p = parseQuery(raw);
    streetIdx = streetIdx || (await data("search.json")).map((r) => ({ id: r[0], label: r[1], district: r[2], n: r[3], key: r[4], lab: fold(r[1]) }));
    let addr = [];
    if (p.house) { addrIdx = addrIdx || (await data("addresses.json")); addr = searchAddresses(addrIdx, p); }
    const streets = searchStreets(streetIdx, raw);
    let html = "";
    if (addr.length) {
      html += `<li class="grp">${L10N("Адреса", "Addresses")}</li>` + addr.map((a) =>
        `<li><a href="${buildingUrl(a[0], ptype0)}">${esc(name(a[1]))} <span class="muted">${esc(dname(addrIdx.d[a[2]]))} · ${a[5]} ${L10N("сделок", "deals")}</span></a></li>`).join("");
    }
    if (streets.length) {
      html += `<li class="grp">${L10N("Улицы", "Streets")}</li>` + streets.map((h) =>
        `<li><a href="${streetUrl(h.r.id, ptype0)}">${esc(name(h.r.label))} <span class="muted">${esc(dname(h.r.district))} · ${h.r.n} ${L10N("сделок", "deals")}</span></a></li>`).join("");
    }
    out.innerHTML = `<ul class="hits">${html || `<li class="muted">${L10N("Ничего не найдено по", "Nothing found for")} «${esc(raw)}»</li>`}</ul>`;
    return out.querySelector("a");
  }

  if (input && out) {
    let timer = null;
    input.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(doSearch, 200); });
    input.addEventListener("keydown", async (e) => { if (e.key === "Enter") { e.preventDefault(); const a = await doSearch(); if (a) location.href = a.href; } });
    const btn = document.getElementById("findbtn");
    if (btn) btn.addEventListener("click", async () => { const a = await doSearch(); if (a) location.href = a.href; else input.focus(); });
    document.addEventListener("click", (e) => { if (!e.target.closest(".search")) out.innerHTML = ""; });
  }

  // ---- the property page (/building?id=...) ----------------------------------------------------
  const bpage = document.getElementById("bpage");
  if (bpage) renderBuilding(bpage);

  async function renderBuilding(root) {
    const qs = new URLSearchParams(location.search), id = qs.get("id") || "";
    const rec = id.length === 10 ? (await data(`deals/${id.slice(0, 2)}.json`))[id] : null;
    const $ = (sel) => root.querySelector(sel);
    if (!rec) { $("#b-title").innerHTML = L10N("Дом не найден", "Property not found"); return; }
    const sales = { apartment: rec.a, house: rec.h };
    let t = qs.get("type");
    if (!(t in sales) || !sales[t].length) t = sales.apartment.length ? "apartment" : "house";
    const rows = sales[t], ppm = rows.map((r) => r[3]), last = rows[0];
    document.title = name(rec.l) + " — " + L10N("Исследование рынка недвижимости Алматы", "Almaty Property Market Research");
    $("#b-title").innerHTML = `${esc(name(rec.l))} <span class="muted">· ${esc(dname(rec.d))} ${L10N("район", "district")}</span>`;
    const home = KZ.static ? `${KZ.base}index.html` : "/";
    $("#b-crumbs").innerHTML = `<a href="${home}">${L10N("Главная", "Home")}</a> › <a href="${home}">${L10N("Алматы", "Almaty")}</a> › ` +
      (SLUG[rec.d] ? `<a href="${districtUrl(rec.d, t)}">${esc(dname(rec.d))}</a>` : esc(dname(rec.d))) + ` › ` +
      (rec.s ? `<a href="${streetUrl(rec.s, t)}">${L10N("улица", "street")}</a> › ` : "") + esc(name(rec.l));
    $("#b-toggle").innerHTML = ["apartment", "house"].map((k) =>
      `<a href="${buildingUrl(id, k)}" class="${k === t ? "on" : ""}"><svg class="ic"><use href="#i-${k === "apartment" ? "building" : "home"}"/></svg>${k === "apartment" ? L10N("Квартиры", "Apartments") : L10N("Дома", "Houses")} (${sales[k].length})</a>`).join("") +
      (rec.s ? `<a class="back" href="${streetUrl(rec.s, t)}">← ${L10N("вся улица", "whole street")}</a>` : "") +
      (SLUG[rec.d] ? `<a class="back" href="${districtUrl(rec.d, t)}">← ${esc(dname(rec.d))}</a>` : "");
    const stat = (icon, k, v) => `<div class="tile"><svg class="ic"><use href="#i-${icon}"/></svg><span class="k">${k}</span><span class="v">${v}</span></div>`;
    $("#b-stats").innerHTML = stat("deals", L10N("Продаж", "Sales"), rows.length) +
      stat("tag", L10N("Медиана, ₸/м²", "Median, ₸/m²"), fmt(median(ppm))) +
      stat("calendar", L10N("Последняя продажа", "Latest sale"), last ? `${last[0]}` : "—") +
      stat("tag", L10N("Её сумма, ₸", "Its amount, ₸"), last ? fmt(last[2]) : "—");
    $("#b-note").innerHTML = (rec.la == null ? L10N("Положение на карте найти не удалось.", "The location on the map could not be found.")
        : rec.p !== "exact" ? L10N("Положение на карте приблизительное.", "The location on the map is approximate.") : "") +
      " " + L10N("Номера квартир не публикуются: показаны все продажи в этом доме.", "Flat numbers are not published: all sales in this building are shown.");
    $("#b-rows").innerHTML = rows.map((r) => `<tr><td>${r[0]}</td><td class="r">${r[1]}</td><td class="r">${fmt(r[2])}</td><td class="r">${fmt(r[3])}</td></tr>`).join("") ||
      `<tr><td colspan="4" class="muted">${L10N("Нет продаж этого типа", "No sales of this type")}</td></tr>`;
    if (rec.la != null) {
      $("#b-map-card").hidden = false;
      const m = L.map($("#map")).setView([rec.la, rec.lo], 17);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap contributors" }).addTo(m);
      L.circleMarker([rec.la, rec.lo], { radius: 11, weight: 2, color: "#222", fillColor: "#e0523a", fillOpacity: 0.95 }).addTo(m).bindPopup(esc(name(rec.l))).openPopup();
    }
  }

  // ---- map (city / district / street pages) ----------------------------------------------------
  const el = document.getElementById("map");
  if (!el || !window.L || el.dataset.type === undefined) return;
  const ptype = el.dataset.type || "apartment";
  const streetId = el.dataset.street || "";
  const status = document.getElementById("map-status");
  const map = L.map(el).setView([43.24, 76.92], 11);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap contributors" }).addTo(map);

  // colour: pale yellow -> deep red between the 10th and 90th percentile of building medians
  let scale = { lo: 300000, hi: 1000000 };
  const tOf = (v) => Math.max(0, Math.min(1, (v - scale.lo) / (scale.hi - scale.lo || 1)));
  const color = (v) => `hsl(${55 - 55 * tOf(v)}, 85%, ${88 - 45 * tOf(v)}%)`;
  const darkFill = (v) => tOf(v) > 0.55;  // white text on the deep reds, dark text on the pale yellows

  // legend: colour bar between the 10th and 90th percentile of building medians (₸ per m²)
  const legend = L.control({ position: "bottomright" });
  legend.onAdd = () => { const d = L.DomUtil.create("div", "legend"); d.id = "legend"; return d; };
  legend.addTo(map);
  const paintLegend = () => {
    const d = document.getElementById("legend");
    if (d) d.innerHTML = `<div>${L10N("Медиана ₸/м²", "Median ₸/m²")}</div><div class="bar"></div><div class="ends"><span>${fmt(scale.lo)}</span><span>${fmt(scale.hi)}</span></div>`;
  };

  // all located buildings, loaded once; clustering happens in the browser
  let buildingsP = null;
  const buildings = () => (buildingsP = buildingsP || data("buildings.json").then((j) => {
    j.rows = j.b.map((r) => ({ id: r[0], label: r[1], district: j.d[r[2]], lat: r[3], lon: r[4], precision: r[5], street: r[6],
                               apartment: { n: r[7], med: r[8] }, house: { n: r[9], med: r[10] } }));
    scale = j.scale[ptype] || scale;
    paintLegend();
    return j;
  }));

  // Zillow-style: group buildings into a grid of ~CLUSTER_PX screen pixels, so marks never overlap and never exceed
  // MAX_MARKS. A group of one building is a dot you can click; bigger groups split as you zoom in.
  const CLUSTER_PX = 104, MAX_MARKS = 55;
  function group(rows, zoom, lat0) {
    let cellLon = (CLUSTER_PX * 360) / (256 * 2 ** zoom), groups;
    const k = Math.cos((lat0 * Math.PI) / 180);
    for (;;) {
      groups = new Map();
      rows.forEach((r) => {
        const key = Math.floor((r.lat * k) / cellLon) + "|" + Math.floor(r.lon / cellLon);
        (groups.get(key) || groups.set(key, []).get(key)).push(r);
      });
      if (groups.size <= MAX_MARKS) return [...groups.values()];
      cellLon *= 1.4;
    }
  }

  // district outlines (light background; click -> district page); not on a street page
  if (!streetId) {
    data(`map-${ptype}.json`).then((m) => {
      scale = m.scale || scale;
      L.geoJSON(m.geojson, {
        style: (f) => ({ fillColor: "#bbb", fillOpacity: 0.1, color: "#666", weight: f.properties.district === el.dataset.district ? 3 : 1 }),
        onEachFeature: (f, l) => l.bindTooltip(`${dname(f.properties.district)}: ${fmt(f.properties.median_ppm2)} ₸/${L10N("м²", "m²")} (${f.properties.n} ${L10N("сделок", "deals")})`, { sticky: true })
          .on("click", () => (location.href = districtUrl(f.properties.district, m.type))),
      }).addTo(map);
    });
  }

  const layer = L.layerGroup().addTo(map);
  let timer = null, fitted = false;

  async function popupHtml(it) {
    const shard = await data(`deals/${it.id.slice(0, 2)}.json`), rec = shard[it.id], key = ptype === "house" ? "h" : "a";
    const rows = rec[key].slice(0, 25).map((d) => `<tr><td>${d[0]}</td><td class="r">${d[1]} ${L10N("м²", "m²")}</td><td class="r">${fmt(d[2])} ₸</td><td class="r">${fmt(d[3])} ₸/${L10N("м²", "m²")}</td></tr>`).join("");
    return `<b>${esc(name(it.label))}</b><br><span class="muted">${esc(dname(it.district))} ${L10N("район", "district")}</span>` +
      (it.precision !== "exact" ? `<br><span class="muted">${L10N("положение приблизительное", "approximate location")}</span>` : "") +
      `<div style="max-height:180px;overflow:auto;margin-top:6px"><table style="font-size:12px">${rows}</table></div>` +
      `<a href="${buildingUrl(it.id, ptype)}">${L10N("Открыть страницу дома →", "Open property page →")}</a>`;
  }

  function draw() {
    buildings().then((j) => {
      const b = map.getBounds(), z = map.getZoom();
      const rows = j.rows.filter((r) => r[ptype].n > 0 && r.lat >= b.getSouth() && r.lat <= b.getNorth() && r.lon >= b.getWest() && r.lon <= b.getEast()
        && (!streetId || r.street === streetId));
      layer.clearLayers();
      const groups = group(rows, z, map.getCenter().lat);
      groups.forEach((g) => {
        if (g.length === 1) {
          const r = g[0], m = r[ptype].med;
          L.circleMarker([r.lat, r.lon], { radius: 10, weight: 3, color: "#fff", className: "dot", fillColor: color(m), fillOpacity: 1 })
            .bindTooltip(`${name(r.label)} · ${fmt(m)} ₸/${L10N("м²", "m²")}`)
            .on("click", function () { popupHtml(r).then((h) => this.bindPopup(h, { maxWidth: 400 }).openPopup()); }).addTo(layer);
        } else {
          const meds = g.map((r) => r[ptype].med), deals = g.reduce((s, r) => s + r[ptype].n, 0);
          const size = Math.round(34 + Math.min(30, Math.log10(g.length) * 15));
          const icon = L.divIcon({ className: "", iconSize: [size, size],
            html: `<div class="cluster${darkFill(median(meds)) ? " dark" : ""}" style="width:${size}px;height:${size}px;background:${color(median(meds))}">${g.length}</div>` });
          const lat = g.reduce((s, r) => s + r.lat, 0) / g.length, lon = g.reduce((s, r) => s + r.lon, 0) / g.length;
          L.marker([lat, lon], { icon })
            .bindTooltip(L10N(`${g.length} домов · ${deals} сделок · ${fmt(median(meds))} ₸/м²`, `${g.length} buildings · ${deals} deals · ${fmt(median(meds))} ₸/m²`))
            .on("click", () => map.fitBounds([[Math.min(...g.map((r) => r.lat)), Math.min(...g.map((r) => r.lon))], [Math.max(...g.map((r) => r.lat)), Math.max(...g.map((r) => r.lon))]],
                                              { padding: [50, 50], maxZoom: 19 })).addTo(layer);
        }
      });
      if (status) {
        status.textContent = L10N(`Домов в области: ${rows.length}, меток: ${groups.length}. Приближайте карту — группы распадаются на отдельные дома.`,
                                  `Buildings in view: ${rows.length}, marks: ${groups.length}. Zoom in to split groups into single buildings.`);
      }
      if (streetId && !fitted && rows.length) {
        fitted = true;
        map.fitBounds(rows.map((r) => [r.lat, r.lon]), { padding: [40, 40], maxZoom: 17 });
      }
    });
  }

  // opening a popup pans the map; redrawing the dots then would close it, so redraws wait until it is closed
  let popupOpen = false;
  const schedule = () => { clearTimeout(timer); timer = setTimeout(() => { if (!popupOpen) draw(); }, 200); };
  map.on("popupopen", () => { popupOpen = true; });
  map.on("popupclose", () => { popupOpen = false; schedule(); });
  map.on("moveend", schedule);
  draw();
})();
