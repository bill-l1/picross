import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// TODO: make puzzle daily, dynamic grid size

const puzzle = {
  id: 4,
  m: 10,
  n: 10,
  title: "Lock",
  grid: "0001111100001100011001100000110100000001011111111101111111110111101111011110111100111111100001111100",
};

const Tile = ({
  isActive,
  isBlocked,
  isMarked,
  won,
  onMouseDown,
  onMouseOver,
}: {
  isActive: boolean;
  isBlocked: boolean;
  isMarked: boolean;
  won: boolean;
  onMouseDown: () => void;
  onMouseOver: () => void;
}) => {
  return (
    <div
      className={`relative flex flex-1 p-1 select-none items-center justify-center transition ${isActive ? (won ? "bg-slate-50" : "bg-slate-100") : won ? "bg-slate-900" : "bg-slate-600"} ${won ? "" : "border border-slate-500"}`}
      onMouseDown={onMouseDown}
      onMouseOver={onMouseOver}
    >
      <span
        className={`text-2xl font-bold transition ${isBlocked && !won ? "scale-100" : "scale-0"}`}
      >
        X
      </span>
      <div
        className={`absolute w-full h-full p-1 transition ${isMarked ? "scale-100" : "scale-0"}`}
      >
        <div className={`w-full h-full border-2 rounded-md`}></div>
      </div>
    </div>
  );
};

const Hint = ({
  hint,
  isVertical,
  isShaded,
  delay,
}: {
  hint: [number];
  isVertical: boolean;
  isShaded: boolean;
  delay: number;
}) => {
  const { won } = useContext(PuzzleContext);

  const [test, setTest] = useState("opacity-0");
  useEffect(() => {
    setTest("opacity-100");
  }, []);

  return (
    <div
      className={`flex flex-end justify-end	${isShaded ? "bg-slate-300" : "bg-slate-200"} p-2 text-xl ${isVertical ? "flex-col gap-1 p-1" : "gap-4"}`}
    >
      {hint.map((num, i) => (
        <div
          key={`hint-val-${i}`}
          style={{
            transitionDelay: `${(delay + (hint.length - i - 1) * 25).toString()}ms`,
          }}
          className={`text-center transition ${isVertical ? "mx-auto" : "my-auto"} ${won ? "opacity-0" : test}`}
        >
          {num}
        </div>
      ))}
    </div>
  );
};

const Grid = () => {
  const {
    board,
    hints,
    brush,
    brushMode,
    won,
    setActive,
    setBlocked,
    setMarked,
    setBrush,
  } = useContext(PuzzleContext);

  // TODO: add key shortcuts
  // TODO: cleanup state

  const onTileMouseDown = (e: any, i: number) => {
    if (brush || won || e.nativeEvent.button !== 0) {
      return;
    }
    if (brushMode === BrushMode.ACTIVE) {
      setBrush({ key: "active", value: !board.active[i] });
      setActive(i, !board.active[i]);
    } else if (brushMode === BrushMode.BLOCK) {
      setBrush({ key: "blocked", value: !board.blocked[i] });
      setBlocked(i, !board.blocked[i]);
    } else if (brushMode === BrushMode.MARK) {
      setBrush({ key: "marked", value: !board.marked[i] });
      setMarked(i, !board.marked[i]);
    }
  };

  const onTileMouseOver = (i: number) => {
    if (won) {
      return;
    }

    if (brush?.key === "active") {
      setActive(i, brush?.value);
    } else if (brush?.key === "blocked") {
      setBlocked(i, brush?.value);
    } else if (brush?.key === "marked") {
      setMarked(i, brush?.value);
    }
  };

  const release = () => {
    setBrush(null);
  };

  useEffect(() => {
    window.addEventListener("mouseup", release);
    return () => {
      window.removeEventListener("mouseup", release);
    };
  }, []);

  return (
    <div
      className={`flex-1 grid grid-cols-puzzle grid-rows-puzzle bg-slate-500`}
    >
      <div></div>
      <div
        className={`grid grid-rows-subgrid grid-cols-subgrid row-span-1 col-span-10`}
      >
        {hints.cols.map((hint: any, i: number) => {
          return (
            <Hint
              key={`hint-col-${i}`}
              hint={hint}
              isVertical={true}
              isShaded={i % 2}
              delay={i * 25}
            />
          );
        })}
      </div>
      <div
        className={`grid grid-rows-subgrid grid-cols-subgrid row-span-10 col-span-1`}
      >
        {hints.rows.map((hint: any, i: number) => {
          return (
            <Hint
              key={`hint-row-${i}`}
              hint={hint}
              isVertical={false}
              isShaded={i % 2}
              delay={i * 25}
            />
          );
        })}
      </div>
      <div
        className={`grid grid-rows-subgrid grid-cols-subgrid row-span-10 col-span-10`}
      >
        {board.active.map((isActive: any, i: number) => {
          return (
            <Tile
              key={`toggle-${i}`}
              isActive={isActive}
              isBlocked={board.blocked[i]}
              isMarked={board.marked[i]}
              won={won}
              onMouseDown={(e) => onTileMouseDown(e, i)}
              onMouseOver={() => onTileMouseOver(i)}
            />
          );
        })}
      </div>
    </div>
  );
};

const PuzzleContext = createContext<any>(null);

const getEmptyGrid = (puzzle: any) => Array(puzzle.m * puzzle.n).fill(false);

enum BrushMode {
  ACTIVE,
  BLOCK,
  MARK,
}

const Brush = ({
  mode,
  children,
}: {
  mode: BrushMode;
  children: React.ReactNode;
}) => {
  console.log(mode);
  const { brushMode, setBrushMode } = useContext(PuzzleContext);
  return (
    <button
      className={`flex w-20 h-20 items-center justify-center bg-slate-500 p-3 rounded-md transition ${mode === brushMode ? "scale-125 hover:scale-150" : "hover:scale-110"}`}
      onClick={() => {
        setBrushMode(mode);
      }}
    >
      {children}
    </button>
  );
};

const Page = () => {
  const initialNumCorrect = useMemo(
    () => (puzzle.grid.match(/0/g) || []).length,
    [puzzle]
  );

  const [numCorrect, setNumCorrect] = useState(initialNumCorrect);

  const [board, setBoard] = useState({
    active: getEmptyGrid(puzzle),
    blocked: getEmptyGrid(puzzle),
    marked: getEmptyGrid(puzzle),
  });

  const [won, setWon] = useState(false);

  const hints = useMemo(() => {
    const { rows, cols } = Array.prototype.reduce.call(
      puzzle.grid,
      (acc, curr, i) => {
        const row = Math.floor(i / puzzle.m);
        const col = i % puzzle.m;
        acc.rows[row].push(curr);
        acc.cols[col].push(curr);
        return acc;
      },
      {
        rows: Array(puzzle.m)
          .fill(0)
          .map(() => []),
        cols: Array(puzzle.m)
          .fill(0)
          .map(() => []),
      }
    );

    const helper = (vals: [[number]]) =>
      vals
        .map((row) =>
          row
            .join("")
            .split("0")
            .filter((s) => !!s)
            .map((s) => s.length)
        )
        .map((row) => (row.length ? row : [0]));

    return { rows: helper(rows), cols: helper(cols) };
  }, [puzzle]);

  useEffect(() => {
    if (numCorrect === puzzle.m * puzzle.n) {
      setWon(true);
    }
  }, [numCorrect, puzzle]);

  const setActive = (i: number, active: boolean) => {
    setBoard((board) => {
      if (board.blocked[i] || board.active[i] === active) {
        return board;
      }
      const res = { ...board, active: [...board.active] };
      res.active[i] = active;

      if (Boolean(Number(puzzle.grid[i])) === res.active[i]) {
        setNumCorrect((correct) => correct + 1);
      } else {
        setNumCorrect((correct) => correct - 1);
      }

      if (active && res.marked[i]) {
        res.marked = [...res.marked];
        res.marked[i] = false;
      }

      return res;
    });
  };

  const setBlocked = (i: number, blocked: boolean) => {
    setBoard((board) => {
      if (board.active[i] || board.blocked[i] === blocked) {
        return board;
      }
      const res = { ...board, blocked: [...board.blocked] };
      res.blocked[i] = blocked;

      if (blocked && res.marked[i]) {
        res.marked = [...res.marked];
        res.marked[i] = false;
      }

      return res;
    });
  };

  const setMarked = (i: number, marked: boolean) => {
    setBoard((board) => {
      if (board.active[i] || board.blocked[i] || board.marked[i] === marked) {
        return board;
      }
      const res = { ...board, marked: [...board.marked] };
      res.marked[i] = marked;

      return res;
    });
  };

  const resetBoard = () => {
    if (!confirm("Are you sure you would like to reset?")) {
      return;
    }

    setBoard({
      active: getEmptyGrid(puzzle),
      blocked: getEmptyGrid(puzzle),
      marked: getEmptyGrid(puzzle),
    });
    setNumCorrect(initialNumCorrect);
    setWon(false);
  };

  useEffect(() => {
    console.log(numCorrect);
  }, [numCorrect]);

  const [brush, setBrush] = useState<any>(null);
  const [brushMode, setBrushMode] = useState<BrushMode>(BrushMode.ACTIVE);

  return (
    <>
      <PuzzleContext.Provider
        value={{
          puzzle,
          board,
          won,
          hints,
          brush,
          brushMode,
          setActive,
          setBlocked,
          setMarked,
          setBrush,
          setBrushMode,
        }}
      >
        <div className="flex">
          <h1 className="flex-1 font-bold text-3xl pb-4">Picross</h1>
          <button onClick={resetBoard}>Reset puzzle</button>
        </div>
        <div className="flex mb-12 aspect-square select-none">
          <Grid />
        </div>

        {won ? (
          <div>Nice job! The picture was: {puzzle.title}</div>
        ) : (
          <div className="flex gap-12 justify-center select-none">
            <Brush mode={BrushMode.MARK}>
              <div className="w-full h-full border-2 border-slate-100 rounded-lg"></div>
            </Brush>
            <Brush mode={BrushMode.ACTIVE}>
              <div className="w-full h-full bg-slate-100"></div>
            </Brush>
            <Brush mode={BrushMode.BLOCK}>
              <span className="text-2xl font-bold">X</span>
            </Brush>
          </div>
        )}
      </PuzzleContext.Provider>
    </>
  );
};

export default Page;
