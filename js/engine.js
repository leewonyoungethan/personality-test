/* ===== 모험형 선택지 성격테스트 공용 엔진 =====
   각 테스트 데이터는 window.PT.tests[id] 에 아래 형태로 등록됨:
   {
     id, title, subtitle, emoji, theme,
     axes: [ {key, name, tiers:[{adj, noun?, desc}, ...]}, ... 3개 ],
     scenes: [ {text, choices:[{label, points:{A,B,C}}, ...]}, ... ],
     closingLines: [str, str, str]
   }
*/
window.PT = window.PT || { tests: {} };

(function () {
  const qs = new URLSearchParams(location.search);
  const testId = qs.get("id");
  const test = window.PT.tests[testId];

  const shell = document.getElementById("test-shell");
  if (!test) {
    shell.innerHTML =
      '<div class="scene-card"><p class="scene-text">테스트를 찾을 수 없어요.</p>' +
      '<div class="choice-list"><a class="choice-btn" href="index.html">🏠 홈으로 돌아가기</a></div></div>';
    return;
  }

  document.title = test.title + " | 모험 성격테스트";
  document.body.classList.add("theme-" + test.theme);

  let sceneIndex = 0;
  const scores = { A: 0, B: 0, C: 0 };
  const totalScenes = test.scenes.length;

  function maxPossible(axisKey) {
    return test.scenes.reduce((sum, scene) => {
      const maxInScene = Math.max(...scene.choices.map((c) => c.points[axisKey] || 0));
      return sum + maxInScene;
    }, 0);
  }

  function renderHeader() {
    return (
      '<div class="top-bar">' +
      '<a class="back" href="index.html">← 홈</a>' +
      '<div class="progress-track"><div class="progress-fill" style="width:' +
      Math.round((sceneIndex / totalScenes) * 100) +
      '%"></div></div>' +
      '<div class="progress-label">' + sceneIndex + "/" + totalScenes + "</div>" +
      "</div>" +
      '<div class="test-title-bar"><div class="emoji">' + test.emoji + "</div>" +
      "<h2>" + test.title + "</h2></div>"
    );
  }

  let typingTimer = null;
  let typingDone = false;

  function typeText(text, el, onDone) {
    typingDone = false;
    el.textContent = "";
    el.classList.add("typing");
    let i = 0;
    clearInterval(typingTimer);
    typingTimer = setInterval(() => {
      i++;
      el.textContent = text.slice(0, i);
      if (i >= text.length) {
        clearInterval(typingTimer);
        typingDone = true;
        el.classList.remove("typing");
        onDone();
      }
    }, 22);
  }

  function skipTyping(text, el, onDone) {
    clearInterval(typingTimer);
    el.textContent = text;
    el.classList.remove("typing");
    if (!typingDone) {
      typingDone = true;
      onDone();
    }
  }

  function renderScene() {
    const scene = test.scenes[sceneIndex];
    let html = renderHeader();
    html +=
      '<div class="scene-card" id="scene-card">' +
      '<div class="scene-tag">SCENE ' + String(sceneIndex + 1).padStart(2, "0") + "</div>" +
      '<p class="scene-text" id="scene-text"></p>' +
      '<div class="choice-list" id="choice-list" hidden>';
    scene.choices.forEach((choice, i) => {
      html += '<button class="choice-btn" data-i="' + i + '">' + escapeHtml(choice.label) + "</button>";
    });
    html += "</div></div>";
    shell.innerHTML = html;

    const textEl = document.getElementById("scene-text");
    const listEl = document.getElementById("choice-list");
    const cardEl = document.getElementById("scene-card");

    function revealChoices() {
      listEl.hidden = false;
      listEl.querySelectorAll(".choice-btn").forEach((btn, idx) => {
        btn.style.animationDelay = idx * 0.09 + "s";
        btn.classList.add("choice-reveal");
      });
    }

    typeText(scene.text, textEl, revealChoices);

    cardEl.addEventListener("click", (e) => {
      if (e.target.closest(".choice-btn")) return;
      if (!typingDone) skipTyping(scene.text, textEl, revealChoices);
    });

    listEl.querySelectorAll(".choice-btn[data-i]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!typingDone) return;
        const choice = scene.choices[parseInt(btn.dataset.i, 10)];
        scores.A += choice.points.A || 0;
        scores.B += choice.points.B || 0;
        scores.C += choice.points.C || 0;
        cardEl.classList.add("scene-exit");
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => {
          sceneIndex++;
          if (sceneIndex < totalScenes) {
            renderScene();
          } else {
            renderResult();
          }
        }, 220);
      });
    });
  }

  function tierOf(axisKey, score) {
    const axis = test.axes.find((a) => a.key === axisKey);
    const max = Math.max(1, maxPossible(axisKey));
    const n = axis.tiers.length;
    let idx = Math.floor((score / max) * n);
    if (idx >= n) idx = n - 1;
    if (idx < 0) idx = 0;
    return axis.tiers[idx];
  }

  function renderResult() {
    const axisA = test.axes.find((a) => a.key === "A");
    const axisB = test.axes.find((a) => a.key === "B");
    const axisC = test.axes.find((a) => a.key === "C");

    const tA = tierOf("A", scores.A);
    const tB = tierOf("B", scores.B);
    const tC = tierOf("C", scores.C);

    const title = tA.adj + " " + tB.adj + " " + tC.noun;
    const closing = test.closingLines[(scores.A + scores.B + scores.C) % test.closingLines.length];

    const resultKey = test.id + "-" + tA.adj + tB.adj + tC.noun;

    let html =
      '<div class="top-bar"><a class="back" href="index.html">← 홈</a></div>' +
      '<div class="result-card">' +
      '<div class="tag reveal" style="animation-delay:.05s">' + escapeHtml(test.title) + ' 결과</div>' +
      '<div class="emoji-big">' + test.emoji + "</div>" +
      '<h2 class="reveal" style="animation-delay:.15s">' + escapeHtml(title) + "</h2>" +
      '<p class="reveal" style="animation-delay:.25s">' + escapeHtml(tA.desc) + "</p>" +
      '<p class="reveal" style="animation-delay:.33s">' + escapeHtml(tB.desc) + "</p>" +
      '<p class="reveal" style="animation-delay:.41s">' + escapeHtml(tC.desc) + "</p>" +
      '<p class="reveal" style="animation-delay:.49s">' + escapeHtml(closing) + "</p>" +
      '<div class="result-stats reveal" style="animation-delay:.58s">' +
      statHtml(axisA.name, scores.A) +
      statHtml(axisB.name, scores.B) +
      statHtml(axisC.name, scores.C) +
      "</div>" +
      '<div class="result-actions reveal" style="animation-delay:.66s">' +
      '<button class="btn primary" id="copy-btn">📋 결과 복사하기</button>' +
      '<a class="btn ghost" href="test.html?id=' + test.id + '">🔄 다시하기</a>' +
      '<a class="btn ghost" href="index.html">🗺️ 다른 테스트</a>' +
      "</div></div>" +
      '<div class="copy-toast" id="toast">복사했어요!</div>';

    shell.innerHTML = html;

    shell.querySelectorAll(".stat .num").forEach((el) => {
      const target = parseInt(el.textContent, 10) || 0;
      el.textContent = "0";
      const start = performance.now();
      const duration = 700;
      function tick(now) {
        const p = Math.min(1, (now - start) / duration);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      }
      setTimeout(() => requestAnimationFrame(tick), 560);
    });

    document.getElementById("copy-btn").addEventListener("click", () => {
      const shareText =
        "[" + test.title + "]\n나의 유형: " + title + "\n\n" +
        tA.desc + "\n" + tB.desc + "\n" + tC.desc + "\n\n" +
        location.origin + location.pathname.replace("test.html", "index.html");
      copyText(shareText);
    });

    console.log("result id:", resultKey);
  }

  function statHtml(label, value) {
    return (
      '<div class="stat"><div class="num">' + value + '</div><div class="lbl">' + escapeHtml(label) + "</div></div>"
    );
  }

  function copyText(text) {
    const toast = document.getElementById("toast");
    const show = () => {
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(show).catch(show);
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta);
      show();
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  renderScene();
})();
