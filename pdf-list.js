// pdf-list.js
// 功能：按年份文件夹读取 PDF（/pdf/YYYY/），按文件名 YYYY-MM-DD.pdf 排序，显示最新 5 份

(() => {
  const statusEl = document.getElementById("pdfStatus");
  const listEl = document.getElementById("pdfList");
  const yearFolderBtn = document.getElementById("pdfYearFolderBtn");

  if (!statusEl || !listEl) return;

  // === 你的 GitHub 仓库信息 ===
  const OWNER = "zjie2025";
  const REPO = "liubc-app";
  const BRANCH = "main"; // 若默认分支不是 main，请改成 master

  const MAX_SHOW = 5;
  const BASE_DIR = "pdf";
  const year = new Date().getFullYear();
  const yearDir = `${BASE_DIR}/${year}`;

  // GitHub API：列目录文件
  const apiUrl = (path) =>
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(BRANCH)}`;

  // GitHub Pages 文件 URL
  const pagesBase = `https://${OWNER}.github.io/${REPO}`;
  const fileUrl = (path) => `${pagesBase}/${path.replace(/^\//, "")}`;

  function parseDateFromName(name) {
    // 支持：2025-12-22.pdf 或 2025-12-22
    const base = name.replace(/\.pdf$/i, "");
    const m = base.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!m) return null;
    const yyyy = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    const dd = parseInt(m[3], 10);
    if (!yyyy || !mm || !dd) return null;
    const dt = new Date(yyyy, mm - 1, dd);
    return isNaN(dt.getTime()) ? null : dt;
  }

  function renderList(items) {
    listEl.innerHTML = "";
    items.forEach((it) => {
      const li = document.createElement("li");
      li.className = "pdf-item";

      const left = document.createElement("div");

      const title = document.createElement("div");
      title.className = "pdf-title";
      title.textContent = it.displayName;

      const small = document.createElement("div");
      small.className = "muted small";
      small.textContent = it.subText;

      left.appendChild(title);
      left.appendChild(small);

      const actions = document.createElement("div");
      actions.className = "pdf-actions";

      const view = document.createElement("a");
      view.className = "btn";
      view.href = it.url;
      view.target = "_blank";
      view.rel = "noreferrer";
      view.textContent = "在线查看";

      const dl = document.createElement("a");
      dl.className = "btn ghost";
      dl.href = it.url;
      dl.setAttribute("download", "");
      dl.textContent = "下载";

      actions.appendChild(view);
      actions.appendChild(dl);

      li.appendChild(left);
      li.appendChild(actions);
      listEl.appendChild(li);
    });
  }

  async function loadYearFolder() {
    statusEl.textContent = `正在读取 ${year} 年 PDF 列表…`;

    // GitHub Pages 不提供目录列表，所以这里给“打开仓库目录”的按钮（最可靠）
    if (yearFolderBtn) {
      yearFolderBtn.href = `https://github.com/${OWNER}/${REPO}/tree/${BRANCH}/${yearDir}`;
      yearFolderBtn.style.display = "inline-flex";
    }

    const res = await fetch(apiUrl(yearDir), { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`无法读取 /${yearDir}（HTTP ${res.status}）。请确认你已创建该年份文件夹并上传 PDF。`);
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      throw new Error("读取结果异常：不是目录列表。");
    }

    const pdfs = data
      .filter((x) => x && x.type === "file" && /\.pdf$/i.test(x.name))
      .map((x) => {
        const dt = parseDateFromName(x.name);
        return {
          name: x.name,
          path: `${yearDir}/${x.name}`,
          date: dt ? dt.getTime() : 0,
          url: fileUrl(`${yearDir}/${x.name}`),
        };
      });

    const hasDates = pdfs.some((p) => p.date > 0);
    if (hasDates) {
      pdfs.sort((a, b) => b.date - a.date);
    } else {
      // 万一命名不规范，就按文件名倒序
      pdfs.sort((a, b) => (a.name < b.name ? 1 : -1));
    }

    const latest = pdfs.slice(0, MAX_SHOW).map((p) => {
      const base = p.name.replace(/\.pdf$/i, "");
      return {
        url: p.url,
        displayName: base,       // 例如 2025-12-22
        subText: `${year} 年周报`,
      };
    });

    if (latest.length === 0) {
      statusEl.textContent = `当前 ${year} 年文件夹暂无 PDF。你可以上传到 /pdf/${year}/ 例如：${year}-12-22.pdf`;
      return;
    }

    statusEl.textContent = `显示最新 ${Math.min(MAX_SHOW, latest.length)} 份（${year} 年）`;
    renderList(latest);
  }

  (async () => {
    try {
      await loadYearFolder();
    } catch (err) {
      console.error(err);
      statusEl.textContent = `周报读取失败：${err?.message || "未知错误"}`;
    }
  })();
})();
