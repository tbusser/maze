/*
 |------------------------------------------------------------------------------
 | Interactive Path
 |------------------------------------------------------------------------------
 |
 | This class allows the visitor to mark cells / draw a path on the visual
 | maze.
 |
 |*/

/* ========================================================================== *\
	PRIVATE VARIABLES
\* ========================================================================== */

const
	attributeNames = {
		column: 'data-column',
		row: 'data-row'
	},

	cssClasses = {
		cell: 'cell',
		marked: 'path'
	},

	propertyNames = {
		baseElement: Symbol('baseElement'),
		currentCell: Symbol('currentCell'),
		maze: Symbol('maze'),
		mouseDownHandler: Symbol('mouseDownHandler'),
		mouseMoveHandler: Symbol('mouseMoveHandler'),
		mouseUpHandler: Symbol('mouseUpHandler'),
		state: Symbol('state')
	},

	selectors = {
		marked: `.${ cssClasses.marked }`
	},

	states = {
		running: 1,
		stopped: 0
	};

/* == PRIVATE VARIABLES ===================================================== */



/* ========================================================================== *\
	EVENT HANDLING
\* ========================================================================== */

/**
 *
 *
 * @param {MouseEvent} event
 */
function onMouseDownHandler(event) {
	const
		target = event.target;

	// Make sure the element the mouse is on has the required information, else
	// we can exit the method.
	if (!isElementForCell(target)) {
		return;
	}

	// Store the cell represented by the element in the private field.
	this[propertyNames.currentCell] = getCellForElement.call(this, target);

	// Toggle the marked class on the element.
	target.classList.toggle(cssClasses.marked);

	// Add the events to the base element so we can track the mouse movement and
	// detect when the mouse button has been released.
	this.baseElement.addEventListener('mouseup', this[propertyNames.mouseUpHandler]);
	this.baseElement.addEventListener('mousemove', this[propertyNames.mouseMoveHandler]);
}

/**
 *
 *
 * @param {MouseEvent} event
 */
function onMouseMoveHandler(event) {
	const
		target = event.target,
		previousCell = this[propertyNames.currentCell],
		cell = getCellForElement.call(this, target);

	// When the cell the mouse is over represents the same cell as the previous
	// cell there is no further action needed. There is also nothing else to do
	// when there is no direct path between the two cells.
	if (
		cell === previousCell ||
		!cell.hasPathTo(previousCell)
	) {
		return;
	}

	if (target.classList.contains(cssClasses.marked)) {
		const
			previousCellElement = getElementForCell.call(this, previousCell);
		previousCellElement.classList.remove(cssClasses.marked);
	} else {
		target.classList.toggle(cssClasses.marked);
	}

	// Store the cell we've just processed.
	this[propertyNames.currentCell] = cell;
}

/**
 *
 *
 * @param {MouseEvent} event
 */
function onMouseUpHandler(event) {
	this.baseElement.removeEventListener('mouseup', this[propertyNames.mouseMoveHandler]);
	this.baseElement.removeEventListener('mousemove', this[propertyNames.mouseMoveHandler]);
}

/* == EVENT HANDLING ======================================================== */



/* ========================================================================== *\
	PRIVATE METHODS
\* ========================================================================== */

/**
 *
 *
 * @param {HTMLElement} element
 */
function getCellForElement(element) {
	const
		column = parseInt(element.getAttribute(attributeNames.column), 10),
		row = parseInt(element.getAttribute(attributeNames.row), 10),
		cell = this[propertyNames.maze].getCell(column, row);

	return cell;
}

/**
 *
 *
 * @param {HTMLElement} cell
 */
function getElementForCell(cell) {
	const
		rowQuery = `[${ attributeNames.column }="${ cell.column }"]`,
		columnQuery = `[${ attributeNames.row }="${ cell.row }"]`,
		element = this.baseElement.querySelector(`${ rowQuery }${ columnQuery }`);

	return element;
}

/**
 *
 *
 * @param {HTMLElement} element
 *
 * @returns {Boolean}
 */
function isElementForCell(element) {
	return (
		element.hasAttribute(attributeNames.column) &&
		element.hasAttribute(attributeNames.row)
	);
}

/* == PRIVATE METHODS ======================================================= */



/* ========================================================================== *\
	PUBLIC API
\* ========================================================================== */

class InteractivePath {
	/* ====================================================================== *\
		CONSTRUCTOR
	\* ====================================================================== */
	constructor(baseElement) {
		if (baseElement == null) {
			throw 'Unable to create instance of InteractivePath, no base element provided';
		}

		this[propertyNames.baseElement] = baseElement;
		this[propertyNames.mouseDownHandler] = onMouseDownHandler.bind(this);
		this[propertyNames.mouseMoveHandler] = onMouseMoveHandler.bind(this);
		this[propertyNames.mouseUpHandler] = onMouseUpHandler.bind(this);

		this[propertyNames.state] = states.stopped;
	}
	/* == CONSTRUCTOR ======================================================= */



	/* ====================================================================== *\
		INSTANCE PROPERTIES
	\* ====================================================================== */

	/* ---------------------------------- *\
		baseElement (read-only)
	\* ---------------------------------- */
	/**
	 *
	 * @type {HTMLElement}
	 * @readonly
	 * @memberof InteractivePath
	 */
	get baseElement() {
		return this[propertyNames.baseElement];
	}
	/* -- baseElement (read-only) ------- */


	/* ---------------------------------- *\
		state (read-only)
	\* ---------------------------------- */
	get state() {
		return this[propertyNames.state]
	}
	/* -- state (read-only) ====---------- */

	/* == INSTANCE PROPERTIES =============================================== */



	/* ====================================================================== *\
		PUBLIC METHODS
	\* ====================================================================== */

	clean() {
		const
			markedCells = Array.from(document.querySelectorAll(selectors.marked));

		markedCells.forEach(cell => cell.classList.remove(cssClasses.marked));
	}

	start(maze) {
		if (this.state === states.running) {
			return false;
		}

		this[propertyNames.maze] = maze;
		this[propertyNames.state] = states.running;
		this.baseElement.addEventListener('mousedown', this[propertyNames.mouseDownHandler]);
	}

	stop() {
		if (this.state === states.stopped) {
			return false;
		}

		this[propertyNames.currentCell] = null;
		this.baseElement.removeEventListener('mousedown', this[propertyNames.mouseDownHandler]);
		this[propertyNames.state] = states.stopped;
	}

	/* == PUBLIC METHODS ==================================================== */
}

/* == PUBLIC API ============================================================ */



/* ========================================================================== *\
	EXPORTS
\* ========================================================================== */

export default InteractivePath;

/* == EXPORTS =============================================================== */
