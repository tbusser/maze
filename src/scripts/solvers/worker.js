/* ========================================================================== *\
	PRIVATE VARIABLES
\* ========================================================================== */

let
	maze = null;

/* == PRIVATE VARIABLES ===================================================== */



/* ========================================================================== *\
	EVENT HANDLING
\* ========================================================================== */

/**
 *
 *
 * @param {any} event
 */
function onMessageReceived(event) {
	const
		startCell = event.data.startCell,
		visitedCells = new Set(),
		stack = [];

	if (event.data.maze != null) {
		maze = event.data.maze;
	}

	let
		cell = maze[startCell.row][startCell.column],
		result = {
			path: []
		};

	while (cell != null) {
		visitedCells.add(cell.id);

		const
			nextCellLocation = getRandomUnvisitedNeighbor(cell, visitedCells);

		if (nextCellLocation === null) {
			if (
				(stack.length + 1) > result.path.length &&
				cell.outerWalls !== 0
			) {
				const
					path = stack.slice(0);
				path.push(cell);
				result = {
					toCell: cell,
					path
				};
			}
			cell = stack.pop();
			continue;
		}

		const
			nextCell = maze[nextCellLocation.row][nextCellLocation.column];
		stack.push(cell);
		cell = nextCell;
	}

	result.fromLocation = startCell;

	postMessage(result);
}

/* == EVENT HANDLING ======================================================== */



/* ========================================================================== *\
	PRIVATE METHODS
\* ========================================================================== */

/**
 *
 *
 * @param {any} cell
 * @param {any} maze
 * @param {any} visitedCells
 */
function getRandomUnvisitedNeighbor(cell, visitedCells) {
	const
		// Filter the locations to remove all locations which:
		// - Fall outside of the grid;
		// - Have already been visited.
		validLocations = cell.paths.filter(location => {
			const
				{ column, row } = location;

			return !visitedCells.has(`${column}_${row}`);
		});

	// When there are no valid neighbors, return null. In case there is just a
	// single valid neighbor, return it.
	if (validLocations.length === 0) {
		return null;
	} else {
		return validLocations[validLocations.length - 1];
	}
}

/* == PRIVATE METHODS ======================================================= */



/* ========================================================================== *\
	INITIALIZATION
\* ========================================================================== */

self.addEventListener('message', onMessageReceived);

/* == INITIALIZATION ======================================================== */
