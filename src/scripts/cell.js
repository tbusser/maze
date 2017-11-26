/* ========================================================================== *\
	IMPORTS
\* ========================================================================== */

import {
	getRandomInt
} from './utilities/utilities.js';

/* == IMPORTS =============================================================== */



/* ========================================================================== *\
	PRIVATE VARIABLES
\* ========================================================================== */

/**
 * An object for expressing the location of a cell within the maze.
 *
 * @typedef {Object} Location
 * @property {Number} column The horizontal position of the cell in the maze. The
 *           first cell is located at x=0.
 * @property {Number} row The vertical position of the cell in the maze. The
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
		column: Symbol('column'),
		outerWalls: Symbol('outerWalls'),
		paths: Symbol('paths'),
		row: Symbol('row'),
		walls: Symbol('walls')
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

	switch (side) {
	case sides.bottom:
		this.paths.push({
			column: this.column,
			row: this.row + 1
		});
		break;

	case sides.left:
		this.paths.push({
			column: this.column - 1,
			row: this.row
		});
		break;

	case sides.right:
		this.paths.push({
			column: this.column + 1,
			row: this.row
		});
		break;

	case sides.top:
		this.paths.push({
			column: this.column,
			row: this.row - 1
		});
		break;
	}
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
		this[propertyNames.column] = x;
		this[propertyNames.row] = y;
		this[propertyNames.outerWalls] = sides.none;
		this[propertyNames.walls] = sides.bottom | sides.left | sides.right | sides.top;
		this[propertyNames.paths] = [];
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
		return this[propertyNames.column];
	}
	/* -- column (read-only) ------------ */


	/* ---------------------------------- *\
		id (read-only)
	\* ---------------------------------- */
	get id() {
		return `${ this.column }_${ this.row }`
	}
	/* -- id (read-only) ---------- */


	/* ---------------------------------- *\
		location (read-only)
	\* ---------------------------------- */
	/**
	 * Returns the locations for the cell.
	 *
	 * @type {Location}
	 * @readonly
	 * @memberof Cell
	 */
	get location() {
		return {
			column: this[propertyNames.column],
			row: this[propertyNames.row]
		};
	}
	/* -- location (read-only) ---------- */


	/* ---------------------------------- *\
		paths (read-only)
	\* ---------------------------------- */
	get paths() {
		return this[propertyNames.paths];
	}
	/* -- paths (read-only) ------------- */


	/* ---------------------------------- *\
		numberOfNeighbors (read-only)
	\* ---------------------------------- */
	get numberOfNeighbors() {
		return this.paths.length;
	}
	/* -- numberOfNeighbors (read-only) - */


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
		return this[propertyNames.row];
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
	 * Returns an array with locations that may contain a cell. The returned
	 * locations are all direct neighbors of the cell instance.
	 *
	 * @returns {Array} The method returns an array with objects, each object
	 *          represents a potential location for a neighbor. It is possible
	 *          that a location doesn't represent a valid cell coordinate.
	 *
	 * @memberof Cell
	 */
	getNeighborsLocations() {
		return [
			{
				column: this.column - 1,
				row: this.row
			},
			{
				column: this.column + 1,
				row: this.row
			},
			{
				column: this.column,
				row: this.row - 1
			},
			{
				column: this.column,
				row: this.row + 1
			}
		];
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
