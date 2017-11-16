/* ========================================================================== *\
	IMPORTS
\* ========================================================================== */

import {
	isNil,
	isNilOrEmpty
} from '../utilities.js';

/* == IMPORTS =============================================================== */



/* ========================================================================== *\
	PRIVATE VARIABLES
\* ========================================================================== */

const
	eventNames = {
		cellSizeChanged: 'oncellsizechanged',
		mazeVisualisationCompleted: 'mazevisualisationcompleted'
	},

	propertyNames = {
		baseElement: Symbol('baseElement'),
		cellSize: Symbol('cellSize'),
		history: Symbol('history'),
		mazeConfiguration: Symbol('mazeConfiguration'),
		runningState: Symbol('runningState'),
		stepIndex: Symbol('stepIndex'),
		stepInterval: Symbol('stepInterval')
	},

	runningStates = {
		paused: 0,
		running: 1
	},

	selectors = {
		output: '.js-output'
	};

/* == PRIVATE VARIABLES ===================================================== */



/* ========================================================================== *\
	PRIVATE METHODS
\* ========================================================================== */

/**
 *
 *
 */
function autoProcessHistory() {
	if (this[propertyNames.stepIndex] >= this[propertyNames.history].length) {
		this[propertyNames.stepIndex] -= 1;
		this[propertyNames.runningState] = runningStates.paused;
		this.__finalizeVisualisation();
		dispatchMazeVisualisationCompleted.call(this);

		return;
	}

	this.__visualiseStep(this[propertyNames.history][this[propertyNames.stepIndex]]);
	this[propertyNames.stepIndex] += 1;

	this.timeoutId = setTimeout(() => {
		autoProcessHistory.call(this);
	}, this.stepInterval);
}

/**
 *
 *
 * @private
 * @memberof MazeVisualiser
 */
function determineCellSize(rows, columns) {
	const
		outputElement = this.baseElement.querySelector(selectors.output);
	if (outputElement === null) {
		return;
	}

	const
		originalStyle = outputElement.getAttribute('style') || '';
	outputElement.setAttribute('style', `${ originalStyle };display:none !important;`);

	const
		{ height, width } = getElementContentSize(this.baseElement),
		horizontalSize = Math.floor(width / columns),
		verticalSize = Math.floor(height / rows),
		cellSize = Math.min(horizontalSize, verticalSize);

	if (cellSize !== this.cellSize) {
		this[propertyNames.cellSize] = cellSize;
		this._dispatchCellSizeChange();
	}

	outputElement.setAttribute('style', originalStyle);
}

/**
 *
 *
 */
function dispatchMazeVisualisationCompleted() {
	const
		event = new CustomEvent(eventNames.mazeVisualisationCompleted);

	this.baseElement.dispatchEvent(event);
}

/**
 *
 *
 * @param {HTMLElement} element
 */
function getElementContentSize(element) {
	const
		cs = window.getComputedStyle(element),
		paddingX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight),
		paddingY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom),
		horizontalSize = element.clientWidth - paddingX,
		verticalSize = element.clientHeight - paddingY;

	return {
		height: verticalSize,
		width: horizontalSize
	};
}

/* == PRIVATE METHODS ======================================================= */



/* ========================================================================== *\
	PUBLIC API
\* ========================================================================== */

class MazeVisualiser {
	/* ====================================================================== *\
		CONSTRUCTOR
	\* ====================================================================== */
	constructor(baseElement) {
		if (isNil(baseElement)) {
			throw 'Unable to create instance of Maze Visualiser, no base element has been provided.';
		}

		this[propertyNames.baseElement] = baseElement;
		this[propertyNames.runningState] = runningStates.paused;
		this[propertyNames.stepInterval] = 50;
	}
	/* == CONSTRUCTOR ======================================================= */



	/* ====================================================================== *\
		INSTANCE PROPERTIES
	\* ====================================================================== */

	/* ---------------------------------- *\
		baseElement (read-only)
	\* ---------------------------------- */
	get baseElement() {
		return this[propertyNames.baseElement];
	}
	/* -- baseElement (read-only) ------- */


	/* ---------------------------------- *\
		canGoBackward (read-only)
	\* ---------------------------------- */
	get canGoBackward() {
		if (isNilOrEmpty(this[propertyNames.history])) {
			return false;
		}

		return (this[propertyNames.stepIndex] > 0);
	}
	/* -- canGoBackward (read-only) ----- */


	/* ---------------------------------- *\
		canGoForward (read-only)
	\* ---------------------------------- */
	get canGoForward() {
		if (isNilOrEmpty(this[propertyNames.history])) {
			return false;
		}

		return (this[propertyNames.stepIndex] < (this[propertyNames.history].length - 1));
	}
	/* -- canGoForward (read-only) ------ */


	/* ---------------------------------- *\
		cellSize (read-only)
	\* ---------------------------------- */
	get cellSize() {
		return this[propertyNames.cellSize];
	}
	/* -- cellSize (read-only) ---------- */


	/* ---------------------------------- *\
		mazeConfiguration (read-only)
	\* ---------------------------------- */
	get mazeConfiguration() {
		return this[propertyNames.mazeConfiguration];
	}
	/* -- mazeConfiguration (read-only) - */


	/* ---------------------------------- *\
		runningState (read-only)
	\* ---------------------------------- */
	get runningState() {
		return this[propertyNames.runningState];
	}
	/* -- runningState (read-only) ------ */


	/* ---------------------------------- *\
		stepInterval
	\* ---------------------------------- */
	get stepInterval() {
		return this[propertyNames.stepInterval];
	}
	set stepInterval(value) {
		if (
			!Number.isFinite(value) ||
			value < 0
		) {
			return;
		}

		this[propertyNames.stepInterval] = value;
	}
	/* -- stepInterval ------------------ */

	/* == INSTANCE PROPERTIES =============================================== */



	/* ====================================================================== *\
		ABSTRACT METHODS
	\* ====================================================================== */

	/**
	 *
	 *
	 * @param {Number} rows
	 * @param {Number} columns
	 *
	 * @abstract
	 * @memberof MazeVisualiser
	 */
	__initVisualisation(rows, columns) {
		throw '__initVisualisation must be implemented by the sub class';
	}

	__finalizeVisualisation() {
		throw '__finalizeVisualisation must be implemented by the sub class';
	}

	__visualiseStep(historyRecord, isLastRecord) {
		throw '__visualiseStep must be implemented by the sub class';
	}

	/* == ABSTRACT METHODS ================================================== */



	/* ====================================================================== *\
		PROTECTED METHODS
	\* ====================================================================== */

	/**
	 *
	 * @protected
	 * @memberof MazeVisualiser
	 */
	_dispatchCellSizeChange() {
		const
			event = new CustomEvent(eventNames.cellSizeChanged, { detail: {
				cellSize: this.cellSize
			}});

		this.baseElement.dispatchEvent(event);
	}

	/* == PROTECTED METHODS ================================================= */



	/* ====================================================================== *\
		CALLBACK REGISTRATION
	\* ====================================================================== */

	/**
	 *
	 *
	 * @param {Function} callback
	 *
	 * @memberof MazeVisualiser
	 */
	onCellSizeChanged(callback) {
		if (isNil(callback)) {
			return;
		}

		this.baseElement.addEventListener(eventNames.cellSizeChanged, callback);
	}

	onMazeVisualisationComplete(callback) {
		if (isNil(callback)) {
			return;
		}

		this.baseElement.addEventListener(eventNames.mazeVisualisationCompleted, callback);
	}

	/* == CALLBACK REGISTRATION ============================================= */



	/* ====================================================================== *\
		PUBLIC METHODS
	\* ====================================================================== */

	pause() {
		if (this.runningState !== runningStates.running) {
			return;
		}
	}

	run() {
		if (
			this.runningState === runningStates.running ||
			!this.canGoForward
		) {
			return;
		}

		this[propertyNames.runningState] = runningStates.running;
		autoProcessHistory.call(this);
	}

	setHistory(history, mazeConfiguration) {
		this[propertyNames.stepIndex] = 0;
		this[propertyNames.history] = history;
		this[propertyNames.mazeConfiguration] = mazeConfiguration;

		determineCellSize.call(this, mazeConfiguration.rows, mazeConfiguration.columns);
		this.__initVisualisation(mazeConfiguration.rows, mazeConfiguration.columns);
	}

	stepBackward() {
		if (
			this.runningState === runningStates.running ||
			!this.canGoBackward
		) {
			return;
		}
	}

	stepForward() {
		if (
			this.runningState === runningStates.running ||
			!this.canGoForward
		) {
			return;
		}
	}

	/* == PUBLIC METHODS ==================================================== */
}

/* == PUBLIC API ============================================================ */



/* ========================================================================== *\
	EXPORTS
\* ========================================================================== */

export default MazeVisualiser;

/* == EXPORTS =============================================================== */
