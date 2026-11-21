'use strict';

(function(){
  const iconArrowSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"><defs><mask id="mpar-m1" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff"/><path d="M1 15L7.5 10L14 15V23H1Z" fill="#000" stroke="#000" stroke-width="3.2"/><path d="M5 10.5L11.5 5.5L18 10.5V18.5H5Z" fill="#000" stroke="#000" stroke-width="3.2"/></mask><mask id="mpar-m2" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff"/><path d="M1 15L7.5 10L14 15V23H1Z" fill="#000" stroke="#000" stroke-width="3.2"/></mask></defs><g mask="url(#mpar-m1)"><path d="M9 6L15.5 1L22 6V14H9Z M9 6L15.5 10.5L22 6"/></g><g mask="url(#mpar-m2)"><path d="M5 10.5L11.5 5.5L18 10.5V18.5H5Z M5 10.5L11.5 15.0L18 10.5"/></g><path d="M1 15L7.5 10L14 15V23H1Z M1 15L7.5 19.5L14 15"/></svg>';
  const iconCheckSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" /></svg>';

  function getConfig (key) {
    return context.extensions?.MarkPreviousAsRead?.[key];
  }

  function t (key) {
    return getConfig('i18n')?.[key];
  }

  const createMarkPreviousAsReadItem = function (flux, fluxName, tagName) {
    let wrapper = document.createElement(tagName ?? 'li');
    let a = document.createElement('a');

    a.innerHTML = iconArrowSvg;
    a.title = t('markAllPreviousAsRead');
    a.setAttribute('aria-label', t('markAllPreviousAsRead'));
    a.setAttribute('href', '#');
    a.addEventListener('click', (e) => {
      e.preventDefault();

      if (getConfig('enable_warning_popup')) {
        const warning = getConfig('apply_only_to_same_feed_entries')
          ? t('warningSameFeed').replace('{0}', fluxName ?? t('theSameFeed'))
          : t('warning')
        if (!confirm(warning)) {
          return;
        }
      }

      markPreviousSameFeedAsRead(flux, flux.dataset.feed);

      return false;
    });

    wrapper.appendChild(a);
    wrapper.classList.add('item', 'mark-previous-as-read');

    return wrapper;
  }

  const addButtonToEachUnprocessedEntry = function () {
    document.querySelectorAll('.flux').forEach(flux => {
      const fluxName = flux.querySelector('.websiteName')?.textContent;

      // Button next to the date, at the top of the post (single article view).
      const subtitle = flux.querySelector('.flux_content header .subtitle:not(.mark-previous-as-read-processed)');
      if (subtitle) {
        subtitle.appendChild(createMarkPreviousAsReadItem(flux, fluxName, 'span'));
        subtitle.classList.add('mark-previous-as-read-processed');
      }

      // Button at the bottom of the entry.
      const footerList = flux.querySelector('footer > ul:not(.mark-previous-as-read-processed)');
      if (footerList) {
        footerList.appendChild(createMarkPreviousAsReadItem(flux, fluxName, 'li'));
        footerList.classList.add('mark-previous-as-read-processed');
      }
    });
  }

  const init = function () {
    setTimeout(function () {
      addButtonToEachUnprocessedEntry();

      // Add button to new entries when scrolling down and more content is loaded dynamically.
      document.addEventListener('freshrss:load-more', function () {
        addButtonToEachUnprocessedEntry();
      });
    }, 500);
  };

  const markPreviousSameFeedAsRead = function (div, feedId) {
    let count = 0;
    const initialDivLinks = div.querySelectorAll('.mark-previous-as-read a');
    const idAsString = String(feedId);
    while (div) {
      if (!getConfig('apply_only_to_same_feed_entries')) {
        if (Array.from(div.classList).includes('not_read')) {
          mark_read(div, true, true);
          count++;
        }
      } else {
        if (div.dataset.feed === idAsString) {
          if (Array.from(div.classList).includes('not_read')) {
            mark_read(div, true, true);
            count++;
          }
        }
      }

      initialDivLinks.forEach(initialDivLink => {
        const doneText = t('markedEntriesAsRead').replace('{0}', count);
        initialDivLink.innerHTML = iconCheckSvg;
        initialDivLink.title = doneText;
        initialDivLink.setAttribute('aria-label', doneText);

        // Reset link content after 2 seconds.
        setTimeout(function () {
          initialDivLink.innerHTML = iconArrowSvg;
          initialDivLink.title = t('markAllPreviousAsRead');
          initialDivLink.setAttribute('aria-label', t('markAllPreviousAsRead'));
        }, 2000);
      });

      div = div.previousElementSibling;
    }
  };

  if (document.readyState && document.readyState !== 'loading') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', async () => init(), false);
  }
})();
