let
	maze = null;

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
			nextCellLocation = getRandomUnvisitedNeighbor(cell, maze, visitedCells);

		if (nextCellLocation === null) {
			if (stack.length > result.path.length && cell.outerWalls !== 0) {
				result = {
					toCell: cell,
					path: stack.slice(0)
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
	result.fromCell = startCell;

	postMessage(result);
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

			return !visitedCells.has(`${ column }_${ row }`);
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

self.addEventListener('message', onMessageReceived);