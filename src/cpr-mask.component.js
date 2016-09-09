import React, {PropTypes} from 'react';
import { find } from 'lodash';
import { getSelection, setSelection } from 'react/lib/ReactInputSelection';
import { valueToMask, checkMasks, getPlaceholder, handleValidChars, handleNoMasks, handleMasks, getNewMaskCursor, testForValidChars } from './cpr-mask.helpers.js';

export default class InputControl extends React.Component {
  constructor(props) {
    super();
		let encodedValue = props.encoder(props.initialValue);
    const mask = find(props.masks, (mask) => {
      return mask.condition(encodedValue);
    });
		let maskValue;
		if (!encodedValue) {
			maskValue = "";
			encodedValue = "";
		} else if (props.validChars) {
			if (testForValidChars(encodedValue, props.validChars)) maskValue = props.initialValue;
			else {
				maskValue = "";
				encodedValue = "";
			}
		} else {
			maskValue = props.initialValue && mask ? valueToMask(encodedValue, mask.pattern, props.filler) : "";
    }
		this.state = {
			maskValue: maskValue,
			value: encodedValue,
			maskPattern: mask ? mask.pattern : null,
			isDirty: false,
		}
  }
  componentWillMount() {
    //Certain masks would not be compatible with each other. This function insures that they are.
    if (!checkMasks(this.props.masks)) throw Error("Incompatible masks")
  }
  componentWillReceiveProps(props) {
    //If the initial value is changing the component should update to be the new initial value
		let encodedValue = props.encoder(props.initialValue);
		if (props.validChars) {
			if (testForValidChars(encodedValue, props.validChars)) {
				this.setState({
					maskValue: encodedValue,
					value: encodedValue || "",
				})
			}
		} else {
			const mask = find(props.masks, (mask) => {
				return mask.condition(encodedValue);
			})
			this.setState({
				maskValue: (props.initialValue && mask) ? valueToMask(encodedValue, mask.pattern, props.filler) : "",
				value: encodedValue || "",
				maskPattern: mask ? mask.pattern : null,
			});
		}
  }
  render() {
    return (
      <div className={`
        ${this.props.className}
        ${!this.props.validateMethod(this.state.value) && this.state.isDirty
            ? this.props.invalidClass
            : ""}`}>
        <div style={{display: "flex", alignItems: "center"}}>
          {this.props.sideChars.left
            ? <span>{this.props.sideChars.left}</span>
            : null}
          <input
						type="text"
            ref={(inputRef) => this.input = inputRef}
            value={this.props.masks.length ? this.state.maskValue : this.state.value}
            onChange={this.handleChange.bind(this)}
            onBlur={this.handleBlur.bind(this)}
            onMouseUp={this.selectionHandle.bind(this)}
            className={this.props.inputClass}
            style={{textAlign: this.props.alignment}}
            onFocus={this.onFocus.bind(this)}
            placeholder={getPlaceholder(this.props.placeholder, this.props.masks, this.props.validChars, this.props.filler)} />
          {this.props.sideChars.right
            ? <span style={{marginLeft: 5}}>{this.props.sideChars.right}</span>
            : null}
        </div>
        {!this.props.validateMethod(this.state.value) && this.state.isDirty
          ? <span className={this.props.nonValidMsgClass}>{`${this.props.nonValidMsg}`}</span>
          : null}
      </div>
    )
  }

  selectionHandle(e) {
    if (this.state.maskPattern) {
      let oldCursor = getSelection(this.input);
      let newCursor = getNewMaskCursor(this.state.value, this.state.maskPattern);
      if (oldCursor.start > newCursor) setSelection(this.input, {start: newCursor, end: newCursor});
    }
  }
  onFocus(e) {
    if (this.props.onFocus) this.props.onFocus(this.props.decoder ? this.props.decoder(this.state.value) : this.state.value);
  }
  handleBlur() {
    //Show error messages on blur and run props.onBlur
    if (this.props.onBlur) this.props.onBlur(this.props.decoder ? this.props.decoder(this.state.value) : this.state.value);
    this.setState({
      isDirty: true
    })
  }
  handleChange(e) {
    //if there is a validChars prop then it takes precedence over masks
    //it only checks to see that the input characters match the validChars regex
    if (this.props.validChars) handleValidChars.call(this, e.target.value);
    //If there is no validChars and no mask you just have an input basically
    else if (!this.props.masks.length) handleNoMasks.call(this, e.target.value);
    //If there are masks there's some work to be done
    else handleMasks.call(this, e.target.value)
  }
  static defaultProps = {
    filler: " ",
    initialValue: "",
    alignment: "left",
    invalidClass: "",
    inputLabel: "",
    className: "",
    masks: [],
    validateMethod() {
      return true;
    },
		sideChars: {},
		encoder: value => value,
		decoder: value => value,
  };
  static propTypes = {
    //name given to the surrounding div
    className: PropTypes.string,
    //class given to the input field
    inputClass: PropTypes.string,
    //What value the component starts with
		initialValue: PropTypes.string,
    //class given to the error message
    invalidClass: PropTypes.string,
    //Decides which side of an input field the text appears on
    alignment: PropTypes.oneOf(["left", "right"]),
    //The message displayed when the input is invalid
    nonValidMsg: PropTypes.string,
		//The class applied to the nonValidMsg span
		nonValidMsgClass: PropTypes.string,
    //Characters to display on either side of the input
		placeholder: PropTypes.string,
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
  };
}
