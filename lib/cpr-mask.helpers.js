'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.handleValidChars = handleValidChars;
exports.handleNoMasks = handleNoMasks;
exports.handleMasks = handleMasks;
exports.maskToMask = maskToMask;
exports.adding = adding;
exports.deleting = deleting;
exports.checkCharsMatchPattern = checkCharsMatchPattern;
exports.checkForAddingOrReplacing = checkForAddingOrReplacing;
exports.oldToNewMask = oldToNewMask;
exports.getMaskSlice = getMaskSlice;
exports.valueToMask = valueToMask;
exports.maskToValue = maskToValue;
exports.checkMasks = checkMasks;
exports.getNewMaskCursor = getNewMaskCursor;
exports.testForValidChars = testForValidChars;
exports.getPlaceholder = getPlaceholder;
exports.trimRightByChar = trimRightByChar;

var _ReactInputSelection = require('react/lib/ReactInputSelection');

var _lodash = require('lodash');

function handleValidChars(input) {
  var _this = this;

  //only tests the input against the regex
  if (testForValidChars(input, this.props.validChars)) {
    this.setState({
      maskValue: input,
      value: input
    }, function () {
      if (_this.props.onChange) _this.props.onChange(_this.state.value);
    });
  }
}

function handleNoMasks(input) {
  var _this2 = this;

  //No work to do, just an input
  this.setState({
    maskValue: input,
    value: input
  }, function () {
    if (_this2.props.onChange) _this2.props.onChange(_this2.state.value);
  });
}

function handleMasks(input) {
  var _this3 = this;

  //First get the current cursor position
  var cursor = (0, _ReactInputSelection.getSelection)(this.input);
  //Mask to mask will return the new input masked with the current mask

  var _maskToMask = maskToMask(input, this.state.maskValue, this.state.maskPattern, cursor.start, this.props.filler);

  var newMask = _maskToMask.newMask;
  var selectionMove = _maskToMask.selectionMove;
  //Pulls the value out of the new mask

  var newValue = maskToValue(newMask, this.state.maskPattern, this.props.filler);
  //Looks through the masks for the first met condition and returns that mask
  var mask = (0, _lodash.find)(this.props.masks, function (mask) {
    return mask.condition(newValue);
  });
  //If they don't match
  if (mask.pattern !== this.state.maskPattern) {
    //Mask a new newMask
    newMask = valueToMask(newValue, mask.pattern, this.props.filler);
    //If that fails
    if (newMask === false) {
      //stick with the old mask
      newMask = this.state.maskValue;
      mask = this.state.maskPattern;
    }
    //If you're converting to a new mask you'll need a new cursor
    selectionMove = getNewMaskCursor(newValue, mask.pattern);
    cursor.start = 0;
    cursor.end = 0;
  }
  //Make sure there isn't extra stuff that shouldn't be there on the right
  //Remove an extra character and trim the filler if necessary
  newValue = trimRightByChar(newValue.slice(0, mask.pattern.replace(/[^A1W*]/g, "").length), this.props.filler);
  this.setState({
    maskValue: newValue ? newMask.slice(0, mask.pattern.length) : "",
    value: newValue,
    maskPattern: mask.pattern
  }, function () {
    //The selection needs to be set after a render hence the callback
    (0, _ReactInputSelection.setSelection)(_this3.input, { start: cursor.start + selectionMove, end: cursor.start + selectionMove });
    if (_this3.props.onChange) _this3.props.onChange(_this3.state.value);
  });
}

function maskToMask(input, oldMask, maskPattern, cursor) {
  var filler = arguments.length <= 4 || arguments[4] === undefined ? " " : arguments[4];

  //No need re-mask if they're the same
  if (input === oldMask) return { newMask: input, selectionMove: 0 };
  //Make empty mask if there isn't an old one
  if (!oldMask) oldMask = maskPattern.replace(/[A1W*]/g, filler);
  //This function can detect replacement and additions
  //It converts replacement behavior into addition behavior
  //Returns false if there is deleting behavior

  var _checkForAddingOrRepl = checkForAddingOrReplacing(input, oldMask, cursor, maskPattern, filler);

  var addingReplacingString = _checkForAddingOrRepl.addingReplacingString;
  var correctedOldMask = _checkForAddingOrRepl.correctedOldMask;
  //Adding will convert addition string into a new mask
  //It returns the new mask and how much more the cursor needs to move

  if (addingReplacingString) return adding(addingReplacingString, correctedOldMask, maskPattern, cursor, addingReplacingString.length - oldMask.length, filler);
  //Deleting converts deleting behavior into a new mask
  //Return new mask and selectionMove 0 since the cursor is always right for deleting behavior
  else if (input.length < oldMask.length) return deleting(input, oldMask, maskPattern, cursor, filler);
  //Just in case send back the same thing
  return { newMask: oldMask, selectionMove: 0 };
}

function adding(input, oldMask, maskPattern, cursor, lengthDiff, filler) {
  var _getMaskSlice = getMaskSlice(maskPattern, cursor - lengthDiff, cursor);

  var maskSlice = _getMaskSlice.maskSlice;
  var selectionMove = _getMaskSlice.selectionMove;

  var inputSlice = input.slice(cursor - lengthDiff, cursor);
  if (!checkCharsMatchPattern(maskSlice, inputSlice, filler)) {
    return {
      newMask: oldMask,
      selectionMove: inputSlice.length * -1
    };
  }
  return {
    selectionMove: selectionMove,
    newMask: oldToNewMask(inputSlice, oldMask, cursor - lengthDiff, maskPattern, filler)
  };
}

function deleting(input, oldMask, maskPattern, cursor, filler) {
  var split = oldMask.length - input.length + cursor;
  var middleMask = maskPattern.slice(cursor, split).replace(/[A1W*]/g, filler);
  return {
    selectionMove: 0,
    newMask: oldMask.slice(0, cursor) + middleMask + oldMask.slice(split)
  };
}

function checkCharsMatchPattern(pattern, chars, filler) {
  for (var i = 0; i < pattern.length; i++) {
    if (chars[i] === filler) return false;
    if (!charMatchesRegexPattern(pattern[i], chars[i])) return false;
  }
  return true;
}

function checkForAddingOrReplacing(input, oldMask, inputStop, maskPattern) {
  var filler = arguments.length <= 4 || arguments[4] === undefined ? " " : arguments[4];

  if (input === oldMask) return false;
  if (!inputStop) return false;
  var start = input.split("").reduce(function (prev, curr, index) {
    if (prev !== false && prev !== undefined) return prev;
    if (curr !== oldMask[index]) return index;
  }, false);
  if (start === undefined) return false;
  var inputSlice = input.slice(start, inputStop);
  if (inputSlice === "") return false;
  var fillerCount = oldMask.length - (input.length - (inputStop - start));
  var endSlice = oldMask.slice(start).split("");
  var maskPatternChecker = maskPattern.slice(start);
  for (var i = 0; i < fillerCount; i++) {
    if (/[A1*W]/g.test(maskPatternChecker[i])) endSlice[i] = filler;
  }
  return {
    addingReplacingString: oldMask.slice(0, start) + inputSlice + endSlice.join(""),
    correctedOldMask: oldMask.slice(0, start) + endSlice.join("")
  };
}

function oldToNewMask(characters, oldMask, start, pattern, filler) {
  var replacePattern = pattern.slice(start).replace(/[A1W*]/g, "");
  var charBank = characters;
  var newMask = oldMask.slice(0, start) + oldMask.slice(start).split("").map(function (char, index) {
    if (char === replacePattern[0]) {
      replacePattern = replacePattern.slice(1);
      return char;
    } else if (charBank) {
      var replacement = charBank[0];
      charBank = charBank.slice(1);
      return replacement;
    }
    return char;
  }).join("") + charBank;
  var trimmedMask = newMask.split("");
  for (var i = trimmedMask.length - 1; i >= oldMask.length; i--) {
    if (trimmedMask[i] === filler) trimmedMask.splice(i, 1);
  }
  return trimmedMask.join("");
}

function charMatchesRegexPattern(pattern, char) {
  if (pattern === "A") return (/[A-Za-z]/.test(char)
  );
  if (pattern === "1") return (/\d/.test(char)
  );
  if (pattern === "W") return (/[A-Za-z0-9]/.test(char)
  );
  if (pattern === "*") return (/./.test(char)
  );
}

function getMaskSlice(pattern, start, stop) {
  var totalRequired = stop - start;
  var found = "";
  var i = start;
  var selectionMove = 0;
  while (found.length < totalRequired) {
    if (/[A1W*]/.test(pattern[i])) {
      found += pattern[i];
    } else {
      selectionMove++;
    }
    if (i >= pattern.length - 1) {
      break;
    }
    i++;
  }
  return { maskSlice: found, selectionMove: selectionMove };
}

function valueToMask(value, maskPattern) {
  var filler = arguments.length <= 2 || arguments[2] === undefined ? " " : arguments[2];

  var charBank = value;
  var filledMask = maskPattern.split("").map(function (patternChar) {
    if (/[A1W*]/.test(patternChar)) {
      if (!charBank) return filler;
      if (charBank[0] === filler) {
        var nextChar = charBank[0];
        charBank = charBank.slice(1);
        return filler;
      }
      if (charMatchesRegexPattern(patternChar, charBank[0])) {
        var _nextChar = charBank[0];
        charBank = charBank.slice(1);
        return _nextChar || filler;
      } else return false;
    } else return patternChar;
  });
  return filledMask.indexOf(false) === -1 ? filledMask.join("") : false;
}

function maskToValue(maskValue, maskPattern) {
  var filler = arguments.length <= 2 || arguments[2] === undefined ? " " : arguments[2];

  var whitedValue = maskValue.split("").filter(function (char, index) {
    return (/[A1W*]/.test(maskPattern[index]) || maskPattern[index] === undefined
    );
  });
  for (var i = whitedValue.length - 1; i >= 0; i--) {
    if (whitedValue[i] === filler) {
      whitedValue.splice(i, 1);
    } else break;
  }
  return whitedValue.join("");
}

function checkMasks(masks) {
  if (!masks.length) return true;
  return !!masks.map(toPatterns).reduce(toValidity);

  function toPatterns(mask) {
    return mask.pattern.replace(/[^1A*]/g, "");
  }
  function toValidity(validity, maskPattern) {
    var smallPattern = validity.length < maskPattern.length ? validity : maskPattern;
    var longPattern = validity === smallPattern ? maskPattern : validity;
    return smallPattern.split("").reduce(toPatternComparison, true) ? longPattern : false;
    function toPatternComparison(prev, current, index) {
      if (prev) return current === longPattern[index];
      return prev;
    }
  }
}
function getNewMaskCursor(value, mask) {
  var charsLeft = value.length;
  for (var i = 0; i < mask.length; i++) {
    if (!charsLeft && /[A1W*]/.test(mask[i])) {
      return i;
    } else if (/[A1W*]/.test(mask[i])) {
      charsLeft--;
    }
  }
  return mask.length;
}

function testForValidChars(chars, regex) {
  for (var i = 0; i < chars.length; i++) {
    if (!regex.test(chars[i])) return false;
  }
  return true;
}

function getPlaceholder(placeholder, masks, validChars, filler) {
  if (placeholder) return placeholder;
  if (validChars) return "";
  if (masks.length) return masks[0].pattern.replace(/[A1W*]/g, filler);
  return "";
}

function trimRightByChar(string, filler) {
  var stringArr = string.split("");
  for (var i = stringArr.length - 1; i >= 0; i--) {
    if (stringArr[i] === filler) stringArr.splice(i, 1);else break;
  }
  return stringArr.join("");
}