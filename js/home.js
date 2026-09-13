(function () {
  const grid = document.getElementById("test-grid");
  const order = ["fantasy", "island", "space", "mansion", "school"];
  const tests = window.PT && window.PT.tests ? window.PT.tests : {};

  let html = "";
  order.forEach((id) => {
    const t = tests[id];
    if (!t) return;
    html +=
      '<a class="test-card theme-' + t.theme + '" href="test.html?id=' + t.id + '">' +
      '<div class="emoji">' + t.emoji + "</div>" +
      "<h3>" + t.title + "</h3>" +
      '<p class="sub">' + t.subtitle + "</p>" +
      '<div class="meta">' + t.tags.map((tag) => "<span>" + tag + "</span>").join("") + "</div>" +
      '<div class="cta">지금 시작하기 →</div>' +
      "</a>";
  });
  grid.innerHTML = html;
})();
