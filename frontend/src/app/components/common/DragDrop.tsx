import React, { useState, useRef } from "react";

type DragDropProps<T> = {
  items: T[];
  getId: (item: T) => string;
  onReorder: (newItems: T[]) => void;
  renderItem: (item: T, isDragging: boolean) => React.ReactNode;
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

  const handleDragStart = (e: React.DragEvent, item: T) => {
    dragItemRef.current = item;
    const id = getId(item);
    setDraggingId(id);
    onDraggingChange?.(true);

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

  const handleDragEnter = (_e: React.DragEvent, targetItem: T) => {
    const draggedItem = dragItemRef.current;
    if (!draggedItem) return;

    const draggedId = getId(draggedItem);
    const targetId = getId(targetItem);
    if (draggedId === targetId) return;

    const newList = [...items];
    const fromIndex = newList.findIndex((i) => getId(i) === draggedId);
    const toIndex = newList.findIndex((i) => getId(i) === targetId);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

    newList.splice(fromIndex, 1);
    newList.splice(toIndex, 0, draggedItem);
    onReorder(newList);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    dragItemRef.current = null;
    cleanupGhost();
    onDraggingChange?.(false);
  };

  return (
    <div
      className={`${containerClassName ?? (disableClass ? "" : "flex flex-wrap gap-2")}`}
      onDragOver={(e) => e.preventDefault()}
    >
      {items.map((item) => {
        const id = getId(item);
        const isDragging = id === draggingId;

        return (
          <div
            key={id}
            draggable
            onDragStart={(e) => handleDragStart(e, item)}
            onDragEnter={(e) => handleDragEnter(e, item)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
            onDragEnd={handleDragEnd}
            className={`${isDragging ? "cursor-grabbing opacity-50" : "cursor-grab opacity-100"}`}
          >
            {renderItem(item, isDragging)}
          </div>
        );
      })}
    </div>
  );
};

export default DragDrop;
