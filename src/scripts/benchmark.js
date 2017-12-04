/* ========================================================================== *\
	IMPORTS
\* ========================================================================== */

import {
	defer
} from './utilities/utilities.js';

import Maze from './generators/maze.js';

import Deferred from './utilities/deferred.js';

import Solver from './solvers/longest-path.js';
import SolverSingle from './solvers/longest-path-single-thread.js';
import SolverThreaded from './solvers/longest-path-threaded.js';
import SolverThreadedAB from './solvers/longest-path-threaded-ab.js';

/* == IMPORTS =============================================================== */



/* ========================================================================== *\
	PRIVATE VARIABLES
\* ========================================================================== */

const
	generator = new Maze(),
	columns = 50,
	rows = 50,
	attempts = 10,
	numberOfThreads = 4,

	selectors = {
		replay: '.js-replay-benchmark'
	};


let
	overallDuration = 0;

/* == PRIVATE VARIABLES ===================================================== */



/* ========================================================================== *\
	EVENT HANDLING
\* ========================================================================== */

/**
 *
 *
 * @param {any} query
 * @param {any} eventName
 * @param {any} callback
 * @param {any} [queryContext=document]
 * @returns
 */
function addListener(query, eventName, callback, queryContext = document) {
	const
		element = queryContext.querySelector(query);
	if (element === null) {
		return null;
	}

	element.addEventListener(eventName, callback);

	return element;
}

/**
 *
 */
function bindEvents() {
	// Add an event listener for the click event on the button to replay the
	// last maze solution.
	addListener(selectors.replay, 'click', onReplayButtonClicked);
}

/**
 *
 *
 * @param {any} event
 */
function onReplayButtonClicked(event) {
	startTests();
}

/* == EVENT HANDLING ======================================================== */



/* ========================================================================== *\
	PRIVATE METHODS
\* ========================================================================== */

/**
 *
 *
 */
function runThreadedSolution(generator, SolverClass, caption) {
	const
		solver = new SolverClass(),
		deferred = new Deferred();

	let
		counter = 0,
		numberOfAttempts = 0,
		minAttempts = Infinity,
		maxAttempts = 0;

	overallDuration = 0;

	/**
	 *
	 *
	 */
	function performRun() {
		solver.solve(generator)
			.then(solution => {
				console.groupCollapsed(`${caption} result: ${solver.discoveryDurations.length} attemps, ${solver.overallDuration[0].duration}ms`);
				console.log('Solution: ', solution);
				console.log('Duration per discovery attempt: ', solver.discoveryDurations);
				console.log('Duration for finding longest path: ', solver.overallDuration[0].duration);
				console.groupEnd();

				numberOfAttempts += solver.discoveryDurations.length;
				overallDuration += solver.overallDuration[0].duration;
				minAttempts = Math.min(minAttempts, solver.discoveryDurations.length);
				maxAttempts = Math.max(maxAttempts, solver.discoveryDurations.length);

				counter++;
				if (counter < attempts) {
					performRun(solver, generator);
				} else {
					console.log('Average duration: ', (overallDuration / attempts));
					console.log(`Average discoveries per attempt: ${numberOfAttempts / attempts}, min=${minAttempts}, max=${maxAttempts}`);
					console.groupEnd();
					deferred.resolve();
				}
			});
	}

	console.group(`Starting benchmark ${caption}`.toUpperCase());
	solver.numberOfThreads = numberOfThreads;
	defer(() => performRun());

	return deferred.promise;
}

/**
 * Sets the disabled property of an element which was found by querying the
 * document with the provided query.
 *
 * @param {String} query  The query to run on the document in order to find the
 *        element to update.
 * @param {Boolean} isDisabled When the value is true the element will become
 *        disabled; providing the value false will enable the element.
 */
function setDisabledState(query, isDisabled) {
	// Run the query on the DOM and make sure it resulted in an element before
	// continuing.
	/** @type {HTMLButtonElement} */
	const
		element = document.querySelector(query);
	if (element === null) {
		return;
	}

	// Update the value of the disabled property.
	element.disabled = isDisabled;
}

/**
 *
 *
 */
function startTests() {
	setDisabledState(selectors.replay, true);

	runThreadedSolution(generator, SolverThreaded, 'Multi threaded refactored')
		.then(() => runThreadedSolution(generator, Solver, 'Single thread'))
		.then(() => runThreadedSolution(generator, SolverThreadedAB, 'Multi threaded with ArrayBuffer'))
		.then(() => setDisabledState(selectors.replay, false));
}

/* == PRIVATE METHODS ======================================================= */



/* ========================================================================== *\
	INITIALIZATION
\* ========================================================================== */

/**
 *
 *
 */
function init() {
	bindEvents();

	generator.generateMaze(columns, rows, true);

	startTests();
}

init();

/* == INITIALIZATION ======================================================== */
