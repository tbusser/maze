/* ========================================================================== *\
	PUBLIC API
\* ========================================================================== */

/**
 *
 *
 * @param {Array} array The multidimensional array to reduce to a single
 *        dimensional array.
 *
 * @returns {Array}
 */
function flatten(array) {
	return array.reduce(function (flat, toFlatten) {
		return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
	}, []);
}

/**
 * Returns a random integer within a specified range (inclusive).
 *
 * @param {Number} min The lowest value of the allowed range.
 * @param {Number} max The highest value of the allowed value.
 *
 * @returns {Number} A random integer whose value is at least equal to min and
 *          at the most equal to max.
 */
function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Checks if the provided value is undefined or null.
 *
 * @param {any} value The value to check.
 *
 * @returns {Boolean} Returns true when the value is undefined or null;
 *          otherwise the result is false.
 */
function isNil(value) {
	return (value == null);
}

/**
 * Checks if the provided value is undefined or null. When this isn't the case
 * the method continues to check if the value has a length or size property and
 * if this property is 0.
 *
 * @param {any} value
 *
 * @returns {Boolean} When the value is nullish or has a length or size property
 *          whose value is 0, the result is true; otherwise the result is false.
 */
function isNilOrEmpty(value) {
	if (isNil(value)) {
		return true;
	}

	if (value.hasOwnProperty('length') && value.length > 0) {
		return false;
	}
	// Use "prop in value" instead of "value.hasOwnProperty(prop)", it is not
	// important if the property comes from the prototype or not. In case of
	// Map, "<Map>.hasOwnProperty(size)" fails but "size in <Map>" works.
	if ('size' in value && value.size > 0) {
		return false;
	}

	return true;
}

/* == PUBLIC API ============================================================ */



/* ========================================================================== *\
	EXPORTS
\* ========================================================================== */

export {
	flatten,
	getRandomInt,
	isNil,
	isNilOrEmpty
};

/* == EXPORTS=================================================================*/
