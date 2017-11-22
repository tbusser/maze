/* ========================================================================== *\
	IMPORTS
\* ========================================================================== */

import {
	isNil,
	isNilOrEmpty
} from '../utilities/utilities.js';

import Cell from '../cell.js';
import ColorTransition from './canvas-color-transition.js';

/* == IMPORTS =============================================================== */



/* ========================================================================== *\
	PRIVATE VARIABLES
\* ========================================================================== */

const
	borderColor = '#999',
	defaultTransitionDuration = 500,
	textColor = '#000',
	transitionInterval = (1000 / 60),

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
		context: Symbol('context'),
		transitionTimeoutId: Symbol('transitionTimeoutId')
	}

/* == PRIVATE VARIABLES ===================================================== */



/* ========================================================================== *\
	EVENT HANDLING
\* ========================================================================== */

/**
 *
 *
 * @param {MouseEvent} event
 */
function onClickHandler(event) {
	const
		{ clientX, clientY } = event;

	dispatchCellEvent.call(this, eventNames.onCellClicked, clientX, clientY);
}

/**
 *
 *
 * @param {MouseEvent} event
 */
function onMouseDownHandler(event) {
	const
		{ clientX, clientY } = event;

	dispatchCellEvent.call(this, eventNames.onCellMouseDown, clientX, clientY);
}

/**
 *
 *
 * @param {MouseEvent} event
 */
function onMouseMoveHandler(event) {
	const
		{ clientX, clientY } = event;

	dispatchCellEvent.call(this, eventNames.onCellMouseOver, clientX, clientY);
}

/**
 *
 *
 * @param {MouseEvent} event
 */
function onMouseUpHandler(event) {
	const
		{ clientX, clientY } = event;

	dispatchCellEvent.call(this, eventNames.onCellMouseUp, clientX, clientY);
}

/**
 *
 *
 * @param {TransitionDoneEvent} event
 */
function onTransitionDoneHandler(event) {
	// console.log(`A transition is done for location ${event.detail.instance.id}`);
	removeAnimation.call(this, event.detail.instance.id);
}

/* == EVENT HANDLING ======================================================== */



/* ========================================================================== *\
	PRIVATE METHODS
\* ========================================================================== */

/* ---------------------------------- *\
	Animation methods
\* ---------------------------------- */
/**
 *
 *
 * @param {String} key
 * @param {Object} animationInfo
 *
 * @private
 * @memberof Grid
 */
function addAnimation(key, animationInfo) {
	if (this[propertyNames.activeAnimations].size === 0) {
		// console.log('Starting animations');
		performAnimations.call(this);
	}

	animationInfo.animation.onTransitionDone(this[propertyNames.boundHandlers].transitionDone);
	this[propertyNames.activeAnimations].set(key, animationInfo);
}

/**
 *
 *
 */
function clearAnimations() {
	clearTimeout(this[propertyNames.transitionTimeoutId]);
	this[propertyNames.activeAnimations].clear();
}

/**
 *
 *
 */
function performAnimations() {
	const
		animations = this[propertyNames.activeAnimations];

	animations.forEach((value, key) => {
		const
			color = value.animation.shift();
		drawCell.call(this, value.column, value.row, value.walls, color);
	});

	this[propertyNames.transitionTimeoutId] = setTimeout(() => {
		performAnimations.call(this);
	}, transitionInterval);
}

/**
 *
 *
 * @param {any} key
 * @returns
 */
function removeAnimation(key) {
	if (!this[propertyNames.activeAnimations].has(key)) {
		return;
	}

	// if (!this[propertyNames.activeAnimations].get(key).animation.transitionDone) {
	// 	console.log(`Removing active animation for location ${key}`);
	// }
	this[propertyNames.activeAnimations].delete(key);
	if (this[propertyNames.activeAnimations].size === 0) {
		// console.log('All animation are done');
		clearTimeout(this[propertyNames.transitionTimeoutId]);
	}
}

/* -- Animation methods ------------- */


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
 *
 * @param {MouseEvent} eventName
 * @param {Number} clientX
 * @param {Number} clientY
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
 * @param {Number} column
 * @param {Number} row
 * @param {Number} walls
 * @param {String} color
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
 * @param {Number} column
 * @param {Number} row
 * @param {String} text
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
 * @param {Number} column
 * @param {Number} row
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

		this[propertyNames.activeAnimations] = new Map();
		this[propertyNames.allowInteraction] = false;
		this[propertyNames.baseElement] = baseElement;
		this[propertyNames.boundHandlers] = {
			click: onClickHandler.bind(this),
			mousedown: onMouseDownHandler.bind(this),
			mousemove: onMouseMoveHandler.bind(this),
			mouseup: onMouseUpHandler.bind(this),
			transitionDone: onTransitionDoneHandler.bind(this)
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
		clearAnimations.call(this);

		/** @type {CanvasRenderingContext2D} */
		const
			context = this[propertyNames.context];

		// Clear the maze that may already have been drawn on the canvas.
		context.clearRect(0, 0, this[propertyNames.baseElement].width, this[propertyNames.baseElement].height);
	}

	drawGrid(gridCells) {
		gridCells.forEach(row => row.forEach(cell => {
			this.setColorForCell(cell.column, cell.row, cell.activeWalls, 'white');
		}));
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
	 *
	 * @memberof Grid
	 */
	setColorForCell(column, row, walls, color) {
		const
			cellKey = getKeyForLocation(column, row);
		removeAnimation.call(this, cellKey);

		drawCell.call(this, column, row, walls, color);
	}

	/**
	 *
	 *
	 * @param {Number} column
	 * @param {Number} row
	 * @param {Number} walls
	 * @param {String} fromColor
	 * @param {String} toColor
	 * @param {Number} [duration=defaultTransitionDuration]
	 *
	 * @memberof Grid
	 */
	setColorForCellAnimated(column, row, walls, fromColor, toColor, duration = defaultTransitionDuration) {
		const
			cellKey = getKeyForLocation(column, row),
			existingAnimation = this[propertyNames.activeAnimations].get(cellKey);
		if (!isNil(existingAnimation)) {
			// const
			// 	newFromColor = existingAnimation.animation.currentColor;
			// console.log(`Changing fromColor for location ${cellKey}, ${fromColor} -> ${newFromColor}`);
			fromColor = existingAnimation.animation.currentColor;
			existingAnimation.animation.offTransitionDone(this[propertyNames.boundHandlers].transitionDone);
		}

		const
			animation = new ColorTransition(cellKey, fromColor, toColor, duration);

		addAnimation.call(this, cellKey, {
			animation,
			column,
			row,
			walls
		});

		// console.log(`Starting animation for location ${cellKey}, ${fromColor} -> ${toColor}`);
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
