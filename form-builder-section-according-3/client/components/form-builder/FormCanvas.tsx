import { useState, useRef, useEffect } from "react";
import {
  FormSchema,
  FormSection,
  FormField,
  FormItem,
  generateId,
  createDefaultField,
  createDefaultSection,
  isFormField,
  isFormSection,
} from "@/lib/form-schema";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { FieldEditor } from "./FieldEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Plus,
  GripVertical,
  Trash2,
  Folder,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FormCanvasProps {
  schema: FormSchema;
  onSchemaChange: (schema: FormSchema) => void;
  selectedField: string | null;
  onFieldSelect: (fieldId: string | null) => void;
}

export const FormCanvas: React.FC<FormCanvasProps> = ({
  schema,
  onSchemaChange,
  selectedField,
  onFieldSelect,
}) => {
  const [editingHeader, setEditingHeader] = useState(false);
  const [editingSections, setEditingSections] = useState<
    Record<string, { title: boolean; description: boolean }>
  >({});
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const canvasRef = useRef<HTMLDivElement>(null);

  // Auto-scroll during drag
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(0);

  useEffect(() => {
    if (!isDragging) return;

    const handleScroll = () => {
      if (!canvasRef.current) return;

      const container = canvasRef.current;
      const containerRect = container.getBoundingClientRect();
      const threshold = 50;

      if (dragY < containerRect.top + threshold) {
        // Scroll up
        container.scrollTop -= 5;
      } else if (dragY > containerRect.bottom - threshold) {
        // Scroll down
        container.scrollTop += 5;
      }
    };

    const intervalId = setInterval(handleScroll, 16);
    return () => clearInterval(intervalId);
  }, [isDragging, dragY]);

  const { onDragOver, onDrop, onDragEnter, onDragLeave, dropTarget } =
    useDragAndDrop({
      onDrop: (item, result) => {
        setIsDragging(false);
        if (item.type === "field-type") {
          handleAddField(item.data.fieldType, result.targetId, result.position);
        } else if (item.type === "field-reorder") {
          handleReorderField(
            item.data.fieldId,
            result.targetId,
            result.position,
          );
        }
      },
      acceptTypes: ["field-type", "field-reorder"],
      autoScroll: true,
      scrollContainer: () => canvasRef.current,
    });

  const getDropZonePosition = (e: React.DragEvent, targetId?: string) => {
    if (!targetId) {
      // Dropping in main area
      const mouseY = e.clientY;
      const container = e.currentTarget as HTMLElement;
      const itemElements = container.querySelectorAll("[data-item-id]");

      for (let i = 0; i < itemElements.length; i++) {
        const element = itemElements[i] as HTMLElement;
        const rect = element.getBoundingClientRect();
        const elementMiddle = rect.top + rect.height / 2;

        if (mouseY < elementMiddle) {
          return i;
        }
      }

      return schema.items.length;
    } else {
      // Dropping in a section
      const section = schema.items.find(
        (item) => isFormSection(item) && item.id === targetId,
      ) as FormSection;
      if (!section) return 0;

      const mouseY = e.clientY;
      const container = e.currentTarget as HTMLElement;
      const fieldElements = container.querySelectorAll("[data-field-id]");

      for (let i = 0; i < fieldElements.length; i++) {
        const element = fieldElements[i] as HTMLElement;
        const rect = element.getBoundingClientRect();
        const elementMiddle = rect.top + rect.height / 2;

        if (mouseY < elementMiddle) {
          return i;
        }
      }

      return section.fields.length;
    }
  };

  const handleAddField = (
    fieldType: any,
    targetId?: string,
    position?: number,
  ) => {
    const defaultField = createDefaultField(fieldType);
    const newField: FormField = {
      ...defaultField,
      id: generateId(),
      order: 0,
    };

    const updatedSchema = { ...schema };

    if (targetId) {
      // Adding to a specific section
      const sectionIndex = updatedSchema.items.findIndex(
        (item) => isFormSection(item) && item.id === targetId,
      );
      if (sectionIndex >= 0) {
        const section = updatedSchema.items[sectionIndex] as FormSection;
        const insertPosition = position ?? section.fields.length;
        section.fields.splice(insertPosition, 0, newField);

        section.fields.forEach((field, index) => {
          field.order = index;
        });
      }
    } else {
      // Adding to main form area
      const insertPosition = position ?? updatedSchema.items.length;
      updatedSchema.items.splice(insertPosition, 0, newField);

      updatedSchema.items.forEach((item, index) => {
        if (isFormField(item)) {
          item.order = index;
        } else {
          item.order = index;
        }
      });
    }

    onSchemaChange(updatedSchema);
    onFieldSelect(newField.id);
  };

  const handleReorderField = (
    fieldId: string,
    targetId?: string,
    position?: number,
  ) => {
    const updatedSchema = { ...schema };
    let sourceField: FormField | null = null;
    let sourceLocation: {
      type: "main" | "section";
      index: number;
      sectionId?: string;
    } | null = null;

    // Find and remove the field
    for (let i = 0; i < updatedSchema.items.length; i++) {
      const item = updatedSchema.items[i];
      if (isFormField(item) && item.id === fieldId) {
        sourceField = item;
        sourceLocation = { type: "main", index: i };
        updatedSchema.items.splice(i, 1);
        break;
      } else if (isFormSection(item)) {
        const fieldIndex = item.fields.findIndex((f) => f.id === fieldId);
        if (fieldIndex >= 0) {
          sourceField = item.fields[fieldIndex];
          sourceLocation = {
            type: "section",
            index: fieldIndex,
            sectionId: item.id,
          };
          item.fields.splice(fieldIndex, 1);
          break;
        }
      }
    }

    if (!sourceField || !sourceLocation) return;

    // Add field to new position
    if (targetId) {
      const sectionIndex = updatedSchema.items.findIndex(
        (item) => isFormSection(item) && item.id === targetId,
      );
      if (sectionIndex >= 0) {
        const section = updatedSchema.items[sectionIndex] as FormSection;
        const insertPosition = position ?? section.fields.length;
        section.fields.splice(insertPosition, 0, sourceField);

        section.fields.forEach((field, index) => {
          field.order = index;
        });
      }
    } else {
      const insertPosition = position ?? updatedSchema.items.length;
      updatedSchema.items.splice(insertPosition, 0, sourceField);

      updatedSchema.items.forEach((item, index) => {
        if (isFormField(item)) {
          item.order = index;
        } else {
          item.order = index;
        }
      });
    }

    // Reorder source location if it was a section
    if (sourceLocation.type === "section" && sourceLocation.sectionId) {
      const sourceSection = updatedSchema.items.find(
        (item) => isFormSection(item) && item.id === sourceLocation.sectionId,
      ) as FormSection;
      if (sourceSection) {
        sourceSection.fields.forEach((field, index) => {
          field.order = index;
        });
      }
    }

    onSchemaChange(updatedSchema);
  };

  const handleUpdateField = (fieldId: string, updates: Partial<FormField>) => {
    const updatedSchema = { ...schema };

    for (const item of updatedSchema.items) {
      if (isFormField(item) && item.id === fieldId) {
        Object.assign(item, updates);
        break;
      } else if (isFormSection(item)) {
        const field = item.fields.find((f) => f.id === fieldId);
        if (field) {
          Object.assign(field, updates);
          break;
        }
      }
    }

    onSchemaChange(updatedSchema);
  };

  const handleDeleteField = (fieldId: string) => {
    const updatedSchema = { ...schema };

    for (let i = 0; i < updatedSchema.items.length; i++) {
      const item = updatedSchema.items[i];
      if (isFormField(item) && item.id === fieldId) {
        updatedSchema.items.splice(i, 1);
        break;
      } else if (isFormSection(item)) {
        const fieldIndex = item.fields.findIndex((f) => f.id === fieldId);
        if (fieldIndex >= 0) {
          item.fields.splice(fieldIndex, 1);
          item.fields.forEach((field, index) => {
            field.order = index;
          });
          break;
        }
      }
    }

    updatedSchema.items.forEach((item, index) => {
      if (isFormField(item)) {
        item.order = index;
      } else {
        item.order = index;
      }
    });

    onSchemaChange(updatedSchema);
    if (selectedField === fieldId) {
      onFieldSelect(null);
    }
  };

  const handleCloneField = (fieldId: string) => {
    const updatedSchema = { ...schema };

    for (let i = 0; i < updatedSchema.items.length; i++) {
      const item = updatedSchema.items[i];
      if (isFormField(item) && item.id === fieldId) {
        const clonedField: FormField = {
          ...item,
          id: generateId(),
          label: `${item.label} (Copy)`,
          order: i + 1,
        };
        updatedSchema.items.splice(i + 1, 0, clonedField);
        break;
      } else if (isFormSection(item)) {
        const fieldIndex = item.fields.findIndex((f) => f.id === fieldId);
        if (fieldIndex >= 0) {
          const originalField = item.fields[fieldIndex];
          const clonedField: FormField = {
            ...originalField,
            id: generateId(),
            label: `${originalField.label} (Copy)`,
            order: fieldIndex + 1,
          };
          item.fields.splice(fieldIndex + 1, 0, clonedField);
          item.fields.forEach((field, index) => {
            field.order = index;
          });
          break;
        }
      }
    }

    onSchemaChange(updatedSchema);
  };

  const handleAddSection = () => {
    const newSection = createDefaultSection();
    newSection.order = schema.items.length;

    const updatedSchema = {
      ...schema,
      items: [...schema.items, newSection],
    };

    setOpenSections((prev) => ({ ...prev, [newSection.id]: true }));
    onSchemaChange(updatedSchema);
  };

  const handleDeleteSection = (sectionId: string) => {
    const updatedSchema = { ...schema };
    const sectionIndex = updatedSchema.items.findIndex(
      (item) => isFormSection(item) && item.id === sectionId,
    );

    if (sectionIndex >= 0) {
      updatedSchema.items.splice(sectionIndex, 1);

      updatedSchema.items.forEach((item, index) => {
        item.order = index;
      });

      onSchemaChange(updatedSchema);
    }
  };

  const handleHeaderUpdate = (
    field: "title" | "description",
    value: string,
  ) => {
    const updatedSchema = {
      ...schema,
      [field]: value,
      updatedAt: new Date(),
    };
    onSchemaChange(updatedSchema);
  };

  const handleSectionUpdate = (
    sectionId: string,
    field: "title" | "description",
    value: string,
  ) => {
    const updatedSchema = { ...schema };
    const section = updatedSchema.items.find(
      (item) => isFormSection(item) && item.id === sectionId,
    ) as FormSection;
    if (section) {
      section[field] = value;
      onSchemaChange(updatedSchema);
    }
  };

  const toggleSectionEditing = (
    sectionId: string,
    field: "title" | "description",
    value: boolean,
  ) => {
    setEditingSections((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [field]: value,
      },
    }));
  };

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  return (
    <div
      ref={canvasRef}
      className="flex-1 bg-gray-100 p-6 overflow-y-auto"
      onDragOver={(e) => {
        setDragY(e.clientY);
        setIsDragging(true);
      }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Form Header */}
        <div className="mb-6">
          <div className="bg-indigo-600 text-white px-4 py-2 rounded-t-lg">
            <span className="text-sm font-medium">Form Header</span>
          </div>
          <div className="bg-white border border-t-0 border-gray-200 rounded-b-lg p-6">
            <div className="space-y-4">
              {editingHeader ? (
                <>
                  <Input
                    value={schema.title}
                    onChange={(e) =>
                      handleHeaderUpdate("title", e.target.value)
                    }
                    onBlur={() => setEditingHeader(false)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && setEditingHeader(false)
                    }
                    className="text-xl font-semibold border-none p-0 focus:ring-0"
                    placeholder="Form title"
                    autoFocus
                  />
                  <Textarea
                    value={schema.description || ""}
                    onChange={(e) =>
                      handleHeaderUpdate("description", e.target.value)
                    }
                    onBlur={() => setEditingHeader(false)}
                    className="border-none p-0 focus:ring-0 resize-none"
                    placeholder="Form description"
                    rows={2}
                  />
                </>
              ) : (
                <div
                  className="space-y-2"
                  onClick={() => setEditingHeader(true)}
                >
                  <h1 className="text-xl font-semibold text-gray-900 cursor-text">
                    {schema.title || "Click to add title"}
                  </h1>
                  <p className="text-gray-600 cursor-text">
                    {schema.description || "Click to add description"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Drop Zone */}
        <div
          className={cn(
            "min-h-32 border-2 border-dashed border-gray-300 rounded-lg bg-white transition-all",
            dropTarget === "main" && "border-indigo-300 bg-indigo-50",
          )}
          data-drop-target="main"
          onDragOver={(e) => {
            onDragOver(e);
            const position = getDropZonePosition(e);
            e.dataTransfer.dropEffect = "copy";
          }}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDrop={(e) => {
            const position = getDropZonePosition(e);
            onDrop(e, undefined, position);
          }}
        >
          {schema.items.length === 0 ? (
            <div className="p-12 text-center">
              <div className="flex flex-col items-center justify-center text-gray-400">
                <GripVertical className="w-8 h-8 mb-2" />
                <p className="text-sm">
                  Drag fields from the left panel or add a section
                </p>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {schema.items.map((item, index) => (
                <div key={item.id} data-item-id={item.id}>
                  {isFormField(item) ? (
                    <div data-field-id={item.id}>
                      <FieldEditor
                        field={item}
                        isSelected={selectedField === item.id}
                        onSelect={() => onFieldSelect(item.id)}
                        onUpdate={(updates) =>
                          handleUpdateField(item.id, updates)
                        }
                        onDelete={() => handleDeleteField(item.id)}
                        onClone={() => handleCloneField(item.id)}
                      />
                    </div>
                  ) : (
                    <Collapsible
                      open={openSections[item.id] ?? true}
                      onOpenChange={() => toggleSection(item.id)}
                    >
                      <div className="border border-gray-200 rounded-lg bg-white">
                        {/* Section Header */}
                        <div className="flex items-center justify-between bg-indigo-600 text-white px-4 py-3 rounded-t-lg">
                          <div className="flex items-center gap-2">
                            <CollapsibleTrigger>
                              {openSections[item.id] ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </CollapsibleTrigger>
                            <span className="text-sm font-medium">
                              Section {item.order + 1} of{" "}
                              {
                                schema.items.filter((i) => isFormSection(i))
                                  .length
                              }
                            </span>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-white hover:bg-indigo-700"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() => handleDeleteSection(item.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Section
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <CollapsibleContent>
                          {/* Section Details */}
                          <div className="p-4 border-b border-gray-100">
                            <div className="space-y-3">
                              {editingSections[item.id]?.title ? (
                                <Input
                                  value={item.title}
                                  onChange={(e) =>
                                    handleSectionUpdate(
                                      item.id,
                                      "title",
                                      e.target.value,
                                    )
                                  }
                                  onBlur={() =>
                                    toggleSectionEditing(
                                      item.id,
                                      "title",
                                      false,
                                    )
                                  }
                                  onKeyPress={(e) =>
                                    e.key === "Enter" &&
                                    toggleSectionEditing(
                                      item.id,
                                      "title",
                                      false,
                                    )
                                  }
                                  className="font-semibold"
                                  autoFocus
                                />
                              ) : (
                                <h3
                                  className="text-lg font-semibold text-gray-900 cursor-text"
                                  onClick={() =>
                                    toggleSectionEditing(item.id, "title", true)
                                  }
                                >
                                  {item.title}
                                </h3>
                              )}

                              {editingSections[item.id]?.description ? (
                                <Textarea
                                  value={item.description || ""}
                                  onChange={(e) =>
                                    handleSectionUpdate(
                                      item.id,
                                      "description",
                                      e.target.value,
                                    )
                                  }
                                  onBlur={() =>
                                    toggleSectionEditing(
                                      item.id,
                                      "description",
                                      false,
                                    )
                                  }
                                  className="text-sm"
                                  placeholder="Section description"
                                  rows={2}
                                  autoFocus
                                />
                              ) : (
                                <p
                                  className="text-sm text-gray-600 cursor-text"
                                  onClick={() =>
                                    toggleSectionEditing(
                                      item.id,
                                      "description",
                                      true,
                                    )
                                  }
                                >
                                  {item.description ||
                                    "Click to add section description"}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Section Drop Zone */}
                          <div
                            className={cn(
                              "min-h-24 border-2 border-dashed border-gray-200 m-4 rounded-lg transition-all",
                              dropTarget === item.id &&
                                "border-indigo-300 bg-indigo-50",
                            )}
                            data-drop-target={item.id}
                            onDragOver={(e) => {
                              onDragOver(e);
                              const position = getDropZonePosition(e, item.id);
                              e.dataTransfer.dropEffect = "copy";
                            }}
                            onDragEnter={onDragEnter}
                            onDragLeave={onDragLeave}
                            onDrop={(e) => {
                              const position = getDropZonePosition(e, item.id);
                              onDrop(e, item.id, position);
                            }}
                          >
                            {item.fields.length === 0 ? (
                              <div className="p-8 text-center">
                                <div className="flex flex-col items-center justify-center text-gray-400">
                                  <GripVertical className="w-6 h-6 mb-2" />
                                  <p className="text-sm">Drop fields here</p>
                                </div>
                              </div>
                            ) : (
                              <div className="p-4 space-y-4">
                                {item.fields.map((field) => (
                                  <div key={field.id} data-field-id={field.id}>
                                    <FieldEditor
                                      field={field}
                                      isSelected={selectedField === field.id}
                                      onSelect={() => onFieldSelect(field.id)}
                                      onUpdate={(updates) =>
                                        handleUpdateField(field.id, updates)
                                      }
                                      onDelete={() =>
                                        handleDeleteField(field.id)
                                      }
                                      onClone={() => handleCloneField(field.id)}
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Section Button */}
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            onClick={handleAddSection}
            className="flex items-center gap-2"
          >
            <Folder className="w-4 h-4" />
            Add Section
          </Button>
        </div>
      </div>
    </div>
  );
};
