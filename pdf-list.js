(async function () {
  const statusEl = document.getElementById("pdfStatus");
  const listEl = document.getElementById("pdfList");
  if (!statusEl || !listEl) return;

  function setStatus(msg) {
    statusEl.textContent = msg;
  }

  // 解析 GitHub Pages 的 owner/repo
  // 例1：https://username.github.io/repo/
  // 例2：https://username.github.io/  (repo = username.github.io)
  const host = window.location.hostname;          // username.github.io
  const owner = host.split(".")[0];               // username
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const repo = pathParts.length > 0 ? pathParts[0] : `${owner}.github.io`;

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/pdf`;

  try {
    setStatus("正在读取 PDF 列表…");

    const res = await fetch(apiUrl, {
      headers: { "Accept": "application/vnd.github+json" }
    });

    if (!res.ok) {
      setStatus(`读取失败（${res.status}）——请确认仓库里有 /pdf 文件夹且文件已上传。`);
      return;
    }

    const items = await res.json();

    // 只保留 .pdf 文件
    const pdfs = (Array.isArray(items) ? items : [])
      .filter(x => x && x.type === "file" && typeof x.name === "string" && x.name.toLowerCase().endsWith(".pdf"));

    if (pdfs.length === 0) {
      setStatus("目前 /pdf 文件夹里还没有 PDF。上传后刷新页面即可显示。");
      return;
    }

    // 按文件名倒序（weekly-2025-12-29.pdf 这种命名会很适合）
    pdfs.sort((a, b) => b.name.localeCompare(a.name));

    // 生成列表：在线查看 + 下载
    const frag = document.createDocumentFragment();

    pdfs.forEach(file => {
      const li = document.createElement("li");
      li.className = "pdf-item";

      const left = document.createElement("div");
      const title = document.createElement("div");
      title.className = "pdf-title";
      title.textContent = file.name;

      const sub = document.createElement("div");
      sub.className = "muted small";
      sub.textContent = "PDF";

      left.appendChild(title);
      left.appendChild(sub);

      const right = document.createElement("div");
      right.className = "pdf-actions";

      // 站点内的相对路径（你上传到 /pdf/ 文件夹）
      const href = `pdf/${encodeURIComponent(file.name)}`;

      const view = document.createElement("a");
      view.className = "btn small";
      view.href = href;
      view.target = "_blank";
      view.rel = "noreferrer";
      view.textContent = "在线查看";

      const dl = document.createElement("a");
      dl.className = "btn small ghost";
      dl.href = href;
      dl.setAttribute("download", "");
      dl.textContent = "下载";

      right.appendChild(view);
      right.appendChild(dl);

      li.appendChild(left);
      li.appendChild(right);
      frag.appendChild(li);
    });

    listEl.innerHTML = "";
    listEl.appendChild(frag);
    statusEl.remove(); // 列表出来后移除状态文字
  } catch (err) {
    setStatus("读取 PDF 列表时发生错误。请稍后刷新重试。");
  }
})();

