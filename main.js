(() => {
    const ROWS = 6;
    const COLS = 6;
    const TOTAL_CELLS = ROWS * COLS;
    const ALL_CELL_IDS = Array.from({ length: TOTAL_CELLS }, (_, i) => i);

    const difficultyConfig = {
        easy: {
            key: "easy",
            label: "かんたん",
            requireFullCover: false,
            giveLiveWarning: true,
            startGoalStyle: "edgeCorners",
            blockStyle: "guided"
        },
        normal: {
            key: "normal",
            label: "ふつう",
            requireFullCover: true,
            giveLiveWarning: "onlyWhenDead",
            startGoalStyle: "edgeMixed",
            blockStyle: "balanced"
        },
        hard: {
            key: "hard",
            label: "むずかしい",
            requireFullCover: true,
            giveLiveWarning: false,
            startGoalStyle: "mixedInterior",
            blockStyle: "trappy"
        }
    };

    const EASY_PRESETS = [
        {
            start: [0, 1],
            goal: [5, 4],
            path: [
                [0, 1], [0, 2], [1, 2], [2, 2], [2, 3], [1, 3], [0, 3], [0, 4], [1, 4], [2, 4],
                [3, 4], [4, 4], [5, 4]
            ]
        },
        {
            start: [0, 4],
            goal: [5, 1],
            path: [
                [0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [4, 3],
                [4, 2], [3, 2], [2, 2], [1, 2], [0, 2], [0, 1],
                [1, 1], [2, 1], [3, 1], [4, 1], [5, 1]
            ]
        },
        {
            start: [0, 2],
            goal: [5, 3],
            path: [
                [0, 2], [1, 2], [1, 3], [2, 3], [2, 2], [2, 1], [1, 1],
                [0, 1], [0, 0], [1, 0], [2, 0], [3, 0],
                [4, 0], [5, 0], [5, 1], [5, 2], [5, 3]
            ]
        },
        {
            start: [0, 3],
            goal: [5, 2],
            path: [
                [0, 3], [0, 4], [0, 5], [1, 5], [2, 5], [3, 5],
                [4, 5], [4, 4], [4, 3], [4, 2], [5, 2]
            ]
        },
        {
            start: [0, 5],
            goal: [5, 3],
            path: [
                [0, 5], [1, 5], [2, 5], [3, 5], [3, 4], [3, 3],
                [3, 2], [3, 1], [3, 0], [4, 0], [5, 0], [5, 1],
                [5, 2], [5, 3]
            ]
        },
    ];

    const NORMAL_START_GOAL_OPTIONS = [
        {
            start: [0, 0],
            goal: [5, 5],
            path: [
                [0, 0], [0, 1], [0, 2], [0, 3], [1, 3], [2, 3], [2, 2], [2, 1],
                [1, 1], [1, 0], [2, 0], [3, 0], [4, 0], [4, 1], [4, 2], [3, 2],
                [3, 3], [3, 4], [2, 4], [1, 4], [1, 5], [2, 5], [3, 5], [4, 5],
                [5, 5]
            ]
        },
        {
            start: [0, 1],
            goal: [5, 4],
            path: [
                [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [1, 5], [1, 4], [1, 3],
                [1, 2], [1, 1], [1, 0], [2, 0], [2, 1], [2, 2], [2, 3], [2, 4],
                [3, 4], [4, 4], [5, 4]
            ]
        },
        {
            start: [1, 0],
            goal: [4, 5],
            path: [
                [1, 0], [0, 0], [0, 1], [1, 1], [2, 1], [2, 2], [1, 2], [0, 2],
                [0, 3], [1, 3], [2, 3], [3, 3], [3, 4], [2, 4], [1, 4], [0, 4],
                [0, 5], [1, 5], [2, 5], [3, 5], [4, 5]
            ]
        },
        {
            start: [0, 4],
            goal: [5, 1],
            path: [
                [0, 4], [0, 3], [0, 2], [0, 1], [0, 0], [1, 0], [2, 0], [3, 0],
                [3, 1], [3, 2], [2, 2], [1, 2], [1, 3], [1, 4], [1, 5], [2, 5],
                [3, 5], [4, 5], [4, 4], [4, 3], [4, 2], [5, 2], [5, 1]
            ]
        },
        {
            start: [1, 5],
            goal: [4, 0],
            path: [
                [1, 5], [0, 5], [0, 4], [0, 3], [1, 3], [2, 3], [2, 4], [2, 5],
                [3, 5], [4, 5], [5, 5], [5, 4], [5, 3], [4, 3], [3, 3], [3, 2],
                [3, 1], [2, 1], [1, 1], [1, 0], [2, 0], [3, 0], [4, 0]
            ]
        }
    ];

    const HARD_START_GOAL_OPTIONS = [
        {
            start: [2, 2],
            goal: [3, 3],
            path: [
                [2, 2], [1, 2], [0, 2], [0, 3], [0, 4], [0, 5], [1, 5], [2, 5],
                [3, 5], [4, 5], [5, 5], [5, 4], [5, 3], [5, 2], [5, 1], [5, 0],
                [4, 0], [3, 0], [2, 0], [1, 0], [0, 0], [0, 1], [1, 1], [2, 1],
                [3, 1], [4, 1], [4, 2], [4, 3], [4, 4], [3, 4], [2, 4], [1, 4],
                [1, 3], [2, 3], [3, 3]
            ]
        },
        {
            start: [1, 2],
            goal: [4, 3],
            path: [
                [1, 2], [1, 1], [1, 0], [0, 0], [0, 1], [0, 2], [0, 3], [0, 4],
                [0, 5], [1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [5, 4], [5, 3],
                [5, 2], [5, 1], [5, 0], [4, 0], [3, 0], [2, 0], [2, 1], [2, 2],
                [2, 3], [3, 3], [4, 3]
            ]
        },
        {
            start: [2, 1],
            goal: [3, 4],
            path: [
                [2, 1], [2, 0], [1, 0], [0, 0], [0, 1], [0, 2], [1, 2], [1, 3],
                [0, 3], [0, 4], [0, 5], [1, 5], [2, 5], [2, 4], [2, 3], [3, 3],
                [4, 3], [4, 4], [5, 4], [5, 5], [4, 5], [3, 5], [3, 4]
            ]
        },
        {
            start: [2, 3],
            goal: [3, 2],
            path: [
                [2, 3], [3, 3], [4, 3], [5, 3], [5, 2], [5, 1], [5, 0], [4, 0],
                [3, 0], [2, 0], [1, 0], [0, 0], [0, 1], [0, 2], [0, 3], [0, 4],
                [0, 5], [1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [5, 4], [4, 4],
                [3, 4], [2, 4], [1, 4], [1, 3], [1, 2], [1, 1], [2, 1], [3, 1],
                [3, 2]
            ]
        },
        {
            start: [1, 3],
            goal: [4, 2],
            path: [
                [1, 3], [0, 3], [0, 2], [0, 1], [0, 0], [1, 0], [2, 0], [3, 0],
                [4, 0], [5, 0], [5, 1], [5, 2], [5, 3], [5, 4], [5, 5], [4, 5],
                [3, 5], [2, 5], [1, 5], [0, 5], [0, 4], [1, 4], [2, 4], [3, 4],
                [4, 4], [4, 3], [3, 3], [2, 3], [2, 2], [3, 2], [4, 2]
            ]
        }
    ];

    const boardContainer = document.getElementById("board");
    const statusBar = document.getElementById("statusBar");
    const difficultySelect = document.getElementById("difficultySelect");
    const resetButton = document.getElementById("resetButton");
    const nextButton = document.getElementById("nextButton");

    const boardState = {
        difficultyKey: "easy",
        config: difficultyConfig.easy,
        startId: 0,
        goalId: 0,
        blockedSet: new Set(),
        blockedMask: 0n,
        accessibleCount: TOTAL_CELLS,
        neighbors: []
    };

    const DIFFICULTY_KEYS = Object.keys(difficultyConfig);
    const presetStock = {
        easy: [],
        normal: [],
        hard: []
    };
    const presetGenerationInFlight = {
        easy: false,
        normal: false,
        hard: false
    };
    const scheduleBackgroundTask = (typeof window !== "undefined" && typeof window.requestIdleCallback === "function")
        ? (callback) => window.requestIdleCallback(callback)
        : (callback) => window.setTimeout(callback, 0);

    const cellsById = new Array(TOTAL_CELLS);
    const cellLabels = new Array(TOTAL_CELLS);
    const cellPipes = new Array(TOTAL_CELLS);
    let path = [];
    let visited = new Set();
    let gameEnded = false;
    let activePointerId = null;
    let isDragging = false;
    let warningTimer = null;
    let lastDeadCellId = null;

    init();

    function init() {
        initBoard();
    initDifficultySelector();
        initControlButtons();
        primeInitialPresets();
        startNewGame("easy");
    window.addEventListener("pointerup", handleGlobalPointerUp, { passive: true });
    window.addEventListener("pointercancel", handleGlobalPointerUp, { passive: true });
    window.addEventListener("pointermove", handleGlobalPointerMove, { passive: false });
    boardContainer.addEventListener("contextmenu", (event) => event.preventDefault());
    }

    function initBoard() {
        const fragment = document.createDocumentFragment();
        for (let row = 0; row < ROWS; row += 1) {
            for (let col = 0; col < COLS; col += 1) {
                const cell = document.createElement("div");
                const id = coordsToId(row, col);
                cell.className = "cell";
                cell.dataset.row = String(row);
                cell.dataset.col = String(col);
                cell.dataset.id = String(id);
                cell.addEventListener("pointerdown", handlePointerDown, { passive: false });
                cell.addEventListener("pointerenter", handlePointerEnter, { passive: true });
                cell.addEventListener("pointerup", handlePointerUp, { passive: true });
                cell.addEventListener("pointercancel", handlePointerUp, { passive: true });
                const label = document.createElement("span");
                label.className = "cell-label";
                cell.appendChild(label);
                cellLabels[id] = label;

                const pipes = {};
                ["center", "up", "down", "left", "right"].forEach((dir) => {
                    const pipe = document.createElement("span");
                    pipe.className = dir === "center" ? "pipe pipe-center" : `pipe pipe-${dir}`;
                    cell.appendChild(pipe);
                    pipes[dir] = pipe;
                });
                cellPipes[id] = pipes;
                fragment.appendChild(cell);
                cellsById[id] = cell;
            }
        }
        boardContainer.appendChild(fragment);
    }

    function initDifficultySelector() {
        if (!difficultySelect) {
            return;
        }
        difficultySelect.addEventListener("change", (event) => {
            const target = event.target;
            const key = target.value;
            if (key && difficultyConfig[key]) {
                startNewGame(key);
            }
        });
    }

    // Wires up the reset and next-problem controls.
    function initControlButtons() {
        if (resetButton) {
            resetButton.addEventListener("click", () => {
                resetPathState();
                setStatusMessage("やり直しました。同じ盤面に再挑戦しましょう。", "info");
            });
        }
        if (nextButton) {
            nextButton.addEventListener("click", () => {
                startNewGame(boardState.difficultyKey);
            });
        }
    }

    function primeInitialPresets() {
        DIFFICULTY_KEYS.forEach((key) => {
            primePresetStock(key);
        });
    }

    function primePresetStock(key) {
        const stock = presetStock[key];
        if (!stock) {
            return;
        }
        while (stock.length < 1) {
            stock.push(createBoardPreset(key));
        }
    }

    function consumePresetFromStock(key) {
        const stock = presetStock[key];
        if (!stock || stock.length === 0) {
            primePresetStock(key);
        }
        const preset = presetStock[key].shift();
        schedulePresetReplenish(key);
        return preset;
    }

    function schedulePresetReplenish(key) {
        if (presetStock[key].length >= 1 || presetGenerationInFlight[key]) {
            return;
        }
        presetGenerationInFlight[key] = true;
        scheduleBackgroundTask(() => {
            try {
                const nextPreset = createBoardPreset(key);
                presetStock[key].push(nextPreset);
            } catch (error) {
                console.error("Preset generation failed for", key, error);
            } finally {
                presetGenerationInFlight[key] = false;
                if (presetStock[key].length < 1) {
                    schedulePresetReplenish(key);
                }
            }
        });
    }

    // Rebuilds the board for the selected difficulty.
    function startNewGame(key) {
        boardState.difficultyKey = key;
        boardState.config = difficultyConfig[key];
        const preset = consumePresetFromStock(key);
        applyPreset(preset);
        resetPathState();
        setStatusMessage("スタートマスをなぞってください。", "info");
        updateDifficultySelection(key);
    }

    function applyPreset(preset) {
        const startId = coordsToId(preset.start[0], preset.start[1]);
        const goalId = coordsToId(preset.goal[0], preset.goal[1]);
        const blockedSet = new Set(preset.blocked);
        boardState.startId = startId;
        boardState.goalId = goalId;
        boardState.blockedSet = blockedSet;
        boardState.blockedMask = setToMask(blockedSet);
        boardState.accessibleCount = TOTAL_CELLS - blockedSet.size;
        boardState.neighbors = computeNeighborLookup(blockedSet);
        boardContainer.classList.remove("is-complete");

        cellsById.forEach((cell, index) => {
            cell.classList.remove(
                "cell-start",
                "cell-goal",
                "cell-blocked",
                "cell-active",
                "cell-warning",
                "cell-dead"
            );
            if (cellLabels[index]) {
                cellLabels[index].textContent = "";
            }
            const pipes = cellPipes[index];
            if (pipes) {
                Object.values(pipes).forEach((pipe) => pipe.classList.remove("is-active"));
            }
            if (blockedSet.has(index)) {
                cell.classList.add("cell-blocked");
            }
        });

        const startCell = cellsById[startId];
        const goalCell = cellsById[goalId];
        startCell.classList.add("cell-start");
        setCellLabel(startId, "S");
        goalCell.classList.add("cell-goal");
        setCellLabel(goalId, "G");
    }

    // Clears the current route and restores the board to its initial visual state.
    function resetPathState() {
        path = [];
        visited = new Set();
        gameEnded = false;
        activePointerId = null;
        isDragging = false;
        clearWarningIndicators();
        clearDeadHighlight();
        boardContainer.classList.remove("is-complete");
        cellsById.forEach((cell, index) => {
            cell.classList.remove("cell-active", "cell-warning", "cell-dead");
            const pipes = cellPipes[index];
            if (pipes) {
                Object.values(pipes).forEach((pipe) => pipe.classList.remove("is-active"));
            }
            if (!boardState.blockedSet.has(index) && cellLabels[index]) {
                cellLabels[index].textContent = "";
            }
        });
        updateCellLabel(boardState.startId);
        updateCellLabel(boardState.goalId);
        if (warningTimer) {
            clearTimeout(warningTimer);
            warningTimer = null;
        }
    }

    function handlePointerDown(event) {
        const cell = event.currentTarget;
        if (!(cell instanceof HTMLElement)) {
            return;
        }
        const cellId = Number(cell.dataset.id);
        if (Number.isNaN(cellId) || gameEnded) {
            return;
        }
        event.preventDefault();
        if (event.pointerType === "touch") {
            tryStep(cellId);
        }

        const shouldAttemptStep = path.length === 0 || cellId !== path[path.length - 1];
        let stepTaken = false;
        if (shouldAttemptStep) {
            stepTaken = tryStep(cellId);
        }

        if (stepTaken || (path.length > 0 && cellId === path[path.length - 1])) {
            const shouldCapture = event.pointerType !== "mouse";
            if (shouldCapture && cell.setPointerCapture) {
                try {
                    cell.setPointerCapture(event.pointerId);
                } catch (error) {
                    // pointer capture might fail on some browsers; ignore
                }
            }
            activePointerId = event.pointerId;
            isDragging = true;
        } else {
            activePointerId = null;
            isDragging = false;
        }
    }

    function handlePointerEnter(event) {
        if (!isDragging || event.pointerId !== activePointerId) {
            return;
        }
        const cell = event.currentTarget;
        if (!(cell instanceof HTMLElement)) {
            return;
        }
        const cellId = Number(cell.dataset.id);
        if (Number.isNaN(cellId)) {
            return;
        }
        tryStep(cellId);
    }

    function handlePointerUp(event) {
        if (event.pointerId !== activePointerId) {
            return;
        }
        const target = event.target;
        if (target instanceof HTMLElement && target.hasPointerCapture && target.hasPointerCapture(event.pointerId)) {
            try {
                target.releasePointerCapture(event.pointerId);
            } catch (error) {
                // ignore
            }
        }
        activePointerId = null;
        isDragging = false;
    }

    function handleGlobalPointerUp() {
        activePointerId = null;
        isDragging = false;
    }

    // Translates swipe gestures into cell highlights by sampling points along the path.
    function handleGlobalPointerMove(event) {
        if (!isDragging || event.pointerId !== activePointerId) {
            return;
        }
        if (event.pointerType === "mouse") {
            return;
        }
        event.preventDefault();
        const positions = samplePointerPath(event);
        for (let index = 0; index < positions.length; index += 1) {
            const position = positions[index];
            const element = document.elementFromPoint(position.x, position.y);
            if (!(element instanceof HTMLElement)) {
                continue;
            }
            const cell = element.closest(".cell");
            if (!cell) {
                continue;
            }
            const cellId = Number(cell.dataset.id);
            if (!Number.isNaN(cellId)) {
                tryStep(cellId);
            }
        }
    }

    function samplePointerPath(event) {
        const results = [];
        const coalesced = event.getCoalescedEvents ? event.getCoalescedEvents() : null;
        if (coalesced && coalesced.length > 0) {
            coalesced.forEach((point) => {
                results.push({ x: point.clientX, y: point.clientY });
            });
        } else {
            results.push({ x: event.clientX, y: event.clientY });
        }
        return results;
    }

    // Processes a single movement attempt to the specified cell.
    function tryStep(cellId) {
        if (boardState.blockedSet.has(cellId)) {
            setStatusMessage("このマスは壁です。", "warning");
            return false;
        }
        if (visited.has(cellId)) {
            return false;
        }

        const config = boardState.config;
        const startId = boardState.startId;
        if (path.length === 0 && cellId !== startId) {
            setStatusMessage("スタートマスから始めてください。", "info");
            return false;
        }
        if (path.length > 0) {
            const lastId = path[path.length - 1];
            if (!areAdjacent(lastId, cellId)) {
                return false;
            }
        }

        const futurePath = path.concat(cellId);
        const futureVisited = new Set(visited);
        futureVisited.add(cellId);
        let moveIsDead = false;
        if (config.giveLiveWarning === true) {
            moveIsDead = !canFinishFromState(futurePath, futureVisited, boardState);
        }

        clearWarningIndicators();
        clearDeadHighlight();

        path.push(cellId);
        visited.add(cellId);
        const cell = cellsById[cellId];
        cell.classList.add("cell-active");
        activateCellCenter(cellId);
        updateCellLabel(cellId);
        if (path.length > 1) {
            const previousId = path[path.length - 2];
            linkCells(previousId, cellId);
        }

        if (moveIsDead) {
            flashWarning(cellId);
            setStatusMessage("そのルートではゴールできません。別ルートを試しましょう。", "warning");
        } else {
            updateProgressMessage();
        }

        checkForCompletion();
        if (!gameEnded) {
            if (config.giveLiveWarning === "onlyWhenDead") {
                if (!canFinishFromState(path, visited, boardState)) {
                    markDeadEnd(cellId);
                    setStatusMessage("さらに進む道がありません。スタートからやり直してください。", "danger");
                }
            }
        }

        return true;
    }

    // Confirms whether the player satisfies the victory condition.
    function checkForCompletion() {
        if (path.length === 0) {
            return;
        }
        const lastId = path[path.length - 1];
        const atGoal = lastId === boardState.goalId;
        const coveredAll = visited.size === boardState.accessibleCount;
        const config = boardState.config;

        const cleared = config.requireFullCover ? atGoal && coveredAll : atGoal;
        if (cleared) {
            gameEnded = true;
            boardContainer.classList.add("is-complete");
            setStatusMessage("クリアしました！おめでとうございます。", "success");
        }
    }

    // Updates the status bar with progress metrics suited to the difficulty.
    function updateProgressMessage() {
        if (boardState.config.requireFullCover) {
            setStatusMessage(`${visited.size} / ${boardState.accessibleCount} マス踏破中。`, "info");
        } else {
            setStatusMessage(`現在 ${visited.size} ステップ。ゴールを目指してください。`, "info");
        }
    }

    function markDeadEnd(cellId) {
        clearDeadHighlight();
        const cell = cellsById[cellId];
        cell.classList.add("cell-dead");
        lastDeadCellId = cellId;
    }

    function clearDeadHighlight() {
        if (lastDeadCellId !== null) {
            const cell = cellsById[lastDeadCellId];
            if (cell) {
                cell.classList.remove("cell-dead");
            }
        }
        lastDeadCellId = null;
    }

    function clearWarningIndicators() {
        cellsById.forEach((cell) => {
            cell.classList.remove("cell-warning");
        });
        if (warningTimer) {
            clearTimeout(warningTimer);
            warningTimer = null;
        }
    }

    function flashWarning(cellId) {
        const cell = cellsById[cellId];
        cell.classList.add("cell-warning");
        warningTimer = window.setTimeout(() => {
            cell.classList.remove("cell-warning");
            warningTimer = null;
        }, 900);
    }

    function setStatusMessage(message, tone) {
        statusBar.textContent = message;
        statusBar.classList.remove("info", "warning", "danger", "success");
        statusBar.classList.add(tone);
    }

    function updateDifficultySelection(activeKey) {
        if (difficultySelect) {
            difficultySelect.value = activeKey;
        }
    }

    // Provides a new board specification for the chosen difficulty.
    function createBoardPreset(key) {
        if (key === "easy") {
            return createEasyPreset();
        }
        return createGeneratedPreset(key);
    }

    // Builds a guided single-path style board for easy mode.
    function createEasyPreset() {
        const choice = randomChoice(EASY_PRESETS);
        return createPresetFromPath(choice);
    }

    function createPresetFromPath(spec) {
        const pathIds = spec.path.map(([row, col]) => coordsToId(row, col));
        const accessibleSet = new Set(pathIds);
        const blocked = ALL_CELL_IDS.filter((id) => !accessibleSet.has(id));
        return {
            start: spec.start,
            goal: spec.goal,
            blocked
        };
    }

    // Generates a fresh board using randomised walls while guaranteeing solvability.
    function createGeneratedPreset(key) {
        const startGoalOptions = key === "normal" ? NORMAL_START_GOAL_OPTIONS : HARD_START_GOAL_OPTIONS;
        const pathReady = startGoalOptions.filter((option) => Array.isArray(option.path));
        if (pathReady.length > 0) {
            const choice = randomChoice(pathReady);
            return createPresetFromPath(choice);
        }
        for (let attempt = 0; attempt < 160; attempt += 1) {
            const pair = randomChoice(startGoalOptions);
            const startId = coordsToId(pair.start[0], pair.start[1]);
            const goalId = coordsToId(pair.goal[0], pair.goal[1]);
            const blockedSet = buildBlockedSet(key, startId, goalId);
            if (!blockedSet) {
                continue;
            }
            if (!isConnected(startId, blockedSet)) {
                continue;
            }
            const solution = findHamiltonianPath(startId, goalId, blockedSet);
            if (!solution) {
                continue;
            }
            return {
                start: pair.start,
                goal: pair.goal,
                blocked: Array.from(blockedSet)
            };
        }
        return createFallbackPreset(key);
    }

    // Places blocking cells according to the difficulty flavour while keeping openings around start/goal.
    function buildBlockedSet(key, startId, goalId) {
        const range = key === "normal" ? [4, 6] : [7, 9];
        const targetCount = randomInt(range[0], range[1]);
        const blocked = new Set();
        let guard = 0;

        while (blocked.size < targetCount && guard < 500) {
            guard += 1;
            const candidate = weightedCandidatePick(key, blocked, startId, goalId);
            if (candidate === null || blocked.has(candidate)) {
                continue;
            }
            blocked.add(candidate);
            if (!hasEnoughDegree(startId, blocked) || !hasEnoughDegree(goalId, blocked)) {
                blocked.delete(candidate);
            }
        }

        if (blocked.size < targetCount) {
            return null;
        }
        return blocked;
    }

    // Picks a candidate cell for blocking with a weight tuned to the difficulty theme.
    function weightedCandidatePick(key, blocked, startId, goalId) {
        const weights = [];
        let totalWeight = 0;
        ALL_CELL_IDS.forEach((id) => {
            if (id === startId || id === goalId || blocked.has(id)) {
                return;
            }
            const { row, col } = idToCoords(id);
            const isEdge = row === 0 || row === ROWS - 1 || col === 0 || col === COLS - 1;
            const isInnerRing = row === 1 || row === ROWS - 2 || col === 1 || col === COLS - 2;
            let weight = 1;
            if (key === "normal") {
                weight = isEdge ? 3 : (isInnerRing ? 2 : 1);
            } else {
                weight = isEdge ? 1 : (isInnerRing ? 3 : 4);
            }
            totalWeight += weight;
            weights.push({ id, cumulative: totalWeight });
        });
        if (weights.length === 0 || totalWeight === 0) {
            return null;
        }
        const threshold = Math.random() * totalWeight;
        for (let index = 0; index < weights.length; index += 1) {
            if (threshold <= weights[index].cumulative) {
                return weights[index].id;
            }
        }
        return weights[weights.length - 1].id;
    }

    function hasEnoughDegree(cellId, blockedSet) {
        const neighbors = getBasicNeighbors(cellId).filter((id) => !blockedSet.has(id));
        return neighbors.length >= 2;
    }

    // Ensures the accessible area stays in a single connected component.
    function isConnected(startId, blockedSet) {
        const visitedCells = new Set();
        const queue = [startId];
        visitedCells.add(startId);
        while (queue.length > 0) {
            const current = queue.shift();
            getBasicNeighbors(current).forEach((neighbor) => {
                if (!blockedSet.has(neighbor) && !visitedCells.has(neighbor)) {
                    visitedCells.add(neighbor);
                    queue.push(neighbor);
                }
            });
        }
        return visitedCells.size === TOTAL_CELLS - blockedSet.size;
    }

    // Supplies a deterministic board when random generation fails.
    function createFallbackPreset(key) {
        if (key === "normal") {
            return { start: [0, 0], goal: [5, 5], blocked: [] };
        }
        return { start: [2, 2], goal: [3, 3], blocked: [] };
    }

    // Returns a neighbor lookup table excluding blocked cells.
    function computeNeighborLookup(blockedSet) {
        const neighbors = new Array(TOTAL_CELLS);
        for (let id = 0; id < TOTAL_CELLS; id += 1) {
            if (blockedSet.has(id)) {
                neighbors[id] = [];
                continue;
            }
            neighbors[id] = getBasicNeighbors(id).filter((neighbor) => !blockedSet.has(neighbor));
        }
        return neighbors;
    }

    function getBasicNeighbors(id) {
        const { row, col } = idToCoords(id);
        const results = [];
        if (row > 0) {
            results.push(coordsToId(row - 1, col));
        }
        if (row < ROWS - 1) {
            results.push(coordsToId(row + 1, col));
        }
        if (col > 0) {
            results.push(coordsToId(row, col - 1));
        }
        if (col < COLS - 1) {
            results.push(coordsToId(row, col + 1));
        }
        return results;
    }

    // Searches for a Hamiltonian path spanning all available tiles between start and goal.
    function findHamiltonianPath(startId, goalId, blockedSet) {
        const accessible = TOTAL_CELLS - blockedSet.size;
        const neighbors = computeNeighborLookup(blockedSet);
        const pathBuffer = [startId];
        const visitedMask = addToMask(0n, startId);

        const memo = new Map();

        const result = dfsHamiltonian(startId, visitedMask, 1);
        return result;

        function dfsHamiltonian(currentId, mask, depth) {
            if (depth === accessible) {
                if (currentId === goalId) {
                    return pathBuffer.slice();
                }
                return null;
            }
            if (currentId === goalId) {
                return null;
            }
            const memoKey = `${currentId}:${mask.toString()}`;
            if (memo.has(memoKey)) {
                return null;
            }
            const nextCandidates = neighbors[currentId]
                .filter((neighbor) => !maskHas(mask, neighbor))
                .sort((a, b) => {
                    const degreeA = neighbors[a].filter((id) => !maskHas(mask, id)).length;
                    const degreeB = neighbors[b].filter((id) => !maskHas(mask, id)).length;
                    return degreeA - degreeB;
                });
            for (let index = 0; index < nextCandidates.length; index += 1) {
                const nextId = nextCandidates[index];
                pathBuffer.push(nextId);
                const nextMask = addToMask(mask, nextId);
                const resultPath = dfsHamiltonian(nextId, nextMask, depth + 1);
                if (resultPath) {
                    return resultPath;
                }
                pathBuffer.pop();
            }
            memo.set(memoKey, false);
            return null;
        }
    }

    // Checks whether the puzzle can still be solved from the current partial path.
    function canFinishFromState(currentPath, currentVisited, state) {
        if (currentPath.length === 0) {
            return true;
        }
        const targetCount = state.accessibleCount;
        const lastId = currentPath[currentPath.length - 1];
        const mask = setToMask(currentVisited);
        const memo = new Map();

        return dfs(lastId, mask, currentVisited.size);

        function dfs(currentId, visitedMask, depth) {
            const key = `${currentId}:${visitedMask.toString()}`;
            if (memo.has(key)) {
                return memo.get(key);
            }

            if (state.config.requireFullCover) {
                if (depth === targetCount) {
                    const success = currentId === state.goalId;
                    memo.set(key, success);
                    return success;
                }
                if (currentId === state.goalId && depth < targetCount) {
                    // need to leave the goal again, continue exploring
                }
            } else {
                if (currentId === state.goalId) {
                    memo.set(key, true);
                    return true;
                }
            }

            const options = state.neighbors[currentId];
            if (!options || options.length === 0) {
                memo.set(key, false);
                return false;
            }

            for (let index = 0; index < options.length; index += 1) {
                const nextId = options[index];
                if (maskHas(visitedMask, nextId)) {
                    continue;
                }
                const nextMask = addToMask(visitedMask, nextId);
                const ok = dfs(nextId, nextMask, depth + 1);
                if (ok) {
                    memo.set(key, true);
                    return true;
                }
            }
            memo.set(key, false);
            return false;
        }
    }

    // Updates the text label element inside a cell.
    function setCellLabel(cellId, text) {
        const label = cellLabels[cellId];
        if (label) {
            label.textContent = text;
        }
    }

    // Ensures the correct marker is shown for start/goal cells.
    function updateCellLabel(cellId) {
        if (cellId === boardState.startId) {
            setCellLabel(cellId, "S");
        } else if (cellId === boardState.goalId) {
            setCellLabel(cellId, "G");
        } else {
            setCellLabel(cellId, "");
        }
    }

    // Highlights the core connector for the visited cell.
    function activateCellCenter(cellId) {
        const pipes = cellPipes[cellId];
        if (pipes && pipes.center) {
            pipes.center.classList.add("is-active");
        }
    }

    // Activates connector segments between two adjacent cells.
    function linkCells(fromId, toId) {
        const direction = directionBetween(fromId, toId);
        if (!direction) {
            return;
        }
        const opposite = oppositeDirection(direction);
        const fromPipes = cellPipes[fromId];
        const toPipes = cellPipes[toId];
        if (fromPipes && fromPipes[direction]) {
            fromPipes[direction].classList.add("is-active");
        }
        if (toPipes && toPipes[opposite]) {
            toPipes[opposite].classList.add("is-active");
        }
    }

    function directionBetween(fromId, toId) {
        const from = idToCoords(fromId);
        const to = idToCoords(toId);
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

    function oppositeDirection(direction) {
        switch (direction) {
            case "up":
                return "down";
            case "down":
                return "up";
            case "left":
                return "right";
            case "right":
                return "left";
            default:
                return null;
        }
    }

    function coordsToId(row, col) {
        return row * COLS + col;
    }

    function idToCoords(id) {
        const row = Math.floor(id / COLS);
        const col = id % COLS;
        return { row, col };
    }

    function areAdjacent(idA, idB) {
        const a = idToCoords(idA);
        const b = idToCoords(idB);
        const rowDiff = Math.abs(a.row - b.row);
        const colDiff = Math.abs(a.col - b.col);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    function randomChoice(list) {
        const index = Math.floor(Math.random() * list.length);
        return list[index];
    }

    function randomInt(min, max) {
        const lower = Math.ceil(min);
        const upper = Math.floor(max);
        return Math.floor(Math.random() * (upper - lower + 1)) + lower;
    }

    function setToMask(set) {
        let mask = 0n;
        set.forEach((id) => {
            mask |= 1n << BigInt(id);
        });
        return mask;
    }

    function addToMask(mask, id) {
        return mask | (1n << BigInt(id));
    }

    function maskHas(mask, id) {
        return (mask & (1n << BigInt(id))) !== 0n;
    }
})();
