/* ========================================================================== *\
	PUBLIC API
\* ========================================================================== */

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
 *
 *
 * @param {any} value
 * @returns
 */
function isNil(value) {
	return (value == null);
}

/**
 *
 *
 * @param {any} value
 * @returns
 */
function isNilOrEmpty(value) {
	if (isNil(value)) {
		return true;
	}

	if (value.hasOwnProperty('length') && value.length === 0) {
		return true;
	}

	return false;
}

/* == PUBLIC API ============================================================ */



/* ========================================================================== *\
	EXPORTS
\* ========================================================================== */

export {
	getRandomInt,
	isNil,
	isNilOrEmpty
};

/* == EXPORTS=================================================================*/
