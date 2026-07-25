(() => {
  const storageKey = "lunar-first-orbit-availability-v1";
  const cards = Array.from(document.querySelectorAll("[data-candidate]"));
  const environmentInputs = Array.from(
    document.querySelectorAll('input[name="environment"]'),
  );
  const noteInput = document.querySelector("#availability-note");
  const replyOutput = document.querySelector("#generated-reply");
  const copyButton = document.querySelector("#copy-reply");
  const manualCopy = document.querySelector("#manual-copy");

  if (!cards.length || !replyOutput || !copyButton) return;

  const state = {
    selected: new Set(),
    environment: "",
    note: "",
  };

  const environmentLabels = {
    voice: "可以正常语音",
    text: "只能旁听 / 文字",
    evening: "午间环境不可行",
  };

  function loadState() {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.selected)) {
        state.selected = new Set(parsed.selected);
      }
      state.environment = parsed.environment || "";
      state.note = parsed.note || "";
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }

  function saveState() {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        selected: Array.from(state.selected),
        environment: state.environment,
        note: state.note,
      }),
    );
  }

  function buildReply() {
    const selectedLabels = cards
      .filter((card) => state.selected.has(card.dataset.candidate))
      .map((card) => `${card.dataset.candidate}（${card.dataset.label}）`);

    return [
      "🌙 First Orbit 时间回复",
      "",
      `可完整参加：${selectedLabels.length ? selectedLabels.join("、") : "尚未选择"}`,
      `午间参与环境：${environmentLabels[state.environment] || "尚未说明"}`,
      state.note.trim() ? `补充：${state.note.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  function render() {
    cards.forEach((card) => {
      const selected = state.selected.has(card.dataset.candidate);
      card.classList.toggle("is-selected", selected);
      card.setAttribute("aria-pressed", String(selected));
      const check = card.querySelector(".candidate-check");
      if (check) {
        check.textContent = selected ? "✓" : card.dataset.candidate;
      }
    });

    environmentInputs.forEach((input) => {
      input.checked = input.value === state.environment;
      input.closest(".environment-option")?.classList.toggle(
        "is-selected",
        input.checked,
      );
    });

    if (noteInput) noteInput.value = state.note;
    replyOutput.textContent = buildReply();
    copyButton.disabled = state.selected.size === 0;
  }

  function resetCopyState() {
    copyButton.textContent = "复制群回复";
    if (manualCopy) manualCopy.hidden = true;
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const fallback = document.createElement("textarea");
    fallback.value = text;
    fallback.setAttribute("readonly", "");
    fallback.style.position = "fixed";
    fallback.style.opacity = "0";
    document.body.appendChild(fallback);
    fallback.select();
    const copied = document.execCommand("copy");
    fallback.remove();
    if (!copied) throw new Error("Copy unavailable");
  }

  loadState();
  render();

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      resetCopyState();
      const id = card.dataset.candidate;
      if (state.selected.has(id)) {
        state.selected.delete(id);
      } else {
        state.selected.add(id);
      }
      saveState();
      render();
    });
  });

  environmentInputs.forEach((input) => {
    input.addEventListener("change", () => {
      resetCopyState();
      state.environment = input.value;
      saveState();
      render();
    });
  });

  noteInput?.addEventListener("input", () => {
    resetCopyState();
    state.note = noteInput.value.slice(0, 80);
    saveState();
    render();
  });

  copyButton.addEventListener("click", async () => {
    try {
      await copyText(buildReply());
      copyButton.textContent = "已复制，发到 Lunar Chat";
      window.setTimeout(resetCopyState, 2400);
    } catch {
      if (manualCopy) manualCopy.hidden = false;
    }
  });
})();
