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
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragItemRef = useRef<T | null>(null);

  const handleDragStart = (e: React.DragEvent, item: T) => {
    dragItemRef.current = item;
    setDraggingId(getId(item));
    onDraggingChange?.(true);

    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.dropEffect = "move";
    e.dataTransfer.setData("text/plain", getId(item));
  };

  const handleDragOver = (e: React.DragEvent, targetItem: T) => {
    e.preventDefault();

    const draggedItem = dragItemRef.current;
    if (!draggedItem || getId(draggedItem) === getId(targetItem)) return;

    const targetElement = e.currentTarget;
    const targetRect = targetElement.getBoundingClientRect();
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const centerY = targetRect.top + targetRect.height / 2;
    const centerX = targetRect.left + targetRect.width / 2;

    const isHorizontal = targetRect.width > targetRect.height;
    const before = isHorizontal ? mouseX < centerX : mouseY < centerY;

    const newList = [...items];
    const fromIndex = newList.findIndex((i) => getId(i) === getId(draggedItem));
    const toIndex = newList.findIndex((i) => getId(i) === getId(targetItem));

    if (fromIndex === -1 || toIndex === -1) return;

    newList.splice(fromIndex, 1);
    const insertAt = toIndex + (before ? 0 : 1);

    newList.splice(
      insertAt <= fromIndex ? insertAt : insertAt - 1,
      0,
      draggedItem,
    );
    onReorder(newList);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    dragItemRef.current = null;
    onDraggingChange?.(false);
  };

  return (
    <div
      className={`${containerClassName ?? (disableClass ? "" : "flex flex-wrap gap-2")}`}
      onDragEnter={(e) => e.preventDefault()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => e.preventDefault()}
    >
      {items.map((item) => {
        const id = getId(item);
        const isDragging = id === draggingId;

        return (
          <div
            key={id}
            draggable
            onDragStart={(e) => handleDragStart(e, item)}
            onDragEnter={(e) => e.preventDefault()}
            onDragOver={(e) => handleDragOver(e, item)}
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
