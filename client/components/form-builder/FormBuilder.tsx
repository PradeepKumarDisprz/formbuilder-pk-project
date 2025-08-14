import { useState } from "react";
import {
  FormSchema,
  FieldType,
  createDefaultForm,
  createDefaultField,
  generateId,
} from "@/lib/form-schema";
import { FieldsSidebar } from "./FieldsSidebar";
import { FormCanvas } from "./FormCanvas";
import { FormRenderer } from "./FormRenderer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Settings, Save, FileText } from "lucide-react";
import styles from "./FormBuilder.module.scss";

interface FormBuilderProps {
  initialSchema?: FormSchema;
  onSave?: (schema: FormSchema) => void;
  onPublish?: (schema: FormSchema) => void;
}

export const FormBuilder: React.FC<FormBuilderProps> = ({
  initialSchema,
  onSave,
  onPublish,
}) => {
  const createDemoForm = (): FormSchema => {
    const form = createDefaultForm();
    form.title = "Course Feedback Form";
    form.description =
      "Help us improve! Share your feedback on your learning experience.";

    // Add demo section
    form.sections[0].title = "Section 1 of 1";
    form.sections[0].description = "Course Content";

    return form;
  };

  const [schema, setSchema] = useState<FormSchema>(
    initialSchema || createDemoForm(),
  );
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"configuration" | "layout">(
    "configuration",
  );

  const handleFieldAdd = (fieldType: FieldType) => {
    const defaultField = createDefaultField(fieldType);
    const newField = {
      ...defaultField,
      id: generateId(),
      order: schema.sections[0].fields.length,
    };

    const updatedSchema = { ...schema };
    updatedSchema.sections[0].fields.push(newField);
    updatedSchema.updatedAt = new Date();

    setSchema(updatedSchema);
    setSelectedField(newField.id);
  };

  const handleSchemaChange = (updatedSchema: FormSchema) => {
    setSchema(updatedSchema);
  };

  const handleSave = () => {
    onSave?.(schema);
  };

  const handlePublish = () => {
    onPublish?.(schema);
  };

  return (
    <div className={styles.formBuilder}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.brandSection}>
            <div className={styles.brandIcon}>
              <FileText className="w-5 h-5 text-indigo-600" />
              <span className={styles.brandText}>Form Builder</span>
            </div>
            <span className={styles.breadcrumbSeparator}>→</span>
            <span className={styles.breadcrumbText}>Create Form</span>
          </div>

          <div className={styles.actionButtons}>
            <Button
              variant="outline"
              onClick={handleSave}
              className={styles.saveButton}
            >
              <Save className="w-4 h-4 mr-2" />
              Save as draft
            </Button>
            <Button onClick={handlePublish} className={styles.publishButton}>
              <Eye className="w-4 h-4 mr-2" />
              Publish Form
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsSection}>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
        >
          <TabsList className={styles.tabsList}>
            <TabsTrigger value="configuration" className={styles.tabTrigger}>
              <Settings className="w-4 h-4" />
              Form Configuration
            </TabsTrigger>
            <TabsTrigger value="layout" className={styles.tabTrigger}>
              <Eye className="w-4 h-4" />
              Form Layout
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <Tabs value={activeTab} className={styles.tabContent}>
          <TabsContent value="configuration" className={styles.tabContent}>
            <FieldsSidebar onFieldAdd={handleFieldAdd} />
            <FormCanvas
              schema={schema}
              onSchemaChange={handleSchemaChange}
              selectedField={selectedField}
              onFieldSelect={setSelectedField}
            />
          </TabsContent>

          <TabsContent value="layout" className={styles.tabContent}>
            <div className={styles.layoutContent}>
              <div className="mb-6 text-center">
                <div className={styles.previewBadge}>
                  <Eye className="w-4 h-4" />
                  Preview Form
                </div>
              </div>
              <FormRenderer
                schema={schema}
                mode="preview"
                className={styles.previewContainer}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Actions */}
      <div className={styles.bottomActions}>
        <div className={styles.bottomContent}>
          <Button variant="ghost" className={styles.previewFormButton}>
            <Eye className="w-4 h-4 mr-2" />
            Preview Form
          </Button>

          <div className={styles.bottomActionButtons}>
            <Button variant="outline">Save as draft</Button>
            <Button className={styles.publishButton}>Publish Form</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
