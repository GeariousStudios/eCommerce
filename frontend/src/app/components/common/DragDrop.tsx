import React, { useEffect, useMemo, useRef, useState } from "react";

type DragDropRenderResult =
  | React.ReactNode
  | { element: React.ReactNode; className?: string };

type DragDropProps<T> = {
  items: T[];
  getId: (item: T) => string;
  onReorder: (newItems: T[]) => void;
  renderItem: (item: T, isDragging: boolean) => DragDropRenderResult;
  onDraggingChange?: (isDragging: boolean) => void;
  disableClass?: boolean;
  containerClassName?: string;
};

const DragDrop = <T,>({
  items,
  getId,
  onReorder,
  renderItem,
  onDraggingChange,
  disableClass = false,
  containerClassName,
}: DragDropProps<T>) => {
  const dragItemRef = useRef<T | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const ghostRef = useRef<HTMLElement | null>(null);

  const originalItemsRef = useRef<T[] | null>(null);
  const [tempItems, setTempItems] = useState<T[] | null>(null);
  const cancelRef = useRef(false);

  useEffect(() => {
    if (!draggingId) {
      setTempItems(null);
      originalItemsRef.current = null;
    }
  }, [items, draggingId]);

  const makeGhostFrom = (el: HTMLElement) => {
    const clone = el.cloneNode(true) as HTMLElement;
    clone.style.position = "fixed";
    clone.style.top = "-10000px";
    clone.style.left = "-10000px";
    clone.style.pointerEvents = "none";
    clone.style.opacity = "0.9";
    clone.style.transform = "translateZ(0)";
    clone.style.width = `${el.getBoundingClientRect().width}px`;
    document.body.appendChild(clone);
    ghostRef.current = clone;
    return clone;
  };

  const cleanupGhost = () => {
    if (ghostRef.current?.parentNode) {
      ghostRef.current.parentNode.removeChild(ghostRef.current);
    }
    ghostRef.current = null;
  };

  const beginDrag = (item: T, e: React.DragEvent) => {
    dragItemRef.current = item;
    const id = getId(item);
    setDraggingId(id);
    onDraggingChange?.(true);
    cancelRef.current = false;

    originalItemsRef.current = items.slice();
    setTempItems(items.slice());

    try {
      e.dataTransfer.clearData();
      e.dataTransfer.setData("text/plain", "");
      e.dataTransfer.setData("text/uri-list", "");
    } catch {}

    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.dropEffect = "move";

    const target = e.currentTarget as HTMLElement;
    const ghost = makeGhostFrom(target);
    const rect = target.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    e.dataTransfer.setDragImage(ghost, offsetX, offsetY);
  };

  const reorder = (sourceId: string, targetId: string) => {
    if (!tempItems) return;
    if (sourceId === targetId) return;

    const newList = tempItems.slice();
    const fromIndex = newList.findIndex((i) => getId(i) === sourceId);
    const toIndex = newList.findIndex((i) => getId(i) === targetId);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

    const [moved] = newList.splice(fromIndex, 1);
    newList.splice(toIndex, 0, moved);
    setTempItems(newList);
  };

  const confirmOrCancel = () => {
    const currentTemp = tempItems;
    const original = originalItemsRef.current;

    setDraggingId(null);
    dragItemRef.current = null;
    setTempItems(null);
    originalItemsRef.current = null;
    cleanupGhost();
    onDraggingChange?.(false);

    if (cancelRef.current) return;

    if (
      !currentTemp ||
      !original ||
      (currentTemp.length === original.length &&
        currentTemp.every((it, idx) => getId(it) === getId(original[idx])))
    ) {
      return;
    }

    onReorder(currentTemp);
  };

  const handleDragStart = (e: React.DragEvent, item: T) => {
    beginDrag(item, e);
  };

  const handleDragEnter = (_e: React.DragEvent, targetItem: T) => {
    const draggedItem = dragItemRef.current;
    if (!draggedItem) return;
    const draggedId = getId(draggedItem);
    const targetId = getId(targetItem);
    reorder(draggedId, targetId);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const cancelledByBrowser = e.dataTransfer?.dropEffect === "none";
    if (cancelledByBrowser) {
      cancelRef.current = true;
      if (originalItemsRef.current) {
        setTempItems(originalItemsRef.current.slice());
      }
    }
    confirmOrCancel();
  };

  useEffect(() => {
    if (!draggingId) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const isEsc =
        e.key === "Escape" || e.key === "Esc" || e.code === "Escape";
      if (isEsc) {
        e.preventDefault();
        e.stopPropagation();
        cancelRef.current = true;
        if (originalItemsRef.current) {
          setTempItems(originalItemsRef.current.slice());
        }
        confirmOrCancel();
      }
    };

    document.addEventListener("keydown", onKeyDown, { capture: true });
    return () => {
      document.removeEventListener("keydown", onKeyDown, { capture: true });
    };
  }, [draggingId]);

  const listToRender = useMemo(() => {
    return tempItems ?? items;
  }, [tempItems, items]);

  return (
    <div
      className={`${containerClassName ?? (disableClass ? "" : "flex flex-wrap gap-2")}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (draggingId) {
          confirmOrCancel();
        }
      }}
    >
      {listToRender.map((item) => {
        const id = getId(item);
        const isDragging = id === draggingId;

        const rendered = renderItem(item, isDragging);
        const element =
          rendered && typeof rendered === "object" && "element" in rendered
            ? rendered.element
            : rendered;
        const extraClass =
          rendered && typeof rendered === "object" && "className" in rendered
            ? rendered.className
            : "";

        return (
          <div
            key={id}
            draggable
            onDragStart={(e) => handleDragStart(e, item)}
            onDragEnter={(e) => handleDragEnter(e, item)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
            onDragEnd={handleDragEnd}
            className={`${extraClass} ${isDragging ? "cursor-grabbing opacity-50" : "cursor-grab opacity-100"}`}
          >
            {element}
          </div>
        );
      })}
    </div>
  );
};

export default DragDrop;
