/* ========================================================================== *\
	IMPORTS
\* ========================================================================== */

import {
	flatten,
	getRandomInt
} from '../utilities/utilities.js';

/* == IMPORTS =============================================================== */



/* ========================================================================== *\
	PRIVATE VARIABLES
\* ========================================================================== */

const
	performanceInfo = {
		end: 'longest-path-end',
		name: 'longest-path',
		start: 'longest-path-start'
	},

	propertyNames = {
		mazeDimensions: Symbol('mazeDimension')
	};

/* == PRIVATE VARIABLES ===================================================== */



/* ========================================================================== *\
	PRIVATE METHODS
\* ========================================================================== */

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
function getLongestPathForCell(startCell, mazeCells) {
	const
		visitedCells = new Set(),
		stack = [];

	let
		cell = startCell,
		longestPath = {
			location: null,
			length: -Infinity
		};

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
			}
			cell = stack.pop();
			continue;
		}

		const
			nextCell = mazeCells[nextCellLocation.row][nextCellLocation.column];
		stack.push(cell);
		cell = nextCell;
	}

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
 * @param {Set} visitedCells
 *
 * @private
 * @memberof LongestPath
 */
function getRandomUnvisitedNeighbor(cell, maze, visitedCells) {
	const
		{ columns, rows } = this[propertyNames.mazeDimensions],
		locations = cell.getNeighborsLocations(),
		validLocations = locations.filter(location => {
			const
				{column, row } = location;

			return (
				(column >= 0 && column < columns) &&
				(row >= 0 && row < rows) &&
				!visitedCells.has(getKeyForCell(location))
			)
		}),
		validCells = validLocations.filter(location => {
			const
				candidate = maze[location.row][location.column];

			return cell.hasPathTo(candidate);
		})

	if (validCells.length === 0) {
		return null;
	} else if (validCells.length === 1) {
		return validCells[0];
	}

	const
		randomIndex = getRandomInt(0, validCells.length - 1);

	return validCells[randomIndex];
}

/* == PRIVATE METHODS ======================================================= */



/* ========================================================================== *\
	PUBLIC API
\* ========================================================================== */

class LongestPathFinder {
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

		const
			outerCells = new Set(getOuterCells(maze.cells));

		let
			longestLongestPath = {
				fromCell: null,
				toCell: null,
				length: -Infinity
			};

		performance.mark(performanceInfo.start);

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
			outerCells.delete(longestPath.cell);
		}

		performance.mark(performanceInfo.end);
		performance.measure(performanceInfo.name, performanceInfo.start, performanceInfo.end);

		const
			entries = performance.getEntriesByName(performanceInfo.name),
			duration = (entries[0].duration / 1000).toFixed(3);

		console.log('The longest path is: ', longestLongestPath, 'Time it took:', duration + ' seconds');

		performance.clearMarks();
		performance.clearMeasures();

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
