/* ========================================================================== *\
	PRIVATE VARIABLES
\* ========================================================================== */

const
	transitionStepDuration = (1000 / 60),

	eventNames = {
		transitionDone: 'ontransitiondone'
	},

	propertyNames = {
		colorStops: Symbol('colorStops'),
		duration: Symbol('duration'),
		eventElement: Symbol('eventElement'),
		id: Symbol('id'),
		index: Symbol('index'),
		fromColor: Symbol('fromColor'),
		toColor: Symbol('toColor')
	}
/* == PRIVATE VARIABLES ===================================================== */



/* ========================================================================== *\
	PRIVATE METHODS
\* ========================================================================== */

/**

 * @param {String} fromColor  The start color for the transition.
 * @param {String} toColor    The last color for the transition.
 * @param {Number} duration   The duration of the transition in milliseconds.
 *
 * @returns {Array} An array with a color per transition stop. The colors are
 *          formatted as a string in the format of "rgba(R,G,B,A)".
 *
 * @see {@link https://coderwall.com/p/cmslya/javascript-color-smooth-transition}
 */
function createColorStops(fromColor, toColor, duration) {
	const
		numberOfStops = Math.floor(duration / transitionStepDuration),
		canvas = document.createElement('canvas'),
		context = canvas.getContext('2d');

	if (numberOfStops <= 1) {
		return [toColor];
	}

	canvas.width = numberOfStops;
	canvas.height = 1;

	const
		gradient = context.createLinearGradient(0, 0, numberOfStops, 0);

	gradient.addColorStop(0, fromColor);
	gradient.addColorStop(1, toColor);
	context.fillStyle = gradient;
	context.fillRect(0, 0, numberOfStops, 1);

	const
		imageData = context.getImageData(0, 0, canvas.width, 1).data,
		colorStops = [];

	for (let index = 0; index < imageData.length; index = index + 4) {
		const
			colorComponents = [
				imageData[index],
				imageData[index + 1],
				imageData[index + 2],
				imageData[index + 3]
			];
		colorStops.push(`rgba(${colorComponents.join(',')})`);
	}

	// Make sure the first and last color are the colors specified to make sure
	// there are no differences in the end start and end color.
	colorStops[0] = fromColor;
	colorStops[numberOfStops - 1] = toColor;

	return colorStops;
}

/* == PRIVATE METHODS ======================================================= */



/* ========================================================================== *\
	PUBLIC API
\* ========================================================================== */

class CanvasColorTransition {
	/* ====================================================================== *\
		CONSTRUCTOR
	\* ====================================================================== */
	/**
	 * Creates an instance of CanvasColorTransition.
	 *
	 * @param {String} fromColor
	 * @param {String} toColor
	 * @param {Number} duration
	 * @memberof CanvasColorTransition
	 */
	constructor(id, fromColor, toColor, duration) {
		this[propertyNames.id] = id;

		this[propertyNames.duration] = duration;
		this[propertyNames.fromColor] = fromColor;
		this[propertyNames.toColor] = toColor;

		this[propertyNames.eventElement] = document.createElement('div');

		this[propertyNames.colorStops] = createColorStops(fromColor, toColor, duration);
		this[propertyNames.index] = 0;
	}
	/* == CONSTRUCTOR ======================================================= */



	/* ====================================================================== *\
		INSTANCE PROPERTIES
	\* ====================================================================== */

	/* ---------------------------------- *\
		currentColor (read-only)
	\* ---------------------------------- */
	get currentColor() {
		const
			index = Math.min(this[propertyNames.colorStops].length - 1, this[propertyNames.index]);

		return this[propertyNames.colorStops][index];
	}
	/* -- currentColor (read-only) ------ */


	/* ---------------------------------- *\
		duration (read-only)
	\* ---------------------------------- */
	get duration() {
		return this[propertyNames.duration];
	}
	/* -- duration (read-only) ---------- */


	/* ---------------------------------- *\
		fromColor (read-only)
	\* ---------------------------------- */
	get fromColor() {
		return this[propertyNames.fromColor];
	}
	/* -- fromColor (read-only) --------- */


	/* ---------------------------------- *\
		id (read-only)
	\* ---------------------------------- */
	get id() {
		return this[propertyNames.id];
	}
	/* -- id (read-only) ---------------- */


	/* ---------------------------------- *\
		toColor (read-only)
	\* ---------------------------------- */
	get toColor() {
		return this[propertyNames.toColor]
	}
	/* -- toColor (read-only) ----------- */


	/* ---------------------------------- *\
		transitionDone (read-only)
	\* ---------------------------------- */
	get transitionDone() {
		const
			index = this[propertyNames.index],
			ubound = this[propertyNames.colorStops].length;

		return (index > ubound);
	}
	/* -- transitionDone (read-only) ---- */

	/* == INSTANCE PROPERTIES =============================================== */



	/* ====================================================================== *\
		CALLBACK REGISTRATION
	\* ====================================================================== */

	/* ---------------------------------- *\
		transitionDone
	\* ---------------------------------- */
	offTransitionDone(callback) {
		this[propertyNames.eventElement].removeEventListener(eventNames.transitionDone, callback);
	}
	onTransitionDone(callback) {
		this[propertyNames.eventElement].addEventListener(eventNames.transitionDone, callback);
	}
	/* -- transitionDone ---------------- */

	/* == CALLBACK REGISTRATION ============================================= */



	/* ====================================================================== *\
		PUBLIC METHODS
	\* ====================================================================== */

	shift() {
		if (this.transitionDone) {
			return null;
		}

		// const
		// 	ubound = this[propertyNames.colorStops].length - 1;
		// console.log(`Getting color ${this[propertyNames.index]} of ${ubound} for ${this.id}`);
		const
			result = this.currentColor;

		this[propertyNames.index] += 1;

		if (this.transitionDone) {
			const
				event = new CustomEvent(eventNames.transitionDone, { detail: {
					instance: this
				}});
			this[propertyNames.eventElement].dispatchEvent(event);
		}

		return result;
	}

	/* == PUBLIC METHODS ==================================================== */
}

/* == PUBLIC API ============================================================ */



/* ========================================================================== *\
	EXPORTS
\* ========================================================================== */

export default CanvasColorTransition;

/* == EXPORTS =============================================================== */
