/* ========================================================================== *\
	IMPORTS
\* ========================================================================== */

import {
	getRandomInt
} from './utilities.js';

import MazeCell from './cell.js';

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
		currentCell: Symbol('currentCell'),
		entryCell: Symbol('entryCell'),
		eventElement: Symbol('eventElement'),
		exitCell: Symbol('exitCell'),
		matrixSize: Symbol('matrixSize'),
		queue: Symbol('queue')
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
 * Creates an instance of MazeCell for the provided coordinates.
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
function dispatchStepTaken(cell) {
	dispatchEvent(this[propertyNames.eventElement], eventNames.stepTaken, {
		cell: cell,
		walls: cell.activeWalls
	});
}

/**
 *
 *
 * @param {any} cell
 */
function getCandidatesForNextPath() {
	let
		firstBacktrack = true,
		unvisitedNeighbors = [];

	// Keep getting unvisited neighbors as long as we have a current cell and
	// there are no unvisited neighboring cells.
	while (this[propertyNames.currentCell] != null && unvisitedNeighbors.length === 0) {
		// Get the unvisited neighbors for the current cell.
		unvisitedNeighbors = getUnvisitedNeighbors.call(this, this[propertyNames.currentCell]);
		if (unvisitedNeighbors.length > 0) {
			break;
		}

		dispatchStepTaken.call(this, this[propertyNames.currentCell]);
		if (firstBacktrack) {
			firstBacktrack = false;
			dispatchStepTaken.call(this, this[propertyNames.currentCell]);
		}
		this[propertyNames.currentCell] = this[propertyNames.queue].pop();
	}

	return unvisitedNeighbors;
}

/**
 *
 *
 * @param {Number} column
 * @returns {Array}
 */
function getCellsForColumn(column) {
	if (column < 0 || column >= this.columns) {
		return [];
	}

	return this[propertyNames.cells].map(rowCells => rowCells[column]);
}

/**
 *
 *
 * @param {Number} row
 * @returns {Array}
 */
function getCellsForRow(row) {
	if (row < 0 || row >= this.rows) {
		return [];
	}

	return this[propertyNames.cells][row];
}

/**
 * Returns an array with the neighbors of the specified cell which haven't
 * yet been visited by the maze generator.
 *
 * @param {MazeCell} cell
 * @returns {Array} An array with unvisited neighbors of the provided cell,
 *          when all neighbors have been visited the result will be an empty
 *          array.
 *
 * @private
 * @memberof Maze
 */
function getUnvisitedNeighbors(cell) {
	const
		// Get the coordinates of the provided cell.
		{ x, y } = cell.coordinate,
		// Get the neighboring cells. Don't worry about creating invalid
		// coordinates, getCell will just return null for invalid coordinates.
		neighbors = [
			this.getCell(x - 1, y),
			this.getCell(x + 1, y),
			this.getCell(x, y - 1),
			this.getCell(x, y + 1)
		];

	// Filter the array with neighbors to remove all null objects, due to
	// invalid coordinates, and cells which have already been visisted by the
	// maze generator.
	return neighbors.filter(neighbor => (neighbor != null) && !neighbor.isVisited);
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

		return this[propertyNames.exitCell].cell;
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
	 *
	 *
	 * @param {any} cell
	 * @memberof Maze
	 */
	checkForExit(cell) {
		if (cell.outerWalls === MazeCell.sides.none) {
			return;
		}

		if (
			this[propertyNames.exitCell] != null &&
			this[propertyNames.exitCell].length >= this[propertyNames.queue].length
		) {
			return;
		}

		this[propertyNames.exitCell] = {
			cell: cell,
			length: this[propertyNames.queue].length
		}
	}

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
			randomSide = getRandomInt(0, 3);
		let
			cells;

		switch (randomSide) {
		case 0:
			cells = getCellsForRow.call(this, 0);
			break;
		case 1:
			cells = getCellsForColumn.call(this, this.columns - 1);
			break;
		case 2:
			cells = getCellsForRow.call(this, this.rows - 1);
			break;
		case 3:
			cells = getCellsForColumn.call(this, 0);
			break;
		}

		const
			randomIndex = getRandomInt(0, cells.length - 1),
			randomCell = cells[randomIndex];

		randomCell.removeRandomOuterWall();
		randomCell.isEntryOrExit = true;

		this[propertyNames.entryCell] = randomCell;

		return randomCell;
	}

	/**
	 *
	 *
	 * @param {any} [columns=this.columns]
	 * @param {any} [rows=this.rows]
	 * @memberof Maze
	 */
	generateMaze(columns = this.columns, rows = this.rows) {
		this[propertyNames.matrixSize] = {
			columns,
			rows
		};

		this[propertyNames.cells] = createMatrix.call(this, (x, y) => createMazeCell.call(this, x, y));

		const
			stack = [];
		this[propertyNames.queue] = stack;
		this[propertyNames.exitCell] = null;

		this[propertyNames.currentCell] = this.getRandomStartCell();
		let
			counter = 0;

		while (this[propertyNames.currentCell] != null) {
			this[propertyNames.currentCell].order = counter++;
			this[propertyNames.currentCell].markAsVisited();
			this.checkForExit(this[propertyNames.currentCell]);

			const
				candidates = getCandidatesForNextPath.call(this);

			// When there are no more candidates, there is nothing else to do in
			// this iteration of the while.
			if (candidates.length === 0) {
				continue;
			}

			stack.push(this[propertyNames.currentCell]);
			const
				randomIndex = getRandomInt(0, candidates.length - 1),
				nextCell = candidates[randomIndex];

			this[propertyNames.currentCell].createPathTo(nextCell);

			dispatchStepTaken.call(this, this[propertyNames.currentCell]);

			this[propertyNames.currentCell] = nextCell;
		}

		// logCells.call(this);
		this[propertyNames.exitCell].cell.removeRandomOuterWall();
		this[propertyNames.exitCell].cell.isEntryOrExit = true;
		dispatchStepTaken.call(this, this[propertyNames.exitCell].cell);
	}

	/* == PUBLIC METHODS ==================================================== */
}



/* ========================================================================== *\
	EXPORTS
\* ========================================================================== */

export default Maze;

/* == EXPORTS =============================================================== */
