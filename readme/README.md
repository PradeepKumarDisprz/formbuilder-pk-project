# 🏗️ Dynamic Form Builder

## 📋 Project Overview

This is a **comprehensive, enterprise-grade form builder application** built with React, TypeScript, and modern web technologies. The project enables users to create dynamic forms through an intuitive drag-and-drop interface and supports both static and **completely dynamic field configuration systems**.

### 🎯 Key Features

- **Drag-and-Drop Form Builder**: Visual form creation with real-time preview
- **Dynamic Field Configuration**: Add/remove field types without code changes via JSON blob
- **Custom Component Integration**: Use your existing components with automatic prop mapping
- **Dual Architecture**: Static (code-based) and Dynamic (configuration-based) field systems
- **Advanced Validation**: Field-level and form-level validation with custom rules
- **Responsive Design**: Multiple layout modes (single-column, sidebar) based on form structure
- **File Upload**: 2MB limit with download/delete functionality
- **Section Management**: Collapsible sections with progress tracking
- **Auto-scroll**: Smooth scrolling during drag operations
- **TypeScript**: Full type safety throughout the application

### 🚀 How It Was Generated

This project was built iteratively through multiple enhancement phases:

1. **Phase 1**: Basic form builder with static field types
2. **Phase 2**: Enhanced UI with exact design matching
3. **Phase 3**: Advanced drag-and-drop with auto-scroll
4. **Phase 4**: Dynamic configuration system for zero-code field management
5. **Phase 5**: Custom component integration with prop mapping

## 🗂️ Project Structure

```
├── client/
│   ├── components/
│   │   ├── form-builder/           # Core form builder components
│   │   │   ├── FormBuilder.tsx     # Main form builder container
│   │   │   ├── FormCanvas.tsx      # Form editing canvas with drag-drop
│   │   │   ├── FieldsSidebar.tsx   # Static fields sidebar
│   │   │   ├── FieldEditor.tsx     # Individual field editing component
│   │   │   ├── FormRenderer.tsx    # Static form renderer
│   │   │   ├── DynamicFormRenderer.tsx    # Dynamic form renderer
│   │   │   ├── DynamicFieldsSidebar.tsx   # Dynamic fields sidebar
│   │   │   └── *.module.scss       # Component-specific styles
│   │   └── ui/                     # Reusable UI components
│   │       ├── button.tsx          # Reusable button component
│   │       ├── input.tsx           # Reusable input component
│   │       ├── textarea.tsx        # Reusable textarea component
│   │       ├── select.tsx          # Reusable select component
│   │       ├── calendar.tsx        # Calendar/date picker component
│   │       ├── dialog.tsx          # Modal dialog component
│   │       ├── collapsible.tsx     # Collapsible container component
│   │       ├── tabs.tsx            # Tabs navigation component
│   │       └── toast.tsx           # Toast notification component
│   ├── hooks/
│   │   └── useDragAndDrop.ts       # Reusable drag-and-drop hook
│   ├── lib/
│   │   ├── form-schema.ts          # Form schema definitions and utilities
│   │   ├── form-validation.ts      # Form validation system
│   │   ├── field-registry.ts       # Static field type registry
│   │   ├── config-service.ts       # Dynamic configuration service
│   │   ├── component-registry.ts   # Dynamic component registry
│   │   ├── field-extensions.ts     # Field extension system
│   │   ├── validation-service.ts   # Enhanced validation service
│   │   └── utils.ts                # General utility functions
│   ├── pages/
│   │   ├── FormBuilder.tsx         # Form builder page
│   │   ├── FormPreview.tsx         # Form preview page
│   │   └── Index.tsx               # Homepage
│   └── docs/
│       ├── ARCHITECTURE.md         # Architecture documentation
│       ├── DYNAMIC_SETUP.md        # Dynamic system setup guide
│       └── example-config.json     # Example configuration JSON
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
├── tailwind.config.js              # Tailwind CSS configuration
├── vite.config.ts                  # Vite build configuration
└── README.md                       # This documentation file
```

## 📁 File-by-File Explanation

### Core Form Builder Components

#### `client/components/form-builder/FormBuilder.tsx`

**Purpose**: Main container component that orchestrates the entire form builder interface.

**Code Structure**:

```typescript
// State management for form schema and UI state
const [schema, setSchema] = useState<FormSchema>(createDefaultForm());
const [selectedField, setSelectedField] = useState<string | null>(null);
const [activeTab, setActiveTab] = useState<"configuration" | "preview">("configuration");

// Main render with three tabs: Configuration, Preview, Response
return (
  <div className="flex flex-col h-screen bg-gray-50">
    <Header /> {/* Save/Preview buttons */}
    <Tabs>
      <TabsContent value="configuration">
        <div className="flex flex-1">
          <FieldsSidebar onFieldAdd={handleFieldAdd} />
          <FormCanvas
            schema={schema}
            onSchemaChange={setSchema}
            selectedField={selectedField}
            onFieldSelect={setSelectedField}
          />
        </div>
      </TabsContent>
      <TabsContent value="preview">
        <FormRenderer schema={schema} mode="preview" />
      </TabsContent>
    </Tabs>
  </div>
);
```

**Why It's Necessary**: Without this component, there would be no central coordination between the sidebar, canvas, and preview modes. Removing it would break the entire form builder interface.

**Dependencies**: Uses `FormCanvas`, `FieldsSidebar`, `FormRenderer`, and UI components.

#### `client/components/form-builder/FormCanvas.tsx`

**Purpose**: The main editing area where users drag fields and arrange form structure.

**Code Structure**:

```typescript
// Drag-and-drop functionality
const { onDragOver, onDrop, onDragEnter, onDragLeave, dropTarget } =
  useDragAndDrop({
    onDrop: (item, result) => {
      if (item.type === "field-type") {
        handleAddField(item.data.fieldType, result.targetId, result.position);
      }
      // Handle field reordering and section management
    },
    acceptTypes: ["field-type", "field-reorder", "section-reorder"],
  });

// Auto-scroll during drag operations
useEffect(() => {
  const handleGlobalDragOver = (e: DragEvent) => {
    // Smooth scrolling logic using requestAnimationFrame
  };
  document.addEventListener("dragover", handleGlobalDragOver);
}, []);

// Form header editing
const handleHeaderUpdate = (field: "title" | "description", value: string) => {
  const updatedSchema = { ...schema, [field]: value };
  onSchemaChange(updatedSchema);
};

// Section management
const handleAddSection = () => {
  const newSection = createDefaultSection();
  onSchemaChange({ ...schema, items: [...schema.items, newSection] });
};
```

**Why It's Necessary**: This is the core editing interface. Without it, users couldn't create or modify forms. It handles all drag-drop operations, field positioning, and section management.

**Dependencies**: Uses `useDragAndDrop` hook, `FieldEditor` component, and various UI components for modals and inputs.

#### `client/components/form-builder/FieldEditor.tsx`

**Purpose**: Renders individual fields in the canvas with editing controls (edit, delete, clone, drag).

**Code Structure**:

```typescript
interface FieldEditorProps {
  field: FormField;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<FormField>) => void;
  onDelete: () => void;
  onClone: () => void;
}

// Inline editing state
const [isEditing, setIsEditing] = useState(false);
const [editingProperty, setEditingProperty] = useState<"label" | "description" | null>(null);

// Property editing handlers
const handlePropertyUpdate = (property: string, value: any) => {
  onUpdate({ [property]: value });
};

// Render field preview with controls
return (
  <div className={cn("group border rounded-lg p-4", isSelected && "ring-2 ring-blue-500")}>
    <div className="flex items-center justify-between">
      <FieldPreview field={field} />
      <div className="opacity-0 group-hover:opacity-100 flex gap-2">
        <Button onClick={onClone}>Clone</Button>
        <Button onClick={onDelete}>Delete</Button>
        <DragHandle />
      </div>
    </div>
    {isSelected && <FieldPropertiesPanel />}
  </div>
);
```

**Why It's Necessary**: Provides the interface for editing individual field properties. Without it, users couldn't customize field labels, descriptions, or required status.

#### `client/components/form-builder/FieldsSidebar.tsx`

**Purpose**: Left sidebar containing draggable field types organized by category.

**Code Structure**:

```typescript
// Field organization
const inputFields = Object.entries(FIELD_TYPES)
  .filter(([_, field]) => field.category === "input")
  .map(([type, field]) => ({ type: type as FieldType, ...field }));

const udfFields = Object.entries(FIELD_TYPES)
  .filter(([_, field]) => field.category === "udf");

// Search functionality
const [searchQuery, setSearchQuery] = useState("");
const filteredFields = inputFields.filter(field =>
  field.label.toLowerCase().includes(searchQuery.toLowerCase())
);

// Drag initiation
const handleFieldDragStart = (e: React.DragEvent, fieldType: FieldType) => {
  const dragItem = createDragItem(fieldType, "field-type", { fieldType });
  onDragStart(e, dragItem);
};

// Render field items
const renderFieldItem = (fieldType: FieldType, config: FieldConfig) => (
  <div
    draggable
    onDragStart={(e) => handleFieldDragStart(e, fieldType)}
    onClick={() => onFieldAdd(fieldType)}
  >
    <Icon>{config.icon}</Icon>
    <Label>{config.label}</Label>
  </div>
);
```

**Why It's Necessary**: Provides the source of fields for drag-and-drop. Without it, users couldn't add new fields to their forms.

#### `client/components/form-builder/FormRenderer.tsx`

**Purpose**: Renders forms for preview and response collection with exact UI matching.

**Code Structure**:

```typescript
// Form state management
const [formValues, setFormValues] = useState<Record<string, any>>(values);
const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

// Dynamic layout selection based on sections
const sectionsWithFields = schema.items.filter(item =>
  isFormSection(item) && item.fields.length > 0
);
const hasAnySections = sectionsWithFields.length > 0;

// Layout 1: No sections - Clean single column
if (!hasAnySections) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-6">
        <FormHeader />
        <FormFields />
        <ActionButtons />
      </div>
    </div>
  );
}

// Layout 2: With sections - Sidebar layout
return (
  <div className="flex h-screen bg-gray-50">
    <SidebarNavigation />
    <MainContent>
      <FormHeader />
      <SectionsList />
      <ActionButtons />
    </MainContent>
  </div>
);

// Field rendering with validation
const renderField = (field: FormField, questionNumber: number) => {
  switch (field.type) {
    case "short-text":
      return <Input value={value} onChange={onChange} />;
    case "file-upload":
      return <FileUploadComponent />;
    // ... other field types
  }
};
```

**Why It's Necessary**: Provides the actual form experience for end users. Without it, created forms couldn't be used for data collection.

### Dynamic System Components

#### `client/components/form-builder/DynamicFormRenderer.tsx`

**Purpose**: Dynamic version of FormRenderer that loads field definitions from configuration.

**Code Structure**:

```typescript
// Configuration loading
useEffect(() => {
  const initializeConfig = async () => {
    await loadFormConfig();
    setConfigLoaded(true);
  };
  initializeConfig();
}, []);

// Dynamic field rendering
const renderField = (field: FormField, questionNumber: number) => {
  const fieldDef = getFieldDefinition(field.type);
  if (!fieldDef) {
    return <ErrorMessage>Field type not found</ErrorMessage>;
  }

  // Use dynamic component rendering
  const fieldComponent = renderDynamicField(fieldDef, {
    field: fieldDef,
    value: fieldValue,
    onChange: (value) => updateValue(field.id, value),
    disabled,
    ...field.properties,
  });

  return fieldWrapper(fieldComponent);
};
```

**Why It's Necessary**: Enables the zero-code-change field management system. Without it, all field types would need to be hardcoded.

#### `client/components/form-builder/DynamicFieldsSidebar.tsx`

**Purpose**: Dynamic version of FieldsSidebar that loads field types from configuration.

**Code Structure**:

```typescript
// Dynamic field loading
useEffect(() => {
  const initializeFields = async () => {
    await loadFormConfig();
    const inputFieldDefs = getFieldsByCategory("input");
    const udfFieldDefs = getFieldsByCategory("udf");
    setInputFields(inputFieldDefs);
    setUdfFields(udfFieldDefs);
  };
  initializeFields();
}, []);

// Configuration status display
{configService.isLoadedFromBlob() && (
  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
    Dynamic
  </span>
)}
```

**Why It's Necessary**: Provides the dynamic field palette that updates based on configuration changes.

### Core Library Files

#### `client/lib/form-schema.ts`

**Purpose**: Defines TypeScript interfaces and utilities for form structure.

**Code Structure**:

```typescript
// Core interfaces
export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  description?: string;
  required: boolean;
  showDescription: boolean;
  order: number;
  properties?: BaseFieldProperties;
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
  items: FormItem[]; // Can be FormField or FormSection
  createdAt: Date;
  updatedAt: Date;
}

// Utility functions
export const isFormField = (item: FormItem): item is FormField => {
  return "type" in item;
};

export const isFormSection = (item: FormItem): item is FormSection => {
  return "fields" in item;
};

export const getAllFields = (items: FormItem[]): FormField[] => {
  const fields: FormField[] = [];
  items.forEach((item) => {
    if (isFormField(item)) {
      fields.push(item);
    } else if (isFormSection(item)) {
      fields.push(...item.fields);
    }
  });
  return fields;
};
```

**Why It's Necessary**: Provides type safety and structure validation. Without it, the entire application would lose type safety and data integrity.

#### `client/lib/config-service.ts`

**Purpose**: Manages dynamic configuration loading from blob storage with fallback.

**Code Structure**:

```typescript
class ConfigService {
  private config: FormConfig | null = null;

  // Load from blob with fallback
  async loadFromBlob(blobUrl: string): Promise<FormConfig> {
    try {
      const response = await fetch(blobUrl);
      const configData = await response.json();

      if (!this.validateConfig(configData)) {
        throw new Error("Invalid configuration");
      }

      this.config = configData;
      return this.config;
    } catch (error) {
      console.warn("Failed to load from blob, using fallback");
      return this.getFallbackConfig();
    }
  }

  // Fallback configuration
  private getDefaultConfig(): FormConfig {
    return {
      version: "1.0.0",
      fields: [
        {
          type: "short-text",
          label: "Short Text",
          component: {
            component: "Input",
            propMapping: {
              value: "value",
              onChange: "onChange",
            },
          },
        },
        // ... more field definitions
      ],
    };
  }
}
```

**Why It's Necessary**: Enables the dynamic field system. Without it, all field types would be hardcoded and unchangeable.

#### `client/lib/component-registry.ts`

**Purpose**: Maps field types to custom components with automatic prop mapping.

**Code Structure**:

```typescript
class ComponentRegistry {
  private components: Map<string, React.ComponentType<any>> = new Map();

  // Register custom components
  registerComponent(name: string, component: React.ComponentType<any>) {
    this.components.set(name, component);
  }

  // Render with prop mapping
  renderField(fieldDef: FieldDefinition, props: ComponentProps) {
    const Component = this.getComponent(fieldDef.component.component);
    const mappedProps = this.mapProps(fieldDef.component, props);
    return React.createElement(Component, mappedProps);
  }

  // Map standard props to component-specific props
  private mapProps(
    componentMapping: ComponentMapping,
    standardProps: ComponentProps,
  ) {
    const mapped: Record<string, any> = {};

    // Apply default props
    Object.assign(mapped, componentMapping.defaultProps);

    // Map specific props
    Object.entries(componentMapping.propMapping).forEach(
      ([standardProp, componentProp]) => {
        if (standardProps[standardProp] !== undefined) {
          mapped[componentProp] = standardProps[standardProp];
        }
      },
    );

    return mapped;
  }
}
```

**Why It's Necessary**: Allows integration with existing custom components without modifying their prop interfaces.

#### `client/hooks/useDragAndDrop.ts`

**Purpose**: Reusable hook for drag-and-drop functionality with auto-scroll.

**Code Structure**:

```typescript
export const useDragAndDrop = (options: UseDragDropOptions) => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  // Auto-scroll during drag
  const handleAutoScroll = useCallback((clientY: number) => {
    const container = getScrollContainer();
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const threshold = 50;

    if (clientY < containerRect.top + threshold) {
      container.scrollTop -= 5; // Scroll up
    } else if (clientY > containerRect.bottom - threshold) {
      container.scrollTop += 5; // Scroll down
    }
  }, []);

  const onDragStart = (e: React.DragEvent, item: DragItem) => {
    setIsDragging(true);
    setDraggedItem(item);
    e.dataTransfer.setData("application/json", JSON.stringify(item));
  };

  const onDrop = (e: React.DragEvent, targetId?: string, position?: number) => {
    const data = e.dataTransfer.getData("application/json");
    const item = JSON.parse(data) as DragItem;

    options.onDrop?.(item, { targetId, position, action: "move" });
    setIsDragging(false);
    setDraggedItem(null);
  };

  return { onDragStart, onDragEnd, onDragOver, onDrop, isDragging, dropTarget };
};
```

**Why It's Necessary**: Provides consistent drag-and-drop behavior across all components. Without it, each component would need to implement its own drag-drop logic.

### UI Components

#### `client/components/ui/button.tsx`

**Purpose**: Reusable button component with variant styling.

**Reused In**: FormBuilder header, FieldEditor controls, FormRenderer actions, dialogs
**Props**: `variant`, `size`, `disabled`, `onClick`, `children`

#### `client/components/ui/input.tsx`

**Purpose**: Reusable input component with consistent styling.

**Reused In**: FormRenderer field rendering, FieldEditor property editing, search inputs
**Props**: `value`, `onChange`, `placeholder`, `disabled`, `type`

#### `client/components/ui/dialog.tsx`

**Purpose**: Modal dialog component for confirmations and forms.

**Reused In**: Section rearrange dialog, field property editing, confirmations
**Props**: `open`, `onOpenChange`, `children`

## 🔄 Code Flow and Data Movement

### 1. Application Initialization

```
App.tsx
  ├── Load configuration (if dynamic mode)
  ├── Register custom components
  ├── Initialize routing
  └── Render main layout

FormBuilder.tsx (Main Page)
  ├── Initialize schema state: useState<FormSchema>()
  ├── Initialize UI state: selectedField, activeTab
  └── Render three-tab interface
```

### 2. Form Building Flow

```
User drags field from sidebar
  ↓
FieldsSidebar.onDragStart()
  ↓ (creates DragItem)
FormCanvas.onDrop()
  ↓ (calculates position)
FormCanvas.handleAddField()
  ↓ (updates schema)
FormBuilder.setSchema()
  ↓ (triggers re-render)
FormCanvas re-renders with new field
  ↓
FieldEditor renders field preview
```

### 3. Field Editing Flow

```
User clicks field in canvas
  ↓
FieldEditor.onSelect()
  ↓
FormBuilder.setSelectedField()
  ↓ (triggers re-render)
FieldEditor shows as selected
  ↓
User edits properties
  ↓
FieldEditor.onUpdate()
  ↓
FormCanvas.handleUpdateField()
  ↓
FormBuilder.setSchema()
  ↓ (updates schema)
Field preview updates
```

### 4. Form Rendering Flow

```
User clicks Preview tab
  ↓
FormBuilder sets activeTab="preview"
  ↓
FormRenderer receives schema prop
  ↓
FormRenderer.renderField() for each field
  ↓
Field components render with current values
  ↓
User interacts with form
  ↓
FormRenderer.updateValue()
  ↓
FormRenderer.setFormValues()
  ↓
Form updates with validation
```

### 5. Dynamic Configuration Flow

```
App initialization
  ↓
configService.loadConfig()
  ↓
Try fetch(blobUrl) ──────── (success) ─────→ Parse and validate JSON
  │                                          ↓
  │                                      Store configuration
  │                                          ↓
  └── (failure) ──→ Use fallback config ─────┘
                                             ↓
DynamicFieldsSidebar loads fields from config
  ↓
DynamicFormRenderer uses dynamic field rendering
  ↓
componentRegistry.renderField() maps props
  ↓
Custom components render with mapped props
```

## 🎨 Design Patterns and Architecture

### 1. **Compound Component Pattern**

Used in `FormBuilder` to compose complex interfaces:

```typescript
<FormBuilder>
  <FormBuilder.Header />
  <FormBuilder.Tabs>
    <FormBuilder.Tab value="configuration">
      <FormBuilder.Sidebar />
      <FormBuilder.Canvas />
    </FormBuilder.Tab>
  </FormBuilder.Tabs>
</FormBuilder>
```

### 2. **Registry Pattern**

Used in `component-registry.ts` and `field-registry.ts`:

```typescript
// Register components/field types in a central registry
const registry = new Map<string, ComponentType>();
registry.set("Input", MyInputComponent);

// Retrieve and use dynamically
const Component = registry.get("Input");
```

### 3. **Strategy Pattern**

Used for field rendering based on type:

```typescript
const renderField = (field: FormField) => {
  switch (field.type) {
    case "short-text": return <InputStrategy />;
    case "file-upload": return <FileUploadStrategy />;
    default: return <DefaultStrategy />;
  }
};
```

### 4. **Observer Pattern**

Used for schema changes and drag-drop events:

```typescript
// Components subscribe to schema changes
const [schema, setSchema] = useState();
// When schema changes, all subscribers re-render automatically
```

### 5. **Factory Pattern**

Used in field creation:

```typescript
const createDefaultField = (type: FieldType) => {
  return FieldFactory.create(type);
};
```

### 6. **Adapter Pattern**

Used in component registry for prop mapping:

```typescript
const mapProps = (standardProps, componentMapping) => {
  // Adapt standard props to component-specific props
  return adaptedProps;
};
```

## 🧩 Reusable Components

### Core Reusable Components

1. **Button** (`components/ui/button.tsx`)

   - **Props**: `variant`, `size`, `disabled`, `onClick`, `children`
   - **Reused in**: FormBuilder header, FieldEditor, FormRenderer, dialogs
   - **Purpose**: Consistent button styling across the app

2. **Input** (`components/ui/input.tsx`)

   - **Props**: `value`, `onChange`, `placeholder`, `disabled`, `type`
   - **Reused in**: Form fields, property editing, search inputs
   - **Purpose**: Standardized text input with validation styling

3. **Textarea** (`components/ui/textarea.tsx`)

   - **Props**: `value`, `onChange`, `placeholder`, `rows`, `disabled`
   - **Reused in**: Long text fields, descriptions, property editing
   - **Purpose**: Multi-line text input with consistent styling

4. **Dialog** (`components/ui/dialog.tsx`)

   - **Props**: `open`, `onOpenChange`, `children`
   - **Reused in**: Section rearrange, confirmations, property panels
   - **Purpose**: Modal dialogs with backdrop and animations

5. **Tabs** (`components/ui/tabs.tsx`)

   - **Props**: `value`, `onValueChange`, `children`
   - **Reused in**: FormBuilder main navigation, FieldsSidebar categories
   - **Purpose**: Tabbed navigation interface

6. **Collapsible** (`components/ui/collapsible.tsx`)
   - **Props**: `open`, `onOpenChange`, `children`
   - **Reused in**: Form sections, property panels
   - **Purpose**: Expandable/collapsible content sections

### Custom Reusable Components

1. **FieldEditor** (`components/form-builder/FieldEditor.tsx`)

   - **Props**: `field`, `isSelected`, `onSelect`, `onUpdate`, `onDelete`, `onClone`
   - **Reused in**: FormCanvas for each field
   - **Purpose**: Consistent field editing interface

2. **useDragAndDrop** (`hooks/useDragAndDrop.ts`)
   - **Props**: `onDrop`, `acceptTypes`, `autoScroll`
   - **Reused in**: FormCanvas, FieldsSidebar, section reordering
   - **Purpose**: Drag-and-drop functionality with auto-scroll

### Why These Components Are Reusable

1. **Consistent API**: All components follow the same prop patterns
2. **Single Responsibility**: Each component has one clear purpose
3. **Composition**: Components can be composed together easily
4. **Styling**: Consistent design system through shared styles
5. **Type Safety**: Full TypeScript support with proper interfaces

### Code Reuse Analysis

**High Reuse Components** (used 5+ times):

- `Button`: Used in header, fields, forms, dialogs
- `Input`: Used for all text inputs across the app
- `Dialog`: Used for all modal interactions

**Medium Reuse Components** (used 2-4 times):

- `Tabs`: Main navigation and sidebar categories
- `Collapsible`: Sections and property panels
- `FieldEditor`: One per field in canvas

**Single Use Components**:

- `FormBuilder`: Main container (intentionally single-use)
- `FormCanvas`: Main editing area (intentionally single-use)
- `FormRenderer`: Form display (intentionally single-use)

**Why Some Components Aren't Reused**:

1. **Specific Purpose**: FormBuilder, FormCanvas are main containers with specific responsibilities
2. **Complex State**: These components manage complex application state
3. **Integration Points**: They serve as integration points for multiple smaller components

## 🏗️ Overall Architecture

### Application Loading Sequence

1. **Initial Load**

   ```
   index.html loads
   ↓
   main.tsx initializes React
   ↓
   App.tsx sets up routing and global providers
   ↓
   FormBuilder.tsx loads as main page
   ↓
   Initialize form schema and UI state
   ↓
   Render three-tab interface
   ```

2. **Dynamic Configuration Loading** (if enabled)
   ```
   App initialization
   ↓
   Check for REACT_APP_FORM_CONFIG_URL
   ↓
   configService.loadConfig()
   ↓
   Fetch JSON from blob storage
   ↓
   Parse and validate configuration
   ↓
   Register dynamic field types
   ↓
   Components use dynamic rendering
   ```

### User Interaction Flow

1. **Form Building**

   ```
   User opens form builder
   ↓
   See empty canvas with field sidebar
   ↓
   Drag field from sidebar to canvas
   ↓
   Field appears in canvas with default properties
   ↓
   Click field to select and edit properties
   ↓
   Add more fields and sections as needed
   ↓
   Click Preview to see form in action
   ```

2. **Form Response**
   ```
   User opens form in response mode
   ↓
   See form with input fields
   ↓
   Fill out form fields
   ↓
   Validation occurs in real-time
   ↓
   Click Submit when all required fields filled
   ↓
   See success message with submitted data
   ```

### State Management

**Global State** (in FormBuilder):

- `schema`: Complete form structure
- `selectedField`: Currently selected field ID
- `activeTab`: Current tab (configuration/preview/response)

**Local State** (in components):

- `formValues`: User input values (FormRenderer)
- `validationErrors`: Field validation errors (FormRenderer)
- `isDragging`: Drag operation state (useDragAndDrop)
- `openSections`: Section collapse state (FormRenderer)

**Configuration State** (in services):

- `config`: Loaded field configuration (configService)
- `components`: Registered components (componentRegistry)

### Data Flow Patterns

1. **Top-Down**: Schema flows from FormBuilder → FormCanvas → FieldEditor
2. **Bottom-Up**: User actions flow FieldEditor → FormCanvas → FormBuilder
3. **Sideways**: Drag operations flow FieldsSidebar → FormCanvas
4. **Service-Based**: Configuration flows configService → Dynamic components

## 🚀 Project Setup

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Modern browser with ES6+ support

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd form-builder

# Install dependencies
npm install
# or
yarn install
# or
pnpm install
```

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Optional: Dynamic configuration blob URL
REACT_APP_FORM_CONFIG_URL=https://your-blob-storage.com/form-config.json

# For Vite projects, use:
VITE_FORM_CONFIG_URL=https://your-blob-storage.com/form-config.json
```

### Development

```bash
# Start development server
npm run dev
# or
yarn dev
# or
pnpm dev

# The app will be available at http://localhost:5173
```

### Building for Production

```bash
# Build for production
npm run build
# or
yarn build
# or
pnpm build

# Preview production build
npm run preview
# or
yarn preview
# or
pnpm preview
```

### Custom Component Integration

To use your own components with the dynamic system:

```typescript
// In your App.tsx or main.tsx
import { registerCustomComponents } from "@/lib/component-registry";

// Import your custom components
import { MyInput } from "@/components/MyInput";
import { MyTextarea } from "@/components/MyTextarea";
import { MyFileUpload } from "@/components/MyFileUpload";

// Register them once at app startup
registerCustomComponents({
  Input: MyInput,
  Textarea: MyTextarea,
  FileUpload: MyFileUpload,
  DatePicker: MyDatePicker,
  Select: MySelect,
  NumberInput: MyNumberInput,
});
```

### Configuration Management

1. **Static Configuration**: Edit `client/lib/config-service.ts` → `getDefaultConfig()`
2. **Dynamic Configuration**: Upload JSON to blob storage and set environment variable

Example dynamic configuration:

```json
{
  "version": "1.0.0",
  "fields": [
    {
      "type": "email",
      "label": "Email Address",
      "icon": "📧",
      "category": "input",
      "component": {
        "component": "EmailInput",
        "propMapping": {
          "value": "emailValue",
          "onChange": "onEmailChange"
        }
      }
    }
  ]
}
```

## 🔧 Key Technologies Used

- **React 18**: Core framework with hooks and context
- **TypeScript**: Type safety and developer experience
- **Tailwind CSS**: Utility-first styling system
- **Vite**: Fast build tool and development server
- **Lucide React**: Icon library for consistent iconography
- **date-fns**: Date manipulation and formatting
- **Radix UI**: Headless UI components for accessibility

## 📚 Additional Documentation

- `client/docs/ARCHITECTURE.md`: Detailed architecture documentation
- `client/docs/DYNAMIC_SETUP.md`: Dynamic system setup guide
- `client/docs/example-config.json`: Example configuration file

This form builder represents a complete, production-ready solution that can adapt to any component library or field type requirements while maintaining excellent developer experience and user interface design.
