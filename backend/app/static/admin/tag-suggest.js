// The admin's tags box (ProjectTagsField in app/admin.py): suggests the tags other projects use.
// sqladmin's main.js starts Select2 on it; this restarts it once the page has loaded (the edit page loads
// field scripts before main.js, the create page after) so that:
//  - Enter picks the best matching existing tag, not the text typed so far ("re" -> React.js);
//  - typing an existing tag in another case ("python") picks it instead of adding a duplicate;
//  - tags stay in the order they were added, which is the order the site shows them.
(() => {
  "use strict";

  function setup() {
    const $ = window.jQuery;
    if (!$ || !$.fn.select2) return;
    $("select[data-tag-suggest]").each(function () {
      const select = this;
      const $select = $(select);
      if ($select.data("select2")) $select.select2("destroy");
      let term = ""; // Select2 hands the sorter only the results, so the matcher keeps the search text
      $select.select2({
        tags: true,
        multiple: true,
        // Tags already on the project are hidden (Enter on one would take it off).
        matcher(params, data) {
          term = (params.term || "").trim().toLocaleLowerCase();
          if (data.element?.selected) return null;
          return !term || data.text.toLocaleLowerCase().includes(term) ? data : null;
        },
        // Tags starting with the text first, then ones with a word starting with it, then the rest.
        sorter(results) {
          const rank = item => {
            if (item.newTag) return 3;
            const text = item.text.toLocaleLowerCase();
            const at = text.indexOf(term);
            return at === 0 ? 0 : /[\s.\-_/#+(]/.test(text[at - 1]) ? 1 : 2;
          };
          return term ? [...results].sort((a, b) => rank(a) - rank(b)) : results;
        },
        createTag(params) {
          const term = params.term.trim();
          if (!term) return null;
          const lower = term.toLocaleLowerCase();
          if ([...select.options].some(o => o.value.toLocaleLowerCase() === lower)) return null;
          return { id: term, text: term, newTag: true };
        },
        // New tag last, so the highlighted (Enter) result is an existing tag when one matches.
        insertTag(data, tag) {
          data.push(tag);
        },
        templateResult(item) {
          return item.newTag ? $("<span>").text(`Add "${item.text}"`) : item.text;
        },
      });
      // Selections follow the options' order: move a picked tag to the end so it lands after the others.
      $select.on("select2:select", e => {
        const option = e.params.data.element;
        if (option && option !== select.lastElementChild) {
          select.append(option);
          $select.trigger("change.select2");
        }
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup);
  else setup();
})();
