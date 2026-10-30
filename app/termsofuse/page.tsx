import LegalPage from "@/components/LegalPage";

export default function TermsOfUsePage() {
  return <LegalPage title="TERMS OF USE" updated="August 25, 2026" sections={[
    { heading: "1. Acceptance of Terms", paragraphs: ["By using this website or purchasing a program, you agree to these Terms of Use."] },
    { heading: "2. Digital Programs", paragraphs: ["Programs are digital fitness materials that may include workout plans, video guidance, PDF materials, and educational content.", "The specific content, duration, features, price, and access conditions of each program are described on the applicable product or sales page."] },
    { heading: "3. Payment and Access", paragraphs: ["Full payment is required before access is granted. After successful payment, access is provided through your personal account.", "Prices and payment terms are displayed at the time of purchase. Access conditions may vary between programs and are specified on the applicable product page."] },
    { heading: "4. Refund Policy", paragraphs: ["Digital programs are not refundable after access has been granted, except where required by applicable law."] },
    { heading: "5. Intellectual Property", paragraphs: ["All program materials are for your personal use only. You may not copy, share, upload, distribute, resell, or reproduce them without written permission.", "Purchasing a program grants you a limited, personal, non-exclusive, non-transferable license to access and use the program materials for your own personal use."] },
    { heading: "6. User Responsibilities", paragraphs: ["You are responsible for maintaining the confidentiality of your account credentials and for using the programs safely and independently.", "Account Sharing", "Program access is intended for one individual user only. You may not share, transfer, sell, or provide your account credentials or program access to another person."] },
    { heading: "7. Limitation of Liability", paragraphs: ["We are not liable for technical issues, third-party service interruptions, or outcomes resulting from the use of the programs."] },
    { heading: "8. Suspension or Termination of Access", paragraphs: ["We reserve the right to suspend or terminate access to a program if a user materially violates these Terms, including by sharing, distributing, reselling, or reproducing program materials without authorization."] },
    { heading: "9. Program Updates and Changes", paragraphs: ["We may update or modify program materials from time to time to improve content, accuracy, functionality, or user experience, provided that such changes do not materially deprive users of the program they purchased."] },
    { heading: "10. Changes to These Terms", paragraphs: ["We may update these Terms from time to time. The current version and its “Last updated” date will always be available on this page."] },
    { heading: "11. Contact", paragraphs: ["For questions about these Terms of Use, contact byalinkinsupport@gmail.com."] },
  ]} />;
}
