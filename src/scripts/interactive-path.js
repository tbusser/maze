/*
 |------------------------------------------------------------------------------
 | Interactive Path
 |------------------------------------------------------------------------------
 |
 | This class allows the visitor to mark cells / draw a path on the visual
 | maze.
 |
 |*/

/* ========================================================================== *\
	PRIVATE VARIABLES
\* ========================================================================== */

const
	propertyNames = {
		activeCells: Symbol('activeCells'),
		baseElement: Symbol('baseElement'),
		currentCell: Symbol('currentCell'),
		grid: Symbol('grid'),
		maze: Symbol('maze'),
		mouseDownHandler: Symbol('mouseDownHandler'),
		mouseMoveHandler: Symbol('mouseMoveHandler'),
		mouseUpHandler: Symbol('mouseUpHandler'),
		state: Symbol('state')
	},

	states = {
		running: 1,
		stopped: 0
	};

/* == PRIVATE VARIABLES ===================================================== */



/* ========================================================================== *\
	EVENT HANDLING
\* ========================================================================== */

/**
 *
 *
 * @param {MouseEvent} event
 */
function onMouseDownHandler(event) {
	const
		{ column, row} = event.detail,
		cell = getCellForLocation.call(this, column, row);

	// console.log(`[IP.mousedown] (${column},${row})`);

	// Store the cell represented by the element in the private field.
	this[propertyNames.currentCell] = cell;

	togglePathColor.call(this, cell);

	// // Add the events to the base element so we can track the mouse movement and
	// // detect when the mouse button has been released.
	this.grid.onCellMouseUp(this[propertyNames.mouseUpHandler]);
	this.grid.onCellMouseOver(this[propertyNames.mouseMoveHandler]);
}

/**
 *
 *
 * @param {MouseEvent} event
 */
function onMouseMoveHandler(event) {
	const
		{ column, row } = event.detail,
		previousCell = this[propertyNames.currentCell],
		cell = getCellForLocation.call(this, column, row);

	// When the cell the mouse is over represents the same cell as the previous
	// cell there is no further action needed. There is also nothing else to do
	// when there is no direct path between the two cells.
	if (
		cell === previousCell ||
		!cell.hasPathTo(previousCell)
	) {
		return;
	}

	// console.log(`[IP.mousemove] (${column},${row})`);

	const
		cellKey = getKeyForLocation(column, row);
	if (this[propertyNames.activeCells].has(cellKey)) {
		togglePathColor.call(this, previousCell);
	} else {
		togglePathColor.call(this, cell);
	}

	// Store the cell we've just processed.
	this[propertyNames.currentCell] = cell;
}

/**
 *
 *
 * @param {MouseEvent} event
 */
function onMouseUpHandler(event) {
	// const
	// 	{ column, row } = event.detail;

	// console.log(`[IP.mouseup] (${column},${row})`);
	this.grid.offCellMouseUp(this[propertyNames.mouseMoveHandler]);
	this.grid.offCellMouseOver(this[propertyNames.mouseMoveHandler]);
}

/* == EVENT HANDLING ======================================================== */



/* ========================================================================== *\
	PRIVATE METHODS
\* ========================================================================== */

/**
 *
 *
 * @param {HTMLElement} element
 */
function getCellForLocation(column, row) {
	const
		cell = this[propertyNames.maze].getCell(column, row);

	return cell;
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

/**
 *
 *
 * @param {any} cell
 */
function togglePathColor(cell) {
	const
		{ column, row} = cell,
		cellKey = getKeyForLocation(column, row);

	if (this[propertyNames.activeCells].has(cellKey)) {
		this[propertyNames.activeCells].delete(cellKey);
		this.grid.setColorForCellAnimated(column, row, cell.activeWalls, 'skyblue', 'white');
	} else {
		this[propertyNames.activeCells].set(cellKey, true);
		this.grid.setColorForCellAnimated(column, row, cell.activeWalls, 'white', 'skyblue');
	}
}

/* == PRIVATE METHODS ======================================================= */



/* ========================================================================== *\
	PUBLIC API
\* ========================================================================== */

class InteractivePath {
	/* ====================================================================== *\
		CONSTRUCTOR
	\* ====================================================================== */
	constructor(baseElement) {
		if (baseElement == null) {
			throw 'Unable to create instance of InteractivePath, no base element provided';
		}

		this[propertyNames.activeCells] = new Map();
		this[propertyNames.baseElement] = baseElement;
		this[propertyNames.mouseDownHandler] = onMouseDownHandler.bind(this);
		this[propertyNames.mouseMoveHandler] = onMouseMoveHandler.bind(this);
		this[propertyNames.mouseUpHandler] = onMouseUpHandler.bind(this);

		this[propertyNames.state] = states.stopped;
	}
	/* == CONSTRUCTOR ======================================================= */



	/* ====================================================================== *\
		INSTANCE PROPERTIES
	\* ====================================================================== */

	/* ---------------------------------- *\
		baseElement (read-only)
	\* ---------------------------------- */
	/**
	 *
	 * @type {HTMLElement}
	 * @readonly
	 * @memberof InteractivePath
	 */
	get baseElement() {
		return this[propertyNames.baseElement];
	}
	/* -- baseElement (read-only) ------- */


	/* ---------------------------------- *\
		grid
	\* ---------------------------------- */
	get grid() {
		return this[propertyNames.grid];
	}
	set grid(gridInstance) {
		this[propertyNames.grid] = gridInstance;
	}
	/* -- grid ====---------------------- */


	/* ---------------------------------- *\
		state (read-only)
	\* ---------------------------------- */
	get state() {
		return this[propertyNames.state]
	}
	/* -- state (read-only) ====---------- */

	/* == INSTANCE PROPERTIES =============================================== */



	/* ====================================================================== *\
		PUBLIC METHODS
	\* ====================================================================== */

	clean() {
		this[propertyNames.activeCells].forEach(cell => {
			togglePathColor.call(this, cell);
		});
	}

	start(maze) {
		if (this.state === states.running) {
			return false;
		}

		this[propertyNames.activeCells].clear();
		this[propertyNames.maze] = maze;
		this[propertyNames.state] = states.running;
		this[propertyNames.grid].onCellMouseDown(this[propertyNames.mouseDownHandler]);
	}

	stop() {
		if (this.state === states.stopped) {
			return false;
		}

		this[propertyNames.currentCell] = null;
		this[propertyNames.grid].offCellMouseDown(this[propertyNames.mouseDownHandler]);
		this[propertyNames.grid].offCellMouseOver(this[propertyNames.mouseMoveHandler]);
		this[propertyNames.grid].offCellMouseUp(this[propertyNames.mouseUpHandler]);
		this[propertyNames.state] = states.stopped;
	}

	/* == PUBLIC METHODS ==================================================== */
}

/* == PUBLIC API ============================================================ */



/* ========================================================================== *\
	EXPORTS
\* ========================================================================== */

export default InteractivePath;

/* == EXPORTS =============================================================== */
