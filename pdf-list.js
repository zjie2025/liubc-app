// pdf-list.js
// 功能：
// 1️⃣ 只使用 GitHub Pages 链接（不会进入 GitHub 仓库）
// 2️⃣ 支持 /pdf/2025/YYYY-MM-DD.pdf
// 3️⃣ 显示最新 5 份
// 4️⃣ 在线查看 & 下载都可用
// 5️⃣ “查看今年全部周报” 打开站内归档页（不再 404）

(() => {
  const statusEl = document.getElementById("pdfStatus");
  const listEl = document.getElementById("pdfList");
  const yearFolderBtn = document.getElementById("pdfYearFolderBtn");

  if (!statusEl || !listEl) return;

  // ===== 基本配置 =====
  const OWNER = "zjie2025";
  const REPO = "liubc-app";
  const BRANCH = "main";
  const MAX_SHOW = 5;

  const year = new Date().getFullYear();
  const BASE_DIR = "pdf";
  const yearDir = `${BASE_DIR}/${year}`;

  // ✅ GitHub Pages 真实访问地址（会友只看这个域名）
  const PAGES_BASE = `https://${OWNER}.github.io/${REPO}`;
  const fileUrl = (path) => `${PAGES_BASE}/${path}`;

  // GitHub API（只用于“列出文件名”，不会给会友看到）
  const apiUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${yearDir}?ref=${BRANCH}`;

  function parseDate(name) {
    const base = name.replace(/\.pdf$/i, "");
    const m = base.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return 0;
    return new Date(+m[1], +m[2] - 1, +m[3]).getTime();
  }

  async function loadPdfs() {
    statusEl.textContent = `正在加载 ${year} 年周报…`;

    const res = await fetch(apiUrl, { cache: "no-store" });
    if (!res.ok) {
      statusEl.textContent = `未找到 ${year} 年周报`;
      // 即使没找到，也给按钮跳归档页（以后传了就能看）
      if (yearFolderBtn) {
        yearFolderBtn.href = `${PAGES_BASE}/pdf-year.html?y=${year}`;
        yearFolderBtn.style.display = "inline-flex";
      }
      return;
    }

    const files = await res.json();
    const pdfs = (files || [])
      .filter(f => f.type === "file" && f.name.toLowerCase().endsWith(".pdf"))
      .map(f => ({
        name: f.name,
        date: parseDate(f.name),
        url: fileUrl(`${yearDir}/${f.name}`)
      }))
      .sort((a, b) => b.date - a.date)
      .slice(0, MAX_SHOW);

    if (pdfs.length === 0) {
      statusEl.textContent = "暂无周报";
    } else {
      statusEl.textContent = `显示最新 ${pdfs.length} 份周报`;
      listEl.innerHTML = "";

      pdfs.forEach(p => {
        const li = document.createElement("li");
        li.className = "pdf-item";
        li.innerHTML = `
          <div>
            <div class="pdf-title">${p.name.replace(".pdf", "")}</div>
            <div class="muted small">${year} 年周报</div>
          </div>
          <div class="pdf-actions">
            <a class="btn" href="${p.url}" target="_blank" rel="noreferrer">在线查看</a>
            <a class="btn ghost" href="${p.url}" download>下载</a>
          </div>
        `;
        listEl.appendChild(li);
      });
    }

    // ✅ “查看今年全部周报” → 打开站内归档页（不会 404、不会进 GitHub）
    if (yearFolderBtn) {
      yearFolderBtn.href = `${PAGES_BASE}/pdf-year.html?y=${year}`;
      yearFolderBtn.style.display = "inline-flex";
    }
  }

  loadPdfs();
})();
