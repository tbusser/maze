/* ========================================================================== *\
	IMPORTS
\* ========================================================================== */

import {
	isNil,
	isNilOrEmpty
} from '../utilities.js';

import Cell from '../cell.js';

/* == IMPORTS =============================================================== */



/* ========================================================================== *\
	PRIVATE VARIABLES
\* ========================================================================== */

const
	borderColor = '#999',
	textColor = '#000',

	eventNames = {
		onCellClicked: 'onmouseclicked',
		onCellMouseDown: 'onmousedowncell',
		onCellMouseOver: 'onmouseovercell',
		onCellMouseUp: 'onmouseupcell'
	},

	propertyNames = {
		activeAnimations: Symbol('activeAnimations'),
		allowInteraction: Symbol('allowInteraction'),
		baseElement: Symbol('baseElement'),
		boundHandlers: Symbol('boundHandlers'),
		cellSize: Symbol('cellSize'),
		cellText: Symbol('cellText'),
		context: Symbol('context')
	}

/* == PRIVATE VARIABLES ===================================================== */



/* ========================================================================== *\
	EVENT HANDLING
\* ========================================================================== */

/**
 *
 *
 * @param {any} eventName
 * @param {any} clientX
 * @param {any} clientY
 */
function dispatchCellEvent(eventName, clientX, clientY) {
	const
		canvasX = clientX - this.baseElement.offsetLeft,
		canvasY = clientY - this.baseElement.offsetTop,
		{ column, row } = coordinatesToLocation.call(this, canvasX, canvasY),
		cellEvent = new CustomEvent(eventName, {
			detail: {
				column,
				row
			}
		});

	this.baseElement.dispatchEvent(cellEvent);
}

/**
 *
 *
 * @param {any} event
 */
function onClickHandler(event) {
	const
		{ clientX, clientY } = event;

	dispatchCellEvent.call(this, eventNames.onCellClicked, clientX, clientY);
}

/**
 *
 *
 * @param {any} event
 */
function onMouseDownHandler(event) {
	const
		{ clientX, clientY } = event;

	dispatchCellEvent.call(this, eventNames.onCellMouseDown, clientX, clientY);
}

/**
 *
 *
 * @param {any} event
 */
function onMouseMoveHandler(event) {
	const
		{ clientX, clientY } = event;

	dispatchCellEvent.call(this, eventNames.onCellMouseOver, clientX, clientY);
}

/**
 *
 *
 * @param {any} event
 */
function onMouseUpHandler(event) {
	const
		{ clientX, clientY } = event;

	dispatchCellEvent.call(this, eventNames.onCellMouseUp, clientX, clientY);
}

/* == EVENT HANDLING ======================================================== */



/* ========================================================================== *\
	PRIVATE METHODS
\* ========================================================================== */

/**
 *
 *
 * @param {Number} x
 * @param {Number} y
 *
 * @returns {Object}
 *
 * @private
 * @memberof Grid
 */
function coordinatesToLocation(x, y) {
	return {
		column: Math.max(0, Math.floor(x / this.cellSize)),
		row: Math.max(0, Math.floor(y / this.cellSize))
	};
}

/**
 *
 * @param {Number} column
 * @param {Number} row
 *
 * @private
 * @memberof Grid
 */
function locationToCoordinates(column, row) {
	return {
		x: column * this.cellSize,
		y: row * this.cellSize
	}
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
 * @param {any} column
 * @param {any} row
 * @param {any} walls
 * @param {any} color
 *
 * @private
 * @memberof Grid
 */
function drawCell(column, row, walls, color) {
	const
		context = this[propertyNames.context],
		{ x, y } = locationToCoordinates.call(this, column, row),
		lineX = x + 1,
		lineY = y + 1,
		lineSize = this.cellSize - 2;

	context.fillStyle = color;
	context.fillRect(x, y, this.cellSize, this.cellSize);

	if ((walls & Cell.sides.top) === Cell.sides.top) {
		drawBorder(context, {
			fromX: x,
			fromY: lineY,
			toX: x + this.cellSize,
			toY: lineY
		});
	}

	if ((walls & Cell.sides.right) === Cell.sides.right) {
		drawBorder(context, {
			fromX: lineX + lineSize,
			fromY: y,
			toX: lineX + lineSize,
			toY: y + this.cellSize
		});
	}

	if ((walls & Cell.sides.bottom) === Cell.sides.bottom) {
		drawBorder(context, {
			fromX: x + this.cellSize,
			fromY: lineY + lineSize,
			toX: x,
			toY: lineY + lineSize
		});
	}

	if ((walls & Cell.sides.left) === Cell.sides.left) {
		drawBorder(context, {
			fromX: lineX,
			fromY: y + this.cellSize,
			toX: lineX,
			toY: y
		});
	}

	const
		cellKey = getKeyForLocation(column, row);
	if (this[propertyNames.cellText].has(cellKey)) {
		drawTextIncell.call(this, column, row, this[propertyNames.cellText].get(cellKey));
	}
}

/**
 *
 *
 * @param {any} column
 * @param {any} row
 * @param {any} text
 */
function drawTextIncell(column, row, text) {
	/** @type {CanvasRenderingContext2D} */
	const
		context = this[propertyNames.context];
	let
		{ x, y } = locationToCoordinates.call(this, column, row);

	// Adjust the coordinates so they are at the center of the cell.
	x += (this.cellSize / 2);
	y += (this.cellSize / 2);

	context.fillStyle = textColor;
	context.font = '20px Arial';
	context.textAlign = 'center';
	context.textBaseline = 'middle';

	context.fillText(text, x, y);
}

/**
 *
 *
 * @param {any} column
 * @param {any} row
 * @returns
 */
function getKeyForLocation(column, row) {
	return `${column}_${row}`;
}

/* == PRIVATE METHODS ======================================================= */



/* ========================================================================== *\
	PUBLIC API
\* ========================================================================== */

class Grid {
	/* ====================================================================== *\
		CONSTRUCTOR
	\* ====================================================================== */
	/**
	 * Creates an instance of Grid.
	 *
	 * @param {HTMLCanvasElement} baseElement
	 *
	 * @memberof Grid
	 */
	constructor(baseElement) {
		if (isNil(baseElement)) {
			throw 'Unable to create instance of Grid, no base element has been provided';
		}

		this[propertyNames.allowInteraction] = false;
		this[propertyNames.baseElement] = baseElement;
		this[propertyNames.boundHandlers] = {
			click: onClickHandler.bind(this),
			mousedown: onMouseDownHandler.bind(this),
			mousemove: onMouseMoveHandler.bind(this),
			mouseup: onMouseUpHandler.bind(this)
		};
		this[propertyNames.cellText] = new Map();
		this[propertyNames.context] = baseElement.getContext('2d');
	}
	/* == CONSTRUCTOR ======================================================= */



	/* ====================================================================== *\
		INSTANCE PROPERTIES
	\* ====================================================================== */

	/* ---------------------------------- *\
		baseElement (read-only)
	\* ---------------------------------- */
	get baseElement() {
		return this[propertyNames.baseElement];
	}
	/* -- baseElement (read-only) ------- */


	/* ---------------------------------- *\
		cellSize (read-only)
	\* ---------------------------------- */
	get cellSize() {
		return this[propertyNames.cellSize];
	}
	/* -- cellSize (read-only) ---------- */


	/* ---------------------------------- *\
		allowInteraction
	\* ---------------------------------- */
	get allowInteraction() {
		return this[propertyNames.allowInteraction];
	}
	set allowInteraction(value) {
		value = !!value;

		if (value === this[propertyNames.allowInteraction]) {
			return;
		}
		this[propertyNames.allowInteraction] = value;

		const
			methodName = (value)
				? 'addEventListener'
				: 'removeEventListener';

		for (let eventName in this[propertyNames.boundHandlers]) {
			if (!this[propertyNames.boundHandlers].hasOwnProperty(eventName)) {
				continue;
			}
			this.baseElement[methodName](eventName, this[propertyNames.boundHandlers][eventName]);
		}
	}
	/* -- allowInteraction -------------- */

	/* == INSTANCE PROPERTIES =============================================== */



	/* ====================================================================== *\
		CALLBACK METHODS
	\* ====================================================================== */

	/* ---------------------------------- *\
		cellClick
	\* ---------------------------------- */
	offCellClick(callback) {
		this.baseElement.removeEventListener(eventNames.onCellClicked, callback);
	}
	onCellClick(callback) {
		this.baseElement.addEventListener(eventNames.onCellClicked, callback);
	}
	/* -- cellClick --------------------- */


	/* ---------------------------------- *\
		cellMouseDown
	\* ---------------------------------- */
	offCellMouseDown(callback) {
		this.baseElement.removeEventListener(eventNames.onCellMouseDown, callback);
	}
	onCellMouseDown(callback) {
		this.baseElement.addEventListener(eventNames.onCellMouseDown, callback);
	}
	/* -- cellMouseDown ----------------- */


	/* ---------------------------------- *\
		cellMouseOver
	\* ---------------------------------- */
	offCellMouseOver(callback) {
		this.baseElement.removeEventListener(eventNames.onCellMouseOver, callback);
	}
	onCellMouseOver(callback) {
		this.baseElement.addEventListener(eventNames.onCellMouseOver, callback);
	}
	/* -- cellMouseOver ----------------- */


	/* ---------------------------------- *\
		cellMouseUp
	\* ---------------------------------- */
	offCellMouseUp(callback) {
		this.baseElement.removeEventListener(eventNames.onCellMouseUp, callback);
	}
	onCellMouseUp(callback) {
		this.baseElement.addEventListener(eventNames.onCellMouseUp, callback);
	}
	/* -- cellMouseUp ------------------- */

	/* == CALLBACK METHODS ================================================== */



	/* ====================================================================== *\
		PUBLIC METHODS
	\* ====================================================================== */

	/**
	 * Clears the canvas. This includes stopping all running color transitions.
	 *
	 * @memberof Grid
	 */
	clear() {
		// TODO: stop all animations.

		/** @type {CanvasRenderingContext2D} */
		const
			context = this[propertyNames.context];

		// Clear the maze that may already have been drawn on the canvas.
		context.clearRect(0, 0, this[propertyNames.baseElement].width, this[propertyNames.baseElement].height);
	}

	/**
	 *
	 *
	 * @param {Number} x
	 * @param {Number} y
	 *
	 * @returns {Object}
	 *
	 * @memberof Grid
	 */
	getLocationForCoordinates(x, y) {
		return locationToCoordinates.call(this, x, y);
	}

	/**
	 *
	 *
	 * @param {Number} column
	 * @param {Number} row
	 * @param {Number} walls
	 * @param {String} color
	 * @memberof Grid
	 */
	setColorForCell(column, row, walls, color) {
		drawCell.call(this, column, row, walls, color);
	}

	setColorForCellAnimated(column, row, walls, fromColor, toColor, duration) {
		//
	}

	/**
	 *
	 *
	 * @param {Number} column
	 * @param {Number} row
	 * @param {String} text
	 *
	 * @memberof Grid
	 */
	setTextForCell(column, row, text) {
		const
			cellKey = getKeyForLocation(column, row);

		if (isNilOrEmpty(text)) {
			this[propertyNames.cellText].delete(cellKey);
		} else {
			this[propertyNames.cellText].set(cellKey, text);
		}

		drawTextIncell.call(this, column, row, text);
	}

	/**
	 *
	 *
	 * @param {Number} columns
	 * @param {Number} rows
	 * @param {Number} cellSize
	 *
	 * @memberof Grid
	 */
	setupGrid(columns, rows, cellSize) {
		this.clear();

		this[propertyNames.cellSize] = cellSize;
		this[propertyNames.baseElement].height = (rows * cellSize);
		this[propertyNames.baseElement].width = (columns * cellSize);
		this[propertyNames.cellText].clear();
	}

	/* == PUBLIC METHODS ==================================================== */
}

/* == PUBLIC API ============================================================ */


/* ========================================================================== *\
	EXPORTS
\* ========================================================================== */

export default Grid;

/* == EXPORTS =============================================================== */
