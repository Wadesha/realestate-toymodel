/* 复制按钮：点击后把代码复制到剪贴板 */
document.querySelectorAll(".codeblock").forEach(function (block) {
  var btn = block.querySelector("button.copy");
  var pre = block.querySelector("pre");
  if (!btn || !pre) return;
  btn.addEventListener("click", function () {
    var text = pre.innerText;
    function done() {
      btn.textContent = "已复制 ✓";
      btn.classList.add("ok");
      setTimeout(function () {
        btn.textContent = "复制代码";
        btn.classList.remove("ok");
      }, 1600);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else {
      fallback();
    }
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); done(); } catch (e) {}
      document.body.removeChild(ta);
    }
  });
});
