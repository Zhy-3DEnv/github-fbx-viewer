(function () {
  "use strict";

  function addPreviewButton() {
    var pathname = window.location.pathname.toLowerCase();
    if (!pathname.endsWith(".fbx")) return;
    if (document.getElementById("github-fbx-preview-btn")) return;

    // 挨个尝试 GitHub 文件头部的选择器
    var selectors = [
      '[data-testid="sticky-file-header"]',
      '[data-testid="file-header"]',
      ".react-blob-header",
      ".react-file-header",
      ".file-header",
      ".Box-header .d-flex",
      ".Box-header",
      // 找 Raw 按钮的父级再挂载
      'a[href*="raw.githubusercontent.com"]',
      'a[id="raw-url"]',
      "#raw-url",
    ];

    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (!el) continue;

      var target = el;
      // 如果选到的是 Raw 链接，挂到它的父容器上
      if (selectors[i].indexOf("raw") >= 0 || selectors[i].indexOf("raw-url") >= 0) {
        target = el.closest(".d-flex, .BtnGroup, .flex-items-center, div");
        if (!target) target = el.parentElement;
      }

      var btn = document.createElement("button");
      btn.id = "github-fbx-preview-btn";
      btn.textContent = "3D 预览";
      btn.style.cssText =
        "background:#0969da;color:#fff;border:none;border-radius:6px;" +
        "padding:5px 16px;font-size:14px;cursor:pointer;margin-left:8px;" +
        "font-weight:500;white-space:nowrap;";

      btn.addEventListener("click", function () {
        var rawUrl = window.location.href
          .replace("github.com", "raw.githubusercontent.com")
          .replace("/blob/", "/");
        var viewerUrl = chrome.runtime.getURL(
          "viewer.html?model=" + encodeURIComponent(rawUrl)
        );
        window.open(viewerUrl, "_blank");
      });

      target.appendChild(btn);
      console.log("[FBX Viewer] 按钮已注入，选择器:", selectors[i]);
      return;
    }

    // 兜底：浮动按钮
    if (document.getElementById("github-fbx-preview-float")) return;
    var floatBtn = document.createElement("button");
    floatBtn.id = "github-fbx-preview-float";
    floatBtn.textContent = "3D 预览 FBX";
    floatBtn.style.cssText =
      "position:fixed;bottom:24px;right:24px;z-index:9999;" +
      "background:#0969da;color:#fff;border:none;border-radius:8px;" +
      "padding:10px 20px;font-size:14px;cursor:pointer;font-weight:600;" +
      "box-shadow:0 4px 12px rgba(0,0,0,0.3);";
    floatBtn.addEventListener("click", function () {
      var rawUrl = window.location.href
        .replace("github.com", "raw.githubusercontent.com")
        .replace("/blob/", "/");
      var viewerUrl = chrome.runtime.getURL(
        "viewer.html?model=" + encodeURIComponent(rawUrl)
      );
      window.open(viewerUrl, "_blank");
    });
    document.body.appendChild(floatBtn);
    console.log("[FBX Viewer] 浮动按钮已注入（兜底）");
  }

  // 因为 GitHub 是 SPA 异步加载，用重试机制
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

  // 监听 SPA 页面切换
  var observer = new MutationObserver(function () {
    if (window.location.pathname.toLowerCase().endsWith(".fbx")) {
      addPreviewButton();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
