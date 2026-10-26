export type EndpointEventsAddException_OutputOK = boolean;
export type EndpointEventsCreate_InputBody = {
  title: string;
  category: string;
  reference_link: string;
  description: string;
  calendar?: string;
  location?: {
    name: string;
    formattedAddress: string;
    location: {
      latitude: number;
      longitude: number;
    };
  };
} & (
  | ({
      type: "single";
    } & {
      start: string;
      end: string;
    })
  | {
      type: "recurring";
      rrule: string;
    }
);
export type EndpointEventsGetByDateRange_OutputOK = {
  id: string;
  type: "single" | "recurring";
  start: string;
  end: string;
  rrule?: string;
  title: string;
  calendar: string;
  category: string;
  description: string;
  location: string;
  location_coords: {
    lat: number;
    lon: number;
  };
  reference_link: string;
  is_strikethrough?: boolean;
}[];
export type EndpointEventsGetToday_OutputOK = {
  id: string;
  title: string;
  category: string;
  calendar: string;
  location: string;
  location_coords: {
    lat: number;
    lon: number;
  };
  reference_link: string;
  description: string;
  type: "single" | "recurring";
  start: string;
  end: string;
}[];
export type EndpointEventsRemove_OutputNO_CONTENT = void;
export type EndpointEventsUpdate_InputBody = {
  title: string;
  category: string;
  reference_link: string;
  description: string;
  calendar?: string;
  location?: {
    name: string;
    formattedAddress: string;
    location: {
      latitude: number;
      longitude: number;
    };
  };
} & (
  | ({
      type: "single";
    } & {
      start: string;
      end: string;
    })
  | {
      type: "recurring";
      rrule: string;
    }
);
export type EndpointCalendarsList_OutputOK = {
  id: string;
  name: string;
  color: string;
  link: string;
  last_synced: string | null;
}[];
export type EndpointCalendarsRemove_OutputNO_CONTENT = void;
export type EndpointCalendarsValidateICS_OutputOK = boolean;
export type EndpointCategoriesList_OutputOK = {
  id: string;
  name: string;
  color: string;
  icon: string;
}[];
export type EndpointCategoriesRemove_OutputNO_CONTENT = void;

export interface Contract {
  events: {
    addException: EndpointEventsAddException;
    create: EndpointEventsCreate;
    getByDateRange: EndpointEventsGetByDateRange;
    getById: EndpointEventsGetById;
    getToday: EndpointEventsGetToday;
    remove: EndpointEventsRemove;
    scanImage: EndpointEventsScanImage;
    update: EndpointEventsUpdate;
  };
  calendars: {
    create: EndpointCalendarsCreate;
    getById: EndpointCalendarsGetById;
    list: EndpointCalendarsList;
    remove: EndpointCalendarsRemove;
    update: EndpointCalendarsUpdate;
    validateICS: EndpointCalendarsValidateICS;
  };
  categories: {
    create: EndpointCategoriesCreate;
    getById: EndpointCategoriesGetById;
    list: EndpointCategoriesList;
    remove: EndpointCategoriesRemove;
    update: EndpointCategoriesUpdate;
  };
}
export interface EndpointEventsAddException {
  method: "post";
  input: {
    query?: EndpointEventsAddException_InputQuery;
  };
  output: {
    OK: EndpointEventsAddException_OutputOK;
  };
  media: null;
}
export interface EndpointEventsAddException_InputQuery {
  id: string;
  date: string;
}
export interface EndpointEventsCreate {
  method: "post";
  input: {
    body?: EndpointEventsCreate_InputBody;
  };
  output: {
    CREATED: EndpointEventsCreate_OutputCREATED;
  };
  media: null;
}
export interface EndpointEventsCreate_OutputCREATED {
  id: string;
  title: string;
  category: string;
  calendar: string;
  location: string;
  location_coords: {
    lat: number;
    lon: number;
  };
  reference_link: string;
  description: string;
  type: "single" | "recurring";
  created: string;
  updated: string;
}
export interface EndpointEventsGetByDateRange {
  method: "get";
  input: {
    query?: EndpointEventsGetByDateRange_InputQuery;
  };
  output: {
    OK: EndpointEventsGetByDateRange_OutputOK;
  };
  media: null;
}
export interface EndpointEventsGetByDateRange_InputQuery {
  start: string;
  end: string;
}
export interface EndpointEventsGetById {
  method: "get";
  input: {
    query?: EndpointEventsGetById_InputQuery;
  };
  output: {
    OK: EndpointEventsGetById_OutputOK;
  };
  media: null;
}
export interface EndpointEventsGetById_InputQuery {
  id: string;
}
export interface EndpointEventsGetById_OutputOK {
  id: string;
  title: string;
  category: string;
  calendar: string;
  location: string;
  location_coords: {
    lat: number;
    lon: number;
  };
  reference_link: string;
  description: string;
  type: "single" | "recurring";
  created: string;
  updated: string;
}
export interface EndpointEventsGetToday {
  method: "get";
  input: {};
  output: {
    OK: EndpointEventsGetToday_OutputOK;
  };
  media: null;
}
export interface EndpointEventsRemove {
  method: "post";
  input: {
    query?: EndpointEventsRemove_InputQuery;
  };
  output: {
    NO_CONTENT: EndpointEventsRemove_OutputNO_CONTENT;
  };
  media: null;
}
export interface EndpointEventsRemove_InputQuery {
  id: string;
}
export interface EndpointEventsScanImage {
  method: "post";
  input: {};
  output: {
    OK: EndpointEventsScanImage_OutputOK;
  };
  media: {file: {optional: false; multiple: false}};
}
export interface EndpointEventsScanImage_OutputOK {
  title: string;
  start: string;
  end: string;
  location: string;
  location_coords: {
    lat: number;
    lon: number;
  };
  description: string;
  category: string;
}
export interface EndpointEventsUpdate {
  method: "post";
  input: {
    query?: EndpointEventsUpdate_InputQuery;
    body?: EndpointEventsUpdate_InputBody;
  };
  output: {
    OK: EndpointEventsUpdate_OutputOK;
  };
  media: null;
}
export interface EndpointEventsUpdate_InputQuery {
  id: string;
}
export interface EndpointEventsUpdate_OutputOK {
  id: string;
  title: string;
  category: string;
  calendar: string;
  location: string;
  location_coords: {
    lat: number;
    lon: number;
  };
  reference_link: string;
  description: string;
  type: "single" | "recurring";
  created: string;
  updated: string;
}
export interface EndpointCalendarsCreate {
  method: "post";
  input: {
    body?: EndpointCalendarsCreate_InputBody;
  };
  output: {
    CREATED: EndpointCalendarsCreate_OutputCREATED;
  };
  media: null;
}
export interface EndpointCalendarsCreate_InputBody {
  name: string;
  color: string;
  icsUrl?: string;
}
export interface EndpointCalendarsCreate_OutputCREATED {
  id: string;
  name: string;
  color: string;
  link: string;
  last_synced: string | null;
}
export interface EndpointCalendarsGetById {
  method: "get";
  input: {
    query?: EndpointCalendarsGetById_InputQuery;
  };
  output: {
    OK: EndpointCalendarsGetById_OutputOK;
  };
  media: null;
}
export interface EndpointCalendarsGetById_InputQuery {
  id: string;
}
export interface EndpointCalendarsGetById_OutputOK {
  id: string;
  name: string;
  color: string;
  link: string;
  last_synced: string | null;
}
export interface EndpointCalendarsList {
  method: "get";
  input: {};
  output: {
    OK: EndpointCalendarsList_OutputOK;
  };
  media: null;
}
export interface EndpointCalendarsRemove {
  method: "post";
  input: {
    query?: EndpointCalendarsRemove_InputQuery;
  };
  output: {
    NO_CONTENT: EndpointCalendarsRemove_OutputNO_CONTENT;
  };
  media: null;
}
export interface EndpointCalendarsRemove_InputQuery {
  id: string;
}
export interface EndpointCalendarsUpdate {
  method: "post";
  input: {
    query?: EndpointCalendarsUpdate_InputQuery;
    body?: EndpointCalendarsUpdate_InputBody;
  };
  output: {
    OK: EndpointCalendarsUpdate_OutputOK;
  };
  media: null;
}
export interface EndpointCalendarsUpdate_InputQuery {
  id: string;
}
export interface EndpointCalendarsUpdate_InputBody {
  name: string;
  color: string;
}
export interface EndpointCalendarsUpdate_OutputOK {
  id: string;
  name: string;
  color: string;
  link: string;
  last_synced: string | null;
}
export interface EndpointCalendarsValidateICS {
  method: "post";
  input: {
    body?: EndpointCalendarsValidateICS_InputBody;
  };
  output: {
    OK: EndpointCalendarsValidateICS_OutputOK;
  };
  media: null;
}
export interface EndpointCalendarsValidateICS_InputBody {
  icsUrl: string;
}
export interface EndpointCategoriesCreate {
  method: "post";
  input: {
    body?: EndpointCategoriesCreate_InputBody;
  };
  output: {
    CREATED: EndpointCategoriesCreate_OutputCREATED;
  };
  media: null;
}
export interface EndpointCategoriesCreate_InputBody {
  name: string;
  color: string;
  icon: string;
}
export interface EndpointCategoriesCreate_OutputCREATED {
  id: string;
  name: string;
  color: string;
  icon: string;
}
export interface EndpointCategoriesGetById {
  method: "get";
  input: {
    query?: EndpointCategoriesGetById_InputQuery;
  };
  output: {
    OK: EndpointCategoriesGetById_OutputOK;
  };
  media: null;
}
export interface EndpointCategoriesGetById_InputQuery {
  id: string;
}
export interface EndpointCategoriesGetById_OutputOK {
  id: string;
  name: string;
  color: string;
  icon: string;
}
export interface EndpointCategoriesList {
  method: "get";
  input: {};
  output: {
    OK: EndpointCategoriesList_OutputOK;
  };
  media: null;
}
export interface EndpointCategoriesRemove {
  method: "post";
  input: {
    query?: EndpointCategoriesRemove_InputQuery;
  };
  output: {
    NO_CONTENT: EndpointCategoriesRemove_OutputNO_CONTENT;
  };
  media: null;
}
export interface EndpointCategoriesRemove_InputQuery {
  id: string;
}
export interface EndpointCategoriesUpdate {
  method: "post";
  input: {
    query?: EndpointCategoriesUpdate_InputQuery;
    body?: EndpointCategoriesUpdate_InputBody;
  };
  output: {
    OK: EndpointCategoriesUpdate_OutputOK;
  };
  media: null;
}
export interface EndpointCategoriesUpdate_InputQuery {
  id: string;
}
export interface EndpointCategoriesUpdate_InputBody {
  name: string;
  color: string;
  icon: string;
}
export interface EndpointCategoriesUpdate_OutputOK {
  id: string;
  name: string;
  color: string;
  icon: string;
}
