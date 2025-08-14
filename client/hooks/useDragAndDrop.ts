import { useState, useRef } from "react";

export interface DragItem {
  id: string;
  type: string;
  data: any;
}

export interface DropResult {
  targetId?: string;
  position?: number;
  action: "move" | "copy";
}

export interface DragDropHandlers {
  onDragStart: (e: React.DragEvent, item: DragItem) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetId?: string, position?: number) => void;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  isDragging: boolean;
  draggedItem: DragItem | null;
  dropTarget: string | null;
}

export interface UseDragDropOptions {
  onDrop?: (item: DragItem, result: DropResult) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  acceptTypes?: string[];
}

export const useDragAndDrop = (
  options: UseDragDropOptions = {},
): DragDropHandlers => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const dragCounterRef = useRef(0);

  const onDragStart = (e: React.DragEvent, item: DragItem) => {
    setIsDragging(true);
    setDraggedItem(item);

    // Set drag data
    e.dataTransfer.setData("application/json", JSON.stringify(item));
    e.dataTransfer.effectAllowed = "copyMove";

    // Add drag image styling
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  };

  const onDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    setDraggedItem(null);
    setDropTarget(null);
    dragCounterRef.current = 0;

    // Reset opacity
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;

    if (e.currentTarget instanceof HTMLElement) {
      const targetId = e.currentTarget.getAttribute("data-drop-target");
      if (targetId) {
        setDropTarget(targetId);
      }
    }
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;

    if (dragCounterRef.current === 0) {
      setDropTarget(null);
    }
  };

  const onDrop = (e: React.DragEvent, targetId?: string, position?: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTarget(null);
    dragCounterRef.current = 0;

    try {
      const data = e.dataTransfer.getData("application/json");
      if (!data) return;

      const item = JSON.parse(data) as DragItem;

      // Check if we accept this type
      if (options.acceptTypes && !options.acceptTypes.includes(item.type)) {
        return;
      }

      const result: DropResult = {
        targetId,
        position,
        action: e.ctrlKey || e.metaKey ? "copy" : "move",
      };

      options.onDrop?.(item, result);
    } catch (error) {
      console.error("Error handling drop:", error);
    }
  };

  return {
    onDragStart,
    onDragEnd,
    onDragOver,
    onDrop,
    onDragEnter,
    onDragLeave,
    isDragging,
    draggedItem,
    dropTarget,
  };
};

export const createDragItem = (
  id: string,
  type: string,
  data: any,
): DragItem => ({
  id,
  type,
  data,
});
