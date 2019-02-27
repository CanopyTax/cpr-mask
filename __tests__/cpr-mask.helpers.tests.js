jest.unmock("../src/cpr-mask.helpers.js");
import {
  maskToMask,
  maskToValue,
  valueToMask,
  getMaskSlice,
  oldToNewMask,
  checkForAddingOrReplacing,
  checkCharsMatchPattern,
  checkMasks,
  getNewMaskCursor,
  testForValidChars,
  trimRightByChar,
} from '../src/cpr-mask.helpers.js';

describe("inputControl", () => {
  describe("maskToMask", () => {
    let mask = "1-1_1-"
    let mask2 = "*-***-*"
    //Adding Characters
    describe("adding", () => {
      it("should add to new mask - in order", () => {
        expect(maskToMask("1-1_1 -", "1-1_ -", mask, 5))
          .toEqual({newMask: "1-1_1-", selectionMove: 0});
      })
      it("should add to new mask - two", () => {
        expect(maskToMask("11  -    ", "1  -    ", "111-1111", 2))
          .toEqual({newMask: "11 -    ", selectionMove: 0})
      })
      it("should add to new mask - again", () => {
        expect(maskToMask("1-1 _ -", "1- _ -", mask, 3))
          .toEqual({newMask: "1-1_ -", selectionMove: 0});
      })
      it("should handle adding into the same characters", () => {
        expect(maskToMask("-1111 - ", "-11 - ", "-111-1", 5))
          .toEqual({selectionMove: 1, newMask: "-111-1"})
      })
      it("should add to new mask - skip mask", () => {
        expect(maskToMask("1- 1_ -", "1- _ -", mask, 4))
          .toEqual({selectionMove: 1, newMask: "1- _1-"});
      })
      it("should add to new mask- out of order", () => {
        expect(maskToMask("1- _1 -", "1- _ -", mask, 5))
          .toEqual({selectionMove: 0, newMask: "1- _1-"});
      })
      it("should handle adding multiple characters", () => {
        expect(maskToMask("111 - _ -", " - _ -", mask, 3))
          .toEqual({selectionMove: 2, newMask: "1-1_1-"});
      })
      it("should handle adding multiple characters - out of order", () => {
        expect(maskToMask(" -11 _ -", " - _ -", mask, 4))
          .toEqual({selectionMove: 1, newMask: " -1_1-"});
      })
      it("should handle adding too many characters - in order", () => {
        expect(maskToMask("1111 - _ -", " - _ -", mask, 4))
          .toEqual({selectionMove: 3, newMask: "1-1_1-1"});
      })
      it("should handle adding too many characters - out of order", () => {
        expect(maskToMask(" - _111 -", " - _ -", mask, 7))
          .toEqual({selectionMove: 1, newMask: " - _1-11"});
      })
    })
    describe("replacing", () => {
      it("should handle replacing a character", () => {
        expect(maskToMask("1-1_ -", "1- _ -", mask, 3))
          .toEqual({selectionMove: 0, newMask: "1-1_ -"});
      })
      it("should handle replacing multiple characters", () => {
        expect(maskToMask("11-", "1-1_1-", mask, 2))
          .toEqual({selectionMove: 1, newMask: "1-1_ -" });
      })
      it("should handle replacing multiple characters with multiple characters", () => {
        expect(maskToMask("1-22-", "1-1_1-", mask, 4))
          .toEqual({selectionMove: 1, newMask: "1-2_2-"});
      })
      it("should handle replacing a mask character", () => {
        expect(maskToMask("111_1-", "1-1_1-", mask, 2))
          .toEqual({selectionMove: 1, newMask: "1-1_1-"});
      })
      it("should handle replacing one character with many", () => {
        expect(maskToMask("1221_1-", "1-1_1-", mask, 3))
          .toEqual({selectionMove: 2, newMask: "1-2_2-"})
      })
      it("should handle non masked replacements", () => {
        expect(maskToMask("222-1_1-", "1-1_1-", mask, 3))
          .toEqual({selectionMove: 2, newMask: "2-2_2-"})
      })
    })
    describe("overwriting", () => {
      it("should overwrite characters", () => {
        expect(maskToMask("1-21_1-", "1-1_1-", mask, 3))
          .toEqual({selectionMove: 0, newMask: "1-2_1-"});
      })
      it("should skip mask to next char", () => {
        expect(maskToMask("1-12_1-", "1-1_2-", mask, 4))
          .toEqual({selectionMove: 1, newMask: "1-1_2-"})
      })
      it("should overwrite multiple", () => {
        expect(maskToMask("1-2211_1-", "1-11_1-", "1-11_1-", 4))
          .toEqual({selectionMove: 0, newMask: "1-22_1-"});
      })
      it("should overwrite multiple - skip mask", () => {
        expect(maskToMask("1-221_1-", "1-1_1-", mask, 4))
          .toEqual({selectionMove: 1, newMask: "1-2_2-"});
      })
      it("shouldn't overwrite with wrong char", () => {
        expect(maskToMask("1-A1_1-", "1-1_1-", mask, 3))
          .toEqual({selectionMove: -1, newMask: "1-1_1-"});
      })
    })
    describe("stop invalid inputs", () => {
      it("should stop invalid inputs - in order", () => {
        expect(maskToMask("1-1_A -", "1-1_ -", mask, 5))
          .toEqual({selectionMove: -1, newMask: "1-1_ -"});
      })
      it("should stop invalid inputs - multiple", () => {
        expect(maskToMask("1-1_AA -", "1-1_ -", mask, 6))
          .toEqual({selectionMove: -2, newMask: "1-1_ -"});
      })
      it("should stop invalid inputs - out of order", () => {
        expect(maskToMask("1- _A -", "1- _ -", mask, 5))
          .toEqual({selectionMove: -1, newMask: "1- _ -"});
      })
      it("should stop invalid replaces", () => {
        expect(maskToMask("1-A_ -", "1- _ -", mask, 3))
          .toEqual({selectionMove: -1, newMask: "1- _ -"});
      })
      it("should filler characters", () => {
        expect(maskToMask("1-  -$", "1- -$", "1-**-*", 4))
          .toEqual({selectionMove:  -1, newMask: "1- -$" });
      })
    })
    describe("deleting", () => {
      it("should handle deleting character", () => {
        expect(maskToMask("1-1_-", "1-1_1-", mask, 4))
          .toEqual({selectionMove: 0, newMask: "1-1_ -" });
      })
      it("should handle deleting character - out of order", () => {
        expect(maskToMask("1-_1-", "1-1_1-", mask, 2))
          .toEqual({selectionMove: 0, newMask: "1- _1-"});
      })
      it("should handle deleting multiple characters", () => {
        expect(maskToMask("1-", "1-1_1-", mask, 2))
          .toEqual({selectionMove: 0, newMask: "1- _ -"});
      })
      it("should handle deleting multiple characters - 2", () => {
        expect(maskToMask("1-", "1-1_1-", mask, 0))
          .toEqual({selectionMove: 0, newMask: " - _1-"});
      })
      it("should handle deleting multiple characters - 3", () => {
        expect(maskToMask("1-1-", "1-1_1-", mask, 2))
          .toEqual({selectionMove: 0, newMask: "1- _1-"});
      })
      it("should stop a mask character from being deleted", () => {
        expect(maskToMask("11_1-", "1-1_1-", mask, 1))
          .toEqual({selectionMove: 0, newMask: "1-1_1-"});
      })
    })

    it("should handle wild card characters", () => {
      expect(maskToMask("$-$  X-X", "$-$ X-X", mask2, 5, "X"))
        .toEqual({selectionMove: 0, newMask: "$-$  -X"});
    })

    it("should add a custom filler character", () => {
      expect(maskToMask("1-1X_X-", "1-X_X-", mask, 3, "X"))
        .toEqual({selectionMove: 0, newMask: "1-1_X-"});
    })

  })
  describe("maskToValue", () => {
    let mask = "1-1_1-1"
    it("should return a non-masked value from a masked one - in order", () => {
      expect(maskToValue("4-5_7- ", mask)).toBe("457");
    })
    it("should return a non-masked value from a masked one - in order separated fillers", () => {
      expect(maskToValue("4-5_ - ", mask)).toBe("45");
    })
    it("should return a non-masked value from a masked one - out of order", () => {
      expect(maskToValue("4- _7- ", mask)).toBe("4 7");
    })
    it("should return a non-masked value from a masked one - blank beginning", () => {
      expect(maskToValue(" - _5-8", mask)).toBe("  58");
    })
    it("should return a non-masked value with extra characters", () => {
      expect(maskToValue("1-2_3-45", mask)).toBe("12345");
    })
  })
  describe("getMaskSlice", () => {
    it("should get back a full slice of a pattern", () => {
      expect(getMaskSlice("1-1_1-", "1", 0, 3)).toEqual({maskSlice: "111", selectionMove: 2});
      expect(getMaskSlice("11--11", "1", 0, 2)).toEqual({maskSlice: "11", selectionMove: 0});
      expect(getMaskSlice("11--AA", "A", 0, 3)).toEqual({maskSlice: "11A", selectionMove: 2});
      expect(getMaskSlice("11--WW", "W", 2, 4)).toEqual({maskSlice: "WW", selectionMove: 2});
    })
    it("should stop at the end of the pattern even without all the characters", () => {
      expect(getMaskSlice("11------", "1", 0, 3)).toEqual({maskSlice: "11", selectionMove: 6});
      expect(getMaskSlice("1------1", "1", 0, 3)).toEqual({maskSlice: "11", selectionMove: 6});
    })
  })
  describe("oldToNewMask", () => {
    it("should take characters and fill spots for a new maskedValue", () => {
      expect(oldToNewMask("a", " - - - -", 0, "A-A-A-A-")).toBe("a- - - -")
    })
    it("should take characters and fill spots - all the way", () => {
      expect(oldToNewMask("asdf", " - - - -", 0, "A-A-A-A-")).toBe("a-s-d-f-")
    })
    it("should not add on extra filler characters", () => {
      expect(oldToNewMask("asdf", " - - -  ", 0, "A-A-A-AA")).toBe("a-s-d-f ")
    })
    it("Should take characters and fill spots - out of order", () => {
      expect(oldToNewMask("sdf", " - - - -", 1, "A-A-A-A-")).toBe(" -s-d-f-")
    })
    it("Should take character and fill spots - out of order 2", () => {
      expect(oldToNewMask("sdf", " - - - -", 4, "A-A-A-A-")).toBe(" - -s-d-f")
    })
  })
  describe("checkCharsMatchPattern", () => {
    it("should accept a valid input", () => {
      expect(checkCharsMatchPattern("A1W*", "f25$")).toBe(true);
    })
    it("should accept a valid input with too many characters", () => {
      expect(checkCharsMatchPattern("A1W", "f25433")).toBe(true);
    })
    it("should deny an invalid input", () => {
      expect(checkCharsMatchPattern("A1W", "125")).toBe(false);
    })
  })
  describe("checkForAddingOrReplacing", () => {
    describe("should detect when an input has done replacing behavior", () => {
      it("check one", () => {
        expect(checkForAddingOrReplacing("111-1-", "1-1-1-", 2, "1-1-1-"))
          .toEqual({correctedOldMask: "1-1-1-", addingReplacingString: "11-1-1-"});
      })
      it("check two", () => {
        expect(checkForAddingOrReplacing("1-1-1-", "1-1-1-", 1, "1-1-1-")).toBe(false);
      })
      it("check three", () => {
        expect(checkForAddingOrReplacing("1-11-1-", "1-1-1-", 4, "1-1-1-"))
          .toEqual({correctedOldMask: "1-1-1-", addingReplacingString: "1-11-1-"});
      });
      it("check three and a half", () => {
        expect(checkForAddingOrReplacing("2221-1-1-", "1-1-1-", 3, "1-1-1-"))
          .toEqual({correctedOldMask: "1-1-1-", addingReplacingString: "2221-1-1-"});
      })
      it("check four", () => {
        expect(checkForAddingOrReplacing("1-1-12-", "1-1-1-", 6, "1-1-1-"))
          .toEqual({correctedOldMask: "1-1-1-", addingReplacingString: "1-1-12-"});
      })
      it("check four and a half", () => {
        expect(checkForAddingOrReplacing("1-1-1232-", "1-1-1-", 8, "1-1-1-"))
          .toEqual({correctedOldMask: "1-1-1-", addingReplacingString: "1-1-1232-"});
      })
      it("check five", () => {
        expect(checkForAddingOrReplacing("1-333-1-", "1-1-1-", 5, "1-1-1-"))
          .toEqual({correctedOldMask: "1- -1-", addingReplacingString: "1-333 -1-"});
      })
      it("check five and a half", () => {
        expect(checkForAddingOrReplacing("1-33331-", "1-1-1-", 6, "1-1-1-"))
          .toEqual({correctedOldMask: "1- -1-", addingReplacingString: "1-3333 -1-"});
      })
      it("check six", () => {
        expect(checkForAddingOrReplacing("1221_1-", "1-1_1-", 3, "1-1_1-"))
          .toEqual({correctedOldMask: "1-1_1-", addingReplacingString: "122-1_1-"});
      })
      it("check seven", () => {
        expect(checkForAddingOrReplacing("1_1_1-", "1-1_1-", 2, "1-1_1-"))
          .toEqual({correctedOldMask: "1-1_1-", addingReplacingString: "1_-1_1-"});
      })
      it("check eight", () => {
        expect(checkForAddingOrReplacing("1-1_--", "1-1_1-", 5, "1-1_1-"))
          .toEqual({correctedOldMask: "1-1_ -", addingReplacingString: "1-1_- -"});
      })
      it("check nine - adding after mask", () => {
        expect(checkForAddingOrReplacing("1-1_1-_", "1-1_1-", 7, "1-1_1-"))
          .toEqual({correctedOldMask: "1-1_1-", addingReplacingString: "1-1_1-_"});
      })
      it("should give back a corrected old mask (filler characters in delete spots)", () => {
        expect(checkForAddingOrReplacing("11-", "1-1-1-1-", 2, "1-1-1-1-"))
          .toEqual({correctedOldMask: "1- - - -", addingReplacingString: "11- - - -"})
      })
      it("check ten", () => {
        expect(checkForAddingOrReplacing("1--1", "1-1-1", 2, "1-1-1-")).toBe(false)
      })
      it("check eleven", () => {
        expect(checkForAddingOrReplacing("1-1", "1-1-1", 3, "1-1-1-")).toBe(false)
      })
      it("check twelve", () => {
        expect(checkForAddingOrReplacing("1-1", "1-1-1", 0, "1-1-1-")).toBe(false)
      })
      it("check thirteen", () => {
        expect(checkForAddingOrReplacing("12-1", "1-2-1", 1, "1-2-1-")).toBe(false);
      })
    })
  })
  describe("check masks", () => {
    const trueMasks = [
      { pattern: "11AA" },
      { pattern: "11AA**" },
      { pattern: "11AA**A" },
      { pattern: "11AA**A11"},
    ];
    const trueMasks2 = [
      { pattern: "11AA" },
      { pattern: "11AA**" },
      { pattern: "11A" },
      { pattern: "11AA**A11"},
    ];
    const falseMasks = [
      { pattern: "11AA" },
      { pattern: "11A1**" },
      { pattern: "11AA**A" },
      { pattern: "11AA**A11"},
    ];
    const falseMasks2 = [
      { pattern: "11AA" },
      { pattern: "11AA**" },
      { pattern: "11AA**A" },
      { pattern: "11AA***11"},
    ];
    const falseMasks3 = [
      { pattern: "11AA" },
      { pattern: "11AA**" },
      { pattern: "1AA" },
      { pattern: "11AA*"},
    ];
    it("should evaluate trueMasks to true", () => {
      expect(checkMasks(trueMasks)).toBe(true);
    })
    it("should evaluate trueMasks2 to true", () => {
      expect(checkMasks(trueMasks2)).toBe(true);
    })
    it("should evaluate falseMasks to false", () => {
      expect(checkMasks(falseMasks)).toBe(false);
    })
    it("should evaluate falseMasks2 to false", () => {
      expect(checkMasks(falseMasks2)).toBe(false);
    })
    it("should evaluate falseMasks3 to false", () => {
      expect(checkMasks(falseMasks3)).toBe(false);
    })
  })
  describe("valueToMask", () => {
    it("should convert a value to a mask", () => {
      expect(valueToMask("1234", "1--1-1-1")).toBe("1--2-3-4");
    })
    it("should convert a partial value to a mask", () => {
      expect(valueToMask("12", "1--1-1-1")).toBe("1--2- - ")
    })
    it("should ignore extra values", () => {
      expect(valueToMask("12345", "1--1-1-1")).toBe("1--2-3-4");
    })
    it("should handle skipped values", () => {
      expect(valueToMask("12 4", "1--1-1-1")).toBe("1--2- -4")
    })
  })
  describe("getNewMaskCursor", () => {
    it("should get the cursor for a new mask", () => {
      expect(getNewMaskCursor("123", "1-1-1-1-")).toBe(6);
    })
  })
  describe("testForValidChars", () => {
    it("should return true for valid chars", () => {
      expect(testForValidChars("ANP", /[A-Z]/)).toBe(true)
    })
    it("should return false for invalid chars", () => {
      expect(testForValidChars("A1P", /[A-Z]/)).toBe(false)
    })
  })
  describe("trimRightByChar", () => {
    it("should return a string with all filler characters trimmed off the right", () => {
      expect(trimRightByChar("string    ", " ")).toBe("string");
    })
    it("shouldn't trim elsewhere", () => {
      expect(trimRightByChar("st i g   ", " ")).toBe("st i g");
    })
    it("should trim whatever characters", () => {
      expect(trimRightByChar("xxxddddxxxx", "x")).toBe("xxxdddd");
    })
    it("shouldn't trim if it can't", () => {
      expect(trimRightByChar("xxxddddxxxx", "d")).toBe("xxxddddxxxx");
    })
  })
})
