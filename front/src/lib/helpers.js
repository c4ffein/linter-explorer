export function debounce(func, wait, immediate) {
  // MIT License
  // Copyright (c) 2018 You-Dont-Need
  // https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore?tab=readme-ov-file#_debounce
  let timeout;
  return function() {
    let context = this, args = arguments;
    clearTimeout(timeout);
    if (immediate && !timeout) func.apply(context, args);
    timeout = setTimeout(function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    }, wait);
  };
}
