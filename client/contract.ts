export type EndpointSchematicsRemove_OutputNO_CONTENT = void;

export interface Contract {
  schematics: {
    create: EndpointSchematicsCreate;
    list: EndpointSchematicsList;
    remove: EndpointSchematicsRemove;
    setCheckedMaterial: EndpointSchematicsSetCheckedMaterial;
    update: EndpointSchematicsUpdate;
  };
}
export interface EndpointSchematicsCreate {
  method: "post";
  input: {
    body?: EndpointSchematicsCreate_InputBody;
  };
  output: {
    CREATED: EndpointSchematicsCreate_OutputCREATED;
  };
  media: {file: {optional: false}};
}
export interface EndpointSchematicsCreate_InputBody {
  name: string;
  rotation: number;
}
export interface EndpointSchematicsCreate_OutputCREATED {
  id: string;
  name: string;
  format: string;
  file: string;
  preview: string;
  rotation: number;
  preview_width: number;
  preview_height: number;
  size_x: number;
  size_y: number;
  size_z: number;
  block_count: number;
  material_types: number;
  checked_materials:
    | (string | number | boolean | null)
    | {
        [k: string]: unknown;
      }
    | unknown[];
  file_size: number;
  created: string;
}
export interface EndpointSchematicsList {
  method: "get";
  input: {
    query?: EndpointSchematicsList_InputQuery;
  };
  output: {
    OK: EndpointSchematicsList_OutputOK;
  };
  media: null;
}
export interface EndpointSchematicsList_InputQuery {
  page: string;
  q?: string;
}
export interface EndpointSchematicsList_OutputOK {
  items: {
    id: string;
    name: string;
    format: string;
    file: string;
    preview: string;
    rotation: number;
    preview_width: number;
    preview_height: number;
    size_x: number;
    size_y: number;
    size_z: number;
    block_count: number;
    material_types: number;
    checked_materials:
      | (string | number | boolean | null)
      | {
          [k: string]: unknown;
        }
      | unknown[];
    file_size: number;
    created: string;
  }[];
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
}
export interface EndpointSchematicsRemove {
  method: "post";
  input: {
    query?: EndpointSchematicsRemove_InputQuery;
    body?: EndpointSchematicsRemove_InputBody;
  };
  output: {
    NO_CONTENT: EndpointSchematicsRemove_OutputNO_CONTENT;
  };
  media: null;
}
export interface EndpointSchematicsRemove_InputQuery {
  id: string;
}
export interface EndpointSchematicsRemove_InputBody {}
export interface EndpointSchematicsSetCheckedMaterial {
  method: "post";
  input: {
    query?: EndpointSchematicsSetCheckedMaterial_InputQuery;
    body?: EndpointSchematicsSetCheckedMaterial_InputBody;
  };
  output: {
    OK: EndpointSchematicsSetCheckedMaterial_OutputOK;
  };
  media: null;
}
export interface EndpointSchematicsSetCheckedMaterial_InputQuery {
  id: string;
}
export interface EndpointSchematicsSetCheckedMaterial_InputBody {
  material: string;
  checked: boolean;
}
export interface EndpointSchematicsSetCheckedMaterial_OutputOK {
  id: string;
  name: string;
  format: string;
  file: string;
  preview: string;
  rotation: number;
  preview_width: number;
  preview_height: number;
  size_x: number;
  size_y: number;
  size_z: number;
  block_count: number;
  material_types: number;
  checked_materials:
    | (string | number | boolean | null)
    | {
        [k: string]: unknown;
      }
    | unknown[];
  file_size: number;
  created: string;
}
export interface EndpointSchematicsUpdate {
  method: "post";
  input: {
    query?: EndpointSchematicsUpdate_InputQuery;
    body?: EndpointSchematicsUpdate_InputBody;
  };
  output: {
    OK: EndpointSchematicsUpdate_OutputOK;
  };
  media: null;
}
export interface EndpointSchematicsUpdate_InputQuery {
  id: string;
}
export interface EndpointSchematicsUpdate_InputBody {
  name: string;
  rotation: number;
}
export interface EndpointSchematicsUpdate_OutputOK {
  id: string;
  name: string;
  format: string;
  file: string;
  preview: string;
  rotation: number;
  preview_width: number;
  preview_height: number;
  size_x: number;
  size_y: number;
  size_z: number;
  block_count: number;
  material_types: number;
  checked_materials:
    | (string | number | boolean | null)
    | {
        [k: string]: unknown;
      }
    | unknown[];
  file_size: number;
  created: string;
}
