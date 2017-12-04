/* ========================================================================== *\
	IMPORTS
\* ========================================================================== */

import Deferred from '../utilities/deferred.js';

import {
	defer,
	getRandomInt
} from '../utilities/utilities.js';

import LongestPathFinderBase from './longest-path.base.js';

/* == IMPORTS =============================================================== */

/**
 * @typedef {Location}
 * @property {Number} column
 * @property {Number} row
 */

/**
 * @typedef LongestPath
 * @property {Location} fromLocation
 * @property {Object} toCell
 * @property {Array} path
 */

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
		deferred: Symbol('deferred')
	};

/* == PRIVATE VARIABLES ===================================================== */



/* ========================================================================== *\
	PRIVATE METHODS
\* ========================================================================== */


/**
 *
 *
 * @param {Cell} cell
 *
 * @returns {LongesPath}
 * @private
 * @memberof LongestPathFinder
 */
// eslint-disable-next-line complexity, require-jsdoc
function getLongestPathForCell(startLocation) {
	const
		visitedCells = new Set(),
		stack = [];

	let
		cell = this.mazeCells[startLocation.row][startLocation.column],
		solution = this._emptySolution;

	performance.mark(performanceInfo.discovery.start);
	while (cell != null) {
		visitedCells.add(cell.id);

		const
			nextCellLocation = getRandomUnvisitedNeighbor(cell, visitedCells);

		if (nextCellLocation === null) {
			if (
				(stack.length + 1) > solution.path.length &&
				cell.outerWalls !== 0
			) {
				const
					path = stack.slice(0);
				path.push(cell);
				solution.fromLocation = startLocation;
				solution.toCell = cell;
				solution.path = path;
			}
			cell = stack.pop();
			continue;
		}

		const
			nextCell = this.mazeCells[nextCellLocation.row][nextCellLocation.column];
		stack.push(cell);
		cell = nextCell;
	}

	performance.mark(performanceInfo.discovery.end);
	performance.measure(performanceInfo.discovery.name, performanceInfo.discovery.start, performanceInfo.discovery.end);

	// Remove potential entry cells that were in the path and are no longer
	// in the running for being the starting point of the longest path.
	this._prunePotentialEntryCells(solution.path);

	return solution;
}


/**
 *
 *
 * @param {Cell} cell
 * @param {Array} maze
 * @param {Set} visitedCells
 *
 * @returns {Location}
 *
 * @private
 * @memberof LongestPath
 */
function getRandomUnvisitedNeighbor(cell, visitedCells) {
	const
		validLocations = [];

	for (let index=0, ubound=cell.paths.length; index<ubound; index++) {
		const
			location = cell.paths[index],
			{ column, row } = location;
		if (!visitedCells.has(`${ column }_${ row }`)) {
			validLocations.push(location)
		}
	}

	// When there are no valid neighbors, return null. In case there is just a
	// single valid neighbor, return it.
	if (validLocations.length === 0) {
		return null;
	} else if (validLocations.length === 1) {
		return validLocations[0];
	}

	const
		// Determine a random index for the array of valid cells.
		randomIndex = getRandomInt(0, validLocations.length - 1);

	// Return the location for the randomly determined index.
	return validLocations[randomIndex];
}

/**
 *
 *
 */
function solveMaze() {
	performance.mark(performanceInfo.overall.start);

	while (this._potentialEntryCellsIds.size > 0) {
		const
			startLocation = this._shiftPotentialEntryCell(),
			solution = getLongestPathForCell.call(this, startLocation);

		if (solution.path.length > this._solution.path.length) {
			this._solution.fromLocation = solution.fromLocation;
			this._solution.toCell = solution.toCell;
			this._solution.path = solution.path.slice(0);
		}
	}

	performance.mark(performanceInfo.overall.end);
	performance.measure(performanceInfo.overall.name, performanceInfo.overall.start, performanceInfo.overall.end);

	this[propertyNames.deferred].resolve(this._solution);
}

/* == PRIVATE METHODS ======================================================= */



/* ========================================================================== *\
	PUBLIC API
\* ========================================================================== */

class LongestPathFinder extends LongestPathFinderBase {
	/* ====================================================================== *\
		PUBLIC METHODS
	\* ====================================================================== */

	/**
	 *
	 *
	 * @param {Maze} maze
	 * @memberof LongestPathFinder
	 */
	solve(maze) {
		super.solve(maze.getSerializableMaze());

		// Initialize the deferred which will be used to signal when the longest
		// path has been found.
		this[propertyNames.deferred] = new Deferred();

		this._potentialEntryCellsIds = new Set(this._determinePotentialEntryCells().map(cell => cell.id));

		defer(() => {
			solveMaze.call(this);
		});

		return this[propertyNames.deferred].promise;
	}

	/* == PUBLIC METHODS ==================================================== */
}
/* == PUBLIC API ============================================================ */



/* ========================================================================== *\
	EXPORTS
\* ========================================================================== */

export default LongestPathFinder;

/* == EXPORTS =============================================================== */
