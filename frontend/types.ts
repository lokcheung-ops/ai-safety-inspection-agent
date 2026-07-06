export interface PdfReference {
  artifact_path: string;
  page_number: number;
}

export interface Evidence {
  observation_id: string;
  report_id: string;
  page_number: number;
  section_label: string;
  item_label: string;
  inspection_date: string;
  weekday: string;
  rating: string;
  recommendation?: string;
  source_reference: {
    display_reference: string;
  };
  individual_pdf_reference: PdfReference;
  combined_pdf_reference: PdfReference;
}

export interface Finding {
  finding_id: string;
  finding_type: string;
  title: string;
  verified_evidence: Evidence[];
  interpretation: string;
  suggested_action: string;
  safety_review_status: string;
}

export interface Report {
  report_id: string;
  switcher_label: string;
  metadata: {
    week_start_date: string;
    week_end_date: string;
    number_of_workers: number;
    project: {
      project_name: string;
      construction_site_address: string;
    };
    company: {
      company_name: string;
      principal_contractor_name: string;
    };
    personnel: {
      safety_supervisor_name: string;
      safety_officer_name: string;
      proprietor_representative_name: string;
    };
  };
  artifacts: {
    individual_pdf: {
      artifact_path: string;
      page_count: number;
    };
    combined_pdf: {
      artifact_path: string;
      start_page: number;
      end_page: number;
    };
  };
}
