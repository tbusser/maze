/* ========================================================================== *\
	IMPORTS
\* ========================================================================== */

import MazeVisualiser from './visualiser/maze-visualiser.canvas.js';
import InteractivePath from './interactive-path.js';
import Maze from './generators/maze.js';

/* == IMPORTS =============================================================== */



/* ========================================================================== *\
	PRIVATE VARIABLES
\* ========================================================================== */

const
	cssPropertyCellSize = '--cell-size',
	defaultRows = 5,
	defaultColumns = 5,
	myMaze = new Maze(defaultRows, defaultColumns),
	queue = [],

	selectors = {
		createMazeForm: '.js-create-maze-form',
		createMazeTrigger: '.js-create-maze',
		cellSpeedSelect: '.js-cell-speed',
		cellSpeedLabel: '.js-cell-speed-label',
		inputColumns: '#config-columns',
		inputRows: '#config-rows',
		output: '.js-output',
		visualiser: '.js-visualiser'
	};

let
	visualiser = new MazeVisualiser(document.querySelector(selectors.visualiser)),
	interactivePathController;

/* == PRIVATE VARIABLES ===================================================== */



/* ========================================================================== *\
	EVENT HANDLING
\* ========================================================================== */

/**
 *
 *
 * @param {Event} event
 */
function onCelSizeChangedHandler(event) {
	const
		{ cellSize } = event.detail;

	document.documentElement.style.setProperty(cssPropertyCellSize, `${cellSize}px`);
}

/**
 *
 *
 * @param {Event} event
 */
function onCreateMazeSubmitHandler(event) {
	event.preventDefault();

	/** @type {HTMLFormElement} */
	const
		form = event.target;

	if (!form.checkValidity()) {
		return;
	}

	const
		columns = parseInt(form.querySelector(selectors.inputColumns).value, 10),
		rows = parseInt(form.querySelector(selectors.inputRows).value, 10);

	createAndDisplayMaze(columns, rows);
}

/**
 *
 *
 * @param {Event} event
 */
function onMazeVisualisationCompleteHandler(event) {
	interactivePathController.start(myMaze);
}

/**
 *
 *
 * @param {Event} event
 */
function onStepIntervalChangedHandler(event) {
	const
		value = parseFloat(event.target.value);
	visualiser.stepInterval = value;

	const
		label = document.querySelector(selectors.cellSpeedLabel),
		cellsPerSecond = (1000 / value);
	if (cellsPerSecond >= 1) {
		label.textContent = `${(1000 / value).toFixed(1)} steps/second`;
	} else {
		label.textContent = `${value / 1000}s per step`;
	}
}

/**
 *
 *
 * @param {any} event
 */
function onStepTakenHandler(event) {
	queue.push(event.detail);
}

/* == EVENT HANDLING ======================================================== */



/* ========================================================================== *\
	PRIVATE METHODS
\* ========================================================================== */

/**
 *
 *
 */
function createAndDisplayMaze(columns = defaultColumns, rows = defaultRows) {
	const
		selectedDrawOption = document.querySelector('[name="draw-options"]:checked');
	emptyQueue();
	interactivePathController.stop();
	myMaze.generateMaze(columns, rows);
	if (selectedDrawOption.value === 'instantly') {
		visualiser.displayMaze(myMaze.cells, getMazeConfiguration(columns, rows));
	} else {
		visualiser.setHistory(queue, getMazeConfiguration(columns, rows));
		visualiser.run();
	}
}

/**
 *
 *
 */
function emptyQueue() {
	while (queue.length > 0) {
		queue.pop();
	}
}

/**
 *
 *
 * @param {Number} columns
 * @param {Number} rows
 *
 * @returns {Object}
 */
function getMazeConfiguration(columns, rows) {
	return {
		columns,
		entryCell: myMaze.entryCell,
		exitCell: myMaze.exitCell,
		rows
	};
}

/* == PRIVATE METHODS ======================================================== */



/* ========================================================================== *\
	INITIALIZATION
\* ========================================================================== */

/**
 *
 */
function init() {
	const
		createForm = document.querySelector(selectors.createMazeForm),
		output = document.querySelector(selectors.output),
		speedSelect = document.querySelector(selectors.cellSpeedSelect);

	if (createForm !== null) {
		createForm.addEventListener('submit', onCreateMazeSubmitHandler);
	}
	if (output !== null) {
		interactivePathController = new InteractivePath(output);
		interactivePathController.grid = visualiser.grid;
	}

	visualiser.stepInterval = 20;
	visualiser.onCellSizeChanged(onCelSizeChangedHandler);
	visualiser.onMazeVisualisationComplete(onMazeVisualisationCompleteHandler);

	if (speedSelect !== null) {
		visualiser.stepInterval = speedSelect.value;
		speedSelect.addEventListener('change', onStepIntervalChangedHandler);
	}

	myMaze.onStepTaken(onStepTakenHandler);

	createAndDisplayMaze();
}

init();

/* == INITIALIZATION ========================================================= */
