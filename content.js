(function () {
  "use strict";

  // 统一的原始文件 URL 转换：支持 GitHub 和 GitLab
  function toRawUrl(blobUrl) {
    if (blobUrl.indexOf("git.sofunny.io") >= 0) {
      // 标准 GitLab: /-/blob/ → /-/raw/
      var raw = blobUrl.replace("/-/blob/", "/-/raw/");
      if (raw !== blobUrl) return raw;
      // 兼容无 /-/ 的 GitLab 路径
      return blobUrl.replace("/blob/", "/raw/");
    }
    if (blobUrl.indexOf("github.com") >= 0) {
      return blobUrl
        .replace("github.com", "raw.githubusercontent.com")
        .replace("/blob/", "/");
    }
    return blobUrl;
  }

  // 创建内嵌预览弹窗
  function openPreviewModal(rawUrl) {
    var modalId = "fbx-preview-modal";
    if (document.getElementById(modalId)) return;

    var viewerUrl = chrome.runtime.getURL(
      "viewer.html?model=" + encodeURIComponent(rawUrl)
    );

    var overlay = document.createElement("div");
    overlay.id = modalId;
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:99999;" +
      "background:rgba(0,0,0,0.75);" +
      "display:flex;align-items:center;justify-content:center;";

    var container = document.createElement("div");
    container.style.cssText =
      "position:relative;width:90vw;height:85vh;" +
      "background:#1a1a1a;border-radius:8px;" +
      "box-shadow:0 8px 40px rgba(0,0,0,0.5);overflow:hidden;";

    var closeBtn = document.createElement("button");
    closeBtn.textContent = "\u00D7";
    closeBtn.style.cssText =
      "position:absolute;top:12px;right:16px;z-index:100001;" +
      "background:rgba(0,0,0,0.5);color:#fff;border:none;" +
      "width:36px;height:36px;border-radius:50%;font-size:22px;" +
      "cursor:pointer;line-height:36px;text-align:center;" +
      "transition:background 0.15s;";
    closeBtn.onmouseover = function () { closeBtn.style.background = "rgba(255,255,255,0.2)"; };
    closeBtn.onmouseout  = function () { closeBtn.style.background = "rgba(0,0,0,0.5)"; };

    var iframe = document.createElement("iframe");
    iframe.src = viewerUrl;
    iframe.style.cssText =
      "width:100%;height:100%;border:none;";

    function close() {
      document.removeEventListener("keydown", onKey);
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }
    closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });
    function onKey(e) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);

    container.appendChild(closeBtn);
    container.appendChild(iframe);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
  }

  function addPreviewButton() {
    var pathname = window.location.pathname.toLowerCase();
    if (!pathname.endsWith(".fbx")) return;
    if (document.getElementById("github-fbx-preview-btn")) return;

    var selectors = [
      '[data-testid="sticky-file-header"]',
      '[data-testid="file-header"]',
      ".react-blob-header",
      ".react-file-header",
      ".file-header",
      ".Box-header .d-flex",
      ".Box-header",
      'a[href*="raw.githubusercontent.com"]',
      'a[id="raw-url"]',
      "#raw-url",
      ".file-actions",
      ".file-header-content",
      ".blob-file-content",
      ".file-title",
      ".qa-file-title",
      ".js-file-title",
    ];

    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (!el) continue;

      var target = el;
      if (selectors[i].indexOf("raw") >= 0 || selectors[i].indexOf("raw-url") >= 0) {
        target = el.closest(".d-flex, .BtnGroup, .flex-items-center, div");
        if (!target) target = el.parentElement;
      }
      if (selectors[i].indexOf("file-title") >= 0 || selectors[i].indexOf("file-header") >= 0) {
        var parent = el.closest(".file-actions, .btn-group, .gl-button-group, .file-header-content") || el.parentElement;
        if (parent) target = parent;
      }

      var btn = document.createElement("button");
      btn.id = "github-fbx-preview-btn";
      btn.textContent = "3D \u9884\u89c8";
      btn.style.cssText =
        "background:#0969da;color:#fff;border:none;border-radius:6px;" +
        "padding:5px 16px;font-size:14px;cursor:pointer;margin-left:8px;" +
        "font-weight:500;white-space:nowrap;";

      btn.addEventListener("click", function () {
        openPreviewModal(toRawUrl(window.location.href));
      });

      target.appendChild(btn);
      console.log("[FBX Viewer] 按钮已注入，域名:", window.location.hostname, "选择器:", selectors[i]);
      return;
    }

    if (document.getElementById("github-fbx-preview-float")) return;
    var floatBtn = document.createElement("button");
    floatBtn.id = "github-fbx-preview-float";
    floatBtn.textContent = "3D \u9884\u89c8 FBX";
    floatBtn.style.cssText =
      "position:fixed;bottom:24px;right:24px;z-index:9999;" +
      "background:#0969da;color:#fff;border:none;border-radius:8px;" +
      "padding:10px 20px;font-size:14px;cursor:pointer;font-weight:600;" +
      "box-shadow:0 4px 12px rgba(0,0,0,0.3);";
    floatBtn.addEventListener("click", function () {
      openPreviewModal(toRawUrl(window.location.href));
    });
    document.body.appendChild(floatBtn);
    console.log("[FBX Viewer] 浮动按钮已注入（兜底）");
  }

  var attempts = 0;
  var maxAttempts = 30;
  function tryAdd() {
    addPreviewButton();
    var found =
      document.getElementById("github-fbx-preview-btn") ||
      document.getElementById("github-fbx-preview-float");
    if (!found && attempts < maxAttempts && window.location.pathname.toLowerCase().endsWith(".fbx")) {
      attempts++;
      setTimeout(tryAdd, 800);
    }
  }

  tryAdd();

  var observer = new MutationObserver(function () {
    if (window.location.pathname.toLowerCase().endsWith(".fbx")) {
      addPreviewButton();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
