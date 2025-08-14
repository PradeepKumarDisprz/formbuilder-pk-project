import { useState } from "react";
import {
  FormSchema,
  FormSection,
  FormField,
  generateId,
  createDefaultField,
} from "@/lib/form-schema";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { FieldEditor } from "./FieldEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, GripVertical } from "lucide-react";
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

  const { onDragOver, onDrop, onDragEnter, onDragLeave, dropTarget } =
    useDragAndDrop({
      onDrop: (item, result) => {
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
    });

  const getDropZonePosition = (e: React.DragEvent, sectionId: string) => {
    const section = schema.sections.find((s) => s.id === sectionId);
    if (!section || section.fields.length === 0) return 0;

    const container = e.currentTarget as HTMLElement;
    const fieldElements = container.querySelectorAll("[data-field-id]");
    const mouseY = e.clientY;

    for (let i = 0; i < fieldElements.length; i++) {
      const element = fieldElements[i] as HTMLElement;
      const rect = element.getBoundingClientRect();
      const elementMiddle = rect.top + rect.height / 2;

      if (mouseY < elementMiddle) {
        return i;
      }
    }

    return section.fields.length;
  };

  const handleAddField = (
    fieldType: any,
    targetSectionId?: string,
    position?: number,
  ) => {
    const defaultField = createDefaultField(fieldType);
    const newField: FormField = {
      ...defaultField,
      id: generateId(),
      order: 0, // Will be set correctly below
    };

    const updatedSchema = { ...schema };
    const targetSection =
      updatedSchema.sections.find((s) => s.id === targetSectionId) ||
      updatedSchema.sections[0];

    const insertPosition = position ?? targetSection.fields.length;
    targetSection.fields.splice(insertPosition, 0, newField);

    // Reorder all fields
    targetSection.fields.forEach((field, index) => {
      field.order = index;
    });

    onSchemaChange(updatedSchema);
    onFieldSelect(newField.id);
  };

  const handleReorderField = (
    fieldId: string,
    targetSectionId?: string,
    position?: number,
  ) => {
    const updatedSchema = { ...schema };
    let sourceField: FormField | null = null;
    let sourceSection: FormSection | null = null;

    // Find and remove the field
    for (const section of updatedSchema.sections) {
      const fieldIndex = section.fields.findIndex((f) => f.id === fieldId);
      if (fieldIndex >= 0) {
        sourceField = section.fields[fieldIndex];
        sourceSection = section;
        section.fields.splice(fieldIndex, 1);
        break;
      }
    }

    if (!sourceField) return;

    // Add field to new position
    const targetSection =
      updatedSchema.sections.find((s) => s.id === targetSectionId) ||
      updatedSchema.sections[0];

    const insertPosition = position ?? targetSection.fields.length;
    targetSection.fields.splice(insertPosition, 0, sourceField);

    // Reorder all fields in both sections
    if (sourceSection && sourceSection.id !== targetSection.id) {
      sourceSection.fields.forEach((field, index) => {
        field.order = index;
      });
    }

    targetSection.fields.forEach((field, index) => {
      field.order = index;
    });

    onSchemaChange(updatedSchema);
  };

  const handleUpdateField = (fieldId: string, updates: Partial<FormField>) => {
    const updatedSchema = { ...schema };

    for (const section of updatedSchema.sections) {
      const field = section.fields.find((f) => f.id === fieldId);
      if (field) {
        Object.assign(field, updates);
        break;
      }
    }

    onSchemaChange(updatedSchema);
  };

  const handleDeleteField = (fieldId: string) => {
    const updatedSchema = { ...schema };

    for (const section of updatedSchema.sections) {
      const fieldIndex = section.fields.findIndex((f) => f.id === fieldId);
      if (fieldIndex >= 0) {
        section.fields.splice(fieldIndex, 1);
        // Reorder remaining fields
        section.fields.forEach((field, index) => {
          field.order = index;
        });
        break;
      }
    }

    onSchemaChange(updatedSchema);
    if (selectedField === fieldId) {
      onFieldSelect(null);
    }
  };

  const handleCloneField = (fieldId: string) => {
    const updatedSchema = { ...schema };

    for (const section of updatedSchema.sections) {
      const fieldIndex = section.fields.findIndex((f) => f.id === fieldId);
      if (fieldIndex >= 0) {
        const originalField = section.fields[fieldIndex];
        const clonedField: FormField = {
          ...originalField,
          id: generateId(),
          label: `${originalField.label} (Copy)`,
          order: fieldIndex + 1,
        };

        section.fields.splice(fieldIndex + 1, 0, clonedField);
        // Reorder subsequent fields
        section.fields.forEach((field, index) => {
          field.order = index;
        });
        break;
      }
    }

    onSchemaChange(updatedSchema);
  };

  const handleAddSection = () => {
    const newSection: FormSection = {
      id: generateId(),
      title: `Section ${schema.sections.length + 1} of ${schema.sections.length + 1}`,
      description: "",
      fields: [],
      order: schema.sections.length,
    };

    const updatedSchema = {
      ...schema,
      sections: [...schema.sections, newSection],
    };

    onSchemaChange(updatedSchema);
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
    const section = updatedSchema.sections.find((s) => s.id === sectionId);
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

  return (
    <div className="flex-1 bg-gray-100 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
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
                <div className="space-y-2">
                  <h1
                    className="text-xl font-semibold text-gray-900 cursor-text"
                    onClick={() => setEditingHeader(true)}
                  >
                    {schema.title || "Click to add title"}
                  </h1>
                  <p
                    className="text-gray-600 cursor-text"
                    onClick={() => setEditingHeader(true)}
                  >
                    {schema.description || "Click to add description"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Sections */}
        {schema.sections.map((section) => (
          <div key={section.id} className="mb-6">
            <div className="bg-indigo-600 text-white px-4 py-2 rounded-t-lg">
              {editingSections[section.id]?.title ? (
                <Input
                  value={section.title}
                  onChange={(e) =>
                    handleSectionUpdate(section.id, "title", e.target.value)
                  }
                  onBlur={() =>
                    toggleSectionEditing(section.id, "title", false)
                  }
                  onKeyPress={(e) =>
                    e.key === "Enter" &&
                    toggleSectionEditing(section.id, "title", false)
                  }
                  className="text-sm font-medium bg-transparent border-none text-white placeholder-gray-300 focus:ring-0"
                  autoFocus
                />
              ) : (
                <span
                  className="text-sm font-medium cursor-text"
                  onClick={() =>
                    toggleSectionEditing(section.id, "title", true)
                  }
                >
                  {section.title}
                </span>
              )}
            </div>

            <div className="bg-white border border-t-0 border-gray-200 px-6 py-4">
              {editingSections[section.id]?.description ? (
                <Textarea
                  value={section.description || ""}
                  onChange={(e) =>
                    handleSectionUpdate(
                      section.id,
                      "description",
                      e.target.value,
                    )
                  }
                  onBlur={() =>
                    toggleSectionEditing(section.id, "description", false)
                  }
                  className="text-lg font-semibold border-none p-0 focus:ring-0 resize-none"
                  placeholder="Section description"
                  rows={1}
                  autoFocus
                />
              ) : (
                <h2
                  className="text-lg font-semibold text-gray-900 cursor-text"
                  onClick={() =>
                    toggleSectionEditing(section.id, "description", true)
                  }
                >
                  {section.description || "Click to add section description"}
                </h2>
              )}
            </div>

            <div
              className={cn(
                "bg-white border border-t-0 border-gray-200 rounded-b-lg min-h-32",
                dropTarget === section.id && "border-indigo-300 bg-indigo-50",
              )}
              data-drop-target={section.id}
              onDragOver={(e) => {
                onDragOver(e);
                const position = getDropZonePosition(e, section.id);
                e.dataTransfer.dropEffect = "copy";
              }}
              onDragEnter={onDragEnter}
              onDragLeave={onDragLeave}
              onDrop={(e) => {
                const position = getDropZonePosition(e, section.id);
                onDrop(e, section.id, position);
              }}
            >
              {section.fields.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <GripVertical className="w-8 h-8 mb-2" />
                    <p className="text-sm">Drag fields from the left panel</p>
                  </div>
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  {section.fields.map((field) => (
                    <div key={field.id} data-field-id={field.id}>
                      <FieldEditor
                        field={field}
                        isSelected={selectedField === field.id}
                        onSelect={() => onFieldSelect(field.id)}
                        onUpdate={(updates) =>
                          handleUpdateField(field.id, updates)
                        }
                        onDelete={() => handleDeleteField(field.id)}
                        onClone={() => handleCloneField(field.id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Add Section Button */}
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            onClick={handleAddSection}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Section
          </Button>
        </div>
      </div>
    </div>
  );
};
