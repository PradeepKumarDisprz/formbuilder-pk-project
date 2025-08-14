export type FieldType =
  | "short-text"
  | "long-text"
  | "date-picker"
  | "dropdown"
  | "file-upload"
  | "number"
  | "udf-designation"
  | "udf-department"
  | "udf-location"
  | "udf-blood-group"
  | "udf-education";

export type DateFormat = "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY/MM/DD";

export type SelectionType = "single" | "multi";

export interface DropdownOption {
  id: string;
  label: string;
  value: string;
}

export interface BaseFieldProperties {
  placeholder?: string;
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

export interface DatePickerProperties extends BaseFieldProperties {
  dateFormat: DateFormat;
}

export interface DropdownProperties extends BaseFieldProperties {
  options: DropdownOption[];
  selectionType: SelectionType;
  allowOther?: boolean;
}

export interface NumberProperties extends BaseFieldProperties {
  min?: number;
  max?: number;
  step?: number;
}

export interface FileUploadProperties extends BaseFieldProperties {
  acceptedTypes?: string[];
  maxSize?: number;
  multiple?: boolean;
}

export type FieldProperties =
  | BaseFieldProperties
  | DatePickerProperties
  | DropdownProperties
  | NumberProperties
  | FileUploadProperties;

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  description?: string;
  required: boolean;
  showDescription: boolean;
  properties: FieldProperties;
  order: number;
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  order: number;
}

export interface FormSchema {
  id: string;
  title: string;
  description?: string;
  sections: FormSection[];
  createdAt: Date;
  updatedAt: Date;
}

export const FIELD_TYPES: Record<
  FieldType,
  { label: string; icon: string; category: "input" | "udf" }
> = {
  "short-text": { label: "Short Text", icon: "📝", category: "input" },
  "long-text": { label: "Long Text", icon: "📄", category: "input" },
  "date-picker": { label: "Date Picker", icon: "📅", category: "input" },
  dropdown: { label: "Dropdown", icon: "📋", category: "input" },
  "file-upload": { label: "File Upload", icon: "📎", category: "input" },
  number: { label: "Number", icon: "🔢", category: "input" },
  "udf-designation": { label: "Designation", icon: "💼", category: "udf" },
  "udf-department": { label: "Department", icon: "🏢", category: "udf" },
  "udf-location": { label: "Location", icon: "📍", category: "udf" },
  "udf-blood-group": { label: "Blood Group", icon: "🩸", category: "udf" },
  "udf-education": { label: "Education", icon: "🎓", category: "udf" },
};

export const createDefaultField = (
  type: FieldType,
): Omit<FormField, "id" | "order"> => {
  const baseField = {
    type,
    label: FIELD_TYPES[type].label,
    description: "",
    required: false,
    showDescription: false,
  };

  switch (type) {
    case "date-picker":
      return {
        ...baseField,
        properties: {
          dateFormat: "MM/DD/YYYY" as DateFormat,
          placeholder: "Select a date",
        } as DatePickerProperties,
      };
    case "dropdown":
      return {
        ...baseField,
        properties: {
          options: [{ id: "1", label: "Option 1", value: "option1" }],
          selectionType: "single" as SelectionType,
          placeholder: "Select an option",
        } as DropdownProperties,
      };
    case "number":
      return {
        ...baseField,
        properties: {
          placeholder: "Enter a number",
          min: 0,
          step: 1,
        } as NumberProperties,
      };
    case "file-upload":
      return {
        ...baseField,
        properties: {
          acceptedTypes: [".pdf", ".doc", ".docx"],
          maxSize: 10485760, // 10MB
          multiple: false,
        } as FileUploadProperties,
      };
    default:
      return {
        ...baseField,
        properties: {
          placeholder: `Enter ${FIELD_TYPES[type].label.toLowerCase()}`,
        } as BaseFieldProperties,
      };
  }
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const createDefaultForm = (): FormSchema => ({
  id: generateId(),
  title: "Untitled Form",
  description: "",
  sections: [
    {
      id: generateId(),
      title: "Section 1 of 1",
      description: "",
      fields: [],
      order: 0,
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
});
