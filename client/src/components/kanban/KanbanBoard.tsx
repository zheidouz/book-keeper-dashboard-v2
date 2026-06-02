import { memo } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Link } from "react-router-dom";
import { Calendar, User, Building2 } from "lucide-react";
import { STATUS_LABELS, formatDate, isOverdue, cn } from "@/lib/utils";
import type { Task } from "@/types";

interface KanbanColumn {
  status: string;
  label: string;
  tasks: Task[];
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
  userRole?: string;
  onDragEnd: (result: DropResult) => void;
  onMarkDone: (id: number) => void;
  draggingTaskId?: number | null;
  dragProgress?: number;
}

export default function KanbanBoard({ columns, userRole, onDragEnd, onMarkDone, draggingTaskId, dragProgress }: KanbanBoardProps) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 overflow-hidden flex-1 pb-2">
        {columns.map((column) => (
          <div key={column.status} className="kanban-column p-0 min-w-[260px] flex flex-col overflow-hidden">
            <div className="kanban-column-header shrink-0">
              <div className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider text-white ${
                column.status === 'pending' ? 'bg-amber-500' :
                column.status === 'ready_to_file' ? 'bg-sky-500' :
                column.status === 'submitted' ? 'bg-violet-500' :
                'bg-emerald-500'
              }`}>
                {column.label}
              </div>
              <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full text-white ${
                column.status === 'pending' ? 'bg-amber-400' :
                column.status === 'ready_to_file' ? 'bg-sky-400' :
                column.status === 'submitted' ? 'bg-violet-400' :
                'bg-emerald-400'
              }`}>{column.tasks.length}</span>
            </div>
            <Droppable droppableId={column.status}>
              {(provided, snapshot) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="p-2 space-y-2 min-h-[120px] overflow-y-auto flex-1 scrollbar-thin">
                  {column.tasks.length === 0 && !snapshot.isDraggingOver && (
                    <div className="flex items-center justify-center h-20 border-2 border-dashed border-border/40 rounded-lg">
                      <p className="text-xs text-muted-foreground/50">Drop tasks here</p>
                    </div>
                  )}
                  {column.tasks.map((task, index) => (
                    <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                      {(provided, snapshot) => (
                        <KanbanCard
                          task={task}
                          columnStatus={column.status}
                          userRole={userRole}
                          isDragging={snapshot.isDragging}
                          onMarkDone={onMarkDone}
                          innerRef={provided.innerRef}
                          draggableProps={provided.draggableProps}
                          dragHandleProps={provided.dragHandleProps}
                          isMoving={draggingTaskId === task.id}
                          moveProgress={draggingTaskId === task.id ? dragProgress ?? 0 : 0}
                        />
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}

/**
 * Memoized Kanban task card — prevents re-render when other cards change.
 */
const KanbanCard = memo(function KanbanCard({
  task,
  columnStatus,
  userRole,
  isDragging,
  onMarkDone,
  innerRef,
  draggableProps,
  dragHandleProps,
  isMoving,
  moveProgress,
}: {
  task: Task;
  columnStatus: string;
  userRole?: string;
  isDragging: boolean;
  onMarkDone: (id: number) => void;
  innerRef: React.Ref<HTMLAnchorElement>;
  draggableProps: any;
  dragHandleProps: any;
  isMoving?: boolean;
  moveProgress?: number;
}) {
  return (
    <Link
      to={`/tasks/${task.id}`}
      ref={innerRef}
      {...draggableProps}
      {...dragHandleProps}
      className={`block p-3 rounded-lg border-2 ${
        task.status === 'pending' ? 'border-amber-400 bg-amber-50 shadow-[0_0_0_1px_rgba(251,191,36,0.15)]' :
        task.status === 'ready_to_file' ? 'border-sky-400 bg-sky-50 shadow-[0_0_0_1px_rgba(56,189,248,0.15)]' :
        task.status === 'submitted' ? 'border-violet-400 bg-violet-50 shadow-[0_0_0_1px_rgba(139,92,246,0.15)]' :
        task.status === 'completed' ? 'border-emerald-400 bg-emerald-50 shadow-[0_0_0_1px_rgba(52,211,153,0.15)]' :
        'border-slate-300 bg-slate-50'
      } ${isDragging ? 'shadow-lg rotate-2 scale-105' : ''}`}
    >
      <div className="flex items-start gap-2">
        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${columnStatus === 'pending' ? 'bg-amber-400 status-dot-pending' : columnStatus === 'ready_to_file' ? 'bg-sky-400' : columnStatus === 'submitted' ? 'bg-violet-400' : 'bg-emerald-400'}`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{task.formCode} {task.formName}</p>
          <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
            <Building2 size={12} className="shrink-0" />
            <span className="truncate">{task.clientName}</span>
          </div>
        </div>
        {task.status === "completed" && (userRole === "admin" || userRole === "manager") && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMarkDone(task.id);
            }}
            className="shrink-0 px-2 py-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors"
          >
            ✓ Done
          </button>
        )}
      </div>
      {isMoving && moveProgress !== undefined && moveProgress > 0 && (
        <div className="mt-2">
          <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-100 ease-out ${
                moveProgress >= 100 ? 'bg-emerald-500' : 'bg-primary'
              }`}
              style={{ width: `${moveProgress}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground text-right mt-0.5">{moveProgress}%</p>
        </div>
      )}
      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-dashed border-border/40 text-xs">
        <div className="flex items-center gap-1">
          <Calendar size={12} className="text-muted-foreground shrink-0" />
          <span className={cn(isOverdue(task.deadline, task.status) ? "text-red-600 font-medium" : "text-muted-foreground")}>
            {formatDate(task.deadline)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {task.filingPeriod && (
            <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
              {task.filingPeriod}
            </span>
          )}
          {task.assigneeName && (
            <div className="flex items-center gap-1">
              <User size={12} className="text-muted-foreground shrink-0" />
              <span className="text-muted-foreground truncate max-w-[80px]">{task.assigneeName}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
});
