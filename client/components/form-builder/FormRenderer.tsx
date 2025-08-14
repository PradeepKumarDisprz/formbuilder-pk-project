import { useState } from "react";
import {
  FormSchema,
  FormField,
  DropdownProperties,
  DatePickerProperties,
  FileUploadProperties,
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

    const validation = validateForm(schema, formValues);

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

  const renderField = (field: FormField) => {
    const fieldValue = formValues[field.id];
    const hasError = !!validationErrors[field.id];
    const isUDF = field.type.startsWith("udf-");

    const fieldWrapper = (children: React.ReactNode) => (
      <div className="space-y-2">
        <Label
          className={cn("text-sm font-medium", hasError && "text-red-600")}
        >
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {field.showDescription && field.description && (
          <p className="text-sm text-gray-600">{field.description}</p>
        )}
        {children}
        {hasError && (
          <p className="text-sm text-red-600">{validationErrors[field.id]}</p>
        )}
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
            placeholder={(field.properties as any).placeholder}
            className={cn(hasError && "border-red-300 focus:border-red-500")}
          />,
        );

      case "long-text":
        return fieldWrapper(
          <Textarea
            value={fieldValue || ""}
            onChange={(e) => updateValue(field.id, e.target.value)}
            placeholder={(field.properties as any).placeholder}
            rows={4}
            className={cn(hasError && "border-red-300 focus:border-red-500")}
          />,
        );

      case "number":
        return fieldWrapper(
          <Input
            type="number"
            value={fieldValue || ""}
            onChange={(e) => updateValue(field.id, e.target.value)}
            placeholder={(field.properties as any).placeholder}
            min={(field.properties as any).min}
            max={(field.properties as any).max}
            step={(field.properties as any).step}
            className={cn(hasError && "border-red-300 focus:border-red-500")}
          />,
        );

      case "date-picker":
        const dateProps = field.properties as DatePickerProperties;
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
                  : "Pick a date"}
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
            <RadioGroup
              value={fieldValue || ""}
              onValueChange={(value) => updateValue(field.id, value)}
            >
              {dropdownProps.options?.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={option.value}
                    id={`${field.id}-${option.id}`}
                  />
                  <Label
                    htmlFor={`${field.id}-${option.id}`}
                    className="text-sm"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>,
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
            placeholder="Enter value"
          />,
        );
    }
  };

  return (
    <div className={cn("max-w-4xl mx-auto h-full overflow-y-auto", className)}>
      <form onSubmit={handleSubmit} className="space-y-8 pb-8">
        {/* Form Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">{schema.title}</h1>
          {schema.description && (
            <p className="text-gray-600">{schema.description}</p>
          )}
        </div>

        {/* Form Sections */}
        <div className="space-y-6">
          {schema.sections.map((section) => (
            <div
              key={section.id}
              className="bg-white rounded-lg border border-gray-200 p-6 space-y-6"
            >
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {section.title}
                </h2>
                {section.description && (
                  <p className="text-gray-600 mt-1">{section.description}</p>
                )}
              </div>

              <div className="space-y-6">
                {section.fields.map((field) => (
                  <div key={field.id}>{renderField(field)}</div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        {mode === "response" && (
          <div className="text-center sticky bottom-0 bg-white py-4 border-t">
            <Button type="submit" disabled={isSubmitting} className="px-8 py-2">
              {isSubmitting ? "Submitting..." : "Submit Form"}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};
