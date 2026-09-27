export type CertificateType = "PARTICIPANT" | "TOP_5";

export type ParticipantInput = {
  fullName: string;
  /** Retained for legacy DOCX helper compatibility; public JPG issuance does not collect it. */
  email?: string;
  rank?: number | null;
};

export type CertificateRecord = {
  id: string;
  full_name: string;
  certificate_type: CertificateType;
  rank: number | null;
  image_url: string;
  file_name: string;
  issued_at: string;
};
