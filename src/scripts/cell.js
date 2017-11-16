/* ========================================================================== *\
	IMPORTS
\* ========================================================================== */

import {
	getRandomInt
} from './utilities.js';

/* == IMPORTS =============================================================== */



/* ========================================================================== *\
	PRIVATE VARIABLES
\* ========================================================================== */

/**
 * An object for expressing the location of a cell within the maze.
 *
 * @typedef {Object} Coordinate
 * @property {Number} x The horizontal position of the cell in the maze. The
 *           first cell is located at x=0.
 * @property {Number} y The vertical position of the cell in the maze. The
 *           first cell is located at y=0.
 */

/**
 * Definitions of the sides of the cell.
 *
 * @typedef {Number} Sides
 */

/**
 * Definitions of the sides of the cell.
 *
 * @readonly
 * @enum {Sides}
 */
const
	sides = {
		/** No sides. */
		none: 0,
		/** The top side of the cell. */
		top: 0b0001,
		/** The right side of the cell. */
		right: 0b0010,
		/** The bottom side of the cell. */
		bottom: 0b0100,
		/** The left side of the cell. */
		left: 0b1000
	};

const
	propertyNames = {
		isVisited: Symbol('isVisited'),
		outerWalls: Symbol('outerWalls'),
		walls: Symbol('walls'),
		x: Symbol('column'),
		y: Symbol('row')
	};

/* == PRIVATE VARIABLES ===================================================== */



/* ========================================================================== *\
	PRIVATE METHODS
\* ========================================================================== */

/**
 * Returns the opposite side of the provided side.
 *
 * @param {Sides} side The side whose opposite to return.
 *
 * @returns {Sides} The opposite side of the provided side.
 */
function getOppositeSide(side) {
	switch (side) {
	case sides.bottom:
		return sides.top;

	case sides.left:
		return sides.right;

	case sides.right:
		return sides.left;

	case sides.top:
		return sides.bottom;

	default:
		return 0;
	}
}

/**
 * Returns the side that the cell instance has in common with the provided cell.
 *
 * @param {Cell} cell The adjoining cell.
 *
 * @returns {Sides} The side of the cell that is shares with the provided cell.
 *          When the cells don't share any walls, because they aren't neighbors,
 *          the result will be 0.
 */
function getSharedSide(cell) {
	if (!this.isNeighborsWith(cell)) {
		return 0;
	}

	const
		columnDifference = this.column - cell.column,
		rowDifference = this.row - cell.row;

	if (columnDifference === -1) {
		return sides.right;
	} else if (columnDifference === 1) {
		return sides.left;
	} else if (rowDifference === -1) {
		return sides.bottom;
	} else {
		return sides.top;
	}
}

/**
 * Returns whether or not the cell has a wall at the provided side.
 *
 * @param {Sides} side The side to check for the existance of a a wall.
 *
 * @returns {Boolean} Returns true when the cell has a wall at the provided
 *          side; otherwise the result is false.
 */
function hasWall(side) {
	return (this[propertyNames.walls] & side) === side;
}


/**
 * Removes one of the walls of the cell.
 *
 * @param {Sides} side The side of the cell from which to remove the wall.
 */
function removeWall(side) {
	this[propertyNames.walls] ^= side;
}

/* == PRIVATE METHODS ======================================================= */


/* ========================================================================== *\
	PUBLIC API
\* ========================================================================== */

class Cell {
	/* ====================================================================== *\
		CONSTRUCTOR
	\* ====================================================================== */
	constructor(x, y) {
		this[propertyNames.x] = x;
		this[propertyNames.y] = y;
		this[propertyNames.isVisited] = false;
		this[propertyNames.outerWalls] = sides.none;
		this[propertyNames.walls] = sides.bottom | sides.left | sides.right | sides.top;
	}
	/* == CONSTRUCTOR ======================================================= */



	/* ====================================================================== *\
		STATIC PROPERTIES
	\* ====================================================================== */

	/**
	 * The sides of the cell.
	 *
	 * @enum {Sides}
	 * @readonly
	 */
	static get sides() {
		return sides;
	}

	/* == STATIC PROPERTIES ================================================= */



	/* ====================================================================== *\
		INSTANCE PROPERTIES
	\* ====================================================================== */

	/* ---------------------------------- *\
		activeWalls (read-only)
	\* ---------------------------------- */
	get activeWalls() {
		return this[propertyNames.walls];
	}
	/* -- activeWalls (read-only) ------- */


	/* ---------------------------------- *\
		column (read-only)
	\* ---------------------------------- */
	/**
	 * The column in which the cell is located. This value is 0-bound.
	 *
	 * @type {Number}
	 * @readonly
	 * @memberof Cell
	 */
	get column() {
		return this[propertyNames.x];
	}
	/* -- column (read-only) ------------ */


	/* ---------------------------------- *\
		coordinate (read-only)
	\* ---------------------------------- */
	/**
	 * Returns the coordinates for the cell.
	 *
	 * @type {Coordinate}
	 * @readonly
	 * @memberof Cell
	 */
	get coordinate() {
		return {
			x: this[propertyNames.x],
			y: this[propertyNames.y]
		};
	}
	/* -- coordinate (read-only) -------- */


	/* ---------------------------------- *\
		isVisited (read-only)
	\* ---------------------------------- */
	/**
	 * By default this property is false. It will return true after the method
	 * to mark the cell as visited has been called at least once.
	 *
	 * @type {Boolean}
	 * @readonly
	 * @memberof Cell
	 */
	get isVisited() {
		return this[propertyNames.isVisited];
	}
	/* -- isVisited (read-only) --------- */


	/* ---------------------------------- *\
		outerWalls (read-only)
	\* ---------------------------------- */
	/**
	 * A bitmask for which sides of the cell are outer walls.
	 *
	 * @type {Sides}
	 * @readonly
	 * @memberof Cell
	 */
	get outerWalls() {
		return this[propertyNames.outerWalls];
	}
	/* -- outerWalls (read-only) -------- */


	/* ---------------------------------- *\
		row (read-only)
	\* ---------------------------------- */
	/**
	 * The row in which the cell is located. This value is 0-bound.
	 *
	 * @type {Number}
	 * @readonly
	 * @memberof Cell
	 */
	get row() {
		return this[propertyNames.y];
	}
	/* -- row (read-only) --------------- */

	/* == INSTANCE PROPERTIES =============================================== */



	/* ====================================================================== *\
		PUBLIC METHODS
	\* ====================================================================== */

	/**
	 * Removes the wall shared between the instance and the provided cell. Both
	 * the instance and the provided cell will be altered.
	 *
	 * @param {Cell} cell The cell with which the shared wall should
	 *        be removed.
	 */
	createPathTo(cell) {
		// Get the side which is shared between the instance and the
		// provided cell.
		const
			sharedSide = getSharedSide.call(this, cell);
		// When there is no shared side, exit the method.
		if (sharedSide === 0) {
			return;
		}

		// Remove the wall for the instance.
		removeWall.call(this, sharedSide);
		// Remove the wall on the opposite side of the neighboring cell.
		removeWall.call(cell, getOppositeSide(sharedSide));
	}

	/**
	 * Returns whether or not there is a path between two adjoining cells.
	 *
	 * @param {Cell} cell The cell to check for if there is a direct path
	 *        between between the two cells.
	 *
	 * @returns {Boolean} When there is a path between the two cells the method
	 *          will return two; When there is a wall between the two cells or
	 *          if the cells aren't neighbors, the method returns false.
	 *
	 * @memberof Cell
	 */
	hasPathTo(cell) {
		const
			sharedSide = getSharedSide.call(this, cell);
		if (sharedSide === 0) {
			return false;
		}

		return !hasWall.call(this, sharedSide);
	}

	/**
	 * Checks if the provided cell is a neighbor of the current cell. Cells are
	 * considered neighbors when their column or row are adjacent. The cells are
	 * not considered neighbors when both the column and row are different.
	 *
	 * @param {Cell} potentialNeighbor The potential to neighbor to evaluate.
	 *
	 * @returns {Boolean} When the cells are in adjacent columns or in adjacent
	 *          rows, the result will be true; otherwise the result is false.
	 *
	 * @memberof Cell
	 */
	isNeighborsWith(potentialNeighbor) {
		const
			columnDifference = Math.abs(this.column - potentialNeighbor.column),
			rowDifference = Math.abs(this.row - potentialNeighbor.row),
			areHorizontalNeighbors = (columnDifference === 1),
			areVerticalNeighbors = (rowDifference === 1);

		// The cells are neighbors when their columns are one apart OR if their
		// rows are one apart. They're not neighbors when both the row and
		// columns are different.
		return (
			(areVerticalNeighbors && columnDifference === 0) ||
			(areHorizontalNeighbors && rowDifference === 0)
		)
	}

	/**
	 * Marks the cell as visited.
	 *
	 * @memberof Cell
	 */
	markAsVisited() {
		this[propertyNames.isVisited] = true;
	}

	/**
	 * Removes a, randomly selected, outer wall from the cell.
	 *
	 * @returns
	 * @memberof Cell
	 */
	removeRandomOuterWall() {
		// When the cell has no outer walls, there is nothing to do.
		if (this.outerWalls === sides.none) {
			return;
		}

		const
			outerSides = [];
		// Iterate over all the sides and check if that side happens to be an
		// outer side for the cell. When it is, place the side in the array of
		// outer sides.
		for (let key in sides) {
			if (this.outerWalls & sides[key]) {
				outerSides.push(sides[key]);
			}
		}

		const
			// Pick a random index when there is more than 1 outside wall, else
			// just select the single index.
			randomIndex = (outerSides.length === 1)
				? 0
				: getRandomInt(0, outerSides.length - 1),
			// Get the side at the selected index.
			selectedSide = outerSides[randomIndex];

		// Remove the wall at the selected side that is on the outside of
		// the maze.
		removeWall.call(this, selectedSide);
	}

	/**
	 * Sets an outer wall for a cell.
	 *
	 * @param {Sides} side The side to mark as an outer wall.
	 *
	 * @memberof Cell
	 */
	setOuterWall(side) {
		this[propertyNames.outerWalls] |= side;
	}
	/* == PUBLIC METHODS ==================================================== */
}

/* == PUBLIC API ============================================================ */



/* ========================================================================== *\
	EXPORTS
\* ========================================================================== */

export default Cell;

/* == EXPORTS =============================================================== */
