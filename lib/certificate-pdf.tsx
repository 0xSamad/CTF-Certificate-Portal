import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import type { CertificateType, ParticipantInput } from "./types";
import { eventName } from "./utils";

const styles = StyleSheet.create({
  page: { backgroundColor: "#f8f4e9", padding: 42, fontFamily: "Helvetica", color: "#10233f" },
  border: { height: "100%", border: "5px solid #0f7c8e", padding: 32, justifyContent: "center", alignItems: "center" },
  eyebrow: { color: "#0f7c8e", letterSpacing: 3, fontSize: 12, marginBottom: 22 },
  title: { fontSize: 35, fontFamily: "Helvetica-Bold", marginBottom: 24 },
  body: { fontSize: 15, textAlign: "center", lineHeight: 1.55, maxWidth: 430 },
  name: { fontSize: 29, fontFamily: "Helvetica-Bold", color: "#b15b22", marginVertical: 18, textAlign: "center" },
  tier: { marginTop: 26, fontSize: 16, fontFamily: "Helvetica-Bold" },
  date: { marginTop: 34, fontSize: 11, color: "#52657c" },
});

function CertificateDocument({ participant, type, date }: { participant: ParticipantInput; type: CertificateType; date: string }) {
  const achievement = type === "TOP_5" ? `Top 5 Winner · Rank #${participant.rank}` : "Participant";
  return <Document title={`${eventName} certificate - ${participant.fullName}`}>
    <Page size="A4" orientation="landscape" style={styles.page}>
      <View style={styles.border}>
        <Text style={styles.eyebrow}>{eventName.toUpperCase()}</Text>
        <Text style={styles.title}>Certificate of Achievement</Text>
        <Text style={styles.body}>This certificate is proudly presented to</Text>
        <Text style={styles.name}>{participant.fullName}</Text>
        <Text style={styles.body}>for skill, curiosity, and determination demonstrated during the Capture The Flag event.</Text>
        <Text style={styles.tier}>{achievement}</Text>
        <Text style={styles.date}>Issued {date}</Text>
      </View>
    </Page>
  </Document>;
}

export async function generateCertificatePdf(participant: ParticipantInput, type: CertificateType, date: string) {
  return renderToBuffer(<CertificateDocument participant={participant} type={type} date={date} />);
}
