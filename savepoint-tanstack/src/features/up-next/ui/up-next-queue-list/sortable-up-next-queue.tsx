import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import type {
  UpNextQueueRowData,
  UpNextQueueViewProps,
} from "./up-next-queue-list.type";
import { UpNextQueueRow } from "./up-next-queue-row";

function SortableRow({
  row,
  index,
  total,
  props,
}: {
  row: UpNextQueueRowData;
  index: number;
  total: number;
  props: UpNextQueueViewProps;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id, disabled: props.isMoving });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
        transition,
      }}
      className={cn(
        "flex items-center gap-3 bg-background",
        isDragging && "relative z-10 shadow-lg"
      )}
    >
      <UpNextQueueRow
        title={row.title}
        number={index + 1}
        isFirst={index === 0}
        isLast={index === total - 1}
        disabled={props.isMoving}
        onMoveUp={() => props.onMoveUp(row.id)}
        onMoveDown={() => props.onMoveDown(row.id)}
        dragHandle={
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={`Drag ${row.title}`}
            className="shrink-0 cursor-grab touch-none p-1 text-muted-foreground hover:text-foreground"
          >
            <GripVertical className="h-4 w-4" aria-hidden="true" />
          </button>
        }
      >
        {row.body}
      </UpNextQueueRow>
    </li>
  );
}

export default function SortableUpNextQueue(props: UpNextQueueViewProps) {
  const { rows, onMoveTo } = props;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const to = rows.findIndex((row) => row.id === over.id);
    if (to === -1) return;
    onMoveTo(Number(active.id), to + 1);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={rows.map((row) => row.id)}
        strategy={verticalListSortingStrategy}
      >
        <ol aria-label="Up Next queue" className="flex flex-col gap-3">
          {rows.map((row, index) => (
            <SortableRow
              key={row.id}
              row={row}
              index={index}
              total={rows.length}
              props={props}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}
