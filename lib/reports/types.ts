export interface ReportRequest {
  reportType: string;
  startDate: Date;
  endDate: Date;
  userId: string;
}

export interface ReportData {
  [key: string]: any;
}

export interface GeneratedReport {
  id: string;
  html: string;
  data: ReportData;
}
