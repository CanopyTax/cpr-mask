[![Build Status](https://travis-ci.org/CanopyTax/cpr-mask.svg?branch=master)](https://travis-ci.org/CanopyTax/cpr-mask)

Cpr-mask is a React component for making masked inputs with the ability to switch between masks.
For example, if you have a phone number and want the value masked like this
`(801) 777-8776`
But once the value's length is more than 10 you want it to be
`8-01777877611`
or something Cpr-mask can do that for you.

Cpr-mask can also be used to make an input that only allows characters that match a regular expression.

## API
### masks

```javascript
[
	{
		pattern: "(111) 111-1111",
		condition: value => value.length <= 10
	},
	{
		pattern: "1-111111111111",
		condition: value => value.length > 10
	}
]
```
The main prop. It's an array of mask objects.
Each mask object has a pattern and a condition.
The pattern represents how the value will appear in the input. They are made of masked characters and placeholder characters.
Placeholder characters are either `1`, `A`, `W`, or `*`.
	- `1` Any number can go into this slot.
	- `A` Letters a-z.
	- `W` Numbers or Letters.
	- `*` Anything
A mask pattern of
`(1)-A-*-WWW`
could accept the value of "5Z$1AB".

The condition property is what determines what mask is currently displayed. It's a function that takes the input's non-masked value as an argument, 
and expects true/false as the return.
The condition functions are run in order of the array and the first to return true will be used.

#### Incompatible Masks
It's possible to give cpr-mask two or masks that would conflict with each other.
An example would be.
```javascript
[
	{
		pattern: "AA-AA",
		condition: value => value.length < 5
	},
	{
		pattern: "11-111",
		condition: value => value >= 5
	}
]
```
This wouldn't work because "abcd" is okay with the first mask but once you type in "abcde" and it would try to switch
those would be invalid characters. Cpr-mask will throw a `Incompatible masks` error in cases like these.

### Encoding and Decoding cpr-mask value

Cpr-mask gives you the ability to encode and decode values coming from and going to the input.
Encode is a function that will be run with the `initialValue` prop before cpr-mask attempts to mask the value.
Decode is a function that is just run onBlur for the value coming out of cpr-mask.
Both function were written for Canopy convenience can the same effect can be acheived other ways.

### Cpr-mask props
The majority of the props concern how the cpr-mask component is styled.
- className: The outermost class of cpr-mask
- inputClass: The css class given to the input field
- validateMethod: A function run on the non-masked value to see if the invalidClass should be applied or not
- invalidClass: The class given to the outermost div if the validateMethod returns false
- nonValidMsg: The message that appears beneath the input when validateMethod returns false.
- nonValidMsgClass: The class applied to the span containing the nonValidMsg
- alignment: The string of either `left` or `right`. Determines how to align text inside the input field.
- sideChars: An object determines if characters should be put directly to the left or right of the input.
```javascript
{
	left: "$",
	right: "%"
}
```
- filler: The character used for empty spots in the mask. Default is `" "`.
- placeholder: The placeholder given to the input. If none is provided cpr-mask will use a mask with the filler prop characters.

*Note: The validateMethod dependant classes apply only if the input has been blurred once.*

The simplified html is like this
```html
<div className={`${props.className} ${props.invalidClass}`}>
	<div>
		<span>{props.sideChars.left}</span>
		<input className={props.inputClass} style={{textAlign: props.alignment}}/>
		<span>{props.sideChars.right}</span>
	</div>
	<span className={props.nonValidMsgClass}>{props.nonValidMsg}</span>
</div>
```
### Cpr-mask interaction
The two available ways to get the non-masked value out of cpr-mask are `onChange` and `onBlur`.
These functions can be provided by props and will be given the non-masked value on invocation.
