/* ========================================================================== *\
	IMPORTS
\* ========================================================================== */

import {
	isNil
} from '../utilities.js';

import Cell from '../cell.js';

/* == IMPORTS =============================================================== */



/* ========================================================================== *\
	PRIVATE VARIABLES
\* ========================================================================== */

const
	borderColor = '#999',

	directions = {
		forward: 1,
		backward: -1
	},

	transitionStepDuration = (1000/60),

	propertyNames = {
		cellInfo: Symbol('cellInfo'),
		colorStops: Symbol('colorStops'),
		colorTransition: Symbol('colorTransition'),
		currentIndex: Symbol('currentIndex'),
		direction: Symbol('direction'),
		runningState: Symbol('runningState'),
		timeoutId: Symbol('timeoutId')
	},

	runningStates = {
		paused: 0,
		running: 1,
		finished: 2
	};

/* == PRIVATE VARIABLES ===================================================== */



/* ========================================================================== *\
	PRIVATE METHODS
\* ========================================================================== */

/**
 * @param {Object} transitionInfo The info for the desired color transition.
 * @property {String} fromColor  The start color for the transition.
 * @property {String} toColor    The last color for the transition.
 * @property {Number} duration   The duration of the transition in milliseconds.
 *
 * @returns {Array} An array with a color per transition stop. The colors are
 *          formatted as a string in the format of "rgba(R,G,B,A)".
 */
function createColorStops({fromColor, toColor, duration}) {
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

/**
 *
 *
 * @returns
 */
function isTransitionDone() {
	const
		index = this[propertyNames.currentIndex],
		ubound = this[propertyNames.colorStops].length - 1;

	return (
		(index <= 0 && this[propertyNames.direction] === directions.backward) ||
		(index >= ubound && this[propertyNames.direction] === directions.forward)
	);
}

/**
 * Draws a cell border on the canvas.
 *
 * @param {CanvasRenderingContext2D} context The context to draw on.
 * @param {Object} rect Information needed to draw the line.
 * @param {Number} rect.fromX The horizontal start point for the line.
 * @param {Number} rect.fromY The vertical start point for the line.
 * @param {Number} rect.toX The horizontal end point for the line.
 * @param {Number} rect.toY The vertical end point for the line.
 */
function drawBorder(context, rect) {
	context.beginPath();

	// Configure the line styling
	context.strokeStyle = borderColor;
	context.lineCap = 'round';
	context.lineWidth = 2;

	// Draw the line.
	context.moveTo(rect.fromX, rect.fromY);
	context.lineTo(rect.toX, rect.toY);
	context.stroke();
}


/**
 *
 *
 * @returns
 */
function refreshCell() {
	const
		{ context, x, y, size, walls } = this[propertyNames.cellInfo],
		lineX = x + 1,
		lineY = y + 1,
		lineSize = size - 2,
		fillColor = this.colorAtCurrentStop;

	context.fillStyle = fillColor;
	context.fillRect(x, y, size, size);

	if ((walls & Cell.sides.top) === Cell.sides.top) {
		drawBorder(context, {
			fromX: x,
			fromY: lineY,
			toX: x + size,
			toY: lineY
		});
	}

	if ((walls & Cell.sides.right) === Cell.sides.right) {
		drawBorder(context, {
			fromX: lineX + lineSize,
			fromY: y,
			toX: lineX + lineSize,
			toY: y + size
		});
	}

	if ((walls & Cell.sides.bottom) === Cell.sides.bottom) {
		drawBorder(context, {
			fromX: x + size,
			fromY: lineY + lineSize,
			toX: x,
			toY: lineY + lineSize
		});
	}

	if ((walls & Cell.sides.left) === Cell.sides.left) {
		drawBorder(context, {
			fromX: lineX,
			fromY: y + size,
			toX: lineX,
			toY: y
		});
	}

	if (isTransitionDone.call(this)) {
		this[propertyNames.runningState] = runningStates.finished;

		return;
	}

	// Go to the next color stop in the transition.
	this[propertyNames.currentIndex] += (1 * this[propertyNames.direction]);
	// Schedule a new cell refresh for the next color stop.
	this[propertyNames.timeoutId] = setTimeout(() => {
		refreshCell.call(this);
	}, transitionStepDuration);
}

/* == PRIVATE METHODS ======================================================= */



/* ========================================================================== *\
	PUBLIC API
\* ========================================================================== */

class CellAnimation {
	/* ====================================================================== *\
		CONSTRUCTOR
	\* ====================================================================== */
	constructor(colorTransition, cellInfo) {
		if (isNil(colorTransition) || isNil(cellInfo)) {
			throw 'No transition or cell info has been provided';
		}

		this[propertyNames.cellInfo] = cellInfo;
		this[propertyNames.colorTransition] = colorTransition;
		this[propertyNames.colorStops] = createColorStops(colorTransition);
		this[propertyNames.currentIndex] = 0;
		this[propertyNames.direction] = directions.forward;
		this[propertyNames.runningState] = runningStates.paused;
	}
	/* == CONSTRUCTOR ======================================================= */



	/* ====================================================================== *\
		STATIC PROPERTIES
	\* ====================================================================== */
	static get runningStates() {
		return runningStates;
	}
	/* == STATIC PROPERTIES ================================================= */


	/* ====================================================================== *\
		INSTANCE PROPERTIES
	\* ====================================================================== */

	/* ---------------------------------- *\
		colorAtCurrentStop (read-only)
	\* ---------------------------------- */
	get colorAtCurrentStop() {
		const
			index = this[propertyNames.currentIndex];
		if (
			index < 0 ||
			index > this[propertyNames.colorStops].length - 1
		) {
			return null;
		}

		return this[propertyNames.colorStops][index];
	}
	/* -- colorAtCurrentStop (read-only) - */


	/* ---------------------------------- *\
		direction
	\* ---------------------------------- */
	get direction() {
		return this[propertyNames.direction];
	}
	set direction(value) {
		this[propertyNames.direction] = value;
	}
	/* -- direction --------------------- */


	/* ---------------------------------- *\
		fromColor (read-only)
	\* ---------------------------------- */
	get fromColor() {
		return this[propertyNames.colorTransition].fromColor;
	}
	/* -- fromColor (read-only) --------- */


	/* ---------------------------------- *\
		runningState (read-only)
	\* ---------------------------------- */
	get runningState() {
		return this[propertyNames.runningState];
	}
	/* -- runningState (read-only) ------ */


	/* ---------------------------------- *\
		timeLapsed (read-only)
	\* ---------------------------------- */
	get timeLapsed() {
		return this[propertyNames.currentIndex] * transitionStepDuration;
	}
	/* -- timeLapsed (read-only) -------- */


	/* ---------------------------------- *\
		toColor (read-only)
	\* ---------------------------------- */
	get toColor() {
		return this[propertyNames.colorTransition].toColor;
	}
	/* -- toColor (read-only) ----------- */

	/* == INSTANCE PROPERTIES =============================================== */


	/* ====================================================================== *\
		PUBLIC METHODS
	\* ====================================================================== */
	flipDirection() {
		this[propertyNames.direction] = (this[propertyNames.direction] === directions.backward)
			? directions.forward
			: directions.backward;
	}

	pause() {
		if (!this[propertyNames.runningState] === runningStates.running) {
			return;
		}
		console.log('animation paused');
		this[propertyNames.runningState] = runningStates.paused;
		clearTimeout(this[propertyNames.timeoutId]);
	}

	run() {
		this[propertyNames.runningState] = runningStates.running;

		refreshCell.call(this);
	}
	/* == PUBLIC METHODS ==================================================== */
}

/* == PUBLIC API ============================================================ */



/* ========================================================================== *\
	EXPORTS
\* ========================================================================== */

export default CellAnimation;

/* == EXPORTS =============================================================== */
