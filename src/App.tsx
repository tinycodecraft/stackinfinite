import React, { useCallback, useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import "./App.css";

import { useVirtualizer } from "@tanstack/react-virtual";

async function fetchServerPage(
  limit: number,
  offset: number = 0
): Promise<{ rows: string[]; nextOffset: number }> {
  const rows = new Array(limit)
    .fill(0)
    .map((e, i) => `Async loaded row #${i + offset * limit}`);

  await new Promise((r) => setTimeout(r, 500));

  return { rows, nextOffset: offset + 1 };
}

function App() {
  const {
    status,
    error,
    isFetching,
    data,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery(
    ["projects"],
    (ctx) => fetchServerPage(10, ctx.pageParam),
    {
      getNextPageParam: (_lastGroup, groups) => groups.length,
      // refetchInterval: number ( idle for specified seconds before next refetch)
      // staleTime: number (keep fresh for specified seconds)
    }
  );

  const allRows = data ? data.pages.flatMap((d) => d.rows) : [];

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? allRows.length + 1 : allRows.length,
    getScrollElement: () => parentRef.current,
    // this is the height of each virtual item
    estimateSize: () => 50,
    overscan: 5,
    onChange: (me)=> { console.log(` the virtualizer is changed `,me)}
  });
  const itemsInMems = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();

    console.log(`the last item is `,lastItem, ` with all rows length = `, allRows?.length);
    console.log(`has next page: `, hasNextPage,` still fetching `,isFetchingNextPage  )

    if (!lastItem) {
      return;
    }

    if (
      lastItem.index >= allRows.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    hasNextPage,
    fetchNextPage,
    allRows.length,
    isFetchingNextPage,
    rowVirtualizer,
    itemsInMems,
  ]);

  return (
    <div className="App">
      <header className="App-header">
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
      <div>
        <p>
          This infinite scroll example uses React Query's useInfiniteScroll hook
          to fetch infinite data from a posts endpoint and then a rowVirtualizer
          is used along with a loader-row placed at the bottom of the list to
          trigger the next page to load.
        </p>

        <br />
        <br />

        {status === "loading" ? (
          <p>Loading...</p>
        ) : status === "error" ? (
          <span>Error: {(error as Error).message}</span>
        ) : (
          <div
            ref={parentRef}
            className="List"
            style={{
              height: `500px`,
              width: `100%`,
              overflow: "auto",
            }}
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const isLoaderRow = virtualRow.index > allRows.length - 1;
                const post = allRows[virtualRow.index];

                return (
                  <div
                    key={virtualRow.index}
                    className={
                      virtualRow.index % 2 ? "ListItemOdd" : "ListItemEven"
                    }
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {isLoaderRow
                      ? hasNextPage
                        ? "Loading more..."
                        : "Nothing more to load"
                      : post}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div>
          {isFetching && !isFetchingNextPage ? "Background Updating..." : null}
        </div>
        <br />
        <br />
        {process.env.NODE_ENV === "development" ? (
          <p>
            <strong>Notice:</strong> You are currently running React in
            development mode. Rendering performance will be slightly degraded
            until this application is build for production.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default App;
