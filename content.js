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
    removeHoverPreview();
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

  // 悬停小窗状态
  var hoverState = {
    timer: null,
    closeTimer: null,
    previewEl: null,
    btn: null
  };

  function removeHoverPreview() {
    if (hoverState.timer) { clearTimeout(hoverState.timer); hoverState.timer = null; }
    if (hoverState.closeTimer) { clearTimeout(hoverState.closeTimer); hoverState.closeTimer = null; }
    if (hoverState.previewEl && hoverState.previewEl.parentNode) {
      hoverState.previewEl.parentNode.removeChild(hoverState.previewEl);
    }
    hoverState.previewEl = null;
    hoverState.btn = null;
  }

  function showHoverPreview(rawUrl, btn) {
    removeHoverPreview();
    hoverState.btn = btn;

    var viewerUrl = chrome.runtime.getURL(
      "viewer.html?model=" + encodeURIComponent(rawUrl) + "&mini=1"
    );

    var panel = document.createElement("div");
    panel.className = "fbx-hover-preview";
    panel.style.cssText =
      "position:fixed;z-index:99990;" +
      "width:360px;height:270px;" +
      "background:#1a1a1a;border-radius:8px;" +
      "overflow:hidden;" +
      "box-shadow:0 4px 24px rgba(0,0,0,0.6);" +
      "border:1px solid rgba(255,255,255,0.1);";

    var iframe = document.createElement("iframe");
    iframe.src = viewerUrl;
    iframe.style.cssText =
      "width:100%;height:100%;border:none;";

    panel.appendChild(iframe);

    // 鼠标离开按钮和小窗时，延时关闭
    panel.addEventListener("mouseenter", function () {
      if (hoverState.closeTimer) { clearTimeout(hoverState.closeTimer); hoverState.closeTimer = null; }
    });
    panel.addEventListener("mouseleave", function () {
      hoverState.closeTimer = setTimeout(removeHoverPreview, 300);
    });

    document.body.appendChild(panel);
    hoverState.previewEl = panel;

    // 定位：按钮右侧，确保不超出视口
    positionHoverPanel(btn, panel);
  }

  function positionHoverPanel(btn, panel) {
    var btnRect = btn.getBoundingClientRect();
    var panelW = 360, panelH = 270;
    var left = btnRect.right + 10;
    var top = btnRect.top - panelH / 2 + btnRect.height / 2;

    // 不超出右边界
    if (left + panelW > window.innerWidth - 10) {
      left = btnRect.left - panelW - 10;
    }
    // 不超出左边界
    if (left < 10) left = 10;
    // 不超出下边界
    if (top + panelH > window.innerHeight - 10) {
      top = window.innerHeight - panelH - 10;
    }
    // 不超出上边界
    if (top < 10) top = 10;

    panel.style.left = left + "px";
    panel.style.top = top + "px";
  }

  // 按钮进入：开始 2s 计时
  function onBtnEnter(rawUrl, btn) {
    removeHoverPreview();
    hoverState.timer = setTimeout(function () {
      showHoverPreview(rawUrl, btn);
    }, 2000);
  }

  // 按钮离开：取消计时 / 触发延时关闭
  function onBtnLeave() {
    if (hoverState.timer) { clearTimeout(hoverState.timer); hoverState.timer = null; }
    if (hoverState.previewEl) {
      hoverState.closeTimer = setTimeout(removeHoverPreview, 300);
    }
  }

  // 绝对定位按钮层
  var treeBtnsContainer = null;

  function ensureTreeBtnsContainer() {
    if (treeBtnsContainer && treeBtnsContainer.parentNode) return;
    if (document.getElementById("fbx-tree-btns-container")) {
      treeBtnsContainer = document.getElementById("fbx-tree-btns-container");
      return;
    }
    treeBtnsContainer = document.createElement("div");
    treeBtnsContainer.id = "fbx-tree-btns-container";
    treeBtnsContainer.style.cssText =
      "position:absolute;top:0;left:0;width:0;height:0;z-index:100;pointer-events:none;";
    document.body.appendChild(treeBtnsContainer);
  }

  function repositionTreeBtns() {
    var btns = treeBtnsContainer.querySelectorAll("[data-fbx-link-id]");
    for (var b = 0; b < btns.length; b++) {
      var btn = btns[b];
      var linkId = btn.dataset.fbxLinkId;
      var link = document.querySelector('[data-fbx-tree-link="' + linkId + '"]');
      if (link) {
        var rect = link.getBoundingClientRect();
        btn.style.top = (window.scrollY + rect.top + rect.height / 2 - 10) + "px";
        btn.style.left = (window.scrollX + rect.right + 8) + "px";
        btn.style.display = "";
      } else {
        btn.style.display = "none";
      }
    }
  }

  var repositionTimer = null;
  function scheduleReposition() {
    if (repositionTimer) clearTimeout(repositionTimer);
    repositionTimer = setTimeout(repositionTreeBtns, 50);
  }

  function addTreePreviewButtons() {
    var pathname = window.location.pathname;
    var isTree = pathname.indexOf("/tree/") >= 0 || pathname.indexOf("/-/tree/") >= 0;
    if (!isTree) return;

    ensureTreeBtnsContainer();

    var links = document.querySelectorAll('a[href$=".fbx"], a[href$=".FBX"]');
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      if (link.dataset.fbxTreeLink) continue;

      var linkId = "fbx-" + i + "-" + Date.now();
      link.dataset.fbxTreeLink = linkId;

      var href = link.getAttribute("href");
      if (!href) continue;

      var blobUrl = (href.indexOf("://") >= 0) ? href : window.location.origin + href;
      var rawUrl = toRawUrl(blobUrl);

      (function (url, linkEl, id) {
        var btn = document.createElement("button");
        btn.dataset.fbxLinkId = id;
        btn.textContent = "3D \u9884\u89c8";
        btn.title = "\u9884\u89c8 " + (linkEl.textContent || "").trim();
        btn.style.cssText =
          "position:absolute;" +
          "background:#0969da;color:#fff;border:none;border-radius:4px;" +
          "padding:2px 8px;font-size:11px;cursor:pointer;" +
          "font-weight:500;white-space:nowrap;pointer-events:auto;";

        // 点击 → 全屏弹窗
        btn.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          removeHoverPreview();
          openPreviewModal(url);
        });
        btn.addEventListener("mousedown", function (e) {
          e.preventDefault();
          e.stopPropagation();
        });

        // 悬停 2s → 小窗预览
        btn.addEventListener("mouseenter", function () {
          onBtnEnter(url, btn);
        });
        btn.addEventListener("mouseleave", function () {
          onBtnLeave();
        });

        treeBtnsContainer.appendChild(btn);

        var rect = linkEl.getBoundingClientRect();
        btn.style.top = (window.scrollY + rect.top + rect.height / 2 - 10) + "px";
        btn.style.left = (window.scrollX + rect.right + 8) + "px";
      })(rawUrl, link, linkId);
    }

    scheduleReposition();
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

  window.addEventListener("scroll", function () {
    removeHoverPreview();
    scheduleReposition();
  }, { passive: true });
  window.addEventListener("resize", scheduleReposition, { passive: true });

  var observer = new MutationObserver(function () {
    scan();
    scheduleReposition();
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
