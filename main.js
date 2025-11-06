(() => {
    function createGeometry(rows, cols) {
        return {
            rows,
            cols,
            totalCells: rows * cols,
            allCellIds: Array.from({ length: rows * cols }, (_, index) => index)
        };
    }

    const difficultyConfig = {
        easy: {
            key: "easy",
            label: "かんたん",
            rows: 6,
            cols: 6,
            requireFullCover: true
        },
        normal: {
            key: "normal",
            label: "ふつう",
            rows: 8,
            cols: 8,
            requireFullCover: true
        },
        hard: {
            key: "hard",
            label: "むずかしい",
            rows: 10,
            cols: 10,
            requireFullCover: true
        }
    };

    const DEFAULT_DIFFICULTY_KEY = "easy";

    const boardState = {
        difficultyKey: DEFAULT_DIFFICULTY_KEY,
        config: difficultyConfig[DEFAULT_DIFFICULTY_KEY],
        geometry: createGeometry(
            difficultyConfig[DEFAULT_DIFFICULTY_KEY].rows,
            difficultyConfig[DEFAULT_DIFFICULTY_KEY].cols
        ),
        startId: 0,
        goalId: 0,
        blockedSet: new Set(),
        accessibleCount: 0,
        neighbors: [],
        cellsById: [],
        cellLabels: [],
        cellPipes: [],
        currentPreset: null,
        currentPresetSignature: null
    };

    const EASY_START_GOAL_OPTIONS = [
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

    const NORMAL_START_GOAL_OPTIONS = [
        {
            start: [2, 4],
            goal: [7, 0],
            path: [
                [2, 4], [3, 4], [3, 3], [2, 3], [2, 2], [3, 2], [3, 1], [2, 1], [2, 0], [3, 0],
                [4, 0], [4, 1], [4, 2], [4, 3], [4, 4], [5, 4], [5, 3], [5, 2], [6, 2], [6, 3],
                [6, 4], [6, 5], [5, 5], [4, 5], [3, 5], [2, 5], [1, 5], [1, 4], [1, 3], [1, 2],
                [1, 1], [1, 0], [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [1, 6],
                [1, 7], [2, 7], [2, 6], [3, 6], [3, 7], [4, 7], [4, 6], [5, 6], [5, 7], [6, 7],
                [7, 7], [7, 6], [7, 5], [7, 4], [7, 3], [7, 2], [7, 1], [6, 1], [5, 1], [5, 0],
                [6, 0], [7, 0]
            ]
        },
        {
            start: [0, 7],
            goal: [7, 7],
            path: [
                [0, 7], [0, 6], [0, 5], [0, 4], [0, 3], [0, 2], [0, 1], [0, 0],
                [1, 0], [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7],
                [2, 7], [2, 6], [2, 5], [2, 4], [2, 3], [2, 2], [2, 1], [2, 0],
                [3, 0], [3, 1], [3, 2], [3, 3], [3, 4], [3, 5], [3, 6], [3, 7],
                [4, 7], [4, 6], [4, 5], [4, 4], [4, 3], [4, 2], [4, 1], [4, 0],
                [5, 0], [5, 1], [5, 2], [5, 3], [5, 4], [5, 5], [5, 6], [5, 7],
                [6, 7], [6, 6], [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0],
                [7, 0], [7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6], [7, 7]
            ]
        },
        {
            start: [0, 0],
            goal: [7, 0],
            path: [
                [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [6, 1],
                [5, 1], [4, 1], [3, 1], [2, 1], [1, 1], [0, 1], [0, 2], [1, 2],
                [2, 2], [2, 3], [1, 3], [0, 3], [0, 4], [1, 4], [2, 4], [3, 4],
                [3, 3], [4, 3], [4, 2], [5, 2], [6, 2], [6, 3], [5, 3], [5, 4],
                [6, 4], [6, 5], [5, 5], [4, 5], [3, 5], [2, 5], [1, 5], [0, 5],
                [0, 6], [0, 7], [1, 7], [1, 6], [2, 6], [2, 7], [3, 7], [3, 6],
                [4, 6], [4, 7], [5, 7], [5, 6], [6, 6], [6, 7], [7, 7], [7, 6],
                [7, 5], [7, 4], [7, 3], [7, 2], [7, 1], [7, 0]
            ]
        },
        {
            start: [7, 0],
            goal: [7, 7],
            path: [
                [7, 0], [6, 0], [5, 0], [4, 0], [3, 0], [2, 0], [1, 0], [0, 0],
                [0, 1], [1, 1], [1, 2], [0, 2], [0, 3], [1, 3], [2, 3], [2, 2],
                [3, 2], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [7, 2], [6, 2],
                [5, 2], [4, 2], [4, 3], [3, 3], [3, 4], [2, 4], [1, 4], [0, 4],
                [0, 5], [1, 5], [2, 5], [3, 5], [4, 5], [4, 4], [5, 4], [5, 3],
                [6, 3], [7, 3], [7, 4], [7, 5], [6, 5], [5, 5], [5, 6], [4, 6],
                [3, 6], [2, 6], [1, 6], [0, 6], [0, 7], [1, 7], [2, 7], [3, 7],
                [4, 7], [5, 7], [6, 7], [6, 6], [7, 6], [7, 7]
            ]
        },
        {
            start: [7, 0],
            goal: [7, 7],
            path: [
                [7, 0], [6, 0], [5, 0], [4, 0], [3, 0], [2, 0], [1, 0], [0, 0],
                [0, 1], [1, 1], [1, 2], [0, 2], [0, 3], [1, 3], [2, 3], [2, 2],
                [3, 2], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [7, 2], [6, 2],
                [5, 2], [4, 2], [4, 3], [5, 3], [6, 3], [7, 3], [7, 4], [6, 4],
                [5, 4], [4, 4], [3, 4], [2, 4], [1, 4], [0, 4], [0, 5], [1, 5],
                [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [7, 6], [6, 6],
                [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6], [0, 7], [1, 7],
                [2, 7], [3, 7], [4, 7], [5, 7], [6, 7], [7, 7]
            ]
        }
    ];

    const HARD_START_GOAL_OPTIONS = [
        {
            start: [0, 0],
            goal: [9, 9],
            path: [
                [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8], [0, 9],
                [1, 9], [2, 9], [3, 9], [4, 9], [5, 9], [6, 9], [7, 9], [8, 9], [8, 8], [7, 8],
                [6, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [1, 7], [2, 7], [3, 7], [4, 7],
                [5, 7], [6, 7], [7, 7], [8, 7], [8, 6], [8, 5], [7, 5], [6, 5], [6, 6], [5, 6],
                [4, 6], [3, 6], [2, 6], [1, 6], [1, 5], [2, 5], [3, 5], [4, 5], [4, 4], [3, 4],
                [2, 4], [1, 4], [1, 3], [2, 3], [2, 2], [1, 2], [1, 1], [2, 1], [2, 0], [3, 0],
                [3, 1], [3, 2], [4, 2], [4, 1], [4, 0], [5, 0], [5, 1], [5, 2], [5, 3], [5, 4],
                [6, 4], [7, 4], [8, 4], [8, 3], [7, 3], [6, 3], [6, 2], [7, 2], [8, 2], [8, 1],
                [7, 1], [6, 1], [6, 0], [7, 0], [8, 0], [9, 0], [9, 1], [9, 2], [9, 3], [9, 4],
                [9, 5], [9, 6], [9, 7], [9, 8], [9, 9]
            ]
        },
        {
            start: [9, 0],
            goal: [9, 9],
            path: [
                [9, 0], [8, 0], [7, 0], [6, 0], [5, 0], [4, 0], [3, 0], [2, 0], [1, 0], [0, 0],
                [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1],
                [8, 2], [8, 3], [7, 3], [6, 3], [5, 3], [4, 3], [3, 3], [2, 3], [1, 3], [0, 3],
                [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2],
                [6, 4], [7, 4], [8, 4], [8, 5], [7, 5], [6, 5], [5, 5], [4, 5], [3, 5], [2, 5], [1, 5], [0, 5],
                [0, 4], [1, 4], [2, 4], [3, 4],
                [2, 6], [1, 6], [0, 6],
                [0, 7], [1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7], [7, 7], [8, 7],
                [8, 6], [7, 6], [6, 6], [5, 6], [4, 6],
                [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
                [0, 9], [1, 9], [2, 9], [3, 9], [4, 9], [5, 9], [6, 9], [7, 9], [8, 9], [9, 9],
                [9, 8], [9, 7], [8, 8], [7, 8], [6, 8], [5, 8], [4, 8]

            ]
        },
        {
            start: [0, 0],
            goal: [9, 9],
            path: [
                [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0],
                [9, 1], [8, 1], [7, 1], [6, 1], [5, 1], [4, 1], [3, 1], [2, 1], [1, 1], [0, 1],
                [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2],
                [9, 3], [8, 3], [7, 3], [6, 3], [5, 3], [4, 3], [3, 3], [2, 3], [1, 3], [0, 3],
                [0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4],
                [9, 5], [8, 5], [7, 5], [6, 5], [5, 5], [4, 5], [3, 5], [2, 5], [1, 5], [0, 5],
                [0, 6], [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [6, 6], [7, 6], [8, 6], [8, 7],
                [9, 7], [9, 8], [8, 8], [7, 8], [7, 7], [6, 7], [5, 7], [4, 7], [3, 7], [2, 7],
                [1, 7], [1, 8], [0, 8], [0, 9], [1, 9], [2, 9], [3, 9], [3, 8], [4, 8], [5, 8],
                [5, 9], [6, 9], [7, 9], [8, 9], [9, 9]
            ]
        },
        {
            start: [0, 0],
            goal: [9, 0],
            path: [
                [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [8, 1],
                [7, 1], [6, 1], [5, 1], [4, 1], [3, 1], [2, 1], [1, 1], [0, 1], [0, 2], [1, 2],
                [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [8, 3], [7, 3], [6, 3],
                [5, 3], [4, 3], [3, 3], [2, 3], [1, 3], [0, 3], [0, 4], [1, 4], [2, 4], [3, 4],
                [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [8, 5], [7, 5], [6, 5], [5, 5], [4, 5],
                [3, 5], [2, 5], [1, 5], [0, 5], [0, 6], [1, 6], [2, 6], [3, 6], [4, 6], [5, 6],
                [6, 6], [7, 6], [8, 6], [8, 7], [7, 7], [6, 7], [5, 7], [4, 7], [3, 7], [2, 7],
                [2, 8], [1, 8], [0, 8], [0, 9], [1, 9], [2, 9], [3, 9], [4, 9], [4, 8], [5, 8],
                [6, 8], [6, 9], [7, 9], [8, 9], [8, 8], [9, 8], [9, 7], [9, 6], [9, 5], [9, 4],
                [9, 3], [9, 2], [9, 1], [9, 0]
            ]
        },
        {
            start: [4, 4],
            goal: [9, 0],
            path: [
                [4, 4], [5, 4], [5, 3], [4, 3], [4, 2], [5, 2], [5, 1], [4, 1], [4, 0], [5, 0],
                [6, 0], [6, 1], [6, 2], [6, 3], [6, 4], [7, 4], [7, 3], [7, 2], [7, 1], [7, 0],
                [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [7, 5], [6, 5], [5, 5], [4, 5],
                [4, 6], [5, 6], [6, 6], [7, 6], [8, 6], [8, 7], [7, 7], [6, 7], [5, 7], [4, 7],
                [4, 8], [3, 8], [3, 7], [3, 6], [3, 5], [3, 4], [3, 3], [3, 2], [3, 1], [3, 0],
                [2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [1, 5], [1, 4], [1, 3], [1, 2],
                [1, 1], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [1, 6], [1, 7], [0, 7],
                [0, 8], [1, 8], [2, 8], [2, 9], [3, 9], [4, 9], [5, 9], [6, 9], [7, 9], [8, 9],
                [8, 8], [9, 8], [9, 7], [9, 6], [9, 5], [9, 4], [9, 3], [9, 2], [9, 1], [9, 0]
            ]
        },
    ];

    const boardContainer = document.getElementById("board");
    const statusBar = document.getElementById("statusBar");
    const difficultySelect = document.getElementById("difficultySelect");
    const resetButton = document.getElementById("resetButton");
    const nextButton = document.getElementById("nextButton");

    const DIFFICULTY_KEYS = Object.keys(difficultyConfig);

    function createDifficultyMap(defaultValue) {
        return Object.fromEntries(DIFFICULTY_KEYS.map((key) => [key, defaultValue]));
    }

    const presetStock = createDifficultyMap([]);
    const presetGenerationInFlight = createDifficultyMap(false);
    const presetRotationIndex = createDifficultyMap(0);

    const presetSequences = {
        easy: EASY_START_GOAL_OPTIONS,
        normal: NORMAL_START_GOAL_OPTIONS,
        hard: HARD_START_GOAL_OPTIONS
    };
    const scheduleBackgroundTask = (typeof window !== "undefined" && typeof window.requestIdleCallback === "function")
        ? (callback) => window.requestIdleCallback(callback)
        : (callback) => window.setTimeout(callback, 0);

    let path = [];
    let visited = new Set();
    let gameEnded = false;
    let activePointerId = null;
    let isDragging = false;

    init();

    function init() {
        initBoard();
        initDifficultySelector();
        initControlButtons();
        primeInitialPresets();
        startNewGame(boardState.difficultyKey);
        window.addEventListener("pointerup", handleGlobalPointerUp, { passive: true });
        window.addEventListener("pointercancel", handleGlobalPointerUp, { passive: true });
        window.addEventListener("pointermove", handleGlobalPointerMove, { passive: false });
        if (boardContainer) {
            boardContainer.addEventListener("contextmenu", (event) => event.preventDefault());
        }
    }

    function initBoard() {
        if (!boardContainer) {
            return;
        }
        rebuildBoard(boardState.geometry);
    }

    function rebuildBoard(geometry) {
        if (!boardContainer) {
            return;
        }
        boardContainer.innerHTML = "";
        boardContainer.style.setProperty("--board-cols", String(geometry.cols));
        boardState.cellsById = new Array(geometry.totalCells);
        boardState.cellLabels = new Array(geometry.totalCells);
        boardState.cellPipes = new Array(geometry.totalCells);

        const fragment = document.createDocumentFragment();
        for (let row = 0; row < geometry.rows; row += 1) {
            for (let col = 0; col < geometry.cols; col += 1) {
                const cell = document.createElement("div");
                const id = coordsToId(row, col, geometry);
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
                boardState.cellLabels[id] = label;

                const pipes = {};
                ["center", "up", "down", "left", "right"].forEach((dir) => {
                    const pipe = document.createElement("span");
                    pipe.className = dir === "center" ? "pipe pipe-center" : `pipe pipe-${dir}`;
                    cell.appendChild(pipe);
                    pipes[dir] = pipe;
                });
                boardState.cellPipes[id] = pipes;
                fragment.appendChild(cell);
                boardState.cellsById[id] = cell;
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

    function consumePresetFromStock(key, excludeSignature) {
        if (!presetStock[key]) {
            presetStock[key] = [];
        }
        if (presetStock[key].length === 0) {
            primePresetStock(key);
        }

        const stock = presetStock[key];
        let preset = null;
        const stockLength = stock.length;

        for (let attempt = 0; attempt < stockLength; attempt += 1) {
            const candidate = stock.shift();
            const candidateSignature = serializePreset(candidate);
            if (!excludeSignature || candidateSignature !== excludeSignature) {
                preset = candidate;
                break;
            }
            stock.push(candidate);
        }

        if (!preset) {
            preset = stock.shift();
            if (!preset) {
                preset = createBoardPreset(key);
            }
        }

        schedulePresetReplenish(key);
        return preset;
    }

    function serializePreset(preset) {
        if (!preset) {
            return "";
        }
        const startPart = Array.isArray(preset.start) ? preset.start.join(",") : "";
        const goalPart = Array.isArray(preset.goal) ? preset.goal.join(",") : "";
        const blockedPart = Array.isArray(preset.blocked)
            ? preset.blocked.slice().sort((a, b) => a - b).join(",")
            : "";
        return `${startPart}|${goalPart}|${blockedPart}`;
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
        const previousKey = boardState.difficultyKey;
        boardState.difficultyKey = key;
        boardState.config = difficultyConfig[key];
        ensureBoardGeometry(boardState.config);

        // Clear preset stock when difficulty changes to prevent geometry mismatch
        if (previousKey !== key) {
            presetStock[key] = [];
            presetGenerationInFlight[key] = false;
        }

        const preset = consumePresetFromStock(key, boardState.currentPresetSignature);
        boardState.currentPreset = preset;
        boardState.currentPresetSignature = serializePreset(preset);
        applyPreset(preset);
        resetPathState();
        setStatusMessage("スタートマスをなぞってください。", "info");
        updateDifficultySelection(key);
    }

    function ensureBoardGeometry(config) {
        const { rows, cols } = config;
        const { geometry } = boardState;
        if (geometry && geometry.rows === rows && geometry.cols === cols) {
            return;
        }
        boardState.geometry = createGeometry(rows, cols);
        boardState.blockedSet = new Set();
        boardState.accessibleCount = boardState.geometry.totalCells;
        boardState.neighbors = [];
        rebuildBoard(boardState.geometry);
    }

    function applyPreset(preset) {
        const geometry = boardState.geometry;
        const startId = coordsToId(preset.start[0], preset.start[1], geometry);
        const goalId = coordsToId(preset.goal[0], preset.goal[1], geometry);
        const blockedSet = new Set(preset.blocked);
        boardState.startId = startId;
        boardState.goalId = goalId;
        boardState.blockedSet = blockedSet;
        boardState.accessibleCount = geometry.totalCells - blockedSet.size;
        boardState.neighbors = computeNeighborLookup(blockedSet, geometry);
        if (boardContainer) {
            boardContainer.classList.remove("is-complete");
        }

        boardState.cellsById.forEach((cell, index) => {
            if (!cell) {
                return;
            }
            cell.classList.remove(
                "cell-start",
                "cell-goal",
                "cell-blocked",
                "cell-active"
            );
            const label = boardState.cellLabels[index];
            if (label) {
                label.textContent = "";
            }
            const pipes = boardState.cellPipes[index];
            if (pipes) {
                Object.values(pipes).forEach((pipe) => pipe.classList.remove("is-active"));
            }
            if (blockedSet.has(index)) {
                cell.classList.add("cell-blocked");
            }
        });

        const startCell = boardState.cellsById[startId];
        const goalCell = boardState.cellsById[goalId];
        if (startCell) {
            startCell.classList.add("cell-start");
        }
        setCellLabel(startId, "S");
        if (goalCell) {
            goalCell.classList.add("cell-goal");
        }
        setCellLabel(goalId, "G");
    }

    // Clears the current route and restores the board to its initial visual state.
    function resetPathState() {
        path = [];
        visited = new Set();
        gameEnded = false;
        activePointerId = null;
        isDragging = false;
        if (boardContainer) {
            boardContainer.classList.remove("is-complete");
        }
        boardState.cellsById.forEach((cell, index) => {
            if (!cell) {
                return;
            }
            cell.classList.remove("cell-active");
            const pipes = boardState.cellPipes[index];
            if (pipes) {
                Object.values(pipes).forEach((pipe) => pipe.classList.remove("is-active"));
            }
            if (!boardState.blockedSet.has(index)) {
                const label = boardState.cellLabels[index];
                if (label) {
                    label.textContent = "";
                }
            }
        });
        updateCellLabel(boardState.startId);
        updateCellLabel(boardState.goalId);
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

        path.push(cellId);
        visited.add(cellId);
        const cell = boardState.cellsById[cellId];
        cell.classList.add("cell-active");
        activateCellCenter(cellId);
        updateCellLabel(cellId);
        if (path.length > 1) {
            const previousId = path[path.length - 2];
            linkCells(previousId, cellId);
        }

        updateProgressMessage();

        checkForCompletion();

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
            if (boardContainer) {
                boardContainer.classList.add("is-complete");
            }
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

    function setStatusMessage(message, tone) {
        if (!statusBar) {
            return;
        }
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
        const config = difficultyConfig[key];
        const geometry = createGeometry(config.rows, config.cols);
        const sequence = presetSequences[key];
        return createSequentialPreset(key, sequence, geometry);
    }

    function createSequentialPreset(key, sequence, geometry) {
        const currentIndex = presetRotationIndex[key] ?? 0;
        const nextChoice = sequence[currentIndex % sequence.length];
        presetRotationIndex[key] = (currentIndex + 1) % sequence.length;
        return createPresetFromPath(nextChoice, geometry);
    }

    function createPresetFromPath(spec, geometry) {
        const pathIds = spec.path.map(([row, col]) => coordsToId(row, col, geometry));
        const accessibleSet = new Set(pathIds);
        const blocked = geometry.allCellIds.filter((id) => !accessibleSet.has(id));
        return {
            start: spec.start,
            goal: spec.goal,
            blocked
        };
    }

    // Returns a neighbor lookup table excluding blocked cells.
    function computeNeighborLookup(blockedSet, geometry = boardState.geometry) {
        const neighbors = new Array(geometry.totalCells);
        for (let id = 0; id < geometry.totalCells; id += 1) {
            if (blockedSet.has(id)) {
                neighbors[id] = [];
                continue;
            }
            neighbors[id] = getBasicNeighbors(id, geometry).filter((neighbor) => !blockedSet.has(neighbor));
        }
        return neighbors;
    }

    function getBasicNeighbors(id, geometry = boardState.geometry) {
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

    // Updates the text label element inside a cell.
    function setCellLabel(cellId, text) {
        const label = boardState.cellLabels[cellId];
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
        const pipes = boardState.cellPipes[cellId];
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
        const fromPipes = boardState.cellPipes[fromId];
        const toPipes = boardState.cellPipes[toId];
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

    function coordsToId(row, col, geometry = boardState.geometry) {
        return row * geometry.cols + col;
    }

    function idToCoords(id, geometry = boardState.geometry) {
        const cols = geometry.cols;
        const row = Math.floor(id / cols);
        const col = id % cols;
        return { row, col };
    }

    function areAdjacent(idA, idB, geometry = boardState.geometry) {
        const a = idToCoords(idA, geometry);
        const b = idToCoords(idB, geometry);
        const rowDiff = Math.abs(a.row - b.row);
        const colDiff = Math.abs(a.col - b.col);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

})();
