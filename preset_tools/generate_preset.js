#!/usr/bin/env node
"use strict";

const { performance } = require("node:perf_hooks");

function main() {
    const args = parseArgs(process.argv);
    if (args.showHelp) {
        printHelp();
        return;
    }

    const rows = ensurePositiveInteger(args.rows, "--rows");
    const cols = ensurePositiveInteger(args.cols, "--columns");
    args.rows = rows;
    args.cols = cols;
    const geometry = createGeometry(rows, cols);

    const startCoordRaw = args.startProvided ? args.start : [0, 0];
    const goalCoordRaw = args.goalProvided ? args.goal : [geometry.rows - 1, geometry.cols - 1];

    const startCoord = normalizeCoordinate(startCoordRaw, geometry, "Start");
    const goalCoord = normalizeCoordinate(goalCoordRaw, geometry, "Goal");
    args.start = startCoord;
    args.goal = goalCoord;

    const blockedCoords = args.blocked.map((coord) => normalizeCoordinate(coord, geometry, "Blocked"));
    args.blocked = blockedCoords;
    const blockedSet = new Set(blockedCoords.map(([row, col]) => coordsToId(row, col, geometry)));

    if (startCoord[0] === goalCoord[0] && startCoord[1] === goalCoord[1]) {
        throw new Error("Start and goal coordinates must be different.");
    }

    const startId = coordsToId(startCoord[0], startCoord[1], geometry);
    const goalId = coordsToId(goalCoord[0], goalCoord[1], geometry);

    if (blockedSet.has(startId)) {
        throw new Error("Start cell is blocked.");
    }
    if (blockedSet.has(goalId)) {
        throw new Error("Goal cell is blocked.");
    }

    const accessibleCount = geometry.totalCells - blockedSet.size;
    let goalRemainderMax = Math.floor(args.goalGap);
    if (!Number.isFinite(goalRemainderMax) || goalRemainderMax < 0) {
        throw new Error("--goal-gap must be a non-negative number.");
    }
    goalRemainderMax = Math.min(goalRemainderMax, Math.max(0, accessibleCount - 1));

    let targetVisited = args.targetVisited;
    let requiredGoalGap = null;
    if (targetVisited !== null && targetVisited !== undefined) {
        if (!Number.isFinite(targetVisited)) {
            throw new Error("--target-visited must be a finite number.");
        }
        targetVisited = Math.floor(targetVisited);
        if (targetVisited < 1) {
            throw new Error("--target-visited must be at least 1.");
        }
        if (targetVisited > accessibleCount) {
            throw new Error("--target-visited cannot exceed available cells.");
        }
        const impliedGap = accessibleCount - targetVisited;
        goalRemainderMax = Math.min(Math.max(0, impliedGap), Math.max(0, accessibleCount - 1));
        requiredGoalGap = goalRemainderMax;
    }

    const maxAttempts = Number.isFinite(args.maxAttempts) ? Math.max(1, Math.floor(args.maxAttempts)) : Number.NaN;
    if (!Number.isFinite(maxAttempts)) {
        throw new Error("--max-attempts must be a positive number.");
    }

    const maxTimeMs = Number.isFinite(args.maxTimeMs) ? Math.max(1, Number(args.maxTimeMs)) : Number.NaN;
    if (!Number.isFinite(maxTimeMs)) {
        throw new Error("--max-time must be a positive number.");
    }

    const maxBacktracks = Number.isFinite(args.maxBacktracks) ? Math.max(1, Math.floor(args.maxBacktracks)) : Number.NaN;
    if (!Number.isFinite(maxBacktracks)) {
        throw new Error("--max-backtracks must be a positive number.");
    }

    const context = buildSearchContext({
        geometry,
        startId,
        goalId,
        blockedSet,
        goalRemainderMax,
        maxBacktracks,
        targetVisited: targetVisited !== null && targetVisited !== undefined
            ? targetVisited
            : accessibleCount - goalRemainderMax,
        requiredGoalGap: requiredGoalGap ?? goalRemainderMax
    });

    const result = searchLongestPath({
        context,
        maxAttempts,
        maxTimeMs
    });

    if (result.visitedCount === 0) {
        console.log("Failed to reach the goal within the configured limits.");
        console.log(`Grid size: ${geometry.rows} x ${geometry.cols}`);
        console.log(JSON.stringify({
            start: args.start,
            goal: args.goal,
            blocked: args.blocked,
            visitedCount: 0,
            targetVisited: context.targetVisited,
            goalGap: context.goalRemainderMax,
            requiredGoalGap: context.requiredGoalGap,
            remainingCells: context.accessibleCount,
            rows: geometry.rows,
            cols: geometry.cols,
            attempts: result.attempts,
            elapsedMs: result.elapsedMs,
            reason: "no-path-found"
        }, null, 2));
        return;
    }

    const stats = result.stats ?? evaluatePathStats(result.path, context);
    const leftover = stats.leftoverCoords ?? [];

    const summary = {
        start: args.start,
        goal: args.goal,
        blocked: args.blocked,
        visitedCount: result.visitedCount,
        targetVisited: context.targetVisited,
        goalGap: context.goalRemainderMax,
        requiredGoalGap: context.requiredGoalGap,
        remainingCells: leftover.length,
    rows: geometry.rows,
    cols: geometry.cols,
        leftoverAdjacencyPairs: stats.leftoverAdjacencyPairs,
        turns: stats.turns,
        turnRatio: Number(stats.turnRatio.toFixed(3)),
        maxStraightSegment: stats.maxStraight,
        maxSameColumn: stats.maxSameColumn,
        maxSameRow: stats.maxSameRow,
        uniqueColumns: stats.uniqueColumns,
        uniqueRows: stats.uniqueRows,
        columnEntropy: Number(stats.columnEntropy.toFixed(3)),
        rowEntropy: Number(stats.rowEntropy.toFixed(3)),
        suggestedWalls: leftover.length > 0 ? leftover : undefined,
        path: result.path.map((id) => {
            const { row, col } = idToCoords(id, geometry);
            return [row, col];
        }),
        attempts: result.attempts,
        elapsedMs: Number(result.elapsedMs.toFixed(2))
    };

    console.log(`Grid size: ${summary.rows} x ${summary.cols}`);
    console.log(`Best path covers ${summary.visitedCount} cells (target: ${summary.targetVisited}, remaining: ${summary.remainingCells}, required gap: ${summary.requiredGoalGap}).`);
    console.log(`Turns: ${summary.turns}, turn ratio: ${summary.turnRatio}, longest straight segment: ${summary.maxStraightSegment}, leftover adjacency pairs: ${summary.leftoverAdjacencyPairs}`);
    console.log(`Leftover distribution -> max same column: ${summary.maxSameColumn}, max same row: ${summary.maxSameRow}, unique columns: ${summary.uniqueColumns}, entropy: ${summary.columnEntropy}`);
    if (summary.remainingCells > 0) {
        console.log(`Remaining cells (treat as walls for one-stroke): ${JSON.stringify(leftover)}`);
    }
    console.log(`Attempts: ${summary.attempts}, elapsed: ${summary.elapsedMs} ms`);
    console.log("Path (row,col):");
    console.log(summary.path.map((coords) => coords.join(",")).join(" -> "));
    console.log(JSON.stringify(summary, null, 2));
}

function parseArgs(argv) {
    const defaults = {
        start: [0, 0],
        goal: [9, 9],
        blocked: [],
        maxAttempts: 40,
        maxTimeMs: 5000,
        maxBacktracks: 60000,
        goalGap: 2,
        targetVisited: null,
        showHelp: false,
        rows: 10,
        cols: 10
    };

    const args = { ...defaults };
    let startProvided = false;
    let goalProvided = false;

    for (let index = 2; index < argv.length; index += 1) {
        const token = argv[index];
        switch (token) {
            case "--start":
                args.start = parseCoord(argv[++index]);
                startProvided = true;
                break;
            case "--goal":
                args.goal = parseCoord(argv[++index]);
                goalProvided = true;
                break;
            case "--blocked":
                args.blocked.push(...parseCoordList(argv[++index]));
                break;
            case "--max-attempts":
                args.maxAttempts = Number(argv[++index]);
                break;
            case "--max-time":
                args.maxTimeMs = Number(argv[++index]);
                break;
            case "--max-backtracks":
                args.maxBacktracks = Number(argv[++index]);
                break;
            case "--goal-gap":
                args.goalGap = Number(argv[++index]);
                break;
            case "--target-visited":
                args.targetVisited = Number(argv[++index]);
                break;
            case "--rows":
                args.rows = Number(argv[++index]);
                break;
            case "--columns":
            case "--cols":
                args.cols = Number(argv[++index]);
                break;
            case "--help":
            case "-h":
                args.showHelp = true;
                break;
            default:
                throw new Error(`Unknown argument: ${token}`);
        }
    }

    return {
        ...args,
        startProvided,
        goalProvided
    };
}

function parseCoord(serialised) {
    const parts = serialised.split(",").map((value) => Number(value.trim()));
    if (parts.length !== 2 || parts.some((value) => Number.isNaN(value))) {
        throw new Error(`Invalid coordinate: ${serialised}`);
    }
    return parts;
}

function parseCoordList(serialised) {
    return serialised.split(";").filter(Boolean).map(parseCoord);
}

function ensurePositiveInteger(value, flagName) {
    if (!Number.isFinite(value)) {
        throw new Error(`${flagName} must be a finite number.`);
    }
    const integer = Math.floor(value);
    if (integer !== value) {
        throw new Error(`${flagName} must be an integer.`);
    }
    if (integer < 1) {
        throw new Error(`${flagName} must be at least 1.`);
    }
    return integer;
}

function normalizeCoordinate(coord, geometry, label) {
    if (!Array.isArray(coord) || coord.length !== 2) {
        throw new Error(`${label} coordinate must be provided as ROW,COL.`);
    }
    const [rowRaw, colRaw] = coord;
    if (!Number.isFinite(rowRaw) || !Number.isFinite(colRaw)) {
        throw new Error(`${label} coordinate must contain finite numbers.`);
    }
    if (!Number.isInteger(rowRaw) || !Number.isInteger(colRaw)) {
        throw new Error(`${label} coordinate must contain integers.`);
    }
    const row = rowRaw;
    const col = colRaw;
    if (row < 0 || row >= geometry.rows || col < 0 || col >= geometry.cols) {
        throw new Error(`${label} coordinate [${row},${col}] is outside the ${geometry.rows}x${geometry.cols} grid.`);
    }
    return [row, col];
}

function printHelp() {
    console.log(`Usage: node generate_preset.js [options]

Options:
    --start ROW,COL        Start cell (default 0,0)
    --goal ROW,COL         Goal cell (default 9,9)
    --blocked LIST         Semicolon-separated list of blocked cells, e.g. "1,2;3,4"
    --rows N               Number of rows in the grid (default 10)
    --columns N            Number of columns in the grid (default 10)
    --max-attempts N       Number of randomized search attempts (default 40)
    --max-time MS          Time budget in milliseconds (default 5000)
    --max-backtracks N     Backtracking limit per attempt (default 60000)
    --goal-gap N           Allow ending with up to N unvisited cells (default 2)
    --target-visited N     Target number of visited cells before finishing
    -h, --help             Show this message
`);
}

function buildSearchContext({ geometry, startId, goalId, blockedSet, goalRemainderMax, maxBacktracks, targetVisited, requiredGoalGap }) {
    const blockedLookup = new Uint8Array(geometry.totalCells);
    blockedSet.forEach((id) => {
        blockedLookup[id] = 1;
    });

    const neighbors = computeNeighborLookup(blockedLookup, geometry);
    const accessibleCount = geometry.totalCells - blockedSet.size;
    const resolvedGoalGap = Math.min(Math.max(0, goalRemainderMax), Math.max(0, accessibleCount - 1));
    const resolvedRequiredGap = Math.max(0, Math.min(requiredGoalGap ?? 0, resolvedGoalGap));
    const minimumTarget = Math.max(1, accessibleCount - resolvedGoalGap);
    const exactTargetFloor = Math.max(1, accessibleCount - resolvedRequiredGap);
    const preferredTarget = targetVisited ?? minimumTarget;
    const resolvedTarget = Math.max(minimumTarget, Math.min(preferredTarget, exactTargetFloor));

    return {
        geometry,
        neighbors,
        blockedLookup,
        startId,
        goalId,
        totalCells: geometry.totalCells,
        accessibleCount,
        goalRemainderMax: resolvedGoalGap,
        maxBacktracks,
        targetVisited: resolvedTarget,
        requiredGoalGap: resolvedRequiredGap
    };
}

function searchLongestPath({ context, maxAttempts, maxTimeMs }) {
    const start = performance.now();
    const deadline = start + maxTimeMs;
    let bestStats = null;
    let attempts = 0;

    while (attempts < maxAttempts && performance.now() <= deadline) {
        attempts += 1;
        const attemptResult = runAttempt(context, deadline);
        if (attemptResult.visitedCount === 0) {
            continue;
        }
        if (!bestStats || isBetterPathStats(attemptResult, bestStats)) {
            bestStats = attemptResult;
        }
        if (
            attemptResult.visitedCount >= context.targetVisited &&
            attemptResult.leftoverAdjacencyPairs === 0
        ) {
            break;
        }
    }

    return {
        path: bestStats ? bestStats.path : [],
        visitedCount: bestStats ? bestStats.visitedCount : 0,
        attempts,
        elapsedMs: performance.now() - start,
        stats: bestStats
    };
}

function runAttempt(context, deadline) {
    const visited = new Uint8Array(context.totalCells);
    const path = [context.startId];
    visited[context.startId] = 1;

    const frames = [createFrame(context.startId, null, 0)];
    let bestStats = null;
    let backtracks = 0;

    while (frames.length > 0) {
        if (performance.now() > deadline) {
            break;
        }

        const frame = frames[frames.length - 1];

        if (frame.node === context.goalId) {
            const stats = evaluatePathStats(path, context);
            if (!bestStats || isBetterPathStats(stats, bestStats)) {
                bestStats = stats;
            }
            frames.pop();
            const removed = path.pop();
            visited[removed] = 0;
            continue;
        }

        if (frame.index >= frame.choices.length) {
            frames.pop();
            const removed = path.pop();
            visited[removed] = 0;
            backtracks += 1;
            if (backtracks >= context.maxBacktracks) {
                break;
            }
            continue;
        }

        const nextId = frame.choices[frame.index];
        frame.index += 1;

        if (nextId !== context.goalId && visited[nextId] === 1) {
            continue;
        }

        path.push(nextId);
        visited[nextId] = 1;

        if (nextId !== context.goalId && !canStillReachGoal(nextId, visited, context)) {
            visited[nextId] = 0;
            path.pop();
            continue;
        }

        const stepDirection = directionBetweenIds(frame.node, nextId, context.geometry);
        const nextRunLength = stepDirection && stepDirection === frame.direction
            ? frame.straightRun + 1
            : 1;
        frames.push(createFrame(nextId, stepDirection, nextRunLength));
    }

    return bestStats ?? {
        path: [],
        visitedCount: 0,
        turns: 0,
        turnRatio: 0,
        maxStraight: 0,
        leftoverCoords: [],
        leftoverAdjacencyPairs: Number.MAX_SAFE_INTEGER,
        maxSameColumn: Number.MAX_SAFE_INTEGER,
        maxSameRow: Number.MAX_SAFE_INTEGER,
        uniqueColumns: 0,
        uniqueRows: 0,
        columnEntropy: 0,
        rowEntropy: 0
    };

    function createFrame(node, incomingDirection, straightRun) {
        return {
            node,
            direction: incomingDirection,
            straightRun,
            choices: prepareChoices(node, visited, path, context, incomingDirection, straightRun),
            index: 0
        };
    }
}

function evaluatePathStats(path, context) {
    const geometry = context.geometry;
    const visitedSet = new Set(path);
    const leftoverIds = [];
    const leftoverCoords = [];
    const leftoverSet = new Set();

    for (let id = 0; id < context.totalCells; id += 1) {
        if (context.blockedLookup[id] === 1) {
            continue;
        }
        if (!visitedSet.has(id)) {
            leftoverIds.push(id);
            const { row, col } = idToCoords(id, geometry);
            leftoverCoords.push([row, col]);
            leftoverSet.add(id);
        }
    }

    let adjacencyPairs = 0;
    const columnCounts = new Map();
    const rowCounts = new Map();
    for (let index = 0; index < leftoverIds.length; index += 1) {
        const id = leftoverIds[index];
        const neighbors = getBasicNeighbors(id, geometry);
        for (let neighborIndex = 0; neighborIndex < neighbors.length; neighborIndex += 1) {
            const neighborId = neighbors[neighborIndex];
            if (leftoverSet.has(neighborId) && neighborId > id) {
                adjacencyPairs += 1;
            }
        }
        const { row, col } = idToCoords(id, geometry);
        columnCounts.set(col, (columnCounts.get(col) || 0) + 1);
        rowCounts.set(row, (rowCounts.get(row) || 0) + 1);
    }

    let turns = 0;
    let turnRatio = 0;
    let maxStraight = 0;
    let currentDirection = null;
    let currentRun = 0;

    for (let index = 1; index < path.length; index += 1) {
        const direction = directionBetweenIds(path[index - 1], path[index], geometry);
        if (direction && direction === currentDirection) {
            currentRun += 1;
        } else {
            if (currentDirection !== null) {
                turns += 1;
                if (currentRun > maxStraight) {
                    maxStraight = currentRun;
                }
            }
            currentDirection = direction;
            currentRun = 1;
        }
    }

    if (currentDirection !== null && currentRun > maxStraight) {
        maxStraight = currentRun;
    }

    const totalSteps = Math.max(0, path.length - 1);
    if (totalSteps > 0) {
        turnRatio = turns / totalSteps;
    }

    const maxSameColumn = columnCounts.size > 0 ? Math.max(...columnCounts.values()) : 0;
    const maxSameRow = rowCounts.size > 0 ? Math.max(...rowCounts.values()) : 0;
    const uniqueColumns = columnCounts.size;
    const uniqueRows = rowCounts.size;
    const columnEntropy = uniqueColumns > 1
        ? computeNormalisedEntropy(columnCounts.values())
        : 0;
    const rowEntropy = uniqueRows > 1
        ? computeNormalisedEntropy(rowCounts.values())
        : 0;

    return {
        path: path.slice(),
        visitedCount: path.length,
        turns,
        turnRatio,
        maxStraight,
        leftoverCoords,
        leftoverAdjacencyPairs: adjacencyPairs,
        maxSameColumn,
        maxSameRow,
        uniqueColumns,
        uniqueRows,
        columnEntropy,
        rowEntropy
    };
}

function computeNormalisedEntropy(countsIterable) {
    const counts = Array.from(countsIterable);
    const total = counts.reduce((sum, value) => sum + value, 0);
    if (total === 0) {
        return 0;
    }
    const unique = counts.length;
    if (unique <= 1) {
        return 0;
    }
    const base = Math.log(unique);
    if (base === 0) {
        return 0;
    }
    let entropy = 0;
    for (let index = 0; index < counts.length; index += 1) {
        const probability = counts[index] / total;
        entropy += -probability * Math.log(probability);
    }
    return entropy / base;
}

function isBetterPathStats(candidate, current) {
    if (!current) {
        return true;
    }
    if (candidate.visitedCount !== current.visitedCount) {
        return candidate.visitedCount > current.visitedCount;
    }
    if (candidate.leftoverAdjacencyPairs !== current.leftoverAdjacencyPairs) {
        return candidate.leftoverAdjacencyPairs < current.leftoverAdjacencyPairs;
    }
    if (candidate.maxSameColumn !== current.maxSameColumn) {
        return candidate.maxSameColumn < current.maxSameColumn;
    }
    if (candidate.maxSameRow !== current.maxSameRow) {
        return candidate.maxSameRow < current.maxSameRow;
    }
    if (candidate.uniqueColumns !== current.uniqueColumns) {
        return candidate.uniqueColumns > current.uniqueColumns;
    }
    if (candidate.columnEntropy !== current.columnEntropy) {
        return candidate.columnEntropy > current.columnEntropy;
    }
    if (candidate.uniqueRows !== current.uniqueRows) {
        return candidate.uniqueRows > current.uniqueRows;
    }
    if (candidate.rowEntropy !== current.rowEntropy) {
        return candidate.rowEntropy > current.rowEntropy;
    }
    if (candidate.turnRatio !== current.turnRatio) {
        return candidate.turnRatio > current.turnRatio;
    }
    if (candidate.maxStraight !== current.maxStraight) {
        return candidate.maxStraight < current.maxStraight;
    }
    if (candidate.turns !== current.turns) {
        return candidate.turns > current.turns;
    }
    return false;
}

function prepareChoices(node, visited, path, context, incomingDirection, straightRun) {
    const options = context.neighbors[node];
    if (!options) {
        return [];
    }

    const entries = [];
    const baseLength = path.length;

    for (let index = 0; index < options.length; index += 1) {
        const candidate = options[index];
        const stepDirection = directionBetweenIds(node, candidate, context.geometry);
        const nextRunLength = stepDirection && stepDirection === incomingDirection ? straightRun + 1 : 1;

        if (candidate === context.goalId) {
            const remainderAfterMove = context.accessibleCount - (baseLength + 1);
            if (remainderAfterMove > context.goalRemainderMax) {
                continue;
            }
            if (remainderAfterMove < context.requiredGoalGap) {
                continue;
            }
            entries.push({
                id: candidate,
                availableMoves: Number.MAX_SAFE_INTEGER,
                distance: 0,
                nextRunLength,
                random: Math.random()
            });
            continue;
        }
        if (visited[candidate] === 1) {
            continue;
        }
        const availableMoves = countFreeNeighbors(candidate, visited, context, baseLength + 1);
        const distance = manhattanDistance(candidate, context.goalId, context.geometry);
        entries.push({
            id: candidate,
            availableMoves,
            distance,
            nextRunLength,
            random: Math.random()
        });
    }

    entries.sort((a, b) => {
        if (a.availableMoves !== b.availableMoves) {
            return a.availableMoves - b.availableMoves;
        }
        if (a.nextRunLength !== b.nextRunLength) {
            return a.nextRunLength - b.nextRunLength;
        }
        if (a.distance !== b.distance) {
            return a.distance - b.distance;
        }
        return a.random - b.random;
    });

    return entries.map((entry) => entry.id);
}

function countFreeNeighbors(node, visited, context, pathLengthAfterEntering) {
    const options = context.neighbors[node];
    let count = 0;
    for (let index = 0; index < options.length; index += 1) {
        const candidate = options[index];
        if (candidate === context.goalId) {
            if (visited[candidate] === 1) {
                continue;
            }
            const remainderAfterMove = context.accessibleCount - (pathLengthAfterEntering + 1);
            if (remainderAfterMove > context.goalRemainderMax) {
                continue;
            }
            if (remainderAfterMove < context.requiredGoalGap) {
                continue;
            }
            count += 1;
            continue;
        }
        if (visited[candidate] === 1) {
            continue;
        }
        count += 1;
    }
    return count;
}

function canStillReachGoal(fromId, visited, context) {
    if (visited[context.goalId] === 1) {
        return fromId === context.goalId;
    }
    const queue = [fromId];
    const seen = new Uint8Array(context.totalCells);
    seen[fromId] = 1;
    while (queue.length > 0) {
        const current = queue.shift();
        const neighbors = context.neighbors[current];
        for (let index = 0; index < neighbors.length; index += 1) {
            const candidate = neighbors[index];
            if (seen[candidate] === 1) {
                continue;
            }
            if (visited[candidate] === 1 && candidate !== context.goalId) {
                continue;
            }
            if (candidate === context.goalId) {
                return true;
            }
            seen[candidate] = 1;
            queue.push(candidate);
        }
    }
    return false;
}

function computeNeighborLookup(blockedLookup, geometry) {
    const neighbors = new Array(geometry.totalCells);
    for (let id = 0; id < geometry.totalCells; id += 1) {
        if (blockedLookup[id] === 1) {
            neighbors[id] = [];
            continue;
        }
        neighbors[id] = getBasicNeighbors(id, geometry).filter((neighbor) => blockedLookup[neighbor] === 0);
    }
    return neighbors;
}

function getBasicNeighbors(id, geometry) {
    const { row, col } = idToCoords(id, geometry);
    const results = [];
    if (row > 0) {
        results.push(coordsToId(row - 1, col, geometry));
    }
    if (row < geometry.rows - 1) {
        results.push(coordsToId(row + 1, col, geometry));
    }
    if (col > 0) {
        results.push(coordsToId(row, col - 1, geometry));
    }
    if (col < geometry.cols - 1) {
        results.push(coordsToId(row, col + 1, geometry));
    }
    return results;
}

function directionBetweenIds(fromId, toId, geometry) {
    const from = idToCoords(fromId, geometry);
    const to = idToCoords(toId, geometry);
    const rowDiff = to.row - from.row;
    const colDiff = to.col - from.col;
    if (rowDiff === -1 && colDiff === 0) {
        return "up";
    }
    if (rowDiff === 1 && colDiff === 0) {
        return "down";
    }
    if (rowDiff === 0 && colDiff === -1) {
        return "left";
    }
    if (rowDiff === 0 && colDiff === 1) {
        return "right";
    }
    return null;
}

function createGeometry(rows, cols) {
    return {
        rows,
        cols,
        totalCells: rows * cols,
        allCellIds: Array.from({ length: rows * cols }, (_, index) => index)
    };
}

function coordsToId(row, col, geometry) {
    return row * geometry.cols + col;
}

function idToCoords(id, geometry) {
    const row = Math.floor(id / geometry.cols);
    const col = id % geometry.cols;
    return { row, col };
}

function manhattanDistance(idA, idB, geometry) {
    const a = idToCoords(idA, geometry);
    const b = idToCoords(idB, geometry);
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

if (require.main === module) {
    main();
}
