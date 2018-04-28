(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.horsey = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

var _hashSum = require('hash-sum');

var _hashSum2 = _interopRequireDefault(_hashSum);

var _sell = require('sell');

var _sell2 = _interopRequireDefault(_sell);

var _sektor = require('sektor');

var _sektor2 = _interopRequireDefault(_sektor);

var _emitter = require('contra/emitter');

var _emitter2 = _interopRequireDefault(_emitter);

var _bullseye = require('bullseye');

var _bullseye2 = _interopRequireDefault(_bullseye);

var _crossvent = require('crossvent');

var _crossvent2 = _interopRequireDefault(_crossvent);

var _fuzzysearch = require('fuzzysearch');

var _fuzzysearch2 = _interopRequireDefault(_fuzzysearch);

var _debounce = require('lodash/debounce');

var _debounce2 = _interopRequireDefault(_debounce);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var KEY_BACKSPACE = 8;
var KEY_ENTER = 13;
var KEY_ESC = 27;
var KEY_UP = 38;
var KEY_DOWN = 40;
var KEY_TAB = 9;
var doc = document;
var docElement = doc.documentElement;
var listCounter = 0;

function horsey(el) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var setAppends = options.setAppends,
      _set = options.set,
      filter = options.filter,
      source = options.source,
      _options$cache = options.cache,
      cache = _options$cache === undefined ? {} : _options$cache,
      predictNextSearch = options.predictNextSearch,
      renderItem = options.renderItem,
      renderCategory = options.renderCategory,
      blankSearch = options.blankSearch,
      appendTo = options.appendTo,
      anchor = options.anchor,
      debounce = options.debounce,
      autoHideOnBlur = options.autoHideOnBlur;

  var caching = options.cache !== false;
  if (!source) {
    return;
  }

  var userGetText = options.getText;
  var userGetValue = options.getValue;
  var getText = typeof userGetText === 'string' ? function (d) {
    return d[userGetText];
  } : typeof userGetText === 'function' ? userGetText : function (d) {
    return d.toString();
  };
  var getValue = typeof userGetValue === 'string' ? function (d) {
    return d[userGetValue];
  } : typeof userGetValue === 'function' ? userGetValue : function (d) {
    return d;
  };

  var previousSuggestions = [];
  var previousSelection = null;
  var limit = Number(options.limit) || Infinity;
  var completer = autocomplete(el, {
    source: sourceFunction,
    limit: limit,
    getText: getText,
    getValue: getValue,
    setAppends: setAppends,
    predictNextSearch: predictNextSearch,
    renderItem: renderItem,
    renderCategory: renderCategory,
    appendTo: appendTo,
    anchor: anchor,
    noMatches: noMatches,
    noMatchesText: options.noMatches,
    blankSearch: blankSearch,
    debounce: debounce,
    autoHideOnBlur: autoHideOnBlur,
    set: function set(s) {
      if (setAppends !== true) {
        el.value = '';
      }
      previousSelection = s;
      (_set || completer.defaultSetter)(getText(s), s);
      completer.emit('afterSet');
    },

    filter: filter
  });
  return completer;
  function noMatches(data) {
    if (!options.noMatches) {
      return false;
    }
    return data.query.length;
  }
  function sourceFunction(data, done) {
    var query = data.query,
        limit = data.limit;

    if (!options.blankSearch && query.length === 0) {
      done(null, [], true);return;
    }
    if (completer) {
      completer.emit('beforeUpdate');
    }
    var hash = (0, _hashSum2.default)(query); // fast, case insensitive, prevents collisions
    if (caching) {
      var entry = cache[hash];
      if (entry) {
        var start = entry.created.getTime();
        var duration = cache.duration || 60 * 60 * 24;
        var diff = duration * 1000;
        var fresh = new Date(start + diff) > new Date();
        if (fresh) {
          done(null, entry.items.slice());return;
        }
      }
    }
    var sourceData = {
      previousSuggestions: previousSuggestions.slice(),
      previousSelection: previousSelection,
      input: query,
      renderItem: renderItem,
      renderCategory: renderCategory,
      limit: limit
    };
    if (typeof options.source === 'function') {
      options.source(sourceData, sourced);
    } else {
      sourced(null, options.source);
    }
    function sourced(err, result) {
      if (err) {
        console.log('Autocomplete source error.', err, el);
        done(err, []);
      }
      var items = Array.isArray(result) ? result : [];
      if (caching) {
        cache[hash] = { created: new Date(), items: items };
      }
      previousSuggestions = items;
      done(null, items.slice());
    }
  }
}

function autocomplete(el) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var o = options;
  var parent = o.appendTo || doc.body;
  var listId = 'sey-list-' + listCounter++;
  var getText = o.getText,
      getValue = o.getValue,
      form = o.form,
      source = o.source,
      noMatches = o.noMatches,
      noMatchesText = o.noMatchesText,
      _o$highlighter = o.highlighter,
      highlighter = _o$highlighter === undefined ? true : _o$highlighter,
      _o$highlightCompleteW = o.highlightCompleteWords,
      highlightCompleteWords = _o$highlightCompleteW === undefined ? true : _o$highlightCompleteW,
      _o$renderItem = o.renderItem,
      renderItem = _o$renderItem === undefined ? defaultItemRenderer : _o$renderItem,
      _o$renderCategory = o.renderCategory,
      renderCategory = _o$renderCategory === undefined ? defaultCategoryRenderer : _o$renderCategory,
      setAppends = o.setAppends;

  var limit = typeof o.limit === 'number' ? o.limit : Infinity;
  var userFilter = o.filter || defaultFilter;
  var userSet = o.set || defaultSetter;
  var categories = tag('div', 'sey-categories');
  var container = tag('div', 'sey-container');
  var deferredFiltering = defer(filtering);
  var state = { counter: 0, query: null };
  var categoryMap = Object.create(null);
  var selection = null;
  var eye = void 0;
  var attachment = el;
  var noneMatch = void 0;
  var textInput = void 0;
  var anyInput = void 0;
  var ranchorleft = void 0;
  var ranchorright = void 0;
  var lastPrefix = '';
  var debounceTime = o.debounce || 300;
  var debouncedLoading = (0, _debounce2.default)(loading, debounceTime);
  if (o.autoHideOnBlur === void 0) {
    o.autoHideOnBlur = true;
  }
  if (o.autoHideOnClick === void 0) {
    o.autoHideOnClick = true;
  }
  if (o.autoShowOnUpDown === void 0) {
    o.autoShowOnUpDown = el.tagName === 'INPUT';
  }
  if (o.anchor) {
    ranchorleft = new RegExp('^' + o.anchor);
    ranchorright = new RegExp(o.anchor + '$');
  }

  var hasItems = false;
  var api = (0, _emitter2.default)({
    anchor: o.anchor,
    clear: clear,
    show: show,
    hide: hide,
    toggle: toggle,
    destroy: destroy,
    refreshPosition: refreshPosition,
    appendText: appendText,
    appendHTML: appendHTML,
    filterAnchoredText: filterAnchoredText,
    filterAnchoredHTML: filterAnchoredHTML,
    defaultAppendText: appendText,
    defaultFilter: defaultFilter,
    defaultItemRenderer: defaultItemRenderer,
    defaultCategoryRenderer: defaultCategoryRenderer,
    defaultSetter: defaultSetter,
    retarget: retarget,
    attachment: attachment,
    move: move,
    source: []
  });

  retarget(el);
  container.appendChild(categories);
  if (noMatches && noMatchesText) {
    noneMatch = tag('div', 'sey-empty sey-hide');
    text(noneMatch, noMatchesText);
    container.appendChild(noneMatch);
  }
  parent.appendChild(container);
  el.setAttribute('autocomplete', 'off');
  el.setAttribute('role', 'combobox');
  el.setAttribute('aria-owns', listId);
  el.setAttribute('aria-autocomplete', 'list');

  if (Array.isArray(source)) {
    loaded(source, false);
  }

  return api;

  function retarget(el) {
    inputEvents(true);
    attachment = api.attachment = el;
    textInput = attachment.tagName === 'INPUT' || attachment.tagName === 'TEXTAREA';
    anyInput = textInput || isEditable(attachment);
    inputEvents();
  }

  function refreshPosition() {
    if (eye) {
      eye.refresh();
    }
  }

  function loading(forceShow) {
    if (typeof source !== 'function') {
      return;
    }
    _crossvent2.default.remove(attachment, 'focus', loading);
    var query = readInput();
    if (query === state.query) {
      return;
    }
    hasItems = false;
    state.query = query;

    var counter = ++state.counter;

    source({ query: query, limit: limit }, sourced);

    function sourced(err, result, blankQuery) {
      if (state.counter !== counter) {
        return;
      }
      loaded(result, forceShow);
      if (err || blankQuery) {
        hasItems = false;
      }
    }
  }

  function loaded(categories, forceShow) {
    clear();
    hasItems = true;
    api.source = [];
    categories.forEach(function (cat) {
      return cat.list.forEach(function (suggestion) {
        return add(suggestion, cat);
      });
    });
    if (forceShow) {
      show();
    }
    filtering();
  }

  function clear() {
    unselect();
    while (categories.lastChild) {
      categories.removeChild(categories.lastChild);
    }
    categoryMap = Object.create(null);
    hasItems = false;
  }

  function readInput() {
    return (textInput ? el.value : el.innerHTML).trim();
  }

  function getCategory(data) {
    if (!data.id) {
      data.id = 'default';
    }
    if (!categoryMap[data.id]) {
      categoryMap[data.id] = createCategory();
    }
    return categoryMap[data.id];
    function createCategory() {
      var category = tag('div', 'sey-category');
      var ul = tag('ul', 'sey-list');
      ul.setAttribute('id', listId);
      ul.setAttribute('role', 'listbox');
      renderCategory(category, data);
      category.appendChild(ul);
      categories.appendChild(category);
      return { data: data, ul: ul };
    }
  }

  function add(suggestion, categoryData) {
    var cat = getCategory(categoryData);
    var li = tag('li', 'sey-item');
    var suggestionId = listId + '-' + (suggestion.value || suggestion);
    renderItem(li, suggestion);
    if (highlighter) {
      breakupForHighlighter(li);
    }
    _crossvent2.default.add(li, 'mouseenter', hoverSuggestion);
    _crossvent2.default.add(li, 'click', clickedSuggestion);
    _crossvent2.default.add(li, 'horsey-filter', filterItem);
    _crossvent2.default.add(li, 'horsey-hide', hideItem);
    li.setAttribute('role', 'option');
    li.setAttribute('id', suggestionId);
    cat.ul.appendChild(li);
    api.source.push(suggestion);
    return li;

    function hoverSuggestion() {
      select(li);
    }

    function clickedSuggestion() {
      var input = getText(suggestion);
      set(suggestion);
      hide();
      attachment.focus();
      lastPrefix = o.predictNextSearch && o.predictNextSearch({
        input: input,
        source: api.source.slice(),
        selection: suggestion
      }) || '';
      if (lastPrefix) {
        el.value = lastPrefix;
        el.select();
        show();
        filtering();
      }
    }

    function filterItem() {
      var value = readInput();
      if (filter(value, suggestion)) {
        li.className = li.className.replace(/ sey-hide/g, '');
      } else {
        _crossvent2.default.fabricate(li, 'horsey-hide');
      }
    }

    function hideItem() {
      if (!hidden(li)) {
        li.className += ' sey-hide';
        if (selection === li) {
          unselect();
        }
      }
    }
  }

  function breakupForHighlighter(el) {
    getTextChildren(el).forEach(function (el) {
      var parent = el.parentElement || el.parentNode;
      var text = el.textContent || el.nodeValue || '';
      if (text.length === 0) {
        return;
      }
      for (var i = 0, chars = text.split(''); i < chars.length; i++) {
        parent.insertBefore(spanFor(chars[i]), el);
      }
      parent.removeChild(el);
      function spanFor(char) {
        var span = doc.createElement('span');
        span.className = 'sey-char';
        span.textContent = span.innerText = char;
        return span;
      }
    });
  }

  function highlight(el, needle) {
    var rword = /[\s,._\[\]{}()-]/g;
    var words = needle.split(rword).filter(function (w) {
      return w.length;
    });
    var elems = [].slice.call(el.querySelectorAll('.sey-char'));
    var chars = void 0;
    var startIndex = 0;

    balance();
    if (highlightCompleteWords) {
      whole();
    }
    fuzzy();
    clearRemainder();

    function balance() {
      chars = elems.map(function (el) {
        return el.innerText || el.textContent;
      });
    }

    function whole() {
      for (var wordIndex = 0, word; wordIndex < words.length; wordIndex++) {
        var word = words[wordIndex];
        var tempIndex = startIndex;
        retry: while (tempIndex !== -1) {
          var init = true;
          var prevIndex = tempIndex;
          for (var charIndex = 0, _chars = word.split(''); charIndex < _chars.length; charIndex++) {
            var char = _chars[charIndex];
            var i = _chars.indexOf(char, prevIndex + 1);
            var fail = i === -1 || !init && prevIndex + 1 !== i;
            if (init) {
              init = false;
              tempIndex = i;
            }
            if (fail) {
              continue retry;
            }
            prevIndex = i;
          }
          for (var elemIndex = 0, matchedElems = elems.splice(tempIndex, 1 + prevIndex - tempIndex); elemIndex < matchedElems.length; elemIndex++) {
            on(matchedElems[elemIndex]);
          }
          balance();
          needle = needle.replace(word, '');
          break;
        }
      }
    }

    function fuzzy() {
      for (var i = 0, _chars2 = needle.split(''); i < _chars2.length; i++) {
        while (elems.length) {
          var _el = elems.shift();
          if ((_el.innerText || _el.textContent) === _chars2[i]) {
            on(_el);
            break;
          } else {
            off(_el);
          }
        }
      }
    }

    function clearRemainder() {
      while (elems.length) {
        off(elems.shift());
      }
    }

    function on(ch) {
      ch.classList.add('sey-char-highlight');
    }
    function off(ch) {
      ch.classList.remove('sey-char-highlight');
    }
  }

  function getTextChildren(el) {
    var texts = [];
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    var node = void 0;
    while (node = walker.nextNode()) {
      texts.push(node);
    }
    return texts;
  }

  function set(value) {
    if (o.anchor) {
      return (isText() ? api.appendText : api.appendHTML)(getValue(value));
    }
    userSet(value);
  }

  function filter(value, suggestion) {
    if (o.anchor) {
      var il = (isText() ? api.filterAnchoredText : api.filterAnchoredHTML)(value, suggestion);
      return il ? userFilter(il.input, il.suggestion) : false;
    }
    return userFilter(value, suggestion);
  }

  function isText() {
    return isInput(attachment);
  }
  function visible() {
    return container.className.indexOf('sey-show') !== -1;
  }
  function hidden(li) {
    return li.className.indexOf('sey-hide') !== -1;
  }

  function show() {
    eye.refresh();
    if (!visible()) {
      container.className += ' sey-show';
      _crossvent2.default.fabricate(attachment, 'horsey-show');
    }
  }

  function toggler(e) {
    var left = e.which === 1 && !e.metaKey && !e.ctrlKey;
    if (left === false) {
      return; // we only care about honest to god left-clicks
    }
    toggle();
  }

  function toggle() {
    if (!visible()) {
      show();
    } else {
      hide();
    }
  }

  function select(li) {
    unselect();
    if (li) {
      selection = li;
      selection.className += ' sey-selected';
      el.setAttribute('aria-activedescendant', selection.getAttribute('id'));
    }
  }

  function unselect() {
    if (selection) {
      selection.className = selection.className.replace(/ sey-selected/g, '');
      selection = null;
      el.removeAttribute('aria-activedescendant');
    }
  }

  function move(up, moves) {
    var total = api.source.length;
    if (total === 0) {
      return;
    }
    if (moves > total) {
      unselect();
      return;
    }
    var cat = findCategory(selection) || categories.firstChild;
    var first = up ? 'lastChild' : 'firstChild';
    var last = up ? 'firstChild' : 'lastChild';
    var next = up ? 'previousSibling' : 'nextSibling';
    var prev = up ? 'nextSibling' : 'previousSibling';
    var li = findNext();
    select(li);

    if (hidden(li)) {
      move(up, moves ? moves + 1 : 1);
    } else {
      _crossvent2.default.fabricate(attachment, 'horsey-li-selected', { selected: li });
    }

    function findCategory(el) {
      while (el) {
        if (_sektor2.default.matchesSelector(el.parentElement, '.sey-category')) {
          return el.parentElement;
        }
        el = el.parentElement;
      }
      return null;
    }

    function findNext() {
      if (selection) {
        if (selection[next]) {
          return selection[next];
        }
        if (cat[next] && findList(cat[next])[first]) {
          return findList(cat[next])[first];
        }
      }
      return findList(categories[first])[first];
    }
  }

  function hide() {
    eye.sleep();
    container.className = container.className.replace(/ sey-show/g, '');
    unselect();
    _crossvent2.default.fabricate(attachment, 'horsey-hide');
    if (el.value === lastPrefix) {
      el.value = '';
    }
  }

  function keydown(e) {
    var shown = visible();
    var which = e.which || e.keyCode;
    if (which === KEY_DOWN) {
      if (anyInput && o.autoShowOnUpDown) {
        show();
      }
      if (shown) {
        move();
        stop(e);
      }
    } else if (which === KEY_UP) {
      if (anyInput && o.autoShowOnUpDown) {
        show();
      }
      if (shown) {
        move(true);
        stop(e);
      }
    } else if (which === KEY_BACKSPACE) {
      if (anyInput && o.autoShowOnUpDown) {
        show();
      }
    } else if (shown) {
      if (which === KEY_ENTER) {
        if (selection) {
          _crossvent2.default.fabricate(selection, 'click');
        } else {
          hide();
        }
        stop(e);
      } else if (which === KEY_ESC) {
        hide();
        stop(e);
      }
    }
  }

  function stop(e) {
    e.stopPropagation();
    e.preventDefault();
  }

  function showNoResults() {
    if (noneMatch) {
      noneMatch.classList.remove('sey-hide');
    }
  }

  function hideNoResults() {
    if (noneMatch) {
      noneMatch.classList.add('sey-hide');
    }
  }

  function filtering() {
    if (!visible()) {
      return;
    }
    debouncedLoading(true);
    _crossvent2.default.fabricate(attachment, 'horsey-filter');
    var value = readInput();
    if (!o.blankSearch && !value) {
      hide();return;
    }
    var nomatch = noMatches({ query: value });
    var count = walkCategories();
    if (count === 0 && nomatch && hasItems) {
      showNoResults();
    } else {
      hideNoResults();
    }
    if (!selection) {
      move();
    }
    if (!selection && !nomatch) {
      hide();
    }
    function walkCategories() {
      var category = categories.firstChild;
      var count = 0;
      while (category) {
        var list = findList(category);
        var partial = walkCategory(list);
        if (partial === 0) {
          category.classList.add('sey-hide');
        } else {
          category.classList.remove('sey-hide');
        }
        count += partial;
        category = category.nextSibling;
      }
      return count;
    }
    function walkCategory(ul) {
      var li = ul.firstChild;
      var count = 0;
      while (li) {
        if (count >= limit) {
          _crossvent2.default.fabricate(li, 'horsey-hide');
        } else {
          _crossvent2.default.fabricate(li, 'horsey-filter');
          if (li.className.indexOf('sey-hide') === -1) {
            count++;
            if (highlighter) {
              highlight(li, value);
            }
          }
        }
        li = li.nextSibling;
      }
      return count;
    }
  }

  function deferredFilteringNoEnter(e) {
    var which = e.which || e.keyCode;
    if (which === KEY_ENTER) {
      return;
    }
    deferredFiltering();
  }

  function deferredShow(e) {
    var which = e.which || e.keyCode;
    if (which === KEY_ENTER || which === KEY_TAB) {
      return;
    }
    setTimeout(show, 0);
  }

  function autocompleteEventTarget(e) {
    var target = e.target;
    if (target === attachment) {
      return true;
    }
    while (target) {
      if (target === container || target === attachment) {
        return true;
      }
      target = target.parentNode;
    }
  }

  function hideOnBlur(e) {
    var which = e.which || e.keyCode;
    if (which === KEY_TAB) {
      hide();
    }
  }

  function hideOnClick(e) {
    if (autocompleteEventTarget(e)) {
      return;
    }
    hide();
  }

  function inputEvents(remove) {
    var op = remove ? 'remove' : 'add';
    if (eye) {
      eye.destroy();
      eye = null;
    }
    if (!remove) {
      eye = (0, _bullseye2.default)(container, attachment, {
        caret: anyInput && attachment.tagName !== 'INPUT',
        context: o.appendTo
      });
      if (!visible()) {
        eye.sleep();
      }
    }
    if (remove || anyInput && doc.activeElement !== attachment) {
      _crossvent2.default[op](attachment, 'focus', loading);
    } else {
      loading();
    }
    if (anyInput) {
      _crossvent2.default[op](attachment, 'keypress', deferredShow);
      _crossvent2.default[op](attachment, 'keypress', deferredFiltering);
      _crossvent2.default[op](attachment, 'keydown', deferredFilteringNoEnter);
      _crossvent2.default[op](attachment, 'paste', deferredFiltering);
      _crossvent2.default[op](attachment, 'keydown', keydown);
      if (o.autoHideOnBlur) {
        _crossvent2.default[op](attachment, 'keydown', hideOnBlur);
      }
    } else {
      _crossvent2.default[op](attachment, 'click', toggler);
      _crossvent2.default[op](docElement, 'keydown', keydown);
    }
    if (o.autoHideOnClick) {
      _crossvent2.default[op](doc, 'click', hideOnClick);
    }
    if (form) {
      _crossvent2.default[op](form, 'submit', hide);
    }
  }

  function destroy() {
    inputEvents(true);
    if (parent.contains(container)) {
      parent.removeChild(container);
    }
  }

  function defaultSetter(value) {
    if (textInput) {
      if (setAppends === true) {
        el.value += ' ' + value;
      } else {
        el.value = value;
      }
    } else {
      if (setAppends === true) {
        el.innerHTML += ' ' + value;
      } else {
        el.innerHTML = value;
      }
    }
  }

  function defaultItemRenderer(li, suggestion) {
    text(li, getText(suggestion));
  }

  function defaultCategoryRenderer(div, data) {
    if (data.id !== 'default') {
      var id = tag('div', 'sey-category-id');
      div.appendChild(id);
      text(id, data.id);
    }
  }

  function defaultFilter(q, suggestion) {
    var needle = q.toLowerCase();
    var text = getText(suggestion) || '';
    if ((0, _fuzzysearch2.default)(needle, text.toLowerCase())) {
      return true;
    }
    var value = getValue(suggestion) || '';
    if (typeof value !== 'string') {
      return false;
    }
    return (0, _fuzzysearch2.default)(needle, value.toLowerCase());
  }

  function loopbackToAnchor(text, p) {
    var result = '';
    var anchored = false;
    var start = p.start;
    while (anchored === false && start >= 0) {
      result = text.substr(start - 1, p.start - start + 1);
      anchored = ranchorleft.test(result);
      start--;
    }
    return {
      text: anchored ? result : null,
      start: start
    };
  }

  function filterAnchoredText(q, suggestion) {
    var position = (0, _sell2.default)(el);
    var input = loopbackToAnchor(q, position).text;
    if (input) {
      return { input: input, suggestion: suggestion };
    }
  }

  function appendText(value) {
    var current = el.value;
    var position = (0, _sell2.default)(el);
    var input = loopbackToAnchor(current, position);
    var left = current.substr(0, input.start);
    var right = current.substr(input.start + input.text.length + (position.end - position.start));
    var before = left + value + ' ';

    el.value = before + right;
    (0, _sell2.default)(el, { start: before.length, end: before.length });
  }

  function filterAnchoredHTML() {
    throw new Error('Anchoring in editable elements is disabled by default.');
  }

  function appendHTML() {
    throw new Error('Anchoring in editable elements is disabled by default.');
  }

  function findList(category) {
    return (0, _sektor2.default)('.sey-list', category)[0];
  }
}

function isInput(el) {
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA';
}

function tag(type, className) {
  var el = doc.createElement(type);
  el.className = className;
  return el;
}

function defer(fn) {
  return function () {
    setTimeout(fn, 0);
  };
}
function text(el, value) {
  el.innerText = el.textContent = value;
}

function isEditable(el) {
  var value = el.getAttribute('contentEditable');
  if (value === 'false') {
    return false;
  }
  if (value === 'true') {
    return true;
  }
  if (el.parentElement) {
    return isEditable(el.parentElement);
  }
  return false;
}

module.exports = horsey;

},{"bullseye":3,"contra/emitter":7,"crossvent":8,"fuzzysearch":11,"hash-sum":12,"lodash/debounce":13,"sektor":20,"sell":29}],2:[function(require,module,exports){
module.exports = function atoa (a, n) { return Array.prototype.slice.call(a, n); }

},{}],3:[function(require,module,exports){
'use strict';

var crossvent = require('crossvent');
var throttle = require('./throttle');
var tailormade = require('./tailormade');

function bullseye (el, target, options) {
  var o = options;
  var domTarget = target && target.tagName;

  if (!domTarget && arguments.length === 2) {
    o = target;
  }
  if (!domTarget) {
    target = el;
  }
  if (!o) { o = {}; }

  var destroyed = false;
  var throttledWrite = throttle(write, 30);
  var tailorOptions = { update: o.autoupdateToCaret !== false && update };
  var tailor = o.caret && tailormade(target, tailorOptions);

  write();

  if (o.tracking !== false) {
    crossvent.add(window, 'resize', throttledWrite);
  }

  return {
    read: readNull,
    refresh: write,
    destroy: destroy,
    sleep: sleep
  };

  function sleep () {
    tailorOptions.sleeping = true;
  }

  function readNull () { return read(); }

  function read (readings) {
    var bounds = target.getBoundingClientRect();
    var scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
    if (tailor) {
      readings = tailor.read();
      return {
        x: (readings.absolute ? 0 : bounds.left) + readings.x,
        y: (readings.absolute ? 0 : bounds.top) + scrollTop + readings.y + 20
      };
    }
    return {
      x: bounds.left,
      y: bounds.top + scrollTop
    };
  }

  function update (readings) {
    write(readings);
  }

  function write (readings) {
    if (destroyed) {
      throw new Error('Bullseye can\'t refresh after being destroyed. Create another instance instead.');
    }
    if (tailor && !readings) {
      tailorOptions.sleeping = false;
      tailor.refresh(); return;
    }
    var p = read(readings);
    if (!tailor && target !== el) {
      p.y += target.offsetHeight;
    }
    var context = o.context;
    el.style.left = p.x + 'px';
    el.style.top = (context ? context.offsetHeight : p.y) + 'px';
  }

  function destroy () {
    if (tailor) { tailor.destroy(); }
    crossvent.remove(window, 'resize', throttledWrite);
    destroyed = true;
  }
}

module.exports = bullseye;

},{"./tailormade":4,"./throttle":5,"crossvent":8}],4:[function(require,module,exports){
(function (global){
'use strict';

var sell = require('sell');
var crossvent = require('crossvent');
var seleccion = require('seleccion');
var throttle = require('./throttle');
var getSelection = seleccion.get;
var props = [
  'direction',
  'boxSizing',
  'width',
  'height',
  'overflowX',
  'overflowY',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'fontStretch',
  'fontSize',
  'fontSizeAdjust',
  'lineHeight',
  'fontFamily',
  'textAlign',
  'textTransform',
  'textIndent',
  'textDecoration',
  'letterSpacing',
  'wordSpacing'
];
var win = global;
var doc = document;
var ff = win.mozInnerScreenX !== null && win.mozInnerScreenX !== void 0;

function tailormade (el, options) {
  var textInput = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA';
  var throttledRefresh = throttle(refresh, 30);
  var o = options || {};

  bind();

  return {
    read: readPosition,
    refresh: throttledRefresh,
    destroy: destroy
  };

  function noop () {}
  function readPosition () { return (textInput ? coordsText : coordsHTML)(); }

  function refresh () {
    if (o.sleeping) {
      return;
    }
    return (o.update || noop)(readPosition());
  }

  function coordsText () {
    var p = sell(el);
    var context = prepare();
    var readings = readTextCoords(context, p.start);
    doc.body.removeChild(context.mirror);
    return readings;
  }

  function coordsHTML () {
    var sel = getSelection();
    if (sel.rangeCount) {
      var range = sel.getRangeAt(0);
      var needsToWorkAroundNewlineBug = range.startContainer.nodeName === 'P' && range.startOffset === 0;
      if (needsToWorkAroundNewlineBug) {
        return {
          x: range.startContainer.offsetLeft,
          y: range.startContainer.offsetTop,
          absolute: true
        };
      }
      if (range.getClientRects) {
        var rects = range.getClientRects();
        if (rects.length > 0) {
          return {
            x: rects[0].left,
            y: rects[0].top,
            absolute: true
          };
        }
      }
    }
    return { x: 0, y: 0 };
  }

  function readTextCoords (context, p) {
    var rest = doc.createElement('span');
    var mirror = context.mirror;
    var computed = context.computed;

    write(mirror, read(el).substring(0, p));

    if (el.tagName === 'INPUT') {
      mirror.textContent = mirror.textContent.replace(/\s/g, '\u00a0');
    }

    write(rest, read(el).substring(p) || '.');

    mirror.appendChild(rest);

    return {
      x: rest.offsetLeft + parseInt(computed['borderLeftWidth']),
      y: rest.offsetTop + parseInt(computed['borderTopWidth'])
    };
  }

  function read (el) {
    return textInput ? el.value : el.innerHTML;
  }

  function prepare () {
    var computed = win.getComputedStyle ? getComputedStyle(el) : el.currentStyle;
    var mirror = doc.createElement('div');
    var style = mirror.style;

    doc.body.appendChild(mirror);

    if (el.tagName !== 'INPUT') {
      style.wordWrap = 'break-word';
    }
    style.whiteSpace = 'pre-wrap';
    style.position = 'absolute';
    style.visibility = 'hidden';
    props.forEach(copy);

    if (ff) {
      style.width = parseInt(computed.width) - 2 + 'px';
      if (el.scrollHeight > parseInt(computed.height)) {
        style.overflowY = 'scroll';
      }
    } else {
      style.overflow = 'hidden';
    }
    return { mirror: mirror, computed: computed };

    function copy (prop) {
      style[prop] = computed[prop];
    }
  }

  function write (el, value) {
    if (textInput) {
      el.textContent = value;
    } else {
      el.innerHTML = value;
    }
  }

  function bind (remove) {
    var op = remove ? 'remove' : 'add';
    crossvent[op](el, 'keydown', throttledRefresh);
    crossvent[op](el, 'keyup', throttledRefresh);
    crossvent[op](el, 'input', throttledRefresh);
    crossvent[op](el, 'paste', throttledRefresh);
    crossvent[op](el, 'change', throttledRefresh);
  }

  function destroy () {
    bind(true);
  }
}

module.exports = tailormade;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./throttle":5,"crossvent":8,"seleccion":27,"sell":29}],5:[function(require,module,exports){
'use strict';

function throttle (fn, boundary) {
  var last = -Infinity;
  var timer;
  return function bounced () {
    if (timer) {
      return;
    }
    unbound();

    function unbound () {
      clearTimeout(timer);
      timer = null;
      var next = last + boundary;
      var now = Date.now();
      if (now > next) {
        last = now;
        fn();
      } else {
        timer = setTimeout(unbound, next - now);
      }
    }
  };
}

module.exports = throttle;

},{}],6:[function(require,module,exports){
'use strict';

var ticky = require('ticky');

module.exports = function debounce (fn, args, ctx) {
  if (!fn) { return; }
  ticky(function run () {
    fn.apply(ctx || null, args || []);
  });
};

},{"ticky":30}],7:[function(require,module,exports){
'use strict';

var atoa = require('atoa');
var debounce = require('./debounce');

module.exports = function emitter (thing, options) {
  var opts = options || {};
  var evt = {};
  if (thing === undefined) { thing = {}; }
  thing.on = function (type, fn) {
    if (!evt[type]) {
      evt[type] = [fn];
    } else {
      evt[type].push(fn);
    }
    return thing;
  };
  thing.once = function (type, fn) {
    fn._once = true; // thing.off(fn) still works!
    thing.on(type, fn);
    return thing;
  };
  thing.off = function (type, fn) {
    var c = arguments.length;
    if (c === 1) {
      delete evt[type];
    } else if (c === 0) {
      evt = {};
    } else {
      var et = evt[type];
      if (!et) { return thing; }
      et.splice(et.indexOf(fn), 1);
    }
    return thing;
  };
  thing.emit = function () {
    var args = atoa(arguments);
    return thing.emitterSnapshot(args.shift()).apply(this, args);
  };
  thing.emitterSnapshot = function (type) {
    var et = (evt[type] || []).slice(0);
    return function () {
      var args = atoa(arguments);
      var ctx = this || thing;
      if (type === 'error' && opts.throws !== false && !et.length) { throw args.length === 1 ? args[0] : args; }
      et.forEach(function emitter (listen) {
        if (opts.async) { debounce(listen, args, ctx); } else { listen.apply(ctx, args); }
        if (listen._once) { thing.off(type, listen); }
      });
      return thing;
    };
  };
  return thing;
};

},{"./debounce":6,"atoa":2}],8:[function(require,module,exports){
(function (global){
'use strict';

var customEvent = require('custom-event');
var eventmap = require('./eventmap');
var doc = global.document;
var addEvent = addEventEasy;
var removeEvent = removeEventEasy;
var hardCache = [];

if (!global.addEventListener) {
  addEvent = addEventHard;
  removeEvent = removeEventHard;
}

module.exports = {
  add: addEvent,
  remove: removeEvent,
  fabricate: fabricateEvent
};

function addEventEasy (el, type, fn, capturing) {
  return el.addEventListener(type, fn, capturing);
}

function addEventHard (el, type, fn) {
  return el.attachEvent('on' + type, wrap(el, type, fn));
}

function removeEventEasy (el, type, fn, capturing) {
  return el.removeEventListener(type, fn, capturing);
}

function removeEventHard (el, type, fn) {
  var listener = unwrap(el, type, fn);
  if (listener) {
    return el.detachEvent('on' + type, listener);
  }
}

function fabricateEvent (el, type, model) {
  var e = eventmap.indexOf(type) === -1 ? makeCustomEvent() : makeClassicEvent();
  if (el.dispatchEvent) {
    el.dispatchEvent(e);
  } else {
    el.fireEvent('on' + type, e);
  }
  function makeClassicEvent () {
    var e;
    if (doc.createEvent) {
      e = doc.createEvent('Event');
      e.initEvent(type, true, true);
    } else if (doc.createEventObject) {
      e = doc.createEventObject();
    }
    return e;
  }
  function makeCustomEvent () {
    return new customEvent(type, { detail: model });
  }
}

function wrapperFactory (el, type, fn) {
  return function wrapper (originalEvent) {
    var e = originalEvent || global.event;
    e.target = e.target || e.srcElement;
    e.preventDefault = e.preventDefault || function preventDefault () { e.returnValue = false; };
    e.stopPropagation = e.stopPropagation || function stopPropagation () { e.cancelBubble = true; };
    e.which = e.which || e.keyCode;
    fn.call(el, e);
  };
}

function wrap (el, type, fn) {
  var wrapper = unwrap(el, type, fn) || wrapperFactory(el, type, fn);
  hardCache.push({
    wrapper: wrapper,
    element: el,
    type: type,
    fn: fn
  });
  return wrapper;
}

function unwrap (el, type, fn) {
  var i = find(el, type, fn);
  if (i) {
    var wrapper = hardCache[i].wrapper;
    hardCache.splice(i, 1); // free up a tad of memory
    return wrapper;
  }
}

function find (el, type, fn) {
  var i, item;
  for (i = 0; i < hardCache.length; i++) {
    item = hardCache[i];
    if (item.element === el && item.type === type && item.fn === fn) {
      return i;
    }
  }
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./eventmap":9,"custom-event":10}],9:[function(require,module,exports){
(function (global){
'use strict';

var eventmap = [];
var eventname = '';
var ron = /^on/;

for (eventname in global) {
  if (ron.test(eventname)) {
    eventmap.push(eventname.slice(2));
  }
}

module.exports = eventmap;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],10:[function(require,module,exports){
(function (global){

var NativeCustomEvent = global.CustomEvent;

function useNative () {
  try {
    var p = new NativeCustomEvent('cat', { detail: { foo: 'bar' } });
    return  'cat' === p.type && 'bar' === p.detail.foo;
  } catch (e) {
  }
  return false;
}

/**
 * Cross-browser `CustomEvent` constructor.
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent.CustomEvent
 *
 * @public
 */

module.exports = useNative() ? NativeCustomEvent :

// IE >= 9
'function' === typeof document.createEvent ? function CustomEvent (type, params) {
  var e = document.createEvent('CustomEvent');
  if (params) {
    e.initCustomEvent(type, params.bubbles, params.cancelable, params.detail);
  } else {
    e.initCustomEvent(type, false, false, void 0);
  }
  return e;
} :

// IE <= 8
function CustomEvent (type, params) {
  var e = document.createEventObject();
  e.type = type;
  if (params) {
    e.bubbles = Boolean(params.bubbles);
    e.cancelable = Boolean(params.cancelable);
    e.detail = params.detail;
  } else {
    e.bubbles = false;
    e.cancelable = false;
    e.detail = void 0;
  }
  return e;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],11:[function(require,module,exports){
'use strict';

function fuzzysearch (needle, haystack) {
  var tlen = haystack.length;
  var qlen = needle.length;
  if (qlen > tlen) {
    return false;
  }
  if (qlen === tlen) {
    return needle === haystack;
  }
  outer: for (var i = 0, j = 0; i < qlen; i++) {
    var nch = needle.charCodeAt(i);
    while (j < tlen) {
      if (haystack.charCodeAt(j++) === nch) {
        continue outer;
      }
    }
    return false;
  }
  return true;
}

module.exports = fuzzysearch;

},{}],12:[function(require,module,exports){
'use strict';

function pad (hash, len) {
  while (hash.length < len) {
    hash = '0' + hash;
  }
  return hash;
}

function fold (hash, text) {
  var i;
  var chr;
  var len;
  if (text.length === 0) {
    return hash;
  }
  for (i = 0, len = text.length; i < len; i++) {
    chr = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash < 0 ? hash * -2 : hash;
}

function foldObject (hash, o, seen) {
  return Object.keys(o).sort().reduce(foldKey, hash);
  function foldKey (hash, key) {
    return foldValue(hash, o[key], key, seen);
  }
}

function foldValue (input, value, key, seen) {
  var hash = fold(fold(fold(input, key), toString(value)), typeof value);
  if (value === null) {
    return fold(hash, 'null');
  }
  if (value === undefined) {
    return fold(hash, 'undefined');
  }
  if (typeof value === 'object') {
    if (seen.indexOf(value) !== -1) {
      return fold(hash, '[Circular]' + key);
    }
    seen.push(value);
    return foldObject(hash, value, seen);
  }
  return fold(hash, value.toString());
}

function toString (o) {
  return Object.prototype.toString.call(o);
}

function sum (o) {
  return pad(foldValue(0, o, '', []).toString(16), 8);
}

module.exports = sum;

},{}],13:[function(require,module,exports){
var isObject = require('./isObject'),
    now = require('./now'),
    toNumber = require('./toNumber');

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max,
    nativeMin = Math.min;

/**
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was
 * invoked. The debounced function comes with a `cancel` method to cancel
 * delayed `func` invocations and a `flush` method to immediately invoke them.
 * Provide an options object to indicate whether `func` should be invoked on
 * the leading and/or trailing edge of the `wait` timeout. The `func` is invoked
 * with the last arguments provided to the debounced function. Subsequent calls
 * to the debounced function return the result of the last `func` invocation.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is invoked
 * on the trailing edge of the timeout only if the debounced function is
 * invoked more than once during the `wait` timeout.
 *
 * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
 * for details over the differences between `_.debounce` and `_.throttle`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to debounce.
 * @param {number} [wait=0] The number of milliseconds to delay.
 * @param {Object} [options={}] The options object.
 * @param {boolean} [options.leading=false]
 *  Specify invoking on the leading edge of the timeout.
 * @param {number} [options.maxWait]
 *  The maximum time `func` is allowed to be delayed before it's invoked.
 * @param {boolean} [options.trailing=true]
 *  Specify invoking on the trailing edge of the timeout.
 * @returns {Function} Returns the new debounced function.
 * @example
 *
 * // Avoid costly calculations while the window size is in flux.
 * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
 *
 * // Invoke `sendMail` when clicked, debouncing subsequent calls.
 * jQuery(element).on('click', _.debounce(sendMail, 300, {
 *   'leading': true,
 *   'trailing': false
 * }));
 *
 * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
 * var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });
 * var source = new EventSource('/stream');
 * jQuery(source).on('message', debounced);
 *
 * // Cancel the trailing debounced invocation.
 * jQuery(window).on('popstate', debounced.cancel);
 */
function debounce(func, wait, options) {
  var lastArgs,
      lastThis,
      maxWait,
      result,
      timerId,
      lastCallTime,
      lastInvokeTime = 0,
      leading = false,
      maxing = false,
      trailing = true;

  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  wait = toNumber(wait) || 0;
  if (isObject(options)) {
    leading = !!options.leading;
    maxing = 'maxWait' in options;
    maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }

  function invokeFunc(time) {
    var args = lastArgs,
        thisArg = lastThis;

    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }

  function leadingEdge(time) {
    // Reset any `maxWait` timer.
    lastInvokeTime = time;
    // Start the timer for the trailing edge.
    timerId = setTimeout(timerExpired, wait);
    // Invoke the leading edge.
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime,
        result = wait - timeSinceLastCall;

    return maxing ? nativeMin(result, maxWait - timeSinceLastInvoke) : result;
  }

  function shouldInvoke(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime;

    // Either this is the first call, activity has stopped and we're at the
    // trailing edge, the system time has gone backwards and we're treating
    // it as the trailing edge, or we've hit the `maxWait` limit.
    return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
      (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
  }

  function timerExpired() {
    var time = now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    // Restart the timer.
    timerId = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time) {
    timerId = undefined;

    // Only invoke if we have `lastArgs` which means `func` has been
    // debounced at least once.
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = undefined;
    return result;
  }

  function cancel() {
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timerId = undefined;
  }

  function flush() {
    return timerId === undefined ? result : trailingEdge(now());
  }

  function debounced() {
    var time = now(),
        isInvoking = shouldInvoke(time);

    lastArgs = arguments;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(lastCallTime);
      }
      if (maxing) {
        // Handle invocations in a tight loop.
        timerId = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timerId === undefined) {
      timerId = setTimeout(timerExpired, wait);
    }
    return result;
  }
  debounced.cancel = cancel;
  debounced.flush = flush;
  return debounced;
}

module.exports = debounce;

},{"./isObject":15,"./now":18,"./toNumber":19}],14:[function(require,module,exports){
var isObject = require('./isObject');

/** `Object#toString` result references. */
var funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified,
 *  else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 8 which returns 'object' for typed array and weak map constructors,
  // and PhantomJS 1.9 which returns 'function' for `NodeList` instances.
  var tag = isObject(value) ? objectToString.call(value) : '';
  return tag == funcTag || tag == genTag;
}

module.exports = isFunction;

},{"./isObject":15}],15:[function(require,module,exports){
/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/6.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

module.exports = isObject;

},{}],16:[function(require,module,exports){
/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

module.exports = isObjectLike;

},{}],17:[function(require,module,exports){
var isObjectLike = require('./isObjectLike');

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified,
 *  else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike(value) && objectToString.call(value) == symbolTag);
}

module.exports = isSymbol;

},{"./isObjectLike":16}],18:[function(require,module,exports){
/**
 * Gets the timestamp of the number of milliseconds that have elapsed since
 * the Unix epoch (1 January 1970 00:00:00 UTC).
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Date
 * @returns {number} Returns the timestamp.
 * @example
 *
 * _.defer(function(stamp) {
 *   console.log(_.now() - stamp);
 * }, _.now());
 * // => Logs the number of milliseconds it took for the deferred invocation.
 */
function now() {
  return Date.now();
}

module.exports = now;

},{}],19:[function(require,module,exports){
var isFunction = require('./isFunction'),
    isObject = require('./isObject'),
    isSymbol = require('./isSymbol');

/** Used as references for various `Number` constants. */
var NAN = 0 / 0;

/** Used to match leading and trailing whitespace. */
var reTrim = /^\s+|\s+$/g;

/** Used to detect bad signed hexadecimal string values. */
var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

/** Used to detect binary string values. */
var reIsBinary = /^0b[01]+$/i;

/** Used to detect octal string values. */
var reIsOctal = /^0o[0-7]+$/i;

/** Built-in method references without a dependency on `root`. */
var freeParseInt = parseInt;

/**
 * Converts `value` to a number.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {number} Returns the number.
 * @example
 *
 * _.toNumber(3.2);
 * // => 3.2
 *
 * _.toNumber(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toNumber(Infinity);
 * // => Infinity
 *
 * _.toNumber('3.2');
 * // => 3.2
 */
function toNumber(value) {
  if (typeof value == 'number') {
    return value;
  }
  if (isSymbol(value)) {
    return NAN;
  }
  if (isObject(value)) {
    var other = isFunction(value.valueOf) ? value.valueOf() : value;
    value = isObject(other) ? (other + '') : other;
  }
  if (typeof value != 'string') {
    return value === 0 ? value : +value;
  }
  value = value.replace(reTrim, '');
  var isBinary = reIsBinary.test(value);
  return (isBinary || reIsOctal.test(value))
    ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
    : (reIsBadHex.test(value) ? NAN : +value);
}

module.exports = toNumber;

},{"./isFunction":14,"./isObject":15,"./isSymbol":17}],20:[function(require,module,exports){
(function (global){
'use strict';

var expando = 'sektor-' + Date.now();
var rsiblings = /[+~]/;
var document = global.document;
var del = document.documentElement || {};
var match = (
  del.matches ||
  del.webkitMatchesSelector ||
  del.mozMatchesSelector ||
  del.oMatchesSelector ||
  del.msMatchesSelector ||
  never
);

module.exports = sektor;

sektor.matches = matches;
sektor.matchesSelector = matchesSelector;

function qsa (selector, context) {
  var existed, id, prefix, prefixed, adapter, hack = context !== document;
  if (hack) { // id hack for context-rooted queries
    existed = context.getAttribute('id');
    id = existed || expando;
    prefix = '#' + id + ' ';
    prefixed = prefix + selector.replace(/,/g, ',' + prefix);
    adapter = rsiblings.test(selector) && context.parentNode;
    if (!existed) { context.setAttribute('id', id); }
  }
  try {
    return (adapter || context).querySelectorAll(prefixed || selector);
  } catch (e) {
    return [];
  } finally {
    if (existed === null) { context.removeAttribute('id'); }
  }
}

function sektor (selector, ctx, collection, seed) {
  var element;
  var context = ctx || document;
  var results = collection || [];
  var i = 0;
  if (typeof selector !== 'string') {
    return results;
  }
  if (context.nodeType !== 1 && context.nodeType !== 9) {
    return []; // bail if context is not an element or document
  }
  if (seed) {
    while ((element = seed[i++])) {
      if (matchesSelector(element, selector)) {
        results.push(element);
      }
    }
  } else {
    results.push.apply(results, qsa(selector, context));
  }
  return results;
}

function matches (selector, elements) {
  return sektor(selector, null, null, elements);
}

function matchesSelector (element, selector) {
  return match.call(element, selector);
}

function never () { return false; }

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],21:[function(require,module,exports){
(function (global){
'use strict';

var getSelection;
var doc = global.document;
var getSelectionRaw = require('./getSelectionRaw');
var getSelectionNullOp = require('./getSelectionNullOp');
var getSelectionSynthetic = require('./getSelectionSynthetic');
var isHost = require('./isHost');
if (isHost.method(global, 'getSelection')) {
  getSelection = getSelectionRaw;
} else if (typeof doc.selection === 'object' && doc.selection) {
  getSelection = getSelectionSynthetic;
} else {
  getSelection = getSelectionNullOp;
}

module.exports = getSelection;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./getSelectionNullOp":22,"./getSelectionRaw":23,"./getSelectionSynthetic":24,"./isHost":25}],22:[function(require,module,exports){
'use strict';

function noop () {}

function getSelectionNullOp () {
  return {
    removeAllRanges: noop,
    addRange: noop
  };
}

module.exports = getSelectionNullOp;

},{}],23:[function(require,module,exports){
(function (global){
'use strict';

function getSelectionRaw () {
  return global.getSelection();
}

module.exports = getSelectionRaw;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],24:[function(require,module,exports){
(function (global){
'use strict';

var rangeToTextRange = require('./rangeToTextRange');
var doc = global.document;
var body = doc.body;
var GetSelectionProto = GetSelection.prototype;

function GetSelection (selection) {
  var self = this;
  var range = selection.createRange();

  this._selection = selection;
  this._ranges = [];

  if (selection.type === 'Control') {
    updateControlSelection(self);
  } else if (isTextRange(range)) {
    updateFromTextRange(self, range);
  } else {
    updateEmptySelection(self);
  }
}

GetSelectionProto.removeAllRanges = function () {
  var textRange;
  try {
    this._selection.empty();
    if (this._selection.type !== 'None') {
      textRange = body.createTextRange();
      textRange.select();
      this._selection.empty();
    }
  } catch (e) {
  }
  updateEmptySelection(this);
};

GetSelectionProto.addRange = function (range) {
  if (this._selection.type === 'Control') {
    addRangeToControlSelection(this, range);
  } else {
    rangeToTextRange(range).select();
    this._ranges[0] = range;
    this.rangeCount = 1;
    this.isCollapsed = this._ranges[0].collapsed;
    updateAnchorAndFocusFromRange(this, range, false);
  }
};

GetSelectionProto.setRanges = function (ranges) {
  this.removeAllRanges();
  var rangeCount = ranges.length;
  if (rangeCount > 1) {
    createControlSelection(this, ranges);
  } else if (rangeCount) {
    this.addRange(ranges[0]);
  }
};

GetSelectionProto.getRangeAt = function (index) {
  if (index < 0 || index >= this.rangeCount) {
    throw new Error('getRangeAt(): index out of bounds');
  } else {
    return this._ranges[index].cloneRange();
  }
};

GetSelectionProto.removeRange = function (range) {
  if (this._selection.type !== 'Control') {
    removeRangeManually(this, range);
    return;
  }
  var controlRange = this._selection.createRange();
  var rangeElement = getSingleElementFromRange(range);
  var newControlRange = body.createControlRange();
  var el;
  var removed = false;
  for (var i = 0, len = controlRange.length; i < len; ++i) {
    el = controlRange.item(i);
    if (el !== rangeElement || removed) {
      newControlRange.add(controlRange.item(i));
    } else {
      removed = true;
    }
  }
  newControlRange.select();
  updateControlSelection(this);
};

GetSelectionProto.eachRange = function (fn, returnValue) {
  var i = 0;
  var len = this._ranges.length;
  for (i = 0; i < len; ++i) {
    if (fn(this.getRangeAt(i))) {
      return returnValue;
    }
  }
};

GetSelectionProto.getAllRanges = function () {
  var ranges = [];
  this.eachRange(function (range) {
    ranges.push(range);
  });
  return ranges;
};

GetSelectionProto.setSingleRange = function (range) {
  this.removeAllRanges();
  this.addRange(range);
};

function createControlSelection (sel, ranges) {
  var controlRange = body.createControlRange();
  for (var i = 0, el, len = ranges.length; i < len; ++i) {
    el = getSingleElementFromRange(ranges[i]);
    try {
      controlRange.add(el);
    } catch (e) {
      throw new Error('setRanges(): Element could not be added to control selection');
    }
  }
  controlRange.select();
  updateControlSelection(sel);
}

function removeRangeManually (sel, range) {
  var ranges = sel.getAllRanges();
  sel.removeAllRanges();
  for (var i = 0, len = ranges.length; i < len; ++i) {
    if (!isSameRange(range, ranges[i])) {
      sel.addRange(ranges[i]);
    }
  }
  if (!sel.rangeCount) {
    updateEmptySelection(sel);
  }
}

function updateAnchorAndFocusFromRange (sel, range) {
  var anchorPrefix = 'start';
  var focusPrefix = 'end';
  sel.anchorNode = range[anchorPrefix + 'Container'];
  sel.anchorOffset = range[anchorPrefix + 'Offset'];
  sel.focusNode = range[focusPrefix + 'Container'];
  sel.focusOffset = range[focusPrefix + 'Offset'];
}

function updateEmptySelection (sel) {
  sel.anchorNode = sel.focusNode = null;
  sel.anchorOffset = sel.focusOffset = 0;
  sel.rangeCount = 0;
  sel.isCollapsed = true;
  sel._ranges.length = 0;
}

function rangeContainsSingleElement (rangeNodes) {
  if (!rangeNodes.length || rangeNodes[0].nodeType !== 1) {
    return false;
  }
  for (var i = 1, len = rangeNodes.length; i < len; ++i) {
    if (!isAncestorOf(rangeNodes[0], rangeNodes[i])) {
      return false;
    }
  }
  return true;
}

function getSingleElementFromRange (range) {
  var nodes = range.getNodes();
  if (!rangeContainsSingleElement(nodes)) {
    throw new Error('getSingleElementFromRange(): range did not consist of a single element');
  }
  return nodes[0];
}

function isTextRange (range) {
  return range && range.text !== void 0;
}

function updateFromTextRange (sel, range) {
  sel._ranges = [range];
  updateAnchorAndFocusFromRange(sel, range, false);
  sel.rangeCount = 1;
  sel.isCollapsed = range.collapsed;
}

function updateControlSelection (sel) {
  sel._ranges.length = 0;
  if (sel._selection.type === 'None') {
    updateEmptySelection(sel);
  } else {
    var controlRange = sel._selection.createRange();
    if (isTextRange(controlRange)) {
      updateFromTextRange(sel, controlRange);
    } else {
      sel.rangeCount = controlRange.length;
      var range;
      for (var i = 0; i < sel.rangeCount; ++i) {
        range = doc.createRange();
        range.selectNode(controlRange.item(i));
        sel._ranges.push(range);
      }
      sel.isCollapsed = sel.rangeCount === 1 && sel._ranges[0].collapsed;
      updateAnchorAndFocusFromRange(sel, sel._ranges[sel.rangeCount - 1], false);
    }
  }
}

function addRangeToControlSelection (sel, range) {
  var controlRange = sel._selection.createRange();
  var rangeElement = getSingleElementFromRange(range);
  var newControlRange = body.createControlRange();
  for (var i = 0, len = controlRange.length; i < len; ++i) {
    newControlRange.add(controlRange.item(i));
  }
  try {
    newControlRange.add(rangeElement);
  } catch (e) {
    throw new Error('addRange(): Element could not be added to control selection');
  }
  newControlRange.select();
  updateControlSelection(sel);
}

function isSameRange (left, right) {
  return (
    left.startContainer === right.startContainer &&
    left.startOffset === right.startOffset &&
    left.endContainer === right.endContainer &&
    left.endOffset === right.endOffset
  );
}

function isAncestorOf (ancestor, descendant) {
  var node = descendant;
  while (node.parentNode) {
    if (node.parentNode === ancestor) {
      return true;
    }
    node = node.parentNode;
  }
  return false;
}

function getSelection () {
  return new GetSelection(global.document.selection);
}

module.exports = getSelection;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./rangeToTextRange":26}],25:[function(require,module,exports){
'use strict';

function isHostMethod (host, prop) {
  var type = typeof host[prop];
  return type === 'function' || !!(type === 'object' && host[prop]) || type === 'unknown';
}

function isHostProperty (host, prop) {
  return typeof host[prop] !== 'undefined';
}

function many (fn) {
  return function areHosted (host, props) {
    var i = props.length;
    while (i--) {
      if (!fn(host, props[i])) {
        return false;
      }
    }
    return true;
  };
}

module.exports = {
  method: isHostMethod,
  methods: many(isHostMethod),
  property: isHostProperty,
  properties: many(isHostProperty)
};

},{}],26:[function(require,module,exports){
(function (global){
'use strict';

var doc = global.document;
var body = doc.body;

function rangeToTextRange (p) {
  if (p.collapsed) {
    return createBoundaryTextRange({ node: p.startContainer, offset: p.startOffset }, true);
  }
  var startRange = createBoundaryTextRange({ node: p.startContainer, offset: p.startOffset }, true);
  var endRange = createBoundaryTextRange({ node: p.endContainer, offset: p.endOffset }, false);
  var textRange = body.createTextRange();
  textRange.setEndPoint('StartToStart', startRange);
  textRange.setEndPoint('EndToEnd', endRange);
  return textRange;
}

function isCharacterDataNode (node) {
  var t = node.nodeType;
  return t === 3 || t === 4 || t === 8 ;
}

function createBoundaryTextRange (p, starting) {
  var bound;
  var parent;
  var offset = p.offset;
  var workingNode;
  var childNodes;
  var range = body.createTextRange();
  var data = isCharacterDataNode(p.node);

  if (data) {
    bound = p.node;
    parent = bound.parentNode;
  } else {
    childNodes = p.node.childNodes;
    bound = offset < childNodes.length ? childNodes[offset] : null;
    parent = p.node;
  }

  workingNode = doc.createElement('span');
  workingNode.innerHTML = '&#feff;';

  if (bound) {
    parent.insertBefore(workingNode, bound);
  } else {
    parent.appendChild(workingNode);
  }

  range.moveToElementText(workingNode);
  range.collapse(!starting);
  parent.removeChild(workingNode);

  if (data) {
    range[starting ? 'moveStart' : 'moveEnd']('character', offset);
  }
  return range;
}

module.exports = rangeToTextRange;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],27:[function(require,module,exports){
'use strict';

var getSelection = require('./getSelection');
var setSelection = require('./setSelection');

module.exports = {
  get: getSelection,
  set: setSelection
};

},{"./getSelection":21,"./setSelection":28}],28:[function(require,module,exports){
(function (global){
'use strict';

var getSelection = require('./getSelection');
var rangeToTextRange = require('./rangeToTextRange');
var doc = global.document;

function setSelection (p) {
  if (doc.createRange) {
    modernSelection();
  } else {
    oldSelection();
  }

  function modernSelection () {
    var sel = getSelection();
    var range = doc.createRange();
    if (!p.startContainer) {
      return;
    }
    if (p.endContainer) {
      range.setEnd(p.endContainer, p.endOffset);
    } else {
      range.setEnd(p.startContainer, p.startOffset);
    }
    range.setStart(p.startContainer, p.startOffset);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function oldSelection () {
    rangeToTextRange(p).select();
  }
}

module.exports = setSelection;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./getSelection":21,"./rangeToTextRange":26}],29:[function(require,module,exports){
'use strict';

var get = easyGet;
var set = easySet;

if (document.selection && document.selection.createRange) {
  get = hardGet;
  set = hardSet;
}

function easyGet (el) {
  return {
    start: el.selectionStart,
    end: el.selectionEnd
  };
}

function hardGet (el) {
  var active = document.activeElement;
  if (active !== el) {
    el.focus();
  }

  var range = document.selection.createRange();
  var bookmark = range.getBookmark();
  var original = el.value;
  var marker = getUniqueMarker(original);
  var parent = range.parentElement();
  if (parent === null || !inputs(parent)) {
    return result(0, 0);
  }
  range.text = marker + range.text + marker;

  var contents = el.value;

  el.value = original;
  range.moveToBookmark(bookmark);
  range.select();

  return result(contents.indexOf(marker), contents.lastIndexOf(marker) - marker.length);

  function result (start, end) {
    if (active !== el) { // don't disrupt pre-existing state
      if (active) {
        active.focus();
      } else {
        el.blur();
      }
    }
    return { start: start, end: end };
  }
}

function getUniqueMarker (contents) {
  var marker;
  do {
    marker = '@@marker.' + Math.random() * new Date();
  } while (contents.indexOf(marker) !== -1);
  return marker;
}

function inputs (el) {
  return ((el.tagName === 'INPUT' && el.type === 'text') || el.tagName === 'TEXTAREA');
}

function easySet (el, p) {
  el.selectionStart = parse(el, p.start);
  el.selectionEnd = parse(el, p.end);
}

function hardSet (el, p) {
  var range = el.createTextRange();

  if (p.start === 'end' && p.end === 'end') {
    range.collapse(false);
    range.select();
  } else {
    range.collapse(true);
    range.moveEnd('character', parse(el, p.end));
    range.moveStart('character', parse(el, p.start));
    range.select();
  }
}

function parse (el, value) {
  return value === 'end' ? el.value.length : value || 0;
}

function sell (el, p) {
  if (arguments.length === 2) {
    set(el, p);
  }
  return get(el);
}

module.exports = sell;

},{}],30:[function(require,module,exports){
var si = typeof setImmediate === 'function', tick;
if (si) {
  tick = function (fn) { setImmediate(fn); };
} else {
  tick = function (fn) { setTimeout(fn, 0); };
}

module.exports = tick;
},{}]},{},[1])(1)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJob3JzZXkuanMiLCJub2RlX21vZHVsZXMvYXRvYS9hdG9hLmpzIiwibm9kZV9tb2R1bGVzL2J1bGxzZXllL2J1bGxzZXllLmpzIiwibm9kZV9tb2R1bGVzL2J1bGxzZXllL3RhaWxvcm1hZGUuanMiLCJub2RlX21vZHVsZXMvYnVsbHNleWUvdGhyb3R0bGUuanMiLCJub2RlX21vZHVsZXMvY29udHJhL2RlYm91bmNlLmpzIiwibm9kZV9tb2R1bGVzL2NvbnRyYS9lbWl0dGVyLmpzIiwibm9kZV9tb2R1bGVzL2Nyb3NzdmVudC9zcmMvY3Jvc3N2ZW50LmpzIiwibm9kZV9tb2R1bGVzL2Nyb3NzdmVudC9zcmMvZXZlbnRtYXAuanMiLCJub2RlX21vZHVsZXMvY3VzdG9tLWV2ZW50L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Z1enp5c2VhcmNoL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2hhc2gtc3VtL2hhc2gtc3VtLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9kZWJvdW5jZS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaXNGdW5jdGlvbi5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaXNPYmplY3QuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2lzT2JqZWN0TGlrZS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaXNTeW1ib2wuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL25vdy5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvdG9OdW1iZXIuanMiLCJub2RlX21vZHVsZXMvc2VrdG9yL3NyYy9zZWt0b3IuanMiLCJub2RlX21vZHVsZXMvc2VsZWNjaW9uL3NyYy9nZXRTZWxlY3Rpb24uanMiLCJub2RlX21vZHVsZXMvc2VsZWNjaW9uL3NyYy9nZXRTZWxlY3Rpb25OdWxsT3AuanMiLCJub2RlX21vZHVsZXMvc2VsZWNjaW9uL3NyYy9nZXRTZWxlY3Rpb25SYXcuanMiLCJub2RlX21vZHVsZXMvc2VsZWNjaW9uL3NyYy9nZXRTZWxlY3Rpb25TeW50aGV0aWMuanMiLCJub2RlX21vZHVsZXMvc2VsZWNjaW9uL3NyYy9pc0hvc3QuanMiLCJub2RlX21vZHVsZXMvc2VsZWNjaW9uL3NyYy9yYW5nZVRvVGV4dFJhbmdlLmpzIiwibm9kZV9tb2R1bGVzL3NlbGVjY2lvbi9zcmMvc2VsZWNjaW9uLmpzIiwibm9kZV9tb2R1bGVzL3NlbGVjY2lvbi9zcmMvc2V0U2VsZWN0aW9uLmpzIiwibm9kZV9tb2R1bGVzL3NlbGwvc2VsbC5qcyIsIm5vZGVfbW9kdWxlcy90aWNreS90aWNreS1icm93c2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7O0FBRUE7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7O0FBQ0EsSUFBTSxnQkFBZ0IsQ0FBdEI7QUFDQSxJQUFNLFlBQVksRUFBbEI7QUFDQSxJQUFNLFVBQVUsRUFBaEI7QUFDQSxJQUFNLFNBQVMsRUFBZjtBQUNBLElBQU0sV0FBVyxFQUFqQjtBQUNBLElBQU0sVUFBVSxDQUFoQjtBQUNBLElBQU0sTUFBTSxRQUFaO0FBQ0EsSUFBTSxhQUFhLElBQUksZUFBdkI7QUFDQSxJQUFJLGNBQWMsQ0FBbEI7O0FBRUEsU0FBUyxNQUFULENBQWlCLEVBQWpCLEVBQW1DO0FBQUEsTUFBZCxPQUFjLHVFQUFKLEVBQUk7QUFBQSxNQUUvQixVQUYrQixHQWU3QixPQWY2QixDQUUvQixVQUYrQjtBQUFBLE1BRy9CLElBSCtCLEdBZTdCLE9BZjZCLENBRy9CLEdBSCtCO0FBQUEsTUFJL0IsTUFKK0IsR0FlN0IsT0FmNkIsQ0FJL0IsTUFKK0I7QUFBQSxNQUsvQixNQUwrQixHQWU3QixPQWY2QixDQUsvQixNQUwrQjtBQUFBLHVCQWU3QixPQWY2QixDQU0vQixLQU4rQjtBQUFBLE1BTS9CLEtBTitCLGtDQU12QixFQU51QjtBQUFBLE1BTy9CLGlCQVArQixHQWU3QixPQWY2QixDQU8v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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN2RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDaExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3JHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMxUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHN1bSBmcm9tICdoYXNoLXN1bSc7XG5pbXBvcnQgc2VsbCBmcm9tICdzZWxsJztcbmltcG9ydCBzZWt0b3IgZnJvbSAnc2VrdG9yJztcbmltcG9ydCBlbWl0dGVyIGZyb20gJ2NvbnRyYS9lbWl0dGVyJztcbmltcG9ydCBidWxsc2V5ZSBmcm9tICdidWxsc2V5ZSc7XG5pbXBvcnQgY3Jvc3N2ZW50IGZyb20gJ2Nyb3NzdmVudCc7XG5pbXBvcnQgZnV6enlzZWFyY2ggZnJvbSAnZnV6enlzZWFyY2gnO1xuaW1wb3J0IGRlYm91bmNlIGZyb20gJ2xvZGFzaC9kZWJvdW5jZSc7XG5jb25zdCBLRVlfQkFDS1NQQUNFID0gODtcbmNvbnN0IEtFWV9FTlRFUiA9IDEzO1xuY29uc3QgS0VZX0VTQyA9IDI3O1xuY29uc3QgS0VZX1VQID0gMzg7XG5jb25zdCBLRVlfRE9XTiA9IDQwO1xuY29uc3QgS0VZX1RBQiA9IDk7XG5jb25zdCBkb2MgPSBkb2N1bWVudDtcbmNvbnN0IGRvY0VsZW1lbnQgPSBkb2MuZG9jdW1lbnRFbGVtZW50O1xubGV0IGxpc3RDb3VudGVyID0gMDtcblxuZnVuY3Rpb24gaG9yc2V5IChlbCwgb3B0aW9ucyA9IHt9KSB7XG4gIGNvbnN0IHtcbiAgICBzZXRBcHBlbmRzLFxuICAgIHNldCxcbiAgICBmaWx0ZXIsXG4gICAgc291cmNlLFxuICAgIGNhY2hlID0ge30sXG4gICAgcHJlZGljdE5leHRTZWFyY2gsXG4gICAgcmVuZGVySXRlbSxcbiAgICByZW5kZXJDYXRlZ29yeSxcbiAgICBibGFua1NlYXJjaCxcbiAgICBhcHBlbmRUbyxcbiAgICBhbmNob3IsXG4gICAgZGVib3VuY2UsXG4gICAgYXV0b0hpZGVPbkJsdXJcbiAgfSA9IG9wdGlvbnM7XG4gIGNvbnN0IGNhY2hpbmcgPSBvcHRpb25zLmNhY2hlICE9PSBmYWxzZTtcbiAgaWYgKCFzb3VyY2UpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCB1c2VyR2V0VGV4dCA9IG9wdGlvbnMuZ2V0VGV4dDtcbiAgY29uc3QgdXNlckdldFZhbHVlID0gb3B0aW9ucy5nZXRWYWx1ZTtcbiAgY29uc3QgZ2V0VGV4dCA9IChcbiAgICB0eXBlb2YgdXNlckdldFRleHQgPT09ICdzdHJpbmcnID8gZCA9PiBkW3VzZXJHZXRUZXh0XSA6XG4gICAgdHlwZW9mIHVzZXJHZXRUZXh0ID09PSAnZnVuY3Rpb24nID8gdXNlckdldFRleHQgOlxuICAgIGQgPT4gZC50b1N0cmluZygpXG4gICk7XG4gIGNvbnN0IGdldFZhbHVlID0gKFxuICAgIHR5cGVvZiB1c2VyR2V0VmFsdWUgPT09ICdzdHJpbmcnID8gZCA9PiBkW3VzZXJHZXRWYWx1ZV0gOlxuICAgIHR5cGVvZiB1c2VyR2V0VmFsdWUgPT09ICdmdW5jdGlvbicgPyB1c2VyR2V0VmFsdWUgOlxuICAgIGQgPT4gZFxuICApO1xuXG4gIGxldCBwcmV2aW91c1N1Z2dlc3Rpb25zID0gW107XG4gIGxldCBwcmV2aW91c1NlbGVjdGlvbiA9IG51bGw7XG4gIGNvbnN0IGxpbWl0ID0gTnVtYmVyKG9wdGlvbnMubGltaXQpIHx8IEluZmluaXR5O1xuICBjb25zdCBjb21wbGV0ZXIgPSBhdXRvY29tcGxldGUoZWwsIHtcbiAgICBzb3VyY2U6IHNvdXJjZUZ1bmN0aW9uLFxuICAgIGxpbWl0LFxuICAgIGdldFRleHQsXG4gICAgZ2V0VmFsdWUsXG4gICAgc2V0QXBwZW5kcyxcbiAgICBwcmVkaWN0TmV4dFNlYXJjaCxcbiAgICByZW5kZXJJdGVtLFxuICAgIHJlbmRlckNhdGVnb3J5LFxuICAgIGFwcGVuZFRvLFxuICAgIGFuY2hvcixcbiAgICBub01hdGNoZXMsXG4gICAgbm9NYXRjaGVzVGV4dDogb3B0aW9ucy5ub01hdGNoZXMsXG4gICAgYmxhbmtTZWFyY2gsXG4gICAgZGVib3VuY2UsXG4gICAgYXV0b0hpZGVPbkJsdXIsXG4gICAgc2V0IChzKSB7XG4gICAgICBpZiAoc2V0QXBwZW5kcyAhPT0gdHJ1ZSkge1xuICAgICAgICBlbC52YWx1ZSA9ICcnO1xuICAgICAgfVxuICAgICAgcHJldmlvdXNTZWxlY3Rpb24gPSBzO1xuICAgICAgKHNldCB8fCBjb21wbGV0ZXIuZGVmYXVsdFNldHRlcikoZ2V0VGV4dChzKSwgcyk7XG4gICAgICBjb21wbGV0ZXIuZW1pdCgnYWZ0ZXJTZXQnKTtcbiAgICB9LFxuICAgIGZpbHRlclxuICB9KTtcbiAgcmV0dXJuIGNvbXBsZXRlcjtcbiAgZnVuY3Rpb24gbm9NYXRjaGVzIChkYXRhKSB7XG4gICAgaWYgKCFvcHRpb25zLm5vTWF0Y2hlcykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gZGF0YS5xdWVyeS5sZW5ndGg7XG4gIH1cbiAgZnVuY3Rpb24gc291cmNlRnVuY3Rpb24gKGRhdGEsIGRvbmUpIHtcbiAgICBjb25zdCB7cXVlcnksIGxpbWl0fSA9IGRhdGE7XG4gICAgaWYgKCFvcHRpb25zLmJsYW5rU2VhcmNoICYmIHF1ZXJ5Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgZG9uZShudWxsLCBbXSwgdHJ1ZSk7IHJldHVybjtcbiAgICB9XG4gICAgaWYgKGNvbXBsZXRlcikge1xuICAgICAgY29tcGxldGVyLmVtaXQoJ2JlZm9yZVVwZGF0ZScpO1xuICAgIH1cbiAgICBjb25zdCBoYXNoID0gc3VtKHF1ZXJ5KTsgLy8gZmFzdCwgY2FzZSBpbnNlbnNpdGl2ZSwgcHJldmVudHMgY29sbGlzaW9uc1xuICAgIGlmIChjYWNoaW5nKSB7XG4gICAgICBjb25zdCBlbnRyeSA9IGNhY2hlW2hhc2hdO1xuICAgICAgaWYgKGVudHJ5KSB7XG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gZW50cnkuY3JlYXRlZC5nZXRUaW1lKCk7XG4gICAgICAgIGNvbnN0IGR1cmF0aW9uID0gY2FjaGUuZHVyYXRpb24gfHwgNjAgKiA2MCAqIDI0O1xuICAgICAgICBjb25zdCBkaWZmID0gZHVyYXRpb24gKiAxMDAwO1xuICAgICAgICBjb25zdCBmcmVzaCA9IG5ldyBEYXRlKHN0YXJ0ICsgZGlmZikgPiBuZXcgRGF0ZSgpO1xuICAgICAgICBpZiAoZnJlc2gpIHtcbiAgICAgICAgICBkb25lKG51bGwsIGVudHJ5Lml0ZW1zLnNsaWNlKCkpOyByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgdmFyIHNvdXJjZURhdGEgPSB7XG4gICAgICBwcmV2aW91c1N1Z2dlc3Rpb25zOiBwcmV2aW91c1N1Z2dlc3Rpb25zLnNsaWNlKCksXG4gICAgICBwcmV2aW91c1NlbGVjdGlvbixcbiAgICAgIGlucHV0OiBxdWVyeSxcbiAgICAgIHJlbmRlckl0ZW0sXG4gICAgICByZW5kZXJDYXRlZ29yeSxcbiAgICAgIGxpbWl0XG4gICAgfTtcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMuc291cmNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBvcHRpb25zLnNvdXJjZShzb3VyY2VEYXRhLCBzb3VyY2VkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc291cmNlZChudWxsLCBvcHRpb25zLnNvdXJjZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHNvdXJjZWQgKGVyciwgcmVzdWx0KSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdBdXRvY29tcGxldGUgc291cmNlIGVycm9yLicsIGVyciwgZWwpO1xuICAgICAgICBkb25lKGVyciwgW10pO1xuICAgICAgfVxuICAgICAgY29uc3QgaXRlbXMgPSBBcnJheS5pc0FycmF5KHJlc3VsdCkgPyByZXN1bHQgOiBbXTtcbiAgICAgIGlmIChjYWNoaW5nKSB7XG4gICAgICAgIGNhY2hlW2hhc2hdID0geyBjcmVhdGVkOiBuZXcgRGF0ZSgpLCBpdGVtcyB9O1xuICAgICAgfVxuICAgICAgcHJldmlvdXNTdWdnZXN0aW9ucyA9IGl0ZW1zO1xuICAgICAgZG9uZShudWxsLCBpdGVtcy5zbGljZSgpKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gYXV0b2NvbXBsZXRlIChlbCwgb3B0aW9ucyA9IHt9KSB7XG4gIGNvbnN0IG8gPSBvcHRpb25zO1xuICBjb25zdCBwYXJlbnQgPSBvLmFwcGVuZFRvIHx8IGRvYy5ib2R5O1xuICBjb25zdCBsaXN0SWQgPSAnc2V5LWxpc3QtJyArIGxpc3RDb3VudGVyKys7XG4gIGNvbnN0IHtcbiAgICBnZXRUZXh0LFxuICAgIGdldFZhbHVlLFxuICAgIGZvcm0sXG4gICAgc291cmNlLFxuICAgIG5vTWF0Y2hlcyxcbiAgICBub01hdGNoZXNUZXh0LFxuICAgIGhpZ2hsaWdodGVyID0gdHJ1ZSxcbiAgICBoaWdobGlnaHRDb21wbGV0ZVdvcmRzID0gdHJ1ZSxcbiAgICByZW5kZXJJdGVtID0gZGVmYXVsdEl0ZW1SZW5kZXJlcixcbiAgICByZW5kZXJDYXRlZ29yeSA9IGRlZmF1bHRDYXRlZ29yeVJlbmRlcmVyLFxuICAgIHNldEFwcGVuZHNcbiAgfSA9IG87XG4gIGNvbnN0IGxpbWl0ID0gdHlwZW9mIG8ubGltaXQgPT09ICdudW1iZXInID8gby5saW1pdCA6IEluZmluaXR5O1xuICBjb25zdCB1c2VyRmlsdGVyID0gby5maWx0ZXIgfHwgZGVmYXVsdEZpbHRlcjtcbiAgY29uc3QgdXNlclNldCA9IG8uc2V0IHx8IGRlZmF1bHRTZXR0ZXI7XG4gIGNvbnN0IGNhdGVnb3JpZXMgPSB0YWcoJ2RpdicsICdzZXktY2F0ZWdvcmllcycpO1xuICBjb25zdCBjb250YWluZXIgPSB0YWcoJ2RpdicsICdzZXktY29udGFpbmVyJyk7XG4gIGNvbnN0IGRlZmVycmVkRmlsdGVyaW5nID0gZGVmZXIoZmlsdGVyaW5nKTtcbiAgY29uc3Qgc3RhdGUgPSB7IGNvdW50ZXI6IDAsIHF1ZXJ5OiBudWxsIH07XG4gIGxldCBjYXRlZ29yeU1hcCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIGxldCBzZWxlY3Rpb24gPSBudWxsO1xuICBsZXQgZXllO1xuICBsZXQgYXR0YWNobWVudCA9IGVsO1xuICBsZXQgbm9uZU1hdGNoO1xuICBsZXQgdGV4dElucHV0O1xuICBsZXQgYW55SW5wdXQ7XG4gIGxldCByYW5jaG9ybGVmdDtcbiAgbGV0IHJhbmNob3JyaWdodDtcbiAgbGV0IGxhc3RQcmVmaXggPSAnJztcbiAgY29uc3QgZGVib3VuY2VUaW1lID0gby5kZWJvdW5jZSB8fCAzMDA7XG4gIGNvbnN0IGRlYm91bmNlZExvYWRpbmcgPSBkZWJvdW5jZShsb2FkaW5nLCBkZWJvdW5jZVRpbWUpO1xuICBpZiAoby5hdXRvSGlkZU9uQmx1ciA9PT0gdm9pZCAwKSB7IG8uYXV0b0hpZGVPbkJsdXIgPSB0cnVlOyB9XG4gIGlmIChvLmF1dG9IaWRlT25DbGljayA9PT0gdm9pZCAwKSB7IG8uYXV0b0hpZGVPbkNsaWNrID0gdHJ1ZTsgfVxuICBpZiAoby5hdXRvU2hvd09uVXBEb3duID09PSB2b2lkIDApIHsgby5hdXRvU2hvd09uVXBEb3duID0gZWwudGFnTmFtZSA9PT0gJ0lOUFVUJzsgfVxuICBpZiAoby5hbmNob3IpIHtcbiAgICByYW5jaG9ybGVmdCA9IG5ldyBSZWdFeHAoJ14nICsgby5hbmNob3IpO1xuICAgIHJhbmNob3JyaWdodCA9IG5ldyBSZWdFeHAoby5hbmNob3IgKyAnJCcpO1xuICB9XG5cbiAgbGV0IGhhc0l0ZW1zID0gZmFsc2U7XG4gIGNvbnN0IGFwaSA9IGVtaXR0ZXIoe1xuICAgIGFuY2hvcjogby5hbmNob3IsXG4gICAgY2xlYXIsXG4gICAgc2hvdyxcbiAgICBoaWRlLFxuICAgIHRvZ2dsZSxcbiAgICBkZXN0cm95LFxuICAgIHJlZnJlc2hQb3NpdGlvbixcbiAgICBhcHBlbmRUZXh0LFxuICAgIGFwcGVuZEhUTUwsXG4gICAgZmlsdGVyQW5jaG9yZWRUZXh0LFxuICAgIGZpbHRlckFuY2hvcmVkSFRNTCxcbiAgICBkZWZhdWx0QXBwZW5kVGV4dDogYXBwZW5kVGV4dCxcbiAgICBkZWZhdWx0RmlsdGVyLFxuICAgIGRlZmF1bHRJdGVtUmVuZGVyZXIsXG4gICAgZGVmYXVsdENhdGVnb3J5UmVuZGVyZXIsXG4gICAgZGVmYXVsdFNldHRlcixcbiAgICByZXRhcmdldCxcbiAgICBhdHRhY2htZW50LFxuICAgIG1vdmUsXG4gICAgc291cmNlOiBbXVxuICB9KTtcblxuICByZXRhcmdldChlbCk7XG4gIGNvbnRhaW5lci5hcHBlbmRDaGlsZChjYXRlZ29yaWVzKTtcbiAgaWYgKG5vTWF0Y2hlcyAmJiBub01hdGNoZXNUZXh0KSB7XG4gICAgbm9uZU1hdGNoID0gdGFnKCdkaXYnLCAnc2V5LWVtcHR5IHNleS1oaWRlJyk7XG4gICAgdGV4dChub25lTWF0Y2gsIG5vTWF0Y2hlc1RleHQpO1xuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChub25lTWF0Y2gpO1xuICB9XG4gIHBhcmVudC5hcHBlbmRDaGlsZChjb250YWluZXIpO1xuICBlbC5zZXRBdHRyaWJ1dGUoJ2F1dG9jb21wbGV0ZScsICdvZmYnKTtcbiAgZWwuc2V0QXR0cmlidXRlKCdyb2xlJywgJ2NvbWJvYm94Jyk7XG4gIGVsLnNldEF0dHJpYnV0ZSgnYXJpYS1vd25zJywgbGlzdElkKTtcbiAgZWwuc2V0QXR0cmlidXRlKCdhcmlhLWF1dG9jb21wbGV0ZScsICdsaXN0Jyk7XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkoc291cmNlKSkge1xuICAgIGxvYWRlZChzb3VyY2UsIGZhbHNlKTtcbiAgfVxuXG4gIHJldHVybiBhcGk7XG5cbiAgZnVuY3Rpb24gcmV0YXJnZXQgKGVsKSB7XG4gICAgaW5wdXRFdmVudHModHJ1ZSk7XG4gICAgYXR0YWNobWVudCA9IGFwaS5hdHRhY2htZW50ID0gZWw7XG4gICAgdGV4dElucHV0ID0gYXR0YWNobWVudC50YWdOYW1lID09PSAnSU5QVVQnIHx8IGF0dGFjaG1lbnQudGFnTmFtZSA9PT0gJ1RFWFRBUkVBJztcbiAgICBhbnlJbnB1dCA9IHRleHRJbnB1dCB8fCBpc0VkaXRhYmxlKGF0dGFjaG1lbnQpO1xuICAgIGlucHV0RXZlbnRzKCk7XG4gIH1cblxuICBmdW5jdGlvbiByZWZyZXNoUG9zaXRpb24gKCkge1xuICAgIGlmIChleWUpIHsgZXllLnJlZnJlc2goKTsgfVxuICB9XG5cbiAgZnVuY3Rpb24gbG9hZGluZyAoZm9yY2VTaG93KSB7XG4gICAgaWYgKHR5cGVvZiBzb3VyY2UgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY3Jvc3N2ZW50LnJlbW92ZShhdHRhY2htZW50LCAnZm9jdXMnLCBsb2FkaW5nKTtcbiAgICBjb25zdCBxdWVyeSA9IHJlYWRJbnB1dCgpO1xuICAgIGlmIChxdWVyeSA9PT0gc3RhdGUucXVlcnkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaGFzSXRlbXMgPSBmYWxzZTtcbiAgICBzdGF0ZS5xdWVyeSA9IHF1ZXJ5O1xuXG4gICAgY29uc3QgY291bnRlciA9ICsrc3RhdGUuY291bnRlcjtcblxuICAgIHNvdXJjZSh7IHF1ZXJ5LCBsaW1pdCB9LCBzb3VyY2VkKTtcblxuICAgIGZ1bmN0aW9uIHNvdXJjZWQgKGVyciwgcmVzdWx0LCBibGFua1F1ZXJ5KSB7XG4gICAgICBpZiAoc3RhdGUuY291bnRlciAhPT0gY291bnRlcikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsb2FkZWQocmVzdWx0LCBmb3JjZVNob3cpO1xuICAgICAgaWYgKGVyciB8fCBibGFua1F1ZXJ5KSB7XG4gICAgICAgIGhhc0l0ZW1zID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gbG9hZGVkIChjYXRlZ29yaWVzLCBmb3JjZVNob3cpIHtcbiAgICBjbGVhcigpO1xuICAgIGhhc0l0ZW1zID0gdHJ1ZTtcbiAgICBhcGkuc291cmNlID0gW107XG4gICAgY2F0ZWdvcmllcy5mb3JFYWNoKGNhdCA9PiBjYXQubGlzdC5mb3JFYWNoKHN1Z2dlc3Rpb24gPT4gYWRkKHN1Z2dlc3Rpb24sIGNhdCkpKTtcbiAgICBpZiAoZm9yY2VTaG93KSB7XG4gICAgICBzaG93KCk7XG4gICAgfVxuICAgIGZpbHRlcmluZygpO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xlYXIgKCkge1xuICAgIHVuc2VsZWN0KCk7XG4gICAgd2hpbGUgKGNhdGVnb3JpZXMubGFzdENoaWxkKSB7XG4gICAgICBjYXRlZ29yaWVzLnJlbW92ZUNoaWxkKGNhdGVnb3JpZXMubGFzdENoaWxkKTtcbiAgICB9XG4gICAgY2F0ZWdvcnlNYXAgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIGhhc0l0ZW1zID0gZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiByZWFkSW5wdXQgKCkge1xuICAgIHJldHVybiAodGV4dElucHV0ID8gZWwudmFsdWUgOiBlbC5pbm5lckhUTUwpLnRyaW0oKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldENhdGVnb3J5IChkYXRhKSB7XG4gICAgaWYgKCFkYXRhLmlkKSB7XG4gICAgICBkYXRhLmlkID0gJ2RlZmF1bHQnO1xuICAgIH1cbiAgICBpZiAoIWNhdGVnb3J5TWFwW2RhdGEuaWRdKSB7XG4gICAgICBjYXRlZ29yeU1hcFtkYXRhLmlkXSA9IGNyZWF0ZUNhdGVnb3J5KCk7XG4gICAgfVxuICAgIHJldHVybiBjYXRlZ29yeU1hcFtkYXRhLmlkXTtcbiAgICBmdW5jdGlvbiBjcmVhdGVDYXRlZ29yeSAoKSB7XG4gICAgICBjb25zdCBjYXRlZ29yeSA9IHRhZygnZGl2JywgJ3NleS1jYXRlZ29yeScpO1xuICAgICAgY29uc3QgdWwgPSB0YWcoJ3VsJywgJ3NleS1saXN0Jyk7XG4gICAgICB1bC5zZXRBdHRyaWJ1dGUoJ2lkJywgbGlzdElkKTtcbiAgICAgIHVsLnNldEF0dHJpYnV0ZSgncm9sZScsICdsaXN0Ym94Jyk7XG4gICAgICByZW5kZXJDYXRlZ29yeShjYXRlZ29yeSwgZGF0YSk7XG4gICAgICBjYXRlZ29yeS5hcHBlbmRDaGlsZCh1bCk7XG4gICAgICBjYXRlZ29yaWVzLmFwcGVuZENoaWxkKGNhdGVnb3J5KTtcbiAgICAgIHJldHVybiB7IGRhdGEsIHVsIH07XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gYWRkIChzdWdnZXN0aW9uLCBjYXRlZ29yeURhdGEpIHtcbiAgICBjb25zdCBjYXQgPSBnZXRDYXRlZ29yeShjYXRlZ29yeURhdGEpO1xuICAgIGNvbnN0IGxpID0gdGFnKCdsaScsICdzZXktaXRlbScpO1xuICAgIGNvbnN0IHN1Z2dlc3Rpb25JZCA9IGxpc3RJZCArICctJyArIChzdWdnZXN0aW9uLnZhbHVlIHx8IHN1Z2dlc3Rpb24pO1xuICAgIHJlbmRlckl0ZW0obGksIHN1Z2dlc3Rpb24pO1xuICAgIGlmIChoaWdobGlnaHRlcikge1xuICAgICAgYnJlYWt1cEZvckhpZ2hsaWdodGVyKGxpKTtcbiAgICB9XG4gICAgY3Jvc3N2ZW50LmFkZChsaSwgJ21vdXNlZW50ZXInLCBob3ZlclN1Z2dlc3Rpb24pO1xuICAgIGNyb3NzdmVudC5hZGQobGksICdjbGljaycsIGNsaWNrZWRTdWdnZXN0aW9uKTtcbiAgICBjcm9zc3ZlbnQuYWRkKGxpLCAnaG9yc2V5LWZpbHRlcicsIGZpbHRlckl0ZW0pO1xuICAgIGNyb3NzdmVudC5hZGQobGksICdob3JzZXktaGlkZScsIGhpZGVJdGVtKTtcbiAgICBsaS5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCAnb3B0aW9uJyk7XG4gICAgbGkuc2V0QXR0cmlidXRlKCdpZCcsIHN1Z2dlc3Rpb25JZCk7XG4gICAgY2F0LnVsLmFwcGVuZENoaWxkKGxpKTtcbiAgICBhcGkuc291cmNlLnB1c2goc3VnZ2VzdGlvbik7XG4gICAgcmV0dXJuIGxpO1xuXG4gICAgZnVuY3Rpb24gaG92ZXJTdWdnZXN0aW9uICgpIHtcbiAgICAgIHNlbGVjdChsaSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2xpY2tlZFN1Z2dlc3Rpb24gKCkge1xuICAgICAgY29uc3QgaW5wdXQgPSBnZXRUZXh0KHN1Z2dlc3Rpb24pO1xuICAgICAgc2V0KHN1Z2dlc3Rpb24pO1xuICAgICAgaGlkZSgpO1xuICAgICAgYXR0YWNobWVudC5mb2N1cygpO1xuICAgICAgbGFzdFByZWZpeCA9IG8ucHJlZGljdE5leHRTZWFyY2ggJiYgby5wcmVkaWN0TmV4dFNlYXJjaCh7XG4gICAgICAgIGlucHV0OiBpbnB1dCxcbiAgICAgICAgc291cmNlOiBhcGkuc291cmNlLnNsaWNlKCksXG4gICAgICAgIHNlbGVjdGlvbjogc3VnZ2VzdGlvblxuICAgICAgfSkgfHwgJyc7XG4gICAgICBpZiAobGFzdFByZWZpeCkge1xuICAgICAgICBlbC52YWx1ZSA9IGxhc3RQcmVmaXg7XG4gICAgICAgIGVsLnNlbGVjdCgpO1xuICAgICAgICBzaG93KCk7XG4gICAgICAgIGZpbHRlcmluZygpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZpbHRlckl0ZW0gKCkge1xuICAgICAgY29uc3QgdmFsdWUgPSByZWFkSW5wdXQoKTtcbiAgICAgIGlmIChmaWx0ZXIodmFsdWUsIHN1Z2dlc3Rpb24pKSB7XG4gICAgICAgIGxpLmNsYXNzTmFtZSA9IGxpLmNsYXNzTmFtZS5yZXBsYWNlKC8gc2V5LWhpZGUvZywgJycpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY3Jvc3N2ZW50LmZhYnJpY2F0ZShsaSwgJ2hvcnNleS1oaWRlJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGlkZUl0ZW0gKCkge1xuICAgICAgaWYgKCFoaWRkZW4obGkpKSB7XG4gICAgICAgIGxpLmNsYXNzTmFtZSArPSAnIHNleS1oaWRlJztcbiAgICAgICAgaWYgKHNlbGVjdGlvbiA9PT0gbGkpIHtcbiAgICAgICAgICB1bnNlbGVjdCgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gYnJlYWt1cEZvckhpZ2hsaWdodGVyIChlbCkge1xuICAgIGdldFRleHRDaGlsZHJlbihlbCkuZm9yRWFjaChlbCA9PiB7XG4gICAgICBjb25zdCBwYXJlbnQgPSBlbC5wYXJlbnRFbGVtZW50IHx8IGVsLnBhcmVudE5vZGU7XG4gICAgICBjb25zdCB0ZXh0ID0gZWwudGV4dENvbnRlbnQgfHwgZWwubm9kZVZhbHVlIHx8ICcnO1xuICAgICAgaWYgKHRleHQubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGZvciAobGV0IGkgPSAwLCBjaGFycyA9IHRleHQuc3BsaXQoJycpOyBpIDwgY2hhcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZShzcGFuRm9yKGNoYXJzW2ldKSwgZWwpO1xuICAgICAgfVxuICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKGVsKTtcbiAgICAgIGZ1bmN0aW9uIHNwYW5Gb3IgKGNoYXIpIHtcbiAgICAgICAgY29uc3Qgc3BhbiA9IGRvYy5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgIHNwYW4uY2xhc3NOYW1lID0gJ3NleS1jaGFyJztcbiAgICAgICAgc3Bhbi50ZXh0Q29udGVudCA9IHNwYW4uaW5uZXJUZXh0ID0gY2hhcjtcbiAgICAgICAgcmV0dXJuIHNwYW47XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBoaWdobGlnaHQgKGVsLCBuZWVkbGUpIHtcbiAgICBjb25zdCByd29yZCA9IC9bXFxzLC5fXFxbXFxde30oKS1dL2c7XG4gICAgY29uc3Qgd29yZHMgPSBuZWVkbGUuc3BsaXQocndvcmQpLmZpbHRlcih3ID0+IHcubGVuZ3RoKTtcbiAgICBjb25zdCBlbGVtcyA9IFtdLnNsaWNlLmNhbGwoZWwucXVlcnlTZWxlY3RvckFsbCgnLnNleS1jaGFyJykpO1xuICAgIGxldCBjaGFycztcbiAgICBsZXQgc3RhcnRJbmRleCA9IDA7XG5cbiAgICBiYWxhbmNlKCk7XG4gICAgaWYgKGhpZ2hsaWdodENvbXBsZXRlV29yZHMpIHtcbiAgICAgIHdob2xlKCk7XG4gICAgfVxuICAgIGZ1enp5KCk7XG4gICAgY2xlYXJSZW1haW5kZXIoKTtcblxuICAgIGZ1bmN0aW9uIGJhbGFuY2UgKCkge1xuICAgICAgY2hhcnMgPSBlbGVtcy5tYXAoZWwgPT4gZWwuaW5uZXJUZXh0IHx8IGVsLnRleHRDb250ZW50KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB3aG9sZSAoKSB7XG4gICAgICBmb3IgKGxldCB3b3JkSW5kZXggPSAwLCB3b3JkOyB3b3JkSW5kZXggPCB3b3Jkcy5sZW5ndGg7IHdvcmRJbmRleCsrKSB7XG4gICAgICAgIGNvbnN0IHdvcmQgPSB3b3Jkc1t3b3JkSW5kZXhdO1xuICAgICAgICBsZXQgdGVtcEluZGV4ID0gc3RhcnRJbmRleDtcbiAgICAgICAgcmV0cnk6IHdoaWxlICh0ZW1wSW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgbGV0IGluaXQgPSB0cnVlO1xuICAgICAgICAgIGxldCBwcmV2SW5kZXggPSB0ZW1wSW5kZXg7XG4gICAgICAgICAgZm9yIChsZXQgY2hhckluZGV4ID0gMCwgY2hhcnMgPSB3b3JkLnNwbGl0KCcnKTsgY2hhckluZGV4IDwgY2hhcnMubGVuZ3RoOyBjaGFySW5kZXgrKykge1xuICAgICAgICAgICAgY29uc3QgY2hhciA9IGNoYXJzW2NoYXJJbmRleF07XG4gICAgICAgICAgICBjb25zdCBpID0gY2hhcnMuaW5kZXhPZihjaGFyLCBwcmV2SW5kZXggKyAxKTtcbiAgICAgICAgICAgIGNvbnN0IGZhaWwgPSBpID09PSAtMSB8fCAoIWluaXQgJiYgcHJldkluZGV4ICsgMSAhPT0gaSk7XG4gICAgICAgICAgICBpZiAoaW5pdCkge1xuICAgICAgICAgICAgICBpbml0ID0gZmFsc2U7XG4gICAgICAgICAgICAgIHRlbXBJbmRleCA9IGk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZmFpbCkge1xuICAgICAgICAgICAgICBjb250aW51ZSByZXRyeTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHByZXZJbmRleCA9IGk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGZvciAobGV0IGVsZW1JbmRleCA9IDAsIG1hdGNoZWRFbGVtcyA9IGVsZW1zLnNwbGljZSh0ZW1wSW5kZXgsIDEgKyBwcmV2SW5kZXggLSB0ZW1wSW5kZXgpOyBlbGVtSW5kZXggPCBtYXRjaGVkRWxlbXMubGVuZ3RoOyBlbGVtSW5kZXgrKykge1xuICAgICAgICAgICAgb24obWF0Y2hlZEVsZW1zW2VsZW1JbmRleF0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBiYWxhbmNlKCk7XG4gICAgICAgICAgbmVlZGxlID0gbmVlZGxlLnJlcGxhY2Uod29yZCwgJycpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZnV6enkgKCkge1xuICAgICAgZm9yIChsZXQgaSA9IDAsIGNoYXJzID0gbmVlZGxlLnNwbGl0KCcnKTsgaSA8IGNoYXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHdoaWxlIChlbGVtcy5sZW5ndGgpIHtcbiAgICAgICAgICBsZXQgZWwgPSBlbGVtcy5zaGlmdCgpO1xuICAgICAgICAgIGlmICgoZWwuaW5uZXJUZXh0IHx8IGVsLnRleHRDb250ZW50KSA9PT0gY2hhcnNbaV0pIHtcbiAgICAgICAgICAgIG9uKGVsKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvZmYoZWwpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNsZWFyUmVtYWluZGVyICgpIHtcbiAgICAgIHdoaWxlIChlbGVtcy5sZW5ndGgpIHtcbiAgICAgICAgb2ZmKGVsZW1zLnNoaWZ0KCkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG9uIChjaCkge1xuICAgICAgY2guY2xhc3NMaXN0LmFkZCgnc2V5LWNoYXItaGlnaGxpZ2h0Jyk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG9mZiAoY2gpIHtcbiAgICAgIGNoLmNsYXNzTGlzdC5yZW1vdmUoJ3NleS1jaGFyLWhpZ2hsaWdodCcpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFRleHRDaGlsZHJlbiAoZWwpIHtcbiAgICBjb25zdCB0ZXh0cyA9IFtdO1xuICAgIGNvbnN0IHdhbGtlciA9IGRvY3VtZW50LmNyZWF0ZVRyZWVXYWxrZXIoZWwsIE5vZGVGaWx0ZXIuU0hPV19URVhULCBudWxsLCBmYWxzZSk7XG4gICAgbGV0IG5vZGU7XG4gICAgd2hpbGUgKG5vZGUgPSB3YWxrZXIubmV4dE5vZGUoKSkge1xuICAgICAgdGV4dHMucHVzaChub2RlKTtcbiAgICB9XG4gICAgcmV0dXJuIHRleHRzO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0ICh2YWx1ZSkge1xuICAgIGlmIChvLmFuY2hvcikge1xuICAgICAgcmV0dXJuIChpc1RleHQoKSA/IGFwaS5hcHBlbmRUZXh0IDogYXBpLmFwcGVuZEhUTUwpKGdldFZhbHVlKHZhbHVlKSk7XG4gICAgfVxuICAgIHVzZXJTZXQodmFsdWUpO1xuICB9XG5cbiAgZnVuY3Rpb24gZmlsdGVyICh2YWx1ZSwgc3VnZ2VzdGlvbikge1xuICAgIGlmIChvLmFuY2hvcikge1xuICAgICAgY29uc3QgaWwgPSAoaXNUZXh0KCkgPyBhcGkuZmlsdGVyQW5jaG9yZWRUZXh0IDogYXBpLmZpbHRlckFuY2hvcmVkSFRNTCkodmFsdWUsIHN1Z2dlc3Rpb24pO1xuICAgICAgcmV0dXJuIGlsID8gdXNlckZpbHRlcihpbC5pbnB1dCwgaWwuc3VnZ2VzdGlvbikgOiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHVzZXJGaWx0ZXIodmFsdWUsIHN1Z2dlc3Rpb24pO1xuICB9XG5cbiAgZnVuY3Rpb24gaXNUZXh0ICgpIHsgcmV0dXJuIGlzSW5wdXQoYXR0YWNobWVudCk7IH1cbiAgZnVuY3Rpb24gdmlzaWJsZSAoKSB7IHJldHVybiBjb250YWluZXIuY2xhc3NOYW1lLmluZGV4T2YoJ3NleS1zaG93JykgIT09IC0xOyB9XG4gIGZ1bmN0aW9uIGhpZGRlbiAobGkpIHsgcmV0dXJuIGxpLmNsYXNzTmFtZS5pbmRleE9mKCdzZXktaGlkZScpICE9PSAtMTsgfVxuXG4gIGZ1bmN0aW9uIHNob3cgKCkge1xuICAgIGV5ZS5yZWZyZXNoKCk7XG4gICAgaWYgKCF2aXNpYmxlKCkpIHtcbiAgICAgIGNvbnRhaW5lci5jbGFzc05hbWUgKz0gJyBzZXktc2hvdyc7XG4gICAgICBjcm9zc3ZlbnQuZmFicmljYXRlKGF0dGFjaG1lbnQsICdob3JzZXktc2hvdycpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHRvZ2dsZXIgKGUpIHtcbiAgICBjb25zdCBsZWZ0ID0gZS53aGljaCA9PT0gMSAmJiAhZS5tZXRhS2V5ICYmICFlLmN0cmxLZXk7XG4gICAgaWYgKGxlZnQgPT09IGZhbHNlKSB7XG4gICAgICByZXR1cm47IC8vIHdlIG9ubHkgY2FyZSBhYm91dCBob25lc3QgdG8gZ29kIGxlZnQtY2xpY2tzXG4gICAgfVxuICAgIHRvZ2dsZSgpO1xuICB9XG5cbiAgZnVuY3Rpb24gdG9nZ2xlICgpIHtcbiAgICBpZiAoIXZpc2libGUoKSkge1xuICAgICAgc2hvdygpO1xuICAgIH0gZWxzZSB7XG4gICAgICBoaWRlKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2VsZWN0IChsaSkge1xuICAgIHVuc2VsZWN0KCk7XG4gICAgaWYgKGxpKSB7XG4gICAgICBzZWxlY3Rpb24gPSBsaTtcbiAgICAgIHNlbGVjdGlvbi5jbGFzc05hbWUgKz0gJyBzZXktc2VsZWN0ZWQnO1xuICAgICAgZWwuc2V0QXR0cmlidXRlKCdhcmlhLWFjdGl2ZWRlc2NlbmRhbnQnLCBzZWxlY3Rpb24uZ2V0QXR0cmlidXRlKCdpZCcpKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB1bnNlbGVjdCAoKSB7XG4gICAgaWYgKHNlbGVjdGlvbikge1xuICAgICAgc2VsZWN0aW9uLmNsYXNzTmFtZSA9IHNlbGVjdGlvbi5jbGFzc05hbWUucmVwbGFjZSgvIHNleS1zZWxlY3RlZC9nLCAnJyk7XG4gICAgICBzZWxlY3Rpb24gPSBudWxsO1xuICAgICAgZWwucmVtb3ZlQXR0cmlidXRlKCdhcmlhLWFjdGl2ZWRlc2NlbmRhbnQnKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBtb3ZlICh1cCwgbW92ZXMpIHtcbiAgICBjb25zdCB0b3RhbCA9IGFwaS5zb3VyY2UubGVuZ3RoO1xuICAgIGlmICh0b3RhbCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAobW92ZXMgPiB0b3RhbCkge1xuICAgICAgdW5zZWxlY3QoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgY2F0ID0gZmluZENhdGVnb3J5KHNlbGVjdGlvbikgfHwgY2F0ZWdvcmllcy5maXJzdENoaWxkO1xuICAgIGNvbnN0IGZpcnN0ID0gdXAgPyAnbGFzdENoaWxkJyA6ICdmaXJzdENoaWxkJztcbiAgICBjb25zdCBsYXN0ID0gdXAgPyAnZmlyc3RDaGlsZCcgOiAnbGFzdENoaWxkJztcbiAgICBjb25zdCBuZXh0ID0gdXAgPyAncHJldmlvdXNTaWJsaW5nJyA6ICduZXh0U2libGluZyc7XG4gICAgY29uc3QgcHJldiA9IHVwID8gJ25leHRTaWJsaW5nJyA6ICdwcmV2aW91c1NpYmxpbmcnO1xuICAgIGNvbnN0IGxpID0gZmluZE5leHQoKTtcbiAgICBzZWxlY3QobGkpO1xuXG4gICAgaWYgKGhpZGRlbihsaSkpIHtcbiAgICAgIG1vdmUodXAsIG1vdmVzID8gbW92ZXMgKyAxIDogMSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNyb3NzdmVudC5mYWJyaWNhdGUoYXR0YWNobWVudCwgJ2hvcnNleS1saS1zZWxlY3RlZCcsIHtzZWxlY3RlZDogbGl9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmaW5kQ2F0ZWdvcnkgKGVsKSB7XG4gICAgICB3aGlsZSAoZWwpIHtcbiAgICAgICAgaWYgKHNla3Rvci5tYXRjaGVzU2VsZWN0b3IoZWwucGFyZW50RWxlbWVudCwgJy5zZXktY2F0ZWdvcnknKSkge1xuICAgICAgICAgIHJldHVybiBlbC5wYXJlbnRFbGVtZW50O1xuICAgICAgICB9XG4gICAgICAgIGVsID0gZWwucGFyZW50RWxlbWVudDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZpbmROZXh0ICgpIHtcbiAgICAgIGlmIChzZWxlY3Rpb24pIHtcbiAgICAgICAgaWYgKHNlbGVjdGlvbltuZXh0XSkge1xuICAgICAgICAgIHJldHVybiBzZWxlY3Rpb25bbmV4dF07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNhdFtuZXh0XSAmJiBmaW5kTGlzdChjYXRbbmV4dF0pW2ZpcnN0XSkge1xuICAgICAgICAgIHJldHVybiBmaW5kTGlzdChjYXRbbmV4dF0pW2ZpcnN0XTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZpbmRMaXN0KGNhdGVnb3JpZXNbZmlyc3RdKVtmaXJzdF07XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaGlkZSAoKSB7XG4gICAgZXllLnNsZWVwKCk7XG4gICAgY29udGFpbmVyLmNsYXNzTmFtZSA9IGNvbnRhaW5lci5jbGFzc05hbWUucmVwbGFjZSgvIHNleS1zaG93L2csICcnKTtcbiAgICB1bnNlbGVjdCgpO1xuICAgIGNyb3NzdmVudC5mYWJyaWNhdGUoYXR0YWNobWVudCwgJ2hvcnNleS1oaWRlJyk7XG4gICAgaWYgKGVsLnZhbHVlID09PSBsYXN0UHJlZml4KSB7XG4gICAgICBlbC52YWx1ZSA9ICcnO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGtleWRvd24gKGUpIHtcbiAgICBjb25zdCBzaG93biA9IHZpc2libGUoKTtcbiAgICBjb25zdCB3aGljaCA9IGUud2hpY2ggfHwgZS5rZXlDb2RlO1xuICAgIGlmICh3aGljaCA9PT0gS0VZX0RPV04pIHtcbiAgICAgIGlmIChhbnlJbnB1dCAmJiBvLmF1dG9TaG93T25VcERvd24pIHtcbiAgICAgICAgc2hvdygpO1xuICAgICAgfVxuICAgICAgaWYgKHNob3duKSB7XG4gICAgICAgIG1vdmUoKTtcbiAgICAgICAgc3RvcChlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHdoaWNoID09PSBLRVlfVVApIHtcbiAgICAgIGlmIChhbnlJbnB1dCAmJiBvLmF1dG9TaG93T25VcERvd24pIHtcbiAgICAgICAgc2hvdygpO1xuICAgICAgfVxuICAgICAgaWYgKHNob3duKSB7XG4gICAgICAgIG1vdmUodHJ1ZSk7XG4gICAgICAgIHN0b3AoZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh3aGljaCA9PT0gS0VZX0JBQ0tTUEFDRSkge1xuICAgICAgaWYgKGFueUlucHV0ICYmIG8uYXV0b1Nob3dPblVwRG93bikge1xuICAgICAgICBzaG93KCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChzaG93bikge1xuICAgICAgaWYgKHdoaWNoID09PSBLRVlfRU5URVIpIHtcbiAgICAgICAgaWYgKHNlbGVjdGlvbikge1xuICAgICAgICAgIGNyb3NzdmVudC5mYWJyaWNhdGUoc2VsZWN0aW9uLCAnY2xpY2snKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBoaWRlKCk7XG4gICAgICAgIH1cbiAgICAgICAgc3RvcChlKTtcbiAgICAgIH0gZWxzZSBpZiAod2hpY2ggPT09IEtFWV9FU0MpIHtcbiAgICAgICAgaGlkZSgpO1xuICAgICAgICBzdG9wKGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHN0b3AgKGUpIHtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dOb1Jlc3VsdHMgKCkge1xuICAgIGlmIChub25lTWF0Y2gpIHtcbiAgICAgIG5vbmVNYXRjaC5jbGFzc0xpc3QucmVtb3ZlKCdzZXktaGlkZScpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGhpZGVOb1Jlc3VsdHMgKCkge1xuICAgIGlmIChub25lTWF0Y2gpIHtcbiAgICAgIG5vbmVNYXRjaC5jbGFzc0xpc3QuYWRkKCdzZXktaGlkZScpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbHRlcmluZyAoKSB7XG4gICAgaWYgKCF2aXNpYmxlKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZGVib3VuY2VkTG9hZGluZyh0cnVlKTtcbiAgICBjcm9zc3ZlbnQuZmFicmljYXRlKGF0dGFjaG1lbnQsICdob3JzZXktZmlsdGVyJyk7XG4gICAgY29uc3QgdmFsdWUgPSByZWFkSW5wdXQoKTtcbiAgICBpZiAoIW8uYmxhbmtTZWFyY2ggJiYgIXZhbHVlKSB7XG4gICAgICBoaWRlKCk7IHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgbm9tYXRjaCA9IG5vTWF0Y2hlcyh7IHF1ZXJ5OiB2YWx1ZSB9KTtcbiAgICBsZXQgY291bnQgPSB3YWxrQ2F0ZWdvcmllcygpO1xuICAgIGlmIChjb3VudCA9PT0gMCAmJiBub21hdGNoICYmIGhhc0l0ZW1zKSB7XG4gICAgICBzaG93Tm9SZXN1bHRzKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGhpZGVOb1Jlc3VsdHMoKTtcbiAgICB9XG4gICAgaWYgKCFzZWxlY3Rpb24pIHtcbiAgICAgIG1vdmUoKTtcbiAgICB9XG4gICAgaWYgKCFzZWxlY3Rpb24gJiYgIW5vbWF0Y2gpIHtcbiAgICAgIGhpZGUoKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gd2Fsa0NhdGVnb3JpZXMgKCkge1xuICAgICAgbGV0IGNhdGVnb3J5ID0gY2F0ZWdvcmllcy5maXJzdENoaWxkO1xuICAgICAgbGV0IGNvdW50ID0gMDtcbiAgICAgIHdoaWxlIChjYXRlZ29yeSkge1xuICAgICAgICBjb25zdCBsaXN0ID0gZmluZExpc3QoY2F0ZWdvcnkpO1xuICAgICAgICBjb25zdCBwYXJ0aWFsID0gd2Fsa0NhdGVnb3J5KGxpc3QpO1xuICAgICAgICBpZiAocGFydGlhbCA9PT0gMCkge1xuICAgICAgICAgIGNhdGVnb3J5LmNsYXNzTGlzdC5hZGQoJ3NleS1oaWRlJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY2F0ZWdvcnkuY2xhc3NMaXN0LnJlbW92ZSgnc2V5LWhpZGUnKTtcbiAgICAgICAgfVxuICAgICAgICBjb3VudCArPSBwYXJ0aWFsO1xuICAgICAgICBjYXRlZ29yeSA9IGNhdGVnb3J5Lm5leHRTaWJsaW5nO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNvdW50O1xuICAgIH1cbiAgICBmdW5jdGlvbiB3YWxrQ2F0ZWdvcnkgKHVsKSB7XG4gICAgICBsZXQgbGkgPSB1bC5maXJzdENoaWxkO1xuICAgICAgbGV0IGNvdW50ID0gMDtcbiAgICAgIHdoaWxlIChsaSkge1xuICAgICAgICBpZiAoY291bnQgPj0gbGltaXQpIHtcbiAgICAgICAgICBjcm9zc3ZlbnQuZmFicmljYXRlKGxpLCAnaG9yc2V5LWhpZGUnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjcm9zc3ZlbnQuZmFicmljYXRlKGxpLCAnaG9yc2V5LWZpbHRlcicpO1xuICAgICAgICAgIGlmIChsaS5jbGFzc05hbWUuaW5kZXhPZignc2V5LWhpZGUnKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIGNvdW50Kys7XG4gICAgICAgICAgICBpZiAoaGlnaGxpZ2h0ZXIpIHtcbiAgICAgICAgICAgICAgaGlnaGxpZ2h0KGxpLCB2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGxpID0gbGkubmV4dFNpYmxpbmc7XG4gICAgICB9XG4gICAgICByZXR1cm4gY291bnQ7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZGVmZXJyZWRGaWx0ZXJpbmdOb0VudGVyIChlKSB7XG4gICAgY29uc3Qgd2hpY2ggPSBlLndoaWNoIHx8IGUua2V5Q29kZTtcbiAgICBpZiAod2hpY2ggPT09IEtFWV9FTlRFUikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkZWZlcnJlZEZpbHRlcmluZygpO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVmZXJyZWRTaG93IChlKSB7XG4gICAgY29uc3Qgd2hpY2ggPSBlLndoaWNoIHx8IGUua2V5Q29kZTtcbiAgICBpZiAod2hpY2ggPT09IEtFWV9FTlRFUiB8fCB3aGljaCA9PT0gS0VZX1RBQikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzZXRUaW1lb3V0KHNob3csIDApO1xuICB9XG5cbiAgZnVuY3Rpb24gYXV0b2NvbXBsZXRlRXZlbnRUYXJnZXQgKGUpIHtcbiAgICBsZXQgdGFyZ2V0ID0gZS50YXJnZXQ7XG4gICAgaWYgKHRhcmdldCA9PT0gYXR0YWNobWVudCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHdoaWxlICh0YXJnZXQpIHtcbiAgICAgIGlmICh0YXJnZXQgPT09IGNvbnRhaW5lciB8fCB0YXJnZXQgPT09IGF0dGFjaG1lbnQpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICB0YXJnZXQgPSB0YXJnZXQucGFyZW50Tm9kZTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBoaWRlT25CbHVyIChlKSB7XG4gICAgY29uc3Qgd2hpY2ggPSBlLndoaWNoIHx8IGUua2V5Q29kZTtcbiAgICBpZiAod2hpY2ggPT09IEtFWV9UQUIpIHtcbiAgICAgIGhpZGUoKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBoaWRlT25DbGljayAoZSkge1xuICAgIGlmIChhdXRvY29tcGxldGVFdmVudFRhcmdldChlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBoaWRlKCk7XG4gIH1cblxuICBmdW5jdGlvbiBpbnB1dEV2ZW50cyAocmVtb3ZlKSB7XG4gICAgY29uc3Qgb3AgPSByZW1vdmUgPyAncmVtb3ZlJyA6ICdhZGQnO1xuICAgIGlmIChleWUpIHtcbiAgICAgIGV5ZS5kZXN0cm95KCk7XG4gICAgICBleWUgPSBudWxsO1xuICAgIH1cbiAgICBpZiAoIXJlbW92ZSkge1xuICAgICAgZXllID0gYnVsbHNleWUoY29udGFpbmVyLCBhdHRhY2htZW50LCB7XG4gICAgICAgIGNhcmV0OiBhbnlJbnB1dCAmJiBhdHRhY2htZW50LnRhZ05hbWUgIT09ICdJTlBVVCcsXG4gICAgICAgIGNvbnRleHQ6IG8uYXBwZW5kVG9cbiAgICAgIH0pO1xuICAgICAgaWYgKCF2aXNpYmxlKCkpIHsgZXllLnNsZWVwKCk7IH1cbiAgICB9XG4gICAgaWYgKHJlbW92ZSB8fCAoYW55SW5wdXQgJiYgZG9jLmFjdGl2ZUVsZW1lbnQgIT09IGF0dGFjaG1lbnQpKSB7XG4gICAgICBjcm9zc3ZlbnRbb3BdKGF0dGFjaG1lbnQsICdmb2N1cycsIGxvYWRpbmcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsb2FkaW5nKCk7XG4gICAgfVxuICAgIGlmIChhbnlJbnB1dCkge1xuICAgICAgY3Jvc3N2ZW50W29wXShhdHRhY2htZW50LCAna2V5cHJlc3MnLCBkZWZlcnJlZFNob3cpO1xuICAgICAgY3Jvc3N2ZW50W29wXShhdHRhY2htZW50LCAna2V5cHJlc3MnLCBkZWZlcnJlZEZpbHRlcmluZyk7XG4gICAgICBjcm9zc3ZlbnRbb3BdKGF0dGFjaG1lbnQsICdrZXlkb3duJywgZGVmZXJyZWRGaWx0ZXJpbmdOb0VudGVyKTtcbiAgICAgIGNyb3NzdmVudFtvcF0oYXR0YWNobWVudCwgJ3Bhc3RlJywgZGVmZXJyZWRGaWx0ZXJpbmcpO1xuICAgICAgY3Jvc3N2ZW50W29wXShhdHRhY2htZW50LCAna2V5ZG93bicsIGtleWRvd24pO1xuICAgICAgaWYgKG8uYXV0b0hpZGVPbkJsdXIpIHsgY3Jvc3N2ZW50W29wXShhdHRhY2htZW50LCAna2V5ZG93bicsIGhpZGVPbkJsdXIpOyB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNyb3NzdmVudFtvcF0oYXR0YWNobWVudCwgJ2NsaWNrJywgdG9nZ2xlcik7XG4gICAgICBjcm9zc3ZlbnRbb3BdKGRvY0VsZW1lbnQsICdrZXlkb3duJywga2V5ZG93bik7XG4gICAgfVxuICAgIGlmIChvLmF1dG9IaWRlT25DbGljaykgeyBjcm9zc3ZlbnRbb3BdKGRvYywgJ2NsaWNrJywgaGlkZU9uQ2xpY2spOyB9XG4gICAgaWYgKGZvcm0pIHsgY3Jvc3N2ZW50W29wXShmb3JtLCAnc3VibWl0JywgaGlkZSk7IH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGRlc3Ryb3kgKCkge1xuICAgIGlucHV0RXZlbnRzKHRydWUpO1xuICAgIGlmIChwYXJlbnQuY29udGFpbnMoY29udGFpbmVyKSkgeyBwYXJlbnQucmVtb3ZlQ2hpbGQoY29udGFpbmVyKTsgfVxuICB9XG5cbiAgZnVuY3Rpb24gZGVmYXVsdFNldHRlciAodmFsdWUpIHtcbiAgICBpZiAodGV4dElucHV0KSB7XG4gICAgICBpZiAoc2V0QXBwZW5kcyA9PT0gdHJ1ZSkge1xuICAgICAgICBlbC52YWx1ZSArPSAnICcgKyB2YWx1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsLnZhbHVlID0gdmFsdWU7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChzZXRBcHBlbmRzID09PSB0cnVlKSB7XG4gICAgICAgIGVsLmlubmVySFRNTCArPSAnICcgKyB2YWx1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsLmlubmVySFRNTCA9IHZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGRlZmF1bHRJdGVtUmVuZGVyZXIgKGxpLCBzdWdnZXN0aW9uKSB7XG4gICAgdGV4dChsaSwgZ2V0VGV4dChzdWdnZXN0aW9uKSk7XG4gIH1cblxuICBmdW5jdGlvbiBkZWZhdWx0Q2F0ZWdvcnlSZW5kZXJlciAoZGl2LCBkYXRhKSB7XG4gICAgaWYgKGRhdGEuaWQgIT09ICdkZWZhdWx0Jykge1xuICAgICAgY29uc3QgaWQgPSB0YWcoJ2RpdicsICdzZXktY2F0ZWdvcnktaWQnKTtcbiAgICAgIGRpdi5hcHBlbmRDaGlsZChpZCk7XG4gICAgICB0ZXh0KGlkLCBkYXRhLmlkKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBkZWZhdWx0RmlsdGVyIChxLCBzdWdnZXN0aW9uKSB7XG4gICAgY29uc3QgbmVlZGxlID0gcS50b0xvd2VyQ2FzZSgpO1xuICAgIGNvbnN0IHRleHQgPSBnZXRUZXh0KHN1Z2dlc3Rpb24pIHx8ICcnO1xuICAgIGlmIChmdXp6eXNlYXJjaChuZWVkbGUsIHRleHQudG9Mb3dlckNhc2UoKSkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBjb25zdCB2YWx1ZSA9IGdldFZhbHVlKHN1Z2dlc3Rpb24pIHx8ICcnO1xuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBmdXp6eXNlYXJjaChuZWVkbGUsIHZhbHVlLnRvTG93ZXJDYXNlKCkpO1xuICB9XG5cbiAgZnVuY3Rpb24gbG9vcGJhY2tUb0FuY2hvciAodGV4dCwgcCkge1xuICAgIGxldCByZXN1bHQgPSAnJztcbiAgICBsZXQgYW5jaG9yZWQgPSBmYWxzZTtcbiAgICBsZXQgc3RhcnQgPSBwLnN0YXJ0O1xuICAgIHdoaWxlIChhbmNob3JlZCA9PT0gZmFsc2UgJiYgc3RhcnQgPj0gMCkge1xuICAgICAgcmVzdWx0ID0gdGV4dC5zdWJzdHIoc3RhcnQgLSAxLCBwLnN0YXJ0IC0gc3RhcnQgKyAxKTtcbiAgICAgIGFuY2hvcmVkID0gcmFuY2hvcmxlZnQudGVzdChyZXN1bHQpO1xuICAgICAgc3RhcnQtLTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHRleHQ6IGFuY2hvcmVkID8gcmVzdWx0IDogbnVsbCxcbiAgICAgIHN0YXJ0XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbHRlckFuY2hvcmVkVGV4dCAocSwgc3VnZ2VzdGlvbikge1xuICAgIGNvbnN0IHBvc2l0aW9uID0gc2VsbChlbCk7XG4gICAgY29uc3QgaW5wdXQgPSBsb29wYmFja1RvQW5jaG9yKHEsIHBvc2l0aW9uKS50ZXh0O1xuICAgIGlmIChpbnB1dCkge1xuICAgICAgcmV0dXJuIHsgaW5wdXQsIHN1Z2dlc3Rpb24gfTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBhcHBlbmRUZXh0ICh2YWx1ZSkge1xuICAgIGNvbnN0IGN1cnJlbnQgPSBlbC52YWx1ZTtcbiAgICBjb25zdCBwb3NpdGlvbiA9IHNlbGwoZWwpO1xuICAgIGNvbnN0IGlucHV0ID0gbG9vcGJhY2tUb0FuY2hvcihjdXJyZW50LCBwb3NpdGlvbik7XG4gICAgY29uc3QgbGVmdCA9IGN1cnJlbnQuc3Vic3RyKDAsIGlucHV0LnN0YXJ0KTtcbiAgICBjb25zdCByaWdodCA9IGN1cnJlbnQuc3Vic3RyKGlucHV0LnN0YXJ0ICsgaW5wdXQudGV4dC5sZW5ndGggKyAocG9zaXRpb24uZW5kIC0gcG9zaXRpb24uc3RhcnQpKTtcbiAgICBjb25zdCBiZWZvcmUgPSBsZWZ0ICsgdmFsdWUgKyAnICc7XG5cbiAgICBlbC52YWx1ZSA9IGJlZm9yZSArIHJpZ2h0O1xuICAgIHNlbGwoZWwsIHsgc3RhcnQ6IGJlZm9yZS5sZW5ndGgsIGVuZDogYmVmb3JlLmxlbmd0aCB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbHRlckFuY2hvcmVkSFRNTCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdBbmNob3JpbmcgaW4gZWRpdGFibGUgZWxlbWVudHMgaXMgZGlzYWJsZWQgYnkgZGVmYXVsdC4nKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGVuZEhUTUwgKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignQW5jaG9yaW5nIGluIGVkaXRhYmxlIGVsZW1lbnRzIGlzIGRpc2FibGVkIGJ5IGRlZmF1bHQuJyk7XG4gIH1cblxuICBmdW5jdGlvbiBmaW5kTGlzdCAoY2F0ZWdvcnkpIHsgcmV0dXJuIHNla3RvcignLnNleS1saXN0JywgY2F0ZWdvcnkpWzBdOyB9XG59XG5cbmZ1bmN0aW9uIGlzSW5wdXQgKGVsKSB7IHJldHVybiBlbC50YWdOYW1lID09PSAnSU5QVVQnIHx8IGVsLnRhZ05hbWUgPT09ICdURVhUQVJFQSc7IH1cblxuZnVuY3Rpb24gdGFnICh0eXBlLCBjbGFzc05hbWUpIHtcbiAgY29uc3QgZWwgPSBkb2MuY3JlYXRlRWxlbWVudCh0eXBlKTtcbiAgZWwuY2xhc3NOYW1lID0gY2xhc3NOYW1lO1xuICByZXR1cm4gZWw7XG59XG5cbmZ1bmN0aW9uIGRlZmVyIChmbikgeyByZXR1cm4gZnVuY3Rpb24gKCkgeyBzZXRUaW1lb3V0KGZuLCAwKTsgfTsgfVxuZnVuY3Rpb24gdGV4dCAoZWwsIHZhbHVlKSB7IGVsLmlubmVyVGV4dCA9IGVsLnRleHRDb250ZW50ID0gdmFsdWU7IH1cblxuZnVuY3Rpb24gaXNFZGl0YWJsZSAoZWwpIHtcbiAgY29uc3QgdmFsdWUgPSBlbC5nZXRBdHRyaWJ1dGUoJ2NvbnRlbnRFZGl0YWJsZScpO1xuICBpZiAodmFsdWUgPT09ICdmYWxzZScpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKHZhbHVlID09PSAndHJ1ZScpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBpZiAoZWwucGFyZW50RWxlbWVudCkge1xuICAgIHJldHVybiBpc0VkaXRhYmxlKGVsLnBhcmVudEVsZW1lbnQpO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBob3JzZXk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGF0b2EgKGEsIG4pIHsgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGEsIG4pOyB9XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjcm9zc3ZlbnQgPSByZXF1aXJlKCdjcm9zc3ZlbnQnKTtcbnZhciB0aHJvdHRsZSA9IHJlcXVpcmUoJy4vdGhyb3R0bGUnKTtcbnZhciB0YWlsb3JtYWRlID0gcmVxdWlyZSgnLi90YWlsb3JtYWRlJyk7XG5cbmZ1bmN0aW9uIGJ1bGxzZXllIChlbCwgdGFyZ2V0LCBvcHRpb25zKSB7XG4gIHZhciBvID0gb3B0aW9ucztcbiAgdmFyIGRvbVRhcmdldCA9IHRhcmdldCAmJiB0YXJnZXQudGFnTmFtZTtcblxuICBpZiAoIWRvbVRhcmdldCAmJiBhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XG4gICAgbyA9IHRhcmdldDtcbiAgfVxuICBpZiAoIWRvbVRhcmdldCkge1xuICAgIHRhcmdldCA9IGVsO1xuICB9XG4gIGlmICghbykgeyBvID0ge307IH1cblxuICB2YXIgZGVzdHJveWVkID0gZmFsc2U7XG4gIHZhciB0aHJvdHRsZWRXcml0ZSA9IHRocm90dGxlKHdyaXRlLCAzMCk7XG4gIHZhciB0YWlsb3JPcHRpb25zID0geyB1cGRhdGU6IG8uYXV0b3VwZGF0ZVRvQ2FyZXQgIT09IGZhbHNlICYmIHVwZGF0ZSB9O1xuICB2YXIgdGFpbG9yID0gby5jYXJldCAmJiB0YWlsb3JtYWRlKHRhcmdldCwgdGFpbG9yT3B0aW9ucyk7XG5cbiAgd3JpdGUoKTtcblxuICBpZiAoby50cmFja2luZyAhPT0gZmFsc2UpIHtcbiAgICBjcm9zc3ZlbnQuYWRkKHdpbmRvdywgJ3Jlc2l6ZScsIHRocm90dGxlZFdyaXRlKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgcmVhZDogcmVhZE51bGwsXG4gICAgcmVmcmVzaDogd3JpdGUsXG4gICAgZGVzdHJveTogZGVzdHJveSxcbiAgICBzbGVlcDogc2xlZXBcbiAgfTtcblxuICBmdW5jdGlvbiBzbGVlcCAoKSB7XG4gICAgdGFpbG9yT3B0aW9ucy5zbGVlcGluZyA9IHRydWU7XG4gIH1cblxuICBmdW5jdGlvbiByZWFkTnVsbCAoKSB7IHJldHVybiByZWFkKCk7IH1cblxuICBmdW5jdGlvbiByZWFkIChyZWFkaW5ncykge1xuICAgIHZhciBib3VuZHMgPSB0YXJnZXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgdmFyIHNjcm9sbFRvcCA9IGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wIHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3A7XG4gICAgaWYgKHRhaWxvcikge1xuICAgICAgcmVhZGluZ3MgPSB0YWlsb3IucmVhZCgpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgeDogKHJlYWRpbmdzLmFic29sdXRlID8gMCA6IGJvdW5kcy5sZWZ0KSArIHJlYWRpbmdzLngsXG4gICAgICAgIHk6IChyZWFkaW5ncy5hYnNvbHV0ZSA/IDAgOiBib3VuZHMudG9wKSArIHNjcm9sbFRvcCArIHJlYWRpbmdzLnkgKyAyMFxuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IGJvdW5kcy5sZWZ0LFxuICAgICAgeTogYm91bmRzLnRvcCArIHNjcm9sbFRvcFxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiB1cGRhdGUgKHJlYWRpbmdzKSB7XG4gICAgd3JpdGUocmVhZGluZ3MpO1xuICB9XG5cbiAgZnVuY3Rpb24gd3JpdGUgKHJlYWRpbmdzKSB7XG4gICAgaWYgKGRlc3Ryb3llZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdCdWxsc2V5ZSBjYW5cXCd0IHJlZnJlc2ggYWZ0ZXIgYmVpbmcgZGVzdHJveWVkLiBDcmVhdGUgYW5vdGhlciBpbnN0YW5jZSBpbnN0ZWFkLicpO1xuICAgIH1cbiAgICBpZiAodGFpbG9yICYmICFyZWFkaW5ncykge1xuICAgICAgdGFpbG9yT3B0aW9ucy5zbGVlcGluZyA9IGZhbHNlO1xuICAgICAgdGFpbG9yLnJlZnJlc2goKTsgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgcCA9IHJlYWQocmVhZGluZ3MpO1xuICAgIGlmICghdGFpbG9yICYmIHRhcmdldCAhPT0gZWwpIHtcbiAgICAgIHAueSArPSB0YXJnZXQub2Zmc2V0SGVpZ2h0O1xuICAgIH1cbiAgICB2YXIgY29udGV4dCA9IG8uY29udGV4dDtcbiAgICBlbC5zdHlsZS5sZWZ0ID0gcC54ICsgJ3B4JztcbiAgICBlbC5zdHlsZS50b3AgPSAoY29udGV4dCA/IGNvbnRleHQub2Zmc2V0SGVpZ2h0IDogcC55KSArICdweCc7XG4gIH1cblxuICBmdW5jdGlvbiBkZXN0cm95ICgpIHtcbiAgICBpZiAodGFpbG9yKSB7IHRhaWxvci5kZXN0cm95KCk7IH1cbiAgICBjcm9zc3ZlbnQucmVtb3ZlKHdpbmRvdywgJ3Jlc2l6ZScsIHRocm90dGxlZFdyaXRlKTtcbiAgICBkZXN0cm95ZWQgPSB0cnVlO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYnVsbHNleWU7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBzZWxsID0gcmVxdWlyZSgnc2VsbCcpO1xudmFyIGNyb3NzdmVudCA9IHJlcXVpcmUoJ2Nyb3NzdmVudCcpO1xudmFyIHNlbGVjY2lvbiA9IHJlcXVpcmUoJ3NlbGVjY2lvbicpO1xudmFyIHRocm90dGxlID0gcmVxdWlyZSgnLi90aHJvdHRsZScpO1xudmFyIGdldFNlbGVjdGlvbiA9IHNlbGVjY2lvbi5nZXQ7XG52YXIgcHJvcHMgPSBbXG4gICdkaXJlY3Rpb24nLFxuICAnYm94U2l6aW5nJyxcbiAgJ3dpZHRoJyxcbiAgJ2hlaWdodCcsXG4gICdvdmVyZmxvd1gnLFxuICAnb3ZlcmZsb3dZJyxcbiAgJ2JvcmRlclRvcFdpZHRoJyxcbiAgJ2JvcmRlclJpZ2h0V2lkdGgnLFxuICAnYm9yZGVyQm90dG9tV2lkdGgnLFxuICAnYm9yZGVyTGVmdFdpZHRoJyxcbiAgJ3BhZGRpbmdUb3AnLFxuICAncGFkZGluZ1JpZ2h0JyxcbiAgJ3BhZGRpbmdCb3R0b20nLFxuICAncGFkZGluZ0xlZnQnLFxuICAnZm9udFN0eWxlJyxcbiAgJ2ZvbnRWYXJpYW50JyxcbiAgJ2ZvbnRXZWlnaHQnLFxuICAnZm9udFN0cmV0Y2gnLFxuICAnZm9udFNpemUnLFxuICAnZm9udFNpemVBZGp1c3QnLFxuICAnbGluZUhlaWdodCcsXG4gICdmb250RmFtaWx5JyxcbiAgJ3RleHRBbGlnbicsXG4gICd0ZXh0VHJhbnNmb3JtJyxcbiAgJ3RleHRJbmRlbnQnLFxuICAndGV4dERlY29yYXRpb24nLFxuICAnbGV0dGVyU3BhY2luZycsXG4gICd3b3JkU3BhY2luZydcbl07XG52YXIgd2luID0gZ2xvYmFsO1xudmFyIGRvYyA9IGRvY3VtZW50O1xudmFyIGZmID0gd2luLm1veklubmVyU2NyZWVuWCAhPT0gbnVsbCAmJiB3aW4ubW96SW5uZXJTY3JlZW5YICE9PSB2b2lkIDA7XG5cbmZ1bmN0aW9uIHRhaWxvcm1hZGUgKGVsLCBvcHRpb25zKSB7XG4gIHZhciB0ZXh0SW5wdXQgPSBlbC50YWdOYW1lID09PSAnSU5QVVQnIHx8IGVsLnRhZ05hbWUgPT09ICdURVhUQVJFQSc7XG4gIHZhciB0aHJvdHRsZWRSZWZyZXNoID0gdGhyb3R0bGUocmVmcmVzaCwgMzApO1xuICB2YXIgbyA9IG9wdGlvbnMgfHwge307XG5cbiAgYmluZCgpO1xuXG4gIHJldHVybiB7XG4gICAgcmVhZDogcmVhZFBvc2l0aW9uLFxuICAgIHJlZnJlc2g6IHRocm90dGxlZFJlZnJlc2gsXG4gICAgZGVzdHJveTogZGVzdHJveVxuICB9O1xuXG4gIGZ1bmN0aW9uIG5vb3AgKCkge31cbiAgZnVuY3Rpb24gcmVhZFBvc2l0aW9uICgpIHsgcmV0dXJuICh0ZXh0SW5wdXQgPyBjb29yZHNUZXh0IDogY29vcmRzSFRNTCkoKTsgfVxuXG4gIGZ1bmN0aW9uIHJlZnJlc2ggKCkge1xuICAgIGlmIChvLnNsZWVwaW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHJldHVybiAoby51cGRhdGUgfHwgbm9vcCkocmVhZFBvc2l0aW9uKCkpO1xuICB9XG5cbiAgZnVuY3Rpb24gY29vcmRzVGV4dCAoKSB7XG4gICAgdmFyIHAgPSBzZWxsKGVsKTtcbiAgICB2YXIgY29udGV4dCA9IHByZXBhcmUoKTtcbiAgICB2YXIgcmVhZGluZ3MgPSByZWFkVGV4dENvb3Jkcyhjb250ZXh0LCBwLnN0YXJ0KTtcbiAgICBkb2MuYm9keS5yZW1vdmVDaGlsZChjb250ZXh0Lm1pcnJvcik7XG4gICAgcmV0dXJuIHJlYWRpbmdzO1xuICB9XG5cbiAgZnVuY3Rpb24gY29vcmRzSFRNTCAoKSB7XG4gICAgdmFyIHNlbCA9IGdldFNlbGVjdGlvbigpO1xuICAgIGlmIChzZWwucmFuZ2VDb3VudCkge1xuICAgICAgdmFyIHJhbmdlID0gc2VsLmdldFJhbmdlQXQoMCk7XG4gICAgICB2YXIgbmVlZHNUb1dvcmtBcm91bmROZXdsaW5lQnVnID0gcmFuZ2Uuc3RhcnRDb250YWluZXIubm9kZU5hbWUgPT09ICdQJyAmJiByYW5nZS5zdGFydE9mZnNldCA9PT0gMDtcbiAgICAgIGlmIChuZWVkc1RvV29ya0Fyb3VuZE5ld2xpbmVCdWcpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB4OiByYW5nZS5zdGFydENvbnRhaW5lci5vZmZzZXRMZWZ0LFxuICAgICAgICAgIHk6IHJhbmdlLnN0YXJ0Q29udGFpbmVyLm9mZnNldFRvcCxcbiAgICAgICAgICBhYnNvbHV0ZTogdHJ1ZVxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgaWYgKHJhbmdlLmdldENsaWVudFJlY3RzKSB7XG4gICAgICAgIHZhciByZWN0cyA9IHJhbmdlLmdldENsaWVudFJlY3RzKCk7XG4gICAgICAgIGlmIChyZWN0cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6IHJlY3RzWzBdLmxlZnQsXG4gICAgICAgICAgICB5OiByZWN0c1swXS50b3AsXG4gICAgICAgICAgICBhYnNvbHV0ZTogdHJ1ZVxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHsgeDogMCwgeTogMCB9O1xuICB9XG5cbiAgZnVuY3Rpb24gcmVhZFRleHRDb29yZHMgKGNvbnRleHQsIHApIHtcbiAgICB2YXIgcmVzdCA9IGRvYy5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgdmFyIG1pcnJvciA9IGNvbnRleHQubWlycm9yO1xuICAgIHZhciBjb21wdXRlZCA9IGNvbnRleHQuY29tcHV0ZWQ7XG5cbiAgICB3cml0ZShtaXJyb3IsIHJlYWQoZWwpLnN1YnN0cmluZygwLCBwKSk7XG5cbiAgICBpZiAoZWwudGFnTmFtZSA9PT0gJ0lOUFVUJykge1xuICAgICAgbWlycm9yLnRleHRDb250ZW50ID0gbWlycm9yLnRleHRDb250ZW50LnJlcGxhY2UoL1xccy9nLCAnXFx1MDBhMCcpO1xuICAgIH1cblxuICAgIHdyaXRlKHJlc3QsIHJlYWQoZWwpLnN1YnN0cmluZyhwKSB8fCAnLicpO1xuXG4gICAgbWlycm9yLmFwcGVuZENoaWxkKHJlc3QpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IHJlc3Qub2Zmc2V0TGVmdCArIHBhcnNlSW50KGNvbXB1dGVkWydib3JkZXJMZWZ0V2lkdGgnXSksXG4gICAgICB5OiByZXN0Lm9mZnNldFRvcCArIHBhcnNlSW50KGNvbXB1dGVkWydib3JkZXJUb3BXaWR0aCddKVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiByZWFkIChlbCkge1xuICAgIHJldHVybiB0ZXh0SW5wdXQgPyBlbC52YWx1ZSA6IGVsLmlubmVySFRNTDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByZXBhcmUgKCkge1xuICAgIHZhciBjb21wdXRlZCA9IHdpbi5nZXRDb21wdXRlZFN0eWxlID8gZ2V0Q29tcHV0ZWRTdHlsZShlbCkgOiBlbC5jdXJyZW50U3R5bGU7XG4gICAgdmFyIG1pcnJvciA9IGRvYy5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB2YXIgc3R5bGUgPSBtaXJyb3Iuc3R5bGU7XG5cbiAgICBkb2MuYm9keS5hcHBlbmRDaGlsZChtaXJyb3IpO1xuXG4gICAgaWYgKGVsLnRhZ05hbWUgIT09ICdJTlBVVCcpIHtcbiAgICAgIHN0eWxlLndvcmRXcmFwID0gJ2JyZWFrLXdvcmQnO1xuICAgIH1cbiAgICBzdHlsZS53aGl0ZVNwYWNlID0gJ3ByZS13cmFwJztcbiAgICBzdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgc3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nO1xuICAgIHByb3BzLmZvckVhY2goY29weSk7XG5cbiAgICBpZiAoZmYpIHtcbiAgICAgIHN0eWxlLndpZHRoID0gcGFyc2VJbnQoY29tcHV0ZWQud2lkdGgpIC0gMiArICdweCc7XG4gICAgICBpZiAoZWwuc2Nyb2xsSGVpZ2h0ID4gcGFyc2VJbnQoY29tcHV0ZWQuaGVpZ2h0KSkge1xuICAgICAgICBzdHlsZS5vdmVyZmxvd1kgPSAnc2Nyb2xsJztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcbiAgICB9XG4gICAgcmV0dXJuIHsgbWlycm9yOiBtaXJyb3IsIGNvbXB1dGVkOiBjb21wdXRlZCB9O1xuXG4gICAgZnVuY3Rpb24gY29weSAocHJvcCkge1xuICAgICAgc3R5bGVbcHJvcF0gPSBjb21wdXRlZFtwcm9wXTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB3cml0ZSAoZWwsIHZhbHVlKSB7XG4gICAgaWYgKHRleHRJbnB1dCkge1xuICAgICAgZWwudGV4dENvbnRlbnQgPSB2YWx1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgZWwuaW5uZXJIVE1MID0gdmFsdWU7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gYmluZCAocmVtb3ZlKSB7XG4gICAgdmFyIG9wID0gcmVtb3ZlID8gJ3JlbW92ZScgOiAnYWRkJztcbiAgICBjcm9zc3ZlbnRbb3BdKGVsLCAna2V5ZG93bicsIHRocm90dGxlZFJlZnJlc2gpO1xuICAgIGNyb3NzdmVudFtvcF0oZWwsICdrZXl1cCcsIHRocm90dGxlZFJlZnJlc2gpO1xuICAgIGNyb3NzdmVudFtvcF0oZWwsICdpbnB1dCcsIHRocm90dGxlZFJlZnJlc2gpO1xuICAgIGNyb3NzdmVudFtvcF0oZWwsICdwYXN0ZScsIHRocm90dGxlZFJlZnJlc2gpO1xuICAgIGNyb3NzdmVudFtvcF0oZWwsICdjaGFuZ2UnLCB0aHJvdHRsZWRSZWZyZXNoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlc3Ryb3kgKCkge1xuICAgIGJpbmQodHJ1ZSk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB0YWlsb3JtYWRlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiB0aHJvdHRsZSAoZm4sIGJvdW5kYXJ5KSB7XG4gIHZhciBsYXN0ID0gLUluZmluaXR5O1xuICB2YXIgdGltZXI7XG4gIHJldHVybiBmdW5jdGlvbiBib3VuY2VkICgpIHtcbiAgICBpZiAodGltZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdW5ib3VuZCgpO1xuXG4gICAgZnVuY3Rpb24gdW5ib3VuZCAoKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgdGltZXIgPSBudWxsO1xuICAgICAgdmFyIG5leHQgPSBsYXN0ICsgYm91bmRhcnk7XG4gICAgICB2YXIgbm93ID0gRGF0ZS5ub3coKTtcbiAgICAgIGlmIChub3cgPiBuZXh0KSB7XG4gICAgICAgIGxhc3QgPSBub3c7XG4gICAgICAgIGZuKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aW1lciA9IHNldFRpbWVvdXQodW5ib3VuZCwgbmV4dCAtIG5vdyk7XG4gICAgICB9XG4gICAgfVxuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRocm90dGxlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdGlja3kgPSByZXF1aXJlKCd0aWNreScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGRlYm91bmNlIChmbiwgYXJncywgY3R4KSB7XG4gIGlmICghZm4pIHsgcmV0dXJuOyB9XG4gIHRpY2t5KGZ1bmN0aW9uIHJ1biAoKSB7XG4gICAgZm4uYXBwbHkoY3R4IHx8IG51bGwsIGFyZ3MgfHwgW10pO1xuICB9KTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBhdG9hID0gcmVxdWlyZSgnYXRvYScpO1xudmFyIGRlYm91bmNlID0gcmVxdWlyZSgnLi9kZWJvdW5jZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGVtaXR0ZXIgKHRoaW5nLCBvcHRpb25zKSB7XG4gIHZhciBvcHRzID0gb3B0aW9ucyB8fCB7fTtcbiAgdmFyIGV2dCA9IHt9O1xuICBpZiAodGhpbmcgPT09IHVuZGVmaW5lZCkgeyB0aGluZyA9IHt9OyB9XG4gIHRoaW5nLm9uID0gZnVuY3Rpb24gKHR5cGUsIGZuKSB7XG4gICAgaWYgKCFldnRbdHlwZV0pIHtcbiAgICAgIGV2dFt0eXBlXSA9IFtmbl07XG4gICAgfSBlbHNlIHtcbiAgICAgIGV2dFt0eXBlXS5wdXNoKGZuKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaW5nO1xuICB9O1xuICB0aGluZy5vbmNlID0gZnVuY3Rpb24gKHR5cGUsIGZuKSB7XG4gICAgZm4uX29uY2UgPSB0cnVlOyAvLyB0aGluZy5vZmYoZm4pIHN0aWxsIHdvcmtzIVxuICAgIHRoaW5nLm9uKHR5cGUsIGZuKTtcbiAgICByZXR1cm4gdGhpbmc7XG4gIH07XG4gIHRoaW5nLm9mZiA9IGZ1bmN0aW9uICh0eXBlLCBmbikge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICBpZiAoYyA9PT0gMSkge1xuICAgICAgZGVsZXRlIGV2dFt0eXBlXTtcbiAgICB9IGVsc2UgaWYgKGMgPT09IDApIHtcbiAgICAgIGV2dCA9IHt9O1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgZXQgPSBldnRbdHlwZV07XG4gICAgICBpZiAoIWV0KSB7IHJldHVybiB0aGluZzsgfVxuICAgICAgZXQuc3BsaWNlKGV0LmluZGV4T2YoZm4pLCAxKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaW5nO1xuICB9O1xuICB0aGluZy5lbWl0ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBhcmdzID0gYXRvYShhcmd1bWVudHMpO1xuICAgIHJldHVybiB0aGluZy5lbWl0dGVyU25hcHNob3QoYXJncy5zaGlmdCgpKS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfTtcbiAgdGhpbmcuZW1pdHRlclNuYXBzaG90ID0gZnVuY3Rpb24gKHR5cGUpIHtcbiAgICB2YXIgZXQgPSAoZXZ0W3R5cGVdIHx8IFtdKS5zbGljZSgwKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGFyZ3MgPSBhdG9hKGFyZ3VtZW50cyk7XG4gICAgICB2YXIgY3R4ID0gdGhpcyB8fCB0aGluZztcbiAgICAgIGlmICh0eXBlID09PSAnZXJyb3InICYmIG9wdHMudGhyb3dzICE9PSBmYWxzZSAmJiAhZXQubGVuZ3RoKSB7IHRocm93IGFyZ3MubGVuZ3RoID09PSAxID8gYXJnc1swXSA6IGFyZ3M7IH1cbiAgICAgIGV0LmZvckVhY2goZnVuY3Rpb24gZW1pdHRlciAobGlzdGVuKSB7XG4gICAgICAgIGlmIChvcHRzLmFzeW5jKSB7IGRlYm91bmNlKGxpc3RlbiwgYXJncywgY3R4KTsgfSBlbHNlIHsgbGlzdGVuLmFwcGx5KGN0eCwgYXJncyk7IH1cbiAgICAgICAgaWYgKGxpc3Rlbi5fb25jZSkgeyB0aGluZy5vZmYodHlwZSwgbGlzdGVuKTsgfVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gdGhpbmc7XG4gICAgfTtcbiAgfTtcbiAgcmV0dXJuIHRoaW5nO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGN1c3RvbUV2ZW50ID0gcmVxdWlyZSgnY3VzdG9tLWV2ZW50Jyk7XG52YXIgZXZlbnRtYXAgPSByZXF1aXJlKCcuL2V2ZW50bWFwJyk7XG52YXIgZG9jID0gZ2xvYmFsLmRvY3VtZW50O1xudmFyIGFkZEV2ZW50ID0gYWRkRXZlbnRFYXN5O1xudmFyIHJlbW92ZUV2ZW50ID0gcmVtb3ZlRXZlbnRFYXN5O1xudmFyIGhhcmRDYWNoZSA9IFtdO1xuXG5pZiAoIWdsb2JhbC5hZGRFdmVudExpc3RlbmVyKSB7XG4gIGFkZEV2ZW50ID0gYWRkRXZlbnRIYXJkO1xuICByZW1vdmVFdmVudCA9IHJlbW92ZUV2ZW50SGFyZDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFkZDogYWRkRXZlbnQsXG4gIHJlbW92ZTogcmVtb3ZlRXZlbnQsXG4gIGZhYnJpY2F0ZTogZmFicmljYXRlRXZlbnRcbn07XG5cbmZ1bmN0aW9uIGFkZEV2ZW50RWFzeSAoZWwsIHR5cGUsIGZuLCBjYXB0dXJpbmcpIHtcbiAgcmV0dXJuIGVsLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgZm4sIGNhcHR1cmluZyk7XG59XG5cbmZ1bmN0aW9uIGFkZEV2ZW50SGFyZCAoZWwsIHR5cGUsIGZuKSB7XG4gIHJldHVybiBlbC5hdHRhY2hFdmVudCgnb24nICsgdHlwZSwgd3JhcChlbCwgdHlwZSwgZm4pKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlRXZlbnRFYXN5IChlbCwgdHlwZSwgZm4sIGNhcHR1cmluZykge1xuICByZXR1cm4gZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlLCBmbiwgY2FwdHVyaW5nKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlRXZlbnRIYXJkIChlbCwgdHlwZSwgZm4pIHtcbiAgdmFyIGxpc3RlbmVyID0gdW53cmFwKGVsLCB0eXBlLCBmbik7XG4gIGlmIChsaXN0ZW5lcikge1xuICAgIHJldHVybiBlbC5kZXRhY2hFdmVudCgnb24nICsgdHlwZSwgbGlzdGVuZXIpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGZhYnJpY2F0ZUV2ZW50IChlbCwgdHlwZSwgbW9kZWwpIHtcbiAgdmFyIGUgPSBldmVudG1hcC5pbmRleE9mKHR5cGUpID09PSAtMSA/IG1ha2VDdXN0b21FdmVudCgpIDogbWFrZUNsYXNzaWNFdmVudCgpO1xuICBpZiAoZWwuZGlzcGF0Y2hFdmVudCkge1xuICAgIGVsLmRpc3BhdGNoRXZlbnQoZSk7XG4gIH0gZWxzZSB7XG4gICAgZWwuZmlyZUV2ZW50KCdvbicgKyB0eXBlLCBlKTtcbiAgfVxuICBmdW5jdGlvbiBtYWtlQ2xhc3NpY0V2ZW50ICgpIHtcbiAgICB2YXIgZTtcbiAgICBpZiAoZG9jLmNyZWF0ZUV2ZW50KSB7XG4gICAgICBlID0gZG9jLmNyZWF0ZUV2ZW50KCdFdmVudCcpO1xuICAgICAgZS5pbml0RXZlbnQodHlwZSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgfSBlbHNlIGlmIChkb2MuY3JlYXRlRXZlbnRPYmplY3QpIHtcbiAgICAgIGUgPSBkb2MuY3JlYXRlRXZlbnRPYmplY3QoKTtcbiAgICB9XG4gICAgcmV0dXJuIGU7XG4gIH1cbiAgZnVuY3Rpb24gbWFrZUN1c3RvbUV2ZW50ICgpIHtcbiAgICByZXR1cm4gbmV3IGN1c3RvbUV2ZW50KHR5cGUsIHsgZGV0YWlsOiBtb2RlbCB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiB3cmFwcGVyRmFjdG9yeSAoZWwsIHR5cGUsIGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiB3cmFwcGVyIChvcmlnaW5hbEV2ZW50KSB7XG4gICAgdmFyIGUgPSBvcmlnaW5hbEV2ZW50IHx8IGdsb2JhbC5ldmVudDtcbiAgICBlLnRhcmdldCA9IGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudDtcbiAgICBlLnByZXZlbnREZWZhdWx0ID0gZS5wcmV2ZW50RGVmYXVsdCB8fCBmdW5jdGlvbiBwcmV2ZW50RGVmYXVsdCAoKSB7IGUucmV0dXJuVmFsdWUgPSBmYWxzZTsgfTtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbiA9IGUuc3RvcFByb3BhZ2F0aW9uIHx8IGZ1bmN0aW9uIHN0b3BQcm9wYWdhdGlvbiAoKSB7IGUuY2FuY2VsQnViYmxlID0gdHJ1ZTsgfTtcbiAgICBlLndoaWNoID0gZS53aGljaCB8fCBlLmtleUNvZGU7XG4gICAgZm4uY2FsbChlbCwgZSk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHdyYXAgKGVsLCB0eXBlLCBmbikge1xuICB2YXIgd3JhcHBlciA9IHVud3JhcChlbCwgdHlwZSwgZm4pIHx8IHdyYXBwZXJGYWN0b3J5KGVsLCB0eXBlLCBmbik7XG4gIGhhcmRDYWNoZS5wdXNoKHtcbiAgICB3cmFwcGVyOiB3cmFwcGVyLFxuICAgIGVsZW1lbnQ6IGVsLFxuICAgIHR5cGU6IHR5cGUsXG4gICAgZm46IGZuXG4gIH0pO1xuICByZXR1cm4gd3JhcHBlcjtcbn1cblxuZnVuY3Rpb24gdW53cmFwIChlbCwgdHlwZSwgZm4pIHtcbiAgdmFyIGkgPSBmaW5kKGVsLCB0eXBlLCBmbik7XG4gIGlmIChpKSB7XG4gICAgdmFyIHdyYXBwZXIgPSBoYXJkQ2FjaGVbaV0ud3JhcHBlcjtcbiAgICBoYXJkQ2FjaGUuc3BsaWNlKGksIDEpOyAvLyBmcmVlIHVwIGEgdGFkIG9mIG1lbW9yeVxuICAgIHJldHVybiB3cmFwcGVyO1xuICB9XG59XG5cbmZ1bmN0aW9uIGZpbmQgKGVsLCB0eXBlLCBmbikge1xuICB2YXIgaSwgaXRlbTtcbiAgZm9yIChpID0gMDsgaSA8IGhhcmRDYWNoZS5sZW5ndGg7IGkrKykge1xuICAgIGl0ZW0gPSBoYXJkQ2FjaGVbaV07XG4gICAgaWYgKGl0ZW0uZWxlbWVudCA9PT0gZWwgJiYgaXRlbS50eXBlID09PSB0eXBlICYmIGl0ZW0uZm4gPT09IGZuKSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9XG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGV2ZW50bWFwID0gW107XG52YXIgZXZlbnRuYW1lID0gJyc7XG52YXIgcm9uID0gL15vbi87XG5cbmZvciAoZXZlbnRuYW1lIGluIGdsb2JhbCkge1xuICBpZiAocm9uLnRlc3QoZXZlbnRuYW1lKSkge1xuICAgIGV2ZW50bWFwLnB1c2goZXZlbnRuYW1lLnNsaWNlKDIpKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGV2ZW50bWFwO1xuIiwiXG52YXIgTmF0aXZlQ3VzdG9tRXZlbnQgPSBnbG9iYWwuQ3VzdG9tRXZlbnQ7XG5cbmZ1bmN0aW9uIHVzZU5hdGl2ZSAoKSB7XG4gIHRyeSB7XG4gICAgdmFyIHAgPSBuZXcgTmF0aXZlQ3VzdG9tRXZlbnQoJ2NhdCcsIHsgZGV0YWlsOiB7IGZvbzogJ2JhcicgfSB9KTtcbiAgICByZXR1cm4gICdjYXQnID09PSBwLnR5cGUgJiYgJ2JhcicgPT09IHAuZGV0YWlsLmZvbztcbiAgfSBjYXRjaCAoZSkge1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBDcm9zcy1icm93c2VyIGBDdXN0b21FdmVudGAgY29uc3RydWN0b3IuXG4gKlxuICogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0N1c3RvbUV2ZW50LkN1c3RvbUV2ZW50XG4gKlxuICogQHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gdXNlTmF0aXZlKCkgPyBOYXRpdmVDdXN0b21FdmVudCA6XG5cbi8vIElFID49IDlcbidmdW5jdGlvbicgPT09IHR5cGVvZiBkb2N1bWVudC5jcmVhdGVFdmVudCA/IGZ1bmN0aW9uIEN1c3RvbUV2ZW50ICh0eXBlLCBwYXJhbXMpIHtcbiAgdmFyIGUgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnQ3VzdG9tRXZlbnQnKTtcbiAgaWYgKHBhcmFtcykge1xuICAgIGUuaW5pdEN1c3RvbUV2ZW50KHR5cGUsIHBhcmFtcy5idWJibGVzLCBwYXJhbXMuY2FuY2VsYWJsZSwgcGFyYW1zLmRldGFpbCk7XG4gIH0gZWxzZSB7XG4gICAgZS5pbml0Q3VzdG9tRXZlbnQodHlwZSwgZmFsc2UsIGZhbHNlLCB2b2lkIDApO1xuICB9XG4gIHJldHVybiBlO1xufSA6XG5cbi8vIElFIDw9IDhcbmZ1bmN0aW9uIEN1c3RvbUV2ZW50ICh0eXBlLCBwYXJhbXMpIHtcbiAgdmFyIGUgPSBkb2N1bWVudC5jcmVhdGVFdmVudE9iamVjdCgpO1xuICBlLnR5cGUgPSB0eXBlO1xuICBpZiAocGFyYW1zKSB7XG4gICAgZS5idWJibGVzID0gQm9vbGVhbihwYXJhbXMuYnViYmxlcyk7XG4gICAgZS5jYW5jZWxhYmxlID0gQm9vbGVhbihwYXJhbXMuY2FuY2VsYWJsZSk7XG4gICAgZS5kZXRhaWwgPSBwYXJhbXMuZGV0YWlsO1xuICB9IGVsc2Uge1xuICAgIGUuYnViYmxlcyA9IGZhbHNlO1xuICAgIGUuY2FuY2VsYWJsZSA9IGZhbHNlO1xuICAgIGUuZGV0YWlsID0gdm9pZCAwO1xuICB9XG4gIHJldHVybiBlO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBmdXp6eXNlYXJjaCAobmVlZGxlLCBoYXlzdGFjaykge1xuICB2YXIgdGxlbiA9IGhheXN0YWNrLmxlbmd0aDtcbiAgdmFyIHFsZW4gPSBuZWVkbGUubGVuZ3RoO1xuICBpZiAocWxlbiA+IHRsZW4pIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKHFsZW4gPT09IHRsZW4pIHtcbiAgICByZXR1cm4gbmVlZGxlID09PSBoYXlzdGFjaztcbiAgfVxuICBvdXRlcjogZm9yICh2YXIgaSA9IDAsIGogPSAwOyBpIDwgcWxlbjsgaSsrKSB7XG4gICAgdmFyIG5jaCA9IG5lZWRsZS5jaGFyQ29kZUF0KGkpO1xuICAgIHdoaWxlIChqIDwgdGxlbikge1xuICAgICAgaWYgKGhheXN0YWNrLmNoYXJDb2RlQXQoaisrKSA9PT0gbmNoKSB7XG4gICAgICAgIGNvbnRpbnVlIG91dGVyO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnV6enlzZWFyY2g7XG4iLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIHBhZCAoaGFzaCwgbGVuKSB7XG4gIHdoaWxlIChoYXNoLmxlbmd0aCA8IGxlbikge1xuICAgIGhhc2ggPSAnMCcgKyBoYXNoO1xuICB9XG4gIHJldHVybiBoYXNoO1xufVxuXG5mdW5jdGlvbiBmb2xkIChoYXNoLCB0ZXh0KSB7XG4gIHZhciBpO1xuICB2YXIgY2hyO1xuICB2YXIgbGVuO1xuICBpZiAodGV4dC5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gaGFzaDtcbiAgfVxuICBmb3IgKGkgPSAwLCBsZW4gPSB0ZXh0Lmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgY2hyID0gdGV4dC5jaGFyQ29kZUF0KGkpO1xuICAgIGhhc2ggPSAoKGhhc2ggPDwgNSkgLSBoYXNoKSArIGNocjtcbiAgICBoYXNoIHw9IDA7XG4gIH1cbiAgcmV0dXJuIGhhc2ggPCAwID8gaGFzaCAqIC0yIDogaGFzaDtcbn1cblxuZnVuY3Rpb24gZm9sZE9iamVjdCAoaGFzaCwgbywgc2Vlbikge1xuICByZXR1cm4gT2JqZWN0LmtleXMobykuc29ydCgpLnJlZHVjZShmb2xkS2V5LCBoYXNoKTtcbiAgZnVuY3Rpb24gZm9sZEtleSAoaGFzaCwga2V5KSB7XG4gICAgcmV0dXJuIGZvbGRWYWx1ZShoYXNoLCBvW2tleV0sIGtleSwgc2Vlbik7XG4gIH1cbn1cblxuZnVuY3Rpb24gZm9sZFZhbHVlIChpbnB1dCwgdmFsdWUsIGtleSwgc2Vlbikge1xuICB2YXIgaGFzaCA9IGZvbGQoZm9sZChmb2xkKGlucHV0LCBrZXkpLCB0b1N0cmluZyh2YWx1ZSkpLCB0eXBlb2YgdmFsdWUpO1xuICBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICByZXR1cm4gZm9sZChoYXNoLCAnbnVsbCcpO1xuICB9XG4gIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIGZvbGQoaGFzaCwgJ3VuZGVmaW5lZCcpO1xuICB9XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgaWYgKHNlZW4uaW5kZXhPZih2YWx1ZSkgIT09IC0xKSB7XG4gICAgICByZXR1cm4gZm9sZChoYXNoLCAnW0NpcmN1bGFyXScgKyBrZXkpO1xuICAgIH1cbiAgICBzZWVuLnB1c2godmFsdWUpO1xuICAgIHJldHVybiBmb2xkT2JqZWN0KGhhc2gsIHZhbHVlLCBzZWVuKTtcbiAgfVxuICByZXR1cm4gZm9sZChoYXNoLCB2YWx1ZS50b1N0cmluZygpKTtcbn1cblxuZnVuY3Rpb24gdG9TdHJpbmcgKG8pIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvKTtcbn1cblxuZnVuY3Rpb24gc3VtIChvKSB7XG4gIHJldHVybiBwYWQoZm9sZFZhbHVlKDAsIG8sICcnLCBbXSkudG9TdHJpbmcoMTYpLCA4KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzdW07XG4iLCJ2YXIgaXNPYmplY3QgPSByZXF1aXJlKCcuL2lzT2JqZWN0JyksXG4gICAgbm93ID0gcmVxdWlyZSgnLi9ub3cnKSxcbiAgICB0b051bWJlciA9IHJlcXVpcmUoJy4vdG9OdW1iZXInKTtcblxuLyoqIFVzZWQgYXMgdGhlIGBUeXBlRXJyb3JgIG1lc3NhZ2UgZm9yIFwiRnVuY3Rpb25zXCIgbWV0aG9kcy4gKi9cbnZhciBGVU5DX0VSUk9SX1RFWFQgPSAnRXhwZWN0ZWQgYSBmdW5jdGlvbic7XG5cbi8qIEJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzIGZvciB0aG9zZSB3aXRoIHRoZSBzYW1lIG5hbWUgYXMgb3RoZXIgYGxvZGFzaGAgbWV0aG9kcy4gKi9cbnZhciBuYXRpdmVNYXggPSBNYXRoLm1heCxcbiAgICBuYXRpdmVNaW4gPSBNYXRoLm1pbjtcblxuLyoqXG4gKiBDcmVhdGVzIGEgZGVib3VuY2VkIGZ1bmN0aW9uIHRoYXQgZGVsYXlzIGludm9raW5nIGBmdW5jYCB1bnRpbCBhZnRlciBgd2FpdGBcbiAqIG1pbGxpc2Vjb25kcyBoYXZlIGVsYXBzZWQgc2luY2UgdGhlIGxhc3QgdGltZSB0aGUgZGVib3VuY2VkIGZ1bmN0aW9uIHdhc1xuICogaW52b2tlZC4gVGhlIGRlYm91bmNlZCBmdW5jdGlvbiBjb21lcyB3aXRoIGEgYGNhbmNlbGAgbWV0aG9kIHRvIGNhbmNlbFxuICogZGVsYXllZCBgZnVuY2AgaW52b2NhdGlvbnMgYW5kIGEgYGZsdXNoYCBtZXRob2QgdG8gaW1tZWRpYXRlbHkgaW52b2tlIHRoZW0uXG4gKiBQcm92aWRlIGFuIG9wdGlvbnMgb2JqZWN0IHRvIGluZGljYXRlIHdoZXRoZXIgYGZ1bmNgIHNob3VsZCBiZSBpbnZva2VkIG9uXG4gKiB0aGUgbGVhZGluZyBhbmQvb3IgdHJhaWxpbmcgZWRnZSBvZiB0aGUgYHdhaXRgIHRpbWVvdXQuIFRoZSBgZnVuY2AgaXMgaW52b2tlZFxuICogd2l0aCB0aGUgbGFzdCBhcmd1bWVudHMgcHJvdmlkZWQgdG8gdGhlIGRlYm91bmNlZCBmdW5jdGlvbi4gU3Vic2VxdWVudCBjYWxsc1xuICogdG8gdGhlIGRlYm91bmNlZCBmdW5jdGlvbiByZXR1cm4gdGhlIHJlc3VsdCBvZiB0aGUgbGFzdCBgZnVuY2AgaW52b2NhdGlvbi5cbiAqXG4gKiAqKk5vdGU6KiogSWYgYGxlYWRpbmdgIGFuZCBgdHJhaWxpbmdgIG9wdGlvbnMgYXJlIGB0cnVlYCwgYGZ1bmNgIGlzIGludm9rZWRcbiAqIG9uIHRoZSB0cmFpbGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0IG9ubHkgaWYgdGhlIGRlYm91bmNlZCBmdW5jdGlvbiBpc1xuICogaW52b2tlZCBtb3JlIHRoYW4gb25jZSBkdXJpbmcgdGhlIGB3YWl0YCB0aW1lb3V0LlxuICpcbiAqIFNlZSBbRGF2aWQgQ29yYmFjaG8ncyBhcnRpY2xlXShodHRwczovL2Nzcy10cmlja3MuY29tL2RlYm91bmNpbmctdGhyb3R0bGluZy1leHBsYWluZWQtZXhhbXBsZXMvKVxuICogZm9yIGRldGFpbHMgb3ZlciB0aGUgZGlmZmVyZW5jZXMgYmV0d2VlbiBgXy5kZWJvdW5jZWAgYW5kIGBfLnRocm90dGxlYC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDAuMS4wXG4gKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGRlYm91bmNlLlxuICogQHBhcmFtIHtudW1iZXJ9IFt3YWl0PTBdIFRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRvIGRlbGF5LlxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zPXt9XSBUaGUgb3B0aW9ucyBvYmplY3QuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmxlYWRpbmc9ZmFsc2VdXG4gKiAgU3BlY2lmeSBpbnZva2luZyBvbiB0aGUgbGVhZGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0LlxuICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLm1heFdhaXRdXG4gKiAgVGhlIG1heGltdW0gdGltZSBgZnVuY2AgaXMgYWxsb3dlZCB0byBiZSBkZWxheWVkIGJlZm9yZSBpdCdzIGludm9rZWQuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnRyYWlsaW5nPXRydWVdXG4gKiAgU3BlY2lmeSBpbnZva2luZyBvbiB0aGUgdHJhaWxpbmcgZWRnZSBvZiB0aGUgdGltZW91dC5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGRlYm91bmNlZCBmdW5jdGlvbi5cbiAqIEBleGFtcGxlXG4gKlxuICogLy8gQXZvaWQgY29zdGx5IGNhbGN1bGF0aW9ucyB3aGlsZSB0aGUgd2luZG93IHNpemUgaXMgaW4gZmx1eC5cbiAqIGpRdWVyeSh3aW5kb3cpLm9uKCdyZXNpemUnLCBfLmRlYm91bmNlKGNhbGN1bGF0ZUxheW91dCwgMTUwKSk7XG4gKlxuICogLy8gSW52b2tlIGBzZW5kTWFpbGAgd2hlbiBjbGlja2VkLCBkZWJvdW5jaW5nIHN1YnNlcXVlbnQgY2FsbHMuXG4gKiBqUXVlcnkoZWxlbWVudCkub24oJ2NsaWNrJywgXy5kZWJvdW5jZShzZW5kTWFpbCwgMzAwLCB7XG4gKiAgICdsZWFkaW5nJzogdHJ1ZSxcbiAqICAgJ3RyYWlsaW5nJzogZmFsc2VcbiAqIH0pKTtcbiAqXG4gKiAvLyBFbnN1cmUgYGJhdGNoTG9nYCBpcyBpbnZva2VkIG9uY2UgYWZ0ZXIgMSBzZWNvbmQgb2YgZGVib3VuY2VkIGNhbGxzLlxuICogdmFyIGRlYm91bmNlZCA9IF8uZGVib3VuY2UoYmF0Y2hMb2csIDI1MCwgeyAnbWF4V2FpdCc6IDEwMDAgfSk7XG4gKiB2YXIgc291cmNlID0gbmV3IEV2ZW50U291cmNlKCcvc3RyZWFtJyk7XG4gKiBqUXVlcnkoc291cmNlKS5vbignbWVzc2FnZScsIGRlYm91bmNlZCk7XG4gKlxuICogLy8gQ2FuY2VsIHRoZSB0cmFpbGluZyBkZWJvdW5jZWQgaW52b2NhdGlvbi5cbiAqIGpRdWVyeSh3aW5kb3cpLm9uKCdwb3BzdGF0ZScsIGRlYm91bmNlZC5jYW5jZWwpO1xuICovXG5mdW5jdGlvbiBkZWJvdW5jZShmdW5jLCB3YWl0LCBvcHRpb25zKSB7XG4gIHZhciBsYXN0QXJncyxcbiAgICAgIGxhc3RUaGlzLFxuICAgICAgbWF4V2FpdCxcbiAgICAgIHJlc3VsdCxcbiAgICAgIHRpbWVySWQsXG4gICAgICBsYXN0Q2FsbFRpbWUsXG4gICAgICBsYXN0SW52b2tlVGltZSA9IDAsXG4gICAgICBsZWFkaW5nID0gZmFsc2UsXG4gICAgICBtYXhpbmcgPSBmYWxzZSxcbiAgICAgIHRyYWlsaW5nID0gdHJ1ZTtcblxuICBpZiAodHlwZW9mIGZ1bmMgIT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoRlVOQ19FUlJPUl9URVhUKTtcbiAgfVxuICB3YWl0ID0gdG9OdW1iZXIod2FpdCkgfHwgMDtcbiAgaWYgKGlzT2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgbGVhZGluZyA9ICEhb3B0aW9ucy5sZWFkaW5nO1xuICAgIG1heGluZyA9ICdtYXhXYWl0JyBpbiBvcHRpb25zO1xuICAgIG1heFdhaXQgPSBtYXhpbmcgPyBuYXRpdmVNYXgodG9OdW1iZXIob3B0aW9ucy5tYXhXYWl0KSB8fCAwLCB3YWl0KSA6IG1heFdhaXQ7XG4gICAgdHJhaWxpbmcgPSAndHJhaWxpbmcnIGluIG9wdGlvbnMgPyAhIW9wdGlvbnMudHJhaWxpbmcgOiB0cmFpbGluZztcbiAgfVxuXG4gIGZ1bmN0aW9uIGludm9rZUZ1bmModGltZSkge1xuICAgIHZhciBhcmdzID0gbGFzdEFyZ3MsXG4gICAgICAgIHRoaXNBcmcgPSBsYXN0VGhpcztcblxuICAgIGxhc3RBcmdzID0gbGFzdFRoaXMgPSB1bmRlZmluZWQ7XG4gICAgbGFzdEludm9rZVRpbWUgPSB0aW1lO1xuICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkodGhpc0FyZywgYXJncyk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGxlYWRpbmdFZGdlKHRpbWUpIHtcbiAgICAvLyBSZXNldCBhbnkgYG1heFdhaXRgIHRpbWVyLlxuICAgIGxhc3RJbnZva2VUaW1lID0gdGltZTtcbiAgICAvLyBTdGFydCB0aGUgdGltZXIgZm9yIHRoZSB0cmFpbGluZyBlZGdlLlxuICAgIHRpbWVySWQgPSBzZXRUaW1lb3V0KHRpbWVyRXhwaXJlZCwgd2FpdCk7XG4gICAgLy8gSW52b2tlIHRoZSBsZWFkaW5nIGVkZ2UuXG4gICAgcmV0dXJuIGxlYWRpbmcgPyBpbnZva2VGdW5jKHRpbWUpIDogcmVzdWx0O1xuICB9XG5cbiAgZnVuY3Rpb24gcmVtYWluaW5nV2FpdCh0aW1lKSB7XG4gICAgdmFyIHRpbWVTaW5jZUxhc3RDYWxsID0gdGltZSAtIGxhc3RDYWxsVGltZSxcbiAgICAgICAgdGltZVNpbmNlTGFzdEludm9rZSA9IHRpbWUgLSBsYXN0SW52b2tlVGltZSxcbiAgICAgICAgcmVzdWx0ID0gd2FpdCAtIHRpbWVTaW5jZUxhc3RDYWxsO1xuXG4gICAgcmV0dXJuIG1heGluZyA/IG5hdGl2ZU1pbihyZXN1bHQsIG1heFdhaXQgLSB0aW1lU2luY2VMYXN0SW52b2tlKSA6IHJlc3VsdDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3VsZEludm9rZSh0aW1lKSB7XG4gICAgdmFyIHRpbWVTaW5jZUxhc3RDYWxsID0gdGltZSAtIGxhc3RDYWxsVGltZSxcbiAgICAgICAgdGltZVNpbmNlTGFzdEludm9rZSA9IHRpbWUgLSBsYXN0SW52b2tlVGltZTtcblxuICAgIC8vIEVpdGhlciB0aGlzIGlzIHRoZSBmaXJzdCBjYWxsLCBhY3Rpdml0eSBoYXMgc3RvcHBlZCBhbmQgd2UncmUgYXQgdGhlXG4gICAgLy8gdHJhaWxpbmcgZWRnZSwgdGhlIHN5c3RlbSB0aW1lIGhhcyBnb25lIGJhY2t3YXJkcyBhbmQgd2UncmUgdHJlYXRpbmdcbiAgICAvLyBpdCBhcyB0aGUgdHJhaWxpbmcgZWRnZSwgb3Igd2UndmUgaGl0IHRoZSBgbWF4V2FpdGAgbGltaXQuXG4gICAgcmV0dXJuIChsYXN0Q2FsbFRpbWUgPT09IHVuZGVmaW5lZCB8fCAodGltZVNpbmNlTGFzdENhbGwgPj0gd2FpdCkgfHxcbiAgICAgICh0aW1lU2luY2VMYXN0Q2FsbCA8IDApIHx8IChtYXhpbmcgJiYgdGltZVNpbmNlTGFzdEludm9rZSA+PSBtYXhXYWl0KSk7XG4gIH1cblxuICBmdW5jdGlvbiB0aW1lckV4cGlyZWQoKSB7XG4gICAgdmFyIHRpbWUgPSBub3coKTtcbiAgICBpZiAoc2hvdWxkSW52b2tlKHRpbWUpKSB7XG4gICAgICByZXR1cm4gdHJhaWxpbmdFZGdlKHRpbWUpO1xuICAgIH1cbiAgICAvLyBSZXN0YXJ0IHRoZSB0aW1lci5cbiAgICB0aW1lcklkID0gc2V0VGltZW91dCh0aW1lckV4cGlyZWQsIHJlbWFpbmluZ1dhaXQodGltZSkpO1xuICB9XG5cbiAgZnVuY3Rpb24gdHJhaWxpbmdFZGdlKHRpbWUpIHtcbiAgICB0aW1lcklkID0gdW5kZWZpbmVkO1xuXG4gICAgLy8gT25seSBpbnZva2UgaWYgd2UgaGF2ZSBgbGFzdEFyZ3NgIHdoaWNoIG1lYW5zIGBmdW5jYCBoYXMgYmVlblxuICAgIC8vIGRlYm91bmNlZCBhdCBsZWFzdCBvbmNlLlxuICAgIGlmICh0cmFpbGluZyAmJiBsYXN0QXJncykge1xuICAgICAgcmV0dXJuIGludm9rZUZ1bmModGltZSk7XG4gICAgfVxuICAgIGxhc3RBcmdzID0gbGFzdFRoaXMgPSB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNhbmNlbCgpIHtcbiAgICBsYXN0SW52b2tlVGltZSA9IDA7XG4gICAgbGFzdEFyZ3MgPSBsYXN0Q2FsbFRpbWUgPSBsYXN0VGhpcyA9IHRpbWVySWQgPSB1bmRlZmluZWQ7XG4gIH1cblxuICBmdW5jdGlvbiBmbHVzaCgpIHtcbiAgICByZXR1cm4gdGltZXJJZCA9PT0gdW5kZWZpbmVkID8gcmVzdWx0IDogdHJhaWxpbmdFZGdlKG5vdygpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlYm91bmNlZCgpIHtcbiAgICB2YXIgdGltZSA9IG5vdygpLFxuICAgICAgICBpc0ludm9raW5nID0gc2hvdWxkSW52b2tlKHRpbWUpO1xuXG4gICAgbGFzdEFyZ3MgPSBhcmd1bWVudHM7XG4gICAgbGFzdFRoaXMgPSB0aGlzO1xuICAgIGxhc3RDYWxsVGltZSA9IHRpbWU7XG5cbiAgICBpZiAoaXNJbnZva2luZykge1xuICAgICAgaWYgKHRpbWVySWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gbGVhZGluZ0VkZ2UobGFzdENhbGxUaW1lKTtcbiAgICAgIH1cbiAgICAgIGlmIChtYXhpbmcpIHtcbiAgICAgICAgLy8gSGFuZGxlIGludm9jYXRpb25zIGluIGEgdGlnaHQgbG9vcC5cbiAgICAgICAgdGltZXJJZCA9IHNldFRpbWVvdXQodGltZXJFeHBpcmVkLCB3YWl0KTtcbiAgICAgICAgcmV0dXJuIGludm9rZUZ1bmMobGFzdENhbGxUaW1lKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRpbWVySWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGltZXJJZCA9IHNldFRpbWVvdXQodGltZXJFeHBpcmVkLCB3YWl0KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBkZWJvdW5jZWQuY2FuY2VsID0gY2FuY2VsO1xuICBkZWJvdW5jZWQuZmx1c2ggPSBmbHVzaDtcbiAgcmV0dXJuIGRlYm91bmNlZDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBkZWJvdW5jZTtcbiIsInZhciBpc09iamVjdCA9IHJlcXVpcmUoJy4vaXNPYmplY3QnKTtcblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIGZ1bmNUYWcgPSAnW29iamVjdCBGdW5jdGlvbl0nLFxuICAgIGdlblRhZyA9ICdbb2JqZWN0IEdlbmVyYXRvckZ1bmN0aW9uXSc7XG5cbi8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKlxuICogVXNlZCB0byByZXNvbHZlIHRoZVxuICogW2B0b1N0cmluZ1RhZ2BdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLW9iamVjdC5wcm90b3R5cGUudG9zdHJpbmcpXG4gKiBvZiB2YWx1ZXMuXG4gKi9cbnZhciBvYmplY3RUb1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYSBgRnVuY3Rpb25gIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDAuMS4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBjb3JyZWN0bHkgY2xhc3NpZmllZCxcbiAqICBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNGdW5jdGlvbihfKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzRnVuY3Rpb24oL2FiYy8pO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNGdW5jdGlvbih2YWx1ZSkge1xuICAvLyBUaGUgdXNlIG9mIGBPYmplY3QjdG9TdHJpbmdgIGF2b2lkcyBpc3N1ZXMgd2l0aCB0aGUgYHR5cGVvZmAgb3BlcmF0b3JcbiAgLy8gaW4gU2FmYXJpIDggd2hpY2ggcmV0dXJucyAnb2JqZWN0JyBmb3IgdHlwZWQgYXJyYXkgYW5kIHdlYWsgbWFwIGNvbnN0cnVjdG9ycyxcbiAgLy8gYW5kIFBoYW50b21KUyAxLjkgd2hpY2ggcmV0dXJucyAnZnVuY3Rpb24nIGZvciBgTm9kZUxpc3RgIGluc3RhbmNlcy5cbiAgdmFyIHRhZyA9IGlzT2JqZWN0KHZhbHVlKSA/IG9iamVjdFRvU3RyaW5nLmNhbGwodmFsdWUpIDogJyc7XG4gIHJldHVybiB0YWcgPT0gZnVuY1RhZyB8fCB0YWcgPT0gZ2VuVGFnO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzRnVuY3Rpb247XG4iLCIvKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIHRoZVxuICogW2xhbmd1YWdlIHR5cGVdKGh0dHA6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1lY21hc2NyaXB0LWxhbmd1YWdlLXR5cGVzKVxuICogb2YgYE9iamVjdGAuIChlLmcuIGFycmF5cywgZnVuY3Rpb25zLCBvYmplY3RzLCByZWdleGVzLCBgbmV3IE51bWJlcigwKWAsIGFuZCBgbmV3IFN0cmluZygnJylgKVxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMC4xLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGFuIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzT2JqZWN0KHt9KTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChfLm5vb3ApO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QobnVsbCk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc09iamVjdCh2YWx1ZSkge1xuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcbiAgcmV0dXJuICEhdmFsdWUgJiYgKHR5cGUgPT0gJ29iamVjdCcgfHwgdHlwZSA9PSAnZnVuY3Rpb24nKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc09iamVjdDtcbiIsIi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgb2JqZWN0LWxpa2UuIEEgdmFsdWUgaXMgb2JqZWN0LWxpa2UgaWYgaXQncyBub3QgYG51bGxgXG4gKiBhbmQgaGFzIGEgYHR5cGVvZmAgcmVzdWx0IG9mIFwib2JqZWN0XCIuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSA0LjAuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgb2JqZWN0LWxpa2UsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc09iamVjdExpa2Uoe30pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdExpa2UoXy5ub29wKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc09iamVjdExpa2UobnVsbCk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc09iamVjdExpa2UodmFsdWUpIHtcbiAgcmV0dXJuICEhdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzT2JqZWN0TGlrZTtcbiIsInZhciBpc09iamVjdExpa2UgPSByZXF1aXJlKCcuL2lzT2JqZWN0TGlrZScpO1xuXG4vKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG52YXIgc3ltYm9sVGFnID0gJ1tvYmplY3QgU3ltYm9sXSc7XG5cbi8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKlxuICogVXNlZCB0byByZXNvbHZlIHRoZVxuICogW2B0b1N0cmluZ1RhZ2BdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLW9iamVjdC5wcm90b3R5cGUudG9zdHJpbmcpXG4gKiBvZiB2YWx1ZXMuXG4gKi9cbnZhciBvYmplY3RUb1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYSBgU3ltYm9sYCBwcmltaXRpdmUgb3Igb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgNC4wLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGNvcnJlY3RseSBjbGFzc2lmaWVkLFxuICogIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc1N5bWJvbChTeW1ib2wuaXRlcmF0b3IpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNTeW1ib2woJ2FiYycpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNTeW1ib2wodmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PSAnc3ltYm9sJyB8fFxuICAgIChpc09iamVjdExpa2UodmFsdWUpICYmIG9iamVjdFRvU3RyaW5nLmNhbGwodmFsdWUpID09IHN5bWJvbFRhZyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNTeW1ib2w7XG4iLCIvKipcbiAqIEdldHMgdGhlIHRpbWVzdGFtcCBvZiB0aGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0aGF0IGhhdmUgZWxhcHNlZCBzaW5jZVxuICogdGhlIFVuaXggZXBvY2ggKDEgSmFudWFyeSAxOTcwIDAwOjAwOjAwIFVUQykuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAyLjQuMFxuICogQGNhdGVnb3J5IERhdGVcbiAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgdGhlIHRpbWVzdGFtcC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5kZWZlcihmdW5jdGlvbihzdGFtcCkge1xuICogICBjb25zb2xlLmxvZyhfLm5vdygpIC0gc3RhbXApO1xuICogfSwgXy5ub3coKSk7XG4gKiAvLyA9PiBMb2dzIHRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIGl0IHRvb2sgZm9yIHRoZSBkZWZlcnJlZCBpbnZvY2F0aW9uLlxuICovXG5mdW5jdGlvbiBub3coKSB7XG4gIHJldHVybiBEYXRlLm5vdygpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG5vdztcbiIsInZhciBpc0Z1bmN0aW9uID0gcmVxdWlyZSgnLi9pc0Z1bmN0aW9uJyksXG4gICAgaXNPYmplY3QgPSByZXF1aXJlKCcuL2lzT2JqZWN0JyksXG4gICAgaXNTeW1ib2wgPSByZXF1aXJlKCcuL2lzU3ltYm9sJyk7XG5cbi8qKiBVc2VkIGFzIHJlZmVyZW5jZXMgZm9yIHZhcmlvdXMgYE51bWJlcmAgY29uc3RhbnRzLiAqL1xudmFyIE5BTiA9IDAgLyAwO1xuXG4vKiogVXNlZCB0byBtYXRjaCBsZWFkaW5nIGFuZCB0cmFpbGluZyB3aGl0ZXNwYWNlLiAqL1xudmFyIHJlVHJpbSA9IC9eXFxzK3xcXHMrJC9nO1xuXG4vKiogVXNlZCB0byBkZXRlY3QgYmFkIHNpZ25lZCBoZXhhZGVjaW1hbCBzdHJpbmcgdmFsdWVzLiAqL1xudmFyIHJlSXNCYWRIZXggPSAvXlstK10weFswLTlhLWZdKyQvaTtcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IGJpbmFyeSBzdHJpbmcgdmFsdWVzLiAqL1xudmFyIHJlSXNCaW5hcnkgPSAvXjBiWzAxXSskL2k7XG5cbi8qKiBVc2VkIHRvIGRldGVjdCBvY3RhbCBzdHJpbmcgdmFsdWVzLiAqL1xudmFyIHJlSXNPY3RhbCA9IC9eMG9bMC03XSskL2k7XG5cbi8qKiBCdWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcyB3aXRob3V0IGEgZGVwZW5kZW5jeSBvbiBgcm9vdGAuICovXG52YXIgZnJlZVBhcnNlSW50ID0gcGFyc2VJbnQ7XG5cbi8qKlxuICogQ29udmVydHMgYHZhbHVlYCB0byBhIG51bWJlci5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gcHJvY2Vzcy5cbiAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgdGhlIG51bWJlci5cbiAqIEBleGFtcGxlXG4gKlxuICogXy50b051bWJlcigzLjIpO1xuICogLy8gPT4gMy4yXG4gKlxuICogXy50b051bWJlcihOdW1iZXIuTUlOX1ZBTFVFKTtcbiAqIC8vID0+IDVlLTMyNFxuICpcbiAqIF8udG9OdW1iZXIoSW5maW5pdHkpO1xuICogLy8gPT4gSW5maW5pdHlcbiAqXG4gKiBfLnRvTnVtYmVyKCczLjInKTtcbiAqIC8vID0+IDMuMlxuICovXG5mdW5jdGlvbiB0b051bWJlcih2YWx1ZSkge1xuICBpZiAodHlwZW9mIHZhbHVlID09ICdudW1iZXInKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG4gIGlmIChpc1N5bWJvbCh2YWx1ZSkpIHtcbiAgICByZXR1cm4gTkFOO1xuICB9XG4gIGlmIChpc09iamVjdCh2YWx1ZSkpIHtcbiAgICB2YXIgb3RoZXIgPSBpc0Z1bmN0aW9uKHZhbHVlLnZhbHVlT2YpID8gdmFsdWUudmFsdWVPZigpIDogdmFsdWU7XG4gICAgdmFsdWUgPSBpc09iamVjdChvdGhlcikgPyAob3RoZXIgKyAnJykgOiBvdGhlcjtcbiAgfVxuICBpZiAodHlwZW9mIHZhbHVlICE9ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHZhbHVlID09PSAwID8gdmFsdWUgOiArdmFsdWU7XG4gIH1cbiAgdmFsdWUgPSB2YWx1ZS5yZXBsYWNlKHJlVHJpbSwgJycpO1xuICB2YXIgaXNCaW5hcnkgPSByZUlzQmluYXJ5LnRlc3QodmFsdWUpO1xuICByZXR1cm4gKGlzQmluYXJ5IHx8IHJlSXNPY3RhbC50ZXN0KHZhbHVlKSlcbiAgICA/IGZyZWVQYXJzZUludCh2YWx1ZS5zbGljZSgyKSwgaXNCaW5hcnkgPyAyIDogOClcbiAgICA6IChyZUlzQmFkSGV4LnRlc3QodmFsdWUpID8gTkFOIDogK3ZhbHVlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB0b051bWJlcjtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGV4cGFuZG8gPSAnc2VrdG9yLScgKyBEYXRlLm5vdygpO1xudmFyIHJzaWJsaW5ncyA9IC9bK35dLztcbnZhciBkb2N1bWVudCA9IGdsb2JhbC5kb2N1bWVudDtcbnZhciBkZWwgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgfHwge307XG52YXIgbWF0Y2ggPSAoXG4gIGRlbC5tYXRjaGVzIHx8XG4gIGRlbC53ZWJraXRNYXRjaGVzU2VsZWN0b3IgfHxcbiAgZGVsLm1vek1hdGNoZXNTZWxlY3RvciB8fFxuICBkZWwub01hdGNoZXNTZWxlY3RvciB8fFxuICBkZWwubXNNYXRjaGVzU2VsZWN0b3IgfHxcbiAgbmV2ZXJcbik7XG5cbm1vZHVsZS5leHBvcnRzID0gc2VrdG9yO1xuXG5zZWt0b3IubWF0Y2hlcyA9IG1hdGNoZXM7XG5zZWt0b3IubWF0Y2hlc1NlbGVjdG9yID0gbWF0Y2hlc1NlbGVjdG9yO1xuXG5mdW5jdGlvbiBxc2EgKHNlbGVjdG9yLCBjb250ZXh0KSB7XG4gIHZhciBleGlzdGVkLCBpZCwgcHJlZml4LCBwcmVmaXhlZCwgYWRhcHRlciwgaGFjayA9IGNvbnRleHQgIT09IGRvY3VtZW50O1xuICBpZiAoaGFjaykgeyAvLyBpZCBoYWNrIGZvciBjb250ZXh0LXJvb3RlZCBxdWVyaWVzXG4gICAgZXhpc3RlZCA9IGNvbnRleHQuZ2V0QXR0cmlidXRlKCdpZCcpO1xuICAgIGlkID0gZXhpc3RlZCB8fCBleHBhbmRvO1xuICAgIHByZWZpeCA9ICcjJyArIGlkICsgJyAnO1xuICAgIHByZWZpeGVkID0gcHJlZml4ICsgc2VsZWN0b3IucmVwbGFjZSgvLC9nLCAnLCcgKyBwcmVmaXgpO1xuICAgIGFkYXB0ZXIgPSByc2libGluZ3MudGVzdChzZWxlY3RvcikgJiYgY29udGV4dC5wYXJlbnROb2RlO1xuICAgIGlmICghZXhpc3RlZCkgeyBjb250ZXh0LnNldEF0dHJpYnV0ZSgnaWQnLCBpZCk7IH1cbiAgfVxuICB0cnkge1xuICAgIHJldHVybiAoYWRhcHRlciB8fCBjb250ZXh0KS5xdWVyeVNlbGVjdG9yQWxsKHByZWZpeGVkIHx8IHNlbGVjdG9yKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBbXTtcbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAoZXhpc3RlZCA9PT0gbnVsbCkgeyBjb250ZXh0LnJlbW92ZUF0dHJpYnV0ZSgnaWQnKTsgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHNla3RvciAoc2VsZWN0b3IsIGN0eCwgY29sbGVjdGlvbiwgc2VlZCkge1xuICB2YXIgZWxlbWVudDtcbiAgdmFyIGNvbnRleHQgPSBjdHggfHwgZG9jdW1lbnQ7XG4gIHZhciByZXN1bHRzID0gY29sbGVjdGlvbiB8fCBbXTtcbiAgdmFyIGkgPSAwO1xuICBpZiAodHlwZW9mIHNlbGVjdG9yICE9PSAnc3RyaW5nJykge1xuICAgIHJldHVybiByZXN1bHRzO1xuICB9XG4gIGlmIChjb250ZXh0Lm5vZGVUeXBlICE9PSAxICYmIGNvbnRleHQubm9kZVR5cGUgIT09IDkpIHtcbiAgICByZXR1cm4gW107IC8vIGJhaWwgaWYgY29udGV4dCBpcyBub3QgYW4gZWxlbWVudCBvciBkb2N1bWVudFxuICB9XG4gIGlmIChzZWVkKSB7XG4gICAgd2hpbGUgKChlbGVtZW50ID0gc2VlZFtpKytdKSkge1xuICAgICAgaWYgKG1hdGNoZXNTZWxlY3RvcihlbGVtZW50LCBzZWxlY3RvcikpIHtcbiAgICAgICAgcmVzdWx0cy5wdXNoKGVsZW1lbnQpO1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICByZXN1bHRzLnB1c2guYXBwbHkocmVzdWx0cywgcXNhKHNlbGVjdG9yLCBjb250ZXh0KSk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbmZ1bmN0aW9uIG1hdGNoZXMgKHNlbGVjdG9yLCBlbGVtZW50cykge1xuICByZXR1cm4gc2VrdG9yKHNlbGVjdG9yLCBudWxsLCBudWxsLCBlbGVtZW50cyk7XG59XG5cbmZ1bmN0aW9uIG1hdGNoZXNTZWxlY3RvciAoZWxlbWVudCwgc2VsZWN0b3IpIHtcbiAgcmV0dXJuIG1hdGNoLmNhbGwoZWxlbWVudCwgc2VsZWN0b3IpO1xufVxuXG5mdW5jdGlvbiBuZXZlciAoKSB7IHJldHVybiBmYWxzZTsgfVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZ2V0U2VsZWN0aW9uO1xudmFyIGRvYyA9IGdsb2JhbC5kb2N1bWVudDtcbnZhciBnZXRTZWxlY3Rpb25SYXcgPSByZXF1aXJlKCcuL2dldFNlbGVjdGlvblJhdycpO1xudmFyIGdldFNlbGVjdGlvbk51bGxPcCA9IHJlcXVpcmUoJy4vZ2V0U2VsZWN0aW9uTnVsbE9wJyk7XG52YXIgZ2V0U2VsZWN0aW9uU3ludGhldGljID0gcmVxdWlyZSgnLi9nZXRTZWxlY3Rpb25TeW50aGV0aWMnKTtcbnZhciBpc0hvc3QgPSByZXF1aXJlKCcuL2lzSG9zdCcpO1xuaWYgKGlzSG9zdC5tZXRob2QoZ2xvYmFsLCAnZ2V0U2VsZWN0aW9uJykpIHtcbiAgZ2V0U2VsZWN0aW9uID0gZ2V0U2VsZWN0aW9uUmF3O1xufSBlbHNlIGlmICh0eXBlb2YgZG9jLnNlbGVjdGlvbiA9PT0gJ29iamVjdCcgJiYgZG9jLnNlbGVjdGlvbikge1xuICBnZXRTZWxlY3Rpb24gPSBnZXRTZWxlY3Rpb25TeW50aGV0aWM7XG59IGVsc2Uge1xuICBnZXRTZWxlY3Rpb24gPSBnZXRTZWxlY3Rpb25OdWxsT3A7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZ2V0U2VsZWN0aW9uO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBub29wICgpIHt9XG5cbmZ1bmN0aW9uIGdldFNlbGVjdGlvbk51bGxPcCAoKSB7XG4gIHJldHVybiB7XG4gICAgcmVtb3ZlQWxsUmFuZ2VzOiBub29wLFxuICAgIGFkZFJhbmdlOiBub29wXG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZ2V0U2VsZWN0aW9uTnVsbE9wO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBnZXRTZWxlY3Rpb25SYXcgKCkge1xuICByZXR1cm4gZ2xvYmFsLmdldFNlbGVjdGlvbigpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGdldFNlbGVjdGlvblJhdztcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHJhbmdlVG9UZXh0UmFuZ2UgPSByZXF1aXJlKCcuL3JhbmdlVG9UZXh0UmFuZ2UnKTtcbnZhciBkb2MgPSBnbG9iYWwuZG9jdW1lbnQ7XG52YXIgYm9keSA9IGRvYy5ib2R5O1xudmFyIEdldFNlbGVjdGlvblByb3RvID0gR2V0U2VsZWN0aW9uLnByb3RvdHlwZTtcblxuZnVuY3Rpb24gR2V0U2VsZWN0aW9uIChzZWxlY3Rpb24pIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB2YXIgcmFuZ2UgPSBzZWxlY3Rpb24uY3JlYXRlUmFuZ2UoKTtcblxuICB0aGlzLl9zZWxlY3Rpb24gPSBzZWxlY3Rpb247XG4gIHRoaXMuX3JhbmdlcyA9IFtdO1xuXG4gIGlmIChzZWxlY3Rpb24udHlwZSA9PT0gJ0NvbnRyb2wnKSB7XG4gICAgdXBkYXRlQ29udHJvbFNlbGVjdGlvbihzZWxmKTtcbiAgfSBlbHNlIGlmIChpc1RleHRSYW5nZShyYW5nZSkpIHtcbiAgICB1cGRhdGVGcm9tVGV4dFJhbmdlKHNlbGYsIHJhbmdlKTtcbiAgfSBlbHNlIHtcbiAgICB1cGRhdGVFbXB0eVNlbGVjdGlvbihzZWxmKTtcbiAgfVxufVxuXG5HZXRTZWxlY3Rpb25Qcm90by5yZW1vdmVBbGxSYW5nZXMgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciB0ZXh0UmFuZ2U7XG4gIHRyeSB7XG4gICAgdGhpcy5fc2VsZWN0aW9uLmVtcHR5KCk7XG4gICAgaWYgKHRoaXMuX3NlbGVjdGlvbi50eXBlICE9PSAnTm9uZScpIHtcbiAgICAgIHRleHRSYW5nZSA9IGJvZHkuY3JlYXRlVGV4dFJhbmdlKCk7XG4gICAgICB0ZXh0UmFuZ2Uuc2VsZWN0KCk7XG4gICAgICB0aGlzLl9zZWxlY3Rpb24uZW1wdHkoKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHtcbiAgfVxuICB1cGRhdGVFbXB0eVNlbGVjdGlvbih0aGlzKTtcbn07XG5cbkdldFNlbGVjdGlvblByb3RvLmFkZFJhbmdlID0gZnVuY3Rpb24gKHJhbmdlKSB7XG4gIGlmICh0aGlzLl9zZWxlY3Rpb24udHlwZSA9PT0gJ0NvbnRyb2wnKSB7XG4gICAgYWRkUmFuZ2VUb0NvbnRyb2xTZWxlY3Rpb24odGhpcywgcmFuZ2UpO1xuICB9IGVsc2Uge1xuICAgIHJhbmdlVG9UZXh0UmFuZ2UocmFuZ2UpLnNlbGVjdCgpO1xuICAgIHRoaXMuX3Jhbmdlc1swXSA9IHJhbmdlO1xuICAgIHRoaXMucmFuZ2VDb3VudCA9IDE7XG4gICAgdGhpcy5pc0NvbGxhcHNlZCA9IHRoaXMuX3Jhbmdlc1swXS5jb2xsYXBzZWQ7XG4gICAgdXBkYXRlQW5jaG9yQW5kRm9jdXNGcm9tUmFuZ2UodGhpcywgcmFuZ2UsIGZhbHNlKTtcbiAgfVxufTtcblxuR2V0U2VsZWN0aW9uUHJvdG8uc2V0UmFuZ2VzID0gZnVuY3Rpb24gKHJhbmdlcykge1xuICB0aGlzLnJlbW92ZUFsbFJhbmdlcygpO1xuICB2YXIgcmFuZ2VDb3VudCA9IHJhbmdlcy5sZW5ndGg7XG4gIGlmIChyYW5nZUNvdW50ID4gMSkge1xuICAgIGNyZWF0ZUNvbnRyb2xTZWxlY3Rpb24odGhpcywgcmFuZ2VzKTtcbiAgfSBlbHNlIGlmIChyYW5nZUNvdW50KSB7XG4gICAgdGhpcy5hZGRSYW5nZShyYW5nZXNbMF0pO1xuICB9XG59O1xuXG5HZXRTZWxlY3Rpb25Qcm90by5nZXRSYW5nZUF0ID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gIGlmIChpbmRleCA8IDAgfHwgaW5kZXggPj0gdGhpcy5yYW5nZUNvdW50KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdnZXRSYW5nZUF0KCk6IGluZGV4IG91dCBvZiBib3VuZHMnKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gdGhpcy5fcmFuZ2VzW2luZGV4XS5jbG9uZVJhbmdlKCk7XG4gIH1cbn07XG5cbkdldFNlbGVjdGlvblByb3RvLnJlbW92ZVJhbmdlID0gZnVuY3Rpb24gKHJhbmdlKSB7XG4gIGlmICh0aGlzLl9zZWxlY3Rpb24udHlwZSAhPT0gJ0NvbnRyb2wnKSB7XG4gICAgcmVtb3ZlUmFuZ2VNYW51YWxseSh0aGlzLCByYW5nZSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBjb250cm9sUmFuZ2UgPSB0aGlzLl9zZWxlY3Rpb24uY3JlYXRlUmFuZ2UoKTtcbiAgdmFyIHJhbmdlRWxlbWVudCA9IGdldFNpbmdsZUVsZW1lbnRGcm9tUmFuZ2UocmFuZ2UpO1xuICB2YXIgbmV3Q29udHJvbFJhbmdlID0gYm9keS5jcmVhdGVDb250cm9sUmFuZ2UoKTtcbiAgdmFyIGVsO1xuICB2YXIgcmVtb3ZlZCA9IGZhbHNlO1xuICBmb3IgKHZhciBpID0gMCwgbGVuID0gY29udHJvbFJhbmdlLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgZWwgPSBjb250cm9sUmFuZ2UuaXRlbShpKTtcbiAgICBpZiAoZWwgIT09IHJhbmdlRWxlbWVudCB8fCByZW1vdmVkKSB7XG4gICAgICBuZXdDb250cm9sUmFuZ2UuYWRkKGNvbnRyb2xSYW5nZS5pdGVtKGkpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVtb3ZlZCA9IHRydWU7XG4gICAgfVxuICB9XG4gIG5ld0NvbnRyb2xSYW5nZS5zZWxlY3QoKTtcbiAgdXBkYXRlQ29udHJvbFNlbGVjdGlvbih0aGlzKTtcbn07XG5cbkdldFNlbGVjdGlvblByb3RvLmVhY2hSYW5nZSA9IGZ1bmN0aW9uIChmbiwgcmV0dXJuVmFsdWUpIHtcbiAgdmFyIGkgPSAwO1xuICB2YXIgbGVuID0gdGhpcy5fcmFuZ2VzLmxlbmd0aDtcbiAgZm9yIChpID0gMDsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKGZuKHRoaXMuZ2V0UmFuZ2VBdChpKSkpIHtcbiAgICAgIHJldHVybiByZXR1cm5WYWx1ZTtcbiAgICB9XG4gIH1cbn07XG5cbkdldFNlbGVjdGlvblByb3RvLmdldEFsbFJhbmdlcyA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHJhbmdlcyA9IFtdO1xuICB0aGlzLmVhY2hSYW5nZShmdW5jdGlvbiAocmFuZ2UpIHtcbiAgICByYW5nZXMucHVzaChyYW5nZSk7XG4gIH0pO1xuICByZXR1cm4gcmFuZ2VzO1xufTtcblxuR2V0U2VsZWN0aW9uUHJvdG8uc2V0U2luZ2xlUmFuZ2UgPSBmdW5jdGlvbiAocmFuZ2UpIHtcbiAgdGhpcy5yZW1vdmVBbGxSYW5nZXMoKTtcbiAgdGhpcy5hZGRSYW5nZShyYW5nZSk7XG59O1xuXG5mdW5jdGlvbiBjcmVhdGVDb250cm9sU2VsZWN0aW9uIChzZWwsIHJhbmdlcykge1xuICB2YXIgY29udHJvbFJhbmdlID0gYm9keS5jcmVhdGVDb250cm9sUmFuZ2UoKTtcbiAgZm9yICh2YXIgaSA9IDAsIGVsLCBsZW4gPSByYW5nZXMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBlbCA9IGdldFNpbmdsZUVsZW1lbnRGcm9tUmFuZ2UocmFuZ2VzW2ldKTtcbiAgICB0cnkge1xuICAgICAgY29udHJvbFJhbmdlLmFkZChlbCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdzZXRSYW5nZXMoKTogRWxlbWVudCBjb3VsZCBub3QgYmUgYWRkZWQgdG8gY29udHJvbCBzZWxlY3Rpb24nKTtcbiAgICB9XG4gIH1cbiAgY29udHJvbFJhbmdlLnNlbGVjdCgpO1xuICB1cGRhdGVDb250cm9sU2VsZWN0aW9uKHNlbCk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZVJhbmdlTWFudWFsbHkgKHNlbCwgcmFuZ2UpIHtcbiAgdmFyIHJhbmdlcyA9IHNlbC5nZXRBbGxSYW5nZXMoKTtcbiAgc2VsLnJlbW92ZUFsbFJhbmdlcygpO1xuICBmb3IgKHZhciBpID0gMCwgbGVuID0gcmFuZ2VzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKCFpc1NhbWVSYW5nZShyYW5nZSwgcmFuZ2VzW2ldKSkge1xuICAgICAgc2VsLmFkZFJhbmdlKHJhbmdlc1tpXSk7XG4gICAgfVxuICB9XG4gIGlmICghc2VsLnJhbmdlQ291bnQpIHtcbiAgICB1cGRhdGVFbXB0eVNlbGVjdGlvbihzZWwpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUFuY2hvckFuZEZvY3VzRnJvbVJhbmdlIChzZWwsIHJhbmdlKSB7XG4gIHZhciBhbmNob3JQcmVmaXggPSAnc3RhcnQnO1xuICB2YXIgZm9jdXNQcmVmaXggPSAnZW5kJztcbiAgc2VsLmFuY2hvck5vZGUgPSByYW5nZVthbmNob3JQcmVmaXggKyAnQ29udGFpbmVyJ107XG4gIHNlbC5hbmNob3JPZmZzZXQgPSByYW5nZVthbmNob3JQcmVmaXggKyAnT2Zmc2V0J107XG4gIHNlbC5mb2N1c05vZGUgPSByYW5nZVtmb2N1c1ByZWZpeCArICdDb250YWluZXInXTtcbiAgc2VsLmZvY3VzT2Zmc2V0ID0gcmFuZ2VbZm9jdXNQcmVmaXggKyAnT2Zmc2V0J107XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUVtcHR5U2VsZWN0aW9uIChzZWwpIHtcbiAgc2VsLmFuY2hvck5vZGUgPSBzZWwuZm9jdXNOb2RlID0gbnVsbDtcbiAgc2VsLmFuY2hvck9mZnNldCA9IHNlbC5mb2N1c09mZnNldCA9IDA7XG4gIHNlbC5yYW5nZUNvdW50ID0gMDtcbiAgc2VsLmlzQ29sbGFwc2VkID0gdHJ1ZTtcbiAgc2VsLl9yYW5nZXMubGVuZ3RoID0gMDtcbn1cblxuZnVuY3Rpb24gcmFuZ2VDb250YWluc1NpbmdsZUVsZW1lbnQgKHJhbmdlTm9kZXMpIHtcbiAgaWYgKCFyYW5nZU5vZGVzLmxlbmd0aCB8fCByYW5nZU5vZGVzWzBdLm5vZGVUeXBlICE9PSAxKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGZvciAodmFyIGkgPSAxLCBsZW4gPSByYW5nZU5vZGVzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKCFpc0FuY2VzdG9yT2YocmFuZ2VOb2Rlc1swXSwgcmFuZ2VOb2Rlc1tpXSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGdldFNpbmdsZUVsZW1lbnRGcm9tUmFuZ2UgKHJhbmdlKSB7XG4gIHZhciBub2RlcyA9IHJhbmdlLmdldE5vZGVzKCk7XG4gIGlmICghcmFuZ2VDb250YWluc1NpbmdsZUVsZW1lbnQobm9kZXMpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdnZXRTaW5nbGVFbGVtZW50RnJvbVJhbmdlKCk6IHJhbmdlIGRpZCBub3QgY29uc2lzdCBvZiBhIHNpbmdsZSBlbGVtZW50Jyk7XG4gIH1cbiAgcmV0dXJuIG5vZGVzWzBdO1xufVxuXG5mdW5jdGlvbiBpc1RleHRSYW5nZSAocmFuZ2UpIHtcbiAgcmV0dXJuIHJhbmdlICYmIHJhbmdlLnRleHQgIT09IHZvaWQgMDtcbn1cblxuZnVuY3Rpb24gdXBkYXRlRnJvbVRleHRSYW5nZSAoc2VsLCByYW5nZSkge1xuICBzZWwuX3JhbmdlcyA9IFtyYW5nZV07XG4gIHVwZGF0ZUFuY2hvckFuZEZvY3VzRnJvbVJhbmdlKHNlbCwgcmFuZ2UsIGZhbHNlKTtcbiAgc2VsLnJhbmdlQ291bnQgPSAxO1xuICBzZWwuaXNDb2xsYXBzZWQgPSByYW5nZS5jb2xsYXBzZWQ7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUNvbnRyb2xTZWxlY3Rpb24gKHNlbCkge1xuICBzZWwuX3Jhbmdlcy5sZW5ndGggPSAwO1xuICBpZiAoc2VsLl9zZWxlY3Rpb24udHlwZSA9PT0gJ05vbmUnKSB7XG4gICAgdXBkYXRlRW1wdHlTZWxlY3Rpb24oc2VsKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgY29udHJvbFJhbmdlID0gc2VsLl9zZWxlY3Rpb24uY3JlYXRlUmFuZ2UoKTtcbiAgICBpZiAoaXNUZXh0UmFuZ2UoY29udHJvbFJhbmdlKSkge1xuICAgICAgdXBkYXRlRnJvbVRleHRSYW5nZShzZWwsIGNvbnRyb2xSYW5nZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNlbC5yYW5nZUNvdW50ID0gY29udHJvbFJhbmdlLmxlbmd0aDtcbiAgICAgIHZhciByYW5nZTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2VsLnJhbmdlQ291bnQ7ICsraSkge1xuICAgICAgICByYW5nZSA9IGRvYy5jcmVhdGVSYW5nZSgpO1xuICAgICAgICByYW5nZS5zZWxlY3ROb2RlKGNvbnRyb2xSYW5nZS5pdGVtKGkpKTtcbiAgICAgICAgc2VsLl9yYW5nZXMucHVzaChyYW5nZSk7XG4gICAgICB9XG4gICAgICBzZWwuaXNDb2xsYXBzZWQgPSBzZWwucmFuZ2VDb3VudCA9PT0gMSAmJiBzZWwuX3Jhbmdlc1swXS5jb2xsYXBzZWQ7XG4gICAgICB1cGRhdGVBbmNob3JBbmRGb2N1c0Zyb21SYW5nZShzZWwsIHNlbC5fcmFuZ2VzW3NlbC5yYW5nZUNvdW50IC0gMV0sIGZhbHNlKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gYWRkUmFuZ2VUb0NvbnRyb2xTZWxlY3Rpb24gKHNlbCwgcmFuZ2UpIHtcbiAgdmFyIGNvbnRyb2xSYW5nZSA9IHNlbC5fc2VsZWN0aW9uLmNyZWF0ZVJhbmdlKCk7XG4gIHZhciByYW5nZUVsZW1lbnQgPSBnZXRTaW5nbGVFbGVtZW50RnJvbVJhbmdlKHJhbmdlKTtcbiAgdmFyIG5ld0NvbnRyb2xSYW5nZSA9IGJvZHkuY3JlYXRlQ29udHJvbFJhbmdlKCk7XG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBjb250cm9sUmFuZ2UubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBuZXdDb250cm9sUmFuZ2UuYWRkKGNvbnRyb2xSYW5nZS5pdGVtKGkpKTtcbiAgfVxuICB0cnkge1xuICAgIG5ld0NvbnRyb2xSYW5nZS5hZGQocmFuZ2VFbGVtZW50KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHRocm93IG5ldyBFcnJvcignYWRkUmFuZ2UoKTogRWxlbWVudCBjb3VsZCBub3QgYmUgYWRkZWQgdG8gY29udHJvbCBzZWxlY3Rpb24nKTtcbiAgfVxuICBuZXdDb250cm9sUmFuZ2Uuc2VsZWN0KCk7XG4gIHVwZGF0ZUNvbnRyb2xTZWxlY3Rpb24oc2VsKTtcbn1cblxuZnVuY3Rpb24gaXNTYW1lUmFuZ2UgKGxlZnQsIHJpZ2h0KSB7XG4gIHJldHVybiAoXG4gICAgbGVmdC5zdGFydENvbnRhaW5lciA9PT0gcmlnaHQuc3RhcnRDb250YWluZXIgJiZcbiAgICBsZWZ0LnN0YXJ0T2Zmc2V0ID09PSByaWdodC5zdGFydE9mZnNldCAmJlxuICAgIGxlZnQuZW5kQ29udGFpbmVyID09PSByaWdodC5lbmRDb250YWluZXIgJiZcbiAgICBsZWZ0LmVuZE9mZnNldCA9PT0gcmlnaHQuZW5kT2Zmc2V0XG4gICk7XG59XG5cbmZ1bmN0aW9uIGlzQW5jZXN0b3JPZiAoYW5jZXN0b3IsIGRlc2NlbmRhbnQpIHtcbiAgdmFyIG5vZGUgPSBkZXNjZW5kYW50O1xuICB3aGlsZSAobm9kZS5wYXJlbnROb2RlKSB7XG4gICAgaWYgKG5vZGUucGFyZW50Tm9kZSA9PT0gYW5jZXN0b3IpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gZ2V0U2VsZWN0aW9uICgpIHtcbiAgcmV0dXJuIG5ldyBHZXRTZWxlY3Rpb24oZ2xvYmFsLmRvY3VtZW50LnNlbGVjdGlvbik7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZ2V0U2VsZWN0aW9uO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBpc0hvc3RNZXRob2QgKGhvc3QsIHByb3ApIHtcbiAgdmFyIHR5cGUgPSB0eXBlb2YgaG9zdFtwcm9wXTtcbiAgcmV0dXJuIHR5cGUgPT09ICdmdW5jdGlvbicgfHwgISEodHlwZSA9PT0gJ29iamVjdCcgJiYgaG9zdFtwcm9wXSkgfHwgdHlwZSA9PT0gJ3Vua25vd24nO1xufVxuXG5mdW5jdGlvbiBpc0hvc3RQcm9wZXJ0eSAoaG9zdCwgcHJvcCkge1xuICByZXR1cm4gdHlwZW9mIGhvc3RbcHJvcF0gIT09ICd1bmRlZmluZWQnO1xufVxuXG5mdW5jdGlvbiBtYW55IChmbikge1xuICByZXR1cm4gZnVuY3Rpb24gYXJlSG9zdGVkIChob3N0LCBwcm9wcykge1xuICAgIHZhciBpID0gcHJvcHMubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIGlmICghZm4oaG9zdCwgcHJvcHNbaV0pKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBtZXRob2Q6IGlzSG9zdE1ldGhvZCxcbiAgbWV0aG9kczogbWFueShpc0hvc3RNZXRob2QpLFxuICBwcm9wZXJ0eTogaXNIb3N0UHJvcGVydHksXG4gIHByb3BlcnRpZXM6IG1hbnkoaXNIb3N0UHJvcGVydHkpXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZG9jID0gZ2xvYmFsLmRvY3VtZW50O1xudmFyIGJvZHkgPSBkb2MuYm9keTtcblxuZnVuY3Rpb24gcmFuZ2VUb1RleHRSYW5nZSAocCkge1xuICBpZiAocC5jb2xsYXBzZWQpIHtcbiAgICByZXR1cm4gY3JlYXRlQm91bmRhcnlUZXh0UmFuZ2UoeyBub2RlOiBwLnN0YXJ0Q29udGFpbmVyLCBvZmZzZXQ6IHAuc3RhcnRPZmZzZXQgfSwgdHJ1ZSk7XG4gIH1cbiAgdmFyIHN0YXJ0UmFuZ2UgPSBjcmVhdGVCb3VuZGFyeVRleHRSYW5nZSh7IG5vZGU6IHAuc3RhcnRDb250YWluZXIsIG9mZnNldDogcC5zdGFydE9mZnNldCB9LCB0cnVlKTtcbiAgdmFyIGVuZFJhbmdlID0gY3JlYXRlQm91bmRhcnlUZXh0UmFuZ2UoeyBub2RlOiBwLmVuZENvbnRhaW5lciwgb2Zmc2V0OiBwLmVuZE9mZnNldCB9LCBmYWxzZSk7XG4gIHZhciB0ZXh0UmFuZ2UgPSBib2R5LmNyZWF0ZVRleHRSYW5nZSgpO1xuICB0ZXh0UmFuZ2Uuc2V0RW5kUG9pbnQoJ1N0YXJ0VG9TdGFydCcsIHN0YXJ0UmFuZ2UpO1xuICB0ZXh0UmFuZ2Uuc2V0RW5kUG9pbnQoJ0VuZFRvRW5kJywgZW5kUmFuZ2UpO1xuICByZXR1cm4gdGV4dFJhbmdlO1xufVxuXG5mdW5jdGlvbiBpc0NoYXJhY3RlckRhdGFOb2RlIChub2RlKSB7XG4gIHZhciB0ID0gbm9kZS5ub2RlVHlwZTtcbiAgcmV0dXJuIHQgPT09IDMgfHwgdCA9PT0gNCB8fCB0ID09PSA4IDtcbn1cblxuZnVuY3Rpb24gY3JlYXRlQm91bmRhcnlUZXh0UmFuZ2UgKHAsIHN0YXJ0aW5nKSB7XG4gIHZhciBib3VuZDtcbiAgdmFyIHBhcmVudDtcbiAgdmFyIG9mZnNldCA9IHAub2Zmc2V0O1xuICB2YXIgd29ya2luZ05vZGU7XG4gIHZhciBjaGlsZE5vZGVzO1xuICB2YXIgcmFuZ2UgPSBib2R5LmNyZWF0ZVRleHRSYW5nZSgpO1xuICB2YXIgZGF0YSA9IGlzQ2hhcmFjdGVyRGF0YU5vZGUocC5ub2RlKTtcblxuICBpZiAoZGF0YSkge1xuICAgIGJvdW5kID0gcC5ub2RlO1xuICAgIHBhcmVudCA9IGJvdW5kLnBhcmVudE5vZGU7XG4gIH0gZWxzZSB7XG4gICAgY2hpbGROb2RlcyA9IHAubm9kZS5jaGlsZE5vZGVzO1xuICAgIGJvdW5kID0gb2Zmc2V0IDwgY2hpbGROb2Rlcy5sZW5ndGggPyBjaGlsZE5vZGVzW29mZnNldF0gOiBudWxsO1xuICAgIHBhcmVudCA9IHAubm9kZTtcbiAgfVxuXG4gIHdvcmtpbmdOb2RlID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgd29ya2luZ05vZGUuaW5uZXJIVE1MID0gJyYjZmVmZjsnO1xuXG4gIGlmIChib3VuZCkge1xuICAgIHBhcmVudC5pbnNlcnRCZWZvcmUod29ya2luZ05vZGUsIGJvdW5kKTtcbiAgfSBlbHNlIHtcbiAgICBwYXJlbnQuYXBwZW5kQ2hpbGQod29ya2luZ05vZGUpO1xuICB9XG5cbiAgcmFuZ2UubW92ZVRvRWxlbWVudFRleHQod29ya2luZ05vZGUpO1xuICByYW5nZS5jb2xsYXBzZSghc3RhcnRpbmcpO1xuICBwYXJlbnQucmVtb3ZlQ2hpbGQod29ya2luZ05vZGUpO1xuXG4gIGlmIChkYXRhKSB7XG4gICAgcmFuZ2Vbc3RhcnRpbmcgPyAnbW92ZVN0YXJ0JyA6ICdtb3ZlRW5kJ10oJ2NoYXJhY3RlcicsIG9mZnNldCk7XG4gIH1cbiAgcmV0dXJuIHJhbmdlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJhbmdlVG9UZXh0UmFuZ2U7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBnZXRTZWxlY3Rpb24gPSByZXF1aXJlKCcuL2dldFNlbGVjdGlvbicpO1xudmFyIHNldFNlbGVjdGlvbiA9IHJlcXVpcmUoJy4vc2V0U2VsZWN0aW9uJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBnZXQ6IGdldFNlbGVjdGlvbixcbiAgc2V0OiBzZXRTZWxlY3Rpb25cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBnZXRTZWxlY3Rpb24gPSByZXF1aXJlKCcuL2dldFNlbGVjdGlvbicpO1xudmFyIHJhbmdlVG9UZXh0UmFuZ2UgPSByZXF1aXJlKCcuL3JhbmdlVG9UZXh0UmFuZ2UnKTtcbnZhciBkb2MgPSBnbG9iYWwuZG9jdW1lbnQ7XG5cbmZ1bmN0aW9uIHNldFNlbGVjdGlvbiAocCkge1xuICBpZiAoZG9jLmNyZWF0ZVJhbmdlKSB7XG4gICAgbW9kZXJuU2VsZWN0aW9uKCk7XG4gIH0gZWxzZSB7XG4gICAgb2xkU2VsZWN0aW9uKCk7XG4gIH1cblxuICBmdW5jdGlvbiBtb2Rlcm5TZWxlY3Rpb24gKCkge1xuICAgIHZhciBzZWwgPSBnZXRTZWxlY3Rpb24oKTtcbiAgICB2YXIgcmFuZ2UgPSBkb2MuY3JlYXRlUmFuZ2UoKTtcbiAgICBpZiAoIXAuc3RhcnRDb250YWluZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHAuZW5kQ29udGFpbmVyKSB7XG4gICAgICByYW5nZS5zZXRFbmQocC5lbmRDb250YWluZXIsIHAuZW5kT2Zmc2V0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmFuZ2Uuc2V0RW5kKHAuc3RhcnRDb250YWluZXIsIHAuc3RhcnRPZmZzZXQpO1xuICAgIH1cbiAgICByYW5nZS5zZXRTdGFydChwLnN0YXJ0Q29udGFpbmVyLCBwLnN0YXJ0T2Zmc2V0KTtcbiAgICBzZWwucmVtb3ZlQWxsUmFuZ2VzKCk7XG4gICAgc2VsLmFkZFJhbmdlKHJhbmdlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG9sZFNlbGVjdGlvbiAoKSB7XG4gICAgcmFuZ2VUb1RleHRSYW5nZShwKS5zZWxlY3QoKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNldFNlbGVjdGlvbjtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGdldCA9IGVhc3lHZXQ7XG52YXIgc2V0ID0gZWFzeVNldDtcblxuaWYgKGRvY3VtZW50LnNlbGVjdGlvbiAmJiBkb2N1bWVudC5zZWxlY3Rpb24uY3JlYXRlUmFuZ2UpIHtcbiAgZ2V0ID0gaGFyZEdldDtcbiAgc2V0ID0gaGFyZFNldDtcbn1cblxuZnVuY3Rpb24gZWFzeUdldCAoZWwpIHtcbiAgcmV0dXJuIHtcbiAgICBzdGFydDogZWwuc2VsZWN0aW9uU3RhcnQsXG4gICAgZW5kOiBlbC5zZWxlY3Rpb25FbmRcbiAgfTtcbn1cblxuZnVuY3Rpb24gaGFyZEdldCAoZWwpIHtcbiAgdmFyIGFjdGl2ZSA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG4gIGlmIChhY3RpdmUgIT09IGVsKSB7XG4gICAgZWwuZm9jdXMoKTtcbiAgfVxuXG4gIHZhciByYW5nZSA9IGRvY3VtZW50LnNlbGVjdGlvbi5jcmVhdGVSYW5nZSgpO1xuICB2YXIgYm9va21hcmsgPSByYW5nZS5nZXRCb29rbWFyaygpO1xuICB2YXIgb3JpZ2luYWwgPSBlbC52YWx1ZTtcbiAgdmFyIG1hcmtlciA9IGdldFVuaXF1ZU1hcmtlcihvcmlnaW5hbCk7XG4gIHZhciBwYXJlbnQgPSByYW5nZS5wYXJlbnRFbGVtZW50KCk7XG4gIGlmIChwYXJlbnQgPT09IG51bGwgfHwgIWlucHV0cyhwYXJlbnQpKSB7XG4gICAgcmV0dXJuIHJlc3VsdCgwLCAwKTtcbiAgfVxuICByYW5nZS50ZXh0ID0gbWFya2VyICsgcmFuZ2UudGV4dCArIG1hcmtlcjtcblxuICB2YXIgY29udGVudHMgPSBlbC52YWx1ZTtcblxuICBlbC52YWx1ZSA9IG9yaWdpbmFsO1xuICByYW5nZS5tb3ZlVG9Cb29rbWFyayhib29rbWFyayk7XG4gIHJhbmdlLnNlbGVjdCgpO1xuXG4gIHJldHVybiByZXN1bHQoY29udGVudHMuaW5kZXhPZihtYXJrZXIpLCBjb250ZW50cy5sYXN0SW5kZXhPZihtYXJrZXIpIC0gbWFya2VyLmxlbmd0aCk7XG5cbiAgZnVuY3Rpb24gcmVzdWx0IChzdGFydCwgZW5kKSB7XG4gICAgaWYgKGFjdGl2ZSAhPT0gZWwpIHsgLy8gZG9uJ3QgZGlzcnVwdCBwcmUtZXhpc3Rpbmcgc3RhdGVcbiAgICAgIGlmIChhY3RpdmUpIHtcbiAgICAgICAgYWN0aXZlLmZvY3VzKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlbC5ibHVyKCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7IHN0YXJ0OiBzdGFydCwgZW5kOiBlbmQgfTtcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRVbmlxdWVNYXJrZXIgKGNvbnRlbnRzKSB7XG4gIHZhciBtYXJrZXI7XG4gIGRvIHtcbiAgICBtYXJrZXIgPSAnQEBtYXJrZXIuJyArIE1hdGgucmFuZG9tKCkgKiBuZXcgRGF0ZSgpO1xuICB9IHdoaWxlIChjb250ZW50cy5pbmRleE9mKG1hcmtlcikgIT09IC0xKTtcbiAgcmV0dXJuIG1hcmtlcjtcbn1cblxuZnVuY3Rpb24gaW5wdXRzIChlbCkge1xuICByZXR1cm4gKChlbC50YWdOYW1lID09PSAnSU5QVVQnICYmIGVsLnR5cGUgPT09ICd0ZXh0JykgfHwgZWwudGFnTmFtZSA9PT0gJ1RFWFRBUkVBJyk7XG59XG5cbmZ1bmN0aW9uIGVhc3lTZXQgKGVsLCBwKSB7XG4gIGVsLnNlbGVjdGlvblN0YXJ0ID0gcGFyc2UoZWwsIHAuc3RhcnQpO1xuICBlbC5zZWxlY3Rpb25FbmQgPSBwYXJzZShlbCwgcC5lbmQpO1xufVxuXG5mdW5jdGlvbiBoYXJkU2V0IChlbCwgcCkge1xuICB2YXIgcmFuZ2UgPSBlbC5jcmVhdGVUZXh0UmFuZ2UoKTtcblxuICBpZiAocC5zdGFydCA9PT0gJ2VuZCcgJiYgcC5lbmQgPT09ICdlbmQnKSB7XG4gICAgcmFuZ2UuY29sbGFwc2UoZmFsc2UpO1xuICAgIHJhbmdlLnNlbGVjdCgpO1xuICB9IGVsc2Uge1xuICAgIHJhbmdlLmNvbGxhcHNlKHRydWUpO1xuICAgIHJhbmdlLm1vdmVFbmQoJ2NoYXJhY3RlcicsIHBhcnNlKGVsLCBwLmVuZCkpO1xuICAgIHJhbmdlLm1vdmVTdGFydCgnY2hhcmFjdGVyJywgcGFyc2UoZWwsIHAuc3RhcnQpKTtcbiAgICByYW5nZS5zZWxlY3QoKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBwYXJzZSAoZWwsIHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSA9PT0gJ2VuZCcgPyBlbC52YWx1ZS5sZW5ndGggOiB2YWx1ZSB8fCAwO1xufVxuXG5mdW5jdGlvbiBzZWxsIChlbCwgcCkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xuICAgIHNldChlbCwgcCk7XG4gIH1cbiAgcmV0dXJuIGdldChlbCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc2VsbDtcbiIsInZhciBzaSA9IHR5cGVvZiBzZXRJbW1lZGlhdGUgPT09ICdmdW5jdGlvbicsIHRpY2s7XG5pZiAoc2kpIHtcbiAgdGljayA9IGZ1bmN0aW9uIChmbikgeyBzZXRJbW1lZGlhdGUoZm4pOyB9O1xufSBlbHNlIHtcbiAgdGljayA9IGZ1bmN0aW9uIChmbikgeyBzZXRUaW1lb3V0KGZuLCAwKTsgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB0aWNrOyJdfQ==
