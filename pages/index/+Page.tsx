// TODO: cleanup

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import XMark from "../../components/XMark";

import nonograms from "../../assets/nonograms.json";
import congrats from "../../assets/congrats.json";

enum Status {
  EMPTY = 0,
  ACTIVE,
  BLOCKED,
  MARKED,
}

function cyrb128(str: string) {
  let h1 = 1779033703,
    h2 = 3144134277,
    h3 = 1013904242,
    h4 = 2773480762;
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  (h1 ^= h2 ^ h3 ^ h4), (h2 ^= h1), (h3 ^= h1), (h4 ^= h1);
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

function sfc32(a: number, b: number, c: number, d: number) {
  return function () {
    a |= 0;
    b |= 0;
    c |= 0;
    d |= 0;
    let t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

const seed = cyrb128(new Date().toDateString());
const rand = sfc32(seed[0], seed[1], seed[2], seed[3]);
const puzzle = nonograms[Math.floor(rand() * 10)];

const endMessage = congrats[Math.floor(rand() * congrats.length)];

const Tile = ({
  index,
  onMouseDown,
  onMouseOver,
}: {
  index: number;
  onMouseDown?: (event: any) => void;
  onMouseOver?: (event: any) => void;
}) => {
  const { board, won, puzzle } = useContext(PuzzleContext);

  const isActive = board.status[index] === Status.ACTIVE;
  const isBlocked = board.status[index] === Status.BLOCKED;
  const isMarked = board.status[index] === Status.MARKED;
  const row = Math.floor(index / puzzle.n);
  const col = index % puzzle.n;

  const [test, setTest] = useState("opacity-0");

  useEffect(() => {
    setTest("opacity-100");
  }, []);

  return (
    <div
      className={`relative flex flex-1 select-none items-center justify-center transition ${isActive ? (won ? "bg-slate-50" : "bg-slate-100") : won ? "bg-slate-900" : "bg-slate-600"}`}
      onMouseDown={onMouseDown}
      onMouseOver={onMouseOver}
    >
      <span
        className={`w-3/4 transition ${isBlocked && !won ? "scale-100" : "scale-0"}`}
      >
        <XMark />
      </span>
      <div
        className={`absolute w-full h-full p-1 transition ${isMarked && !won ? "scale-100" : "scale-0"}`}
      >
        <div className={`w-full h-full border-2 rounded-md`}></div>
      </div>

      <div
        style={{
          transitionDelay: `${(row * 15).toString()}ms`,
        }}
        className={`absolute top-0 left-0 bottom-0 right-0 transition ${won ? "opacity-0" : test} ${row > 0 ? "border-t" : ""} ${!(row % 5) ? "border-t-yellow-500 z-10" : "border-t-slate-500"}`}
      ></div>
      <div
        style={{
          transitionDelay: `${(col * 15).toString()}ms`,
        }}
        className={`absolute top-0 left-0 bottom-0 right-0 transition ${won ? "opacity-0" : test} ${col > 0 ? "border-l" : ""} ${!(col % 5) ? "border-l-yellow-500 z-10" : "border-l-slate-500"}`}
      ></div>
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
  const [test2, setTest2] = useState("bg-slate-200");
  useEffect(() => {
    setTest("opacity-100");
    setTest2("bg-slate-300");
  }, []);

  return (
    <div
      style={{
        transitionDelay: `${((delay * 2) / 3).toString()}ms`,
      }}
      className={`flex flex-end justify-end	transition p-2 text-xs ${isShaded && !won ? test2 : "bg-slate-200"} ${isVertical ? "flex-col gap-2 p-1" : "gap-3"}`}
    >
      {hint.map((num, i) => (
        <div
          key={`hint-val-${i}`}
          style={{
            transitionDelay: `${(delay + (hint.length - i - 1) * 25).toString()}ms`,
          }}
          className={`leading-none text-center transition ${isVertical ? "mx-auto" : "my-auto"} ${won ? "opacity-0" : test}`}
        >
          {num}
        </div>
      ))}
    </div>
  );
};

const Grid = () => {
  const { board, hints, brush, brushMode, won, setStatus, setBrush } =
    useContext(PuzzleContext);

  // TODO: add key shortcuts

  const getBrush = (brushMode: Status, status: Status) => {
    if (brushMode === Status.ACTIVE) {
      if (status === Status.EMPTY || status === Status.MARKED) {
        return { targets: [Status.EMPTY, Status.MARKED], value: Status.ACTIVE };
      }
      if (status === Status.ACTIVE) {
        return { targets: [Status.ACTIVE], value: Status.EMPTY };
      }
    }
    if (brushMode === Status.BLOCKED) {
      if (status === Status.EMPTY || status == Status.MARKED) {
        return {
          targets: [Status.EMPTY, Status.MARKED],
          value: Status.BLOCKED,
        };
      }
      if (status === Status.BLOCKED) {
        return { targets: [Status.BLOCKED], value: Status.EMPTY };
      }
    }
    if (brushMode === Status.MARKED) {
      if (status === Status.EMPTY) {
        return { targets: [Status.EMPTY], value: Status.MARKED };
      }
      if (status === Status.MARKED) {
        return { targets: [Status.MARKED], value: Status.EMPTY };
      }
    }
    return null;
  };

  const onTileMouseDown = (e: any, i: number) => {
    const newBrush = getBrush(brushMode, board.status[i]);

    if (brush || won || e.nativeEvent.button !== 0 || newBrush === null) {
      return;
    }
    setBrush(newBrush);
    if (newBrush.targets.includes(board.status[i])) {
      setStatus(i, newBrush.value);
    }
  };

  const onTileMouseOver = (i: number) => {
    if (won || !brush) {
      return;
    }
    if (brush.targets.includes(board.status[i])) {
      setStatus(i, brush.value);
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
      style={{
        // gridTemplate: `${10 * puzzle.m}px repeat(${puzzle.m}, minmax(0, 1fr)) / ${10 * puzzle.n}px repeat(${puzzle.n}, minmax(0, 1fr))`,
        gridTemplate: `2fr repeat(${puzzle.m}, minmax(0, 1fr)) / 2fr repeat(${puzzle.n}, minmax(0, 1fr))`,
      }}
      className={`flex-1 grid bg-slate-300`}
    >
      <div></div>
      <div
        style={{
          gridColumn: `span ${puzzle.n} / span ${puzzle.n}`,
        }}
        className={`grid grid-rows-subgrid grid-cols-subgrid row-span-1`}
      >
        {hints.cols.map((hint: any, i: number) => {
          return (
            <Hint
              key={`hint-col-${i}`}
              hint={hint}
              isVertical={true}
              isShaded={Boolean(i % 2)}
              delay={i * 25}
            />
          );
        })}
      </div>
      <div
        style={{
          gridRow: `span ${puzzle.m} / span ${puzzle.m}`,
        }}
        className={`grid grid-rows-subgrid grid-cols-subgrid col-span-1`}
      >
        {hints.rows.map((hint: any, i: number) => {
          return (
            <Hint
              key={`hint-row-${i}`}
              hint={hint}
              isVertical={false}
              isShaded={Boolean(i % 2)}
              delay={i * 25}
            />
          );
        })}
      </div>
      <div
        style={{
          gridRow: `span ${puzzle.m} / span ${puzzle.m}`,
          gridColumn: `span ${puzzle.n} / span ${puzzle.n}`,
          // aspectRatio: `${puzzle.n} / ${puzzle.m}`,
        }}
        className={`grid grid-rows-subgrid grid-cols-subgrid`}
      >
        {board.status.map((_status: Status, i: number) => {
          return (
            <Tile
              key={`toggle-${i}`}
              index={i}
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

const getEmptyGrid = (puzzle: any) =>
  Array(puzzle.m * puzzle.n).fill(Status.EMPTY);

const Brush = ({
  mode,
  children,
}: {
  mode: Status;
  children: React.ReactNode;
}) => {
  const { brushMode, setBrushMode } = useContext(PuzzleContext);
  return (
    <button
      className={`flex w-20 h-20 items-center justify-center bg-slate-500 p-3 rounded-md transition ${mode === brushMode ? "scale-125 hover:scale-150 ring-2 ring-slate-800" : "hover:scale-110"}`}
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
    status: getEmptyGrid(puzzle),
  });

  const [won, setWon] = useState(false);

  const [history, setHistory] = useState<{ index: number; value: Status }[]>(
    []
  );

  const hints = useMemo(() => {
    // @ts-expect-error
    const { rows, cols } = Array.prototype.reduce.call(
      puzzle.grid,
      (acc, curr, i) => {
        const row = Math.floor(i / puzzle.n);
        const col = i % puzzle.n;
        // @ts-expect-error
        acc.rows[row].push(curr);
        // @ts-expect-error
        acc.cols[col].push(curr);
        return acc;
      },
      {
        rows: Array(puzzle.m)
          .fill(0)
          .map(() => []),
        cols: Array(puzzle.n)
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

  const setStatus = (i: number, status: Status) => {
    setBoard((board) => {
      if (board.status[i] === status) {
        return board;
      }
      const res = { ...board, status: [...board.status] };
      res.status[i] = status;
      const prevActive = board.status[i] === Status.ACTIVE;
      const currActive = res.status[i] === Status.ACTIVE;

      if (prevActive !== currActive) {
        if (Boolean(Number(puzzle.grid[i])) === currActive) {
          setNumCorrect((correct) => correct + 1);
        } else {
          setNumCorrect((correct) => correct - 1);
        }
        setHistory((history) => [
          ...history,
          { index: i, value: currActive ? Status.ACTIVE : Status.EMPTY },
        ]);
      }

      return res;
    });
  };

  const resetBoard = () => {
    if (!confirm("Are you sure you would like to reset?")) {
      return;
    }
    setBoard({
      status: getEmptyGrid(puzzle),
    });
    setNumCorrect(initialNumCorrect);
    setBrush(null);
    setHistory([]);
    setWon(false);
  };

  useEffect(() => {
    console.log(numCorrect);
  }, [numCorrect]);

  const [brush, setBrush] = useState<any>(null);
  const [brushMode, setBrushMode] = useState<Status>(Status.ACTIVE);

  const wonTransitionDelay = history.length
    ? Math.max(puzzle.m, puzzle.n) * 25 + 1000
    : 0;

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
          setStatus,
          setBrush,
          setBrushMode,
        }}
      >
        <div className={`relative h-full`}>
          <div
            style={{
              transitionDelay: `${wonTransitionDelay.toString()}ms`,
            }}
            className={`relative w-full h-full select-none transition ${won ? "opacity-0 pointer-events-none" : "opacity-100"}`}
          >
            <div className="flex gap-5">
              <h1 className="flex-1 font-bold text-3xl pb-4 tracking-widest">
                Picross
              </h1>

              <button className="underline">
                <a
                  href="https://en.wikipedia.org/wiki/Nonogram"
                  target="_blank"
                >
                  How to play
                </a>
              </button>

              <button className="underline" onClick={resetBoard}>
                Reset puzzle
              </button>
            </div>
            <div
              // style={{
              //   aspectRatio: `${puzzle.n} / ${puzzle.m}`,
              // }}
              className="flex mb-12"
            >
              <Grid />
            </div>
            <div
              className={`flex gap-12 justify-center transition ${won ? "opacity-0 pointer-events-none" : "opacity-100"}`}
            >
              <Brush mode={Status.MARKED}>
                <div className="w-full h-full border-2 border-slate-100 rounded-lg"></div>
              </Brush>
              <Brush mode={Status.ACTIVE}>
                <div className="w-full h-full bg-slate-100"></div>
              </Brush>
              <Brush mode={Status.BLOCKED}>
                <span className="w-3/4 font-bold">
                  <XMark />
                </span>
              </Brush>
            </div>
          </div>
          <div
            style={{
              transitionDelay: `${wonTransitionDelay.toString()}ms`,
            }}
            className={`absolute top-0 bottom-0 right-0 left-0 select-none transition ${won ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          >
            <div className="flex flex-col items-center justify-center gap-5 mt-24">
              <>
                {won && (
                  <div
                    style={{
                      aspectRatio: `${puzzle.n} / ${puzzle.m}`,
                    }}
                    className="h-64"
                  >
                    <GridReplay
                      delay={wonTransitionDelay + 50}
                      history={history}
                    />
                  </div>
                )}
                <div className="text-center">
                  <div className="text-xl font-bold">
                    #{puzzle.id + 1}: {puzzle.title}
                  </div>
                  <div>{`${puzzle.n}x${puzzle.m}`}</div>
                </div>
              </>
              <div>{endMessage}</div>
              <button className="underline" onClick={resetBoard}>
                Play again?
              </button>
            </div>
          </div>
        </div>
      </PuzzleContext.Provider>
    </>
  );
};

const GridReplay = ({ delay, history }: { delay: number; history: any }) => {
  const { puzzle } = useContext(PuzzleContext);

  const [replayBoard, setReplayBoard] = useState({
    status: getEmptyGrid(puzzle),
    history,
  });

  useEffect(() => {
    // uh oh leaky weaky
    setTimeout(() => {
      setInterval(() => {
        if (!replayBoard.history.length) {
          return;
        }
        setReplayBoard((board) => {
          if (!board.history.length) {
            return board;
          }
          const res = {
            status: [...board.status],
            history: [...board.history],
          };
          const { index, value } = res.history.shift();
          res.status[index] = value;
          return res;
        });
      }, 5);
    }, delay);
  }, []);

  return (
    <div
      style={{
        gridTemplateColumns: `repeat(${puzzle.n}, minmax(0, 1fr))`,
      }}
      className="w-full h-full bg-slate-200 select-none grid border-4 border-slate-900 rounded-md"
    >
      {replayBoard.status.map((status: Status, i: number) => {
        return (
          <div
            key={`replay-tile-${i}`}
            className={`transition ${status === Status.ACTIVE ? "bg-slate-50" : "bg-slate-900"}`}
          ></div>
        );
      })}
    </div>
  );
};

export default Page;
