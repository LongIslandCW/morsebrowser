"use strict";
(self["webpackChunk"] = self["webpackChunk"] || []).push([["src_morse_morseRssPlugin_js"],{

/***/ "./src/morse/morseRssPlugin.js":
/*!*************************************!*\
  !*** ./src/morse/morseRssPlugin.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ MorseRssPlugin)
/* harmony export */ });
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var MorseRssPlugin = /*#__PURE__*/_createClass(function MorseRssPlugin() {
  _classCallCheck(this, MorseRssPlugin);
});

_defineProperty(MorseRssPlugin, "addRssFeatures", function (ko, ctxt) {
  ctxt.rssFeedUrl = ko.observable('https://moxie.foxnews.com/feedburner/latest.xml').extend({
    saveCookie: 'rssFeedUrl'
  });
  ctxt.proxydUrl = ko.observable('http://127.0.0.1:8085/').extend({
    saveCookie: 'proxydUrl'
  });
  ctxt.rssPlayMins = ko.observable(5).extend({
    saveCookie: 'rssPlayMins'
  });
  ctxt.rssPollMins = ko.observable(5).extend({
    saveCookie: 'rssPollMins'
  });
  ctxt.rssCookieWhiteList = ['rssFeedUrl', 'proxydUrl', 'rssPlayMins', 'rssPollMins'];
  ctxt.rssTitlesQueue = ko.observableArray();
  ctxt.rssPlayOn = ko.observable(false);
  ctxt.lastRSSPoll = ko.observable(new Date(1900, 0, 0));
  ctxt.rssPlayTimerHandle = null;
  ctxt.rssPollTimerHandle = null;
  ctxt.rssMinsToWait = ko.observable(-1);
  ctxt.rssPollMinsToWait = ko.observable(-1);
  ctxt.rssPollingOn = ko.observable(false);
  ctxt.rssPolling = ko.observable(false);
  ctxt.rssPlayWaitingBadgeText = ko.observable(true);
  ctxt.unreadRssCount = ko.computed(function () {
    var unread = ctxt.rssTitlesQueue().filter(function (x) {
      return !x.played;
    }); // console.log("unread:");
    // console.log(unread);

    return !unread ? 0 : unread.length;
  }, ctxt);
  ctxt.playRssButtonText = ko.computed(function () {
    var minsToWait = ctxt.rssMinsToWait();
    var waitingText = '';

    if (minsToWait > 0 && ctxt.rssPlayOn()) {
      waitingText = ' Waiting ';

      if (minsToWait > 1) {
        waitingText += Math.round(minsToWait).toString() + ' min';
      } else {
        waitingText += Math.round(60 * minsToWait).toString() + ' sec';
      }
    } // help the badge


    console.log(waitingText);
    ctxt.rssPlayWaitingBadgeText(waitingText);
    return (ctxt.rssPlayOn() ? 'Stop' : 'Play') + ' RSS (' + ctxt.unreadRssCount() + ')' + waitingText;
  }, ctxt);
  ctxt.pollRssButtonText = ko.computed(function () {
    var minsToWait = ctxt.rssPollMinsToWait();
    var waitingText = '';

    if (minsToWait > 0 && ctxt.rssPollingOn()) {
      waitingText = ' Waiting ';

      if (minsToWait > 1) {
        waitingText += Math.round(minsToWait).toString() + ' min';
      } else {
        waitingText += Math.round(60 * minsToWait).toString() + ' sec';
      }
    }

    return (ctxt.rssPollingOn() ? 'Polling' : 'Poll') + ' RSS' + waitingText;
  }, ctxt);

  ctxt.rssPlayCallback = function (ignoreWait) {
    if (ctxt.rssPlayOn()) {
      var msSince = Date.now() - ctxt.lastFullPlayTime();
      var minSince = msSince / 1000 / 60;
      var enoughWait = minSince > ctxt.rssPlayMins();

      if (!ctxt.playerPlaying()) {
        if (enoughWait || ignoreWait) {
          ctxt.rssMinsToWait(-1);

          if (ctxt.unreadRssCount() > 0) {
            var target = ctxt.rssTitlesQueue().find(function (x) {
              return !x.played;
            });
            var replacement = {
              title: target.title,
              played: true
            };
            ctxt.rssTitlesQueue.replace(target, replacement);
            ctxt.setText(target.title);
            ctxt.fullRewind();
            ctxt.doPlay();
          }
        } else {
          ctxt.rssMinsToWait(ctxt.rssPlayMins() - minSince);
        }
      }

      ctxt.rssPlayTimerHandle = setTimeout(ctxt.rssPlayCallback, 20 * 1000);
    }
  };

  ctxt.doRSSReset = function () {
    ctxt.rssTitlesQueue(ctxt.rssTitlesQueue().map(function (x) {
      x.played = true;
      return x;
    }));
  };

  ctxt.doRssPlay = function () {
    ctxt.rssPlayOn(!ctxt.rssPlayOn());

    if (ctxt.rssPlayOn()) {
      ctxt.rssPlayCallback(true);
    } else {
      if (ctxt.rssPlayTimerHandle) {
        clearTimeout(ctxt.rssPlayTimerHandle);
      }
    }

    document.getElementById('btnRssAccordionButton').click();
  };

  ctxt.doRSSCallback = function () {
    if (ctxt.rssPollingOn() && !ctxt.rssPolling()) {
      var msSince = Date.now() - ctxt.lastRSSPoll();
      var minSince = msSince / 1000 / 60;
      var enoughWait = minSince > ctxt.rssPollMins();

      if (enoughWait) {
        ctxt.rssPolling(true);
        ctxt.rssPollMinsToWait(-1); // https://github.com/rbren/rss-parser
        // ctxt helped resolve polyfill problems:
        // https://blog.alchemy.com/blog/how-to-polyfill-node-core-modules-in-webpack-5
        // note that the rss-parser module is loaded dynamically, so only if the
        // user actually goes ahead and uses RSS.

        Promise.all(/*! import() | rss-parser */[__webpack_require__.e("vendors-node_modules_rss-parser_index_js"), __webpack_require__.e("rss-parser")]).then(__webpack_require__.t.bind(__webpack_require__, /*! rss-parser */ "./node_modules/rss-parser/index.js", 23)).then(function (_ref) {
          var RSSParser = _ref["default"];
          var parser = new RSSParser(); // Note: some RSS feeds can't be loaded in the browser due to CORS security.
          // To get around ctxt, you can use a proxy.

          parser.parseURL(ctxt.proxydUrl() + ctxt.rssFeedUrl().toString(), function (err, feed) {
            if (err) {
              ctxt.lastRSSPoll(Date.now());
              alert('rss error');
              ctxt.rssPolling(false);
              throw err;
            } // console.log(feed.title);
            // note the reversal to get a fifo


            feed.items.reverse().forEach(function (entry) {
              // console.log(entry.title + ':' + entry.link);
              if (!ctxt.rssTitlesQueue().find(function (x) {
                return x.title === entry.title;
              })) {
                ctxt.rssTitlesQueue.push({
                  title: entry.title,
                  played: false
                });
              }
            });
            ctxt.lastRSSPoll(Date.now());
            ctxt.rssPollMinsToWait(ctxt.rssPollMins());
            ctxt.rssPolling(false);
          });
        });
      } else {
        ctxt.rssPollMinsToWait(ctxt.rssPollMins() - minSince);
      }
    }

    if (ctxt.rssPollingOn()) {
      ctxt.rssPollTimerHandle = setTimeout(ctxt.doRSSCallback, 15 * 1000);
    } else {
      if (ctxt.rssPollTimerHandle) {
        clearTimeout(ctxt.rssPollTimerHandle);
      }
    }
  };

  ctxt.doRSS = function () {
    ctxt.rssPollingOn(!ctxt.rssPollingOn());

    if (ctxt.rssPollingOn()) {
      ctxt.doRSSCallback();
    } else {
      if (ctxt.rssPollTimerHandle) {
        clearTimeout(ctxt.rssPollTimerHandle);
      }
    }
  };
});



/***/ })

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3JjX21vcnNlX21vcnNlUnNzUGx1Z2luX2pzYjQyODlmZjdiMDU0ZWRlMDAyNTguanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBQXFCQTs7OztnQkFBQUEsa0NBQ0ssVUFBQ0MsRUFBRCxFQUFLQyxJQUFMLEVBQWM7RUFDcENBLElBQUksQ0FBQ0MsVUFBTCxHQUFrQkYsRUFBRSxDQUFDRyxVQUFILENBQWMsaURBQWQsRUFBaUVDLE1BQWpFLENBQXdFO0lBQUVDLFVBQVUsRUFBRTtFQUFkLENBQXhFLENBQWxCO0VBQ0FKLElBQUksQ0FBQ0ssU0FBTCxHQUFpQk4sRUFBRSxDQUFDRyxVQUFILENBQWMsd0JBQWQsRUFBd0NDLE1BQXhDLENBQStDO0lBQUVDLFVBQVUsRUFBRTtFQUFkLENBQS9DLENBQWpCO0VBQ0FKLElBQUksQ0FBQ00sV0FBTCxHQUFtQlAsRUFBRSxDQUFDRyxVQUFILENBQWMsQ0FBZCxFQUFpQkMsTUFBakIsQ0FBd0I7SUFBRUMsVUFBVSxFQUFFO0VBQWQsQ0FBeEIsQ0FBbkI7RUFDQUosSUFBSSxDQUFDTyxXQUFMLEdBQW1CUixFQUFFLENBQUNHLFVBQUgsQ0FBYyxDQUFkLEVBQWlCQyxNQUFqQixDQUF3QjtJQUFFQyxVQUFVLEVBQUU7RUFBZCxDQUF4QixDQUFuQjtFQUNBSixJQUFJLENBQUNRLGtCQUFMLEdBQTBCLENBQUMsWUFBRCxFQUFlLFdBQWYsRUFBNEIsYUFBNUIsRUFBMkMsYUFBM0MsQ0FBMUI7RUFDQVIsSUFBSSxDQUFDUyxjQUFMLEdBQXNCVixFQUFFLENBQUNXLGVBQUgsRUFBdEI7RUFDQVYsSUFBSSxDQUFDVyxTQUFMLEdBQWlCWixFQUFFLENBQUNHLFVBQUgsQ0FBYyxLQUFkLENBQWpCO0VBQ0FGLElBQUksQ0FBQ1ksV0FBTCxHQUFtQmIsRUFBRSxDQUFDRyxVQUFILENBQWMsSUFBSVcsSUFBSixDQUFTLElBQVQsRUFBZSxDQUFmLEVBQWtCLENBQWxCLENBQWQsQ0FBbkI7RUFDQWIsSUFBSSxDQUFDYyxr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S0FBZjtrQkFBc0J0QixNQUFNLEVBQUU7Z0JBQTlCLENBQXpCO2NBQ0Q7WUFDRixDQUxEO1lBTUExQixJQUFJLENBQUNZLFdBQUwsQ0FBaUJDLElBQUksQ0FBQzJCLEdBQUwsRUFBakI7WUFDQXhDLElBQUksQ0FBQ2lCLGlCQUFMLENBQXVCakIsSUFBSSxDQUFDTyxXQUFMLEVBQXZCO1lBQ0FQLElBQUksQ0FBQ21CLFVBQUwsQ0FBZ0IsS0FBaEI7VUFDRCxDQWxCRDtRQW1CRCxDQXZCRDtNQXdCRCxDQWhDRCxNQWdDTztRQUNMbkIsSUFBSSxDQUFDaUIsaUJBQUwsQ0FBdUJqQixJQUFJLENBQUNPLFdBQUwsS0FBcUJtQyxRQUE1QztNQUNEO0lBQ0Y7O0lBRUQsSUFBSTFDLElBQUksQ0FBQ2tCLFlBQUwsRUFBSixFQUF5QjtNQUN2QmxCLElBQUksQ0FBQ2Usa0JBQUwsR0FBMEJzQyxVQUFVLENBQUNyRCxJQUFJLENBQUM2RCxhQUFOLEVBQXFCLEtBQUssSUFBMUIsQ0FBcEM7SUFDRCxDQUZELE1BRU87TUFDTCxJQUFJN0QsSUFBSSxDQUFDZSxrQkFBVCxFQUE2QjtRQUMzQjBDLFlBQVksQ0FBQ3pELElBQUksQ0FBQ2Usa0JBQU4sQ0FBWjtNQUNEO0lBQ0Y7RUFDRixDQWpERDs7RUFtREFmLElBQUksQ0FBQzBFLEtBQUwsR0FBYSxZQUFNO0lBQ2pCMUUsSUFBSSxDQUFDa0IsWUFBTCxDQUFrQixDQUFDbEIsSUFBSSxDQUFDa0IsWUFBTCxFQUFuQjs7SUFDQSxJQUFJbEIsSUFBSSxDQUFDa0IsWUFBTCxFQUFKLEVBQXlCO01BQ3ZCbEIsSUFBSSxDQUFDNkQsYUFBTDtJQUNELENBRkQsTUFFTztNQUNMLElBQUk3RCxJQUFJLENBQUNlLGtCQUFULEVBQTZCO1FBQzNCMEMsWUFBWSxDQUFDekQsSUFBSSxDQUFDZSxrQkFBTixDQUFaO01BQ0Q7SUFDRjtFQUNGLENBVEQ7QUFVRCIsInNvdXJjZXMiOlsid2VicGFjazovLy8uL3NyYy9tb3JzZS9tb3JzZVJzc1BsdWdpbi5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZGVmYXVsdCBjbGFzcyBNb3JzZVJzc1BsdWdpbiB7XG4gIHN0YXRpYyBhZGRSc3NGZWF0dXJlcyA9IChrbywgY3R4dCkgPT4ge1xuICAgIGN0eHQucnNzRmVlZFVybCA9IGtvLm9ic2VydmFibGUoJ2h0dHBzOi8vbW94aWUuZm94bmV3cy5jb20vZmVlZGJ1cm5lci9sYXRlc3QueG1sJykuZXh0ZW5kKHsgc2F2ZUNvb2tpZTogJ3Jzc0ZlZWRVcmwnIH0pXG4gICAgY3R4dC5wcm94eWRVcmwgPSBrby5vYnNlcnZhYmxlKCdodHRwOi8vMTI3LjAuMC4xOjgwODUvJykuZXh0ZW5kKHsgc2F2ZUNvb2tpZTogJ3Byb3h5ZFVybCcgfSlcbiAgICBjdHh0LnJzc1BsYXlNaW5zID0ga28ub2JzZXJ2YWJsZSg1KS5leHRlbmQoeyBzYXZlQ29va2llOiAncnNzUGxheU1pbnMnIH0pXG4gICAgY3R4dC5yc3NQb2xsTWlucyA9IGtvLm9ic2VydmFibGUoNSkuZXh0ZW5kKHsgc2F2ZUNvb2tpZTogJ3Jzc1BvbGxNaW5zJyB9KVxuICAgIGN0eHQucnNzQ29va2llV2hpdGVMaXN0ID0gWydyc3NGZWVkVXJsJywgJ3Byb3h5ZFVybCcsICdyc3NQbGF5TWlucycsICdyc3NQb2xsTWlucyddXG4gICAgY3R4dC5yc3NUaXRsZXNRdWV1ZSA9IGtvLm9ic2VydmFibGVBcnJheSgpXG4gICAgY3R4dC5yc3NQbGF5T24gPSBrby5vYnNlcnZhYmxlKGZhbHNlKVxuICAgIGN0eHQubGFzdFJTU1BvbGwgPSBrby5vYnNlcnZhYmxlKG5ldyBEYXRlKDE5MDAsIDAsIDApKVxuICAgIGN0eHQucnNzUGxheVRpbWVySGFuZGxlID0gbnVsbFxuICAgIGN0eHQucnNzUG9sbFRpbWVySGFuZGxlID0gbnVsbFxuICAgIGN0eHQucnNzTWluc1RvV2FpdCA9IGtvLm9ic2VydmFibGUoLTEpXG4gICAgY3R4dC5yc3NQb2xsTWluc1RvV2FpdCA9IGtvLm9ic2VydmFibGUoLTEpXG4gICAgY3R4dC5yc3NQb2xsaW5nT24gPSBrby5vYnNlcnZhYmxlKGZhbHNlKVxuICAgIGN0eHQucnNzUG9sbGluZyA9IGtvLm9ic2VydmFibGUoZmFsc2UpXG4gICAgY3R4dC5yc3NQbGF5V2FpdGluZ0JhZGdlVGV4dCA9IGtvLm9ic2VydmFibGUodHJ1ZSlcblxuICAgIGN0eHQudW5yZWFkUnNzQ291bnQgPSBrby5jb21wdXRlZCgoKSA9PiB7XG4gICAgICBjb25zdCB1bnJlYWQgPSBjdHh0LnJzc1RpdGxlc1F1ZXVlKCkuZmlsdGVyKHggPT4gIXgucGxheWVkKVxuICAgICAgLy8gY29uc29sZS5sb2coXCJ1bnJlYWQ6XCIpO1xuICAgICAgLy8gY29uc29sZS5sb2codW5yZWFkKTtcbiAgICAgIHJldHVybiAhdW5yZWFkID8gMCA6IHVucmVhZC5sZW5ndGhcbiAgICB9LCBjdHh0KVxuXG4gICAgY3R4dC5wbGF5UnNzQnV0dG9uVGV4dCA9IGtvLmNvbXB1dGVkKCgpID0+IHtcbiAgICAgIGNvbnN0IG1pbnNUb1dhaXQgPSBjdHh0LnJzc01pbnNUb1dhaXQoKVxuICAgICAgbGV0IHdhaXRpbmdUZXh0ID0gJydcbiAgICAgIGlmIChtaW5zVG9XYWl0ID4gMCAmJiBjdHh0LnJzc1BsYXlPbigpKSB7XG4gICAgICAgIHdhaXRpbmdUZXh0ID0gJyBXYWl0aW5nICdcbiAgICAgICAgaWYgKG1pbnNUb1dhaXQgPiAxKSB7XG4gICAgICAgICAgd2FpdGluZ1RleHQgKz0gTWF0aC5yb3VuZChtaW5zVG9XYWl0KS50b1N0cmluZygpICsgJyBtaW4nXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgd2FpdGluZ1RleHQgKz0gTWF0aC5yb3VuZCg2MCAqIG1pbnNUb1dhaXQpLnRvU3RyaW5nKCkgKyAnIHNlYydcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gaGVscCB0aGUgYmFkZ2VcbiAgICAgIGNvbnNvbGUubG9nKHdhaXRpbmdUZXh0KVxuICAgICAgY3R4dC5yc3NQbGF5V2FpdGluZ0JhZGdlVGV4dCh3YWl0aW5nVGV4dClcbiAgICAgIHJldHVybiAoY3R4dC5yc3NQbGF5T24oKSA/ICdTdG9wJyA6ICdQbGF5JykgKyAnIFJTUyAoJyArIGN0eHQudW5yZWFkUnNzQ291bnQoKSArICcpJyArIHdhaXRpbmdUZXh0XG4gICAgfSwgY3R4dClcblxuICAgIGN0eHQucG9sbFJzc0J1dHRvblRleHQgPSBrby5jb21wdXRlZCgoKSA9PiB7XG4gICAgICBjb25zdCBtaW5zVG9XYWl0ID0gY3R4dC5yc3NQb2xsTWluc1RvV2FpdCgpXG4gICAgICBsZXQgd2FpdGluZ1RleHQgPSAnJ1xuICAgICAgaWYgKG1pbnNUb1dhaXQgPiAwICYmIGN0eHQucnNzUG9sbGluZ09uKCkpIHtcbiAgICAgICAgd2FpdGluZ1RleHQgPSAnIFdhaXRpbmcgJ1xuICAgICAgICBpZiAobWluc1RvV2FpdCA+IDEpIHtcbiAgICAgICAgICB3YWl0aW5nVGV4dCArPSBNYXRoLnJvdW5kKG1pbnNUb1dhaXQpLnRvU3RyaW5nKCkgKyAnIG1pbidcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB3YWl0aW5nVGV4dCArPSBNYXRoLnJvdW5kKDYwICogbWluc1RvV2FpdCkudG9TdHJpbmcoKSArICcgc2VjJ1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gKGN0eHQucnNzUG9sbGluZ09uKCkgPyAnUG9sbGluZycgOiAnUG9sbCcpICsgJyBSU1MnICsgd2FpdGluZ1RleHRcbiAgICB9LCBjdHh0KVxuXG4gICAgY3R4dC5yc3NQbGF5Q2FsbGJhY2sgPSAoaWdub3JlV2FpdCkgPT4ge1xuICAgICAgaWYgKGN0eHQucnNzUGxheU9uKCkpIHtcbiAgICAgICAgY29uc3QgbXNTaW5jZSA9IERhdGUubm93KCkgLSBjdHh0Lmxhc3RGdWxsUGxheVRpbWUoKVxuICAgICAgICBjb25zdCBtaW5TaW5jZSA9IG1zU2luY2UgLyAxMDAwIC8gNjBcbiAgICAgICAgY29uc3QgZW5vdWdoV2FpdCA9IChtaW5TaW5jZSA+IGN0eHQucnNzUGxheU1pbnMoKSlcbiAgICAgICAgaWYgKCFjdHh0LnBsYXllclBsYXlpbmcoKSkge1xuICAgICAgICAgIGlmIChlbm91Z2hXYWl0IHx8IGlnbm9yZVdhaXQpIHtcbiAgICAgICAgICAgIGN0eHQucnNzTWluc1RvV2FpdCgtMSlcbiAgICAgICAgICAgIGlmIChjdHh0LnVucmVhZFJzc0NvdW50KCkgPiAwKSB7XG4gICAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IGN0eHQucnNzVGl0bGVzUXVldWUoKS5maW5kKHggPT4gIXgucGxheWVkKVxuICAgICAgICAgICAgICBjb25zdCByZXBsYWNlbWVudCA9IHsgdGl0bGU6IHRhcmdldC50aXRsZSwgcGxheWVkOiB0cnVlIH1cbiAgICAgICAgICAgICAgY3R4dC5yc3NUaXRsZXNRdWV1ZS5yZXBsYWNlKHRhcmdldCwgcmVwbGFjZW1lbnQpXG5cbiAgICAgICAgICAgICAgY3R4dC5zZXRUZXh0KHRhcmdldC50aXRsZSlcbiAgICAgICAgICAgICAgY3R4dC5mdWxsUmV3aW5kKClcbiAgICAgICAgICAgICAgY3R4dC5kb1BsYXkoKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjdHh0LnJzc01pbnNUb1dhaXQoY3R4dC5yc3NQbGF5TWlucygpIC0gbWluU2luY2UpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGN0eHQucnNzUGxheVRpbWVySGFuZGxlID0gc2V0VGltZW91dChjdHh0LnJzc1BsYXlDYWxsYmFjaywgMjAgKiAxMDAwKVxuICAgICAgfVxuICAgIH1cblxuICAgIGN0eHQuZG9SU1NSZXNldCA9ICgpID0+IHtcbiAgICAgIGN0eHQucnNzVGl0bGVzUXVldWUoY3R4dC5yc3NUaXRsZXNRdWV1ZSgpLm1hcCh4ID0+IHtcbiAgICAgICAgeC5wbGF5ZWQgPSB0cnVlXG4gICAgICAgIHJldHVybiB4XG4gICAgICB9KSlcbiAgICB9XG5cbiAgICBjdHh0LmRvUnNzUGxheSA9ICgpID0+IHtcbiAgICAgIGN0eHQucnNzUGxheU9uKCFjdHh0LnJzc1BsYXlPbigpKVxuICAgICAgaWYgKGN0eHQucnNzUGxheU9uKCkpIHtcbiAgICAgICAgY3R4dC5yc3NQbGF5Q2FsbGJhY2sodHJ1ZSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChjdHh0LnJzc1BsYXlUaW1lckhhbmRsZSkge1xuICAgICAgICAgIGNsZWFyVGltZW91dChjdHh0LnJzc1BsYXlUaW1lckhhbmRsZSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0blJzc0FjY29yZGlvbkJ1dHRvbicpLmNsaWNrKClcbiAgICB9XG5cbiAgICBjdHh0LmRvUlNTQ2FsbGJhY2sgPSAoKSA9PiB7XG4gICAgICBpZiAoY3R4dC5yc3NQb2xsaW5nT24oKSAmJiAhY3R4dC5yc3NQb2xsaW5nKCkpIHtcbiAgICAgICAgY29uc3QgbXNTaW5jZSA9IERhdGUubm93KCkgLSBjdHh0Lmxhc3RSU1NQb2xsKClcbiAgICAgICAgY29uc3QgbWluU2luY2UgPSBtc1NpbmNlIC8gMTAwMCAvIDYwXG4gICAgICAgIGNvbnN0IGVub3VnaFdhaXQgPSAobWluU2luY2UgPiBjdHh0LnJzc1BvbGxNaW5zKCkpXG4gICAgICAgIGlmIChlbm91Z2hXYWl0KSB7XG4gICAgICAgICAgY3R4dC5yc3NQb2xsaW5nKHRydWUpXG4gICAgICAgICAgY3R4dC5yc3NQb2xsTWluc1RvV2FpdCgtMSlcbiAgICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vcmJyZW4vcnNzLXBhcnNlclxuICAgICAgICAgIC8vIGN0eHQgaGVscGVkIHJlc29sdmUgcG9seWZpbGwgcHJvYmxlbXM6XG4gICAgICAgICAgLy8gaHR0cHM6Ly9ibG9nLmFsY2hlbXkuY29tL2Jsb2cvaG93LXRvLXBvbHlmaWxsLW5vZGUtY29yZS1tb2R1bGVzLWluLXdlYnBhY2stNVxuICAgICAgICAgIC8vIG5vdGUgdGhhdCB0aGUgcnNzLXBhcnNlciBtb2R1bGUgaXMgbG9hZGVkIGR5bmFtaWNhbGx5LCBzbyBvbmx5IGlmIHRoZVxuICAgICAgICAgIC8vIHVzZXIgYWN0dWFsbHkgZ29lcyBhaGVhZCBhbmQgdXNlcyBSU1MuXG4gICAgICAgICAgaW1wb3J0KC8qIHdlYnBhY2tDaHVua05hbWU6IFwicnNzLXBhcnNlclwiICovICdyc3MtcGFyc2VyJykudGhlbigoeyBkZWZhdWx0OiBSU1NQYXJzZXIgfSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGFyc2VyID0gbmV3IFJTU1BhcnNlcigpXG4gICAgICAgICAgICAvLyBOb3RlOiBzb21lIFJTUyBmZWVkcyBjYW4ndCBiZSBsb2FkZWQgaW4gdGhlIGJyb3dzZXIgZHVlIHRvIENPUlMgc2VjdXJpdHkuXG4gICAgICAgICAgICAvLyBUbyBnZXQgYXJvdW5kIGN0eHQsIHlvdSBjYW4gdXNlIGEgcHJveHkuXG4gICAgICAgICAgICBwYXJzZXIucGFyc2VVUkwoY3R4dC5wcm94eWRVcmwoKSArIGN0eHQucnNzRmVlZFVybCgpLnRvU3RyaW5nKCksIChlcnIsIGZlZWQpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGN0eHQubGFzdFJTU1BvbGwoRGF0ZS5ub3coKSlcbiAgICAgICAgICAgICAgICBhbGVydCgncnNzIGVycm9yJylcbiAgICAgICAgICAgICAgICBjdHh0LnJzc1BvbGxpbmcoZmFsc2UpXG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coZmVlZC50aXRsZSk7XG4gICAgICAgICAgICAgIC8vIG5vdGUgdGhlIHJldmVyc2FsIHRvIGdldCBhIGZpZm9cbiAgICAgICAgICAgICAgZmVlZC5pdGVtcy5yZXZlcnNlKCkuZm9yRWFjaCgoZW50cnkpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhlbnRyeS50aXRsZSArICc6JyArIGVudHJ5LmxpbmspO1xuICAgICAgICAgICAgICAgIGlmICghY3R4dC5yc3NUaXRsZXNRdWV1ZSgpLmZpbmQoeCA9PiB4LnRpdGxlID09PSBlbnRyeS50aXRsZSkpIHtcbiAgICAgICAgICAgICAgICAgIGN0eHQucnNzVGl0bGVzUXVldWUucHVzaCh7IHRpdGxlOiBlbnRyeS50aXRsZSwgcGxheWVkOiBmYWxzZSB9KVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgY3R4dC5sYXN0UlNTUG9sbChEYXRlLm5vdygpKVxuICAgICAgICAgICAgICBjdHh0LnJzc1BvbGxNaW5zVG9XYWl0KGN0eHQucnNzUG9sbE1pbnMoKSlcbiAgICAgICAgICAgICAgY3R4dC5yc3NQb2xsaW5nKGZhbHNlKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGN0eHQucnNzUG9sbE1pbnNUb1dhaXQoY3R4dC5yc3NQb2xsTWlucygpIC0gbWluU2luY2UpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGN0eHQucnNzUG9sbGluZ09uKCkpIHtcbiAgICAgICAgY3R4dC5yc3NQb2xsVGltZXJIYW5kbGUgPSBzZXRUaW1lb3V0KGN0eHQuZG9SU1NDYWxsYmFjaywgMTUgKiAxMDAwKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGN0eHQucnNzUG9sbFRpbWVySGFuZGxlKSB7XG4gICAgICAgICAgY2xlYXJUaW1lb3V0KGN0eHQucnNzUG9sbFRpbWVySGFuZGxlKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgY3R4dC5kb1JTUyA9ICgpID0+IHtcbiAgICAgIGN0eHQucnNzUG9sbGluZ09uKCFjdHh0LnJzc1BvbGxpbmdPbigpKVxuICAgICAgaWYgKGN0eHQucnNzUG9sbGluZ09uKCkpIHtcbiAgICAgICAgY3R4dC5kb1JTU0NhbGxiYWNrKClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChjdHh0LnJzc1BvbGxUaW1lckhhbmRsZSkge1xuICAgICAgICAgIGNsZWFyVGltZW91dChjdHh0LnJzc1BvbGxUaW1lckhhbmRsZSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIl0sIm5hbWVzIjpbIk1vcnNlUnNzUGx1Z2luIiwia28iLCJjdHh0IiwicnNzRmVlZFVybCIsIm9ic2VydmFibGUiLCJleHRlbmQiLCJzYXZlQ29va2llIiwicHJveHlkVXJsIiwicnNzUGxheU1pbnMiLCJyc3NQb2xsTWlucyIsInJzc0Nvb2tpZVdoaXRlTGlzdCIsInJzc1RpdGxlc1F1ZXVlIiwib2JzZXJ2YWJsZUFycmF5IiwicnNzUGxheU9uIiwibGFzdFJTU1BvbGwiLCJEYXRlIiwicnNzUGxheVRpbWVySGFuZGxlIiwicnNzUG9sbFRpbWVySGFuZGxlIiwicnNzTWluc1RvV2FpdCIsInJzc1BvbGxNaW5zVG9XYWl0IiwicnNzUG9sbGluZ09uIiwicnNzUG9sbGluZyIsInJzc1BsYXlXYWl0aW5nQmFkZ2VUZXh0IiwidW5yZWFkUnNzQ291bnQiLCJjb21wdXRlZCIsInVucmVhZCIsImZpbHRlciIsIngiLCJwbGF5ZWQiLCJsZW5ndGgiLCJwbGF5UnNzQnV0dG9uVGV4dCIsIm1pbnNUb1dhaXQiLCJ3YWl0aW5nVGV4dCIsIk1hdGgiLCJyb3VuZCIsInRvU3RyaW5nIiwiY29uc29sZSIsImxvZyIsInBvbGxSc3NCdXR0b25UZXh0IiwicnNzUGxheUNhbGxiYWNrIiwiaWdub3JlV2FpdCIsIm1zU2luY2UiLCJub3ciLCJsYXN0RnVsbFBsYXlUaW1lIiwibWluU2luY2UiLCJlbm91Z2hXYWl0IiwicGxheWVyUGxheWluZyIsInRhcmdldCIsImZpbmQiLCJyZXBsYWNlbWVudCIsInRpdGxlIiwicmVwbGFjZSIsInNldFRleHQiLCJmdWxsUmV3aW5kIiwiZG9QbGF5Iiwic2V0VGltZW91dCIsImRvUlNTUmVzZXQiLCJtYXAiLCJkb1Jzc1BsYXkiLCJjbGVhclRpbWVvdXQiLCJkb2N1bWVudCIsImdldEVsZW1lbnRCeUlkIiwiY2xpY2siLCJkb1JTU0NhbGxiYWNrIiwidGhlbiIsIlJTU1BhcnNlciIsInBhcnNlciIsInBhcnNlVVJMIiwiZXJyIiwiZmVlZCIsImFsZXJ0IiwiaXRlbXMiLCJyZXZlcnNlIiwiZm9yRWFjaCIsImVudHJ5IiwicHVzaCIsImRvUlNTIl0sInNvdXJjZVJvb3QiOiIifQ==