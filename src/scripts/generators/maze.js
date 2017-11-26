/* ========================================================================== *\
	IMPORTS
\* ========================================================================== */

import {
	getRandomInt
} from '../utilities/utilities.js';

import LongestPathSolver from '../solvers/longest-path.js';
import MazeCell from '../cell.js';

/* == IMPORTS =============================================================== */



/* ========================================================================== *\
	PRIVATE VARIABLES
\* ========================================================================== */

const
	eventNames = {
		stepTaken: 'onsteptaken'
	},

	propertyNames = {
		cells: Symbol('cells'),
		entryCell: Symbol('entryCell'),
		eventElement: Symbol('eventElement'),
		exitCell: Symbol('exitCell'),
		matrixSize: Symbol('matrixSize')
	};

/* == PRIVATE VARIABLES ===================================================== */



/* ========================================================================== *\
	PRIVATE METHODS
\* ========================================================================== */

/**
 * Creates a matrix for the size of the maze.
 *
 * @param {Function} cellCallback A method to be called for each created cell.
 *        Whatever gets returned will be used as the cell data.
 *
 * @private
 * @memberof Maze
 */
function createMatrix(cellCallback) {
	return [...Array(this.rows).keys()].map(y => [...Array(this.columns).keys()].map(x => cellCallback(x, y)));
}

/**
 * Creates an instance of MazeCell for the provided location.
 *
 * @param {Number} x The column in which the cell should be located.
 * @param {Number} y The row in which the cell should be located.
 *
 * @returns {MazeCell} Returns an instance of MazeCell for the provided column
 *          and row.
 *
 * @private
 * @memberof Maze
 */
function createMazeCell(x, y) {
	/** @type {MazeCell} */
	const
		cell = new MazeCell(x, y);

	// Check if the cell is located in the first or last column, and if so mark
	// the matching side as an outside wall.
	if (x === 0) {
		cell.setOuterWall(MazeCell.sides.left);
	} else if (x === this.columns - 1) {
		cell.setOuterWall(MazeCell.sides.right);
	}

	// Check if the cell is located in the first or last row, and if so mark
	// the matching side as an outside wall.
	if (y === 0) {
		cell.setOuterWall(MazeCell.sides.top);
	} else if (y === this.rows - 1) {
		cell.setOuterWall(MazeCell.sides.bottom);
	}

	// Return the cell instance.
	return cell;
}

/**
 *
 *
 * @param {HTMLElement} eventElement
 * @param {String} eventName
 * @param {Object} data
 */
function dispatchEvent(eventElement, eventName, data = null) {
	const
		event = new CustomEvent(eventName, { detail: data });
	eventElement.dispatchEvent(event);
}

/**
 *
 *
 * @param {any} cell
 */
function dispatchStepTaken(cell, state = 'discovery') {
	dispatchEvent(this[propertyNames.eventElement], eventNames.stepTaken, {
		cell,
		state,
		walls: cell.activeWalls
	});
}

/**
 *
 *
 * @private
 * @memberof Maze
 */
function findEntryAndExit() {
	const
		solver = new LongestPathSolver(),
		longestPath = solver.solve(this),
		entryLocation = longestPath.fromCell,
		exitLocation = longestPath.toCell,
		entryCell = this.getCell(entryLocation.column, entryLocation.row),
		exitCell = this.getCell(exitLocation.column, exitLocation.row);

	entryCell.removeRandomOuterWall();
	exitCell.removeRandomOuterWall();

	this[propertyNames.entryCell] = entryCell;
	this[propertyNames.exitCell] = exitCell;
}

/**
 *
 *
 * @param {any} {column, row}
 *
 * @returns
 */
function getKeyForCell({column, row}) {
	return `${ column }_${ row }`;
}

/**
 *
 *
 * @param {Cell} cell
 * @param {Set} visitedCells
 */
function getRandomUnvisitedLocation(cell, visitedCells) {
	const
		// Get the neighboring cells. Don't worry about creating invalid
		// locations, getCell will just return null for invalid locations.
		neighborsLocations = cell.getNeighborsLocations(),
		validLocations = neighborsLocations.filter(location => {
			const
				{ column, row } = location;

			return (
				(column >= 0 && column < this.columns) &&
				(row >= 0 && row < this.rows) &&
				!visitedCells.has(getKeyForCell(location))
			);
		});

	if (validLocations.length === 0) {
		return null;
	} else if (validLocations.length === 1) {
		return validLocations[0];
	}

	const
		randomIndex = getRandomInt(0, validLocations.length - 1);

	return validLocations[randomIndex];
}

/**
 * Method which can be used for debugging maze creation. It will log a table to
 * console, each cell will contain a sequence number to indicate when it was
 * added to the maze.
 *
 * @private
 * @memberof Maze
 */
// eslint-disable-next-line
function logCells() {
	const
		table = createMatrix.call(this, (x, y) => {
			const
				cellOrder = this.getCell(x, y).order;

			return (cellOrder === undefined)
				? ''
				: this.getCell(x, y).order
		});

	// eslint-disable-next-line no-console
	console.table(table);
}

/* == PRIVATE METHODS ======================================================= */



class Maze {
	/* ====================================================================== *\
		CONSTRUCTOR
	\* ====================================================================== */
	constructor(rows = 5, columns = 5) {
		this[propertyNames.matrixSize] = {
			columns,
			rows
		};

		this[propertyNames.eventElement] = document.createElement('div');
	}
	/* == CONSTRUCTOR ======================================================= */



	/* ====================================================================== *\
		INSTANCE PROPERTIES
	\* ====================================================================== */

	/* ---------------------------------- *\
		cells (read-only)
	\* ---------------------------------- */
	get cells() {
		return this[propertyNames.cells];
	}
	/* -- cells (read-only) ------------- */


	/* ---------------------------------- *\
		columns (read-only)
	\* ---------------------------------- */
	/**
	 * The number of columns the maze has.
	 *
	 * @type {Number}
	 * @readonly
	 * @memberof Maze
	 */
	get columns() {
		return this[propertyNames.matrixSize].columns;
	}
	/* -- columns (read-only) ----------- */


	/* ---------------------------------- *\
		entryCell (read-only)
	\* ---------------------------------- */
	get entryCell() {
		return this[propertyNames.entryCell];
	}
	/* -- entryCell (read-only) --------- */


	/* ---------------------------------- *\
		exitCell (read-only)
	\* ---------------------------------- */
	get exitCell() {
		if (this[propertyNames.exitCell] == null) {
			return null;
		}

		return this[propertyNames.exitCell];
	}
	/* -- exitCell (read-only) ---------- */


	/* ---------------------------------- *\
		rows (read-only)
	\* ---------------------------------- */
	/**
	 * The number of rows the maze has.
	 *
	 * @type {Number}
	 * @readonly
	 * @memberof Maze
	 */
	get rows() {
		return this[propertyNames.matrixSize].rows;
	}
	/* -- rows (read-only) -------------- */

	/* == INSTANCE PROPERTIES =============================================== */



	/* ====================================================================== *\
		CALLBACK REGISTRATION
	\* ====================================================================== */

	onStepTaken(callback) {
		this[propertyNames.eventElement].addEventListener(eventNames.stepTaken, callback);
	}

	/* == CALLBACK REGISTRATION ============================================= */



	/* ====================================================================== *\
		PUBLIC METHODS
	\* ====================================================================== */
	/**
	 * Returns the cell for the specified location.
	 *
	 * @param {Number} x The column for the cell to return.
	 * @param {Number} y The row for the cell to return.
	 *
	 * @returns {?MazeCell} The method returns the cell at the requested
	 *          location; when the location is invalid the method will
	 *          return null.
	 *
	 * @memberof Maze
	 */
	getCell(x, y) {
		if (
			x < 0 || x > this.columns - 1 ||
			y < 0 || y > this.rows - 1
		) {
			return null;
		}

		return this[propertyNames.cells][y][x];
	}


	getRandomStartCell() {
		const
			randomColumn = getRandomInt(0, this.columns - 1),
			randomRow = getRandomInt(0, this.rows - 1);

		return this.getCell(randomColumn, randomRow);
	}

	/**
	 *
	 *
	 * @param {any} [columns=this.columns]
	 * @param {any} [rows=this.rows]
	 * @memberof Maze
	 */
	generateMaze(columns = this.columns, rows = this.rows, skipEntryExit = false) {
		this[propertyNames.matrixSize] = {
			columns,
			rows
		};

		this[propertyNames.entryCell] = null;
		this[propertyNames.exitCell] = null;

		this[propertyNames.cells] = createMatrix.call(this, (x, y) => createMazeCell.call(this, x, y));

		const
			visitedCells = new Set(),
			stack = [];

		let
			cell = this.getRandomStartCell();

		while (cell != null) {
			visitedCells.add(getKeyForCell(cell));

			const
				nextCellLocation = getRandomUnvisitedLocation.call(this, cell, visitedCells);

			if (nextCellLocation === null) {
				dispatchStepTaken.call(this, cell, 'backtrack');
				cell = stack.pop();

				continue;
			}

			stack.push(cell);
			const
				nextCell = this.getCell(nextCellLocation.column, nextCellLocation.row);

			cell.createPathTo(nextCell);
			dispatchStepTaken.call(this, cell);
			cell = nextCell;
		}

		if (!skipEntryExit) {
			findEntryAndExit.call(this);
		}
	}

	getSerializableMaze() {
		const
			result = [];

		this.cells.forEach(row => {
			result.push(row.map(cell => {
				return {
					id: cell.id,
					location: cell.location,
					numberOfNeighbors: cell.numberOfNeighbors,
					outerWalls: cell.outerWalls,
					paths: cell.paths
				}
			}));
		});

		return result;
	}

	/* == PUBLIC METHODS ==================================================== */
}



/* ========================================================================== *\
	EXPORTS
\* ========================================================================== */

export default Maze;

/* == EXPORTS =============================================================== */
