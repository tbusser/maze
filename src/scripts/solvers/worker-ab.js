/* ========================================================================== *\
	PRIVATE VARIABLES
\* ========================================================================== */

const
	decoder = new TextDecoder('utf-8'),
	encoder = new TextEncoder('utf-8');

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
	var object = decode(event.data);
	const
		startCell = object.startCell,
		visitedCells = new Set(),
		stack = [];

	if (object.maze != null) {
		maze = object.maze;
	}

	let
		cell = maze[startCell.row][startCell.column],
		result = {
			path: []
		};

	while (cell != null) {
		visitedCells.add(cell.id);

		const
			nextCellLocation = getRandomUnvisitedNeighbor(cell, maze, visitedCells);

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
	const
		arrayBuffer = encode(result);
	// now transfer array buffer
	postMessage(arrayBuffer, [arrayBuffer]);
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
 * @param {any} cell
 * @param {any} maze
 * @param {any} visitedCells
 */
function getRandomUnvisitedNeighbor(cell, maze, visitedCells) {
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
	} else if (validLocations.length === 1) {
		return validLocations[0];
	}

	const
		// Determine a random index for the array of valid cells.
		randomIndex = Math.floor(Math.random() * (validLocations.length));

	// Return the location for the randomly determined index.
	return validLocations[randomIndex];
}

/* == PRIVATE METHODS ======================================================= */



/* ========================================================================== *\
	INITIALIZATION
\* ========================================================================== */

self.addEventListener('message', onMessageReceived);

/* == INITIALIZATION ======================================================== */
