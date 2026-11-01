// The admin's image gallery field (app/image_gallery.py): upload, reorder and remove images in the form.
// Each image is a hidden <input> in the list, so the form saves them in the order shown.
(() => {
  "use strict";

  const IMAGE_NAME = /\.(png|jpe?g|gif|webp|avif|svg)$/i;

  function init(root) {
    const list = root.querySelector(".img-gallery__list");
    const template = root.querySelector(".img-gallery__template");
    const fileInput = root.querySelector(".img-gallery__file");
    const urlInput = root.querySelector(".img-gallery__url");
    const library = root.querySelector(".img-gallery__library");
    const status = root.querySelector(".img-gallery__status");
    const form = root.closest("form");
    const uploadUrl = root.dataset.uploadUrl;
    const libraryUrl = root.dataset.libraryUrl;
    const maxBytes = Number(root.dataset.maxBytes) || Infinity;
    let pending = 0;
    let dragged = null;
    let libraryLoaded = false;

    const urls = () => [...list.querySelectorAll("input[type=hidden]")].map(input => input.value);

    function setStatus(message, isError = false) {
      status.textContent = message;
      status.classList.toggle("is-error", isError);
    }

    function watchBroken(img) {
      const item = img.closest(".img-gallery__item");
      img.addEventListener("error", () => item.classList.add("is-broken"));
      img.addEventListener("load", () => item.classList.remove("is-broken"));
      if (img.complete && img.getAttribute("src") && img.naturalWidth === 0) item.classList.add("is-broken");
    }

    function makeItem(url) {
      const item = template.content.firstElementChild.cloneNode(true);
      const img = item.querySelector("img");
      const name = item.querySelector(".img-gallery__name");
      img.src = url;
      name.textContent = url.split("/").pop() || url;
      name.title = url;
      item.querySelector("input[type=hidden]").value = url;
      watchBroken(img);
      return item;
    }

    function changed() {
      if (libraryLoaded) markLibrary();
    }

    function addUrl(url) {
      url = url.trim();
      if (!url) return false;
      if (urls().includes(url)) {
        setStatus("That image is already in this project.");
        return false;
      }
      list.append(makeItem(url));
      changed();
      return true;
    }

    // ── Uploads ──────────────────────────────────────────────────────────────
    async function upload(file) {
      const body = new FormData();
      body.append("file", file, file.name || "pasted.png");
      const res = await fetch(uploadUrl, {
        method: "POST",
        body,
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      let data = null;
      try {
        data = await res.json();
      } catch {
        // A redirect to the login page, or a proxy error page.
      }
      if (res.ok && data && data.url) return data.url;
      if (data && data.error) throw new Error(data.error);
      if (res.redirected) throw new Error("you were logged out; log in again in another tab and retry");
      if (res.status === 413) throw new Error("too large");
      throw new Error(`upload failed (HTTP ${res.status})`);
    }

    function uploadFiles(files) {
      const errors = [];
      for (const file of files) {
        const label = file.name || "pasted image";
        if (!(file.type.startsWith("image/") || IMAGE_NAME.test(file.name))) {
          errors.push(`${label}: not an image`);
          continue;
        }
        if (file.size > maxBytes) {
          errors.push(`${label}: larger than ${Math.round(maxBytes / 1048576)} MB`);
          continue;
        }
        // A local preview stands in until the upload finishes, in the spot it will take.
        const preview = URL.createObjectURL(file);
        const placeholder = makeItem(preview);
        placeholder.classList.add("is-uploading");
        placeholder.draggable = false;
        placeholder.querySelector("input[type=hidden]").remove();
        placeholder.querySelector(".img-gallery__name").textContent = "Uploading…";
        list.append(placeholder);
        pending += 1;
        upload(file)
          .then(url => {
            placeholder.replaceWith(makeItem(url));
            changed();
            // `finally` hasn't counted this one down yet: 1 means it was the last.
            if (pending === 1) setStatus("Uploaded. Save the project to keep the new images.");
          })
          .catch(err => {
            placeholder.remove();
            setStatus(`${label}: ${err.message}`, true);
          })
          .finally(() => {
            pending -= 1;
            URL.revokeObjectURL(preview);
            root.classList.toggle("is-busy", pending > 0);
          });
      }
      root.classList.toggle("is-busy", pending > 0);
      if (errors.length) setStatus(errors.join(" · "), true);
      else if (pending) setStatus(`Uploading ${pending} image${pending === 1 ? "" : "s"}…`);
    }

    fileInput.addEventListener("change", () => {
      uploadFiles([...fileInput.files]);
      fileInput.value = "";
    });

    // Files dragged in from outside the page (not a thumbnail being reordered).
    const hasFiles = e => !dragged && e.dataTransfer && [...e.dataTransfer.types].includes("Files");
    let dragDepth = 0;
    root.addEventListener("dragenter", e => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepth += 1;
      root.classList.add("is-dropping");
    });
    root.addEventListener("dragover", e => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    });
    root.addEventListener("dragleave", e => {
      if (!hasFiles(e)) return;
      dragDepth = Math.max(0, dragDepth - 1);
      if (!dragDepth) root.classList.remove("is-dropping");
    });
    root.addEventListener("drop", e => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepth = 0;
      root.classList.remove("is-dropping");
      uploadFiles([...e.dataTransfer.files]);
    });

    // Pasting a screenshot anywhere on the form uploads it (text paste is left alone).
    document.addEventListener("paste", e => {
      const files = [...(e.clipboardData?.files || [])].filter(f => f.type.startsWith("image/"));
      if (!files.length) return;
      e.preventDefault();
      uploadFiles(files);
    });

    // A save mid-upload would drop the images still on their way.
    form?.addEventListener("submit", e => {
      if (!pending) return;
      e.preventDefault();
      setStatus("Still uploading; save again once the uploads finish.", true);
    });

    // ── Reorder / remove ─────────────────────────────────────────────────────
    list.addEventListener("click", e => {
      const button = e.target.closest("button[data-act]");
      const item = button?.closest(".img-gallery__item");
      if (!item || item.classList.contains("is-uploading")) return;
      if (button.dataset.act === "remove") item.remove();
      else if (button.dataset.act === "left" && item.previousElementSibling) {
        list.insertBefore(item, item.previousElementSibling);
      } else if (button.dataset.act === "right" && item.nextElementSibling) {
        list.insertBefore(item.nextElementSibling, item);
      }
      changed();
    });

    list.addEventListener("dragstart", e => {
      const item = e.target.closest?.(".img-gallery__item");
      if (!item || item.classList.contains("is-uploading")) return;
      dragged = item;
      item.classList.add("is-dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", ""); // Firefox won't start a drag without data
    });
    list.addEventListener("dragover", e => {
      if (!dragged) return;
      e.preventDefault();
      const over = e.target.closest(".img-gallery__item");
      if (!over || over === dragged) return;
      const box = over.getBoundingClientRect();
      const after = e.clientX > box.left + box.width / 2;
      list.insertBefore(dragged, after ? over.nextElementSibling : over);
    });
    list.addEventListener("drop", e => {
      if (dragged) e.preventDefault();
    });
    list.addEventListener("dragend", () => {
      dragged?.classList.remove("is-dragging");
      dragged = null;
      changed();
    });

    // ── Paths / URLs ─────────────────────────────────────────────────────────
    function addTypedUrl() {
      if (addUrl(urlInput.value)) {
        urlInput.value = "";
        setStatus("");
      }
    }
    root.querySelector("[data-act=add-url]").addEventListener("click", addTypedUrl);
    urlInput.addEventListener("keydown", e => {
      if (e.key !== "Enter") return;
      e.preventDefault(); // don't submit the whole form
      addTypedUrl();
    });

    // ── Media library ────────────────────────────────────────────────────────
    function markLibrary() {
      const current = new Set(urls());
      for (const button of library.querySelectorAll("button[data-url]")) {
        const added = current.has(button.dataset.url);
        button.classList.toggle("is-added", added);
        button.title = added ? `${button.dataset.url} (in this project)` : button.dataset.url;
      }
    }

    async function loadLibrary() {
      library.textContent = "Loading…";
      try {
        const res = await fetch(libraryUrl, { credentials: "same-origin", headers: { Accept: "application/json" } });
        const { images } = await res.json();
        library.textContent = "";
        if (!images.length) {
          library.textContent = "Nothing uploaded yet.";
          return;
        }
        for (const { url } of images) {
          const button = document.createElement("button");
          button.type = "button";
          button.dataset.url = url;
          const img = document.createElement("img");
          img.src = url;
          img.alt = "";
          img.loading = "lazy";
          button.append(img);
          library.append(button);
        }
        libraryLoaded = true;
        markLibrary();
      } catch {
        library.textContent = "Couldn't load the Media library.";
      }
    }

    root.querySelector("[data-act=library]").addEventListener("click", () => {
      library.hidden = !library.hidden;
      if (!library.hidden && !libraryLoaded) loadLibrary();
    });
    library.addEventListener("click", e => {
      const button = e.target.closest("button[data-url]");
      if (!button) return;
      if (button.classList.contains("is-added")) {
        // Clicking again takes it back out.
        for (const input of list.querySelectorAll("input[type=hidden]")) {
          if (input.value === button.dataset.url) input.closest(".img-gallery__item").remove();
        }
        changed();
      } else if (addUrl(button.dataset.url)) {
        setStatus("");
      }
    });

    list.querySelectorAll("img").forEach(watchBroken);
  }

  document.querySelectorAll(".img-gallery").forEach(init);
})();
