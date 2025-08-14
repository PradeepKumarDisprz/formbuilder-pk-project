import { useState, useRef, useEffect } from "react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CalendarIcon,
  Upload,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
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

interface SubmittedFormData {
  schema: FormSchema;
  values: Record<string, any>;
  submittedAt: Date;
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
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<SubmittedFormData | null>(
    null,
  );
  const contentRef = useRef<HTMLDivElement>(null);

  // Initialize all sections as open by default
  useEffect(() => {
    const initialOpenState: Record<string, boolean> = {};
    schema.items.forEach((item) => {
      if (isFormSection(item)) {
        initialOpenState[item.id] = true;
      }
    });
    setOpenSections(initialOpenState);
  }, [schema.items]);

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

  const handleClear = () => {
    setFormValues({});
    setValidationErrors({});
    onValuesChange?.({});
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
      // Save submitted data
      const submissionData: SubmittedFormData = {
        schema,
        values: formValues,
        submittedAt: new Date(),
      };
      setSubmittedData(submissionData);
      setIsSubmitted(true);
    }

    onSubmit?.(formValues, validation);
    setIsSubmitting(false);
  };

  const handleViewAnswers = () => {
    setIsSubmitted(false);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(`section-${sectionId}`);
    if (element && contentRef.current) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Calculate progress for each section
  const getSectionProgress = (section: any) => {
    const totalFields = section.fields.length;
    const answeredFields = section.fields.filter((field: FormField) => {
      const value = formValues[field.id];
      return value !== undefined && value !== null && value !== "";
    }).length;
    return { answered: answeredFields, total: totalFields };
  };

  // Check if form can be submitted
  const canSubmit = () => {
    const allFields = getAllFields(schema.items);
    const requiredFields = allFields.filter((field) => field.required);

    return requiredFields.every((field) => {
      const value = formValues[field.id];
      return value !== undefined && value !== null && value !== "";
    });
  };

  const renderField = (
    field: FormField,
    questionNumber?: number,
    disabled = false,
  ) => {
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
            onChange={(e) => !disabled && updateValue(field.id, e.target.value)}
            placeholder="Your Answer"
            disabled={disabled}
            className={cn(
              hasError && "border-red-300 focus:border-red-500",
              disabled && "bg-gray-50",
            )}
          />,
        );

      case "long-text":
        return fieldWrapper(
          <Textarea
            value={fieldValue || ""}
            onChange={(e) => !disabled && updateValue(field.id, e.target.value)}
            placeholder="Your Answer"
            rows={3}
            disabled={disabled}
            className={cn(
              hasError && "border-red-300 focus:border-red-500",
              disabled && "bg-gray-50",
            )}
          />,
        );

      case "number":
        return fieldWrapper(
          <Input
            type="number"
            value={fieldValue || ""}
            onChange={(e) => !disabled && updateValue(field.id, e.target.value)}
            placeholder="Your Answer"
            min={(field.properties as any).min}
            max={(field.properties as any).max}
            step={(field.properties as any).step}
            disabled={disabled}
            className={cn(
              hasError && "border-red-300 focus:border-red-500",
              disabled && "bg-gray-50",
            )}
          />,
        );

      case "date-picker":
        return fieldWrapper(
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                disabled={disabled}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !fieldValue && "text-muted-foreground",
                  hasError && "border-red-300",
                  disabled && "bg-gray-50 cursor-not-allowed",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {fieldValue
                  ? format(new Date(fieldValue), "PPP")
                  : "Select a date"}
              </Button>
            </PopoverTrigger>
            {!disabled && (
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={fieldValue ? new Date(fieldValue) : undefined}
                  onSelect={(date) =>
                    updateValue(field.id, date?.toISOString())
                  }
                  initialFocus
                />
              </PopoverContent>
            )}
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
                    disabled={disabled}
                    checked={
                      Array.isArray(fieldValue) &&
                      fieldValue.includes(option.value)
                    }
                    onCheckedChange={(checked) => {
                      if (disabled) return;
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
              onValueChange={(value) =>
                !disabled && updateValue(field.id, value)
              }
              disabled={disabled}
            >
              <SelectTrigger
                className={cn(
                  hasError && "border-red-300 focus:border-red-500",
                  disabled && "bg-gray-50",
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
            <div
              className={cn(
                "border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors",
                !disabled && "hover:border-gray-400",
                disabled && "bg-gray-50",
              )}
            >
              <input
                type="file"
                id={`file-${field.id}`}
                multiple={fileProps.multiple}
                accept={fileProps.acceptedTypes?.join(",")}
                disabled={disabled}
                onChange={(e) => {
                  if (disabled) return;
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
              <Label
                htmlFor={`file-${field.id}`}
                className={cn(
                  "cursor-pointer",
                  disabled && "cursor-not-allowed",
                )}
              >
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
            onChange={(e) => !disabled && updateValue(field.id, e.target.value)}
            placeholder="Your Answer"
            disabled={disabled}
            className={disabled ? "bg-gray-50" : ""}
          />,
        );
    }
  };

  const sectionsWithFields = schema.items.filter(
    (item) => isFormSection(item) && item.fields.length > 0,
  );
  const hasAnySections = sectionsWithFields.length > 0;
  const standaloneFields = schema.items.filter((item) => isFormField(item));

  let questionCounter = 1;

  // Show submitted view
  if (isSubmitted && submittedData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Thank You!
            </h1>
            <p className="text-gray-600 mb-6">
              Your response has been submitted successfully.
            </p>
            <div className="text-sm text-gray-500 mb-6">
              Submitted on {submittedData.submittedAt.toLocaleString()}
            </div>
            <Button onClick={handleViewAnswers} className="w-full">
              View Your Answers
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex h-full", className)}>
      {/* Left Sidebar - Form Sections */}
      {hasAnySections && (
        <div className="w-64 bg-indigo-50 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-white">
            <h3 className="font-semibold text-gray-900">Form Sections</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {sectionsWithFields.map((section, index) => {
              const progress = getSectionProgress(section);
              return (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className="w-full text-left p-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        Section {index + 1} of {sectionsWithFields.length}
                      </div>
                      <div className="text-sm opacity-90">{section.title}</div>
                      <div className="text-xs opacity-75 mt-1">
                        {progress.answered} of {progress.total} answered
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 bg-white">
        <div
          ref={contentRef}
          className="max-w-2xl mx-auto p-6 h-full overflow-y-auto"
        >
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Form Header */}
            <div className="bg-indigo-600 text-white px-6 py-4 rounded-lg">
              <h1 className="text-xl font-semibold">{schema.title}</h1>
              {schema.description && (
                <p className="text-indigo-100 mt-1">{schema.description}</p>
              )}
            </div>

            {/* Form Content */}
            <div className="space-y-8">
              {/* Standalone Fields */}
              {standaloneFields.map((field) => (
                <div key={field.id}>
                  {renderField(
                    field as FormField,
                    questionCounter++,
                    submittedData ? true : false,
                  )}
                </div>
              ))}

              {/* Sections */}
              {sectionsWithFields.map((section, sectionIndex) => (
                <div key={section.id} id={`section-${section.id}`}>
                  <Collapsible
                    open={openSections[section.id] ?? true}
                    onOpenChange={() => toggleSection(section.id)}
                  >
                    {/* Section Header */}
                    <div className="bg-indigo-600 text-white px-6 py-3 rounded-lg">
                      <CollapsibleTrigger className="flex items-center gap-2 w-full">
                        {openSections[section.id] ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        <div className="text-left flex-1">
                          <div className="text-sm font-medium mb-1">
                            Section {sectionIndex + 1} of{" "}
                            {sectionsWithFields.length}
                          </div>
                          <h2 className="text-lg font-semibold">
                            {section.title}
                          </h2>
                          {section.description && (
                            <p className="text-indigo-100 text-sm mt-1">
                              {section.description}
                            </p>
                          )}
                        </div>
                      </CollapsibleTrigger>
                    </div>

                    <CollapsibleContent className="mt-4">
                      <div className="space-y-6 pl-4">
                        {section.fields.map((field) => (
                          <div key={field.id}>
                            {renderField(
                              field,
                              questionCounter++,
                              submittedData ? true : false,
                            )}
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            {mode === "response" && !submittedData && (
              <div className="flex justify-between items-center pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClear}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Clear
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !canSubmit()}
                  className="bg-indigo-600 hover:bg-indigo-700 px-8"
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
