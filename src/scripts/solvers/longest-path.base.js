/* ========================================================================== *\
	IMPORTS
\* ========================================================================== */

import {
	flatten
} from '../utilities/utilities.js';

/* == IMPORTS =============================================================== */



/* ========================================================================== *\
	PRIVATE VARIABLES
\* ========================================================================== */

const
	performanceInfo = {
		discovery: {
			end: 'lp-discovery-end',
			name: 'lp-discovery',
			start: 'lp-discovery-start'
		},
		overall: {
			end: 'lp-overall-end',
			name: 'lp-overall',
			start: 'lp-overall-start'
		}
	},

	propertyNames = {
		mazeCells: Symbol('mazeCells'),
		potentialEntryCells: Symbol('potentialEntryCells'),
		solution: Symbol('solution')
	};

/* == PRIVATE VARIABLES ===================================================== */



/* ========================================================================== *\
	PUBLIC API
\* ========================================================================== */

class LongestPathFinder {
	/* ====================================================================== *\
		CONSTRUCTOR
	\* ====================================================================== */
	constructor() {
		//
	}
	/* == CONSTRUCTOR ======================================================= */



	/* ====================================================================== *\
		PROTECTED PROPERTIES
	\* ====================================================================== */

	/* ---------------------------------- *\
		_emptySolution (read-only)
	\* ---------------------------------- */
	get _emptySolution() {
		const
			result = Object.create(null);
		result.fromLocation = null;
		result.toCell = null;
		result.path = [];

		return result;
	}
	/* -- _emptySolution (read-only) ---- */


	/* ---------------------------------- *\
		_potentialEntryCells
	\* ---------------------------------- */
	get _potentialEntryCells() {
		return this[propertyNames.potentialEntryCells];
	}
	set _potentialEntryCells(cells) {
		this[propertyNames.potentialEntryCells] = cells;
	}
	/* -- _potentialEntryCells ---------- */


	/* ---------------------------------- *\
		_solution
	\* ---------------------------------- */
	get _solution() {
		return this[propertyNames.solution];
	}
	set _solution(value) {
		this[propertyNames.solution] = value;
	}
	/* -- _solution --------------------- */

	/* == PROTECTED PROPERTIES ============================================== */


	/* ====================================================================== *\
		INSTANCE PROPERTIES
	\* ====================================================================== */

	/* ---------------------------------- *\
		discoveryDurations (read-only)
	\* ---------------------------------- */
	get discoveryDurations() {
		return performance.getEntriesByName(performanceInfo.discovery.name);
	}
	/* -- discoveryDurations (read-only) - */


	/* ---------------------------------- *\
		maze (read-only)
	\* ---------------------------------- */
	get mazeCells() {
		return this[propertyNames.mazeCells];
	}
	/* -- maze (read-only) ---------- */


	/* ---------------------------------- *\
		overallDuration (read-only)
	\* ---------------------------------- */
	get overallDuration() {
		return performance.getEntriesByName(performanceInfo.overall.name);
	}
	/* -- overallDuration (read-only) --- */

	/* == INSTANCE PROPERTIES =============================================== */



	/* ====================================================================== *\
		PROTECTED METHODS
	\* ====================================================================== */
	/**
	 * Clears the performance data from the previous solution.
	 *
	 * @protected
	 * @memberof LongestPathFinder
	 */
	_clearPerformanceData() {
		performance.clearMarks();
		performance.clearMeasures();
	}

	/**
	 * Returns the cell in the maze that have a chance of being the starting
	 * point of the longst path. A cell may be the starting point of the longest
	 * path when:
	 * - It is located on the outer edge of the maze;
	 * - It doesn't have just a top and bottom wall;
	 * - It doesn't have just a left and right wall.
	 *
	 * @param {Array} cells
	 *
	 * @returns {Array}
	 */
	_determinePotentialEntryCells() {
		const
			flatCells = flatten(this.mazeCells);

		// Return the cells that are located on the outside of the maze and that are
		// not a vertical or horizontal corridor. Cells with two walls opposite of
		// each other are never the start or end point for a longest path.
		return flatCells.filter(cell => {
			return (
				cell.outerWalls !== 0 &&
				cell.activeWalls !== 5 &&
				cell.activeWalls !== 10
			)
		});
	}

	/**
	 *
	 *
	 * @returns {Cell}
	 * @memberof LongestPathFinder
	 */
	_shiftPotentialEntryCell() {
		// Get the first cell in the set.
		const
			cells = this._potentialEntryCells.values(),
			startCell = cells.next().value;

		// Remove the first element from the set, it no longer has to be processed
		// by another thread.
		this._potentialEntryCells.delete(startCell);

		// Return the cell.
		return startCell;
	}

	/**
	 *
	 *
	 * @param {Array} pathCells
	 *
	 * @returns {Number} The method returns the number of cells have been pruned
	 *          the set of potential entry cells.
	 *
	 * @private
	 * @memberof LongestPathFinder
	 */
	_prunePotentialEntryCells(pathCells) {
		let
			counter = 0,
			initSize = this._potentialEntryCells.size;

		// Iterate over all the cells in the longest path.
		for (let index = 0; index < pathCells.length; index++) {
			const
				location = pathCells[index].location,
				cell = this.mazeCells[location.row][location.column];

			// When the cell has an outer wall, exactly 2 neighbors, and is still in
			// the set of cells to determine the longest path for it can be removed
			// from the set.
			if (
				cell.outerWalls !== 0 &&
				cell.numberOfNeighbors === 2 &&
				this._potentialEntryCells.has(cell)
			) {
				this._potentialEntryCells.delete(cell);
				counter++;
			}
		}

		// if (counter > 0) {
		// 	console.log(`Pruning for cell ${pathCells[0].id} has removed ${counter} entry cells`);
		// }

		// if (
		// 	this._potentialEntryCells.size !== initSize
		// ) {
		// 	console.log(`Potential start cells pruned from ${initSize} to ${this._potentialEntryCells.size}`);
		// }

		return counter;
	}

	/* == PROTECTED METHODS ================================================= */



	/* ====================================================================== *\
		PUBLIC METHODS
	\* ====================================================================== */

	solve(maze) {
		this[propertyNames.mazeCells] = maze;

		// Initialize the solution property. It should contain an empty path so
		// the first discovered path will be accepted as having the
		// longest length.
		this[propertyNames.solution] = this._emptySolution;

		// Clear any previous performance data there is.
		this._clearPerformanceData();
	}

	/* == PUBLIC METHODS ==================================================== */
}

/* == PUBLIC API ============================================================ */



/* ========================================================================== *\
	EXPORTS
\* ========================================================================== */

export default LongestPathFinder;

/* == EXPORTS =============================================================== */
