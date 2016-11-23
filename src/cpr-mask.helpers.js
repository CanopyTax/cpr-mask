import { find } from 'lodash';

export function handleValidChars(input) {
  //only tests the input against the regex
  if (testForValidChars(input, this.props.validChars)) {
    this.setState({
      maskValue: input,
      value: input
		}, () => {
			if (this.props.onChange) this.props.onChange(this.state.value);
		})
  }
}

export function handleNoMasks(input) {
  //No work to do, just an input
  this.setState({
    maskValue: input,
    value: input
  }, () => {
		if (this.props.onChange) this.props.onChange(this.state.value);
  })
}

export function handleMasks(input) {
  const cursor = {start: this.input.selectionStart, end: this.input.selectionEnd};
  //Mask to mask will return the new input masked with the current mask
  let {newMask, selectionMove} = maskToMask(
    input,
    this.state.maskValue,
    this.state.maskPattern,
    cursor.start,
    this.props.filler
  )
  //Pulls the value out of the new mask
  let newValue = maskToValue(newMask, this.state.maskPattern, this.props.filler);
  //Looks through the masks for the first met condition and returns that mask
  let mask = find(this.props.masks, (mask) => mask.condition(newValue));
  //If they don't match
  if (mask.pattern !== this.state.maskPattern) {
    //Mask a new newMask
    newMask = valueToMask(newValue, mask.pattern, this.props.filler);
    //If that fails
    if (newMask === false) {
      //stick with the old mask
      newMask = this.state.maskValue;
      mask.pattern = this.state.maskPattern;
    }
    //If you're converting to a new mask you'll need a new cursor
    selectionMove = getNewMaskCursor(newValue, mask.pattern);
    cursor.start = 0;
    cursor.end = 0;
  }
  //Make sure there isn't extra stuff that shouldn't be there on the right
  //Remove an extra character and trim the filler if necessary
  newValue = trimRightByChar(
    newValue.slice(0, mask.pattern.replace(/[^A1W*]/g, "").length),
    this.props.filler
  );
  this.setState({
    maskValue: newValue ? newMask.slice(0, mask.pattern.length) : "",
    value: newValue,
    maskPattern: mask.pattern,
  }, () => {
    //The selection needs to be set after a render hence the callback
    this.input.setSelectionRange(cursor.start + selectionMove, cursor.start + selectionMove);
    if (this.props.onChange) this.props.onChange(this.state.value);
  })
}

export function maskToMask(input, oldMask, maskPattern, cursor, filler = " ") {
  //No need re-mask if they're the same
  if (input === oldMask) return {newMask: input, selectionMove: 0};
  //Make empty mask if there isn't an old one
  if (!oldMask) oldMask = maskPattern.replace(/[A1W*]/g, filler);
  //This function can detect replacement and additions
  //It converts replacement behavior into addition behavior
  //Returns false if there is deleting behavior
  let { addingReplacingString, correctedOldMask } = checkForAddingOrReplacing(
    input,
    oldMask,
    cursor,
    maskPattern,
    filler
  );
  //Adding will convert addition string into a new mask
  //It returns the new mask and how much more the cursor needs to move
  if (addingReplacingString) return adding(
    addingReplacingString,
    correctedOldMask,
    maskPattern,
    cursor,
    addingReplacingString.length - oldMask.length,
    filler
  );
  //Deleting converts deleting behavior into a new mask
  //Return new mask and selectionMove 0 since the cursor is always right for deleting behavior
  else if(input.length < oldMask.length) return deleting(input, oldMask, maskPattern, cursor, filler);
  //Just in case send back the same thing
  return {newMask: oldMask, selectionMove: 0}
}


export function adding(input, oldMask, maskPattern, cursor, lengthDiff, filler) {
  let {maskSlice, selectionMove} = getMaskSlice(maskPattern, cursor - lengthDiff, cursor);
  let inputSlice = input.slice(cursor - lengthDiff, cursor);
  if (!checkCharsMatchPattern(maskSlice, inputSlice, filler)) {
    return {
      newMask: oldMask,
      selectionMove: inputSlice.length * -1
    };
  }
  return {
    selectionMove,
    newMask: oldToNewMask(inputSlice, oldMask, cursor - lengthDiff, maskPattern, filler),
  };
}

export function deleting(input, oldMask, maskPattern, cursor, filler) {
  let split = oldMask.length - input.length + cursor;
  let middleMask = maskPattern
    .slice(cursor, split)
    .replace(/[A1W*]/g, filler);
  return {
    selectionMove: 0,
    newMask: oldMask.slice(0, cursor) + middleMask + oldMask.slice(split),
  }
}

export function checkCharsMatchPattern(pattern, chars, filler) {
  for (let i = 0; i < pattern.length; i++) {
    if (chars[i] === filler) return false;
    if (!charMatchesRegexPattern(pattern[i], chars[i])) return false;
  }
  return true;
}

export function checkForAddingOrReplacing(input, oldMask, inputStop, maskPattern, filler = " ") {
  if (input === oldMask) return false;
  if (!inputStop) return false;
  let start = input.split("").reduce((prev, curr, index) => {
    if (prev !== false && prev !== undefined) return prev;
    if (curr !== oldMask[index]) return index;
  }, false);
  if (start === undefined) return false;
  let inputSlice = input.slice(start, inputStop);
  if (inputSlice === "") return false;
  let fillerCount = (oldMask.length - (input.length - (inputStop - start)));
  let endSlice = oldMask.slice(start).split("");
  let maskPatternChecker = maskPattern.slice(start);
  for (let i = 0; i < fillerCount; i++) {
    if (/[A1*W]/g.test(maskPatternChecker[i])) endSlice[i] = filler;
  }
  return {
    addingReplacingString: oldMask.slice(0, start) + inputSlice + endSlice.join(""),
    correctedOldMask: oldMask.slice(0, start) + endSlice.join("")
  }
}

export function oldToNewMask(characters, oldMask, start, pattern, filler) {
  let replacePattern = pattern.slice(start).replace(/[A1W*]/g, "")
  let charBank = characters;
  let newMask = oldMask.slice(0, start) + oldMask.slice(start).split("").map((char, index) => {
    if (char === replacePattern[0]) {
      replacePattern = replacePattern.slice(1);
      return char;
    }
    else if (charBank) {
      let replacement = charBank[0];
      charBank = charBank.slice(1);
      return replacement;
    }
    return char;
  }).join("") + charBank;
  let trimmedMask = newMask.split("");
  for (let i = trimmedMask.length - 1; i >= oldMask.length; i--) {
    if (trimmedMask[i] === filler) trimmedMask.splice(i, 1);
  }
  return trimmedMask.join("");
}

function charMatchesRegexPattern(pattern, char) {
  if (pattern === "A") return /[A-Za-z]/.test(char);
  if (pattern === "1") return /\d/.test(char);
  if (pattern === "W") return /[A-Za-z0-9]/.test(char);
  if (pattern === "*") return /./.test(char);
}

export function getMaskSlice(pattern, start, stop) {
  let totalRequired = stop - start;
  let found = "";
  let i = start;
  let selectionMove = 0;
  while (found.length < totalRequired) {
    if (/[A1W*]/.test(pattern[i])) {
      found += pattern[i];
    } else {
      selectionMove++
    }
    if (i >= pattern.length - 1) {
      break;
    }
    i++;
  }
  return {maskSlice: found, selectionMove};
}

export function valueToMask(value, maskPattern, filler = " ") {
  let charBank = value;
  let filledMask = maskPattern.split("").map((patternChar) => {
    if (/[A1W*]/.test(patternChar)) {
      if (!charBank) return filler;
      if (charBank[0] === filler) {
        let nextChar = charBank[0];
        charBank = charBank.slice(1);
        return filler;
      }
      if (charMatchesRegexPattern(patternChar, charBank[0])) {
        let nextChar = charBank[0];
        charBank = charBank.slice(1);
        return nextChar || filler;
      } else return false;
    } else return patternChar;
  })
  return filledMask.indexOf(false) === -1 ? filledMask.join("") : false;
}

export function maskToValue(maskValue, maskPattern, filler = " ") {
  let whitedValue = maskValue.split("").filter((char, index) => {
    return (/[A1W*]/.test(maskPattern[index]) || maskPattern[index] === undefined)
  });
  for (let i = whitedValue.length - 1; i >= 0; i--) {
    if (whitedValue[i] === filler) {
      whitedValue.splice(i, 1);
    } else break;
  }
  return whitedValue.join("");
}

export function checkMasks(masks) {
  if(!masks.length) return true;
  return !!masks.map(toPatterns).reduce(toValidity);

  function toPatterns(mask) {
    return mask.pattern.replace(/[^1A*]/g, "");
  }
  function toValidity(validity, maskPattern) {
    let smallPattern = validity.length < maskPattern.length ? validity : maskPattern;
    let longPattern = validity === smallPattern ? maskPattern : validity;
    return smallPattern.split("").reduce(toPatternComparison, true)
      ? longPattern
      : false;
    function toPatternComparison(prev, current, index) {
      if (prev) return current === longPattern[index]
      return prev;
    }
  }
}
export function getNewMaskCursor(value, mask) {
  let charsLeft = value.length;
  for (let i = 0; i < mask.length; i++) {
    if (!charsLeft && /[A1W*]/.test(mask[i])) {
      return i;
    }
    else if (/[A1W*]/.test(mask[i])) {
      charsLeft--
    }
  }
  return mask.length;
}

export function testForValidChars(chars, regex) {
  for (let i = 0; i < chars.length; i++) {
    if (!regex.test(chars[i])) return false;
  }
  return true;
}

export function getPlaceholder(placeholder, masks, validChars, filler) {
  if (placeholder) return placeholder;
  if (validChars) return "";
  if (masks.length) return masks[0].pattern.replace(/[A1W*]/g, filler);
  return "";
}

export function trimRightByChar(string, filler) {
  let stringArr = string.split("");
  for (let i = stringArr.length - 1; i >= 0; i--) {
    if (stringArr[i] === filler) stringArr.splice(i, 1);
    else break;
  }
  return stringArr.join("");
}
