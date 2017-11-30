/* ========================================================================== *\
	IMPORTS
\* ========================================================================== */

import Deferred from '../utilities/deferred.js';

import {
	flatten
} from '../utilities/utilities.js';

import LongestPathFinderBase from './longest-path.base.js';

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
		numberOfThreads: Symbol('numberOfThreads')
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
	if (event.data.path.length > this._solution.path.length) {
		this._solution = event.data;
	}

	// Measure how long it took to determine the solution for the cell.
	const
		startMarker = performanceInfo.discovery.start + worker.index,
		endMarker = performanceInfo.discovery.end + worker.index;
	performance.mark(endMarker);
	performance.measure(performanceInfo.discovery.name, startMarker, endMarker);

	// Remove potential entry cells that were in the path and are no longer
	// in the running for being the starting point of the longest path.
	const pruneCount = this._prunePotentialEntryCells(this._solution.path);

	console.log(`Solution found from ${event.data.fromLocation.column}_${event.data.fromLocation.row} to ${event.data.toCell.id} with length ${event.data.path.length}, ${pruneCount} entry cells pruned.`);
	// Check if the set with potential entry cells is empty, in this case there
	// is no more work for the worker to be done.
	if (this._potentialEntryCells.size === 0) {
		stopWebWorker.call(this, worker);

		return;
	}

	// Get the next cell
	const
		startCell = this._shiftPotentialEntryCell();
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
	this[propertyNames.deferred].resolve(this._solution);
}


/* == PRIVATE METHODS ======================================================= */



/* ========================================================================== *\
	PUBLIC API
\* ========================================================================== */

class LongestPathFinder extends LongestPathFinderBase {
	/* ====================================================================== *\
		CONSTRUCTOR
	\* ====================================================================== */
	constructor() {
		super();

		this[propertyNames.activeThreads] = 0;
		this[propertyNames.numberOfThreads] = defaultNumberOfThreads;
	}
	/* == CONSTRUCTOR ======================================================= */



	/* ====================================================================== *\
		INSTANCE PROPERTIES
	\* ====================================================================== */

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
		super.solve(maze.getSerializableMaze());

		// Initialize the deferred which will be used to signal when the longest
		// path has been found.
		this[propertyNames.deferred] = new Deferred();

		const
			potentialEntryCells = this._determinePotentialEntryCells();

		// Create the set with potential entry cells, leave out the first cells
		// in the array, as many as the number of workers we will launch. This
		// way the first batch of cells for which the longest path is determined
		// won't have to be deleted from the set.
		this._potentialEntryCells = new Set(potentialEntryCells.slice(this.numberOfTreads));

		console.log('Initial number of entry cells ', this._potentialEntryCells.size);

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
