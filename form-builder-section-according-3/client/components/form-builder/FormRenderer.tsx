import { useState } from "react";
import {
  FormSchema,
  FormField,
  FormItem,
  DropdownProperties,
  DatePickerProperties,
  FileUploadProperties,
  isFormField,
  isFormSection,
  getAllFields,
} from "@/lib/form-schema";
import { validateForm, ValidationResult } from "@/lib/form-validation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Upload } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface FormRendererProps {
  schema: FormSchema;
  values?: Record<string, any>;
  onValuesChange?: (values: Record<string, any>) => void;
  onSubmit?: (
    values: Record<string, any>,
    validation: ValidationResult,
  ) => void;
  mode?: "preview" | "response";
  className?: string;
}

export const FormRenderer: React.FC<FormRendererProps> = ({
  schema,
  values = {},
  onValuesChange,
  onSubmit,
  mode = "response",
  className,
}) => {
  const [formValues, setFormValues] = useState<Record<string, any>>(values);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateValue = (fieldId: string, value: any) => {
    const newValues = { ...formValues, [fieldId]: value };
    setFormValues(newValues);
    onValuesChange?.(newValues);

    // Clear validation error for this field
    if (validationErrors[fieldId]) {
      setValidationErrors((prev) => {
        const { [fieldId]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Create a temporary schema with sections for validation
    const tempSchema = {
      ...schema,
      sections: [
        {
          id: "temp",
          title: "Form",
          description: "",
          fields: getAllFields(schema.items),
          order: 0,
        },
      ],
    };

    const validation = validateForm(tempSchema, formValues);

    if (!validation.isValid) {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach((error) => {
        errorMap[error.fieldId] = error.message;
      });
      setValidationErrors(errorMap);
    } else {
      setValidationErrors({});
    }

    onSubmit?.(formValues, validation);
    setIsSubmitting(false);
  };

  const renderField = (field: FormField, questionNumber?: number) => {
    const fieldValue = formValues[field.id];
    const hasError = !!validationErrors[field.id];
    const isUDF = field.type.startsWith("udf-");

    const fieldWrapper = (children: React.ReactNode) => (
      <div className="space-y-2 mb-6">
        <div className="space-y-1">
          <Label className="text-sm font-medium text-gray-900 flex items-start">
            {questionNumber && (
              <span className="text-gray-500 mr-2 flex-shrink-0">
                {questionNumber}.
              </span>
            )}
            <span>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </span>
          </Label>
          {field.showDescription && field.description && (
            <p className="text-sm text-gray-600 ml-6">{field.description}</p>
          )}
        </div>
        <div className="ml-6">
          {children}
          {hasError && (
            <p className="text-sm text-red-600 mt-1">
              {validationErrors[field.id]}
            </p>
          )}
        </div>
      </div>
    );

    if (isUDF) {
      return fieldWrapper(
        <Input
          value=""
          disabled
          placeholder={`${field.label} (auto-filled from user data)`}
          className="bg-gray-100 text-gray-500"
        />,
      );
    }

    switch (field.type) {
      case "short-text":
        return fieldWrapper(
          <Input
            value={fieldValue || ""}
            onChange={(e) => updateValue(field.id, e.target.value)}
            placeholder={(field.properties as any).placeholder || "Your Answer"}
            className={cn(hasError && "border-red-300 focus:border-red-500")}
          />,
        );

      case "long-text":
        return fieldWrapper(
          <Textarea
            value={fieldValue || ""}
            onChange={(e) => updateValue(field.id, e.target.value)}
            placeholder={(field.properties as any).placeholder || "Your Answer"}
            rows={3}
            className={cn(hasError && "border-red-300 focus:border-red-500")}
          />,
        );

      case "number":
        return fieldWrapper(
          <Input
            type="number"
            value={fieldValue || ""}
            onChange={(e) => updateValue(field.id, e.target.value)}
            placeholder="Your Answer"
            min={(field.properties as any).min}
            max={(field.properties as any).max}
            step={(field.properties as any).step}
            className={cn(hasError && "border-red-300 focus:border-red-500")}
          />,
        );

      case "date-picker":
        return fieldWrapper(
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !fieldValue && "text-muted-foreground",
                  hasError && "border-red-300",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {fieldValue
                  ? format(new Date(fieldValue), "PPP")
                  : "Select a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={fieldValue ? new Date(fieldValue) : undefined}
                onSelect={(date) => updateValue(field.id, date?.toISOString())}
                initialFocus
              />
            </PopoverContent>
          </Popover>,
        );

      case "dropdown":
        const dropdownProps = field.properties as DropdownProperties;

        if (dropdownProps.selectionType === "multi") {
          return fieldWrapper(
            <div className="space-y-2">
              {dropdownProps.options?.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.id}-${option.id}`}
                    checked={
                      Array.isArray(fieldValue) &&
                      fieldValue.includes(option.value)
                    }
                    onCheckedChange={(checked) => {
                      const currentValues = Array.isArray(fieldValue)
                        ? fieldValue
                        : [];
                      if (checked) {
                        updateValue(field.id, [...currentValues, option.value]);
                      } else {
                        updateValue(
                          field.id,
                          currentValues.filter((v) => v !== option.value),
                        );
                      }
                    }}
                  />
                  <Label
                    htmlFor={`${field.id}-${option.id}`}
                    className="text-sm"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>,
          );
        } else {
          return fieldWrapper(
            <Select
              value={fieldValue || ""}
              onValueChange={(value) => updateValue(field.id, value)}
            >
              <SelectTrigger
                className={cn(
                  hasError && "border-red-300 focus:border-red-500",
                )}
              >
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {dropdownProps.options?.map((option) => (
                  <SelectItem key={option.id} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>,
          );
        }

      case "file-upload":
        const fileProps = field.properties as FileUploadProperties;
        return fieldWrapper(
          <div className="space-y-2">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                id={`file-${field.id}`}
                multiple={fileProps.multiple}
                accept={fileProps.acceptedTypes?.join(",")}
                onChange={(e) => {
                  const files = e.target.files;
                  if (files) {
                    updateValue(
                      field.id,
                      fileProps.multiple ? Array.from(files) : files[0],
                    );
                  }
                }}
                className="hidden"
              />
              <Label htmlFor={`file-${field.id}`} className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  Click to upload {fileProps.multiple ? "files" : "a file"}
                </p>
                {fileProps.acceptedTypes && (
                  <p className="text-xs text-gray-500 mt-1">
                    Accepted: {fileProps.acceptedTypes.join(", ")}
                  </p>
                )}
              </Label>
            </div>
            {fieldValue && (
              <div className="text-sm text-gray-600">
                {Array.isArray(fieldValue)
                  ? `${fieldValue.length} file(s) selected`
                  : fieldValue.name || "File selected"}
              </div>
            )}
          </div>,
        );

      default:
        return fieldWrapper(
          <Input
            value={fieldValue || ""}
            onChange={(e) => updateValue(field.id, e.target.value)}
            placeholder="Your Answer"
          />,
        );
    }
  };

  const hasAnySections = schema.items.some((item) => isFormSection(item));
  let questionCounter = 1;

  return (
    <div className={cn("max-w-2xl mx-auto p-6 bg-white", className)}>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Form Header - Purple bar */}
        <div className="bg-indigo-600 text-white px-6 py-4 rounded-lg">
          <h1 className="text-xl font-semibold">{schema.title}</h1>
          {schema.description && (
            <p className="text-indigo-100 mt-1">{schema.description}</p>
          )}
        </div>

        {/* Form Content */}
        <div className="space-y-8">
          {hasAnySections ? (
            // Render with sections
            schema.items.map((item) => {
              if (isFormField(item)) {
                // Standalone field
                return (
                  <div key={item.id}>
                    {renderField(item, questionCounter++)}
                  </div>
                );
              } else {
                // Section
                return (
                  <div key={item.id} className="space-y-6">
                    {/* Section Header */}
                    <div className="bg-indigo-600 text-white px-6 py-3 rounded-lg">
                      <div className="text-sm font-medium mb-1">
                        Section {item.order + 1} of{" "}
                        {schema.items.filter((i) => isFormSection(i)).length}
                      </div>
                      <h2 className="text-lg font-semibold">{item.title}</h2>
                      {item.description && (
                        <p className="text-indigo-100 text-sm mt-1">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Section Fields */}
                    <div className="space-y-6 pl-4">
                      {item.fields.map((field) => (
                        <div key={field.id}>
                          {renderField(field, questionCounter++)}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
            })
          ) : (
            // Render without sections - clean layout
            <div className="space-y-6">
              {schema.items.map((item) => {
                if (isFormField(item)) {
                  return (
                    <div key={item.id}>
                      {renderField(item, questionCounter++)}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}
        </div>

        {/* Submit Button */}
        {mode === "response" && (
          <div className="flex justify-center pt-6">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 px-8"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};
