/* ========================================================================== *\
	IMPORTS
\* ========================================================================== */

import MazeVisualiser from './visualiser/maze-visualiser.div.js';
import InteractivePath from './interactive-path.js';
import Maze from './maze.js';

/* == IMPORTS =============================================================== */

const
	selectors = {
		createMazeForm: '.js-create-maze-form',
		createMazeTrigger: '.js-create-maze',
		inputColumns: '#config-columns',
		inputRows: '#config-rows',
		output: '.js-output',
		visualiser: '.js-visualiser'
	};

/** @type {Maze} */
const
	defaultRows = 5,
	defaultColumns = 5,
	myMaze = new Maze(defaultRows, defaultColumns),
	visualiser = new MazeVisualiser(document.querySelector(selectors.visualiser)),
	queue = [];

let
	interactivePathController;

/**
 *
 *
 * @param {any} event
 */
function onStepTakenHandler(event) {
	queue.push(event.detail);
}

/**
 *
 *
 */
function generateVisualMaze(rows, columns) {
	interactivePathController.stop();

	visualiser.setHistory(queue, {
		columns,
		entryCell: myMaze.entryCell,
		exitCell: myMaze.exitCell,
		rows
	});
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
 */
function createAndDisplayMaze(columns = defaultColumns, rows = defaultRows) {
	emptyQueue();
	myMaze.generateMaze(columns, rows);
	generateVisualMaze(rows, columns);
	visualiser.run();
}

/**
 *
 */
function init() {
	const
		createForm = document.querySelector(selectors.createMazeForm),
		output = document.querySelector(selectors.output);
	if (createForm !== null) {
		createForm.addEventListener('submit', onCreateMazeSubmitHandler);
	}
	if (output !== null) {
		interactivePathController = new InteractivePath(output);
	}

	visualiser.onCellSizeChanged(event => {
		const
			{ cellSize } = event.detail;

		document.documentElement.style.setProperty('--cell-size', `${cellSize}px`);
	});

	visualiser.onMazeVisualisationComplete(event => {
		interactivePathController.start(myMaze);
	});

	myMaze.onStepTaken(onStepTakenHandler);

	createAndDisplayMaze();
}

init();