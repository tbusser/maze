/* ========================================================================== *\
	IMPORTS
\* ========================================================================== */

import {
	isNil
} from '../utilities/utilities.js';

import Cell from '../cell.js';
import VisualiserBase from './maze-visualiser.base.js';

/* == IMPORTS =============================================================== */



/* ========================================================================== *\
	PRIVATE VARIABLES
\* ========================================================================== */

const
	attributeNames = {
		column: 'data-column',
		row: 'data-row'
	},

	cssClasses = {
		cell: 'cell'
	},

	propertyNames = {
		previousElement: Symbol('previousElement')
	},

	selectors = {
		cell: `.${ cssClasses.cell }`,
		output: '.js-output'
	};

/* == PRIVATE VARIABLES ===================================================== */



/* ========================================================================== *\
	PRIVATE METHODS
\* ========================================================================== */

/**
 *
 */
function emptyCellsTextContent(baseElement) {
	const
		cells = baseElement.querySelectorAll(selectors.cell);

	for (var index = 0; index < cells.length; index++) {
		cells[index].textContent = null;
	}
}

/**
 *
 *
 * @param {any} side
 * @param {any} isEntry
 */
// eslint-disable-next-line
function getSymbolForSide(side, isEntry) {
	switch (side) {
	case Cell.sides.bottom:
		return (isEntry) ? '⬆' : '⬇';

	case Cell.sides.left:
		return (isEntry) ? '➡' : '︎︎︎︎⬅';

	case Cell.sides.right:
		return (isEntry) ? '⬅' : '➡︎︎︎︎';

	case Cell.sides.top:
		return (isEntry) ? '⬇' : '⬆';
	}
}

/**
 *
 *
 * @param {any} cell
 * @param {any} side
 * @param {boolean} [outer=false]
 * @returns
 */
function hasWall(cell, side, outer = false) {
	if (outer) {
		return (cell.outerWalls & side) === side;
	} else {
		return (cell.activeWalls & side) === side;
	}
}

/**
 *
 *
 * @param {any} cell
 * @param {any} isEntry
 */
function markCellAsEntryExit(cell, isEntry) {
	const
		entryElement = document.querySelector(`[data-row="${cell.row}"][data-column="${cell.column}`);

	for (let key in Cell.sides) {
		if (!Cell.sides.hasOwnProperty(key)) {
			continue;
		}

		const
			side = Cell.sides[key];

		if (
			hasWall(cell, side, true) &&
			!hasWall(cell, side)
		) {
			entryElement.textContent = getSymbolForSide(side, isEntry);
		}
	}
}

/**
 *
 *
 * @param {any} cell
 * @param {any} walls
 */
function setCellWalls(cell, walls) {
	for (let key in Cell.sides) {
		if (walls & Cell.sides[key]) {
			cell.classList.add(`border-${key}`);
		} else {
			cell.classList.remove(`border-${key}`);
		}
	}
}

/**
 *
 *
 */
function showEntryAndExitCell() {
	markCellAsEntryExit.call(this, this.mazeConfiguration.entryCell, true);
	markCellAsEntryExit.call(this, this.mazeConfiguration.exitCell, false);
}

/* == PRIVATE METHODS ======================================================= */



/* ========================================================================== *\
	PUBLIC API
\* ========================================================================== */

class MazeVisualiserDiv extends VisualiserBase {
	/* ====================================================================== *\
		CONSTRUCTOR
	\* ====================================================================== */
	constructor(baseElement) {
		super(baseElement);
	}
	/* == CONSTRUCTOR ======================================================= */



	/* ====================================================================== *\
		OVERRIDDEN METHODS
	\* ====================================================================== */

	__initVisualisation(rows, columns) {
		const
			output = this.baseElement.querySelector(selectors.output);
		if (output === null) {
			return;
		}

		// Set the width of the output element. This is needed so the flexbox
		// can tell when the cells need to wrap to the next row.
		output.style.width = `${(columns * this.cellSize)}px`;

		let
			htmlString = '';
		for (let row = 0; row < rows; row++) {
			const
				rowAttribute = `${attributeNames.row}="${row}"`;
			for (let column = 0; column < columns; column++) {
				const
					columnAttribute = `${ attributeNames.column }="${ column }"`;
				htmlString += `<div ${ rowAttribute } ${columnAttribute} class="${ cssClasses.cell }"></div>`;
			}
		}

		output.innerHTML = htmlString;
	}

	__finalizeVisualisation() {
		if (!isNil(this[propertyNames.previousElement])) {
			this[propertyNames.previousElement].classList.remove('current-cell');
		}

		emptyCellsTextContent(this.baseElement);
		showEntryAndExitCell.call(this);
	}

	__visualiseStep(historyRecord) {
		const
			{ cell, walls } = historyRecord,
			element = document.querySelector(`[data-row="${cell.row}"][data-column="${cell.column}`);

		if (element !== null) {
			if (element.classList.contains('is-active') && !element.classList.contains('is-visited')) {
				element.classList.remove('is-active');
				element.classList.add('is-visited');
			} else if (!element.classList.contains('is-visited')) {
				element.classList.add('is-active');
			}

			setCellWalls(element, walls);
			element.classList.add('current-cell');
			element.textContent = cell.order;

			if (!isNil(this[propertyNames.previousElement])) {
				this[propertyNames.previousElement].classList.remove('current-cell');
			}
			this[propertyNames.previousElement] = element;
		}
	}

	/* == OVERRIDDEN METHODS ================================================ */
}

/* == PUBLIC API ============================================================ */



/* ========================================================================== *\
	EXPORTS
\* ========================================================================== */

export default MazeVisualiserDiv;

/* == EXPORTS =============================================================== */
