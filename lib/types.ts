export type CertificateType = "PARTICIPANT" | "TOP_5";

export type ParticipantInput = {
  fullName: string;
  email: string;
  rank?: number | null;
};

export type CertificateRecord = {
  id: string;
  full_name: string;
  email: string;
  certificate_type: CertificateType;
  rank: number | null;
  pdf_url: string;
  issued_at: string;
};
