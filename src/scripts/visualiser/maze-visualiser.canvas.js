/* ========================================================================== *\
	IMPORTS
\* ========================================================================== */

import {
	isNil
} from '../utilities/utilities.js';

import Cell from '../cell.js';
import Grid from '../grid/grid.base.js';
import VisualiserBase from './maze-visualiser.base.js';

/* == IMPORTS =============================================================== */



/* ========================================================================== *\
	PRIVATE VARIABLES
\* ========================================================================== */

const
	propertyNames = {
		cells: Symbol('cells'),
		context: Symbol('context'),
		grid: Symbol('grid'),
		previousRecord: Symbol('previousCell')
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
 * @param {Cell} cell
 *
 * @returns {String}
 */
function getKeyForCell(cell) {
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
				text = getSymbolForSide(side, isEntry);
			this[propertyNames.grid].setTextForCell(cell.column, cell.row, text);
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
		{ cell, walls } = this[propertyNames.previousRecord],
		cellKey = getKeyForCell(cell),
		toColor = this[propertyNames.cells].get(cellKey).color;

	this[propertyNames.grid].setColorForCellAnimated(cell.column, cell.row, walls, 'red', toColor);
}

/**
 *
 *
 */
function showEntryAndExitCell() {
	markCellAsEntryExit.call(this, this.mazeConfiguration.entryCell, true);
	markCellAsEntryExit.call(this, this.mazeConfiguration.exitCell, false);
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
		this[propertyNames.grid] = new Grid(baseElement.querySelector(selectors.canvas));
	}
	/* == CONSTRUCTOR ======================================================= */



	/* ====================================================================== *\
		INSTANCE PROPERTIES
	\* ====================================================================== */

	/* ---------------------------------- *\
		grid (read-only)
	\* ---------------------------------- */
	get grid() {
		return this[propertyNames.grid];
	}
	/* -- grid (read-only) ---------- */

	/* == INSTANCE PROPERTIES =============================================== */



	/* ====================================================================== *\
		OVERRIDDEN METHODS
	\* ====================================================================== */

	__finalizeVisualisation() {
		const
			pCell = this[propertyNames.previousRecord].cell,
			pWalls = this[propertyNames.previousRecord].walls;
		this[propertyNames.grid].setColorForCell(pCell.column, pCell.row, pWalls, 'white');
		showEntryAndExitCell.call(this);
		this[propertyNames.grid].allowInteraction = true;
	}

	__initVisualisation(rows, columns) {
		this[propertyNames.grid].allowInteraction = false;
		this[propertyNames.grid].setupGrid(columns, rows, this.cellSize);
		// Clear the previously drawn cell.
		this[propertyNames.cells].clear();
		this[propertyNames.previousRecord] = null;
	}

	__visualiseStep(historyRecord) {
		/** @type {CanvasRenderingContext2D} */
		const
			context = this[propertyNames.context];

		// When there is a previous history record. we need to restore this cell
		// from it's "current cell" state to its "natural" state.
		if (!isNil(this[propertyNames.previousRecord])) {
			restorePreviousCellVisualState.call(this, context);
		}
		this[propertyNames.previousRecord] = historyRecord;

		const
			{ cell, walls } = historyRecord,
			cellKey = getKeyForCell(cell),
			hasKey = this[propertyNames.cells].has(cellKey),
			fromColor = (hasKey) ? 'blue' : 'white';

		this[propertyNames.cells].set(cellKey, {
			color: (hasKey) ? 'white' : 'blue'
		});
		this[propertyNames.grid].setColorForCellAnimated(cell.column, cell.row, walls, fromColor, 'red');
	}

	/* == OVERRIDDEN METHODS ================================================ */
}

/* == PUBLIC API ============================================================ */



/* ========================================================================== *\
	EXPORTS
\* ========================================================================== */

export default MazeVisualiserCanvas;

/* == EXPORTS =============================================================== */
