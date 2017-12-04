/* ========================================================================== *\
	IMPORTS
\* ========================================================================== */

import Deferred from '../utilities/deferred.js';

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

	decoder = new TextDecoder('utf-8'),
	encoder = new TextEncoder('utf-8'),

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
		worker = event.target,
		data = decode(event.data);

	// Check if the longest path for the cell is longer than the current longest
	// path. If it is, take the new solution as the longest path in the maze.
	if (data.path.length > this._solution.path.length) {
		this._solution = data;
	}

	// Measure how long it took to determine the solution for the cell.
	const
		startMarker = performanceInfo.discovery.start + worker.index,
		endMarker = performanceInfo.discovery.end + worker.index;
	performance.mark(endMarker);
	performance.measure(performanceInfo.discovery.name, startMarker, endMarker);

	// Check if the set with potential entry cells is empty, in this case there
	// is no more work for the worker to be done.
	if (this._potentialEntryCellsIds.size === 0) {
		stopWebWorker.call(this, worker);

		return;
	}

	// Remove potential entry cells that were in the path and are no longer
	// in the running for being the starting point of the longest path.
	this._prunePotentialEntryCells(data.path);

	// Get the next cell
	const
		startCell = this._shiftPotentialEntryCell();
	// Tell the worker to find the longest path for the cell. The maze data no
	// longer has to be passed along, the worker already has this information.
	performance.mark(startMarker);
	const
		arrayBuffer = encode({
			startCell,
			maze: undefined
		 });
	// now transfer array buffer
	worker.postMessage(arrayBuffer, [arrayBuffer])
}

/* == EVENT HANDLING ======================================================== */



/* ========================================================================== *\
	PRIVATE METHODS
\* ========================================================================== */

/**
 *
 *
 * @param {any} data
 */
function decode(data) {
	const
		view = new DataView(data, 0, data.byteLength),
		string = decoder.decode(view);

	return JSON.parse(string);
}

/**
 *
 *
 * @param {any} data
 */
function encode(data) {
	const
		string = JSON.stringify(data),
		uint8_array = encoder.encode(string);

	return uint8_array.buffer;
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
function startWebWorkers(seedCells) {
	// Set a mark to track the duration of evaluating the longest path for
	// all the possible entry cells.
	performance.mark(performanceInfo.overall.start);

	launchWebworkers.call(this, seedCells);
}

/**
 *
 *
 */
function launchWebworkers(seedCells) {
	const
		onWorkerMessageHandler = onWorkerMessage.bind(this);

	for (let index = 0; index < this.numberOfThreads; index++) {
		// Create a new worker instance.
		let
			worker = new Worker('scripts/solvers/worker-ab.js'),
			startCell = seedCells.pop();

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
		const
			arrayBuffer = encode({
				startCell,
				maze: this.mazeCells
			});

		// now transfer array buffer
		worker.postMessage(arrayBuffer, [arrayBuffer])
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
	// Decrease the number of active threads.
	this[propertyNames.activeThreads] -= 1;

	// Terminate the worker, it is no longer needed.
	worker.terminate();

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
	get numberOfThreads() {
		return this[propertyNames.numberOfThreads];
	}
	set numberOfThreads(value) {
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
			potentialEntryCells = this._determinePotentialEntryCells(),
			step = Math.floor((potentialEntryCells.length - 1) / (this.numberOfThreads - 1)),
			seedCells = [];

		for (let index = this.numberOfThreads - 1; index >= 0; index--) {
			const
				deleteIndex = index * step;
			seedCells.push(potentialEntryCells.splice(deleteIndex, 1)[0].location);
		}
		this._potentialEntryCellsIds = new Set(potentialEntryCells.map(cell => cell.id));

		// Start the workers.
		startWebWorkers.call(this, seedCells);

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
