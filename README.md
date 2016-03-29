###For lack of a good api explanation here are the propTypes for cpr-mask
```javascript
  propTypes = {
    //name given to the surrounding div
    className: PropTypes.string,
    //class given to the input field
    inputClass: PropTypes.string,
    //class given to the error message
    errorClass: PropTypes.string,
    //What value the component starts with
    invalidClass: PropTypes.string,
    //Decides which side of an input field the text appears on
    alignment: PropTypes.oneOf(["left", "right"]),
    //The message displayed when the input is invalid
    nonValidMsg: PropTypes.string,
    //Characters to display on either side of the input
    sideChars: PropTypes.shape({
      left: PropTypes.string,
      right: PropTypes.string
    }),
    //The variety of masks that could be displayed
    //If there is no placeholder and no validChars the first mask's pattern will be used to make a placeholder
    masks: PropTypes.arrayOf(PropTypes.shape({
      condition: PropTypes.function,
      pattern: PropTypes.string.isRequired
    })),
    //Regex that decides the validity of your input
    validChars: PropTypes.object, //is really a regex
    //Function that decides if your input is valid and whether or not to show the invalid message and invalid classes
    validateMethod: PropTypes.func,
		//Function that can transform the value before passing it up
		decoder: PropTypes.func,
		//Function that changes value as it comes into cpr-mask
		//Encoder should probably be used if you're using a decoder
		encoder: PropTypes.func,
  }
```
