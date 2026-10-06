// Specimen and group pages (inlined by site/build.mjs). No requests until the visitor asks for one.
(() => {
  // ?from=ig|yt|x names the platform the visitor came from. It becomes the affiliate sub-ID
  // p-{platform}-e{episode} (the page ships with p-web-e{episode}) and follows hub links, so the
  // platform is still known one page later. It identifies a platform, never a person.
  const from = new URLSearchParams(location.search).get("from");
  if (/^(ig|yt|x)$/.test(from || "")) {
    for (const a of document.querySelectorAll("a[data-subid]")) {
      const u = new URL(a.href);
      u.searchParams.set(a.dataset.subid, `p-${from}-e${a.dataset.ep}`);
      a.href = u.href;
    }
    for (const a of document.querySelectorAll("a[data-keep]")) {
      const u = new URL(a.getAttribute("href"), location.href);
      u.searchParams.set("from", from);
      a.href = u.pathname + u.search;
    }
  }

  // The Short is a poster until it is clicked; only then does the YouTube player load.
  const s = document.querySelector("a.short[data-yt]");
  if (s) {
    s.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      e.preventDefault();
      const f = document.createElement("iframe");
      f.src = `https://www.youtube-nocookie.com/embed/${s.dataset.yt}?autoplay=1&playsinline=1&rel=0`;
      f.title = s.dataset.title;
      f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      f.allowFullscreen = true;
      const box = document.createElement("div");
      box.className = "short";
      box.append(f);
      s.replaceWith(box);
      f.focus();
    });
  }
})();
