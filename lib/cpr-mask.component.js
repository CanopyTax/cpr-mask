'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _lodash = require('lodash');

var _ReactInputSelection = require('react/lib/ReactInputSelection');

var _cprMaskHelpers = require('./cpr-mask.helpers.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var InputControl = (function (_React$Component) {
  _inherits(InputControl, _React$Component);

  function InputControl(props) {
    _classCallCheck(this, InputControl);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(InputControl).call(this));

    var encodedValue = props.encoder(props.initialValue);
    var mask = (0, _lodash.find)(props.masks, function (mask) {
      return mask.condition(encodedValue);
    });
    var maskValue = undefined;
    if (!encodedValue) {
      maskValue = "";
      encodedValue = "";
    } else if (props.validChars) {
      if ((0, _cprMaskHelpers.testForValidChars)(encodedValue, props.validChars)) maskValue = props.initialValue;else {
        maskValue = "";
        encodedValue = "";
      }
    } else {
      maskValue = props.initialValue && mask ? (0, _cprMaskHelpers.valueToMask)(encodedValue, mask.pattern, props.filler) : "";
    }
    _this.state = {
      maskValue: maskValue,
      value: encodedValue,
      maskPattern: mask ? mask.pattern : null,
      isDirty: false
    };
    return _this;
  }

  _createClass(InputControl, [{
    key: 'componentWillMount',
    value: function componentWillMount() {
      //Certain masks would not be compatible with each other. This function insures that they are.
      if (!(0, _cprMaskHelpers.checkMasks)(this.props.masks)) throw Error("Incompatible masks");
    }
  }, {
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(props) {
      //If the initial value is changing the component should update to be the new initial value
      var encodedValue = props.encoder(props.initialValue);
      if (props.validChars) {
        if ((0, _cprMaskHelpers.testForValidChars)(encodedValue, props.validChars)) {
          this.setState({
            maskValue: encodedValue,
            value: encodedValue
          });
        }
      } else {
        var mask = (0, _lodash.find)(props.masks, function (mask) {
          return mask.condition(encodedValue);
        });
        this.setState({
          maskValue: props.initialValue && mask ? (0, _cprMaskHelpers.valueToMask)(encodedValue, mask.pattern, props.filler) : "",
          value: encodedValue,
          maskPattern: mask ? mask.pattern : null
        });
      }
    }
  }, {
    key: 'render',
    value: function render() {
      var _this2 = this;

      return _react2.default.createElement(
        'div',
        { className: '\n        ' + this.props.className + '\n        ' + (!this.props.validateMethod(this.state.value) && this.state.isDirty ? this.props.invalidClass : "") },
        _react2.default.createElement(
          'div',
          { style: { display: "flex", alignItems: "center" } },
          this.props.sideChars.left ? _react2.default.createElement(
            'span',
            null,
            this.props.sideChars.left
          ) : null,
          _react2.default.createElement('input', {
            ref: function ref(inputRef) {
              return _this2.input = inputRef;
            },
            value: this.props.masks.length ? this.state.maskValue : this.state.value,
            onChange: this.handleChange.bind(this),
            onBlur: this.handleBlur.bind(this),
            onMouseUp: this.selectionHandle.bind(this),
            className: this.props.inputClass,
            style: { textAlign: this.props.alignment },
            onFocus: this.onFocus.bind(this),
            placeholder: (0, _cprMaskHelpers.getPlaceholder)(this.props.placeholder, this.props.masks, this.props.validChars, this.props.filler) }),
          this.props.sideChars.right ? _react2.default.createElement(
            'span',
            { style: { marginLeft: 5 } },
            this.props.sideChars.right
          ) : null
        ),
        !this.props.validateMethod(this.state.value) && this.state.isDirty ? _react2.default.createElement(
          'span',
          { className: this.props.nonValidMsgClass },
          '' + this.props.nonValidMsg
        ) : null
      );
    }
  }, {
    key: 'selectionHandle',
    value: function selectionHandle(e) {
      if (this.state.maskPattern) {
        var oldCursor = (0, _ReactInputSelection.getSelection)(this.input);
        var newCursor = (0, _cprMaskHelpers.getNewMaskCursor)(this.state.value, this.state.maskPattern);
        if (oldCursor.start > newCursor) (0, _ReactInputSelection.setSelection)(this.input, { start: newCursor, end: newCursor });
      }
    }
  }, {
    key: 'onFocus',
    value: function onFocus(e) {
      if (this.props.onFocus) this.props.onFocus(this.props.decoder ? this.props.decoder(this.state.value) : this.state.value);
    }
  }, {
    key: 'handleBlur',
    value: function handleBlur() {
      //Show error messages on blur and run props.onBlur
      if (this.props.onBlur) this.props.onBlur(this.props.decoder ? this.props.decoder(this.state.value) : this.state.value);
      this.setState({
        isDirty: true
      });
    }
  }, {
    key: 'handleChange',
    value: function handleChange(e) {
      //if there is a validChars prop then it takes precedence over masks
      //it only checks to see that the input characters match the validChars regex
      if (this.props.validChars) _cprMaskHelpers.handleValidChars.call(this, e.target.value);
      //If there is no validChars and no mask you just have an input basically
      else if (!this.props.masks.length) _cprMaskHelpers.handleNoMasks.call(this, e.target.value);
        //If there are masks there's some work to be done
        else _cprMaskHelpers.handleMasks.call(this, e.target.value);
    }
  }]);

  return InputControl;
})(_react2.default.Component);

InputControl.defaultProps = {
  filler: " ",
  initialValue: "",
  alignment: "left",
  invalidClass: "",
  inputLabel: "",
  className: "",
  masks: [],
  validateMethod: function validateMethod() {
    return true;
  },

  sideChars: {},
  encoder: function encoder(value) {
    return value;
  },
  decoder: function decoder(value) {
    return value;
  }
};
InputControl.propTypes = {
  //name given to the surrounding div
  className: _react.PropTypes.string,
  //class given to the input field
  inputClass: _react.PropTypes.string,
  //class given to the error message
  errorClass: _react.PropTypes.string,
  //What value the component starts with
  invalidClass: _react.PropTypes.string,
  //Decides which side of an input field the text appears on
  alignment: _react.PropTypes.oneOf(["left", "right"]),
  //The message displayed when the input is invalid
  nonValidMsg: _react.PropTypes.string,
  //Characters to display on either side of the input
  sideChars: _react.PropTypes.shape({
    left: _react.PropTypes.string,
    right: _react.PropTypes.string
  }),
  //The variety of masks that could be displayed
  //If there is no placeholder and no validChars the first mask's pattern will be used to make a placeholder
  masks: _react.PropTypes.arrayOf(_react.PropTypes.shape({
    condition: _react.PropTypes.function,
    pattern: _react.PropTypes.string.isRequired
  })),
  //Regex that decides the validity of your input
  validChars: _react.PropTypes.object, //is really a regex
  //Function that decides if your input is valid and whether or not to show the invalid message and invalid classes
  validateMethod: _react.PropTypes.func,
  //Function that can transform the value before passing it up
  decoder: _react.PropTypes.func,
  //Encoder should probably be used if you're using a decoder
	//Changes value as it comes into cpr-mask
  encoder: _react.PropTypes.func
};
exports.default = InputControl;
