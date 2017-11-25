/* ========================================================================== *\
	IMPORTS
\* ========================================================================== */

import {
	flatten,
	getRandomInt
} from '../utilities/utilities.js';

/* == IMPORTS =============================================================== */

/**
 * @typedef {Location}
 * @property {Number} column
 * @property {Number} row
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
		mazeDimensions: Symbol('mazeDimension'),
		outerCells: Symbol('outerCells')
	};

/* == PRIVATE VARIABLES ===================================================== */



/* ========================================================================== *\
	PRIVATE METHODS
\* ========================================================================== */

/**
 *
 *
 */
function clearPerformanceData() {
	performance.clearMarks();
	performance.clearMeasures();
}

/**
 *
 *
 * @param {Cell} {column, row}
 *
 * @returns {String}
 */
function getKeyForCell({column, row}) {
	return `${column}_${row}`;
}

/**
 *
 *
 * @param {Cell} cell
 *
 * @private
 * @memberof LongestPath
 */
// eslint-disable-next-line complexity, require-jsdoc
function getLongestPathForCell(startCell, mazeCells, optimized = false) {
	const
		visitedCells = new Set(),
		stack = [];

	let
		cell = startCell,
		longestPath = {
			location: null,
			length: -Infinity
		},
		longestStack = [];

	performance.mark(performanceInfo.discovery.start);
	while (cell != null) {
		visitedCells.add(getKeyForCell(cell));

		const
			nextCellLocation = getRandomUnvisitedNeighbor.call(this, cell, mazeCells, visitedCells);

		if (nextCellLocation === null) {
			if (stack.length > longestPath.length && cell.outerWalls !== 0) {
				longestPath = {
					cell,
					location: cell.location,
					length: stack.length
				};
				longestStack = stack.slice(0);
			}
			cell = stack.pop();
			continue;
		}

		const
			nextCell = mazeCells[nextCellLocation.row][nextCellLocation.column];
		stack.push(cell);
		cell = nextCell;
	}

	// Iterate over all the cells in the longest path.
	for (let index = 0; index < longestStack.length; index++) {
		const
			cell = longestStack[index];
		// When the cell has an outer wall, exactly 2 neighbors, and is still in
		// the set of cells to determine the longest path for it can be removed
		// from the set.
		if (
			cell.outerWalls !== 0 &&
			cell.numberOfNeighbors === 2 &&
			this[propertyNames.outerCells].has(cell)
		) {
			this[propertyNames.outerCells].delete(cell);
		}
	}

	performance.mark(performanceInfo.discovery.end);
	performance.measure(performanceInfo.discovery.name, performanceInfo.discovery.start, performanceInfo.discovery.end);

	return longestPath;
}

/**
 *
 *
 * @param {Array} cells
 *
 * @returns {Array}
 */
function getOuterCells(cells) {
	const
		flatCells = flatten(cells);

	return flatCells.filter(cell => cell.outerWalls !== 0);
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
function getRandomUnvisitedNeighbor(cell, maze, visitedCells) {
	const
		{ columns, rows } = this[propertyNames.mazeDimensions],
		// Get a list of all potential neighbors for the provided cell. This may
		// include locations that fall outside of the grid.
		locations = cell.getNeighborsLocations(),
		// Filter the locations to remove all locations which:
		// - Fall outside of the grid;
		// - Have already been visited.
		validLocations = locations.filter(location => {
			const
				{column, row } = location;

			return (
				(column >= 0 && column < columns) &&
				(row >= 0 && row < rows) &&
				!visitedCells.has(getKeyForCell(location))
			)
		}),
		// Now that we have an array with just valid locations for unvisited
		// cells we need to take the last step, remove all the locations that
		// have no path to the provided cell.
		validCells = validLocations.filter(location => {
			const
				candidate = maze[location.row][location.column];

			return cell.hasPathTo(candidate);
		});

	// When there are no valid neighbors, return null. In case there is just a
	// single valid neighbor, return it.
	if (validCells.length === 0) {
		return null;
	} else if (validCells.length === 1) {
		return validCells[0];
	}

	const
		// Determine a random index for the array of valid cells.
		randomIndex = getRandomInt(0, validCells.length - 1);

	// Return the location for the randomly determined index.
	return validCells[randomIndex];
}

/* == PRIVATE METHODS ======================================================= */



/* ========================================================================== *\
	PUBLIC API
\* ========================================================================== */

class LongestPathFinder {
	/* ====================================================================== *\
		INSTANCE PROPERTIES
	\* ====================================================================== */

	/* ---------------------------------- *\
		discoveryDurations (read-only)
	\* ---------------------------------- */
	get discoveryDurations() {
		return performance.getEntriesByName(performanceInfo.discovery.name);
	}
	/* -- discoveryDurations (read-only)  */


	/* ---------------------------------- *\
		overallDuration (read-only)
	\* ---------------------------------- */
	get overallDuration() {
		return performance.getEntriesByName(performanceInfo.overall.name);
	}
	/* -- overallDuration (read-only) --- */

	/* == INSTANCE PROPERTIES =============================================== */



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
		this[propertyNames.mazeDimensions] = {
			columns: maze.cells[0].length,
			rows: maze.cells.length
		};

		clearPerformanceData();

		this[propertyNames.outerCells] = new Set(getOuterCells(maze.cells));

		const
			outerCells = this[propertyNames.outerCells];

		let
			longestLongestPath = {
				fromCell: null,
				toCell: null,
				length: -Infinity
			};

		performance.mark(performanceInfo.overall.start);

		while (outerCells.size > 0) {
			const
				cells = outerCells.values(),
				firstLocation = cells.next().value,
				firstCell = maze.cells[firstLocation.row][firstLocation.column],
				longestPath = getLongestPathForCell.call(this, firstCell, maze.cells);

			if (longestPath.length > longestLongestPath.length) {
				longestLongestPath = {
					fromCell: firstCell.location,
					toCell: longestPath.location,
					length: longestPath.length
				};
			}

			outerCells.delete(firstLocation);
		}

		performance.mark(performanceInfo.overall.end);
		performance.measure(performanceInfo.overall.name, performanceInfo.overall.start, performanceInfo.overall.end);

		return longestLongestPath;
	}

	/* == PUBLIC METHODS ==================================================== */
}
/* == PUBLIC API ============================================================ */



/* ========================================================================== *\
	EXPORTS
\* ========================================================================== */

export default LongestPathFinder;

/* == EXPORTS =============================================================== */
