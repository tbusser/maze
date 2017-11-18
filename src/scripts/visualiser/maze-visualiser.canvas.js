/* ========================================================================== *\
	IMPORTS
\* ========================================================================== */

import {
	isNil
} from '../utilities.js';

import Cell from '../cell.js';
import CellAnimation from './cell-animation.js';
import VisualiserBase from './maze-visualiser.base.js';

/* == IMPORTS =============================================================== */



/* ========================================================================== *\
	PRIVATE VARIABLES
\* ========================================================================== */

const
	transitionDuration = 500,

	propertyNames = {
		cells: Symbol('cells'),
		context: Symbol('context'),
		previousCell: Symbol('previousCell')
	},

	selectors = {
		canvas: '.js-output'
	};

/* == PRIVATE VARIABLES ===================================================== */



/* ========================================================================== *\
	PRIVATE METHODS
\* ========================================================================== */

/**
 * @typedef {CellInfo}
 *
 * @property {CellAnmimation} animation The animation object for the cell.
 */

/**
 *
 *
 */
function clearAnimations() {
	this[propertyNames.cells].forEach(cellInfo => {
		if (!isNil(cellInfo.animation)) {
			cellInfo.animation.pause();
		}
	});

	this[propertyNames.cells].clear();
}

/**
 *
 *
 * @param {Cell} cell
 * @returns {String}
 */
function getAnimationKeyForCell(cell) {
	return `${cell.column}_${cell.row}`;
}

/**
 * Returns the 2D rendering context within a specific element.
 *
 * @param {HTMLElement} baseElement
 *
 * @returns {?CanvasRenderingContext2D} Returns the 2D rendering context for the
 *          Canvas element within the provided base element. When there is no
 *          Canvas element within the provided base element the result will
 *          be null.
 */
function getContext(baseElement) {
	/** @type {HTMLCanvasElement} */
	const
		canvas = baseElement.querySelector(selectors.canvas);
	if (canvas === null) {
		return null;
	}

	return canvas.getContext('2d');
}

/**
 *
 *
 * @param {any} side
 * @param {any} isEntry
 */
// eslint-disable-next-line
function getSymbolForSide(side, isEntry) {
	switch (side) {
	case Cell.sides.bottom:
		return (isEntry) ? '⬆' : '⬇';

	case Cell.sides.left:
		return (isEntry) ? '➡' : '︎︎︎︎⬅';

	case Cell.sides.right:
		return (isEntry) ? '⬅' : '➡︎︎︎︎';

	case Cell.sides.top:
		return (isEntry) ? '⬇' : '⬆';
	}
}

/**
 *
 *
 * @param {any} cell
 * @param {any} side
 * @param {boolean} [outer=false]
 * @returns
 */
function hasWall(cell, side, outer = false) {
	if (outer) {
		return (cell.outerWalls & side) === side;
	} else {
		return (cell.activeWalls & side) === side;
	}
}
/**
 *
 *
 * @param {any} cell
 * @param {any} isEntry
 */
function markCellAsEntryExit(cell, isEntry) {
	for (let key in Cell.sides) {
		if (!Cell.sides.hasOwnProperty(key)) {
			continue;
		}

		const
			side = Cell.sides[key];

		if (
			hasWall(cell, side, true) &&
			!hasWall(cell, side)
		) {
			const
				context = this[propertyNames.context],
				rectX = (cell.column * this.cellSize) + (this.cellSize / 2),
				rectY = (cell.row * this.cellSize) + (this.cellSize / 2);

			context.font = '20px Arial';
			context.textAlign = 'center';
			context.textBaseline = 'middle';
			context.fillStyle = '#000000';
			context.fillText(getSymbolForSide(side, isEntry), rectX, rectY);
		}
	}
}

/**
 *
 *
 * @param {CanvasRenderingContext2D} context
 */
function restorePreviousCellVisualState(context) {
	const
		{ column, row } = this[propertyNames.previousCell].cell.location,
		walls = this[propertyNames.previousCell].walls,
		animationKey = getAnimationKeyForCell(this[propertyNames.previousCell].cell);

	/** @type {CellAnimation} */
	let
		{ animation, isFirst } = this[propertyNames.cells].get(animationKey);

	animation.pause();
	animation = new CellAnimation({
		fromColor: animation.colorAtCurrentStop,
		toColor: (isFirst) ? 'blue' : 'white',
		duration: transitionDuration
	}, {
		x: column * this.cellSize,
		y: row * this.cellSize,
		size: this.cellSize,
		context: context,
		walls: walls
	});

	animation.run();
	this[propertyNames.cells].set(animationKey, {
		animation,
		isFirst
	});
}

/**
 *
 *
 */
function showEntryAndExitCell() {
	setTimeout(() => {
		markCellAsEntryExit.call(this, this.mazeConfiguration.entryCell, true);
		markCellAsEntryExit.call(this, this.mazeConfiguration.exitCell, false);
	}, 500);
}

/* == PRIVATE METHODS ======================================================= */


/* ========================================================================== *\
	PUBLIC API
\* ========================================================================== */

class MazeVisualiserCanvas extends VisualiserBase {
	/* ====================================================================== *\
		CONSTRUCTOR
	\* ====================================================================== */
	constructor(baseElement) {
		super(baseElement);

		this[propertyNames.cells] = new Map();
		this[propertyNames.context] = getContext(baseElement);
	}
	/* == CONSTRUCTOR ======================================================= */



	/* ====================================================================== *\
		OVERRIDDEN METHODS
	\* ====================================================================== */

	__finalizeVisualisation() {
		showEntryAndExitCell.call(this);
	}

	__initVisualisation(rows, columns) {
		clearAnimations.call(this);

		/** @type {CanvasRenderingContext2D} */
		const
			canvas = this.baseElement.querySelector(selectors.canvas);
		if (
			canvas === null ||
			isNil(this[propertyNames.context])
		) {
			return;
		}

		// Update the dimensions of the canvas.
		canvas.height = (rows * this.cellSize);
		canvas.width = (columns * this.cellSize);

		// Clear the maze that may already have been drawn on the canvas.
		this[propertyNames.context].clearRect(0, 0, canvas.width, canvas.height);
		// Clear the previously drawn cell.
		this[propertyNames.previousCell] = null;
	}

	__visualiseStep(historyRecord) {
		/** @type {CanvasRenderingContext2D} */
		const
			context = this[propertyNames.context],
			{ cell, walls } = historyRecord,
			cellX = cell.column * this.cellSize,
			cellY = cell.row * this.cellSize;
		if (isNil(context)) {
			return;
		}

		// When there is a previous history record. we need to restore this cell
		// from it's "current cell" state to its "natural" state.
		if (!isNil(this[propertyNames.previousCell])) {
			restorePreviousCellVisualState.call(this, context);
		}
		this[propertyNames.previousCell] = historyRecord;

		const
			animationKey = getAnimationKeyForCell(cell),
			hasAnimation = (this[propertyNames.cells].has(animationKey));
		let
			animation,
			transitionInfo;

		if (hasAnimation) {
			const
				oldAnimation = this[propertyNames.cells].get(animationKey).animation;
			oldAnimation.pause();
			transitionInfo = {
				fromColor: oldAnimation.colorAtCurrentStop,
				toColor: 'red',
				duration: transitionDuration// - oldAnimation.timeLapsed
			}
		} else {
			transitionInfo = {
				fromColor: 'white',
				toColor: 'red',
				duration: transitionDuration
			};
		}

		animation = new CellAnimation(transitionInfo, {
			x: cellX,
			y: cellY,
			size: this.cellSize,
			context: context,
			walls: walls
		});
		this[propertyNames.cells].set(animationKey, {
			animation,
			isFirst: !hasAnimation
		});
		animation.run();
	}

	/* == OVERRIDDEN METHODS ================================================ */
}

/* == PUBLIC API ============================================================ */



/* ========================================================================== *\
	EXPORTS
\* ========================================================================== */

export default MazeVisualiserCanvas;

/* == EXPORTS =============================================================== */
