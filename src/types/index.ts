export interface Screen {
  id: string;
  screenTitle: string;
  appVersion: string;
  screenType: string[];
  uiComponents: string[];
  thumbnail: string;
}

export interface Tags {
  screenType: string[];
  uiComponents: string[];
} 