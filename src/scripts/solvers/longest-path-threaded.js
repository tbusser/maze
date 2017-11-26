/* ========================================================================== *\
	IMPORTS
\* ========================================================================== */

import Deferred from '../utilities/deferred.js';

import {
	flatten
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
	defaultNumberOfThreads = 4,

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
		activeThreads: Symbol('activeThreads'),
		deferred: Symbol('deferred'),
		numberOfThreads: Symbol('numberOfThreads'),
		potentialEntryCells: Symbol('potentialEntryCells'),
		solution: Symbol('solution')
	};

/* == PRIVATE VARIABLES ===================================================== */



/* ========================================================================== *\
	EVENT HANDLING
\* ========================================================================== */

/**
 *
 *
 * @param {any} event
 * @returns
 *
 * @private
 * @memberof LongestPathFinder
 */
function onWorkerMessage(event) {
	const
		worker = event.target;

	// Check if the longest path for the cell is longer than the current longest
	// path. If it is, take the new solution as the longest path in the maze.
	if (event.data.path.length > this[propertyNames.solution].path.length) {
		this[propertyNames.solution] = event.data;
	}

	// Measure how long it took to determine the solution for the cell.
	const
		startMarker = performanceInfo.discovery.start + worker.index,
		endMarker = performanceInfo.discovery.end + worker.index;
	performance.mark(endMarker);
	performance.measure(performanceInfo.discovery.name, startMarker, endMarker);

	// Remove potential entry cells that were in the path and are no longer
	// in the running for being the starting point of the longest path.
	prunePotentialEntryCells.call(this, event.data.path);
	// console.log(`Worker ${worker.index} has pruned ${prunedCells} cells`);

	// Check if the set with potential entry cells is empty, in this case there
	// is no more work for the worker to be done.
	if (this[propertyNames.potentialEntryCells].size === 0) {
		stopWebWorker.call(this, worker);

		return;
	}

	// Get an iterator for the values in the set with potential entry cells and
	// get the first value of the set.
	const
		cells = this[propertyNames.potentialEntryCells].values(),
		startCell = cells.next().value;
	// Remove the first element from the set, it no longer has to be processed
	// by another thread.
	this[propertyNames.potentialEntryCells].delete(startCell);
	// Tell the worker to find the longest path for the cell. The maze data no
	// longer has to be passed along, the worker already has this information.
	worker.postMessage({
		startCell: startCell.location
	});
}

/* == EVENT HANDLING ======================================================== */



/* ========================================================================== *\
	PRIVATE METHODS
\* ========================================================================== */

/**
 * Clears all performance data
 *
 */
function clearPerformanceData() {
	performance.clearMarks();
	performance.clearMeasures();
}

/**
 * Returns the cell in the maze that have a chance of being the starting point
 * of the longst path. A cell may be the starting point of the longest path when
 * - It is located on the outer edge of the maze;
 * - It doesn't have just a top and bottom wall;
 * - It doesn't have just a left and right wall.
 *
 * @param {Array} cells
 *
 * @returns {Array}
 */
function getPotentialEntryCells(cells) {
	const
		flatCells = flatten(cells);

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
 * @param {Array} pathCells
 *
 * @returns {Number} The method returns the number of cells have been pruned
 *          the set of potential entry cells.
 *
 * @private
 * @memberof LongestPathFinder
 */
function prunePotentialEntryCells(pathCells) {
	let
		counter = 0;

	// Iterate over all the cells in the longest path.
	for (let index = 0; index < pathCells.length; index++) {
		const
			location = pathCells[index].location,
			cell = this.maze.cells[location.row][location.column];

		// When the cell has an outer wall, exactly 2 neighbors, and is still in
		// the set of cells to determine the longest path for it can be removed
		// from the set.
		if (
			cell.outerWalls !== 0 &&
			cell.numberOfNeighbors === 2 &&
			this[propertyNames.potentialEntryCells].has(cell)
		) {
			this[propertyNames.potentialEntryCells].delete(cell);
			counter++;
		}
	}

	return counter;
}

/**
 *
 *
 * @param {Array} serializableMaze
 * @param {Array} potentialEntryCells
 *
 * @private
 * @memberof LongestPathFinder
 */
function startWebWorkers(serializableMaze, potentialEntryCells) {
	const
		onWorkerMessageHandler = onWorkerMessage.bind(this);

	// Set a mark to track the duration of evaluating the longest path for
	// all the possible entry cells.
	performance.mark(performanceInfo.overall.start);

	for (let index = 0; index < this[propertyNames.numberOfThreads]; index++) {
		// Create a new worker instance.
		const
			worker = new Worker('scripts/solvers/worker.js');

		// Add an event listener so the worker can communicate back.
		worker.addEventListener('message', onWorkerMessageHandler);
		// Set the index, this will be used to set the approriate performance
		// markers so we can tell per worker how long it took to find the
		// longest path.
		worker.index = index;

		// Increase the number of active threads.
		this[propertyNames.activeThreads] += 1;
		// Set a performance marker for the worker.
		performance.mark(performanceInfo.discovery.start + index);
		// Tell the worker for which cell it should find the longest path.
		worker.postMessage({
			startCell: potentialEntryCells[index].location,
			maze: serializableMaze
		});
	}
}

/**
 *
 *
 * @param {any} worker
 *
 * @private
 * @memberof LongestPathFinder
 */
function stopWebWorker(worker) {
	// Terminate the worker, it is no longer needed.
	worker.terminate();

	// Decrease the number of active threads.
	this[propertyNames.activeThreads] -= 1;

	// Check if there are still threads active, when there are there is nothing
	// else to do at this point.
	if (this[propertyNames.activeThreads] > 0) {
		return;
	}

	// All threads have finished, measure how long it took to process all the
	// possible entry cells.
	performance.mark(performanceInfo.overall.end);
	performance.measure(performanceInfo.overall.name, performanceInfo.overall.start, performanceInfo.overall.end);

	// Resolve the promise that was returned by the solve method, fullfill the
	// promise with the longest path in the maze that was discovered.
	this[propertyNames.deferred].resolve(this[propertyNames.solution]);
}


/* == PRIVATE METHODS ======================================================= */



/* ========================================================================== *\
	PUBLIC API
\* ========================================================================== */

class LongestPathFinder {
	/* ====================================================================== *\
		CONSTRUCTOR
	\* ====================================================================== */
	constructor() {
		this[propertyNames.activeThreads] = 0;
		this[propertyNames.numberOfThreads] = defaultNumberOfThreads;
	}
	/* == CONSTRUCTOR ======================================================= */



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
		numberOfThreads
	\* ---------------------------------- */
	get numberOfTreads() {
		return this[propertyNames.numberOfThreads];
	}
	set numberOfTreads(value) {
		if (!Number.isFinite(value)) {
			return;
		}

		this[propertyNames.numberOfThreads] = value;
	}
	/* -- numberOfThreads --------------- */


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
		// Initialize the deferred which will be used to signal when the longest
		// path has been found.
		this[propertyNames.deferred] = new Deferred();
		// Initialize the solution property. It should contain an empty path so
		// the first discovered path will be accepted as having the
		// longest length.
		this[propertyNames.solution] = {
			path: []
		};
		this.maze = maze;

		// Clear any previous performance data there is.
		clearPerformanceData();

		const
			potentialEntryCells = getPotentialEntryCells(maze.cells);

		// Create the set with potential entry cells, leave out the first cells
		// in the array, as many as the number of workers we will launch. This
		// way the first batch of cells for which the longest path is determined
		// won't have to be deleted from the set.
		this[propertyNames.potentialEntryCells] = new Set(potentialEntryCells.slice(this.numberOfTreads));

		// Start the workers.
		startWebWorkers.call(this, maze.getSerializableMaze(), potentialEntryCells);

		// Return the promise of the deferred, it will get resolved once the
		// longest path in the maze has been determined.
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
