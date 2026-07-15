(function () {
  "use strict";

  function toRawUrl(blobUrl) {
    if (blobUrl.indexOf("git.sofunny.io") >= 0) {
      var raw = blobUrl.replace("/-/blob/", "/-/raw/");
      if (raw !== blobUrl) return raw;
      return blobUrl.replace("/blob/", "/raw/");
    }
    if (blobUrl.indexOf("github.com") >= 0) {
      return blobUrl
        .replace("github.com", "raw.githubusercontent.com")
        .replace("/blob/", "/");
    }
    return blobUrl;
  }

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

  function addTreePreviewButtons() {
    var pathname = window.location.pathname;
    var isTree = pathname.indexOf("/tree/") >= 0 || pathname.indexOf("/-/tree/") >= 0;
    if (!isTree) return;

    var links = document.querySelectorAll('a[href$=".fbx"], a[href$=".FBX"]');
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      if (link.dataset.fbxTreeBtn) continue;
      link.dataset.fbxTreeBtn = "1";

      var href = link.getAttribute("href");
      if (!href) continue;

      var blobUrl = (href.indexOf("://") >= 0) ? href : window.location.origin + href;
      var rawUrl = toRawUrl(blobUrl);

      // IIFE 避免闭包错误，每个按钮拿到自己的 rawUrl
      (function (url, fileName, linkEl) {
        var btn = document.createElement("button");
        btn.textContent = "3D \u9884\u89c8";
        btn.title = "\u9884\u89c8 " + fileName;
        btn.style.cssText =
          "background:#0969da;color:#fff;border:none;border-radius:4px;" +
          "padding:2px 8px;font-size:11px;cursor:pointer;margin-left:6px;" +
          "font-weight:500;white-space:nowrap;vertical-align:middle;";

        btn.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          openPreviewModal(url);
        }, true);

        // 插入到 td / tree-item / tr 容器末尾，避开可点击的行区域
        var row = linkEl.closest("td, .tree-item, tr, .file-row");
        if (row) {
          row.appendChild(btn);
        } else {
          linkEl.style.display = "inline";
          linkEl.parentNode.insertBefore(btn, linkEl.nextSibling);
        }
      })(rawUrl, link.textContent.trim(), link);
    }
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
      console.log("[FBX Viewer] \u6309\u94ae\u5df2\u6ce8\u5165\uff0c\u57df\u540d:", window.location.hostname, "\u9009\u62e9\u5668:", selectors[i]);
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
    console.log("[FBX Viewer] \u6d6e\u52a8\u6309\u94ae\u5df2\u6ce8\u5165\uff08\u515c\u5e95\uff09");
  }

  function scan() {
    addPreviewButton();
    addTreePreviewButtons();
  }

  var attempts = 0;
  var maxAttempts = 30;
  function tryAdd() {
    scan();
    var done =
      document.getElementById("github-fbx-preview-btn") ||
      document.getElementById("github-fbx-preview-float");
    if (!done && attempts < maxAttempts) {
      var pathname = window.location.pathname.toLowerCase();
      var isTree = pathname.indexOf("/tree/") >= 0 || pathname.indexOf("/-/tree/") >= 0;
      if (pathname.endsWith(".fbx") || isTree) {
        attempts++;
        setTimeout(tryAdd, 800);
      }
    }
  }

  tryAdd();

  var observer = new MutationObserver(function () {
    scan();
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
