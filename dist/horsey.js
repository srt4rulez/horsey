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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJob3JzZXkuanMiLCJub2RlX21vZHVsZXMvYXRvYS9hdG9hLmpzIiwibm9kZV9tb2R1bGVzL2J1bGxzZXllL2J1bGxzZXllLmpzIiwibm9kZV9tb2R1bGVzL2J1bGxzZXllL3RhaWxvcm1hZGUuanMiLCJub2RlX21vZHVsZXMvYnVsbHNleWUvdGhyb3R0bGUuanMiLCJub2RlX21vZHVsZXMvY29udHJhL2RlYm91bmNlLmpzIiwibm9kZV9tb2R1bGVzL2NvbnRyYS9lbWl0dGVyLmpzIiwibm9kZV9tb2R1bGVzL2Nyb3NzdmVudC9zcmMvY3Jvc3N2ZW50LmpzIiwibm9kZV9tb2R1bGVzL2Nyb3NzdmVudC9zcmMvZXZlbnRtYXAuanMiLCJub2RlX21vZHVsZXMvY3VzdG9tLWV2ZW50L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Z1enp5c2VhcmNoL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2hhc2gtc3VtL2hhc2gtc3VtLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9kZWJvdW5jZS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaXNGdW5jdGlvbi5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaXNPYmplY3QuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2lzT2JqZWN0TGlrZS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaXNTeW1ib2wuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL25vdy5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvdG9OdW1iZXIuanMiLCJub2RlX21vZHVsZXMvc2VrdG9yL3NyYy9zZWt0b3IuanMiLCJub2RlX21vZHVsZXMvc2VsZWNjaW9uL3NyYy9nZXRTZWxlY3Rpb24uanMiLCJub2RlX21vZHVsZXMvc2VsZWNjaW9uL3NyYy9nZXRTZWxlY3Rpb25OdWxsT3AuanMiLCJub2RlX21vZHVsZXMvc2VsZWNjaW9uL3NyYy9nZXRTZWxlY3Rpb25SYXcuanMiLCJub2RlX21vZHVsZXMvc2VsZWNjaW9uL3NyYy9nZXRTZWxlY3Rpb25TeW50aGV0aWMuanMiLCJub2RlX21vZHVsZXMvc2VsZWNjaW9uL3NyYy9pc0hvc3QuanMiLCJub2RlX21vZHVsZXMvc2VsZWNjaW9uL3NyYy9yYW5nZVRvVGV4dFJhbmdlLmpzIiwibm9kZV9tb2R1bGVzL3NlbGVjY2lvbi9zcmMvc2VsZWNjaW9uLmpzIiwibm9kZV9tb2R1bGVzL3NlbGVjY2lvbi9zcmMvc2V0U2VsZWN0aW9uLmpzIiwibm9kZV9tb2R1bGVzL3NlbGwvc2VsbC5qcyIsIm5vZGVfbW9kdWxlcy90aWNreS90aWNreS1icm93c2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7O0FBRUE7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7O0FBQ0EsSUFBTSxnQkFBZ0IsQ0FBdEI7QUFDQSxJQUFNLFlBQVksRUFBbEI7QUFDQSxJQUFNLFVBQVUsRUFBaEI7QUFDQSxJQUFNLFNBQVMsRUFBZjtBQUNBLElBQU0sV0FBVyxFQUFqQjtBQUNBLElBQU0sVUFBVSxDQUFoQjtBQUNBLElBQU0sTUFBTSxRQUFaO0FBQ0EsSUFBTSxhQUFhLElBQUksZUFBdkI7QUFDQSxJQUFJLGNBQWMsQ0FBbEI7O0FBRUEsU0FBUyxNQUFULENBQWlCLEVBQWpCLEVBQW1DO0FBQUEsTUFBZCxPQUFjLHVFQUFKLEVBQUk7QUFBQSxNQUUvQixVQUYrQixHQWU3QixPQWY2QixDQUUvQixVQUYrQjtBQUFBLE1BRy9CLElBSCtCLEdBZTdCLE9BZjZCLENBRy9CLEdBSCtCO0FBQUEsTUFJL0IsTUFKK0IsR0FlN0IsT0FmNkIsQ0FJL0IsTUFKK0I7QUFBQSxNQUsvQixNQUwrQixHQWU3QixPQWY2QixDQUsvQixNQUwrQjtBQUFBLHVCQWU3QixPQWY2QixDQU0vQixLQU4rQjtBQUFBLE1BTS9CLEtBTitCLGtDQU12QixFQU51QjtBQUFBLE1BTy9CLGlCQVArQixHQWU3QixPQWY2QixDQU8v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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNyR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDdkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDMVBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCBzdW0gZnJvbSAnaGFzaC1zdW0nO1xuaW1wb3J0IHNlbGwgZnJvbSAnc2VsbCc7XG5pbXBvcnQgc2VrdG9yIGZyb20gJ3Nla3Rvcic7XG5pbXBvcnQgZW1pdHRlciBmcm9tICdjb250cmEvZW1pdHRlcic7XG5pbXBvcnQgYnVsbHNleWUgZnJvbSAnYnVsbHNleWUnO1xuaW1wb3J0IGNyb3NzdmVudCBmcm9tICdjcm9zc3ZlbnQnO1xuaW1wb3J0IGZ1enp5c2VhcmNoIGZyb20gJ2Z1enp5c2VhcmNoJztcbmltcG9ydCBkZWJvdW5jZSBmcm9tICdsb2Rhc2gvZGVib3VuY2UnO1xuY29uc3QgS0VZX0JBQ0tTUEFDRSA9IDg7XG5jb25zdCBLRVlfRU5URVIgPSAxMztcbmNvbnN0IEtFWV9FU0MgPSAyNztcbmNvbnN0IEtFWV9VUCA9IDM4O1xuY29uc3QgS0VZX0RPV04gPSA0MDtcbmNvbnN0IEtFWV9UQUIgPSA5O1xuY29uc3QgZG9jID0gZG9jdW1lbnQ7XG5jb25zdCBkb2NFbGVtZW50ID0gZG9jLmRvY3VtZW50RWxlbWVudDtcbmxldCBsaXN0Q291bnRlciA9IDA7XG5cbmZ1bmN0aW9uIGhvcnNleSAoZWwsIG9wdGlvbnMgPSB7fSkge1xuICBjb25zdCB7XG4gICAgc2V0QXBwZW5kcyxcbiAgICBzZXQsXG4gICAgZmlsdGVyLFxuICAgIHNvdXJjZSxcbiAgICBjYWNoZSA9IHt9LFxuICAgIHByZWRpY3ROZXh0U2VhcmNoLFxuICAgIHJlbmRlckl0ZW0sXG4gICAgcmVuZGVyQ2F0ZWdvcnksXG4gICAgYmxhbmtTZWFyY2gsXG4gICAgYXBwZW5kVG8sXG4gICAgYW5jaG9yLFxuICAgIGRlYm91bmNlLFxuICAgIGF1dG9IaWRlT25CbHVyXG4gIH0gPSBvcHRpb25zO1xuICBjb25zdCBjYWNoaW5nID0gb3B0aW9ucy5jYWNoZSAhPT0gZmFsc2U7XG4gIGlmICghc291cmNlKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgdXNlckdldFRleHQgPSBvcHRpb25zLmdldFRleHQ7XG4gIGNvbnN0IHVzZXJHZXRWYWx1ZSA9IG9wdGlvbnMuZ2V0VmFsdWU7XG4gIGNvbnN0IGdldFRleHQgPSAoXG4gICAgdHlwZW9mIHVzZXJHZXRUZXh0ID09PSAnc3RyaW5nJyA/IGQgPT4gZFt1c2VyR2V0VGV4dF0gOlxuICAgIHR5cGVvZiB1c2VyR2V0VGV4dCA9PT0gJ2Z1bmN0aW9uJyA/IHVzZXJHZXRUZXh0IDpcbiAgICBkID0+IGQudG9TdHJpbmcoKVxuICApO1xuICBjb25zdCBnZXRWYWx1ZSA9IChcbiAgICB0eXBlb2YgdXNlckdldFZhbHVlID09PSAnc3RyaW5nJyA/IGQgPT4gZFt1c2VyR2V0VmFsdWVdIDpcbiAgICB0eXBlb2YgdXNlckdldFZhbHVlID09PSAnZnVuY3Rpb24nID8gdXNlckdldFZhbHVlIDpcbiAgICBkID0+IGRcbiAgKTtcblxuICBsZXQgcHJldmlvdXNTdWdnZXN0aW9ucyA9IFtdO1xuICBsZXQgcHJldmlvdXNTZWxlY3Rpb24gPSBudWxsO1xuICBjb25zdCBsaW1pdCA9IE51bWJlcihvcHRpb25zLmxpbWl0KSB8fCBJbmZpbml0eTtcbiAgY29uc3QgY29tcGxldGVyID0gYXV0b2NvbXBsZXRlKGVsLCB7XG4gICAgc291cmNlOiBzb3VyY2VGdW5jdGlvbixcbiAgICBsaW1pdCxcbiAgICBnZXRUZXh0LFxuICAgIGdldFZhbHVlLFxuICAgIHNldEFwcGVuZHMsXG4gICAgcHJlZGljdE5leHRTZWFyY2gsXG4gICAgcmVuZGVySXRlbSxcbiAgICByZW5kZXJDYXRlZ29yeSxcbiAgICBhcHBlbmRUbyxcbiAgICBhbmNob3IsXG4gICAgbm9NYXRjaGVzLFxuICAgIG5vTWF0Y2hlc1RleHQ6IG9wdGlvbnMubm9NYXRjaGVzLFxuICAgIGJsYW5rU2VhcmNoLFxuICAgIGRlYm91bmNlLFxuICAgIGF1dG9IaWRlT25CbHVyLFxuICAgIHNldCAocykge1xuICAgICAgaWYgKHNldEFwcGVuZHMgIT09IHRydWUpIHtcbiAgICAgICAgZWwudmFsdWUgPSAnJztcbiAgICAgIH1cbiAgICAgIHByZXZpb3VzU2VsZWN0aW9uID0gcztcbiAgICAgIChzZXQgfHwgY29tcGxldGVyLmRlZmF1bHRTZXR0ZXIpKGdldFRleHQocyksIHMpO1xuICAgICAgY29tcGxldGVyLmVtaXQoJ2FmdGVyU2V0Jyk7XG4gICAgfSxcbiAgICBmaWx0ZXJcbiAgfSk7XG4gIHJldHVybiBjb21wbGV0ZXI7XG4gIGZ1bmN0aW9uIG5vTWF0Y2hlcyAoZGF0YSkge1xuICAgIGlmICghb3B0aW9ucy5ub01hdGNoZXMpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIGRhdGEucXVlcnkubGVuZ3RoO1xuICB9XG4gIGZ1bmN0aW9uIHNvdXJjZUZ1bmN0aW9uIChkYXRhLCBkb25lKSB7XG4gICAgY29uc3Qge3F1ZXJ5LCBsaW1pdH0gPSBkYXRhO1xuICAgIGlmICghb3B0aW9ucy5ibGFua1NlYXJjaCAmJiBxdWVyeS5sZW5ndGggPT09IDApIHtcbiAgICAgIGRvbmUobnVsbCwgW10sIHRydWUpOyByZXR1cm47XG4gICAgfVxuICAgIGlmIChjb21wbGV0ZXIpIHtcbiAgICAgIGNvbXBsZXRlci5lbWl0KCdiZWZvcmVVcGRhdGUnKTtcbiAgICB9XG4gICAgY29uc3QgaGFzaCA9IHN1bShxdWVyeSk7IC8vIGZhc3QsIGNhc2UgaW5zZW5zaXRpdmUsIHByZXZlbnRzIGNvbGxpc2lvbnNcbiAgICBpZiAoY2FjaGluZykge1xuICAgICAgY29uc3QgZW50cnkgPSBjYWNoZVtoYXNoXTtcbiAgICAgIGlmIChlbnRyeSkge1xuICAgICAgICBjb25zdCBzdGFydCA9IGVudHJ5LmNyZWF0ZWQuZ2V0VGltZSgpO1xuICAgICAgICBjb25zdCBkdXJhdGlvbiA9IGNhY2hlLmR1cmF0aW9uIHx8IDYwICogNjAgKiAyNDtcbiAgICAgICAgY29uc3QgZGlmZiA9IGR1cmF0aW9uICogMTAwMDtcbiAgICAgICAgY29uc3QgZnJlc2ggPSBuZXcgRGF0ZShzdGFydCArIGRpZmYpID4gbmV3IERhdGUoKTtcbiAgICAgICAgaWYgKGZyZXNoKSB7XG4gICAgICAgICAgZG9uZShudWxsLCBlbnRyeS5pdGVtcy5zbGljZSgpKTsgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHZhciBzb3VyY2VEYXRhID0ge1xuICAgICAgcHJldmlvdXNTdWdnZXN0aW9uczogcHJldmlvdXNTdWdnZXN0aW9ucy5zbGljZSgpLFxuICAgICAgcHJldmlvdXNTZWxlY3Rpb24sXG4gICAgICBpbnB1dDogcXVlcnksXG4gICAgICByZW5kZXJJdGVtLFxuICAgICAgcmVuZGVyQ2F0ZWdvcnksXG4gICAgICBsaW1pdFxuICAgIH07XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zLnNvdXJjZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgb3B0aW9ucy5zb3VyY2Uoc291cmNlRGF0YSwgc291cmNlZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNvdXJjZWQobnVsbCwgb3B0aW9ucy5zb3VyY2UpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBzb3VyY2VkIChlcnIsIHJlc3VsdCkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBjb25zb2xlLmxvZygnQXV0b2NvbXBsZXRlIHNvdXJjZSBlcnJvci4nLCBlcnIsIGVsKTtcbiAgICAgICAgZG9uZShlcnIsIFtdKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGl0ZW1zID0gQXJyYXkuaXNBcnJheShyZXN1bHQpID8gcmVzdWx0IDogW107XG4gICAgICBpZiAoY2FjaGluZykge1xuICAgICAgICBjYWNoZVtoYXNoXSA9IHsgY3JlYXRlZDogbmV3IERhdGUoKSwgaXRlbXMgfTtcbiAgICAgIH1cbiAgICAgIHByZXZpb3VzU3VnZ2VzdGlvbnMgPSBpdGVtcztcbiAgICAgIGRvbmUobnVsbCwgaXRlbXMuc2xpY2UoKSk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGF1dG9jb21wbGV0ZSAoZWwsIG9wdGlvbnMgPSB7fSkge1xuICBjb25zdCBvID0gb3B0aW9ucztcbiAgY29uc3QgcGFyZW50ID0gby5hcHBlbmRUbyB8fCBkb2MuYm9keTtcbiAgY29uc3QgbGlzdElkID0gJ3NleS1saXN0LScgKyBsaXN0Q291bnRlcisrO1xuICBjb25zdCB7XG4gICAgZ2V0VGV4dCxcbiAgICBnZXRWYWx1ZSxcbiAgICBmb3JtLFxuICAgIHNvdXJjZSxcbiAgICBub01hdGNoZXMsXG4gICAgbm9NYXRjaGVzVGV4dCxcbiAgICBoaWdobGlnaHRlciA9IHRydWUsXG4gICAgaGlnaGxpZ2h0Q29tcGxldGVXb3JkcyA9IHRydWUsXG4gICAgcmVuZGVySXRlbSA9IGRlZmF1bHRJdGVtUmVuZGVyZXIsXG4gICAgcmVuZGVyQ2F0ZWdvcnkgPSBkZWZhdWx0Q2F0ZWdvcnlSZW5kZXJlcixcbiAgICBzZXRBcHBlbmRzXG4gIH0gPSBvO1xuICBjb25zdCBsaW1pdCA9IHR5cGVvZiBvLmxpbWl0ID09PSAnbnVtYmVyJyA/IG8ubGltaXQgOiBJbmZpbml0eTtcbiAgY29uc3QgdXNlckZpbHRlciA9IG8uZmlsdGVyIHx8IGRlZmF1bHRGaWx0ZXI7XG4gIGNvbnN0IHVzZXJTZXQgPSBvLnNldCB8fCBkZWZhdWx0U2V0dGVyO1xuICBjb25zdCBjYXRlZ29yaWVzID0gdGFnKCdkaXYnLCAnc2V5LWNhdGVnb3JpZXMnKTtcbiAgY29uc3QgY29udGFpbmVyID0gdGFnKCdkaXYnLCAnc2V5LWNvbnRhaW5lcicpO1xuICBjb25zdCBkZWZlcnJlZEZpbHRlcmluZyA9IGRlZmVyKGZpbHRlcmluZyk7XG4gIGNvbnN0IHN0YXRlID0geyBjb3VudGVyOiAwLCBxdWVyeTogbnVsbCB9O1xuICBsZXQgY2F0ZWdvcnlNYXAgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICBsZXQgc2VsZWN0aW9uID0gbnVsbDtcbiAgbGV0IGV5ZTtcbiAgbGV0IGF0dGFjaG1lbnQgPSBlbDtcbiAgbGV0IG5vbmVNYXRjaDtcbiAgbGV0IHRleHRJbnB1dDtcbiAgbGV0IGFueUlucHV0O1xuICBsZXQgcmFuY2hvcmxlZnQ7XG4gIGxldCByYW5jaG9ycmlnaHQ7XG4gIGxldCBsYXN0UHJlZml4ID0gJyc7XG4gIGNvbnN0IGRlYm91bmNlVGltZSA9IG8uZGVib3VuY2UgfHwgMzAwO1xuICBjb25zdCBkZWJvdW5jZWRMb2FkaW5nID0gZGVib3VuY2UobG9hZGluZywgZGVib3VuY2VUaW1lKTtcbiAgaWYgKG8uYXV0b0hpZGVPbkJsdXIgPT09IHZvaWQgMCkgeyBvLmF1dG9IaWRlT25CbHVyID0gdHJ1ZTsgfVxuICBpZiAoby5hdXRvSGlkZU9uQ2xpY2sgPT09IHZvaWQgMCkgeyBvLmF1dG9IaWRlT25DbGljayA9IHRydWU7IH1cbiAgaWYgKG8uYXV0b1Nob3dPblVwRG93biA9PT0gdm9pZCAwKSB7IG8uYXV0b1Nob3dPblVwRG93biA9IGVsLnRhZ05hbWUgPT09ICdJTlBVVCc7IH1cbiAgaWYgKG8uYW5jaG9yKSB7XG4gICAgcmFuY2hvcmxlZnQgPSBuZXcgUmVnRXhwKCdeJyArIG8uYW5jaG9yKTtcbiAgICByYW5jaG9ycmlnaHQgPSBuZXcgUmVnRXhwKG8uYW5jaG9yICsgJyQnKTtcbiAgfVxuXG4gIGxldCBoYXNJdGVtcyA9IGZhbHNlO1xuICBjb25zdCBhcGkgPSBlbWl0dGVyKHtcbiAgICBhbmNob3I6IG8uYW5jaG9yLFxuICAgIGNsZWFyLFxuICAgIHNob3csXG4gICAgaGlkZSxcbiAgICB0b2dnbGUsXG4gICAgZGVzdHJveSxcbiAgICByZWZyZXNoUG9zaXRpb24sXG4gICAgYXBwZW5kVGV4dCxcbiAgICBhcHBlbmRIVE1MLFxuICAgIGZpbHRlckFuY2hvcmVkVGV4dCxcbiAgICBmaWx0ZXJBbmNob3JlZEhUTUwsXG4gICAgZGVmYXVsdEFwcGVuZFRleHQ6IGFwcGVuZFRleHQsXG4gICAgZGVmYXVsdEZpbHRlcixcbiAgICBkZWZhdWx0SXRlbVJlbmRlcmVyLFxuICAgIGRlZmF1bHRDYXRlZ29yeVJlbmRlcmVyLFxuICAgIGRlZmF1bHRTZXR0ZXIsXG4gICAgcmV0YXJnZXQsXG4gICAgYXR0YWNobWVudCxcbiAgICBtb3ZlLFxuICAgIHNvdXJjZTogW11cbiAgfSk7XG5cbiAgcmV0YXJnZXQoZWwpO1xuICBjb250YWluZXIuYXBwZW5kQ2hpbGQoY2F0ZWdvcmllcyk7XG4gIGlmIChub01hdGNoZXMgJiYgbm9NYXRjaGVzVGV4dCkge1xuICAgIG5vbmVNYXRjaCA9IHRhZygnZGl2JywgJ3NleS1lbXB0eSBzZXktaGlkZScpO1xuICAgIHRleHQobm9uZU1hdGNoLCBub01hdGNoZXNUZXh0KTtcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQobm9uZU1hdGNoKTtcbiAgfVxuICBwYXJlbnQuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcbiAgZWwuc2V0QXR0cmlidXRlKCdhdXRvY29tcGxldGUnLCAnb2ZmJyk7XG4gIGVsLnNldEF0dHJpYnV0ZSgncm9sZScsICdjb21ib2JveCcpO1xuICBlbC5zZXRBdHRyaWJ1dGUoJ2FyaWEtb3ducycsIGxpc3RJZCk7XG4gIGVsLnNldEF0dHJpYnV0ZSgnYXJpYS1hdXRvY29tcGxldGUnLCAnbGlzdCcpO1xuXG4gIGlmIChBcnJheS5pc0FycmF5KHNvdXJjZSkpIHtcbiAgICBsb2FkZWQoc291cmNlLCBmYWxzZSk7XG4gIH1cblxuICByZXR1cm4gYXBpO1xuXG4gIGZ1bmN0aW9uIHJldGFyZ2V0IChlbCkge1xuICAgIGlucHV0RXZlbnRzKHRydWUpO1xuICAgIGF0dGFjaG1lbnQgPSBhcGkuYXR0YWNobWVudCA9IGVsO1xuICAgIHRleHRJbnB1dCA9IGF0dGFjaG1lbnQudGFnTmFtZSA9PT0gJ0lOUFVUJyB8fCBhdHRhY2htZW50LnRhZ05hbWUgPT09ICdURVhUQVJFQSc7XG4gICAgYW55SW5wdXQgPSB0ZXh0SW5wdXQgfHwgaXNFZGl0YWJsZShhdHRhY2htZW50KTtcbiAgICBpbnB1dEV2ZW50cygpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVmcmVzaFBvc2l0aW9uICgpIHtcbiAgICBpZiAoZXllKSB7IGV5ZS5yZWZyZXNoKCk7IH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGxvYWRpbmcgKGZvcmNlU2hvdykge1xuICAgIGlmICh0eXBlb2Ygc291cmNlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNyb3NzdmVudC5yZW1vdmUoYXR0YWNobWVudCwgJ2ZvY3VzJywgbG9hZGluZyk7XG4gICAgY29uc3QgcXVlcnkgPSByZWFkSW5wdXQoKTtcbiAgICBpZiAocXVlcnkgPT09IHN0YXRlLnF1ZXJ5KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGhhc0l0ZW1zID0gZmFsc2U7XG4gICAgc3RhdGUucXVlcnkgPSBxdWVyeTtcblxuICAgIGNvbnN0IGNvdW50ZXIgPSArK3N0YXRlLmNvdW50ZXI7XG5cbiAgICBzb3VyY2UoeyBxdWVyeSwgbGltaXQgfSwgc291cmNlZCk7XG5cbiAgICBmdW5jdGlvbiBzb3VyY2VkIChlcnIsIHJlc3VsdCwgYmxhbmtRdWVyeSkge1xuICAgICAgaWYgKHN0YXRlLmNvdW50ZXIgIT09IGNvdW50ZXIpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgbG9hZGVkKHJlc3VsdCwgZm9yY2VTaG93KTtcbiAgICAgIGlmIChlcnIgfHwgYmxhbmtRdWVyeSkge1xuICAgICAgICBoYXNJdGVtcyA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGxvYWRlZCAoY2F0ZWdvcmllcywgZm9yY2VTaG93KSB7XG4gICAgY2xlYXIoKTtcbiAgICBoYXNJdGVtcyA9IHRydWU7XG4gICAgYXBpLnNvdXJjZSA9IFtdO1xuICAgIGNhdGVnb3JpZXMuZm9yRWFjaChjYXQgPT4gY2F0Lmxpc3QuZm9yRWFjaChzdWdnZXN0aW9uID0+IGFkZChzdWdnZXN0aW9uLCBjYXQpKSk7XG4gICAgaWYgKGZvcmNlU2hvdykge1xuICAgICAgc2hvdygpO1xuICAgIH1cbiAgICBmaWx0ZXJpbmcoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsZWFyICgpIHtcbiAgICB1bnNlbGVjdCgpO1xuICAgIHdoaWxlIChjYXRlZ29yaWVzLmxhc3RDaGlsZCkge1xuICAgICAgY2F0ZWdvcmllcy5yZW1vdmVDaGlsZChjYXRlZ29yaWVzLmxhc3RDaGlsZCk7XG4gICAgfVxuICAgIGNhdGVnb3J5TWFwID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICBoYXNJdGVtcyA9IGZhbHNlO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVhZElucHV0ICgpIHtcbiAgICByZXR1cm4gKHRleHRJbnB1dCA/IGVsLnZhbHVlIDogZWwuaW5uZXJIVE1MKS50cmltKCk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRDYXRlZ29yeSAoZGF0YSkge1xuICAgIGlmICghZGF0YS5pZCkge1xuICAgICAgZGF0YS5pZCA9ICdkZWZhdWx0JztcbiAgICB9XG4gICAgaWYgKCFjYXRlZ29yeU1hcFtkYXRhLmlkXSkge1xuICAgICAgY2F0ZWdvcnlNYXBbZGF0YS5pZF0gPSBjcmVhdGVDYXRlZ29yeSgpO1xuICAgIH1cbiAgICByZXR1cm4gY2F0ZWdvcnlNYXBbZGF0YS5pZF07XG4gICAgZnVuY3Rpb24gY3JlYXRlQ2F0ZWdvcnkgKCkge1xuICAgICAgY29uc3QgY2F0ZWdvcnkgPSB0YWcoJ2RpdicsICdzZXktY2F0ZWdvcnknKTtcbiAgICAgIGNvbnN0IHVsID0gdGFnKCd1bCcsICdzZXktbGlzdCcpO1xuICAgICAgdWwuc2V0QXR0cmlidXRlKCdpZCcsIGxpc3RJZCk7XG4gICAgICB1bC5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCAnbGlzdGJveCcpO1xuICAgICAgcmVuZGVyQ2F0ZWdvcnkoY2F0ZWdvcnksIGRhdGEpO1xuICAgICAgY2F0ZWdvcnkuYXBwZW5kQ2hpbGQodWwpO1xuICAgICAgY2F0ZWdvcmllcy5hcHBlbmRDaGlsZChjYXRlZ29yeSk7XG4gICAgICByZXR1cm4geyBkYXRhLCB1bCB9O1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZCAoc3VnZ2VzdGlvbiwgY2F0ZWdvcnlEYXRhKSB7XG4gICAgY29uc3QgY2F0ID0gZ2V0Q2F0ZWdvcnkoY2F0ZWdvcnlEYXRhKTtcbiAgICBjb25zdCBsaSA9IHRhZygnbGknLCAnc2V5LWl0ZW0nKTtcbiAgICBjb25zdCBzdWdnZXN0aW9uSWQgPSBsaXN0SWQgKyAnLScgKyAoc3VnZ2VzdGlvbi52YWx1ZSB8fCBzdWdnZXN0aW9uKTtcbiAgICByZW5kZXJJdGVtKGxpLCBzdWdnZXN0aW9uKTtcbiAgICBpZiAoaGlnaGxpZ2h0ZXIpIHtcbiAgICAgIGJyZWFrdXBGb3JIaWdobGlnaHRlcihsaSk7XG4gICAgfVxuICAgIGNyb3NzdmVudC5hZGQobGksICdtb3VzZWVudGVyJywgaG92ZXJTdWdnZXN0aW9uKTtcbiAgICBjcm9zc3ZlbnQuYWRkKGxpLCAnY2xpY2snLCBjbGlja2VkU3VnZ2VzdGlvbik7XG4gICAgY3Jvc3N2ZW50LmFkZChsaSwgJ2hvcnNleS1maWx0ZXInLCBmaWx0ZXJJdGVtKTtcbiAgICBjcm9zc3ZlbnQuYWRkKGxpLCAnaG9yc2V5LWhpZGUnLCBoaWRlSXRlbSk7XG4gICAgbGkuc2V0QXR0cmlidXRlKCdyb2xlJywgJ29wdGlvbicpO1xuICAgIGxpLnNldEF0dHJpYnV0ZSgnaWQnLCBzdWdnZXN0aW9uSWQpO1xuICAgIGNhdC51bC5hcHBlbmRDaGlsZChsaSk7XG4gICAgYXBpLnNvdXJjZS5wdXNoKHN1Z2dlc3Rpb24pO1xuICAgIHJldHVybiBsaTtcblxuICAgIGZ1bmN0aW9uIGhvdmVyU3VnZ2VzdGlvbiAoKSB7XG4gICAgICBzZWxlY3QobGkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNsaWNrZWRTdWdnZXN0aW9uICgpIHtcbiAgICAgIGNvbnN0IGlucHV0ID0gZ2V0VGV4dChzdWdnZXN0aW9uKTtcbiAgICAgIHNldChzdWdnZXN0aW9uKTtcbiAgICAgIGhpZGUoKTtcbiAgICAgIGF0dGFjaG1lbnQuZm9jdXMoKTtcbiAgICAgIGxhc3RQcmVmaXggPSBvLnByZWRpY3ROZXh0U2VhcmNoICYmIG8ucHJlZGljdE5leHRTZWFyY2goe1xuICAgICAgICBpbnB1dDogaW5wdXQsXG4gICAgICAgIHNvdXJjZTogYXBpLnNvdXJjZS5zbGljZSgpLFxuICAgICAgICBzZWxlY3Rpb246IHN1Z2dlc3Rpb25cbiAgICAgIH0pIHx8ICcnO1xuICAgICAgaWYgKGxhc3RQcmVmaXgpIHtcbiAgICAgICAgZWwudmFsdWUgPSBsYXN0UHJlZml4O1xuICAgICAgICBlbC5zZWxlY3QoKTtcbiAgICAgICAgc2hvdygpO1xuICAgICAgICBmaWx0ZXJpbmcoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmaWx0ZXJJdGVtICgpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gcmVhZElucHV0KCk7XG4gICAgICBpZiAoZmlsdGVyKHZhbHVlLCBzdWdnZXN0aW9uKSkge1xuICAgICAgICBsaS5jbGFzc05hbWUgPSBsaS5jbGFzc05hbWUucmVwbGFjZSgvIHNleS1oaWRlL2csICcnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNyb3NzdmVudC5mYWJyaWNhdGUobGksICdob3JzZXktaGlkZScpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhpZGVJdGVtICgpIHtcbiAgICAgIGlmICghaGlkZGVuKGxpKSkge1xuICAgICAgICBsaS5jbGFzc05hbWUgKz0gJyBzZXktaGlkZSc7XG4gICAgICAgIGlmIChzZWxlY3Rpb24gPT09IGxpKSB7XG4gICAgICAgICAgdW5zZWxlY3QoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGJyZWFrdXBGb3JIaWdobGlnaHRlciAoZWwpIHtcbiAgICBnZXRUZXh0Q2hpbGRyZW4oZWwpLmZvckVhY2goZWwgPT4ge1xuICAgICAgY29uc3QgcGFyZW50ID0gZWwucGFyZW50RWxlbWVudCB8fCBlbC5wYXJlbnROb2RlO1xuICAgICAgY29uc3QgdGV4dCA9IGVsLnRleHRDb250ZW50IHx8IGVsLm5vZGVWYWx1ZSB8fCAnJztcbiAgICAgIGlmICh0ZXh0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBmb3IgKGxldCBpID0gMCwgY2hhcnMgPSB0ZXh0LnNwbGl0KCcnKTsgaSA8IGNoYXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHBhcmVudC5pbnNlcnRCZWZvcmUoc3BhbkZvcihjaGFyc1tpXSksIGVsKTtcbiAgICAgIH1cbiAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChlbCk7XG4gICAgICBmdW5jdGlvbiBzcGFuRm9yIChjaGFyKSB7XG4gICAgICAgIGNvbnN0IHNwYW4gPSBkb2MuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICBzcGFuLmNsYXNzTmFtZSA9ICdzZXktY2hhcic7XG4gICAgICAgIHNwYW4udGV4dENvbnRlbnQgPSBzcGFuLmlubmVyVGV4dCA9IGNoYXI7XG4gICAgICAgIHJldHVybiBzcGFuO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gaGlnaGxpZ2h0IChlbCwgbmVlZGxlKSB7XG4gICAgY29uc3QgcndvcmQgPSAvW1xccywuX1xcW1xcXXt9KCktXS9nO1xuICAgIGNvbnN0IHdvcmRzID0gbmVlZGxlLnNwbGl0KHJ3b3JkKS5maWx0ZXIodyA9PiB3Lmxlbmd0aCk7XG4gICAgY29uc3QgZWxlbXMgPSBbXS5zbGljZS5jYWxsKGVsLnF1ZXJ5U2VsZWN0b3JBbGwoJy5zZXktY2hhcicpKTtcbiAgICBsZXQgY2hhcnM7XG4gICAgbGV0IHN0YXJ0SW5kZXggPSAwO1xuXG4gICAgYmFsYW5jZSgpO1xuICAgIGlmIChoaWdobGlnaHRDb21wbGV0ZVdvcmRzKSB7XG4gICAgICB3aG9sZSgpO1xuICAgIH1cbiAgICBmdXp6eSgpO1xuICAgIGNsZWFyUmVtYWluZGVyKCk7XG5cbiAgICBmdW5jdGlvbiBiYWxhbmNlICgpIHtcbiAgICAgIGNoYXJzID0gZWxlbXMubWFwKGVsID0+IGVsLmlubmVyVGV4dCB8fCBlbC50ZXh0Q29udGVudCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gd2hvbGUgKCkge1xuICAgICAgZm9yIChsZXQgd29yZEluZGV4ID0gMCwgd29yZDsgd29yZEluZGV4IDwgd29yZHMubGVuZ3RoOyB3b3JkSW5kZXgrKykge1xuICAgICAgICBjb25zdCB3b3JkID0gd29yZHNbd29yZEluZGV4XTtcbiAgICAgICAgbGV0IHRlbXBJbmRleCA9IHN0YXJ0SW5kZXg7XG4gICAgICAgIHJldHJ5OiB3aGlsZSAodGVtcEluZGV4ICE9PSAtMSkge1xuICAgICAgICAgIGxldCBpbml0ID0gdHJ1ZTtcbiAgICAgICAgICBsZXQgcHJldkluZGV4ID0gdGVtcEluZGV4O1xuICAgICAgICAgIGZvciAobGV0IGNoYXJJbmRleCA9IDAsIGNoYXJzID0gd29yZC5zcGxpdCgnJyk7IGNoYXJJbmRleCA8IGNoYXJzLmxlbmd0aDsgY2hhckluZGV4KyspIHtcbiAgICAgICAgICAgIGNvbnN0IGNoYXIgPSBjaGFyc1tjaGFySW5kZXhdO1xuICAgICAgICAgICAgY29uc3QgaSA9IGNoYXJzLmluZGV4T2YoY2hhciwgcHJldkluZGV4ICsgMSk7XG4gICAgICAgICAgICBjb25zdCBmYWlsID0gaSA9PT0gLTEgfHwgKCFpbml0ICYmIHByZXZJbmRleCArIDEgIT09IGkpO1xuICAgICAgICAgICAgaWYgKGluaXQpIHtcbiAgICAgICAgICAgICAgaW5pdCA9IGZhbHNlO1xuICAgICAgICAgICAgICB0ZW1wSW5kZXggPSBpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZhaWwpIHtcbiAgICAgICAgICAgICAgY29udGludWUgcmV0cnk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwcmV2SW5kZXggPSBpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBmb3IgKGxldCBlbGVtSW5kZXggPSAwLCBtYXRjaGVkRWxlbXMgPSBlbGVtcy5zcGxpY2UodGVtcEluZGV4LCAxICsgcHJldkluZGV4IC0gdGVtcEluZGV4KTsgZWxlbUluZGV4IDwgbWF0Y2hlZEVsZW1zLmxlbmd0aDsgZWxlbUluZGV4KyspIHtcbiAgICAgICAgICAgIG9uKG1hdGNoZWRFbGVtc1tlbGVtSW5kZXhdKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYmFsYW5jZSgpO1xuICAgICAgICAgIG5lZWRsZSA9IG5lZWRsZS5yZXBsYWNlKHdvcmQsICcnKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZ1enp5ICgpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwLCBjaGFycyA9IG5lZWRsZS5zcGxpdCgnJyk7IGkgPCBjaGFycy5sZW5ndGg7IGkrKykge1xuICAgICAgICB3aGlsZSAoZWxlbXMubGVuZ3RoKSB7XG4gICAgICAgICAgbGV0IGVsID0gZWxlbXMuc2hpZnQoKTtcbiAgICAgICAgICBpZiAoKGVsLmlubmVyVGV4dCB8fCBlbC50ZXh0Q29udGVudCkgPT09IGNoYXJzW2ldKSB7XG4gICAgICAgICAgICBvbihlbCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb2ZmKGVsKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjbGVhclJlbWFpbmRlciAoKSB7XG4gICAgICB3aGlsZSAoZWxlbXMubGVuZ3RoKSB7XG4gICAgICAgIG9mZihlbGVtcy5zaGlmdCgpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBvbiAoY2gpIHtcbiAgICAgIGNoLmNsYXNzTGlzdC5hZGQoJ3NleS1jaGFyLWhpZ2hsaWdodCcpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBvZmYgKGNoKSB7XG4gICAgICBjaC5jbGFzc0xpc3QucmVtb3ZlKCdzZXktY2hhci1oaWdobGlnaHQnKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBnZXRUZXh0Q2hpbGRyZW4gKGVsKSB7XG4gICAgY29uc3QgdGV4dHMgPSBbXTtcbiAgICBjb25zdCB3YWxrZXIgPSBkb2N1bWVudC5jcmVhdGVUcmVlV2Fsa2VyKGVsLCBOb2RlRmlsdGVyLlNIT1dfVEVYVCwgbnVsbCwgZmFsc2UpO1xuICAgIGxldCBub2RlO1xuICAgIHdoaWxlIChub2RlID0gd2Fsa2VyLm5leHROb2RlKCkpIHtcbiAgICAgIHRleHRzLnB1c2gobm9kZSk7XG4gICAgfVxuICAgIHJldHVybiB0ZXh0cztcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldCAodmFsdWUpIHtcbiAgICBpZiAoby5hbmNob3IpIHtcbiAgICAgIHJldHVybiAoaXNUZXh0KCkgPyBhcGkuYXBwZW5kVGV4dCA6IGFwaS5hcHBlbmRIVE1MKShnZXRWYWx1ZSh2YWx1ZSkpO1xuICAgIH1cbiAgICB1c2VyU2V0KHZhbHVlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbHRlciAodmFsdWUsIHN1Z2dlc3Rpb24pIHtcbiAgICBpZiAoby5hbmNob3IpIHtcbiAgICAgIGNvbnN0IGlsID0gKGlzVGV4dCgpID8gYXBpLmZpbHRlckFuY2hvcmVkVGV4dCA6IGFwaS5maWx0ZXJBbmNob3JlZEhUTUwpKHZhbHVlLCBzdWdnZXN0aW9uKTtcbiAgICAgIHJldHVybiBpbCA/IHVzZXJGaWx0ZXIoaWwuaW5wdXQsIGlsLnN1Z2dlc3Rpb24pIDogZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB1c2VyRmlsdGVyKHZhbHVlLCBzdWdnZXN0aW9uKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGlzVGV4dCAoKSB7IHJldHVybiBpc0lucHV0KGF0dGFjaG1lbnQpOyB9XG4gIGZ1bmN0aW9uIHZpc2libGUgKCkgeyByZXR1cm4gY29udGFpbmVyLmNsYXNzTmFtZS5pbmRleE9mKCdzZXktc2hvdycpICE9PSAtMTsgfVxuICBmdW5jdGlvbiBoaWRkZW4gKGxpKSB7IHJldHVybiBsaS5jbGFzc05hbWUuaW5kZXhPZignc2V5LWhpZGUnKSAhPT0gLTE7IH1cblxuICBmdW5jdGlvbiBzaG93ICgpIHtcbiAgICBleWUucmVmcmVzaCgpO1xuICAgIGlmICghdmlzaWJsZSgpKSB7XG4gICAgICBjb250YWluZXIuY2xhc3NOYW1lICs9ICcgc2V5LXNob3cnO1xuICAgICAgY3Jvc3N2ZW50LmZhYnJpY2F0ZShhdHRhY2htZW50LCAnaG9yc2V5LXNob3cnKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB0b2dnbGVyIChlKSB7XG4gICAgY29uc3QgbGVmdCA9IGUud2hpY2ggPT09IDEgJiYgIWUubWV0YUtleSAmJiAhZS5jdHJsS2V5O1xuICAgIGlmIChsZWZ0ID09PSBmYWxzZSkge1xuICAgICAgcmV0dXJuOyAvLyB3ZSBvbmx5IGNhcmUgYWJvdXQgaG9uZXN0IHRvIGdvZCBsZWZ0LWNsaWNrc1xuICAgIH1cbiAgICB0b2dnbGUoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRvZ2dsZSAoKSB7XG4gICAgaWYgKCF2aXNpYmxlKCkpIHtcbiAgICAgIHNob3coKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaGlkZSgpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNlbGVjdCAobGkpIHtcbiAgICB1bnNlbGVjdCgpO1xuICAgIGlmIChsaSkge1xuICAgICAgc2VsZWN0aW9uID0gbGk7XG4gICAgICBzZWxlY3Rpb24uY2xhc3NOYW1lICs9ICcgc2V5LXNlbGVjdGVkJztcbiAgICAgIGVsLnNldEF0dHJpYnV0ZSgnYXJpYS1hY3RpdmVkZXNjZW5kYW50Jywgc2VsZWN0aW9uLmdldEF0dHJpYnV0ZSgnaWQnKSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdW5zZWxlY3QgKCkge1xuICAgIGlmIChzZWxlY3Rpb24pIHtcbiAgICAgIHNlbGVjdGlvbi5jbGFzc05hbWUgPSBzZWxlY3Rpb24uY2xhc3NOYW1lLnJlcGxhY2UoLyBzZXktc2VsZWN0ZWQvZywgJycpO1xuICAgICAgc2VsZWN0aW9uID0gbnVsbDtcbiAgICAgIGVsLnJlbW92ZUF0dHJpYnV0ZSgnYXJpYS1hY3RpdmVkZXNjZW5kYW50Jyk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gbW92ZSAodXAsIG1vdmVzKSB7XG4gICAgY29uc3QgdG90YWwgPSBhcGkuc291cmNlLmxlbmd0aDtcbiAgICBpZiAodG90YWwgPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKG1vdmVzID4gdG90YWwpIHtcbiAgICAgIHVuc2VsZWN0KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGNhdCA9IGZpbmRDYXRlZ29yeShzZWxlY3Rpb24pIHx8IGNhdGVnb3JpZXMuZmlyc3RDaGlsZDtcbiAgICBjb25zdCBmaXJzdCA9IHVwID8gJ2xhc3RDaGlsZCcgOiAnZmlyc3RDaGlsZCc7XG4gICAgY29uc3QgbGFzdCA9IHVwID8gJ2ZpcnN0Q2hpbGQnIDogJ2xhc3RDaGlsZCc7XG4gICAgY29uc3QgbmV4dCA9IHVwID8gJ3ByZXZpb3VzU2libGluZycgOiAnbmV4dFNpYmxpbmcnO1xuICAgIGNvbnN0IHByZXYgPSB1cCA/ICduZXh0U2libGluZycgOiAncHJldmlvdXNTaWJsaW5nJztcbiAgICBjb25zdCBsaSA9IGZpbmROZXh0KCk7XG4gICAgc2VsZWN0KGxpKTtcblxuICAgIGlmIChoaWRkZW4obGkpKSB7XG4gICAgICBtb3ZlKHVwLCBtb3ZlcyA/IG1vdmVzICsgMSA6IDEpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZpbmRDYXRlZ29yeSAoZWwpIHtcbiAgICAgIHdoaWxlIChlbCkge1xuICAgICAgICBpZiAoc2VrdG9yLm1hdGNoZXNTZWxlY3RvcihlbC5wYXJlbnRFbGVtZW50LCAnLnNleS1jYXRlZ29yeScpKSB7XG4gICAgICAgICAgcmV0dXJuIGVsLnBhcmVudEVsZW1lbnQ7XG4gICAgICAgIH1cbiAgICAgICAgZWwgPSBlbC5wYXJlbnRFbGVtZW50O1xuICAgICAgfVxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmluZE5leHQgKCkge1xuICAgICAgaWYgKHNlbGVjdGlvbikge1xuICAgICAgICBpZiAoc2VsZWN0aW9uW25leHRdKSB7XG4gICAgICAgICAgcmV0dXJuIHNlbGVjdGlvbltuZXh0XTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2F0W25leHRdICYmIGZpbmRMaXN0KGNhdFtuZXh0XSlbZmlyc3RdKSB7XG4gICAgICAgICAgcmV0dXJuIGZpbmRMaXN0KGNhdFtuZXh0XSlbZmlyc3RdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZmluZExpc3QoY2F0ZWdvcmllc1tmaXJzdF0pW2ZpcnN0XTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBoaWRlICgpIHtcbiAgICBleWUuc2xlZXAoKTtcbiAgICBjb250YWluZXIuY2xhc3NOYW1lID0gY29udGFpbmVyLmNsYXNzTmFtZS5yZXBsYWNlKC8gc2V5LXNob3cvZywgJycpO1xuICAgIHVuc2VsZWN0KCk7XG4gICAgY3Jvc3N2ZW50LmZhYnJpY2F0ZShhdHRhY2htZW50LCAnaG9yc2V5LWhpZGUnKTtcbiAgICBpZiAoZWwudmFsdWUgPT09IGxhc3RQcmVmaXgpIHtcbiAgICAgIGVsLnZhbHVlID0gJyc7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24ga2V5ZG93biAoZSkge1xuICAgIGNvbnN0IHNob3duID0gdmlzaWJsZSgpO1xuICAgIGNvbnN0IHdoaWNoID0gZS53aGljaCB8fCBlLmtleUNvZGU7XG4gICAgaWYgKHdoaWNoID09PSBLRVlfRE9XTikge1xuICAgICAgaWYgKGFueUlucHV0ICYmIG8uYXV0b1Nob3dPblVwRG93bikge1xuICAgICAgICBzaG93KCk7XG4gICAgICB9XG4gICAgICBpZiAoc2hvd24pIHtcbiAgICAgICAgbW92ZSgpO1xuICAgICAgICBzdG9wKGUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAod2hpY2ggPT09IEtFWV9VUCkge1xuICAgICAgaWYgKGFueUlucHV0ICYmIG8uYXV0b1Nob3dPblVwRG93bikge1xuICAgICAgICBzaG93KCk7XG4gICAgICB9XG4gICAgICBpZiAoc2hvd24pIHtcbiAgICAgICAgbW92ZSh0cnVlKTtcbiAgICAgICAgc3RvcChlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHdoaWNoID09PSBLRVlfQkFDS1NQQUNFKSB7XG4gICAgICBpZiAoYW55SW5wdXQgJiYgby5hdXRvU2hvd09uVXBEb3duKSB7XG4gICAgICAgIHNob3coKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHNob3duKSB7XG4gICAgICBpZiAod2hpY2ggPT09IEtFWV9FTlRFUikge1xuICAgICAgICBpZiAoc2VsZWN0aW9uKSB7XG4gICAgICAgICAgY3Jvc3N2ZW50LmZhYnJpY2F0ZShzZWxlY3Rpb24sICdjbGljaycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGhpZGUoKTtcbiAgICAgICAgfVxuICAgICAgICBzdG9wKGUpO1xuICAgICAgfSBlbHNlIGlmICh3aGljaCA9PT0gS0VZX0VTQykge1xuICAgICAgICBoaWRlKCk7XG4gICAgICAgIHN0b3AoZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc3RvcCAoZSkge1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd05vUmVzdWx0cyAoKSB7XG4gICAgaWYgKG5vbmVNYXRjaCkge1xuICAgICAgbm9uZU1hdGNoLmNsYXNzTGlzdC5yZW1vdmUoJ3NleS1oaWRlJyk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaGlkZU5vUmVzdWx0cyAoKSB7XG4gICAgaWYgKG5vbmVNYXRjaCkge1xuICAgICAgbm9uZU1hdGNoLmNsYXNzTGlzdC5hZGQoJ3NleS1oaWRlJyk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZmlsdGVyaW5nICgpIHtcbiAgICBpZiAoIXZpc2libGUoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkZWJvdW5jZWRMb2FkaW5nKHRydWUpO1xuICAgIGNyb3NzdmVudC5mYWJyaWNhdGUoYXR0YWNobWVudCwgJ2hvcnNleS1maWx0ZXInKTtcbiAgICBjb25zdCB2YWx1ZSA9IHJlYWRJbnB1dCgpO1xuICAgIGlmICghby5ibGFua1NlYXJjaCAmJiAhdmFsdWUpIHtcbiAgICAgIGhpZGUoKTsgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBub21hdGNoID0gbm9NYXRjaGVzKHsgcXVlcnk6IHZhbHVlIH0pO1xuICAgIGxldCBjb3VudCA9IHdhbGtDYXRlZ29yaWVzKCk7XG4gICAgaWYgKGNvdW50ID09PSAwICYmIG5vbWF0Y2ggJiYgaGFzSXRlbXMpIHtcbiAgICAgIHNob3dOb1Jlc3VsdHMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaGlkZU5vUmVzdWx0cygpO1xuICAgIH1cbiAgICBpZiAoIXNlbGVjdGlvbikge1xuICAgICAgbW92ZSgpO1xuICAgIH1cbiAgICBpZiAoIXNlbGVjdGlvbiAmJiAhbm9tYXRjaCkge1xuICAgICAgaGlkZSgpO1xuICAgIH1cbiAgICBmdW5jdGlvbiB3YWxrQ2F0ZWdvcmllcyAoKSB7XG4gICAgICBsZXQgY2F0ZWdvcnkgPSBjYXRlZ29yaWVzLmZpcnN0Q2hpbGQ7XG4gICAgICBsZXQgY291bnQgPSAwO1xuICAgICAgd2hpbGUgKGNhdGVnb3J5KSB7XG4gICAgICAgIGNvbnN0IGxpc3QgPSBmaW5kTGlzdChjYXRlZ29yeSk7XG4gICAgICAgIGNvbnN0IHBhcnRpYWwgPSB3YWxrQ2F0ZWdvcnkobGlzdCk7XG4gICAgICAgIGlmIChwYXJ0aWFsID09PSAwKSB7XG4gICAgICAgICAgY2F0ZWdvcnkuY2xhc3NMaXN0LmFkZCgnc2V5LWhpZGUnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjYXRlZ29yeS5jbGFzc0xpc3QucmVtb3ZlKCdzZXktaGlkZScpO1xuICAgICAgICB9XG4gICAgICAgIGNvdW50ICs9IHBhcnRpYWw7XG4gICAgICAgIGNhdGVnb3J5ID0gY2F0ZWdvcnkubmV4dFNpYmxpbmc7XG4gICAgICB9XG4gICAgICByZXR1cm4gY291bnQ7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHdhbGtDYXRlZ29yeSAodWwpIHtcbiAgICAgIGxldCBsaSA9IHVsLmZpcnN0Q2hpbGQ7XG4gICAgICBsZXQgY291bnQgPSAwO1xuICAgICAgd2hpbGUgKGxpKSB7XG4gICAgICAgIGlmIChjb3VudCA+PSBsaW1pdCkge1xuICAgICAgICAgIGNyb3NzdmVudC5mYWJyaWNhdGUobGksICdob3JzZXktaGlkZScpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNyb3NzdmVudC5mYWJyaWNhdGUobGksICdob3JzZXktZmlsdGVyJyk7XG4gICAgICAgICAgaWYgKGxpLmNsYXNzTmFtZS5pbmRleE9mKCdzZXktaGlkZScpID09PSAtMSkge1xuICAgICAgICAgICAgY291bnQrKztcbiAgICAgICAgICAgIGlmIChoaWdobGlnaHRlcikge1xuICAgICAgICAgICAgICBoaWdobGlnaHQobGksIHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbGkgPSBsaS5uZXh0U2libGluZztcbiAgICAgIH1cbiAgICAgIHJldHVybiBjb3VudDtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBkZWZlcnJlZEZpbHRlcmluZ05vRW50ZXIgKGUpIHtcbiAgICBjb25zdCB3aGljaCA9IGUud2hpY2ggfHwgZS5rZXlDb2RlO1xuICAgIGlmICh3aGljaCA9PT0gS0VZX0VOVEVSKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGRlZmVycmVkRmlsdGVyaW5nKCk7XG4gIH1cblxuICBmdW5jdGlvbiBkZWZlcnJlZFNob3cgKGUpIHtcbiAgICBjb25zdCB3aGljaCA9IGUud2hpY2ggfHwgZS5rZXlDb2RlO1xuICAgIGlmICh3aGljaCA9PT0gS0VZX0VOVEVSIHx8IHdoaWNoID09PSBLRVlfVEFCKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHNldFRpbWVvdXQoc2hvdywgMCk7XG4gIH1cblxuICBmdW5jdGlvbiBhdXRvY29tcGxldGVFdmVudFRhcmdldCAoZSkge1xuICAgIGxldCB0YXJnZXQgPSBlLnRhcmdldDtcbiAgICBpZiAodGFyZ2V0ID09PSBhdHRhY2htZW50KSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgd2hpbGUgKHRhcmdldCkge1xuICAgICAgaWYgKHRhcmdldCA9PT0gY29udGFpbmVyIHx8IHRhcmdldCA9PT0gYXR0YWNobWVudCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHRhcmdldCA9IHRhcmdldC5wYXJlbnROb2RlO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGhpZGVPbkJsdXIgKGUpIHtcbiAgICBjb25zdCB3aGljaCA9IGUud2hpY2ggfHwgZS5rZXlDb2RlO1xuICAgIGlmICh3aGljaCA9PT0gS0VZX1RBQikge1xuICAgICAgaGlkZSgpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGhpZGVPbkNsaWNrIChlKSB7XG4gICAgaWYgKGF1dG9jb21wbGV0ZUV2ZW50VGFyZ2V0KGUpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGhpZGUoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGlucHV0RXZlbnRzIChyZW1vdmUpIHtcbiAgICBjb25zdCBvcCA9IHJlbW92ZSA/ICdyZW1vdmUnIDogJ2FkZCc7XG4gICAgaWYgKGV5ZSkge1xuICAgICAgZXllLmRlc3Ryb3koKTtcbiAgICAgIGV5ZSA9IG51bGw7XG4gICAgfVxuICAgIGlmICghcmVtb3ZlKSB7XG4gICAgICBleWUgPSBidWxsc2V5ZShjb250YWluZXIsIGF0dGFjaG1lbnQsIHtcbiAgICAgICAgY2FyZXQ6IGFueUlucHV0ICYmIGF0dGFjaG1lbnQudGFnTmFtZSAhPT0gJ0lOUFVUJyxcbiAgICAgICAgY29udGV4dDogby5hcHBlbmRUb1xuICAgICAgfSk7XG4gICAgICBpZiAoIXZpc2libGUoKSkgeyBleWUuc2xlZXAoKTsgfVxuICAgIH1cbiAgICBpZiAocmVtb3ZlIHx8IChhbnlJbnB1dCAmJiBkb2MuYWN0aXZlRWxlbWVudCAhPT0gYXR0YWNobWVudCkpIHtcbiAgICAgIGNyb3NzdmVudFtvcF0oYXR0YWNobWVudCwgJ2ZvY3VzJywgbG9hZGluZyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxvYWRpbmcoKTtcbiAgICB9XG4gICAgaWYgKGFueUlucHV0KSB7XG4gICAgICBjcm9zc3ZlbnRbb3BdKGF0dGFjaG1lbnQsICdrZXlwcmVzcycsIGRlZmVycmVkU2hvdyk7XG4gICAgICBjcm9zc3ZlbnRbb3BdKGF0dGFjaG1lbnQsICdrZXlwcmVzcycsIGRlZmVycmVkRmlsdGVyaW5nKTtcbiAgICAgIGNyb3NzdmVudFtvcF0oYXR0YWNobWVudCwgJ2tleWRvd24nLCBkZWZlcnJlZEZpbHRlcmluZ05vRW50ZXIpO1xuICAgICAgY3Jvc3N2ZW50W29wXShhdHRhY2htZW50LCAncGFzdGUnLCBkZWZlcnJlZEZpbHRlcmluZyk7XG4gICAgICBjcm9zc3ZlbnRbb3BdKGF0dGFjaG1lbnQsICdrZXlkb3duJywga2V5ZG93bik7XG4gICAgICBpZiAoby5hdXRvSGlkZU9uQmx1cikgeyBjcm9zc3ZlbnRbb3BdKGF0dGFjaG1lbnQsICdrZXlkb3duJywgaGlkZU9uQmx1cik7IH1cbiAgICB9IGVsc2Uge1xuICAgICAgY3Jvc3N2ZW50W29wXShhdHRhY2htZW50LCAnY2xpY2snLCB0b2dnbGVyKTtcbiAgICAgIGNyb3NzdmVudFtvcF0oZG9jRWxlbWVudCwgJ2tleWRvd24nLCBrZXlkb3duKTtcbiAgICB9XG4gICAgaWYgKG8uYXV0b0hpZGVPbkNsaWNrKSB7IGNyb3NzdmVudFtvcF0oZG9jLCAnY2xpY2snLCBoaWRlT25DbGljayk7IH1cbiAgICBpZiAoZm9ybSkgeyBjcm9zc3ZlbnRbb3BdKGZvcm0sICdzdWJtaXQnLCBoaWRlKTsgfVxuICB9XG5cbiAgZnVuY3Rpb24gZGVzdHJveSAoKSB7XG4gICAgaW5wdXRFdmVudHModHJ1ZSk7XG4gICAgaWYgKHBhcmVudC5jb250YWlucyhjb250YWluZXIpKSB7IHBhcmVudC5yZW1vdmVDaGlsZChjb250YWluZXIpOyB9XG4gIH1cblxuICBmdW5jdGlvbiBkZWZhdWx0U2V0dGVyICh2YWx1ZSkge1xuICAgIGlmICh0ZXh0SW5wdXQpIHtcbiAgICAgIGlmIChzZXRBcHBlbmRzID09PSB0cnVlKSB7XG4gICAgICAgIGVsLnZhbHVlICs9ICcgJyArIHZhbHVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZWwudmFsdWUgPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHNldEFwcGVuZHMgPT09IHRydWUpIHtcbiAgICAgICAgZWwuaW5uZXJIVE1MICs9ICcgJyArIHZhbHVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZWwuaW5uZXJIVE1MID0gdmFsdWU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZGVmYXVsdEl0ZW1SZW5kZXJlciAobGksIHN1Z2dlc3Rpb24pIHtcbiAgICB0ZXh0KGxpLCBnZXRUZXh0KHN1Z2dlc3Rpb24pKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlZmF1bHRDYXRlZ29yeVJlbmRlcmVyIChkaXYsIGRhdGEpIHtcbiAgICBpZiAoZGF0YS5pZCAhPT0gJ2RlZmF1bHQnKSB7XG4gICAgICBjb25zdCBpZCA9IHRhZygnZGl2JywgJ3NleS1jYXRlZ29yeS1pZCcpO1xuICAgICAgZGl2LmFwcGVuZENoaWxkKGlkKTtcbiAgICAgIHRleHQoaWQsIGRhdGEuaWQpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGRlZmF1bHRGaWx0ZXIgKHEsIHN1Z2dlc3Rpb24pIHtcbiAgICBjb25zdCBuZWVkbGUgPSBxLnRvTG93ZXJDYXNlKCk7XG4gICAgY29uc3QgdGV4dCA9IGdldFRleHQoc3VnZ2VzdGlvbikgfHwgJyc7XG4gICAgaWYgKGZ1enp5c2VhcmNoKG5lZWRsZSwgdGV4dC50b0xvd2VyQ2FzZSgpKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGNvbnN0IHZhbHVlID0gZ2V0VmFsdWUoc3VnZ2VzdGlvbikgfHwgJyc7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIGZ1enp5c2VhcmNoKG5lZWRsZSwgdmFsdWUudG9Mb3dlckNhc2UoKSk7XG4gIH1cblxuICBmdW5jdGlvbiBsb29wYmFja1RvQW5jaG9yICh0ZXh0LCBwKSB7XG4gICAgbGV0IHJlc3VsdCA9ICcnO1xuICAgIGxldCBhbmNob3JlZCA9IGZhbHNlO1xuICAgIGxldCBzdGFydCA9IHAuc3RhcnQ7XG4gICAgd2hpbGUgKGFuY2hvcmVkID09PSBmYWxzZSAmJiBzdGFydCA+PSAwKSB7XG4gICAgICByZXN1bHQgPSB0ZXh0LnN1YnN0cihzdGFydCAtIDEsIHAuc3RhcnQgLSBzdGFydCArIDEpO1xuICAgICAgYW5jaG9yZWQgPSByYW5jaG9ybGVmdC50ZXN0KHJlc3VsdCk7XG4gICAgICBzdGFydC0tO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgdGV4dDogYW5jaG9yZWQgPyByZXN1bHQgOiBudWxsLFxuICAgICAgc3RhcnRcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gZmlsdGVyQW5jaG9yZWRUZXh0IChxLCBzdWdnZXN0aW9uKSB7XG4gICAgY29uc3QgcG9zaXRpb24gPSBzZWxsKGVsKTtcbiAgICBjb25zdCBpbnB1dCA9IGxvb3BiYWNrVG9BbmNob3IocSwgcG9zaXRpb24pLnRleHQ7XG4gICAgaWYgKGlucHV0KSB7XG4gICAgICByZXR1cm4geyBpbnB1dCwgc3VnZ2VzdGlvbiB9O1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGVuZFRleHQgKHZhbHVlKSB7XG4gICAgY29uc3QgY3VycmVudCA9IGVsLnZhbHVlO1xuICAgIGNvbnN0IHBvc2l0aW9uID0gc2VsbChlbCk7XG4gICAgY29uc3QgaW5wdXQgPSBsb29wYmFja1RvQW5jaG9yKGN1cnJlbnQsIHBvc2l0aW9uKTtcbiAgICBjb25zdCBsZWZ0ID0gY3VycmVudC5zdWJzdHIoMCwgaW5wdXQuc3RhcnQpO1xuICAgIGNvbnN0IHJpZ2h0ID0gY3VycmVudC5zdWJzdHIoaW5wdXQuc3RhcnQgKyBpbnB1dC50ZXh0Lmxlbmd0aCArIChwb3NpdGlvbi5lbmQgLSBwb3NpdGlvbi5zdGFydCkpO1xuICAgIGNvbnN0IGJlZm9yZSA9IGxlZnQgKyB2YWx1ZSArICcgJztcblxuICAgIGVsLnZhbHVlID0gYmVmb3JlICsgcmlnaHQ7XG4gICAgc2VsbChlbCwgeyBzdGFydDogYmVmb3JlLmxlbmd0aCwgZW5kOiBiZWZvcmUubGVuZ3RoIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gZmlsdGVyQW5jaG9yZWRIVE1MICgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0FuY2hvcmluZyBpbiBlZGl0YWJsZSBlbGVtZW50cyBpcyBkaXNhYmxlZCBieSBkZWZhdWx0LicpO1xuICB9XG5cbiAgZnVuY3Rpb24gYXBwZW5kSFRNTCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdBbmNob3JpbmcgaW4gZWRpdGFibGUgZWxlbWVudHMgaXMgZGlzYWJsZWQgYnkgZGVmYXVsdC4nKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbmRMaXN0IChjYXRlZ29yeSkgeyByZXR1cm4gc2VrdG9yKCcuc2V5LWxpc3QnLCBjYXRlZ29yeSlbMF07IH1cbn1cblxuZnVuY3Rpb24gaXNJbnB1dCAoZWwpIHsgcmV0dXJuIGVsLnRhZ05hbWUgPT09ICdJTlBVVCcgfHwgZWwudGFnTmFtZSA9PT0gJ1RFWFRBUkVBJzsgfVxuXG5mdW5jdGlvbiB0YWcgKHR5cGUsIGNsYXNzTmFtZSkge1xuICBjb25zdCBlbCA9IGRvYy5jcmVhdGVFbGVtZW50KHR5cGUpO1xuICBlbC5jbGFzc05hbWUgPSBjbGFzc05hbWU7XG4gIHJldHVybiBlbDtcbn1cblxuZnVuY3Rpb24gZGVmZXIgKGZuKSB7IHJldHVybiBmdW5jdGlvbiAoKSB7IHNldFRpbWVvdXQoZm4sIDApOyB9OyB9XG5mdW5jdGlvbiB0ZXh0IChlbCwgdmFsdWUpIHsgZWwuaW5uZXJUZXh0ID0gZWwudGV4dENvbnRlbnQgPSB2YWx1ZTsgfVxuXG5mdW5jdGlvbiBpc0VkaXRhYmxlIChlbCkge1xuICBjb25zdCB2YWx1ZSA9IGVsLmdldEF0dHJpYnV0ZSgnY29udGVudEVkaXRhYmxlJyk7XG4gIGlmICh2YWx1ZSA9PT0gJ2ZhbHNlJykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAodmFsdWUgPT09ICd0cnVlJykge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIGlmIChlbC5wYXJlbnRFbGVtZW50KSB7XG4gICAgcmV0dXJuIGlzRWRpdGFibGUoZWwucGFyZW50RWxlbWVudCk7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGhvcnNleTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYXRvYSAoYSwgbikgeyByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYSwgbik7IH1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNyb3NzdmVudCA9IHJlcXVpcmUoJ2Nyb3NzdmVudCcpO1xudmFyIHRocm90dGxlID0gcmVxdWlyZSgnLi90aHJvdHRsZScpO1xudmFyIHRhaWxvcm1hZGUgPSByZXF1aXJlKCcuL3RhaWxvcm1hZGUnKTtcblxuZnVuY3Rpb24gYnVsbHNleWUgKGVsLCB0YXJnZXQsIG9wdGlvbnMpIHtcbiAgdmFyIG8gPSBvcHRpb25zO1xuICB2YXIgZG9tVGFyZ2V0ID0gdGFyZ2V0ICYmIHRhcmdldC50YWdOYW1lO1xuXG4gIGlmICghZG9tVGFyZ2V0ICYmIGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcbiAgICBvID0gdGFyZ2V0O1xuICB9XG4gIGlmICghZG9tVGFyZ2V0KSB7XG4gICAgdGFyZ2V0ID0gZWw7XG4gIH1cbiAgaWYgKCFvKSB7IG8gPSB7fTsgfVxuXG4gIHZhciBkZXN0cm95ZWQgPSBmYWxzZTtcbiAgdmFyIHRocm90dGxlZFdyaXRlID0gdGhyb3R0bGUod3JpdGUsIDMwKTtcbiAgdmFyIHRhaWxvck9wdGlvbnMgPSB7IHVwZGF0ZTogby5hdXRvdXBkYXRlVG9DYXJldCAhPT0gZmFsc2UgJiYgdXBkYXRlIH07XG4gIHZhciB0YWlsb3IgPSBvLmNhcmV0ICYmIHRhaWxvcm1hZGUodGFyZ2V0LCB0YWlsb3JPcHRpb25zKTtcblxuICB3cml0ZSgpO1xuXG4gIGlmIChvLnRyYWNraW5nICE9PSBmYWxzZSkge1xuICAgIGNyb3NzdmVudC5hZGQod2luZG93LCAncmVzaXplJywgdGhyb3R0bGVkV3JpdGUpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICByZWFkOiByZWFkTnVsbCxcbiAgICByZWZyZXNoOiB3cml0ZSxcbiAgICBkZXN0cm95OiBkZXN0cm95LFxuICAgIHNsZWVwOiBzbGVlcFxuICB9O1xuXG4gIGZ1bmN0aW9uIHNsZWVwICgpIHtcbiAgICB0YWlsb3JPcHRpb25zLnNsZWVwaW5nID0gdHJ1ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWROdWxsICgpIHsgcmV0dXJuIHJlYWQoKTsgfVxuXG4gIGZ1bmN0aW9uIHJlYWQgKHJlYWRpbmdzKSB7XG4gICAgdmFyIGJvdW5kcyA9IHRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICB2YXIgc2Nyb2xsVG9wID0gZG9jdW1lbnQuYm9keS5zY3JvbGxUb3AgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcDtcbiAgICBpZiAodGFpbG9yKSB7XG4gICAgICByZWFkaW5ncyA9IHRhaWxvci5yZWFkKCk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB4OiAocmVhZGluZ3MuYWJzb2x1dGUgPyAwIDogYm91bmRzLmxlZnQpICsgcmVhZGluZ3MueCxcbiAgICAgICAgeTogKHJlYWRpbmdzLmFic29sdXRlID8gMCA6IGJvdW5kcy50b3ApICsgc2Nyb2xsVG9wICsgcmVhZGluZ3MueSArIDIwXG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgeDogYm91bmRzLmxlZnQsXG4gICAgICB5OiBib3VuZHMudG9wICsgc2Nyb2xsVG9wXG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHVwZGF0ZSAocmVhZGluZ3MpIHtcbiAgICB3cml0ZShyZWFkaW5ncyk7XG4gIH1cblxuICBmdW5jdGlvbiB3cml0ZSAocmVhZGluZ3MpIHtcbiAgICBpZiAoZGVzdHJveWVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0J1bGxzZXllIGNhblxcJ3QgcmVmcmVzaCBhZnRlciBiZWluZyBkZXN0cm95ZWQuIENyZWF0ZSBhbm90aGVyIGluc3RhbmNlIGluc3RlYWQuJyk7XG4gICAgfVxuICAgIGlmICh0YWlsb3IgJiYgIXJlYWRpbmdzKSB7XG4gICAgICB0YWlsb3JPcHRpb25zLnNsZWVwaW5nID0gZmFsc2U7XG4gICAgICB0YWlsb3IucmVmcmVzaCgpOyByZXR1cm47XG4gICAgfVxuICAgIHZhciBwID0gcmVhZChyZWFkaW5ncyk7XG4gICAgaWYgKCF0YWlsb3IgJiYgdGFyZ2V0ICE9PSBlbCkge1xuICAgICAgcC55ICs9IHRhcmdldC5vZmZzZXRIZWlnaHQ7XG4gICAgfVxuICAgIHZhciBjb250ZXh0ID0gby5jb250ZXh0O1xuICAgIGVsLnN0eWxlLmxlZnQgPSBwLnggKyAncHgnO1xuICAgIGVsLnN0eWxlLnRvcCA9IChjb250ZXh0ID8gY29udGV4dC5vZmZzZXRIZWlnaHQgOiBwLnkpICsgJ3B4JztcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlc3Ryb3kgKCkge1xuICAgIGlmICh0YWlsb3IpIHsgdGFpbG9yLmRlc3Ryb3koKTsgfVxuICAgIGNyb3NzdmVudC5yZW1vdmUod2luZG93LCAncmVzaXplJywgdGhyb3R0bGVkV3JpdGUpO1xuICAgIGRlc3Ryb3llZCA9IHRydWU7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBidWxsc2V5ZTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHNlbGwgPSByZXF1aXJlKCdzZWxsJyk7XG52YXIgY3Jvc3N2ZW50ID0gcmVxdWlyZSgnY3Jvc3N2ZW50Jyk7XG52YXIgc2VsZWNjaW9uID0gcmVxdWlyZSgnc2VsZWNjaW9uJyk7XG52YXIgdGhyb3R0bGUgPSByZXF1aXJlKCcuL3Rocm90dGxlJyk7XG52YXIgZ2V0U2VsZWN0aW9uID0gc2VsZWNjaW9uLmdldDtcbnZhciBwcm9wcyA9IFtcbiAgJ2RpcmVjdGlvbicsXG4gICdib3hTaXppbmcnLFxuICAnd2lkdGgnLFxuICAnaGVpZ2h0JyxcbiAgJ292ZXJmbG93WCcsXG4gICdvdmVyZmxvd1knLFxuICAnYm9yZGVyVG9wV2lkdGgnLFxuICAnYm9yZGVyUmlnaHRXaWR0aCcsXG4gICdib3JkZXJCb3R0b21XaWR0aCcsXG4gICdib3JkZXJMZWZ0V2lkdGgnLFxuICAncGFkZGluZ1RvcCcsXG4gICdwYWRkaW5nUmlnaHQnLFxuICAncGFkZGluZ0JvdHRvbScsXG4gICdwYWRkaW5nTGVmdCcsXG4gICdmb250U3R5bGUnLFxuICAnZm9udFZhcmlhbnQnLFxuICAnZm9udFdlaWdodCcsXG4gICdmb250U3RyZXRjaCcsXG4gICdmb250U2l6ZScsXG4gICdmb250U2l6ZUFkanVzdCcsXG4gICdsaW5lSGVpZ2h0JyxcbiAgJ2ZvbnRGYW1pbHknLFxuICAndGV4dEFsaWduJyxcbiAgJ3RleHRUcmFuc2Zvcm0nLFxuICAndGV4dEluZGVudCcsXG4gICd0ZXh0RGVjb3JhdGlvbicsXG4gICdsZXR0ZXJTcGFjaW5nJyxcbiAgJ3dvcmRTcGFjaW5nJ1xuXTtcbnZhciB3aW4gPSBnbG9iYWw7XG52YXIgZG9jID0gZG9jdW1lbnQ7XG52YXIgZmYgPSB3aW4ubW96SW5uZXJTY3JlZW5YICE9PSBudWxsICYmIHdpbi5tb3pJbm5lclNjcmVlblggIT09IHZvaWQgMDtcblxuZnVuY3Rpb24gdGFpbG9ybWFkZSAoZWwsIG9wdGlvbnMpIHtcbiAgdmFyIHRleHRJbnB1dCA9IGVsLnRhZ05hbWUgPT09ICdJTlBVVCcgfHwgZWwudGFnTmFtZSA9PT0gJ1RFWFRBUkVBJztcbiAgdmFyIHRocm90dGxlZFJlZnJlc2ggPSB0aHJvdHRsZShyZWZyZXNoLCAzMCk7XG4gIHZhciBvID0gb3B0aW9ucyB8fCB7fTtcblxuICBiaW5kKCk7XG5cbiAgcmV0dXJuIHtcbiAgICByZWFkOiByZWFkUG9zaXRpb24sXG4gICAgcmVmcmVzaDogdGhyb3R0bGVkUmVmcmVzaCxcbiAgICBkZXN0cm95OiBkZXN0cm95XG4gIH07XG5cbiAgZnVuY3Rpb24gbm9vcCAoKSB7fVxuICBmdW5jdGlvbiByZWFkUG9zaXRpb24gKCkgeyByZXR1cm4gKHRleHRJbnB1dCA/IGNvb3Jkc1RleHQgOiBjb29yZHNIVE1MKSgpOyB9XG5cbiAgZnVuY3Rpb24gcmVmcmVzaCAoKSB7XG4gICAgaWYgKG8uc2xlZXBpbmcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmV0dXJuIChvLnVwZGF0ZSB8fCBub29wKShyZWFkUG9zaXRpb24oKSk7XG4gIH1cblxuICBmdW5jdGlvbiBjb29yZHNUZXh0ICgpIHtcbiAgICB2YXIgcCA9IHNlbGwoZWwpO1xuICAgIHZhciBjb250ZXh0ID0gcHJlcGFyZSgpO1xuICAgIHZhciByZWFkaW5ncyA9IHJlYWRUZXh0Q29vcmRzKGNvbnRleHQsIHAuc3RhcnQpO1xuICAgIGRvYy5ib2R5LnJlbW92ZUNoaWxkKGNvbnRleHQubWlycm9yKTtcbiAgICByZXR1cm4gcmVhZGluZ3M7XG4gIH1cblxuICBmdW5jdGlvbiBjb29yZHNIVE1MICgpIHtcbiAgICB2YXIgc2VsID0gZ2V0U2VsZWN0aW9uKCk7XG4gICAgaWYgKHNlbC5yYW5nZUNvdW50KSB7XG4gICAgICB2YXIgcmFuZ2UgPSBzZWwuZ2V0UmFuZ2VBdCgwKTtcbiAgICAgIHZhciBuZWVkc1RvV29ya0Fyb3VuZE5ld2xpbmVCdWcgPSByYW5nZS5zdGFydENvbnRhaW5lci5ub2RlTmFtZSA9PT0gJ1AnICYmIHJhbmdlLnN0YXJ0T2Zmc2V0ID09PSAwO1xuICAgICAgaWYgKG5lZWRzVG9Xb3JrQXJvdW5kTmV3bGluZUJ1Zykge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHg6IHJhbmdlLnN0YXJ0Q29udGFpbmVyLm9mZnNldExlZnQsXG4gICAgICAgICAgeTogcmFuZ2Uuc3RhcnRDb250YWluZXIub2Zmc2V0VG9wLFxuICAgICAgICAgIGFic29sdXRlOiB0cnVlXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBpZiAocmFuZ2UuZ2V0Q2xpZW50UmVjdHMpIHtcbiAgICAgICAgdmFyIHJlY3RzID0gcmFuZ2UuZ2V0Q2xpZW50UmVjdHMoKTtcbiAgICAgICAgaWYgKHJlY3RzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeDogcmVjdHNbMF0ubGVmdCxcbiAgICAgICAgICAgIHk6IHJlY3RzWzBdLnRvcCxcbiAgICAgICAgICAgIGFic29sdXRlOiB0cnVlXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4geyB4OiAwLCB5OiAwIH07XG4gIH1cblxuICBmdW5jdGlvbiByZWFkVGV4dENvb3JkcyAoY29udGV4dCwgcCkge1xuICAgIHZhciByZXN0ID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICB2YXIgbWlycm9yID0gY29udGV4dC5taXJyb3I7XG4gICAgdmFyIGNvbXB1dGVkID0gY29udGV4dC5jb21wdXRlZDtcblxuICAgIHdyaXRlKG1pcnJvciwgcmVhZChlbCkuc3Vic3RyaW5nKDAsIHApKTtcblxuICAgIGlmIChlbC50YWdOYW1lID09PSAnSU5QVVQnKSB7XG4gICAgICBtaXJyb3IudGV4dENvbnRlbnQgPSBtaXJyb3IudGV4dENvbnRlbnQucmVwbGFjZSgvXFxzL2csICdcXHUwMGEwJyk7XG4gICAgfVxuXG4gICAgd3JpdGUocmVzdCwgcmVhZChlbCkuc3Vic3RyaW5nKHApIHx8ICcuJyk7XG5cbiAgICBtaXJyb3IuYXBwZW5kQ2hpbGQocmVzdCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgeDogcmVzdC5vZmZzZXRMZWZ0ICsgcGFyc2VJbnQoY29tcHV0ZWRbJ2JvcmRlckxlZnRXaWR0aCddKSxcbiAgICAgIHk6IHJlc3Qub2Zmc2V0VG9wICsgcGFyc2VJbnQoY29tcHV0ZWRbJ2JvcmRlclRvcFdpZHRoJ10pXG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWQgKGVsKSB7XG4gICAgcmV0dXJuIHRleHRJbnB1dCA/IGVsLnZhbHVlIDogZWwuaW5uZXJIVE1MO1xuICB9XG5cbiAgZnVuY3Rpb24gcHJlcGFyZSAoKSB7XG4gICAgdmFyIGNvbXB1dGVkID0gd2luLmdldENvbXB1dGVkU3R5bGUgPyBnZXRDb21wdXRlZFN0eWxlKGVsKSA6IGVsLmN1cnJlbnRTdHlsZTtcbiAgICB2YXIgbWlycm9yID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHZhciBzdHlsZSA9IG1pcnJvci5zdHlsZTtcblxuICAgIGRvYy5ib2R5LmFwcGVuZENoaWxkKG1pcnJvcik7XG5cbiAgICBpZiAoZWwudGFnTmFtZSAhPT0gJ0lOUFVUJykge1xuICAgICAgc3R5bGUud29yZFdyYXAgPSAnYnJlYWstd29yZCc7XG4gICAgfVxuICAgIHN0eWxlLndoaXRlU3BhY2UgPSAncHJlLXdyYXAnO1xuICAgIHN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICBzdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbic7XG4gICAgcHJvcHMuZm9yRWFjaChjb3B5KTtcblxuICAgIGlmIChmZikge1xuICAgICAgc3R5bGUud2lkdGggPSBwYXJzZUludChjb21wdXRlZC53aWR0aCkgLSAyICsgJ3B4JztcbiAgICAgIGlmIChlbC5zY3JvbGxIZWlnaHQgPiBwYXJzZUludChjb21wdXRlZC5oZWlnaHQpKSB7XG4gICAgICAgIHN0eWxlLm92ZXJmbG93WSA9ICdzY3JvbGwnO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xuICAgIH1cbiAgICByZXR1cm4geyBtaXJyb3I6IG1pcnJvciwgY29tcHV0ZWQ6IGNvbXB1dGVkIH07XG5cbiAgICBmdW5jdGlvbiBjb3B5IChwcm9wKSB7XG4gICAgICBzdHlsZVtwcm9wXSA9IGNvbXB1dGVkW3Byb3BdO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHdyaXRlIChlbCwgdmFsdWUpIHtcbiAgICBpZiAodGV4dElucHV0KSB7XG4gICAgICBlbC50ZXh0Q29udGVudCA9IHZhbHVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBlbC5pbm5lckhUTUwgPSB2YWx1ZTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBiaW5kIChyZW1vdmUpIHtcbiAgICB2YXIgb3AgPSByZW1vdmUgPyAncmVtb3ZlJyA6ICdhZGQnO1xuICAgIGNyb3NzdmVudFtvcF0oZWwsICdrZXlkb3duJywgdGhyb3R0bGVkUmVmcmVzaCk7XG4gICAgY3Jvc3N2ZW50W29wXShlbCwgJ2tleXVwJywgdGhyb3R0bGVkUmVmcmVzaCk7XG4gICAgY3Jvc3N2ZW50W29wXShlbCwgJ2lucHV0JywgdGhyb3R0bGVkUmVmcmVzaCk7XG4gICAgY3Jvc3N2ZW50W29wXShlbCwgJ3Bhc3RlJywgdGhyb3R0bGVkUmVmcmVzaCk7XG4gICAgY3Jvc3N2ZW50W29wXShlbCwgJ2NoYW5nZScsIHRocm90dGxlZFJlZnJlc2gpO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVzdHJveSAoKSB7XG4gICAgYmluZCh0cnVlKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRhaWxvcm1hZGU7XG4iLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIHRocm90dGxlIChmbiwgYm91bmRhcnkpIHtcbiAgdmFyIGxhc3QgPSAtSW5maW5pdHk7XG4gIHZhciB0aW1lcjtcbiAgcmV0dXJuIGZ1bmN0aW9uIGJvdW5jZWQgKCkge1xuICAgIGlmICh0aW1lcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB1bmJvdW5kKCk7XG5cbiAgICBmdW5jdGlvbiB1bmJvdW5kICgpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgICB0aW1lciA9IG51bGw7XG4gICAgICB2YXIgbmV4dCA9IGxhc3QgKyBib3VuZGFyeTtcbiAgICAgIHZhciBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgaWYgKG5vdyA+IG5leHQpIHtcbiAgICAgICAgbGFzdCA9IG5vdztcbiAgICAgICAgZm4oKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRpbWVyID0gc2V0VGltZW91dCh1bmJvdW5kLCBuZXh0IC0gbm93KTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdGhyb3R0bGU7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB0aWNreSA9IHJlcXVpcmUoJ3RpY2t5Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZGVib3VuY2UgKGZuLCBhcmdzLCBjdHgpIHtcbiAgaWYgKCFmbikgeyByZXR1cm47IH1cbiAgdGlja3koZnVuY3Rpb24gcnVuICgpIHtcbiAgICBmbi5hcHBseShjdHggfHwgbnVsbCwgYXJncyB8fCBbXSk7XG4gIH0pO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGF0b2EgPSByZXF1aXJlKCdhdG9hJyk7XG52YXIgZGVib3VuY2UgPSByZXF1aXJlKCcuL2RlYm91bmNlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZW1pdHRlciAodGhpbmcsIG9wdGlvbnMpIHtcbiAgdmFyIG9wdHMgPSBvcHRpb25zIHx8IHt9O1xuICB2YXIgZXZ0ID0ge307XG4gIGlmICh0aGluZyA9PT0gdW5kZWZpbmVkKSB7IHRoaW5nID0ge307IH1cbiAgdGhpbmcub24gPSBmdW5jdGlvbiAodHlwZSwgZm4pIHtcbiAgICBpZiAoIWV2dFt0eXBlXSkge1xuICAgICAgZXZ0W3R5cGVdID0gW2ZuXTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXZ0W3R5cGVdLnB1c2goZm4pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpbmc7XG4gIH07XG4gIHRoaW5nLm9uY2UgPSBmdW5jdGlvbiAodHlwZSwgZm4pIHtcbiAgICBmbi5fb25jZSA9IHRydWU7IC8vIHRoaW5nLm9mZihmbikgc3RpbGwgd29ya3MhXG4gICAgdGhpbmcub24odHlwZSwgZm4pO1xuICAgIHJldHVybiB0aGluZztcbiAgfTtcbiAgdGhpbmcub2ZmID0gZnVuY3Rpb24gKHR5cGUsIGZuKSB7XG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgIGlmIChjID09PSAxKSB7XG4gICAgICBkZWxldGUgZXZ0W3R5cGVdO1xuICAgIH0gZWxzZSBpZiAoYyA9PT0gMCkge1xuICAgICAgZXZ0ID0ge307XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBldCA9IGV2dFt0eXBlXTtcbiAgICAgIGlmICghZXQpIHsgcmV0dXJuIHRoaW5nOyB9XG4gICAgICBldC5zcGxpY2UoZXQuaW5kZXhPZihmbiksIDEpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpbmc7XG4gIH07XG4gIHRoaW5nLmVtaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGFyZ3MgPSBhdG9hKGFyZ3VtZW50cyk7XG4gICAgcmV0dXJuIHRoaW5nLmVtaXR0ZXJTbmFwc2hvdChhcmdzLnNoaWZ0KCkpLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9O1xuICB0aGluZy5lbWl0dGVyU25hcHNob3QgPSBmdW5jdGlvbiAodHlwZSkge1xuICAgIHZhciBldCA9IChldnRbdHlwZV0gfHwgW10pLnNsaWNlKDApO1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgYXJncyA9IGF0b2EoYXJndW1lbnRzKTtcbiAgICAgIHZhciBjdHggPSB0aGlzIHx8IHRoaW5nO1xuICAgICAgaWYgKHR5cGUgPT09ICdlcnJvcicgJiYgb3B0cy50aHJvd3MgIT09IGZhbHNlICYmICFldC5sZW5ndGgpIHsgdGhyb3cgYXJncy5sZW5ndGggPT09IDEgPyBhcmdzWzBdIDogYXJnczsgfVxuICAgICAgZXQuZm9yRWFjaChmdW5jdGlvbiBlbWl0dGVyIChsaXN0ZW4pIHtcbiAgICAgICAgaWYgKG9wdHMuYXN5bmMpIHsgZGVib3VuY2UobGlzdGVuLCBhcmdzLCBjdHgpOyB9IGVsc2UgeyBsaXN0ZW4uYXBwbHkoY3R4LCBhcmdzKTsgfVxuICAgICAgICBpZiAobGlzdGVuLl9vbmNlKSB7IHRoaW5nLm9mZih0eXBlLCBsaXN0ZW4pOyB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiB0aGluZztcbiAgICB9O1xuICB9O1xuICByZXR1cm4gdGhpbmc7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY3VzdG9tRXZlbnQgPSByZXF1aXJlKCdjdXN0b20tZXZlbnQnKTtcbnZhciBldmVudG1hcCA9IHJlcXVpcmUoJy4vZXZlbnRtYXAnKTtcbnZhciBkb2MgPSBnbG9iYWwuZG9jdW1lbnQ7XG52YXIgYWRkRXZlbnQgPSBhZGRFdmVudEVhc3k7XG52YXIgcmVtb3ZlRXZlbnQgPSByZW1vdmVFdmVudEVhc3k7XG52YXIgaGFyZENhY2hlID0gW107XG5cbmlmICghZ2xvYmFsLmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgYWRkRXZlbnQgPSBhZGRFdmVudEhhcmQ7XG4gIHJlbW92ZUV2ZW50ID0gcmVtb3ZlRXZlbnRIYXJkO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgYWRkOiBhZGRFdmVudCxcbiAgcmVtb3ZlOiByZW1vdmVFdmVudCxcbiAgZmFicmljYXRlOiBmYWJyaWNhdGVFdmVudFxufTtcblxuZnVuY3Rpb24gYWRkRXZlbnRFYXN5IChlbCwgdHlwZSwgZm4sIGNhcHR1cmluZykge1xuICByZXR1cm4gZWwuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBmbiwgY2FwdHVyaW5nKTtcbn1cblxuZnVuY3Rpb24gYWRkRXZlbnRIYXJkIChlbCwgdHlwZSwgZm4pIHtcbiAgcmV0dXJuIGVsLmF0dGFjaEV2ZW50KCdvbicgKyB0eXBlLCB3cmFwKGVsLCB0eXBlLCBmbikpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVFdmVudEVhc3kgKGVsLCB0eXBlLCBmbiwgY2FwdHVyaW5nKSB7XG4gIHJldHVybiBlbC5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGZuLCBjYXB0dXJpbmcpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVFdmVudEhhcmQgKGVsLCB0eXBlLCBmbikge1xuICB2YXIgbGlzdGVuZXIgPSB1bndyYXAoZWwsIHR5cGUsIGZuKTtcbiAgaWYgKGxpc3RlbmVyKSB7XG4gICAgcmV0dXJuIGVsLmRldGFjaEV2ZW50KCdvbicgKyB0eXBlLCBsaXN0ZW5lcik7XG4gIH1cbn1cblxuZnVuY3Rpb24gZmFicmljYXRlRXZlbnQgKGVsLCB0eXBlLCBtb2RlbCkge1xuICB2YXIgZSA9IGV2ZW50bWFwLmluZGV4T2YodHlwZSkgPT09IC0xID8gbWFrZUN1c3RvbUV2ZW50KCkgOiBtYWtlQ2xhc3NpY0V2ZW50KCk7XG4gIGlmIChlbC5kaXNwYXRjaEV2ZW50KSB7XG4gICAgZWwuZGlzcGF0Y2hFdmVudChlKTtcbiAgfSBlbHNlIHtcbiAgICBlbC5maXJlRXZlbnQoJ29uJyArIHR5cGUsIGUpO1xuICB9XG4gIGZ1bmN0aW9uIG1ha2VDbGFzc2ljRXZlbnQgKCkge1xuICAgIHZhciBlO1xuICAgIGlmIChkb2MuY3JlYXRlRXZlbnQpIHtcbiAgICAgIGUgPSBkb2MuY3JlYXRlRXZlbnQoJ0V2ZW50Jyk7XG4gICAgICBlLmluaXRFdmVudCh0eXBlLCB0cnVlLCB0cnVlKTtcbiAgICB9IGVsc2UgaWYgKGRvYy5jcmVhdGVFdmVudE9iamVjdCkge1xuICAgICAgZSA9IGRvYy5jcmVhdGVFdmVudE9iamVjdCgpO1xuICAgIH1cbiAgICByZXR1cm4gZTtcbiAgfVxuICBmdW5jdGlvbiBtYWtlQ3VzdG9tRXZlbnQgKCkge1xuICAgIHJldHVybiBuZXcgY3VzdG9tRXZlbnQodHlwZSwgeyBkZXRhaWw6IG1vZGVsIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIHdyYXBwZXJGYWN0b3J5IChlbCwgdHlwZSwgZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIHdyYXBwZXIgKG9yaWdpbmFsRXZlbnQpIHtcbiAgICB2YXIgZSA9IG9yaWdpbmFsRXZlbnQgfHwgZ2xvYmFsLmV2ZW50O1xuICAgIGUudGFyZ2V0ID0gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50O1xuICAgIGUucHJldmVudERlZmF1bHQgPSBlLnByZXZlbnREZWZhdWx0IHx8IGZ1bmN0aW9uIHByZXZlbnREZWZhdWx0ICgpIHsgZS5yZXR1cm5WYWx1ZSA9IGZhbHNlOyB9O1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uID0gZS5zdG9wUHJvcGFnYXRpb24gfHwgZnVuY3Rpb24gc3RvcFByb3BhZ2F0aW9uICgpIHsgZS5jYW5jZWxCdWJibGUgPSB0cnVlOyB9O1xuICAgIGUud2hpY2ggPSBlLndoaWNoIHx8IGUua2V5Q29kZTtcbiAgICBmbi5jYWxsKGVsLCBlKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gd3JhcCAoZWwsIHR5cGUsIGZuKSB7XG4gIHZhciB3cmFwcGVyID0gdW53cmFwKGVsLCB0eXBlLCBmbikgfHwgd3JhcHBlckZhY3RvcnkoZWwsIHR5cGUsIGZuKTtcbiAgaGFyZENhY2hlLnB1c2goe1xuICAgIHdyYXBwZXI6IHdyYXBwZXIsXG4gICAgZWxlbWVudDogZWwsXG4gICAgdHlwZTogdHlwZSxcbiAgICBmbjogZm5cbiAgfSk7XG4gIHJldHVybiB3cmFwcGVyO1xufVxuXG5mdW5jdGlvbiB1bndyYXAgKGVsLCB0eXBlLCBmbikge1xuICB2YXIgaSA9IGZpbmQoZWwsIHR5cGUsIGZuKTtcbiAgaWYgKGkpIHtcbiAgICB2YXIgd3JhcHBlciA9IGhhcmRDYWNoZVtpXS53cmFwcGVyO1xuICAgIGhhcmRDYWNoZS5zcGxpY2UoaSwgMSk7IC8vIGZyZWUgdXAgYSB0YWQgb2YgbWVtb3J5XG4gICAgcmV0dXJuIHdyYXBwZXI7XG4gIH1cbn1cblxuZnVuY3Rpb24gZmluZCAoZWwsIHR5cGUsIGZuKSB7XG4gIHZhciBpLCBpdGVtO1xuICBmb3IgKGkgPSAwOyBpIDwgaGFyZENhY2hlLmxlbmd0aDsgaSsrKSB7XG4gICAgaXRlbSA9IGhhcmRDYWNoZVtpXTtcbiAgICBpZiAoaXRlbS5lbGVtZW50ID09PSBlbCAmJiBpdGVtLnR5cGUgPT09IHR5cGUgJiYgaXRlbS5mbiA9PT0gZm4pIHtcbiAgICAgIHJldHVybiBpO1xuICAgIH1cbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZXZlbnRtYXAgPSBbXTtcbnZhciBldmVudG5hbWUgPSAnJztcbnZhciByb24gPSAvXm9uLztcblxuZm9yIChldmVudG5hbWUgaW4gZ2xvYmFsKSB7XG4gIGlmIChyb24udGVzdChldmVudG5hbWUpKSB7XG4gICAgZXZlbnRtYXAucHVzaChldmVudG5hbWUuc2xpY2UoMikpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZXZlbnRtYXA7XG4iLCJcbnZhciBOYXRpdmVDdXN0b21FdmVudCA9IGdsb2JhbC5DdXN0b21FdmVudDtcblxuZnVuY3Rpb24gdXNlTmF0aXZlICgpIHtcbiAgdHJ5IHtcbiAgICB2YXIgcCA9IG5ldyBOYXRpdmVDdXN0b21FdmVudCgnY2F0JywgeyBkZXRhaWw6IHsgZm9vOiAnYmFyJyB9IH0pO1xuICAgIHJldHVybiAgJ2NhdCcgPT09IHAudHlwZSAmJiAnYmFyJyA9PT0gcC5kZXRhaWwuZm9vO1xuICB9IGNhdGNoIChlKSB7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIENyb3NzLWJyb3dzZXIgYEN1c3RvbUV2ZW50YCBjb25zdHJ1Y3Rvci5cbiAqXG4gKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQ3VzdG9tRXZlbnQuQ3VzdG9tRXZlbnRcbiAqXG4gKiBAcHVibGljXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSB1c2VOYXRpdmUoKSA/IE5hdGl2ZUN1c3RvbUV2ZW50IDpcblxuLy8gSUUgPj0gOVxuJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGRvY3VtZW50LmNyZWF0ZUV2ZW50ID8gZnVuY3Rpb24gQ3VzdG9tRXZlbnQgKHR5cGUsIHBhcmFtcykge1xuICB2YXIgZSA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdDdXN0b21FdmVudCcpO1xuICBpZiAocGFyYW1zKSB7XG4gICAgZS5pbml0Q3VzdG9tRXZlbnQodHlwZSwgcGFyYW1zLmJ1YmJsZXMsIHBhcmFtcy5jYW5jZWxhYmxlLCBwYXJhbXMuZGV0YWlsKTtcbiAgfSBlbHNlIHtcbiAgICBlLmluaXRDdXN0b21FdmVudCh0eXBlLCBmYWxzZSwgZmFsc2UsIHZvaWQgMCk7XG4gIH1cbiAgcmV0dXJuIGU7XG59IDpcblxuLy8gSUUgPD0gOFxuZnVuY3Rpb24gQ3VzdG9tRXZlbnQgKHR5cGUsIHBhcmFtcykge1xuICB2YXIgZSA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50T2JqZWN0KCk7XG4gIGUudHlwZSA9IHR5cGU7XG4gIGlmIChwYXJhbXMpIHtcbiAgICBlLmJ1YmJsZXMgPSBCb29sZWFuKHBhcmFtcy5idWJibGVzKTtcbiAgICBlLmNhbmNlbGFibGUgPSBCb29sZWFuKHBhcmFtcy5jYW5jZWxhYmxlKTtcbiAgICBlLmRldGFpbCA9IHBhcmFtcy5kZXRhaWw7XG4gIH0gZWxzZSB7XG4gICAgZS5idWJibGVzID0gZmFsc2U7XG4gICAgZS5jYW5jZWxhYmxlID0gZmFsc2U7XG4gICAgZS5kZXRhaWwgPSB2b2lkIDA7XG4gIH1cbiAgcmV0dXJuIGU7XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIGZ1enp5c2VhcmNoIChuZWVkbGUsIGhheXN0YWNrKSB7XG4gIHZhciB0bGVuID0gaGF5c3RhY2subGVuZ3RoO1xuICB2YXIgcWxlbiA9IG5lZWRsZS5sZW5ndGg7XG4gIGlmIChxbGVuID4gdGxlbikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAocWxlbiA9PT0gdGxlbikge1xuICAgIHJldHVybiBuZWVkbGUgPT09IGhheXN0YWNrO1xuICB9XG4gIG91dGVyOiBmb3IgKHZhciBpID0gMCwgaiA9IDA7IGkgPCBxbGVuOyBpKyspIHtcbiAgICB2YXIgbmNoID0gbmVlZGxlLmNoYXJDb2RlQXQoaSk7XG4gICAgd2hpbGUgKGogPCB0bGVuKSB7XG4gICAgICBpZiAoaGF5c3RhY2suY2hhckNvZGVBdChqKyspID09PSBuY2gpIHtcbiAgICAgICAgY29udGludWUgb3V0ZXI7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdXp6eXNlYXJjaDtcbiIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gcGFkIChoYXNoLCBsZW4pIHtcbiAgd2hpbGUgKGhhc2gubGVuZ3RoIDwgbGVuKSB7XG4gICAgaGFzaCA9ICcwJyArIGhhc2g7XG4gIH1cbiAgcmV0dXJuIGhhc2g7XG59XG5cbmZ1bmN0aW9uIGZvbGQgKGhhc2gsIHRleHQpIHtcbiAgdmFyIGk7XG4gIHZhciBjaHI7XG4gIHZhciBsZW47XG4gIGlmICh0ZXh0Lmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBoYXNoO1xuICB9XG4gIGZvciAoaSA9IDAsIGxlbiA9IHRleHQubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBjaHIgPSB0ZXh0LmNoYXJDb2RlQXQoaSk7XG4gICAgaGFzaCA9ICgoaGFzaCA8PCA1KSAtIGhhc2gpICsgY2hyO1xuICAgIGhhc2ggfD0gMDtcbiAgfVxuICByZXR1cm4gaGFzaCA8IDAgPyBoYXNoICogLTIgOiBoYXNoO1xufVxuXG5mdW5jdGlvbiBmb2xkT2JqZWN0IChoYXNoLCBvLCBzZWVuKSB7XG4gIHJldHVybiBPYmplY3Qua2V5cyhvKS5zb3J0KCkucmVkdWNlKGZvbGRLZXksIGhhc2gpO1xuICBmdW5jdGlvbiBmb2xkS2V5IChoYXNoLCBrZXkpIHtcbiAgICByZXR1cm4gZm9sZFZhbHVlKGhhc2gsIG9ba2V5XSwga2V5LCBzZWVuKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBmb2xkVmFsdWUgKGlucHV0LCB2YWx1ZSwga2V5LCBzZWVuKSB7XG4gIHZhciBoYXNoID0gZm9sZChmb2xkKGZvbGQoaW5wdXQsIGtleSksIHRvU3RyaW5nKHZhbHVlKSksIHR5cGVvZiB2YWx1ZSk7XG4gIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xuICAgIHJldHVybiBmb2xkKGhhc2gsICdudWxsJyk7XG4gIH1cbiAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gZm9sZChoYXNoLCAndW5kZWZpbmVkJyk7XG4gIH1cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICBpZiAoc2Vlbi5pbmRleE9mKHZhbHVlKSAhPT0gLTEpIHtcbiAgICAgIHJldHVybiBmb2xkKGhhc2gsICdbQ2lyY3VsYXJdJyArIGtleSk7XG4gICAgfVxuICAgIHNlZW4ucHVzaCh2YWx1ZSk7XG4gICAgcmV0dXJuIGZvbGRPYmplY3QoaGFzaCwgdmFsdWUsIHNlZW4pO1xuICB9XG4gIHJldHVybiBmb2xkKGhhc2gsIHZhbHVlLnRvU3RyaW5nKCkpO1xufVxuXG5mdW5jdGlvbiB0b1N0cmluZyAobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5mdW5jdGlvbiBzdW0gKG8pIHtcbiAgcmV0dXJuIHBhZChmb2xkVmFsdWUoMCwgbywgJycsIFtdKS50b1N0cmluZygxNiksIDgpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHN1bTtcbiIsInZhciBpc09iamVjdCA9IHJlcXVpcmUoJy4vaXNPYmplY3QnKSxcbiAgICBub3cgPSByZXF1aXJlKCcuL25vdycpLFxuICAgIHRvTnVtYmVyID0gcmVxdWlyZSgnLi90b051bWJlcicpO1xuXG4vKiogVXNlZCBhcyB0aGUgYFR5cGVFcnJvcmAgbWVzc2FnZSBmb3IgXCJGdW5jdGlvbnNcIiBtZXRob2RzLiAqL1xudmFyIEZVTkNfRVJST1JfVEVYVCA9ICdFeHBlY3RlZCBhIGZ1bmN0aW9uJztcblxuLyogQnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMgZm9yIHRob3NlIHdpdGggdGhlIHNhbWUgbmFtZSBhcyBvdGhlciBgbG9kYXNoYCBtZXRob2RzLiAqL1xudmFyIG5hdGl2ZU1heCA9IE1hdGgubWF4LFxuICAgIG5hdGl2ZU1pbiA9IE1hdGgubWluO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBkZWJvdW5jZWQgZnVuY3Rpb24gdGhhdCBkZWxheXMgaW52b2tpbmcgYGZ1bmNgIHVudGlsIGFmdGVyIGB3YWl0YFxuICogbWlsbGlzZWNvbmRzIGhhdmUgZWxhcHNlZCBzaW5jZSB0aGUgbGFzdCB0aW1lIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb24gd2FzXG4gKiBpbnZva2VkLiBUaGUgZGVib3VuY2VkIGZ1bmN0aW9uIGNvbWVzIHdpdGggYSBgY2FuY2VsYCBtZXRob2QgdG8gY2FuY2VsXG4gKiBkZWxheWVkIGBmdW5jYCBpbnZvY2F0aW9ucyBhbmQgYSBgZmx1c2hgIG1ldGhvZCB0byBpbW1lZGlhdGVseSBpbnZva2UgdGhlbS5cbiAqIFByb3ZpZGUgYW4gb3B0aW9ucyBvYmplY3QgdG8gaW5kaWNhdGUgd2hldGhlciBgZnVuY2Agc2hvdWxkIGJlIGludm9rZWQgb25cbiAqIHRoZSBsZWFkaW5nIGFuZC9vciB0cmFpbGluZyBlZGdlIG9mIHRoZSBgd2FpdGAgdGltZW91dC4gVGhlIGBmdW5jYCBpcyBpbnZva2VkXG4gKiB3aXRoIHRoZSBsYXN0IGFyZ3VtZW50cyBwcm92aWRlZCB0byB0aGUgZGVib3VuY2VkIGZ1bmN0aW9uLiBTdWJzZXF1ZW50IGNhbGxzXG4gKiB0byB0aGUgZGVib3VuY2VkIGZ1bmN0aW9uIHJldHVybiB0aGUgcmVzdWx0IG9mIHRoZSBsYXN0IGBmdW5jYCBpbnZvY2F0aW9uLlxuICpcbiAqICoqTm90ZToqKiBJZiBgbGVhZGluZ2AgYW5kIGB0cmFpbGluZ2Agb3B0aW9ucyBhcmUgYHRydWVgLCBgZnVuY2AgaXMgaW52b2tlZFxuICogb24gdGhlIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQgb25seSBpZiB0aGUgZGVib3VuY2VkIGZ1bmN0aW9uIGlzXG4gKiBpbnZva2VkIG1vcmUgdGhhbiBvbmNlIGR1cmluZyB0aGUgYHdhaXRgIHRpbWVvdXQuXG4gKlxuICogU2VlIFtEYXZpZCBDb3JiYWNobydzIGFydGljbGVdKGh0dHBzOi8vY3NzLXRyaWNrcy5jb20vZGVib3VuY2luZy10aHJvdHRsaW5nLWV4cGxhaW5lZC1leGFtcGxlcy8pXG4gKiBmb3IgZGV0YWlscyBvdmVyIHRoZSBkaWZmZXJlbmNlcyBiZXR3ZWVuIGBfLmRlYm91bmNlYCBhbmQgYF8udGhyb3R0bGVgLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMC4xLjBcbiAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gZGVib3VuY2UuXG4gKiBAcGFyYW0ge251bWJlcn0gW3dhaXQ9MF0gVGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gZGVsYXkuXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnM9e31dIFRoZSBvcHRpb25zIG9iamVjdC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMubGVhZGluZz1mYWxzZV1cbiAqICBTcGVjaWZ5IGludm9raW5nIG9uIHRoZSBsZWFkaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQuXG4gKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMubWF4V2FpdF1cbiAqICBUaGUgbWF4aW11bSB0aW1lIGBmdW5jYCBpcyBhbGxvd2VkIHRvIGJlIGRlbGF5ZWQgYmVmb3JlIGl0J3MgaW52b2tlZC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudHJhaWxpbmc9dHJ1ZV1cbiAqICBTcGVjaWZ5IGludm9raW5nIG9uIHRoZSB0cmFpbGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0LlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZGVib3VuY2VkIGZ1bmN0aW9uLlxuICogQGV4YW1wbGVcbiAqXG4gKiAvLyBBdm9pZCBjb3N0bHkgY2FsY3VsYXRpb25zIHdoaWxlIHRoZSB3aW5kb3cgc2l6ZSBpcyBpbiBmbHV4LlxuICogalF1ZXJ5KHdpbmRvdykub24oJ3Jlc2l6ZScsIF8uZGVib3VuY2UoY2FsY3VsYXRlTGF5b3V0LCAxNTApKTtcbiAqXG4gKiAvLyBJbnZva2UgYHNlbmRNYWlsYCB3aGVuIGNsaWNrZWQsIGRlYm91bmNpbmcgc3Vic2VxdWVudCBjYWxscy5cbiAqIGpRdWVyeShlbGVtZW50KS5vbignY2xpY2snLCBfLmRlYm91bmNlKHNlbmRNYWlsLCAzMDAsIHtcbiAqICAgJ2xlYWRpbmcnOiB0cnVlLFxuICogICAndHJhaWxpbmcnOiBmYWxzZVxuICogfSkpO1xuICpcbiAqIC8vIEVuc3VyZSBgYmF0Y2hMb2dgIGlzIGludm9rZWQgb25jZSBhZnRlciAxIHNlY29uZCBvZiBkZWJvdW5jZWQgY2FsbHMuXG4gKiB2YXIgZGVib3VuY2VkID0gXy5kZWJvdW5jZShiYXRjaExvZywgMjUwLCB7ICdtYXhXYWl0JzogMTAwMCB9KTtcbiAqIHZhciBzb3VyY2UgPSBuZXcgRXZlbnRTb3VyY2UoJy9zdHJlYW0nKTtcbiAqIGpRdWVyeShzb3VyY2UpLm9uKCdtZXNzYWdlJywgZGVib3VuY2VkKTtcbiAqXG4gKiAvLyBDYW5jZWwgdGhlIHRyYWlsaW5nIGRlYm91bmNlZCBpbnZvY2F0aW9uLlxuICogalF1ZXJ5KHdpbmRvdykub24oJ3BvcHN0YXRlJywgZGVib3VuY2VkLmNhbmNlbCk7XG4gKi9cbmZ1bmN0aW9uIGRlYm91bmNlKGZ1bmMsIHdhaXQsIG9wdGlvbnMpIHtcbiAgdmFyIGxhc3RBcmdzLFxuICAgICAgbGFzdFRoaXMsXG4gICAgICBtYXhXYWl0LFxuICAgICAgcmVzdWx0LFxuICAgICAgdGltZXJJZCxcbiAgICAgIGxhc3RDYWxsVGltZSxcbiAgICAgIGxhc3RJbnZva2VUaW1lID0gMCxcbiAgICAgIGxlYWRpbmcgPSBmYWxzZSxcbiAgICAgIG1heGluZyA9IGZhbHNlLFxuICAgICAgdHJhaWxpbmcgPSB0cnVlO1xuXG4gIGlmICh0eXBlb2YgZnVuYyAhPSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihGVU5DX0VSUk9SX1RFWFQpO1xuICB9XG4gIHdhaXQgPSB0b051bWJlcih3YWl0KSB8fCAwO1xuICBpZiAoaXNPYmplY3Qob3B0aW9ucykpIHtcbiAgICBsZWFkaW5nID0gISFvcHRpb25zLmxlYWRpbmc7XG4gICAgbWF4aW5nID0gJ21heFdhaXQnIGluIG9wdGlvbnM7XG4gICAgbWF4V2FpdCA9IG1heGluZyA/IG5hdGl2ZU1heCh0b051bWJlcihvcHRpb25zLm1heFdhaXQpIHx8IDAsIHdhaXQpIDogbWF4V2FpdDtcbiAgICB0cmFpbGluZyA9ICd0cmFpbGluZycgaW4gb3B0aW9ucyA/ICEhb3B0aW9ucy50cmFpbGluZyA6IHRyYWlsaW5nO1xuICB9XG5cbiAgZnVuY3Rpb24gaW52b2tlRnVuYyh0aW1lKSB7XG4gICAgdmFyIGFyZ3MgPSBsYXN0QXJncyxcbiAgICAgICAgdGhpc0FyZyA9IGxhc3RUaGlzO1xuXG4gICAgbGFzdEFyZ3MgPSBsYXN0VGhpcyA9IHVuZGVmaW5lZDtcbiAgICBsYXN0SW52b2tlVGltZSA9IHRpbWU7XG4gICAgcmVzdWx0ID0gZnVuYy5hcHBseSh0aGlzQXJnLCBhcmdzKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZnVuY3Rpb24gbGVhZGluZ0VkZ2UodGltZSkge1xuICAgIC8vIFJlc2V0IGFueSBgbWF4V2FpdGAgdGltZXIuXG4gICAgbGFzdEludm9rZVRpbWUgPSB0aW1lO1xuICAgIC8vIFN0YXJ0IHRoZSB0aW1lciBmb3IgdGhlIHRyYWlsaW5nIGVkZ2UuXG4gICAgdGltZXJJZCA9IHNldFRpbWVvdXQodGltZXJFeHBpcmVkLCB3YWl0KTtcbiAgICAvLyBJbnZva2UgdGhlIGxlYWRpbmcgZWRnZS5cbiAgICByZXR1cm4gbGVhZGluZyA/IGludm9rZUZ1bmModGltZSkgOiByZXN1bHQ7XG4gIH1cblxuICBmdW5jdGlvbiByZW1haW5pbmdXYWl0KHRpbWUpIHtcbiAgICB2YXIgdGltZVNpbmNlTGFzdENhbGwgPSB0aW1lIC0gbGFzdENhbGxUaW1lLFxuICAgICAgICB0aW1lU2luY2VMYXN0SW52b2tlID0gdGltZSAtIGxhc3RJbnZva2VUaW1lLFxuICAgICAgICByZXN1bHQgPSB3YWl0IC0gdGltZVNpbmNlTGFzdENhbGw7XG5cbiAgICByZXR1cm4gbWF4aW5nID8gbmF0aXZlTWluKHJlc3VsdCwgbWF4V2FpdCAtIHRpbWVTaW5jZUxhc3RJbnZva2UpIDogcmVzdWx0O1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvdWxkSW52b2tlKHRpbWUpIHtcbiAgICB2YXIgdGltZVNpbmNlTGFzdENhbGwgPSB0aW1lIC0gbGFzdENhbGxUaW1lLFxuICAgICAgICB0aW1lU2luY2VMYXN0SW52b2tlID0gdGltZSAtIGxhc3RJbnZva2VUaW1lO1xuXG4gICAgLy8gRWl0aGVyIHRoaXMgaXMgdGhlIGZpcnN0IGNhbGwsIGFjdGl2aXR5IGhhcyBzdG9wcGVkIGFuZCB3ZSdyZSBhdCB0aGVcbiAgICAvLyB0cmFpbGluZyBlZGdlLCB0aGUgc3lzdGVtIHRpbWUgaGFzIGdvbmUgYmFja3dhcmRzIGFuZCB3ZSdyZSB0cmVhdGluZ1xuICAgIC8vIGl0IGFzIHRoZSB0cmFpbGluZyBlZGdlLCBvciB3ZSd2ZSBoaXQgdGhlIGBtYXhXYWl0YCBsaW1pdC5cbiAgICByZXR1cm4gKGxhc3RDYWxsVGltZSA9PT0gdW5kZWZpbmVkIHx8ICh0aW1lU2luY2VMYXN0Q2FsbCA+PSB3YWl0KSB8fFxuICAgICAgKHRpbWVTaW5jZUxhc3RDYWxsIDwgMCkgfHwgKG1heGluZyAmJiB0aW1lU2luY2VMYXN0SW52b2tlID49IG1heFdhaXQpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRpbWVyRXhwaXJlZCgpIHtcbiAgICB2YXIgdGltZSA9IG5vdygpO1xuICAgIGlmIChzaG91bGRJbnZva2UodGltZSkpIHtcbiAgICAgIHJldHVybiB0cmFpbGluZ0VkZ2UodGltZSk7XG4gICAgfVxuICAgIC8vIFJlc3RhcnQgdGhlIHRpbWVyLlxuICAgIHRpbWVySWQgPSBzZXRUaW1lb3V0KHRpbWVyRXhwaXJlZCwgcmVtYWluaW5nV2FpdCh0aW1lKSk7XG4gIH1cblxuICBmdW5jdGlvbiB0cmFpbGluZ0VkZ2UodGltZSkge1xuICAgIHRpbWVySWQgPSB1bmRlZmluZWQ7XG5cbiAgICAvLyBPbmx5IGludm9rZSBpZiB3ZSBoYXZlIGBsYXN0QXJnc2Agd2hpY2ggbWVhbnMgYGZ1bmNgIGhhcyBiZWVuXG4gICAgLy8gZGVib3VuY2VkIGF0IGxlYXN0IG9uY2UuXG4gICAgaWYgKHRyYWlsaW5nICYmIGxhc3RBcmdzKSB7XG4gICAgICByZXR1cm4gaW52b2tlRnVuYyh0aW1lKTtcbiAgICB9XG4gICAgbGFzdEFyZ3MgPSBsYXN0VGhpcyA9IHVuZGVmaW5lZDtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZnVuY3Rpb24gY2FuY2VsKCkge1xuICAgIGxhc3RJbnZva2VUaW1lID0gMDtcbiAgICBsYXN0QXJncyA9IGxhc3RDYWxsVGltZSA9IGxhc3RUaGlzID0gdGltZXJJZCA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZsdXNoKCkge1xuICAgIHJldHVybiB0aW1lcklkID09PSB1bmRlZmluZWQgPyByZXN1bHQgOiB0cmFpbGluZ0VkZ2Uobm93KCkpO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVib3VuY2VkKCkge1xuICAgIHZhciB0aW1lID0gbm93KCksXG4gICAgICAgIGlzSW52b2tpbmcgPSBzaG91bGRJbnZva2UodGltZSk7XG5cbiAgICBsYXN0QXJncyA9IGFyZ3VtZW50cztcbiAgICBsYXN0VGhpcyA9IHRoaXM7XG4gICAgbGFzdENhbGxUaW1lID0gdGltZTtcblxuICAgIGlmIChpc0ludm9raW5nKSB7XG4gICAgICBpZiAodGltZXJJZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBsZWFkaW5nRWRnZShsYXN0Q2FsbFRpbWUpO1xuICAgICAgfVxuICAgICAgaWYgKG1heGluZykge1xuICAgICAgICAvLyBIYW5kbGUgaW52b2NhdGlvbnMgaW4gYSB0aWdodCBsb29wLlxuICAgICAgICB0aW1lcklkID0gc2V0VGltZW91dCh0aW1lckV4cGlyZWQsIHdhaXQpO1xuICAgICAgICByZXR1cm4gaW52b2tlRnVuYyhsYXN0Q2FsbFRpbWUpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGltZXJJZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aW1lcklkID0gc2V0VGltZW91dCh0aW1lckV4cGlyZWQsIHdhaXQpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIGRlYm91bmNlZC5jYW5jZWwgPSBjYW5jZWw7XG4gIGRlYm91bmNlZC5mbHVzaCA9IGZsdXNoO1xuICByZXR1cm4gZGVib3VuY2VkO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRlYm91bmNlO1xuIiwidmFyIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi9pc09iamVjdCcpO1xuXG4vKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG52YXIgZnVuY1RhZyA9ICdbb2JqZWN0IEZ1bmN0aW9uXScsXG4gICAgZ2VuVGFnID0gJ1tvYmplY3QgR2VuZXJhdG9yRnVuY3Rpb25dJztcblxuLyoqIFVzZWQgZm9yIGJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqXG4gKiBVc2VkIHRvIHJlc29sdmUgdGhlXG4gKiBbYHRvU3RyaW5nVGFnYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtb2JqZWN0LnByb3RvdHlwZS50b3N0cmluZylcbiAqIG9mIHZhbHVlcy5cbiAqL1xudmFyIG9iamVjdFRvU3RyaW5nID0gb2JqZWN0UHJvdG8udG9TdHJpbmc7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgY2xhc3NpZmllZCBhcyBhIGBGdW5jdGlvbmAgb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMC4xLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGNvcnJlY3RseSBjbGFzc2lmaWVkLFxuICogIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0Z1bmN0aW9uKF8pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNGdW5jdGlvbigvYWJjLyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKHZhbHVlKSB7XG4gIC8vIFRoZSB1c2Ugb2YgYE9iamVjdCN0b1N0cmluZ2AgYXZvaWRzIGlzc3VlcyB3aXRoIHRoZSBgdHlwZW9mYCBvcGVyYXRvclxuICAvLyBpbiBTYWZhcmkgOCB3aGljaCByZXR1cm5zICdvYmplY3QnIGZvciB0eXBlZCBhcnJheSBhbmQgd2VhayBtYXAgY29uc3RydWN0b3JzLFxuICAvLyBhbmQgUGhhbnRvbUpTIDEuOSB3aGljaCByZXR1cm5zICdmdW5jdGlvbicgZm9yIGBOb2RlTGlzdGAgaW5zdGFuY2VzLlxuICB2YXIgdGFnID0gaXNPYmplY3QodmFsdWUpID8gb2JqZWN0VG9TdHJpbmcuY2FsbCh2YWx1ZSkgOiAnJztcbiAgcmV0dXJuIHRhZyA9PSBmdW5jVGFnIHx8IHRhZyA9PSBnZW5UYWc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNGdW5jdGlvbjtcbiIsIi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgdGhlXG4gKiBbbGFuZ3VhZ2UgdHlwZV0oaHR0cDovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLWVjbWFzY3JpcHQtbGFuZ3VhZ2UtdHlwZXMpXG4gKiBvZiBgT2JqZWN0YC4gKGUuZy4gYXJyYXlzLCBmdW5jdGlvbnMsIG9iamVjdHMsIHJlZ2V4ZXMsIGBuZXcgTnVtYmVyKDApYCwgYW5kIGBuZXcgU3RyaW5nKCcnKWApXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAwLjEuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYW4gb2JqZWN0LCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNPYmplY3Qoe30pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KF8ubm9vcCk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChudWxsKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlKSB7XG4gIHZhciB0eXBlID0gdHlwZW9mIHZhbHVlO1xuICByZXR1cm4gISF2YWx1ZSAmJiAodHlwZSA9PSAnb2JqZWN0JyB8fCB0eXBlID09ICdmdW5jdGlvbicpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzT2JqZWN0O1xuIiwiLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBvYmplY3QtbGlrZS4gQSB2YWx1ZSBpcyBvYmplY3QtbGlrZSBpZiBpdCdzIG5vdCBgbnVsbGBcbiAqIGFuZCBoYXMgYSBgdHlwZW9mYCByZXN1bHQgb2YgXCJvYmplY3RcIi5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBvYmplY3QtbGlrZSwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZSh7fSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdExpa2UoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZShfLm5vb3ApO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZShudWxsKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0TGlrZSh2YWx1ZSkge1xuICByZXR1cm4gISF2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNPYmplY3RMaWtlO1xuIiwidmFyIGlzT2JqZWN0TGlrZSA9IHJlcXVpcmUoJy4vaXNPYmplY3RMaWtlJyk7XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBzeW1ib2xUYWcgPSAnW29iamVjdCBTeW1ib2xdJztcblxuLyoqIFVzZWQgZm9yIGJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqXG4gKiBVc2VkIHRvIHJlc29sdmUgdGhlXG4gKiBbYHRvU3RyaW5nVGFnYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtb2JqZWN0LnByb3RvdHlwZS50b3N0cmluZylcbiAqIG9mIHZhbHVlcy5cbiAqL1xudmFyIG9iamVjdFRvU3RyaW5nID0gb2JqZWN0UHJvdG8udG9TdHJpbmc7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgY2xhc3NpZmllZCBhcyBhIGBTeW1ib2xgIHByaW1pdGl2ZSBvciBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSA0LjAuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgY29ycmVjdGx5IGNsYXNzaWZpZWQsXG4gKiAgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzU3ltYm9sKFN5bWJvbC5pdGVyYXRvcik7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc1N5bWJvbCgnYWJjJyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc1N5bWJvbCh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09ICdzeW1ib2wnIHx8XG4gICAgKGlzT2JqZWN0TGlrZSh2YWx1ZSkgJiYgb2JqZWN0VG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT0gc3ltYm9sVGFnKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc1N5bWJvbDtcbiIsIi8qKlxuICogR2V0cyB0aGUgdGltZXN0YW1wIG9mIHRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRoYXQgaGF2ZSBlbGFwc2VkIHNpbmNlXG4gKiB0aGUgVW5peCBlcG9jaCAoMSBKYW51YXJ5IDE5NzAgMDA6MDA6MDAgVVRDKS5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDIuNC4wXG4gKiBAY2F0ZWdvcnkgRGF0ZVxuICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgdGltZXN0YW1wLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmRlZmVyKGZ1bmN0aW9uKHN0YW1wKSB7XG4gKiAgIGNvbnNvbGUubG9nKF8ubm93KCkgLSBzdGFtcCk7XG4gKiB9LCBfLm5vdygpKTtcbiAqIC8vID0+IExvZ3MgdGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgaXQgdG9vayBmb3IgdGhlIGRlZmVycmVkIGludm9jYXRpb24uXG4gKi9cbmZ1bmN0aW9uIG5vdygpIHtcbiAgcmV0dXJuIERhdGUubm93KCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gbm93O1xuIiwidmFyIGlzRnVuY3Rpb24gPSByZXF1aXJlKCcuL2lzRnVuY3Rpb24nKSxcbiAgICBpc09iamVjdCA9IHJlcXVpcmUoJy4vaXNPYmplY3QnKSxcbiAgICBpc1N5bWJvbCA9IHJlcXVpcmUoJy4vaXNTeW1ib2wnKTtcblxuLyoqIFVzZWQgYXMgcmVmZXJlbmNlcyBmb3IgdmFyaW91cyBgTnVtYmVyYCBjb25zdGFudHMuICovXG52YXIgTkFOID0gMCAvIDA7XG5cbi8qKiBVc2VkIHRvIG1hdGNoIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHdoaXRlc3BhY2UuICovXG52YXIgcmVUcmltID0gL15cXHMrfFxccyskL2c7XG5cbi8qKiBVc2VkIHRvIGRldGVjdCBiYWQgc2lnbmVkIGhleGFkZWNpbWFsIHN0cmluZyB2YWx1ZXMuICovXG52YXIgcmVJc0JhZEhleCA9IC9eWy0rXTB4WzAtOWEtZl0rJC9pO1xuXG4vKiogVXNlZCB0byBkZXRlY3QgYmluYXJ5IHN0cmluZyB2YWx1ZXMuICovXG52YXIgcmVJc0JpbmFyeSA9IC9eMGJbMDFdKyQvaTtcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IG9jdGFsIHN0cmluZyB2YWx1ZXMuICovXG52YXIgcmVJc09jdGFsID0gL14wb1swLTddKyQvaTtcblxuLyoqIEJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzIHdpdGhvdXQgYSBkZXBlbmRlbmN5IG9uIGByb290YC4gKi9cbnZhciBmcmVlUGFyc2VJbnQgPSBwYXJzZUludDtcblxuLyoqXG4gKiBDb252ZXJ0cyBgdmFsdWVgIHRvIGEgbnVtYmVyLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgNC4wLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBwcm9jZXNzLlxuICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgbnVtYmVyLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLnRvTnVtYmVyKDMuMik7XG4gKiAvLyA9PiAzLjJcbiAqXG4gKiBfLnRvTnVtYmVyKE51bWJlci5NSU5fVkFMVUUpO1xuICogLy8gPT4gNWUtMzI0XG4gKlxuICogXy50b051bWJlcihJbmZpbml0eSk7XG4gKiAvLyA9PiBJbmZpbml0eVxuICpcbiAqIF8udG9OdW1iZXIoJzMuMicpO1xuICogLy8gPT4gMy4yXG4gKi9cbmZ1bmN0aW9uIHRvTnVtYmVyKHZhbHVlKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT0gJ251bWJlcicpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbiAgaWYgKGlzU3ltYm9sKHZhbHVlKSkge1xuICAgIHJldHVybiBOQU47XG4gIH1cbiAgaWYgKGlzT2JqZWN0KHZhbHVlKSkge1xuICAgIHZhciBvdGhlciA9IGlzRnVuY3Rpb24odmFsdWUudmFsdWVPZikgPyB2YWx1ZS52YWx1ZU9mKCkgOiB2YWx1ZTtcbiAgICB2YWx1ZSA9IGlzT2JqZWN0KG90aGVyKSA/IChvdGhlciArICcnKSA6IG90aGVyO1xuICB9XG4gIGlmICh0eXBlb2YgdmFsdWUgIT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gdmFsdWUgPT09IDAgPyB2YWx1ZSA6ICt2YWx1ZTtcbiAgfVxuICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UocmVUcmltLCAnJyk7XG4gIHZhciBpc0JpbmFyeSA9IHJlSXNCaW5hcnkudGVzdCh2YWx1ZSk7XG4gIHJldHVybiAoaXNCaW5hcnkgfHwgcmVJc09jdGFsLnRlc3QodmFsdWUpKVxuICAgID8gZnJlZVBhcnNlSW50KHZhbHVlLnNsaWNlKDIpLCBpc0JpbmFyeSA/IDIgOiA4KVxuICAgIDogKHJlSXNCYWRIZXgudGVzdCh2YWx1ZSkgPyBOQU4gOiArdmFsdWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRvTnVtYmVyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZXhwYW5kbyA9ICdzZWt0b3ItJyArIERhdGUubm93KCk7XG52YXIgcnNpYmxpbmdzID0gL1srfl0vO1xudmFyIGRvY3VtZW50ID0gZ2xvYmFsLmRvY3VtZW50O1xudmFyIGRlbCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCB8fCB7fTtcbnZhciBtYXRjaCA9IChcbiAgZGVsLm1hdGNoZXMgfHxcbiAgZGVsLndlYmtpdE1hdGNoZXNTZWxlY3RvciB8fFxuICBkZWwubW96TWF0Y2hlc1NlbGVjdG9yIHx8XG4gIGRlbC5vTWF0Y2hlc1NlbGVjdG9yIHx8XG4gIGRlbC5tc01hdGNoZXNTZWxlY3RvciB8fFxuICBuZXZlclxuKTtcblxubW9kdWxlLmV4cG9ydHMgPSBzZWt0b3I7XG5cbnNla3Rvci5tYXRjaGVzID0gbWF0Y2hlcztcbnNla3Rvci5tYXRjaGVzU2VsZWN0b3IgPSBtYXRjaGVzU2VsZWN0b3I7XG5cbmZ1bmN0aW9uIHFzYSAoc2VsZWN0b3IsIGNvbnRleHQpIHtcbiAgdmFyIGV4aXN0ZWQsIGlkLCBwcmVmaXgsIHByZWZpeGVkLCBhZGFwdGVyLCBoYWNrID0gY29udGV4dCAhPT0gZG9jdW1lbnQ7XG4gIGlmIChoYWNrKSB7IC8vIGlkIGhhY2sgZm9yIGNvbnRleHQtcm9vdGVkIHF1ZXJpZXNcbiAgICBleGlzdGVkID0gY29udGV4dC5nZXRBdHRyaWJ1dGUoJ2lkJyk7XG4gICAgaWQgPSBleGlzdGVkIHx8IGV4cGFuZG87XG4gICAgcHJlZml4ID0gJyMnICsgaWQgKyAnICc7XG4gICAgcHJlZml4ZWQgPSBwcmVmaXggKyBzZWxlY3Rvci5yZXBsYWNlKC8sL2csICcsJyArIHByZWZpeCk7XG4gICAgYWRhcHRlciA9IHJzaWJsaW5ncy50ZXN0KHNlbGVjdG9yKSAmJiBjb250ZXh0LnBhcmVudE5vZGU7XG4gICAgaWYgKCFleGlzdGVkKSB7IGNvbnRleHQuc2V0QXR0cmlidXRlKCdpZCcsIGlkKTsgfVxuICB9XG4gIHRyeSB7XG4gICAgcmV0dXJuIChhZGFwdGVyIHx8IGNvbnRleHQpLnF1ZXJ5U2VsZWN0b3JBbGwocHJlZml4ZWQgfHwgc2VsZWN0b3IpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9IGZpbmFsbHkge1xuICAgIGlmIChleGlzdGVkID09PSBudWxsKSB7IGNvbnRleHQucmVtb3ZlQXR0cmlidXRlKCdpZCcpOyB9XG4gIH1cbn1cblxuZnVuY3Rpb24gc2VrdG9yIChzZWxlY3RvciwgY3R4LCBjb2xsZWN0aW9uLCBzZWVkKSB7XG4gIHZhciBlbGVtZW50O1xuICB2YXIgY29udGV4dCA9IGN0eCB8fCBkb2N1bWVudDtcbiAgdmFyIHJlc3VsdHMgPSBjb2xsZWN0aW9uIHx8IFtdO1xuICB2YXIgaSA9IDA7XG4gIGlmICh0eXBlb2Ygc2VsZWN0b3IgIT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH1cbiAgaWYgKGNvbnRleHQubm9kZVR5cGUgIT09IDEgJiYgY29udGV4dC5ub2RlVHlwZSAhPT0gOSkge1xuICAgIHJldHVybiBbXTsgLy8gYmFpbCBpZiBjb250ZXh0IGlzIG5vdCBhbiBlbGVtZW50IG9yIGRvY3VtZW50XG4gIH1cbiAgaWYgKHNlZWQpIHtcbiAgICB3aGlsZSAoKGVsZW1lbnQgPSBzZWVkW2krK10pKSB7XG4gICAgICBpZiAobWF0Y2hlc1NlbGVjdG9yKGVsZW1lbnQsIHNlbGVjdG9yKSkge1xuICAgICAgICByZXN1bHRzLnB1c2goZWxlbWVudCk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHJlc3VsdHMucHVzaC5hcHBseShyZXN1bHRzLCBxc2Eoc2VsZWN0b3IsIGNvbnRleHQpKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0cztcbn1cblxuZnVuY3Rpb24gbWF0Y2hlcyAoc2VsZWN0b3IsIGVsZW1lbnRzKSB7XG4gIHJldHVybiBzZWt0b3Ioc2VsZWN0b3IsIG51bGwsIG51bGwsIGVsZW1lbnRzKTtcbn1cblxuZnVuY3Rpb24gbWF0Y2hlc1NlbGVjdG9yIChlbGVtZW50LCBzZWxlY3Rvcikge1xuICByZXR1cm4gbWF0Y2guY2FsbChlbGVtZW50LCBzZWxlY3Rvcik7XG59XG5cbmZ1bmN0aW9uIG5ldmVyICgpIHsgcmV0dXJuIGZhbHNlOyB9XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBnZXRTZWxlY3Rpb247XG52YXIgZG9jID0gZ2xvYmFsLmRvY3VtZW50O1xudmFyIGdldFNlbGVjdGlvblJhdyA9IHJlcXVpcmUoJy4vZ2V0U2VsZWN0aW9uUmF3Jyk7XG52YXIgZ2V0U2VsZWN0aW9uTnVsbE9wID0gcmVxdWlyZSgnLi9nZXRTZWxlY3Rpb25OdWxsT3AnKTtcbnZhciBnZXRTZWxlY3Rpb25TeW50aGV0aWMgPSByZXF1aXJlKCcuL2dldFNlbGVjdGlvblN5bnRoZXRpYycpO1xudmFyIGlzSG9zdCA9IHJlcXVpcmUoJy4vaXNIb3N0Jyk7XG5pZiAoaXNIb3N0Lm1ldGhvZChnbG9iYWwsICdnZXRTZWxlY3Rpb24nKSkge1xuICBnZXRTZWxlY3Rpb24gPSBnZXRTZWxlY3Rpb25SYXc7XG59IGVsc2UgaWYgKHR5cGVvZiBkb2Muc2VsZWN0aW9uID09PSAnb2JqZWN0JyAmJiBkb2Muc2VsZWN0aW9uKSB7XG4gIGdldFNlbGVjdGlvbiA9IGdldFNlbGVjdGlvblN5bnRoZXRpYztcbn0gZWxzZSB7XG4gIGdldFNlbGVjdGlvbiA9IGdldFNlbGVjdGlvbk51bGxPcDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBnZXRTZWxlY3Rpb247XG4iLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIG5vb3AgKCkge31cblxuZnVuY3Rpb24gZ2V0U2VsZWN0aW9uTnVsbE9wICgpIHtcbiAgcmV0dXJuIHtcbiAgICByZW1vdmVBbGxSYW5nZXM6IG5vb3AsXG4gICAgYWRkUmFuZ2U6IG5vb3BcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBnZXRTZWxlY3Rpb25OdWxsT3A7XG4iLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIGdldFNlbGVjdGlvblJhdyAoKSB7XG4gIHJldHVybiBnbG9iYWwuZ2V0U2VsZWN0aW9uKCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZ2V0U2VsZWN0aW9uUmF3O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgcmFuZ2VUb1RleHRSYW5nZSA9IHJlcXVpcmUoJy4vcmFuZ2VUb1RleHRSYW5nZScpO1xudmFyIGRvYyA9IGdsb2JhbC5kb2N1bWVudDtcbnZhciBib2R5ID0gZG9jLmJvZHk7XG52YXIgR2V0U2VsZWN0aW9uUHJvdG8gPSBHZXRTZWxlY3Rpb24ucHJvdG90eXBlO1xuXG5mdW5jdGlvbiBHZXRTZWxlY3Rpb24gKHNlbGVjdGlvbikge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHZhciByYW5nZSA9IHNlbGVjdGlvbi5jcmVhdGVSYW5nZSgpO1xuXG4gIHRoaXMuX3NlbGVjdGlvbiA9IHNlbGVjdGlvbjtcbiAgdGhpcy5fcmFuZ2VzID0gW107XG5cbiAgaWYgKHNlbGVjdGlvbi50eXBlID09PSAnQ29udHJvbCcpIHtcbiAgICB1cGRhdGVDb250cm9sU2VsZWN0aW9uKHNlbGYpO1xuICB9IGVsc2UgaWYgKGlzVGV4dFJhbmdlKHJhbmdlKSkge1xuICAgIHVwZGF0ZUZyb21UZXh0UmFuZ2Uoc2VsZiwgcmFuZ2UpO1xuICB9IGVsc2Uge1xuICAgIHVwZGF0ZUVtcHR5U2VsZWN0aW9uKHNlbGYpO1xuICB9XG59XG5cbkdldFNlbGVjdGlvblByb3RvLnJlbW92ZUFsbFJhbmdlcyA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHRleHRSYW5nZTtcbiAgdHJ5IHtcbiAgICB0aGlzLl9zZWxlY3Rpb24uZW1wdHkoKTtcbiAgICBpZiAodGhpcy5fc2VsZWN0aW9uLnR5cGUgIT09ICdOb25lJykge1xuICAgICAgdGV4dFJhbmdlID0gYm9keS5jcmVhdGVUZXh0UmFuZ2UoKTtcbiAgICAgIHRleHRSYW5nZS5zZWxlY3QoKTtcbiAgICAgIHRoaXMuX3NlbGVjdGlvbi5lbXB0eSgpO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICB9XG4gIHVwZGF0ZUVtcHR5U2VsZWN0aW9uKHRoaXMpO1xufTtcblxuR2V0U2VsZWN0aW9uUHJvdG8uYWRkUmFuZ2UgPSBmdW5jdGlvbiAocmFuZ2UpIHtcbiAgaWYgKHRoaXMuX3NlbGVjdGlvbi50eXBlID09PSAnQ29udHJvbCcpIHtcbiAgICBhZGRSYW5nZVRvQ29udHJvbFNlbGVjdGlvbih0aGlzLCByYW5nZSk7XG4gIH0gZWxzZSB7XG4gICAgcmFuZ2VUb1RleHRSYW5nZShyYW5nZSkuc2VsZWN0KCk7XG4gICAgdGhpcy5fcmFuZ2VzWzBdID0gcmFuZ2U7XG4gICAgdGhpcy5yYW5nZUNvdW50ID0gMTtcbiAgICB0aGlzLmlzQ29sbGFwc2VkID0gdGhpcy5fcmFuZ2VzWzBdLmNvbGxhcHNlZDtcbiAgICB1cGRhdGVBbmNob3JBbmRGb2N1c0Zyb21SYW5nZSh0aGlzLCByYW5nZSwgZmFsc2UpO1xuICB9XG59O1xuXG5HZXRTZWxlY3Rpb25Qcm90by5zZXRSYW5nZXMgPSBmdW5jdGlvbiAocmFuZ2VzKSB7XG4gIHRoaXMucmVtb3ZlQWxsUmFuZ2VzKCk7XG4gIHZhciByYW5nZUNvdW50ID0gcmFuZ2VzLmxlbmd0aDtcbiAgaWYgKHJhbmdlQ291bnQgPiAxKSB7XG4gICAgY3JlYXRlQ29udHJvbFNlbGVjdGlvbih0aGlzLCByYW5nZXMpO1xuICB9IGVsc2UgaWYgKHJhbmdlQ291bnQpIHtcbiAgICB0aGlzLmFkZFJhbmdlKHJhbmdlc1swXSk7XG4gIH1cbn07XG5cbkdldFNlbGVjdGlvblByb3RvLmdldFJhbmdlQXQgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgaWYgKGluZGV4IDwgMCB8fCBpbmRleCA+PSB0aGlzLnJhbmdlQ291bnQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2dldFJhbmdlQXQoKTogaW5kZXggb3V0IG9mIGJvdW5kcycpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB0aGlzLl9yYW5nZXNbaW5kZXhdLmNsb25lUmFuZ2UoKTtcbiAgfVxufTtcblxuR2V0U2VsZWN0aW9uUHJvdG8ucmVtb3ZlUmFuZ2UgPSBmdW5jdGlvbiAocmFuZ2UpIHtcbiAgaWYgKHRoaXMuX3NlbGVjdGlvbi50eXBlICE9PSAnQ29udHJvbCcpIHtcbiAgICByZW1vdmVSYW5nZU1hbnVhbGx5KHRoaXMsIHJhbmdlKTtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIGNvbnRyb2xSYW5nZSA9IHRoaXMuX3NlbGVjdGlvbi5jcmVhdGVSYW5nZSgpO1xuICB2YXIgcmFuZ2VFbGVtZW50ID0gZ2V0U2luZ2xlRWxlbWVudEZyb21SYW5nZShyYW5nZSk7XG4gIHZhciBuZXdDb250cm9sUmFuZ2UgPSBib2R5LmNyZWF0ZUNvbnRyb2xSYW5nZSgpO1xuICB2YXIgZWw7XG4gIHZhciByZW1vdmVkID0gZmFsc2U7XG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBjb250cm9sUmFuZ2UubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBlbCA9IGNvbnRyb2xSYW5nZS5pdGVtKGkpO1xuICAgIGlmIChlbCAhPT0gcmFuZ2VFbGVtZW50IHx8IHJlbW92ZWQpIHtcbiAgICAgIG5ld0NvbnRyb2xSYW5nZS5hZGQoY29udHJvbFJhbmdlLml0ZW0oaSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZW1vdmVkID0gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgbmV3Q29udHJvbFJhbmdlLnNlbGVjdCgpO1xuICB1cGRhdGVDb250cm9sU2VsZWN0aW9uKHRoaXMpO1xufTtcblxuR2V0U2VsZWN0aW9uUHJvdG8uZWFjaFJhbmdlID0gZnVuY3Rpb24gKGZuLCByZXR1cm5WYWx1ZSkge1xuICB2YXIgaSA9IDA7XG4gIHZhciBsZW4gPSB0aGlzLl9yYW5nZXMubGVuZ3RoO1xuICBmb3IgKGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAoZm4odGhpcy5nZXRSYW5nZUF0KGkpKSkge1xuICAgICAgcmV0dXJuIHJldHVyblZhbHVlO1xuICAgIH1cbiAgfVxufTtcblxuR2V0U2VsZWN0aW9uUHJvdG8uZ2V0QWxsUmFuZ2VzID0gZnVuY3Rpb24gKCkge1xuICB2YXIgcmFuZ2VzID0gW107XG4gIHRoaXMuZWFjaFJhbmdlKGZ1bmN0aW9uIChyYW5nZSkge1xuICAgIHJhbmdlcy5wdXNoKHJhbmdlKTtcbiAgfSk7XG4gIHJldHVybiByYW5nZXM7XG59O1xuXG5HZXRTZWxlY3Rpb25Qcm90by5zZXRTaW5nbGVSYW5nZSA9IGZ1bmN0aW9uIChyYW5nZSkge1xuICB0aGlzLnJlbW92ZUFsbFJhbmdlcygpO1xuICB0aGlzLmFkZFJhbmdlKHJhbmdlKTtcbn07XG5cbmZ1bmN0aW9uIGNyZWF0ZUNvbnRyb2xTZWxlY3Rpb24gKHNlbCwgcmFuZ2VzKSB7XG4gIHZhciBjb250cm9sUmFuZ2UgPSBib2R5LmNyZWF0ZUNvbnRyb2xSYW5nZSgpO1xuICBmb3IgKHZhciBpID0gMCwgZWwsIGxlbiA9IHJhbmdlcy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIGVsID0gZ2V0U2luZ2xlRWxlbWVudEZyb21SYW5nZShyYW5nZXNbaV0pO1xuICAgIHRyeSB7XG4gICAgICBjb250cm9sUmFuZ2UuYWRkKGVsKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFJhbmdlcygpOiBFbGVtZW50IGNvdWxkIG5vdCBiZSBhZGRlZCB0byBjb250cm9sIHNlbGVjdGlvbicpO1xuICAgIH1cbiAgfVxuICBjb250cm9sUmFuZ2Uuc2VsZWN0KCk7XG4gIHVwZGF0ZUNvbnRyb2xTZWxlY3Rpb24oc2VsKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlUmFuZ2VNYW51YWxseSAoc2VsLCByYW5nZSkge1xuICB2YXIgcmFuZ2VzID0gc2VsLmdldEFsbFJhbmdlcygpO1xuICBzZWwucmVtb3ZlQWxsUmFuZ2VzKCk7XG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSByYW5nZXMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAoIWlzU2FtZVJhbmdlKHJhbmdlLCByYW5nZXNbaV0pKSB7XG4gICAgICBzZWwuYWRkUmFuZ2UocmFuZ2VzW2ldKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFzZWwucmFuZ2VDb3VudCkge1xuICAgIHVwZGF0ZUVtcHR5U2VsZWN0aW9uKHNlbCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdXBkYXRlQW5jaG9yQW5kRm9jdXNGcm9tUmFuZ2UgKHNlbCwgcmFuZ2UpIHtcbiAgdmFyIGFuY2hvclByZWZpeCA9ICdzdGFydCc7XG4gIHZhciBmb2N1c1ByZWZpeCA9ICdlbmQnO1xuICBzZWwuYW5jaG9yTm9kZSA9IHJhbmdlW2FuY2hvclByZWZpeCArICdDb250YWluZXInXTtcbiAgc2VsLmFuY2hvck9mZnNldCA9IHJhbmdlW2FuY2hvclByZWZpeCArICdPZmZzZXQnXTtcbiAgc2VsLmZvY3VzTm9kZSA9IHJhbmdlW2ZvY3VzUHJlZml4ICsgJ0NvbnRhaW5lciddO1xuICBzZWwuZm9jdXNPZmZzZXQgPSByYW5nZVtmb2N1c1ByZWZpeCArICdPZmZzZXQnXTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlRW1wdHlTZWxlY3Rpb24gKHNlbCkge1xuICBzZWwuYW5jaG9yTm9kZSA9IHNlbC5mb2N1c05vZGUgPSBudWxsO1xuICBzZWwuYW5jaG9yT2Zmc2V0ID0gc2VsLmZvY3VzT2Zmc2V0ID0gMDtcbiAgc2VsLnJhbmdlQ291bnQgPSAwO1xuICBzZWwuaXNDb2xsYXBzZWQgPSB0cnVlO1xuICBzZWwuX3Jhbmdlcy5sZW5ndGggPSAwO1xufVxuXG5mdW5jdGlvbiByYW5nZUNvbnRhaW5zU2luZ2xlRWxlbWVudCAocmFuZ2VOb2Rlcykge1xuICBpZiAoIXJhbmdlTm9kZXMubGVuZ3RoIHx8IHJhbmdlTm9kZXNbMF0ubm9kZVR5cGUgIT09IDEpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgZm9yICh2YXIgaSA9IDEsIGxlbiA9IHJhbmdlTm9kZXMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAoIWlzQW5jZXN0b3JPZihyYW5nZU5vZGVzWzBdLCByYW5nZU5vZGVzW2ldKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gZ2V0U2luZ2xlRWxlbWVudEZyb21SYW5nZSAocmFuZ2UpIHtcbiAgdmFyIG5vZGVzID0gcmFuZ2UuZ2V0Tm9kZXMoKTtcbiAgaWYgKCFyYW5nZUNvbnRhaW5zU2luZ2xlRWxlbWVudChub2RlcykpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2dldFNpbmdsZUVsZW1lbnRGcm9tUmFuZ2UoKTogcmFuZ2UgZGlkIG5vdCBjb25zaXN0IG9mIGEgc2luZ2xlIGVsZW1lbnQnKTtcbiAgfVxuICByZXR1cm4gbm9kZXNbMF07XG59XG5cbmZ1bmN0aW9uIGlzVGV4dFJhbmdlIChyYW5nZSkge1xuICByZXR1cm4gcmFuZ2UgJiYgcmFuZ2UudGV4dCAhPT0gdm9pZCAwO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVGcm9tVGV4dFJhbmdlIChzZWwsIHJhbmdlKSB7XG4gIHNlbC5fcmFuZ2VzID0gW3JhbmdlXTtcbiAgdXBkYXRlQW5jaG9yQW5kRm9jdXNGcm9tUmFuZ2Uoc2VsLCByYW5nZSwgZmFsc2UpO1xuICBzZWwucmFuZ2VDb3VudCA9IDE7XG4gIHNlbC5pc0NvbGxhcHNlZCA9IHJhbmdlLmNvbGxhcHNlZDtcbn1cblxuZnVuY3Rpb24gdXBkYXRlQ29udHJvbFNlbGVjdGlvbiAoc2VsKSB7XG4gIHNlbC5fcmFuZ2VzLmxlbmd0aCA9IDA7XG4gIGlmIChzZWwuX3NlbGVjdGlvbi50eXBlID09PSAnTm9uZScpIHtcbiAgICB1cGRhdGVFbXB0eVNlbGVjdGlvbihzZWwpO1xuICB9IGVsc2Uge1xuICAgIHZhciBjb250cm9sUmFuZ2UgPSBzZWwuX3NlbGVjdGlvbi5jcmVhdGVSYW5nZSgpO1xuICAgIGlmIChpc1RleHRSYW5nZShjb250cm9sUmFuZ2UpKSB7XG4gICAgICB1cGRhdGVGcm9tVGV4dFJhbmdlKHNlbCwgY29udHJvbFJhbmdlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2VsLnJhbmdlQ291bnQgPSBjb250cm9sUmFuZ2UubGVuZ3RoO1xuICAgICAgdmFyIHJhbmdlO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzZWwucmFuZ2VDb3VudDsgKytpKSB7XG4gICAgICAgIHJhbmdlID0gZG9jLmNyZWF0ZVJhbmdlKCk7XG4gICAgICAgIHJhbmdlLnNlbGVjdE5vZGUoY29udHJvbFJhbmdlLml0ZW0oaSkpO1xuICAgICAgICBzZWwuX3Jhbmdlcy5wdXNoKHJhbmdlKTtcbiAgICAgIH1cbiAgICAgIHNlbC5pc0NvbGxhcHNlZCA9IHNlbC5yYW5nZUNvdW50ID09PSAxICYmIHNlbC5fcmFuZ2VzWzBdLmNvbGxhcHNlZDtcbiAgICAgIHVwZGF0ZUFuY2hvckFuZEZvY3VzRnJvbVJhbmdlKHNlbCwgc2VsLl9yYW5nZXNbc2VsLnJhbmdlQ291bnQgLSAxXSwgZmFsc2UpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBhZGRSYW5nZVRvQ29udHJvbFNlbGVjdGlvbiAoc2VsLCByYW5nZSkge1xuICB2YXIgY29udHJvbFJhbmdlID0gc2VsLl9zZWxlY3Rpb24uY3JlYXRlUmFuZ2UoKTtcbiAgdmFyIHJhbmdlRWxlbWVudCA9IGdldFNpbmdsZUVsZW1lbnRGcm9tUmFuZ2UocmFuZ2UpO1xuICB2YXIgbmV3Q29udHJvbFJhbmdlID0gYm9keS5jcmVhdGVDb250cm9sUmFuZ2UoKTtcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGNvbnRyb2xSYW5nZS5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIG5ld0NvbnRyb2xSYW5nZS5hZGQoY29udHJvbFJhbmdlLml0ZW0oaSkpO1xuICB9XG4gIHRyeSB7XG4gICAgbmV3Q29udHJvbFJhbmdlLmFkZChyYW5nZUVsZW1lbnQpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdhZGRSYW5nZSgpOiBFbGVtZW50IGNvdWxkIG5vdCBiZSBhZGRlZCB0byBjb250cm9sIHNlbGVjdGlvbicpO1xuICB9XG4gIG5ld0NvbnRyb2xSYW5nZS5zZWxlY3QoKTtcbiAgdXBkYXRlQ29udHJvbFNlbGVjdGlvbihzZWwpO1xufVxuXG5mdW5jdGlvbiBpc1NhbWVSYW5nZSAobGVmdCwgcmlnaHQpIHtcbiAgcmV0dXJuIChcbiAgICBsZWZ0LnN0YXJ0Q29udGFpbmVyID09PSByaWdodC5zdGFydENvbnRhaW5lciAmJlxuICAgIGxlZnQuc3RhcnRPZmZzZXQgPT09IHJpZ2h0LnN0YXJ0T2Zmc2V0ICYmXG4gICAgbGVmdC5lbmRDb250YWluZXIgPT09IHJpZ2h0LmVuZENvbnRhaW5lciAmJlxuICAgIGxlZnQuZW5kT2Zmc2V0ID09PSByaWdodC5lbmRPZmZzZXRcbiAgKTtcbn1cblxuZnVuY3Rpb24gaXNBbmNlc3Rvck9mIChhbmNlc3RvciwgZGVzY2VuZGFudCkge1xuICB2YXIgbm9kZSA9IGRlc2NlbmRhbnQ7XG4gIHdoaWxlIChub2RlLnBhcmVudE5vZGUpIHtcbiAgICBpZiAobm9kZS5wYXJlbnROb2RlID09PSBhbmNlc3Rvcikge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBnZXRTZWxlY3Rpb24gKCkge1xuICByZXR1cm4gbmV3IEdldFNlbGVjdGlvbihnbG9iYWwuZG9jdW1lbnQuc2VsZWN0aW9uKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBnZXRTZWxlY3Rpb247XG4iLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIGlzSG9zdE1ldGhvZCAoaG9zdCwgcHJvcCkge1xuICB2YXIgdHlwZSA9IHR5cGVvZiBob3N0W3Byb3BdO1xuICByZXR1cm4gdHlwZSA9PT0gJ2Z1bmN0aW9uJyB8fCAhISh0eXBlID09PSAnb2JqZWN0JyAmJiBob3N0W3Byb3BdKSB8fCB0eXBlID09PSAndW5rbm93bic7XG59XG5cbmZ1bmN0aW9uIGlzSG9zdFByb3BlcnR5IChob3N0LCBwcm9wKSB7XG4gIHJldHVybiB0eXBlb2YgaG9zdFtwcm9wXSAhPT0gJ3VuZGVmaW5lZCc7XG59XG5cbmZ1bmN0aW9uIG1hbnkgKGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiBhcmVIb3N0ZWQgKGhvc3QsIHByb3BzKSB7XG4gICAgdmFyIGkgPSBwcm9wcy5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgaWYgKCFmbihob3N0LCBwcm9wc1tpXSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG1ldGhvZDogaXNIb3N0TWV0aG9kLFxuICBtZXRob2RzOiBtYW55KGlzSG9zdE1ldGhvZCksXG4gIHByb3BlcnR5OiBpc0hvc3RQcm9wZXJ0eSxcbiAgcHJvcGVydGllczogbWFueShpc0hvc3RQcm9wZXJ0eSlcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBkb2MgPSBnbG9iYWwuZG9jdW1lbnQ7XG52YXIgYm9keSA9IGRvYy5ib2R5O1xuXG5mdW5jdGlvbiByYW5nZVRvVGV4dFJhbmdlIChwKSB7XG4gIGlmIChwLmNvbGxhcHNlZCkge1xuICAgIHJldHVybiBjcmVhdGVCb3VuZGFyeVRleHRSYW5nZSh7IG5vZGU6IHAuc3RhcnRDb250YWluZXIsIG9mZnNldDogcC5zdGFydE9mZnNldCB9LCB0cnVlKTtcbiAgfVxuICB2YXIgc3RhcnRSYW5nZSA9IGNyZWF0ZUJvdW5kYXJ5VGV4dFJhbmdlKHsgbm9kZTogcC5zdGFydENvbnRhaW5lciwgb2Zmc2V0OiBwLnN0YXJ0T2Zmc2V0IH0sIHRydWUpO1xuICB2YXIgZW5kUmFuZ2UgPSBjcmVhdGVCb3VuZGFyeVRleHRSYW5nZSh7IG5vZGU6IHAuZW5kQ29udGFpbmVyLCBvZmZzZXQ6IHAuZW5kT2Zmc2V0IH0sIGZhbHNlKTtcbiAgdmFyIHRleHRSYW5nZSA9IGJvZHkuY3JlYXRlVGV4dFJhbmdlKCk7XG4gIHRleHRSYW5nZS5zZXRFbmRQb2ludCgnU3RhcnRUb1N0YXJ0Jywgc3RhcnRSYW5nZSk7XG4gIHRleHRSYW5nZS5zZXRFbmRQb2ludCgnRW5kVG9FbmQnLCBlbmRSYW5nZSk7XG4gIHJldHVybiB0ZXh0UmFuZ2U7XG59XG5cbmZ1bmN0aW9uIGlzQ2hhcmFjdGVyRGF0YU5vZGUgKG5vZGUpIHtcbiAgdmFyIHQgPSBub2RlLm5vZGVUeXBlO1xuICByZXR1cm4gdCA9PT0gMyB8fCB0ID09PSA0IHx8IHQgPT09IDggO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVCb3VuZGFyeVRleHRSYW5nZSAocCwgc3RhcnRpbmcpIHtcbiAgdmFyIGJvdW5kO1xuICB2YXIgcGFyZW50O1xuICB2YXIgb2Zmc2V0ID0gcC5vZmZzZXQ7XG4gIHZhciB3b3JraW5nTm9kZTtcbiAgdmFyIGNoaWxkTm9kZXM7XG4gIHZhciByYW5nZSA9IGJvZHkuY3JlYXRlVGV4dFJhbmdlKCk7XG4gIHZhciBkYXRhID0gaXNDaGFyYWN0ZXJEYXRhTm9kZShwLm5vZGUpO1xuXG4gIGlmIChkYXRhKSB7XG4gICAgYm91bmQgPSBwLm5vZGU7XG4gICAgcGFyZW50ID0gYm91bmQucGFyZW50Tm9kZTtcbiAgfSBlbHNlIHtcbiAgICBjaGlsZE5vZGVzID0gcC5ub2RlLmNoaWxkTm9kZXM7XG4gICAgYm91bmQgPSBvZmZzZXQgPCBjaGlsZE5vZGVzLmxlbmd0aCA/IGNoaWxkTm9kZXNbb2Zmc2V0XSA6IG51bGw7XG4gICAgcGFyZW50ID0gcC5ub2RlO1xuICB9XG5cbiAgd29ya2luZ05vZGUgPSBkb2MuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICB3b3JraW5nTm9kZS5pbm5lckhUTUwgPSAnJiNmZWZmOyc7XG5cbiAgaWYgKGJvdW5kKSB7XG4gICAgcGFyZW50Lmluc2VydEJlZm9yZSh3b3JraW5nTm9kZSwgYm91bmQpO1xuICB9IGVsc2Uge1xuICAgIHBhcmVudC5hcHBlbmRDaGlsZCh3b3JraW5nTm9kZSk7XG4gIH1cblxuICByYW5nZS5tb3ZlVG9FbGVtZW50VGV4dCh3b3JraW5nTm9kZSk7XG4gIHJhbmdlLmNvbGxhcHNlKCFzdGFydGluZyk7XG4gIHBhcmVudC5yZW1vdmVDaGlsZCh3b3JraW5nTm9kZSk7XG5cbiAgaWYgKGRhdGEpIHtcbiAgICByYW5nZVtzdGFydGluZyA/ICdtb3ZlU3RhcnQnIDogJ21vdmVFbmQnXSgnY2hhcmFjdGVyJywgb2Zmc2V0KTtcbiAgfVxuICByZXR1cm4gcmFuZ2U7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcmFuZ2VUb1RleHRSYW5nZTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGdldFNlbGVjdGlvbiA9IHJlcXVpcmUoJy4vZ2V0U2VsZWN0aW9uJyk7XG52YXIgc2V0U2VsZWN0aW9uID0gcmVxdWlyZSgnLi9zZXRTZWxlY3Rpb24nKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGdldDogZ2V0U2VsZWN0aW9uLFxuICBzZXQ6IHNldFNlbGVjdGlvblxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGdldFNlbGVjdGlvbiA9IHJlcXVpcmUoJy4vZ2V0U2VsZWN0aW9uJyk7XG52YXIgcmFuZ2VUb1RleHRSYW5nZSA9IHJlcXVpcmUoJy4vcmFuZ2VUb1RleHRSYW5nZScpO1xudmFyIGRvYyA9IGdsb2JhbC5kb2N1bWVudDtcblxuZnVuY3Rpb24gc2V0U2VsZWN0aW9uIChwKSB7XG4gIGlmIChkb2MuY3JlYXRlUmFuZ2UpIHtcbiAgICBtb2Rlcm5TZWxlY3Rpb24oKTtcbiAgfSBlbHNlIHtcbiAgICBvbGRTZWxlY3Rpb24oKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1vZGVyblNlbGVjdGlvbiAoKSB7XG4gICAgdmFyIHNlbCA9IGdldFNlbGVjdGlvbigpO1xuICAgIHZhciByYW5nZSA9IGRvYy5jcmVhdGVSYW5nZSgpO1xuICAgIGlmICghcC5zdGFydENvbnRhaW5lcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAocC5lbmRDb250YWluZXIpIHtcbiAgICAgIHJhbmdlLnNldEVuZChwLmVuZENvbnRhaW5lciwgcC5lbmRPZmZzZXQpO1xuICAgIH0gZWxzZSB7XG4gICAgICByYW5nZS5zZXRFbmQocC5zdGFydENvbnRhaW5lciwgcC5zdGFydE9mZnNldCk7XG4gICAgfVxuICAgIHJhbmdlLnNldFN0YXJ0KHAuc3RhcnRDb250YWluZXIsIHAuc3RhcnRPZmZzZXQpO1xuICAgIHNlbC5yZW1vdmVBbGxSYW5nZXMoKTtcbiAgICBzZWwuYWRkUmFuZ2UocmFuZ2UpO1xuICB9XG5cbiAgZnVuY3Rpb24gb2xkU2VsZWN0aW9uICgpIHtcbiAgICByYW5nZVRvVGV4dFJhbmdlKHApLnNlbGVjdCgpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc2V0U2VsZWN0aW9uO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZ2V0ID0gZWFzeUdldDtcbnZhciBzZXQgPSBlYXN5U2V0O1xuXG5pZiAoZG9jdW1lbnQuc2VsZWN0aW9uICYmIGRvY3VtZW50LnNlbGVjdGlvbi5jcmVhdGVSYW5nZSkge1xuICBnZXQgPSBoYXJkR2V0O1xuICBzZXQgPSBoYXJkU2V0O1xufVxuXG5mdW5jdGlvbiBlYXN5R2V0IChlbCkge1xuICByZXR1cm4ge1xuICAgIHN0YXJ0OiBlbC5zZWxlY3Rpb25TdGFydCxcbiAgICBlbmQ6IGVsLnNlbGVjdGlvbkVuZFxuICB9O1xufVxuXG5mdW5jdGlvbiBoYXJkR2V0IChlbCkge1xuICB2YXIgYWN0aXZlID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcbiAgaWYgKGFjdGl2ZSAhPT0gZWwpIHtcbiAgICBlbC5mb2N1cygpO1xuICB9XG5cbiAgdmFyIHJhbmdlID0gZG9jdW1lbnQuc2VsZWN0aW9uLmNyZWF0ZVJhbmdlKCk7XG4gIHZhciBib29rbWFyayA9IHJhbmdlLmdldEJvb2ttYXJrKCk7XG4gIHZhciBvcmlnaW5hbCA9IGVsLnZhbHVlO1xuICB2YXIgbWFya2VyID0gZ2V0VW5pcXVlTWFya2VyKG9yaWdpbmFsKTtcbiAgdmFyIHBhcmVudCA9IHJhbmdlLnBhcmVudEVsZW1lbnQoKTtcbiAgaWYgKHBhcmVudCA9PT0gbnVsbCB8fCAhaW5wdXRzKHBhcmVudCkpIHtcbiAgICByZXR1cm4gcmVzdWx0KDAsIDApO1xuICB9XG4gIHJhbmdlLnRleHQgPSBtYXJrZXIgKyByYW5nZS50ZXh0ICsgbWFya2VyO1xuXG4gIHZhciBjb250ZW50cyA9IGVsLnZhbHVlO1xuXG4gIGVsLnZhbHVlID0gb3JpZ2luYWw7XG4gIHJhbmdlLm1vdmVUb0Jvb2ttYXJrKGJvb2ttYXJrKTtcbiAgcmFuZ2Uuc2VsZWN0KCk7XG5cbiAgcmV0dXJuIHJlc3VsdChjb250ZW50cy5pbmRleE9mKG1hcmtlciksIGNvbnRlbnRzLmxhc3RJbmRleE9mKG1hcmtlcikgLSBtYXJrZXIubGVuZ3RoKTtcblxuICBmdW5jdGlvbiByZXN1bHQgKHN0YXJ0LCBlbmQpIHtcbiAgICBpZiAoYWN0aXZlICE9PSBlbCkgeyAvLyBkb24ndCBkaXNydXB0IHByZS1leGlzdGluZyBzdGF0ZVxuICAgICAgaWYgKGFjdGl2ZSkge1xuICAgICAgICBhY3RpdmUuZm9jdXMoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsLmJsdXIoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHsgc3RhcnQ6IHN0YXJ0LCBlbmQ6IGVuZCB9O1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldFVuaXF1ZU1hcmtlciAoY29udGVudHMpIHtcbiAgdmFyIG1hcmtlcjtcbiAgZG8ge1xuICAgIG1hcmtlciA9ICdAQG1hcmtlci4nICsgTWF0aC5yYW5kb20oKSAqIG5ldyBEYXRlKCk7XG4gIH0gd2hpbGUgKGNvbnRlbnRzLmluZGV4T2YobWFya2VyKSAhPT0gLTEpO1xuICByZXR1cm4gbWFya2VyO1xufVxuXG5mdW5jdGlvbiBpbnB1dHMgKGVsKSB7XG4gIHJldHVybiAoKGVsLnRhZ05hbWUgPT09ICdJTlBVVCcgJiYgZWwudHlwZSA9PT0gJ3RleHQnKSB8fCBlbC50YWdOYW1lID09PSAnVEVYVEFSRUEnKTtcbn1cblxuZnVuY3Rpb24gZWFzeVNldCAoZWwsIHApIHtcbiAgZWwuc2VsZWN0aW9uU3RhcnQgPSBwYXJzZShlbCwgcC5zdGFydCk7XG4gIGVsLnNlbGVjdGlvbkVuZCA9IHBhcnNlKGVsLCBwLmVuZCk7XG59XG5cbmZ1bmN0aW9uIGhhcmRTZXQgKGVsLCBwKSB7XG4gIHZhciByYW5nZSA9IGVsLmNyZWF0ZVRleHRSYW5nZSgpO1xuXG4gIGlmIChwLnN0YXJ0ID09PSAnZW5kJyAmJiBwLmVuZCA9PT0gJ2VuZCcpIHtcbiAgICByYW5nZS5jb2xsYXBzZShmYWxzZSk7XG4gICAgcmFuZ2Uuc2VsZWN0KCk7XG4gIH0gZWxzZSB7XG4gICAgcmFuZ2UuY29sbGFwc2UodHJ1ZSk7XG4gICAgcmFuZ2UubW92ZUVuZCgnY2hhcmFjdGVyJywgcGFyc2UoZWwsIHAuZW5kKSk7XG4gICAgcmFuZ2UubW92ZVN0YXJ0KCdjaGFyYWN0ZXInLCBwYXJzZShlbCwgcC5zdGFydCkpO1xuICAgIHJhbmdlLnNlbGVjdCgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHBhcnNlIChlbCwgdmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlID09PSAnZW5kJyA/IGVsLnZhbHVlLmxlbmd0aCA6IHZhbHVlIHx8IDA7XG59XG5cbmZ1bmN0aW9uIHNlbGwgKGVsLCBwKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XG4gICAgc2V0KGVsLCBwKTtcbiAgfVxuICByZXR1cm4gZ2V0KGVsKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzZWxsO1xuIiwidmFyIHNpID0gdHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gJ2Z1bmN0aW9uJywgdGljaztcbmlmIChzaSkge1xuICB0aWNrID0gZnVuY3Rpb24gKGZuKSB7IHNldEltbWVkaWF0ZShmbik7IH07XG59IGVsc2Uge1xuICB0aWNrID0gZnVuY3Rpb24gKGZuKSB7IHNldFRpbWVvdXQoZm4sIDApOyB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRpY2s7Il19
